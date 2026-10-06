import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.automations.test";
const storeId = "2c8f4a61-9d37-4b05-a1e6-7f3b9c0d5e28";
const automationId = "7e1d3b95-4c28-4f6a-b0d7-9a5c2e8f1b34";
const subjectId = "4b9e2d71-8a36-4c05-9f1e-6d3a7b0c5e92";
const requestId = "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60";

function capture(context, respond) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ method: init.method ?? "GET", path: parsed.pathname, query: Object.fromEntries(parsed.searchParams), body: init.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(respond(parsed, init)), { status: 200, headers: { "content-type": "application/json" } });
  });
  return calls;
}

test("automation steps nest their tagged step type and send exact create and update bodies", async (context) => {
  const steps = [
    { id: "wait", type: { type: "wait", minutes: 4320 } },
    {
      id: "branch",
      type: {
        type: "branch",
        condition: { type: "all", conditions: [{ type: "has_ordered_since_start" }, { type: "order_total_at_least", amount: 5000 }] },
        then_steps: [{ id: "enroll", type: { type: "enroll_in_campaign", campaign_id: "campaign", customer_group_id: "group" } }],
        else_steps: [{ id: "email", type: { type: "send_email", to: { type: "store_role", store_role_id: "role" }, sender: { type: "mailbox", mailbox_id: "mailbox" }, template_id: "template" } }],
      },
    },
  ];
  const automation = { id: automationId, store_id: storeId, key: "offer-reminder", trigger: { type: "cart_sent" }, steps, exits: [{ type: "cart_converted" }], status: { type: "draft" }, created_at: 1, updated_at: 1 };
  const calls = capture(context, () => automation);
  const admin = createAdmin({ baseUrl, apiToken: "arky_api_automation_contract" });
  assert.deepEqual(await admin.automation.create({ store_id: storeId, id: automationId, key: automation.key, trigger: automation.trigger, steps, exits: automation.exits, active: false }), automation);
  await admin.automation.update({ store_id: storeId, id: automationId, expected_updated_at: 1, key: automation.key, trigger: { type: "subscription_renewal_upcoming", days_before: 3 }, steps, exits: [] });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["POST", `/v1/stores/${storeId}/automations`],
    ["PUT", `/v1/stores/${storeId}/automations/${automationId}`],
  ]);
  assert.deepEqual(calls[0].body, { id: automationId, key: "offer-reminder", trigger: { type: "cart_sent" }, steps, exits: [{ type: "cart_converted" }], active: false });
  assert.deepEqual(calls[1].body, { expected_updated_at: 1, key: "offer-reminder", trigger: { type: "subscription_renewal_upcoming", days_before: 3 }, steps, exits: [] });
});

test("automation and run discovery keep their native filters and continuation", async (context) => {
  const calls = capture(context, () => ({ items: [], cursor: null }));
  const admin = createAdmin({ baseUrl, apiToken: "arky_api_automation_contract" });
  await admin.automation.find({ store_id: storeId, key: "default-order-received", status: "paused", trigger_type: "order_placed", limit: 5, cursor: "page:+/=" });
  await admin.automation.run.find({ store_id: storeId, automation_id: automationId, subject_id: subjectId, status: "exited", limit: 10 });
  assert.deepEqual(calls, [
    { method: "GET", path: `/v1/stores/${storeId}/automations`, query: { key: "default-order-received", status: "paused", trigger_type: "order_placed", limit: "5", cursor: "page:+/=" }, body: null },
    { method: "GET", path: `/v1/stores/${storeId}/automation-runs`, query: { automation_id: automationId, subject_id: subjectId, status: "exited", limit: "10" }, body: null },
  ]);
});

test("receipt resend requires the caller's request id and returns the new delivery", async (context) => {
  const delivery = { id: "delivery", source: { type: "receipt_resend", automation_id: automationId, order_id: subjectId, request_id: requestId }, recipient_key: "buyer@example.test" };
  const calls = capture(context, () => delivery);
  const admin = createAdmin({ baseUrl, apiToken: "arky_api_automation_contract" });
  await assert.rejects(async () => admin.automation.resendReceipt({ store_id: storeId, order_id: subjectId, request_id: "resend" }), TypeError);
  assert.equal(calls.length, 0);
  assert.deepEqual(await admin.automation.resendReceipt({ store_id: storeId, order_id: subjectId, request_id: requestId }), delivery);
  assert.deepEqual(calls, [
    { method: "POST", path: `/v1/stores/${storeId}/automations/receipt-resends`, query: {}, body: { order_id: subjectId, request_id: requestId } },
  ]);
});

test("automation status changes, deletion and run reads use their exact routes", async (context) => {
  const calls = capture(context, (_url, init) => (init.method === "DELETE" ? true : { id: automationId }));
  const admin = createAdmin({ baseUrl, apiToken: "arky_api_automation_contract" });
  await admin.automation.activate({ store_id: storeId, id: automationId, expected_updated_at: 2 });
  await admin.automation.pause({ store_id: storeId, id: automationId, expected_updated_at: 3 });
  assert.equal(await admin.automation.delete({ store_id: storeId, id: automationId, expected_updated_at: 4 }), true);
  await admin.automation.get({ store_id: storeId, id: automationId });
  await admin.automation.run.get({ store_id: storeId, id: "run/one" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${storeId}/automations/${automationId}/activate`, {}, { expected_updated_at: 2 }],
    ["POST", `/v1/stores/${storeId}/automations/${automationId}/pause`, {}, { expected_updated_at: 3 }],
    ["DELETE", `/v1/stores/${storeId}/automations/${automationId}`, { expected_updated_at: "4" }, null],
    ["GET", `/v1/stores/${storeId}/automations/${automationId}`, {}, null],
    ["GET", `/v1/stores/${storeId}/automation-runs/run%2Fone`, {}, null],
  ]);
  assert.equal("automation" in createStorefront(`arky_pk_${"a".repeat(42)}A`, { apiUrl: baseUrl }), false);
});

test("webhook steps, the new triggers and pausing the receipt use the existing automation routes", async (context) => {
  const webhookId = "5a1e9c37-2d84-4b60-8f13-7c2a5e0b9d46";
  const calls = capture(context, () => ({ id: automationId }));
  const api = createAdmin({ baseUrl, apiToken: "arky_api_automation" }).automation;
  const steps = [{ id: "notify", type: { type: "send_webhook", webhook_id: webhookId } }];
  for (const trigger of [{ type: "order_accepted" }, { type: "return_approved" }, { type: "return_declined" }, { type: "any_form_submitted" }]) {
    await api.create({ store_id: storeId, id: automationId, key: `notify-${trigger.type}`, trigger, steps, exits: [], active: false });
  }
  await api.pause({ store_id: storeId, id: automationId, expected_updated_at: 5 });
  assert.deepEqual(calls.slice(0, 4).map((call) => [call.method, call.path, call.body.trigger, call.body.steps]), [
    ["POST", `/v1/stores/${storeId}/automations`, { type: "order_accepted" }, steps],
    ["POST", `/v1/stores/${storeId}/automations`, { type: "return_approved" }, steps],
    ["POST", `/v1/stores/${storeId}/automations`, { type: "return_declined" }, steps],
    ["POST", `/v1/stores/${storeId}/automations`, { type: "any_form_submitted" }, steps],
  ]);
  assert.equal(calls[4].method, "POST");
  assert.ok(calls[4].path.startsWith(`/v1/stores/${storeId}/automations/${automationId}`));
});
