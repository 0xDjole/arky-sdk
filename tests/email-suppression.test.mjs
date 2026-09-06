import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const storeId = "c8b7fcf9-d026-483a-a549-c6c9bab678e2";
const id = "78e6daf8-0253-47ac-956a-75b998f838f0";
const commandId = "c99c70e6-1e6a-4c54-b4a0-75786cf4f168";
const version = "577b07c2-7bb3-4c4c-96f7-2531ebccca68";
const baseUrl = "https://email-restriction-contract.test";
const record = {
  restriction: {
    id,
    store_id: storeId,
    email: "person@example.com",
    type: "admin_block",
    status: { type: "active" },
    changed_by: { type: "admin", account_session_id: null },
    note: "Operator explanation",
    created_at: 0,
    updated_at: 1_800_000_000_123,
  },
  version,
};

function client() {
  return createAdmin({ baseUrl, storeId }).customers.emailSuppression;
}

function response(value) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("Email restrictions use explicit independent commands and retain exact replay/version evidence", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      body: JSON.parse(init.body),
      headers: new Headers(init.headers),
    });
    return response(record);
  });
  const restrictions = client();
  const activation = {
    id,
    email: "person@example.com",
    command_id: commandId,
    expected_version: null,
    note: "Operator explanation",
  };
  assert.deepEqual(
    await restrictions.block(activation, {
      headers: { "X-Trace-Id": "restriction-test" },
    }),
    record,
  );
  await restrictions.block(activation);
  await restrictions.recordUnsubscribe({
    ...activation,
    expected_version: version,
  });
  const release = {
    id,
    command_id: commandId,
    expected_version: version,
    note: "Recipient requested this change",
  };
  await restrictions.unblock(release);
  const override = "a3e9b60e-39cf-4508-8d2a-0b1d63c5f6cd";
  await restrictions.recordResubscribe({ ...release, store_id: override });
  assert.equal(calls.length, 5);
  assert.deepEqual(
    calls.map((call) => call.method),
    Array(5).fill("POST"),
  );
  assert.deepEqual(
    calls.map((call) => call.url.pathname),
    [
      `/v1/stores/${storeId}/email-suppressions/block`,
      `/v1/stores/${storeId}/email-suppressions/block`,
      `/v1/stores/${storeId}/email-suppressions/record-unsubscribe`,
      `/v1/stores/${storeId}/email-suppressions/${id}/unblock`,
      `/v1/stores/${override}/email-suppressions/${id}/record-resubscribe`,
    ],
  );
  assert.deepEqual(calls[0].body, activation);
  assert.deepEqual(calls[1].body, activation);
  assert.equal(calls[2].body.expected_version, version);
  assert.deepEqual(calls[3].body, {
    command_id: commandId,
    expected_version: version,
    note: release.note,
  });
  assert.equal(calls[0].headers.get("X-Trace-Id"), "restriction-test");
  for (const call of calls) {
    for (const field of [
      "type",
      "status",
      "changed_by",
      "store_id",
      "customer_id",
    ]) {
      assert.equal(field in call.body, false);
    }
  }
  for (const method of [
    "delete",
    "update",
    "releaseAll",
    "sendAnyway",
    "unsubscribe",
  ]) {
    assert.equal(method in restrictions, false);
  }
  const storefront = createStorefront(`arky_pk_${"e".repeat(42)}A`, {
    apiUrl: baseUrl,
  });
  assert.equal("emailSuppression" in storefront, false);
  assert.equal("emailSuppression" in storefront.customer, false);
});

test("Email restriction reads preserve independent types, empty filtered-page cursors and millisecond precision", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    if (calls.length === 1)
      return response({ items: [], cursor: "filtered:+/=" });
    if (calls.length === 2) return response({ items: [record], cursor: null });
    if (calls.length === 3)
      return response({
        items: [
          record,
          {
            ...record,
            restriction: {
              ...record.restriction,
              id: commandId,
              type: "unsubscribe",
              status: { type: "released" },
            },
          },
        ],
        cursor: null,
      });
    return response(record);
  });
  const restrictions = client();
  const first = await restrictions.find({
    type: "admin_block",
    status: "active",
  });
  assert.deepEqual(first, { items: [], cursor: "filtered:+/=" });
  const second = await restrictions.find({ limit: 100, cursor: first.cursor });
  assert.deepEqual(second.items, [record]);
  assert.equal(second.items[0].restriction.created_at, 0);
  assert.equal(second.items[0].restriction.updated_at, 1_800_000_000_123);
  const exact = await restrictions.find({ query: "person@example.com" });
  assert.equal(exact.items.length, 2);
  assert.deepEqual(await restrictions.get({ id }), record);
  assert.equal(calls.length, 4);
  assert.deepEqual(
    [...calls[0].url.searchParams],
    [
      ["limit", "50"],
      ["type", "admin_block"],
      ["status", "active"],
    ],
  );
  assert.deepEqual(
    [...calls[1].url.searchParams],
    [
      ["limit", "100"],
      ["cursor", "filtered:+/="],
    ],
  );
  assert.deepEqual(
    [...calls[2].url.searchParams],
    [["query", "person@example.com"]],
  );
  assert.equal(
    calls[3].url.pathname,
    `/v1/stores/${storeId}/email-suppressions/${id}`,
  );
  assert.ok(
    calls.every((call) => call.method === "GET" && call.body === undefined),
  );
});

test("Email restrictions reject ambiguous versions and unbounded reads before making a request", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return response(record);
  });
  const restrictions = client();
  await assert.rejects(
    restrictions.block({
      id,
      email: "person@example.com",
      command_id: commandId,
      note: "Reason",
    }),
    /explicit expected_version/,
  );
  for (const expected_version of [undefined, null, ""]) {
    await assert.rejects(
      restrictions.unblock({
        id,
        command_id: commandId,
        expected_version,
        note: "Reason",
      }),
      /current expected_version/,
    );
  }
  for (const limit of [0, -1, 101, 1.5, null, "50", Infinity, NaN]) {
    await assert.rejects(restrictions.find({ limit }), /integer from 1 to 100/);
  }
  for (const cursor of ["", null, 5, "é".repeat(1025)]) {
    await assert.rejects(restrictions.find({ cursor }), /1 to 2048 bytes/);
  }
  await assert.rejects(
    restrictions.find({ query: "person@example.com", limit: 1 }),
    /does not accept pagination/,
  );
  await assert.rejects(
    restrictions.find({ query: "person@example.com", cursor: "opaque" }),
    /does not accept pagination/,
  );
  assert.equal(calls, 0);
});
