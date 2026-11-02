# Load Test Report — Bottlenecks and Scaling Plan

Test date: Not provided · System: ride-hailing dispatch (ride, driver, and dispatch services; Postgres; Redis; Redpanda) · Load tool: k6 2.3 with Grafana · Design reference: `scalability.md`

## Executive summary

The tests used a 1,000-driver topology with one instance of each service on a shared 4-vCPU VM. The first observed limit was the nginx gateway, which returned 502s around 1,000 requests/s while the backend services remained relatively idle. With the gateway bypassed, driver-location writes degraded above roughly 1,000 requests/s and saturated around 1,700–1,800 requests/s, with p95 latency reaching 4.5 seconds and the unpublished outbox backlog reaching 114,353 rows. A hot zone failed differently: reservation contention and lack of available drivers reduced journey completion even though HTTP errors were absent and CPU stayed below 40%.

**Recommended order:** fix the gateway; implement and measure the S1 location fast path before roughly 4,000 online drivers in this topology; add batch matching/area-owned dispatch for hot zones; improve observability; then repeat on dedicated infrastructure. These capacity figures are test-rig results, not production limits.

## Key findings

| Rank | Bottleneck | Observed break point | Evidence | Scaling response |
| --- | --- | --- | --- | --- |
| 1 | nginx gateway (new finding; not in the design doc) | About 1,000 req/s of location traffic; journey traffic also saw 502s around 640 req/s | 78,450 502 responses were listed in the status breakdown while driver-service CPU was about 22%; nginx reported insufficient worker connections | Enable upstream keepalive, raise `worker_connections` to at least 16,384, and run multiple gateway replicas behind a load balancer or Kubernetes ingress/Service. The temporary fix had zero errors at 1,000 req/s. |
| 2 | Driver location write path plus outbox relay and geo projector (B1 + B4) | Clean to about 1,000 req/s; saturation around 1,700–1,800 req/s | p95 rose from single-digit milliseconds to 935 ms and then about 4.5 s; outbox backlog peaked at 114,353 rows | Implement S1: stream locations over gRPC, publish to a compacted topic, and snapshot to Postgres every 30 seconds, avoiding a per-update driver UPDATE and outbox row. Not yet load-tested. |
| 3 | Hot-zone reservation contention (B3) | When offered load approached the capacity of one area's available drivers | With 8 drivers, conflicts per offer rose from 0% to 8%, 292%, and 555% at 4, 8, 12, and 18 rides/s; only 75.6% of journeys completed | Add batch matching per hot cell (S5) and/or area-owned dispatch (S2). More servers alone will not resolve contention over the same driver rows. |

Not reached in these tests: Redis GEO (B2), partition count (B5), and orchestrator database capacity (B6).

## Test setup and method

| Item | Setup |
| --- | --- |
| Environment | MacBook with Colima VM: 4 vCPU and 7.7 GB RAM. k6, gateway, services, Postgres 18, Redis 8, one-node Redpanda, and Grafana LGTM shared the VM. |
| Topology | One replica per service; one Postgres instance (three databases), one Redis, one Redpanda node, six partitions per topic, and nginx gateway. |
| Load model | k6 open model (`ramping-arrival-rate`): arrivals continue at the target rate while the system slows, exposing latency, errors, and dropped iterations. Each step used a 10-second ramp and a 30–45-second hold; steady-state figures use the hold period. |
| Metrics | k6 → OpenTelemetry → Prometheus; container CPU sampled with `docker stats` once per second. Dashboard: “Load test (k6)”. |
| Scenarios | `location`: PUT driver location for a random driver from a 1,000-driver pool. `dispatch`: create ride, poll until assigned, accept, and complete across 50 areas. `hotzone`: same journey concentrated in one area with a small driver pool. |

At one location update every four seconds, 1,000 drivers imply 250 req/s. Thus, 1,000 req/s represents roughly 4,000 online drivers and 4,000 req/s roughly 16,000 drivers under this load model.

## Results

### 1. Gateway: first limit observed

![grafana-location-gateway.png](Load%20Test%20Report%20%E2%80%94%20Bottlenecks%20and%20Scaling%20Plan/grafana-location-gateway.png)

The original nginx configuration proxied through variables without upstream keepalive, opening a new TCP connection to the service for each request, and used the default 1,024 worker connections. At the 1,000 req/s step, backend services were relatively idle while nginx CPU averaged 113% and peaked at 251%. The supplied run notes report 78,450 502 responses and describe the gateway's `worker_connections are not enough` warning.

A temporary configuration used upstream keepalive (256), `proxy_set_header Connection ""`, and `worker_connections 16384`. It produced zero errors and no warnings at 1,000 req/s; p95 latency at that step was 473 ms, and the next observed limit became the driver write path. This fix was experimental and was not committed. Static upstream blocks resolve service names only at startup, so they lose the current configuration's re-resolution behavior after container recreation; Kubernetes Service/ingress provides service discovery at that layer.

### 2. Driver location writes: write amplification and backlog

![grafana-location-direct.png](Load%20Test%20Report%20%E2%80%94%20Bottlenecks%20and%20Scaling%20Plan/grafana-location-direct.png)

With k6 calling driver-service directly, p95 latency stayed at or below about 9 ms through roughly 1,000 req/s, then rose sharply as throughput flattened near 1,800 req/s and fell at higher targets. At the highest reported step, p95 reached about 4.5 seconds and the unpublished outbox backlog reached 114,353 rows. Server-side p95 tracked client-side p95, indicating time was spent within driver-service and its database path.

Each location update currently causes a driver-row UPDATE, an outbox INSERT, a later outbox publication UPDATE, and a broker message consumed to update Redis. The relay backlog drained after load stopped, so the reported issue was delay rather than data loss. Raising the driver-service database pool from 4 to 24 connections did not improve throughput: the 2,000 req/s target achieved 1,233 req/s with the larger pool versus 1,721 req/s with four connections. The shared VM was near saturation, so this experiment could not isolate Postgres capacity.

The design's estimate of roughly 50–100k drivers for the S1 trigger was not reproduced on this topology. Treat roughly 4,000 online drivers as the observed healthy range here—not as a universal threshold—and re-measure on dedicated hosts before changing the trigger.

### 3. Dispatch and hot-zone behavior

![grafana-dispatch.png](Load%20Test%20Report%20%E2%80%94%20Bottlenecks%20and%20Scaling%20Plan/grafana-dispatch.png)

Normal dispatch completed at 40 rides/s with zero HTTP errors and about 9 ms HTTP p95 in the reported healthy step. At 80 rides/s, the gateway became the first limit: the journey generated about 640 HTTP req/s and saw gateway 502s. The dispatch run's area supply was above the nominal 20 drivers in some areas because seeded areas overlapped with location-test cells, so its saga results are optimistic. The saga's maximum capacity with a fixed gateway remains unmeasured.

![grafana-hotzone.png](Load%20Test%20Report%20%E2%80%94%20Bottlenecks%20and%20Scaling%20Plan/grafana-hotzone.png)

In the hot-zone scenario, all rides competed for eight drivers. Journey success was 75.6% (1,523 of 2,014); 487 rides found no driver within 10 seconds. Overall time-to-assign p95 was 7.8 seconds, while HTTP p95 was 253 ms and HTTP error rate was approximately zero. Container CPU remained below 40%. This is a business-level contention failure, not a general compute-capacity failure. At the 12 rides/s target, conflicts per offer had crossed 292%; at 18 rides/s they reached 555%. Polling by rides without a driver also amplified read traffic.

The source notes flag a conflict-ratio threshold above 20% for batch matching, crossed between 8 and 12 rides/s in this test. Prefer an earlier alert on offered rides per available driver in an area, with conflict ratio, time-to-assign, and journey success as supporting signals.

## Recommended actions

| Priority | Action | Expected effect / status |
| --- | --- | --- |
| 1 | Gateway: enable upstream keepalive, set `worker_connections` ≥16k, and use 2+ replicas behind a load balancer (or Kubernetes ingress/Service). | Removes the observed 502 wall. Temporary experiment: zero errors at 1,000 req/s. |
| 2 | Build S1 location fast path: use the existing gRPC `StreamLocations`, publish to a compacted topic, and snapshot to Postgres every 30 seconds; avoid a per-update UPDATE and outbox row. | Reduces write amplification and relay load. Design proposal; not yet measured. |
| 3 | Do not treat a larger DB pool as the location-load fix. | Pool change from 4 to 24 connections showed no gain in the shared-VM test. |
| 4 | For hot zones, add S5 batch matching (about a 200 ms window) and/or S2 area-owned dispatch; until then cap offers per driver and back off retries. | Reduces repeated reservation conflicts. Design proposal; not yet measured. |
| 5 | Alert on conflict ratio (>20% for 2 minutes), time-to-assign p95 (>2 seconds), journey success (<99%), and `outbox_unpublished` (>1,000); add offered rides per available driver per area. | Detects contention and write backlog that HTTP metrics can hide. |
| 6 | Fix `dispatch_match_duration_seconds` histogram buckets (about 5 ms–10 s); add Postgres, Redis, Redpanda, cAdvisor, and pgxpool metrics. | Makes match latency, CPU, locks, pool wait, and consumer lag observable. |
| 7 | Repeat with dedicated hosts for k6, services, Postgres, Redis, and Redpanda; run multiple repetitions. | Establishes real capacity and variance; re-set the S1 trigger from measured results. |
| 8 | Measure later limits: 3+ stateless replicas (S3), more partitions (B5), read replicas and CDC (S4). | These remain design-only; no test reached them. |

## Limitations and validation notes

- The load generator, system, and observability stack shared a 4-vCPU VM. Absolute numbers are therefore a floor; the observed order of failure is more useful than the raw capacity figures.
- There was one run per scenario. Knee positions are ranges, not precise thresholds. k6 VU limits and Prometheus percentiles are estimates; exact overall percentiles are in each run's `k6.log`.
- The gateway fix and database-pool change were temporary experiments, not committed repository changes. The gRPC S1 transport was not load-tested; only the REST location path was.
- The supplied gateway notes contain inconsistent aggregate counts: one summary says 68,541 failed requests, while the status breakdown lists 78,450 HTTP 502s, 3,295 timeouts, and 224 HTTP 500s. Reconcile against the original k6 output before treating a single total failure count as final.
- The dispatch scenario's overlapping seeded areas increased driver supply above the nominal 20 in some areas; its saga results are optimistic.

## Reproduction

```bash
make up
make load-smoke        # 10 s check
make load-location     # F1/F2: via gateway
./loadtest/run.sh location GATEWAY=http://driver-service:8080 RATES=500,1000,2000,3000,4000 HOLD=30   # F2: bypass gateway
make load-dispatch     # F5
./loadtest/run.sh hotzone PER_AREA=8 RATES=4,8,12,18 HOLD=40   # F4
python3 loadtest/analyze.py loadtest/results/<run> --rates … --hold …   # per-step table + CPU
# Grafana http://localhost:3000 → Dashboards → “Load test (k6)” → select the run
```