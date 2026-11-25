import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import {
  apiUrl,
  emailSession,
  idFactories,
  ids,
  phoneSession,
  recordFetch,
  sessionResult,
  storefrontIdentity,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const accountToken = "arky_at_ttttttttttttttttttttttttttttttttttttttttttA";
const inviteId = "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f61";
const inviteMessage = "5b1d2e7c-9a43-4f60-8c21-7e3f9d0a6b14";

test("staff invite a customer's contact by its address with the invite id they pick", async (context) => {
  const address = { type: "email", email: "patient@example.test" };
  const answer = {
    id: inviteId,
    customer_id: ids.customer,
    sent_to: address,
    language: "bs",
    code: { failed_attempts: 0, outgoing_message_id: inviteMessage, issued_at: 1_700_000_000_000, expires_at: 1_700_604_800_000 },
    status: { type: "active" },
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_000,
  };
  const calls = recordFetch(context, () => answer);
  const admin = createAdmin({ apiUrl, accountToken });
  const sent = await admin.customers.inviteContact({
    store_id: ids.store,
    customer_id: ids.customer,
    id: inviteId,
    address,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].path, `/v1/stores/${ids.store}/customers/${ids.customer}/invites`);
  assert.deepEqual(calls[0].body, { id: inviteId, address });
  assert.deepEqual(sent, answer);
  assert.equal("code_digest" in sent.code, false);
  await assert.rejects(
    async () => admin.customers.inviteContact({
      store_id: ids.store,
      customer_id: ids.customer,
      id: "invite-message",
      address,
    }),
    TypeError,
  );
  assert.equal(calls.length, 1);
});

test("staff list a customer's invites, each naming where it went and whether it still opens", async (context) => {
  const invites = [
    {
      id: inviteId,
      customer_id: ids.customer,
      sent_to: { type: "phone", number: "+38761222333" },
      language: "bs",
      code: { failed_attempts: 1, outgoing_message_id: inviteMessage, issued_at: 1, expires_at: 2 },
      status: { type: "superseded" },
      created_at: 1,
      updated_at: 3,
    },
  ];
  const calls = recordFetch(context, () => invites);
  const admin = createAdmin({ apiUrl, accountToken });
  assert.deepEqual(await admin.customers.findInvites({ store_id: ids.store, customer_id: ids.customer }), invites);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["GET", `/v1/stores/${ids.store}/customers/${ids.customer}/invites`, null],
  ]);
});

test("an invite is checked with its email or number, and a code the visitor asked for without one", async (context) => {
  const picked = [ids.otherSession, "7c2e9a41-5d38-4b06-a1f9-3e8d6b2c0f57", "1d9e6a52-3b70-4c18-9f24-6a0e8b5d3c71"];
  const calls = recordFetch(context, (call) => {
    if (call.path !== "/v1/storefront/customer/verify") throw new Error(`Unexpected request: ${call.path}`);
    if (call.body.number !== undefined) return sessionResult(ids.customer, phoneSession(ids.customer, call.body.session_id, call.body.number));
    return sessionResult(ids.customer, emailSession(ids.customer, call.body.session_id, { email: call.body.email ?? "patient@example.test" }));
  });
  const storefront = createStorefront(storefrontIdentity, {
    ...idFactories,
    apiUrl,
    sessionStorage: visitorStorage(),
    createSessionId: () => picked.shift(),
  });
  const invited = await storefront.customer.verify({ code: "246810", email: "patient@example.test" });
  assert.equal(invited.session.id, ids.otherSession);
  assert.equal("login" in invited, false);
  assert.deepEqual(calls.map((call) => [call.headers.get("authorization"), call.body]), [
    [`Bearer ${visitorToken}`, { session_id: ids.otherSession, code: "246810", email: "patient@example.test" }],
  ]);
  assert.equal(storefront.isAuthenticated, true);
  assert.equal(storefront.session.type, "store_customer_signed_in_by_email");
  assert.deepEqual(storefront.session.signed_in_with, { type: "email", email: "patient@example.test" }, "the session names the address it signed in with");
  const plain = createStorefront(storefrontIdentity, {
    ...idFactories,
    apiUrl,
    sessionStorage: visitorStorage(),
    createSessionId: () => picked.shift(),
  });
  await plain.customer.verify({ code: "135790" });
  assert.deepEqual(calls[1].body, { session_id: "7c2e9a41-5d38-4b06-a1f9-3e8d6b2c0f57", code: "135790" });
  assert.equal("email" in calls[1].body, false);
  const byNumber = createStorefront(storefrontIdentity, {
    ...idFactories,
    apiUrl,
    sessionStorage: visitorStorage(),
    createSessionId: () => picked.shift(),
  });
  await byNumber.customer.verify({ code: "975310", number: "+38761222333" });
  assert.deepEqual(calls[2].body, { session_id: "1d9e6a52-3b70-4c18-9f24-6a0e8b5d3c71", code: "975310", number: "+38761222333" });
  assert.equal(byNumber.isAuthenticated, true);
  assert.equal(byNumber.session.type, "store_customer_signed_in_by_phone");
  assert.deepEqual(byNumber.session.signed_in_with, { type: "phone", number: "+38761222333" });
  await assert.rejects(
    async () => byNumber.customer.verify({ code: "975310", email: "patient@example.test", number: "+38761222333" }),
    TypeError,
  );
  assert.equal(calls.length, 3);
});

test("staff read a customer's sessions with their open codes", async (context) => {
  const visitor = {
    id: ids.session,
    store_id: ids.store,
    customer_id: ids.customer,
    type: {
      type: "visitor",
      expires_at: 1_900_000_000_000,
      sign_in_codes: [
        {
          type: "phone",
          number: "+38761222333",
          language: "bs",
          code: { failed_attempts: 1, outgoing_message_id: inviteMessage, issued_at: 1_700_000_000_000, expires_at: 1_700_000_600_000 },
        },
      ],
    },
    status: { type: "active" },
    last_seen_at: 1_700_000_000_000,
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_000,
  };
  const calls = recordFetch(context, () => ({ items: [visitor], cursor: null }));
  const admin = createAdmin({ apiUrl, accountToken });
  const sessions = await admin.customers.findSessions({ store_id: ids.store, customer_id: ids.customer });
  assert.equal(calls[0].path, `/v1/stores/${ids.store}/customers/${ids.customer}/sessions`);
  assert.equal(sessions.items[0].type.type, "visitor");
  assert.equal(sessions.items[0].type.sign_in_codes[0].number, "+38761222333");
  assert.equal(sessions.items[0].type.sign_in_codes[0].code.failed_attempts, 1);
});
