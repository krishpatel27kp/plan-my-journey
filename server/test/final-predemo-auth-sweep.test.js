/**
 * Final Pre-Demo Sweep: Auth Pillar Complete Verification
 */

const assert = require('assert');
const http = require('http');
const app = require('../app');
const { verifyToken } = require('../utils/auth');

async function runFinalPreDemoAuthSweep() {
  console.log("\n============================================================");
  console.log(" 🎯 FINAL PRE-DEMO SWEEP: AUTH PILLAR VERIFICATION");
  console.log("============================================================\n");

  const unhandledErrors = [];
  const server500Errors = [];

  const originalConsoleError = console.error;
  console.error = (...args) => {
    const msg = args.join(' ');
    if (!msg.includes('ExperimentalWarning')) {
      unhandledErrors.push(msg);
    }
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

  let demoToken = '';
  let demoUserId = '';
  const demoEmail = `demo_presenter_${Date.now()}@journey.com`;
  const initialName = 'Alex Mercer';
  const updatedName = 'Alex Mercer, Lead Explorer';
  const updatedAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';

  // 1. Clean Session Registration (Pillar A)
  await check(1, "Clean Session: Register new presenter account via POST /api/auth/register", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: initialName,
        email: demoEmail,
        password: 'DemoMasterPassword2026!'
      })
    });

    if (res.status >= 500) server500Errors.push(`Registration returned ${res.status}`);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.token, 'Token missing in register response');
    assert.ok(data.id, 'User ID missing in register response');
    assert.strictEqual(data.name, initialName);
    assert.strictEqual(data.email, demoEmail.toLowerCase());

    demoToken = data.token;
    demoUserId = data.id;
  });

  // 2. JWT Expiration Lifetime Verification (8h demo resilience)
  await check(2, "Demo Resilience: Verify JWT_EXPIRES_IN is 8h (28,800s) to guarantee no expiry mid-demo", async () => {
    const decoded = verifyToken(demoToken);
    assert.strictEqual(decoded.userId, demoUserId);
    assert.strictEqual(decoded.email, demoEmail.toLowerCase());
    
    const tokenLifetimeSeconds = decoded.exp - decoded.iat;
    assert.strictEqual(tokenLifetimeSeconds, 28800, `Expected 28,800s (8h), got ${tokenLifetimeSeconds}s`);
    
    const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
    assert.ok(remainingSeconds > 28000, `Remaining lifetime should be ~8 hours, got ${remainingSeconds}s`);
  });

  // 3. Authenticated Dashboard Load (Pillars A & B)
  await check(3, "Dashboard Initial Load: GET /api/trips with Bearer token returns 200 OK (0 trips, zero 500s)", async () => {
    const res = await fetch(`${baseUrl}/api/trips`, {
      headers: { Authorization: `Bearer ${demoToken}` }
    });

    if (res.status >= 500) server500Errors.push(`GET /api/trips returned ${res.status}`);
    assert.strictEqual(res.status, 200);
    const trips = await res.json();
    assert.ok(Array.isArray(trips));
    assert.strictEqual(trips.length, 0);
  });

  // 4. Authenticated Profile Fetch (Pillar A)
  await check(4, "Profile Load: GET /api/users/me returns 200 with current user profile", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${demoToken}` }
    });

    if (res.status >= 500) server500Errors.push(`GET /api/users/me returned ${res.status}`);
    assert.strictEqual(res.status, 200);
    const profile = await res.json();
    assert.strictEqual(profile.id, demoUserId);
    assert.strictEqual(profile.name, initialName);
    assert.strictEqual(profile.email, demoEmail.toLowerCase());
  });

  // 5. Profile Edit & Persistence (Pillar A)
  await check(5, "Profile Update: PUT /api/users/me updates name & image and persists on reload", async () => {
    // 5a. Update Profile
    const putRes = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoToken}`
      },
      body: JSON.stringify({
        name: updatedName,
        profileImage: updatedAvatar
      })
    });

    if (putRes.status >= 500) server500Errors.push(`PUT /api/users/me returned ${putRes.status}`);
    assert.strictEqual(putRes.status, 200);
    const updated = await putRes.json();
    assert.strictEqual(updated.name, updatedName);
    assert.strictEqual(updated.profileImage, updatedAvatar);

    // 5b. Reload Profile
    const reloadRes = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    assert.strictEqual(reloadRes.status, 200);
    const reloaded = await reloadRes.json();
    assert.strictEqual(reloaded.name, updatedName);
    assert.strictEqual(reloaded.profileImage, updatedAvatar);
  });

  // 6. Session Termination / Logout Protection (Pillar A)
  await check(6, "Session Termination: Cleared token immediately blocks access with 401 UNAUTHORIZED", async () => {
    const resTrips = await fetch(`${baseUrl}/api/trips`);
    assert.strictEqual(resTrips.status, 401);
    const tripsErr = await resTrips.json();
    assert.strictEqual(tripsErr?.error?.code, 'UNAUTHORIZED');

    const resProfile = await fetch(`${baseUrl}/api/users/me`);
    assert.strictEqual(resProfile.status, 401);
    const profileErr = await resProfile.json();
    assert.strictEqual(profileErr?.error?.code, 'UNAUTHORIZED');
  });

  // 7. Server Health & Error Log Audit
  await check(7, "Zero 500 Server Errors & Zero Unhandled Exceptions across the entire auth lifecycle", async () => {
    assert.strictEqual(server500Errors.length, 0, `Detected 500 errors: ${server500Errors.join(', ')}`);
    assert.strictEqual(unhandledErrors.length, 0, `Detected unhandled errors: ${unhandledErrors.join(', ')}`);
  });

  await new Promise((resolve) => server.close(resolve));
  console.error = originalConsoleError;

  console.log(`\n============================================================`);
  console.log(` 🎯 PRE-DEMO AUTH SWEEP: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runFinalPreDemoAuthSweep();
}

module.exports = { runFinalPreDemoAuthSweep };
