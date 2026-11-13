import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { ids, recordFetch } from "./helpers/arky-fixtures.mjs";

test("a desk collection names how its money came", async (context) => {
  const collectionId = "8b3e6f21-4c97-4d0a-b5e2-1f7c9a3d6e84";
  const actor = { account_id: ids.account, snapshot: { email: "desk@example.test", credential_type: { type: "session" } } };
  const answer = {
    id: ids.payment,
    store_id: ids.store,
    order_id: ids.order,
    payment_option_id: ids.paymentOption,
    money: { amount: 1000, currency: "eur" },
    type: {
      type: "manual",
      requested: { type: "later", by: actor },
      reference: null,
      status: "open",
      collections: [
        {
          id: collectionId,
          money: { amount: 400, currency: "eur" },
          method: "card",
          recorded_by: actor,
          reference: "Terminal slip 42",
          recorded_at: 2,
          status: { type: "active" },
        },
      ],
      refunds: [],
    },
    holds: [],
    payment_option_key: "desk",
    status: "open",
    status_revision: "4",
    created_at: 1,
    updated_at: 2,
  };
  const calls = recordFetch(context, () => answer);
  const payment = await createAdmin({
    apiUrl: "https://desk.example.test",
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
  }).eshop.payment.recordCollection({
    store_id: ids.store,
    payment_id: ids.payment,
    id: collectionId,
    money: { amount: 400, currency: "eur" },
    method: "card",
    reference: "Terminal slip 42",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].path, `/v1/stores/${ids.store}/payments/${ids.payment}/collections`);
  assert.deepEqual(calls[0].body, {
    id: collectionId,
    money: { amount: 400, currency: "eur" },
    method: "card",
    reference: "Terminal slip 42",
  });
  assert.equal(payment.type.type, "manual");
  assert.equal(payment.type.collections[0].method, "card");
});
