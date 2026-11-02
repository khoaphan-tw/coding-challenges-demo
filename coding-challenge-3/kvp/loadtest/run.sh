#!/usr/bin/env bash
# Run a k6 scenario against the running stack (`make up`) and record everything for the report.
#   ./loadtest/run.sh <location|dispatch|hotzone> [K=V ...]      e.g. ./loadtest/run.sh location RATES=250,500 HOLD=30
#
# - k6 runs in Docker on the compose network (no local install), talking to the gateway.
# - k6 metrics go to Grafana through OpenTelemetry (-o opentelemetry → lgtm:4317), tagged testid=<run name>.
# - docker stats of every container is sampled every 2 s into stats.csv (CPU/memory per component).
# - output: loadtest/results/<run name>/{summary.json,k6.log,stats.csv,run.env}
set -euo pipefail
cd "$(dirname "$0")/.."
SCEN=${1:?usage: run.sh <location|dispatch|hotzone> [K=V ...]}; shift || true
case "$SCEN" in
  location) SCRIPT=location.js; EXTRA=() ;;
  dispatch) SCRIPT=dispatch.js; EXTRA=() ;;
  hotzone)  SCRIPT=dispatch.js; EXTRA=(-e AREAS=1 -e PER_AREA=40) ;;   # one area: every ride competes for the same drivers
  *) echo "unknown scenario $SCEN" >&2; exit 2 ;;
esac
NET=${NET:-ridehail_default}
NAME="$(date +%Y%m%d-%H%M%S)-$SCEN${TAG:+-$TAG}"
OUT="loadtest/results/$NAME"; mkdir -p "$OUT"
for kv in "$@"; do EXTRA+=(-e "$kv"); done
printf '%s\n' "scenario=$SCEN" "args=$*" "start=$(date -u +%FT%TZ)" > "$OUT/run.env"

# Per-container CPU/memory sampler (the "which component saturates first" evidence).
( while true; do
    docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}}' | sed "s/^/$(date +%s),/"
    sleep 1
  done ) > "$OUT/stats.csv" 2>/dev/null &
SAMPLER=$!
trap 'kill $SAMPLER 2>/dev/null || true' EXIT

echo "▶ $NAME  (Grafana: http://localhost:3000/d/ridehail-loadtest?var-testid=$NAME)"
set +e
docker run --rm --network "$NET" -v "$PWD/loadtest/k6:/k6:ro" -v "$PWD/$OUT:/out" \
  -e K6_OTEL_GRPC_EXPORTER_ENDPOINT=lgtm:4317 -e K6_OTEL_GRPC_EXPORTER_INSECURE=true \
  -e K6_OTEL_METRIC_PREFIX=k6_ -e K6_OTEL_FLUSH_INTERVAL=1s -e K6_OTEL_EXPORT_INTERVAL=5s \
  grafana/k6:latest run -o opentelemetry --tag "testid=$NAME" \
  --summary-export /out/summary.json "${EXTRA[@]}" "/k6/$SCRIPT" 2>&1 | tee "$OUT/k6.log"
RC=${PIPESTATUS[0]}
set -e
printf 'end=%s\nk6_exit=%s\n' "$(date -u +%FT%TZ)" "$RC" >> "$OUT/run.env"
echo "■ results in $OUT (k6 exit $RC: 99 = a threshold failed, which is a finding, not an error)"
