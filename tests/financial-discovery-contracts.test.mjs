import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { ids, recordFetch, visitorStorage } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "d2a64f1b-8c37-4e59-b0a1-6f3e9c7d2b84";

test("payment reads preserve native Credit-derived status and its snapshot revision without changing the Payment mutation version", async (context) => {
  const original = {
    id: ids.payment,
    store_id: STORE_ID,
    order_id: "172454c6-6cbf-407f-9b65-8095860793d9",
    payment_option_id: "fa518caa-5597-4f10-aad6-8b0a771b9260",
    money: { amount: 1500, currency: "eur" },
    type: {
      type: "manual",
      requested: { type: "at_checkout" },
      reference: null,
      status: "open",
      collections: [],
      refunds: [],
    },
    holds: [],
    status: "open",
    status_revision: "9007199254740993",
    created_at: 100,
    updated_at: 100,
  };
  const credited = {
    ...original,
    status: "paid",
    status_revision: "9007199254740994",
  };
  const returned = [original, credited, original];
  const calls = recordFetch(context, () => returned.shift());
  const api = createAdmin({
    apiUrl: "https://financial.example.test",
    secretKey: "arky_api_finance",
  }).eshop.payment;
  const before = await api.get({ store_id: STORE_ID, id: ids.payment });
  const current = await api.get({ store_id: STORE_ID, id: ids.payment });
  const stale = await api.get({ store_id: STORE_ID, id: ids.payment });
  assert.equal(before.updated_at, current.updated_at);
  assert.equal(current.updated_at, stale.updated_at);
  assert.equal(before.status, "open");
  assert.equal(current.status, "paid");
  assert.equal(stale.status, "open");
  assert.equal(current.status_revision, "9007199254740994");
  assert.ok(BigInt(current.status_revision) > BigInt(stale.status_revision));
  assert.deepEqual(current.type.collections, []);
  assert.deepEqual(
    calls.map((call) => call.method),
    ["GET", "GET", "GET"],
  );
});

test("payment discovery keeps combined scope, status, ordering and opaque continuations; refunds and disputes live inside payments", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return Response.json(
      new URL(url).pathname.endsWith("/payments") && calls.length === 1
        ? { items: [], cursor: "next-page+/=" }
        : [],
    );
  });
  const client = createAdmin({
    apiUrl: "https://financial.example.test",
    secretKey: "arky_api_finance",
  });
  const filter = {
    order_id: "order-finance",
    status: "unknown",
    type: "stripe_checkout",
    on_hold: true,
    updated_at_from: 5,
    sort_field: "updated_at",
    sort_direction: "asc",
    limit: 25,
    cursor: "opaque+/= č",
  };
  assert.deepEqual(
    await client.eshop.payment.find({ store_id: STORE_ID, ...filter }),
    { items: [], cursor: "next-page+/=" },
  );
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/payments`);
  for (const [key, value] of Object.entries(filter))
    assert.equal(calls[0].url.searchParams.get(key), String(value));
  assert.equal(calls[0].url.searchParams.has("store_id"), false);
  await client.eshop.order.findPayments({
    store_id: STORE_ID,
    order_id: "order/a",
  });
  await client.eshop.order.getPayment({
    store_id: STORE_ID,
    order_id: "order/a",
    payment_id: "payment/b",
  });
  await client.eshop.order.getFinancialSummary({
    store_id: STORE_ID,
    id: "order/a",
  });
  assert.deepEqual(
    calls
      .slice(1)
      .map((call) => [call.method, call.url.pathname, call.url.search]),
    [
      ["GET", `/v1/stores/${STORE_ID}/orders/order%2Fa/payments`, ""],
      [
        "GET",
        `/v1/stores/${STORE_ID}/orders/order%2Fa/payments/payment%2Fb`,
        "",
      ],
      ["GET", `/v1/stores/${STORE_ID}/orders/order%2Fa/financial-summary`, ""],
    ],
  );
  for (const removed of ["refund", "dispute", "paymentDispute", "capture"])
    assert.equal(removed in client.eshop, false, removed);
});

test("a buyer reads an order's payments on the storefront by the order and payment ids only", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return Response.json([]);
  });
  const storefront = createStorefront(`arky_pk_${"f".repeat(42)}A`, {
    visitorIdentity: {
      customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    createVisitorIdentity: () => ({
      customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47",
      session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
    }),
    createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
    apiUrl: "https://financial.example.test",
    sessionStorage: visitorStorage(),
  });
  await storefront.eshop.order.findPayments({
    order_id: "order/a",
    store_id: "foreign",
  });
  await storefront.eshop.order.getPayment({
    order_id: "order/a",
    payment_id: "payment/b",
  });
  assert.deepEqual(
    calls.map((call) => [call.method, call.url.pathname, call.url.search]),
    [
      ["GET", "/v1/storefront/orders/order%2Fa/payments", ""],
      ["GET", "/v1/storefront/orders/order%2Fa/payments/payment%2Fb", ""],
    ],
  );
});

test("financial list failures are errors, not empty pages or replacement money commands", async (context) => {
  const methods = [];
  context.mock.method(globalThis, "fetch", async (_url, init = {}) => {
    methods.push(init.method || "GET");
    return Response.json(
      { message: "Discovery unavailable", status_code: 409 },
      { status: 409 },
    );
  });
  const client = createAdmin({
    apiUrl: "https://financial.example.test",
    secretKey: "arky_api_finance",
  });
  await assert.rejects(
    client.eshop.payment.find({ store_id: STORE_ID }),
    (error) => error.statusCode === 409,
  );
  await assert.rejects(
    client.notification.incomingWebhook.find({ store_id: STORE_ID }),
    (error) => error.statusCode === 409,
  );
  assert.deepEqual(methods, ["GET", "GET"]);
  for (const api of [
    client.eshop.payment,
    client.notification.incomingWebhook,
  ]) {
    await assert.rejects(async () => api.find({}), {
      name: "TypeError",
      message: "A Store target must be an explicit canonical UUID-v4",
    });
  }
  assert.deepEqual(methods, ["GET", "GET"]);
});

test("collection voids and whole-refund receipts carry only their existing identities and versioned facts", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.payment }));
  const api = createAdmin({
    apiUrl: "https://financial.example.test",
    secretKey: "arky_api_finance",
  }).eshop.payment;
  const refundId = "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93";
  const collectionId = "fca5ba8e-86af-4dd8-a1cd-6d19bca62e12";
  const application = {
    type: "excess_collection",
    reason: "Duplicate transfer",
  };
  const request = {
    store_id: STORE_ID,
    payment_id: ids.payment,
    id: refundId,
    money: { amount: 1200, currency: "eur" },
    reason: "duplicate",
    application,
    notify_customer: false,
  };
  const original = structuredClone(request);
  await api.createRefund(request);
  await api.createRefund(request);
  await api.recordRefundReceipt({
    store_id: STORE_ID,
    payment_id: ids.payment,
    refund_id: refundId,
    expected_updated_at: 8,
    receipt: {
      type: "sent",
      reference: "Bank payout 1",
      money: request.money,
      allocations: [],
      sent_id: "retired",
    },
    id: "retired-receipt",
  });
  await api.recordRefundReceipt({
    store_id: STORE_ID,
    payment_id: ids.payment,
    refund_id: refundId,
    expected_updated_at: 9,
    receipt: { type: "returned", reference: "Bank return 1" },
  });
  await api.voidCollection({
    store_id: STORE_ID,
    payment_id: ids.payment,
    collection_id: collectionId,
    expected_updated_at: 10,
    reason: "Mistyped transfer",
    id: "unrelated",
  });
  assert.deepEqual(request, original);
  const base = `/v1/stores/${STORE_ID}/payments/${ids.payment}`;
  const body = {
    id: refundId,
    money: request.money,
    reason: "duplicate",
    application,
    notify_customer: false,
  };
  assert.deepEqual(
    calls.map(({ method, path, body }) => [method, path, body]),
    [
      ["POST", `${base}/refunds`, body],
      ["POST", `${base}/refunds`, body],
      [
        "POST",
        `${base}/refunds/${refundId}/receipts`,
        {
          expected_updated_at: 8,
          receipt: { type: "sent", reference: "Bank payout 1" },
        },
      ],
      [
        "POST",
        `${base}/refunds/${refundId}/receipts`,
        {
          expected_updated_at: 9,
          receipt: { type: "returned", reference: "Bank return 1" },
        },
      ],
      [
        "POST",
        `${base}/collections/${collectionId}/void`,
        { expected_updated_at: 10, reason: "Mistyped transfer" },
      ],
    ],
  );
});

test("hold resolution names the retained hold and leaves recorded history intact in SDK reads", async (context) => {
  const actor = {
    account_id: ids.account,
    snapshot: {
      email: "owner@example.test",
      credential_type: { type: "session" },
    },
  };
  const holdId = "531b79f6-86d4-48cd-a241-73b7f16256b6";
  const payment = {
    id: ids.payment,
    store_id: STORE_ID,
    order_id: ids.order,
    payment_option_id: ids.paymentOption,
    money: { amount: 1200, currency: "eur" },
    type: {
      type: "manual",
      requested: { type: "later", by: actor },
      reference: "Bank transfer",
      status: "cancelled",
      collections: [
        {
          id: "fca5ba8e-86af-4dd8-a1cd-6d19bca62e12",
          money: { amount: 1200, currency: "eur" },
          recorded_by: actor,
          reference: "Original typo",
          recorded_at: 1,
          status: {
            type: "voided",
            by: actor,
            reason: "Wrong transfer",
            at: 2,
          },
        },
      ],
      refunds: [
        {
          id: "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93",
          money: { amount: 1200, currency: "eur" },
          request: {
            actor,
            reason: "duplicate",
            application: {
              type: "excess_collection",
              reason: "Duplicate transfer",
            },
            notify_customer: true,
          },
          status: {
            type: "returned",
            sent: { recorded_by: actor, reference: "Payout 1", recorded_at: 3 },
            returned: {
              recorded_by: actor,
              reference: "Return 1",
              recorded_at: 4,
            },
          },
          created_at: 2,
        },
      ],
    },
    holds: [
      {
        id: holdId,
        message: "Late transfer",
        opened_at: 3,
        status: {
          type: "resolved",
          by: actor,
          note: "Matched and returned",
          at: 5,
        },
      },
    ],
    status: "cancelled",
    status_revision: "6",
    created_at: 1,
    updated_at: 5,
  };
  const calls = recordFetch(context, () => payment);
  const api = createAdmin({
    apiUrl: "https://financial.example.test",
    secretKey: "arky_api_finance",
  }).eshop.payment;
  const request = {
    store_id: STORE_ID,
    payment_id: ids.payment,
    expected_updated_at: 4,
    hold_id: holdId,
    note: "Matched and returned",
    index: 0,
  };
  assert.deepEqual(await api.resolveHold(request), payment);
  assert.deepEqual(
    await api.get({ store_id: STORE_ID, id: ids.payment }),
    payment,
  );
  assert.deepEqual(calls[0].body, {
    expected_updated_at: 4,
    hold_id: holdId,
    note: "Matched and returned",
  });
  assert.equal(
    calls[0].path,
    `/v1/stores/${STORE_ID}/payments/${ids.payment}/resolve-hold`,
  );
  assert.equal(calls[1].method, "GET");
  assert.deepEqual(payment.type.refunds[0].status.sent, {
    recorded_by: actor,
    reference: "Payout 1",
    recorded_at: 3,
  });
});
