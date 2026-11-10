import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  idFactories,
  ids,
  installGlobal,
  SessionStorage,
  storefrontIdentity,
  recordFetch,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

function storefront() {
  return createStorefront(storefrontIdentity, { ...idFactories, apiUrl, locale: "en", market: "bih", sessionStorage: visitorStorage() });
}

test("a_token_client_reports_no_session_changes", async (context) => {
  const storage = new SessionStorage();
  const storageKey = `arky_admin_session:${apiUrl}`;
  storage.setItem(storageKey, JSON.stringify({ id: ids.session, access_token: "held-access", refresh_token: "held-refresh" }));
  const browser = Object.assign(new EventTarget(), { localStorage: storage });
  installGlobal(context, "window", browser);
  const calls = recordFetch(context, () => ({ id: ids.account }));
  const accountToken = `arky_at_${"a".repeat(42)}A`;
  const client = createAdmin({ apiUrl, accountToken });
  const sessions = [];
  const unsubscribe = client.onAuthStateChanged((session) => sessions.push(session));
  await Promise.resolve();
  storage.removeItem(storageKey);
  browser.dispatchEvent(Object.assign(new Event("storage"), { storageArea: storage, key: storageKey }));
  browser.dispatchEvent(Object.assign(new Event("arky-admin-session-changed"), { detail: storageKey }));
  await client.account.getMe();
  assert.equal(client.session, null);
  assert.equal(client.isAuthenticated, true);
  assert.deepEqual(sessions, []);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${accountToken}`);
  unsubscribe();
});

test("a per-call locale and market change one request's headers on the same session", async (context) => {
  const calls = recordFetch(context, (call) => (call.path === "/v1/storefront/customer/me" ? { customer: {}, session: {} } : { items: [], cursor: null }));
  const client = storefront();
  await client.eshop.packageItem.find({ package_id: ids.package, limit: 1 }, { locale: "it" });
  await client.eshop.packageItem.find({ package_id: ids.package, limit: 1 }, { locale: "it", market: "ita" });
  await client.content.entry.find({ collection_id: ids.form, limit: 1 });
  assert.deepEqual(
    calls.map((call) => [call.headers.get("x-arky-locale"), call.headers.get("x-arky-market")]),
    [
      ["it", "bih"],
      ["it", "ita"],
      ["en", "bih"],
    ],
  );
  assert.equal(client.getLocale(), "en");
  assert.equal(client.getMarket(), "bih");
  assert.equal(calls.some((call) => call.path.endsWith("/customer/identify")), false);
});

test("per-call context is checked, refused on cart calls and refused by Admin", async (context) => {
  const calls = recordFetch(context, () => cartRecord());
  const client = storefront();
  await assert.rejects(client.eshop.packageItem.find({ package_id: ids.package }, { locale: "  " }), /per-call locale/);
  await assert.rejects(client.eshop.packageItem.find({ package_id: ids.package }, { market: "Not A Key" }), /market/);
  await assert.rejects(client.eshop.cart.get({ id: ids.cart }, { market: "ita" }), /storefront's market/);
  await assert.rejects(
    client.eshop.cart.create({ id: ids.cart, buyer: { type: "customer" }, package_id: ids.package }, { market: "ita" }),
    /storefront's market/,
  );
  const cart = await client.eshop.cart.get({ id: ids.cart }, { locale: "it" });
  assert.equal(cart.id, ids.cart);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.get("x-arky-locale"), "it");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await assert.rejects(admin.account.getMe({ locale: "it" }), /storefront request option/);
  assert.equal(calls.length, 1);
});

test("the store has no withContext: content in another language is a per-call locale", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const store = initialize(storefrontIdentity, { ...idFactories, apiUrl, locale: "it", sessionStorage: visitorStorage() });
  assert.equal("withContext" in store, false);
  assert.equal("withContext" in store.client, false);
  await store.content.entry.find({ collection_id: ids.form, limit: 1 }, { locale: "en" });
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
  assert.equal(store.getLocale(), "it");
  const cart = store.eshop.cart({ buyer: { type: "customer" }, package_id: ids.package });
  cart.cart.set(cartRecord());
  await assert.rejects(cart.quote({}, { locale: "en" }), /store's locale and market/);
  await assert.rejects(cart.quote({ locale: "en" }), /request options come second/);
  assert.equal(calls.length, 1);
});

test("a_failed_storefront_logout_reports_unconfirmed", async (context) => {
  let answer = () => {
    throw new TypeError("Lost response");
  };
  const calls = recordFetch(context, () => answer());
  const lost = storefront();
  assert.deepEqual(await lost.customer.logout(), { type: "unconfirmed", session_id: ids.session });
  assert.equal(lost.session, null);
  for (const [status, error] of [[503, "GENERAL.SERVICE_UNAVAILABLE"], [401, "GENERAL.UNAUTHENTICATED"]]) {
    answer = () => Response.json({ message: "Refused", error, status_code: status, validation_errors: [] }, { status });
    const refused = storefront();
    assert.deepEqual(await refused.customer.logout(), { type: "unconfirmed", session_id: ids.session }, String(status));
    assert.equal(refused.session, null, String(status));
  }
  answer = () => new Response(null, { status: 204 });
  const confirmed = storefront();
  assert.deepEqual(await confirmed.customer.logout(), { type: "revoked", session_id: ids.session });
  assert.deepEqual(await confirmed.customer.logout(), { type: "local_only" });
  assert.deepEqual(calls.map((call) => call.path), Array(4).fill("/v1/storefront/customer/logout"));
});
