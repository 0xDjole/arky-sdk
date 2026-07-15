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
assert.equal(typeof arky.store.delete, "function");
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
assert.equal(typeof arky.store.paymentProvider.delete, "function");

assert.equal(typeof arky.social.connection.list, "function");
assert.equal(typeof arky.social.connection.connect, "function");
assert.equal(typeof arky.social.connection.getOAuthAttempt, "function");
assert.equal(typeof arky.social.connection.selectDestination, "function");
assert.equal(typeof arky.social.connection.delete, "function");
assert.equal(typeof arky.social.publication.getComments, "function");
assert.equal(typeof arky.social.publication.syncComments, "function");
assert.equal(typeof arky.social.publication.getCommentThread, "function");
assert.equal(typeof arky.social.publication.syncCommentThread, "function");
assert.equal(typeof arky.social.publication.getMetrics, "function");
assert.equal(typeof arky.social.publication.syncMetrics, "function");

assert.equal(typeof arky.automation.workflow.listConnections, "function");
assert.equal(typeof arky.automation.workflow.getConnectionConnectUrl, "function");
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
  return new Response(JSON.stringify({ authorization_url: "https://oauth.test", state: "state" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  await arky.automation.workflow.getConnectionConnectUrl({
    type: "google_drive",
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
assert.equal(workflowFetchCalls.length, 1);

assert.equal(typeof arky.automation.support.createAgent, "function");
assert.equal(typeof arky.automation.support.findAgents, "function");
assert.equal(typeof arky.automation.support.findConversations, "function");
assert.equal(typeof arky.automation.support.replyToConversation, "function");

assert.equal(typeof arky.notification.mailbox.find, "function");
assert.equal(typeof arky.notification.mailbox.connectGoogle, "function");
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
  return new Response(JSON.stringify({ authorization_url: "https://oauth.test", state: "state" }), {
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
