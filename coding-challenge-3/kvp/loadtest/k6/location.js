// Scenario L: driver location ingestion (bottleneck B1, scalability.md §4).
// Open model: requests arrive at a fixed rate regardless of how slow the system is, so a slow system
// shows up as latency and dropped_iterations instead of the test politely slowing down.
//
//   RATES   req/s steps          default 250,500,1000,2000,4000   (250/s = 1,000 drivers every 4 s)
//   HOLD    seconds per step     default 60
//   DRIVERS pool size            default 1000
//   SMOKE=1 5 req/s for 10 s, to check the script
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { jsonParams, seedDrivers, offlineDrivers, areaCenter, near, GATEWAY, staircase } from './lib.js';

const SMOKE = !!__ENV.SMOKE;
const rates = (__ENV.RATES || '250,500,1000,2000,4000').split(',').map(Number);
const hold = Number(__ENV.HOLD || 60);
const AREAS = 20;
export const locationUpdates = new Counter('location_updates');

export const options = {
  scenarios: {
    location: SMOKE
      ? { executor: 'constant-arrival-rate', rate: 5, timeUnit: '1s', duration: '10s', preAllocatedVUs: 10, maxVUs: 20 }
      : {
          executor: 'ramping-arrival-rate', startRate: 10, timeUnit: '1s',
          stages: staircase(rates, hold), preAllocatedVUs: 200, maxVUs: 3000,
        },
  },
  thresholds: {
    // Not abort-on-fail: we want to see where it breaks, not stop at the first miss.
    'http_req_failed{scenario:location}': ['rate<0.01'],
    'http_req_duration{scenario:location}': ['p(95)<200', 'p(99)<500'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  return seedDrivers(AREAS, Number(__ENV.DRIVERS || 1000) / AREAS, __ENV.RUN_ID);
}

export function teardown(data) {
  offlineDrivers(data);
}

export default function (data) {
  const d = data.drivers[Math.floor(Math.random() * data.drivers.length)];
  const p = near(areaCenter(d.area), 500);
  const res = http.put(`${GATEWAY}/drivers/${d.id}/location`, JSON.stringify(p),
    jsonParams('PUT /drivers/:id/location'));
  locationUpdates.add(1);
  check(res, { 'location 200': (r) => r.status === 200 });
}
