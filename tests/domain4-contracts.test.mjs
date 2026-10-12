import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { publishableKey, recordFetch, ids, visitorSession, storedSession, SessionStorage, errorResponse } from "./helpers/arky-fixtures.mjs";

const storeId = "ab73eb42-89fd-4cbf-a1fd-fb84e6d78590";
const customerId = "63ebda09-b0da-40c7-85ee-4ad9f2310c30";
const sessionId = "ce6ebdd2-cc85-4e54-81fe-df0cb14d9339";
const emailId = "3175e0eb-0ceb-47e7-a7a8-081c14cce3b1";
const keyId = "912d27b1-2ed8-4a82-a2f1-318a45e31694";

function customer() {
  return { id: customerId, store_id: storeId, type: { type: "anonymous" }, profile: [], created_at: 1, updated_at: 1 };
}

function issued() {
  return { customer: customer(), session: { type: "visitor", id: sessionId, customer_id: customerId, token: "customer_visitor_domain4", status: { type: "active" }, expires_at: 9000000000000 } };
}

test("store API keys carry typed scope and retain caller identity on retries", async (context) => {
  const key = { id: keyId, store_id: storeId, name: "Backend", type: { type: "secret", token_hint: "secret", permissions: [], created_by: { account_id: customerId, snapshot: { email: "operator@example.test", credential_type: { type: "session" } } }, expires_at: null }, status: { type: "active" }, created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, (_call, count) => count === 1 ? { type: "created", key, value: "secret-value" } : { type: "existing", key });
  const admin = createAdmin({ baseUrl: "https://api.example.test", secretKey: "secret" });
  const input = { store_id: storeId, id: keyId, name: "Backend", type: { type: "secret", permissions: [], expires_at: null } };
  assert.equal((await admin.store.apiKey.create(input)).value, "secret-value");
  assert.deepEqual(await admin.store.apiKey.create(input), { type: "existing", key });
  for (const call of calls) {
    assert.equal(call.path, `/v1/stores/${storeId}/api-keys`);
    assert.deepEqual(call.body, { id: keyId, name: "Backend", type: input.type });
  }
  assert.equal("apiToken" in admin.account, false);
  assert.equal("storefrontKey" in admin.store, false);
});

test("visitor identity and code sends use caller-picked UUIDs without exposing staff blocks", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("request-code") ? { customer: customer(), session: { id: sessionId, customer_id: customerId }, email_verification: { issued_at: 1, expires_at: 600001 } } : issued());
  const memory = new Map();
  const client = createStorefront(publishableKey, { apiUrl: "https://api.example.test", locale: "en", sessionStorage: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) }, visitorIdentity: { customer_id: customerId, session_id: sessionId } });
  await client.customer.identify({ customer_id: customerId, session_id: sessionId });
  await client.customer.requestCode({ id: emailId, email: "buyer@example.test", language: "en" });
  assert.deepEqual(calls.map((call) => call.body), [{ customer_id: customerId, session_id: sessionId }, { id: emailId, email: "buyer@example.test", language: "en" }]);
  assert.equal("blocks" in client.session.customer, false);
  assert.equal(calls[1].headers.get("X-Arky-Locale"), "en");
});


test("expired Visitor replacement keeps the application-picked pair after a lost response", async (context) => {
  const prior = visitorSession(ids.customer, ids.session, "customer_visitor_expired");
  let picks = 0;
  let attempts = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/identify")) {
      attempts++;
      if (attempts === 1) throw new TypeError("Lost response");
      return issued();
    }
    if (call.headers.get("authorization") === `Bearer ${prior.token}`) return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Visitor expired");
    return { customer: customer(), session: { id: sessionId, customer_id: customerId } };
  });
  const client = createStorefront(publishableKey, {
    apiUrl: "https://api.example.test",
    sessionStorage: new SessionStorage(storedSession(ids.customer, prior)),
    createVisitorIdentity: () => { picks++; return { customer_id: customerId, session_id: sessionId }; },
  });
  await assert.rejects(client.customer.getMe(), /Lost response/);
  await Promise.all([client.customer.getMe(), client.customer.getMe()]);
  assert.equal(picks, 1);
  assert.equal(attempts, 2);
  const identities = calls.filter((call) => call.path.endsWith("/identify"));
  assert.deepEqual(identities.map((call) => call.body), [
    { customer_id: customerId, session_id: sessionId },
    { customer_id: customerId, session_id: sessionId },
  ]);
  assert.ok(identities.every((call) => call.headers.get("authorization") === null));
  assert.equal(client.session.id, sessionId);
});

test("API-key discovery keeps the sales channel filter with native continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const admin = createAdmin({ baseUrl: "https://api.example.test", secretKey: "secret" });
  await admin.store.apiKey.find({ store_id: storeId, sales_channel_id: keyId, cursor: "native-next", limit: 20 });
  assert.deepEqual(calls.map(({ method, path, query }) => ({ method, path, query })), [{ method: "GET", path: `/v1/stores/${storeId}/api-keys`, query: { sales_channel_id: keyId, cursor: "native-next", limit: "20" } }]);
});
