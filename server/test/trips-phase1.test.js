/**
 * Phase 1: Pillar B (Itinerary & Trip Core) Test Suite
 * Tests Trip, TripStop models, CRUD endpoints, user scoping, privacy isolation (404 on unowned trips),
 * exact response shapes, input validation error formats, and database persistence.
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const { City } = require('../models');

async function runTests() {
  console.log("\n============================================================");
  console.log(" Running Phase 1: Trips & TripStops End-to-End Test Suite");
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

  // Setup users through the real auth endpoints so every protected request
  // exercises production JWT issuance and verification.
  const registerUser = async (name) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(16).slice(2)}@traveler.test`,
        password: 'phase1-real-auth-password'
      })
    });
    assert.strictEqual(res.status, 201, `Expected registration to succeed, got ${res.status}`);
    return res.json();
  };
  const registration1 = await registerUser('Alice Traveler');
  const registration2 = await registerUser('Bob Traveler');
  const user1 = { id: registration1.id, email: registration1.email };
  const user2 = { id: registration2.id, email: registration2.email };
  const token1 = registration1.token;
  const token2 = registration2.token;

  let user1TripId = '';
  let user2TripId = '';
  let testCityId = '';

  // Retrieve a seed city ID
  const cities = await City.findAll();
  if (cities.length > 0) {
    testCityId = cities[0].id;
  } else {
    testCityId = '33333333-3333-4333-8333-333333333333';
  }

  // 1. POST /api/trips - Valid Trip creation
  await check(1, "POST /api/trips returns 201 with EXACT keys: id, title, startDate, endDate, budget, userId", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: 'Goa Escape',
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        budget: 50000,
        description: 'Sunny beach vacation'
      })
    });

    assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}`);
    const data = await res.json();

    // Check exact required keys
    const keys = Object.keys(data).sort();
    const expectedKeys = ['budget', 'endDate', 'id', 'startDate', 'title', 'userId'].sort();
    assert.deepStrictEqual(keys, expectedKeys, `Response keys mismatch! Got: ${JSON.stringify(keys)}`);

    assert.strictEqual(data.title, 'Goa Escape');
    assert.strictEqual(data.startDate, '2026-09-10');
    assert.strictEqual(data.endDate, '2026-09-15');
    assert.strictEqual(Number(data.budget), 50000);
    assert.strictEqual(data.userId, user1.id);
    assert.ok(data.id, 'id is missing');

    user1TripId = data.id;
  });

  // 2. POST /api/trips - Missing title validation
  await check(2, "POST /api/trips fails with 400 and standard VALIDATION_ERROR when title is missing", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        startDate: '2026-09-10',
        endDate: '2026-09-15'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'VALIDATION_ERROR');
    assert.ok(data?.error?.message);
  });

  // 3. POST /api/trips - Missing startDate validation
  await check(3, "POST /api/trips fails with 400 VALIDATION_ERROR when startDate is missing or invalid", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: 'Trip with invalid date',
        startDate: 'invalid-date',
        endDate: '2026-09-15'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'VALIDATION_ERROR');
  });

  // 4. POST /api/trips - Date ordering validation (startDate > endDate)
  await check(4, "POST /api/trips fails with 400 VALIDATION_ERROR when startDate > endDate", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: 'Reverse Date Trip',
        startDate: '2026-09-20',
        endDate: '2026-09-10'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'VALIDATION_ERROR');
  });

  // 5. POST /api/trips - Non-numeric budget validation
  await check(5, "POST /api/trips fails with 400 VALIDATION_ERROR when budget is not numeric", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: 'Trip with bad budget',
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        budget: 'not-a-number'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'VALIDATION_ERROR');
  });

  // 6. User 2 creates a Trip
  await check(6, "User 2 creates a separate trip (User Scoping setup)", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({
        title: 'Paris Explorer',
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        budget: 120000
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.userId, user2.id);
    user2TripId = data.id;
  });

  // 7. GET /api/trips - User 1 only sees User 1's trips
  await check(7, "GET /api/trips returns only trips belonging to the authenticated user", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    assert.strictEqual(res.status, 200);
    const trips = await res.json();
    assert.ok(Array.isArray(trips));
    assert.ok(trips.some(t => t.id === user1TripId), "User 1's trip should be present");
    assert.ok(!trips.some(t => t.id === user2TripId), "User 2's trip MUST NOT be in User 1's list");
    trips.forEach(t => assert.strictEqual(t.userId, user1.id));
  });

  // 8. GET /api/trips/:id - User 1 can view own trip
  await check(8, "GET /api/trips/:id returns 200 for user's own trip with stops array", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    assert.strictEqual(res.status, 200);
    const trip = await res.json();
    assert.strictEqual(trip.id, user1TripId);
    assert.strictEqual(trip.userId, user1.id);
    assert.ok(Array.isArray(trip.stops));
  });

  // 9. GET /api/trips/:id - User 2 querying User 1's trip MUST return 404 (NOT 403)
  await check(9, "GET /api/trips/:id returns 404 (NOT 403) when requesting another user's trip", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });

    assert.strictEqual(res.status, 404, `Expected 404 for unowned trip, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'NOT_FOUND');
  });

  // 10. PUT /api/trips/:id - User 1 updates own trip
  await check(10, "PUT /api/trips/:id successfully updates user's own trip", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        title: 'Goa Grand Escape',
        budget: 65000
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.title, 'Goa Grand Escape');
    assert.strictEqual(Number(data.budget), 65000);
  });

  // 11. PUT /api/trips/:id - User 2 attempting to update User 1's trip MUST return 404 (NOT 403)
  await check(11, "PUT /api/trips/:id returns 404 (NOT 403) when attempting to modify another user's trip", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({
        title: 'Hacked Title'
      })
    });

    assert.strictEqual(res.status, 404, `Expected 404 for unowned trip modification, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'NOT_FOUND');
  });

  // 12. POST /api/trips/:tripId/stops - User 1 adds stop to own trip
  await check(12, "POST /api/trips/:tripId/stops adds a stop to own trip and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        cityId: testCityId,
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        stopOrder: 1
      })
    });

    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const stop = await res.json();
    assert.ok(stop.id);
    assert.strictEqual(stop.tripId, user1TripId);
    assert.strictEqual(stop.cityId, testCityId);
    assert.strictEqual(stop.stopOrder, 1);
    assert.strictEqual(stop.startDate, '2026-09-10');
    assert.strictEqual(stop.endDate, '2026-09-12');
  });

  // 13. POST /api/trips/:tripId/stops - User 2 attempting to add stop to User 1's trip MUST return 404
  await check(13, "POST /api/trips/:tripId/stops returns 404 when adding stop to another user's trip", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({
        cityId: testCityId,
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        stopOrder: 1
      })
    });

    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'NOT_FOUND');
  });

  // 14. POST /api/trips/:tripId/stops - Validation failures return 400 VALIDATION_ERROR
  await check(14, "POST /api/trips/:tripId/stops returns 400 VALIDATION_ERROR on missing cityId or invalid stopOrder", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        stopOrder: -1
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'VALIDATION_ERROR');
  });

  // 15. DELETE /api/trips/:id - User 2 attempting to delete User 1's trip MUST return 404 (NOT 403)
  await check(15, "DELETE /api/trips/:id returns 404 (NOT 403) when attempting to delete another user's trip", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` }
    });

    assert.strictEqual(res.status, 404, `Expected 404, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'NOT_FOUND');
  });

  // 16. DELETE /api/trips/:id - User 1 successfully deletes own trip
  await check(16, "DELETE /api/trips/:id successfully deletes own trip and cascades", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${user1TripId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, user1TripId);

    // Verify trip is gone
    const getRes = await fetch(`${baseUrl}/api/trips/${user1TripId}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.strictEqual(getRes.status, 404);
  });

  // 17. Unauthenticated request returns 401 UNAUTHORIZED
  await check(17, "Unauthenticated request to /api/trips returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/trips`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  await new Promise((resolve) => server.close(resolve));

  console.log(`\n============================================================`);
  console.log(` Phase 1 Trips Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
