# Load Test Report: Bottlenecks and How to Scale

Date: 2026-11-02 · System: ride-hailing dispatch (ride / driver / dispatch services, Postgres, Redis, Redpanda) · Tool: k6 → Grafana · Scripts: [loadtest/](../loadtest/README.md) · Design under test: [scalability.md](scalability.md)

We load-tested the **1,000-driver topology** (one instance of everything) to find which component breaks first, and compared it with the bottlenecks predicted in [scalability.md §4](scalability.md#4-bottlenecks).

## 1. Test setup

* **Environment:** one MacBook, Colima VM with 4 vCPU / 7.7 GB. k6, gateway, 3 services, Postgres, Redis, Redpanda and Grafana all share it, so absolute numbers are a floor; the **order in which components fail** is the result.
* **Load model:** open model (`ramping-arrival-rate`), staircase of steps (10 s ramp, 30–45 s hold). Requests keep arriving when the system is slow, so overload shows up as latency, errors and dropped iterations.
* **Reference load:** 1,000 drivers × one update per 4 s = **250 req/s** ([scalability §1](scalability.md#1-load-model)), so 1,000 req/s ≈ 4,000 online drivers.

| Scenario | What one iteration does | Tests |
|---|---|---|
| **location** | `PUT /drivers/{id}/location` for a random driver of a 1,000-driver pool | B1, B4, B5 |
| **dispatch** | `POST /rides` → poll until `DRIVER_ASSIGNED` → accept → complete, spread over 50 areas (~8 requests per ride) | B3, B6, saga throughput |
| **hotzone** | same journey, all rides in **one** area with 8 drivers | B3 |

## 2. Results and bottlenecks

### F1: the nginx gateway breaks first, at ~1,000 req/s

Location writes through the gateway, steady state per step:

| Target req/s | Achieved | p95 ms | Errors | driver-service CPU | gateway CPU (avg) |
|---:|---:|---:|---:|---:|---:|
| 250 | 253 | 5 | 0 | 17 % | 6 % |
| 500 | 472 | 19 | 0 | 30 % | 24 % |
| 1,000 | 1,009 | 124 * | **22,375** | 22 % | **113 %** |
| 2,000 | 758 | 5,715 | 13,432 | 37 % | 126 % |
| 4,000 | 992 | 6,804 | 25,652 | 25 % | 153 % |

\* flattered by 502s that fail in 0 ms.

![Grafana: location via gateway](img/load-test/grafana-location-gateway.png)

78,450 of 195,551 requests got `502` while the services were idle. [deploy/nginx.conf](../deploy/nginx.conf) opens a new TCP connection per request (no upstream keepalive) with the default 1,024 worker connections; nginx logs `worker_connections are not enough`. The same 502s hit the dispatch run at ~640 req/s.

**Verified fix (experiment, not committed):** upstream `keepalive 256` + `worker_connections 16384` gave 0 errors at 1,000 req/s. Trade-off: static upstreams resolve names once at startup.

### F2 + F3: driver location writes degrade above ~1,000 req/s

k6 pointed directly at `driver-service` (gateway bypassed):

| Target req/s | Achieved | p95 ms | Errors | Outbox backlog (max) |
|---:|---:|---:|---:|---:|
| 500 | 511 | 5 | 0 | 18 |
| 1,000 | 1,025 | 9 | 0 | 32 |
| 2,000 | 1,721 | 935 | 0 | 1,764 |
| 3,000 | 1,603 | 4,263 | 0 | 58,001 |
| 4,000 | 1,373 | 4,538 | 0 | 114,353 |

![Grafana: location direct to driver-service](img/load-test/grafana-location-direct.png)

* **Knee between 1,000 and 2,000 req/s:** throughput peaks at ~1.8k req/s and then falls, the signature of saturation. Server p95 ≈ client p95, so the time is spent inside driver-service and its database.
* **Write amplification (B1/B4):** each update costs one `UPDATE drivers`, one `INSERT outbox`, one `UPDATE outbox`, plus a broker message the geo consumer applies to Redis. The outbox backlog reaches 114k rows; it drains after the load stops, with no data loss.
* **F3:** a bigger DB pool (4 → 24) did **not** help (1,233 vs 1,721 req/s); the shared VM was ~95 % busy. On this rig we cannot separate Postgres from the rest.

Capacity: location updates stay healthy to **~1,000 req/s ≈ 4,000 drivers**. The ~50k-driver trigger in the design doc is optimistic for this topology; re-measure on a dedicated database.

### F5: the ride saga is healthy up to 40 rides/s

| Rides/s target | Requests/s | HTTP p95 ms | Errors | Notes |
|---:|---:|---:|---:|---|
| 5 | 21 | 7 | 0 | |
| 10 | 42 | 9 | 0 | |
| 20 | 83 | 7 | 0 | |
| 40 | 180 | 9 | 0 | healthy |
| 80 | 643 | 2,182 | 3,416 | 502s from the gateway (F1); 98.3 % of journeys ok |

![Grafana: dispatch](img/load-test/grafana-dispatch.png)

The saga, outbox, Redis match and reservations handled 40 rides/s with 0 errors (~a quarter of the 1M-driver steady target, on one instance of everything). At 80 rides/s the gateway fails first. The saga limit with a fixed gateway is not yet measured.

### F4: hot zone, contention not capacity (B3)

8 drivers in one area, journey ≈ 0.75 s, so capacity ≈ 10 rides/s.

| Rides/s target | Requests/s | HTTP p95 ms | Conflicts / offers |
|---:|---:|---:|---:|
| 4 | 17 | 7 | 0 % |
| 8 | 35 | 9 | 8 % |
| 12 | 217 | 7 | **292 %** |
| 18 | 545 | 221 | **555 %** |

![Grafana: hot zone](img/load-test/grafana-hotzone.png)

* Only **75.6 %** of journeys complete; 487 of 2,014 rides found no driver in 10 s. HTTP error rate ≈ 0 %.
* **CPU stayed below 40 % in every container.** More servers would not help: rides fight over the same few driver rows. Unserved rides keep polling, which multiplies read traffic (the jump from 35 to 217 req/s).
* The failure is **invisible in HTTP latency and errors**; only business metrics (conflict ratio, time to assign, journey success) show it.

### F6: observability gaps

`dispatch_match_duration_seconds` p95 reads 4.75 s at every load (bad histogram buckets), and Grafana has no CPU, Postgres, Redis or broker metrics.

## 3. Bottleneck ranking

| Rank | Component | Breaks at | Symptom | Design doc |
|---:|---|---|---|---|
| 1 | nginx gateway | ~1,000 req/s of location traffic, or ~640 req/s of journeys (~80 rides/s) | `502`, services idle | **New** |
| 2 | driver-service location write path (+ outbox + geo projector) | ~1,000 req/s clean, ~1,700 max | outbox backlog, seconds of latency | B1, B4 |
| 3 | Hot-zone reservation contention | offered load ≈ driver capacity of one area | conflicts ≫ offers, rides without a driver | B3 |
| – | Not reached: Redis GEO (B2), partitions (B5), orchestrator DB (B6) | | Redis CPU ≤ 16 %, Redpanda ≤ 27 % | untested at this scale |

## 4. How to scale

| # | Action | Fixes | Measured? |
|---:|---|---|---|
| 1 | **Gateway:** upstream `keepalive`, `worker_connections` ≥ 16k, 2+ replicas behind an LB (ingress in Kubernetes) | F1 | **Yes**, 0 errors at 1,000 req/s |
| 2 | **S1 location fast path:** gRPC `StreamLocations`, compacted topic, Postgres snapshot every 30 s; no `UPDATE` and no outbox row per update | F2 | No (design) |
| 3 | **Hot zones:** batch matching per hot cell (S5) and/or area-owned dispatch (S2); until then cap offers per driver and back off retries | F4 | No (design) |
| 4 | **Alert on business metrics:** conflict ratio > 20 %, time to assign p95 > 2 s, journey success < 99 %, `outbox_unpublished` > 1,000, offered rides per available driver per area | F4, F2 | **Yes** |
| 5 | **Fix the metrics:** histogram buckets, postgres/redis exporters, Redpanda `/metrics`, cAdvisor | F6 | n/a |
| 6 | **Re-run on dedicated infrastructure**, then re-set the S1 trigger | all | n/a |
| 7 | Do **not** raise the DB pool as a fix for location load | F3 | **Yes**, no gain |

## 5. Limits

* Single run per scenario, no variance measured; knee positions are ranges.
* One instance of each service; replicas, extra Redpanda nodes and sharding are design only.
* The gateway fix and pool change used temporary config and are **not** in the repository. gRPC `StreamLocations` was not load-tested.

## 6. Reproduce

```bash
make up
make load-location     # F1: via gateway
./loadtest/run.sh location GATEWAY=http://driver-service:8080 RATES=500,1000,2000,3000,4000 HOLD=30   # F2: bypass gateway
make load-dispatch     # F5
./loadtest/run.sh hotzone PER_AREA=8 RATES=4,8,12,18 HOLD=40   # F4
# Grafana http://localhost:3000 → Dashboards → "Load test (k6)"
```
