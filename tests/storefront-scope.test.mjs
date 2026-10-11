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
  const good = createStorefront(publishableKey, { apiUrl, sessionStorage: new SessionStorage(storedVisitor()) });
  assert.equal(good.hasSession, true);
  assert.deepEqual(good.session.status, { type: "active" });
  for (const status of ["active", null, {}, { type: "revoked" }, { type: "superseded" }, { type: "active", extra: true }]) {
    const record = JSON.stringify({ version: 3, customer: customerRecord(), session: { ...visitorSession(), status } });
    const rejected = createStorefront(publishableKey, { apiUrl, sessionStorage: new SessionStorage(record) });
    assert.equal(rejected.hasSession, false);
    assert.equal(rejected.session, null);
  }
  const older = JSON.stringify({ version: 2, customer: customerRecord(), session: visitorSession() });
  assert.equal(createStorefront(publishableKey, { apiUrl, sessionStorage: new SessionStorage(older) }).hasSession, false);
  const foreign = JSON.stringify({ version: 3, customer: customerRecord(ids.otherCustomer), session: visitorSession() });
  assert.equal(createStorefront(publishableKey, { apiUrl, sessionStorage: new SessionStorage(foreign) }).hasSession, false);
});

test("an issued session with a malformed lifecycle is refused and never stored", async (context) => {
  for (const type of ["visitor", "email_authenticated"]) {
    for (const status of [{ type: "active" }, "active", null, { type: "revoked" }, { type: "active", extra: true }]) {
      const base = type === "visitor" ? visitorSession() : emailSession();
      recordFetch(context, () => ({ customer: customerRecord(), session: { ...base, status } }));
      const storage = new SessionStorage();
      const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
      if (status && typeof status === "object" && Object.keys(status).length === 1 && status.type === "active") {
        const result = await client.customer.identify();
        assert.deepEqual(result.session.status, { type: "active" });
        assert.deepEqual(client.session.status, { type: "active" });
        assert.equal(client.hasSession, true);
        assert.equal(client.isAuthenticated, type === "email_authenticated");
        assert.deepEqual(sessionValues(storage)[0].session.status, { type: "active" });
      } else {
        await assert.rejects(client.customer.identify(), { name: "RangeError", message: "The customer session must be active and carry epoch-millisecond times" });
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
  const client = createStorefront(publishableKey);
  assert.equal(calls.length, 0);
  assert.equal(client.getLocale(), "");
  assert.equal(client.getMarket(), "");
  assert.equal("getStoreId" in client, false);
  assert.equal("forStore" in client, false);
  for (const credential of ["arky_api_private", "customer_visitor_visitor", "arky_vst_visitor", "contact_visitor", `arky_pk_${"a".repeat(43)}`, {}]) {
    assert.throws(() => createStorefront(credential), /publishable key/i);
  }
});

test("requests use the production URL by default and force the publishable key and context headers", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const root = createStorefront(publishableKey, { locale: "en" });
  root.setContext({ market: "bih" });
  const italian = root.withContext({ locale: "it", market: "ita" });
  await root.eshop.product.find(
    { limit: 1, store_id: "caller-store", market: "caller-market" },
    { headers: { Authorization: "Bearer arky_api_caller", "x-arky-publishable-key": otherPublishableKey, "x-arky-locale": "caller-locale", "x-arky-market": "caller-market" } },
  );
  await italian.eshop.product.find({ limit: 1 });
  assert.equal(root.getLocale(), "en");
  assert.equal(root.getMarket(), "bih");
  assert.equal(italian.getLocale(), "it");
  assert.equal(italian.getMarket(), "ita");
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
  const client = createStorefront(publishableKey, { apiUrl });
  assert.equal(calls.length, 0);
  const first = client.getSetup();
  const second = client.store.getSetup();
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
  const client = createStorefront(publishableKey, { apiUrl, market: "bih", locale: "bs" });
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
  const client = createStorefront(publishableKey, { apiUrl, locale: "en", market: "bih", sessionStorage: storage });
  await client.eshop.product.find({});
  assert.equal(calls.filter((call) => call.path.endsWith("/customer/identify")).length, 0);
  const first = client.eshop.cart.current();
  const second = client.eshop.cart.current();
  await started;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.filter((call) => call.path.endsWith("/customer/identify")).length, 1);
  releaseIdentify();
  assert.deepEqual(await Promise.all([first, second]), [null, null]);
  const identify = calls.find((call) => call.path.endsWith("/customer/identify"));
  assert.deepEqual(identify.body, {});
  assert.equal(identify.headers.get("authorization"), null);
  assert.equal(calls.filter((call) => call.path.includes("/carts")).length, 0);
  const [key] = storage.keys("arky_customer_session:");
  assert.equal(storage.keys("").length, 1);
  assert.equal(key.includes(publishableKey), false);
  assert.equal(JSON.parse(storage.getItem(key)).version, 3);
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
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: new SessionStorage(storedVisitor(expiredToken)) });
  assert.equal((await client.eshop.cart.get({ id: ids.cart })).id, ids.cart);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${expiredToken}`],
    ["/v1/storefront/customer/identify", null],
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${visitorTokenB}`],
  ]);
  context.mock.restoreAll();
  const refused = recordFetch(context, () => errorResponse(401, "STOREFRONT.INVALID_KEY", "invalid connection"));
  const invalid = createStorefront(otherPublishableKey, { apiUrl });
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
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
  const result = await client.customer.identify();
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
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
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
  const serverClient = createStorefront(publishableKey, { apiUrl });
  await serverClient.content.entry.find({ collection_id: "pages" });
  await assert.rejects(serverClient.eshop.cart.current(), /request-local sessionStorage adapter/);
  await assert.rejects(serverClient.customer.identify(), /request-local sessionStorage adapter/);
  assert.equal(calls.length, 1);
});

test("visitor storage is kept apart by endpoint and publishable-key fingerprint", async (context) => {
  recordFetch(context, (call) => call.headers.get("x-arky-publishable-key") === publishableKey ? issued(visitorTokenA) : issued(visitorTokenB, ids.otherCustomer, ids.otherSession));
  const storage = new SessionStorage();
  await createStorefront(publishableKey, { apiUrl, sessionStorage: storage }).customer.identify();
  await createStorefront(otherPublishableKey, { apiUrl, sessionStorage: storage }).customer.identify();
  await createStorefront(publishableKey, { apiUrl: "https://other.example.test", sessionStorage: storage }).customer.identify();
  const keys = storage.keys("arky_customer_session:v3:");
  assert.equal(keys.length, 3);
  for (const key of keys) {
    assert.equal(key.includes(publishableKey), false);
    assert.equal(key.includes(otherPublishableKey), false);
  }
});

test("withContext gets its own visitor while reusing the explicit request storage", async (context) => {
  let identifyCalls = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") {
      identifyCalls += 1;
      return identifyCalls === 1 ? issued(visitorTokenA) : issued(visitorTokenB, ids.otherCustomer, ids.otherSession);
    }
    if (call.path === "/v1/storefront/carts") {
      const owner = call.headers.get("authorization") === `Bearer ${visitorTokenA}` ? ids.customer : ids.otherCustomer;
      return { type: "created", cart: cartRecord({ id: call.body.id, customer_id: owner, catalog_id: null }), recovery_token: `token-${call.body.id}` };
    }
    throw new Error(`Unexpected scoped request: ${call.path}`);
  });
  const storage = new SessionStorage();
  const root = createStorefront(publishableKey, { apiUrl, market: "bih", sessionStorage: storage });
  const scoped = root.withContext({ locale: "it", market: "ita" });
  assert.equal(root.getMarket(), "bih");
  assert.equal(scoped.getMarket(), "ita");
  const rootIdentity = await root.customer.identify();
  assert.equal("token" in rootIdentity, false);
  assert.equal(root.session.customer.id, ids.customer);
  assert.equal(scoped.session, null);
  await scoped.customer.identify();
  assert.equal(scoped.session.customer.id, ids.otherCustomer);
  assert.equal(root.session.customer.id, ids.customer);
  await root.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: null });
  await scoped.eshop.cart.create({ id: ids.otherCart, buyer: customerBuyer, catalog_id: null });
  const carts = calls.filter((call) => call.path === "/v1/storefront/carts");
  assert.deepEqual(carts.map((call) => [call.headers.get("x-arky-market"), call.headers.get("authorization")]), [
    ["bih", `Bearer ${visitorTokenA}`],
    ["ita", `Bearer ${visitorTokenB}`],
  ]);
  assert.ok(calls.filter((call) => call.path.endsWith("/customer/identify")).every((call) => call.headers.get("authorization") === null));
  assert.equal(storage.keys("arky_customer_session:").length, 2);
  assert.equal(storage.keys("arky:selected-cart:v3:").length, 2);
  assert.equal(storage.keys("arky:cart-token:v1:").length, 2);
});

test("a sign-in code and refresh rotate the customer session atomically, and logout forgets it", async (context) => {
  const signInId = "3d8f1a62-7c45-4b09-9e2d-6a1c4f8b0e37";
  const customer = customerRecord(ids.customer, { email: { type: "verified", email: "person@example.com", verified_at: 3 } });
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
          customer: customerRecord(ids.customer, { email: { type: "contact", email: "person@example.com" } }),
          session: { id: ids.session, store_id: ids.store, customer_id: ids.customer, type: { type: "visitor", expires_at: 1_900_000_000_000, email_verification: null }, status: { type: "active" }, last_seen_at: 2, created_at: 1, updated_at: 2 },
          email_verification: { issued_at: 2, expires_at: 62 },
        };
      case "/v1/storefront/customer/verify":
        return { customer, session: authenticated };
      case "/v1/storefront/customer/refresh":
        return { customer, session: rotated };
      case "/v1/storefront/customer/me":
        return { customer: call.method === "PATCH" ? { ...customer, first_name: "Ana" } : customer, session: {}, email_unsubscribed: false };
      case "/v1/storefront/customer/logout":
        return undefined;
      default:
        throw new Error(`Unexpected customer session request: ${call.path}`);
    }
  });
  const storage = new SessionStorage();
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
  await assert.rejects(client.customer.requestCode({ id: "code-1", email: "person@example.com", language: "en" }), TypeError);
  const requested = await client.customer.requestCode({ id: signInId, email: "person@example.com", language: "en" });
  assert.equal(requested.email_verification.issued_at, 2);
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
  const verified = await client.customer.verify({ code: "123456" });
  assert.equal(verified.session.id, authenticated.id);
  assert.equal(client.isAuthenticated, true);
  assert.deepEqual(client.session, { customer, id: authenticated.id, type: "email_authenticated", status: { type: "active" } });
  const refreshed = await client.customer.refresh();
  assert.equal(refreshed.session.id, rotated.id);
  const stored = sessionValues(storage)[0].session;
  assert.deepEqual({ id: stored.id, access_token: stored.access_token, refresh_token: stored.refresh_token }, { id: rotated.id, access_token: rotated.access_token, refresh_token: rotated.refresh_token });
  await client.customer.getMe();
  const edited = await client.customer.updateMe({ expected_updated_at: customer.updated_at, first_name: "Ana", phone: null });
  assert.equal(edited.customer.first_name, "Ana");
  assert.equal(client.session.customer.first_name, "Ana");
  await client.customer.logout();
  assert.equal(client.session, null);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization"), call.body]), [
    ["/v1/storefront/customer/identify", null, {}],
    ["/v1/storefront/customer/request-code", `Bearer ${visitorTokenA}`, { id: signInId, email: "person@example.com", language: "en" }],
    ["/v1/storefront/customer/verify", `Bearer ${visitorTokenA}`, { code: "123456" }],
    ["/v1/storefront/customer/refresh", null, { refresh_token: authenticated.refresh_token }],
    ["/v1/storefront/customer/me", `Bearer ${rotated.access_token}`, null],
    ["/v1/storefront/customer/me", `Bearer ${rotated.access_token}`, { expected_updated_at: customer.updated_at, first_name: "Ana", phone: null }],
    ["/v1/storefront/customer/logout", `Bearer ${rotated.access_token}`, null],
  ]);
  assert.equal(storage.keys("arky_customer_session:").length, 0);
});

test("a refused refresh keeps the signed-in session and is never retried with Authorization", async (context) => {
  const session = emailSession();
  const initialRecord = storedSession(ids.customer, session);
  let storedRecord = initialRecord;
  const storage = {
    getItem: (key) => key.startsWith("arky_customer_session:v3:") ? storedRecord : null,
    setItem: (_key, value) => {
      storedRecord = value;
    },
    removeItem: (key) => {
      if (key.startsWith("arky_customer_session:v3:")) storedRecord = null;
    },
  };
  const calls = recordFetch(context, () => errorResponse(401, "CUSTOMER_SESSION_REFRESH_REJECTED", "Refresh token rejected"));
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
  await assert.rejects(client.customer.refresh(), /Refresh token rejected/);
  assert.deepEqual(client.session, { customer: customerRecord(), id: session.id, type: "email_authenticated", status: { type: "active" } });
  assert.deepEqual(calls.map((call) => [call.href, call.headers.get("authorization"), call.headers.get("x-arky-publishable-key"), call.body]), [
    [`${apiUrl}/v1/storefront/customer/refresh`, null, publishableKey, { refresh_token: session.refresh_token }],
  ]);
  assert.equal(storedRecord, initialRecord);
});

test("a stored record with an invalid visitor credential is dropped at startup", () => {
  const removed = [];
  const invalid = storedSession(ids.customer, visitorSession(ids.customer, ids.session, "invalid-visitor-token"));
  const client = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: {
      getItem: (key) => key.startsWith("arky_customer_session:v3:") ? invalid : null,
      setItem() {},
      removeItem: (key) => removed.push(key),
    },
  });
  assert.equal(client.session, null);
  assert.equal(removed.some((key) => key.startsWith("arky_customer_session:v3:")), true);
});

test("a profile answer that lands after a sign-in leaves the signed-in customer alone, while the caller still gets it", async (context) => {
  const signedInCustomer = customerRecord(ids.otherCustomer, { first_name: "Signed", email: { type: "verified", email: "person@example.com", verified_at: 3 } });
  const signedIn = emailSession(ids.otherCustomer, ids.otherSession);
  const answers = new Map();
  const calls = recordFetch(context, async (call) => {
    if (call.path === "/v1/storefront/customer/verify") return { customer: signedInCustomer, session: signedIn };
    if (call.path === "/v1/storefront/customer/me") {
      const gate = answers.get(call.method);
      await gate.waiting;
      return { customer: customerRecord(ids.customer, { first_name: call.method === "PATCH" ? "Edited" : "Visitor" }), session: {}, email_unsubscribed: false };
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
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
  const reading = client.customer.getMe();
  const editing = client.customer.updateMe({ expected_updated_at: 1_700_000_000_000, first_name: "Edited" });
  await new Promise((resolve) => setImmediate(resolve));
  await client.customer.verify({ code: "123456" });
  answers.get("GET").release();
  answers.get("PATCH").release();
  assert.equal((await reading).customer.first_name, "Visitor");
  assert.equal((await editing).customer.first_name, "Edited");
  assert.equal(client.session.customer.id, ids.otherCustomer);
  assert.equal(client.session.customer.first_name, "Signed");
  assert.equal(client.session.id, ids.otherSession);
  const stored = sessionValues(storage)[0];
  assert.equal(stored.customer.id, ids.otherCustomer);
  assert.equal(stored.customer.first_name, "Signed");
  assert.equal(stored.session.access_token, signedIn.access_token);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront/customer/me"],
    ["PATCH", "/v1/storefront/customer/me"],
    ["POST", "/v1/storefront/customer/verify"],
  ]);
});

test("a profile answer for the session that asked updates the stored customer", async (context) => {
  recordFetch(context, (call) => ({ customer: customerRecord(ids.customer, { first_name: call.method === "PATCH" ? "Ana" : "Visitor" }), session: {}, email_unsubscribed: false }));
  const storage = new SessionStorage(storedVisitor());
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
  await client.customer.getMe();
  assert.equal(client.session.customer.first_name, "Visitor");
  await client.customer.updateMe({ expected_updated_at: 1_700_000_000_000, first_name: "Ana" });
  assert.equal(client.session.customer.first_name, "Ana");
  assert.equal(sessionValues(storage)[0].customer.first_name, "Ana");
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
});
