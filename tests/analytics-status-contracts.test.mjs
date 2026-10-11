import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "2d7f9b13-5c48-4e60-a1b3-8e5c7a9d1f24";
const day = 86_400_000;
const time = { from: 20_000 * day, to: 20_001 * day };

function admin() {
  return createAdmin({ baseUrl: "https://analytics.test", apiToken: "arky_api_analytics" });
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
  ]) {
    recordFetch(context, () => ({ time, reports: [statusReport(key, [status])] }));
    await assert.rejects(admin().analytics.get({ time, reports: [{ key }] }, { store_id: storeId }), new RegExp(`unknown ${entity} status`));
    context.mock.restoreAll();
  }
});
