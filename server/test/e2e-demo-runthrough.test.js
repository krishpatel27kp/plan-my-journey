/**
 * End-to-End Complete User Journey Run-Through: Demo Simulation
 * 
 * Flow:
 * 1. Signup (Pillar A)
 * 2. Profile / Settings (Pillar A)
 * 3. Dashboard (Pillars A & B)
 * 4. Create Trip (Pillar B)
 * 5. Build Itinerary: City Discovery & Stops (Pillars B & C)
 * 6. Budget Calculation (Pillar B)
 * 7. Share Trip & Public Read-Only View (Pillar C)
 * 8. Second User Signup & Copy Trip Flow (Pillars A & C)
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const { verifyToken } = require('../utils/auth');

async function runDemoSimulation() {
  console.log("\n============================================================");
  console.log(" 🎭 FULL DEMO SIMULATION: END-TO-END USER JOURNEY RUN-THROUGH");
  console.log("============================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  async function step(num, title, fn) {
    try {
      await fn();
      console.log(`  ✅ Step ${num}: ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ Step ${num}: ${title}`, err.message || err);
      failed++;
    }
  }

  let mayaToken = '';
  let mayaUserId = '';
  let tripId = '';
  let shareToken = '';
  let carlosToken = '';
  let carlosUserId = '';
  let clonedTripId = '';
  let selectedCityId = '';

  // STEP 1: Signup User 1 (Maya Lin)
  await step(1, "Signup (Pillar A) - POST /api/auth/register", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maya Lin',
        email: `maya_${Date.now()}@demo.com`,
        password: 'secureDemoPassword2026!'
      })
    });

    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.id, 'User ID missing');
    assert.strictEqual(data.name, 'Maya Lin');
    assert.ok(data.token, 'JWT token missing');
    
    // Check JWT payload integrity
    const decoded = verifyToken(data.token);
    assert.strictEqual(decoded.userId, data.id);
    assert.ok(decoded.exp > decoded.iat, 'Token expiration must be in future');

    mayaToken = data.token;
    mayaUserId = data.id;
  });

  // STEP 2: Profile Fetch & Avatar Update
  await step(2, "Profile/Settings (Pillar A) - GET & PUT /api/users/me", async () => {
    // 2a. Fetch Profile
    const getRes = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${mayaToken}` }
    });
    assert.strictEqual(getRes.status, 200);
    const profile = await getRes.json();
    assert.strictEqual(profile.id, mayaUserId);
    assert.strictEqual(profile.name, 'Maya Lin');

    // 2b. Update Profile Image
    const putRes = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mayaToken}`
      },
      body: JSON.stringify({
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
      })
    });
    assert.strictEqual(putRes.status, 200);
    const updated = await putRes.json();
    assert.strictEqual(updated.profileImage, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb');
  });

  // STEP 3: Dashboard View (Empty Initial State)
  await step(3, "Dashboard (Pillars A & B) - GET /api/trips (Initial load)", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      headers: { Authorization: `Bearer ${mayaToken}` }
    });
    assert.strictEqual(res.status, 200);
    const trips = await res.json();
    assert.ok(Array.isArray(trips));
    assert.strictEqual(trips.length, 0, 'Maya should have 0 trips initially');
  });

  // STEP 4: Create Trip
  await step(4, "Create Trip (Pillar B) - POST /api/trips", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mayaToken}`
      },
      body: JSON.stringify({
        title: 'Euro Tour 2026',
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        budget: 75000,
        description: 'Two weeks across Western Europe'
      })
    });

    assert.strictEqual(res.status, 201);
    const trip = await res.json();
    assert.ok(trip.id);
    assert.strictEqual(trip.title, 'Euro Tour 2026');
    assert.strictEqual(trip.userId, mayaUserId);
    assert.strictEqual(Number(trip.budget), 75000);

    tripId = trip.id;
  });

  // STEP 5: Build Itinerary (Discovery & Add Stops)
  await step(5, "Build Itinerary (Pillars B & C) - City Discovery & Add Stops", async () => {
    // 5a. Public Discovery (Pillar C)
    const citiesRes = await fetch(`${baseUrl}/api/cities?search=Paris`);
    assert.strictEqual(citiesRes.status, 200);
    const cities = await citiesRes.json();
    assert.ok(cities.length > 0, 'Should find Paris in seed catalog');
    selectedCityId = cities[0].id;

    // 5b. Add Stop to Trip (Pillar B)
    const stopRes = await fetch(`${baseUrl}/api/trips/${tripId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mayaToken}`
      },
      body: JSON.stringify({
        cityId: selectedCityId,
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        stopOrder: 1,
        notes: 'Arrive at CDG airport'
      })
    });

    assert.strictEqual(stopRes.status, 201);
    const stop = await stopRes.json();
    assert.strictEqual(stop.tripId, tripId);
    assert.strictEqual(stop.cityId, selectedCityId);
    assert.strictEqual(stop.stopOrder, 1);
  });

  // STEP 6: Budget & Itinerary Inspection
  await step(6, "Budget & Timeline Inspection (Pillar B) - GET /api/trips/:id", async () => {
    const res = await fetch(`${baseUrl}/api/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${mayaToken}` }
    });
    assert.strictEqual(res.status, 200);
    const trip = await res.json();
    assert.strictEqual(trip.id, tripId);
    assert.strictEqual(trip.userId, mayaUserId);
    assert.ok(Array.isArray(trip.stops));
    assert.strictEqual(trip.stops.length, 1);
    assert.strictEqual(Number(trip.budget), 75000);
  });

  // STEP 7: Share Trip Flow (Protected Share Creation & Anonymous Public Viewing)
  await step(7, "Share Trip (Pillar C) - POST /api/trips/:id/share & GET /api/public/trips/:token", async () => {
    // 7a. Generate Share Token (Requires Maya's Auth)
    const shareRes = await fetch(`${baseUrl}/api/trips/${tripId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mayaToken}` }
    });
    assert.strictEqual(shareRes.status, 200);
    const shareData = await shareRes.json();
    assert.ok(shareData.shareToken, 'shareToken missing');
    shareToken = shareData.shareToken;

    // 7b. Public Anonymous View (Zero Auth Required)
    const publicRes = await fetch(`${baseUrl}/api/public/trips/${shareToken}`);
    assert.strictEqual(publicRes.status, 200);
    const publicView = await publicRes.json();
    assert.ok(publicView.title);
    assert.ok(Array.isArray(publicView.stops));
  });

  // STEP 8: Second User (Carlos) Signup & Copy Trip Flow
  await step(8, "Copy Trip Flow (Pillars A & C) - Second User Signup & Clone Trip", async () => {
    // 8a. Carlos Signs Up
    const signupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Mendez',
        email: `carlos_${Date.now()}@demo.com`,
        password: 'carlosSecurePassword2026!'
      })
    });
    assert.strictEqual(signupRes.status, 201);
    const carlosData = await signupRes.json();
    carlosToken = carlosData.token;
    carlosUserId = carlosData.id;

    // 8b. Carlos Copies Maya's Shared Trip
    const copyRes = await fetch(`${baseUrl}/api/trips/${shareToken}/copy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${carlosToken}` }
    });
    assert.strictEqual(copyRes.status, 201);
    const copyData = await copyRes.json();
    assert.ok(copyData.newTripId || copyData.id);
    clonedTripId = copyData.newTripId || copyData.id;

    // 8c. Verify Cloned Trip is in Carlos's Account
    const carlosTripRes = await fetch(`${baseUrl}/api/trips/${clonedTripId}`, {
      headers: { Authorization: `Bearer ${carlosToken}` }
    });
    assert.strictEqual(carlosTripRes.status, 200);
    const carlosTrip = await carlosTripRes.json();
    assert.strictEqual(carlosTrip.userId, carlosUserId);
    assert.ok(carlosTrip.title.includes('Copy') || carlosTrip.title === 'Euro Tour 2026');

    // 8d. Verify Maya CANNOT access Carlos's cloned trip (Privacy Isolation -> 404 NOT_FOUND)
    const mayaAccessRes = await fetch(`${baseUrl}/api/trips/${clonedTripId}`, {
      headers: { Authorization: `Bearer ${mayaToken}` }
    });
    assert.strictEqual(mayaAccessRes.status, 404, `Maya must receive 404 for Carlos's trip, got ${mayaAccessRes.status}`);
  });

  await new Promise((resolve) => server.close(resolve));

  console.log(`\n============================================================`);
  console.log(` 🎯 DEMO RUN-THROUGH RESULT: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runDemoSimulation();
}

module.exports = { runDemoSimulation };
