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
    segments: [{ type: "service", minutes: 60 }],
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
    slot_interval_minutes: 30,
    booking_window: { opens_before_start_minutes: 43_200, closes_before_start_minutes: 120 },
    customer_changes: { type: "not_allowed" },
    reminder_offsets_minutes: [1440, 60],
    tax_category_id: taxCategoryId,
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

function storefrontService(overrides = {}) {
  return { ...bookingService(), catalog_item_id: ids.catalogItem, ...overrides };
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
    hours: { weekly_availability: { monday: [{ from_minute: 540, to_minute: 1020 }] }, date_overrides: { "2026-08-24": [] } },
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
    hours: { type: "resource" },
    venue: { type: "store_location", store_location_id: "e7a9c1d3-5f6b-4dac-8e4a-6c8d0e2a4f5b" },
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

const offeringPrice = {
  catalog_item_price_id: ids.price,
  tax_mode: "inclusive",
  unit_price: { amount: 5000, currency: "eur" },
  compare_at: null,
  priced_at: 1,
};

function storefrontOffering(overrides = {}) {
  return { ...bookingOffering(), catalog_item_id: ids.catalogItem, price: offeringPrice, ...overrides };
}

function offeringChoice(bookingOfferingId = offeringId, catalogItemPriceId = ids.price) {
  return {
    catalog_item_price_id: catalogItemPriceId,
    sellable: { type: "booking_offering", booking_offering_id: bookingOfferingId },
    content: { sku: null, blocks: [], basis: { type: "booking_option" } },
    price: { ...offeringPrice, catalog_item_price_id: catalogItemPriceId },
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
    snapshot: { service_key: "consultation", resource_key: "room-one", timezone: "Europe/Sarajevo", price: { type: "catalog", catalog_item_price_id: ids.price, catalog_id: ids.catalog } },
    status: { type: "confirmed", attendance: { type: "upcoming" } },
    reschedules: [],
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

function storefront(options = {}) {
  return createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: visitorStorage(), ...options });
}

function store(options = {}) {
  return initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", sessionStorage: visitorStorage(), ...options });
}

test("Admin resource discovery preserves bounded opaque continuation and ordered filters, and the storefront only reads one resource", async (context) => {
  const cursor = "+/a=".repeat(512);
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return jsonResponse(calls.length === 1 ? { items: [], cursor } : { items: [bookingResource()], cursor: null });
  });
  const admin = createAdmin({ apiUrl: apiUrl, secretKey: "token" });
  const filters = {
    query: "room", status: "active", limit: 1,
    sort_field: "key", sort_direction: "desc", created_at_from: 0, created_at_to: 10,
  };
  const first = await admin.eshop.bookingResource.find({ store_id: storeId, ...filters });
  assert.deepEqual(first, { items: [], cursor });
  const second = await admin.eshop.bookingResource.find({ store_id: storeId, ...filters, cursor: first.cursor });
  assert.deepEqual(second, { items: [bookingResource()], cursor: null });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/stores/${storeId}/booking-resources`);
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) assert.equal(call.url.searchParams.get(key), String(value));
    for (const removed of ["from", "to", "match_all", "store_id", "booking_service_id"]) assert.equal(call.url.searchParams.has(removed), false);
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), cursor);
  const client = storefront();
  assert.equal("find" in client.eshop.bookingResource, false);
  assert.equal("find" in client.eshop.bookingOffering, false);
  assert.equal("find" in client.eshop.bookingService, false);
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
  const admin = createAdmin({ apiUrl: apiUrl, secretKey: "token" });
  const { id: _serviceId, store_id: _serviceStore, created_at: _serviceCreated, updated_at: _serviceUpdated, ...serviceFields } = bookingService();
  const service = { id: serviceId, ...serviceFields };
  const { id: _resourceId, store_id: _resourceStore, created_at: _resourceCreated, updated_at: _resourceUpdated, ...resourceFields } = bookingResource();
  const resource = { id: resourceId, ...resourceFields };
  const { id: _offeringId, store_id: _store, status: _status, created_at: _created, updated_at: _updated, ...offeringFields } = bookingOffering();
  const offering = { id: offeringId, ...offeringFields, status: { type: "active" } };
  await admin.eshop.bookingService.create({ store_id: storeId, ...service });
  await admin.eshop.bookingResource.create({ store_id: storeId, ...resource });
  await admin.eshop.bookingOffering.create({ store_id: storeId, ...offering });
  const loadedOrder = await admin.eshop.order.get({ store_id: storeId, id: ids.order });
  const line = orderBookingItems(loadedOrder)[0];
  assert.equal(line.id, lineId);
  await admin.eshop.order.cancelBookingItem({ store_id: storeId, order_id: loadedOrder.id, line_item_id: line.id, credit_id: creditId, expected_updated_at: 2 });
  await admin.eshop.order.attendBookingItem({ store_id: storeId, order_id: loadedOrder.id, line_item_id: line.id, expected_updated_at: 3 });
  await admin.eshop.order.markBookingItemNoShow({ store_id: storeId, order_id: loadedOrder.id, line_item_id: line.id, expected_updated_at: 4 });

  for (const removed of ["service", "provider", "booking"]) assert.equal(removed in admin.eshop, false, removed);
  for (const removed of ["getBookings", "getBookingAppointment", "completeBookingItem"]) assert.equal(removed in admin.eshop.order, false, removed);
  assert.deepEqual(calls.map((call) => [call.url.pathname, call.method, call.body]), [
    [`/v1/stores/${storeId}/booking-services`, "POST", service],
    [`/v1/stores/${storeId}/booking-resources`, "POST", resource],
    [`/v1/stores/${storeId}/booking-offerings`, "POST", offering],
    [`/v1/stores/${storeId}/orders/${ids.order}`, "GET", null],
    [`/v1/stores/${storeId}/orders/${ids.order}/booking-items/${lineId}/cancel`, "POST", { credit_id: creditId, expected_updated_at: 2 }],
    [`/v1/stores/${storeId}/orders/${ids.order}/booking-items/${lineId}/attend`, "POST", { expected_updated_at: 3 }],
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

test("storefront booking runtime reads one offering and its resource in the catalog and sends the slot with its listing price", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init.headers) };
    calls.push(call);
    const path = call.url.pathname;
    if (path.endsWith(`/booking-offerings/${offeringId}`)) return jsonResponse(storefrontOffering());
    if (path.endsWith(`/booking-resources/${resourceId}`)) return jsonResponse(bookingResource());
    if (path.endsWith("/booking-services/availability")) {
      return jsonResponse({
        from: 1_800_000_000_000, to: 1_800_086_400_000, cursor: null,
        booking_resources: [{ booking_offering_id: offeringId, booking_resource_id: resourceId, resource_key: "room-one", timezone: "Europe/Sarajevo", days: [] }],
      });
    }
    if (path.endsWith(`/carts/${ids.cart}/booking-items`)) return jsonResponse(cartRecord({ line_items: [{ type: "booking", ...call.body.booking }] }));
    return jsonResponse(order());
  });
  const client = storefront({ market: "bih" });
  const offering = await client.eshop.bookingOffering.get({ id: offeringId, catalog_id: ids.catalog, company_location_id: ids.companyLocation, include_price: true });
  assert.equal(offering.catalog_item_id, ids.catalogItem);
  assert.equal(offering.price.catalog_item_price_id, ids.price);
  const resource = await client.eshop.bookingResource.get({ id: resourceId, offering_id: offeringId, catalog_id: ids.catalog });
  assert.equal(resource.id, resourceId);
  await client.eshop.bookingService.getAvailability({
    booking_service_id: serviceId, booking_resource_id: resourceId, from: 1_800_000_000_000, to: 1_800_086_400_000, catalog_id: ids.catalog,
  });
  const booking = {
    id: lineId,
    booking_offering_id: offeringId,
    requested_interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
    capacity_units: 1,
    catalog_item_price_id: ids.price,
    form_submission_id: ids.submission,
  };
  await client.eshop.cart.addBooking({
    id: ids.cart,
    expected_updated_at: 7,
    booking: { ...booking, price_override: { amount: 1, currency: "eur" }, store_id: otherStoreId },
  });
  await assert.rejects(async () => client.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 7, booking: { ...booking, id: "slot-one" } }), TypeError);
  const loadedOrder = await client.eshop.order.get({ id: ids.order });
  assert.equal(orderBookingItems(loadedOrder)[0].booking_resource_id, resourceId);
  await client.eshop.order.cancelBookingItem({ order_id: loadedOrder.id, line_item_id: lineId, credit_id: creditId, expected_updated_at: 2 });

  assert.equal("service" in client.eshop, false);
  assert.equal("provider" in client.eshop, false);
  assert.deepEqual(calls.slice(0, 3).map((call) => [call.method, call.url.pathname, Object.fromEntries(call.url.searchParams)]), [
    ["GET", `/v1/storefront/booking-offerings/${offeringId}`, { catalog_id: ids.catalog, company_location_id: ids.companyLocation, include_price: "true" }],
    ["GET", `/v1/storefront/booking-resources/${resourceId}`, { catalog_id: ids.catalog, offering_id: offeringId }],
    ["GET", "/v1/storefront/booking-services/availability", {
      catalog_id: ids.catalog, booking_service_id: serviceId, booking_resource_id: resourceId, from: "1800000000000", to: "1800086400000",
    }],
  ]);
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
  const admin = createAdmin({ apiUrl: apiUrl, secretKey: "token" });
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, market: "bih", sessionStorage: visitorStorage() });
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

test("Booking Service slug lookup stays singular, answers its listing and sends no price flag", async (context) => {
  let call;
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    call = { url: new URL(url), method: init.method || "GET" };
    return jsonResponse(storefrontService());
  });
  const client = storefront({ market: "bih" });
  const service = await client.eshop.bookingService.get({
    slug: "consultation",
    catalog_id: ids.catalog,
    company_location_id: ids.companyLocation,
    include_price: true,
  });
  assert.equal(service.slugs.en, "consultation");
  assert.equal(service.catalog_item_id, ids.catalogItem);
  assert.equal("slug" in service, false);
  assert.equal("price" in service, false);
  assert.equal(call.url.pathname, "/v1/storefront/booking-services/consultation");
  assert.deepEqual(Object.fromEntries(call.url.searchParams), { catalog_id: ids.catalog, company_location_id: ids.companyLocation });
  assert.equal(call.method, "GET");
  assert.throws(() => client.eshop.bookingService.get({ catalog_id: ids.catalog }), /id or its slug/);
});

test("the booking calendar prices each slot from its listing and adds one cart line per appointment under the ids the app gives", async (context) => {
  const calls = [];
  const calendarDate = new Date();
  const availableLocalDate = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-01`;
  let current = cartRecord();
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init.headers) };
    calls.push(call);
    const path = call.url.pathname;
    if (path.endsWith(`/booking-services/${serviceId}`)) return jsonResponse(storefrontService());
    if (path.endsWith(`/catalog-items/${ids.catalogItem}/prices`)) return jsonResponse({ items: [offeringChoice()], cursor: null });
    if (path.endsWith(`/booking-resources/${resourceId}`)) return jsonResponse(bookingResource());
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
      current = { ...current, updated_at: current.updated_at + 1, line_items: [...current.line_items, { type: "booking", ...call.body.booking }] };
      return jsonResponse(current);
    }
    throw new Error(`Unexpected request ${call.method} ${call.url}`);
  });

  const facade = store();
  const scope = { buyer: { type: "customer" }, catalog_id: ids.catalog };
  await facade.eshop.cart(scope).create({ id: ids.cart });
  const calendar = facade.eshop.bookingCalendar(scope);
  const selected = await calendar.select({ booking_service_id: serviceId });
  assert.equal(selected.booking_service.id, serviceId);
  assert.deepEqual(selected.booking_choices.map((choice) => choice.catalog_item_price_id), [ids.price]);
  assert.deepEqual(selected.booking_resources.map((resource) => resource.id), [resourceId]);
  const availableDay = calendar.state.get().days.find((day) => day.iso === availableLocalDate);
  assert.equal(availableDay?.available, true);
  calendar.selectDate({ date: availableDay.iso });
  const { slots, timezone } = calendar.state.get();
  assert.equal(slots.length, 1);
  const [slot] = slots;
  assert.equal(slot.from, 1_800_000_000_000);
  assert.equal(slot.booking_offering_id, offeringId);
  assert.equal(slot.booking_resource_id, resourceId);
  assert.equal(slot.catalog_item_price_id, ids.price);
  assert.equal(slot.price.unit_price.amount, 5000);
  assert.equal(slot.date_text, new Date(slot.from).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", timeZone: timezone }));
  assert.equal(slot.time_text, [slot.from, slot.to].map((value) => new Date(value).toLocaleTimeString("en", {
    hour: "2-digit", minute: "2-digit", timeZone: timezone,
  })).join(" - "));
  assert.throws(() => calendar.selectSlot({ slot: { ...slot, catalog_item_price_id: ids.otherPrice } }), /no matching price/);
  await assert.rejects(calendar.addToCart({ id: "slot-line", slot }), TypeError);
  const result = await calendar.addToCart({ id: lineId, slot, form_submission_id: ids.submission });
  assert.equal(result.line_items.length, 1);
  await calendar.nextMonth();

  const serviceRead = calls.find((call) => call.url.pathname.endsWith(`/booking-services/${serviceId}`));
  assert.deepEqual(Object.fromEntries(serviceRead.url.searchParams), { catalog_id: ids.catalog });
  const priceRead = calls.find((call) => call.url.pathname.endsWith("/prices"));
  assert.deepEqual(Object.fromEntries(priceRead.url.searchParams), { catalog_id: ids.catalog, include_price: "true", limit: "100" });
  const resourceReads = calls.filter((call) => call.url.pathname.endsWith(`/booking-resources/${resourceId}`));
  assert.equal(resourceReads.length, 1, "a known resource is read once");
  assert.deepEqual(Object.fromEntries(resourceReads[0].url.searchParams), { catalog_id: ids.catalog, offering_id: offeringId });
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
      catalog_item_price_id: ids.price,
      form_submission_id: ids.submission,
    },
  });
  assert.equal(additions[0].headers.get("x-arky-cart-token"), "cart-recovery-token");
  assert.equal(facade.eshop.cart(scope).cart.get().id, ids.cart);
  for (const removed of ["select", "state", "addToCart", "list", "listOfferings"]) assert.equal(removed in facade.eshop.bookingService, false, removed);
  for (const removed of ["booking_offerings", "booking_offerings_cursor", "loading_offerings"]) assert.equal(removed in calendar.state.get(), false, removed);
  assert.equal("loadMoreOfferings" in calendar, false);
});

test("the booking calendar keeps the company location context of its cart and explicitly follows price and availability pages", async (context) => {
  const choiceCalls = [];
  const resourceCalls = [];
  const availabilityCalls = [];
  let repeatAvailabilityCursor = false;
  const laterResourceId = "f8b0d2e4-6a7c-4e1d-8f5b-7d9e1f3b5c6a";
  const laterOfferingId = "a9c1e3f5-7b8d-4f2e-9a6c-8e0f2a4c6d7b";
  const laterResource = bookingResource({ id: laterResourceId });
  context.mock.method(globalThis, "fetch", async (url) => {
    const request = new URL(String(url));
    assert.equal(request.searchParams.has("company_id"), false);
    assert.equal(request.searchParams.get("company_location_id"), ids.companyLocation);
    assert.equal(request.searchParams.get("catalog_id"), ids.catalog);
    if (request.pathname.endsWith(`/booking-services/${serviceId}`)) return jsonResponse(storefrontService());
    if (request.pathname.endsWith(`/catalog-items/${ids.catalogItem}/prices`)) {
      choiceCalls.push(request);
      assert.equal(request.searchParams.get("limit"), "100");
      assert.equal(request.searchParams.get("include_price"), "true");
      return jsonResponse(request.searchParams.has("cursor")
        ? { items: [offeringChoice(laterOfferingId, ids.otherPrice)], cursor: null }
        : { items: [offeringChoice()], cursor: "price-next" });
    }
    if (request.pathname.includes("/booking-resources/")) {
      resourceCalls.push(request);
      const requested = request.pathname.split("/").at(-1);
      assert.equal(request.searchParams.get("offering_id"), requested === laterResourceId ? laterOfferingId : offeringId);
      return jsonResponse(requested === laterResourceId ? laterResource : bookingResource());
    }
    if (request.pathname.endsWith("/booking-services/availability")) {
      availabilityCalls.push(request);
      assert.equal(request.searchParams.get("limit"), "20");
      assert.equal(request.searchParams.has("include_price"), false);
      return jsonResponse({
        from: Number(request.searchParams.get("from")), to: Number(request.searchParams.get("to")),
        booking_resources: [{
          booking_offering_id: request.searchParams.has("cursor") ? laterOfferingId : offeringId,
          booking_resource_id: request.searchParams.has("cursor") ? laterResourceId : resourceId,
          resource_key: "room", timezone: "Europe/Sarajevo", days: [],
        }],
        cursor: request.searchParams.has("cursor") && !repeatAvailabilityCursor ? null : "availability-next",
      });
    }
    throw new Error(`Unexpected request ${url}`);
  });
  const calendar = store().eshop.bookingCalendar({
    buyer: { type: "company_location", company_location_id: ids.companyLocation, purchase_order_number: null },
    catalog_id: ids.catalog,
  });
  await calendar.select({ booking_service_id: serviceId });
  assert.equal(choiceCalls.length, 1);
  assert.equal(availabilityCalls.length, 1, "availability must not eagerly follow continuations");
  assert.equal(resourceCalls.length, 1);
  assert.equal(calendar.state.get().availability.cursor, "availability-next");
  assert.equal(calendar.state.get().booking_choices_cursor, "price-next");
  const state = await calendar.loadMoreChoices();
  assert.equal(choiceCalls.length, 2);
  assert.equal(choiceCalls[1].searchParams.get("cursor"), "price-next");
  assert.deepEqual(state.booking_choices.map((row) => row.catalog_item_price_id), [ids.price, ids.otherPrice]);
  assert.equal(state.booking_choices_cursor, null);
  assert.equal(state.loading_choices, false);
  await calendar.loadMoreChoices();
  assert.equal(choiceCalls.length, 2, "an exhausted list makes no further request");
  repeatAvailabilityCursor = true;
  await assert.rejects(calendar.loadMoreAvailability(), (error) => error.name === "ArkyError" && error.code === "answer_mismatch" && /didn't advance/.test(error.message));
  assert.equal(calendar.state.get().availability.cursor, "availability-next");
  assert.equal(calendar.state.get().availability.booking_resources.length, 1);
  assert.equal(calendar.state.get().loading, false);
  assert.equal(resourceCalls.length, 1);
  repeatAvailabilityCursor = false;
  await calendar.loadMoreAvailability();
  assert.equal(availabilityCalls.length, 3);
  assert.equal(availabilityCalls[1].searchParams.get("cursor"), "availability-next");
  assert.equal(availabilityCalls[1].searchParams.get("from"), availabilityCalls[0].searchParams.get("from"));
  assert.deepEqual(calendar.state.get().availability.booking_resources.map((row) => row.booking_resource_id), [resourceId, laterResourceId]);
  assert.deepEqual(calendar.state.get().booking_resources.map((row) => row.id), [resourceId, laterResourceId]);
  assert.equal(resourceCalls.length, 2);
  assert.equal(calendar.state.get().availability.cursor, null);
  await calendar.loadMoreAvailability();
  assert.equal(availabilityCalls.length, 3);
  await assert.rejects(calendar.selectResource({ booking_resource_id: ids.variant }), TypeError);
});

test("late availability cannot replace a newer booking service selection in the calendar", async (context) => {
  let announcePending;
  let releaseOld;
  const pending = new Promise((resolve) => { announcePending = resolve; });
  const newServiceId = "b0d2f4a6-8c9e-4a3f-8b7d-9f1a3c5e7d8b";
  const resourceReads = [];
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
    if (request.pathname.endsWith("/prices")) return jsonResponse({ items: [], cursor: null });
    if (request.pathname.includes("/booking-resources/")) {
      resourceReads.push(request.pathname.split("/").at(-1));
      return jsonResponse(bookingResource({ id: request.pathname.split("/").at(-1) }));
    }
    if (request.pathname.includes("/booking-services/")) return jsonResponse(storefrontService({ id: request.pathname.split("/").at(-1) }));
    throw new Error(`Unexpected request ${url}`);
  });
  const facade = store();
  const calendar = facade.eshop.bookingCalendar({ buyer: { type: "customer" }, catalog_id: ids.catalog });
  try {
    const first = calendar.select({ booking_service_id: serviceId });
    await pending;
    await calendar.select({ booking_service_id: newServiceId });
    releaseOld();
    await first;
    const state = calendar.state.get();
    assert.equal(state.booking_service.id, newServiceId);
    assert.equal(state.availability.booking_resources[0].booking_resource_id, newServiceId);
    assert.deepEqual(state.booking_resources.map((resource) => resource.id), [newServiceId]);
    assert.deepEqual(resourceReads, [newServiceId]);
    assert.equal(state.loading, false);
    assert.equal("state" in facade.eshop, false);
  } finally {
    releaseOld?.();
  }
});
