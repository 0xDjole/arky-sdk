import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  confirmedEmail,
  userRecord,
  emailSession,
  phoneSession,
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

const visitorTokenA = `user_visitor_${"a".repeat(64)}`;
const visitorTokenB = `user_visitor_${"b".repeat(64)}`;
const userBuyer = { type: "user" };

function issued(token = visitorTokenA, userId = ids.user, sessionId = ids.session) {
  return { user: userRecord(userId), session: visitorSession(userId, sessionId, token) };
}

function storedVisitor(token = visitorTokenA, userId = ids.user, sessionId = ids.session) {
  return storedSession(userId, visitorSession(userId, sessionId, token));
}

function sessionValues(storage) {
  return storage.keys("arky_user_session:").map((key) => JSON.parse(storage.getItem(key)));
}

test("a stored user session needs version 5 and the exact active status tag", () => {
  const visitorIdentity = { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" };
  const read = (stored, factories = { visitorIdentity, ...fixedIdFactories }) =>
    createStorefront(storefrontIdentity, { ...factories, apiUrl, sessionStorage: new SessionStorage(stored) });
  const good = read(storedVisitor());
  assert.equal(good.hasSession, true);
  assert.deepEqual(good.session.status, { type: "active" });
  assert.equal(good.session.signed_in_with, null);
  for (const status of ["active", null, {}, { type: "revoked" }, { type: "superseded" }, { type: "active", extra: true }]) {
    const record = JSON.stringify({ version: 5, user: userRecord(), session: { ...visitorSession(), status } });
    const rejected = read(record);
    assert.equal(rejected.hasSession, false);
    assert.equal(rejected.session, null);
  }
  const older = JSON.stringify({ version: 4, user: userRecord(), session: visitorSession() });
  assert.equal(read(older).hasSession, false);
  const signedInUser = userRecord(ids.user, { links: [{ type: "own" }], contacts: [confirmedEmail("new@example.test", "bs")] });
  const byEmail = JSON.stringify({ version: 5, user: signedInUser, session: emailSession(ids.user, ids.session, { email: "new@example.test" }) });
  const byPhone = JSON.stringify({ version: 5, user: signedInUser, session: phoneSession(ids.user, ids.session, "+38761222333") });
  const tenantKey = {
    type: "network_user_tenant_key",
    id: ids.session,
    user_id: ids.user,
    status: { type: "active" },
    access_token: `user_tenant_key_${"k".repeat(64)}`,
  };
  const withKey = JSON.stringify({ version: 5, user: signedInUser, session: tenantKey });
  for (const [stored, signedInWith] of [
    [byEmail, { type: "email", email: "new@example.test" }],
    [byPhone, { type: "phone", number: "+38761222333" }],
    [withKey, null],
  ]) {
    const signedIn = read(stored, idFactories);
    assert.equal(signedIn.hasSession, true);
    assert.equal(signedIn.isAuthenticated, true);
    assert.deepEqual(signedIn.session.signed_in_with, signedInWith, "the session names the address it signed in with, and a tenant key names none");
  }
  const { email: _email, ...noEmail } = emailSession();
  const { number: _number, ...noNumber } = phoneSession();
  for (const session of [
    noEmail,
    noNumber,
    { ...emailSession(), type: "logged_in", login_id: ids.line },
    { ...tenantKey, refresh_token: `user_refresh_${"r".repeat(64)}` },
    { ...tenantKey, access_token: `user_access_${"a".repeat(64)}` },
  ]) {
    assert.equal(read(JSON.stringify({ version: 5, user: signedInUser, session }), idFactories).hasSession, false, session.type);
  }
  const foreign = JSON.stringify({ version: 5, user: userRecord(ids.otherUser), session: visitorSession() });
  assert.equal(read(foreign).hasSession, false);
  const { name: _name, addresses: _addresses, ...beforeNames } = userRecord();
  const { links: _links, ...beforeLinks } = userRecord();
  const { contacts: _contacts, ...beforeContacts } = userRecord();
  const named = userRecord(ids.user, {
    name: { first_name: "Ana", last_name: "Anić" },
    addresses: [{ id: ids.line, country: "BA", city: "Sarajevo" }],
    default_shipping_address_id: ids.line,
  });
  for (const [user, kept] of [
    [beforeNames, false],
    [beforeLinks, false],
    [beforeContacts, false],
    [{ ...userRecord(), name: { first_name: "Ana" } }, false],
    [{ ...userRecord(), default_billing_address_id: 7 }, false],
    [named, true],
  ]) {
    const storage = JSON.stringify({ version: 5, user, session: visitorSession() });
    const stored = read(storage);
    assert.equal(stored.hasSession, kept);
    if (kept) {
      assert.deepEqual(stored.session.user.name, named.name);
      assert.deepEqual(stored.session.user.addresses, named.addresses);
    }
  }
});

test("an issued session with a malformed lifecycle is refused and never stored", async (context) => {
  for (const type of ["visitor", "tenant_user_signed_in_by_email"]) {
    for (const status of [{ type: "active" }, "active", null, { type: "revoked" }, { type: "active", extra: true }]) {
      const base = type === "visitor" ? visitorSession() : emailSession();
      const user = type === "visitor" ? userRecord() : userRecord(ids.user, { links: [{ type: "own" }], contacts: [confirmedEmail()] });
      recordFetch(context, () => ({ user, session: { ...base, status } }));
      const storage = new SessionStorage();
      const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
      if (status && typeof status === "object" && Object.keys(status).length === 1 && status.type === "active") {
        const result = await client.user.identify({ user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
        assert.deepEqual(result.session.status, { type: "active" });
        assert.deepEqual(client.session.status, { type: "active" });
        assert.equal(client.hasSession, true);
        assert.equal(client.isAuthenticated, type !== "visitor");
        assert.deepEqual(sessionValues(storage)[0].session.status, { type: "active" });
      } else {
        await assert.rejects(client.user.identify({ user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }), { name: "RangeError", message: "The user session must be active, name its user and carry epoch-millisecond times" });
        assert.equal(client.session, null);
        assert.equal(storage.keys("arky_user_session:").length, 0);
      }
      context.mock.restoreAll();
    }
  }
});

test("an issued answer whose user lacks its links or contacts is refused and never stored", async (context) => {
  const { links: _links, ...unlinked } = userRecord();
  const { contacts: _contacts, ...noContacts } = userRecord();
  for (const user of [unlinked, noContacts]) {
    recordFetch(context, () => ({ user, session: visitorSession() }));
    const storage = new SessionStorage();
    const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: ids.user, session_id: ids.session }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
    await assert.rejects(client.user.identify({ user_id: ids.user, session_id: ids.session }), { name: "RangeError" });
    assert.equal(client.session, null);
    assert.equal(storage.keys("arky_user_session:").length, 0);
    context.mock.restoreAll();
  }
});

test("storefront initialization requires canonical tenant and sales-channel IDs without making a request", (context) => {
  const calls = recordFetch(context, () => { throw new Error("initialize must not fetch"); });
  const client = createStorefront(storefrontIdentity, idFactories);
  assert.equal(client.getLocale(), "");
  assert.equal(client.getMarket(), "");
  assert.equal("getTenantId" in client, false);
  assert.equal("forTenant" in client, false);
  for (const identity of [undefined, null, "arky_pk_removed", {},
    { ...storefrontIdentity, tenantId: "tenant" },
    { ...storefrontIdentity, salesChannelId: "channel" },
    { ...storefrontIdentity, tenantId: ids.tenant.toUpperCase() },
    { ...storefrontIdentity, salesChannelId: ids.channel.toUpperCase() },
  ]) {
    assert.throws(() => createStorefront(identity, idFactories), /canonical UUID v4/);
  }
  assert.equal(calls.length, 0);
});

test("requests use the production URL by default and force the tenant, sales-channel and context headers", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const root = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, locale: "en" });
  root.setContext({ market: "bih" });
  await root.eshop.packageItem.find(
    { package_id: ids.package, limit: 1, tenant_id: "caller-tenant", market: "caller-market" },
    { headers: { Authorization: "Bearer arky_api_caller", "x-arky-tenant-id": otherStorefrontIdentity.tenantId, "x-arky-sales-channel-id": otherStorefrontIdentity.salesChannelId, "x-arky-locale": "caller-locale", "x-arky-market": "caller-market" } },
  );
  await root.eshop.packageItem.find({ package_id: ids.package, limit: 1 }, { locale: "it", market: "ita" });
  assert.equal(root.getLocale(), "en");
  assert.equal(root.getMarket(), "bih");
  assert.equal(calls[0].href, `https://api.arky.io/v1/storefront/package-items?package_id=${ids.package}&limit=1`);
  assert.equal(calls[0].headers.get("x-arky-tenant-id"), storefrontIdentity.tenantId);
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
  const setup = { name: "Tenant", timezone: "Europe/Sarajevo", languages: ["en", "bs"], payment_options: [] };
  const calls = recordFetch(context, async (call) => {
    if (call.path !== "/v1/storefront") throw new Error(`Unexpected setup request: ${call.path}`);
    await response;
    return setup;
  });
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
  assert.equal(calls.length, 0);
  const first = client.getSetup();
  const second = client.getSetup();
  assert.equal("getSetup" in client.tenant, false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  release();
  assert.deepEqual(await first, setup);
  assert.deepEqual(await second, setup);
  assert.deepEqual(await client.getSetup(), setup);
  assert.equal(calls.length, 1);
  assert.equal(client.hasSession, false);
});

function abortableSetupFetch(context, setup) {
  const releases = [];
  const calls = recordFetch(context, (call) => {
    if (call.path !== "/v1/storefront") throw new Error(`Unexpected setup request: ${call.path}`);
    return new Promise((resolve, reject) => {
      releases.push(() => resolve(setup));
      call.signal?.addEventListener("abort", () => reject(new DOMException("This operation was aborted", "AbortError")), { once: true });
    });
  });
  return { calls, releases };
}

function setupClient() {
  return createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
}

const abortedRead = (error) => error.code === "aborted" && error.aborted === true;

test("a caller that aborts its setup read leaves the shared request running for the callers still waiting", async (context) => {
  const setup = { name: "Tenant", timezone: "Europe/Sarajevo", languages: ["en", "bs"], payment_options: [] };
  const { calls, releases } = abortableSetupFetch(context, setup);
  const client = setupClient();
  const first = new AbortController();
  const second = new AbortController();
  const firstRead = client.getSetup({ signal: first.signal });
  const secondRead = client.getSetup({ signal: second.signal });
  const unsignalledRead = client.getSetup();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1, "the three callers share one request");
  first.abort();
  await assert.rejects(firstRead, abortedRead, "the caller that aborted gets its own rejection");
  second.abort();
  await assert.rejects(secondRead, abortedRead);
  assert.equal(calls[0].signal.aborted, false, "a caller is still waiting, so the shared request goes on");
  releases[0]();
  assert.deepEqual(await unsignalledRead, setup);
  assert.deepEqual(await client.getSetup({ signal: new AbortController().signal }), setup);
  assert.equal(calls.length, 1);
});

test("a remount after every caller aborted reads the setup again instead of the cancelled request", async (context) => {
  const setup = { name: "Tenant", timezone: "Europe/Sarajevo", languages: ["en"], payment_options: [] };
  const { calls, releases } = abortableSetupFetch(context, setup);
  const client = setupClient();
  const alreadyAborted = new AbortController();
  alreadyAborted.abort();
  await assert.rejects(client.getSetup({ signal: alreadyAborted.signal }), abortedRead);
  assert.equal(calls.length, 0, "an aborted caller starts no request");
  const firstMount = new AbortController();
  const firstRead = client.getSetup({ signal: firstMount.signal });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  firstMount.abort();
  await assert.rejects(firstRead, abortedRead);
  assert.equal(calls[0].signal.aborted, true, "nobody waits any more, so the shared request is cancelled");
  const secondMount = new AbortController();
  const secondRead = client.getSetup({ signal: secondMount.signal });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 2, "the remount starts its own request");
  releases[1]();
  assert.deepEqual(await secondRead, setup);
  assert.deepEqual(await client.getSetup(), setup);
  assert.equal(calls.length, 2);
});

test("package text search keeps its selection, the price range and the continuation together", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next-search-page" }));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "bih", locale: "bs" });
  const selection = { types: ["product"], text: "KOŠULJA-0001", choice: { price: { min_amount: 0, max_amount: 5000 } }, sort: "package_order" };
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
    if (call.path === "/v1/storefront/user/identify") {
      identifyStarted();
      await identifyGate;
      return issued();
    }
    if (call.method === "PATCH" && call.path === "/v1/storefront/user/me") {
      return { user: userRecord(ids.user), session: { ...visitorSession(ids.user, ids.session, visitorTokenA), tenant_id: ids.tenant } };
    }
    throw new Error(`Unexpected visitor request: ${call.path}`);
  });
  const storage = new SessionStorage();
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, locale: "en", market: "bih", sessionStorage: storage });
  await client.eshop.packageItem.find({ package_id: ids.package });
  assert.equal(await client.eshop.cart.getCurrent({ buyer: userBuyer, package_id: ids.package }), null);
  assert.equal(await client.user.getMe(), null);
  assert.equal(calls.filter((call) => call.path.endsWith("/user/identify")).length, 0);
  const first = client.user.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [] });
  const second = client.user.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [] });
  await started;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.filter((call) => call.path.endsWith("/user/identify")).length, 1);
  releaseIdentify();
  assert.deepEqual((await Promise.all([first, second])).map((answer) => answer.user.id), [ids.user, ids.user]);
  const identify = calls.find((call) => call.path.endsWith("/user/identify"));
  assert.deepEqual(identify.body, { user_id: ids.user, session_id: ids.session });
  assert.equal(identify.headers.get("authorization"), null);
  assert.equal(calls.filter((call) => call.path.includes("/carts")).length, 0);
  assert.equal(calls.filter((call) => call.method === "PATCH").length, 2);
  const [key] = storage.keys("arky_user_session:");
  assert.equal(storage.keys("").length, 1);
  assert.ok(key.endsWith(`:${storefrontIdentity.tenantId}:${storefrontIdentity.salesChannelId}`));
  assert.equal(JSON.parse(storage.getItem(key)).version, 5);
  assert.equal(JSON.parse(storage.getItem(key)).session.token, visitorTokenA);
});

test("an expired visitor re-identifies once and retries, while a refused storefront never identifies", async (context) => {
  const expiredToken = `user_visitor_${"c".repeat(64)}`;
  let cartReads = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/user/identify") return issued(visitorTokenB, ids.otherUser, ids.otherSession);
    if (call.path === `/v1/storefront/carts/${ids.cart}`) {
      cartReads += 1;
      return cartReads === 1 ? errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated") : cartRecord({ user_id: ids.otherUser });
    }
    throw new Error(`Unexpected retry request: ${call.path}`);
  });
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: new SessionStorage(storedVisitor(expiredToken)) });
  assert.equal((await client.eshop.cart.get({ id: ids.cart })).id, ids.cart);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${expiredToken}`],
    ["/v1/storefront/user/identify", null],
    [`/v1/storefront/carts/${ids.cart}`, `Bearer ${visitorTokenB}`],
  ]);
  context.mock.restoreAll();
  const refused = recordFetch(context, () => errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated"));
  const invalid = createStorefront(otherStorefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
  await assert.rejects(invalid.eshop.packageItem.find({ package_id: ids.package }), (error) => error.statusCode === 401);
  assert.equal(refused.filter((call) => call.path.endsWith("/user/identify")).length, 0);
  assert.equal(refused.length, 1);
});

test("identify retries its own request once without the expired visitor token", async (context) => {
  const expiredToken = `user_visitor_${"d".repeat(64)}`;
  const calls = recordFetch(context, (call) => {
    assert.equal(call.path, "/v1/storefront/user/identify");
    return call.headers.get("authorization") ? errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated") : issued(visitorTokenB, ids.otherUser, ids.otherSession);
  });
  const storage = new SessionStorage(storedVisitor(expiredToken));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  const result = await client.user.identify({ user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
  assert.equal(result.user.id, ids.otherUser);
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
    if (call.path === "/v1/storefront/user/identify") {
      assert.equal(authorization, null);
      return issued(visitorTokenB, ids.otherUser, ids.otherSession);
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
    return cartRecord({ user_id: ids.otherUser });
  });
  const storage = new SessionStorage(storedVisitor(visitorTokenA));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  const first = client.eshop.cart.get({ id: ids.cart });
  const second = client.eshop.cart.get({ id: ids.cart });
  assert.equal((await first).id, ids.cart);
  releaseSecondOldResponse();
  assert.equal((await second).id, ids.cart);
  assert.equal(calls.filter((call) => call.path.endsWith("/user/identify")).length, 1);
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
  const serverClient = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl });
  await serverClient.content.entry.find({ collection_id: "pages" });
  assert.equal(await serverClient.eshop.cart.getCurrent({ buyer: userBuyer, package_id: ids.package }), null);
  assert.equal(await serverClient.user.getMe(), null);
  await assert.rejects(serverClient.eshop.cart.create({ id: ids.cart, buyer: userBuyer, package_id: ids.package }), /request-local sessionStorage adapter/);
  await assert.rejects(serverClient.user.identify({ user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }), /request-local sessionStorage adapter/);
  assert.equal(calls.length, 1);
});

test("visitor storage is kept apart by API URL, tenant and sales channel", async (context) => {
  recordFetch(context, (call, count) => ({
    user: userRecord(ids.user, { tenant_id: call.headers.get("x-arky-tenant-id") }),
    session: visitorSession(ids.user, ids.session, `user_visitor_${count}`),
  }));
  const storage = new SessionStorage();
  const scopes = [
    [apiUrl, storefrontIdentity],
    [apiUrl, { ...storefrontIdentity, tenantId: ids.otherTenant }],
    [apiUrl, { ...storefrontIdentity, salesChannelId: ids.otherChannel }],
    ["https://other.example.test", storefrontIdentity],
    [`${apiUrl}/Tenant`, storefrontIdentity],
    [`${apiUrl}/tenant`, storefrontIdentity],
  ];
  for (const [endpoint, identity] of scopes) {
    const client = createStorefront(identity, { ...fixedIdFactories, apiUrl: endpoint, sessionStorage: storage });
    assert.equal(client.session, null);
    await client.user.identify({ user_id: ids.user, session_id: ids.session });
  }
  assert.equal(storage.keys("arky_user_session:v5:").length, scopes.length);
  for (const [index, [endpoint, identity]] of scopes.entries()) {
    const key = `arky_user_session:v5:${encodeURIComponent(endpoint)}:${identity.tenantId}:${identity.salesChannelId}`;
    assert.equal(JSON.parse(storage.getItem(key)).session.token, `user_visitor_${index + 1}`);
    assert.equal(createStorefront(identity, { ...fixedIdFactories, apiUrl: endpoint, sessionStorage: storage }).session.id, ids.session);
  }
});

test("a sign-in code and refresh rotate the user session atomically, and logout forgets it", async (context) => {
  const signInId = "3d8f1a62-7c45-4b09-9e2d-6a1c4f8b0e37";
  const user = userRecord(ids.user, {
    links: [{ type: "own" }],
    contacts: [confirmedEmail("person@example.com")],
    profile: [{ id: ids.line, key: "name", type: "text", value: null }],
  });
  const authenticated = emailSession(ids.user, ids.otherSession, { email: "person@example.com" });
  const rotated = emailSession(ids.user, "7e2c9b14-5a63-4d80-b1f7-3c8e0a6d2f95", {
    email: "person@example.com",
    access_token: `user_access_${"u".repeat(64)}`,
    refresh_token: `user_refresh_${"v".repeat(64)}`,
  });
  const calls = recordFetch(context, (call) => {
    switch (call.path) {
      case "/v1/storefront/user/identify":
        return issued(visitorTokenA);
      case "/v1/storefront/user/request-code":
        return {
          user: userRecord(ids.user),
          session: { id: ids.session, tenant_id: ids.tenant, user_id: ids.user, type: { type: "visitor", expires_at: 1_900_000_000_000, sign_in_codes: [] }, status: { type: "active" }, last_seen_at: 2, created_at: 1, updated_at: 2 },
          code: { issued_at: 2, expires_at: 62 },
        };
      case "/v1/storefront/user/verify":
        return { user, session: authenticated };
      case "/v1/storefront/user/refresh":
        return { user, session: rotated };
      case "/v1/storefront/user/me":
        return { user: call.method === "PATCH" ? { ...user, profile: [{ id: ids.line, key: "name", type: "text", value: "Ana" }] } : user, session: { ...rotated, tenant_id: ids.tenant } };
      case "/v1/storefront/user/logout":
        return undefined;
      default:
        throw new Error(`Unexpected user session request: ${call.path}`);
    }
  });
  const storage = new SessionStorage();
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  await assert.rejects(client.user.requestCode({ id: "code-1", contact: { type: "email", email: "person@example.com", language: "en" } }), TypeError);
  const requested = await client.user.requestCode({ id: signInId, contact: { type: "email", email: "person@example.com", language: "en" } });
  assert.equal(requested.code.issued_at, 2);
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
  const verified = await client.user.verify({ code: "123456" });
  assert.equal(verified.session.id, authenticated.id);
  assert.equal(client.isAuthenticated, true);
  assert.deepEqual(client.session, { user, id: authenticated.id, type: "tenant_user_signed_in_by_email", status: { type: "active" }, signed_in_with: { type: "email", email: "person@example.com" } });
  const refreshed = await client.user.refresh({ session_id: rotated.id });
  assert.equal(refreshed.session.id, rotated.id);
  const stored = sessionValues(storage)[0].session;
  assert.deepEqual({ id: stored.id, access_token: stored.access_token, refresh_token: stored.refresh_token }, { id: rotated.id, access_token: rotated.access_token, refresh_token: rotated.refresh_token });
  await client.user.getMe();
  const edited = await client.user.updateMe({ expected_updated_at: user.updated_at, profile: [{ id: ids.line, key: "name", type: "text", value: "Ana" }] });
  assert.equal(edited.user.profile[0].value, "Ana");
  assert.equal(client.session.user.profile[0].value, "Ana");
  await client.user.logout();
  assert.equal(client.session, null);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization"), call.body]), [
    ["/v1/storefront/user/identify", null, { user_id: ids.user, session_id: ids.session }],
    ["/v1/storefront/user/request-code", `Bearer ${visitorTokenA}`, { id: signInId, contact: { type: "email", email: "person@example.com", language: "en" } }],
    ["/v1/storefront/user/verify", `Bearer ${visitorTokenA}`, { session_id: ids.otherSession, code: "123456" }],
    ["/v1/storefront/user/refresh", null, { session_id: rotated.id, refresh_token: authenticated.refresh_token }],
    ["/v1/storefront/user/me", `Bearer ${rotated.access_token}`, null],
    ["/v1/storefront/user/me", `Bearer ${rotated.access_token}`, { expected_updated_at: user.updated_at, profile: [{ id: ids.line, key: "name", type: "text", value: "Ana" }] }],
    ["/v1/storefront/user/logout", `Bearer ${rotated.access_token}`, null],
  ]);
  assert.equal(storage.keys("arky_user_session:").length, 0);
});

test("a refused refresh keeps the signed-in session and is never retried with Authorization", async (context) => {
  const session = emailSession();
  const initialRecord = storedSession(ids.user, session);
  let storedRecord = initialRecord;
  const storage = {
    getItem: (key) => key.startsWith("arky_user_session:v5:") ? storedRecord : null,
    setItem: (_key, value) => {
      storedRecord = value;
    },
    removeItem: (key) => {
      if (key.startsWith("arky_user_session:v5:")) storedRecord = null;
    },
  };
  const calls = recordFetch(context, () => errorResponse(401, "USER_SESSION_REFRESH_REJECTED", "Refresh token rejected"));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  await assert.rejects(client.user.refresh({ session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), /Refresh token rejected/);
  assert.deepEqual(client.session, { user: JSON.parse(initialRecord).user, id: session.id, type: "tenant_user_signed_in_by_email", status: { type: "active" }, signed_in_with: { type: "email", email: session.email } });
  assert.deepEqual(calls.map((call) => [call.href, call.headers.get("authorization"), call.headers.get("x-arky-tenant-id"), call.headers.get("x-arky-sales-channel-id"), call.body]), [
    [`${apiUrl}/v1/storefront/user/refresh`, null, storefrontIdentity.tenantId, storefrontIdentity.salesChannelId, { session_id: ids.otherSession, refresh_token: session.refresh_token }],
  ]);
  assert.equal(storedRecord, initialRecord);
});

test("a stored record with an invalid visitor credential is dropped at startup", () => {
  const removed = [];
  const invalid = storedSession(ids.user, visitorSession(ids.user, ids.session, "invalid-visitor-token"));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories,
    apiUrl,
    sessionStorage: {
      getItem: (key) => key.startsWith("arky_user_session:v5:") ? invalid : null,
      setItem() {},
      removeItem: (key) => removed.push(key),
    },
  });
  assert.equal(client.session, null);
  assert.equal(removed.some((key) => key.startsWith("arky_user_session:v5:")), true);
});

test("a profile answer that lands after a sign-in leaves the signed-in user alone, while the caller still gets it", async (context) => {
  const signedInUser = userRecord(ids.otherUser, { links: [{ type: "own" }], contacts: [confirmedEmail()], profile: [{ id: ids.line, key: "name", type: "text", value: "Signed" }] });
  const signedIn = emailSession(ids.otherUser, ids.otherSession);
  const answers = new Map();
  const calls = recordFetch(context, async (call) => {
    if (call.path === "/v1/storefront/user/verify") return { user: signedInUser, session: signedIn };
    if (call.path === "/v1/storefront/user/me") {
      const gate = answers.get(call.method);
      await gate.waiting;
      return { user: userRecord(ids.user, { profile: [{ id: ids.line, key: "name", type: "text", value: call.method === "PATCH" ? "Edited" : "Visitor" }] }), session: { ...visitorSession(), tenant_id: ids.tenant } };
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
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  const reading = client.user.getMe();
  const editing = client.user.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [{ id: ids.line, key: "name", type: "text", value: "Edited" }] });
  await new Promise((resolve) => setImmediate(resolve));
  await client.user.verify({ code: "123456" });
  answers.get("GET").release();
  answers.get("PATCH").release();
  assert.equal((await reading).user.profile[0].value, "Visitor");
  assert.equal((await editing).user.profile[0].value, "Edited");
  assert.equal(client.session.user.id, ids.otherUser);
  assert.equal(client.session.user.profile[0].value, "Signed");
  assert.equal(client.session.id, ids.otherSession);
  const stored = sessionValues(storage)[0];
  assert.equal(stored.user.id, ids.otherUser);
  assert.equal(stored.user.profile[0].value, "Signed");
  assert.equal(stored.session.access_token, signedIn.access_token);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", "/v1/storefront/user/me"],
    ["PATCH", "/v1/storefront/user/me"],
    ["POST", "/v1/storefront/user/verify"],
  ]);
});

test("a profile answer for the session that asked updates the stored user", async (context) => {
  recordFetch(context, (call) => ({ user: userRecord(ids.user, { profile: [{ id: "name", key: "name", type: "text", value: call.method === "PATCH" ? "Ana" : "Visitor" }] }), session: { ...visitorSession(), tenant_id: ids.tenant } }));
  const storage = new SessionStorage(storedVisitor());
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: storage });
  await client.user.getMe();
  assert.equal(client.session.user.profile[0].value, "Visitor");
  await client.user.updateMe({ expected_updated_at: 1_700_000_000_000, profile: [{ id: "name", key: "name", type: "text", value: "Ana" }] });
  assert.equal(client.session.user.profile[0].value, "Ana");
  assert.equal(sessionValues(storage)[0].user.profile[0].value, "Ana");
  assert.equal(sessionValues(storage)[0].session.token, visitorTokenA);
});

const refreshedAccess = `user_access_${"u".repeat(64)}`;
const refreshedRefresh = `user_refresh_${"w".repeat(64)}`;

function signedInUser() {
  return userRecord(ids.user, { name: { first_name: "Ana", last_name: "Anić" }, links: [{ type: "own" }], contacts: [confirmedEmail()] });
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
  const user = signedInUser();
  const first = emailSession(ids.user, ids.session);
  const second = emailSession(ids.user, "7e2c9b14-5a63-4d80-b1f7-3c8e0a6d2f95", { access_token: refreshedAccess, refresh_token: refreshedRefresh });
  const firstRecord = JSON.stringify({ version: 5, user, session: first });
  const secondRecord = JSON.stringify({ version: 5, user, session: second });
  const storage = new SessionStorage(firstRecord);
  let refreshes = 0;
  let writeOnOldToken = false;
  const calls = recordFetch(context, (call) => {
    const authorization = call.headers.get("authorization");
    if (call.path === "/v1/storefront/user/refresh") {
      refreshes += 1;
      return refreshes === 1 && call.body.refresh_token === first.refresh_token
        ? { user, session: second }
        : errorResponse(401, "GENERAL.UNAUTHENTICATED", "Refresh refused");
    }
    if (call.path === "/v1/storefront/user/me") {
      if (authorization === `Bearer ${first.access_token}`) {
        if (writeOnOldToken) storage.setItem(storage.keys("arky_user_session:v5:")[0], secondRecord);
        return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Expired");
      }
      return { user, session: { ...second, tenant_id: ids.tenant } };
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const tabA = plainStorefront({ sessionStorage: storage });
  const tabB = plainStorefront({ sessionStorage: storage });
  await tabA.user.getMe();
  assert.equal(refreshes, 1);
  const [key] = storage.keys("arky_user_session:v5:");
  assert.equal(JSON.parse(storage.getItem(key)).session.access_token, refreshedAccess);
  calls.length = 0;
  await tabB.user.getMe();
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [["/v1/storefront/user/me", `Bearer ${refreshedAccess}`]]);
  storage.setItem(key, firstRecord);
  writeOnOldToken = true;
  calls.length = 0;
  await tabB.user.getMe();
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization")]), [
    ["/v1/storefront/user/me", `Bearer ${first.access_token}`],
    ["/v1/storefront/user/me", `Bearer ${refreshedAccess}`],
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
  await tab.user.identify({ user_id: ids.user, session_id: ids.session });
  const key = localStorage.key(0);
  assert.ok(key.startsWith("arky_user_session:v5:"));
  const seen = [];
  const unsubscribe = tab.onAuthStateChanged((session) => seen.push(session));
  await new Promise((resolve) => setImmediate(resolve));
  const user = signedInUser();
  const other = emailSession(ids.user, "7e2c9b14-5a63-4d80-b1f7-3c8e0a6d2f95", { access_token: refreshedAccess, refresh_token: refreshedRefresh });
  localStorage.setItem(key, JSON.stringify({ version: 5, user, session: other }));
  browser.dispatchEvent(Object.assign(new Event("storage"), { key }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(seen.at(-1), { user, id: other.id, type: "tenant_user_signed_in_by_email", status: { type: "active" }, signed_in_with: { type: "email", email: other.email } });
  unsubscribe();
});

test("a browser that refuses storage keeps the session in the tab and reports it", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/user/identify"
    ? issued(visitorTokenA)
    : { user: userRecord(ids.user), session: { id: ids.session, tenant_id: ids.tenant, user_id: ids.user } });
  const refuse = () => {
    throw new DOMException("Storage is blocked", "SecurityError");
  };
  const blocked = plainStorefront({ sessionStorage: { getItem: refuse, setItem: refuse, removeItem: refuse } });
  assert.equal(blocked.sessionStorageUnavailable, true);
  await blocked.user.identify({ user_id: ids.user, session_id: ids.session });
  assert.equal(blocked.hasSession, true);
  await blocked.user.getMe();
  assert.equal(calls.at(-1).headers.get("authorization"), `Bearer ${visitorTokenA}`);

  const browser = new EventTarget();
  Object.defineProperty(browser, "localStorage", { get: refuse });
  installWindow(context, browser);
  const refusedDefault = plainStorefront();
  assert.equal(refusedDefault.sessionStorageUnavailable, true);
  await refusedDefault.user.identify({ user_id: ids.user, session_id: ids.session });
  assert.equal(refusedDefault.hasSession, true);
  await refusedDefault.user.getMe();
  assert.equal(calls.at(-1).headers.get("authorization"), `Bearer ${visitorTokenA}`);

  assert.equal(plainStorefront({ sessionStorage: new MemoryStorage() }).sessionStorageUnavailable, false);
});

test("a_first_cart_read_and_get_me_send_no_identify", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/user/identify") return issued();
    if (call.method === "POST" && call.path === "/v1/storefront/carts") {
      return { type: "created", cart: cartRecord({ id: call.body.id }), recovery_token: "cart-recovery-token" };
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const visitorIdentity = { user_id: ids.user, session_id: ids.session };
  const client = createStorefront(storefrontIdentity, { ...fixedIdFactories, visitorIdentity, apiUrl, locale: "en", market: "bih", sessionStorage: new SessionStorage() });
  assert.equal(await client.eshop.cart.getCurrent({ buyer: userBuyer, package_id: ids.package }), null);
  assert.equal(await client.user.getMe(), null);
  assert.equal(client.hasSession, false);
  const store = initialize(storefrontIdentity, { ...fixedIdFactories, visitorIdentity, apiUrl, locale: "en", market: "bih", sessionStorage: new SessionStorage() });
  const cart = store.eshop.cart({ buyer: userBuyer, package_id: ids.package });
  assert.equal(await cart.load(), null);
  assert.equal(await store.user.getMe(), null);
  assert.equal(cart.status.get().error, null);
  assert.equal(store.hasSession, false);
  assert.deepEqual(calls, []);
  assert.equal((await cart.ensure()).id, ids.picked);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/user/identify"],
    ["POST", "/v1/storefront/carts"],
  ]);
  assert.equal(store.hasSession, true);
  assert.equal(client.hasSession, false);
});
