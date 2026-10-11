import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, publishableKey, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const selectedStoreId = "7f3a7a66-3403-4112-b5e5-d004a62d00b0";
const id = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const otherId = "9e7c5a3b-1d2f-4b6e-8a0c-4f6e8a2c4d5b";
const now = 1788862721000;
const address = {
  name: null,
  company: "Buyer Ltd",
  street1: "Main Street 1",
  street2: null,
  city: "Sarajevo",
  state: null,
  postal_code: "71000",
  country: "BA",
  phone: null,
  email: null,
};
const detailBlocks = [{ id: "a8c0e2f4-6b7d-4f9a-8c1e-3a5c7e9b1d2f", key: "registration_number", type: "text", value: "4200000000000" }];
const standardCheckout = { payment: { type: "standard_checkout", billing_address: null }, allowed_payment_option_ids: [], purchase_order_number_required: false };
const monthly = {
  type: "recurring",
  cadence: { interval: "month", interval_count: 1 },
  recovery_policy: { retry_offsets_seconds: [86_400], recovery_window_seconds: 604_800, on_exhaustion: { type: "pause" }, unpaid_order: { type: "retain_debt" } },
  commitment: { occurrences: 12, end_action: { type: "renew" } },
};
const definitions = [
  {
    path: ["companies"],
    route: "companies",
    response: { tax_registrations: [], purchasing: standardCheckout },
    create: { name: "Buyer", contact_email: "accounts@example.test", billing_address: null, blocks: detailBlocks, status: { type: "active" } },
    update: { name: "Buyer 2", contact_email: "orders@example.test", billing_address: address, blocks: [], status: { type: "archived" } },
    query: { query: "Buyer registration", status: "archived", sort_field: "updated_at", sort_direction: "asc" },
    deletion: "deleting",
  },
  {
    path: ["companies", "membership"],
    route: "company-memberships",
    create: { company_id: selectedStoreId, customer_id: otherId, grants: [{ scope: { type: "company_location", company_location_id: otherId }, role_ids: [otherId] }] },
    update: { grants: [{ scope: { type: "company" }, role_ids: [selectedStoreId] }, { scope: { type: "all_locations" }, role_ids: [] }], status: { type: "disabled" } },
    query: { company_id: selectedStoreId, customer_id: otherId, role_id: otherId },
    deletion: "deleted",
  },
  {
    path: ["companies", "role"],
    route: "company-roles",
    create: { key: "purchaser", permissions: ["place_orders", "access_digital_products", "join_customer_groups", "view_own_customer_groups"] },
    update: { permissions: ["admin", "view_company_customer_groups", "manage_company_customer_groups"] },
    query: { key: "purchaser" },
    deletion: "deleted",
  },
  {
    path: ["companies", "location"],
    route: "company-locations",
    response: {
      tax_registrations: [],
      purchasing: standardCheckout,
      fulfillment: { type: "routing" },
    },
    create: { company_id: selectedStoreId, name: "Depot", shipping_address: null, billing_address: null, status: { type: "active" } },
    update: { name: "Depot 2", shipping_address: address, billing_address: null, status: { type: "archived" } },
    query: { company_id: selectedStoreId },
    deletion: "deleting",
  },
  {
    path: ["eshop", "customerGroup"],
    route: "customer-groups",
    create: { key: "wholesale", blocks: [], term: { type: "permanent" }, entitlements: [], purchase_requirement: null, tax_policies: [], status: { type: "active" }, starts_at: null, ends_at: null },
    update: { blocks: detailBlocks, term: monthly, entitlements: [], purchase_requirement: null, tax_policies: [], status: { type: "closed" }, starts_at: now, ends_at: null },
    query: { customer_group_offering_id: otherId, status: { type: "active" }, query: "wholesale", sort_field: "key", sort_direction: "asc", created_at_from: 1, created_at_to: now },
    deletion: "empty",
  },
  {
    path: ["eshop", "customerGroupOffering"],
    route: "customer-group-offerings",
    create: { key: "coffee-club", blocks: [], customer_group_ids: [otherId], status: { type: "draft" } },
    update: { blocks: detailBlocks, customer_group_ids: [otherId, selectedStoreId], status: { type: "active" } },
    query: { key: "coffee-club", status: "active", sort_field: "updated_at", sort_direction: "desc" },
    deletion: "empty",
  },
  {
    path: ["store", "salesChannel"],
    route: "sales-channels",
    create: { key: "trade", market_ids: [otherId], status: { type: "active" } },
    update: { market_ids: [], status: { type: "archived" } },
    query: { key: "trade", status: "archived" },
    deletion: "deleted",
  },
];

const getApi = (client, path) => path.reduce((owner, key) => owner[key], client);
const createClient = () => createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("company-wide and all-locations grants are sent explicitly and survive exact reads", async (context) => {
  const grants = [
    { scope: { type: "company" }, role_ids: [] },
    { scope: { type: "all_locations" }, role_ids: [otherId] },
    { scope: { type: "company_location", company_location_id: selectedStoreId }, role_ids: [otherId, id] },
  ];
  const record = { id, store_id: storeId, company_id: selectedStoreId, customer_id: otherId, grants, status: { type: "active" }, created_at: now, updated_at: now };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ path: new URL(url).pathname, body: init.body ? JSON.parse(init.body) : null });
    return response(record);
  });
  const api = createClient().companies.membership;
  assert.deepEqual(await api.create({ store_id: storeId, id, company_id: selectedStoreId, customer_id: otherId, grants }), record);
  assert.deepEqual(calls[0].body, { id, company_id: selectedStoreId, customer_id: otherId, grants });
  for (const removed of ["scope", "locations", "role_ids"]) assert.equal(removed in calls[0].body, false, removed);
  assert.equal(calls[0].path, `/v1/stores/${storeId}/company-memberships`);
  assert.deepEqual(await api.get({ store_id: storeId, id }), record);
  assert.equal(calls[1].path, `/v1/stores/${storeId}/company-memberships/${id}`);
  assert.equal(calls.length, 2);
});

test("a company location is served from a store location or by routing, set with its version", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ method: init.method, path: new URL(url).pathname, body: init.body ? JSON.parse(init.body) : null });
    return response({ id });
  });
  const api = createClient().companies.location;
  await api.setFulfillment({ store_id: storeId, id, expected_updated_at: now, fulfillment: { type: "served_from", store_location_id: selectedStoreId } });
  await api.setFulfillment({ store_id: storeId, id, expected_updated_at: now + 1, fulfillment: { type: "routing" } });
  assert.deepEqual(calls, [
    { method: "PUT", path: `/v1/stores/${storeId}/company-locations/${id}/served-from`, body: { expected_updated_at: now, fulfillment: { type: "served_from", store_location_id: selectedStoreId } } },
    { method: "PUT", path: `/v1/stores/${storeId}/company-locations/${id}/served-from`, body: { expected_updated_at: now + 1, fulfillment: { type: "routing" } } },
  ]);
  assert.equal("setServedFrom" in api, false);
});

test("company and location tax registrations are submitted and reviewed with the record's version", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ method: init.method, path: new URL(url).pathname, body: init.body ? JSON.parse(init.body) : null });
    return response({ id });
  });
  const client = createClient();
  const registration = { country: "BA", region: null, identifier: "4200000000000" };
  await client.companies.location.submitTaxRegistration({ store_id: storeId, id, expected_updated_at: now, registration });
  await client.companies.location.reviewTaxRegistration({ store_id: storeId, id, expected_updated_at: now + 1, registration, review: { type: "rejected", reason: "Unknown number" } });
  await client.companies.submitTaxRegistration({ store_id: storeId, id: otherId, expected_updated_at: now + 2, registration });
  await client.companies.reviewTaxRegistration({ store_id: storeId, id: otherId, expected_updated_at: now + 3, registration, review: { type: "verified" } });
  assert.deepEqual(calls, [
    { method: "POST", path: `/v1/stores/${storeId}/company-locations/${id}/tax/registrations`, body: { expected_updated_at: now, registration } },
    { method: "POST", path: `/v1/stores/${storeId}/company-locations/${id}/tax/registrations/review`, body: { expected_updated_at: now + 1, registration, review: { type: "rejected", reason: "Unknown number" } } },
    { method: "POST", path: `/v1/stores/${storeId}/companies/${otherId}/tax/registrations`, body: { expected_updated_at: now + 2, registration } },
    { method: "POST", path: `/v1/stores/${storeId}/companies/${otherId}/tax/registrations/review`, body: { expected_updated_at: now + 3, registration, review: { type: "verified" } } },
  ]);
});

for (const definition of definitions) {
  test(`${definition.path.join(".")} sends app-picked ids, versioned changes and the plan's deletion answer`, async (context) => {
    const calls = [];
    const record = { id, store_id: selectedStoreId, ...definition.create, ...definition.response, status: { type: "active" }, created_at: now, updated_at: now };
    const updated = { ...record, ...definition.update, updated_at: now + 1 };
    const deletionAnswer = definition.deletion === "deleting"
      ? { ...record, status: { type: "deleting" }, updated_at: now + 2 }
      : definition.deletion === "empty" ? undefined : { deleted: true };
    context.mock.method(globalThis, "fetch", async (url, init = {}) => {
      const target = new URL(url);
      const call = { target, method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null, signal: init.signal };
      calls.push(call);
      if (call.method === "DELETE" && definition.deletion === "empty") return new Response(null, { status: 204 });
      if (call.method === "DELETE") return response(deletionAnswer, definition.deletion === "deleting" ? 202 : 200);
      if (call.method === "PUT") return response(updated);
      if (call.method === "POST") return response(record, 201);
      if (target.pathname.endsWith(`/${definition.route}`)) return response({ items: [record], cursor: "next-page" });
      return response(record);
    });
    const api = getApi(createClient(), definition.path);
    assert.deepEqual(await api.create({ ...definition.create, id, store_id: selectedStoreId }), record);
    assert.deepEqual(calls.at(-1).body, { ...definition.create, id });
    assert.deepEqual(await api.get({ id, store_id: selectedStoreId }), record);
    const query = { ...definition.query, limit: 20, cursor: "previous-page" };
    assert.deepEqual(await api.find({ store_id: selectedStoreId, ...query }), { items: [record], cursor: "next-page" });
    for (const [key, value] of Object.entries(query)) {
      assert.equal(calls.at(-1).target.searchParams.get(key), typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    if (definition.update) {
      const input = { ...definition.update, expected_updated_at: now };
      assert.deepEqual(await api.update({ ...input, id, store_id: selectedStoreId }), updated);
      assert.deepEqual(calls.at(-1).body, input);
      assert.equal(calls.at(-1).method, "PUT");
    } else {
      assert.equal("update" in api, false);
    }
    assert.equal("usage" in api, false);
    assert.deepEqual(await api.delete({ id, store_id: selectedStoreId, expected_updated_at: now }), deletionAnswer);
    assert.equal(calls.at(-1).method, "DELETE");
    assert.equal(calls.at(-1).body, null);
    assert.equal(calls.at(-1).target.searchParams.get("expected_updated_at"), String(now));
    for (const call of calls) {
      assert.ok(call.target.pathname.startsWith(`/v1/stores/${selectedStoreId}/${definition.route}`));
      assert.equal(call.headers.get("authorization"), "Bearer arky_api_test");
      assert.equal(call.body?.store_id, undefined);
      assert.equal(call.target.searchParams.has("store_id"), false);
    }
    for (const invented of [undefined, "record-1", id.toUpperCase()]) {
      await assert.rejects(async () => api.create({ ...definition.create, id: invented, store_id: selectedStoreId }), TypeError);
    }
    const signal = new AbortController().signal;
    await assert.rejects(async () => api.get({ id: "one/segment?only" }), TypeError);
    await api.get({ store_id: storeId, id: "one/segment?only" }, { signal, headers: { "x-client-trace": "company-contract" } });
    assert.equal(calls.at(-1).target.pathname, `/v1/stores/${storeId}/${definition.route}/one%2Fsegment%3Fonly`);
    assert.equal(calls.at(-1).target.search, "");
    assert.equal(calls.at(-1).headers.get("x-client-trace"), "company-contract");
    assert.equal(calls.at(-1).signal, signal);
  });
}

test("a company or one of its locations is assigned to a customer group under the app's member id", async (context) => {
  const calls = [];
  const member = (subject) => ({ id, store_id: storeId, customer_group_id: otherId, subject, type: { type: "permanent" }, status: { type: "active" }, access_end_at: null, created_at: now, updated_at: now });
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { method: init.method, path: new URL(url).pathname, query: new URL(url).search, body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    return response(call.method === "GET" ? { items: [], cursor: null } : member(call.body.subject));
  });
  const api = createClient().eshop.customerGroupMember;
  const company = { type: "company", company_id: selectedStoreId };
  const location = { type: "company_location", company_location_id: selectedStoreId };
  assert.deepEqual((await api.assign({ store_id: storeId, id, customer_group_id: otherId, subject: company, access_end_at: null })).subject, company);
  await api.assign({ store_id: storeId, id, customer_group_id: otherId, subject: location, access_end_at: now });
  await api.find({ store_id: storeId, company_id: selectedStoreId, customer_group_id: otherId, limit: 10 });
  assert.deepEqual(calls, [
    { method: "POST", path: `/v1/stores/${storeId}/customer-group-members`, query: "", body: { id, customer_group_id: otherId, subject: company, access_end_at: null } },
    { method: "POST", path: `/v1/stores/${storeId}/customer-group-members`, query: "", body: { id, customer_group_id: otherId, subject: location, access_end_at: now } },
    { method: "GET", path: `/v1/stores/${storeId}/customer-group-members`, query: `?company_id=${selectedStoreId}&customer_group_id=${otherId}&limit=10`, body: null },
  ]);
  for (const removed of ["add", "remove", "join", "execute", "findCommands", "update", "delete"]) assert.equal(removed in api, false, removed);
  await assert.rejects(async () => api.assign({ store_id: storeId, id: "member-1", customer_group_id: otherId, subject: company, access_end_at: null }), TypeError);
  assert.equal(calls.length, 3);
});

test("Market management sends explicit creation, payment option order and versioned deletion", async (context) => {
  const calls = [];
  const record = { id, store_id: storeId, key: "bih", currency: "bam", tax_mode: "inclusive", payment_option_ids: [], status: { type: "active" }, created_at: now, updated_at: now };
  const updated = { ...record, tax_mode: "exclusive", payment_option_ids: [otherId], updated_at: now + 1 };
  const deleting = { ...updated, status: { type: "deleting" }, updated_at: now + 2 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { target: new URL(url), method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null, signal: init.signal };
    calls.push(call);
    if (call.method === "DELETE") return response(deleting, 202);
    if (call.method === "PUT") return response(updated);
    if (call.method === "POST") return response(record, 201);
    if (call.target.pathname.endsWith("/markets")) return response({ items: [record], cursor: null });
    return response(record);
  });
  const client = createClient();
  const api = client.store.market;
  const create = { id, key: "bih", currency: "bam", tax_mode: "inclusive" };
  assert.deepEqual(await api.create({ store_id: storeId, ...create }), record);
  assert.equal(calls.at(-1).method, "POST");
  assert.deepEqual(calls.at(-1).body, create);
  assert.deepEqual(await api.list({ store_id: storeId, currency: "bam", status: "active" }), { items: [record], cursor: null });
  assert.deepEqual(Object.fromEntries(calls.at(-1).target.searchParams), { currency: "bam", status: "active" });
  assert.deepEqual(await api.get({ store_id: storeId, id }), record);
  await api.getByKey({ store_id: storeId, key: "bih" });
  assert.equal(calls.at(-1).target.pathname, `/v1/stores/${storeId}/markets/by-key/bih`);
  const update = { expected_updated_at: now, tax_mode: "exclusive", payment_option_ids: [otherId] };
  assert.deepEqual(await api.update({ store_id: storeId, id, ...update }), updated);
  assert.deepEqual(calls.at(-1).body, update);
  assert.equal(calls.at(-1).method, "PUT");
  assert.deepEqual(await api.delete({ store_id: storeId, id, expected_updated_at: now + 1 }), deleting);
  assert.equal(calls.at(-1).method, "DELETE");
  assert.equal(calls.at(-1).body, null);
  assert.deepEqual([...calls.at(-1).target.searchParams], [["expected_updated_at", String(now + 1)]]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), "Bearer arky_api_test");
    assert.equal(call.body?.store_id, undefined);
    assert.equal(call.target.searchParams.has("store_id"), false);
  }
  assert.equal("usage" in api, false);
  assert.equal("setStoreId" in client, false);
  const before = calls.length;
  await assert.rejects(async () => api.list({}), TypeError);
  await assert.rejects(async () => api.create({ store_id: storeId, ...create, id: "bih" }), TypeError);
  assert.equal(calls.length, before);
});

test("B2B management keeps server denials and conflicts without replacing the mutation", async (context) => {
  for (const definition of [...definitions, { path: ["store", "market"] }]) {
    for (const status of [400, 403, 404, 409]) {
      let calls = 0;
      context.mock.method(globalThis, "fetch", async () => {
        calls += 1;
        return response({ message: "Record 'company:x' is still referenced by catalog_access y (audience)", error: "GENERAL.CONFLICT", status_code: status }, status);
      });
      const api = getApi(createClient(), definition.path);
      await assert.rejects(
        api.delete({ store_id: storeId, id, expected_updated_at: now }),
        (error) => error.name === "ApiError" && error.statusCode === status && error.code === "GENERAL.CONFLICT" && error.message.includes("still referenced by"),
      );
      assert.equal(calls, 1);
    }
  }
});

test("a buyer reads their company access as scoped grants, their memberships and the locations they may buy for", async (context) => {
  const access = {
    company: { id: selectedStoreId, store_id: storeId, name: "Buyer", contact_email: "accounts@example.test", tax_registrations: [], purchasing: standardCheckout, blocks: [], status: { type: "active" }, created_at: now, updated_at: now },
    grants: [
      { scope: { type: "all_locations" }, permissions: ["place_orders", "join_customer_groups"] },
      { scope: { type: "company_location", company_location_id: otherId }, permissions: ["view_company_orders", "manage_company_customer_groups"] },
    ],
  };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const target = new URL(url);
    calls.push({ method: init.method ?? "GET", path: target.pathname, query: Object.fromEntries(target.searchParams), headers: new Headers(init.headers) });
    if (target.pathname.endsWith("/access")) return response(access);
    if (target.pathname.endsWith("/company-memberships") || target.pathname.endsWith("/company-locations")) return response({ items: [], cursor: null });
    return response({ id: otherId });
  });
  const shop = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).companies;
  assert.deepEqual(await shop.access({ id: selectedStoreId }), access);
  await shop.memberships({ limit: 10 });
  await shop.locations({ company_id: selectedStoreId, limit: 5 });
  await shop.location({ id: otherId });
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/storefront/companies/${selectedStoreId}/access`, {}],
    ["GET", "/v1/storefront/company-memberships", { limit: "10" }],
    ["GET", "/v1/storefront/company-locations", { company_id: selectedStoreId, limit: "5" }],
    ["GET", `/v1/storefront/company-locations/${otherId}`, {}],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  for (const removed of ["minimumProgress", "setPurchasing"]) assert.equal(removed in shop, false, removed);
});
