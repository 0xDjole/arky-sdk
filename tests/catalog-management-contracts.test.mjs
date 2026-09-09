import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const otherStoreId = "7f3a7a66-3403-4112-b5e5-d004a62d00b0";
const id = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const now = 1788862721000;
const sellable = {
  type: "product_variant",
  product_id: id,
  variant_id: otherStoreId,
};
const access = { view_products: true, view_prices: false, purchase: false };
const definitions = [
  {
    owner: "price",
    route: "prices",
    create: {
      sellable,
      price_list_id: null,
      currency: "bam",
      amount: 2500,
      compare_at: 3000,
      billing: { type: "one_time" },
      min_quantity: 1,
      max_quantity: 9,
      status: { type: "active" },
    },
    update: {
      amount: 2000,
      compare_at: null,
      min_quantity: 10,
      max_quantity: null,
      status: { type: "archived" },
    },
    query: { sellable, price_list_id: id },
  },
  {
    owner: "priceList",
    route: "price-lists",
    create: {
      key: "wholesale",
      name: "Wholesale",
      priority: -2147483648,
      status: { type: "draft" },
      starts_at: null,
      ends_at: null,
    },
    update: {
      name: "Wholesale 2",
      priority: 2147483647,
      status: { type: "active" },
      starts_at: now,
      ends_at: null,
    },
    query: { key: "wholesale" },
    usage: {
      catalog_ids: [id],
      more_catalogs: true,
      price_ids: [otherStoreId],
      more_prices: false,
    },
  },
  {
    owner: "assortment",
    route: "assortments",
    create: { key: "retail", name: "Retail", status: { type: "active" } },
    update: { name: "Retail 2", status: { type: "archived" } },
    query: { key: "retail" },
    usage: {
      catalog_ids: [id],
      more_catalogs: true,
      item_ids: [id],
      more_items: false,
    },
  },
  {
    owner: "assortmentItem",
    route: "assortment-items",
    create: { assortment_id: otherStoreId, sellable, position: -2147483648 },
    update: { position: null },
    query: { assortment_id: otherStoreId },
  },
  {
    owner: "catalog",
    route: "catalogs",
    create: {
      key: "retail",
      name: "Retail",
      assortment_id: otherStoreId,
      price_list_id: null,
      status: { type: "active" },
      starts_at: null,
      ends_at: null,
    },
    update: {
      name: "Retail 2",
      assortment_id: null,
      price_list_id: otherStoreId,
      status: { type: "archived" },
      starts_at: now,
      ends_at: null,
    },
    query: { key: "retail" },
    usage: { entitlement_ids: [id], more_entitlements: false },
  },
  {
    owner: "catalogEntitlement",
    route: "catalog-entitlements",
    create: {
      catalog_id: otherStoreId,
      conditions: [{ type: "company", ids: [otherStoreId] }],
      access,
      status: { type: "active" },
      starts_at: null,
      ends_at: null,
    },
    update: {
      conditions: [],
      access: { view_products: false, view_prices: true, purchase: false },
      status: { type: "archived" },
      starts_at: null,
      ends_at: now,
    },
    query: { catalog_id: otherStoreId },
  },
];

for (const definition of definitions) {
  test(`${definition.owner} uses exact Store routes, bodies and versioned deletion contracts`, async () => {
    const calls = [];
    const record = {
      id,
      store_id: otherStoreId,
      ...definition.create,
      created_at: now,
      updated_at: now,
    };
    const deleting = { ...record, status: { type: "deleting" } };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init = {}) => {
      const parsed = new URL(url);
      const call = {
        url: parsed,
        method: init.method ?? "GET",
        headers: new Headers(init.headers),
        body: init.body ? JSON.parse(init.body) : null,
      };
      calls.push(call);
      if (call.method === "DELETE" && definition.owner === "assortmentItem") {
        return new Response(null, { status: 204 });
      }
      const body =
        call.method === "DELETE"
          ? deleting
          : parsed.pathname.endsWith("/usage")
            ? definition.usage
            : call.method === "GET" &&
                parsed.pathname.endsWith(`/${definition.route}`)
              ? { items: [record], cursor: "next-page" }
              : record;
      return new Response(JSON.stringify(body), {
        status:
          call.method === "DELETE" ? 202 : call.method === "POST" ? 201 : 200,
        headers: { "content-type": "application/json" },
      });
    };
    try {
      const client = createAdmin({
        baseUrl: "https://api.example.test",
        storeId,
        market: "bih",
        apiToken: "arky_api_test",
      });
      const api = client.eshop[definition.owner];
      assert.deepEqual(
        await api.create({ store_id: otherStoreId, ...definition.create }),
        record,
      );
      assert.deepEqual(
        await api.update({
          store_id: otherStoreId,
          id,
          expected_updated_at: now,
          ...definition.update,
        }),
        record,
      );
      assert.deepEqual(await api.get({ store_id: otherStoreId, id }), record);
      assert.deepEqual(
        await api.find({
          store_id: otherStoreId,
          ...definition.query,
          limit: 20,
          cursor: "previous-page",
        }),
        { items: [record], cursor: "next-page" },
      );
      const deleted = await api.delete({
        store_id: otherStoreId,
        id,
        expected_updated_at: now,
      });
      assert.deepEqual(
        deleted,
        definition.owner === "assortmentItem" ? undefined : deleting,
      );
      assert.equal(calls.length, 5);
      for (const call of calls) {
        assert.ok(
          call.url.pathname.startsWith(
            `/v1/stores/${otherStoreId}/${definition.route}`,
          ),
        );
        assert.equal(call.headers.get("authorization"), "Bearer arky_api_test");
        assert.equal(call.url.searchParams.has("store_id"), false);
        assert.equal(call.body?.store_id, undefined);
        assert.equal(call.body?.id, undefined);
      }
      assert.deepEqual(calls[0].body, definition.create);
      assert.deepEqual(calls[1].body, {
        expected_updated_at: now,
        ...definition.update,
      });
      assert.equal(calls[1].method, "PUT");
      assert.equal(calls[3].url.searchParams.get("cursor"), "previous-page");
      assert.equal(calls[3].url.searchParams.get("limit"), "20");
      for (const [key, value] of Object.entries(definition.query))
        assert.equal(
          calls[3].url.searchParams.get(key),
          typeof value === "object" ? JSON.stringify(value) : value,
        );
      assert.equal(
        calls[4].url.searchParams.get("expected_updated_at"),
        String(now),
      );
      assert.equal(calls[4].method, "DELETE");
      assert.equal(calls[4].body, null);
      if (definition.usage)
        assert.deepEqual(
          await api.usage({ store_id: otherStoreId, id }),
          definition.usage,
        );
      await api.get({ id: "invalid/segment?still-one-component" });
      assert.equal(
        calls.at(-1).url.pathname,
        `/v1/stores/${storeId}/${definition.route}/invalid%2Fsegment%3Fstill-one-component`,
      );
      assert.equal(calls.at(-1).url.search, "");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("catalog management is not attached to the storefront acquisition API", async () => {
  const { createStorefront } = await import("../dist/storefront.js");
  const storefront = createStorefront(`arky_pk_${"a".repeat(42)}A`);
  for (const { owner } of definitions) {
    assert.equal(owner in storefront, false);
    assert.equal(owner in storefront.eshop, false);
  }
});
