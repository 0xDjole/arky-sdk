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

test("EmailTemplate exact lookups, tagged updates, null preheaders and boolean deletion match the server", async (context) => {
  const calls = [];
  const root = { id: "template", key: "welcome", store_id: STORE_ID, status: { type: "draft" }, preheader: null };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(init.method === "DELETE" ? true : root),
      { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://templates.test" }).notification.template;
  assert.deepEqual(await api.get({ store_id: STORE_ID, key: "welcome" }), root);
  assert.equal(decodeURIComponent(calls[0].url.pathname), `/v1/stores/${STORE_ID}/email-templates/${STORE_ID}:welcome`);
  assert.deepEqual(await api.update({ store_id: STORE_ID, id: root.id, status: { type: "draft" }, preheader: null }), root);
  assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/email-templates/template`);
  assert.deepEqual(calls[1].body, { status: { type: "draft" }, preheader: null });
  assert.equal(await api.delete({ store_id: STORE_ID, id: root.id }), true);
  assert.equal(calls[2].method, "DELETE");
  assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/email-templates/template`);
});
