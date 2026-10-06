import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";

test("EmailTemplate discovery preserves combined native predicates and nullable continuation", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? "template:+/=" : null }),
      { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://templates.test" }).notification.template;
  const filters = { ids: ["first", "second"], key: "welcome", query: "welcome", status: "draft",
    data_type: "form_submission", form_id: "form",
    limit: 1, sort_field: "key", sort_direction: "asc", created_at_from: 0, created_at_to: 5 };
  const first = await api.find({ store_id: STORE_ID, ...filters });
  assert.equal(first.cursor, "template:+/=");
  assert.equal((await api.find({ store_id: STORE_ID, ...filters, cursor: first.cursor })).cursor, null);
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/email-templates`);
    assert.equal(call.url.searchParams.has("store_id"), false);
    assert.equal(call.method, "GET"); assert.equal(call.body, undefined);
    assert.deepEqual(JSON.parse(call.url.searchParams.get("ids")), filters.ids);
    for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "ids")) {
      assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
});

test("EmailTemplate exact lookups, per-language content updates and boolean deletion match the server", async (context) => {
  const calls = [];
  const content = { en: { subject: "Welcome", preheader: null, body: "<p>Welcome</p>" } };
  const root = { id: "template", key: "welcome", store_id: STORE_ID, data: { type: "customer" }, content, status: { type: "draft" } };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const body = init.method === "DELETE"
      ? true
      : init.method === "GET" && parsed.pathname.endsWith("/email-templates")
        ? { items: [root], cursor: null }
        : root;
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://templates.test" }).notification.template;
  assert.deepEqual(await api.get({ store_id: STORE_ID, key: "welcome" }), root);
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/email-templates`);
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { key: "welcome", limit: "1" });
  assert.deepEqual(await api.get({ store_id: STORE_ID, id: root.id }), root);
  assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/email-templates/template`);
  assert.deepEqual(await api.update({ store_id: STORE_ID, id: root.id, status: { type: "draft" }, content }), root);
  assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/email-templates/template`);
  assert.deepEqual(calls[2].body, { status: { type: "draft" }, content });
  assert.equal(await api.delete({ store_id: STORE_ID, id: root.id }), true);
  assert.equal(calls[3].method, "DELETE");
  assert.equal(calls[3].url.pathname, `/v1/stores/${STORE_ID}/email-templates/template`);
  await assert.rejects(api.get({ store_id: STORE_ID, key: "missing" }), /was not found/);
  await assert.rejects(api.get({ store_id: STORE_ID }), /requires id or key/);
});

test("the sign-in sender changes through data and a test send posts the caller's request", async (context) => {
  const calls = [];
  const requestId = "0f6a2c41-8d35-4b97-a1e2-5c7d9b3f6e08";
  const delivery = { id: "delivery", source: { type: "template_test", template_id: "template", request_id: requestId }, recipient_key: "staff@example.test" };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const body = parsed.pathname.endsWith("/test") ? delivery : { id: "template", data: { type: "sign_in", sender: { type: "mailbox", mailbox_id: "mailbox" } } };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://templates.test" }).notification.template;
  const sender = { type: "mailbox", mailbox_id: "mailbox" };
  await api.update({ store_id: STORE_ID, id: "template", data: { type: "sign_in", sender }, status: { type: "draft" } });
  assert.deepEqual(await api.test({ store_id: STORE_ID, id: "template", request_id: requestId, language: "bs", sender }), delivery);
  await api.test({ store_id: STORE_ID, id: "template", request_id: requestId, sender: { type: "platform" } });
  assert.deepEqual(calls.map(({ url, method, body }) => [method, url.pathname, body]), [
    ["PUT", `/v1/stores/${STORE_ID}/email-templates/template`, { data: { type: "sign_in", sender }, status: { type: "draft" } }],
    ["POST", `/v1/stores/${STORE_ID}/email-templates/template/test`, { request_id: requestId, language: "bs", sender }],
    ["POST", `/v1/stores/${STORE_ID}/email-templates/template/test`, { request_id: requestId, language: null, sender: { type: "platform" } }],
  ]);
  await assert.rejects(async () => api.test({ store_id: STORE_ID, id: "template", request_id: "retry", sender }), TypeError);
  assert.equal(calls.length, 3);
});
