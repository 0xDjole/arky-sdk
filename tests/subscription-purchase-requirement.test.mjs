import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const subscriptionId = "d65211c1-743f-45fb-ab24-07221b1e3a7c";

test("effective minimum reads preserve the owning response and explicit or native-now instant", async context => {
  const calls = [];
  const result = { subscription: { id: subscriptionId, store_id: storeId, updated_at: 1700000000000 }, company_id: subscriptionId, company_location_id: storeId, starts_at: 1690000000000, ends_at: null, evaluated_at: 1700000000123, initial: null, current: null };
  context.mock.method(globalThis, "fetch", async (input, options) => {
    calls.push({ url: new URL(input.toString()), method: options.method, body: options.body, headers: new Headers(options.headers), signal: options.signal });
    return Response.json(result);
  });
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract" });
  const signal = new AbortController().signal;
  const input = { store_id: storeId, id: subscriptionId, at: 1700000000123 };
  assert.deepEqual(await api.eshop.subscription.purchaseRequirement(input, { signal, headers: { "x-read-trace": "effective-rule" } }), result);
  assert.deepEqual(input, { store_id: storeId, id: subscriptionId, at: 1700000000123 });
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/subscriptions/${subscriptionId}/purchase-requirement`);
  assert.equal(calls[0].url.searchParams.get("at"), "1700000000123");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[0].headers.get("x-read-trace"), "effective-rule");
  assert.deepEqual(await api.eshop.subscription.purchaseRequirement({ store_id: storeId, id: subscriptionId }), result);
  assert.equal(calls[1].url.search, "");
  for (const at of [-9007199254740991, 9007199254740991]) {
    await api.eshop.subscription.purchaseRequirement({ store_id: storeId, id: subscriptionId, at });
    assert.equal(calls.at(-1).url.searchParams.get("at"), String(at));
  }
  const count = calls.length;
  for (const at of [null, "1700000000123", 0.5, NaN, Infinity, 9007199254740992]) await assert.rejects(async () => api.eshop.subscription.purchaseRequirement({ store_id: storeId, id: subscriptionId, at }), RangeError);
  await assert.rejects(async () => api.eshop.subscription.purchaseRequirement({ id: subscriptionId }), TypeError);
  assert.equal(calls.length, count);
});
