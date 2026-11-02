# Load tests (k6)

Finds the first bottleneck of the system and shows it in Grafana. Background and hypotheses: [docs/scalability.md](../docs/scalability.md). Results and conclusions: [docs/load-test-report.md](../docs/load-test-report.md).

## Run

```bash
make up                      # the stack must be running (needs Docker only: k6 runs from its Docker image)
make load-smoke              # 10-second check that the scripts work

make load-location           # B1: PUT /drivers/{id}/location, staircase 250 → 4000 req/s
make load-dispatch           # B3-B6: full ride journey, staircase 5 → 80 rides/s
make load-hotzone            # B3: all rides in ONE area with 40 drivers
```

Change the shape with variables: `./loadtest/run.sh location RATES=500,1000 HOLD=30 DRIVERS=5000`.

| Scenario | Script | What one iteration does | Variables (default) |
|---|---|---|---|
| `location` | [k6/location.js](k6/location.js) | one `PUT /drivers/{id}/location` | `RATES` (250,500,1000,2000,4000) req/s, `HOLD` (60) s per step, `DRIVERS` (1000) |
| `dispatch` | [k6/dispatch.js](k6/dispatch.js) | `POST /rides` → poll `GET /rides/{id}` until `DRIVER_ASSIGNED` → accept → complete | `RATES` (5,10,20,40,80) rides/s, `HOLD`, `AREAS` (50), `PER_AREA` (20), `TRIP_MS` (500) |
| `hotzone` | same script | same, with `AREAS=1 PER_AREA=40` | `RATES`, `HOLD` |

All scenarios use the **open model** (`ramping-arrival-rate`): k6 keeps starting requests at the target rate even when the system slows down, so saturation appears as growing latency, errors and `dropped_iterations`, not as a polite slowdown. Each step ramps for 10 s, then holds, and the thresholds do not abort the run: we want to see where it breaks.

## Where the results are

| What | Where |
|---|---|
| Live graphs | Grafana http://localhost:3000 → **Load test (k6)** (pick the run in *test run*). It shows k6 traffic next to the service metrics (server latency, outbox backlog, match latency, conflicts, DLQ). The runner prints the link |
| Per-step table | `python3 loadtest/analyze.py loadtest/results/<run> --rates … --hold …` prints achieved req/s, p50/p95/p99, errors, backlog and **CPU per container** for each step |
| Raw | `loadtest/results/<run>/`: `summary.json` (k6), `k6.log`, `stats.csv` (`docker stats` every second), `run.env` |

How it is wired: `run.sh` runs `grafana/k6` on the compose network with `-o opentelemetry` pointed at the `lgtm` container, the same OTLP endpoint the services use, so k6 metrics (`k6_http_reqs_total`, `k6_http_req_duration_milliseconds_bucket`, `k6_vus`, …) land in the same Prometheus as the service metrics, tagged `testid=<run>`. The dashboard is [deploy/grafana/loadtest.json](../deploy/grafana/loadtest.json).

## Limits of this setup (read before trusting a number)

* **Everything shares one laptop VM** (4 CPUs): k6, gateway, three services, Postgres, Redis, Redpanda and the observability stack compete for the same cores. Absolute numbers are a **floor**, and the useful result is the **order in which components saturate**, not the req/s value.
* Single instance per service, one Postgres, one Redis, one Redpanda node: this is the "1k drivers" topology.
* The Go services export no process or container CPU metrics, so CPU comes from `docker stats` (`stats.csv`), not from Grafana.
* k6 histograms use the exporter's fixed buckets, so percentiles from Prometheus are bucket-resolution estimates. The exact overall percentiles are in `summary.json` / `k6.log`.
