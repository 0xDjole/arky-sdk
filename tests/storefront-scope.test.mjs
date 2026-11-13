import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  customerRecord,
  emailSession,
  errorResponse,
  fixedIdFactories,
  idFactories,
  ids,
  otherStorefrontIdentity,
  storefrontIdentity,
  recordFetch,
  SessionStorage,
  storedSession,
  visitorSession,
} from "./helpers/arky-fixtures.mjs";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const visitorTokenA = `customer_visitor_${"a".repeat(64)}`;
const visitorTokenB = `customer_visitor_${"b".repeat(64)}`;
const customerBuyer = { type: "customer" };

function issued(token = visitorTokenA, customerId = ids.customer, sessionId = ids.session) {
  return { customer: customerRecord(customerId), session: visitorSession(customerId, sessionId, token), login: null };
}

function storedVisitor(token = visitorTokenA, customerId = ids.customer, sessionId = ids.session) {
  return storedSession(customerId, visitorSession(customerId, sessionId, token));
}

function sessionValues(storage) {
  return storage.keys("arky_customer_session:").map((key) => JSON.parse(storage.getItem(key)));
}

test("a stored customer session needs version 5 and the exact active status tag", () => {
  const visitorIdentity = { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" };
  const read = (stored, factories = { visitorIdentity, ...fixedIdFactories }) =>
    createStorefront(storefrontIdentity, { ...factories, apiUrl, sessionStorage: new SessionStorage(stored) });
  const good = read(storedVisitor());
  assert.equal(good.hasSession, true);
  assert.deepEqual(good.session.status, { type: "active" });
  assert.equal(good.session.login, null);
  for (const status of ["active", null, {}, { type: "revoked" }, { type: "superseded" }, { type: "active", extra: true }]) {
    const record = JSON.stringify({ version: 5, customer: customerRecord(), session: { ...visitorSession(), status }, login: null });
    const rejected = read(record);
    assert.equal(rejected.hasSession, false);
    assert.equal(rejected.session, null);
  }
  const older = JSON.stringify({ version: 4, customer: customerRecord(), session: visitorSession() });
  assert.equal(read(older).hasSession, false);
  const signedLogin = {
    id: emailSession().login_id,
    type: { type: "verified_email", email: "new@example.test", language: "bs", unsubscribed: false },
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_000,
  };
  const withoutLogin = JSON.stringify({ version: 5, customer: customerRecord(), session: emailSession(), login: null });
  const otherLogin = JSON.stringify({ version: 5, customer: customerRecord(), session: emailSession(), login: { ...signedLogin, id: ids.line } });
  const withLogin = JSON.stringify({ version: 5, customer: customerRecord(), session: emailSession(), login: signedLogin });
  for (const [stored, kept] of [[withoutLogin, false], [otherLogin, false], [withLogin, true]]) {
    const signedIn = read(stored, idFactories);
    assert.equal(signedIn.hasSession, kept, "a signed-in session keeps the login it signed in with");
    if (kept) assert.deepEqual(signedIn.session.login, signedLogin);
  }
  const visitorWithLogin = JSON.stringify({ version: 5, customer: customerRecord(), session: visitorSession(), login: signedLogin });
  assert.equal(read(visitorWithLogin).hasSession, false, "a Visitor session names no login");
  const foreign = JSON.stringify({ version: 5, customer: customerRecord(ids.otherCustomer), session: visitorSession(), login: null });
  assert.equal(read(foreign).hasSession, false);
  const { name: _name, addresses: _addresses, ...beforeNames } = customerRecord();
  const named = customerRecord(ids.customer, {
    name: { first_name: "Ana", last_name: "Anić" },
    addresses: [{ id: ids.line, country: "BA", city: "Sarajevo" }],
    default_shipping_address_id: ids.line,
  });
  for (const [customer, kept] of [
    [beforeNames, false],
    [{ ...customerRecord(), name: { first_name: "Ana" } }, false],
    [{ ...customerRecord(), default_billing_address_id: 7 }, false],
    [named, true],
  ]) {
    const storage = JSON.stringify({ version: 5, customer, session: visitorSession(), login: null });
    const stored = read(storage);
    assert.equal(stored.hasSession, kept);
    if (kept) {
      assert.deepEqual(stored.session.customer.name, named.name);
      assert.deepEqual(stored.session.customer.addresses, named.addresses);
    }
  }
});

test("an issued session with a malformed lifecycle is refused and never stored", async (context) => {
  for (const type of ["visitor", "logged_in"]) {
    for (const status of [{ type: "active" }, "active", null, { type: "revoked" }, { type: "active", extra: true }]) {
      const base = type === "visitor" ? visitorSession() : emailSession();
      const login = type === "visitor"
        ? null
        : { id: base.login_id, type: { type: "verified_email", email: "a@example.test", language: "en", unsubscribed: false }, created_at: 1, updated_at: 1 };
      recordFetch(context, () => ({ customer: customerRecord(), session: { ...base, status }, login }));
      const storage = new SessionStorage();
      const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
      if (status && typeof status === "object" && Object.keys(status).length === 1 && status.type === "active") {
        const result = await client.customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
        assert.deepEqual(result.session.status, { type: "active" });
        assert.deepEqual(client.session.status, { type: "active" });
        assert.equal(client.hasSession, true);
        assert.equal(client.isAuthenticated, type === "logged_in");
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

test("storefront initialization requires canonical store and sales-channel IDs without making a request", (context) => {
  const calls = recordFetch(context, () => { throw new Error("initialize must not fetch"); });
  const client = createStorefront(storefrontIdentity, idFactories);
  assert.equal(client.getLocale(), "");
  assert.equal(client.getMarket(), "");
  assert.equal("getStoreId" in client, false);
  assert.equal("forStore" in client, false);
  for (const identity of [undefined, null, "arky_pk_removed", {},
    { ...storefrontIdentity, storeId: "store" },
    { ...storefrontIdentity, salesChannelId: "channel" },
    { ...storefrontIdentity, storeId: ids.store.toUpperCase() },
    { ...storefrontIdentity, salesChannelId: ids.channel.toUpperCase() },
  ]) {
    assert.throws(() => createStorefront(identity, idFactories), /canonical UUID v4/);
  }
  assert.equal(calls.length, 0);
});

test("requests use the production URL by default and force the store, sales-channel and context headers", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const root = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, locale: "en" });
  root.setContext({ market: "bih" });
  await root.eshop.packageItem.find(
    { package_id: ids.package, limit: 1, store_id: "caller-store", market: "caller-market" },
    { headers: { Authorization: "Bearer arky_api_caller", "x-arky-store-id": otherStorefrontIdentity.storeId, "x-arky-sales-channel-id": otherStorefrontIdentity.salesChannelId, "x-arky-locale": "caller-locale", "x-arky-market": "caller-market" } },
  );
  await root.eshop.packageItem.find({ package_id: ids.package, limit: 1 }, { locale: "it", market: "ita" });
  assert.equal(root.getLocale(), "en");
  assert.equal(root.getMarket(), "bih");
  assert.equal(calls[0].href, `https://api.arky.io/v1/storefront/package-items?package_id=${ids.package}&limit=1`);
  assert.equal(calls[0].headers.get("x-arky-store-id"), storefrontIdentity.storeId);
    assert.equal(calls[0].headers.get("x-arky-sales-channel-id"), storefrontIdentity.salesChannelId);
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
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
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

test("package text search keeps its selection, the price range and the continuation together", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next-search-page" }));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "bih", locale: "bs" });
  const selection = { types: ["product"], text: "KOŠULJA-0001", choice: { price: { min_amount: 0, max_amount: 5000 } }, sort: "relevance" };
  const params = { package_id: ids.package, selection, limit: 20, cursor: "current-search-page" };
  assert.deepEqual(await client.eshop.packageItem.find(params), { items: [], cursor: "next-search-page" });
  assert.deepEqual(JSON.parse(calls[0].query.selection), selection);
  assert.equal(calls[0].query.cursor, params.cursor);
  assert.equal(calls[0].query.limit, "20");
  for (const removed of ["query", "sort_field", "sort_direction", "price_filter"]) assert.equal(removed in calls[0].query, false, removed);
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
    if (call.path === "/v1/storefront/package-items") return { items: [], cursor: null };
    if (call.path === "/v1/storefront/customer/identify") {
      identifyStarted();
      await identifyGate;
      return issued();
    }
    if (call.method === "PATCH" && call.path === "/v1/storefront/customer/me") {
      return { customer: customerRecord(ids.customer), session: { ...visitorSession(ids.customer, ids.session, visitorTokenA), store_id: ids.store }, logins: [] };
    }
    throw new Error(`Unexpected visitor request: ${call.path}`);
  });
  const storage = new SessionStorage();
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, locale: "en", market: "bih", sessionStorage: storage });
  await client.eshop.packageItem.find({ package_id: ids.package });
  assert.equal(await client.eshop.cart.getCurrent({ buyer: customerBuyer, package_id: ids.package }), null);
  assert.equal(await client.customer.getMe(), null);
  assert.equal(calls.filter((call) => call.path.endsWith("/customer/identify")).length, 0);
  const first = client.customer.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [] });
  const second = client.customer.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [] });
  await started;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.filter((call) => call.path.endsWith("/customer/identify")).length, 1);
  releaseIdentify();
  assert.deepEqual((await Promise.all([first, second])).map((answer) => answer.customer.id), [ids.customer, ids.customer]);
  const identify = calls.find((call) => call.path.endsWith("/customer/identify"));
  assert.deepEqual(identify.body, { customer_id: ids.customer, session_id: ids.session });
  assert.equal(identify.headers.get("authorization"), null);
  assert.equal(calls.filter((call) => call.path.includes("/carts")).length, 0);
  assert.equal(calls.filter((call) => call.method === "PATCH").length, 2);
  const [key] = storage.keys("arky_customer_session:");
  assert.equal(storage.keys("").length, 1);
  assert.ok(key.endsWith(`:${storefrontIdentity.storeId}:${storefrontIdentity.salesChannelId}`));
  assert.equal(JSON.parse(storage.getItem(key)).version, 5);
  assert.equal(JSON.parse(storage.getItem(key)).session.token, visitorTokenA);
});

test("an expired visitor re-identifies once and retries, while a refused storefront never identifies", async (context) => {
  const expiredToken = `customer_visitor_${"c".repeat(64)}`;
  let cartReads = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") return issued(visitorTokenB, ids.otherCustomer, ids.otherSession);
    if (call.path === `/v1/storefront/carts/${ids.cart}`) {
      cartReads += 1;
      return cartReads === 1 ? errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated") : cartRecord({ customer_id: ids.otherCustomer });
    }
    throw new Error(`Unexpected retry request: ${call.path}`);
  });
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: new SessionStorage(storedVisitor(expiredToken)) });
  assert.equal((await client.eshop.cart.get({ id: ids.cart })).id, ids.cart);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${expiredToken}`],
    ["/v1/storefront/customer/identify", null],
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${visitorTokenB}`],
  ]);
  context.mock.restoreAll();
  const refused = recordFetch(context, () => errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated"));
  const invalid = createStorefront(otherStorefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
  await assert.rejects(invalid.eshop.packageItem.find({ package_id: ids.package }), (error) => error.statusCode === 401);
  assert.equal(refused.filter((call) => call.path.endsWith("/customer/identify")).length, 0);
  assert.equal(refused.length, 1);
});

test("identify retries its own request once without the expired visitor token", async (context) => {
  const expiredToken = `customer_visitor_${"d".repeat(64)}`;
  const calls = recordFetch(context, (call) => {
    assert.equal(call.path, "/v1/storefront/customer/identify");
    return call.headers.get("authorization") ? errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated") : issued(visitorTokenB, ids.otherCustomer, ids.otherSession);
  });
  const storage = new SessionStorage(storedVisitor(expiredToken));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
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
        return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated");
      }
      markSecondOldRequestStarted();
      await secondOldResponseGate;
      return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated");
    }
    return cartRecord({ customer_id: ids.otherCustomer });
  });
  const storage = new SessionStorage(storedVisitor(visitorTokenA));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
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
  const serverClient = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
  await serverClient.content.entry.find({ collection_id: "pages" });
  assert.equal(await serverClient.eshop.cart.getCurrent({ buyer: customerBuyer, package_id: ids.package }), null);
  assert.equal(await serverClient.customer.getMe(), null);
  await assert.rejects(serverClient.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, package_id: ids.package }), /request-local sessionStorage adapter/);
  await assert.rejects(serverClient.customer.identify({ customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }), /request-local sessionStorage adapter/);
  assert.equal(calls.length, 1);
});

test("visitor storage is kept apart by API URL, store and sales channel", async (context) => {
  recordFetch(context, (call, count) => ({
    customer: customerRecord(ids.customer, { store_id: call.headers.get("x-arky-store-id") }),
    session: visitorSession(ids.customer, ids.session, `customer_visitor_${count}`),
  }));
  const storage = new SessionStorage();
  const scopes = [
    [apiUrl, storefrontIdentity],
    [apiUrl, { ...storefrontIdentity, storeId: ids.otherStore }],
    [apiUrl, { ...storefrontIdentity, salesChannelId: ids.otherChannel }],
    ["https://other.example.test", storefrontIdentity],
    [`${apiUrl}/Store`, storefrontIdentity],
    [`${apiUrl}/store`, storefrontIdentity],
  ];
  for (const [endpoint, identity] of scopes) {
    const client = createStorefront(identity, { ...fixedIdFactories, apiUrl: endpoint, sessionStorage: storage });
    assert.equal(client.session, null);
    await client.customer.identify({ customer_id: ids.customer, session_id: ids.session });
  }
  assert.equal(storage.keys("arky_customer_session:v5:").length, scopes.length);
  for (const [index, [endpoint, identity]] of scopes.entries()) {
    const key = `arky_customer_session:v5:${encodeURIComponent(endpoint)}:${identity.storeId}:${identity.salesChannelId}`;
    assert.equal(JSON.parse(storage.getItem(key)).session.token, `customer_visitor_${index + 1}`);
    assert.equal(createStorefront(identity, { ...fixedIdFactories, apiUrl: endpoint, sessionStorage: storage }).session.id, ids.session);
  }
});

test("a sign-in code and refresh rotate the customer session atomically, and logout forgets it", async (context) => {
  const signInId = "3d8f1a62-7c45-4b09-9e2d-6a1c4f8b0e37";
  const customer = customerRecord(ids.customer, { profile: [{ id: ids.line, key: "name", type: "text", value: null }] });
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
          session: { id: ids.session, store_id: ids.store, customer_id: ids.customer, type: { type: "visitor", expires_at: 1_900_000_000_000, sign_in_codes: [] }, status: { type: "active" }, last_seen_at: 2, created_at: 1, updated_at: 2 },
          code: { issued_at: 2, expires_at: 62 },
        };
      case "/v1/storefront/customer/verify":
        return { customer, session: authenticated, login: loginOf(authenticated) };
      case "/v1/storefront/customer/refresh":
        return { customer, session: rotated, login: loginOf(rotated) };
      case "/v1/storefront/customer/me":
        return { customer: call.method === "PATCH" ? { ...customer, profile: [{ id: ids.line, key: "name", type: "text", value: "Ana" }] } : customer, session: { ...rotated, store_id: ids.store }, logins: [] };
      case "/v1/storefront/customer/logout":
        return undefined;
      default:
        throw new Error(`Unexpected customer session request: ${call.path}`);
    }
  });
  const storage = new SessionStorage();
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  await assert.rejects(client.customer.requestCode({ id: "code-1", contact: { type: "email", email: "person@example.com", language: "en" } }), TypeError);
  const requested = await client.customer.requestCode({ id: signInId, contact: { type: "email", email: "person@example.com", language: "en" } });
  assert.equal(requested.code.issued_at, 2);
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
  const verified = await client.customer.verify({ code: "123456" });
  assert.equal(verified.session.id, authenticated.id);
  assert.equal(client.isAuthenticated, true);
  assert.deepEqual(client.session, { customer, id: authenticated.id, type: "logged_in", status: { type: "active" }, login: loginOf(authenticated) });
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
    ["/v1/storefront/customer/request-code", `Bearer ${visitorTokenA}`, { id: signInId, contact: { type: "email", email: "person@example.com", language: "en" } }],
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
    getItem: (key) => key.startsWith("arky_customer_session:v5:") ? storedRecord : null,
    setItem: (_key, value) => {
      storedRecord = value;
    },
    removeItem: (key) => {
      if (key.startsWith("arky_customer_session:v5:")) storedRecord = null;
    },
  };
  const calls = recordFetch(context, () => errorResponse(401, "CUSTOMER_SESSION_REFRESH_REJECTED", "Refresh token rejected"));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  await assert.rejects(client.customer.refresh({ session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), /Refresh token rejected/);
  assert.deepEqual(client.session, { customer: JSON.parse(initialRecord).customer, id: session.id, type: "logged_in", status: { type: "active" }, login: JSON.parse(initialRecord).login });
  assert.deepEqual(calls.map((call) => [call.href, call.headers.get("authorization"), call.headers.get("x-arky-store-id"), call.headers.get("x-arky-sales-channel-id"), call.body]), [
    [`${apiUrl}/v1/storefront/customer/refresh`, null, storefrontIdentity.storeId, storefrontIdentity.salesChannelId, { session_id: ids.otherSession, refresh_token: session.refresh_token }],
  ]);
  assert.equal(storedRecord, initialRecord);
});

test("a stored record with an invalid visitor credential is dropped at startup", () => {
  const removed = [];
  const invalid = storedSession(ids.customer, visitorSession(ids.customer, ids.session, "invalid-visitor-token"));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories,
    apiUrl,
    sessionStorage: {
      getItem: (key) => key.startsWith("arky_customer_session:v5:") ? invalid : null,
      setItem() {},
      removeItem: (key) => removed.push(key),
    },
  });
  assert.equal(client.session, null);
  assert.equal(removed.some((key) => key.startsWith("arky_customer_session:v5:")), true);
});

test("a profile answer that lands after a sign-in leaves the signed-in customer alone, while the caller still gets it", async (context) => {
  const signedInCustomer = customerRecord(ids.otherCustomer, { profile: [{ id: ids.line, key: "name", type: "text", value: "Signed" }] });
  const signedIn = emailSession(ids.otherCustomer, ids.otherSession);
  const answers = new Map();
  const calls = recordFetch(context, async (call) => {
    if (call.path === "/v1/storefront/customer/verify") return { customer: signedInCustomer, session: signedIn, login: loginOf(signedIn) };
    if (call.path === "/v1/storefront/customer/me") {
      const gate = answers.get(call.method);
      await gate.waiting;
      return { customer: customerRecord(ids.customer, { profile: [{ id: ids.line, key: "name", type: "text", value: call.method === "PATCH" ? "Edited" : "Visitor" }] }), session: { ...visitorSession(), store_id: ids.store }, logins: [] };
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
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
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
  recordFetch(context, (call) => ({ customer: customerRecord(ids.customer, { profile: [{ id: "name", key: "name", type: "text", value: call.method === "PATCH" ? "Ana" : "Visitor" }] }), session: { ...visitorSession(), store_id: ids.store }, logins: [] }));
  const storage = new SessionStorage(storedVisitor());
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  await client.customer.getMe();
  assert.equal(client.session.customer.profile[0].value, "Visitor");
  await client.customer.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [{ id: "name", key: "name", type: "text", value: "Ana" }] });
  assert.equal(client.session.customer.profile[0].value, "Ana");
  assert.equal(sessionValues(storage)[0].customer.profile[0].value, "Ana");
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
});

function loginOf(session) {
  return {
    id: session.login_id,
    type: { type: "verified_email", email: "person@example.com", language: "en", unsubscribed: false },
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_000,
  };
}

const refreshedAccess = `customer_access_${"u".repeat(64)}`;
const refreshedRefresh = `customer_refresh_${"w".repeat(64)}`;

function signedInCustomer() {
  return customerRecord(ids.customer, { name: { first_name: "Ana", last_name: "Anić" } });
}

function plainStorefront(options = {}) {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl, ...options });
}

function installWindow(context, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value });
  context.after(() => (descriptor ? Object.defineProperty(globalThis, "window", descriptor) : delete globalThis.window));
}

test("a session another tab refreshed is used, and its old token's refusal never signs the browser out", async (context) => {
  const customer = signedInCustomer();
  const first = emailSession(ids.customer, ids.session);
  const second = emailSession(ids.customer, "7e2c9b14-5a63-4d80-b1f7-3c8e0a6d2f95", { access_token: refreshedAccess, refresh_token: refreshedRefresh });
  const firstRecord = JSON.stringify({ version: 5, customer, session: first, login: loginOf(first) });
  const secondRecord = JSON.stringify({ version: 5, customer, session: second, login: loginOf(second) });
  const storage = new SessionStorage(firstRecord);
  let refreshes = 0;
  let writeOnOldToken = false;
  const calls = recordFetch(context, (call) => {
    const authorization = call.headers.get("authorization");
    if (call.path === "/v1/storefront/customer/refresh") {
      refreshes += 1;
      return refreshes === 1 && call.body.refresh_token === first.refresh_token
        ? { customer, session: second, login: loginOf(second) }
        : errorResponse(401, "GENERAL.UNAUTHENTICATED", "Refresh refused");
    }
    if (call.path === "/v1/storefront/customer/me") {
      if (authorization === `Bearer ${first.access_token}`) {
        if (writeOnOldToken) storage.setItem(storage.keys("arky_customer_session:v5:")[0], secondRecord);
        return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Expired");
      }
      return { customer, session: { ...second, store_id: ids.store }, logins: [] };
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const tabA = plainStorefront({ sessionStorage: storage });
  const tabB = plainStorefront({ sessionStorage: storage });
  await tabA.customer.getMe();
  assert.equal(refreshes, 1);
  const [key] = storage.keys("arky_customer_session:v5:");
  assert.equal(JSON.parse(storage.getItem(key)).session.access_token, refreshedAccess);
  calls.length = 0;
  await tabB.customer.getMe();
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [["/v1/storefront/customer/me", `Bearer ${refreshedAccess}`]]);
  storage.setItem(key, firstRecord);
  writeOnOldToken = true;
  calls.length = 0;
  await tabB.customer.getMe();
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [
    ["/v1/storefront/customer/me", `Bearer ${first.access_token}`],
    ["/v1/storefront/customer/me", `Bearer ${refreshedAccess}`],
  ]);
  assert.equal(refreshes, 1);
  assert.equal(JSON.parse(storage.getItem(key)).session.access_token, refreshedAccess);
  assert.equal(tabB.isAuthenticated, true);
});

test("a storage event from another tab reports the stored session", async (context) => {
  const localStorage = new MemoryStorage();
  const browser = Object.assign(new EventTarget(), { localStorage });
  installWindow(context, browser);
  recordFetch(context, () => issued(visitorTokenA));
  const tab = plainStorefront();
  await tab.customer.identify({ customer_id: ids.customer, session_id: ids.session });
  const key = localStorage.key(0);
  assert.ok(key.startsWith("arky_customer_session:v5:"));
  const seen = [];
  const unsubscribe = tab.onAuthStateChanged((session) => seen.push(session));
  await new Promise((resolve) => setImmediate(resolve));
  const customer = signedInCustomer();
  const other = emailSession(ids.customer, "7e2c9b14-5a63-4d80-b1f7-3c8e0a6d2f95", { access_token: refreshedAccess, refresh_token: refreshedRefresh });
  localStorage.setItem(key, JSON.stringify({ version: 5, customer, session: other, login: loginOf(other) }));
  browser.dispatchEvent(Object.assign(new Event("storage"), { key }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(seen.at(-1), { customer, id: other.id, type: "logged_in", status: { type: "active" }, login: loginOf(other) });
  unsubscribe();
});

test("a browser that refuses storage keeps the session in the tab and reports it", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/customer/identify"
    ? issued(visitorTokenA)
    : { customer: customerRecord(ids.customer), session: { id: ids.session, store_id: ids.store, customer_id: ids.customer }, logins: [] });
  const refuse = () => {
    throw new DOMException("Storage is blocked", "SecurityError");
  };
  const blocked = plainStorefront({ sessionStorage: { getItem: refuse, setItem: refuse, removeItem: refuse } });
  assert.equal(blocked.sessionStorageUnavailable, true);
  await blocked.customer.identify({ customer_id: ids.customer, session_id: ids.session });
  assert.equal(blocked.hasSession, true);
  await blocked.customer.getMe();
  assert.equal(calls.at(-1).headers.get("authorization"), `Bearer ${visitorTokenA}`);

  const browser = new EventTarget();
  Object.defineProperty(browser, "localStorage", { get: refuse });
  installWindow(context, browser);
  const refusedDefault = plainStorefront();
  assert.equal(refusedDefault.sessionStorageUnavailable, true);
  await refusedDefault.customer.identify({ customer_id: ids.customer, session_id: ids.session });
  assert.equal(refusedDefault.hasSession, true);
  await refusedDefault.customer.getMe();
  assert.equal(calls.at(-1).headers.get("authorization"), `Bearer ${visitorTokenA}`);

  assert.equal(plainStorefront({ sessionStorage: new MemoryStorage() }).sessionStorageUnavailable, false);
});

test("a_first_cart_read_and_get_me_send_no_identify", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") return issued();
    if (call.method === "POST" && call.path === "/v1/storefront/carts") {
      return { type: "created", cart: cartRecord({ id: call.body.id }), recovery_token: "cart-recovery-token" };
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const visitorIdentity = { customer_id: ids.customer, session_id: ids.session };
  const client = createStorefront(storefrontIdentity, { ...fixedIdFactories, visitorIdentity, apiUrl, locale: "en", market: "bih", sessionStorage: new SessionStorage() });
  assert.equal(await client.eshop.cart.getCurrent({ buyer: customerBuyer, package_id: ids.package }), null);
  assert.equal(await client.customer.getMe(), null);
  assert.equal(client.hasSession, false);
  const store = initialize(storefrontIdentity, { ...fixedIdFactories, visitorIdentity, apiUrl, locale: "en", market: "bih", sessionStorage: new SessionStorage() });
  const cart = store.eshop.cart({ buyer: customerBuyer, package_id: ids.package });
  assert.equal(await cart.load(), null);
  assert.equal(await store.customer.getMe(), null);
  assert.equal(cart.status.get().error, null);
  assert.equal(store.hasSession, false);
  assert.deepEqual(calls, []);
  assert.equal((await cart.ensure()).id, ids.picked);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/customer/identify"],
    ["POST", "/v1/storefront/carts"],
  ]);
  assert.equal(store.hasSession, true);
  assert.equal(client.hasSession, false);
});
