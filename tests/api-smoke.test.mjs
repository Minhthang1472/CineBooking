import assert from 'node:assert/strict';
import test from 'node:test';

const apiBaseUrl = (process.env.API_BASE_URL || 'http://localhost:5262').replace(/\/+$/, '');
const requestTimeoutMs = Number(process.env.API_TEST_TIMEOUT_MS || 15000);

async function request(path, options) {
  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
}

async function readJson(response) {
  const body = await response.text();
  assert.notEqual(body, '', `Expected JSON response body, got HTTP ${response.status}`);
  return JSON.parse(body);
}

test('TC7.10: Swagger publishes the API and registration contract', async () => {
  const response = await request('/swagger/v1/swagger.json');
  assert.equal(response.status, 200);

  const spec = await readJson(response);
  assert.ok(spec.paths['/api/Auth/login']);
  assert.ok(spec.paths['/api/Auth/register']);
  assert.ok(spec.components.schemas.RegisterRequest);
});

test('TC2.1: room types endpoint returns the documented data array', async () => {
  const response = await request('/api/RoomTypes');
  assert.equal(response.status, 200);

  const body = await readJson(response);
  assert.ok(Array.isArray(body.data), 'Expected response.data to be an array');
});

test('TC2.2: rooms endpoint returns the documented data array', async () => {
  const response = await request('/api/Rooms');
  assert.equal(response.status, 200);

  const body = await readJson(response);
  assert.ok(Array.isArray(body.data), 'Expected response.data to be an array');
});

test('TC6.5: public attractions endpoint is available without a token', async () => {
  const response = await request('/api/Attractions');
  assert.equal(response.status, 200);

  const body = await readJson(response);
  assert.ok(Array.isArray(body), 'Expected an array of attractions');
});

test('TC1.6: dashboard API rejects requests without an access token', async () => {
  const response = await request('/api/dashboard-periods/current?roleName=Admin');
  assert.equal(response.status, 401);
});

test('TC1.2: login rejects invalid credentials', async () => {
  const response = await request('/api/Auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-test-account@example.invalid',
      password: 'invalid-test-password',
    }),
  });
  assert.equal(response.status, 401);
});

test('TC1.5: registration validates input before writing to the database', async () => {
  const response = await request('/api/Auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 400);
});

const existingEmail = process.env.TEST_EXISTING_EMAIL;
test('TC1.5: registration reports an existing email as a conflict', {
  skip: existingEmail ? false : 'Set TEST_EXISTING_EMAIL to an existing test-account email',
}, async () => {
  const response = await request('/api/Auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Automated duplicate-email check',
      phone: '0123456789',
      email: existingEmail,
      password: 'test-password-123',
    }),
  });
  assert.equal(response.status, 409);
});

const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;
test('TC1.1: valid admin credentials return an admin token', {
  skip: adminEmail && adminPassword ? false : 'Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD for this test',
}, async () => {
  const response = await request('/api/Auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  assert.equal(response.status, 200);

  const body = await readJson(response);
  assert.equal(typeof body.token, 'string');
  assert.ok(body.token.length > 0);
  assert.equal(body.role, 'Admin');
});
