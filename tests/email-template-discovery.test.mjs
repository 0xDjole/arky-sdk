import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("EmailTemplate discovery preserves combined native predicates and nullable continuation", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? "template:+/=" : null }),
      { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://templates.test", storeId: "store" }).notification.template;
  const filters = { ids: ["first", "second"], key: "welcome", query: "welcome", status: "draft",
    limit: 1, sort_field: "key", sort_direction: "asc", created_at_from: 0, created_at_to: 5 };
  const first = await api.find(filters);
  assert.equal(first.cursor, "template:+/=");
  assert.equal((await api.find({ ...filters, cursor: first.cursor })).cursor, null);
  for (const call of calls) {
    assert.equal(call.url.pathname, "/v1/stores/store/email-templates");
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
  const root = { id: "template", key: "welcome", store_id: "store", status: { type: "draft" }, preheader: null };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(init.method === "DELETE" ? true : root),
      { headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://templates.test", storeId: "store" }).notification.template;
  assert.deepEqual(await api.get({ key: "welcome" }), root);
  assert.equal(decodeURIComponent(calls[0].url.pathname), "/v1/stores/store/email-templates/store:welcome");
  assert.deepEqual(await api.update({ id: root.id, status: { type: "draft" }, preheader: null }), root);
  assert.deepEqual(calls[1].body, { id: root.id, status: { type: "draft" }, preheader: null });
  assert.equal(await api.delete({ id: root.id }), true);
  assert.equal(calls[2].method, "DELETE");
});
