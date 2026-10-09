import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const logoutBaseUrl = "https://logout.test";
const logoutStorageKey = `arky_admin_session:${logoutBaseUrl}`;
const loginSessionId = "5f3c9a21-7e46-4b08-9d2c-1a6e8b4f0c37";
const laterSessionId = "8d1b6f47-2a93-4c05-b7e8-4f0a2c9d6e13";
const loginStoreId = "2b7d4e90-6c15-4a38-8f2e-9d1c5b7a3e64";

function installWindow(context) {
  const storage = new MemoryStorage();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true, writable: true, value: Object.assign(new EventTarget(), { localStorage: storage }),
  });
  context.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else delete globalThis.window;
  });
  return storage;
}

function storedLogin(overrides = {}) {
  return {
    id: loginSessionId,
    access_token: "access-current", refresh_token: "refresh-current",
    access_expires_at: Date.now() + 600_000, email: "operator@example.test", ...overrides,
  };
}

function issuedCredentials(overrides = {}) {
  const { email: _email, ...login } = storedLogin(overrides);
  return { ...login, refresh_expires_at: Date.now() + 3_600_000, authenticated_at: 1, created_at: 1, updated_at: 2 };
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
    const body = { items: [{ id: "credential", status: { type: "revoked", revoked_at: 5 } }], cursor: parsed.searchParams.has("cursor") ? null : cursor };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://credentials.test", apiToken: "arky_account_access_contract" });
  for (const [api, path] of [[admin.account.apiToken, "api-tokens"], [admin.account.session, "sessions"]]) {
    const count = calls.length;
    const first = await api.list({ limit: 1 }, { headers: { "X-Trace-Id": "credential-page" } });
    assert.equal(calls.length, count + 1);
    assert.equal(first.cursor, cursor);
    assert.deepEqual(first.items[0].status, { type: "revoked", revoked_at: 5 });
    const next = await api.list({ limit: 1, cursor: first.cursor });
    assert.equal(calls.length, count + 2);
    assert.equal(next.cursor, null);
    assert.equal(calls[count].url.pathname, `/v1/accounts/me/${path}`);
    assert.equal(calls[count].headers.get("X-Trace-Id"), "credential-page");
    assert.deepEqual(Object.fromEntries(calls[count + 1].url.searchParams), { limit: "1", cursor });
    await api.list();
    assert.equal(calls.length, count + 3);
    assert.equal(calls[count + 2].url.search, "");
  }
});

test("an API token create sends the app-picked id once and refuses an invented or malformed one", async (context) => {
  const calls = recordFetch(context, () => [200, { type: "created", token: { id: loginSessionId }, value: "arky_api_secret" }]);
  const admin = createAdmin({ baseUrl: "https://credentials.test", apiToken: "arky_account_access_contract" });
  const created = await admin.account.apiToken.create({ id: loginSessionId, name: "Deploy", expires_at: null });
  assert.equal(created.type, "created");
  assert.deepEqual(calls.map((call) => [call.method, call.url, call.body]), [
    ["POST", "https://credentials.test/v1/accounts/me/api-tokens", { id: loginSessionId, name: "Deploy", expires_at: null }],
  ]);
  for (const id of [undefined, "", "token-1", loginSessionId.toUpperCase()]) {
    await assert.rejects(async () => admin.account.apiToken.create({ id, name: "Deploy", expires_at: null }), TypeError);
  }
  assert.equal(calls.length, 1);
});

test("Admin logout revokes the exact persisted server Session with its current access credential", async (context) => {
  const storage = installWindow(context);
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? [200, true] : [200, issuedCredentials()]);
  const admin = createAdmin({ baseUrl: logoutBaseUrl });
  await admin.account.auth.storeVerify(loginStoreId, { session_id: "pending-login", code: "123456" });
  const persisted = JSON.parse(storage.getItem(logoutStorageKey));
  assert.equal(persisted.id, loginSessionId);
  assert.deepEqual(Object.keys(persisted).sort(), ["access_expires_at", "access_token", "id", "refresh_token"]);
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
  const admin = createAdmin({ baseUrl: logoutBaseUrl });
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

test("logout without a local login is local-only and an API token client revokes nothing", async (context) => {
  installWindow(context);
  const calls = recordFetch(context, () => [200, true]);
  assert.deepEqual(await createAdmin({ baseUrl: logoutBaseUrl }).logout(), { type: "local_only" });
  const tokenClient = createAdmin({ baseUrl: logoutBaseUrl, apiToken: "arky_account_access_contract" });
  assert.deepEqual(await tokenClient.logout(), { type: "api_token" });
  assert.equal(tokenClient.isAuthenticated, true);
  assert.equal(tokenClient.session, null);
  assert.equal(calls.length, 0);
});

test("logout refreshes an expired access credential once before its single revocation", async (context) => {
  const storage = installWindow(context);
  let refreshed = issuedCredentials({ access_token: "access-rotated", refresh_token: "refresh-rotated" });
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? [200, true] : [200, refreshed]);
  const admin = createAdmin({ baseUrl: logoutBaseUrl });
  storage.seed(logoutStorageKey, JSON.stringify(storedLogin({ access_expires_at: 1 })));

  assert.deepEqual(await admin.logout(), { type: "revoked", session_id: loginSessionId });
  assert.deepEqual(calls, [
    { url: `${logoutBaseUrl}/v1/auth/refresh`, method: "POST", authorization: null, body: { refresh_token: "refresh-current" } },
    { url: `${logoutBaseUrl}/v1/accounts/me/sessions/${loginSessionId}`, method: "DELETE", authorization: "Bearer access-rotated", body: undefined },
  ]);
  assert.equal(storage.getItem(logoutStorageKey), null);

  refreshed = issuedCredentials({ id: laterSessionId, access_token: "access-foreign" });
  storage.seed(logoutStorageKey, JSON.stringify(storedLogin({ access_expires_at: 1 })));
  assert.deepEqual(await admin.logout(), { type: "unconfirmed", session_id: loginSessionId });
  assert.equal(calls.length, 3);
  assert.equal(calls[2].url, `${logoutBaseUrl}/v1/auth/refresh`);
  assert.equal(storage.getItem(logoutStorageKey), null);
});

test("a later login survives the completion of an earlier logout", async (context) => {
  const storage = installWindow(context);
  const laterLogin = storedLogin({ id: laterSessionId, access_token: "access-later", refresh_token: "refresh-later" });
  const calls = recordFetch(context, () => {
    storage.seed(logoutStorageKey, JSON.stringify(laterLogin));
    return [200, true];
  });
  const admin = createAdmin({ baseUrl: logoutBaseUrl });
  storage.seed(logoutStorageKey, JSON.stringify(storedLogin()));

  assert.deepEqual(await admin.logout(), { type: "revoked", session_id: loginSessionId });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].authorization, "Bearer access-current");
  assert.deepEqual(JSON.parse(storage.getItem(logoutStorageKey)), laterLogin);
  assert.deepEqual(admin.session, { id: laterSessionId, email: "operator@example.test" });
});
