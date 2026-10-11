import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createAdmin, SDK_VERSION } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl as baseUrl, ids, jsonResponse, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const storeId = ids.store;
const otherStoreId = ids.otherStore;
const sessionId = "7f2a5c90-1d64-4e38-b9a7-0c3e8f6d2b15";

function admin() {
  return createAdmin({ baseUrl, apiToken: "arky_api_admin_contract" });
}

function issued(overrides = {}) {
  return {
    id: sessionId,
    access_token: "access-client-contract",
    refresh_token: "refresh-client-contract",
    access_expires_at: Date.now() + 600_000,
    refresh_expires_at: Date.now() + 3_600_000,
    authenticated_at: 20,
    created_at: 10,
    updated_at: 20,
    ...overrides,
  };
}

test("Admin reads need no Market or Store context and invent none", async (context) => {
  const calls = recordFetch(context, () => ({ id: storeId }));
  const client = admin();
  for (const removed of ["getMarket", "setMarket", "getStoreId", "setStoreId", "getLocale", "setLocale"]) {
    assert.equal(removed in client, false, removed);
  }
  await client.store.get({ id: storeId });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].href, `${baseUrl}/v1/stores/${storeId}`);
  for (const header of ["x-arky-market", "x-arky-locale", "x-arky-sales-channel", "x-arky-publishable-key"]) {
    assert.equal(calls[0].headers.has(header), false, header);
  }
});

test("notification history routes keep recipient and owner filters, and a queued notification has no stop", async (context) => {
  const notification = {
    id: ids.payment,
    type: {
      type: "email",
      email_type: { type: "receipt_resend", sending_address_id: ids.paymentOption, order_id: ids.order, to: "buyer@example.test" },
      send_before: null,
      status: { type: "waiting" },
    },
    created_at: 1,
    updated_at: 1,
  };
  const webhook = {
    id: ids.credit,
    type: { type: "webhook", store_id: storeId, webhook_id: ids.form, event_id: ids.submission, event_type: "order.created", status: { type: "acknowledged", at: 2 } },
    created_at: 1,
    updated_at: 2,
  };
  const responses = [{ items: [notification], cursor: null }, notification, { items: [webhook], cursor: null }];
  const calls = recordFetch(context, () => responses.shift());
  const client = admin();
  const page = await client.notification.find({ store_id: storeId, to: "buyer@example.test", type: "receipt_resend", order_id: ids.order, limit: 25 });
  assert.deepEqual(page.items, [notification]);
  assert.deepEqual(await client.notification.get({ store_id: storeId, id: notification.id }), notification);
  assert.deepEqual((await client.notification.find({ store_id: storeId, type: "webhook", webhook_id: ids.form })).items, [webhook]);
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["GET", `${baseUrl}/v1/stores/${storeId}/notifications?to=buyer%40example.test&type=receipt_resend&order_id=${ids.order}&limit=25`, null],
    ["GET", `${baseUrl}/v1/stores/${storeId}/notifications/${notification.id}`, null],
    ["GET", `${baseUrl}/v1/stores/${storeId}/notifications?type=webhook&webhook_id=${ids.form}`, null],
  ]);
  for (const removed of ["stop", "cancel", "delivery", "mailbox", "email", "emailSender"]) assert.equal(removed in client.notification, false, removed);
});

test("admin code login activates the same pending Account Session and remembers the email it was asked for", async (context) => {
  const responses = [{ session_id: "session-client-contract", verification_expires_at: 900 }, issued()];
  const calls = recordFetch(context, () => responses.shift());
  const client = createAdmin({ baseUrl });
  const pending = await client.account.auth.code({ email: "operator@example.test" });
  const verified = await client.account.auth.verify({ session_id: pending.session_id, code: "123456" });
  assert.equal(verified.id, sessionId);
  assert.equal("scope" in verified, false);
  assert.deepEqual(client.session, { id: sessionId, email: "operator@example.test" });
  assert.equal(client.isAuthenticated, true);
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["POST", `${baseUrl}/v1/auth/code`, { email: "operator@example.test" }],
    ["POST", `${baseUrl}/v1/auth/verify`, { session_id: "session-client-contract", code: "123456" }],
  ]);
});

test("Store invitation login names its Store and wraps the platform-wide pending Account Session", async (context) => {
  const responses = [{ session_id: "session-invitation-contract", verification_expires_at: 900 }, issued({ id: "0b8e4d27-5f13-4a69-9c2e-7d1a6f3b8e40" })];
  const calls = recordFetch(context, () => responses.shift());
  const client = createAdmin({ baseUrl });
  const pending = await client.account.auth.storeCode(otherStoreId, { email: "invitee@example.test" });
  const verified = await client.account.auth.storeVerify(otherStoreId, { session_id: pending.session_id, code: "123456" });
  assert.equal(verified.id, "0b8e4d27-5f13-4a69-9c2e-7d1a6f3b8e40");
  await assert.rejects(async () => client.account.auth.storeCode("store-invitation-contract", { email: "invitee@example.test" }), TypeError);
  await assert.rejects(async () => client.account.auth.storeVerify(undefined, { session_id: "pending", code: "123456" }), TypeError);
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["POST", `${baseUrl}/v1/stores/${otherStoreId}/auth/code`, { email: "invitee@example.test" }],
    ["POST", `${baseUrl}/v1/stores/${otherStoreId}/auth/verify`, { session_id: "session-invitation-contract", code: "123456" }],
  ]);
});

test("admin refresh rotates only the current Account Session", async (context) => {
  const responses = [issued({ access_token: "access-previous", refresh_token: "refresh-previous" }), issued({ access_token: "access-rotated", refresh_token: "refresh-rotated", updated_at: 1000 })];
  const calls = recordFetch(context, () => responses.shift());
  const client = createAdmin({ baseUrl });
  await client.account.auth.storeVerify(storeId, { session_id: "pending-session", code: "123456" });
  await assert.rejects(client.account.auth.refresh({ refresh_token: "refresh-unknown" }), /Account session changed/);
  assert.equal(calls.length, 1);
  const result = await client.account.auth.refresh({ refresh_token: "refresh-previous" });
  assert.equal(result.access_token, "access-rotated");
  assert.equal(result.authenticated_at, 20);
  assert.deepEqual(client.session, { id: sessionId, email: undefined });
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["POST", `${baseUrl}/v1/stores/${storeId}/auth/verify`, { session_id: "pending-session", code: "123456" }],
    ["POST", `${baseUrl}/v1/auth/refresh`, { refresh_token: "refresh-previous" }],
  ]);
});

test("request errors keep the server response and read its snake_case status and field errors", async (context) => {
  const response = {
    message: "Email is invalid",
    error: "GENERAL.VALIDATION_ERROR",
    status_code: 422,
    validation_errors: [{ field: "email", error: "" }, { field: "name", error: "CUSTOMER.NAME_TOO_LONG" }, { field: 5 }],
  };
  let errorContext;
  recordFetch(context, () => jsonResponse(response, 422));
  await assert.rejects(
    admin().account.auth.code({ email: "invalid" }, { onError: (failure) => { errorContext = failure; } }),
    (error) => {
      assert.equal(error.name, "ApiError");
      assert.equal(error.message, response.message);
      assert.equal(error.code, "GENERAL.VALIDATION_ERROR");
      assert.equal(error.statusCode, 422);
      assert.deepEqual(error.validationErrors, [
        { field: "email", error: "GENERAL.VALIDATION_ERROR" },
        { field: "name", error: "CUSTOMER.NAME_TOO_LONG" },
      ]);
      assert.deepEqual(error.response, response);
      return true;
    },
  );
  assert.equal(errorContext.status, 422);
  assert.equal(errorContext.response.statusCode, 422);
  assert.deepEqual(errorContext.response.validationErrors, [
    { field: "email", error: "" },
    { field: "name", error: "CUSTOMER.NAME_TOO_LONG" },
  ]);
});

test("a camelCase error body is not the Server's shape: its field errors are not read and the HTTP status stands", async (context) => {
  recordFetch(context, () => jsonResponse({ message: "Conflict", error: "CART.CHANGED", statusCode: 400, validationErrors: [{ field: "email", error: "bad" }] }, 409));
  await assert.rejects(admin().account.getMe(), (error) => {
    assert.equal(error.statusCode, 409);
    assert.deepEqual(error.validationErrors, []);
    assert.equal(error.code, "CART.CHANGED");
    return true;
  });
  recordFetch(context, () => new Response("upstream failure", { status: 502, headers: { "content-type": "text/plain" } }));
  await assert.rejects(admin().account.getMe(), (error) => {
    assert.equal(error.statusCode, 502);
    assert.equal(error.code, "REQUEST_FAILED");
    assert.equal(error.message, "Request failed");
    assert.deepEqual(error.validationErrors, []);
    return true;
  });
});

test("Store create carries the app-picked id, its languages, first market and channel; update carries the version", async (context) => {
  const store = { id: storeId, name: "Client Contract", owner_account_id: ids.account, timezone: "Europe/Sarajevo", languages: ["en", "bs"], status: { type: "active" }, email_sending: { type: "allowed" }, created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, () => store);
  const create = {
    id: storeId,
    name: "Client Contract",
    timezone: "Europe/Sarajevo",
    languages: ["en", "bs"],
    market: { key: "bih", currency: "bam", tax_mode: "inclusive" },
    sales_channel: { key: "web" },
  };
  assert.deepEqual(await admin().store.create(create), store);
  await admin().store.update({ id: storeId, expected_updated_at: 1, name: "Client Contract", languages: ["bs"] });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/stores", create],
    ["PUT", `/v1/stores/${storeId}`, { expected_updated_at: 1, name: "Client Contract", languages: ["bs"] }],
  ]);
  await assert.rejects(async () => admin().store.update({ id: "store/a?b", expected_updated_at: 1 }), TypeError);
  await assert.rejects(async () => admin().store.create({ ...create, id: undefined }), TypeError);
  assert.equal(calls.length, 2);
});

test("Store deletion request names the confirmation and version and answers the store marked deleting", async (context) => {
  const deleting = { id: storeId, status: { type: "deleting" }, updated_at: 3 };
  const calls = recordFetch(context, () => jsonResponse(deleting, 202));
  assert.deepEqual(await admin().store.requestDeletion({ id: storeId, confirmation: "Client Contract", expected_updated_at: 2 }), deleting);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `/v1/stores/${storeId}/deletion`, { confirmation: "Client Contract", expected_updated_at: 2 }],
  ]);
});

test("Store locations and webhooks carry app-picked ids and versions; a webhook test answers its notification", async (context) => {
  const address = { street1: "1 Contract Way", city: "Sarajevo", postal_code: "71000", country: "BA" };
  const calls = recordFetch(context, () => ({}));
  const client = admin();
  await client.store.location.create({ store_id: storeId, id: ids.companyLocation, key: "main", address, timezone: "Europe/Sarajevo" });
  await client.store.location.update({ store_id: storeId, id: ids.companyLocation, expected_updated_at: 4, status: { type: "archived" } });
  await client.store.location.delete({ store_id: storeId, id: ids.companyLocation, expected_updated_at: 5 });
  const webhook = { id: ids.form, url: "https://events.example.test/hook", events: [{ type: "customer.archived" }, { type: "form_submission.created", forms: { form_ids: [ids.form, ids.submission] } }, { type: "customer_group_member.activated" }], headers: {}, secret: "s".repeat(32), status: { type: "disabled" } };
  await client.store.webhook.create({ store_id: storeId, ...webhook });
  await client.store.webhook.update({ store_id: storeId, id: ids.form, expected_updated_at: 6, status: { type: "active" } });
  await client.store.webhook.test({ store_id: storeId, id: ids.submission, webhook_id: ids.form });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.query, call.body]), [
    ["POST", `/v1/stores/${storeId}/locations`, {}, { id: ids.companyLocation, key: "main", address, timezone: "Europe/Sarajevo" }],
    ["PUT", `/v1/stores/${storeId}/locations/${ids.companyLocation}`, {}, { expected_updated_at: 4, status: { type: "archived" } }],
    ["DELETE", `/v1/stores/${storeId}/locations/${ids.companyLocation}`, { expected_updated_at: "5" }, null],
    ["POST", `/v1/stores/${storeId}/webhooks`, {}, webhook],
    ["PUT", `/v1/stores/${storeId}/webhooks/${ids.form}`, {}, { expected_updated_at: 6, status: { type: "active" } }],
    ["POST", `/v1/stores/${storeId}/webhooks/test`, {}, { id: ids.submission, webhook_id: ids.form }],
  ]);
  await assert.rejects(async () => client.store.webhook.test({ store_id: storeId, id: "test-1", webhook_id: ids.form }), TypeError);
  assert.equal(calls.length, 6);
});

test("a market holds its ordered payment options and changes them with one PUT and the version", async (context) => {
  const stripe = {
    id: ids.paymentOption, store_id: storeId, key: "card", blocks: [], status: "active", created_at: 1, updated_at: 2,
    type: { type: "stripe", account_id: "acct_merchant", livemode: false, publishable_key: "pk_test_merchant", charges_enabled: true, account_checked_at: 2, webhook: { type: "not_created" } },
  };
  const cash = { id: ids.otherPaymentOption, store_id: storeId, key: "cash", blocks: [], status: "active", created_at: 1, updated_at: 1, type: { type: "cash_on_delivery" } };
  const market = { id: ids.market, store_id: storeId, key: "bih", currency: "bam", tax_mode: "inclusive", payment_option_ids: [], status: { type: "active" }, created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, (call) => call.path.endsWith("/payment-options") ? { items: [cash, stripe], cursor: null } : market);
  const client = admin();
  const options = await client.store.paymentOption.list({ store_id: storeId });
  assert.equal(options.items[0].type.type, "cash_on_delivery");
  assert.equal(options.items[1].type.charges_enabled, true);
  assert.equal(options.items[1].type.account_id, "acct_merchant");
  await client.store.market.create({ store_id: storeId, id: ids.market, key: "bih", currency: "bam", tax_mode: "inclusive" });
  await client.store.market.update({ store_id: storeId, id: ids.market, expected_updated_at: 1, payment_option_ids: [ids.paymentOption, ids.otherPaymentOption] });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["GET", `/v1/stores/${storeId}/payment-options`, null],
    ["POST", `/v1/stores/${storeId}/markets`, { id: ids.market, key: "bih", currency: "bam", tax_mode: "inclusive" }],
    ["PUT", `/v1/stores/${storeId}/markets/${ids.market}`, { expected_updated_at: 1, payment_option_ids: [ids.paymentOption, ids.otherPaymentOption] }],
  ]);
  for (const removed of ["marketPaymentOption", "marketZone", "paymentTerms"]) assert.equal(removed in client.store, false, removed);
});

test("admin Order reads by customer and cancels product units under the app's credit id, resending it on retry", async (context) => {
  let failFirst = true;
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET") return { items: [], cursor: null };
    if (failFirst) {
      failFirst = false;
      return jsonResponse({ message: "Response unavailable", status_code: 503 }, 503);
    }
    return { id: ids.order };
  });
  const client = admin();
  await client.eshop.order.find({ store_id: storeId, customer_id: ids.customer });
  const request = { store_id: otherStoreId, order_id: "order/one", line_item_id: "line/one", credit_id: ids.credit, expected_updated_at: 1789990000000, units: [{ first_unit: 1, quantity: 2 }, { first_unit: 5, quantity: 1 }] };
  await assert.rejects(client.eshop.order.cancelProductItem(request), (error) => error.statusCode === 503);
  assert.deepEqual(await client.eshop.order.cancelProductItem(request), { id: ids.order });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[1].body, calls[2].body);
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["GET", `${baseUrl}/v1/stores/${storeId}/orders?customer_id=${ids.customer}`, null],
    ["POST", `${baseUrl}/v1/stores/${otherStoreId}/orders/order%2Fone/product-items/line%2Fone/cancel`, { credit_id: ids.credit, expected_updated_at: 1789990000000, units: request.units }],
    ["POST", `${baseUrl}/v1/stores/${otherStoreId}/orders/order%2Fone/product-items/line%2Fone/cancel`, { credit_id: ids.credit, expected_updated_at: 1789990000000, units: request.units }],
  ]);
  await assert.rejects(async () => client.eshop.order.cancelProductItem({ ...request, credit_id: "cancellation-command" }), TypeError);
  await assert.rejects(async () => client.eshop.order.cancelProductItem({ ...request, store_id: "store/one" }), TypeError);
  assert.equal(calls.length, 3);
  for (const removed of ["getProducts", "getDigitalProducts", "cancelProduct", "resumePayment", "update"]) {
    assert.equal(removed in client.eshop.order, false, removed);
  }
});

test("a pending order is cancelled with the version and a receipt is resent under the app's notification id", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.order }));
  const client = admin();
  await client.eshop.order.cancel({ store_id: storeId, order_id: ids.order, expected_updated_at: 9 });
  await client.eshop.order.resendReceipt({ store_id: storeId, order_id: ids.order, id: ids.payment });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `/v1/stores/${storeId}/orders/${ids.order}/cancel`, { expected_updated_at: 9 }],
    ["POST", `/v1/stores/${storeId}/orders/${ids.order}/resend-receipt`, { id: ids.payment }],
  ]);
  await assert.rejects(async () => client.eshop.order.resendReceipt({ store_id: storeId, order_id: ids.order, id: "receipt-1" }), TypeError);
  assert.equal(calls.length, 2);
});

test("admin market deletion sends the version and answers the market marked deleting without a default replacement", async (context) => {
  const deleting = { id: ids.market, status: { type: "deleting" }, updated_at: 1788862721001 };
  const calls = recordFetch(context, () => jsonResponse(deleting, 202));
  assert.deepEqual(await admin().store.market.delete({ store_id: storeId, id: ids.market, expected_updated_at: 1788862721000 }), deleting);
  assert.deepEqual(calls.map((call) => [call.method, call.href]), [
    ["DELETE", `${baseUrl}/v1/stores/${storeId}/markets/${ids.market}?expected_updated_at=1788862721000`],
  ]);
});

test("Category is top-level on both clients", () => {
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl });
  assert.equal("category" in admin().content, false);
  assert.equal("category" in storefront.content, false);
  assert.equal(typeof admin().category.find, "function");
  assert.equal(typeof storefront.category.get, "function");
});

test("storefront collection lookup uses a keyless route with the publishable key and locale headers", async (context) => {
  const calls = recordFetch(context, () => ({ id: "collection-contract", key: "articles" }));
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl, locale: "en" });
  await storefront.content.collection.get({ key: "articles" });
  await storefront.content.collection.get({ id: ids.form });
  assert.deepEqual(calls.map((call) => call.href), [`${baseUrl}/v1/storefront/collections/articles`, `${baseUrl}/v1/storefront/collections/${ids.form}`]);
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.headers.get("x-arky-locale"), "en");
    assert.equal(call.headers.get("authorization"), null);
  }
});

test("admin Product writes carry the app-picked id and version and InventoryLevel reads pass their filters", async (context) => {
  const create = { id: ids.product, key: "canonical-product", slugs: { en: "canonical-product" }, blocks: [{ id: "name-contract", key: "name", type: "localized_text", value: { en: "Product" } }], categories: [] };
  const product = { ...create, store_id: storeId, status: { type: "active" }, created_at: 1, updated_at: 1 };
  const update = { id: ids.product, expected_updated_at: 1, slugs: { en: "canonical-product-updated" }, status: { type: "draft" } };
  const inventory = [{ id: ids.variant, store_id: storeId, inventory_item_id: ids.order, store_location_id: ids.companyLocation, on_hand: 12, reserved: 13, set_aside: 2, available: -3, created_at: 1, updated_at: 2 }];
  const responses = [product, { ...product, ...update }, { items: inventory, cursor: null }];
  const calls = recordFetch(context, () => responses.shift());
  const client = admin();
  assert.deepEqual(await client.eshop.product.create({ store_id: storeId, ...create }), product);
  await client.eshop.product.update({ store_id: storeId, ...update });
  assert.deepEqual(await client.eshop.inventoryLevel.find({ store_id: storeId, inventory_item_id: ids.order, store_location_id: ids.companyLocation }), { items: inventory, cursor: null });
  assert.deepEqual(calls.map((call) => [call.method, call.href, call.body]), [
    ["POST", `${baseUrl}/v1/stores/${storeId}/products`, create],
    ["PUT", `${baseUrl}/v1/stores/${storeId}/products/${ids.product}`, { expected_updated_at: 1, slugs: update.slugs, status: update.status }],
    ["GET", `${baseUrl}/v1/stores/${storeId}/inventory-levels?inventory_item_id=${ids.order}&store_location_id=${ids.companyLocation}`, null],
  ]);
});

test("storefront variant read carries the exact product and buyer context", async (context) => {
  const calls = recordFetch(context, () => ({}));
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl, locale: "en" });
  await storefront.eshop.productVariant.get({ product_id: "lean-product", id: "variant-one", company_location_id: "location-one", include_price: true });
  await storefront.eshop.productVariant.get({ product_id: "lean-product", id: "variant-one", company_id: "company-one" });
  assert.equal(calls[0].href, `${baseUrl}/v1/storefront/products/lean-product/variants/variant-one?company_location_id=location-one&include_price=true`);
  assert.equal(calls[1].href, `${baseUrl}/v1/storefront/products/lean-product/variants/variant-one?company_id=company-one`);
  assert.equal(calls[0].headers.get("x-arky-publishable-key"), publishableKey);
});

test("storefront cart reads send the recovery credential only in the cart-token header", async (context) => {
  const recoveryToken = "cart-recovery-contract-token";
  const calls = recordFetch(context, () => ({ id: ids.cart }));
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl, sessionStorage: visitorStorage() });
  await storefront.eshop.cart.get(
    { id: ids.cart, token: recoveryToken },
    {
      headers: { "x-arky-cart-token": "caller-cannot-override" },
      params: { token: "unexpected-query-token", cart_token: "unexpected-query-cart-token", include: "summary" },
    },
  );
  assert.equal(calls[0].href, `${baseUrl}/v1/storefront/carts/${ids.cart}?include=summary`);
  assert.equal(calls[0].headers.get("x-arky-cart-token"), recoveryToken);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[0].body, null);
  assert.equal(calls[0].href.includes("token"), false);
});

test("storefront money helpers preserve exact zero, need an explicit locale and reject invalid minor units", () => {
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl, market: "ita" });
  const price = { tax_mode: "inclusive", unit_price: { amount: 0, currency: "eur" }, compare_at: null, min_quantity: 1, max_quantity: null, priced_at: 1 };
  assert.equal(storefront.utils.getPriceAmount(price), 0);
  assert.equal(storefront.utils.formatPrice(price, "it"), storefront.utils.formatMinor(0, "eur", "it"));
  assert.notEqual(storefront.utils.formatPrice(price, "it"), "");
  assert.equal(storefront.utils.getPriceAmount(null), null);
  assert.equal(storefront.utils.formatPrice(null, "it"), "");
  assert.equal(storefront.utils.getPriceAmount({ ...price, unit_price: { amount: -1, currency: "eur" } }), null);
  assert.equal(storefront.utils.getPriceAmount({ ...price, unit_price: { amount: 1.5, currency: "eur" } }), null);
  assert.throws(() => storefront.utils.formatMinor(1.5, "EUR", "en"), /safe integer/);
  assert.equal(storefront.utils.formatMoney({ amount: 1234, currency: "bam" }, "en-US"), storefront.utils.formatMinor(1234, "bam", "en-US"));
});

test("SDK_VERSION equals the package version", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(SDK_VERSION, packageJson.version);
  assert.equal(SDK_VERSION, "0.26.86");
});

test("recursive storefront declarations never degrade to any", async () => {
  const declaration = await readFile(new URL("../dist/index.d.ts", import.meta.url), "utf8");
  assert.doesNotMatch(declaration, /\/\*elided\*\/ any/);
  assert.match(declaration, /withContext\(context: StorefrontContext\): StorefrontClient/);
  assert.match(declaration, /withContext\(context: ArkyStoreContext\): InitializedStore/);
});
