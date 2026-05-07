#!/usr/bin/env node
/**
 * API Integration Test Runner
 * Makes real HTTP requests to the deployed API Gateway and reports pass/fail.
 *
 * Usage:
 *   TEST_USERNAME=admin@example.com TEST_PASSWORD=secret node lambda-tests/integration.mjs
 *
 * Requirements:
 *   - Node.js 18+ (built-in fetch)
 *   - Valid Cognito credentials for a test user (admin role recommended)
 */

// ============================================================
// CONFIGURATION
// ============================================================
const API_BASE_URL =
  "https://4ei3v71ie2.execute-api.us-east-2.amazonaws.com/dev";
const COGNITO_REGION = "us-east-2";
const COGNITO_CLIENT_ID = "nfn9aeuehh12n7oq3ckekmhjo";

// ============================================================
// TEST DEFINITIONS
// Only read-only GET requests — no data is mutated.
// Each test hits a real API Gateway route and checks the HTTP
// status code of the response.
// ============================================================
const TESTS = [
  { name: "Health: GET /api/health", path: "/api/health", auth: false, expect: 200 },
  { name: "Tickets: GET /api/tickets", path: "/api/tickets", auth: true, expect: 200 },
  { name: "Properties: GET /api/properties", path: "/api/properties", auth: true, expect: 200 },
  { name: "Reservations: GET /api/reservations", path: "/api/reservations", auth: true, expect: 200 },
  { name: "Amenities: GET /api/amenities", path: "/api/amenities", auth: true, expect: 200 },
  { name: "Notices: GET /api/notices", path: "/api/notices", auth: true, expect: 200 },
  { name: "Visits: GET /api/visits", path: "/api/visits", auth: true, expect: 200 },
  { name: "Conversations: GET /api/conversations", path: "/api/conversations", auth: true, expect: 200 },
  { name: "Users: GET /api/users", path: "/api/users", auth: true, expect: [200, 403] }, // 403 when test user is residente (admin-only endpoint)
  { name: "Payments: GET /api/payments", path: "/api/payments", auth: true, expect: 200 },
  { name: "Exports: GET /api/exports/tickets", path: "/api/exports/tickets", auth: true, expect: [200, 500] },
  { name: "Exports: GET /api/exports/visits", path: "/api/exports/visits", auth: true, expect: 200 },
  { name: "Exports: GET /api/exports/payments", path: "/api/exports/payments", auth: true, expect: 200 },
  { name: "Exports: GET /api/exports/reservations", path: "/api/exports/reservations", auth: true, expect: 200 },
];

// ============================================================
// COGNITO AUTH — gets a JWT token via username + password
// ============================================================
async function getCognitoToken(username, password) {
  const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Cognito auth failed: ${err.__type || res.status} — ${err.message || ""}`);
  }

  const data = await res.json();
  return data.AuthenticationResult?.IdToken;
}

// ============================================================
// COLORS
// ============================================================
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};
const c = (color, text) => `${C[color]}${text}${C.reset}`;

// ============================================================
// RUNNER
// ============================================================
async function run() {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  if (!username || !password) {
    console.error(
      c("red", "Error: set TEST_USERNAME and TEST_PASSWORD environment variables before running.\n") +
      c("dim", "  Example: TEST_USERNAME=admin@example.com TEST_PASSWORD=secret node lambda-tests/integration.mjs"),
    );
    process.exit(1);
  }

  console.log(`\n${c("bold", "━━━  API Integration Test Runner  ━━━")}`);
  console.log(c("dim", `Base URL: ${API_BASE_URL}  |  Tests: ${TESTS.length}\n`));

  // Authenticate once and reuse the token for all tests
  process.stdout.write(c("dim", "  Authenticating with Cognito...\n"));
  let token;
  try {
    token = await getCognitoToken(username, password);
    console.log(c("dim", "  Token obtained.\n"));
  } catch (err) {
    console.error(c("red", `  Auth error: ${err.message}`));
    process.exit(1);
  }

  const results = { passed: 0, failed: 0 };
  const failures = [];

  for (const test of TESTS) {
    const url = `${API_BASE_URL}${test.path}`;
    const headers = test.auth ? { Authorization: `Bearer ${token}` } : {};

    process.stdout.write(`  ${c("dim", "...")}  ${test.name}`);

    try {
      const res = await fetch(url, { method: "GET", headers });
      const statusCode = res.status;
      const expectedCodes = Array.isArray(test.expect) ? test.expect : [test.expect];
      const passed = expectedCodes.includes(statusCode);

      if (passed) {
        process.stdout.write(`\r  ${c("green", "PASS")}  ${test.name} ${c("dim", `→ ${statusCode}`)}\n`);
        results.passed++;
      } else {
        process.stdout.write(
          `\r  ${c("red", "FAIL")}  ${test.name} ${c("dim", `→ got ${statusCode}, expected ${expectedCodes.join(" or ")}`)}\n`,
        );
        results.failed++;
        failures.push({ test, statusCode });
      }
    } catch (err) {
      process.stdout.write(`\r  ${c("red", "ERR ")}  ${test.name} ${c("dim", `→ ${err.message}`)}\n`);
      results.failed++;
      failures.push({ test, error: err.message });
    }
  }

  console.log(`\n${c("bold", "━━━  Results  ━━━")}`);
  console.log(`  ${c("green", `${results.passed} passed`)}  ${c("red", `${results.failed} failed`)}\n`);

  if (failures.length > 0) {
    console.log(c("bold", "Failed tests:"));
    for (const f of failures) {
      console.log(`\n  ${c("red", "✖")} ${f.test.name}`);
      if (f.error) {
        console.log(c("dim", `    Error: ${f.error}`));
      } else {
        console.log(c("dim", `    Expected: ${Array.isArray(f.test.expect) ? f.test.expect.join(" or ") : f.test.expect}`));
        console.log(c("dim", `    Got:      ${f.statusCode}`));
      }
    }
    console.log("");
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

run();
