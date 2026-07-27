#!/usr/bin/env node
import assert from "node:assert/strict";
import { createAdmin } from "../dist/admin.js";
import { SUPPORTED_STORE_CURRENCIES, convertToMajor, convertToMinor, formatMinor, getCurrencyMinorUnits } from "../dist/utils.js";

const expectedStoreCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "CHF",
  "AUD",
  "CAD",
  "HKD",
  "SGD",
  "NZD",
  "KRW",
  "SEK",
  "NOK",
  "DKK",
  "INR",
  "MXN",
  "BRL",
  "ZAR",
  "RUB",
  "TRY",
  "PLN",
  "THB",
  "IDR",
  "MYR",
  "PHP",
  "CZK",
  "ILS",
  "AED",
  "SAR",
  "HUF",
  "RON",
  "BGN",
  "HRK",
  "BAM",
  "RSD",
  "MKD",
  "ALL",
];

assert.deepEqual([...SUPPORTED_STORE_CURRENCIES], expectedStoreCurrencies);
for (const currency of expectedStoreCurrencies) {
  const expectedMinorUnits = currency === "JPY" || currency === "KRW" ? 0 : 2;
  assert.equal(getCurrencyMinorUnits(currency), expectedMinorUnits, `${currency} minor units must match the server currency contract`);
}
assert.equal(getCurrencyMinorUnits(" jpy "), 0);
assert.equal(getCurrencyMinorUnits("IDR"), 2);
assert.equal(getCurrencyMinorUnits("HUF"), 2);
assert.equal(getCurrencyMinorUnits("ALL"), 2);
assert.equal(convertToMinor(12.34, "USD"), 1234);
assert.equal(convertToMajor(1234, "USD"), 12.34);
assert.equal(convertToMinor(100, "JPY"), 100);
assert.equal(convertToMajor(100, "JPY"), 100);
assert.equal(convertToMinor(100, "KRW"), 100);
assert.equal(convertToMajor(100, "KRW"), 100);
assert.match(formatMinor(100, "JPY"), /100/);
assert.doesNotMatch(formatMinor(100, "JPY"), /100[.,]00/);
for (const currency of ["IDR", "HUF", "ALL"]) {
  assert.equal(convertToMajor(1234, currency), 12.34);
  assert.equal(convertToMinor(12.34, currency), 1234);
  assert.match(formatMinor(1234, currency), /12[.,]34/, `${currency} formatting must retain the server's two minor-unit digits`);
}
assert.equal(formatMinor(100, " jpy "), formatMinor(100, "JPY"));
assert.throws(() => convertToMinor(1, "ZZZ"), /Unsupported currency/);

const arky = createAdmin({
  baseUrl: "http://127.0.0.1:1",
  storeId: "contract-store",
  apiToken: "contract-token",
});

assert.equal(typeof arky.account.auth.code, "function");
assert.equal(typeof arky.account.auth.verify, "function");
assert.equal(typeof arky.account.auth.refresh, "function");
assert.equal(typeof arky.account.update, "function");
assert.equal(typeof arky.account.delete, "function");
assert.equal(typeof arky.account.getMe, "function");
assert.equal(typeof arky.account.search, "function");

assert.equal(typeof arky.store.create, "function");
assert.equal(typeof arky.store.update, "function");
assert.equal(typeof arky.store.get, "function");
assert.equal(typeof arky.store.find, "function");
assert.equal(typeof arky.store.subscription.getPlans, "function");
assert.equal(typeof arky.store.subscription.action.create, "function");
assert.equal(typeof arky.store.subscription.action.find, "function");
assert.equal(typeof arky.store.subscription.action.get, "function");
assert.equal(typeof arky.store.subscription.action.retry, "function");
assert.equal(typeof arky.store.subscription.action.effect.find, "function");
assert.equal(typeof arky.store.subscription.action.effect.get, "function");
assert.equal(typeof arky.store.subscription.createPortalSession, "function");
assert.equal(typeof arky.store.member.add, "function");
assert.equal(typeof arky.store.member.invite, "function");
assert.equal(typeof arky.store.member.remove, "function");
assert.equal(typeof arky.store.buildHook.list, "function");
assert.equal(typeof arky.store.webhook.list, "function");
assert.equal(typeof arky.store.config.getPayment, "function");
assert.equal(typeof arky.store.paymentProvider.list, "function");
assert.equal(typeof arky.store.paymentProvider.refresh, "function");
assert.equal(typeof arky.store.paymentProvider.connectStripe, "function");
assert.equal(typeof arky.store.paymentProvider.getConnection, "function");
assert.equal(typeof arky.store.paymentProvider.delete, "function");
assert.equal(typeof arky.store.paymentProvider.getDeletion, "function");
assert.equal(typeof arky.store.paymentProvider.retryDeletion, "function");

const scheduledAdminCalls = [];
const requestedProvider = {
  id: "provider-scheduled",
  store_id: "contract-store",
  key: "stripe",
  provider: {
    type: "stripe",
    onboarding_status: "pending",
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
  },
  connection: {
    status: "requested",
    revision: 1,
    attempts: 0,
    requested_at: 1,
  },
  created_at: 1,
  updated_at: 1,
};
const succeededProvider = {
  ...requestedProvider,
  connection: {
    ...requestedProvider.connection,
    status: "succeeded",
    attempts: 1,
    completed_at: 2,
  },
  updated_at: 2,
};
const scheduledAction = {
  id: "action-scheduled",
  subscription_id: "subscription-contract",
  store_id: "contract-store",
  request: { type: "select_plan", data: { plan_id: "basic" } },
  status: "requested",
  requested_at: 1,
  updated_at: 1,
};
const completedAction = {
  ...scheduledAction,
  status: "succeeded",
  result: {
    type: "checkout",
    data: {
      session_id: "checkout-session",
      checkout_url: "https://checkout.test/session",
      expires_at: 10,
    },
  },
  completed_at: 2,
  updated_at: 2,
};
const requestedDeletion = {
  id: "deletion-scheduled",
  store_id: "contract-store",
  payment_provider_id: "provider-scheduled",
  revision: 1,
  status: "processing",
  terminal: false,
  requested_at: 1,
  processing_started_at: 2,
  completed_at: null,
  error: null,
};
const completedDeletion = {
  ...requestedDeletion,
  status: "succeeded",
  terminal: true,
  completed_at: 3,
};
const scheduledOriginalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const target = String(url);
  const method = init.method || "GET";
  scheduledAdminCalls.push([target, method]);
  let body;
  if (target.endsWith("/payment-providers/stripe/connect")) {
    body = { provider: requestedProvider, onboarding_url: "" };
  } else if (
    target.endsWith("/payment-providers/provider-scheduled/connection")
  ) {
    body = {
      provider: succeededProvider,
      onboarding_url: "https://connect.test/onboarding",
    };
  } else if (target.endsWith("/subscription/actions") && method === "POST") {
    body = scheduledAction;
  } else if (target.endsWith("/subscription/actions/action-scheduled")) {
    body = completedAction;
  } else if (target.endsWith("/payment-providers/provider-scheduled")) {
    body = requestedDeletion;
  } else if (
    target.endsWith("/payment-providers/provider-scheduled/deletion")
  ) {
    body = completedDeletion;
  } else {
    throw new Error(`Unexpected scheduled admin request: ${method} ${target}`);
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  const connected = await arky.store.paymentProvider.connectStripe({
    store_id: "contract-store",
    return_url: "https://admin.test/return",
    refresh_url: "https://admin.test/refresh",
    country: "BA",
  });
  assert.equal(connected.onboarding_url, "https://connect.test/onboarding");

  const action = await arky.store.subscription.action.create({
    store_id: "contract-store",
    action_id: "action-scheduled",
    type: "select_plan",
    plan_id: "basic",
    success_url: "https://admin.test/success",
    cancel_url: "https://admin.test/cancel",
  });
  assert.equal(action.status, "succeeded");
  assert.equal(action.result.data.checkout_url, "https://checkout.test/session");

  assert.deepEqual(
    await arky.store.paymentProvider.delete({
      store_id: "contract-store",
      id: "provider-scheduled",
    }),
    completedDeletion,
  );
} finally {
  globalThis.fetch = scheduledOriginalFetch;
}
assert.deepEqual(
  scheduledAdminCalls.map(([url, method]) => [
    url.replace("http://127.0.0.1:1", ""),
    method,
  ]),
  [
    ["/v1/stores/contract-store/payment-providers/stripe/connect", "POST"],
    [
      "/v1/stores/contract-store/payment-providers/provider-scheduled/connection",
      "GET",
    ],
    ["/v1/stores/contract-store/subscription/actions", "POST"],
    [
      "/v1/stores/contract-store/subscription/actions/action-scheduled",
      "GET",
    ],
    [
      "/v1/stores/contract-store/payment-providers/provider-scheduled",
      "DELETE",
    ],
    [
      "/v1/stores/contract-store/payment-providers/provider-scheduled/deletion",
      "GET",
    ],
  ],
);

assert.equal(typeof arky.social.connection.list, "function");
assert.equal(typeof arky.social.connection.connect, "function");
assert.equal(typeof arky.social.connection.getOAuthAttempt, "function");
assert.equal(typeof arky.social.connection.selectDestination, "function");
assert.equal(typeof arky.social.connection.delete, "function");
assert.equal(typeof arky.social.publication.getComments, "function");
assert.equal(typeof arky.social.publication.syncComments, "function");
assert.equal(typeof arky.social.publication.getCommentThread, "function");
assert.equal(typeof arky.social.publication.syncCommentThread, "function");
assert.equal(typeof arky.social.publication.classifyComments, "function");
assert.equal(
  typeof arky.social.publication.getCommentClassificationRun,
  "function",
);
assert.equal(typeof arky.social.publication.getMetrics, "function");
assert.equal(typeof arky.social.publication.syncMetrics, "function");

assert.equal(typeof arky.automation.workflow.listConnections, "function");
assert.equal(typeof arky.automation.workflow.getConnectionConnectUrl, "function");
assert.equal(typeof arky.automation.workflow.getConnectionOAuthAttempt, "function");
assert.equal(typeof arky.automation.workflow.deleteConnection, "function");

const workflowFetchCalls = [];
const originalFetch = globalThis.fetch;

const paymentConfig = {
  provider: "stripe",
  publishable_key: "pk_test_contract",
  connected_account_id: "acct_contract",
  currency: "USD",
};
const paymentConfigCalls = [];
globalThis.fetch = async (url, init = {}) => {
  paymentConfigCalls.push({ url: String(url), method: init.method });
  return new Response(JSON.stringify(paymentConfig), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  assert.deepEqual(await arky.store.config.getPayment({ store_id: "store-config" }), paymentConfig);
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(paymentConfigCalls, [
  {
    url: "http://127.0.0.1:1/v1/stores/store-config/config/payment",
    method: "GET",
  },
]);

globalThis.fetch = async (url, init = {}) => {
  workflowFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  const body = String(url).includes("/oauth/attempts/")
    ? {
        attempt_id: "workflow-attempt",
        store_id: "contract-store",
        workflow_connection_id: "workflow-connection",
        type: "google_drive",
        status: "processing",
        completed_at: null,
        error: null,
      }
    : { authorization_url: "https://oauth.test", state: "state" };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  await arky.automation.workflow.getConnectionConnectUrl({
    type: "google_drive",
  });
  await arky.automation.workflow.getConnectionOAuthAttempt({
    attempt_id: "workflow-attempt",
  });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(workflowFetchCalls[0].method, "POST");
assert.equal(workflowFetchCalls[0].url, "http://127.0.0.1:1/v1/stores/contract-store/workflow-connections/connect-url");
assert.deepEqual(JSON.parse(workflowFetchCalls[0].body), {
  type: "google_drive",
  store_id: "contract-store",
});
assert.equal(workflowFetchCalls[1].method, "GET");
assert.equal(
  workflowFetchCalls[1].url,
  "http://127.0.0.1:1/v1/stores/contract-store/workflow-connections/oauth/attempts/workflow-attempt",
);
assert.equal(workflowFetchCalls.length, 2);

assert.equal(typeof arky.automation.support.createAgent, "function");
assert.equal(typeof arky.automation.support.findAgents, "function");
assert.equal(typeof arky.automation.support.findConversations, "function");
assert.equal(typeof arky.automation.support.replyToConversation, "function");

assert.equal(typeof arky.notification.mailbox.find, "function");
assert.equal(typeof arky.notification.mailbox.connectGoogle, "function");
assert.equal(typeof arky.notification.mailbox.getGoogleOAuthAttempt, "function");
assert.equal(typeof arky.notification.email.send, "function");
assert.equal(typeof arky.notification.email.getDelivery, "function");
assert.equal(typeof arky.notification.email.retryDelivery, "function");

const mailboxFetchCalls = [];
globalThis.fetch = async (url, init = {}) => {
  mailboxFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  const body = String(url).includes("/oauth/attempts/")
    ? {
        attempt_id: "mailbox-attempt",
        store_id: "contract-store",
        mailbox_id: "mailbox-contract",
        status: "processing",
        completed_at: null,
        error: null,
      }
    : { authorization_url: "https://oauth.test", state: "state" };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  await arky.notification.mailbox.connectGoogle({
    key: "founder",
    from_name: "Founder",
    sync_enabled: true,
    sync_interval_seconds: 300,
  });
  await arky.notification.mailbox.getGoogleOAuthAttempt({
    attempt_id: "mailbox-attempt",
  });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(mailboxFetchCalls[0].method, "POST");
assert.equal(mailboxFetchCalls[0].url, "http://127.0.0.1:1/v1/stores/contract-store/mailboxes/google/connect-url");
assert.deepEqual(JSON.parse(mailboxFetchCalls[0].body), {
  key: "founder",
  from_name: "Founder",
  sync_enabled: true,
  sync_interval_seconds: 300,
});
assert.equal(mailboxFetchCalls[1].method, "GET");
assert.equal(
  mailboxFetchCalls[1].url,
  "http://127.0.0.1:1/v1/stores/contract-store/mailboxes/google/oauth/attempts/mailbox-attempt",
);

assert.equal(typeof arky.outreach.campaign.find, "function");
assert.equal(typeof arky.outreach.campaignEnrollment.find, "function");
assert.equal(typeof arky.outreach.campaignMessage.find, "function");
assert.equal(typeof arky.outreach.suppression.find, "function");
assert.equal(typeof arky.outreach.leadResearch.createRun, "function");

assert.equal(typeof arky.crm.contactList.addMember, "function");
assert.equal(typeof arky.crm.contactList.findMembers, "function");

assert.equal(typeof arky.eshop.order.createRefund, "function");
assert.equal(typeof arky.eshop.order.getRefunds, "function");
assert.equal(typeof arky.eshop.order.getPayment, "function");
assert.equal(typeof arky.eshop.order.getPaymentTransactions, "function");
assert.equal(typeof arky.eshop.order.getPaymentTransaction, "function");
assert.equal(typeof arky.eshop.order.retryPaymentTransaction, "function");
assert.equal(typeof arky.eshop.order.findDigitalAccess, "function");
assert.equal(typeof arky.eshop.order.getDigitalAccess, "function");
assert.equal(typeof arky.eshop.order.downloadDigitalAccess, "function");
assert.equal(typeof arky.eshop.order.activateDigitalAccess, "function");
assert.equal(typeof arky.eshop.order.revokeDigitalAccess, "function");
assert.equal(typeof arky.eshop.shipment.getRates, "function");
assert.equal(typeof arky.eshop.shipment.create, "function");
assert.equal(typeof arky.eshop.shipment.fulfillment.find, "function");
assert.equal(typeof arky.eshop.shipment.fulfillment.get, "function");
assert.equal(typeof arky.eshop.shipment.refund.retry, "function");
assert.equal(typeof arky.eshop.shipment.settlement.get, "function");
assert.equal(typeof arky.eshop.shipment.settlement.retry, "function");

const digitalAccessCalls = [];
globalThis.fetch = async (url, init = {}) => {
  digitalAccessCalls.push({ url: String(url), method: init.method });
  const body =
    String(url).endsWith("/digital-access") || String(url).endsWith("/fulfillment-orders")
      ? { items: [], cursor: null }
      : String(url).endsWith("/download")
        ? { url: "https://download.test", grant: {} }
        : {};
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.eshop.order.findDigitalAccess({ order_id: "order-1", limit: 20 });
  await arky.eshop.order.getDigitalAccess({
    order_id: "order-1",
    grant_id: "grant-1",
  });
  await arky.eshop.order.downloadDigitalAccess({
    order_id: "order-1",
    grant_id: "grant-1",
  });
  await arky.eshop.order.activateDigitalAccess({
    order_id: "order-1",
    grant_id: "grant-1",
  });
  await arky.eshop.order.revokeDigitalAccess({
    order_id: "order-1",
    grant_id: "grant-1",
  });
  await arky.eshop.shipment.fulfillment.find({
    order_id: "order-1",
    limit: 20,
  });
  await arky.eshop.shipment.fulfillment.get({
    order_id: "order-1",
    fulfillment_order_id: "fulfillment-1",
  });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  digitalAccessCalls.map(({ url, method }) => [url, method]),
  [
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/digital-access?limit=20", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/digital-access/grant-1", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/digital-access/grant-1/download", "POST"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/digital-access/grant-1/activate", "POST"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/digital-access/grant-1/revoke", "POST"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/fulfillment-orders?limit=20", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/fulfillment-orders/fulfillment-1", "GET"],
  ],
);

const paymentCalls = [];
globalThis.fetch = async (url, init = {}) => {
  paymentCalls.push({ url: String(url), method: init.method });
  const body = String(url).endsWith("/transactions") ? { items: [], cursor: null } : {};
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
try {
  await arky.eshop.order.getPayment({ order_id: "order-1" });
  await arky.eshop.order.getPaymentTransactions({
    order_id: "order-1",
    limit: 20,
  });
  await arky.eshop.order.getPaymentTransaction({
    order_id: "order-1",
    transaction_id: "transaction-1",
  });
  await arky.eshop.order.retryPaymentTransaction({
    order_id: "order-1",
    transaction_id: "transaction-1",
  });
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  paymentCalls.map(({ url, method }) => [url, method]),
  [
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/payment", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/payment/transactions?limit=20", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/payment/transactions/transaction-1", "GET"],
    ["http://127.0.0.1:1/v1/stores/contract-store/orders/order-1/payment/transactions/transaction-1/retry", "POST"],
  ],
);

console.log("Admin SDK contract test passed.");
