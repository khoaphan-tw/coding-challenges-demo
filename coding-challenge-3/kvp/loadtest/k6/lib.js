// Shared helpers for the k6 scenarios. See loadtest/README.md.
import http from 'k6/http';

export const GATEWAY = __ENV.GATEWAY || 'http://gateway:8080';
// /internal/* is not routed by the gateway: fixtures are seeded straight into driver-service.
export const DRIVER_INTERNAL = __ENV.DRIVER_INTERNAL || 'http://driver-service:8080';

const JSON_HDR = { 'Content-Type': 'application/json' };
export const jsonParams = (name, extra = {}) => ({
  headers: { ...JSON_HDR, ...(extra.headers || {}) },
  tags: { name },
  ...(extra.opts || {}),
});

// Areas are 5.5 km apart (> the 2 km match radius), so areas never compete for drivers.
export function areaCenter(i) {
  return { latitude: 10.0 + (i % 20) * 0.05, longitude: 106.0 + Math.floor(i / 20) * 0.05 };
}

// A point up to `metres` away from `p` (uniform in a square, good enough for a load test).
export function near(p, metres) {
  const d = (Math.random() * 2 - 1) * metres;
  const e = (Math.random() * 2 - 1) * metres;
  return { latitude: p.latitude + d / 111195, longitude: p.longitude + e / 111195 };
}

export const driverId = (run, area, i) => `LT${run}-A${area}-${i}`;

// Seeds areas × perArea AVAILABLE drivers (fixture API) and returns the run id + ids.
export function seedDrivers(areas, perArea, runId) {
  const run = runId || Date.now().toString(36);
  const ids = [];
  const reqs = [];
  for (let a = 0; a < areas; a++) {
    for (let i = 0; i < perArea; i++) {
      const id = driverId(run, a, i);
      const p = near(areaCenter(a), 500);
      ids.push({ id, area: a });
      reqs.push(['PUT', `${DRIVER_INTERNAL}/internal/drivers/${id}`,
        JSON.stringify({ status: 'AVAILABLE', latitude: p.latitude, longitude: p.longitude }),
        { headers: JSON_HDR, tags: { name: 'seed' } }]);
    }
  }
  for (let i = 0; i < reqs.length; i += 50) {
    for (const r of http.batch(reqs.slice(i, i + 50))) {
      if (r.status !== 200) throw new Error(`seeding failed: ${r.status} ${r.body}`);
    }
  }
  return { run, drivers: ids };
}

// Staircase: ramp 10 s to each rate, then hold. RATES="100,500,1000" HOLD=60 (seconds).
export function staircase(rates, holdSeconds) {
  const stages = [];
  for (const r of rates) {
    stages.push({ target: r, duration: '10s' });
    stages.push({ target: r, duration: `${holdSeconds}s` });
  }
  return stages;
}

// Takes the seeded drivers OFFLINE again (teardown), so a later run in the same area starts from a clean slate.
export function offlineDrivers(data) {
  for (let i = 0; i < data.drivers.length; i += 50) {
    http.batch(data.drivers.slice(i, i + 50).map((d) =>
      ['PUT', `${DRIVER_INTERNAL}/internal/drivers/${d.id}`,
        JSON.stringify({ status: 'OFFLINE', ...areaCenter(d.area) }),
        { headers: JSON_HDR, tags: { name: 'teardown' } }]));
  }
}
