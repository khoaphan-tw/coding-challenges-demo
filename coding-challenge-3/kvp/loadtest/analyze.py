#!/usr/bin/env python3
"""Per-step report for a staircase run (location / dispatch / hotzone).

  python3 loadtest/analyze.py loadtest/results/<run> --rates 250,500,1000,2000,4000 --hold 45

For every step's steady-state window (the HOLD part, not the 10 s ramp) it prints, as a Markdown table:
  target vs achieved req/s, latency p50/p95/p99 and errors (from k6 metrics in Prometheus, the same
  numbers Grafana shows), plus server-side signals (outbox backlog, match p95, reservation conflicts)
  and the CPU of each container (from stats.csv sampled during the run).
Needs the stack running (queries Grafana's Prometheus proxy on :3000).
"""
import argparse, csv, json, os, sys, urllib.parse, urllib.request

GRAFANA = os.environ.get("GRAFANA", "http://localhost:3000")


def prom(query, t):
    url = f"{GRAFANA}/api/datasources/proxy/uid/prometheus/api/v1/query?" + urllib.parse.urlencode({"query": query, "time": t})
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)["data"]["result"]


def scalar(query, t):
    res = prom(query, t)
    return float(res[0]["value"][1]) if res else float("nan")


def range_first_active(testid, t_from, t_to):
    q = urllib.parse.urlencode({"query": f'sum(k6_http_reqs_total{{testid="{testid}",name!="seed"}})', "start": t_from, "end": t_to, "step": 1})
    url = f"{GRAFANA}/api/datasources/proxy/uid/prometheus/api/v1/query_range?{q}"
    with urllib.request.urlopen(url, timeout=30) as r:
        res = json.load(r)["data"]["result"]
    for ts, v in (res[0]["values"] if res else []):
        if float(v) > 0:
            return float(ts)
    sys.exit("no k6 traffic found in Prometheus for this run (stack restarted or wrong run dir?)")


def load_stats(path):
    rows = {}
    with open(path) as f:
        for r in csv.reader(f):
            if len(r) < 3:
                continue
            try:
                t = int(r[0]); cpu = float(r[2].rstrip("%"))
            except ValueError:
                continue
            rows.setdefault(r[1].replace("ridehail-", "").rsplit("-", 1)[0], []).append((t, cpu))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("--rates", required=True)
    ap.add_argument("--hold", type=int, default=60)
    a = ap.parse_args()
    testid = os.path.basename(a.run_dir.rstrip("/"))
    env = dict(l.strip().split("=", 1) for l in open(os.path.join(a.run_dir, "run.env")) if "=" in l)
    import calendar, time
    parse = lambda s: calendar.timegm(time.strptime(s, "%Y-%m-%dT%H:%M:%SZ"))
    t_start, t_end = parse(env["start"]), parse(env["end"])
    t0 = range_first_active(testid, t_start, t_end + 5)  # end of setup() = first real request
    stats = load_stats(os.path.join(a.run_dir, "stats.csv"))
    rates = [int(x) for x in a.rates.split(",")]
    sel = f'testid="{testid}",name!="seed"'
    H = a.hold

    print(f"Run `{testid}`: {len(rates)} steps, {H} s hold each (10 s ramp excluded)\n")
    print("| Target /s | Achieved /s | p50 ms | p95 ms | p99 ms | Errors | Max VUs | Outbox backlog max | Match p95 s | Conflicts/offers |")
    print("|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    windows = []
    for i, r in enumerate(rates):
        w_start = t0 + i * (10 + H) + 10
        w_end = w_start + H
        windows.append((r, w_start, w_end))
        inc = f"[{H}s]"
        achieved = scalar(f'sum(increase(k6_http_reqs_total{{{sel}}}{inc}))', w_end) / H
        qs = [scalar(f'histogram_quantile({p}, sum by (le) (increase(k6_http_req_duration_milliseconds_bucket{{{sel}}}{inc})))', w_end) for p in (0.5, 0.95, 0.99)]
        errs = scalar(f'sum(increase(k6_http_reqs_total{{{sel},status!~"2.."}}{inc})) or vector(0)', w_end)
        vus = scalar(f'max_over_time(sum(k6_vus{{testid="{testid}"}})[{H}s:1s])', w_end)
        outbox = scalar(f'max_over_time(sum(outbox_unpublished)[{H}s:1s])', w_end)
        match = scalar(f'histogram_quantile(0.95, sum by (le) (increase(dispatch_match_duration_seconds_bucket{inc})))', w_end)
        conf = scalar(f'sum(increase(driver_reservation_conflicts_total{inc})) or vector(0)', w_end)
        offers = scalar(f'sum(increase(offers_total{inc}))', w_end)
        ratio = (conf / offers) if offers == offers and offers > 0 else float("nan")
        f = lambda x, p=0: "–" if x != x else f"{x:.{p}f}"
        print(f"| {r} | {f(achieved)} | {f(qs[0])} | {f(qs[1])} | {f(qs[2])} | {f(errs)} | {f(vus)} | {f(outbox)} | {f(match, 2)} | "
              f"{'–' if ratio != ratio else f'{ratio*100:.0f}%'} |")

    print("\nContainer CPU % (avg / peak per step; 100 % = one core, the VM has 4)\n")
    names = sorted(stats)
    print("| Target /s | " + " | ".join(names) + " |")
    print("|---:|" + "---:|" * len(names))
    for r, s, e in windows:
        cells = []
        for n in names:
            v = [c for t, c in stats[n] if s <= t < e]
            cells.append(f"{sum(v)/len(v):.0f} / {max(v):.0f}" if v else "–")
        print(f"| {r} | " + " | ".join(cells) + " |")


if __name__ == "__main__":
    main()
