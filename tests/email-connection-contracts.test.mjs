import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const store = "5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06";
const provider = "6d8f0a2c-4e5b-4d9f-b1e3-5a7c9e1b3d4f";
const address = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const event = "d8b35cf1-6867-49b0-863d-fdc1a6a6e6dc";

function notification() {
  return createAdmin({ apiUrl: "https://email-connections.test", secretKey: "arky_api_email" }).notification;
}

test("a store keeps several named email connections, each read, rekeyed and removed by its id and version", async (context) => {
  const connection = { id: provider, store_id: store, name: "Main Resend", type: { type: "resend", webhook_id: "webhook" }, created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? true : call.path.endsWith("/email-providers") && call.method === "GET" ? { items: [connection], cursor: null } : connection);
  const api = notification().emailProvider;
  assert.deepEqual(await api.find({ store_id: store, limit: 10, cursor: "previous" }), { items: [connection], cursor: null });
  assert.deepEqual(await api.get({ store_id: store, id: provider }), connection);
  assert.deepEqual(await api.connect({ store_id: store, id: provider, name: "Main Resend", api_key: "re_first_key", webhook_secret: "whsec_first_secret" }), connection);
  assert.deepEqual(await api.replaceKey({ store_id: store, id: provider, expected_updated_at: 2, api_key: "re_next_key", webhook_secret: "whsec_next_secret" }), connection);
  assert.equal(await api.delete({ store_id: store, id: provider, expected_updated_at: 3 }), true);
  const base = `/v1/stores/${store}/email-providers`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { limit: "10", cursor: "previous" }, null],
    ["GET", `${base}/${provider}`, {}, null],
    ["POST", base, {}, { id: provider, name: "Main Resend", api_key: "re_first_key", webhook_secret: "whsec_first_secret" }],
    ["PUT", `${base}/${provider}`, {}, { expected_updated_at: 2, api_key: "re_next_key", webhook_secret: "whsec_next_secret" }],
    ["DELETE", `${base}/${provider}`, { expected_updated_at: "3" }, null],
  ]);
  await assert.rejects(async () => api.connect({ store_id: store, id: "resend", name: "Main Resend", api_key: "re_first_key", webhook_secret: "whsec_first_secret" }), TypeError);
  assert.equal(calls.length, 5);
  assert.deepEqual(Object.keys(api).sort(), ["checkSetup", "connect", "delete", "find", "findDomains", "get", "replaceKey"]);
});

test("checking a connection's setup is a live read of the webhook Resend must call and every problem found", async (context) => {
  const setup = {
    webhook_address: "https://api.example.test/v1/webhooks/resend/connection",
    events: ["email.sent", "email.delivered", "email.bounced", "email.complained", "email.received"],
    webhook_id: "wh_resend_1",
    problems: [
      { type: "webhook_missing" },
      { type: "webhook_duplicated", webhook_ids: ["wh_resend_1", "wh_resend_2"] },
      { type: "webhook_secret_mismatch" },
      { type: "webhook_disabled" },
      { type: "webhook_events_missing", events: ["email.received"] },
    ],
  };
  const calls = recordFetch(context, () => setup);
  const api = notification().emailProvider;
  assert.deepEqual(await api.checkSetup({ store_id: store, id: provider }), setup);
  assert.deepEqual(await api.checkSetup({ store_id: store, id: "connection/one" }), setup);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/stores/${store}/email-providers/${provider}/setup`, {}, null],
    ["GET", `/v1/stores/${store}/email-providers/connection%2Fone/setup`, {}, null],
  ]);
  for (const call of calls) assert.equal(call.url.search, "");
});

test("a connection's domains are a live read with their DNS records and capabilities", async (context) => {
  const domains = ["not_started", "pending", "verified", "partially_verified", "partially_failed", "failed", "temporary_failure"].map((status, index) => ({
    id: `domain-${index}`,
    name: `mail${index}.example.test`,
    status,
    records: [{ record: "SPF", status: "verified", type: "TXT", name: "send", value: "v=spf1", priority: null }],
    sending_enabled: index % 2 === 0,
    receiving_enabled: index === 2,
  }));
  const calls = recordFetch(context, () => domains);
  assert.deepEqual(await notification().emailProvider.findDomains({ store_id: store, id: provider }), { items: domains, cursor: null });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["GET", `/v1/stores/${store}/email-providers/${provider}/domains`]]);
});

test("an email address names its connection, is deleted without a version and reports live readiness", async (context) => {
  const record = { id: address, store_id: store, email_provider_id: provider, email: "orders@example.test" };
  const readiness = { sending: { type: "ready" }, receiving: { type: "check_failed", reason: "Resend did not answer" } };
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? true
    : call.path.endsWith("/readiness") ? readiness
    : call.path.endsWith("/email-addresses") && call.method === "GET" ? { items: [record], cursor: null } : record);
  const api = notification().emailAddress;
  assert.deepEqual(await api.find({ store_id: store, limit: 50 }), { items: [record], cursor: null });
  assert.deepEqual(await api.create({ store_id: store, id: address, email: "orders@example.test", email_provider_id: provider }), record);
  assert.deepEqual(await api.get({ store_id: store, id: address }), record);
  assert.deepEqual(await api.getReadiness({ store_id: store, id: address }), readiness);
  assert.equal(await api.delete({ store_id: store, id: address }), true);
  const base = `/v1/stores/${store}/email-addresses`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { limit: "50" }, null],
    ["POST", base, {}, { id: address, email: "orders@example.test", email_provider_id: provider }],
    ["GET", `${base}/${address}`, {}, null],
    ["GET", `${base}/${address}/readiness`, {}, null],
    ["DELETE", `${base}/${address}`, {}, null],
  ]);
  await assert.rejects(async () => api.create({ store_id: store, id: "orders", email: "orders@example.test", email_provider_id: provider }), TypeError);
  assert.equal(calls.length, 5);
  assert.deepEqual(Object.keys(api).sort(), ["create", "delete", "find", "get", "getReadiness"]);
});

test("sent history lists summaries and reads one email with its rendered preview", async (context) => {
  const summary = {
    id: event,
    type: { type: "store_admin_sign_in", sending_address_id: address },
    to: "owner@example.test",
    email_provider_id: provider,
    delivery_report: { type: "delivered", at: 3 },
    complained_at: null,
    preview: null,
    send_before: 9,
    status: { type: "sent", provider_email_id: "re_1", sent_at: 2 },
    created_at: 1,
    updated_at: 3,
  };
  const preview = { from_email: "orders@example.test", from_name: "Shop", reply_to_email: "help@example.test", rendered_language: "en", subject: "Order 42" };
  const detail = { ...summary, type: { type: "event_email", sending_address_id: address, event_id: "event", email_template_id: address }, preview: { ...preview, html: "<p>Thanks</p>", text: "Thanks" } };
  const calls = recordFetch(context, (call) => call.path.endsWith("/outgoing-emails") ? { items: [summary, { ...detail, preview }], cursor: null } : detail);
  const api = notification().outgoingEmail;
  const page = await api.find({ store_id: store, type: "store_admin_invite", limit: 2 });
  assert.equal(page.items[1].preview.subject, "Order 42");
  assert.equal("html" in page.items[1].preview, false);
  assert.deepEqual(await api.get({ store_id: store, id: event }), detail);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/stores/${store}/outgoing-emails`, { type: "store_admin_invite", limit: "2" }],
    ["GET", `/v1/stores/${store}/outgoing-emails/${event}`, {}],
  ]);
});

test("Resend events a store connection received are listed per connection and status and resolved with their version", async (context) => {
  const record = { id: event, provider_event_id: "evt_1", type: { type: "store_resend", store_id: store, email_provider_id: provider, event: { event_type: "email.received", email_id: "re_1", occurred_at: 1, outgoing_email_id: null, store_id: store, message_id: null, recipients: ["help@example.test"], failure: null } }, status: { type: "review", reason: "No entry", to: null }, created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.method === "GET" ? { items: [record], cursor: null } : record);
  const api = notification().resendEvent;
  assert.deepEqual(await api.find({ store_id: store, email_provider_id: provider, status: "review", limit: 20, cursor: "next" }), { items: [record], cursor: null });
  assert.deepEqual(await api.resolve({ store_id: store, id: event, expected_updated_at: 2, resolution: "apply" }), record);
  await api.resolve({ store_id: store, id: event, expected_updated_at: 3, resolution: "ignore", reason: "Spam" });
  const base = `/v1/stores/${store}/incoming-webhooks/resend`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { email_provider_id: provider, status: "review", limit: "20", cursor: "next" }, null],
    ["POST", `${base}/${event}/resolve`, {}, { expected_updated_at: 2, resolution: "apply" }],
    ["POST", `${base}/${event}/resolve`, {}, { expected_updated_at: 3, resolution: "ignore", reason: "Spam" }],
  ]);
  await assert.rejects(async () => api.find({ store_id: "store", email_provider_id: provider, status: "review" }), TypeError);
  assert.equal(calls.length, 3);
});
