import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, errorResponse, idFactories, publishableKey, recordFetch, SessionStorage, signedInStorage } from "./helpers/arky-fixtures.mjs";

const storeId = "4f2a9c61-7e3b-4d85-a0c9-1b6e8d3f5a27";
const broadcastId = "6e2b9d41-3c58-4a07-9f1e-2d7c5b0a8e63";
const testId = "1a5c8e27-4b39-4d60-a2f7-9e3d0c6b5a18";
const groupId = "2d8f4b16-9c37-4e05-a1b8-6f3d0c2e7a94";
const email = {
  email_template_id: "3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f",
  sending_address_id: "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a",
  from_name: "Shop News",
  reply_to: { type: "external", email: "hello@example.test" },
};
const audience = { include: [{ type: "customer_group", customer_group_id: groupId }], exclude: [], conditions: [{ type: "ordered_within", days: 30 }] };

function broadcasts() {
  return createAdmin({ apiUrl: "https://broadcasts.test", secretKey: "arky_api_broadcasts" }).broadcast;
}

test("a broadcast names its audience and one email selection, and preview and test name only a language", async (context) => {
  const preview = { language: "en", subject: "Spring box", html: "<p>Hello</p>", text: "Hello" };
  const calls = recordFetch(context, (call) => call.path.endsWith("/preview") ? preview : { id: broadcastId });
  const api = broadcasts();
  await api.create({ store_id: storeId, id: broadcastId, key: "spring", audience, email });
  await api.update({ store_id: storeId, id: broadcastId, expected_updated_at: 1, email: { ...email, from_name: "Shop" } });
  assert.deepEqual(await api.preview({ store_id: storeId, id: broadcastId, language: "en" }), preview);
  await api.test({ store_id: storeId, id: broadcastId, outgoing_email_id: testId, language: "bs" });
  const base = `/v1/stores/${storeId}/broadcasts`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", base, { id: broadcastId, key: "spring", audience, email }],
    ["PUT", `${base}/${broadcastId}`, { expected_updated_at: 1, email: { ...email, from_name: "Shop" } }],
    ["POST", `${base}/${broadcastId}/preview`, { language: "en" }],
    ["POST", `${base}/${broadcastId}/test`, { id: testId, language: "bs" }],
  ]);
  for (const removed of ["sending_address_id", "content"]) assert.equal(removed in calls[0].body, false, removed);
});

test("a scheduled broadcast carries the content frozen when it was scheduled, and a draft carries none", async (context) => {
  const content = {
    default_language: "en",
    translations: { en: { subject: "Spring box", preheader: null, html: "<p>Hello {{customer.email}}</p>", text: "Hello" } },
    layout: { en: { html: "<main>{{{body}}}</main>", text: "{{body}}" } },
    logo_media_id: null,
  };
  const draft = { id: broadcastId, store_id: storeId, key: "spring", audience, email, status: { type: "draft" }, created_at: 1, updated_at: 1 };
  const scheduled = { ...draft, status: { type: "scheduled", send_at: 1_900_000_000_000, content }, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.path.endsWith("/schedule") ? scheduled : draft);
  const api = broadcasts();
  assert.deepEqual((await api.get({ store_id: storeId, id: broadcastId })).status, { type: "draft" });
  const read = await api.schedule({ store_id: storeId, id: broadcastId, expected_updated_at: 1, send_at: 1_900_000_000_000 });
  assert.deepEqual(read.status.content, content);
  assert.equal("content" in read, false);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/stores/${storeId}/broadcasts/${broadcastId}`, null],
    ["POST", `/v1/stores/${storeId}/broadcasts/${broadcastId}/schedule`, { expected_updated_at: 1, send_at: 1_900_000_000_000 }],
  ]);
});

test("the store's own unsubscribe page posts the one-click form with the email's token through the publishable key and no customer session, even while a customer is signed in", async (context) => {
  const calls = recordFetch(context, () => ({ result: "unsubscribed" }));
  const tokens = ["v1.store/one+reader=", "v1.store/two+reader="];
  const storefront = createStorefront(publishableKey, { ...idFactories, apiUrl, locale: "bs", sessionStorage: signedInStorage() });
  const store = initialize(publishableKey, { ...idFactories, apiUrl, locale: "bs", sessionStorage: signedInStorage() });
  assert.equal(storefront.isAuthenticated, true);
  assert.equal(store.isAuthenticated, true);
  assert.deepEqual(await storefront.broadcast.unsubscribe({ token: tokens[0] }), { result: "unsubscribed" });
  assert.deepEqual(await store.broadcast.unsubscribe({ token: tokens[1] }), { result: "unsubscribed" });
  assert.equal(calls.length, 2);
  calls.forEach((call, index) => {
    assert.equal(call.method, "POST");
    assert.equal(call.path, "/v1/broadcasts/unsubscribe");
    assert.deepEqual(call.query, { token: tokens[index] });
    assert.equal(call.url.search, `?token=${encodeURIComponent(tokens[index])}`);
    assert.equal(call.headers.get("content-type"), "application/x-www-form-urlencoded");
    assert.equal(call.body, "List-Unsubscribe=One-Click");
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.headers.has("authorization"), false);
  });
  assert.deepEqual(Object.keys(storefront.broadcast), ["unsubscribe"]);
  assert.deepEqual(Object.keys(store.broadcast), ["unsubscribe"]);
});

test("an unsubscribe with a token the Server can't read comes back as its refusal", async (context) => {
  const calls = recordFetch(context, () => errorResponse(404, "GENERAL.NOT_FOUND", "Not found"));
  const storefront = createStorefront(publishableKey, { ...idFactories, apiUrl, sessionStorage: new SessionStorage() });
  await assert.rejects(storefront.broadcast.unsubscribe({ token: "unreadable" }), (error) => error.statusCode === 404 && error.code === "GENERAL.NOT_FOUND");
  assert.equal(calls.length, 1);
});
