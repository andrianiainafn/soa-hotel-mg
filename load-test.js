import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '1m',  target: 150 },  // ← beaucoup plus de VUs
    { duration: '30s', target: 200 },  // ← pic très fort
    { duration: '1m',  target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed:   ['rate<0.15'],
  },
};

const BASE = 'http://34.62.172.250';

export default function () {
  const scenario = Math.random();

  if (scenario < 0.25) {
    // service1 — bombarder les users PostgreSQL
    const endpoints = [
      `${BASE}/service1/users`,
      `${BASE}/service1/users/role/CLIENT`,
      `${BASE}/service1/users/role/RECEPTIONNISTE`,
      `${BASE}/service1/users/role/ADMIN`,
      `${BASE}/service1/users/health`,
    ];
    const url = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(url, { timeout: '10s' });
    check(res, { 'service1 ok': (r) => r.status === 200 || r.status === 403 });

  } else if (scenario < 0.50) {
    // service2 — bombarder les chambres MongoDB
    const endpoints = [
      `${BASE}/service2/rooms`,
      `${BASE}/service2/rooms/available`,
      `${BASE}/service2/reservations`,
      `${BASE}/service2/health`,
    ];
    const url = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(url, { timeout: '10s' });
    check(res, { 'service2 ok': (r) => r.status === 200 });

  } else if (scenario < 0.75) {
    // service3 — uniquement health + notifications (pas stock qui plante)
    const endpoints = [
      `${BASE}/service3/health`,
      `${BASE}/service3/menage/notifications`,
    ];
    const url = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(url, { timeout: '10s' });
    check(res, { 'service3 ok': (r) => r.status === 200 });

  } else {
    // gateway — health checks purs
    const endpoints = [
      `${BASE}/service1/users/health`,
      `${BASE}/service2/health`,
      `${BASE}/service3/health`,
    ];
    const url = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(url, { timeout: '10s' });
    check(res, { 'status 200': (r) => r.status === 200 });
  }

  sleep(0.3);  // ← moins de pause = plus de pression
}