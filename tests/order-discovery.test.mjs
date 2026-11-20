import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, factoryOrderToken, fixedIdFactories, ids, storefrontIdentity, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "9d3e7b50-1a26-4f8c-b74e-0c5a2d9f6e13";

const shared = {
  company_location_id: ids.companyLocation,
  query: "ORD-2026",
  statuses: ["confirmed", "partially_cancelled"],
  sources: ["renewal"],
  product_statuses: ["confirmed"],
  booking_statuses: ["attended", "no_show"],
  product_ids: [ids.product],
  booking_service_ids: ["service"],
  booking_resource_ids: ["resource"],
  from: 0,
  to: 20,
  created_at_from: 0,
  created_at_to: 30,
  updated_at_from: 5,
  limit: 1,
  sort_field: "price",
  sort_direction: "asc",
};

for (const scope of ["admin", "storefront"]) {
  test(`${scope} order discovery keeps combined filters, the chosen ordering and the opaque continuation`, async (context) => {
    const calls = recordFetch(context, (_call, count) => ({ items: [], cursor: count === 1 ? "order:+/=" : null }));
    const api = scope === "admin"
      ? createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop.order
      : createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() }).eshop.order;
    const filters = scope === "admin" ? { store_id: STORE_ID, customer_id: ids.customer, company_id: ids.company, package_member_ids: [ids.packageMember], ...shared } : shared;
    const first = await api.find(filters);
    assert.deepEqual(first, { items: [], cursor: "order:+/=" });
    assert.deepEqual(await api.find({ ...filters, cursor: first.cursor }), { items: [], cursor: null });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].query.cursor, first.cursor);
    for (const call of calls) {
      assert.equal(call.path, scope === "admin" ? `/v1/stores/${STORE_ID}/orders` : "/v1/storefront/orders");
      assert.equal(call.method, "GET");
      assert.equal(call.body, null);
      assert.equal("store_id" in call.query, false);
      for (const [key, value] of Object.entries(filters)) {
        if (key === "store_id") continue;
        if (Array.isArray(value)) assert.deepEqual(JSON.parse(call.query[key]), value, key);
        else assert.equal(call.query[key], String(value), key);
      }
      if (scope === "storefront") {
        assert.equal("customer_id" in call.query, false);
        assert.equal("company_id" in call.query, false);
        assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
        assert.equal(call.headers.get("x-arky-store-id"), storefrontIdentity.storeId);
    assert.equal(call.headers.get("x-arky-sales-channel-id"), storefrontIdentity.salesChannelId);
      } else {
        assert.equal(call.query.customer_id, ids.customer);
        assert.deepEqual(JSON.parse(call.query.package_member_ids), [ids.packageMember]);
        assert.equal("package_member_id" in call.query, false);
        assert.equal(call.headers.get("authorization"), "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA");
      }
    }
  });
}

test("storefront order reads go through the buyer's own routes and need the buyer's session", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/fulfillments") ? { items: [], cursor: null } : { id: ids.order });
  const orders = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() }).eshop.order;
  await orders.get({ id: ids.order });
  assert.deepEqual(await orders.findFulfillments({ order_id: ids.order }), { items: [], cursor: null });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", `/v1/storefront/orders/${ids.order}`],
    ["GET", `/v1/storefront/orders/${ids.order}/fulfillments`],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("staff read Orders by ids alone, a branch's finished booking items not yet invoiced, and invoices of several Orders, by number or by document time", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const admin = createAdmin({ apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop.order;
  const otherOrder = "4b6d8f0a-2c3e-4f5a-9b7c-1d3e5f7a9b2c";
  const branch = "5c7e9a1b-3d4f-4a6b-8c9d-2e4f6a8b0c3d";
  await admin.find({ store_id: STORE_ID, ids: [ids.order, otherOrder] });
  await admin.findBookingItems({ store_id: STORE_ID, store_location_id: branch, not_invoiced: true, statuses: ["attended"], limit: 50 });
  await admin.invoice.find({ store_id: STORE_ID, order_ids: [ids.order, otherOrder] });
  await admin.invoice.find({ store_id: STORE_ID, number: "2026-00042" });
  await admin.invoice.find({ store_id: STORE_ID, document_at_from: 1_700_000_000_000, document_at_to: 1_700_086_400_000, limit: 20 });
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/stores/${STORE_ID}/orders`, { ids: JSON.stringify([ids.order, otherOrder]) }],
    ["GET", `/v1/stores/${STORE_ID}/orders/booking-items`, { store_location_id: branch, not_invoiced: "true", statuses: JSON.stringify(["attended"]), limit: "50" }],
    ["GET", `/v1/stores/${STORE_ID}/invoices`, { order_ids: JSON.stringify([ids.order, otherOrder]) }],
    ["GET", `/v1/stores/${STORE_ID}/invoices`, { number: "2026-00042" }],
    ["GET", `/v1/stores/${STORE_ID}/invoices`, { document_at_from: "1700000000000", document_at_to: "1700086400000", limit: "20" }],
  ]);
});

test("staff read a booking line's reminder outcomes and the products an Order's lines name, and a buyer reads the same products under the Order token", async (context) => {
  const products = [{ type: "found", id: ids.product, key: "milkpal", blocks: [] }, { type: "gone", id: ids.variant }];
  const calls = recordFetch(context, (call) => call.path.endsWith("/reminders") ? [{ notification_id: ids.line, result: null, sent_at: null }] : products);
  const admin = createAdmin({ apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop.order;
  await admin.findBookingReminders({ store_id: STORE_ID, order_id: ids.order, order_booking_item_id: ids.line });
  assert.deepEqual(await admin.findProducts({ store_id: STORE_ID, order_id: ids.order, ids: [ids.product, ids.variant] }), products);
  const shop = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  const token = factoryOrderToken;
  assert.deepEqual(await shop.eshop.order.findProducts({ order_id: ids.order, ids: [ids.product] }, { order_token: token }), products);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/stores/${STORE_ID}/orders/${ids.order}/booking-items/${ids.line}/reminders`, {}],
    ["GET", `/v1/stores/${STORE_ID}/orders/${ids.order}/products`, { ids: JSON.stringify([ids.product, ids.variant]) }],
    ["GET", `/v1/storefront/orders/${ids.order}/products`, { ids: JSON.stringify([ids.product]) }],
  ]);
  assert.equal(calls[2].headers.get("x-arky-order-token"), token);
});
