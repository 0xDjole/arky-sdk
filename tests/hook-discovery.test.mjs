import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "e7b39c05-4a18-4d62-9f3e-8c1a5b2d7f90";
const hookId = "1c7e3a95-6b28-4d40-8f13-9a2e5c0d7b64";
const testId = "5d9b1f37-2a84-4c60-b3e7-8f1a6c4d0e29";

function store() {
  return createAdmin({ baseUrl: "https://hooks.test", apiToken: "arky_api_hooks" }).store;
}

test("webhook discovery carries its native filters and keeps the empty-page continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "opaque:+/=" }));
  const api = store();
  assert.equal("buildHook" in api, false);
  const params = { store_id: STORE_ID, query: "lookup", status: "disabled", sort_field: "updated_at", sort_direction: "asc", limit: 1 };
  const page = await api.webhook.list(params);
  assert.deepEqual(page, { items: [], cursor: "opaque:+/=" });
  assert.deepEqual(await api.webhook.list({ ...params, cursor: page.cursor }), page);
  assert.equal(calls.length, 2);
  for (const [index, call] of calls.entries()) {
    assert.equal(call.method, "GET");
    assert.equal(call.body, null);
    assert.equal(call.path, `/v1/stores/${STORE_ID}/webhooks`);
    assert.deepEqual(call.query, { query: "lookup", status: "disabled", sort_field: "updated_at", sort_direction: "asc", limit: "1", ...(index === 1 ? { cursor: "opaque:+/=" } : {}) });
  }
});

test("webhook writes keep tagged statuses and scoped event types, carry the app-picked id and the version", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : { id: hookId, ...(call.body ?? {}) });
  const api = store().webhook;
  const events = [
    { type: "entry.updated", collections: { type: "all" }, entries: { type: "only", keys: ["guide"] } },
    { type: "form_submission.created", forms: { type: "all" } },
    { type: "order.created" },
  ];
  const created = await api.create({ store_id: STORE_ID, id: hookId, url: "https://receiver.test", events, headers: {}, secret: "secret", status: { type: "active" } });
  assert.deepEqual(created.events, events);
  await api.update({ store_id: STORE_ID, id: hookId, expected_updated_at: 2, status: { type: "disabled" } });
  await api.delete({ store_id: STORE_ID, id: hookId, expected_updated_at: 3 });
  await api.test({ store_id: STORE_ID, id: testId, webhook_id: hookId });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/webhooks`, {}, { id: hookId, url: "https://receiver.test", events, headers: {}, secret: "secret", status: { type: "active" } }],
    ["PUT", `/v1/stores/${STORE_ID}/webhooks/${hookId}`, {}, { expected_updated_at: 2, status: { type: "disabled" } }],
    ["DELETE", `/v1/stores/${STORE_ID}/webhooks/${hookId}`, { expected_updated_at: "3" }, null],
    ["POST", `/v1/stores/${STORE_ID}/webhooks/test`, {}, { id: testId, webhook_id: hookId }],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "hook", url: "https://receiver.test", events, headers: {}, secret: "s", status: { type: "active" } }), TypeError);
  await assert.rejects(async () => api.test({ store_id: STORE_ID, id: "test", webhook_id: hookId }), {
    name: "TypeError",
    message: "The test post id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 4);
});
