import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { hasStorePermission, storeLocationReadReach, storePermissionReach } from "../dist/utils.js";
import { fixedIdFactories, recordFetch } from "./helpers/arky-fixtures.mjs";

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
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const stores = { query: "Workspace", limit: 1, sort_field: "name", sort_direction: "desc" };
  assert.deepEqual(await admin.store.find(stores), { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(await admin.store.find({ ...stores, cursor }), { items: [], cursor: null });
  assert.equal(calls[1].pathname, "/v1/stores");
  assert.deepEqual(Object.fromEntries(calls[1].searchParams), { ...stores, limit: "1", cursor });
  const accounts = { query: "operator", limit: 1, sort_field: "email", sort_direction: "asc" };
  assert.deepEqual(await admin.account.find(accounts), { items: [], cursor });
  assert.equal(calls.length, 3);
  assert.deepEqual(await admin.account.find({ ...accounts, cursor }), { items: [], cursor: null });
  assert.equal(calls[3].pathname, "/v1/accounts/search");
  assert.deepEqual(Object.fromEntries(calls[3].searchParams), { ...accounts, limit: "1", cursor });
});

test("membership permissions use an exact Store read while own discovery preserves opaque pages", async (context) => {
  const calls = [];
  const cursor = "memberships:/+==";
  const membership = { id: "member", store_id: storeId, store_name: "Contract Store", store_type: { type: "live", account_id: accountId, network_id: storeId }, role_ids: [roleId],
    access: { permissions: [{ type: "fulfillment", locations: { type: "only", store_location_ids: [locationA] } }] }, status: { type: "active", account_id: accountId },
    created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers) });
    const body = parsed.pathname.endsWith("/membership") ? membership : { items: [], cursor: parsed.searchParams.has("cursor") ? null : cursor };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
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
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
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
  assert.equal(calls[4].body, null);
  await assert.rejects(async () => admin.store.role.create({ store_id: storeId, id: "warehouse", key: role.key, permissions: role.permissions }), {
    name: "TypeError",
    message: "The role id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 5);
});

test("members are invited by caller-picked identity and re-roled by membership id", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(String(url).endsWith("/roles") ? { id: "member", role_ids: [roleId] } : true), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const contact = { email: "packer@example.test", language: "bs" };
  await admin.store.member.invite({ store_id: storeId, id: accountId, contact, role_ids: [roleId] });
  await admin.store.member.updateRoles({ store_id: storeId, id: accountId, expected_updated_at: 5, role_ids: [roleId] });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/invitation`, { id: accountId, contact, role_ids: [roleId] }],
    ["PUT", `/v1/stores/${storeId}/members/${accountId}/roles`, { expected_updated_at: 5, role_ids: [roleId] }],
  ]);
  await assert.rejects(async () => admin.store.member.updateRoles({ store_id: storeId, id: "slug", expected_updated_at: 5, role_ids: [] }), { name: "TypeError", message: /membership id must be a canonical UUID/ });
  assert.equal(calls.length, 2);
});

test("a member's locations are set by membership id, from the invite on", async (context) => {
  const membership = { id: accountId, store_id: storeId, role_ids: [roleId], store_location_ids: [locationA], status: { type: "invited", contact: { email: "doctor@example.test", language: "bs" } }, created_at: 1, updated_at: 6 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(membership), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await admin.store.member.updateLocations({ store_id: storeId, id: accountId, expected_updated_at: 5, store_location_ids: [locationA] }), membership);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["PUT", `/v1/stores/${storeId}/members/${accountId}/locations`, { expected_updated_at: 5, store_location_ids: [locationA] }],
  ]);
  await assert.rejects(async () => admin.store.member.updateLocations({ store_id: storeId, id: "slug", expected_updated_at: 5, store_location_ids: [] }), { name: "TypeError", message: /membership id must be a canonical UUID/ });
  assert.equal(calls.length, 1);
});

test("the owner transfers the Store and members are paused and resumed by status", async (context) => {
  const store = { id: storeId, name: "Contract Store", type: { type: "live", account_id: accountId, network_id: storeId } };
  const membership = { id: "member", store_id: storeId, role_ids: [roleId], status: { type: "disabled", account_id: accountId }, created_at: 1, updated_at: 6 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    const body = parsed.pathname.endsWith("/ownership/transfer") ? store : membership;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await admin.store.member.transferOwnership({ store_id: storeId, account_id: accountId, expected_updated_at: 4 }), store);
  assert.deepEqual(await admin.store.member.changeStatus({ store_id: storeId, id: accountId, expected_updated_at: 5, status: { type: "disabled" } }), membership);
  await admin.store.member.changeStatus({ store_id: storeId, id: accountId, expected_updated_at: 6, status: { type: "active" } });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/ownership/transfer`, { account_id: accountId, expected_updated_at: 4 }],
    ["PUT", `/v1/stores/${storeId}/members/${accountId}/status`, { expected_updated_at: 5, status: { type: "disabled" } }],
    ["PUT", `/v1/stores/${storeId}/members/${accountId}/status`, { expected_updated_at: 6, status: { type: "active" } }],
  ]);
  await assert.rejects(async () => admin.store.member.transferOwnership({ store_id: storeId, account_id: "slug" }), { name: "TypeError", message: /account id must be a canonical UUID/ });
  await assert.rejects(async () => admin.store.member.changeStatus({ store_id: storeId, id: accountId.toUpperCase(), expected_updated_at: 6, status: { type: "active" } }), { name: "TypeError", message: /membership id must be a canonical UUID/ });
  await assert.rejects(async () => admin.store.member.remove({ store_id: storeId, id: "slug" }), TypeError);
  assert.equal(calls.length, 3);
  assert.equal("transferOwnership" in createStorefront({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: baseUrl }), false);
  assert.equal("buildHook" in admin.store, false);
});

test("a role and an account token give orders, payments and customers read-only or read-write access exactly as sent", async (context) => {
  const permissions = [
    { type: "orders", access: "read" },
    { type: "payments", access: "write" },
    { type: "customers", customers: { type: "all" }, access: "read" },
    { type: "packages" },
  ];
  const tokenId = "6a1c3e85-7b29-4d04-9f6e-2c8a0d4b6e13";
  const stores = { type: "only", store_ids: [storeId] };
  const calls = recordFetch(context, (call) => call.path.endsWith("/tokens") ? { type: "secret_created", token: { id: tokenId, stores, expires_at: null }, value: `arky_at_${"v".repeat(42)}A` } : { id: roleId, permissions });
  const admin = createAdmin({ apiUrl: baseUrl });
  await admin.store.role.create({ store_id: storeId, id: roleId, key: "bookkeeping", permissions });
  await admin.account.token.create({ id: tokenId, name: "Reports", stores, expires_at: null });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/roles`, { id: roleId, key: "bookkeeping", permissions }],
    ["POST", "/v1/accounts/me/tokens", { id: tokenId, name: "Reports", stores, expires_at: null }],
  ]);
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
  const paymentsOnly = { permissions: [{ type: "payments", access: "write" }] };
  assert.equal(hasStorePermission(paymentsOnly, "payments"), true);
  assert.equal(hasStorePermission(paymentsOnly, "orders"), false);
  assert.deepEqual(storeLocationReadReach(paymentsOnly), { type: "everywhere" });
  assert.equal(hasStorePermission(paymentsOnly, "inventory", locationA), false);
  assert.equal(hasStorePermission(paymentsOnly, "fulfillment", locationA), false);
  assert.deepEqual(storeLocationReadReach(picker), { type: "only", store_location_ids: [locationA, locationB].sort() });
  const mixed = { permissions: [...picker.permissions, { type: "orders", access: "read" }] };
  assert.deepEqual(storeLocationReadReach(mixed), { type: "everywhere" });
  assert.equal(hasStorePermission(mixed, "orders"), true);
  const readOnly = { permissions: [{ type: "orders", access: "read" }, { type: "payments", access: "read" }, { type: "customers", customers: { type: "own" }, access: "read" }] };
  for (const type of ["orders", "payments", "customers"]) assert.equal(hasStorePermission(readOnly, type), true, type);
  assert.equal(hasStorePermission(readOnly, "packages"), false);
  const admin = { permissions: [{ type: "admin" }] };
  assert.equal(hasStorePermission(admin, "fulfillment", locationA), true);
  assert.equal(hasStorePermission(admin, "analytics"), true);
  for (const type of ["private_collections", "customer_entries", "calls"]) assert.equal(hasStorePermission(admin, type), false, type);
  const calls = { permissions: [{ type: "admin" }, { type: "calls", phone_numbers: { type: "all" }, customers: { type: "all" } }] };
  assert.equal(hasStorePermission(calls, "calls"), true);
  assert.deepEqual(storePermissionReach(admin, "inventory"), { type: "everywhere" });
  assert.deepEqual(storeLocationReadReach(admin), { type: "everywhere" });
  assert.equal(storePermissionReach(picker, "packages"), null);
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
    id: `membership-${index}`, store_id: index === 0 ? storeId : accountId, store_name,
    role_ids: [roleId], access: { permissions: [{ type: "orders", access: index === 0 ? "write" : "read" }] }, status: { type: "active", account_id: accountId },
    created_at: 1, updated_at: 1,
  }));
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ path: new URL(url).pathname, method: init.method ?? "GET" });
    return Response.json({ items: memberships, cursor: null });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const page = await admin.store.member.findOwn({ limit: 20 });
  assert.deepEqual(page.items.map(({ store_name }) => store_name), ["First Store", "Second Store"]);
  assert.deepEqual(page.items.map(({ access }) => access.permissions[0]), [{ type: "orders", access: "write" }, { type: "orders", access: "read" }]);
  assert.deepEqual(calls, [{ path: "/v1/stores/memberships", method: "GET" }]);
});

test("a nonexpiring email invite is explicitly resent and accepted with its current version", async (context) => {
  const contact = { email: "packer@example.test", language: "en" };
  const invited = { id: "member", store_id: storeId, store_name: "Contract Store", store_type: { type: "live", account_id: accountId, network_id: storeId }, role_ids: [roleId], access: { permissions: [] }, status: { type: "invited", contact }, created_at: 1, updated_at: 2 };
  const accepted = { id: "member", store_id: storeId, role_ids: [roleId], status: { type: "active", account_id: accountId }, created_at: 1, updated_at: 3 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    const call = { url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null };
    calls.push(call);
    const body = parsed.pathname.endsWith("/invitation") ? true : parsed.pathname.endsWith("/membership/accept") ? accepted : invited;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const invite = { store_id: storeId, id: accountId, contact, role_ids: [roleId] };
  assert.equal(await admin.store.member.invite(invite), true);
  assert.equal(await admin.store.member.resendInvite({ store_id: storeId, id: accountId, expected_updated_at: 2 }), true);
  const own = await admin.store.member.getOwn({ store_id: storeId });
  assert.deepEqual(own.status, { type: "invited", contact });
  assert.deepEqual(await admin.store.member.acceptInvite({ store_id: storeId, expected_updated_at: own.updated_at }), accepted);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${storeId}/invitation`, { id: accountId, contact, role_ids: [roleId] }],
    ["POST", `/v1/stores/${storeId}/members/${accountId}/invitation`, { expected_updated_at: 2 }],
    ["GET", `/v1/stores/${storeId}/membership`, null],
    ["POST", `/v1/stores/${storeId}/membership/accept`, { expected_updated_at: 2 }],
  ]);
  for (const store_id of [undefined, "slug", storeId.toUpperCase()]) {
    await assert.rejects(async () => admin.store.member.acceptInvite({ store_id, expected_updated_at: 2 }), { name: "TypeError", message: "A Store target must be an explicit canonical UUID-v4" });
  }
  assert.equal(calls.length, 4);
});

test("a store's email sending is paused with a reason and allowed again, each with the store version", async (context) => {
  const paused = { id: storeId, name: "Contract Store", type: { type: "live", account_id: accountId, network_id: storeId }, email_sending: { type: "paused", reason: "Bounce rate review" }, updated_at: 5 };
  const allowed = { ...paused, email_sending: { type: "allowed" }, updated_at: 6 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(parsed.pathname.endsWith("/pause-email-sending") ? paused : allowed), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual((await admin.store.pauseEmailSending({ store_id: storeId, expected_updated_at: 4, reason: "Bounce rate review" })).email_sending, paused.email_sending);
  assert.deepEqual((await admin.store.allowEmailSending({ store_id: storeId, expected_updated_at: 5 })).email_sending, { type: "allowed" });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname + url.search, body]), [
    ["POST", `/v1/stores/${storeId}/pause-email-sending`, { expected_updated_at: 4, reason: "Bounce rate review" }],
    ["POST", `/v1/stores/${storeId}/allow-email-sending`, { expected_updated_at: 5 }],
  ]);
  await assert.rejects(async () => admin.store.pauseEmailSending({ store_id: "store", expected_updated_at: 4, reason: "x" }), TypeError);
  assert.equal(calls.length, 2);
});

test("membership removal sends the exact read version in the query with no body and preserves request options", async (context) => {
  const calls = [];
  const successes = [];
  const controller = new AbortController();
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : null,
      headers: new Headers(init.headers),
      signal: init.signal,
    });
    return Response.json(true, {
      headers: { "x-request-id": `membership-removal-${calls.length}` },
    });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const options = {
    headers: { "X-Trace-Id": "membership-removal" },
    signal: controller.signal,
    params: { expected_updated_at: 99 },
    onSuccess: (result) => { successes.push(result); },
    onError: () => { assert.fail("A successful removal must not invoke onError"); },
  };
  assert.equal(await admin.store.member.remove({ store_id: storeId, id: roleId, expected_updated_at: 7 }, options), true);
  assert.equal(await admin.store.member.remove({ store_id: storeId, id: roleId, expected_updated_at: 8 }, options), true);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname + url.search, body]), [
    ["DELETE", `/v1/stores/${storeId}/members/${roleId}?expected_updated_at=7`, null],
    ["DELETE", `/v1/stores/${storeId}/members/${roleId}?expected_updated_at=8`, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("Content-Type"), "application/json");
    assert.equal(call.headers.get("X-Trace-Id"), "membership-removal");
    assert.equal(call.headers.get("Authorization"), "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA");
    assert.equal(call.signal, controller.signal);
  }
  assert.deepEqual(successes.map(({ data, method, url, status, request_id }) => [data, method, url, status, request_id]), [
    [true, "DELETE", `${baseUrl}/v1/stores/${storeId}/members/${roleId}?expected_updated_at=7`, 200, "membership-removal-1"],
    [true, "DELETE", `${baseUrl}/v1/stores/${storeId}/members/${roleId}?expected_updated_at=8`, 200, "membership-removal-2"],
  ]);
  assert.deepEqual(options.params, { expected_updated_at: 99 });
});

test("membership removal preserves native authority, version and not-found refusals", async (context) => {
  const responses = [
    { status: 403, error: "GENERAL.FORBIDDEN", message: "Forbidden" },
    { status: 409, error: "GENERAL.CONFLICT", message: "The membership changed" },
    { status: 404, error: "STORE.NOT_FOUND", message: `Store membership ${roleId} was not found` },
  ];
  const calls = [];
  const failures = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : null,
    });
    const response = responses[calls.length - 1];
    return Response.json({
      error: response.error,
      message: response.message,
      status_code: response.status,
      validation_errors: [],
    }, { status: response.status });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  for (const response of responses) {
    await assert.rejects(admin.store.member.remove({ store_id: storeId, id: roleId, expected_updated_at: 7 }, {
      onSuccess: () => { assert.fail("A refused removal must not invoke onSuccess"); },
      onError: (failure) => { failures.push(failure); },
    }), (error) => {
      assert.equal(error.name, "ApiError");
      assert.equal(error.code, response.error);
      assert.equal(error.statusCode, response.status);
      assert.equal(error.message, response.message);
      assert.equal(error.method, "DELETE");
      assert.equal(error.url, `${baseUrl}/v1/stores/${storeId}/members/${roleId}?expected_updated_at=7`);
      return true;
    });
  }
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname + url.search, body]), responses.map(() => [
    "DELETE", `/v1/stores/${storeId}/members/${roleId}?expected_updated_at=7`, null,
  ]));
  assert.deepEqual(failures.map(({ method, url, status, response }) => [method, url, status, response.error]), [
    ["DELETE", `${baseUrl}/v1/stores/${storeId}/members/${roleId}?expected_updated_at=7`, 403, "GENERAL.FORBIDDEN"],
    ["DELETE", `${baseUrl}/v1/stores/${storeId}/members/${roleId}?expected_updated_at=7`, 409, "GENERAL.CONFLICT"],
    ["DELETE", `${baseUrl}/v1/stores/${storeId}/members/${roleId}?expected_updated_at=7`, 404, "STORE.NOT_FOUND"],
  ]);
});

test("a store role delete that finds no role, deleted or another store's, rejects with the Server's 404", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method });
    return Response.json({ error: "GENERAL.NOT_FOUND", message: "Not found", status_code: 404, validation_errors: [] }, { status: 404 });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await assert.rejects(admin.store.role.delete({ store_id: storeId, id: roleId, expected_updated_at: 3 }), (error) => {
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, "GENERAL.NOT_FOUND");
    return true;
  });
  assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname + url.search]), [
    ["DELETE", `/v1/stores/${storeId}/roles/${roleId}?expected_updated_at=3`],
  ]);
});
