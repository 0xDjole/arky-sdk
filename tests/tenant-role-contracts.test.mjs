import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import {
  tenantAccessCovers,
  tenantAccessHolds,
  tenantAccessIsAdmin,
  tenantAccessLocations,
  tenantAccessPermits,
  tenantAccessReads,
  tenantAccessWithheld,
  tenantPermissionNeedsSecondFactor,
} from "../dist/utils.js";
import { fixedIdFactories, recordFetch } from "./helpers/arky-fixtures.mjs";

const baseUrl = "https://api.tenant-roles.test";
const tenantId = "8ccad9a6-502e-440b-8373-b0fbaf36154c";
const accountId = "a35bc883-e98c-4fa9-94a2-8cbb7c3ac755";
const roleId = "5b7e2c94-1d38-4f60-a9e5-3c8d0f2b6a17";
const locationA = "0d4f8b26-7a13-4c95-b2e8-6f1a3d9c5e70";
const locationB = "9e3a6c10-4b27-4d8f-a5c1-2e7b9d0f3a64";
const permissionId = "2f6a8c14-3e57-4b90-8d21-7c4e9a0b5f36";
const assistantId = "7d1b3f59-6a24-4c8e-9b07-5e3a1c9d2f48";
const accessOf = (...permissions) => ({ owner: false, roles: [{ role_id: roleId, permissions }], withheld: [] });

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
  const tenants = { query: "Workspace", limit: 1, sort_field: "name", sort_direction: "desc" };
  assert.deepEqual(await admin.tenant.find(tenants), { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(await admin.tenant.find({ ...tenants, cursor }), { items: [], cursor: null });
  assert.equal(calls[1].pathname, "/v1/tenants");
  assert.deepEqual(Object.fromEntries(calls[1].searchParams), { ...tenants, limit: "1", cursor });
  const accounts = { query: "operator", limit: 1, sort_field: "email", sort_direction: "asc" };
  assert.deepEqual(await admin.account.find(accounts), { items: [], cursor });
  assert.equal(calls.length, 3);
  assert.deepEqual(await admin.account.find({ ...accounts, cursor }), { items: [], cursor: null });
  assert.equal(calls[3].pathname, "/v1/accounts/search");
  assert.deepEqual(Object.fromEntries(calls[3].searchParams), { ...accounts, limit: "1", cursor });
});

test("membership permissions use an exact Tenant read while own discovery preserves opaque pages", async (context) => {
  const calls = [];
  const cursor = "memberships:/+==";
  const membership = { id: "member", tenant_id: tenantId, tenant_name: "Contract Tenant", tenant_type: { type: "live", account_id: accountId, network_id: tenantId }, role_ids: [roleId],
    access: accessOf({ type: "tenant_fulfillment", tenant_id: tenantId, locations: { type: "filtered", filters: [{ type: "ids", ids: [locationA] }] } }), status: { type: "active", account_id: accountId },
    created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", headers: new Headers(init.headers) });
    const body = parsed.pathname.endsWith("/membership") ? membership : { items: [], cursor: parsed.searchParams.has("cursor") ? null : cursor };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await admin.tenant.member.getOwn({ tenant_id: tenantId }, { headers: { "X-Trace-Id": "permission" } }), membership);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, `/v1/tenants/${tenantId}/membership`);
  assert.equal(calls[0].headers.get("X-Trace-Id"), "permission");
  assert.deepEqual(await admin.tenant.member.findOwn({ limit: 20 }), { items: [], cursor });
  assert.equal(calls.length, 2);
  assert.deepEqual(await admin.tenant.member.findOwn({ limit: 20, cursor }), { items: [], cursor: null });
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { limit: "20", cursor });
  assert.equal(calls[2].url.pathname, "/v1/tenants/memberships");
  assert.ok(calls.every(({ method }) => method === "GET"));
  for (const tenant_id of [undefined, "slug", tenantId.toUpperCase()]) {
    await assert.rejects(async () => admin.tenant.member.getOwn({ tenant_id }), { name: "TypeError", message: "A Tenant target must be an explicit canonical UUID-v4" });
  }
  assert.equal(calls.length, 3);
});

test("tenant roles are created under an app-picked id and use exact routes, versioned updates and versioned deletes", async (context) => {
  const warehouse = [{ type: "tenant_inventory", tenant_id: tenantId, locations: { type: "all" } }];
  const role = { id: roleId, tenant_id: tenantId, key: "warehouse", permissions: [{ id: permissionId, role_id: roleId, type: warehouse[0], created_at: 1 }],
    created_at: 1, updated_at: 2 };
  const picker = [
    { type: "tenant_fulfillment", tenant_id: tenantId, locations: { type: "filtered", filters: [{ type: "ids", ids: [locationA] }] } },
    { type: "tenant_orders", tenant_id: tenantId, action: "read" },
  ];
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
  assert.deepEqual(await admin.tenant.role.create({ tenant_id: tenantId, id: roleId, key: role.key, permissions: warehouse }), role);
  await admin.tenant.role.update({ tenant_id: tenantId, id: roleId, expected_updated_at: 2, key: "picker", permissions: picker });
  await admin.tenant.role.get({ tenant_id: tenantId, id: roleId });
  assert.deepEqual(await admin.tenant.role.find({ tenant_id: tenantId, limit: 20 }), { items: [role], cursor: null });
  assert.deepEqual(await admin.tenant.role.delete({ tenant_id: tenantId, id: roleId, expected_updated_at: 3 }), { deleted: true });
  assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname + url.search]), [
    ["POST", `/v1/tenants/${tenantId}/roles`],
    ["PUT", `/v1/tenants/${tenantId}/roles/${roleId}`],
    ["GET", `/v1/tenants/${tenantId}/roles/${roleId}`],
    ["GET", `/v1/tenants/${tenantId}/roles?limit=20`],
    ["DELETE", `/v1/tenants/${tenantId}/roles/${roleId}?expected_updated_at=3`],
  ]);
  assert.deepEqual(calls[0].body, { id: roleId, key: "warehouse", permissions: warehouse });
  assert.deepEqual(calls[1].body, { expected_updated_at: 2, key: "picker", permissions: picker });
  assert.equal(calls[4].body, null);
  await assert.rejects(async () => admin.tenant.role.create({ tenant_id: tenantId, id: "warehouse", key: role.key, permissions: warehouse }), {
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
  await admin.tenant.member.invite({ tenant_id: tenantId, id: accountId, contact, role_ids: [roleId] });
  await admin.tenant.member.updateRoles({ tenant_id: tenantId, id: accountId, expected_updated_at: 5, role_ids: [roleId] });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/tenants/${tenantId}/invitation`, { id: accountId, contact, role_ids: [roleId] }],
    ["PUT", `/v1/tenants/${tenantId}/members/${accountId}/roles`, { expected_updated_at: 5, role_ids: [roleId] }],
  ]);
  await assert.rejects(async () => admin.tenant.member.updateRoles({ tenant_id: tenantId, id: "slug", expected_updated_at: 5, role_ids: [] }), { name: "TypeError", message: /membership id must be a canonical UUID/ });
  assert.equal(calls.length, 2);
});

test("a member's branches come from its roles' permissions, so no call sets a member's locations", () => {
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.equal("updateLocations" in admin.tenant.member, false);
});

test("the tenant's one users role is read, created, replaced and deleted at its own route with its version", async (context) => {
  const ownCharts = {
    type: "user_own_entries", tenant_id: tenantId, collection_id: locationA,
    entries: { type: "filtered", filters: [{ type: "boolean", key: "released", value: true }] },
  };
  const role = { id: roleId, tenant_id: tenantId, key: "patients", permissions: [{ id: permissionId, role_id: roleId, type: ownCharts, created_at: 1 }], created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : role);
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await admin.tenant.userRole.get({ tenant_id: tenantId }), role);
  assert.deepEqual(await admin.tenant.userRole.create({ tenant_id: tenantId, id: roleId, key: "patients", permissions: [ownCharts] }), role);
  assert.deepEqual(await admin.tenant.userRole.update({ tenant_id: tenantId, expected_updated_at: 2, key: "patients", permissions: [ownCharts] }), role);
  assert.deepEqual(await admin.tenant.userRole.delete({ tenant_id: tenantId, expected_updated_at: 3 }), { deleted: true });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/tenants/${tenantId}/users-role`, {}, null],
    ["POST", `/v1/tenants/${tenantId}/users-role`, {}, { id: roleId, key: "patients", permissions: [ownCharts] }],
    ["PUT", `/v1/tenants/${tenantId}/users-role`, {}, { expected_updated_at: 2, key: "patients", permissions: [ownCharts] }],
    ["DELETE", `/v1/tenants/${tenantId}/users-role`, { expected_updated_at: "3" }, null],
  ]);
  await assert.rejects(async () => admin.tenant.userRole.create({ tenant_id: tenantId, id: "patients", key: "patients", permissions: [ownCharts] }), {
    name: "TypeError",
    message: "The users role id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 4);
});

test("a tenant without a users role answers its read with the Server's 404, which the SDK throws rather than answering null", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET" });
    return Response.json({ error: "GENERAL.NOT_FOUND", message: "Not found", status_code: 404, validation_errors: [] }, { status: 404 });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await assert.rejects(admin.tenant.userRole.get({ tenant_id: tenantId }), (error) => {
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, "GENERAL.NOT_FOUND");
    return true;
  });
  assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname + url.search]), [["GET", `/v1/tenants/${tenantId}/users-role`]]);
});

test("an assistant's membership names the assistant and its roles, and is listed, read, re-roled and deleted with its version", async (context) => {
  const membershipId = "4c8e0a26-9b13-4f57-a2d9-6e1b3c5d7f80";
  const membership = { id: membershipId, tenant_id: tenantId, assistant_id: assistantId, role_ids: [roleId], created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.method === "DELETE"
    ? { deleted: true }
    : call.method === "GET" && call.path.endsWith("/assistant-memberships") ? { items: [membership], cursor: null } : membership);
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const memberships = admin.tenant.assistantMembership;
  assert.deepEqual(await memberships.create({ tenant_id: tenantId, id: membershipId, assistant_id: assistantId, role_ids: [roleId] }), membership);
  assert.deepEqual(await memberships.find({ tenant_id: tenantId, assistant_id: assistantId, limit: 1 }), { items: [membership], cursor: null });
  assert.deepEqual(await memberships.get({ tenant_id: tenantId, id: membershipId }), membership);
  assert.deepEqual(await memberships.update({ tenant_id: tenantId, id: membershipId, expected_updated_at: 2, role_ids: [] }), membership);
  assert.deepEqual(await memberships.delete({ tenant_id: tenantId, id: membershipId, expected_updated_at: 3 }), { deleted: true });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/tenants/${tenantId}/assistant-memberships`, {}, { id: membershipId, assistant_id: assistantId, role_ids: [roleId] }],
    ["GET", `/v1/tenants/${tenantId}/assistant-memberships`, { assistant_id: assistantId, limit: "1" }, null],
    ["GET", `/v1/tenants/${tenantId}/assistant-memberships/${membershipId}`, {}, null],
    ["PUT", `/v1/tenants/${tenantId}/assistant-memberships/${membershipId}`, {}, { expected_updated_at: 2, role_ids: [] }],
    ["DELETE", `/v1/tenants/${tenantId}/assistant-memberships/${membershipId}`, { expected_updated_at: "3" }, null],
  ]);
  await assert.rejects(async () => memberships.create({ tenant_id: tenantId, id: "front-desk", assistant_id: assistantId, role_ids: [] }), {
    name: "TypeError",
    message: "The assistant membership id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 5);
});

test("a tenant has no owner transfer, and members are paused and resumed by status", async (context) => {
  const membership = { id: "member", tenant_id: tenantId, role_ids: [roleId], status: { type: "disabled", account_id: accountId }, created_at: 1, updated_at: 6 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(membership), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.equal("transferOwnership" in admin.tenant.member, false);
  assert.equal("transferOwnership" in admin.tenant, false);
  assert.deepEqual(await admin.tenant.member.changeStatus({ tenant_id: tenantId, id: accountId, expected_updated_at: 5, status: { type: "disabled" } }), membership);
  await admin.tenant.member.changeStatus({ tenant_id: tenantId, id: accountId, expected_updated_at: 6, status: { type: "active" } });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["PUT", `/v1/tenants/${tenantId}/members/${accountId}/status`, { expected_updated_at: 5, status: { type: "disabled" } }],
    ["PUT", `/v1/tenants/${tenantId}/members/${accountId}/status`, { expected_updated_at: 6, status: { type: "active" } }],
  ]);
  await assert.rejects(async () => admin.tenant.member.changeStatus({ tenant_id: tenantId, id: accountId.toUpperCase(), expected_updated_at: 6, status: { type: "active" } }), { name: "TypeError", message: /membership id must be a canonical UUID/ });
  await assert.rejects(async () => admin.tenant.member.remove({ tenant_id: tenantId, id: "slug" }), TypeError);
  assert.equal(calls.length, 2);
  assert.equal("transferOwnership" in createStorefront({ tenantId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl: baseUrl }), false);
  assert.equal("buildHook" in admin.tenant, false);
});

test("a role and an account token give orders, payments and users read-only or read-write access exactly as sent", async (context) => {
  const permissions = [
    { type: "tenant_orders", tenant_id: tenantId, action: "read" },
    { type: "tenant_payments", tenant_id: tenantId, action: "write" },
    { type: "tenant_users", tenant_id: tenantId, action: "read", users: { type: "all" } },
    { type: "tenant_packages", tenant_id: tenantId },
  ];
  const tokenId = "6a1c3e85-7b29-4d04-9f6e-2c8a0d4b6e13";
  const tenants = { type: "ids", tenant_ids: [tenantId] };
  const calls = recordFetch(context, (call) => call.path.endsWith("/tokens")
    ? { type: "secret_created", token: { id: tokenId, tenants, expiry: { type: "never" } }, value: `arky_at_${"v".repeat(42)}A` }
    : { id: roleId, tenant_id: tenantId, key: "bookkeeping", permissions: permissions.map((type, index) => ({ id: `${permissionId.slice(0, -1)}${index}`, role_id: roleId, type, created_at: 1 })), created_at: 1, updated_at: 1 });
  const admin = createAdmin({ apiUrl: baseUrl });
  await admin.tenant.role.create({ tenant_id: tenantId, id: roleId, key: "bookkeeping", permissions });
  await admin.account.token.create({ id: tokenId, name: "Reports", tenants, expiry: { type: "never" } });
  await admin.account.token.create({ id: tokenId, name: "Reports", tenants, expiry: { type: "at", expires_at: 1_900_000_000_000 } });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/tenants/${tenantId}/roles`, { id: roleId, key: "bookkeeping", permissions }],
    ["POST", "/v1/accounts/me/tokens", { id: tokenId, name: "Reports", tenants, expiry: { type: "never" } }],
    ["POST", "/v1/accounts/me/tokens", { id: tokenId, name: "Reports", tenants, expiry: { type: "at", expires_at: 1_900_000_000_000 } }],
  ]);
});

test("tenant access helpers follow the Server's tenant-wide and area checks", () => {
  const resourceId = "3c7e1a95-2d48-4b06-8f3a-9e5c1b7d2a40";
  const otherRoleId = "6e2c4a80-1f39-4d75-b6a8-0c9e3d5f7b12";
  const thirdRoleId = "8a4c6e02-3b51-4f97-a8c0-2e1d5f7b9c34";
  const atBranches = (ids) => ({ type: "filtered", filters: [{ type: "ids", ids }] });
  const picker = accessOf(
    { type: "tenant_fulfillment", tenant_id: tenantId, locations: atBranches([locationB]) },
    { type: "tenant_inventory", tenant_id: tenantId, locations: atBranches([locationA]) },
  );
  assert.equal(tenantAccessIsAdmin(picker), false);
  assert.equal(tenantAccessHolds(picker, "tenant_fulfillment"), true);
  assert.equal(tenantAccessReads(picker, "tenant_fulfillment"), false);
  assert.equal(tenantAccessPermits(picker, "tenant_fulfillment"), false);
  assert.equal(tenantAccessCovers(picker, "tenant_fulfillment", locationB), true);
  assert.equal(tenantAccessCovers(picker, "tenant_fulfillment", locationA), false);
  assert.equal(tenantAccessCovers(picker, "tenant_inventory", locationA), true);
  assert.deepEqual(tenantAccessLocations(picker, "tenant_fulfillment"), atBranches([locationB]));
  assert.equal(tenantAccessHolds(picker, "tenant_orders"), false);

  const twoBranches = { owner: false, roles: [
    { role_id: roleId, permissions: [{ type: "tenant_fulfillment", tenant_id: tenantId, locations: atBranches([locationB]) }] },
    { role_id: otherRoleId, permissions: [{ type: "tenant_fulfillment", tenant_id: tenantId, locations: atBranches([locationA]) }] },
  ], withheld: [] };
  assert.deepEqual(tenantAccessLocations(twoBranches, "tenant_fulfillment"), atBranches([locationA, locationB].sort()));
  assert.equal(tenantAccessLocations(twoBranches, "tenant_inventory"), null);
  assert.equal(tenantAccessCovers(twoBranches, "tenant_fulfillment", locationA), true);
  const everywhere = { ...twoBranches, roles: [...twoBranches.roles, { role_id: thirdRoleId, permissions: [{ type: "tenant_fulfillment", tenant_id: tenantId, locations: { type: "all" } }] }] };
  assert.deepEqual(tenantAccessLocations(everywhere, "tenant_fulfillment"), { type: "all" });
  assert.equal(tenantAccessReads(everywhere, "tenant_fulfillment"), true);
  assert.equal(tenantAccessPermits(everywhere, "tenant_fulfillment"), true);

  const bookkeeping = accessOf(
    { type: "tenant_orders", tenant_id: tenantId, action: "read" },
    { type: "tenant_payments", tenant_id: tenantId, action: "write" },
    { type: "tenant_packages", tenant_id: tenantId },
  );
  assert.equal(tenantAccessReads(bookkeeping, "tenant_orders"), true);
  assert.equal(tenantAccessPermits(bookkeeping, "tenant_orders"), false);
  assert.equal(tenantAccessPermits(bookkeeping, "tenant_payments"), true);
  assert.equal(tenantAccessPermits(bookkeeping, "tenant_packages"), true);
  assert.equal(tenantAccessHolds(bookkeeping, "tenant_marketing"), false);

  const atSarajevo = { type: "filtered", filters: [{ type: "booked_at_locations", tenant_location_ids: [locationA] }] };
  const nurse = accessOf(
    { type: "tenant_users", tenant_id: tenantId, action: "write", users: atSarajevo },
    { type: "tenant_users", tenant_id: tenantId, action: "read", users: { type: "all" } },
    {
      type: "tenant_bookings", tenant_id: tenantId, action: "write",
      bookings: { type: "filtered", filters: [{ type: "on_resources", booking_resource_ids: [resourceId] }, { type: "at_locations", tenant_location_ids: [locationA] }] },
    },
    { type: "tenant_users_deny", tenant_id: tenantId, filter: { type: "in_categories", category_ids: ["1b7d3f95-6c28-4a40-8e13-5f9a2c7e0d64"] } },
  );
  assert.equal(tenantAccessHolds(nurse, "tenant_users"), true);
  assert.equal(tenantAccessReads(nurse, "tenant_users"), true);
  assert.equal(tenantAccessPermits(nurse, "tenant_users"), false, "a filtered write and a tenant-wide read make no tenant-wide write");
  assert.equal(tenantAccessHolds(nurse, "tenant_bookings"), true);
  assert.equal(tenantAccessReads(nurse, "tenant_bookings"), false);
  assert.equal(tenantAccessHolds(nurse, "tenant_users_deny"), true);

  const admin = accessOf({ type: "tenant_admin", tenant_id: tenantId });
  assert.equal(tenantAccessIsAdmin(admin), true);
  for (const type of ["tenant_admin", "tenant_orders", "tenant_fulfillment", "tenant_bookings", "tenant_users", "tenant_public_collections", "tenant_analytics"]) {
    assert.equal(tenantAccessHolds(admin, type), true, type);
    assert.equal(tenantAccessReads(admin, type), true, type);
    assert.equal(tenantAccessPermits(admin, type), true, type);
  }
  assert.equal(tenantAccessCovers(admin, "tenant_inventory", locationB), true);
  assert.deepEqual(tenantAccessLocations(admin, "tenant_inventory"), { type: "all" });
  for (const type of ["tenant_private_collections", "tenant_user_collections", "tenant_private_forms", "tenant_calls"]) {
    assert.equal(tenantAccessHolds(admin, type), false, type);
    assert.equal(tenantAccessReads(admin, type), false, type);
    assert.equal(tenantAccessPermits(admin, type), false, type);
  }
  assert.equal(tenantAccessHolds(admin, "tenant_users_deny"), false);
  const adminWithCalls = { ...admin, roles: [...admin.roles, { role_id: otherRoleId, permissions: [{ type: "tenant_calls", tenant_id: tenantId, phone_numbers: { type: "all" }, users: { type: "all" } }] }] };
  assert.equal(tenantAccessReads(adminWithCalls, "tenant_calls"), true);
  assert.equal(tenantAccessPermits(adminWithCalls, "tenant_calls"), true);

  const owner = { owner: true, roles: [], withheld: [] };
  assert.equal(tenantAccessIsAdmin(owner), true);
  assert.equal(tenantAccessPermits(owner, "tenant_orders"), true);
  assert.equal(tenantAccessHolds(owner, "tenant_private_forms"), false);

  assert.equal(tenantAccessIsAdmin(null), false);
  assert.equal(tenantAccessHolds(undefined, "tenant_orders"), false);
  assert.equal(tenantAccessReads(null, "tenant_orders"), false);
  assert.equal(tenantAccessPermits(null, "tenant_orders"), false);
  assert.equal(tenantAccessCovers(null, "tenant_fulfillment", locationA), false);
  assert.equal(tenantAccessLocations(null, "tenant_fulfillment"), null);
  assert.equal(tenantAccessHolds({ owner: false, roles: [], withheld: [] }, "tenant_orders"), false);
});

test("the permissions a second factor opens are withheld beside their role, never held, and read back as an access of their own", () => {
  const otherRoleId = "6e2c4a80-1f39-4d75-b6a8-0c9e3d5f7b12";
  const charts = { type: "tenant_user_collections", tenant_id: tenantId, action: "write", collections: { type: "all" }, entries: { type: "all" }, users: { type: "all" } };
  const forms = { type: "tenant_private_forms", tenant_id: tenantId, action: "read", forms: { type: "all" }, users: { type: "all" } };
  const secondFactorOff = {
    owner: false,
    roles: [{ role_id: roleId, permissions: [{ type: "tenant_orders", tenant_id: tenantId, action: "read" }] }],
    withheld: [
      { type: "second_factor_off", role_id: roleId, permission: charts },
      { type: "second_factor_off", role_id: otherRoleId, permission: forms },
    ],
  };
  assert.equal(tenantAccessHolds(secondFactorOff, "tenant_user_collections"), false);
  assert.equal(tenantAccessHolds(secondFactorOff, "tenant_private_forms"), false);
  const withheld = tenantAccessWithheld(secondFactorOff);
  assert.deepEqual(withheld, { owner: false, roles: [{ role_id: roleId, permissions: [charts] }, { role_id: otherRoleId, permissions: [forms] }], withheld: [] });
  assert.equal(tenantAccessPermits(withheld, "tenant_user_collections"), true);
  assert.equal(tenantAccessReads(withheld, "tenant_private_forms"), true);
  assert.equal(tenantAccessPermits(withheld, "tenant_private_forms"), false);
  assert.equal(tenantAccessHolds(withheld, "tenant_orders"), false);
  assert.deepEqual(tenantAccessWithheld(null), { owner: false, roles: [], withheld: [] });

  const privateCollections = { type: "tenant_private_collections", tenant_id: tenantId, action: "read", collections: { type: "all" }, entries: { type: "all" } };
  const token = { owner: true, roles: [], withheld: [{ type: "account_token", role_id: roleId, permission: privateCollections }] };
  assert.equal(tenantAccessHolds(token, "tenant_private_collections"), false);
  assert.equal(tenantAccessIsAdmin(tenantAccessWithheld(token)), false);
  assert.equal(tenantAccessReads(tenantAccessWithheld(token), "tenant_private_collections"), true);
  assert.deepEqual(
    ["tenant_private_collections", "tenant_user_collections", "tenant_private_forms", "tenant_calls", "tenant_users"].map((type) => tenantPermissionNeedsSecondFactor(type)),
    [true, true, true, false, false],
  );
});

test("own workspace discovery retains each Tenant name and access without public presentation reads", async (context) => {
  const calls = [];
  const memberships = ["First Tenant", "Second Tenant"].map((tenant_name, index) => ({
    id: `membership-${index}`, tenant_id: index === 0 ? tenantId : accountId, tenant_name,
    role_ids: [roleId], access: {
      owner: false,
      roles: [{ role_id: roleId, permissions: [{ type: "tenant_orders", tenant_id: tenantId, action: index === 0 ? "write" : "read" }] }],
      withheld: index === 0 ? [] : [{ type: "account_token", role_id: roleId, permission: { type: "tenant_private_forms", tenant_id: tenantId, action: "read", forms: { type: "all" }, users: { type: "all" } } }],
    }, status: { type: "active", account_id: accountId },
    created_at: 1, updated_at: 1,
  }));
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ path: new URL(url).pathname, method: init.method ?? "GET" });
    return Response.json({ items: memberships, cursor: null });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const page = await admin.tenant.member.findOwn({ limit: 20 });
  assert.deepEqual(page.items.map(({ tenant_name }) => tenant_name), ["First Tenant", "Second Tenant"]);
  assert.deepEqual(page.items.map(({ access }) => access.roles[0].permissions[0]), [{ type: "tenant_orders", tenant_id: tenantId, action: "write" }, { type: "tenant_orders", tenant_id: tenantId, action: "read" }]);
  assert.deepEqual(page.items.map(({ access }) => access.withheld.map(({ type }) => type)), [[], ["account_token"]]);
  assert.deepEqual(calls, [{ path: "/v1/tenants/memberships", method: "GET" }]);
});

test("a nonexpiring email invite is explicitly resent and accepted with its current version", async (context) => {
  const contact = { email: "packer@example.test", language: "en" };
  const invited = { id: "member", tenant_id: tenantId, tenant_name: "Contract Tenant", tenant_type: { type: "live", account_id: accountId, network_id: tenantId }, role_ids: [roleId], access: { owner: false, roles: [], withheld: [] }, status: { type: "invited", contact }, created_at: 1, updated_at: 2 };
  const accepted = { id: "member", tenant_id: tenantId, role_ids: [roleId], status: { type: "active", account_id: accountId }, created_at: 1, updated_at: 3 };
  const membership = { id: accountId, tenant_id: tenantId, role_ids: [roleId], status: { type: "invited", contact }, created_at: 1, updated_at: 2 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    const call = { url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null };
    calls.push(call);
    const body = parsed.pathname === `/v1/tenants/${tenantId}/invitation` ? membership : parsed.pathname.endsWith("/invitation") ? true : parsed.pathname.endsWith("/membership/accept") ? accepted : invited;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const invite = { tenant_id: tenantId, id: accountId, contact, role_ids: [roleId] };
  assert.deepEqual(await admin.tenant.member.invite(invite), membership, "the invite answers the membership it made");
  assert.equal(await admin.tenant.member.resendInvite({ tenant_id: tenantId, id: accountId, expected_updated_at: 2 }), true);
  const own = await admin.tenant.member.getOwn({ tenant_id: tenantId });
  assert.deepEqual(own.status, { type: "invited", contact });
  assert.deepEqual(await admin.tenant.member.acceptInvite({ tenant_id: tenantId, expected_updated_at: own.updated_at }), accepted);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/tenants/${tenantId}/invitation`, { id: accountId, contact, role_ids: [roleId] }],
    ["POST", `/v1/tenants/${tenantId}/members/${accountId}/invitation`, { expected_updated_at: 2 }],
    ["GET", `/v1/tenants/${tenantId}/membership`, null],
    ["POST", `/v1/tenants/${tenantId}/membership/accept`, { expected_updated_at: 2 }],
  ]);
  for (const tenant_id of [undefined, "slug", tenantId.toUpperCase()]) {
    await assert.rejects(async () => admin.tenant.member.acceptInvite({ tenant_id, expected_updated_at: 2 }), { name: "TypeError", message: "A Tenant target must be an explicit canonical UUID-v4" });
  }
  assert.equal(calls.length, 4);
});

test("a tenant's email sending is paused with a reason and allowed again, each with the tenant version", async (context) => {
  const paused = { id: tenantId, name: "Contract Tenant", type: { type: "live", account_id: accountId, network_id: tenantId }, email_sending: { type: "paused", reason: "Bounce rate review" }, updated_at: 5 };
  const allowed = { ...paused, email_sending: { type: "allowed" }, updated_at: 6 };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(parsed.pathname.endsWith("/pause-email-sending") ? paused : allowed), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual((await admin.tenant.pauseEmailSending({ tenant_id: tenantId, expected_updated_at: 4, reason: "Bounce rate review" })).email_sending, paused.email_sending);
  assert.deepEqual((await admin.tenant.allowEmailSending({ tenant_id: tenantId, expected_updated_at: 5 })).email_sending, { type: "allowed" });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname + url.search, body]), [
    ["POST", `/v1/tenants/${tenantId}/pause-email-sending`, { expected_updated_at: 4, reason: "Bounce rate review" }],
    ["POST", `/v1/tenants/${tenantId}/allow-email-sending`, { expected_updated_at: 5 }],
  ]);
  await assert.rejects(async () => admin.tenant.pauseEmailSending({ tenant_id: "tenant", expected_updated_at: 4, reason: "x" }), TypeError);
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
  assert.equal(await admin.tenant.member.remove({ tenant_id: tenantId, id: roleId, expected_updated_at: 7 }, options), true);
  assert.equal(await admin.tenant.member.remove({ tenant_id: tenantId, id: roleId, expected_updated_at: 8 }, options), true);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname + url.search, body]), [
    ["DELETE", `/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=7`, null],
    ["DELETE", `/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=8`, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("Content-Type"), "application/json");
    assert.equal(call.headers.get("X-Trace-Id"), "membership-removal");
    assert.equal(call.headers.get("Authorization"), "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA");
    assert.equal(call.signal, controller.signal);
  }
  assert.deepEqual(successes.map(({ data, method, url, status }) => [data, method, url, status]), [
    [true, "DELETE", `${baseUrl}/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=7`, 200],
    [true, "DELETE", `${baseUrl}/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=8`, 200],
  ]);
  assert.equal(successes.some((success) => "request_id" in success), false);
  assert.deepEqual(options.params, { expected_updated_at: 99 });
});

test("membership removal preserves native authority, version and not-found refusals", async (context) => {
  const responses = [
    { status: 403, error: "GENERAL.FORBIDDEN", message: "Forbidden" },
    { status: 409, error: "GENERAL.CONFLICT", message: "The membership changed" },
    { status: 404, error: "TENANT.NOT_FOUND", message: `Tenant membership ${roleId} was not found` },
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
    await assert.rejects(admin.tenant.member.remove({ tenant_id: tenantId, id: roleId, expected_updated_at: 7 }, {
      onSuccess: () => { assert.fail("A refused removal must not invoke onSuccess"); },
      onError: (failure) => { failures.push(failure); },
    }), (error) => {
      assert.equal(error.name, "ApiError");
      assert.equal(error.code, response.error);
      assert.equal(error.statusCode, response.status);
      assert.equal(error.message, response.message);
      assert.equal(error.method, "DELETE");
      assert.equal(error.url, `${baseUrl}/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=7`);
      return true;
    });
  }
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname + url.search, body]), responses.map(() => [
    "DELETE", `/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=7`, null,
  ]));
  assert.deepEqual(failures.map(({ method, url, status, response }) => [method, url, status, response.error]), [
    ["DELETE", `${baseUrl}/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=7`, 403, "GENERAL.FORBIDDEN"],
    ["DELETE", `${baseUrl}/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=7`, 409, "GENERAL.CONFLICT"],
    ["DELETE", `${baseUrl}/v1/tenants/${tenantId}/members/${roleId}?expected_updated_at=7`, 404, "TENANT.NOT_FOUND"],
  ]);
});

test("a tenant role delete that finds no role, deleted or another tenant's, rejects with the Server's 404", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method });
    return Response.json({ error: "GENERAL.NOT_FOUND", message: "Not found", status_code: 404, validation_errors: [] }, { status: 404 });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await assert.rejects(admin.tenant.role.delete({ tenant_id: tenantId, id: roleId, expected_updated_at: 3 }), (error) => {
    assert.equal(error.statusCode, 404);
    assert.equal(error.code, "GENERAL.NOT_FOUND");
    return true;
  });
  assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname + url.search]), [
    ["DELETE", `/v1/tenants/${tenantId}/roles/${roleId}?expected_updated_at=3`],
  ]);
});

test("the named owner of a tenant opened for them sends the tenant agreement with the invite accept", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push([init.method ?? "GET", new URL(url).pathname, init.body ? JSON.parse(String(init.body)) : null]);
    return new Response(JSON.stringify({ id: accountId, tenant_id: tenantId, status: { type: "active" }, updated_at: 3 }), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const agreement = { id: "5c7e9a1b-3d2f-4a6c-8e0b-1d3f5a7c9e2b", document: "Terms v3 accepted by the owner" };
  await admin.tenant.member.acceptInvite({ tenant_id: tenantId, expected_updated_at: 2, agreement });
  await admin.tenant.member.acceptInvite({ tenant_id: tenantId, expected_updated_at: 2 });
  assert.deepEqual(calls, [
    ["POST", `/v1/tenants/${tenantId}/membership/accept`, { expected_updated_at: 2, agreement }],
    ["POST", `/v1/tenants/${tenantId}/membership/accept`, { expected_updated_at: 2 }],
  ]);
});

test("the tenant's member list filters by role, status and account, and the tenant read may name its owner's email", async (context) => {
  const roleId = "1b3d5f7a-9c2e-4a4b-8d6f-0e2a4c6e8b1d";
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push([init.method ?? "GET", parsed.pathname, Object.fromEntries(parsed.searchParams)]);
    const body = parsed.pathname.endsWith("/members") ? { items: [], cursor: null } : { id: tenantId, owner_email: "owner@example.test" };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: baseUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await admin.tenant.member.find({ tenant_id: tenantId, role_id: roleId, status: "invited", account_id: accountId, limit: 20 });
  assert.equal((await admin.tenant.get({ id: tenantId })).owner_email, "owner@example.test");
  assert.deepEqual(calls, [
    ["GET", `/v1/tenants/${tenantId}/members`, { role_id: roleId, status: "invited", account_id: accountId, limit: "20" }],
    ["GET", `/v1/tenants/${tenantId}`, {}],
  ]);
});
