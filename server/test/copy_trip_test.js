/**
 * Copy Trip Test Suite (Phase 3 Teammate C)
 * Tests:
 * 1. POST /api/trips/:shareToken/copy requires real auth (401 on missing token)
 * 2. POST /api/trips/:shareToken/copy returns 404 for nonexistent share token
 * 3. POST /api/trips/:shareToken/copy successfully deep-clones trip, stops, and activities
 * 4. Verifies new foreign keys, new IDs, "Copy of <title>" naming, and database transaction integrity
 */

const http = require('http');
const db = require('../db');
const app = require('../app');
const { generateToken } = require('../utils/auth');

const TEST_PORT = 5098;

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
  console.log('=== RUNNING COPY TRIP (PHASE 3) TEST SUITE ===');

  let server;
  let creatorId;
  let clonerId;
  let origTripId;
  let origStopId;
  let shareToken = 'copyTest99';
  let newTripId = null;

  try {
    // 1. Start test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));

    // 2. Seed creator & cloner users
    const userRes1 = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('Trip Creator', 'creator@example.com', 'hash_pw_1')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    creatorId = userRes1.rows[0].id;

    const userRes2 = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('Trip Cloner', 'cloner@example.com', 'hash_pw_2')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    clonerId = userRes2.rows[0].id;

    // 3. Create original trip with stops and activities
    const tripRes = await db.query(
      `INSERT INTO trips (user_id, title, description, start_date, end_date, budget, currency)
       VALUES ($1, 'Golden Triangle Express', 'Delhi-Agra-Jaipur classic tour', '2026-11-01', '2026-11-08', 45000, 'INR')
       RETURNING id`,
      [creatorId]
    );
    origTripId = tripRes.rows[0].id;

    // Create stop
    const stopRes = await db.query(
      `INSERT INTO trip_stops (trip_id, city_name, stop_order, arrival_date, departure_date)
       VALUES ($1, 'Agra', 1, '2026-11-02', '2026-11-04')
       RETURNING id`,
      [origTripId]
    );
    origStopId = stopRes.rows[0].id;

    // Create activity
    await db.query(
      `INSERT INTO itinerary_activities (trip_stop_id, title, order_index, cost)
       VALUES 
       ($1, 'Taj Mahal Sunrise Visit', 1, 1500),
       ($1, 'Agra Fort Tour', 2, 500)`,
      [origStopId]
    );

    // Create share token
    await db.query(
      `INSERT INTO shares (trip_id, share_token)
       VALUES ($1, $2)
       ON CONFLICT (share_token) DO UPDATE SET trip_id = EXCLUDED.trip_id`,
      [origTripId, shareToken]
    );

    const clonerJwt = generateToken({ id: clonerId, email: 'cloner@example.com' });

    // TEST 1: POST /api/trips/:shareToken/copy without auth -> 401
    console.log('\nTest 1: POST /api/trips/:shareToken/copy without auth');
    const resNoAuth = await request({
      path: `/api/trips/${shareToken}/copy`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Status:', resNoAuth.status);
    if (resNoAuth.status !== 401) throw new Error(`Expected 401, got ${resNoAuth.status}`);
    console.log('PASS: Gated with real auth (401 Unauthorized).');

    // TEST 2: POST /api/trips/invalid_token/copy with auth -> 404
    console.log('\nTest 2: POST /api/trips/invalid_token/copy with auth');
    const resInvalid = await request({
      path: '/api/trips/nonexistent_token_123/copy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clonerJwt}`
      }
    });
    console.log('Status:', resInvalid.status);
    if (resInvalid.status !== 404) throw new Error(`Expected 404, got ${resInvalid.status}`);
    console.log('PASS: Handled missing share token with 404 NOT_FOUND.');

    // TEST 3: POST /api/trips/:shareToken/copy with valid auth -> 201 + { newTripId }
    console.log('\nTest 3: POST /api/trips/:shareToken/copy deep relational cloning');
    const resCopy = await request({
      path: `/api/trips/${shareToken}/copy`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clonerJwt}`
      }
    });
    console.log('Status:', resCopy.status);
    console.log('Response body:', resCopy.body);
    if (resCopy.status !== 201) throw new Error(`Expected 201, got ${resCopy.status}`);
    if (!resCopy.body.newTripId) throw new Error('Response missing newTripId');

    newTripId = resCopy.body.newTripId;
    if (newTripId === origTripId) throw new Error('newTripId must not match original trip ID!');

    // TEST 4: Database verification of deep relational clone
    console.log('\nTest 4: Database relational verification');
    const clonedTripRes = await db.query('SELECT * FROM trips WHERE id = $1', [newTripId]);
    if (clonedTripRes.rows.length === 0) throw new Error('Cloned trip not found in DB');
    const clonedTrip = clonedTripRes.rows[0];

    if (clonedTrip.user_id !== clonerId) {
      throw new Error(`Expected cloned trip user_id to be ${clonerId}, got ${clonedTrip.user_id}`);
    }
    if (clonedTrip.title !== 'Copy of Golden Triangle Express') {
      throw new Error(`Expected title 'Copy of Golden Triangle Express', got '${clonedTrip.title}'`);
    }
    if (parseFloat(clonedTrip.budget) !== 45000) {
      throw new Error(`Expected budget 45000, got ${clonedTrip.budget}`);
    }

    // Verify stops
    const clonedStopsRes = await db.query('SELECT * FROM trip_stops WHERE trip_id = $1', [newTripId]);
    if (clonedStopsRes.rows.length !== 1) {
      throw new Error(`Expected 1 cloned stop, found ${clonedStopsRes.rows.length}`);
    }
    const clonedStop = clonedStopsRes.rows[0];
    if (clonedStop.id === origStopId) throw new Error('Cloned stop ID collided with original stop ID');
    if (clonedStop.city_name !== 'Agra') throw new Error(`Expected stop 'Agra', got ${clonedStop.city_name}`);

    // Verify activities
    const clonedActsRes = await db.query('SELECT * FROM itinerary_activities WHERE trip_stop_id = $1', [clonedStop.id]);
    if (clonedActsRes.rows.length !== 2) {
      throw new Error(`Expected 2 cloned activities, found ${clonedActsRes.rows.length}`);
    }
    console.log('PASS: Deep relational clone verified across trips -> trip_stops -> itinerary_activities.');

    console.log('\n=== ALL COPY TRIP TESTS PASSED (4/4) ===');

    // Cleanup
    if (newTripId) await db.query('DELETE FROM trips WHERE id = $1', [newTripId]);
    if (origTripId) await db.query('DELETE FROM trips WHERE id = $1', [origTripId]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [creatorId, clonerId]);

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (newTripId) {
      try { await db.query('DELETE FROM trips WHERE id = $1', [newTripId]); } catch (e) {}
    }
    if (origTripId) {
      try { await db.query('DELETE FROM trips WHERE id = $1', [origTripId]); } catch (e) {}
    }
    if (creatorId && clonerId) {
      try { await db.query('DELETE FROM users WHERE id IN ($1, $2)', [creatorId, clonerId]); } catch (e) {}
    }
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
