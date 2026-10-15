import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "2d7f9b13-5c48-4e60-a1b3-8e5c7a9d1f24";
const day = 86_400_000;
const time = { from: 20_000 * day, to: 20_001 * day };

function admin() {
  return createAdmin({ baseUrl: "https://analytics.test", secretKey: "arky_api_analytics" });
}

function statusReport(key, entityKeys) {
  return { key, scope: "current_snapshot", data: { items: entityKeys.map((status, index) => ({ key: status, label: status, value: index + 1 })) } };
}

test("conversation and customer group status reports use their future-3 keys and statuses", async (context) => {
  const request = { time, reports: [{ key: "conversations_by_status" }, { key: "customer_groups_by_status" }] };
  const answer = {
    time,
    reports: [
      statusReport("conversations_by_status", ["flow", "team", "resolved"]),
      statusReport("customer_groups_by_status", ["draft", "active", "closed", "archived"]),
    ],
  };
  const calls = recordFetch(context, () => answer);
  assert.deepEqual(await admin().analytics.get(request, { store_id: storeId }), answer);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [["POST", `/v1/stores/${storeId}/analytics`, request]]);
});

test("Entry status reports accept Scheduled while preserving scheduled Broadcasts", async (context) => {
  const request = { time, reports: [{ key: "entries_by_status" }, { key: "broadcasts_by_status" }] };
  const answer = {
    time,
    reports: [
      statusReport("entries_by_status", ["active", "scheduled", "draft", "archived", "deleting"]),
      statusReport("broadcasts_by_status", ["draft", "scheduled", "sending", "sent"]),
    ],
  };
  const calls = recordFetch(context, () => answer);
  assert.deepEqual(await admin().analytics.get(request, { store_id: storeId }), answer);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [["POST", `/v1/stores/${storeId}/analytics`, request]]);
});

test("Entry feed retains Scheduled history after the same Entry returns to Draft", async (context) => {
  const request = { time, reports: [{ key: "recent_customer_action" }] };
  const entryId = "9a73ef26-1d45-4bc0-8a31-10677c28fc12";
  const collectionId = "d7ac9253-4df8-4a37-b38c-29d13f021c6b";
  const items = [
    { id: "bf61c8d2-92cb-4081-86ef-bd0a469173bc", action: "updated", status: "draft", created_at: time.from + 2 },
    { id: "a987c52b-4fd1-4a52-97df-c953d2e51468", action: "created", status: "scheduled", created_at: time.from + 1 },
  ].map(({ id, action, status, created_at }) => ({
    id, entity: "entry", entity_id: entryId, action, event_type: `entry_${action}`,
    status: { type: status }, customer_id: "", category: "content", title: "Program announcement",
    description: status, href: null, created_at,
    data: { store_id: storeId, entity_id: entryId, collection_id: collectionId, key: "program-announcement", status },
  }));
  const answer = {
    time,
    reports: [{ key: "recent_customer_action", scope: "period", data: {
      items,
      summary: {
        total: 2, orders: 0, submissions: 0, customers: 0, customer_groups: 0,
        abandoned_carts: 0, carts: 0, products: 0, services: 0, providers: 0,
        content: 2, customer_actions: 0, window_start: time.from,
      },
      next_cursor: null, meta: { row_count: 2, execution_ms: 0 },
    } }],
  };
  const calls = recordFetch(context, () => answer);
  assert.deepEqual(await admin().analytics.get(request, { store_id: storeId }), answer);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [["POST", `/v1/stores/${storeId}/analytics`, request]]);
  context.mock.restoreAll();

  for (const [entity, status] of [["entry", "publishing"], ["product", "scheduled"]]) {
    const invalid = structuredClone(answer);
    const data = invalid.reports[0].data;
    const item = data.items[1];
    item.entity = entity;
    item.event_type = `${entity}_created`;
    item.status = { type: status };
    item.data.status = status;
    if (entity === "product") {
      item.category = "products";
      delete item.data.collection_id;
      data.summary.products = 1;
      data.summary.content = 1;
    }
    recordFetch(context, () => invalid);
    await assert.rejects(admin().analytics.get(request, { store_id: storeId }), new RegExp(`unknown ${entity} status`));
    context.mock.restoreAll();
  }
});

test("a retired support report key is refused before any request", async (context) => {
  const calls = recordFetch(context, () => { throw new Error("no request expected"); });
  await assert.rejects(admin().analytics.get({ time, reports: [{ key: "support_conversations_by_status" }] }, { store_id: storeId }), /Invalid analytics contract: unknown or repeated report/);
  assert.equal(calls.length, 0);
});

test("a status bucket the future-3 Server can't send is refused instead of being shown", async (context) => {
  for (const [key, status, entity] of [
    ["conversations_by_status", "ai", "conversation"],
    ["conversations_by_status", "escalated", "conversation"],
    ["customer_groups_by_status", "deleting", "customer_group"],
    ["entries_by_status", "publishing", "entry"],
    ["products_by_status", "scheduled", "product"],
    ["collections_by_status", "scheduled", "collection"],
  ]) {
    recordFetch(context, () => ({ time, reports: [statusReport(key, [status])] }));
    await assert.rejects(admin().analytics.get({ time, reports: [{ key }] }, { store_id: storeId }), new RegExp(`unknown ${entity} status`));
    context.mock.restoreAll();
  }
});

test("the business overview reports placed order value by currency and refuses the old revenue shape", async (context) => {
  const request = { time, reports: [{ key: "business_overview" }] };
  const rate = (numerator, denominator) => ({ numerator, denominator, value: denominator === 0 ? null : Math.round(numerator / denominator * 10000) / 100 });
  const overview = {
    visitors: 10, new_visitors: 4, new_email_known_customers: 3, new_verified_customers: 2, buyers: 2, orders: 3,
    placed_order_value_by_currency: [
      { currency: "eur", orders: 2, placed_order_value: 5001, average_order_value: 2500.5 },
      { currency: "bam", orders: 0, placed_order_value: 0, average_order_value: null },
    ],
    carts: 4, abandoned_carts: 1,
    visitor_to_known_rate: rate(3, 10), visitor_to_buyer_rate: rate(2, 10), cart_abandonment_rate: rate(1, 4),
  };
  const answer = { time, reports: [{ key: "business_overview", scope: "period", data: overview }] };
  const calls = recordFetch(context, () => answer);
  assert.deepEqual(await admin().analytics.get(request, { store_id: storeId }), answer);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [["POST", `/v1/stores/${storeId}/analytics`, request]]);
  context.mock.restoreAll();

  const { placed_order_value_by_currency: rows, ...rest } = overview;
  const revenue = { ...rest, revenue_by_currency: rows.map(({ placed_order_value, ...row }) => ({ ...row, revenue: placed_order_value })) };
  recordFetch(context, () => ({ time, reports: [{ key: "business_overview", scope: "period", data: revenue }] }));
  await assert.rejects(admin().analytics.get(request, { store_id: storeId }), /Invalid analytics contract/);
});

test("customers_created is no longer a report: the request is refused before any call", async (context) => {
  const calls = recordFetch(context, () => ({ time, reports: [] }));
  await assert.rejects(admin().analytics.get({ time, reports: [{ key: "customers_created" }] }, { store_id: storeId }), /Invalid analytics contract: unknown or repeated report/);
  assert.equal(calls.length, 0);
});
