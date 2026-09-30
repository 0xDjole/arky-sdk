import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "f1c8e2a4-6b37-4d09-8a5e-2b7d9c0f3e61";

test("Social page controls preserve explicit invalid sizes for server rejection without replay", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), body: init?.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify({ message: "Page limit must be between 1 and 100", error: "BAD_REQUEST" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  };
  try {
    const admin = createAdmin({ baseUrl: "https://example.test", apiToken: "arky_api_test" });
    for (const limit of [0, 101]) {
      await assert.rejects(admin.social.posts.find({ store_id: STORE_ID, limit }), (error) => error.statusCode === 400);
      assert.equal(calls.at(-1).url.pathname, `/v1/stores/${STORE_ID}/social/posts`);
      assert.equal(calls.at(-1).url.searchParams.get("limit"), String(limit));
      await assert.rejects(admin.social.posts.messages.find({ store_id: STORE_ID, post_id: "post", limit }), (error) => error.statusCode === 400);
      assert.equal(calls.at(-1).url.pathname, `/v1/stores/${STORE_ID}/social/posts/post/messages`);
      assert.equal(calls.at(-1).url.searchParams.get("limit"), String(limit));
      await assert.rejects(admin.social.posts.messages.sync({
        store_id: STORE_ID, post_id: "post", sync: { type: { type: "top_level", cursor: null, limit } },
      }), (error) => error.statusCode === 400);
      assert.equal(calls.at(-1).url.pathname, `/v1/stores/${STORE_ID}/social/posts/post/messages/sync`);
      assert.deepEqual(calls.at(-1).body, { sync: { type: { type: "top_level", cursor: null, limit } } });
    }
    assert.equal(calls.length, 6);
  } finally {
    globalThis.fetch = original;
  }
});

test("Social connections use explicit native pages and exact reads without enumerating", async () => {
  const calls = [];
  const original = globalThis.fetch;
  const cursor = "opaque:connection/+cursor";
  const connection = { id: "selected-connection", store_id: STORE_ID };
  const replies = [{ items: [], cursor }, { items: [connection], cursor: null }, connection];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init?.method ?? "GET" });
    return new Response(JSON.stringify(replies.shift()), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  try {
    const admin = createAdmin({ baseUrl: "https://example.test", apiToken: "arky_api_test" });
    const params = { store_id: STORE_ID, query: "Facebook Garden", type: "facebook_page", status: "connected", limit: 20 };
    const first = await admin.social.connections.find(params);
    assert.deepEqual(first, { items: [], cursor });
    assert.equal(calls.length, 1, "An empty page does not automatically enumerate later pages");
    const second = await admin.social.connections.find({ ...params, cursor: first.cursor });
    assert.deepEqual(second, { items: [connection], cursor: null });
    assert.deepEqual(await admin.social.connections.get({ store_id: STORE_ID, connection_id: connection.id }), connection);
    assert.equal(calls.length, 3);
    for (let index = 0; index < 2; index += 1) {
      assert.equal(calls[index].url.pathname, `/v1/stores/${STORE_ID}/social/connections`);
      assert.deepEqual(Object.fromEntries(calls[index].url.searchParams), {
        query: "Facebook Garden", type: "facebook_page", status: "connected", limit: "20",
        ...(index === 1 ? { cursor } : {}),
      });
    }
    assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/social/connections/selected-connection`);
    assert.equal(calls[2].url.search, "");
    assert.ok(calls.every((call) => call.method === "GET"));
    assert.equal(params.query, "Facebook Garden");
  } finally {
    globalThis.fetch = original;
  }
});
