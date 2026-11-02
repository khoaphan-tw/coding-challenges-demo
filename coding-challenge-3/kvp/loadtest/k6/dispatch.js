// Scenario D: the full ride journey through the saga (bottlenecks B3, B4, B5, B6).
//   POST /rides → wait for DRIVER_ASSIGNED → accept → complete
// Journeys spread over AREAS areas with PER_AREA drivers each. AREAS=1 is a HOT ZONE (airport):
// every ride competes for the same few drivers, which is where reservation conflicts appear.
//
//   RATES     rides/s steps         default 5,10,20,40,80
//   HOLD      seconds per step      default 60
//   AREAS     default 50   (use 1 for the hot-zone run)
//   PER_AREA  drivers per area      default 20   (hot zone: 40)
//   TRIP_MS   simulated trip time between accept and complete, default 500
//   SMOKE=1   1 ride/s for 15 s
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { jsonParams, seedDrivers, offlineDrivers, areaCenter, near, GATEWAY, staircase } from './lib.js';

const SMOKE = !!__ENV.SMOKE;
const rates = (__ENV.RATES || '5,10,20,40,80').split(',').map(Number);
const hold = Number(__ENV.HOLD || 60);
const AREAS = Number(__ENV.AREAS || 50);
const PER_AREA = Number(__ENV.PER_AREA || 20);
const TRIP_MS = Number(__ENV.TRIP_MS || 500);

const timeToAssign = new Trend('ride_time_to_assign_ms', true);   // POST /rides → DRIVER_ASSIGNED
const journeyTime = new Trend('ride_journey_ms', true);            // POST /rides → COMPLETED
const journeyOk = new Rate('ride_journey_ok');
const noDriver = new Counter('ride_no_driver_in_time');

export const options = {
  scenarios: {
    rides: SMOKE
      ? { executor: 'constant-arrival-rate', rate: 1, timeUnit: '1s', duration: '15s', preAllocatedVUs: 20, maxVUs: 50 }
      : {
          executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '1s',
          stages: staircase(rates, hold), preAllocatedVUs: 200, maxVUs: 3000,
        },
  },
  thresholds: {
    'http_req_failed{name:POST /rides}': ['rate<0.01'],
    'http_req_duration{name:POST /rides}': ['p(95)<300'],
    ride_time_to_assign_ms: ['p(95)<2000'],
    ride_journey_ok: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  return seedDrivers(AREAS, PER_AREA, __ENV.RUN_ID);
}

export function teardown(data) {
  offlineDrivers(data);
}

export default function (data) {
  const area = Math.floor(Math.random() * AREAS);
  const center = areaCenter(area);
  const start = Date.now();
  const key = `lt-${data.run}-${__VU}-${__ITER}`;

  const created = http.post(`${GATEWAY}/rides`, JSON.stringify({
    passengerId: `P${String(1 + Math.floor(Math.random() * 10)).padStart(3, '0')}`,
    pickup: near(center, 300), destination: near(center, 4000),
  }), jsonParams('POST /rides', { headers: { 'Idempotency-Key': key } }));
  if (!check(created, { 'ride created 201': (r) => r.status === 201 })) { journeyOk.add(false); return; }
  const rideId = created.json('rideId');

  // The passenger/driver apps poll; 200 ms × 50 = up to 10 s for a driver.
  let ride = null;
  for (let i = 0; i < 50; i++) {
    sleep(0.2);
    const r = http.get(`${GATEWAY}/rides/${rideId}`, jsonParams('GET /rides/:id'));
    if (r.status === 200 && r.json('status') === 'DRIVER_ASSIGNED') { ride = r.json(); break; }
  }
  if (!ride) {
    noDriver.add(1); journeyOk.add(false);
    http.post(`${GATEWAY}/rides/${rideId}/cancel`, null, jsonParams('POST /rides/:id/cancel'));
    return;
  }
  timeToAssign.add(Date.now() - start);

  const drv = ride.assignedDriverId;
  const acc = http.post(`${GATEWAY}/rides/${rideId}/offers/${drv}/accept`, null,
    jsonParams('POST /rides/:id/offers/:driver/accept'));
  let ok = check(acc, { 'accept 200': (r) => r.status === 200 });
  sleep(TRIP_MS / 1000);
  if (ok) {
    // The ride turns DRIVER_ACCEPTED asynchronously (a few ms); retry complete briefly on 409.
    let done;
    for (let i = 0; i < 10; i++) {
      done = http.post(`${GATEWAY}/rides/${rideId}/complete`, null, jsonParams('POST /rides/:id/complete'));
      if (done.status === 200) break;
      sleep(0.1);
    }
    ok = check(done, { 'complete 200': (r) => r.status === 200 });
  }
  journeyOk.add(ok);
  if (ok) journeyTime.add(Date.now() - start);
}
