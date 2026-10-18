import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront } from "../dist/storefront.js";
import {
  SessionStorage,
  apiUrl,
  cartRecord,
  customerRecord,
  emailSession,
  errorResponse,
  idFactories,
  ids,
  otherPublishableKey,
  publishableKey,
  recordFetch,
  storedSession,
  visitorSession,
} from "./helpers/arky-fixtures.mjs";

const visitorTokenA = `customer_visitor_${"a".repeat(64)}`;
const visitorTokenB = `customer_visitor_${"b".repeat(64)}`;
const customerBuyer = { type: "customer" };

function issued(token = visitorTokenA, customerId = ids.customer, sessionId = ids.session) {
  return { customer: customerRecord(customerId), session: visitorSession(customerId, sessionId, token) };
}

function storedVisitor(token = visitorTokenA, customerId = ids.customer, sessionId = ids.session) {
  return storedSession(customerId, visitorSession(customerId, sessionId, token));
}

function sessionValues(storage) {
  return storage.keys("arky_customer_session:").map((key) => JSON.parse(storage.getItem(key)));
}

test("a stored customer session needs version 3 and the exact active status tag", () => {
  const good = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: new SessionStorage(storedVisitor()) });
  assert.equal(good.hasSession, true);
  assert.deepEqual(good.session.status, { type: "active" });
  for (const status of ["active", null, {}, { type: "revoked" }, { type: "superseded" }, { type: "active", extra: true }]) {
    const record = JSON.stringify({ version: 4, customer: customerRecord(), session: { ...visitorSession(), status } });
    const rejected = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: new SessionStorage(record) });
    assert.equal(rejected.hasSession, false);
    assert.equal(rejected.session, null);
  }
  const older = JSON.stringify({ version: 2, customer: customerRecord(), session: visitorSession() });
  assert.equal(createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: new SessionStorage(older) }).hasSession, false);
  const foreign = JSON.stringify({ version: 4, customer: customerRecord(ids.otherCustomer), session: visitorSession() });
  assert.equal(createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: new SessionStorage(foreign) }).hasSession, false);
});

test("an issued session with a malformed lifecycle is refused and never stored", async (context) => {
  for (const type of ["visitor", "email_authenticated"]) {
    for (const status of [{ type: "active" }, "active", null, { type: "revoked" }, { type: "active", extra: true }]) {
      const base = type === "visitor" ? visitorSession() : emailSession();
      recordFetch(context, () => ({ customer: customerRecord(), session: { ...base, status } }));
      const storage = new SessionStorage();
      const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage });
      if (status && typeof status === "object" && Object.keys(status).length === 1 && status.type === "active") {
        const result = await client.customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
        assert.deepEqual(result.session.status, { type: "active" });
        assert.deepEqual(client.session.status, { type: "active" });
        assert.equal(client.hasSession, true);
        assert.equal(client.isAuthenticated, type === "email_authenticated");
        assert.deepEqual(sessionValues(storage)[0].session.status, { type: "active" });
      } else {
        await assert.rejects(client.customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }), { name: "RangeError", message: "The customer session must be active and carry epoch-millisecond times" });
        assert.equal(client.session, null);
        assert.equal(storage.keys("arky_customer_session:").length, 0);
      }
      context.mock.restoreAll();
    }
  }
});

test("publishable-key initialization is synchronous, network-free and refuses every other credential", (context) => {
  const calls = recordFetch(context, () => {
    throw new Error("initialize must not fetch");
  });
  const client = createStorefront(publishableKey, idFactories);
  assert.equal(calls.length, 0);
  assert.equal(client.getLocale(), "");
  assert.equal(client.getMarket(), "");
  assert.equal("getStoreId" in client, false);
  assert.equal("forStore" in client, false);
  for (const credential of ["arky_api_private", "customer_visitor_visitor", "arky_vst_visitor", "contact_visitor", `arky_pk_${"a".repeat(43)}`, {}]) {
    assert.throws(() => createStorefront(credential, idFactories), /publishable key/i);
  }
});

test("requests use the production URL by default and force the publishable key and context headers", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const root = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, locale: "en" });
  root.setContext({ market: "bih" });
  await root.eshop.product.find(
    { limit: 1, store_id: "caller-store", market: "caller-market" },
    { headers: { Authorization: "Bearer arky_api_caller", "x-arky-publishable-key": otherPublishableKey, "x-arky-locale": "caller-locale", "x-arky-market": "caller-market" } },
  );
  await root.eshop.product.find({ limit: 1 }, { locale: "it", market: "ita" });
  assert.equal(root.getLocale(), "en");
  assert.equal(root.getMarket(), "bih");
  assert.equal(calls[0].href, "https://api.arky.io/v1/storefront/products?limit=1");
  assert.equal(calls[0].headers.get("x-arky-publishable-key"), publishableKey);
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
  assert.equal(calls[0].headers.get("x-arky-market"), "bih");
  assert.equal(calls[0].headers.get("authorization"), null);
  assert.equal(calls[1].headers.get("x-arky-locale"), "it");
  assert.equal(calls[1].headers.get("x-arky-market"), "ita");
});

test("the setup is read lazily, once, and without creating a visitor", async (context) => {
  let release;
  const response = new Promise((resolve) => {
    release = resolve;
  });
  const setup = { name: "Store", timezone: "Europe/Sarajevo", languages: ["en", "bs"], payment_options: [] };
  const calls = recordFetch(context, async (call) => {
    if (call.path !== "/v1/storefront") throw new Error(`Unexpected setup request: ${call.path}`);
    await response;
    return setup;
  });
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl });
  assert.equal(calls.length, 0);
  const first = client.getSetup();
  const second = client.getSetup();
  assert.equal("getSetup" in client.store, false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  release();
  assert.deepEqual(await first, setup);
  assert.deepEqual(await second, setup);
  assert.deepEqual(await client.getSetup(), setup);
  assert.equal(calls.length, 1);
  assert.equal(client.hasSession, false);
});

test("product text search keeps price ordering, the price range and the continuation together", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next-search-page" }));
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, market: "bih", locale: "bs" });
  const params = { query: "KOŠULJA-0001", sort_field: "price", sort_direction: "asc", price_filter: { min_amount: 0, max_amount: 5000, quantity: 1 }, limit: 20, cursor: "current-search-page" };
  assert.deepEqual(await client.eshop.product.find(params), { items: [], cursor: "next-search-page" });
  assert.equal(calls[0].query.query, params.query);
  assert.equal(calls[0].query.sort_field, "price");
  assert.equal(calls[0].query.sort_direction, "asc");
  assert.equal(calls[0].query.cursor, params.cursor);
  assert.deepEqual(JSON.parse(calls[0].query.price_filter), params.price_filter);
});

test("anonymous reads don't identify, and concurrent first stateful calls share one visitor", async (context) => {
  let identifyStarted;
  let releaseIdentify;
  const started = new Promise((resolve) => {
    identifyStarted = resolve;
  });
  const identifyGate = new Promise((resolve) => {
    releaseIdentify = resolve;
  });
  const calls = recordFetch(context, async (call) => {
    if (call.path === "/v1/storefront/products") return { items: [], cursor: null };
    if (call.path === "/v1/storefront/customer/identify") {
      identifyStarted();
      await identifyGate;
      return issued();
    }
    throw new Error(`Unexpected visitor request: ${call.path}`);
  });
  const storage = new SessionStorage();
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", market: "bih", sessionStorage: storage });
  await client.eshop.product.find({});
  assert.equal(calls.filter((call) => call.path.endsWith("/customer/identify")).length, 0);
  const first = client.eshop.cart.getCurrent({ buyer: customerBuyer, catalog_id: ids.catalog });
  const second = client.eshop.cart.getCurrent({ buyer: customerBuyer, catalog_id: ids.catalog });
  await started;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.filter((call) => call.path.endsWith("/customer/identify")).length, 1);
  releaseIdentify();
  assert.deepEqual(await Promise.all([first, second]), [null, null]);
  const identify = calls.find((call) => call.path.endsWith("/customer/identify"));
  assert.deepEqual(identify.body, { customer_id: ids.customer, session_id: ids.session });
  assert.equal(identify.headers.get("authorization"), null);
  assert.equal(calls.filter((call) => call.path.includes("/carts")).length, 0);
  const [key] = storage.keys("arky_customer_session:");
  assert.equal(storage.keys("").length, 1);
  assert.equal(key.includes(publishableKey), false);
  assert.equal(JSON.parse(storage.getItem(key)).version, 4);
  assert.equal(JSON.parse(storage.getItem(key)).session.token, visitorTokenA);
});

test("an expired visitor re-identifies once and retries, while a refused publishable key never identifies", async (context) => {
  const expiredToken = `customer_visitor_${"c".repeat(64)}`;
  let cartReads = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") return issued(visitorTokenB, ids.otherCustomer, ids.otherSession);
    if (call.path === `/v1/storefront/carts/${ids.cart}`) {
      cartReads += 1;
      return cartReads === 1 ? errorResponse(401, "CUSTOMER.SESSION_EXPIRED", "expired") : cartRecord({ customer_id: ids.otherCustomer });
    }
    throw new Error(`Unexpected retry request: ${call.path}`);
  });
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: new SessionStorage(storedVisitor(expiredToken)) });
  assert.equal((await client.eshop.cart.get({ id: ids.cart })).id, ids.cart);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${expiredToken}`],
    ["/v1/storefront/customer/identify", null],
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${visitorTokenB}`],
  ]);
  context.mock.restoreAll();
  const refused = recordFetch(context, () => errorResponse(401, "STOREFRONT.INVALID_KEY", "invalid connection"));
  const invalid = createStorefront(otherPublishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl });
  await assert.rejects(invalid.eshop.product.find({}), (error) => error.statusCode === 401);
  assert.equal(refused.filter((call) => call.path.endsWith("/customer/identify")).length, 0);
  assert.equal(refused.length, 1);
});

test("identify retries its own request once without the expired visitor token", async (context) => {
  const expiredToken = `customer_visitor_${"d".repeat(64)}`;
  const calls = recordFetch(context, (call) => {
    assert.equal(call.path, "/v1/storefront/customer/identify");
    return call.headers.get("authorization") ? errorResponse(401, "CUSTOMER.SESSION_EXPIRED", "expired") : issued(visitorTokenB, ids.otherCustomer, ids.otherSession);
  });
  const storage = new SessionStorage(storedVisitor(expiredToken));
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage });
  const result = await client.customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
  assert.equal(result.customer.id, ids.otherCustomer);
  assert.equal("token" in result, false);
  assert.deepEqual(calls.map((call) => call.headers.get("authorization")), [`Bearer ${expiredToken}`, null]);
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenB);
});

test("a late stale 401 retries with the newer visitor without replacing it", async (context) => {
  let markSecondOldRequestStarted;
  let releaseSecondOldResponse;
  const secondOldRequestStarted = new Promise((resolve) => {
    markSecondOldRequestStarted = resolve;
  });
  const secondOldResponseGate = new Promise((resolve) => {
    releaseSecondOldResponse = resolve;
  });
  let oldTokenReads = 0;
  const calls = recordFetch(context, async (call) => {
    const authorization = call.headers.get("authorization");
    if (call.path === "/v1/storefront/customer/identify") {
      assert.equal(authorization, null);
      return issued(visitorTokenB, ids.otherCustomer, ids.otherSession);
    }
    if (authorization === `Bearer ${visitorTokenA}`) {
      oldTokenReads += 1;
      if (oldTokenReads === 1) {
        await secondOldRequestStarted;
        return errorResponse(401, "CUSTOMER.SESSION_EXPIRED", "expired");
      }
      markSecondOldRequestStarted();
      await secondOldResponseGate;
      return errorResponse(401, "CUSTOMER.SESSION_EXPIRED", "expired");
    }
    return cartRecord({ customer_id: ids.otherCustomer });
  });
  const storage = new SessionStorage(storedVisitor(visitorTokenA));
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage });
  const first = client.eshop.cart.get({ id: ids.cart });
  const second = client.eshop.cart.get({ id: ids.cart });
  assert.equal((await first).id, ids.cart);
  releaseSecondOldResponse();
  assert.equal((await second).id, ids.cart);
  assert.equal(calls.filter((call) => call.path.endsWith("/customer/identify")).length, 1);
  assert.deepEqual(calls.filter((call) => call.path.includes("/carts/")).map((call) => call.headers.get("authorization")), [
    `Bearer ${visitorTokenA}`,
    `Bearer ${visitorTokenA}`,
    `Bearer ${visitorTokenB}`,
    `Bearer ${visitorTokenB}`,
  ]);
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenB);
});

test("server-side rendering allows anonymous reads but needs request-local storage for stateful calls", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const serverClient = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl });
  await serverClient.content.entry.find({ collection_id: "pages" });
  await assert.rejects(serverClient.eshop.cart.getCurrent({ buyer: customerBuyer, catalog_id: ids.catalog }), /request-local sessionStorage adapter/);
  await assert.rejects(serverClient.customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }), /request-local sessionStorage adapter/);
  assert.equal(calls.length, 1);
});

test("visitor storage is kept apart by endpoint and publishable-key fingerprint", async (context) => {
  recordFetch(context, (call) => call.headers.get("x-arky-publishable-key") === publishableKey ? issued(visitorTokenA) : issued(visitorTokenB, ids.otherCustomer, ids.otherSession));
  const storage = new SessionStorage();
  await createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage }).customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
  await createStorefront(otherPublishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage }).customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
  await createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: "https://other.example.test", sessionStorage: storage }).customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
  const keys = storage.keys("arky_customer_session:v4:");
  assert.equal(keys.length, 3);
  for (const key of keys) {
    assert.equal(key.includes(publishableKey), false);
    assert.equal(key.includes(otherPublishableKey), false);
  }
});

test("a sign-in code and refresh rotate the customer session atomically, and logout forgets it", async (context) => {
  const signInId = "3d8f1a62-7c45-4b09-9e2d-6a1c4f8b0e37";
  const customer = customerRecord(ids.customer, { type: { type: "verified", email: "person@example.com", addresses: [], default_shipping_address_id: null, default_billing_address_id: null }, profile: [{ id: ids.line, key: "name", type: "text", value: null }] });
  const authenticated = emailSession(ids.customer, ids.otherSession);
  const rotated = emailSession(ids.customer, "7e2c9b14-5a63-4d80-b1f7-3c8e0a6d2f95", {
    access_token: `customer_access_${"u".repeat(64)}`,
    refresh_token: `customer_refresh_${"v".repeat(64)}`,
  });
  const calls = recordFetch(context, (call) => {
    switch (call.path) {
      case "/v1/storefront/customer/identify":
        return issued(visitorTokenA);
      case "/v1/storefront/customer/request-code":
        return {
          customer: customerRecord(ids.customer),
          session: { id: ids.session, store_id: ids.store, customer_id: ids.customer, type: { type: "visitor", expires_at: 1_900_000_000_000, email_verification: null }, status: { type: "active" }, last_seen_at: 2, created_at: 1, updated_at: 2 },
          email_verification: { issued_at: 2, expires_at: 62 },
        };
      case "/v1/storefront/customer/verify":
        return { customer, session: authenticated };
      case "/v1/storefront/customer/refresh":
        return { customer, session: rotated };
      case "/v1/storefront/customer/me":
        return { customer: call.method === "PATCH" ? { ...customer, profile: [{ id: ids.line, key: "name", type: "text", value: "Ana" }] } : customer, session: { ...rotated, store_id: ids.store }, email_unsubscribed: false };
      case "/v1/storefront/customer/logout":
        return undefined;
      default:
        throw new Error(`Unexpected customer session request: ${call.path}`);
    }
  });
  const storage = new SessionStorage();
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage });
  await assert.rejects(client.customer.requestCode({ id: "code-1", email: "person@example.com", language: "en" }), TypeError);
  const requested = await client.customer.requestCode({ id: signInId, email: "person@example.com", language: "en" });
  assert.equal(requested.email_verification.issued_at, 2);
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
  const verified = await client.customer.verify({ code: "123456" });
  assert.equal(verified.session.id, authenticated.id);
  assert.equal(client.isAuthenticated, true);
  assert.deepEqual(client.session, { customer, id: authenticated.id, type: "email_authenticated", status: { type: "active" } });
  const refreshed = await client.customer.refresh({ session_id: rotated.id });
  assert.equal(refreshed.session.id, rotated.id);
  const stored = sessionValues(storage)[0].session;
  assert.deepEqual({ id: stored.id, access_token: stored.access_token, refresh_token: stored.refresh_token }, { id: rotated.id, access_token: rotated.access_token, refresh_token: rotated.refresh_token });
  await client.customer.getMe();
  const edited = await client.customer.updateMe({ expected_updated_at: customer.updated_at, profile: [{ id: ids.line, key: "name", type: "text", value: "Ana" }] });
  assert.equal(edited.customer.profile[0].value, "Ana");
  assert.equal(client.session.customer.profile[0].value, "Ana");
  await client.customer.logout();
  assert.equal(client.session, null);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization"), call.body]), [
    ["/v1/storefront/customer/identify", null, { customer_id: ids.customer, session_id: ids.session }],
    ["/v1/storefront/customer/request-code", `Bearer ${visitorTokenA}`, { id: signInId, email: "person@example.com", language: "en" }],
    ["/v1/storefront/customer/verify", `Bearer ${visitorTokenA}`, { session_id: ids.otherSession, code: "123456" }],
    ["/v1/storefront/customer/refresh", null, { session_id: rotated.id, refresh_token: authenticated.refresh_token }],
    ["/v1/storefront/customer/me", `Bearer ${rotated.access_token}`, null],
    ["/v1/storefront/customer/me", `Bearer ${rotated.access_token}`, { expected_updated_at: customer.updated_at, profile: [{ id: ids.line, key: "name", type: "text", value: "Ana" }] }],
    ["/v1/storefront/customer/logout", `Bearer ${rotated.access_token}`, null],
  ]);
  assert.equal(storage.keys("arky_customer_session:").length, 0);
});

test("a refused refresh keeps the signed-in session and is never retried with Authorization", async (context) => {
  const session = emailSession();
  const initialRecord = storedSession(ids.customer, session);
  let storedRecord = initialRecord;
  const storage = {
    getItem: (key) => key.startsWith("arky_customer_session:v4:") ? storedRecord : null,
    setItem: (_key, value) => {
      storedRecord = value;
    },
    removeItem: (key) => {
      if (key.startsWith("arky_customer_session:v4:")) storedRecord = null;
    },
  };
  const calls = recordFetch(context, () => errorResponse(401, "CUSTOMER_SESSION_REFRESH_REJECTED", "Refresh token rejected"));
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage });
  await assert.rejects(client.customer.refresh({ session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), /Refresh token rejected/);
  assert.deepEqual(client.session, { customer: JSON.parse(initialRecord).customer, id: session.id, type: "email_authenticated", status: { type: "active" } });
  assert.deepEqual(calls.map((call) => [call.href, call.headers.get("authorization"), call.headers.get("x-arky-publishable-key"), call.body]), [
    [`${apiUrl}/v1/storefront/customer/refresh`, null, publishableKey, { session_id: ids.otherSession, refresh_token: session.refresh_token }],
  ]);
  assert.equal(storedRecord, initialRecord);
});

test("a stored record with an invalid visitor credential is dropped at startup", () => {
  const removed = [];
  const invalid = storedSession(ids.customer, visitorSession(ids.customer, ids.session, "invalid-visitor-token"));
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
    apiUrl,
    sessionStorage: {
      getItem: (key) => key.startsWith("arky_customer_session:v4:") ? invalid : null,
      setItem() {},
      removeItem: (key) => removed.push(key),
    },
  });
  assert.equal(client.session, null);
  assert.equal(removed.some((key) => key.startsWith("arky_customer_session:v4:")), true);
});

test("a profile answer that lands after a sign-in leaves the signed-in customer alone, while the caller still gets it", async (context) => {
  const signedInCustomer = customerRecord(ids.otherCustomer, { profile: [{ id: ids.line, key: "name", type: "text", value: "Signed" }], type: { type: "verified", email: "person@example.com", addresses: [], default_shipping_address_id: null, default_billing_address_id: null } });
  const signedIn = emailSession(ids.otherCustomer, ids.otherSession);
  const answers = new Map();
  const calls = recordFetch(context, async (call) => {
    if (call.path === "/v1/storefront/customer/verify") return { customer: signedInCustomer, session: signedIn };
    if (call.path === "/v1/storefront/customer/me") {
      const gate = answers.get(call.method);
      await gate.waiting;
      return { customer: customerRecord(ids.customer, { profile: [{ id: ids.line, key: "name", type: "text", value: call.method === "PATCH" ? "Edited" : "Visitor" }] }), session: { ...visitorSession(), store_id: ids.store }, email_unsubscribed: false };
    }
    throw new Error(`Unexpected request: ${call.method} ${call.path}`);
  });
  for (const method of ["GET", "PATCH"]) {
    let release;
    const waiting = new Promise((resolve) => {
      release = resolve;
    });
    answers.set(method, { waiting, release });
  }
  const storage = new SessionStorage(storedVisitor());
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage });
  const reading = client.customer.getMe();
  const editing = client.customer.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [{ id: ids.line, key: "name", type: "text", value: "Edited" }] });
  await new Promise((resolve) => setImmediate(resolve));
  await client.customer.verify({ code: "123456" });
  answers.get("GET").release();
  answers.get("PATCH").release();
  assert.equal((await reading).customer.profile[0].value, "Visitor");
  assert.equal((await editing).customer.profile[0].value, "Edited");
  assert.equal(client.session.customer.id, ids.otherCustomer);
  assert.equal(client.session.customer.profile[0].value, "Signed");
  assert.equal(client.session.id, ids.otherSession);
  const stored = sessionValues(storage)[0];
  assert.equal(stored.customer.id, ids.otherCustomer);
  assert.equal(stored.customer.profile[0].value, "Signed");
  assert.equal(stored.session.access_token, signedIn.access_token);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront/customer/me"],
    ["PATCH", "/v1/storefront/customer/me"],
    ["POST", "/v1/storefront/customer/verify"],
  ]);
});

test("a profile answer for the session that asked updates the stored customer", async (context) => {
  recordFetch(context, (call) => ({ customer: customerRecord(ids.customer, { profile: [{ id: "name", key: "name", type: "text", value: call.method === "PATCH" ? "Ana" : "Visitor" }] }), session: { ...visitorSession(), store_id: ids.store }, email_unsubscribed: false }));
  const storage = new SessionStorage(storedVisitor());
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: storage });
  await client.customer.getMe();
  assert.equal(client.session.customer.profile[0].value, "Visitor");
  await client.customer.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [{ id: "name", key: "name", type: "text", value: "Ana" }] });
  assert.equal(client.session.customer.profile[0].value, "Ana");
  assert.equal(sessionValues(storage)[0].customer.profile[0].value, "Ana");
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
});
