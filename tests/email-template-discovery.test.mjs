import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const store = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";
const template = "3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f";
const layout = "7c9e1b3d-5f2a-4c8e-a0b2-4d6f8a0c2e4b";
const address = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const replyAddress = "8e0a2c4e-6b7d-4f9a-b1c3-5d7f9b1d3f5a";
const testEmail = "1a5c8e27-4b39-4d60-a2f7-9e3d0c6b5a18";
const role = "5b7e2c94-1d38-4f60-a9e5-3c8d0f2b6a17";
const content = { en: { subject: "Order {{order.number}}", preheader: null, html: "<p>Thanks</p>", text: "Thanks" } };

function setup(context, respond = () => ({})) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init) => {
    const call = { url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    return new Response(JSON.stringify(respond(call)), { headers: { "content-type": "application/json" } });
  });
  return { client: createAdmin({ apiUrl: "https://templates.test", secretKey: "arky_api_templates" }), calls };
}

function selection(templateId) {
  return { email_template_id: templateId, sending_address_id: address, from_name: "Shop", reply_to: { type: "address", email_address_id: replyAddress } };
}

test("template discovery filters by purpose and the starters carry the fields they may print", async (context) => {
  const starter = { key: "new_order_alert", name: "New Order Alert", type: { type: "new_order_alert" }, content: content.en, allowed_fields: ["order.number", "order.line_items.snapshot.variant_blocks.value.*"] };
  const { client, calls } = setup(context, (call) => call.url.pathname.endsWith("/defaults")
    ? [starter]
    : { items: [], cursor: calls.length === 1 ? "next:+/=" : null });
  const first = await client.notification.template.find({ store_id: store, type: "new_order_alert", limit: 1 });
  await client.notification.template.find({ store_id: store, type: "new_order_alert", limit: 1, cursor: first.cursor });
  const defaults = await client.notification.template.findDefaults({ store_id: store });
  assert.deepEqual(defaults, { items: [starter], cursor: null });
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { type: "new_order_alert", limit: "1" });
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.equal(calls[2].url.pathname, `/v1/stores/${store}/email-templates/defaults`);
});

test("template writes keep the app's id, its name, default language, layout and html and text content", async (context) => {
  const { client, calls } = setup(context, (call) => call.method === "DELETE" ? true : { id: template });
  const api = client.notification.template;
  const create = { id: template, key: "order-receipt", name: "Order receipt", default_language: "en", layout_id: layout, type: { type: "order_received" }, content };
  await api.create({ store_id: store, ...create });
  await api.update({ store_id: store, id: template, expected_updated_at: 2, name: "Receipt", default_language: "bs", layout_id: layout, content });
  assert.equal(await api.delete({ store_id: store, id: template, expected_updated_at: 3 }), true);
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname + call.url.search, call.body]), [
    ["POST", `/v1/stores/${store}/email-templates`, create],
    ["PUT", `/v1/stores/${store}/email-templates/${template}`, { expected_updated_at: 2, name: "Receipt", default_language: "bs", layout_id: layout, content }],
    ["DELETE", `/v1/stores/${store}/email-templates/${template}?expected_updated_at=3`, undefined],
  ]);
  await assert.rejects(async () => api.create({ store_id: store, ...create, id: "order-receipt" }), TypeError);
  assert.equal(calls.length, 3);
});

test("a template preview renders one language and a test is sent from the named sender, display name and reply-to", async (context) => {
  const preview = { language: "en", subject: "Order 42", html: "<p>Thanks</p>", text: "Thanks" };
  const sent = { id: testEmail, type: { type: "template_test", sending_address_id: address }, to: "owner@example.test", email_provider_id: null, delivery_report: null, complained_at: null, preview: null, send_before: null, status: { type: "waiting" }, created_at: 1, updated_at: 1 };
  const { client, calls } = setup(context, (call) => call.url.pathname.endsWith("/preview") ? preview : sent);
  const api = client.notification.template;
  assert.deepEqual(await api.preview({ store_id: store, id: template, language: "en", content: content.en }), preview);
  const reply_to = { type: "external", email: "help@example.test" };
  assert.deepEqual(await api.test({ store_id: store, id: template, outgoing_email_id: testEmail, language: "en", sending_address_id: address, from_name: "Shop", reply_to }), sent);
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname, call.body]), [
    ["POST", `/v1/stores/${store}/email-templates/${template}/preview`, { language: "en", content: content.en }],
    ["POST", `/v1/stores/${store}/email-templates/${template}/test`, { id: testEmail, language: "en", sending_address_id: address, from_name: "Shop", reply_to }],
  ]);
  await assert.rejects(async () => api.test({ store_id: store, id: template, outgoing_email_id: "test-1", language: "en", sending_address_id: address, from_name: "Shop", reply_to }), {
    name: "TypeError",
    message: "The test email id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 2);
});

test("store emails name every selection, the alert recipients and the creation templates, and save them with the version", async (context) => {
  const settings = {
    customer_sign_in: selection(template),
    store_admin_sign_in: selection(template),
    customer_email_verification: null,
    email_changed: null,
    order_received: selection(template),
    first_order_placed: null,
    order_dispatched: null,
    order_delivered: null,
    order_ready_for_pickup: null,
    order_cancelled: null,
    order_refunded: null,
    booking_confirmed: null,
    booking_reminder: null,
    booking_cancelled: null,
    offer_sent: null,
    offer_revised: null,
    offer_reminder: null,
    company_invite: null,
    company_access_notice: null,
    store_admin_invite: selection(template),
    return_requested: null,
    return_approved: null,
    return_declined: null,
    renewal_upcoming: null,
    renewal_payment_failed: null,
    membership_cancelled: null,
    new_order_alert: selection(template),
    new_return_alert: null,
    new_conversation_message_alert: selection(template),
    offer_reminder_after_days: 7,
    new_order_alert_recipients: [{ type: "store_role", store_role_id: role, language: "en" }, { type: "email", email: "owner@example.test", language: "bs" }],
    new_return_alert_recipients: [],
    new_conversation_message_alert_recipients: [{ type: "store_role", store_role_id: role, language: "bs" }],
    creation_templates: { form_received: template, form_stage_changed: template, new_form_submission_alert: template, support_message: template, broadcast: template },
  };
  const saved = { id: "2d4f6a8c-0e1f-4a3c-9e5b-7d9f1b3d5f7a", store_id: store, ...settings, created_at: 1, updated_at: 2 };
  const { client, calls } = setup(context, () => saved);
  assert.deepEqual(await client.store.emails.get({ store_id: store }), saved);
  assert.deepEqual(await client.store.emails.update({ store_id: store, expected_updated_at: 2, ...settings }), saved);
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname, call.body]), [
    ["GET", `/v1/stores/${store}/emails`, undefined],
    ["PUT", `/v1/stores/${store}/emails`, { expected_updated_at: 2, ...settings }],
  ]);
  for (const removed of ["staff_new_order", "staff_new_return", "staff_new_order_recipients", "staff_new_return_recipients", "sending_address_id", "sign_in_code"]) {
    assert.equal(removed in calls[1].body, false, removed);
  }
  assert.deepEqual(calls[1].body.new_conversation_message_alert, selection(template));
  assert.deepEqual(calls[1].body.new_conversation_message_alert_recipients, [{ type: "store_role", store_role_id: role, language: "bs" }]);
});
