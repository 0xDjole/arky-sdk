import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const selectedStoreId = "7f3a7a66-3403-4112-b5e5-d004a62d00b0";
const id = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
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
const profile = {
  legal_name: "Buyer Ltd",
  registration_number: null,
  tax_number: null,
  contact_email: "accounts@example.test",
  contact_phone: null,
  registered_address: address,
};
const definitions = [
  {
    path: ["companies"],
    route: "companies",
    create: { name: "Buyer", profile, status: { type: "active" } },
    update: {
      name: "Buyer 2",
      profile: { ...profile, registered_address: null },
      status: { type: "archived" },
    },
    query: { query: "Buyer registration", status: "archived", sort_field: "updated_at", sort_direction: "asc" },
    usage: {
      catalog_access_ids: [id],
      more_catalog_accesses: true,
      cart_ids: [],
      more_carts: false,
      membership_ids: [id],
      more_memberships: false,
      location_ids: [id],
      more_locations: false,
      group_member_ids: [selectedStoreId],
      more_group_members: true,
      shipping_rate_ids: [id],
      more_shipping_rates: true,
    },
  },
  {
    path: ["companies", "membership"],
    route: "company-memberships",
    create: { company_id: selectedStoreId, customer_id: id, role_ids: [id], locations: { type: "only", company_location_ids: [id] } },
    update: { role_ids: [selectedStoreId], locations: { type: "only", company_location_ids: [] }, status: { type: "disabled" } },
    query: { company_id: selectedStoreId, customer_id: id, role_id: id },
  },
  {
    path: ["companies", "role"],
    route: "company-roles",
    create: {
      key: "purchaser",
      permissions: [
        "place_orders",
        "access_digital_products",
        "create_subscriptions",
      ],
    },
    update: {
      permissions: ["admin", "view_company_orders", "view_company_subscriptions"],
    },
    query: { key: "purchaser", company_id: selectedStoreId },
    get: { company_id: selectedStoreId },
    response: { is_system: false },
    usage: { membership_ids: [id], more_memberships: true },
  },
  {
    path: ["companies", "location"],
    route: "company-locations",
    response: {
      tax: { registrations: [], exemptions: [] },
      commerce: { payment_terms_id: null, allowed_payment_option_ids: null, purchase_order_number_required: false },
      fulfillment_store_location_id: null,
    },
    create: {
      company_id: selectedStoreId,
      name: "Depot",
      shipping_address: null,
      billing_address: null,
      status: { type: "active" },
    },
    update: {
      name: "Depot 2",
      shipping_address: address,
      billing_address: null,
      status: { type: "archived" },
    },
    query: { company_id: selectedStoreId },
  },
  {
    path: ["eshop", "customerGroup"],
    route: "customer-groups",
    create: {
      key: "wholesale",
      name: "Wholesale",
      status: { type: "active" },
      join_policy: { type: "private" },
      communication: { type: "disabled" },
    },
    update: {
      name: "Wholesale 2",
      status: { type: "archived" },
      join_policy: { type: "private" },
      communication: { type: "disabled" },
    },
    query: { key: "wholesale" },
    usage: {
      member_ids: [id],
      more_members: true,
      email_consent_ids: [],
      more_email_consents: false,
      shipping_rate_ids: [],
      more_shipping_rates: false,
      catalog_access_ids: [id],
      more_catalog_accesses: false,
    },
  },
  {
    path: ["store", "salesChannel"],
    route: "sales-channels",
    create: { key: "trade", name: "Trade", market_ids: [id], status: { type: "active" } },
    update: {
      name: "Trade 2",
      market_ids: [],
      status: { type: "archived" },
      replacement_default_sales_channel_id: id,
    },
    query: { status: { type: "archived" } },
    deletion: { replacement_default_sales_channel_id: id },
    usage: {
      storefront_client_ids: [],
      more_storefront_clients: false,
      catalog_access_ids: [id],
      more_catalog_accesses: false,
      shipping_rate_ids: [],
      more_shipping_rates: false,
      cart_ids: [],
      more_carts: false,
      is_default: true,
    },
  },
];

const getApi = (client, path) =>
  path.reduce((owner, key) => owner[key], client);
const createClient = () =>
  createAdmin({
    baseUrl: "https://api.example.test",
    apiToken: "arky_api_test",
  });
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("Everywhere membership reach is sent explicitly and survives exact reads", async () => {
  const originalFetch = globalThis.fetch;
  const locations = { type: "everywhere" };
  const record = {
    id,
    store_id: storeId,
    company_id: selectedStoreId,
    customer_id: id,
    role_ids: [],
    locations,
    status: { type: "active" },
    created_at: now,
    updated_at: now,
  };
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ path: new URL(url).pathname, body: init.body ? JSON.parse(init.body) : null });
    return response(record);
  };
  try {
    const api = createClient().companies.membership;
    assert.deepEqual(await api.create({ store_id: storeId, company_id: selectedStoreId, customer_id: id, role_ids: [], locations }), record);
    assert.deepEqual(calls[0].body.locations, locations);
    assert.equal("scope" in calls[0].body, false);
    assert.equal(calls[0].path, `/v1/stores/${storeId}/company-memberships`);
    assert.deepEqual(await api.get({ store_id: storeId, id }), record);
    assert.equal(calls[1].path, `/v1/stores/${storeId}/company-memberships/${id}`);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Company location served-from is set or cleared with its revision", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ method: init.method, path: new URL(url).pathname, body: init.body ? JSON.parse(init.body) : null });
    return response({ id, fulfillment_store_location_id: null });
  };
  try {
    const api = createClient().companies.location;
    await api.setServedFrom({ store_id: storeId, id, expected_updated_at: now, fulfillment_store_location_id: selectedStoreId });
    await api.setServedFrom({ store_id: storeId, id, expected_updated_at: now + 1, fulfillment_store_location_id: null });
    assert.deepEqual(calls, [
      { method: "PUT", path: `/v1/stores/${storeId}/company-locations/${id}/served-from`, body: { expected_updated_at: now, fulfillment_store_location_id: selectedStoreId } },
      { method: "PUT", path: `/v1/stores/${storeId}/company-locations/${id}/served-from`, body: { expected_updated_at: now + 1, fulfillment_store_location_id: null } },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

for (const definition of definitions) {
  test(`${definition.path.join(".")} preserves explicit owner commands, scopes and deletion acceptance`, async () => {
    const calls = [];
    const record = {
      id,
      store_id: selectedStoreId,
      ...definition.create,
      ...definition.response,
      status: { type: "active" },
      created_at: now,
      updated_at: now,
    };
    const updated = { ...record, ...definition.update, updated_at: now + 1 };
    delete updated.replacement_default_sales_channel_id;
    const deleting = {
      ...record,
      status: { type: "deleting" },
      updated_at: now + 2,
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init = {}) => {
      const target = new URL(url);
      const call = {
        target,
        method: init.method ?? "GET",
        headers: new Headers(init.headers),
        body: init.body ? JSON.parse(init.body) : null,
        signal: init.signal,
      };
      calls.push(call);
      if (call.method === "DELETE") return response(deleting, 202);
      if (call.method === "PUT") return response(updated);
      if (call.method === "POST") return response(record, 201);
      if (target.pathname.endsWith("/usage")) return response(definition.usage);
      if (target.pathname.endsWith(`/${definition.route}`)) {
        return response({
          items: [record],
          cursor: definition.exactBinding ? null : "next-page",
        });
      }
      return response(record);
    };
    try {
      const api = getApi(createClient(), definition.path);
      assert.deepEqual(
        await api.create({ ...definition.create, store_id: selectedStoreId }),
        record,
      );
      assert.deepEqual(calls.at(-1).body, definition.create);
      assert.deepEqual(
        await api.get({ id, store_id: selectedStoreId, ...definition.get }),
        record,
      );
      for (const [key, value] of Object.entries(definition.get ?? {})) {
        assert.equal(calls.at(-1).target.searchParams.get(key), value);
      }
      const query = {
        ...definition.query,
        limit: 20,
        ...(!definition.exactBinding && { cursor: "previous-page" }),
      };
      assert.deepEqual(
        await api.find({ store_id: selectedStoreId, ...query }),
        {
          items: [record],
          cursor: definition.exactBinding ? null : "next-page",
        },
      );
      for (const [key, value] of Object.entries(query)) {
        assert.equal(
          calls.at(-1).target.searchParams.get(key),
          typeof value === "object" ? JSON.stringify(value) : String(value),
        );
      }
      if (definition.update) {
        const input = { ...definition.update, expected_updated_at: now };
        assert.deepEqual(
          await api.update({ ...input, id, store_id: selectedStoreId }),
          updated,
        );
        assert.deepEqual(calls.at(-1).body, input);
      } else {
        assert.equal("update" in api, false);
      }
      if (definition.usage) {
        assert.deepEqual(
          await api.usage({ id, store_id: selectedStoreId }),
          definition.usage,
        );
        assert.equal(
          calls.at(-1).target.pathname,
          `/v1/stores/${selectedStoreId}/${definition.route}/${id}/usage`,
        );
      }
      assert.deepEqual(
        await api.delete({
          id,
          store_id: selectedStoreId,
          expected_updated_at: now,
          ...definition.deletion,
        }),
        deleting,
      );
      assert.equal(calls.at(-1).method, "DELETE");
      assert.equal(calls.at(-1).body, null);
      assert.equal(
        calls.at(-1).target.searchParams.get("expected_updated_at"),
        String(now),
      );
      for (const [key, value] of Object.entries(definition.deletion ?? {})) {
        assert.equal(calls.at(-1).target.searchParams.get(key), value);
      }
      for (const call of calls) {
        assert.ok(
          call.target.pathname.startsWith(
            `/v1/stores/${selectedStoreId}/${definition.route}`,
          ),
        );
        assert.equal(call.headers.get("authorization"), "Bearer arky_api_test");
        assert.equal(call.body?.store_id, undefined);
        assert.equal(call.body?.id, undefined);
        assert.equal(call.target.searchParams.has("store_id"), false);
      }
      const signal = new AbortController().signal;
      await assert.rejects(async () => api.get({ id: "one/segment?only" }), TypeError);
      await api.get(
        { store_id: storeId, id: "one/segment?only" },
        { signal, headers: { "x-client-trace": "company-contract" } },
      );
      assert.equal(
        calls.at(-1).target.pathname,
        `/v1/stores/${storeId}/${definition.route}/one%2Fsegment%3Fonly`,
      );
      assert.equal(calls.at(-1).target.search, "");
      assert.equal(
        calls.at(-1).headers.get("x-client-trace"),
        "company-contract",
      );
      assert.equal(calls.at(-1).signal, signal);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("Market management preserves explicit creation, immutable route identity and versioned deletion", async () => {
  const calls = [];
  const record = {
    id,
    store_id: storeId,
    key: "bih",
    currency: "bam",
    tax_mode: "inclusive",
    status: { type: "active" },
    created_at: now,
    updated_at: now,
  };
  const usage = {
    market_payment_option_ids: [id],
    more_market_payment_options: false,
    sales_channel_ids: [id],
    more_sales_channels: false,
    market_zone_ids: [],
    more_market_zones: false,
    catalog_ids: [selectedStoreId],
    more_catalogs: true,
    cart_ids: [],
    more_carts: false,
  };
  const updated = { ...record, tax_mode: "exclusive", updated_at: now + 1 };
  const deleting = {
    ...updated,
    status: { type: "deleting" },
    updated_at: now + 2,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      target: new URL(url),
      method: init.method ?? "GET",
      headers: new Headers(init.headers),
      body: init.body ? JSON.parse(init.body) : null,
      signal: init.signal,
    };
    calls.push(call);
    if (call.method === "DELETE") return response(deleting, 202);
    if (call.method === "PUT") return response(updated);
    if (call.method === "POST") return response(record, 201);
    if (call.target.pathname.endsWith("/usage")) return response(usage);
    if (call.target.pathname.endsWith("/markets")) return response({ items: [record], cursor: null });
    return response(record);
  };
  try {
    const client = createClient();
    const api = client.store.market;
    const create = { key: "bih", currency: "bam", tax_mode: "inclusive" };
    assert.deepEqual(await api.create({ store_id: storeId, ...create }), record);
    assert.equal(calls.at(-1).method, "POST");
    assert.deepEqual(calls.at(-1).body, create);
    assert.deepEqual(await api.list({ store_id: storeId }), { items: [record], cursor: null });
    assert.deepEqual(await api.get({ store_id: storeId, id }), record);
    assert.deepEqual(await api.usage({ store_id: storeId, id }), usage);
    assert.equal(
      calls.at(-1).target.pathname,
      `/v1/stores/${storeId}/markets/${id}/usage`,
    );
    assert.equal("is_default" in usage, false);
    const update = {
      expected_updated_at: now,
      tax_mode: "exclusive",
    };
    assert.deepEqual(await api.update({ store_id: storeId, id, ...update }), updated);
    assert.deepEqual(calls.at(-1).body, update);
    assert.equal(calls.at(-1).method, "PUT");
    assert.deepEqual(
      await api.delete({ store_id: storeId, id, expected_updated_at: now + 1 }),
      deleting,
    );
    assert.equal(calls.at(-1).method, "DELETE");
    assert.equal(calls.at(-1).body, null);
    assert.deepEqual(
      [...calls.at(-1).target.searchParams],
      [["expected_updated_at", String(now + 1)]],
    );
    for (const call of calls) {
      assert.equal(call.headers.get("authorization"), "Bearer arky_api_test");
      assert.equal(call.body?.store_id, undefined);
      assert.equal(call.body?.id, undefined);
      assert.equal(call.target.searchParams.has("store_id"), false);
    }
    const signal = new AbortController().signal;
    await api.get({ store_id: storeId, id: "one/segment?only" }, {
      signal,
      headers: { "x-client-trace": "market-contract" },
    });
    assert.equal(
      calls.at(-1).target.pathname,
      `/v1/stores/${storeId}/markets/one%2Fsegment%3Fonly`,
    );
    assert.equal(calls.at(-1).target.search, "");
    assert.equal(calls.at(-1).signal, signal);
    assert.equal(calls.at(-1).headers.get("x-client-trace"), "market-contract");
    assert.equal("setStoreId" in client, false);
    await api.list({ store_id: selectedStoreId });
    assert.equal(
      calls.at(-1).target.pathname,
      `/v1/stores/${selectedStoreId}/markets`,
    );
    const before = calls.length;
    await assert.rejects(async () => api.list({}), TypeError);
    await assert.rejects(async () => api.usage(id), TypeError);
    assert.equal(calls.length, before);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("B2B management preserves server denials and conflicts without replacing the mutation", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const definition of [...definitions, { path: ["store", "market"] }]) {
      for (const status of [400, 403, 404, 409]) {
        let calls = 0;
        globalThis.fetch = async () => {
          calls += 1;
          return response(
            { message: "Current owner prevents this change" },
            status,
          );
        };
        const api = getApi(createClient(), definition.path);
        await assert.rejects(
          api.delete({ store_id: storeId, id, expected_updated_at: now }),
          (error) =>
            error.name === "ApiError" &&
            error.statusCode === status &&
            error.message === "Current owner prevents this change",
        );
        assert.equal(calls, 1);
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
