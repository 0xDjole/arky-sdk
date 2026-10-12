import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const store = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";
const template = "3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f";
const address = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const provider = "6d8f0a2c-4e5b-4d9f-b1e3-5a7c9e1b3d4f";
const content = { en: { subject: "Order", preheader: null, body: "<p>Thanks</p>" } };

function setup(context, respond = () => ({})) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init) => {
    const call = { url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    return new Response(JSON.stringify(respond(call)), { headers: { "content-type": "application/json" } });
  });
  return { client: createAdmin({ baseUrl: "https://templates.test", secretKey: "arky_api_templates" }), calls };
}

test("reusable template discovery filters by fixed data type and returns named defaults", async (context) => {
  const { client, calls } = setup(context, (call) => call.url.pathname.endsWith("/defaults")
    ? [{ key: "order-receipt", type: { type: "order" }, content: content.en }]
    : { items: [], cursor: calls.length === 1 ? "next:+/=" : null });
  const first = await client.notification.template.find({ store_id: store, type: "order", limit: 1 });
  await client.notification.template.find({ store_id: store, type: "order", limit: 1, cursor: first.cursor });
  const defaults = await client.notification.template.defaults({ store_id: store });
  assert.equal(defaults[0].key, "order-receipt");
  assert.equal(defaults[0].type.type, "order");
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { type: "order", limit: "1" });
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.equal(calls[2].url.pathname, `/v1/stores/${store}/email-templates/defaults`);
});

test("template create and update keep caller ID, reusable key, immutable type and localized content", async (context) => {
  const { client, calls } = setup(context);
  const api = client.notification.template;
  await api.create({ store_id: store, id: template, key: "order-receipt", type: { type: "order" }, content });
  await api.update({ store_id: store, id: template, expected_updated_at: 2, key: "receipt", content });
  await api.delete({ store_id: store, id: template, expected_updated_at: 3 });
  assert.deepEqual(calls[0].body, { id: template, key: "order-receipt", type: { type: "order" }, content });
  assert.deepEqual(calls[1].body, { expected_updated_at: 2, key: "receipt", content });
  assert.equal(calls[2].url.searchParams.get("expected_updated_at"), "3");
  await assert.rejects(async () => api.create({ store_id: store, id: "bad", key: "order", type: { type: "order" }, content }), TypeError);
  assert.equal(calls.length, 3);
});

test("store provider domains are live reads and sending addresses use provider-independent names", async (context) => {
  const { client, calls } = setup(context);
  await client.notification.emailProvider.connect({ store_id: store, id: provider, api_key: "resend-secret" });
  await client.notification.emailProvider.get({ store_id: store });
  await client.notification.emailProvider.domains({ store_id: store });
  const sending = { from_name: "Shop", reply_to: null };
  await client.notification.emailAddress.create({ store_id: store, id: address, email: "orders@example.test", sending });
  await client.notification.emailAddress.update({ store_id: store, id: address, expected_updated_at: 2, sending: { ...sending, from_name: "Team" } });
  await client.notification.emailAddress.archive({ store_id: store, id: address, expected_updated_at: 3 });
  await client.notification.emailAddress.activate({ store_id: store, id: address, expected_updated_at: 4 });
  await client.notification.emailAddress.delete({ store_id: store, id: address, expected_updated_at: 5 });
  assert.deepEqual(calls.slice(0, 3).map((call) => [call.method, call.url.pathname, call.body]), [
    ["POST", `/v1/stores/${store}/email-provider`, { id: provider, api_key: "resend-secret" }],
    ["GET", `/v1/stores/${store}/email-provider`, undefined],
    ["GET", `/v1/stores/${store}/email-provider/domains`, undefined],
  ]);
  assert.deepEqual(calls[3].body, { id: address, email: "orders@example.test", sending });
  assert.equal(calls[7].url.searchParams.get("expected_updated_at"), "5");
  assert.equal("emailDomain" in client.notification, false);
});
