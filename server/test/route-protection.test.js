/**
 * Phase 3 Route Protection & Integration Test Suite
 * Validates public routes, protected routes, explicit TOKEN_EXPIRED handling,
 * and Teammate C Copy Trip auth dependency.
 */
const assert = require('assert');
const http = require('http');
const app = require('../app');
const { generateToken } = require('../utils/auth');

async function runTests() {
  console.log("\n============================================================");
  console.log(" Running Phase 3: Route Protection & Integration Test Suite");
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

  // Register a real user to get a valid token
  const testUser = {
    id: 'test-user-uuid-1234',
    name: 'Jordan Rivera',
    email: `jordan_${Date.now()}@example.com`
  };
  const validToken = generateToken(testUser, '1h');

  // Generate an explicitly EXPIRED token (iat 2 hours ago, exp 1 hour ago)
  const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
  const expiredToken = generateToken(testUser, '1h', twoHoursAgo);

  // Check 1: Public route GET /api/public/trips/:shareToken works with ZERO auth header
  await check(1, "GET /api/public/trips/:shareToken succeeds with NO Authorization header (200 OK)", async () => {
    const res = await fetch(`${baseUrl}/api/public/trips/mock-share-token-abc`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.shareToken, 'mock-share-token-abc');
  });

  // Check 2: Public discovery route GET /api/cities works with ZERO auth header
  await check(2, "GET /api/cities succeeds with NO Authorization header (200 OK)", async () => {
    const res = await fetch(`${baseUrl}/api/cities`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
  });

  // Check 3: Protected route POST /api/trips/:shareToken/copy is REJECTED without token (401 UNAUTHORIZED)
  await check(3, "POST /api/trips/:shareToken/copy is REJECTED with 401 without auth token", async () => {
    const res = await fetch(`${baseUrl}/api/trips/mock-share-token-abc/copy`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // Check 4: Protected route POST /api/trips/:shareToken/copy SUCCEEDS with real token (201 Created)
  await check(4, "POST /api/trips/:shareToken/copy SUCCEEDS with valid JWT token (201 Created)", async () => {
    const res = await fetch(`${baseUrl}/api/trips/mock-share-token-abc/copy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`
      }
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.userId, testUser.id);
  });

  // Check 5: Expired token returns 401 with code TOKEN_EXPIRED specifically
  await check(5, "Expired JWT token returns 401 with code 'TOKEN_EXPIRED' specifically", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${expiredToken}`
      }
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'TOKEN_EXPIRED', `Expected error code TOKEN_EXPIRED, got ${data?.error?.code}`);
    assert.ok(data?.error?.message, 'Error message is required');
  });

  // Check 6: Tampered / invalid token returns 401 UNAUTHORIZED (not TOKEN_EXPIRED or 500)
  await check(6, "Tampered token returns 401 with code 'UNAUTHORIZED'", async () => {
    const tampered = validToken.slice(0, -6) + 'AAAAAA';
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${tampered}`
      }
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // Check 7: GET /api/trips is protected (401 without auth, 200 with auth)
  await check(7, "GET /api/trips is protected (401 without auth, 200 with auth)", async () => {
    const resNoAuth = await fetch(`${baseUrl}/api/trips`);
    assert.strictEqual(resNoAuth.status, 401);

    const resWithAuth = await fetch(`${baseUrl}/api/trips`, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
    assert.strictEqual(resWithAuth.status, 200);
  });

  // Check 8: POST /api/trips/:tripId/share is protected (401 without auth, 200 with auth)
  await check(8, "POST /api/trips/:tripId/share is protected (401 without auth, 200 with auth)", async () => {
    const resNoAuth = await fetch(`${baseUrl}/api/trips/trip-123/share`, { method: 'POST' });
    assert.strictEqual(resNoAuth.status, 401);

    const resWithAuth = await fetch(`${baseUrl}/api/trips/trip-123/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` }
    });
    assert.strictEqual(resWithAuth.status, 200);
    const data = await resWithAuth.json();
    assert.ok(data.shareToken);
  });

  // Clean up
  await new Promise((resolve) => server.close(resolve));

  console.log(`\n============================================================`);
  console.log(` Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
