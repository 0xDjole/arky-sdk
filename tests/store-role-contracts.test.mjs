import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { hasStorePermission, storeLocationReadReach, storePermissionReach } from "../dist/utils.js";

const baseUrl = "https://api.store-roles.test";
const storeId = "8ccad9a6-502e-440b-8373-b0fbaf36154c";
const accountId = "a35bc883-e98c-4fa9-94a2-8cbb7c3ac755";
const roleId = "5b7e2c94-1d38-4f60-a9e5-3c8d0f2b6a17";
const locationA = "0d4f8b26-7a13-4c95-b2e8-6f1a3d9c5e70";
const locationB = "9e3a6c10-4b27-4d8f-a5c1-2e7b9d0f3a64";

test("platform discovery keeps sorting and opaque continuation without hidden page reads", async (context) => {
  const calls = [];
  const cursor = "platform:/+==" + "x".repeat(1_024);
  context.mock.method(globalThis, "fetch", async (url) => {
    const parsed = new URL(url); calls.push(parsed);
    return new Response(JSON.stringify({ items: [], cursor: parsed.searchParams.has("cursor") ? null : cursor }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  });
  const admin = createAdmin({ baseUrl, apiToken: "arky_account_access_contract" });
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
  const membership = { id: "member", store_id: storeId, store_name: "Contract Store", account_id: accountId, role_ids: [roleId],
    access: { permissions: [{ type: "fulfillment", locations: { type: "only", store_location_ids: [locationA] } }] }, status: { type: "active" },
    created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers) });
    const body = parsed.pathname.endsWith("/membership") ? membership : { items: [], cursor: parsed.searchParams.has("cursor") ? null : cursor };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl, apiToken: "arky_account_access_contract" });
  assert.deepEqual(await admin.store.member.getOwn({ store_id: storeId }, { headers: { "X-Trace-Id": "permission" } }), membership);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/membership`);
  assert.equal(calls[0].headers.get("X-Trace-Id"), "permission");
  assert.deepEqual(await admin.store.member.findOwn({ limit: 20 }), { items: [], cursor });
  assert.equal(calls.length, 2);
  assert.deepEqual(await admin.store.member.findOwn({ limit: 20, cursor }), { items: [], cursor: null });
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { limit: "20", cursor });
  assert.equal(calls[2].url.pathname, "/v1/stores/memberships");
  assert.ok(calls.every(({ method }) => method === "GET"));
  for (const store_id of [undefined, "slug", storeId.toUpperCase()]) {
    await assert.rejects(async () => admin.store.member.getOwn({ store_id }), { name: "TypeError", message: "A Store target must be an explicit canonical UUID-v4" });
  }
  assert.equal(calls.length, 3);
});

test("store roles are created under an app-picked id and use exact routes, versioned updates and versioned deletes", async (context) => {
  const role = { id: roleId, store_id: storeId, key: "warehouse", permissions: [{ type: "inventory", locations: { type: "everywhere" } }],
    created_at: 1, updated_at: 2 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    const body = init.method === "DELETE"
      ? { deleted: true }
      : (init.method ?? "GET") === "GET" && parsed.pathname.endsWith("/roles") ? { items: [role], cursor: null } : role;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl, apiToken: "arky_account_access_contract" });
  assert.deepEqual(await admin.store.role.create({ store_id: storeId, id: roleId, key: role.key, permissions: role.permissions }), role);
  await admin.store.role.update({ store_id: storeId, id: roleId, expected_updated_at: 2, key: "picker", permissions: [{ type: "fulfillment", locations: { type: "only", store_location_ids: [locationA] } }] });
  await admin.store.role.get({ store_id: storeId, id: roleId });
  assert.deepEqual(await admin.store.role.find({ store_id: storeId, limit: 20 }), { items: [role], cursor: null });
  assert.deepEqual(await admin.store.role.delete({ store_id: storeId, id: roleId, expected_updated_at: 3 }), { deleted: true });
  assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname + url.search]), [
    ["POST", `/v1/stores/${storeId}/roles`],
    ["PUT", `/v1/stores/${storeId}/roles/${roleId}`],
    ["GET", `/v1/stores/${storeId}/roles/${roleId}`],
    ["GET", `/v1/stores/${storeId}/roles?limit=20`],
    ["DELETE", `/v1/stores/${storeId}/roles/${roleId}?expected_updated_at=3`],
  ]);
  assert.deepEqual(calls[0].body, { id: roleId, key: "warehouse", permissions: role.permissions });
  assert.deepEqual(calls[1].body, { expected_updated_at: 2, key: "picker", permissions: [{ type: "fulfillment", locations: { type: "only", store_location_ids: [locationA] } }] });
  await assert.rejects(async () => admin.store.role.create({ store_id: storeId, id: "warehouse", key: role.key, permissions: role.permissions }), {
    name: "TypeError",
    message: "The role id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 5);
});

test("members are added, invited and re-roled by role ids", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(String(url).endsWith("/roles") ? { id: "member", role_ids: [roleId] } : true), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl, apiToken: "arky_account_access_contract" });
  await admin.store.member.add({ store_id: storeId, email: "picker@example.test", role_ids: [roleId] });
  await admin.store.member.invite({ store_id: storeId, email: "packer@example.test", role_ids: [roleId] });
  await admin.store.member.updateRoles({ store_id: storeId, account_id: accountId, expected_updated_at: 5, role_ids: [roleId] });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/members`, { email: "picker@example.test", role_ids: [roleId] }],
    ["POST", `/v1/stores/${storeId}/invitation`, { email: "packer@example.test", role_ids: [roleId] }],
    ["PUT", `/v1/stores/${storeId}/members/${accountId}/roles`, { expected_updated_at: 5, role_ids: [roleId] }],
  ]);
  await assert.rejects(async () => admin.store.member.updateRoles({ store_id: storeId, account_id: "slug", expected_updated_at: 5, role_ids: [] }), { name: "TypeError", message: /account id must be a canonical UUID/ });
  assert.equal(calls.length, 3);
});

test("the owner transfers the Store and members are paused and resumed by status", async (context) => {
  const store = { id: storeId, name: "Contract Store", owner_account_id: accountId };
  const membership = { id: "member", store_id: storeId, account_id: accountId, role_ids: [roleId], status: { type: "disabled" }, created_at: 1, updated_at: 6 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    const body = parsed.pathname.endsWith("/ownership/transfer") ? store : membership;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl, apiToken: "arky_account_access_contract" });
  assert.deepEqual(await admin.store.member.transferOwnership({ store_id: storeId, account_id: accountId }), store);
  assert.deepEqual(await admin.store.member.changeStatus({ store_id: storeId, account_id: accountId, expected_updated_at: 5, status: { type: "disabled" } }), membership);
  await admin.store.member.changeStatus({ store_id: storeId, account_id: accountId, expected_updated_at: 6, status: { type: "active" } });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/ownership/transfer`, { account_id: accountId }],
    ["PUT", `/v1/stores/${storeId}/members/${accountId}/status`, { expected_updated_at: 5, status: { type: "disabled" } }],
    ["PUT", `/v1/stores/${storeId}/members/${accountId}/status`, { expected_updated_at: 6, status: { type: "active" } }],
  ]);
  await assert.rejects(async () => admin.store.member.transferOwnership({ store_id: storeId, account_id: "slug" }), { name: "TypeError", message: /account id must be a canonical UUID/ });
  await assert.rejects(async () => admin.store.member.changeStatus({ store_id: storeId, account_id: accountId.toUpperCase(), expected_updated_at: 6, status: { type: "active" } }), { name: "TypeError", message: /account id must be a canonical UUID/ });
  await assert.rejects(async () => admin.store.member.remove({ store_id: storeId, account_id: "slug" }), TypeError);
  assert.equal(calls.length, 3);
  assert.equal("transferOwnership" in createStorefront(`arky_pk_${"o".repeat(42)}A`, { apiUrl: baseUrl }), false);
  assert.equal("buildHook" in admin.store, false);
});

test("store access helpers mirror the Server's permission and location reach rules", () => {
  const picker = { permissions: [
    { type: "fulfillment", locations: { type: "only", store_location_ids: [locationB] } },
    { type: "inventory", locations: { type: "only", store_location_ids: [locationA] } },
  ] };
  assert.equal(hasStorePermission(picker, "fulfillment", locationB), true);
  assert.equal(hasStorePermission(picker, "fulfillment", locationA), false);
  assert.equal(hasStorePermission(picker, "fulfillment"), false);
  assert.equal(hasStorePermission(picker, "orders"), false);
  assert.deepEqual(storeLocationReadReach(picker), { type: "only", store_location_ids: [locationA, locationB].sort() });
  const mixed = { permissions: [...picker.permissions, { type: "orders" }] };
  assert.deepEqual(storeLocationReadReach(mixed), { type: "everywhere" });
  assert.equal(hasStorePermission(mixed, "orders"), true);
  const admin = { permissions: [{ type: "admin" }] };
  assert.equal(hasStorePermission(admin, "fulfillment", locationA), true);
  assert.equal(hasStorePermission(admin, "analytics"), true);
  assert.deepEqual(storePermissionReach(admin, "inventory"), { type: "everywhere" });
  assert.deepEqual(storeLocationReadReach(admin), { type: "everywhere" });
  assert.equal(storePermissionReach(picker, "catalog"), null);
  assert.equal(hasStorePermission(null, "admin"), false);
  assert.deepEqual(storeLocationReadReach(null), { type: "only", store_location_ids: [] });
  const twoRoles = { permissions: [
    { type: "fulfillment", locations: { type: "only", store_location_ids: [locationA] } },
    { type: "fulfillment", locations: { type: "everywhere" } },
  ] };
  assert.equal(hasStorePermission(twoRoles, "fulfillment"), true);
});

test("own workspace discovery retains each Store name and access without public presentation reads", async (context) => {
  const calls = [];
  const memberships = ["First Store", "Second Store"].map((store_name, index) => ({
    id: `membership-${index}`, store_id: index === 0 ? storeId : accountId, store_name, account_id: accountId,
    role_ids: [roleId], access: { permissions: [{ type: "orders" }] }, status: { type: "active" },
    created_at: 1, updated_at: 1,
  }));
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ path: new URL(url).pathname, method: init.method ?? "GET" });
    return Response.json({ items: memberships, cursor: null });
  });
  const admin = createAdmin({ baseUrl, apiToken: "arky_account_access_contract" });
  const page = await admin.store.member.findOwn({ limit: 20 });
  assert.deepEqual(page.items.map(({ store_name }) => store_name), ["First Store", "Second Store"]);
  assert.deepEqual(calls, [{ path: "/v1/stores/memberships", method: "GET" }]);
});
