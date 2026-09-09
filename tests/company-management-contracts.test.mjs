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
    query: {},
    usage: {
      catalog_entitlement_ids: [id],
      more_catalog_entitlements: true,
      cart_ids: [],
      more_carts: false,
      membership_ids: [id],
      more_memberships: false,
      location_ids: [id],
      more_locations: false,
      group_edge_ids: [],
      more_group_edges: false,
    },
  },
  {
    path: ["companies", "membership"],
    route: "company-memberships",
    create: { company_id: selectedStoreId, customer_id: id, role_ids: [id] },
    update: { role_ids: [selectedStoreId], status: { type: "disabled" } },
    query: { company_id: selectedStoreId },
  },
  {
    path: ["companies", "role"],
    route: "company-roles",
    create: {
      key: "purchaser",
      name: "Purchaser",
      permissions: [
        "place_orders",
        "view_own_orders",
        "create_subscriptions",
        "view_own_subscriptions",
      ],
    },
    update: {
      name: "Company reader",
      permissions: ["view_company_orders", "view_company_subscriptions"],
    },
    query: { key: "purchaser", company_id: selectedStoreId },
    get: { company_id: selectedStoreId },
    response: { is_system: false },
    usage: { membership_ids: [id], more_memberships: true },
  },
  {
    path: ["companies", "location"],
    route: "company-locations",
    create: {
      company_id: selectedStoreId,
      name: "Depot",
      shipping_address: address,
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
    create: { key: "wholesale", name: "Wholesale", status: { type: "active" } },
    update: { name: "Wholesale 2", status: { type: "archived" } },
    query: { key: "wholesale" },
    usage: {
      catalog_entitlement_ids: [id],
      more_catalog_entitlements: false,
      customer_edge_ids: [id],
      more_customer_edges: true,
      company_edge_ids: [],
      more_company_edges: false,
    },
  },
  {
    path: ["eshop", "customerGroupCustomer"],
    route: "customer-group-customers",
    create: { customer_group_id: selectedStoreId, customer_id: id },
    query: { customer_group_id: selectedStoreId, customer_id: id },
    exactBinding: true,
  },
  {
    path: ["eshop", "customerGroupCompany"],
    route: "customer-group-companies",
    create: { customer_group_id: selectedStoreId, company_id: id },
    query: { customer_group_id: selectedStoreId, company_id: id },
    exactBinding: true,
  },
  {
    path: ["store", "salesChannel"],
    route: "sales-channels",
    create: { key: "trade", name: "Trade", status: { type: "active" } },
    update: {
      name: "Trade 2",
      status: { type: "archived" },
      replacement_default_sales_channel_id: id,
    },
    query: { status: { type: "archived" } },
    deletion: { replacement_default_sales_channel_id: id },
    usage: {
      catalog_entitlement_ids: [id],
      more_catalog_entitlements: false,
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
    storeId,
    apiToken: "arky_api_test",
  });
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
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
      await api.get(
        { id: "one/segment?only" },
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
    payment_provider_ids: [],
    zones: [],
    created_at: now,
    updated_at: now,
  };
  const usage = {
    catalog_entitlement_ids: [selectedStoreId],
    more_catalog_entitlements: true,
    cart_ids: [],
    more_carts: false,
    is_default: true,
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
    if (call.target.pathname.endsWith("/markets")) return response([record]);
    return response(record);
  };
  try {
    const client = createClient();
    const api = client.store.market;
    const create = { key: "bih", currency: "bam", tax_mode: "inclusive" };
    assert.deepEqual(await api.create(create), record);
    assert.equal(calls.at(-1).method, "POST");
    assert.deepEqual(calls.at(-1).body, create);
    assert.deepEqual(await api.list(), [record]);
    assert.deepEqual(await api.get(id), record);
    assert.deepEqual(await api.usage(id), usage);
    assert.equal(
      calls.at(-1).target.pathname,
      `/v1/stores/${storeId}/markets/${id}/usage`,
    );
    const update = {
      expected_updated_at: now,
      tax_mode: "exclusive",
      payment_provider_ids: [],
    };
    assert.deepEqual(await api.update({ id, ...update }), updated);
    assert.deepEqual(calls.at(-1).body, update);
    assert.equal(calls.at(-1).method, "PUT");
    assert.deepEqual(
      await api.delete({ id, expected_updated_at: now + 1 }),
      deleting,
    );
    assert.equal(calls.at(-1).method, "DELETE");
    assert.equal(calls.at(-1).body, null);
    assert.deepEqual(
      [...calls.at(-1).target.searchParams],
      [["expected_updated_at", String(now + 1)]],
    );
    assert.deepEqual(
      await api.delete({
        id,
        expected_updated_at: now + 1,
        replacement_default_market_id: selectedStoreId,
      }),
      deleting,
    );
    assert.equal(
      calls.at(-1).target.searchParams.get("replacement_default_market_id"),
      selectedStoreId,
    );
    for (const call of calls) {
      assert.equal(call.headers.get("authorization"), "Bearer arky_api_test");
      assert.equal(call.body?.store_id, undefined);
      assert.equal(call.body?.id, undefined);
      assert.equal(call.target.searchParams.has("store_id"), false);
    }
    const signal = new AbortController().signal;
    await api.get("one/segment?only", {
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
    client.setStoreId(selectedStoreId);
    await api.list();
    assert.equal(
      calls.at(-1).target.pathname,
      `/v1/stores/${selectedStoreId}/markets`,
    );
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
          api.delete({ id, expected_updated_at: now }),
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
