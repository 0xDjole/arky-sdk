import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "9a4c2e71-5d38-4b06-8f1a-2c7e9b3d5f40";
const OTHER_STORE_ID = "1f6b8d23-4e97-4a50-b2c8-7d0e5a9c3f16";

function paymentOptions() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).store.paymentOption;
}

test("Monri creation sends the app-picked id and explicit credentials once to the named store and returns the safe record", async (context) => {
  let failure = null;
  const result = { id: ids.paymentOption, store_id: STORE_ID, key: "cards", blocks: [], status: "disabled", type: { type: "monri", environment: "test" }, created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, () => failure ? errorResponse(failure) : result);
  const api = paymentOptions();
  const input = { id: ids.paymentOption, key: "cards", blocks: [], environment: "test", merchant_key: "submitted-secret", authenticity_token: "submitted-token", status: "disabled" };
  for (const store_id of [STORE_ID, OTHER_STORE_ID]) {
    assert.deepEqual(await api.monri.create({ ...input, store_id }), result);
    const call = calls.at(-1);
    assert.equal(call.path, `/v1/stores/${store_id}/payment-options/monri`);
    assert.equal(call.method, "POST");
    assert.deepEqual(call.body, input);
  }
  assert.equal(calls.length, 2);
  for (const store_id of [undefined, "default", "selected"]) {
    await assert.rejects(async () => api.monri.create({ ...input, store_id }), TypeError);
  }
  for (const id of [undefined, "provider", ids.paymentOption.toUpperCase()]) {
    await assert.rejects(async () => api.monri.create({ ...input, id, store_id: STORE_ID }), {
      name: "TypeError",
      message: "The payment option id must be a canonical UUID v4 picked by the app",
    });
  }
  assert.equal(calls.length, 2);
  for (const status of [403, 409, 503]) {
    failure = status;
    await assert.rejects(api.monri.create({ ...input, store_id: STORE_ID }), (error) => error.statusCode === status);
  }
  assert.equal(calls.length, 5);
});

test("payment option availability sends the version, blocks and status without resending credentials", async (context) => {
  const result = { id: ids.paymentOption, store_id: STORE_ID, status: "disabled", type: { type: "monri", environment: "test" } };
  const calls = recordFetch(context, () => result);
  const input = { store_id: STORE_ID, id: ids.paymentOption, expected_updated_at: 1000, blocks: [], status: "disabled" };
  assert.deepEqual(await paymentOptions().update(input), result);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/stores/${STORE_ID}/payment-options/${ids.paymentOption}`, { expected_updated_at: 1000, blocks: [], status: "disabled" }],
  ]);
});

test("payment options are listed with native filters and read by id or by key", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("payment-options") ? { items: [], cursor: null } : { id: ids.paymentOption });
  const api = paymentOptions();
  await api.list({ store_id: STORE_ID, limit: 5, cursor: "next" });
  await api.get({ store_id: STORE_ID, id: ids.paymentOption });
  await api.getByKey({ store_id: STORE_ID, key: "cards/eu" });
  assert.deepEqual(calls.map(({ path, query }) => [path, query]), [
    [`/v1/stores/${STORE_ID}/payment-options`, { limit: "5", cursor: "next" }],
    [`/v1/stores/${STORE_ID}/payment-options/${ids.paymentOption}`, {}],
    [`/v1/stores/${STORE_ID}/payment-options/key/cards%2Feu`, {}],
  ]);
});
