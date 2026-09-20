import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "cbd7cfef-d0b9-418c-8b66-293f50e190b3";
const refundId = "d9715f50-943b-4a55-99c3-77c09ae32ad4";
const sentId = "fd8688c4-a214-41cd-bfb8-be6c828ce2e7";
const returnedId = "e2b8b5b1-2ce3-4263-8311-004a26cdf70a";
const money = (amount) => ({ amount, currency: "eur" });
const allocations = (amount) => [{
  order_credit_id: "eacb0f54-5fcd-4b5b-8513-d60163c956e8",
  order_credit_allocation_id: "b1d08855-d169-45ca-89c6-f344f4bc35f1", amount,
}];
const actor = { account_id: "2254288f-9778-4e51-8354-20b3d78d2dd4", snapshot: {
  email: "operator@example.test", credential_type: "session",
} };

function fixture(returned = false) {
  const sent = { type: "sent", effect_id: sentId, money: money(100), allocations: allocations(100),
    evidence: { type: "manual", actor, reference: "cash receipt" }, observed_at: 2 };
  const request = { id: refundId, effect_id: returned ? returnedId : sentId,
    movement: returned ? { type: "returned", sent_effect_id: sentId } : { type: "sent" },
    money: money(returned ? 25 : 100), allocations: allocations(returned ? 25 : 100),
    reference: returned ? "returned receipt" : "cash receipt" };
  const effects = [sent];
  if (returned) effects.push({ type: "returned", effect_id: returnedId, sent_effect_id: sentId,
    money: request.money, allocations: request.allocations,
    evidence: { type: "manual", actor, reference: request.reference }, observed_at: 3 });
  const refund = { id: refundId, store_id: storeId, order_id: "order-contract",
    order_payment_id: "payment-contract", order_payment_capture_id: null,
    provider: { type: "cash_on_delivery", payment_provider_id: "provider-contract" },
    money: money(100), application: { type: "commercial_credit", allocations: allocations(100) },
    requester: { type: "account", actor, reason: "customer_request", private_note: null },
    status: { type: returned ? "requires_action" : "succeeded" }, financial_effects: effects,
    safe_error: null, requested_at: 1, processing_started_at: null, processing_deadline_at: null,
    completed_at: returned ? null : 2, created_at: 1, updated_at: returned ? 3 : 2 };
  const refunded = returned ? 75 : 100;
  const pending = returned ? 25 : 0;
  const response = { refund, money: { sent: money(100), returned: money(returned ? 25 : 0),
    refunded: money(refunded), refund_pending: money(pending), allocations: [{ order_credit_id: allocations(0)[0].order_credit_id,
      order_credit_allocation_id: allocations(0)[0].order_credit_allocation_id, effective_sent: refunded, pending }] },
    payment: { id: refund.order_payment_id, store_id: storeId, order_id: refund.order_id,
      payer_customer_id: "customer-contract", provider: { ...refund.provider, marked_paid_by_account_id: actor.account_id },
      status: { type: "completed" }, checkout_expiration: null,
      amounts: { currency: "eur", total: 100, authorized: 0, captured: 100, capture_pending: 0,
        refunded, refund_pending: pending }, request_id: "payment-request", reconciliation: { type: "clear" },
      safe_error: null, completed_at: 1, created_at: 1, updated_at: 3 },
    financial_summary: { currency: "eur", accepted: 100, active_credit: 100, obligation: 0, captured: 100,
      refunded, finalized_lost_principal: 0, net_collections: 100 - refunded, outstanding: 0, excess: 100 - refunded,
      capture_pending: 0, refund_pending: pending, dispute_encumbered: 0, concerns: [] } };
  return { request, response };
}

async function transport(response, operation) {
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", storeId, apiToken: "contract" });
    return { result: await operation(api.eshop.refund), requests };
  } finally { globalThis.fetch = original; }
}

for (const returned of [false, true]) {
  test(`local refund ${returned ? "Returned" : "Sent"} receipt preserves identity, exact allocations and actual money`, async () => {
    const { request, response } = fixture(returned);
    const { result, requests } = await transport(response, (api) => api.recordMoney(request));
    const { id, ...body } = request;
    assert.deepEqual(requests, [{ url: `https://api.example.test/v1/stores/${storeId}/refunds/${id}/money`, method: "POST", body }]);
    assert.deepEqual(result, response);
    assert.equal(result.refund.financial_effects[0].effect_id, sentId);
    assert.equal(result.money.refunded.amount, returned ? 75 : 100);
  });
}

const malformed = [
  ["refund identity", (r) => { r.refund.id = returnedId; }],
  ["Store", (r) => { r.refund.store_id = "other"; }],
  ["Payment identity", (r) => { r.payment.id = "other"; }],
  ["Payment Store", (r) => { r.payment.store_id = "other"; }],
  ["Order identity", (r) => { r.payment.order_id = "other"; }],
  ["Payment currency", (r) => { r.payment.amounts.currency = "usd"; }],
  ["Order currency", (r) => { r.financial_summary.currency = "usd"; }],
  ["missing history", (r) => { delete r.refund.financial_effects; }],
  ["missing exact receipt", (r) => { r.refund.financial_effects.pop(); }],
  ["duplicate receipt", (r) => { r.refund.financial_effects.push(r.refund.financial_effects[1]); }],
  ["wrong receipt identity", (r) => { r.refund.financial_effects[1].effect_id = sentId; }],
  ["wrong movement", (r) => { r.refund.financial_effects[1].type = "sent"; }],
  ["wrong original Sent", (r) => { r.refund.financial_effects[1].sent_effect_id = returnedId; }],
  ["wrong money", (r) => { r.refund.financial_effects[1].money.amount = 26; }],
  ["wrong currency", (r) => { r.refund.financial_effects[1].money.currency = "usd"; }],
  ["wrong credit", (r) => { r.refund.financial_effects[1].allocations[0].order_credit_id = sentId; }],
  ["wrong allocation", (r) => { r.refund.financial_effects[1].allocations[0].amount = 24; }],
  ["wrong receipt evidence", (r) => { r.refund.financial_effects[1].evidence.type = "provider"; }],
  ["wrong receipt reference", (r) => { r.refund.financial_effects[1].evidence.reference = "other"; }],
  ["negative pending", (r) => { r.money.refund_pending.amount = -1; }],
  ["fractional money", (r) => { r.money.refunded.amount = 0.5; }],
];
for (const [name, change] of malformed) {
  test(`refund receipt rejects ${name} before callers can clear retained recovery`, async () => {
    const { request, response } = fixture(true);
    const malformedResponse = structuredClone(response);
    change(malformedResponse);
    await assert.rejects(() => transport(malformedResponse, (api) => api.recordMoney(request)), /Refund money response/);
  });
}

test("local cancellation retains exact expected version and already-recorded money", async () => {
  const { response } = fixture(true);
  response.refund.status = { type: "cancelled" };
  response.money.refund_pending = money(0);
  response.money.allocations[0].pending = 0;
  response.payment.amounts.refund_pending = 0;
  response.financial_summary.refund_pending = 0;
  const { requests, result } = await transport(response, (api) => api.cancelLocal({ id: refundId, expected_updated_at: 3 }));
  assert.deepEqual(requests, [{ url: `https://api.example.test/v1/stores/${storeId}/refunds/${refundId}/cancel-local`, method: "POST", body: { expected_updated_at: 3 } }]);
  assert.equal(result.money.refunded.amount, 75);
  assert.deepEqual(result.refund.financial_effects, response.refund.financial_effects);
});

for (const status of ["requested", "processing", "requires_action", "pending", "succeeded", "rejected", "failed", "cancelled", "unknown"]) {
  test(`refund intent recovery retains the ${status} lifecycle`, async () => {
    const response = { refund_id: refundId, money: money(100), status: { type: status } };
    const { result } = await transport(response, (api) => api.create({ payment_id: "payment-contract", refund_id: refundId,
      payment_capture_id: null, money: money(100), application: { type: "commercial_credit", allocations: allocations(100) },
      reason: "customer_request", private_note: null, reference: null }));
    assert.deepEqual(result, response);
  });
}

test("local cancellation does not report an unresolved remainder as cancelled", async () => {
  const { response } = fixture(true);
  await assert.rejects(() => transport(response, (api) => api.cancelLocal({ id: refundId, expected_updated_at: 3 })), /did not confirm a cancelled remainder/);
  response.refund.status = { type: "cancelled" };
  await assert.rejects(() => transport(response, (api) => api.cancelLocal({ id: refundId, expected_updated_at: 3 })), /did not confirm a cancelled remainder/);
});
