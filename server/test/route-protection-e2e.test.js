/**
 * Route Protection End-to-End Verification Test Suite
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const { generateToken, verifyToken } = require('../utils/auth');

async function runRouteProtectionE2E() {
  console.log("\n============================================================");
  console.log(" 🛡️ ROUTE PROTECTION END-TO-END VERIFICATION SUITE");
  console.log("============================================================\n");

  const unhandledErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => {
    unhandledErrors.push(args.join(' '));
    originalConsoleError(...args);
  };

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

  let user1Token = '';
  let user1Id = '';
  let user2Token = '';
  let user2Id = '';
  let tripId = '';
  let shareToken = '';
  let clonedTripId = '';

  // 1. User 1 Registration & Protected Dashboard Trip Fetch
  await check(1, "POST /api/auth/register (Public) & GET /api/trips (Protected with Bearer Token)", async () => {
    // 1a. Register User 1
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Belfort',
        email: `jordan_${Date.now()}@journey.com`,
        password: 'Password123!Secure'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    user1Token = regData.token;
    user1Id = regData.id;

    // 1b. GET /api/trips with Auth
    const tripsRes = await fetch(`${baseUrl}/api/trips`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert.strictEqual(tripsRes.status, 200);
    const trips = await tripsRes.json();
    assert.ok(Array.isArray(trips));
  });

  // 2. User 1 Creates Trip (B's endpoint)
  await check(2, "POST /api/trips creates trip attached to User 1 (Pillar B)", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'Swiss Alps Expedition',
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        budget: 120000,
        description: 'Skiing and hiking in Interlaken & Zermatt'
      })
    });
    assert.strictEqual(res.status, 201);
    const trip = await res.json();
    assert.strictEqual(trip.userId, user1Id);
    assert.strictEqual(trip.title, 'Swiss Alps Expedition');
    tripId = trip.id;
  });

  // 3. User 1 Generates Share Link (C's endpoint)
  await check(3, "POST /api/trips/:id/share generates share token (Pillar C, Protected)", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${tripId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.shareToken);
    shareToken = data.shareToken;
  });

  // 4. Open Share Link with ZERO Authorization header (Public / Incognito)
  await check(4, "GET /api/public/trips/:shareToken works with ZERO Authorization header (Public Read-Only)", async () => {
    const res = await fetch(`${baseUrl}/api/public/trips/${shareToken}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.title, 'Swiss Alps Expedition');
    assert.ok(Array.isArray(data.stops));
  });

  // 5. Attempt Copy Trip while Logged Out (No Token) -> Blocked with 401
  await check(5, "POST /api/trips/:shareToken/copy is REJECTED with 401 without auth token", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${shareToken}/copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // 6. User 2 Registers and Copies Trip -> Succeeds with 201
  await check(6, "User 2 Registers & POST /api/trips/:shareToken/copy SUCCEEDS with valid JWT (201 Created)", async () => {
    // 6a. Register User 2
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Clara Oswald',
        email: `clara_${Date.now()}@journey.com`,
        password: 'Password123!Clara'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    user2Token = regData.token;
    user2Id = regData.id;

    // 6b. Copy Trip
    const copyRes = await fetch(`${baseUrl}/api/trips/${shareToken}/copy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    assert.strictEqual(copyRes.status, 201, `Expected 201, got ${copyRes.status}`);
    const copyData = await copyRes.json();
    assert.ok(copyData.newTripId || copyData.id);
    clonedTripId = copyData.newTripId || copyData.id;

    // 6c. Verify cloned trip is in User 2's account
    const tripRes = await fetch(`${baseUrl}/api/trips/${clonedTripId}`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    assert.strictEqual(tripRes.status, 200);
    const clonedTrip = await tripRes.json();
    assert.strictEqual(clonedTrip.userId, user2Id);
  });

  // 7. Expired Token Handling -> 401 with code 'TOKEN_EXPIRED' specifically
  await check(7, "Expired JWT token returns 401 with exact error code 'TOKEN_EXPIRED'", async () => {
    const pastIat = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
    const expiredToken = generateToken({ id: user1Id, email: 'expired@demo.com' }, '1h', pastIat);

    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'TOKEN_EXPIRED', `Expected 'TOKEN_EXPIRED', got ${data?.error?.code}`);
    assert.ok(data?.error?.message.includes('expired'), 'Message should indicate token expiration');
  });

  // 8. Tampered Token Handling -> 401 UNAUTHORIZED
  await check(8, "Tampered token signature returns 401 UNAUTHORIZED", async () => {
    const tamperedToken = user1Token.slice(0, -5) + 'AAAAA';
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  // 9. Enumerate and test public vs protected routes
  await check(9, "Route Enumeration: Verify all Public routes allow unauthenticated access", async () => {
    // GET /api/cities (Public)
    const citiesRes = await fetch(`${baseUrl}/api/cities`);
    assert.strictEqual(citiesRes.status, 200);

    // POST /api/auth/register with empty body -> returns 400 (validation), NOT 401 (auth is not required)
    const authRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(authRegRes.status, 400);

    // POST /api/auth/login with empty body -> returns 400 (validation), NOT 401 (auth is not required)
    const authLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(authLoginRes.status, 400);
  });

  await new Promise((resolve) => server.close(resolve));
  console.error = originalConsoleError;

  console.log(`\n============================================================`);
  console.log(` 🛡️ ROUTE PROTECTION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRouteProtectionE2E();
}

module.exports = { runRouteProtectionE2E };
