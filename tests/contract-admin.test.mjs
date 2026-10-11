import assert from "node:assert/strict";
import test from "node:test";
import { BROADCAST_BLOCK_FIELD_PREFIXES, BROADCAST_FIELDS, createAdmin } from "../dist/admin.js";
import { SUPPORTED_STORE_CURRENCIES, convertToMajor, convertToMinor, formatMinor, getCurrencyMinorUnits } from "../dist/utils.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "4f2a9c61-7e3b-4d85-a0c9-1b6e8d3f5a27";
const API = "https://api.example.test";

const expectedStoreCurrencies = [
  "usd", "aed", "afn", "all", "amd", "ang", "aoa", "ars", "aud", "awg", "azn", "bam", "bbd", "bdt", "bhd", "bif", "bmd", "bnd", "bob", "brl",
  "bsd", "bwp", "byn", "bzd", "cad", "cdf", "chf", "clp", "cny", "cop", "crc", "cve", "czk", "djf", "dkk", "dop", "dzd", "egp", "etb", "eur",
  "fjd", "fkp", "gbp", "gel", "gip", "gmd", "gnf", "gtq", "gyd", "hkd", "hnl", "htg", "huf", "idr", "ils", "inr", "isk", "jmd", "jod", "jpy",
  "kes", "kgs", "khr", "kmf", "krw", "kwd", "kyd", "kzt", "lak", "lbp", "lkr", "lrd", "lsl", "mad", "mdl", "mga", "mkd", "mmk", "mnt", "mop",
  "mur", "mvr", "mwk", "mxn", "myr", "mzn", "nad", "ngn", "nio", "nok", "npr", "nzd", "omr", "pab", "pen", "pgk", "php", "pkr", "pln", "pyg",
  "qar", "ron", "rsd", "rub", "rwf", "sar", "sbd", "scr", "sek", "sgd", "shp", "sle", "sos", "srd", "std", "szl", "thb", "tjs", "tnd", "top",
  "try", "ttd", "twd", "tzs", "uah", "ugx", "uyu", "uzs", "vnd", "vuv", "wst", "xaf", "xcd", "xcg", "xof", "xpf", "yer", "zar", "zmw",
];

const minorUnitExceptions = { bhd: 3, bif: 0, clp: 0, djf: 0, gnf: 0, isk: 0, jod: 3, jpy: 0, kmf: 0, krw: 0, kwd: 3, mga: 0, omr: 3, pyg: 0, rwf: 0, tnd: 3, ugx: 0, vnd: 0, vuv: 0, xaf: 0, xof: 0, xpf: 0 };

const adminSurface = {
  "(root)": ["logout", "onAuthStateChanged"],
  account: ["delete", "getMe", "search"],
  "account.apiToken": ["create", "list", "revoke", "update"],
  "account.auth": ["code", "refresh", "storeCode", "storeVerify", "verify"],
  "account.session": ["list", "revoke"],
  actions: ["find"],
  analytics: ["get"],
  broadcast: ["create", "delete", "find", "get", "preview", "schedule", "send", "test", "unschedule", "update"],
  category: ["create", "delete", "find", "get", "getChildren", "update"],
  companies: ["create", "delete", "find", "get", "reviewTaxRegistration", "setPurchasing", "submitTaxRegistration", "update"],
  "companies.location": ["create", "delete", "find", "get", "reviewTaxRegistration", "setFulfillment", "setPurchasing", "submitTaxRegistration", "update"],
  "companies.membership": ["create", "delete", "find", "get", "update"],
  "companies.notes": ["create", "delete", "find", "update"],
  "companies.role": ["create", "delete", "find", "get", "update"],
  "content.collection": ["create", "delete", "find", "get", "update"],
  "content.entry": ["create", "delete", "find", "findByIds", "findBySlug", "get", "update"],
  customers: ["archive", "create", "erase", "find", "findSessions", "get", "import", "merge", "previewImport", "resolveOrReserveEmail", "revokeAllSessions", "revokeSession", "update"],
  "customers.emailSuppression": ["block", "find", "get", "recordResubscribe", "recordUnsubscribe", "unblock"],
  "customers.notes": ["create", "delete", "find", "update"],
  "eshop.bookingOffering": ["create", "delete", "find", "get", "lookup", "update"],
  "eshop.bookingResource": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.bookingService": ["create", "delete", "find", "get", "getAvailability", "getByKey", "update"],
  "eshop.cart": ["addBooking", "addCustomerGroup", "addProduct", "checkout", "checkoutOnAccount", "clear", "create", "find", "get", "paymentAction", "previewAccessProduct", "quote", "quoteFutureDeliveries", "quotePurchase", "removeItem", "selectShippingMethod", "setFutureDeliveries", "update"],
  "eshop.cart.offer": ["create", "send", "withdraw"],
  "eshop.catalog": ["copy", "create", "delete", "find", "findPurchasable", "get", "getByKey", "update"],
  "eshop.catalogAccess": ["create", "delete", "find", "get"],
  "eshop.catalogItem": ["batch", "create", "delete", "find", "get", "update"],
  "eshop.customerGroup": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.customerGroupMember": [
    "assign", "calendar", "cancel", "changePurchaseRequirement", "correctTaxClassification", "current", "find", "findOrders", "get",
    "getRevision", "pause", "purchaseAccess", "purchaseLimits", "purchaseRequirement", "resume", "reviewPurchaseRequirement",
    "reviewSwitch", "reviewTaxCorrection", "revisions", "revoke", "scheduleEnd", "selectPaymentMethod", "skipNext", "switch",
    "transferPurchaseRequirement", "withdrawRevision",
  ],
  "eshop.customerGroupOffering": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.digitalAsset": ["archive", "find", "get", "upload"],
  "eshop.fulfillment": ["create", "execute", "find", "get", "markDelivered", "updateTracking"],
  "eshop.fulfillmentJob": ["decide", "find", "get", "items", "unitSlots"],
  "eshop.fulfillmentRouting": ["get", "update"],
  "eshop.inventoryItem": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.inventoryLevel": ["create", "find", "get", "makeAvailable", "move", "receiveMove", "remove", "setAside", "stock"],
  "eshop.inventoryMovement": ["find", "get", "record"],
  "eshop.inventoryUnit": ["allocate", "execution", "find", "get", "move", "receive", "unassign", "writeOff"],
  "eshop.minimumProgress": ["get"],
  "eshop.order": ["cancel", "cancelBookingItem", "cancelProductItem", "completeBookingItem", "find", "findBookingItems", "findPayments", "get", "getFinancialSummary", "getPayment", "markBookingItemNoShow", "resendReceipt", "revokeAccess"],
  "eshop.order.credit": ["create", "find", "get", "void"],
  "eshop.order.notes": ["create", "delete", "find", "update"],
  "eshop.payment": ["cancel", "cancelRefund", "createManual", "createRefund", "find", "get", "recordCollection", "recordRefundReceipt", "resolveCharge", "resolveHold", "resolveRefund"],
  "eshop.paymentMethod": ["cancelSetup", "completeSetup", "consentText", "find", "get", "requestSetup", "revoke", "startSetup"],
  "eshop.price": ["batch", "create", "delete", "find", "get", "update"],
  "eshop.product": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.productVariant": ["create", "delete", "find", "get", "update"],
  "eshop.promotion": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.promotionCode": ["create", "delete", "find", "get", "getByCode", "update"],
  "eshop.providerEvent": ["find", "get", "resolve"],
  "eshop.rental": ["execute", "find", "get"],
  "eshop.return": ["create", "credit", "destinationOptions", "execute", "find", "get", "inspectionUnit", "orderOptions", "rentalOptions"],
  experiments: ["complete", "create", "delete", "find", "get", "pause", "results", "resume", "start", "update"],
  forms: ["assignSubmission", "changeSubmissionStage", "create", "createSubmission", "delete", "deleteSubmission", "find", "findSubmissions", "get", "getSubmission", "getSubmissionFile", "setSubmissionCompany", "update"],
  "forms.notes": ["create", "delete", "find", "update"],
  media: ["create", "delete", "find", "get", "replaceContent", "update"],
  notification: ["find", "get"],
  "notification.emailAddress": ["activate", "archive", "create", "delete", "find", "get", "update"],
  "notification.emailDomain": ["create", "delete", "find", "get", "verify"],
  "notification.template": ["create", "defaults", "delete", "find", "get", "preview", "test", "update"],
  platform: ["getCurrencies", "getStorePlans", "getWebhookEvents"],
  "platform.administrator": ["add", "list", "me", "remove"],
  "platform.stripeBillingEvent": ["find", "resolve"],
  store: ["allowEmailSending", "create", "find", "get", "pauseEmailSending", "requestDeletion", "update"],
  "store.location": ["create", "delete", "get", "getByKey", "getCountries", "getCountry", "list", "update"],
  "store.market": ["create", "delete", "get", "getByKey", "list", "update"],
  "store.member": ["acceptInvite", "add", "changeStatus", "find", "findOwn", "getOwn", "invite", "remove", "transferOwnership", "updateRoles"],
  "store.paymentOption": ["create", "get", "getByKey", "list", "update"],
  "store.paymentOption.monri": ["create"],
  "store.paymentOption.stripe": ["connect", "createWebhook", "refresh", "replaceKeys", "rotateWebhookSecret"],
  "store.role": ["create", "delete", "find", "get", "update"],
  "store.salesChannel": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.shippingMethod": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.shippingProfile": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.storefrontKey": ["create", "find", "get", "revoke"],
  "store.subscription": ["createPortalSession", "endGrant", "get", "select"],
  "store.taxCategory": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.usage": ["find"],
  "store.webhook": ["create", "delete", "list", "test", "update"],
  "store.zone": ["create", "delete", "find", "get", "getByKey", "update"],
  "support.conversation": ["assign", "attachmentLink", "find", "findMessages", "get", "getMessage", "reply", "resolve", "selectSendingAddress"],
  "support.conversation.notes": ["create", "delete", "find", "update"],
  "support.flow": ["create", "delete", "find", "get", "update"],
};

function surfaceOf(client) {
  const groups = {};
  const walk = (value, path) => {
    for (const key of Object.keys(value).sort()) {
      if (path === "" && key === "utils") continue;
      const child = value[key];
      if (typeof child === "function") (groups[path || "(root)"] ??= []).push(key);
      else if (child && typeof child === "object") walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(client, "");
  return groups;
}

function admin() {
  return createAdmin({ baseUrl: API, apiToken: "contract-token" });
}

test("store currencies and minor units match the Server's currency table, in its order", () => {
  assert.deepEqual([...SUPPORTED_STORE_CURRENCIES], expectedStoreCurrencies);
  for (const currency of expectedStoreCurrencies) {
    assert.equal(getCurrencyMinorUnits(currency), minorUnitExceptions[currency] ?? 2, currency);
  }
  assert.equal(convertToMinor(1.234, "kwd"), 1234);
  assert.equal(getCurrencyMinorUnits(" JPY "), 0);
  assert.equal(convertToMinor(12.34, "usd"), 1234);
  assert.equal(convertToMajor(1234, "usd"), 12.34);
  assert.equal(convertToMinor(100, "jpy"), 100);
  assert.equal(convertToMajor(100, "krw"), 100);
  assert.match(formatMinor(100, "jpy", "en"), /100/);
  assert.doesNotMatch(formatMinor(100, "jpy", "en"), /100[.,]00/);
  for (const currency of ["idr", "huf", "all"]) {
    assert.equal(convertToMajor(1234, currency), 12.34);
    assert.equal(convertToMinor(12.34, currency), 1234);
    assert.match(formatMinor(1234, currency, "en"), /12[.,]34/, currency);
  }
  assert.throws(() => convertToMinor(1, "zzz"), /Unsupported currency/);
});

test("the Admin client exposes exactly the reviewed future-3 surface", () => {
  assert.deepEqual(surfaceOf(admin()), adminSurface);
});

test("deleted features and store switching are absent from the Admin client", () => {
  const client = admin();
  for (const removed of ["setStoreId", "getStoreId", "social", "automations", "mailbox", "mailboxes", "campaign", "campaigns", "leadResearch", "cms", "crm", "customer", "commerce"]) {
    assert.equal(removed in client, false, removed);
  }
  for (const removed of [
    "refund", "capture", "dispute", "digital", "checkout", "subscriptionPlanEntitlement", "customerGroupEmailConsent",
    "subscription", "subscriptionPlan", "subscriptionOffering",
  ]) {
    assert.equal(removed in client.eshop, false, removed);
  }
  for (const removed of ["buildHook", "paymentTerms", "taxRule", "shippingRate", "marketZone", "storefrontClient"]) assert.equal(removed in client.store, false, removed);
  for (const removed of ["stop", "emailSender"]) assert.equal(removed in client.notification, false, removed);
  for (const removed of ["channel", "ai"]) assert.equal(removed in client.support, false, removed);
  assert.equal("category" in client.content, false);
  for (const removed of ["getCheckout", "retainSelection", "recoverSelection", "pendingSelection", "cancel", "reactivate", "getPlans"]) {
    assert.equal(removed in client.store.subscription, false, removed);
  }
  for (const removed of ["setup", "configure", "cancelConfiguration", "getConfigurationChange", "openDashboard", "getConnection"]) {
    assert.equal(removed in client.store.paymentOption.stripe, false, removed);
  }
  assert.equal("googleStart" in client.account.auth, false);
  assert.equal("update" in client.account, false);
});

test("broadcasts are created under the app-picked id, scheduled, sent and tested with explicit versions and language", async (context) => {
  const broadcastId = "6e2b9d41-3c58-4a07-9f1e-2d7c5b0a8e63";
  const testId = "1a5c8e27-4b39-4d60-a2f7-9e3d0c6b5a18";
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : call.path.endsWith("/broadcasts") && call.method === "GET" ? { items: [], cursor: null } : { id: broadcastId });
  const api = admin().broadcast;
  const content = { en: { subject: "Spring box", preheader: null, body: "<p>Hello</p>" } };
  const audience = { type: "customer_groups", customer_group_ids: ["group"] };
  const offeringAudience = { type: "customer_group_offering", customer_group_offering_id: "offering" };
  await api.find({ store_id: STORE_ID, query: "spring", status: "draft", limit: 5 });
  await api.create({ store_id: STORE_ID, id: broadcastId, key: "spring", audience, sending_address_id: "address", content });
  await api.update({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 1, content, audience: offeringAudience, sending_address_id: "other-address" });
  await api.preview({ store_id: STORE_ID, id: broadcastId, language: "en" });
  await api.test({ store_id: STORE_ID, id: broadcastId, notification_id: testId, language: "en" });
  await api.schedule({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 2, send_at: 1_900_000_000_000 });
  await api.unschedule({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 3 });
  await api.send({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 4 });
  await api.delete({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 5 });
  const base = `/v1/stores/${STORE_ID}/broadcasts`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { query: "spring", status: "draft", limit: "5" }, null],
    ["POST", base, {}, { id: broadcastId, key: "spring", audience, sending_address_id: "address", content }],
    ["PUT", `${base}/${broadcastId}`, {}, { expected_updated_at: 1, content, audience: offeringAudience, sending_address_id: "other-address" }],
    ["POST", `${base}/${broadcastId}/preview`, {}, { language: "en" }],
    ["POST", `${base}/${broadcastId}/test`, {}, { id: testId, language: "en" }],
    ["POST", `${base}/${broadcastId}/schedule`, {}, { expected_updated_at: 2, send_at: 1_900_000_000_000 }],
    ["POST", `${base}/${broadcastId}/unschedule`, {}, { expected_updated_at: 3 }],
    ["POST", `${base}/${broadcastId}/send`, {}, { expected_updated_at: 4 }],
    ["DELETE", `${base}/${broadcastId}`, { expected_updated_at: "5" }, null],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "spring", key: "spring", audience, sending_address_id: "address", content }), TypeError);
  await assert.rejects(async () => api.test({ store_id: STORE_ID, id: broadcastId, notification_id: "test-1", language: "en" }), {
    name: "TypeError",
    message: "The test email id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 9);
});

test("broadcast merge fields name the member's customer group and offering, and no subscription", () => {
  assert.deepEqual([...BROADCAST_FIELDS], [
    "customer.first_name",
    "customer.last_name",
    "customer.email",
    "store.name",
    "customer_group_member.customer_group.key",
    "customer_group_member.customer_group_offering.key",
    "unsubscribe_url",
  ]);
  assert.deepEqual([...BROADCAST_BLOCK_FIELD_PREFIXES], [
    "customer_group_member.customer_group.blocks.",
    "customer_group_member.customer_group_offering.blocks.",
  ]);
  assert.equal([...BROADCAST_FIELDS, ...BROADCAST_BLOCK_FIELD_PREFIXES].some((field) => field.startsWith("subscription.")), false);
});

test("sales channels are created under the app-picked id with their markets and edited by version", async (context) => {
  const channelId = "8d3f1b75-2a46-4c09-b7e2-5f9a1c3d6e40";
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : { id: channelId });
  const api = admin().store.salesChannel;
  await api.create({ store_id: STORE_ID, id: channelId, key: "web", market_ids: ["market"], status: { type: "active" } });
  await api.update({ store_id: STORE_ID, id: channelId, expected_updated_at: 2, market_ids: [], status: { type: "archived" } });
  await api.delete({ store_id: STORE_ID, id: channelId, expected_updated_at: 3 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/sales-channels`, {}, { id: channelId, key: "web", market_ids: ["market"], status: { type: "active" } }],
    ["PUT", `/v1/stores/${STORE_ID}/sales-channels/${channelId}`, {}, { expected_updated_at: 2, market_ids: [], status: { type: "archived" } }],
    ["DELETE", `/v1/stores/${STORE_ID}/sales-channels/${channelId}`, { expected_updated_at: "3" }, null],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "web", key: "web", market_ids: [], status: { type: "active" } }), TypeError);
  assert.equal(calls.length, 3);
});

test("platform reads and administrator changes use the platform routes, and a new administrator brings its app-picked id", async (context) => {
  const administratorId = "2f6a9c13-8b47-4d05-a1e8-7c3b0d5f9e26";
  const calls = recordFetch(context, (call) => call.path === "/v1/platform/currencies" ? ["eur"] : call.path === "/v1/platform/events" ? [] : call.method === "DELETE" ? true : { items: [], cursor: null });
  const platform = admin().platform;
  await platform.getCurrencies();
  await platform.getWebhookEvents();
  await platform.getStorePlans();
  await platform.administrator.list({ cursor: "next" });
  await platform.administrator.add({ id: administratorId, account_id: "account" });
  await platform.administrator.remove({ id: administratorId });
  await platform.stripeBillingEvent.find({ status: "review", limit: 10 });
  await platform.stripeBillingEvent.resolve({ id: "event/1", expected_updated_at: 4, resolution: "apply" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/platform/currencies", {}, null],
    ["GET", "/v1/platform/events", {}, null],
    ["GET", "/v1/stores/plans", {}, null],
    ["GET", "/v1/platform/administrators", { cursor: "next" }, null],
    ["POST", "/v1/platform/administrators", {}, { id: administratorId, account_id: "account" }],
    ["DELETE", `/v1/platform/administrators/${administratorId}`, {}, null],
    ["GET", "/v1/platform/provider-events/stripe-billing", { status: "review", limit: "10" }, null],
    ["POST", "/v1/platform/provider-events/stripe-billing/event%2F1/resolve", {}, { expected_updated_at: 4, resolution: "apply" }],
  ]);
  await assert.rejects(async () => platform.administrator.add({ id: "admin", account_id: "account" }), TypeError);
  assert.equal(calls.length, 8);
});
