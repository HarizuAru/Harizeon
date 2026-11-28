import { test } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.HARIZEON_WEB_URL || "http://localhost:3000";

async function getDemoCookie() {
  const res = await fetch(`${BASE_URL}/api/demo-login`, { redirect: "manual" });
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/hz_session=[^;]+/);
  return { status: res.status, location: res.headers.get("location"), cookie: match ? match[0] : "" };
}

test("Public pages load fast with clean titles and semantic headings", async () => {
  const publicRoutes = ["/", "/login", "/signup", "/pricing", "/docs", "/security", "/scanner", "/status"];
  for (const route of publicRoutes) {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}${route}`);
    const elapsed = Date.now() - start;
    assert.equal(res.status, 200, `${route} should return HTTP 200`);
    assert.ok(elapsed < 5000, `${route} took ${elapsed}ms (> 5000ms)`);

    const html = await res.text();
    assert.ok(!html.includes("Harizeon · Harizeon"), `${route} must not have duplicate brand in <title>`);
    assert.ok(html.includes("<h1"), `${route} should contain an accessible <h1> heading`);
  }
});

test("1-Click Demo Login sets session cookie and redirects to dashboard", async () => {
  const demo = await getDemoCookie();
  assert.ok(demo.status >= 300 && demo.status < 400, `Expected redirect, got ${demo.status}`);
  assert.ok(demo.location?.includes("/dashboard"), `Expected redirect to /dashboard, got ${demo.location}`);
  assert.ok(demo.cookie.startsWith("hz_session="), "Expected hz_session cookie to be set");
});

test("Authenticated console pages render cleanly with zero undefined/NaN values or competitor jargon", async () => {
  const { cookie } = await getDemoCookie();
  assert.ok(cookie, "Need demo cookie for authenticated UX checks");

  const routes = [
    "/dashboard",
    "/assets",
    "/scans/new",
    "/findings",
    "/compliance",
    "/drift",
    "/settings",
    "/settings/ci-cd",
  ];

  for (const route of routes) {
    const res = await fetch(`${BASE_URL}${route}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200, `${route} should return HTTP 200 when authenticated`);
    const html = await res.text();

    // Never expose raw 'undefined THREATS' or malformed percentage like ': %'
    assert.ok(!html.includes("undefined THREATS"), `${route} rendered undefined threat count`);
    assert.ok(!html.includes("Fleet Immunity:</span><span class=\"font-mono text-xs font-bold text-ink\">%"), `${route} rendered empty immunity %`);
    assert.ok(!html.includes("Intruder-Class"), `${route} leaked internal competitor label`);
    assert.ok(!html.includes("Detectify / Intruder"), `${route} leaked internal competitor label`);
    assert.ok(!html.includes("Probely-grade"), `${route} leaked internal competitor label`);
  }
});

test("Dashboard, Scan Form, Assets, and CI/CD expose key developer-friendly UX workflows", async () => {
  const { cookie } = await getDemoCookie();

  const dashHtml = await (await fetch(`${BASE_URL}/dashboard`, { headers: { Cookie: cookie } })).text();
  assert.ok(dashHtml.includes("Emerging Threat Radar"), "Dashboard should show Emerging Threat Radar");
  assert.ok(dashHtml.includes("TEST FLEET NOW"), "Dashboard should have 1-click rapid fleet check");
  assert.ok(dashHtml.includes("-translate-x-full lg:translate-x-0"), "Console sidebar must collapse off-canvas on mobile");

  const scanHtml = await (await fetch(`${BASE_URL}/scans/new`, { headers: { Cookie: cookie } })).text();
  assert.ok(scanHtml.includes("OpenAPI/Swagger"), "New Scan form should highlight API schema auditing");
  assert.ok(scanHtml.includes("Legal Authorization Warranty"), "New Scan form should display authorization warranty");

  const assetsHtml = await (await fetch(`${BASE_URL}/assets`, { headers: { Cookie: cookie } })).text();
  assert.ok(assetsHtml.includes("CLOUDFLARE / ROUTE53 IMPORT"), "Assets page should expose bulk DNS import");

  const cicdHtml = await (await fetch(`${BASE_URL}/settings/ci-cd`, { headers: { Cookie: cookie } })).text();
  assert.ok(cicdHtml.includes("GitHub Actions"), "CI/CD page should offer GitHub Actions workflow");
  assert.ok(cicdHtml.includes("tools/ci-gate.mjs"), "CI/CD page should reference CLI quality gate");
});
