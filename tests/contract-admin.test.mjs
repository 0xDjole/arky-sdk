import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { SUPPORTED_STORE_CURRENCIES, convertToMajor, convertToMinor, formatMinor, getCurrencyMinorUnits } from "../dist/utils.js";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

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
  account: ["delete", "find", "getMe", "updateProfile"],
  "account.auth": ["confirmPlatformSecondFactor", "confirmSecondFactor", "refresh", "requestCode", "requestPlatformCode", "setUpPlatformSecondFactor", "setUpSecondFactor", "verify", "verifyPlatform", "verifyPlatformSecondFactor", "verifySecondFactor"],
  "account.secondFactor": ["newRecoveryCodes", "setup", "turnOff", "turnOn"],
  "account.session": ["find", "revoke"],
  "account.token": ["create", "delete", "find", "revoke"],
  actions: ["find"],
  counts: ["getReport", "getStatuses"],
  broadcast: ["create", "delete", "find", "get", "preview", "schedule", "send", "test", "unschedule", "update"],
  category: ["create", "delete", "find", "findChildren", "get", "update"],
  companies: ["create", "delete", "find", "get", "reviewTaxRegistration", "setPurchasing", "setTax", "submitTaxRegistration", "update"],
  "companies.location": ["create", "delete", "find", "get", "reviewTaxRegistration", "setFulfillment", "setPurchasing", "setTax", "submitTaxRegistration", "update"],
  "companies.membership": ["create", "delete", "find", "get", "resendInvite", "update"],
  "companies.notes": ["create", "delete", "find", "update"],
  "companies.role": ["create", "delete", "find", "get", "update"],
  "content.collection": ["create", "delete", "find", "get", "getByKey", "getCleanup", "update"],
  "content.entry": ["create", "delete", "find", "get", "update"],
  "content.privateCollection": ["create", "delete", "find", "get", "update"],
  "content.privateEntry": ["create", "delete", "fileLink", "find", "get", "print", "update"],
  customers: ["create", "createLogin", "deleteLogin", "erase", "export", "find", "findLogins", "findSessions", "get", "import", "inviteLogin", "merge", "previewImport", "revokeAllSessions", "revokeSession", "update", "updateLogin"],
  "customers.suppression": ["blockEmail", "blockSms", "find", "get", "recordResubscribe", "recordUnsubscribe", "releaseSms", "unblockEmail"],
  "customers.notes": ["create", "delete", "find", "update"],
  "eshop.bookingOffering": ["create", "delete", "find", "get", "getByServiceAndResource", "update"],
  "eshop.bookingResource": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.bookingService": ["create", "delete", "find", "get", "getAvailability", "getByKey", "update"],
  "eshop.cart": ["addBooking", "addPackage", "addProduct", "checkout", "checkoutOnAccount", "clear", "create", "find", "get", "getOrder", "quote", "quoteFutureDeliveries", "quotePurchase", "removeItem", "selectShippingMethod", "setFutureDeliveries", "update"],
  "eshop.cart.offer": ["create", "quote", "send", "withdraw"],
  "eshop.package": ["copy", "create", "delete", "find", "findPurchasable", "get", "getByKey", "update"],
  "eshop.packageAccess": ["create", "delete", "find", "get"],
  "eshop.packageItem": ["batch", "create", "delete", "find", "get", "setAllPrices", "update"],
  "eshop.packageItemPrice": ["batch", "create", "delete", "find", "get", "getByChoice", "update"],
  "eshop.packageMember": [
    "assign", "cancel", "changeMinimum", "changeTerms", "find", "findOrders", "findRevisions", "get",
    "getCalendar", "getCurrent", "getMinimum", "getRevision", "pause", "resume", "reviewMinimum",
    "reviewSwitch", "reviewTerms", "revoke", "scheduleEnd", "selectPaymentMethod", "skipNext", "switch",
    "transferMinimum", "withdrawRevision",
  ],
  "eshop.packageOffering": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.digitalAsset": ["archive", "find", "get", "upload"],
  "eshop.fulfillment": ["create", "execute", "find", "get", "markDelivered", "updateTracking"],
  "eshop.fulfillmentJob": ["execute", "find", "findItems", "get", "getPickupCash", "getUnitSlots", "recordPickupCash"],
  "eshop.fulfillmentRouting": ["get", "update"],
  "eshop.inventoryItem": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.inventoryLevel": ["create", "find", "findStock", "get", "makeAvailable", "move", "receiveMove", "remove", "setAside"],
  "eshop.inventoryMovement": ["find", "get", "record"],
  "eshop.inventoryUnit": ["allocate", "find", "get", "makeAvailable", "move", "receive", "setAside", "unassign", "writeOff"],
  "eshop.minimumProgress": ["get"],
  "eshop.order": ["answerBookingItem", "attendBookingItem", "cancel", "cancelBookingItem", "cancelBookingSeries", "cancelProductItem", "correctDeliveryAddress", "find", "findBookingItems", "findFinancialSummaries", "findPayments", "get", "getFinancialSummary", "getPayment", "markBookingItemNoShow", "markBookingItemWaiting", "rescheduleBookingItem", "rescheduleBookingSeries", "resendReceipt", "resizeBookingItem", "resumePayment", "revokeAccess", "startBookingItem", "stepBookingItem", "update"],
  "eshop.order.credit": ["create", "find", "get", "void"],
  "eshop.order.invoice": ["create", "delete", "find"],
  "eshop.order.notes": ["create", "delete", "find", "update"],
  "eshop.payment": ["cancel", "cancelRefund", "createManual", "createRefund", "find", "get", "recordCollection", "recordMadeRefund", "recordRefundReceipt", "resolveCharge", "resolveHold", "resolveRefund", "voidCollection"],
  "eshop.paymentMethod": ["cancelSetup", "completeSetup", "find", "get", "requestSetup", "revoke", "startSetup"],
  "eshop.product": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.productVariant": ["create", "delete", "find", "get", "update"],
  "eshop.promotion": ["create", "delete", "find", "get", "getByKey", "update"],
  "eshop.promotionCode": ["create", "delete", "find", "get", "getByCode", "update"],
  "notification.incomingWebhook": ["find", "get", "resolve"],
  "eshop.rental": ["execute", "find", "get"],
  "eshop.return": ["create", "credit", "execute", "find", "findRentalOptions", "get", "getDestinationOptions", "getInspectionUnit", "getOrderOptions"],
  experiments: ["complete", "create", "delete", "find", "get", "getResults", "pause", "resume", "start", "update"],
  forms: ["changeSubmissionStage", "create", "createSubmission", "delete", "deleteSubmission", "find", "findSubmissions", "get", "getByKey", "getSubmission", "getSubmissionFile", "update"],
  "forms.notes": ["create", "delete", "find", "update"],
  media: ["create", "delete", "find", "get", "replaceContent", "update"],
  "notification.notification": ["create", "delete", "find", "get", "sendBookingReminder", "update"],
  "notification.outgoingMessage": ["find", "get"],
  "notification.outgoingWebhook": ["find", "get"],
  "notification.emailAddress": ["create", "delete", "find", "get", "getNetworkDomain", "getReadiness"],
  "notification.layout": ["create", "delete", "find", "get", "update"],
  "notification.resendEvent": ["find", "resolve"],
  "notification.template": ["create", "delete", "find", "findDefaults", "get", "preview", "test", "update"],
  platform: ["findCurrencies", "findWebhookEvents"],
  "platform.account": ["add", "delete", "find", "getMe", "resetSecondFactor"],
  "platform.resendEvent": ["find", "resolve"],
  "platform.stripeBillingEvent": ["find", "resolve"],
  store: ["allowEmailSending", "create", "find", "get", "pauseEmailSending", "requestDeletion", "resume", "suspend", "update", "wipe"],
  "store.country": ["find", "get"],
  "store.location": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.market": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.member": ["acceptInvite", "changeStatus", "find", "findDirectory", "findOwn", "findSessions", "getOwn", "invite", "remove", "resendInvite", "revokeSession", "transferOwnership", "updateLocations", "updateRoles"],
  "store.auditLog": ["find"],
  "store.supportAccess": ["end", "find", "findOwn", "get", "open"],
  "store.paymentOption": ["create", "createArkyMonri", "createArkyStripe", "createMonri", "createStripe", "find", "get", "getByKey", "update"],
  "store.phoneNumber": ["create", "delete", "find", "get", "setUpAgain"],
  "store.provider": ["checkResendSetup", "checkStripeSetup", "connectArkyElevenLabs", "connectArkyMonri", "connectArkyResend", "connectArkyStripe", "connectArkyTwilio", "connectElevenLabs", "connectMonri", "connectNetworkTwilio", "connectResend", "connectStripe", "connectTwilio", "delete", "find", "findLogins", "findNetworkLogins", "findResendDomains", "get", "refreshStripe", "replaceMonriMerchantKey", "replaceResendKey", "replaceStripeKeys", "replaceTwilioAuthToken", "saveStripeWebhookSecret", "setSmsSender", "setStatus", "setUpElevenLabsAgain"],
  "store.role": ["create", "delete", "find", "get", "update"],
  "store.salesChannel": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.shippingMethod": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.shippingProfile": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.simulator.calls": ["start"],
  "store.simulator.emails": ["find"],
  "store.simulator.payments": ["decline", "expire", "pay"],
  "store.simulator.plannedOutcomes": ["create", "find", "remove"],
  "store.simulator.sms": ["find"],
  "store.subscription": ["cancel", "changePlan", "createCardSetup", "endGrant", "get", "grant", "pendingPayment", "setCard"],
  "store.taxCategory": ["create", "delete", "find", "get", "getByKey", "update"],
  "store.usage": ["get"],
  "store.plan": ["get"],
  "store.agreement": ["get"],
  "store.testStores": ["find"],
  network: ["create", "delete", "find", "get", "update"],
  "network.provider": ["connectElevenLabs", "connectResend", "connectStripe", "connectTwilio", "delete", "find", "get", "replaceResendKey", "replaceStripeKeys", "replaceTwilioAuthToken", "setStatus", "setUpElevenLabsAgain", "updateResend"],
  "network.plan": ["create", "delete", "find", "update"],
  "network.store": ["find", "get", "getAgreement"],
  "network.role": ["create", "delete", "find", "get", "update"],
  "network.member": ["acceptInvite", "changeStatus", "find", "getOwn", "invite", "remove", "resetSecondFactor", "updateRoles"],
  "store.webhook": ["create", "delete", "find", "test", "update"],
  "store.zone": ["create", "delete", "find", "get", "getByKey", "update"],
  "support.call": ["find", "get", "getRecordingLink"],
  "support.conversation": ["assign", "changeChatVisibility", "find", "findMessages", "get", "getAttachmentLink", "getMessage", "markRead", "markUnread", "reopen", "reply", "resolve", "selectReplyEmail", "sendCustomerSms", "sendSms", "startChat", "startEmail"],
  "support.conversation.notes": ["create", "delete", "find", "update"],
  "support.flow": ["create", "delete", "find", "get", "update"],
};

function surfaceOf(client) {
  const groups = {};
  const walk = (value, path) => {
    for (const key of Object.keys(value).sort()) {
      const child = value[key];
      if (typeof child === "function") (groups[path || "(root)"] ??= []).push(key);
      else if (child && typeof child === "object") walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(client, "");
  return groups;
}

function admin() {
  return createAdmin({ apiUrl: API, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
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

test("the Admin client exposes exactly the reviewed Domain5 surface", () => {
  assert.deepEqual(surfaceOf(admin()), adminSurface);
});

test("deleted features and store switching are absent from the Admin client", () => {
  const client = admin();
  for (const removed of ["setStoreId", "getStoreId", "social", "automations", "mailbox", "mailboxes", "campaign", "campaigns", "leadResearch", "cms", "crm", "customer", "commerce"]) {
    assert.equal(removed in client, false, removed);
  }
  for (const removed of [
    "refund", "capture", "dispute", "digital", "checkout",
    "subscription", "subscriptionPlan", "subscriptionOffering", "price",
  ]) {
    assert.equal(removed in client.eshop, false, removed);
  }
  for (const removed of ["buildHook", "paymentTerms", "taxRule", "shippingRate", "marketZone", "storefrontClient"]) assert.equal(removed in client.store, false, removed);
  for (const removed of ["stop", "emailSender", "emailProvider", "outgoingEmail"]) assert.equal(removed in client.notification, false, removed);
  assert.equal("emails" in client.store, false);
  assert.equal("entryAccess" in client.content, false);
  for (const removed of ["channel", "ai"]) assert.equal(removed in client.support, false, removed);
  assert.equal("category" in client.content, false);
  for (const removed of ["getCheckout", "retainSelection", "recoverSelection", "pendingSelection", "reactivate", "getPlans", "select", "createPortalSession"]) {
    assert.equal(removed in client.store.subscription, false, removed);
  }
  for (const removed of ["stripe", "monri", "arkyStripe", "arkyMonri"]) assert.equal(removed in client.store.paymentOption, false, removed);
  for (const removed of ["setup", "configure", "cancelConfiguration", "getConfigurationChange", "openDashboard", "getConnection", "createWebhook", "rotateWebhookSecret"]) {
    assert.equal(removed in client.store.provider, false, removed);
  }
  assert.equal("decide" in client.eshop.fulfillmentJob, false);
  assert.equal("googleStart" in client.account.auth, false);
  assert.equal("update" in client.account, false);
});

test("broadcasts are created under the app-picked id, scheduled, sent and tested with explicit versions and language", async (context) => {
  const broadcastId = "6e2b9d41-3c58-4a07-9f1e-2d7c5b0a8e63";
  const testId = "1a5c8e27-4b39-4d60-a2f7-9e3d0c6b5a18";
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : call.path.endsWith("/broadcasts") && call.method === "GET" ? { items: [], cursor: null } : { id: broadcastId });
  const api = admin().broadcast;
  const audience = { type: "package_members", include: [{ type: "package", package_id: "package" }], exclude: [], conditions: [] };
  const offeringAudience = { type: "package_members", include: [{ type: "package_offering", package_offering_id: "offering" }], exclude: [{ type: "package", package_id: "package" }], conditions: [{ type: "ordered_within", days: 30 }] };
  const emailType = { type: "email", email_template_id: "8c1e5a93-2d47-4b06-9f3a-6e0b4d8c2a71", email_address_id: "3f7b0d26-9a41-4c85-b2e6-1d5a8f3c7e09", from_name: "Shop", reply_to_address_id: "3f7b0d26-9a41-4c85-b2e6-1d5a8f3c7e09", audience };
  const otherType = { ...emailType, from_name: "Shop team", audience: offeringAudience };
  await api.find({ store_id: STORE_ID, query: "spring", status: "draft", limit: 5 });
  await api.create({ store_id: STORE_ID, id: broadcastId, key: "spring", type: emailType });
  await api.update({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 1, type: otherType });
  await api.preview({ store_id: STORE_ID, id: broadcastId, language: "en" });
  await api.test({ store_id: STORE_ID, id: broadcastId, outgoing_message_id: testId, language: "en" });
  await api.schedule({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 2, send_at: 1_900_000_000_000 });
  await api.unschedule({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 3 });
  await api.send({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 4 });
  await api.delete({ store_id: STORE_ID, id: broadcastId, expected_updated_at: 5 });
  const base = `/v1/stores/${STORE_ID}/broadcasts`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { query: "spring", status: "draft", limit: "5" }, null],
    ["POST", base, {}, { id: broadcastId, key: "spring", type: emailType }],
    ["PUT", `${base}/${broadcastId}`, {}, { expected_updated_at: 1, type: otherType }],
    ["POST", `${base}/${broadcastId}/preview`, {}, { language: "en" }],
    ["POST", `${base}/${broadcastId}/test`, {}, { id: testId, language: "en" }],
    ["POST", `${base}/${broadcastId}/schedule`, {}, { expected_updated_at: 2, send_at: 1_900_000_000_000 }],
    ["POST", `${base}/${broadcastId}/unschedule`, {}, { expected_updated_at: 3 }],
    ["POST", `${base}/${broadcastId}/send`, {}, { expected_updated_at: 4 }],
    ["DELETE", `${base}/${broadcastId}`, { expected_updated_at: "5" }, null],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "spring", key: "spring", type: emailType }), TypeError);
  await assert.rejects(async () => api.test({ store_id: STORE_ID, id: broadcastId, outgoing_message_id: "test-1", language: "en" }), {
    name: "TypeError",
    message: "The test email id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 9);
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

test("a sales channel delete that finds no channel, deleted or another store's, rejects with the Server's 404", async (context) => {
  const channelId = "8d3f1b75-2a46-4c09-b7e2-5f9a1c3d6e40";
  const calls = recordFetch(context, () => errorResponse(404, "GENERAL.NOT_FOUND", "Not found"));
  await assert.rejects(
    admin().store.salesChannel.delete({ store_id: STORE_ID, id: channelId, expected_updated_at: 3 }),
    (error) => error.statusCode === 404 && error.code === "GENERAL.NOT_FOUND",
  );
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["DELETE", `/v1/stores/${STORE_ID}/sales-channels/${channelId}`, { expected_updated_at: "3" }],
  ]);
});

test("platform accounts are listed, added and deleted, and network events name their login", async (context) => {
  const accountId = "2f6a9c13-8b47-4d05-a1e8-7c3b0d5f9e26";
  const providerId = "7b3e9d15-4c28-4a60-b8f1-3e6d0a9c5b72";
  const calls = recordFetch(context, (call) => call.path === "/v1/platform/currencies" ? ["eur"] : call.path === "/v1/platform/events" ? [] : { items: [], cursor: null });
  const platform = admin().platform;
  assert.deepEqual(await platform.findCurrencies(), { items: ["eur"], cursor: null });
  assert.deepEqual(await platform.findWebhookEvents(), { items: [], cursor: null });
  await platform.account.find({ cursor: "next" });
  await platform.account.getMe();
  await platform.account.add({ id: accountId, email: "admin@example.test" });
  await platform.account.delete({ account_id: accountId });
  await platform.stripeBillingEvent.find({ network_id: ids.network, network_provider_id: providerId, status: "review", limit: 10 });
  await platform.stripeBillingEvent.resolve({ network_id: ids.network, network_provider_id: providerId, id: "event/1", expected_updated_at: 4, resolution: "apply" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/platform/currencies", {}, null],
    ["GET", "/v1/platform/events", {}, null],
    ["GET", "/v1/accounts", { cursor: "next", access: "platform" }, null],
    ["GET", "/v1/accounts/me/platform-admin", {}, null],
    ["POST", "/v1/accounts", {}, { id: accountId, email: "admin@example.test" }],
    ["DELETE", `/v1/accounts/${accountId}`, {}, null],
    ["GET", "/v1/platform/incoming-webhooks/stripe-billing", { network_id: ids.network, network_provider_id: providerId, status: "review", limit: "10" }, null],
    ["POST", "/v1/platform/incoming-webhooks/stripe-billing/event%2F1/resolve", {}, { network_id: ids.network, network_provider_id: providerId, expected_updated_at: 4, resolution: "apply" }],
  ]);
  assert.equal("access" in platform, false);
  await assert.rejects(async () => platform.account.add({ id: "account", email: "admin@example.test" }), TypeError);
  assert.equal(calls.length, 8);
});
