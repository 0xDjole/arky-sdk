import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  idFactories,
  ids,
  publishableKey,
  recordFetch,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

function storefront() {
  return createStorefront(publishableKey, { ...idFactories, apiUrl, locale: "en", market: "bih", sessionStorage: visitorStorage() });
}

test("a per-call locale and market change one request's headers on the same session", async (context) => {
  const calls = recordFetch(context, (call) => (call.path === "/v1/storefront/customer/me" ? { customer: {}, session: {} } : { items: [], cursor: null }));
  const client = storefront();
  await client.eshop.product.find({ catalog_id: ids.catalog, limit: 1 }, { locale: "it" });
  await client.eshop.product.find({ catalog_id: ids.catalog, limit: 1 }, { locale: "it", market: "ita" });
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
  await assert.rejects(client.eshop.product.find({ catalog_id: ids.catalog }, { locale: "  " }), /per-call locale/);
  await assert.rejects(client.eshop.product.find({ catalog_id: ids.catalog }, { market: "Not A Key" }), /market/);
  await assert.rejects(client.eshop.cart.get({ id: ids.cart }, { market: "ita" }), /storefront's market/);
  await assert.rejects(
    client.eshop.cart.create({ id: ids.cart, buyer: { type: "customer" }, catalog_id: ids.catalog }, { market: "ita" }),
    /storefront's market/,
  );
  const cart = await client.eshop.cart.get({ id: ids.cart }, { locale: "it" });
  assert.equal(cart.id, ids.cart);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.get("x-arky-locale"), "it");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  const admin = createAdmin({ apiUrl: apiUrl, secretKey: "arky_sk_test" });
  await assert.rejects(admin.account.getMe({ locale: "it" }), /storefront request option/);
  assert.equal(calls.length, 1);
});

test("the store has no withContext: content in another language is a per-call locale", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const store = initialize(publishableKey, { ...idFactories, apiUrl, locale: "it", sessionStorage: visitorStorage() });
  assert.equal("withContext" in store, false);
  assert.equal("withContext" in store.client, false);
  await store.content.entry.find({ collection_id: ids.form, limit: 1 }, { locale: "en" });
  assert.equal(calls[0].headers.get("x-arky-locale"), "en");
  assert.equal(store.getLocale(), "it");
  const cart = store.eshop.cart({ buyer: { type: "customer" }, catalog_id: ids.catalog });
  cart.cart.set(cartRecord());
  await assert.rejects(cart.quote({}, { locale: "en" }), /store's locale and market/);
  await assert.rejects(cart.quote({ locale: "en" }), /request options come second/);
  assert.equal(calls.length, 1);
});
