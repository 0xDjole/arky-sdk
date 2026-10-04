import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createStorefront } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const savedFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = savedFetch; });

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"a".repeat(42)}A`;
const companyId = "818c5383-222b-4151-b4e0-59d173b0b74c";
const locationId = "ec210872-363d-4823-ae6c-f7cde628d7e1";
const customerId = "08de0280-b1d0-4d10-8e9d-23268275c849";
const authorization = "customer_access_prepared_discovery";

function setup(respond) {
  const storage = storefrontSessionStorage(JSON.stringify({
    version: 2,
    customer: { id: customerId, status: { type: "active" }, categories: [], created_at: 1, updated_at: 1 },
    session: {
      id: "prepared-discovery-session", customer_id: customerId, type: "email_authenticated",
      status: { type: "active" }, identity_id: "prepared-discovery-identity",
      access_token: authorization, refresh_token: "customer_refresh_prepared_discovery",
      access_expires_at: 1900000000000, refresh_expires_at: 1900000001000, authenticated_at: 1,
    },
  }));
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const call = { url: new URL(url), method: init.method, body: init.body, headers: new Headers(init.headers), signal: init.signal };
    calls.push(call);
    return respond(call, calls.length);
  };
  const client = createStorefront(publishableKey, { apiUrl, market: "trade-europe", locale: "bs", sessionStorage: storage });
  assert.equal(client.isAuthenticated, true);
  return { client, calls, storage };
}

test("prepared Cart discovery preserves exact scoped wire input and an empty page continuation", async () => {
  const cursor = "opaque/+ continuation==?";
  const { client, calls, storage } = setup((_call, count) => Response.json({ items: [], cursor: count === 1 ? cursor : null }));
  const controller = new AbortController();
  let successCalls = 0;
  const options = {
    signal: controller.signal,
    headers: {
      "X-Arky-Sales-Channel": "trade-desk",
      "X-Arky-Market": "forged-market", "X-Arky-Locale": "forged-locale",
      "X-Arky-Publishable-Key": "forged-key", Authorization: "Bearer forged-customer",
      "X-Arky-Cart-Token": "private-recovery-token",
    },
    params: { store_id: "forged-store", customer_id: "forged-customer", market_id: "forged-market", cart_token: "private-query-token" },
    onSuccess: () => { successCalls += 1; },
  };
  const params = { company_id: companyId, company_location_id: locationId };
  const before = [...storage.values];
  const first = await client.eshop.cart.prepared(params, options);
  assert.deepEqual(first, { items: [], cursor });
  assert.equal(successCalls, 0);
  assert.equal(calls.length, 1);
  assert.deepEqual([...storage.values], before);
  const next = { ...params, limit: 100, cursor: first.cursor };
  assert.deepEqual(await client.eshop.cart.prepared(next, options), { items: [], cursor: null });
  assert.equal(calls.length, 2);
  assert.equal(successCalls, 0);
  assert.deepEqual(params, { company_id: companyId, company_location_id: locationId });
  assert.deepEqual(next, { ...params, limit: 100, cursor });
  for (const [index, call] of calls.entries()) {
    assert.equal(call.method, "GET");
    assert.equal(call.url.pathname, "/v1/storefront/carts/prepared");
    assert.deepEqual(Object.fromEntries(call.url.searchParams), {
      company_id: companyId, company_location_id: locationId,
      ...(index === 1 ? { limit: "100", cursor } : {}),
    });
    assert.equal(call.body, undefined);
    assert.equal(call.signal, controller.signal);
    assert.equal(call.headers.get("X-Arky-Publishable-Key"), publishableKey);
    assert.equal(call.headers.get("X-Arky-Market"), "trade-europe");
    assert.equal(call.headers.get("X-Arky-Locale"), "bs");
    assert.equal(call.headers.get("X-Arky-Sales-Channel"), "trade-desk");
    assert.equal(call.headers.get("Authorization"), `Bearer ${authorization}`);
    assert.equal(call.headers.has("X-Arky-Cart-Token"), false);
  }
  assert.deepEqual([...storage.values], before);
});

test("prepared Cart pages retain multiple returned references without selecting a Cart or fetching another page", async () => {
  const page = {
    items: [{ id: "9216a708-f506-40a6-9b25-49d5e8e45f1a" }, { id: "ce285f84-983f-4974-96ce-958bc6ed44a2" }],
    cursor: "another-opaque-page",
  };
  const { client, calls, storage } = setup(() => Response.json(page));
  const before = [...storage.values];
  assert.deepEqual(await client.eshop.cart.prepared({ company_id: companyId, company_location_id: locationId, limit: 2 }), page);
  assert.equal(calls.length, 1);
  assert.deepEqual([...storage.values], before);
  assert.equal(calls[0].headers.has("X-Arky-Sales-Channel"), false);
});

test("prepared Cart discovery requires explicit branch identities and bounded page arguments before any request", async () => {
  const { client, calls } = setup(() => { throw new Error("Invalid discovery must not make a request"); });
  const valid = { company_id: companyId, company_location_id: locationId };
  for (const invalid of [
    {}, { company_id: companyId }, { company_location_id: locationId },
    { ...valid, company_id: "selected" }, { ...valid, company_location_id: "default" },
    { ...valid, company_id: companyId.toUpperCase() },
    ...[0, 101, -1, 1.5, null, "25"].map((limit) => ({ ...valid, limit })),
    ...["", null, 1, "x".repeat(2049), "é".repeat(1025)].map((cursor) => ({ ...valid, cursor })),
  ]) {
    await assert.rejects(client.eshop.cart.prepared(invalid), TypeError);
  }
  assert.equal(calls.length, 0);
});

for (const status of [403, 409, 503]) {
  test(`prepared Cart ${status} preserves the selected Cart and never falls back to creation`, async () => {
    const { client, calls, storage } = setup(() => Response.json({ message: "Prepared Cart discovery unavailable" }, { status }));
    storage.setItem("arky:selected-cart:retained", JSON.stringify({ version: 1, id: "existing-cart", market_id: "trade-market" }));
    const before = [...storage.values];
    await assert.rejects(
      client.eshop.cart.prepared({ company_id: companyId, company_location_id: locationId }),
      (error) => error.statusCode === status,
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "GET");
    assert.equal(calls[0].url.pathname, "/v1/storefront/carts/prepared");
    assert.deepEqual([...storage.values], before);
  });
}
