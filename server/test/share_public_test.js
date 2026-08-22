/**
 * Share & Public Flow Verification Test Suite
 * Tests:
 * 1. POST /api/trips/:tripId/share requires auth (401 on missing auth)
 * 2. POST /api/trips/:tripId/share rejects non-owner with 403
 * 3. POST /api/trips/:tripId/share generates token and contract-compliant response
 * 4. GET /api/public/trips/:shareToken works without auth and returns exact contract shape
 * 5. GET /api/public/trips/invalid returns 404 with standard error shape
 */

const http = require('http');
const db = require('../db');
const app = require('../app');
const { generateToken } = require('../utils/auth');

const TEST_PORT = 5099;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...options, port: TEST_PORT, hostname: 'localhost' }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING SHARE & PUBLIC FLOW TEST SUITE ===');

  let server;
  let testUserId;
  let otherUserId;
  let testTripId;
  let testStopId;

  try {
    // Start test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));

    // 1. Create test users in DB if not exist
    const userRes = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('Share Owner', 'owner@example.com', 'hash123')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    testUserId = userRes.rows[0].id;

    const otherUserRes = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('Other User', 'other@example.com', 'hash456')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    otherUserId = otherUserRes.rows[0].id;

    // 2. Create a test trip with stops and activities
    const tripRes = await db.query(
      `INSERT INTO trips (user_id, title, description, start_date, end_date, budget)
       VALUES ($1, 'Goa Escape', 'Beach holiday', '2026-09-10', '2026-09-15', 50000)
       RETURNING id`,
      [testUserId]
    );
    testTripId = tripRes.rows[0].id;

    // Create a stop
    const stopRes = await db.query(
      `INSERT INTO trip_stops (trip_id, city_name, stop_order, arrival_date, departure_date)
       VALUES ($1, 'Goa', 1, '2026-09-10', '2026-09-15')
       RETURNING id`,
      [testTripId]
    );
    testStopId = stopRes.rows[0].id;

    // Create activities for the stop
    await db.query(
      `INSERT INTO itinerary_activities (trip_stop_id, title, order_index, cost)
       VALUES 
       ($1, 'Scuba Diving', 1, 2500),
       ($1, 'Baga Beach', 2, 200)`,
      [testStopId]
    );

    // Generate test JWTs
    const ownerToken = generateToken({ id: testUserId, email: 'owner@example.com' });
    const otherToken = generateToken({ id: otherUserId, email: 'other@example.com' });

    // TEST 1: POST /api/trips/:tripId/share without auth -> 401
    console.log('\nTest 1: POST /api/trips/:tripId/share without auth');
    const resNoAuth = await request({
      path: `/api/trips/${testTripId}/share`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Status:', resNoAuth.status);
    if (resNoAuth.status !== 401) throw new Error(`Expected 401, got ${resNoAuth.status}`);
    console.log('PASS: Rejects unauthorized request with 401.');

    // TEST 2: POST /api/trips/:tripId/share with non-owner auth -> 403
    console.log('\nTest 2: POST /api/trips/:tripId/share by non-owner');
    const resNonOwner = await request({
      path: `/api/trips/${testTripId}/share`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${otherToken}`
      }
    });
    console.log('Status:', resNonOwner.status);
    if (resNonOwner.status !== 403) throw new Error(`Expected 403, got ${resNonOwner.status}`);
    console.log('PASS: Rejects non-owner with 403 FORBIDDEN.');

    // TEST 3: POST /api/trips/:tripId/share by owner -> 201 with { shareToken, publicUrl }
    console.log('\nTest 3: POST /api/trips/:tripId/share by owner');
    const resShare = await request({
      path: `/api/trips/${testTripId}/share`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      }
    });
    console.log('Status:', resShare.status);
    console.log('Body:', resShare.body);
    if (resShare.status !== 201) throw new Error(`Expected 201, got ${resShare.status}`);
    if (!resShare.body.shareToken || !resShare.body.publicUrl) {
      throw new Error('Response missing shareToken or publicUrl');
    }
    const generatedToken = resShare.body.shareToken;
    console.log('PASS: Generated share token successfully:', generatedToken);

    // TEST 4: GET /api/public/trips/:shareToken -> 200 with contract shape
    console.log('\nTest 4: GET /api/public/trips/:shareToken');
    const resPublic = await request({
      path: `/api/public/trips/${generatedToken}`,
      method: 'GET'
    });
    console.log('Status:', resPublic.status);
    console.log('Public Trip Shape:', JSON.stringify(resPublic.body, null, 2));
    if (resPublic.status !== 200) throw new Error(`Expected 200, got ${resPublic.status}`);

    if (resPublic.body.title !== 'Goa Escape') {
      throw new Error(`Expected title 'Goa Escape', got '${resPublic.body.title}'`);
    }
    if (!Array.isArray(resPublic.body.stops) || resPublic.body.stops.length === 0) {
      throw new Error('Expected non-empty stops array');
    }
    const firstStop = resPublic.body.stops[0];
    if (firstStop.city !== 'Goa') throw new Error(`Expected stop city 'Goa', got ${firstStop.city}`);
    if (!Array.isArray(firstStop.activities) || typeof firstStop.activities[0] !== 'string') {
      throw new Error('Contract requirement failed: activities must be an array of strings (names)!');
    }
    console.log('PASS: Public trip returned exact contract-compliant format.');

    // TEST 5: GET /api/public/trips/nonexistent-token -> 404
    console.log('\nTest 5: GET /api/public/trips/invalid_token');
    const res404 = await request({
      path: '/api/public/trips/invalid_token_999',
      method: 'GET'
    });
    console.log('Status:', res404.status);
    if (res404.status !== 404) throw new Error(`Expected 404, got ${res404.status}`);
    if (!res404.body.error || res404.body.error.code !== 'NOT_FOUND') {
      throw new Error('Expected standard 404 NOT_FOUND error shape');
    }
    console.log('PASS: Handled invalid share token with standard 404 error.');

    console.log('\n=== ALL SHARE & PUBLIC TESTS PASSED (5/5) ===');

    // Clean up test records
    await db.query('DELETE FROM trips WHERE id = $1', [testTripId]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [testUserId, otherUserId]);

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    if (testTripId) {
      try { await db.query('DELETE FROM trips WHERE id = $1', [testTripId]); } catch (e) {}
    }
    if (testUserId) {
      try { await db.query('DELETE FROM users WHERE id IN ($1, $2)', [testUserId, otherUserId]); } catch (e) {}
    }
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
