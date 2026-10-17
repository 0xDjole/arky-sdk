import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl,
  customerRecord,
  emailSession,
  errorResponse,
  idFactories,
  ids,
  publishableKey,
  recordFetch,
  sessionResult,
  signedInStorage,
  visitorSession,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const missingFactories = /createVisitorIdentity, createSessionId, createId and createOrderToken/;
const firstSignInId = "0c4b8e21-7d36-4a95-b1f8-5e2a9c7d3b60";
const secondSignInId = "5d1f9a73-2e48-4c06-8b3d-7a6c0e9f1b24";
const replacementCustomerId = "2a7c4e91-6b35-4d08-9f1e-3c8b5a0d7e62";
const replacementSessionId = "7b3e1d59-4c82-4a6f-a0d7-9e5f2c1b8a43";
const replacementVisitorToken = `customer_visitor_${"n".repeat(64)}`;

test("a storefront without every id factory is refused when it is created", () => {
  const { createVisitorIdentity, createSessionId, createId, createOrderToken } = idFactories;
  for (const options of [
    undefined,
    {},
    { apiUrl, locale: "it", market: "ita" },
    { apiUrl, locale: "en", createVisitorIdentity },
    { apiUrl, locale: "en", createSessionId },
    { apiUrl, visitorIdentity: { customer_id: ids.customer, session_id: ids.session }, createSessionId },
    { apiUrl, createVisitorIdentity, createSessionId },
    { apiUrl, createVisitorIdentity, createSessionId, createId },
    { apiUrl, createVisitorIdentity, createSessionId, createOrderToken },
  ]) {
    assert.throws(() => createStorefront(publishableKey, options), missingFactories);
    assert.throws(() => initialize(publishableKey, options), missingFactories);
  }
  assert.throws(() => createStorefront(publishableKey, { ...idFactories, createSessionId: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), missingFactories);
  assert.throws(() => createStorefront(publishableKey, { ...idFactories, createId: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), missingFactories);
  assert.equal(createStorefront(publishableKey, { ...idFactories, apiUrl }).session, null);
  assert.equal(initialize(publishableKey, { ...idFactories, apiUrl }).session.get(), null);
});

test("verify issues the signed-in session under a new id from createSessionId and keeps it for a retry", async (context) => {
  const picked = [firstSignInId, secondSignInId];
  let verifications = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path !== "/v1/storefront/customer/verify") throw new Error(`Unexpected request: ${call.path}`);
    verifications += 1;
    if (verifications === 1) throw new TypeError("Lost response");
    if (verifications === 2) return errorResponse(400, "GENERAL.BAD_REQUEST", "Invalid or expired verification code");
    return sessionResult(ids.customer, emailSession(ids.customer, call.body.session_id));
  });
  const client = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: visitorStorage(),
    ...idFactories,
    createSessionId: () => picked.shift(),
  });

  await assert.rejects(client.customer.verify({ code: "111111" }), /Lost response/);
  await assert.rejects(client.customer.verify({ code: "111111" }), /Invalid or expired verification code/);
  const verified = await client.customer.verify({ code: "222222" });

  assert.deepEqual(calls.map((call) => [call.headers.get("authorization"), call.body]), [
    [`Bearer ${visitorToken}`, { session_id: firstSignInId, code: "111111" }],
    [`Bearer ${visitorToken}`, { session_id: firstSignInId, code: "111111" }],
    [`Bearer ${visitorToken}`, { session_id: secondSignInId, code: "222222" }],
  ]);
  assert.equal(picked.length, 0);
  assert.equal(calls.some((call) => call.body.session_id === ids.session), false);
  assert.equal(verified.session.id, secondSignInId);
  assert.equal(client.session.id, secondSignInId);
  assert.equal(client.isAuthenticated, true);
});

test("a signed-in session that can't refresh is cleared and reported as a sign-out", async (context) => {
  assert.throws(
    () => createStorefront(publishableKey, { apiUrl, sessionStorage: signedInStorage(), createVisitorIdentity: idFactories.createVisitorIdentity }),
    missingFactories,
  );

  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/refresh") return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Refresh token rejected");
    if (call.path === "/v1/storefront/customer/identify") {
      return sessionResult(replacementCustomerId, visitorSession(replacementCustomerId, replacementSessionId, replacementVisitorToken));
    }
    if (call.path === "/v1/storefront/customer/me") {
      if (call.headers.get("authorization") === `Bearer ${accessToken}`) return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Access expired");
      return {
        customer: customerRecord(replacementCustomerId),
        session: { ...visitorSession(replacementCustomerId, replacementSessionId, replacementVisitorToken), store_id: ids.store },
        email_unsubscribed: false,
      };
    }
    throw new Error(`Unexpected request: ${call.path}`);
  });
  const storage = signedInStorage();
  const client = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: storage,
    ...idFactories,
    createVisitorIdentity: () => ({ customer_id: replacementCustomerId, session_id: replacementSessionId }),
    createSessionId: () => ids.otherSession,
  });
  const reported = [];
  client.onAuthStateChanged((session) => reported.push(session));
  assert.equal(client.isAuthenticated, true);

  await assert.rejects(client.customer.getMe(), (error) => error.statusCode === 401);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(client.session, null);
  assert.equal(client.isAuthenticated, false);
  assert.equal(client.hasSession, false);
  assert.equal(storage.initial, null);
  assert.deepEqual(storage.keys("arky_customer_session:"), []);
  assert.equal(reported.at(-1), null);

  const me = await client.customer.getMe();
  assert.equal(me.customer.id, replacementCustomerId);
  assert.deepEqual(calls.map((call) => [call.path, call.headers.get("authorization"), call.body]), [
    ["/v1/storefront/customer/me", `Bearer ${accessToken}`, null],
    ["/v1/storefront/customer/refresh", null, { session_id: ids.otherSession, refresh_token: emailSession().refresh_token }],
    ["/v1/storefront/customer/identify", null, { customer_id: replacementCustomerId, session_id: replacementSessionId }],
    ["/v1/storefront/customer/me", `Bearer ${replacementVisitorToken}`, null],
  ]);
});
