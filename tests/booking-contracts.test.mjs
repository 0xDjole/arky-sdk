#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin, orderBookingItems } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, cartRecord, ids, jsonResponse, publishableKey, visitorStorage } from "./helpers/arky-fixtures.mjs";

const storeId = ids.store;
const otherStoreId = ids.otherStore;
const serviceId = "a3c5e7f9-1b2d-4f68-8a0c-2e4f6a8c0b1d";
const resourceId = "b4d6f8a0-2c3e-4a79-9b1d-3f5a7b9d1c2e";
const offeringId = "c5e7a9b1-3d4f-4b8a-8c2e-4a6b8c0e2d3f";
const taxCategoryId = "d6f8b0c2-4e5a-4c9b-9d3f-5b7c9d1f3e4a";
const lineId = ids.line;
const creditId = ids.credit;

function bookingService(overrides = {}) {
  return {
    id: serviceId,
    store_id: storeId,
    key: "consultation",
    slugs: { en: "consultation" },
    blocks: [],
    categories: [],
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    price: null,
    ...overrides,
  };
}

function bookingResource(overrides = {}) {
  return {
    id: resourceId,
    store_id: storeId,
    key: "room-one",
    slugs: { en: "room-one" },
    blocks: [],
    categories: [],
    timezone: "Europe/Sarajevo",
    capacity: 3,
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

function bookingOffering(overrides = {}) {
  return {
    id: offeringId,
    store_id: storeId,
    booking_service_id: serviceId,
    booking_resource_id: resourceId,
    weekly_availability: { monday: [{ from_minute: 540, to_minute: 1020 }] },
    date_overrides: { "2026-08-24": [] },
    segments: [{ type: "service", minutes: 60 }],
    slot_interval_minutes: 30,
    booking_window: { opens_before_start_minutes: 43_200, closes_before_start_minutes: 120 },
    reminder_offsets_minutes: [1440, 60],
    venue: { type: "store_location", store_location_id: "e7a9c1d3-5f6b-4dac-8e4a-6c8d0e2a4f5b" },
    tax_category_id: taxCategoryId,
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    price: { tax_mode: "inclusive", unit_price: { amount: 5000, currency: "eur" }, compare_at: null, min_quantity: 1, max_quantity: null, priced_at: 1 },
    ...overrides,
  };
}

function bookingLine() {
  return {
    type: "booking",
    id: lineId,
    booking_offering_id: offeringId,
    booking_service_id: serviceId,
    booking_resource_id: resourceId,
    interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
    capacity_intervals: [{ from: 1_800_000_000_000, to: 1_800_003_600_000 }],
    capacity_units: 1,
    form_submission_id: ids.submission,
    snapshot: { service_key: "consultation", resource_key: "room-one", timezone: "Europe/Sarajevo", price: { type: "catalog", price_id: ids.product, catalog_id: ids.catalog } },
    status: { type: "confirmed" },
    attendance: "upcoming",
    money: { unit_price: 5000, discounts: [], tax: { type: "own", tax_category_id: taxCategoryId, rule_id: ids.variant, treatment: { type: "rates", lines: [] } } },
    created_at: 1,
    updated_at: 2,
  };
}

function order() {
  return {
    id: ids.order,
    number: "1001",
    store_id: storeId,
    source: { type: "cart", cart_id: ids.cart, placed_by: { type: "customer", customer_id: ids.customer, customer_session_id: ids.session } },
    customer_id: ids.customer,
    line_items: [bookingLine()],
    updated_at: 2,
  };
}

test("Resource discovery preserves bounded opaque continuation and ordered filters on both clients", async (context) => {
  const cursor = "+/a=".repeat(512);
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return jsonResponse(calls.length % 2 === 1
      ? { items: [], cursor }
      : { items: [bookingResource()], cursor: null });
  });
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "token" });
  const storefront = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
  const adminFilters = {
    booking_service_id: serviceId, query: "room", status: "active", limit: 1,
    sort_field: "key", sort_direction: "desc", created_at_from: 0, created_at_to: 10,
  };
  const storefrontFilters = { booking_service_id: serviceId, query: "room", limit: 1 };
  for (const [client, target, filters] of [[admin, { store_id: storeId }, adminFilters], [storefront, {}, storefrontFilters]]) {
    const first = await client.eshop.bookingResource.find({ ...target, ...filters });
    assert.deepEqual(first, { items: [], cursor });
    const second = await client.eshop.bookingResource.find({ ...target, ...filters, cursor: first.cursor });
    assert.deepEqual(second, { items: [bookingResource()], cursor: null });
  }
  assert.equal(calls.length, 4);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/booking-resources`);
  assert.equal(calls[2].url.pathname, "/v1/storefront/booking-resources");
  for (const [index, call] of calls.entries()) {
    const filters = index < 2 ? adminFilters : storefrontFilters;
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) assert.equal(call.url.searchParams.get(key), String(value));
    for (const removed of ["from", "to", "match_all", "store_id"]) assert.equal(call.url.searchParams.has(removed), false);
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), cursor);
  assert.equal(calls[3].url.searchParams.get("cursor"), cursor);
});

test("Admin booking runtime creates service, resource and offering under app-picked ids and acts on order lines", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null };
    calls.push(call);
    const path = call.url.pathname;
    if (path.endsWith("/booking-services")) return jsonResponse(bookingService());
    if (path.endsWith("/booking-resources")) return jsonResponse(bookingResource());
    if (path.endsWith("/booking-offerings")) return jsonResponse(bookingOffering());
    return jsonResponse(order());
  });
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "token" });
  const service = { id: serviceId, key: "consultation", slugs: { en: "consultation" }, blocks: [], categories: [], status: { type: "active" } };
  const resource = { id: resourceId, key: "room-one", slugs: { en: "room-one" }, blocks: [], categories: [], timezone: "Europe/Sarajevo", capacity: 3, status: { type: "active" } };
  const { id: _offeringId, store_id: _store, status: _status, created_at: _created, updated_at: _updated, price: _price, ...offeringFields } = bookingOffering();
  const offering = { id: offeringId, ...offeringFields, status: { type: "active" } };
  await admin.eshop.bookingService.create({ store_id: storeId, ...service });
  await admin.eshop.bookingResource.create({ store_id: storeId, ...resource });
  await admin.eshop.bookingOffering.create({ store_id: storeId, ...offering });
  const loadedOrder = await admin.eshop.order.get({ store_id: storeId, id: ids.order });
  const line = orderBookingItems(loadedOrder)[0];
  assert.equal(line.id, lineId);
  await admin.eshop.order.cancelBookingItem({ store_id: storeId, order_id: loadedOrder.id, line_item_id: line.id, credit_id: creditId, expected_updated_at: 2 });
  await admin.eshop.order.completeBookingItem({ store_id: storeId, order_id: loadedOrder.id, line_item_id: line.id, expected_updated_at: 3 });
  await admin.eshop.order.markBookingItemNoShow({ store_id: storeId, order_id: loadedOrder.id, line_item_id: line.id, expected_updated_at: 4 });

  for (const removed of ["service", "provider", "booking"]) assert.equal(removed in admin.eshop, false, removed);
  for (const removed of ["getBookings", "update", "getBookingAppointment"]) assert.equal(removed in admin.eshop.order, false, removed);
  assert.deepEqual(calls.map((call) => [call.url.pathname, call.method, call.body]), [
    [`/v1/stores/${storeId}/booking-services`, "POST", service],
    [`/v1/stores/${storeId}/booking-resources`, "POST", resource],
    [`/v1/stores/${storeId}/booking-offerings`, "POST", offering],
    [`/v1/stores/${storeId}/orders/${ids.order}`, "GET", null],
    [`/v1/stores/${storeId}/orders/${ids.order}/booking-items/${lineId}/cancel`, "POST", { credit_id: creditId, expected_updated_at: 2 }],
    [`/v1/stores/${storeId}/orders/${ids.order}/booking-items/${lineId}/complete`, "POST", { expected_updated_at: 3 }],
    [`/v1/stores/${storeId}/orders/${ids.order}/booking-items/${lineId}/no-show`, "POST", { expected_updated_at: 4 }],
  ]);
  for (const [create, record] of [
    [admin.eshop.bookingService.create, service],
    [admin.eshop.bookingResource.create, resource],
    [admin.eshop.bookingOffering.create, offering],
  ]) {
    for (const id of [undefined, "consultation", serviceId.toUpperCase()]) {
      await assert.rejects(async () => create({ store_id: storeId, ...record, id }), TypeError);
    }
  }
  assert.equal(calls.length, 7);
});

test("storefront booking runtime sends one offering interval under the app's line id and reads embedded Order items", async (context) => {
  const storage = visitorStorage();
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init.headers) };
    calls.push(call);
    const path = call.url.pathname;
    if (path.endsWith("/booking-services")) return jsonResponse({ items: [bookingService()], cursor: null });
    if (path.endsWith("/booking-resources")) return jsonResponse({ items: [bookingResource()], cursor: null });
    if (path.endsWith("/booking-offerings")) return jsonResponse({ items: [bookingOffering()], cursor: null });
    if (path.endsWith("/booking-services/availability")) {
      return jsonResponse({
        from: 1_800_000_000_000, to: 1_800_086_400_000, cursor: null,
        booking_resources: [{ booking_offering_id: offeringId, booking_resource_id: resourceId, resource_key: "room-one", timezone: "Europe/Sarajevo", days: [] }],
      });
    }
    if (path.endsWith(`/carts/${ids.cart}/booking-items`)) return jsonResponse(cartRecord({ line_items: [{ type: "booking", ...call.body.booking, price_override: null }] }));
    return jsonResponse(order());
  });
  const storefront = createStorefront(publishableKey, { apiUrl, market: "bih", sessionStorage: storage });
  await storefront.eshop.bookingService.find({ sort_field: "price", include_price: true });
  await storefront.eshop.bookingResource.find({ booking_service_id: serviceId });
  await storefront.eshop.bookingOffering.find({ booking_service_id: serviceId });
  await storefront.eshop.bookingService.getAvailability({
    booking_service_id: serviceId, booking_resource_id: resourceId, from: 1_800_000_000_000, to: 1_800_086_400_000,
  });
  const booking = {
    id: lineId,
    booking_offering_id: offeringId,
    requested_interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
    capacity_units: 1,
    form_submission_id: ids.submission,
  };
  await storefront.eshop.cart.addBooking({
    id: ids.cart,
    expected_updated_at: 7,
    booking: { ...booking, price_override: { amount: 1, currency: "eur" }, store_id: otherStoreId },
  });
  await assert.rejects(async () => storefront.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 7, booking: { ...booking, id: "slot-one" } }), TypeError);
  const loadedOrder = await storefront.eshop.order.get({ id: ids.order });
  assert.equal(orderBookingItems(loadedOrder)[0].booking_resource_id, resourceId);
  await storefront.eshop.order.cancelBookingItem({ order_id: loadedOrder.id, line_item_id: lineId, credit_id: creditId, expected_updated_at: 2 });

  assert.equal("service" in storefront.eshop, false);
  assert.equal("provider" in storefront.eshop, false);
  const addition = calls.find((call) => call.url.pathname.endsWith("/booking-items"));
  assert.equal(addition.url.pathname, `/v1/storefront/carts/${ids.cart}/booking-items`);
  assert.deepEqual(addition.body, { expected_updated_at: 7, booking });
  const cancellation = calls.at(-1);
  assert.equal(cancellation.url.pathname, `/v1/storefront/orders/${ids.order}/booking-items/${lineId}/cancel`);
  assert.deepEqual(cancellation.body, { credit_id: creditId, expected_updated_at: 2 });
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-market"), "bih");
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
    assert.equal(call.url.searchParams.has("store_id"), false);
  }
});

test("booking cancellation resends the caller's credit id after an uncertain response and refuses an invented one", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: JSON.parse(String(init.body)) });
    if (calls.length % 2 === 1) return jsonResponse({ message: "Response unavailable", status_code: 503 }, 503);
    return jsonResponse(order());
  });
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "token" });
  const storefront = createStorefront(publishableKey, { apiUrl, market: "bih", sessionStorage: visitorStorage() });
  for (const [client, target] of [[admin, { store_id: storeId }], [storefront, {}]]) {
    const request = { ...target, order_id: "order/booking", line_item_id: "item/booking", credit_id: creditId, expected_updated_at: 9 };
    await assert.rejects(client.eshop.order.cancelBookingItem(request), (error) => error.statusCode === 503);
    assert.equal((await client.eshop.order.cancelBookingItem(request)).id, ids.order);
    await assert.rejects(async () => client.eshop.order.cancelBookingItem({ ...request, credit_id: "booking-cancel" }), TypeError);
    await assert.rejects(async () => client.eshop.order.cancelBookingItem({ ...request, credit_id: undefined }), TypeError);
  }
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.equal(call.method, "POST");
    assert.deepEqual(call.body, { credit_id: creditId, expected_updated_at: 9 });
    assert.ok(call.url.pathname.endsWith("/orders/order%2Fbooking/booking-items/item%2Fbooking/cancel"));
  }
  assert.equal(calls[0].url.href, calls[1].url.href);
  assert.equal(calls[2].url.href, calls[3].url.href);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/orders/order%2Fbooking/booking-items/item%2Fbooking/cancel`);
  assert.equal(calls[2].url.pathname, "/v1/storefront/orders/order%2Fbooking/booking-items/item%2Fbooking/cancel");
});

test("Booking Service slug lookup stays singular while records expose slugs", async (context) => {
  let call;
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    call = { url: new URL(url), method: init.method || "GET" };
    return jsonResponse(bookingService());
  });
  const storefront = createStorefront(publishableKey, { apiUrl, market: "bih", sessionStorage: visitorStorage() });
  const service = await storefront.eshop.bookingService.get({
    slug: "consultation",
    company_location_id: ids.companyLocation,
    include_price: true,
  });
  assert.equal(service.slugs.en, "consultation");
  assert.equal("slug" in service, false);
  assert.equal(call.url.pathname, "/v1/storefront/booking-services/consultation");
  assert.equal(call.url.searchParams.has("company_id"), false);
  assert.equal(call.url.searchParams.get("company_location_id"), ids.companyLocation);
  assert.equal(call.url.searchParams.get("include_price"), "true");
  assert.equal(call.url.searchParams.has("slug"), false);
  assert.equal(call.method, "GET");
  assert.throws(() => storefront.eshop.bookingService.get({ include_price: true }), /id or its slug/);
});

test("booking discovery forwards the price filter and sort as query fields and never sends from or to", async (context) => {
  let called;
  context.mock.method(globalThis, "fetch", async (url) => {
    called = new URL(url);
    return jsonResponse({ items: [], cursor: "next-page" });
  });
  const storefront = createStorefront(publishableKey, { apiUrl, market: "bih", sessionStorage: visitorStorage() });
  const params = {
    query: "čas gitare", booking_resource_id: resourceId, price_filter: { min_amount: 0, max_amount: 800, quantity: 1 },
    sort_field: "price", sort_direction: "asc", created_at_from: 1, created_at_to: 2, limit: 10, cursor: "previous-page", include_price: true,
  };
  assert.deepEqual(await storefront.eshop.bookingService.find(params), { items: [], cursor: "next-page" });
  assert.equal(called.pathname, "/v1/storefront/booking-services");
  assert.equal(called.searchParams.get("booking_resource_id"), resourceId);
  assert.equal(called.searchParams.get("query"), params.query);
  assert.equal(called.searchParams.get("sort_field"), "price");
  assert.equal(called.searchParams.get("sort_direction"), "asc");
  assert.equal(called.searchParams.get("created_at_from"), "1");
  assert.equal(called.searchParams.get("created_at_to"), "2");
  assert.equal(called.searchParams.get("cursor"), "previous-page");
  assert.deepEqual(JSON.parse(called.searchParams.get("price_filter")), params.price_filter);
  for (const removed of ["status", "from", "to"]) assert.equal(called.searchParams.has(removed), false, removed);
});

test("high-level booking flow adds one cart line per appointment under the ids the app gives", async (context) => {
  const calls = [];
  const calendarDate = new Date();
  const availableLocalDate = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-01`;
  let current = cartRecord();
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init.headers) };
    calls.push(call);
    const path = call.url.pathname;
    if (path.endsWith(`/booking-services/${serviceId}`)) return jsonResponse(bookingService());
    if (path.endsWith("/booking-offerings")) return jsonResponse({ items: [bookingOffering()], cursor: null });
    if (path.endsWith("/booking-resources")) return jsonResponse({ items: [bookingResource()], cursor: null });
    if (path.endsWith("/booking-services/availability")) {
      return jsonResponse({
        from: Number(call.url.searchParams.get("from")),
        to: Number(call.url.searchParams.get("to")),
        cursor: null,
        booking_resources: [{
          booking_offering_id: offeringId,
          booking_resource_id: resourceId,
          resource_key: "room-one",
          timezone: "Europe/Sarajevo",
          days: [{
            date: availableLocalDate,
            slots: [
              { from: 1_800_000_000_000, to: 1_800_003_600_000, spots: 2 },
              { from: 1_800_003_600_000, to: 1_800_007_200_000, spots: 0 },
            ],
          }],
        }],
      });
    }
    if (path === "/v1/storefront/carts") {
      return jsonResponse({ type: "created", cart: current, recovery_token: "cart-recovery-token" });
    }
    if (path.endsWith(`/carts/${ids.cart}/booking-items`)) {
      current = { ...current, updated_at: current.updated_at + 1, line_items: [...current.line_items, { type: "booking", ...call.body.booking, price_override: null }] };
      return jsonResponse(current);
    }
    throw new Error(`Unexpected request ${call.method} ${call.url}`);
  });

  const store = initialize(publishableKey, { apiUrl, locale: "en", sessionStorage: visitorStorage() });
  await store.eshop.cart.create({ id: ids.cart, buyer: { type: "customer" }, catalog_id: null });
  await store.eshop.bookingService.select(bookingService());
  const availableDay = store.eshop.bookingService.state.get().calendar.find((day) => day.iso === availableLocalDate);
  assert.equal(availableDay?.available, true);
  store.eshop.bookingService.selectDate(availableDay);
  const slots = store.eshop.bookingService.state.get().slots;
  const timezone = store.eshop.bookingService.state.get().timezone;
  assert.equal(slots.length, 1);
  const [slot] = slots;
  assert.equal(slot.from, 1_800_000_000_000);
  assert.equal(slot.bookingOfferingId, offeringId);
  assert.equal(slot.bookingResourceId, resourceId);
  assert.equal(slot.dateText, new Date(slot.from).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", timeZone: timezone }));
  assert.equal(slot.timeText, [slot.from, slot.to].map((value) => new Date(value).toLocaleTimeString("en", {
    hour: "2-digit", minute: "2-digit", timeZone: timezone,
  })).join(" - "));
  await assert.rejects(store.eshop.bookingService.addToCart([{ id: "slot-line", slot }]), TypeError);
  const result = await store.eshop.bookingService.addToCart([{ id: lineId, slot, form_submission_id: ids.submission }]);
  assert.equal(result.line_items.length, 1);
  await store.eshop.bookingService.loadMonth();

  const availabilityCalls = calls.filter((call) => call.url.pathname.endsWith("/booking-services/availability"));
  const firstBounds = availabilityCalls[0].url.searchParams;
  assert.equal(Number(firstBounds.get("from")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), 1));
  assert.equal(Number(firstBounds.get("to")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  const chainedBounds = availabilityCalls.at(-1).url.searchParams;
  assert.equal(Number(chainedBounds.get("from")), slot.to);
  assert.equal(Number(chainedBounds.get("to")), slot.to + 31 * 24 * 60 * 60 * 1_000);

  const additions = calls.filter((call) => call.url.pathname.endsWith("/booking-items"));
  assert.equal(additions.length, 1);
  assert.deepEqual(additions[0].body, {
    expected_updated_at: 1_700_000_000_001,
    booking: {
      id: lineId,
      booking_offering_id: offeringId,
      requested_interval: { from: slot.from, to: slot.to },
      capacity_units: 1,
      form_submission_id: ids.submission,
    },
  });
  assert.equal(additions[0].headers.get("x-arky-cart-token"), "cart-recovery-token");
  assert.equal(store.eshop.bookingService.state.get().cartId, ids.cart);
  assert.equal("bookingItemsFromSlots" in store.eshop.bookingService, false);
});

test("booking selection retains the company location context and explicitly follows Offering and availability pages", async (context) => {
  const offeringCalls = [];
  const resourceCalls = [];
  const availabilityCalls = [];
  let repeatAvailabilityCursor = false;
  const laterResourceId = "f8b0d2e4-6a7c-4e1d-8f5b-7d9e1f3b5c6a";
  const laterOffering = bookingOffering({ id: "a9c1e3f5-7b8d-4f2e-9a6c-8e0f2a4c6d7b", booking_resource_id: laterResourceId });
  const laterResource = bookingResource({ id: laterResourceId });
  context.mock.method(globalThis, "fetch", async (url) => {
    const request = new URL(String(url));
    if (!request.pathname.endsWith("/booking-resources")) {
      assert.equal(request.searchParams.has("company_id"), false);
      assert.equal(request.searchParams.get("company_location_id"), ids.companyLocation);
    }
    if (request.pathname.endsWith(`/booking-services/${serviceId}`)) return jsonResponse(bookingService());
    if (request.pathname.endsWith("/booking-offerings")) {
      offeringCalls.push(request);
      assert.equal(request.searchParams.get("limit"), "200");
      assert.equal(request.searchParams.get("include_price"), "true");
      return jsonResponse(request.searchParams.has("cursor")
        ? { items: [laterOffering], cursor: null }
        : { items: [bookingOffering()], cursor: "offering-next" });
    }
    if (request.pathname.endsWith("/booking-resources")) {
      resourceCalls.push(request);
      const requested = JSON.parse(request.searchParams.get("ids"));
      assert.equal(requested.length, 1, "resources must be loaded only for this bounded Offering page");
      return jsonResponse({ items: [requested[0] === laterResourceId ? laterResource : bookingResource()], cursor: null });
    }
    if (request.pathname.endsWith("/booking-services/availability")) {
      availabilityCalls.push(request);
      assert.equal(request.searchParams.get("limit"), "20");
      assert.equal(request.searchParams.has("include_price"), false);
      return jsonResponse({
        from: Number(request.searchParams.get("from")), to: Number(request.searchParams.get("to")),
        booking_resources: [{
          booking_offering_id: request.searchParams.has("cursor") ? laterOffering.id : offeringId,
          booking_resource_id: request.searchParams.has("cursor") ? laterResourceId : resourceId,
          resource_key: "room", timezone: "Europe/Sarajevo", days: [],
        }],
        cursor: request.searchParams.has("cursor") && !repeatAvailabilityCursor ? null : "availability-next",
      });
    }
    throw new Error(`Unexpected request ${url}`);
  });
  const store = initialize(publishableKey, { apiUrl, locale: "en", sessionStorage: visitorStorage() });
  await store.eshop.bookingService.select(bookingService(), { company_location_id: ids.companyLocation });
  assert.equal(offeringCalls.length, 1);
  assert.equal(availabilityCalls.length, 1, "availability must not eagerly follow continuations");
  assert.equal(store.eshop.bookingService.state.get().availability.cursor, "availability-next");
  assert.equal(store.eshop.bookingService.state.get().bookingOfferingsCursor, "offering-next");
  await store.eshop.bookingService.loadMoreOfferings();
  const state = store.eshop.bookingService.state.get();
  assert.equal(offeringCalls.length, 2);
  assert.equal(offeringCalls[1].searchParams.get("cursor"), "offering-next");
  assert.deepEqual(state.bookingOfferings.map((row) => row.id), [offeringId, laterOffering.id]);
  assert.deepEqual(state.bookingResources.map((row) => row.id), [resourceId, laterResourceId]);
  assert.equal(state.bookingOfferingsCursor, null);
  assert.equal(state.loadingOfferings, false);
  await store.eshop.bookingService.loadMoreOfferings();
  assert.equal(offeringCalls.length, 2, "an exhausted list makes no further request");
  assert.equal(resourceCalls.length, 2);
  repeatAvailabilityCursor = true;
  await assert.rejects(store.eshop.bookingService.loadMoreAvailability(), /didn't advance/);
  assert.equal(store.eshop.bookingService.state.get().availability.cursor, "availability-next");
  assert.equal(store.eshop.bookingService.state.get().availability.booking_resources.length, 1);
  assert.equal(store.eshop.bookingService.state.get().loading, false);
  repeatAvailabilityCursor = false;
  await store.eshop.bookingService.loadMoreAvailability();
  assert.equal(availabilityCalls.length, 3);
  assert.equal(availabilityCalls[1].searchParams.get("cursor"), "availability-next");
  assert.equal(availabilityCalls[1].searchParams.get("from"), availabilityCalls[0].searchParams.get("from"));
  assert.deepEqual(store.eshop.bookingService.state.get().availability.booking_resources.map((row) => row.booking_resource_id), [resourceId, laterResourceId]);
  assert.equal(store.eshop.bookingService.state.get().availability.cursor, null);
  await store.eshop.bookingService.loadMoreAvailability();
  assert.equal(availabilityCalls.length, 3);
});

test("late availability cannot replace a newer Service selection or its shared read state", async (context) => {
  let announcePending;
  let releaseOld;
  const pending = new Promise((resolve) => { announcePending = resolve; });
  const newServiceId = "b0d2f4a6-8c9e-4a3f-8b7d-9f1a3c5e7d8b";
  context.mock.method(globalThis, "fetch", async (url) => {
    const request = new URL(String(url));
    if (request.pathname.endsWith("/booking-services/availability")) {
      const requestedService = request.searchParams.get("booking_service_id");
      const response = {
        from: Number(request.searchParams.get("from")),
        to: Number(request.searchParams.get("to")),
        cursor: null,
        booking_resources: [{ booking_offering_id: offeringId, booking_resource_id: requestedService, resource_key: requestedService, timezone: "Europe/Sarajevo", days: [] }],
      };
      if (requestedService === serviceId) {
        announcePending();
        return new Promise((resolve) => { releaseOld = () => resolve(jsonResponse(response)); });
      }
      return jsonResponse(response);
    }
    if (request.pathname.endsWith("/booking-offerings")) return jsonResponse({ items: [], cursor: null });
    if (request.pathname.includes("/booking-services/")) return jsonResponse(bookingService({ id: request.pathname.split("/").at(-1) }));
    throw new Error(`Unexpected request ${url}`);
  });
  const store = initialize(publishableKey, { apiUrl, locale: "en", sessionStorage: visitorStorage() });
  try {
    const first = store.eshop.bookingService.select(bookingService());
    await pending;
    await store.eshop.bookingService.select(bookingService({ id: newServiceId }));
    releaseOld();
    await first;
    const state = store.eshop.bookingService.state.get();
    assert.equal(state.bookingService.id, newServiceId);
    assert.equal(state.availability.booking_resources[0].booking_resource_id, newServiceId);
    assert.equal(state.loading, false);
    assert.equal(store.eshop.state.get().availability.booking_resources[0].booking_resource_id, newServiceId);
    assert.equal(store.eshop.state.get().loading_availability, false);
  } finally {
    releaseOld?.();
  }
});
