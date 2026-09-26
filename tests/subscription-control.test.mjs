import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const subscriptionId = "0d4b8c62-3a75-4f0e-9a52-3e2bb2a3d5f1";
const revisionId = "8a1f2f63-2d5e-4c8b-a6b4-5d7a9f0e1c22";
const methodId = "4c2e7b19-6f3a-4d8e-b1c5-9a0d2e7f3b64";

function capture(reply) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(reply), { headers: { "content-type": "application/json" } });
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

function subscriptions() {
  return createAdmin({ storeId: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" })
    .eshop.subscription;
}

test("future-purchase control sends one command envelope and replays the same identity after uncertainty", async () => {
  const result = {
    command_id: "6f9d1c2a-8b3e-4a5f-9c7d-1e2f3a4b5c6d",
    accepted_at: 1700000000100,
    subscription: { id: subscriptionId, status: { type: "active" }, purchase_end_at: 1702592000000 },
  };
  const { calls, restore } = capture(result);
  try {
    const api = subscriptions();
    for (const type of [{ type: "pause", reason: "Customer is travelling" }, { type: "cancel", reason: "Customer asked to stop" }]) {
      const params = {
        store_id: store,
        command_id: result.command_id,
        request: { subscription_id: subscriptionId, expected_updated_at: 1700000000000, type },
      };
      const before = structuredClone(params);
      assert.deepEqual(await api.control(params), result);
      assert.deepEqual(await api.control(params), result);
      assert.deepEqual(params, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.deepEqual(calls.at(-1).body, { command_id: result.command_id, request: params.request });
    }
    assert.equal(calls.length, 4);
    assert.ok(calls.every((call) => call.method === "POST"
      && call.url.pathname === `/v1/stores/${store}/subscriptions/commands`
      && !call.url.search));
  } finally { restore(); }
});

test("calendar and funding changes review first and accept only the reviewed digest", async () => {
  const { calls, restore } = capture({ command_id: "command", timeline_digest: `v1:sha256:${"a".repeat(64)}` });
  try {
    const api = subscriptions();
    const command_id = "2b7e9c14-5d3a-4f6b-8e1c-0a9d7f3e5b21";
    const end = { type: "before", occurrence_index: 4 };
    const calendar = {
      subscription_id: subscriptionId,
      expected_updated_at: 1700000000000,
      expected_previous_revision_id: revisionId,
      expected_next_occurrence_index: 3,
      first_occurrence: 3,
      end,
      type: "skip_next",
      calendars: [{
        effective_from_occurrence: 3,
        schedule: { type: "recurring", timezone: "Europe/Berlin", anchor: 1690000000000, first_period_offset: 4 },
      }],
      reason: "Customer is away next month",
    };
    const funding = {
      subscription_id: subscriptionId,
      expected_updated_at: 1700000000000,
      expected_previous_revision_id: revisionId,
      expected_next_occurrence_index: 3,
      first_occurrence: 3,
      end: { type: "from_here_onward" },
      payment_method_id: methodId,
      reason: "Customer replaced the saved card",
    };
    const timeline_digest = `v1:sha256:${"a".repeat(64)}`;
    const before = structuredClone({ calendar, funding });
    await api.calendarOptions({ store_id: store, command_id, subscription_id: subscriptionId });
    await api.calendarReview({ store_id: store, command_id, request: calendar });
    await api.calendarAccept({ store_id: store, command_id, request: calendar, timeline_digest });
    await api.fundingReview({ command_id, request: funding });
    await api.fundingAccept({ command_id, request: funding, timeline_digest });
    assert.deepEqual({ calendar, funding }, before);
    const base = `/v1/stores/${store}/subscriptions`;
    const fallback = "/v1/stores/configured/subscriptions";
    assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
      ["POST", `${base}/calendar/options`],
      ["POST", `${base}/calendar/review`],
      ["POST", `${base}/calendar/accept`],
      ["POST", `${fallback}/funding/review`],
      ["POST", `${fallback}/funding/accept`],
    ]);
    assert.deepEqual(calls.map((call) => call.body), [
      { command_id, subscription_id: subscriptionId },
      { command_id, request: calendar },
      { command_id, request: calendar, timeline_digest },
      { command_id, request: funding },
      { command_id, request: funding, timeline_digest },
    ]);
    assert.ok(calls.every((call) => !call.url.search && !("store_id" in call.body)));
  } finally { restore(); }
});
