import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("Social connections use explicit native pages and exact reads without enumerating", async () => {
  const calls = [];
  const original = globalThis.fetch;
  const cursor = "opaque:connection/+cursor";
  const connection = { id: "selected-connection", store_id: "selected-store" };
  const replies = [{ items: [], cursor }, { items: [connection], cursor: null }, connection];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init?.method ?? "GET" });
    return new Response(JSON.stringify(replies.shift()), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  try {
    const admin = createAdmin({ baseUrl: "https://example.test", apiToken: "arky_api_test", storeId: "default-store" });
    const params = { store_id: "selected-store", query: "Facebook Garden", type: "facebook_page", status: "connected", limit: 20 };
    const first = await admin.social.connections.find(params);
    assert.deepEqual(first, { items: [], cursor });
    assert.equal(calls.length, 1, "An empty page does not automatically enumerate later pages");
    const second = await admin.social.connections.find({ ...params, cursor: first.cursor });
    assert.deepEqual(second, { items: [connection], cursor: null });
    assert.deepEqual(await admin.social.connections.get({ store_id: "selected-store", connection_id: connection.id }), connection);
    assert.equal(calls.length, 3);
    for (let index = 0; index < 2; index += 1) {
      assert.equal(calls[index].url.pathname, "/v1/stores/selected-store/social/connections");
      assert.deepEqual(Object.fromEntries(calls[index].url.searchParams), {
        query: "Facebook Garden", type: "facebook_page", status: "connected", limit: "20",
        ...(index === 1 ? { cursor } : {}),
      });
    }
    assert.equal(calls[2].url.pathname, "/v1/stores/selected-store/social/connections/selected-connection");
    assert.equal(calls[2].url.search, "");
    assert.ok(calls.every((call) => call.method === "GET"));
    assert.equal(params.query, "Facebook Garden");
  } finally {
    globalThis.fetch = original;
  }
});
