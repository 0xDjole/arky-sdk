import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { MemoryStorage, QueuedLockManager } from "./helpers/durable-request-fixtures.mjs";

const logoutBaseUrl = "https://logout.test";
const logoutStorageKey = `arky_admin_session:${logoutBaseUrl}`;
const loginSessionId = "5f3c9a21-7e46-4b08-9d2c-1a6e8b4f0c37";
const laterSessionId = "8d1b6f47-2a93-4c05-b7e8-4f0a2c9d6e13";
const loginStoreId = "2b7d4e90-6c15-4a38-8f2e-9d1c5b7a3e64";

function installWindow(context) {
  const storage = new MemoryStorage();
  for (const [name, value] of [
    ["window", Object.assign(new EventTarget(), { localStorage: storage })],
    ["navigator", { locks: new QueuedLockManager() }],
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    context.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    });
  }
  return storage;
}

function storedLogin(overrides = {}) {
  return {
    id: loginSessionId,
    access_token: "access-current", refresh_token: "refresh-current",
    email: "operator@example.test", ...overrides,
  };
}

function issuedCredentials(overrides = {}) {
  const { email: _email, ...login } = storedLogin(overrides);
  return { ...login, access_expires_at: Date.now() + 600_000, refresh_expires_at: Date.now() + 3_600_000, authenticated_at: 1, created_at: 1, updated_at: 2 };
}

function recordFetch(context, reply) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = {
      url: String(url), method: init.method ?? "GET",
      authorization: new Headers(init.headers).get("authorization"),
      body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
    };
    calls.push(call);
    const [status, body] = await reply(call);
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  });
  return calls;
}

test("own credential lists forward bounded pages and preserve tagged statuses without hidden reads", async (context) => {
  const cursor = "account:/+==";
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, headers: new Headers(init.headers) });
    const body = { items: [{ id: "credential", status: { type: "revoked" } }], cursor: parsed.searchParams.has("cursor") ? null : cursor };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: "https://credentials.test" });
  for (const [api, path] of [[admin.account.session, "sessions"], [admin.account.token, "tokens"]]) {
    const count = calls.length;
    const first = await api.find({ limit: 1 }, { headers: { "X-Trace-Id": "credential-page" } });
    assert.equal(calls.length, count + 1);
    assert.equal(first.cursor, cursor);
    assert.deepEqual(first.items[0].status, { type: "revoked" });
    const next = await api.find({ limit: 1, cursor: first.cursor });
    assert.equal(calls.length, count + 2);
    assert.equal(next.cursor, null);
    assert.equal(calls[count].url.pathname, `/v1/accounts/me/${path}`);
    assert.equal(calls[count].headers.get("X-Trace-Id"), "credential-page");
    assert.deepEqual(Object.fromEntries(calls[count + 1].url.searchParams), { limit: "1", cursor });
    await api.find();
    assert.equal(calls.length, count + 3);
    assert.equal(calls[count + 2].url.search, "");
  }
});

test("an account token is made under the app's id, shown once, revoked and deleted by version", async (context) => {
  const tokenId = "3d8f1b62-7c49-4e05-a1d3-9b6e2f4c8a17";
  const storeId = "c7e2a915-4d38-4b60-8f1e-2a5d9c3b7e46";
  const value = `arky_at_${"V".repeat(42)}A`;
  const token = {
    id: tokenId, account_id: "0f4c7a29-5e13-4d86-b2a7-6c9e1f3d5b80", name: "CI",
    token_hint: value.slice(0, 16), stores: { type: "only", store_ids: [storeId] },
    expires_at: null, status: { type: "active" }, created_at: 1, updated_at: 1,
  };
  const revoked = { ...token, status: { type: "revoked", revoked_at: 2 }, updated_at: 2 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    const call = { method: init.method ?? "GET", path: parsed.pathname, query: Object.fromEntries(parsed.searchParams), body: init.body === undefined ? null : JSON.parse(String(init.body)) };
    calls.push(call);
    if (call.method === "DELETE") return new Response(JSON.stringify({ deleted: true }), { status: 200, headers: { "content-type": "application/json" } });
    const answer = call.path.endsWith("/revoke") ? revoked : calls.length === 1 ? { type: "secret_created", token, value } : { type: "existing", token };
    return new Response(JSON.stringify(answer), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ apiUrl: "https://credentials.test" }).account.token;
  const request = { id: tokenId, name: "CI", stores: token.stores, expires_at: null };
  assert.deepEqual(await api.create(request), { type: "secret_created", token, value });
  assert.deepEqual(await api.create(request), { type: "existing", token });
  assert.deepEqual(await api.revoke({ id: tokenId, expected_updated_at: 1 }), revoked);
  assert.deepEqual(await api.delete({ id: tokenId, expected_updated_at: 2 }), { deleted: true });
  assert.deepEqual(calls, [
    { method: "POST", path: "/v1/accounts/me/tokens", query: {}, body: request },
    { method: "POST", path: "/v1/accounts/me/tokens", query: {}, body: request },
    { method: "POST", path: `/v1/accounts/me/tokens/${tokenId}/revoke`, query: {}, body: { expected_updated_at: 1 } },
    { method: "DELETE", path: `/v1/accounts/me/tokens/${tokenId}`, query: { expected_updated_at: "2" }, body: null },
  ]);
  for (const invented of [undefined, "ci-token", tokenId.toUpperCase()]) {
    await assert.rejects(async () => api.create({ ...request, id: invented }), { name: "TypeError", message: /account token id must be a canonical UUID/ });
  }
  assert.equal(calls.length, 4);
  assert.equal("update" in api, false);
  assert.equal("apiToken" in createAdmin({ apiUrl: "https://credentials.test" }).account, false);
});

test("an admin client takes only an account token, sends it as the Bearer credential and never refreshes it", async (context) => {
  const token = `arky_at_${"k".repeat(42)}A`;
  const calls = recordFetch(context, () => [401, { message: "Account token is revoked", error: "GENERAL.UNAUTHENTICATED", status_code: 401, validation_errors: [] }]);
  const admin = createAdmin({ apiUrl: "https://credentials.test", accountToken: ` ${token}\n` });
  await assert.rejects(admin.account.getMe(), { statusCode: 401, code: "GENERAL.UNAUTHENTICATED" });
  assert.deepEqual(calls, [{ url: "https://credentials.test/v1/accounts/me", method: "GET", authorization: `Bearer ${token}`, body: undefined }]);
  for (const refused of ["", "arky_sk_secret", `arky_pk_${"a".repeat(42)}A`, `account_access_${"a".repeat(43)}`, `arky_at_${"a".repeat(42)}B`, `arky_at_${"a".repeat(41)}A`, `arky_at_${"a".repeat(42)}A`.toUpperCase()]) {
    assert.throws(() => createAdmin({ apiUrl: "https://credentials.test", accountToken: refused }), { name: "TypeError", message: /account token is required/ });
  }
  assert.equal(calls.length, 1);
});

test("Admin logout revokes the exact persisted server Session with its current access credential", async (context) => {
  const storage = installWindow(context);
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? [200, true] : [200, issuedCredentials()]);
  const admin = createAdmin({ apiUrl: logoutBaseUrl });
  await admin.account.auth.verify({ session_id: "pending-login", code: "123456", store_id: loginStoreId });
  const persisted = JSON.parse(storage.getItem(logoutStorageKey));
  assert.equal(persisted.id, loginSessionId);
  assert.deepEqual(Object.keys(persisted).sort(), ["access_token", "id", "refresh_token"]);
  assert.deepEqual(admin.session, { id: loginSessionId, email: undefined });

  assert.deepEqual(await admin.logout(), { type: "revoked", session_id: loginSessionId });
  assert.deepEqual(calls.slice(1), [{
    url: `${logoutBaseUrl}/v1/accounts/me/sessions/${loginSessionId}`, method: "DELETE",
    authorization: "Bearer access-current", body: undefined,
  }]);
  assert.equal(storage.getItem(logoutStorageKey), null);
  assert.equal(admin.session, null);
  assert.equal(admin.isAuthenticated, false);
  assert.deepEqual(await admin.logout(), { type: "local_only" });
  assert.equal(calls.length, 2);
});

test("a lost, refused or unexpected revocation response clears that login and reports an unconfirmed server outcome", async (context) => {
  const storage = installWindow(context);
  const outcomes = [
    () => { throw new TypeError("revocation response was lost"); },
    () => [500, { message: "Internal error", status_code: 500 }],
    () => [401, { message: "Unauthorized", status_code: 401 }],
    () => [200, false],
  ];
  let outcome = outcomes[0];
  const calls = recordFetch(context, () => outcome());
  const admin = createAdmin({ apiUrl: logoutBaseUrl });
  for (const next of outcomes) {
    outcome = next;
    storage.seed(logoutStorageKey, JSON.stringify(storedLogin()));
    const before = calls.length;
    assert.deepEqual(await admin.logout(), { type: "unconfirmed", session_id: loginSessionId });
    assert.equal(calls.length, before + 1);
    assert.equal(calls[before].method, "DELETE");
    assert.equal(calls[before].url, `${logoutBaseUrl}/v1/accounts/me/sessions/${loginSessionId}`);
    assert.equal(storage.getItem(logoutStorageKey), null);
    assert.equal(admin.session, null);
  }
});

test("logout without a local login is local-only and an account token client revokes nothing", async (context) => {
  installWindow(context);
  const calls = recordFetch(context, () => [200, true]);
  assert.deepEqual(await createAdmin({ apiUrl: logoutBaseUrl }).logout(), { type: "local_only" });
  const tokenClient = createAdmin({ apiUrl: logoutBaseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await tokenClient.logout(), { type: "account_token" });
  assert.equal(tokenClient.isAuthenticated, true);
  assert.equal(tokenClient.session, null);
  assert.equal(calls.length, 0);
});

test("a logout Arky refuses for its access credential rotates once and revokes again", async (context) => {
  const storage = installWindow(context);
  let refreshed = issuedCredentials({ access_token: "access-rotated", refresh_token: "refresh-rotated" });
  let revocations = 0;
  const expired = [401, { message: "Expired", status_code: 401, error: "GENERAL.UNAUTHENTICATED" }];
  const calls = recordFetch(context, (call) => {
    if (call.method !== "DELETE") return [200, refreshed];
    revocations += 1;
    return revocations % 2 === 1 ? expired : [200, true];
  });
  const admin = createAdmin({ apiUrl: logoutBaseUrl });
  const revocation = (authorization) => ({ url: `${logoutBaseUrl}/v1/accounts/me/sessions/${loginSessionId}`, method: "DELETE", authorization, body: undefined });
  storage.seed(logoutStorageKey, JSON.stringify(storedLogin()));

  assert.deepEqual(await admin.logout(), { type: "revoked", session_id: loginSessionId });
  assert.deepEqual(calls, [
    revocation("Bearer access-current"),
    { url: `${logoutBaseUrl}/v1/auth/refresh`, method: "POST", authorization: null, body: { refresh_token: "refresh-current" } },
    revocation("Bearer access-rotated"),
  ]);
  assert.equal(storage.getItem(logoutStorageKey), null);

  refreshed = issuedCredentials({ id: laterSessionId, access_token: "access-foreign" });
  revocations = 0;
  storage.seed(logoutStorageKey, JSON.stringify(storedLogin()));
  assert.deepEqual(await admin.logout(), { type: "unconfirmed", session_id: loginSessionId });
  assert.equal(calls.length, 5);
  assert.deepEqual(calls[3], revocation("Bearer access-current"));
  assert.equal(calls[4].url, `${logoutBaseUrl}/v1/auth/refresh`);
  assert.equal(storage.getItem(logoutStorageKey), null);
});

test("a later login survives the completion of an earlier logout", async (context) => {
  const storage = installWindow(context);
  const laterLogin = storedLogin({ id: laterSessionId, access_token: "access-later", refresh_token: "refresh-later" });
  const calls = recordFetch(context, () => {
    storage.seed(logoutStorageKey, JSON.stringify(laterLogin));
    return [200, true];
  });
  const admin = createAdmin({ apiUrl: logoutBaseUrl });
  storage.seed(logoutStorageKey, JSON.stringify(storedLogin()));

  assert.deepEqual(await admin.logout(), { type: "revoked", session_id: loginSessionId });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].authorization, "Bearer access-current");
  assert.deepEqual(JSON.parse(storage.getItem(logoutStorageKey)), laterLogin);
  assert.deepEqual(admin.session, { id: laterSessionId, email: "operator@example.test" });
});


test("account deletion returns the accepted deleting account", async (context) => {
  installWindow(context);
  const account = { id: loginSessionId, email: "operator@example.test", access: { type: "regular" }, status: { type: "deleting" }, created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? [202, account] : [200, issuedCredentials()]);
  const admin = createAdmin({ apiUrl: logoutBaseUrl });
  await admin.account.auth.verify({ session_id: loginSessionId, code: "123456" });
  assert.deepEqual(await admin.account.delete(), account);
  assert.deepEqual(calls.at(-1), { url: `${logoutBaseUrl}/v1/accounts`, method: "DELETE", authorization: "Bearer access-current", body: undefined });
});
