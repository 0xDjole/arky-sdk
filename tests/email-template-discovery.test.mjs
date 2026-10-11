import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";
const TEMPLATE_ID = "3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f";
const ADDRESS_ID = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const OTHER_ADDRESS_ID = "6d8f0a2c-4e5b-4d9f-b1e3-5a7c9e1b3d4f";
const FLOW_ID = "7e9a1c3d-5f6b-4e0a-82f4-6b8d0f2c4e5a";
const NOTIFICATION_ID = "0f6a2c41-8d35-4b97-a1e2-5c7d9b3f6e08";

function admin() {
  return createAdmin({ baseUrl: "https://templates.test", apiToken: "arky_api_templates" });
}

test("EmailTemplate discovery keeps the template type, email type and nullable continuation", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? "template:+/=" : null }), { headers: { "content-type": "application/json" } });
  });
  const api = admin().notification.template;
  const filters = { type: "transactional", email_type: "form_received", limit: 1 };
  const first = await api.find({ store_id: STORE_ID, ...filters });
  assert.equal(first.cursor, "template:+/=");
  assert.equal((await api.find({ store_id: STORE_ID, ...filters, cursor: first.cursor })).cursor, null);
  await api.find({ store_id: STORE_ID, type: "support_reply" });
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/email-templates`);
    assert.equal(call.url.searchParams.has("store_id"), false);
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
  }
  for (const call of calls.slice(0, 2)) {
    assert.equal(call.url.searchParams.get("type"), "transactional");
    assert.equal(call.url.searchParams.get("email_type"), "form_received");
    assert.equal(call.url.searchParams.get("limit"), "1");
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { type: "support_reply" });
});

test("EmailTemplate writes carry the app-picked id, its transactional or support-reply type and per-language content with the version", async (context) => {
  const calls = [];
  const content = { en: { subject: "Order received", preheader: null, body: "<p>Thanks</p>" }, bs: { subject: "Narudžba primljena", preheader: "Hvala", body: "<p>Hvala</p>" } };
  const transactional = { type: "transactional", sending_address_id: ADDRESS_ID, email_type: { type: "order_received" } };
  const root = { id: TEMPLATE_ID, store_id: STORE_ID, type: transactional, content, created_at: 1, updated_at: 1 };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const body = init.method === "DELETE" ? true : parsed.pathname.endsWith("/defaults") ? [{ type: { type: "order_received" }, content: content.en }] : root;
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  });
  const api = admin().notification.template;
  const create = { id: TEMPLATE_ID, type: { type: "transactional", sending_address_id: ADDRESS_ID, email_type: { type: "cart_reminder", after_days: 3 } }, content };
  const reply = { id: "9b1d3f5a-7c8e-4a2b-9d4f-6e8a0c2e4b6d", type: { type: "support_reply" }, content };
  const moved = { type: "transactional", sending_address_id: OTHER_ADDRESS_ID, email_type: { type: "renewal_payment_failed" } };
  assert.deepEqual(await api.create({ store_id: STORE_ID, ...create }), root);
  await api.create({ store_id: STORE_ID, ...reply });
  assert.deepEqual(await api.get({ store_id: STORE_ID, id: TEMPLATE_ID }), root);
  assert.deepEqual(await api.update({ store_id: STORE_ID, id: TEMPLATE_ID, expected_updated_at: 1, content }), root);
  await api.update({ store_id: STORE_ID, id: TEMPLATE_ID, expected_updated_at: 2, type: moved });
  assert.equal(await api.delete({ store_id: STORE_ID, id: TEMPLATE_ID, expected_updated_at: 3 }), true);
  assert.equal((await api.defaults({ store_id: STORE_ID }))[0].type.type, "order_received");
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, url.search, body]), [
    ["POST", `/v1/stores/${STORE_ID}/email-templates`, "", create],
    ["POST", `/v1/stores/${STORE_ID}/email-templates`, "", reply],
    ["GET", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}`, "", undefined],
    ["PUT", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}`, "", { expected_updated_at: 1, content }],
    ["PUT", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}`, "", { expected_updated_at: 2, type: moved }],
    ["DELETE", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}`, "?expected_updated_at=3", undefined],
    ["GET", `/v1/stores/${STORE_ID}/email-templates/defaults`, "", undefined],
  ]);
  for (const call of calls) assert.equal(call.body?.sender_id, undefined);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, ...create, id: "welcome" }), TypeError);
  assert.equal(calls.length, 7);
});

test("a template preview names the language and a test send posts the app's notification id, language and a support reply's sending address", async (context) => {
  const calls = [];
  const notification = {
    id: NOTIFICATION_ID,
    type: { type: "email", email_type: { type: "template_test", sending_address_id: ADDRESS_ID, to: "staff@example.test" }, send_before: null, status: { type: "waiting" } },
    created_at: 1,
    updated_at: 1,
  };
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
  await api.test({ store_id: STORE_ID, id: TEMPLATE_ID, notification_id: NOTIFICATION_ID, language: "en", sending_address_id: OTHER_ADDRESS_ID });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["POST", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}/preview`, { language: "bs", content: draft }],
    ["POST", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}/preview`, { language: "en" }],
    ["POST", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}/test`, { id: NOTIFICATION_ID, language: "bs" }],
    ["POST", `/v1/stores/${STORE_ID}/email-templates/${TEMPLATE_ID}/test`, { id: NOTIFICATION_ID, language: "en", sending_address_id: OTHER_ADDRESS_ID }],
  ]);
  await assert.rejects(async () => api.test({ store_id: STORE_ID, id: TEMPLATE_ID, notification_id: "retry", language: "bs" }), TypeError);
  assert.equal(calls.length, 4);
});

test("email domains and email addresses are created under app-picked ids, verified, archived and removed with the version", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const body = init.method === "DELETE" ? true : parsed.pathname.endsWith("/email-addresses") && init.method === "GET" ? { items: [], cursor: null } : { id: "record" };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  });
  const client = admin();
  const domainId = "5c7e9a1b-3d4f-4c8e-a0b2-4f6a8c0e2a3b";
  const sending = { email_domain_id: domainId, from_name: "Shop", reply_to: "help@mail.example.test" };
  const receiving = { initial_sending_address_id: ADDRESS_ID, initial_flow_id: FLOW_ID };
  await client.notification.emailDomain.create({ store_id: STORE_ID, id: domainId, domain: "mail.example.test" });
  await client.notification.emailDomain.verify({ store_id: STORE_ID, id: domainId, expected_updated_at: 1 });
  await client.notification.emailAddress.create({ store_id: STORE_ID, id: ADDRESS_ID, email: "orders@mail.example.test", sending });
  await client.notification.emailAddress.create({ store_id: STORE_ID, id: OTHER_ADDRESS_ID, email: "help@mail.example.test", sending, receiving });
  await client.notification.emailAddress.update({ store_id: STORE_ID, id: ADDRESS_ID, expected_updated_at: 2, sending: { ...sending, from_name: "Shop Team" } });
  await client.notification.emailAddress.update({ store_id: STORE_ID, id: OTHER_ADDRESS_ID, expected_updated_at: 3, receiving: { initial_sending_address_id: null, initial_flow_id: null } });
  await client.notification.emailAddress.find({ store_id: STORE_ID, limit: 10 });
  await client.notification.emailAddress.get({ store_id: STORE_ID, id: ADDRESS_ID });
  await client.notification.emailAddress.archive({ store_id: STORE_ID, id: ADDRESS_ID, expected_updated_at: 4 });
  await client.notification.emailAddress.activate({ store_id: STORE_ID, id: ADDRESS_ID, expected_updated_at: 5 });
  assert.equal(await client.notification.emailAddress.delete({ store_id: STORE_ID, id: ADDRESS_ID, expected_updated_at: 6 }), true);
  assert.equal(await client.notification.emailDomain.delete({ store_id: STORE_ID, id: domainId, expected_updated_at: 7 }), true);
  const addresses = `/v1/stores/${STORE_ID}/email-addresses`;
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, url.search, body]), [
    ["POST", `/v1/stores/${STORE_ID}/email-domains`, "", { id: domainId, domain: "mail.example.test" }],
    ["POST", `/v1/stores/${STORE_ID}/email-domains/${domainId}/verify`, "", { expected_updated_at: 1 }],
    ["POST", addresses, "", { id: ADDRESS_ID, email: "orders@mail.example.test", sending }],
    ["POST", addresses, "", { id: OTHER_ADDRESS_ID, email: "help@mail.example.test", sending, receiving }],
    ["PUT", `${addresses}/${ADDRESS_ID}`, "", { expected_updated_at: 2, sending: { ...sending, from_name: "Shop Team" } }],
    ["PUT", `${addresses}/${OTHER_ADDRESS_ID}`, "", { expected_updated_at: 3, receiving: { initial_sending_address_id: null, initial_flow_id: null } }],
    ["GET", addresses, "?limit=10", undefined],
    ["GET", `${addresses}/${ADDRESS_ID}`, "", undefined],
    ["POST", `${addresses}/${ADDRESS_ID}/archive`, "", { expected_updated_at: 4 }],
    ["POST", `${addresses}/${ADDRESS_ID}/activate`, "", { expected_updated_at: 5 }],
    ["DELETE", `${addresses}/${ADDRESS_ID}`, "?expected_updated_at=6", undefined],
    ["DELETE", `/v1/stores/${STORE_ID}/email-domains/${domainId}`, "?expected_updated_at=7", undefined],
  ]);
  await assert.rejects(async () => client.notification.emailDomain.create({ store_id: STORE_ID, id: "mail", domain: "mail.example.test" }), TypeError);
  await assert.rejects(async () => client.notification.emailAddress.create({ store_id: STORE_ID, id: undefined, email: "x@mail.example.test", sending }), TypeError);
  assert.equal(calls.length, 12);
  for (const removed of ["mailbox", "emailSender"]) assert.equal(removed in client.notification, false, removed);
  assert.equal("channel" in client.support, false);
});
