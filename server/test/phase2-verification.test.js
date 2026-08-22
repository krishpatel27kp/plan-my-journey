/**
 * Phase 2: Auth, Dashboard & Profile Automated Verification Suite
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const { verifyToken } = require('../utils/auth');

async function runPhase2Tests() {
  console.log("\n============================================================");
  console.log(" 🚀 PHASE 2 VERIFICATION: AUTH, DASHBOARD & PROFILE");
  console.log("============================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  async function test(num, title, fn) {
    try {
      await fn();
      console.log(`  [PASS] Check #${num}: ${title}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] Check #${num}: ${title}`, err.message || err);
      failed++;
    }
  }

  let testUserToken = '';
  let testUserId = '';
  const testEmail = `phase2_user_${Date.now()}@journey.com`;
  const initialName = 'Sarah Jenkins';

  // 1. Register -> Land on dashboard -> GET /api/trips with real token
  await test(1, "Register -> Dashboard calls GET /api/trips with real Bearer token (returns 200 & empty list)", async () => {
    // 1a. Register
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: initialName,
        email: testEmail,
        password: 'SecurePassword123!'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    assert.ok(regData.token);
    assert.strictEqual(regData.name, initialName);
    testUserToken = regData.token;
    testUserId = regData.id;

    // 1b. Dashboard loads trips
    const tripsRes = await fetch(`${baseUrl}/api/trips`, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    assert.strictEqual(tripsRes.status, 200);
    const tripsData = await tripsRes.json();
    assert.ok(Array.isArray(tripsData));
    assert.strictEqual(tripsData.length, 0, 'New user starts with 0 trips');
  });

  // 2. Logout / Clear Token -> Dashboard redirects / returns 401 UNAUTHORIZED
  await test(2, "Logged out state / Missing token returns 401 UNAUTHORIZED (Dashboard redirects to login)", async () => {
    // Unauthenticated GET /api/trips
    const resNoToken = await fetch(`${baseUrl}/api/trips`);
    assert.strictEqual(resNoToken.status, 401);
    const noTokenData = await resNoToken.json();
    assert.strictEqual(noTokenData?.error?.code, 'UNAUTHORIZED');

    // Unauthenticated GET /api/users/me
    const resNoAuthMe = await fetch(`${baseUrl}/api/users/me`);
    assert.strictEqual(resNoAuthMe.status, 401);
  });

  // 3. Edit profile name & avatar URL -> Save -> Persisted on reload via GET /api/users/me
  await test(3, "Edit profile name & image on Settings screen -> Persisted via GET /api/users/me", async () => {
    const updatedName = 'Sarah Jenkins, PhD';
    const updatedImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';

    // 3a. PUT /api/users/me
    const putRes = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`
      },
      body: JSON.stringify({
        name: updatedName,
        profileImage: updatedImage
      })
    });
    assert.strictEqual(putRes.status, 200);
    const putData = await putRes.json();
    assert.strictEqual(putData.name, updatedName);
    assert.strictEqual(putData.profileImage, updatedImage);

    // 3b. GET /api/users/me (simulating page reload)
    const getRes = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    assert.strictEqual(getData.id, testUserId);
    assert.strictEqual(getData.name, updatedName);
    assert.strictEqual(getData.profileImage, updatedImage);
  });

  // 4. Invalid profile update (empty name) -> Caught by server validation
  await test(4, "Invalid profile update (empty name) -> Server rejects with 400 VALIDATION_ERROR", async () => {
    const putInvalid = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`
      },
      body: JSON.stringify({
        name: '   '
      })
    });
    assert.strictEqual(putInvalid.status, 400);
    const errData = await putInvalid.json();
    assert.strictEqual(errData?.error?.code, 'VALIDATION_ERROR');
    assert.strictEqual(errData?.error?.message, 'Name cannot be empty');
  });

  // 5. Hardcoded stub tokens rejected
  await test(5, "Legacy stub tokens are strictly rejected by real auth middleware (401)", async () => {
    const legacyStub = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYWFhYWFhYS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InRlc3RAdHJhdmVsZXIuY29tIiwiaWF0IjoxNzAwMDAwMDAwfQ.stub_test_signature_plan_my_journey_2026';
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${legacyStub}` }
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, 'UNAUTHORIZED');
  });

  await new Promise((resolve) => server.close(resolve));

  console.log(`\n============================================================`);
  console.log(` 🎯 PHASE 2 RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase2Tests();
}

module.exports = { runPhase2Tests };
