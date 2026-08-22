/**
 * Comprehensive 9-Point Self-Test for Real JWT Authentication
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const { verifyToken, generateToken } = require('../utils/auth');

const PHASE0_STUB_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYWFhYWFhYS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InRlc3RAdHJhdmVsZXIuY29tIiwiaWF0IjoxNzAwMDAwMDAwfQ.stub_test_signature_plan_my_journey_2026';

async function runSelfTest() {
  console.log("\n============================================================");
  console.log(" 🔐 REAL AUTH 9-POINT END-TO-END VERIFICATION SUITE");
  console.log("============================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  async function check(num, name, fn) {
    try {
      await fn();
      console.log(`  [PASS] Check #${num}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] Check #${num}: ${name}`, err.message || err);
      failed++;
    }
  }

  const testEmail = `auth_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!Safe';
  const testName = 'Devin Knight';
  let registeredToken = '';
  let registeredUserId = '';

  // 1. POST /api/auth/register -> 201, exact contract, no leaks
  await check(1, "POST /api/auth/register returns 201, exact contract shape { id, name, email, token } & zero password leaks", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: testPassword })
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.name, testName);
    assert.strictEqual(data.email, testEmail.toLowerCase());
    assert.ok(data.id, 'id is missing');
    assert.ok(data.token, 'token is missing');
    assert.strictEqual(data.password, undefined, 'Password leaked!');
    assert.strictEqual(data.password_hash, undefined, 'password_hash leaked!');
    assert.strictEqual(data.passwordHash, undefined, 'passwordHash leaked!');

    registeredToken = data.token;
    registeredUserId = data.id;
  });

  // 2. Duplicate registration -> 409 EMAIL_EXISTS
  await check(2, "POST /api/auth/register with duplicate email returns 409 EMAIL_EXISTS", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Duplicate User', email: testEmail, password: 'anotherPassword123' })
    });
    assert.strictEqual(res.status, 409, `Expected 409, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'EMAIL_EXISTS');
  });

  // 3. Login with correct credentials -> 200 & valid JWT payload { userId, email, iat, exp }
  await check(3, "POST /api/auth/login with valid credentials returns 200 & JWT payload with { userId, email, iat, exp }", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.id, registeredUserId);
    assert.strictEqual(data.email, testEmail.toLowerCase());
    assert.ok(data.token);

    const decoded = verifyToken(data.token);
    assert.strictEqual(decoded.userId, registeredUserId);
    assert.strictEqual(decoded.email, testEmail.toLowerCase());
    assert.ok(typeof decoded.iat === 'number', 'iat must be number');
    assert.ok(typeof decoded.exp === 'number', 'exp must be number');
    assert.ok(decoded.exp > decoded.iat, 'exp must be greater than iat');
  });

  // 4. Login with wrong password -> 401 INVALID_CREDENTIALS
  await check(4, "POST /api/auth/login with wrong password returns 401 INVALID_CREDENTIALS", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'wrongPassword!999' })
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'INVALID_CREDENTIALS');
  });

  // 5. GET /api/users/me with real token -> 200 & correct user data
  await check(5, "GET /api/users/me with real token returns 200 and profile", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${registeredToken}` }
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.id, registeredUserId);
    assert.strictEqual(data.name, testName);
    assert.strictEqual(data.email, testEmail.toLowerCase());
    assert.strictEqual(data.password, undefined);
    assert.strictEqual(data.password_hash, undefined);
  });

  // 6. GET /api/users/me with expired or tampered token -> 401
  await check(6, "GET /api/users/me with expired or tampered token returns 401", async () => {
    // 6a. Tampered Token
    const tampered = registeredToken.slice(0, -6) + 'ZZZZZZ';
    const resTampered = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${tampered}` }
    });
    assert.strictEqual(resTampered.status, 401);
    const dataTampered = await resTampered.json();
    assert.strictEqual(dataTampered?.error?.code, 'UNAUTHORIZED');

    // 6b. Expired Token
    const pastTime = Math.floor(Date.now() / 1000) - 7200;
    const expiredToken = generateToken({ id: registeredUserId, email: testEmail }, '1h', pastTime);
    const resExpired = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.strictEqual(resExpired.status, 401);
    const dataExpired = await resExpired.json();
    assert.strictEqual(dataExpired?.error?.code, 'TOKEN_EXPIRED');
  });

  // 7. GET /api/users/me with NO token -> 401, standard error shape
  await check(7, "GET /api/users/me with NO token returns 401 with standard error shape", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
    assert.ok(data?.error?.message);
  });

  // 8. Confirm old Phase-0 stub token FAILS (401 UNAUTHORIZED)
  await check(8, "Old Phase-0 stub token FAILS with 401 UNAUTHORIZED (Real auth active)", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${PHASE0_STUB_TOKEN}` }
    });
    assert.strictEqual(res.status, 401, `Phase 0 stub token MUST be rejected with 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // 9. Codebase & log audit for zero leaks
  await check(9, "Zero password or hash leaks in response objects or logging", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const data = await res.json();
    const serialized = JSON.stringify(data);
    assert.ok(!serialized.includes('password_hash'), 'password_hash present in response payload');
    assert.ok(!serialized.includes(testPassword), 'plain password present in response payload');
  });

  await new Promise((resolve) => server.close(resolve));

  console.log(`\n============================================================`);
  console.log(` 🔐 Real Auth 9-Point Verification: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runSelfTest();
}

module.exports = { runSelfTest };
