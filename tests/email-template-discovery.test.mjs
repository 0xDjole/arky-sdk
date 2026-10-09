import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";
const TEMPLATE_ID = "3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f";
const SENDER_ID = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const NOTIFICATION_ID = "0f6a2c41-8d35-4b97-a1e2-5c7d9b3f6e08";

function admin() {
  return createAdmin({ baseUrl: "https://templates.test", apiToken: "arky_api_templates" });
}

test("EmailTemplate discovery keeps the type filter and nullable continuation", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? "template:+/=" : null }), { headers: { "content-type": "application/json" } });
  });
  const api = admin().notification.template;
  const filters = { type: "form_received", limit: 1 };
  const first = await api.find({ store_id: STORE_ID, ...filters });
  assert.equal(first.cursor, "template:+/=");
  assert.equal((await api.find({ store_id: STORE_ID, ...filters, cursor: first.cursor })).cursor, null);
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/email-templates`);
    assert.equal(call.url.searchParams.has("store_id"), false);
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    assert.equal(call.url.searchParams.get("type"), "form_received");
    assert.equal(call.url.searchParams.get("limit"), "1");
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
});

test("EmailTemplate writes carry the app-picked id, its fixed type, sender and per-language content with the version", async (context) => {
  const calls = [];
  const content = { en: { subject: "Order received", preheader: null, body: "<p>Thanks</p>" }, bs: { subject: "Narudžba primljena", preheader: "Hvala", body: "<p>Hvala</p>" } };
  const root = { id: TEMPLATE_ID, store_id: STORE_ID, type: { type: "order_received" }, sender_id: SENDER_ID, content, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const body = init.method === "DELETE" ? true : parsed.pathname.endsWith("/defaults") ? [{ type: { type: "order_received" }, content: content.en }] : root;
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  });
  const api = admin().notification.template;
  const create = { id: TEMPLATE_ID, type: { type: "cart_reminder", after_days: 3 }, sender_id: SENDER_ID, content };
  assert.deepEqual(await api.create({ store_id: STORE_ID, ...create }), root);
  assert.deepEqual(await api.get({ store_id: STORE_ID, id: TEMPLATE_ID }), root);
  assert.deepEqual(await api.update({ store_id: STORE_ID, id: TEMPLATE_ID, expected_updated_at: 1, content }), root);
  assert.equal(await api.delete({ store_id: STORE_ID, id: TEMPLATE_ID, expected_updated_at: 2 }), true);
  assert.equal((await api.defaults({ store_id: STORE_ID }))[0].type.type, "order_received");
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, url.search, body]), [
    ["POST", `/v1/stores/${STORE_ID}/email-templates`, "", create],
    ["GET", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}`, "", undefined],
    ["PUT", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}`, "", { expected_updated_at: 1, content }],
    ["DELETE", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}`, "?expected_updated_at=2", undefined],
    ["GET", `/v1/stores/${STORE_ID}/email-templates/defaults`, "", undefined],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, ...create, id: "welcome" }), TypeError);
  assert.equal(calls.length, 5);
});

test("a template preview names the language and a test send posts the app's notification id and language", async (context) => {
  const calls = [];
  const notification = { id: NOTIFICATION_ID, type: { type: "template_test", sender_id: SENDER_ID, to: "staff@example.test" }, status: { type: "waiting" }, created_at: 1, updated_at: 1 };
  const preview = { language: "bs", subject: "Narudžba", html: "<p>Narudžba</p>", text: "Narudžba" };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(parsed.pathname.endsWith("/test") ? notification : preview), { headers: { "content-type": "application/json" } });
  });
  const api = admin().notification.template;
  const draft = { subject: "Narudžba", preheader: null, body: "<p>{{order.number}}</p>" };
  assert.deepEqual(await api.preview({ store_id: STORE_ID, id: TEMPLATE_ID, language: "bs", content: draft }), preview);
  await api.preview({ store_id: STORE_ID, id: TEMPLATE_ID, language: "en" });
  assert.deepEqual(await api.test({ store_id: STORE_ID, id: TEMPLATE_ID, notification_id: NOTIFICATION_ID, language: "bs" }), notification);
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}/preview`, { language: "bs", content: draft }],
    ["POST", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}/preview`, { language: "en" }],
    ["POST", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}/test`, { id: NOTIFICATION_ID, language: "bs" }],
  ]);
  await assert.rejects(async () => api.test({ store_id: STORE_ID, id: TEMPLATE_ID, notification_id: "retry", language: "bs" }), TypeError);
  assert.equal(calls.length, 3);
});

test("email domains and senders are created under app-picked ids, verified and removed with the version", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(init.method === "DELETE" ? true : { id: "record" }), { headers: { "content-type": "application/json" } });
  });
  const client = admin();
  const domainId = "5c7e9a1b-3d4f-4c8e-a0b2-4f6a8c0e2a3b";
  await client.notification.emailDomain.create({ store_id: STORE_ID, id: domainId, domain: "mail.example.test" });
  await client.notification.emailDomain.verify({ store_id: STORE_ID, id: domainId, expected_updated_at: 1 });
  await client.notification.emailSender.create({ store_id: STORE_ID, id: SENDER_ID, email_domain_id: domainId, local_part: "orders", from_name: "Shop" });
  await client.notification.emailSender.update({ store_id: STORE_ID, id: SENDER_ID, expected_updated_at: 2, from_name: "Shop Team" });
  assert.equal(await client.notification.emailSender.delete({ store_id: STORE_ID, id: SENDER_ID, expected_updated_at: 3 }), true);
  assert.equal(await client.notification.emailDomain.delete({ store_id: STORE_ID, id: domainId, expected_updated_at: 4 }), true);
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, url.search, body]), [
    ["POST", `/v1/stores/${STORE_ID}/email-domains`, "", { id: domainId, domain: "mail.example.test" }],
    ["POST", `/v1/stores/${STORE_ID}/email-domains/${domainId}/verify`, "", { expected_updated_at: 1 }],
    ["POST", `/v1/stores/${STORE_ID}/email-senders`, "", { id: SENDER_ID, email_domain_id: domainId, local_part: "orders", from_name: "Shop" }],
    ["PUT", `/v1/stores/${STORE_ID}/email-senders/${SENDER_ID}`, "", { expected_updated_at: 2, from_name: "Shop Team" }],
    ["DELETE", `/v1/stores/${STORE_ID}/email-senders/${SENDER_ID}`, "?expected_updated_at=3", undefined],
    ["DELETE", `/v1/stores/${STORE_ID}/email-domains/${domainId}`, "?expected_updated_at=4", undefined],
  ]);
  await assert.rejects(async () => client.notification.emailDomain.create({ store_id: STORE_ID, id: "mail", domain: "mail.example.test" }), TypeError);
  await assert.rejects(async () => client.notification.emailSender.create({ store_id: STORE_ID, id: undefined, email_domain_id: domainId, local_part: "x", from_name: "x" }), TypeError);
  assert.equal(calls.length, 6);
  assert.equal("mailbox" in client.notification, false);
});
