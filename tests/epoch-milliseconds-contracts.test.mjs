import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { buildFormFields, createStorefront } from "../dist/storefront.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const knownInstant = 1_704_164_645_678;
const apiUrl = "https://api.time-contract.test";
const publishableKey = `arky_pk_${"e".repeat(42)}A`;
const adminKey = `arky_admin_session:${apiUrl}`;
const storeId = "8e2c6a14-3f97-4b05-9d1e-7a4c0b8f2e63";
const sessionId = "2a9d4f71-6c3b-4e85-b0f7-1d8e5c3a9b26";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function browserStorage(context, storage) {
  const browser = Object.assign(new EventTarget(), { localStorage: storage });
  for (const [key, value] of [["window", browser], ["localStorage", storage]]) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    context.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else delete globalThis[key];
    });
  }
}

function adminSession(expiresAt) {
  return {
    id: sessionId,
    scope: { type: "account" },
    access_token: "account-access",
    refresh_token: "account-refresh",
    access_expires_at: expiresAt,
    email: "operator@example.test",
  };
}

function refreshedSession(now) {
  return {
    ...adminSession(now + 60_001),
    access_token: "refreshed-access",
    refresh_token: "refreshed-refresh",
    refresh_expires_at: now + 120_000,
    authenticated_at: now,
    created_at: now,
    updated_at: now,
  };
}

function customerSession(instant) {
  return {
    version: 2,
    customer: {
      id: "customer-time",
      status: { type: "active" },
      identities: [],
      categories: [],
      created_at: instant,
      updated_at: instant,
    },
    session: {
      id: "session-time",
      customer_id: "customer-time",
      type: "visitor",
      token: "customer_visitor_time",
      status: { type: "active" },
      expires_at: instant,
    },
  };
}

function customerKey() {
  let key;
  createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: {
      getItem(value) { key = value; return null; },
      setItem() {},
      removeItem() {},
    },
  });
  assert.match(key, /^arky_customer_session:v2:/);
  return key;
}

test("auth cutover ignores old-unit namespaces without changing durable effect requests", (context) => {
  const storage = new MemoryStorage();
  browserStorage(context, storage);
  storage.seed("arky_admin_session", JSON.stringify(adminSession(knownInstant)));
  storage.seed("arky_admin_session:v2", JSON.stringify({ version: 2, session: adminSession(knownInstant) }));
  storage.seed(customerKey().replace(":v2:", ":v1:"), JSON.stringify({ ...customerSession(1_700_000_000), version: 1 }));
  const durableKey = "arky:audience-checkout:v1:pending-request";
  storage.seed(durableKey, JSON.stringify({ requestId: "frozen-id", payload: { amount: 200 } }));
  const before = [...storage.values];
  context.mock.method(globalThis, "fetch", () => { throw new Error("No network during initialization"); });
  const admin = createAdmin({ baseUrl: apiUrl, market: "us" });
  const customer = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
  assert.equal(admin.session, null);
  assert.equal(customer.session, null);
  assert.deepEqual([...storage.values], before);
});

test("new auth storage preserves signed and early-epoch milliseconds without guessing", (context) => {
  const storage = new MemoryStorage();
  browserStorage(context, storage);
  const key = customerKey();
  for (const instant of [-1, 0, 1, 1_700_000_000, knownInstant]) {
    storage.seed(adminKey, JSON.stringify(adminSession(instant)));
    const record = customerSession(instant);
    storage.seed(key, JSON.stringify(record));
    const admin = createAdmin({ baseUrl: apiUrl, market: "us" });
    assert.equal(admin.isAuthenticated, true);
    assert.deepEqual(admin.session, { id: sessionId, email: "operator@example.test", scope: { type: "account" } });
    assert.equal(JSON.parse(storage.getItem(adminKey)).access_expires_at, instant);
    const storefront = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
    assert.equal(storefront.session.customer.created_at, instant);
    assert.equal(JSON.parse(storage.getItem(key)).session.expires_at, instant);
  }
});

test("new auth storage rejects wrong envelopes and non-integer or unsafe instants", (context) => {
  const storage = new MemoryStorage();
  browserStorage(context, storage);
  const key = customerKey();
  for (const instant of [0.5, -0.5, Number.MAX_SAFE_INTEGER + 1, "1704164645678", null]) {
    storage.seed(adminKey, JSON.stringify(adminSession(instant)));
    storage.seed(key, JSON.stringify(customerSession(instant)));
    assert.equal(createAdmin({ baseUrl: apiUrl, market: "us" }).session, null);
    assert.equal(createStorefront(publishableKey, { apiUrl, sessionStorage: storage }).session, null);
  }
  for (const version of [undefined, 1, 3]) {
    storage.seed(adminKey, JSON.stringify({ version, session: adminSession(knownInstant) }));
    storage.seed(key, JSON.stringify({ ...customerSession(knownInstant), version }));
    assert.equal(createAdmin({ baseUrl: apiUrl, market: "us" }).session, null);
    assert.equal(createStorefront(publishableKey, { apiUrl, sessionStorage: storage }).session, null);
  }
  for (const id of [undefined, "", "session-time", sessionId.toUpperCase()]) {
    storage.seed(adminKey, JSON.stringify({ ...adminSession(knownInstant), id }));
    assert.equal(createAdmin({ baseUrl: apiUrl, market: "us" }).session, null);
  }
});

test("Account expiry compares exact milliseconds including zero and the deadline itself", async (context) => {
  const storage = new MemoryStorage();
  browserStorage(context, storage);
  let now = knownInstant;
  context.mock.method(Date, "now", () => now);
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ path: new URL(url).pathname, authorization: new Headers(init.headers).get("authorization") });
    if (String(url).endsWith("/v1/auth/refresh")) {
      assert.deepEqual(JSON.parse(init.body), { refresh_token: "account-refresh" });
      return jsonResponse(refreshedSession(now));
    }
    return jsonResponse({ id: storeId });
  });
  for (const [clock, expiry, shouldRefresh] of [
    [knownInstant, knownInstant + 1, false],
    [knownInstant, knownInstant, true],
    [knownInstant, knownInstant - 1, true],
    [0, 0, true],
    [-1, 0, false],
    [1_700_000_000, 1_700_000_001, false],
  ]) {
    now = clock;
    calls.length = 0;
    storage.seed(adminKey, JSON.stringify(adminSession(expiry)));
    const admin = createAdmin({ baseUrl: apiUrl, market: "us" });
    await admin.store.get({ id: storeId });
    assert.equal(calls.length, shouldRefresh ? 2 : 1);
    assert.equal(calls.at(-1).path, `/v1/stores/${storeId}`);
    assert.equal(calls.at(-1).authorization, `Bearer ${shouldRefresh ? "refreshed-access" : "account-access"}`);
    const stored = JSON.parse(storage.getItem(adminKey));
    assert.equal(stored.access_expires_at, shouldRefresh ? clock + 60_001 : expiry);
    assert.equal(stored.id, sessionId);
    if (shouldRefresh) assert.equal(calls[0].authorization, null);
  }
});

test("invalid refreshed expiry fails closed before the protected request", async (context) => {
  const storage = new MemoryStorage();
  browserStorage(context, storage);
  context.mock.method(Date, "now", () => knownInstant);
  const retained = JSON.stringify(adminSession(knownInstant));
  storage.seed(adminKey, retained);
  const calls = [];
  let reply = () => jsonResponse({ ...refreshedSession(knownInstant), access_expires_at: knownInstant + 0.5 });
  context.mock.method(globalThis, "fetch", async (url) => {
    calls.push(String(url));
    return reply();
  });
  const admin = createAdmin({ baseUrl: apiUrl, market: "us" });
  await assert.rejects(admin.store.get({ id: storeId }), /invalid credentials/);
  assert.deepEqual(calls, [`${apiUrl}/v1/auth/refresh`]);
  assert.equal(storage.getItem(adminKey), retained);
  reply = () => jsonResponse({ ...refreshedSession(knownInstant), id: "5f0c3e82-9a14-4d76-b2e8-6c1a7d9f4b30" });
  await assert.rejects(admin.store.get({ id: storeId }), /invalid credentials/);
  assert.equal(storage.getItem(adminKey), retained);
  reply = () => jsonResponse({ message: "Session revoked", statusCode: 401 }, 401);
  await assert.rejects(admin.store.get({ id: storeId }), (error) => error.statusCode === 401);
  assert.deepEqual(calls, Array(3).fill(`${apiUrl}/v1/auth/refresh`));
  assert.equal(storage.getItem(adminKey), null);
  assert.equal(admin.isAuthenticated, false);
});

test("request duration uses monotonic milliseconds independently of wall-clock movement", async (context) => {
  let monotonic = 100;
  let wallClock = knownInstant;
  context.mock.method(performance, "now", () => monotonic);
  context.mock.method(Date, "now", () => wallClock);
  context.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(init.method, "PUT");
    monotonic = 107.25;
    wallClock -= 60_000;
    return jsonResponse({ id: "store" });
  });
  const admin = createAdmin({ baseUrl: apiUrl, market: "us", apiToken: "token" });
  let duration;
  await admin.store.update({ id: storeId, name: "Time contract" }, { onSuccess(result) { duration = result.duration_ms; } });
  assert.equal(duration, 7.25);
});

test("Form date values use exact checked milliseconds while ordinary numbers remain numbers", () => {
  const schema = [
    { id: "date", key: "appointment", type: "date", required: true },
    { id: "number", key: "quantity", type: "number", required: true },
  ];
  for (const value of [-1, 0, 1_700_000_000, knownInstant]) {
    const fields = buildFormFields(schema, { appointment: value, quantity: 1.5 });
    assert.equal(fields[0].value, value);
    assert.equal(fields[1].value, 1.5);
  }
  for (const value of [0.5, Number.MAX_SAFE_INTEGER + 1, "2024-01-02", "1704164645678"]) {
    assert.throws(() => buildFormFields(schema, { appointment: value, quantity: 1.5 }), /epoch milliseconds/);
  }
});
