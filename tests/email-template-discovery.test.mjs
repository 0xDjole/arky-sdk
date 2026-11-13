import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const store = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";
const template = "3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f";
const smsTemplate = "9b1d3f5a-7c2e-4a8b-b0d2-6f8a0c2e4b6d";
const layout = "7c9e1b3d-5f2a-4c8e-a0b2-4d6f8a0c2e4b";
const address = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const replyAddress = "8e0a2c4e-6b7d-4f9a-b1c3-5d7f9b1d3f5a";
const testEmail = "1a5c8e27-4b39-4d60-a2f7-9e3d0c6b5a18";
const role = "5b7e2c94-1d38-4f60-a9e5-3c8d0f2b6a17";
const notificationId = "2d4f6a8c-0e1f-4a3c-9e5b-7d9f1b3d5f7a";
const content = { en: { subject: "Order {{order.number}}", preheader: null, html: "<p>Thanks</p>", text: "Thanks" } };

function setup(context, respond = () => ({})) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init) => {
    const call = { url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    return new Response(JSON.stringify(respond(call)), { headers: { "content-type": "application/json" } });
  });
  return { client: createAdmin({ apiUrl: "https://templates.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }), calls };
}

function selection(templateId) {
  return { email_template_id: templateId, email_address_id: address, from_name: "Shop", reply_to_address_id: replyAddress };
}

test("template discovery filters by kind and purpose and the starters carry the fields they may print", async (context) => {
  const starter = { key: "order_alert", name: "New Order Alert", type: { type: "email", purpose: { type: "order_alert" }, content: content.en }, allowed_fields: ["order.number", "order.line_items.snapshot.variant_blocks.value.*"] };
  const { client, calls } = setup(context, (call) => call.url.pathname.endsWith("/defaults")
    ? [starter]
    : { items: [], cursor: calls.length === 1 ? "next:+/=" : null });
  const first = await client.notification.template.find({ store_id: store, kind: "email", purpose: "order_alert", limit: 1 });
  await client.notification.template.find({ store_id: store, kind: "email", purpose: "order_alert", limit: 1, cursor: first.cursor });
  await client.notification.template.find({ store_id: store, kind: "sms" });
  const defaults = await client.notification.template.findDefaults({ store_id: store });
  assert.deepEqual(defaults, { items: [starter], cursor: null });
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { kind: "email", purpose: "order_alert", limit: "1" });
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { kind: "sms" });
  assert.equal(calls[3].url.pathname, `/v1/stores/${store}/email-templates/defaults`);
});

test("template writes keep the app's id, its name, and an email's default language, layout and html and text content or an SMS's text", async (context) => {
  const { client, calls } = setup(context, (call) => call.method === "DELETE" ? true : { id: template });
  const api = client.notification.template;
  const create = { id: template, key: "order-receipt", name: "Order receipt", type: { type: "email", purpose: { type: "order_received" }, default_language: "en", content, layout_id: layout } };
  const sms = { id: smsTemplate, key: "reminder-sms", name: "Reminder", type: { type: "sms", purpose: { type: "booking_reminder" }, content: { en: "See you at {{booking.starts_at}}" } } };
  await api.create({ store_id: store, ...create });
  await api.create({ store_id: store, ...sms });
  await api.update({ store_id: store, id: template, expected_updated_at: 2, name: "Receipt", content: { type: "email", default_language: "bs", layout_id: layout, content } });
  await api.update({ store_id: store, id: smsTemplate, expected_updated_at: 4, content: { type: "sms", content: { en: "Tomorrow at {{booking.starts_at}}" } } });
  assert.equal(await api.delete({ store_id: store, id: template, expected_updated_at: 3 }), true);
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname + call.url.search, call.body]), [
    ["POST", `/v1/stores/${store}/email-templates`, create],
    ["POST", `/v1/stores/${store}/email-templates`, sms],
    ["PUT", `/v1/stores/${store}/email-templates/${template}`, { expected_updated_at: 2, name: "Receipt", content: { type: "email", default_language: "bs", layout_id: layout, content } }],
    ["PUT", `/v1/stores/${store}/email-templates/${smsTemplate}`, { expected_updated_at: 4, content: { type: "sms", content: { en: "Tomorrow at {{booking.starts_at}}" } } }],
    ["DELETE", `/v1/stores/${store}/email-templates/${template}?expected_updated_at=3`, undefined],
  ]);
  await assert.rejects(async () => api.create({ store_id: store, ...create, id: "order-receipt" }), TypeError);
  assert.equal(calls.length, 5);
});

test("a template preview renders one language and a test is sent from the named address, display name and reply-to address", async (context) => {
  const preview = { type: "email", language: "en", subject: "Order 42", html: "<p>Thanks</p>", text: "Thanks" };
  const sent = { id: testEmail, type: { type: "template_test_email", email_address_id: address }, to: "owner@example.test", delivery_report: null, complained_at: null, preview: null, send_before: null, status: { type: "waiting" }, created_at: 1, updated_at: 1 };
  const smsPreview = { type: "sms", language: "en", text: "Tomorrow at 10" };
  const { client, calls } = setup(context, (call) => call.url.pathname.endsWith("/preview") ? (call.url.pathname.includes(smsTemplate) ? smsPreview : preview) : sent);
  const api = client.notification.template;
  assert.deepEqual(await api.preview({ store_id: store, id: template, language: "en", content: { type: "email", content: content.en } }), preview);
  assert.deepEqual(await api.preview({ store_id: store, id: smsTemplate, language: "en", content: { type: "sms", text: "Tomorrow at 10" } }), smsPreview);
  assert.deepEqual(await api.test({ store_id: store, id: template, outgoing_message_id: testEmail, language: "en", email_address_id: address, from_name: "Shop", reply_to_address_id: replyAddress }), sent);
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname, call.body]), [
    ["POST", `/v1/stores/${store}/email-templates/${template}/preview`, { language: "en", content: { type: "email", content: content.en } }],
    ["POST", `/v1/stores/${store}/email-templates/${smsTemplate}/preview`, { language: "en", content: { type: "sms", text: "Tomorrow at 10" } }],
    ["POST", `/v1/stores/${store}/email-templates/${template}/test`, { id: testEmail, language: "en", email_address_id: address, from_name: "Shop", reply_to_address_id: replyAddress }],
  ]);
  await assert.rejects(async () => api.test({ store_id: store, id: template, outgoing_message_id: "test-1", language: "en", email_address_id: address, from_name: "Shop", reply_to_address_id: replyAddress }), {
    name: "TypeError",
    message: "The test email id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 3);
});

test("an automatic message names its email selection and alert recipients, and is saved with the version", async (context) => {
  const type = { type: "order_alert", email: selection(template), recipients: [{ type: "store_role", store_role_id: role, language: "en" }, { type: "email", email: "owner@example.test", language: "bs" }] };
  const saved = { id: notificationId, store_id: store, type, status: { type: "active", since: 1 }, created_at: 1, updated_at: 2 };
  const { client, calls } = setup(context, (call) => call.method === "DELETE" ? true : call.method === "GET" && call.url.pathname.endsWith("/notifications") ? { items: [saved], cursor: null } : saved);
  const api = client.notification.notification;
  assert.deepEqual(await api.find({ store_id: store, type: "order_alert" }), { items: [saved], cursor: null });
  assert.deepEqual(await api.create({ store_id: store, id: notificationId, type, status: "active" }), saved);
  assert.deepEqual(await api.get({ store_id: store, id: notificationId }), saved);
  assert.deepEqual(await api.update({ store_id: store, id: notificationId, expected_updated_at: 2, type, status: "paused" }), saved);
  assert.equal(await api.delete({ store_id: store, id: notificationId, expected_updated_at: 3 }), true);
  const base = `/v1/stores/${store}/notifications`;
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname + call.url.search, call.body]), [
    ["GET", `${base}?type=order_alert`, undefined],
    ["POST", base, { id: notificationId, type, status: "active" }],
    ["GET", `${base}/${notificationId}`, undefined],
    ["PUT", `${base}/${notificationId}`, { expected_updated_at: 2, type, status: "paused" }],
    ["DELETE", `${base}/${notificationId}?expected_updated_at=3`, undefined],
  ]);
  await assert.rejects(async () => api.create({ store_id: store, id: "order-alert", type, status: "active" }), TypeError);
  assert.equal("emails" in client.store, false);
});
