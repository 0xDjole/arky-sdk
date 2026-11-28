import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { factoryOrderToken, idFactories, storefrontIdentity, recordFetch, ids, visitorSession, storedSession, SessionStorage, errorResponse } from "./helpers/arky-fixtures.mjs";

const tenantId = "ab73eb42-89fd-4cbf-a1fd-fb84e6d78590";
const userId = "63ebda09-b0da-40c7-85ee-4ad9f2310c30";
const sessionId = "ce6ebdd2-cc85-4e54-81fe-df0cb14d9339";
const emailId = "3175e0eb-0ceb-47e7-a7a8-081c14cce3b1";

function user() {
  return {
    id: userId,
    tenant_id: tenantId,
    links: [],
    name: null,
    contacts: [],
    addresses: [],
    default_shipping_address_id: null,
    default_billing_address_id: null,
    profile: [],
    created_at: 1,
    updated_at: 1,
  };
}

function issued() {
  return { user: user(), session: { type: "visitor", id: sessionId, user_id: userId, token: "user_visitor_domain4", status: { type: "active" }, expires_at: 9000000000000 } };
}





test("visitor identity and code sends use caller-picked UUIDs without exposing staff blocks", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("request-code") ? { user: user(), session: { id: sessionId, tenant_id: tenantId, user_id: userId }, code: { issued_at: 1, expires_at: 600001 } } : issued());
  const memory = new Map();
  const client = createStorefront(storefrontIdentity, { ...idFactories, apiUrl: "https://api.example.test", locale: "en", sessionStorage: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) }, visitorIdentity: { user_id: userId, session_id: sessionId } });
  await client.user.identify({ user_id: userId, session_id: sessionId });
  await client.user.requestCode({ id: emailId, contact: { type: "email", email: "buyer@example.test", language: "en" } });
  assert.deepEqual(calls.map((call) => call.body), [{ user_id: userId, session_id: sessionId }, { id: emailId, contact: { type: "email", email: "buyer@example.test", language: "en" } }]);
  assert.equal("blocks" in client.session.user, false);
  assert.equal(calls[1].headers.get("X-Arky-Locale"), "en");
});


test("expired Visitor replacement keeps the application-picked pair after a lost response", async (context) => {
  const prior = visitorSession(ids.user, ids.session, "user_visitor_expired");
  let picks = 0;
  let attempts = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path.endsWith("/identify")) {
      attempts++;
      if (attempts === 1) throw new TypeError("Lost response");
      return issued();
    }
    if (call.headers.get("authorization") === `Bearer ${prior.token}`) return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Visitor expired");
    return { user: user(), session: { id: sessionId, tenant_id: tenantId, user_id: userId } };
  });
  const client = createStorefront(storefrontIdentity, {
    apiUrl: "https://api.example.test",
    sessionStorage: new SessionStorage(storedSession(ids.user, prior)),
    createVisitorIdentity: () => { picks++; return { user_id: userId, session_id: sessionId }; },
    createSessionId: () => ids.otherSession,
    createId: () => ids.submission,
    createOrderToken: () => factoryOrderToken,
  });
  await assert.rejects(client.user.getMe(), /Lost response/);
  assert.equal(await client.user.getMe(), null);
  await Promise.all([
    client.user.updateMe({ expected_updated_at: 1, profile: [] }),
    client.user.updateMe({ expected_updated_at: 1, profile: [] }),
  ]);
  assert.equal(picks, 1);
  assert.equal(attempts, 2);
  const identities = calls.filter((call) => call.path.endsWith("/identify"));
  assert.deepEqual(identities.map((call) => call.body), [
    { user_id: userId, session_id: sessionId },
    { user_id: userId, session_id: sessionId },
  ]);
  assert.ok(identities.every((call) => call.headers.get("authorization") === null));
  assert.equal(client.session.id, sessionId);
});



test("a refused first identify picks new visitor ids and the request goes on", async (context) => {
  const firstPair = { user_id: "0b1c2d3e-4f50-4a61-8b72-9c83d4e5f601", session_id: "1c2d3e4f-5061-4b72-8c83-9d94e5f60712" };
  const secondPair = { user_id: "2d3e4f50-6172-4c83-9d94-aea5f6071823", session_id: "3e4f5061-7283-4d94-aea5-bfb607182934" };
  const picks = [firstPair, secondPair];
  let picked = 0;
  const answeredUser = { ...user(), id: secondPair.user_id };
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/user/identify") {
      if (call.body.user_id === firstPair.user_id) return errorResponse(409, "GENERAL.CONFLICT", "Conflict");
      return { user: answeredUser, session: { type: "visitor", id: secondPair.session_id, user_id: secondPair.user_id, token: "user_visitor_second", status: { type: "active" }, expires_at: 9000000000000 } };
    }
    if (call.path === "/v1/storefront/user/me") {
      return { user: answeredUser, session: { id: secondPair.session_id, tenant_id: tenantId, user_id: secondPair.user_id } };
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const memory = new Map();
  const client = createStorefront(storefrontIdentity, {
    ...idFactories,
    createVisitorIdentity: () => picks[picked++],
    apiUrl: "https://api.example.test",
    locale: "en",
    sessionStorage: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) },
  });
  const me = await client.user.updateMe({ expected_updated_at: 1, profile: [] });
  assert.equal(me.user.id, secondPair.user_id);
  const identifies = calls.filter((call) => call.path === "/v1/storefront/user/identify");
  assert.deepEqual(identifies.map((call) => call.body), [firstPair, secondPair]);
  assert.equal(picked, 2);
  assert.equal(calls.at(-1).path, "/v1/storefront/user/me");
});

test("a_storefront_request_names_its_tenant_and_channel", async (context) => {
  const calls = recordFetch(context, () => ({ name: "Tenant", timezone: "UTC", languages: ["en"], payment_options: [] }));
  const client = createStorefront(storefrontIdentity, idFactories);
  await client.getSetup();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.get("x-arky-tenant-id"), storefrontIdentity.tenantId);
  assert.equal(calls[0].headers.get("x-arky-sales-channel-id"), storefrontIdentity.salesChannelId);
  assert.equal(calls[0].headers.has("x-arky-publishable-key"), false);
  assert.equal(calls[0].headers.has("x-api-key"), false);
  assert.equal(calls[0].headers.has("authorization"), false);
  assert.equal("apiKey" in createAdmin({ apiUrl: "https://api.example.test" }).tenant, false);
});

for (const status of [400, 401, 403, 404, 409, 422]) {
  test(`a definite identify refusal ${status} replaces the durable pair before reload`, async (context) => {
    const first = { user_id: ids.user, session_id: ids.session };
    const replacement = { user_id: ids.otherUser, session_id: ids.otherSession };
    let retained = first;
    let picks = 0;
    const calls = recordFetch(context, () => errorResponse(status, "USER.IDENTIFY_REFUSED", "Refused"));
    const options = {
      ...idFactories, apiUrl: "https://api.example.test", sessionStorage: new SessionStorage(),
      visitorIdentity: retained,
      createVisitorIdentity: () => { picks++; retained = replacement; return replacement; },
    };
    const client = createStorefront(storefrontIdentity, options);
    await assert.rejects(client.user.identify(), (error) => error.statusCode === status);
    assert.equal(picks, 1);
    assert.deepEqual(retained, replacement);
    const reloaded = createStorefront(storefrontIdentity, { ...options, visitorIdentity: retained });
    await assert.rejects(reloaded.user.identify(), (error) => error.statusCode === status);
    assert.deepEqual(calls.map((call) => call.body), [first, replacement]);
  });
}

for (const status of [408, 429, 500, 503]) {
  test(`an ambiguous identify response ${status} retains the same pair`, async (context) => {
    const pair = { user_id: ids.user, session_id: ids.session };
    let picks = 0;
    const calls = recordFetch(context, () => errorResponse(status, "GENERAL.UNAVAILABLE", "Try again"));
    const client = createStorefront(storefrontIdentity, {
      ...idFactories, apiUrl: "https://api.example.test", sessionStorage: new SessionStorage(),
      visitorIdentity: pair, createVisitorIdentity: () => { picks++; return pair; },
    });
    await assert.rejects(client.user.identify());
    await assert.rejects(client.user.identify());
    assert.equal(picks, 0);
    assert.deepEqual(calls.map((call) => call.body), [pair, pair]);
  });
}
