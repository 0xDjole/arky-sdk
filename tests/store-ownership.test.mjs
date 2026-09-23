import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.store-ownership.test";
const storeId = "8ccad9a6-502e-440b-8373-b0fbaf36154c";
const accountId = "a35bc883-e98c-4fa9-94a2-8cbb7c3ac755";

test("platform discovery keeps sorting and opaque continuation without hidden page reads", async (context) => {
  const calls = [];
  const cursor = "platform:/+==" + "x".repeat(1_024);
  context.mock.method(globalThis, "fetch", async (url) => {
    const parsed = new URL(url); calls.push(parsed);
    return new Response(JSON.stringify({ items: [], cursor: parsed.searchParams.has("cursor") ? null : cursor }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  });
  const admin = createAdmin({ baseUrl, storeId, apiToken: "arky_account_access_contract" });
  const stores = { query: "Workspace", limit: 1, sort_field: "name", sort_direction: "desc" };
  assert.deepEqual(await admin.store.find(stores), { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(await admin.store.find({ ...stores, cursor }), { items: [], cursor: null });
  assert.equal(calls[1].pathname, "/v1/stores");
  assert.deepEqual(Object.fromEntries(calls[1].searchParams), { ...stores, limit: "1", cursor });
  const accounts = { query: "operator", limit: 1, sort_field: "email", sort_direction: "asc" };
  assert.deepEqual(await admin.account.search(accounts), { items: [], cursor });
  assert.equal(calls.length, 3);
  assert.deepEqual(await admin.account.search({ ...accounts, cursor }), { items: [], cursor: null });
  assert.equal(calls[3].pathname, "/v1/accounts/search");
  assert.deepEqual(Object.fromEntries(calls[3].searchParams), { ...accounts, limit: "1", cursor });
});

test("membership permissions use an exact Store read while own discovery preserves opaque pages", async (context) => {
  const calls = [];
  const cursor = "memberships:/+==";
  const membership = { id: "member", store_id: storeId, account_id: accountId, role: "owner", status: { type: "active" },
    invited_by_account_id: null, invited_at: null, invitation_email_status: null, joined_at: 1, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers) });
    const body = parsed.pathname.endsWith("/membership") ? membership : { items: [], cursor: parsed.searchParams.has("cursor") ? null : cursor };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl, storeId, apiToken: "arky_account_access_contract" });
  assert.deepEqual(await admin.store.member.getOwn({}, { headers: { "X-Trace-Id": "permission" } }), membership);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/membership`);
  assert.equal(calls[0].headers.get("X-Trace-Id"), "permission");
  assert.deepEqual(await admin.store.member.findOwn({ limit: 20 }), { items: [], cursor });
  assert.equal(calls.length, 2);
  assert.deepEqual(await admin.store.member.findOwn({ limit: 20, cursor }), { items: [], cursor: null });
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { limit: "20", cursor });
  assert.equal(calls[2].url.pathname, "/v1/stores/memberships");
  assert.ok(calls.every(({ method }) => method === "GET"));
  await assert.rejects(admin.store.member.getOwn({ store_id: "slug" }), /canonical Store UUID/);
  assert.equal(calls.length, 3);
});

test("ownership transfer uses one explicit Admin command and returns the new Owner", async (context) => {
  const membership = {
    id: "2e4ca7d0-bc54-4b2d-a595-9751bf3ff761",
    store_id: storeId, account_id: accountId, role: "owner", status: { type: "active" },
    invited_by_account_id: null, invited_at: null, invitation_email_status: null,
    joined_at: 1_800_000_000_000, created_at: 1_800_000_000_000, updated_at: 1_800_000_000_123,
  };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), ...init });
    return new Response(JSON.stringify(membership), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl, storeId, apiToken: "arky_account_access_contract" });
  const controller = new AbortController();
  assert.deepEqual(await admin.store.member.transferOwnership({ account_id: accountId }, {
    signal: controller.signal, headers: { "X-Trace-Id": "owner-transfer" },
  }), membership);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/ownership/transfer`);
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(JSON.parse(calls[0].body), { account_id: accountId });
  assert.equal(new Headers(calls[0].headers).get("X-Trace-Id"), "owner-transfer");
  const override = "577bb7bf-3052-46d9-a9cc-0e15720bb68e";
  await admin.store.member.transferOwnership({ store_id: override, account_id: accountId });
  assert.equal(calls[1].url.pathname, `/v1/stores/${override}/ownership/transfer`);
  assert.equal("transferOwnership" in createStorefront(`arky_pk_${"o".repeat(42)}A`, { apiUrl: baseUrl }), false);
});

test("invalid transfer identities fail before sending a command", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls += 1; throw new Error("unexpected request"); });
  const admin = createAdmin({ baseUrl, storeId, apiToken: "arky_account_access_contract" });
  for (const account_id of ["", "slug", accountId.toUpperCase()]) {
    await assert.rejects(admin.store.member.transferOwnership({ account_id }), /canonical Store and Account UUIDs/);
  }
  await assert.rejects(admin.store.member.transferOwnership({ store_id: "store-slug", account_id: accountId }), /canonical Store and Account UUIDs/);
  assert.equal(calls, 0);
});
