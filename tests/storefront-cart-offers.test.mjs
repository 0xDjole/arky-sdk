import assert from "node:assert/strict";
import test from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { SessionStorage, apiUrl, accessToken, errorResponse, ids, publishableKey, recordFetch, signedInStorage } from "./helpers/arky-fixtures.mjs";

const companyId = "818c5383-222b-4151-b4e0-59d173b0b74c";
const locationId = "ec210872-363d-4823-ae6c-f7cde628d7e1";

function signedIn(options = {}) {
  const storage = signedInStorage();
  const client = createStorefront(publishableKey, { apiUrl, market: "trade-europe", locale: "bs", sessionStorage: storage, ...options });
  assert.equal(client.isAuthenticated, true);
  return { client, storage };
}

function storedValues(storage) {
  return [...storage.values.entries()];
}

test("offer discovery sends exact company and branch ids with its continuation, and no cart credential or caller routing", async (context) => {
  const cursor = "opaque/+ continuation==?";
  const calls = recordFetch(context, (_call, count) => ({ items: [], cursor: count === 1 ? cursor : null }));
  const { client, storage } = signedIn();
  const controller = new AbortController();
  let successCalls = 0;
  const options = {
    signal: controller.signal,
    headers: {
      "X-Arky-Sales-Channel": "trade-desk",
      "X-Arky-Market": "forged-market",
      "X-Arky-Locale": "forged-locale",
      "X-Arky-Publishable-Key": "forged-key",
      Authorization: "Bearer forged-customer",
      "X-Arky-Cart-Token": "private-recovery-token",
    },
    params: { store_id: "forged-store", customer_id: "forged-customer", market_id: "forged-market", cart_token: "private-query-token" },
    onSuccess: () => { successCalls += 1; },
  };
  const params = { company_id: companyId, company_location_id: locationId };
  const before = storedValues(storage);
  const first = await client.eshop.cart.offers(params, options);
  assert.deepEqual(first, { items: [], cursor });
  const next = { ...params, limit: 100, cursor: first.cursor };
  assert.deepEqual(await client.eshop.cart.offers(next, options), { items: [], cursor: null });
  assert.equal(calls.length, 2);
  assert.equal(successCalls, 0);
  assert.deepEqual(params, { company_id: companyId, company_location_id: locationId });
  for (const [index, call] of calls.entries()) {
    assert.equal(call.method, "GET");
    assert.equal(call.path, "/v1/storefront/carts/offers");
    assert.deepEqual(call.query, { company_id: companyId, company_location_id: locationId, ...(index === 1 ? { limit: "100", cursor } : {}) });
    assert.equal(call.body, null);
    assert.equal(call.signal, controller.signal);
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.headers.get("x-arky-market"), "trade-europe");
    assert.equal(call.headers.get("x-arky-locale"), "bs");
    assert.equal(call.headers.get("x-arky-sales-channel"), "trade-desk");
    assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
    assert.equal(call.headers.has("x-arky-cart-token"), false);
  }
  assert.deepEqual(storedValues(storage), before);
});

test("an offer page keeps every returned cart without selecting one or reading another page", async (context) => {
  const page = { items: [{ id: ids.cart }, { id: ids.otherCart }], cursor: "another-opaque-page" };
  const calls = recordFetch(context, () => page);
  const { client, storage } = signedIn();
  const before = storedValues(storage);
  assert.deepEqual(await client.eshop.cart.offers({ company_id: companyId, company_location_id: locationId, limit: 2 }), page);
  assert.equal(calls.length, 1);
  assert.deepEqual(storedValues(storage), before);
  assert.equal(storage.keys("arky:selected-cart:").length, 0);
  assert.equal(calls[0].headers.has("x-arky-sales-channel"), false);
});

test("offer discovery needs exact branch ids and a bounded page size before any request", async (context) => {
  const calls = recordFetch(context, () => {
    throw new Error("Invalid discovery must not make a request");
  });
  const { client } = signedIn();
  const valid = { company_id: companyId, company_location_id: locationId };
  for (const invalid of [
    {},
    { company_id: companyId },
    { company_location_id: locationId },
    { ...valid, company_id: "selected" },
    { ...valid, company_location_id: "default" },
    { ...valid, company_id: companyId.toUpperCase() },
    ...[0, 101, -1, 1.5, "25"].map((limit) => ({ ...valid, limit })),
  ]) {
    await assert.rejects(client.eshop.cart.offers(invalid), TypeError);
  }
  assert.equal(calls.length, 0);
});

for (const status of [403, 409, 503]) {
  test(`a ${status} offer read keeps the selected cart and never falls back to creating one`, async (context) => {
    const calls = recordFetch(context, () => errorResponse(status, "CART.OFFERS_UNAVAILABLE", "Offer discovery unavailable"));
    const storage = new SessionStorage(signedInStorage().initial);
    storage.setItem("arky:selected-cart:retained", JSON.stringify({ version: 3, id: ids.cart }));
    const client = createStorefront(publishableKey, { apiUrl, sessionStorage: storage });
    const before = storedValues(storage);
    await assert.rejects(client.eshop.cart.offers({ company_id: companyId, company_location_id: locationId }), (error) => error.statusCode === status);
    assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["GET", "/v1/storefront/carts/offers"]]);
    assert.deepEqual(storedValues(storage), before);
  });
}
