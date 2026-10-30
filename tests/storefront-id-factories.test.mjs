import assert from "node:assert/strict";
import test from "node:test";

import { ArkyApiError, ArkyNetworkError, createStorefront, initialize, isDefiniteRefusal } from "../dist/storefront.js";
import {
  accessToken,
  apiUrl,
  customerRecord,
  emailSession,
  errorResponse,
  idFactories,
  ids,
  jsonResponse,
  publishableKey,
  recordFetch,
  refreshToken,
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

test("a signed-in session that Arky refuses to refresh is cleared and reported as a sign-out", async (context) => {
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

test("only Arky's own refusal of the automatic refresh signs the shopper out; a lost answer, a 429 or a 503 keeps the session and fails the request with that error", async (context) => {
  const codes = { 401: "GENERAL.UNAUTHENTICATED", 403: "GENERAL.UNAUTHORIZED", 429: "GENERAL.RATE_LIMITED", 503: "GENERAL.SERVICE_UNAVAILABLE" };
  let status;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/me") return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Access expired");
    if (call.path !== "/v1/storefront/customer/refresh") throw new Error(`Unexpected request: ${call.path}`);
    if (status === "network") throw new TypeError("Network unavailable");
    return errorResponse(status, codes[status], "Refresh failed");
  });
  for (status of [401, 403, 429, 503, "network"]) {
    const label = String(status);
    const storage = signedInStorage();
    const retained = storage.initial;
    const client = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: storage });
    const reported = [];
    const unsubscribe = client.onAuthStateChanged((session) => reported.push(session));
    const sent = calls.length;
    const error = await client.customer.getMe().catch((caught) => caught);
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(calls.slice(sent).map((call) => [call.path, call.headers.get("authorization"), call.body]), [
      ["/v1/storefront/customer/me", `Bearer ${accessToken}`, null],
      ["/v1/storefront/customer/refresh", null, { session_id: ids.otherSession, refresh_token: refreshToken }],
    ], label);
    if (status === 401 || status === 403) {
      assert.ok(error instanceof ArkyApiError, label);
      assert.equal(error.statusCode, 401, label);
      assert.equal(error.message, "Access expired", label);
      assert.equal(client.isAuthenticated, false, label);
      assert.equal(client.session, null, label);
      assert.equal(storage.initial, null, label);
      assert.equal(reported.at(-1), null, label);
    } else {
      if (status === "network") {
        assert.ok(error instanceof ArkyNetworkError, label);
        assert.equal(error.code, "network", label);
      } else {
        assert.ok(error instanceof ArkyApiError, label);
        assert.equal(error.statusCode, status, label);
        assert.equal(error.code, codes[status], label);
      }
      assert.equal(isDefiniteRefusal(error), false, label);
      assert.equal(client.isAuthenticated, true, label);
      assert.equal(client.session.id, ids.session, label);
      assert.equal(storage.initial, retained, label);
      assert.equal(reported.some((session) => session === null), false, label);
    }
    assert.deepEqual(storage.keys("arky_customer_session:"), [], label);
    unsubscribe();
  }
});

test("a 401 or 403 that Arky did not send on the automatic refresh keeps the signed-in session", async (context) => {
  const answers = [
    [403, () => new Response("Forbidden", { status: 403, headers: { "content-type": "text/plain" } })],
    [403, () => new Response("<html><title>Attention Required!</title></html>", { status: 403, headers: { "content-type": "text/html" } })],
    [403, () => jsonResponse({ title: "Error 1020: Access denied", status: 403 }, 403)],
    [401, () => new Response(null, { status: 401 })],
  ];
  let answer;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/me") return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Access expired");
    if (call.path === "/v1/storefront/customer/refresh") return answer();
    throw new Error(`Unexpected request: ${call.path}`);
  });
  for (const [status, make] of answers) {
    answer = make;
    const storage = signedInStorage();
    const retained = storage.initial;
    const client = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: storage });
    const reported = [];
    const unsubscribe = client.onAuthStateChanged((session) => reported.push(session));
    await assert.rejects(client.customer.getMe(), (error) => error instanceof ArkyApiError && error.code === "REQUEST_FAILED" && error.statusCode === status);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(client.isAuthenticated, true);
    assert.equal(client.session.id, ids.session);
    assert.equal(storage.initial, retained);
    assert.equal(reported.some((session) => session === null), false);
    unsubscribe();
  }
  assert.deepEqual(calls.map((call) => call.path), answers.flatMap(() => ["/v1/storefront/customer/me", "/v1/storefront/customer/refresh"]));
});

test("a refused automatic refresh can't sign out the session the shopper got while it was pending", async (context) => {
  const rotated = emailSession(ids.customer, "7e2c9b14-5a63-4d80-b1f7-3c8e0a6d2f95", {
    access_token: `customer_access_${"u".repeat(64)}`,
    refresh_token: `customer_refresh_${"w".repeat(64)}`,
  });
  let refreshStarted;
  const started = new Promise((resolve) => {
    refreshStarted = resolve;
  });
  let refuse;
  const refused = new Promise((resolve) => {
    refuse = resolve;
  });
  let refreshes = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/me") return errorResponse(401, "GENERAL.UNAUTHENTICATED", "Access expired");
    if (call.path !== "/v1/storefront/customer/refresh") throw new Error(`Unexpected request: ${call.path}`);
    refreshes += 1;
    if (refreshes === 2) return sessionResult(ids.customer, rotated);
    refreshStarted();
    return refused;
  });
  const storage = signedInStorage();
  const client = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: storage });
  const reported = [];
  client.onAuthStateChanged((session) => reported.push(session));

  const reading = client.customer.getMe();
  await started;
  await client.customer.refresh({ session_id: rotated.id });
  refuse(errorResponse(401, "GENERAL.UNAUTHENTICATED", "Refresh token rejected"));
  await assert.rejects(reading, (error) => error instanceof ArkyApiError && error.message === "Access expired");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(client.isAuthenticated, true);
  assert.equal(client.session.id, rotated.id);
  assert.equal(reported.some((session) => session === null), false);
  const [key] = storage.keys("arky_customer_session:");
  assert.equal(JSON.parse(storage.getItem(key)).session.access_token, rotated.access_token);
  assert.deepEqual(calls.map((call) => [call.path, call.body]), [
    ["/v1/storefront/customer/me", null],
    ["/v1/storefront/customer/refresh", { session_id: ids.otherSession, refresh_token: refreshToken }],
    ["/v1/storefront/customer/refresh", { session_id: rotated.id, refresh_token: refreshToken }],
  ]);
});

test("a 401 that Arky did not send keeps the visitor, and only Arky's own 401 replaces it", async (context) => {
  const proxyAnswers = [
    () => new Response("Unauthorized", { status: 401, headers: { "content-type": "text/plain" } }),
    () => new Response("<html><title>401 Authorization Required</title></html>", { status: 401, headers: { "content-type": "text/html" } }),
    () => jsonResponse({ title: "Unauthorized", status: 401 }, 401),
    () => new Response(null, { status: 401 }),
  ];
  let answer;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") {
      return sessionResult(replacementCustomerId, visitorSession(replacementCustomerId, replacementSessionId, replacementVisitorToken));
    }
    if (call.path !== "/v1/storefront/customer/me") throw new Error(`Unexpected request: ${call.path}`);
    if (call.headers.get("authorization") === `Bearer ${visitorToken}`) return answer();
    return {
      customer: customerRecord(replacementCustomerId),
      session: { ...visitorSession(replacementCustomerId, replacementSessionId, replacementVisitorToken), store_id: ids.store },
      email_unsubscribed: false,
    };
  });
  for (const proxyAnswer of proxyAnswers) {
    const storage = visitorStorage();
    const retained = storage.initial;
    const client = createStorefront(publishableKey, {
      ...idFactories,
      apiUrl,
      sessionStorage: storage,
      createVisitorIdentity: () => ({ customer_id: replacementCustomerId, session_id: replacementSessionId }),
    });
    const reported = [];
    const unsubscribe = client.onAuthStateChanged((session) => reported.push(session));
    const sent = calls.length;

    answer = proxyAnswer;
    await assert.rejects(client.customer.getMe(), (error) => error instanceof ArkyApiError && error.code === "REQUEST_FAILED" && error.statusCode === 401);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(client.hasSession, true);
    assert.equal(client.session.id, ids.session);
    assert.equal(storage.initial, retained);
    assert.equal(reported.some((session) => session === null), false);

    answer = () => errorResponse(401, "GENERAL.UNAUTHENTICATED", "Unauthenticated");
    const me = await client.customer.getMe();
    assert.equal(me.customer.id, replacementCustomerId);
    assert.equal(client.session.id, replacementSessionId);
    const [key] = storage.keys("arky_customer_session:");
    assert.equal(JSON.parse(storage.getItem(key)).session.token, replacementVisitorToken);
    assert.deepEqual(calls.slice(sent).map((call) => [call.path, call.headers.get("authorization"), call.body]), [
      ["/v1/storefront/customer/me", `Bearer ${visitorToken}`, null],
      ["/v1/storefront/customer/me", `Bearer ${visitorToken}`, null],
      ["/v1/storefront/customer/identify", null, { customer_id: replacementCustomerId, session_id: replacementSessionId }],
      ["/v1/storefront/customer/me", `Bearer ${replacementVisitorToken}`, null],
    ]);
    unsubscribe();
  }
});
