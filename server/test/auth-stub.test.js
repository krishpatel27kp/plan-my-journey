/**
 * Phase 0 Auth Middleware Stub Verification Test
 */
const assert = require("assert");
const http = require("http");
const app = require("../app");
const { STUB_TEST_TOKEN, FAKE_USER } = require("../middleware/auth");

async function runTests() {
  console.log("\nRunning Phase 0 Auth Stub & Route Tests...\n");
  
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`, err);
      failed++;
    }
  }

  // 1. Health check
  await check("GET /health returns 200 OK", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
  });

  // 2. Protected route with NO auth header -> 401
  await check("GET /api/test-protected without token returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/test-protected`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, "UNAUTHORIZED");
    assert.ok(data?.error?.message);
  });

  // 3. Protected route with STUB token -> 200 OK
  await check("GET /api/test-protected with STUB token returns 200 and req.user", async () => {
    const res = await fetch(`${baseUrl}/api/test-protected`, {
      headers: {
        Authorization: `Bearer ${STUB_TEST_TOKEN}`
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.userId, FAKE_USER.userId);
    assert.strictEqual(data.user.email, FAKE_USER.email);
  });

  // 4. Protected route with invalid/garbage token -> 401
  await check("GET /api/test-protected with garbage token returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/test-protected`, {
      headers: {
        Authorization: "Bearer garbage-fake-token-12345"
      }
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data?.error?.code, "UNAUTHORIZED");
  });

  // 5. GET /api/users/me with STUB token -> 200 OK
  await check("GET /api/users/me with STUB token returns user profile", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${STUB_TEST_TOKEN}`
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, FAKE_USER.userId);
    assert.strictEqual(data.email, FAKE_USER.email);
  });

  // Clean up
  await new Promise((resolve) => server.close(resolve));

  console.log(`\n============================================================`);
  console.log(` Phase 0 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
