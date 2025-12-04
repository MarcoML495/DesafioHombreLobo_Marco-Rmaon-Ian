import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up a 10 usuarios
    { duration: '1m', target: 50 },   // Ramp up a 50 usuarios
    { duration: '2m', target: 50 },   // Mantener 50 usuarios
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% de requests < 500ms
    http_req_failed: ['rate<0.1'],    // Menos de 10% de errores
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:8000';

export default function () {
  // Test 1: Health check
  let healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Login
  const loginPayload = JSON.stringify({
    name: 'testuser',
    password: 'password123',
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let loginRes = http.post(`${BASE_URL}/api/login`, loginPayload, loginParams);
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  }) || errorRate.add(1);

  if (loginRes.status === 200) {
    const token = loginRes.json('token');

    // Test 3: Get lobbies
    const authParams = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    };

    let lobbiesRes = http.get(`${BASE_URL}/api/lobbies`, authParams);
    check(lobbiesRes, {
      'get lobbies is 200': (r) => r.status === 200,
      'lobbies returned': (r) => r.json('data') !== undefined,
    }) || errorRate.add(1);

    sleep(1);

    // Test 4: Create lobby
    const createLobbyPayload = JSON.stringify({
      name: `Test Lobby ${Date.now()}`,
      max_players: 15,
      min_players: 5,
      is_public: true,
    });

    let createRes = http.post(
      `${BASE_URL}/api/lobbies`,
      createLobbyPayload,
      authParams
    );

    check(createRes, {
      'lobby created': (r) => r.status === 201,
    }) || errorRate.add(1);
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let summary = '\n' + indent + '📊 Load Test Summary\n';
  summary += indent + '═'.repeat(50) + '\n\n';
  
  summary += indent + `🎯 Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `✅ Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%\n`;
  summary += indent + `⏱️  Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `📈 95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  
  return summary;
}