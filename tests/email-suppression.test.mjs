import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const storeId = "c8b7fcf9-d026-483a-a549-c6c9bab678e2";
const id = "78e6daf8-0253-47ac-956a-75b998f838f0";
const baseUrl = "https://email-restriction-contract.test";
const actor = { account_id: "2254288f-9778-4e51-8354-20b3d78d2dd4", snapshot: { email: "operator@example.test", credential_type: "session" } };
const record = {
  id,
  store_id: storeId,
  email: "person@example.com",
  type: "block",
  status: { type: "active", cause: { type: "account", actor, note: "Operator explanation" } },
  created_at: 0,
  updated_at: 1_800_000_000_123,
};

function client() {
  return createAdmin({ baseUrl, apiToken: "arky_api_suppressions" }).customers.emailSuppression;
}

function response(value) {
  return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
}

test("email suppressions are blocked and released by explicit commands with the app's id, a note and the version", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: JSON.parse(init.body), headers: new Headers(init.headers) });
    return response(record);
  });
  const restrictions = client();
  const activation = { store_id: storeId, id, email: "person@example.com", note: "Operator explanation" };
  assert.deepEqual(await restrictions.block(activation, { headers: { "X-Trace-Id": "restriction-test" } }), record);
  await restrictions.block(activation);
  await restrictions.recordUnsubscribe({ ...activation, expected_updated_at: 1_800_000_000_123 });
  const release = { store_id: storeId, id, expected_updated_at: 1_800_000_000_123, note: "Recipient requested this change" };
  await restrictions.unblock(release);
  const override = "a3e9b60e-39cf-4508-8d2a-0b1d63c5f6cd";
  await restrictions.recordResubscribe({ ...release, store_id: override });
  assert.equal(calls.length, 5);
  assert.deepEqual(calls.map((call) => call.method), Array(5).fill("POST"));
  assert.deepEqual(calls.map((call) => call.url.pathname), [
    `/v1/stores/${storeId}/email-suppressions/block`,
    `/v1/stores/${storeId}/email-suppressions/block`,
    `/v1/stores/${storeId}/email-suppressions/record-unsubscribe`,
    `/v1/stores/${storeId}/email-suppressions/${id}/unblock`,
    `/v1/stores/${override}/email-suppressions/${id}/record-resubscribe`,
  ]);
  const { store_id: _store, ...activationBody } = activation;
  assert.deepEqual(calls[0].body, activationBody);
  assert.deepEqual(calls[1].body, activationBody);
  assert.deepEqual(calls[2].body, { ...activationBody, expected_updated_at: 1_800_000_000_123 });
  assert.deepEqual(calls[3].body, { note: release.note, expected_updated_at: release.expected_updated_at });
  assert.equal(calls[0].headers.get("X-Trace-Id"), "restriction-test");
  for (const call of calls) {
    for (const field of ["type", "status", "changed_by", "store_id", "customer_id", "request_id", "expected_version"]) {
      assert.equal(field in call.body, false, field);
    }
  }
  for (const invented of [undefined, "operator-request", id.toUpperCase()]) {
    await assert.rejects(async () => restrictions.block({ ...activation, id: invented }), TypeError);
    await assert.rejects(async () => restrictions.recordUnsubscribe({ ...activation, id: invented }), TypeError);
  }
  await assert.rejects(async () => restrictions.block({ ...activation, store_id: undefined }), TypeError);
  assert.equal(calls.length, 5);
  for (const method of ["delete", "update", "releaseAll", "sendAnyway", "unsubscribe"]) {
    assert.equal(method in restrictions, false, method);
  }
  const storefront = createStorefront(`arky_pk_${"e".repeat(42)}A`, { apiUrl: baseUrl });
  assert.equal("emailSuppression" in storefront, false);
  assert.equal("emailSuppression" in storefront.customer, false);
});

test("email suppression reads keep independent types, empty filtered-page cursors and millisecond precision", async (context) => {
  const calls = [];
  const released = { ...record, id: "c99c70e6-1e6a-4c54-b4a0-75786cf4f168", type: "unsubscribe", status: { type: "released", by: { type: "storefront", customer_session_id: "5d2f1c8b-6a4e-4c39-9b71-2f8e0d47a3c6" } } };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    if (calls.length === 1) return response({ items: [], cursor: "filtered:+/=" });
    if (calls.length === 2) return response({ items: [record], cursor: null });
    if (calls.length === 3) return response({ items: [record, released], cursor: null });
    return response(record);
  });
  const restrictions = client();
  const first = await restrictions.find({ store_id: storeId, type: "block", status: "active", limit: 50 });
  assert.deepEqual(first, { items: [], cursor: "filtered:+/=" });
  const second = await restrictions.find({ store_id: storeId, limit: 100, cursor: first.cursor });
  assert.deepEqual(second.items, [record]);
  assert.equal(second.items[0].created_at, 0);
  assert.equal(second.items[0].updated_at, 1_800_000_000_123);
  const exact = await restrictions.find({ store_id: storeId, query: "person@example.com" });
  assert.equal(exact.items.length, 2);
  assert.deepEqual(exact.items[1].status, released.status);
  assert.deepEqual(await restrictions.get({ store_id: storeId, id }), record);
  assert.equal(calls.length, 4);
  assert.deepEqual([...calls[0].url.searchParams], [["type", "block"], ["status", "active"], ["limit", "50"]]);
  assert.deepEqual([...calls[1].url.searchParams], [["limit", "100"], ["cursor", "filtered:+/="]]);
  assert.deepEqual([...calls[2].url.searchParams], [["query", "person@example.com"]]);
  assert.equal(calls[3].url.pathname, `/v1/stores/${storeId}/email-suppressions/${id}`);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
});

test("the SDK does not add paging to an exact email search", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url) => {
    calls.push(new URL(url));
    return response({ items: [record], cursor: null });
  });
  await client().find({ store_id: storeId, query: "person@example.com" });
  assert.deepEqual(Object.fromEntries(calls[0].searchParams), { query: "person@example.com" });
});
