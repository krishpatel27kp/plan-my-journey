/**
 * Phase 1 & 2 Real JWT Auth Test Suite
 * Validates all endpoints, real token flow, profile updates, and edge cases.
 */
const assert = require('assert');
const http = require('http');
const app = require('../app');
const { verifyToken, generateToken } = require('../utils/auth');

async function runTests() {
  console.log("\n============================================================");
  console.log(" Running Real JWT Auth & Profile End-to-End Test Suite");
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
      console.error(`  [FAIL] Check #${num}: ${name}`, err);
      failed++;
    }
  }

  let registeredToken = '';
  let registeredUserId = '';
  const testEmail = `traveler_${Date.now()}@example.com`;
  const testPassword = 'securePassword123!';
  const testName = 'Alex Mercer';

  // Check 1: Register new user
  await check(1, "POST /api/auth/register returns 201 with { id, name, email, token } & no password leak", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword
      })
    });
    assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}`);
    const data = await res.json();
    
    assert.ok(data.id, 'User ID is missing');
    assert.strictEqual(data.name, testName);
    assert.strictEqual(data.email, testEmail.toLowerCase());
    assert.ok(data.token, 'Token is missing');
    
    // Strict leak checks
    assert.strictEqual(data.password, undefined, 'Password leaked in response!');
    assert.strictEqual(data.password_hash, undefined, 'Password hash leaked in response!');
    assert.strictEqual(data.passwordHash, undefined, 'Password hash leaked in response!');
    
    registeredToken = data.token;
    registeredUserId = data.id;
  });

  // Check 2: Register duplicate email -> 409 EMAIL_EXISTS
  await check(2, "POST /api/auth/register with duplicate email returns 409 EMAIL_EXISTS", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Alex',
        email: testEmail,
        password: 'anotherPassword123'
      })
    });
    assert.strictEqual(res.status, 409, `Expected 409, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'EMAIL_EXISTS');
  });

  // Check 3: Login with correct credentials -> 200 & valid JWT payload
  await check(3, "POST /api/auth/login with valid credentials returns 200 & JWT payload has { userId, email, iat, exp }", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.id, registeredUserId);
    assert.strictEqual(data.email, testEmail.toLowerCase());
    assert.ok(data.token);

    // Decode and verify JWT payload structure
    const decoded = verifyToken(data.token);
    assert.strictEqual(decoded.userId, registeredUserId);
    assert.strictEqual(decoded.email, testEmail.toLowerCase());
    assert.ok(typeof decoded.iat === 'number', 'iat must be number');
    assert.ok(typeof decoded.exp === 'number', 'exp must be number');
    assert.ok(decoded.exp > decoded.iat, 'exp must be after iat');
  });

  // Check 4: Login with wrong password -> 401 INVALID_CREDENTIALS
  await check(4, "POST /api/auth/login with wrong password returns 401 INVALID_CREDENTIALS", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'incorrectPassword123'
      })
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'INVALID_CREDENTIALS');
  });

  // Check 5: GET /api/users/me with real token -> 200 and user data
  await check(5, "GET /api/users/me with real JWT returns 200 and profile", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${registeredToken}`
      }
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.id, registeredUserId);
    assert.strictEqual(data.name, testName);
    assert.strictEqual(data.email, testEmail.toLowerCase());
    assert.strictEqual(data.password, undefined);
    assert.strictEqual(data.password_hash, undefined);
  });

  // Check 6: GET /api/users/me with expired or tampered token -> 401 UNAUTHORIZED
  await check(6, "GET /api/users/me with tampered token returns 401 UNAUTHORIZED", async () => {
    const tamperedToken = registeredToken.slice(0, -5) + 'XXXXX';
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${tamperedToken}`
      }
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // Check 7: GET /api/users/me with NO token -> 401 UNAUTHORIZED
  await check(7, "GET /api/users/me with NO token returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`);
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // Check 8: Confirm invalid/untrusted token is rejected -> 401 UNAUTHORIZED
  await check(8, "Confirm invalid/untrusted tokens are rejected (401 UNAUTHORIZED)", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: 'Bearer invalid.token.payload'
      }
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // Check 9: PUT /api/users/me updates profile & persists
  await check(9, "PUT /api/users/me updates name & profileImage and returns 200", async () => {
    const updatedName = 'Alex Mercer (Updated)';
    const updatedImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';

    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${registeredToken}`
      },
      body: JSON.stringify({
        name: updatedName,
        profileImage: updatedImage
      })
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.id, registeredUserId);
    assert.strictEqual(data.name, updatedName);
    assert.strictEqual(data.profileImage, updatedImage);

    // Verify persistence via GET /api/users/me
    const getRes = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${registeredToken}` }
    });
    const getData = await getRes.json();
    assert.strictEqual(getData.name, updatedName);
    assert.strictEqual(getData.profileImage, updatedImage);
  });

  // Clean up
  await new Promise((resolve) => server.close(resolve));

  console.log(`\n============================================================`);
  console.log(` Real Auth Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
