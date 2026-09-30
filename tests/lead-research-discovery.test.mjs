import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "b5d20e8a-9f14-4c73-a6b2-3e7c1d0f8a59";
const OTHER_STORE_ID = "0c4f7a1e-2d83-4b95-8e6c-9a1b3d5f7e20";

test("Research transcript paging preserves empty continuation and exact-message reads never start work", async (context) => {
  const calls = [];
  const message = {
    id: "assistant", store_id: STORE_ID, lead_research_id: "research", position: 102,
    type: {
      type: "assistant", responds_to_message_id: "account",
      requested_by: { account_id: null, snapshot: { email: "operator@example.com", credential_type: "session" } },
      status: { type: "completed", content: "Retained response", completed_at: 1_800_000_000_002 },
    },
    created_at: 1_800_000_000_001,
  };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body, headers: new Headers(init.headers) });
    const value = calls.length === 1 ? { items: [], cursor: "opaque:+/=" }
      : calls.length === 2 ? { items: [message], cursor: null } : message;
    return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://research-contract.test" }).leadResearch;
  const first = await api.findMessages({ store_id: STORE_ID, lead_research_id: "research", limit: 1 });
  assert.deepEqual(first, { items: [], cursor: "opaque:+/=" });
  const next = await api.findMessages({ store_id: STORE_ID, lead_research_id: "research", limit: 1, cursor: first.cursor });
  assert.deepEqual(next, { items: [message], cursor: null });
  assert.deepEqual(await api.getMessage({ store_id: STORE_ID, lead_research_id: "research", message_id: "assistant" }, { headers: { "X-Trace-Id": "read-only" } }), message);
  await api.getMessage({ store_id: OTHER_STORE_ID, lead_research_id: "research", message_id: "assistant" });
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/lead-research/research/messages`);
  assert.equal(calls[0].url.searchParams.has("store_id"), false);
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  assert.equal(calls[1].url.searchParams.get("limit"), "1");
  assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/lead-research/research/messages/assistant`);
  assert.equal(calls[2].url.search, "");
  assert.equal(calls[2].headers.get("X-Trace-Id"), "read-only");
  assert.equal(calls[3].url.pathname, `/v1/stores/${OTHER_STORE_ID}/lead-research/research/messages/assistant`);
});
