import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront, paymentAmounts } from "../dist/storefront.js";
import { fixedIdFactories, ids, recordFetch, visitorStorage } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "d2a64f1b-8c37-4e59-b0a1-6f3e9c7d2b84";

test("payment reads keep the Server's status, its invoice and a recorded payment's method exactly as answered", async (context) => {
  const actor = { account_id: ids.account, snapshot: { email: "desk@example.test", credential_type: { type: "session" } } };
  const recorded = {
    id: ids.payment,
    store_id: STORE_ID,
    order_id: "172454c6-6cbf-407f-9b65-8095860793d9",
    invoice_id: "5d1c7e93-2a46-4b08-9f3e-6c0a8d2b4e71",
    payment_option_id: "fa518caa-5597-4f10-aad6-8b0a771b9260",
    payment_option_key: "desk",
    money: { amount: 1500, currency: "eur" },
    type: {
      type: "recorded",
      method: { type: "bank_transfer", received_on: "2026-11-14" },
      reference: "Transfer 7",
      recorded_by: actor,
      status: { type: "active" },
      refunds: [],
    },
    holds: [],
    status: "paid",
    created_at: 100,
    updated_at: 100,
  };
  const voided = {
    ...recorded,
    type: { ...recorded.type, status: { type: "voided", by: actor, reason: "Wrong order", at: 200 } },
    status: "voided",
    updated_at: 200,
  };
  const returned = [recorded, voided];
  const calls = recordFetch(context, () => returned.shift());
  const api = createAdmin({
    apiUrl: "https://financial.example.test",
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
  }).eshop.payment;
  const before = await api.get({ store_id: STORE_ID, id: ids.payment });
  const after = await api.get({ store_id: STORE_ID, id: ids.payment });
  assert.deepEqual(before, recorded);
  assert.deepEqual(after, voided);
  assert.equal(before.invoice_id, "5d1c7e93-2a46-4b08-9f3e-6c0a8d2b4e71");
  assert.equal(after.status, "voided");
  assert.equal("status_revision" in after, false);
  assert.equal("collections" in after.type, false);
  assert.deepEqual(
    calls.map((call) => [call.method, call.path]),
    [
      ["GET", `/v1/stores/${STORE_ID}/payments/${ids.payment}`],
      ["GET", `/v1/stores/${STORE_ID}/payments/${ids.payment}`],
    ],
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
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
  });
  const filter = {
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
  for (const removed of ["createManual", "recordCollection", "voidCollection", "cancel"])
    assert.equal(removed in client.eshop.payment, false, removed);
});

test("a list reads its Orders' financial summaries in one GET that names the Orders as one JSON id list", async (context) => {
  const orderIds = [
    "172454c6-6cbf-407f-9b65-8095860793d9",
    "5b8e2f14-7c39-4a06-9d1e-3f6a8c2b7d40",
  ];
  const summary = {
    currency: "eur",
    total: 1000,
    active_credit: 0,
    due: 1000,
    paid: 600,
    refunded: 0,
    refund_pending: 0,
    disputed: 0,
    net_paid: 600,
    outstanding: 400,
    excess: 0,
    concerns: [{ type: "payment_hold", payment_id: ids.payment }],
  };
  const answer = orderIds.map((order_id) => ({ order_id, summary }));
  const calls = recordFetch(context, () => answer);
  const api = createAdmin({
    apiUrl: "https://financial.example.test",
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
  }).eshop.order;
  const request = { store_id: STORE_ID, order_ids: orderIds };
  const original = structuredClone(request);
  assert.deepEqual(await api.findFinancialSummaries(request), answer);
  assert.deepEqual(request, original);
  assert.deepEqual(
    calls.map(({ method, path, query, body }) => [method, path, query, body]),
    [
      [
        "GET",
        `/v1/stores/${STORE_ID}/orders/financial-summaries`,
        { order_ids: JSON.stringify(orderIds) },
        null,
      ],
    ],
  );
  await assert.rejects(
    async () => api.findFinancialSummaries({ store_id: "store", order_ids: orderIds }),
    {
      name: "TypeError",
      message: "A Store target must be an explicit canonical UUID-v4",
    },
  );
  assert.equal(calls.length, 1);
});

test("a buyer reads an order's payments on the storefront by the order and payment ids only", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return Response.json([]);
  });
  const storefront = createStorefront({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, {
    visitorIdentity: {
      customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    ...fixedIdFactories,
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

test("a buyer's copy of a recorded refund keeps how the money went back, on a sent and on a returned refund", async (context) => {
  const byBankTransfer = { type: "sent", recorded_at: 1763240000000, method: { type: "bank_transfer" } };
  const inCash = { type: "sent", recorded_at: 1763240000500, method: { type: "cash" } };
  const bounced = {
    type: "returned",
    sent: { recorded_at: 1763240001000, method: { type: "card" } },
    returned: { recorded_at: 1763250000000 },
  };
  const refund = (id, amount, status) => ({ id, money: { amount, currency: "eur" }, status, created_at: 1763239000000 });
  const payment = {
    id: ids.payment,
    store_id: ids.store,
    order_id: ids.order,
    invoice_id: "5d1c7e93-2a46-4b08-9f3e-6c0a8d2b4e71",
    payment_option_id: ids.paymentOption,
    payment_option_key: "desk",
    money: { amount: 1500, currency: "eur" },
    type: {
      type: "recorded",
      method: { type: "cash" },
      status: { type: "active" },
      refunds: [
        refund("6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93", 500, byBankTransfer),
        refund("2d8f4b61-9c37-4e05-a1b8-5f3c7e9d0a26", 300, inCash),
        refund("9a4c1e85-3f62-4d97-b0e3-7c5a2d8f1b49", 200, bounced),
      ],
    },
    holds: [],
    status: "paid",
    created_at: 1763230000000,
    updated_at: 1763250000000,
  };
  const paths = [];
  context.mock.method(globalThis, "fetch", async (url) => {
    const path = new URL(url).pathname;
    paths.push(path);
    return Response.json(path.endsWith("/payments") ? [payment] : payment);
  });
  const storefront = createStorefront({ storeId: ids.store, salesChannelId: ids.channel }, {
    visitorIdentity: { customer_id: ids.customer, session_id: ids.session },
    ...fixedIdFactories,
    apiUrl: "https://financial.example.test",
    sessionStorage: visitorStorage(),
  });
  const listed = await storefront.eshop.order.findPayments({ order_id: ids.order });
  const read = await storefront.eshop.order.getPayment({ order_id: ids.order, payment_id: ids.payment });
  assert.deepEqual(listed, [payment]);
  assert.deepEqual(read, payment);
  assert.deepEqual(read.type.refunds.map((each) => each.status), [byBankTransfer, inCash, bounced]);
  assert.deepEqual(read.type.refunds[2].status.sent.method, { type: "card" });
  assert.equal("method" in read.type.refunds[2].status.returned, false);
  assert.deepEqual(paymentAmounts([read]), { paid: 1500, refunded: 800, refund_pending: 0, disputed: 0, net_paid: 700 });
  assert.deepEqual(paths, [`/v1/storefront/orders/${ids.order}/payments`, `/v1/storefront/orders/${ids.order}/payments/${ids.payment}`]);
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
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
  });
  await assert.rejects(
    client.eshop.payment.find({ store_id: STORE_ID }),
    (error) => error.statusCode === 409,
  );
  await assert.rejects(
    client.notification.incomingWebhook.find({ store_id: STORE_ID, payment_option_id: ids.paymentOption, status: "review" }),
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

test("payment voids and whole-refund receipts carry only their existing identities and versioned facts", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.payment }));
  const api = createAdmin({
    apiUrl: "https://financial.example.test",
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
  }).eshop.payment;
  const refundId = "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93";
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
      method: { type: "bank_transfer" },
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
    receipt: { type: "returned", reference: "Bank return 1", method: { type: "cash" } },
  });
  await api.void({
    store_id: STORE_ID,
    payment_id: ids.payment,
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
          receipt: { type: "sent", reference: "Bank payout 1", method: { type: "bank_transfer" } },
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
        `${base}/void`,
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
    invoice_id: "5d1c7e93-2a46-4b08-9f3e-6c0a8d2b4e71",
    payment_option_id: ids.paymentOption,
    payment_option_key: "desk",
    money: { amount: 1200, currency: "eur" },
    type: {
      type: "recorded",
      method: { type: "bank_transfer", received_on: "2026-11-01" },
      reference: "Original typo",
      recorded_by: actor,
      status: {
        type: "voided",
        by: actor,
        reason: "Wrong transfer",
        at: 2,
      },
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
            sent: { recorded_by: actor, reference: "Payout 1", recorded_at: 3, method: { type: "bank_transfer" } },
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
        reason: { type: "money_after_end" },
        opened_at: 3,
        status: {
          type: "resolved",
          by: actor,
          note: "Matched and returned",
          at: 5,
        },
      },
    ],
    status: "voided",
    created_at: 1,
    updated_at: 5,
  };
  const calls = recordFetch(context, () => payment);
  const api = createAdmin({
    apiUrl: "https://financial.example.test",
    accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
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
  const read = await api.get({ store_id: STORE_ID, id: ids.payment });
  assert.deepEqual(read.type.refunds[0].status.sent, {
    recorded_by: actor,
    reference: "Payout 1",
    recorded_at: 3,
    method: { type: "bank_transfer" },
  });
  assert.deepEqual(read.type.refunds[0].status.returned, {
    recorded_by: actor,
    reference: "Return 1",
    recorded_at: 4,
  });
});
