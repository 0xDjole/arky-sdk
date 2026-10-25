import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin, WEBHOOK_UNIT_EVENT_TYPES } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "e7b39c05-4a18-4d62-9f3e-8c1a5b2d7f90";
const hookId = "1c7e3a95-6b28-4d40-8f13-9a2e5c0d7b64";
const testId = "5d9b1f37-2a84-4c60-b3e7-8f1a6c4d0e29";

function store() {
  return createAdmin({ apiUrl: "https://hooks.test", secretKey: "arky_api_hooks" }).store;
}

test("webhook discovery carries its native filters and keeps the empty-page continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "opaque:+/=" }));
  const api = store();
  assert.equal("buildHook" in api, false);
  const params = { store_id: STORE_ID, query: "lookup", status: "disabled", sort_field: "updated_at", sort_direction: "asc", limit: 1 };
  const page = await api.webhook.find(params);
  assert.deepEqual(page, { items: [], cursor: "opaque:+/=" });
  assert.deepEqual(await api.webhook.find({ ...params, cursor: page.cursor }), page);
  assert.equal(calls.length, 2);
  for (const [index, call] of calls.entries()) {
    assert.equal(call.method, "GET");
    assert.equal(call.body, null);
    assert.equal(call.path, `/v1/stores/${STORE_ID}/webhooks`);
    assert.deepEqual(call.query, { query: "lookup", status: "disabled", sort_field: "updated_at", sort_direction: "asc", limit: "1", ...(index === 1 ? { cursor: "opaque:+/=" } : {}) });
  }
});

test("webhook writes keep tagged statuses and scoped event types, carry the app-picked id and the version", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : { id: hookId, ...(call.body ?? {}) });
  const api = store().webhook;
  const events = [
    { type: "entry.updated", collections: { type: "all" }, entries: { type: "only", keys: ["guide"] } },
    { type: "form_submission.created", forms: { form_ids: ["form-one", "form-two"] } },
    { type: "order.created" },
    { type: "customer_group_member.renewed" },
  ];
  const created = await api.create({ store_id: STORE_ID, id: hookId, url: "https://receiver.test", events, headers: {}, secret: "secret", status: { type: "active" } });
  assert.deepEqual(created.events, events);
  await api.update({ store_id: STORE_ID, id: hookId, expected_updated_at: 2, status: { type: "disabled" } });
  await api.delete({ store_id: STORE_ID, id: hookId, expected_updated_at: 3 });
  await api.test({ store_id: STORE_ID, id: testId, webhook_id: hookId });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/webhooks`, {}, { id: hookId, url: "https://receiver.test", events, headers: {}, secret: "secret", status: { type: "active" } }],
    ["PUT", `/v1/stores/${STORE_ID}/webhooks/${hookId}`, {}, { expected_updated_at: 2, status: { type: "disabled" } }],
    ["DELETE", `/v1/stores/${STORE_ID}/webhooks/${hookId}`, { expected_updated_at: "3" }, null],
    ["POST", `/v1/stores/${STORE_ID}/outgoing-webhooks/test`, {}, { id: testId, webhook_id: hookId }],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "hook", url: "https://receiver.test", events, headers: {}, secret: "s", status: { type: "active" } }), TypeError);
  await assert.rejects(async () => api.test({ store_id: STORE_ID, id: "test", webhook_id: hookId }), {
    name: "TypeError",
    message: "The test post id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 4);
});

test("the webhook event list carries the ten customer group member events and none of the retired subscription or hand-kept member events", () => {
  const memberEvents = [
    "customer_group_member.activated",
    "customer_group_member.paused",
    "customer_group_member.blocked",
    "customer_group_member.resumed",
    "customer_group_member.cancelled",
    "customer_group_member.renewed",
    "customer_group_member.payment_failed",
    "customer_group_member.switched",
    "customer_group_member.renewal_skipped",
    "customer_group_member.payment_method_changed",
  ];
  assert.equal(WEBHOOK_UNIT_EVENT_TYPES.length, 123);
  assert.equal(new Set(WEBHOOK_UNIT_EVENT_TYPES).size, WEBHOOK_UNIT_EVENT_TYPES.length);
  assert.deepEqual(WEBHOOK_UNIT_EVENT_TYPES.filter((event) => event.startsWith("customer_group_member.")), memberEvents);
  for (const kept of ["customer_group.created", "customer_group.updated"]) assert.ok(WEBHOOK_UNIT_EVENT_TYPES.includes(kept), kept);
  for (const retired of ["customer_group.member_added", "customer_group.member_removed"]) assert.equal(WEBHOOK_UNIT_EVENT_TYPES.includes(retired), false, retired);
  for (const added of ["refund.created", "refund.failed", "fulfillment.dispatched", "order_booking_item.attended", "product_variant.created", "catalog_item_price.deleted", "inventory_level.updated", "promotion.created", "company_location.created", "customer_group.deleted"]) {
    assert.ok(WEBHOOK_UNIT_EVENT_TYPES.includes(added), added);
  }
  for (const retired of ["order.refunded", "fulfillment.sent", "order_booking_item.completed", "customer_group_member.next_purchase_skipped", "store.created", "account.updated", "price.created", "price.updated", "price.deleted"]) {
    assert.equal(WEBHOOK_UNIT_EVENT_TYPES.includes(retired), false, retired);
  }
  assert.deepEqual(WEBHOOK_UNIT_EVENT_TYPES.filter((event) => event.startsWith("subscription.")), []);
});

test("the webhook event list carries the conversation, catalog, listing, access and offering events in the Server's order", () => {
  const added = [
    "conversation.created", "conversation.updated", "conversation_message.created",
    "catalog.created", "catalog.updated", "catalog.deleted",
    "catalog_item.created", "catalog_item.updated", "catalog_item.deleted",
    "catalog_access.created", "catalog_access.deleted",
    "booking_offering.created", "booking_offering.updated", "booking_offering.deleted",
    "customer_group_offering.created", "customer_group_offering.updated", "customer_group_offering.deleted",
  ];
  assert.equal(added.length, 17);
  for (const event of added) assert.ok(WEBHOOK_UNIT_EVENT_TYPES.includes(event), event);
  assert.deepEqual(WEBHOOK_UNIT_EVENT_TYPES.slice(0, 3), ["conversation.created", "conversation.updated", "conversation_message.created"]);
  const after = (anchor, events) => {
    const start = WEBHOOK_UNIT_EVENT_TYPES.indexOf(anchor) + 1;
    assert.deepEqual(WEBHOOK_UNIT_EVENT_TYPES.slice(start, start + events.length), events, anchor);
  };
  after("product_variant.deleted", added.slice(3, 11));
  after("booking_service.deleted", added.slice(11, 14));
  after("customer_group.deleted", added.slice(14));
  for (const filtered of ["form_submission.created", "form_submission.stage_changed", "form_submission.deleted", "collection.created", "entry.updated"]) {
    assert.equal(WEBHOOK_UNIT_EVENT_TYPES.includes(filtered), false, filtered);
  }
});
