import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.mailbox-contract.test";
const storeId = "a5817952-9f4f-48ad-bb58-25845cf7b470";
const mailboxId = "57979b10-9935-42e6-9e1d-ddd61b6b6b46";

function admin() {
  return createAdmin({ baseUrl, storeId, apiToken: "arky_api_mailbox_contract" });
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("Mailbox diagnostics read exact native identities and millisecond observations one bounded page at a time", async (context) => {
  const issues = [
    {
      id: "869c135a-1e69-4585-81f6-f9d8479d8205",
      store_id: storeId,
      mailbox_id: mailboxId,
      source: { type: "imap", mailbox: "INBOX", uid_validity: 4_000_000_000, uid: 42 },
      reason: "missing_sender",
      message: "The email has no sender header",
      observed_at: 1_800_000_000_123,
    },
    {
      id: "6894cfdc-72d6-4ddc-8c5b-6e6288e06cc9",
      store_id: storeId,
      mailbox_id: mailboxId,
      source: { type: "google", message_id: "a123" },
      reason: "invalid_mime",
      message: "The email MIME structure could not be parsed",
      observed_at: 0,
    },
  ];
  const calls = [];
  const controller = new AbortController();
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body, headers: new Headers(init.headers) });
    return jsonResponse(calls.length === 1
      ? { items: issues, cursor: "opaque:+/=" }
      : { items: [], cursor: null });
  });
  const client = admin();
  const first = await client.notification.mailbox.findSyncIssues(
    { id: mailboxId },
    { signal: controller.signal, headers: { "X-Trace-Id": "mailbox-contract" } },
  );
  assert.deepEqual(first, { items: issues, cursor: "opaque:+/=" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/mailboxes/${mailboxId}/sync-issues`);
  assert.deepEqual([...calls[0].url.searchParams], [["limit", "50"]]);
  assert.equal(calls[0].headers.get("X-Trace-Id"), "mailbox-contract");
  assert.equal(first.items[0].observed_at, 1_800_000_000_123);
  assert.equal(first.items[1].observed_at, 0);
  const override = "2c025c1e-450d-47cb-a529-9a111b5b235a";
  assert.deepEqual(await client.notification.mailbox.findSyncIssues({
    id: mailboxId, store_id: override, limit: 100, cursor: first.cursor,
  }), { items: [], cursor: null });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url.pathname, `/v1/stores/${override}/mailboxes/${mailboxId}/sync-issues`);
  assert.deepEqual([...calls[1].url.searchParams], [["limit", "100"], ["cursor", "opaque:+/="]]);
  assert.equal("retrySyncIssue" in client.notification.mailbox, false);
  assert.equal("purgeSyncIssues" in client.notification.mailbox, false);
  const storefront = createStorefront(`arky_pk_${"m".repeat(42)}A`, { apiUrl: baseUrl });
  assert.equal("notification" in storefront, false);
});

test("Mailbox diagnostics reject unbounded pages and invalid opaque cursors without a request", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return jsonResponse({ items: [], cursor: null });
  });
  const client = admin();
  for (const limit of [0, -1, 1.5, 101, Infinity, NaN, null, "50"]) {
    await assert.rejects(
      client.notification.mailbox.findSyncIssues({ id: mailboxId, limit }),
      /integer from 1 to 100/,
    );
  }
  for (const cursor of ["", "a".repeat(2049), "é".repeat(1025), null, 5]) {
    await assert.rejects(
      client.notification.mailbox.findSyncIssues({ id: mailboxId, cursor }),
      /1 to 2048 bytes/,
    );
  }
  assert.equal(calls, 0);
  await client.notification.mailbox.findSyncIssues({ id: mailboxId, limit: 1, cursor: "é".repeat(1024) });
  assert.equal(calls, 1);
});
