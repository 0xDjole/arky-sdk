import assert from "node:assert/strict";
import test from "node:test";
import { ArkyApiError, createNetworkCustomer, createStorefront } from "../dist/storefront.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  confirmedEmail,
  customerRecord,
  errorResponse,
  fixedIdFactories,
  ids,
  recordFetch,
  storefrontIdentity,
  visitorSession,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const networkId = ids.network;
const signInId = "2b7d4e90-6c15-4a38-8f2e-9d1c5b7a3e64";
const keyId = "4e8a1c37-9b25-4d60-a3f7-1c5e9b2d7f48";
const base = `/v1/networks/${networkId}/customer`;
const storageKey = `arky_network_customer_session:v1:${encodeURIComponent(apiUrl)}:${networkId}`;
const storeKeyToken = `customer_store_key_${"k".repeat(64)}`;

function authToken(overrides = {}) {
  return {
    id: signInId,
    access_token: `network_customer_access_${"a".repeat(43)}`,
    refresh_token: `network_customer_refresh_${"r".repeat(43)}`,
    access_expires_at: 1_900_000_000_000,
    refresh_expires_at: 1_900_000_600_000,
    authenticated_at: 1_700_000_000_000,
    reach: { type: "network" },
    ...overrides,
  };
}

function signedInStorage(token = authToken()) {
  const storage = new MemoryStorage();
  storage.seed(storageKey, JSON.stringify({ version: 1, token }));
  return storage;
}

function portal(storage = new MemoryStorage()) {
  return createNetworkCustomer({ apiUrl, networkId, sessionStorage: storage });
}

function storeKey(overrides = {}) {
  return {
    customer: customerRecord(ids.customer, { links: [{ type: "own" }], contacts: [confirmedEmail("patient@example.test")] }),
    session: {
      type: "network_customer_store_key",
      id: keyId,
      customer_id: ids.customer,
      status: { type: "active" },
      access_token: storeKeyToken,
    },
    ...overrides,
  };
}

const me = {
  account_id: ids.account,
  logins: [{ type: "customer_email", email: "patient@example.test", language: "bs", since: 1 }],
  session: { id: signInId, reach: { type: "network" }, signed_in_with: { type: "email", email: "patient@example.test" }, authenticated_at: 1, access_expires_at: 2, refresh_expires_at: 3 },
};

test("a network customer asks for a code without credentials, reaching the network or one store, and the verified sign-in is kept in the given storage", async (context) => {
  const pending = { session_id: signInId, code_expires_at: 1_700_000_600_000 };
  const token = authToken();
  const calls = recordFetch(context, (call) => (call.path.endsWith("/verify") ? token : pending));
  const storage = new MemoryStorage();
  const client = portal(storage);
  const heard = [];
  client.onAuthStateChanged((session) => heard.push(session));
  assert.equal(client.isAuthenticated, false);
  assert.equal(client.session, null);
  const contact = { type: "email", email: "patient@example.test", language: "bs" };
  assert.deepEqual(await client.requestCode({ session_id: signInId, reach: { type: "network" }, contact }), pending);
  await client.requestCode({ session_id: signInId, reach: { type: "store", store_id: ids.store }, contact: { type: "phone", number: "+38761222333", language: "bs" } });
  assert.deepEqual(await client.verify({ session_id: signInId, code: "123456" }), token);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(client.session, { id: signInId, reach: { type: "network" } });
  assert.equal(client.isAuthenticated, true);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), { version: 1, token });
  assert.deepEqual(heard.at(-1), { id: signInId, reach: { type: "network" } });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/code`, { session_id: signInId, reach: { type: "network" }, contact }],
    ["POST", `${base}/code`, { session_id: signInId, reach: { type: "store", store_id: ids.store }, contact: { type: "phone", number: "+38761222333", language: "bs" } }],
    ["POST", `${base}/verify`, { session_id: signInId, code: "123456" }],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), null);
  assert.throws(() => client.requestCode({ session_id: "sign-in", reach: { type: "network" }, contact }), TypeError);
  assert.throws(() => client.requestCode({ session_id: signInId, reach: { type: "store", store_id: "store" }, contact }), TypeError);
  assert.throws(() => client.requestCode({ session_id: signInId, reach: { type: "everywhere" }, contact }), {
    name: "TypeError",
    message: "A network customer sign-in reaches the network or one store",
  });
  assert.equal(calls.length, 3);
});

test("a signed-in network customer reads itself and changes its logins and linked stores on its own bearer, and deleting the account forgets the sign-in", async (context) => {
  const key = storeKey();
  const calls = recordFetch(context, (call) => {
    if (call.path === `${base}/stores` && call.method === "GET") return { items: [{ store_id: ids.store, name: "Klinika" }], cursor: null };
    if (call.path.endsWith("/keys") || call.path.endsWith("/invites/accept")) return key;
    if (call.path.endsWith("/link")) return { removed: true };
    if (call.path === `${base}/me` && call.method === "DELETE") return { deleted: true };
    if (call.path.endsWith("/logins/code")) return { code_expires_at: 1_700_000_600_000 };
    return me;
  });
  const storage = signedInStorage();
  const client = portal(storage);
  const address = { type: "email", email: "second@example.test" };
  assert.deepEqual(await client.getMe(), me);
  await client.login.requestCode({ contact: { type: "email", email: "second@example.test", language: "bs" } });
  await client.login.verify({ address, code: "654321", confirm_join: true });
  await client.login.remove({ address });
  assert.deepEqual(await client.store.find({ limit: 10 }), { items: [{ store_id: ids.store, name: "Klinika" }], cursor: null });
  await client.store.find();
  assert.deepEqual(await client.store.openKey({ store_id: ids.store, id: keyId, visitor_token: visitorToken }), key);
  await client.store.openKey({ store_id: ids.store, id: keyId, visitor_token: null });
  await client.store.acceptInvite({ store_id: ids.store, id: keyId, code: "778899", sent_to: { type: "phone", number: "+38761222333" } });
  assert.deepEqual(await client.store.removeLink({ store_id: ids.store }), { removed: true });
  assert.deepEqual(await client.deleteAccount(), { deleted: true });
  assert.equal(client.session, null);
  assert.equal(storage.getItem(storageKey), null);
  assert.equal(await client.getMe(), null);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${base}/me`, {}, null],
    ["POST", `${base}/logins/code`, {}, { contact: { type: "email", email: "second@example.test", language: "bs" } }],
    ["POST", `${base}/logins/verify`, {}, { address, code: "654321", confirm_join: true }],
    ["POST", `${base}/logins/remove`, {}, { address }],
    ["GET", `${base}/stores`, { limit: "10" }, null],
    ["GET", `${base}/stores`, {}, null],
    ["POST", `${base}/stores/${ids.store}/keys`, {}, { id: keyId, visitor_token: visitorToken }],
    ["POST", `${base}/stores/${ids.store}/keys`, {}, { id: keyId, visitor_token: null }],
    ["POST", `${base}/stores/${ids.store}/invites/accept`, {}, { id: keyId, code: "778899", sent_to: { type: "phone", number: "+38761222333" } }],
    ["DELETE", `${base}/stores/${ids.store}/link`, {}, null],
    ["DELETE", `${base}/me`, {}, null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${authToken().access_token}`);
  assert.throws(() => client.store.openKey({ store_id: ids.store, id: "key", visitor_token: null }), TypeError);
  assert.throws(() => client.store.acceptInvite({ store_id: ids.store, id: "key", code: "778899", sent_to: { type: "phone", number: "+38761222333" } }), TypeError);
});

test("an expired access token is refreshed once without credentials and the call goes on with the new one", async (context) => {
  const rotated = authToken({ access_token: `network_customer_access_${"b".repeat(43)}`, refresh_token: `network_customer_refresh_${"s".repeat(43)}` });
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/refresh")) return rotated;
    if (call.headers.get("authorization") === `Bearer ${authToken().access_token}`) return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Access expired");
    return me;
  });
  const storage = signedInStorage();
  const client = portal(storage);
  assert.deepEqual(await client.getMe(), me);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body, ]), [
    ["GET", `${base}/me`, null],
    ["POST", `${base}/refresh`, { refresh_token: authToken().refresh_token }],
    ["GET", `${base}/me`, null],
  ]);
  assert.deepEqual(calls.map((call) => call.headers.get("authorization")), [`Bearer ${authToken().access_token}`, null, `Bearer ${rotated.access_token}`]);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)).token, rotated);
});

test("a refresh Arky refuses forgets the sign-in, and a refresh answer for another sign-in is refused without keeping it", async (context) => {
  let refresh = () => errorResponse(401, "GENERAL.UNAUTHENTICATED", "Refresh refused");
  const calls = recordFetch(context, (call) => (call.path.endsWith("/refresh") ? refresh() : me));
  const storage = signedInStorage();
  const client = portal(storage);
  await assert.rejects(client.refresh(), (error) => error instanceof ArkyApiError && error.statusCode === 401);
  assert.equal(client.session, null);
  assert.equal(storage.getItem(storageKey), null);
  await assert.rejects(client.refresh(), (error) => error.code === "no_session");
  const other = signedInStorage();
  const otherClient = portal(other);
  refresh = () => authToken({ id: keyId });
  await assert.rejects(otherClient.refresh(), (error) => error.code === "answer_mismatch");
  assert.deepEqual(otherClient.session, { id: signInId, reach: { type: "network" } });
  assert.equal(calls.filter((call) => call.path.endsWith("/refresh")).length, 2);
});

test("logout ends the sign-in on Arky and forgets it here, even when the answer is lost", async (context) => {
  let lose = false;
  const calls = recordFetch(context, () => {
    if (lose) throw new TypeError("Lost response");
    return { ended: true };
  });
  const client = portal(signedInStorage());
  assert.deepEqual(await client.logout(), { type: "ended", session_id: signInId });
  assert.equal(client.session, null);
  assert.deepEqual(await client.logout(), { type: "local_only" });
  lose = true;
  const lost = portal(signedInStorage());
  assert.deepEqual(await lost.logout(), { type: "unconfirmed", session_id: signInId });
  assert.equal(lost.session, null);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/logout`, null],
    ["POST", `${base}/logout`, null],
  ]);
});

test("a stored sign-in that isn't a whole network customer token is dropped at startup", () => {
  for (const token of [
    authToken({ access_token: `customer_access_${"a".repeat(43)}` }),
    authToken({ id: "sign-in" }),
    authToken({ reach: { type: "store", store_id: "store" } }),
    authToken({ reach: { type: "network", store_id: ids.store } }),
  ]) {
    const storage = signedInStorage(token);
    const client = portal(storage);
    assert.equal(client.session, null);
    assert.equal(storage.getItem(storageKey), null);
  }
  const older = new MemoryStorage();
  older.seed(storageKey, JSON.stringify({ version: 2, token: authToken() }));
  assert.equal(portal(older).session, null);
  assert.throws(() => createNetworkCustomer({ apiUrl, networkId: "network" }), TypeError);
  assert.throws(() => createNetworkCustomer({ apiUrl: "ftp://api.example.test", networkId }), TypeError);
});

test("a store key opened by the network sign-in becomes the storefront session, sent as the bearer, with no refresh and no sign-in address", async (context) => {
  const answer = { customer: storeKey().customer, session: { ...storeKey().session, store_id: ids.store } };
  const calls = recordFetch(context, () => answer);
  const storefront = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  assert.equal(storefront.customer.visitorToken, visitorToken);
  assert.equal(storefront.isAuthenticated, false);
  const used = storefront.customer.useStoreKey(storeKey());
  assert.deepEqual(used, storeKey());
  assert.equal(storefront.session.type, "network_customer_store_key");
  assert.equal(storefront.session.signed_in_with, null);
  assert.equal(storefront.isAuthenticated, true);
  assert.equal(storefront.customer.visitorToken, null);
  assert.deepEqual(await storefront.customer.getMe(), answer);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${storeKeyToken}`);
  await assert.rejects(storefront.customer.refresh({ session_id: ids.otherSession }), (error) => error.code === "no_session" && error.message === "Only a store sign-in by email or phone has a refresh token");
  assert.equal(calls.length, 1);
});

test("useStoreKey takes only a store key for this store's customer", () => {
  const storefront = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  assert.throws(() => storefront.customer.useStoreKey({ customer: customerRecord(), session: visitorSession() }), {
    name: "TypeError",
    message: "A store key comes from the network customer sign-in's openKey or acceptInvite",
  });
  const otherStore = storeKey();
  otherStore.customer = { ...otherStore.customer, store_id: ids.otherStore };
  assert.throws(() => storefront.customer.useStoreKey(otherStore), (error) => error.code === "answer_mismatch");
  const otherCustomer = storeKey();
  otherCustomer.session = { ...otherCustomer.session, customer_id: ids.otherCustomer };
  assert.throws(() => storefront.customer.useStoreKey(otherCustomer), (error) => error.code === "answer_mismatch");
  assert.equal(storefront.session.type, "visitor");
});

test("a store key Arky refuses is dropped and a new visitor carries the call on", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") {
      return { customer: customerRecord(ids.otherCustomer), session: visitorSession(ids.otherCustomer, ids.otherSession, `customer_visitor_${"n".repeat(64)}`) };
    }
    if (call.headers.get("authorization") === `Bearer ${storeKeyToken}`) return errorResponse(401, "GENERAL.UNAUTHENTICATED", "The store key is revoked");
    return { customer: customerRecord(ids.otherCustomer), session: { ...visitorSession(ids.otherCustomer, ids.otherSession), store_id: ids.store } };
  });
  const storefront = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  storefront.customer.useStoreKey(storeKey());
  await storefront.customer.getMe();
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.headers.get("authorization")]), [
    ["GET", "/v1/storefront/customer/me", `Bearer ${storeKeyToken}`],
    ["POST", "/v1/storefront/customer/identify", null],
    ["GET", "/v1/storefront/customer/me", `Bearer customer_visitor_${"n".repeat(64)}`],
  ]);
  assert.equal(storefront.session.type, "visitor");
  assert.equal(storefront.session.id, ids.otherSession);
  assert.equal(storefront.isAuthenticated, false);
});
