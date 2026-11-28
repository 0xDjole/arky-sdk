#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin, orderBookingItems } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, cartRecord, fixedIdFactories, ids, jsonResponse, marketRecord, storefrontIdentity, visitorStorage } from "./helpers/arky-fixtures.mjs";

const tenantId = ids.tenant;
const otherTenantId = ids.otherTenant;
const serviceId = "a3c5e7f9-1b2d-4f68-8a0c-2e4f6a8c0b1d";
const resourceId = "b4d6f8a0-2c3e-4a79-9b1d-3f5a7b9d1c2e";
const offeringId = "c5e7a9b1-3d4f-4b8a-8c2e-4a6b8c0e2d3f";
const taxCategoryId = "d6f8b0c2-4e5a-4c9b-9d3f-5b7c9d1f3e4a";
const locationId = "e7a9c1d3-5f6b-4dac-8e4a-6c8d0e2a4f5b";
const addOnId = "f9b1d3e5-7a2c-4b6d-8e0f-1a3c5e7b9d2f";
const bookedAddOnId = "10000000-0000-4000-8000-000000000055";
const addOnOfferingId = "0a2c4e6b-8d1f-4a3c-9e5b-7d9f1b3c5e8a";
const lineId = ids.line;
const creditId = ids.credit;

function bookingService(overrides = {}) {
  return {
    id: serviceId,
    tenant_id: tenantId,
    key: "consultation",
    slugs: { en: "consultation" },
    blocks: [],
    categories: [],
    length: 3_600_000,
    slot_interval: 1_800_000,
    booking_window: { opens: { type: "before_start", period: 2_592_000_000 }, closes_before_start: 7_200_000 },
    user_changes: { type: "not_allowed" },
    tax_category_id: taxCategoryId,
    document_item: { type: "named", name: "Consultation", unit: "h" },
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

function storefrontService(overrides = {}) {
  return { ...bookingService(), package_item_id: ids.packageItem, ...overrides };
}

function bookingResource(overrides = {}) {
  return {
    id: resourceId,
    tenant_id: tenantId,
    key: "room-one",
    slugs: { en: "room-one" },
    blocks: [],
    categories: [],
    timezone: "Europe/Sarajevo",
    capacity: 3,
    hours: {
      weekly_availability: { monday: [{ tenant_location_id: locationId, from: 32_400_000, to: 61_200_000 }] },
      date_overrides: { "2026-08-24": [] },
    },
    daily_limits: [{ booking_service_id: serviceId, bookings: 8 }],
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

function storefrontResource(overrides = {}) {
  const { daily_limits: _dailyLimits, ...resource } = bookingResource();
  return { ...resource, ...overrides };
}

function bookingOffering(overrides = {}) {
  return {
    id: offeringId,
    tenant_id: tenantId,
    booking_service_id: serviceId,
    resources: { type: "ids", booking_resource_ids: [resourceId] },
    times: [{ from: 0, to: 3_600_000 }],
    locations: { type: "ids", tenant_location_ids: [locationId] },
    hours: { type: "all" },
    add_ons: [{ id: addOnId, booking_service_id: serviceId, resources: { type: "all" }, from: 3_600_000 }],
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

const offeringPrice = {
  package_id: ids.package,
  package_item_id: ids.packageItem,
  price_id: ids.price,
  tax_mode: "inclusive",
  unit_price: { amount: 5000, currency: "eur" },
  compare_at: null,
  priced_at: 1,
};

function storefrontOffering(overrides = {}) {
  return { ...bookingOffering(), package_item_id: ids.packageItem, price: offeringPrice, ...overrides };
}

function offeringChoice(bookingOfferingId = offeringId, packageItemPriceId = ids.price) {
  return {
    price_id: packageItemPriceId,
    sellable: { type: "booking_offering", booking_offering_id: bookingOfferingId },
    content: { sku: null, blocks: [], basis: { type: "booking_option" }, placement: { type: "booking", locations: { type: "all" }, resources: { type: "ids", booking_resource_ids: [resourceId] } } },
    price: { ...offeringPrice, price_id: packageItemPriceId },
  };
}

function bookingLine() {
  return {
    type: "booking",
    id: lineId,
    booking_offering_id: offeringId,
    booking_service_id: serviceId,
    booking_resource_id: resourceId,
    tenant_location_id: locationId,
    user_id: ids.user,
    interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
    total_interval: { from: 1_800_000_000_000, to: 1_800_007_200_000 },
    capacity_intervals: [{ from: 1_800_000_000_000, to: 1_800_003_600_000 }],
    add_ons: [{
      booked_add_on_id: bookedAddOnId,
      add_on_id: addOnId,
      booking_offering_id: addOnOfferingId,
      booking_service_id: serviceId,
      booking_resource_id: resourceId,
      service_key: "consultation",
      resource_key: "room-one",
      interval: { from: 1_800_003_600_000, to: 1_800_007_200_000 },
      capacity_intervals: [{ from: 1_800_003_600_000, to: 1_800_007_200_000 }],
      price: { type: "listed", price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.otherPrice }, amount: 900 },
      form_submission_id: null,
      add_ons: [],
      status: { type: "held" },
    }],
    capacity_units: 1,
    form_submission_id: ids.submission,
    snapshot: { service_key: "consultation", resource_key: "room-one", timezone: "Europe/Sarajevo", price: { type: "listed", package_id: ids.package, package_item_id: "package-item", price_id: ids.price }, document_item: { type: "named", name: "Consultation", unit: "h" } },
    status: { type: "confirmed", attendance: { type: "upcoming" } },
    changes: [],
    money: { unit_price: 5000, discounts: [], tax: { type: "own", tax_category_id: taxCategoryId, rule_id: ids.variant, treatment: { type: "rates", lines: [] } } },
    created_at: 1,
    updated_at: 2,
  };
}

function order() {
  return {
    id: ids.order,
    number: "1001",
    tenant_id: tenantId,
    source: { type: "cart", cart_id: ids.cart, placed_by: { type: "user", user_id: ids.user, user_session_id: ids.session } },
    user_id: ids.user,
    line_items: [bookingLine()],
    updated_at: 2,
  };
}

function storefront(options = {}) {
  return createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage(), ...options });
}

function store(options = {}) {
  return initialize(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, locale: "en", sessionStorage: visitorStorage(), ...options });
}

test("Admin resource discovery preserves bounded opaque continuation and ordered filters, and the storefront only reads one resource", async (context) => {
  const cursor = "+/a=".repeat(512);
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return jsonResponse(calls.length === 1 ? { items: [], cursor } : { items: [bookingResource()], cursor: null });
  });
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const filters = {
    query: "room", status: "active", limit: 1,
    sort_field: "key", sort_direction: "desc", created_at_from: 0, created_at_to: 10,
  };
  const first = await admin.eshop.bookingResource.find({ tenant_id: tenantId, ...filters });
  assert.deepEqual(first, { items: [], cursor });
  const second = await admin.eshop.bookingResource.find({ tenant_id: tenantId, ...filters, cursor: first.cursor });
  assert.deepEqual(second, { items: [bookingResource()], cursor: null });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/tenants/${tenantId}/booking-resources`);
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) assert.equal(call.url.searchParams.get(key), String(value));
    for (const removed of ["from", "to", "match_all", "tenant_id", "booking_service_id"]) assert.equal(call.url.searchParams.has(removed), false);
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
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const { id: _serviceId, tenant_id: _serviceTenant, created_at: _serviceCreated, updated_at: _serviceUpdated, ...serviceFields } = bookingService();
  const service = { id: serviceId, ...serviceFields };
  const { id: _resourceId, tenant_id: _resourceTenant, created_at: _resourceCreated, updated_at: _resourceUpdated, ...resourceFields } = bookingResource();
  const resource = { id: resourceId, ...resourceFields };
  const { id: _offeringId, tenant_id: _tenant, status: _status, created_at: _created, updated_at: _updated, ...offeringFields } = bookingOffering();
  const offering = { id: offeringId, ...offeringFields, status: { type: "active" } };
  await admin.eshop.bookingService.create({ tenant_id: tenantId, ...service });
  await admin.eshop.bookingResource.create({ tenant_id: tenantId, ...resource });
  await admin.eshop.bookingOffering.create({ tenant_id: tenantId, ...offering });
  const loadedOrder = await admin.eshop.order.get({ tenant_id: tenantId, id: ids.order });
  const line = orderBookingItems(loadedOrder)[0];
  assert.equal(line.id, lineId);
  await admin.eshop.order.cancelBookingItem({ tenant_id: tenantId, order_id: loadedOrder.id, order_booking_item_id: line.id, credit_id: creditId, expected_updated_at: 2 });
  await admin.eshop.order.stepBookingItem({ tenant_id: tenantId, order_id: loadedOrder.id, order_booking_item_id: line.id, expected_updated_at: 3, step: "attended", fiscal_device_id: ids.picked });
  await admin.eshop.order.stepBookingItem({ tenant_id: tenantId, order_id: loadedOrder.id, order_booking_item_id: line.id, expected_updated_at: 4, step: "no_show", fiscal_device_id: null });
  const { id: _updatedId, ...resourceUpdate } = { ...resource, capacity: 2, daily_limits: [], expected_updated_at: 5 };
  await admin.eshop.bookingResource.update({ tenant_id: tenantId, id: resourceId, ...resourceUpdate });

  for (const removed of ["service", "provider", "booking"]) assert.equal(removed in admin.eshop, false, removed);
  for (const removed of ["getBookings", "getBookingAppointment", "completeBookingItem", "markBookingItemWaiting", "startBookingItem", "attendBookingItem", "markBookingItemNoShow"]) {
    assert.equal(removed in admin.eshop.order, false, removed);
  }
  assert.equal("getByServiceAndResource" in admin.eshop.bookingOffering, false);
  assert.equal(line.tenant_location_id, locationId);
  assert.deepEqual(line.total_interval, { from: 1_800_000_000_000, to: 1_800_007_200_000 });
  assert.deepEqual(line.add_ons.map((addOn) => [addOn.booked_add_on_id, addOn.add_on_id, addOn.price.type, addOn.status.type]), [[bookedAddOnId, addOnId, "listed", "held"]]);
  assert.deepEqual(calls.map((call) => [call.url.pathname, call.method, call.body]), [
    [`/v1/tenants/${tenantId}/booking-services`, "POST", service],
    [`/v1/tenants/${tenantId}/booking-resources`, "POST", resource],
    [`/v1/tenants/${tenantId}/booking-offerings`, "POST", offering],
    [`/v1/tenants/${tenantId}/orders/${ids.order}`, "GET", null],
    [`/v1/tenants/${tenantId}/orders/${ids.order}/booking-items/${lineId}/cancel`, "POST", { credit_id: creditId, expected_updated_at: 2 }],
    [`/v1/tenants/${tenantId}/orders/${ids.order}/booking-items/${lineId}/attend`, "POST", { expected_updated_at: 3, fiscal_device_id: ids.picked }],
    [`/v1/tenants/${tenantId}/orders/${ids.order}/booking-items/${lineId}/no-show`, "POST", { expected_updated_at: 4, fiscal_device_id: null }],
    [`/v1/tenants/${tenantId}/booking-resources/${resourceId}`, "PUT", resourceUpdate],
  ]);
  assert.equal("type" in calls[1].body, false);
  assert.deepEqual(calls[1].body.hours.weekly_availability.monday, [{ tenant_location_id: locationId, from: 32_400_000, to: 61_200_000 }]);
  assert.deepEqual(calls[1].body.daily_limits, [{ booking_service_id: serviceId, bookings: 8 }]);
  assert.deepEqual(calls[7].body.daily_limits, []);
  assert.equal(calls[0].body.length, 3_600_000);
  assert.equal(calls[0].body.slot_interval, 1_800_000);
  for (const removed of ["segments", "buffer_before_minutes", "buffer_after_minutes", "slot_interval_minutes"]) assert.equal(removed in calls[0].body, false, removed);
  for (const [create, record] of [
    [admin.eshop.bookingService.create, service],
    [admin.eshop.bookingResource.create, resource],
    [admin.eshop.bookingOffering.create, offering],
  ]) {
    for (const id of [undefined, "consultation", serviceId.toUpperCase()]) {
      await assert.rejects(async () => create({ tenant_id: tenantId, ...record, id }), TypeError);
    }
  }
  assert.equal(calls.length, 8);
});

test("storefront booking runtime reads one offering and its resource in the package and sends the slot with its item's price", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init.headers) };
    calls.push(call);
    const path = call.url.pathname;
    if (path.endsWith(`/booking-offerings/${offeringId}`)) return jsonResponse(storefrontOffering());
    if (path.endsWith(`/booking-resources/${resourceId}`)) return jsonResponse(storefrontResource());
    if (path.endsWith("/booking-services/availability")) {
      return jsonResponse({
        from: 1_800_000_000_000, to: 1_800_086_400_000, cursor: null,
        booking_resources: [{ booking_offering_id: offeringId, tenant_location_id: locationId, booking_resource_id: resourceId, resource_key: "room-one", timezone: "Europe/Sarajevo", days: [] }],
      });
    }
    if (path.endsWith(`/carts/${ids.cart}/booking-items`)) return jsonResponse(cartRecord({ line_items: [{ type: "booking", ...call.body.booking }] }));
    return jsonResponse(order());
  });
  const client = storefront({ market: "bih" });
  const offering = await client.eshop.bookingOffering.get({ id: offeringId, package_id: ids.package, company_location_id: ids.companyLocation, include_price: true });
  assert.equal(offering.package_item_id, ids.packageItem);
  assert.equal(offering.price.price_id, ids.price);
  const resource = await client.eshop.bookingResource.get({ id: resourceId, offering_id: offeringId, package_id: ids.package });
  assert.equal(resource.id, resourceId);
  await client.eshop.bookingService.getAvailability({
    booking_service_id: serviceId, tenant_location_id: locationId, booking_resource_id: resourceId, from: 1_800_000_000_000, to: 1_800_086_400_000, package_id: ids.package,
  });
  const booking = {
    id: lineId,
    booking_offering_id: offeringId,
    tenant_location_id: locationId,
    resource: { type: "resource", booking_resource_id: resourceId },
    requested_interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
    add_ons: [{ add_on_id: addOnId, resource: { type: "any" }, add_ons: [] }],
    capacity_units: 1,
    price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price },
    form_submission_id: ids.submission,
  };
  await client.eshop.cart.addBooking({
    id: ids.cart,
    expected_updated_at: 7,
    booking: { ...booking, price_override: { amount: 1, currency: "eur" }, tenant_id: otherTenantId },
  });
  await assert.rejects(async () => client.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 7, booking: { ...booking, id: "slot-one" } }), TypeError);
  const loadedOrder = await client.eshop.order.get({ id: ids.order });
  assert.equal(orderBookingItems(loadedOrder)[0].booking_resource_id, resourceId);
  assert.equal(orderBookingItems(loadedOrder)[0].tenant_location_id, locationId);
  await client.eshop.order.cancelBookingItem({ order_id: loadedOrder.id, order_booking_item_id: lineId, credit_id: creditId, expected_updated_at: 2 });

  assert.equal("service" in client.eshop, false);
  assert.equal("provider" in client.eshop, false);
  assert.deepEqual(calls.slice(0, 3).map((call) => [call.method, call.url.pathname, Object.fromEntries(call.url.searchParams)]), [
    ["GET", `/v1/storefront/booking-offerings/${offeringId}`, { package_id: ids.package, company_location_id: ids.companyLocation, include_price: "true" }],
    ["GET", `/v1/storefront/booking-resources/${resourceId}`, { package_id: ids.package, offering_id: offeringId }],
    ["GET", "/v1/storefront/booking-services/availability", {
      package_id: ids.package, booking_service_id: serviceId, tenant_location_id: locationId, booking_resource_id: resourceId, from: "1800000000000", to: "1800086400000",
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
    assert.equal(call.url.searchParams.has("tenant_id"), false);
  }
});

test("booking cancellation resends the caller's credit id after an uncertain response and refuses an invented one", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: JSON.parse(String(init.body)) });
    if (calls.length % 2 === 1) return jsonResponse({ message: "Response unavailable", status_code: 503 }, 503);
    return jsonResponse(order());
  });
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const storefront = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "bih", sessionStorage: visitorStorage() });
  for (const [client, target] of [[admin, { tenant_id: tenantId }], [storefront, {}]]) {
    const request = { ...target, order_id: "order/booking", order_booking_item_id: "item/booking", credit_id: creditId, expected_updated_at: 9 };
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
  assert.equal(calls[0].url.pathname, `/v1/tenants/${tenantId}/orders/order%2Fbooking/booking-items/item%2Fbooking/cancel`);
  assert.equal(calls[2].url.pathname, "/v1/storefront/orders/order%2Fbooking/booking-items/item%2Fbooking/cancel");
});

test("Booking Service slug lookup stays singular, answers its item and sends no price flag", async (context) => {
  let call;
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    call = { url: new URL(url), method: init.method || "GET" };
    return jsonResponse(storefrontService());
  });
  const client = storefront({ market: "bih" });
  const service = await client.eshop.bookingService.get({
    slug: "consultation",
    package_id: ids.package,
    company_location_id: ids.companyLocation,
    include_price: true,
  });
  assert.equal(service.slugs.en, "consultation");
  assert.equal(service.package_item_id, ids.packageItem);
  assert.equal("slug" in service, false);
  assert.equal("price" in service, false);
  assert.equal(call.url.pathname, "/v1/storefront/booking-services/consultation");
  assert.deepEqual(Object.fromEntries(call.url.searchParams), { package_id: ids.package, company_location_id: ids.companyLocation });
  assert.equal(call.method, "GET");
  assert.throws(() => client.eshop.bookingService.get({ package_id: ids.package }), /id or its slug/);
});

test("the booking calendar prices each slot from its item and adds one cart line per appointment under the ids the app gives", async (context) => {
  const calls = [];
  const calendarDate = new Date();
  const availableLocalDate = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-01`;
  const roomName = { id: "c7e9b1d3-5f2a-4c6e-9b8d-1f3a5c7e9b2d", key: "name", type: "text", value: "Room one" };
  let current = cartRecord();
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init.headers) };
    calls.push(call);
    const path = call.url.pathname;
    if (path === "/v1/storefront/markets/by-key/bih") return jsonResponse(marketRecord("bih"));
    if (path.endsWith(`/booking-services/${serviceId}`)) return jsonResponse(storefrontService());
    if (path.endsWith(`/package-items/${ids.packageItem}/prices`)) return jsonResponse({ items: [offeringChoice()], cursor: null });
    if (path.endsWith(`/booking-resources/${resourceId}`)) return jsonResponse(storefrontResource());
    if (path.endsWith("/booking-services/availability")) {
      return jsonResponse({
        from: Number(call.url.searchParams.get("from")),
        to: Number(call.url.searchParams.get("to")),
        cursor: null,
        booking_resources: [{
          booking_offering_id: offeringId,
          tenant_location_id: locationId,
          booking_resource_id: resourceId,
          resource_key: "room-one",
          resource_blocks: [roomName],
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

  const facade = store({ market: "bih" });
  const scope = { buyer: { type: "user" }, package_id: ids.package };
  await facade.eshop.cart(scope).create({ id: ids.cart });
  const calendar = facade.eshop.bookingCalendar(scope);
  const selected = await calendar.select({ booking_service_id: serviceId, tenant_location_id: locationId });
  assert.equal(selected.booking_service.id, serviceId);
  assert.equal(selected.tenant_location_id, locationId);
  assert.deepEqual(selected.booking_choices.map((choice) => choice.price_id), [ids.price]);
  assert.deepEqual(selected.booking_resources, [{ id: resourceId, key: "room-one", blocks: [roomName], timezone: "Europe/Sarajevo" }]);
  const availableDay = calendar.state.get().days.find((day) => day.iso === availableLocalDate);
  assert.equal(availableDay?.available, true);
  calendar.selectDate({ date: availableDay.iso });
  const { slots } = calendar.state.get();
  assert.equal(slots.length, 1);
  const [slot] = slots;
  const { timezone } = slot;
  assert.equal(timezone, "Europe/Sarajevo");
  assert.equal(slot.from, 1_800_000_000_000);
  assert.equal(slot.booking_offering_id, offeringId);
  assert.equal(slot.booking_resource_id, resourceId);
  assert.equal(slot.tenant_location_id, locationId);
  assert.deepEqual(slot.price_ref, { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price });
  assert.equal(slot.price.unit_price.amount, 5000);
  assert.equal(slot.date_text, new Date(slot.from).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", timeZone: timezone }));
  assert.equal(slot.time_text, [slot.from, slot.to].map((value) => new Date(value).toLocaleTimeString("en", {
    hour: "2-digit", minute: "2-digit", timeZone: timezone,
  })).join(" - "));
  assert.throws(() => calendar.selectSlot({ slot: { ...slot, price_ref: { ...slot.price_ref, price_id: ids.otherPrice } } }), /no matching price/);
  await assert.rejects(calendar.addToCart({ id: "slot-line", slot }), TypeError);
  const result = await calendar.addToCart({ id: lineId, slot, form_submission_id: ids.submission });
  assert.equal(result.line_items.length, 1);
  await calendar.nextMonth();

  const serviceRead = calls.find((call) => call.url.pathname.endsWith(`/booking-services/${serviceId}`));
  assert.deepEqual(Object.fromEntries(serviceRead.url.searchParams), { package_id: ids.package });
  const priceRead = calls.find((call) => call.url.pathname.endsWith("/prices"));
  assert.deepEqual(Object.fromEntries(priceRead.url.searchParams), { package_id: ids.package, include_price: "true", limit: "100" });
  const resourceReads = calls.filter((call) => call.url.pathname.includes("/booking-resources"));
  assert.equal(resourceReads.length, 0, "the availability rows carry each resource's key and blocks, so no resource is read");
  const availabilityCalls = calls.filter((call) => call.url.pathname.endsWith("/booking-services/availability"));
  const dayMilliseconds = 24 * 60 * 60 * 1_000;
  const firstBounds = availabilityCalls[0].url.searchParams;
  assert.equal(firstBounds.get("limit"), "20");
  assert.equal(firstBounds.get("tenant_location_id"), locationId);
  assert.equal(Number(firstBounds.get("from")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), 1) - dayMilliseconds);
  assert.equal(Number(firstBounds.get("to")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1) + dayMilliseconds);
  const nextBounds = availabilityCalls.at(-1).url.searchParams;
  assert.equal(Number(nextBounds.get("from")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1) - dayMilliseconds);
  assert.equal(Number(nextBounds.get("to")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth() + 2, 1) + dayMilliseconds);

  const additions = calls.filter((call) => call.url.pathname.endsWith("/booking-items"));
  assert.equal(additions.length, 1);
  assert.deepEqual(additions[0].body, {
    expected_updated_at: 1_700_000_000_001,
    booking: {
      id: lineId,
      booking_offering_id: offeringId,
      tenant_location_id: locationId,
      resource: { type: "any" },
      requested_interval: { from: slot.from, to: slot.to },
      add_ons: [],
      capacity_units: 1,
      price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price },
      form_submission_id: ids.submission,
    },
  });
  assert.equal(additions[0].headers.get("x-arky-cart-token"), "cart-recovery-token");
  assert.equal(facade.eshop.cart(scope).cart.get().id, ids.cart);
  for (const removed of ["select", "state", "addToCart", "list", "listOfferings"]) assert.equal(removed in facade.eshop.bookingService, false, removed);
  for (const removed of ["booking_offerings", "booking_offerings_cursor", "loading_offerings"]) assert.equal(removed in calendar.state.get(), false, removed);
  assert.equal("loadMoreOfferings" in calendar, false);
});

test("the booking calendar keeps the company location context of its cart, reads every availability page and follows price pages when asked", async (context) => {
  const choiceCalls = [];
  const resourceCalls = [];
  const availabilityCalls = [];
  let repeatAvailabilityCursor = false;
  const laterResourceId = "f8b0d2e4-6a7c-4e1d-8f5b-7d9e1f3b5c6a";
  const laterOfferingId = "a9c1e3f5-7b8d-4f2e-9a6c-8e0f2a4c6d7b";
  const laterResource = storefrontResource({ id: laterResourceId });
  context.mock.method(globalThis, "fetch", async (url) => {
    const request = new URL(String(url));
    assert.equal(request.searchParams.has("company_id"), false);
    assert.equal(request.searchParams.get("company_location_id"), ids.companyLocation);
    assert.equal(request.searchParams.get("package_id"), ids.package);
    if (request.pathname.endsWith(`/booking-services/${serviceId}`)) return jsonResponse(storefrontService());
    if (request.pathname.endsWith(`/package-items/${ids.packageItem}/prices`)) {
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
      return jsonResponse(requested === laterResourceId ? laterResource : storefrontResource());
    }
    if (request.pathname.endsWith("/booking-services/availability")) {
      availabilityCalls.push(request);
      assert.equal(request.searchParams.get("limit"), "20");
      assert.equal(request.searchParams.has("include_price"), false);
      return jsonResponse({
        from: Number(request.searchParams.get("from")), to: Number(request.searchParams.get("to")),
        booking_resources: [{
          booking_offering_id: request.searchParams.has("cursor") ? laterOfferingId : offeringId,
          tenant_location_id: locationId,
          booking_resource_id: request.searchParams.has("cursor") ? laterResourceId : resourceId,
          resource_key: "room", resource_blocks: [], timezone: "Europe/Sarajevo", days: [],
        }],
        cursor: request.searchParams.has("cursor") && !repeatAvailabilityCursor ? null : "availability-next",
      });
    }
    throw new Error(`Unexpected request ${url}`);
  });
  const calendar = store().eshop.bookingCalendar({
    buyer: { type: "company_location", company_location_id: ids.companyLocation, purchase_order_number: null },
    package_id: ids.package,
  });
  await calendar.select({ booking_service_id: serviceId, tenant_location_id: locationId });
  assert.equal(choiceCalls.length, 1);
  assert.equal(availabilityCalls.length, 2, "a month read follows every availability page");
  assert.equal(availabilityCalls[1].searchParams.get("cursor"), "availability-next");
  assert.equal(availabilityCalls[1].searchParams.get("from"), availabilityCalls[0].searchParams.get("from"));
  assert.deepEqual(calendar.state.get().availability.booking_resources.map((row) => row.booking_resource_id), [resourceId, laterResourceId]);
  assert.deepEqual(calendar.state.get().booking_resources.map((row) => row.id), [resourceId, laterResourceId]);
  assert.equal(resourceCalls.length, 0, "the availability rows carry each resource, so no resource is read");
  assert.equal(calendar.state.get().availability.cursor, null);
  assert.equal(calendar.state.get().booking_choices_cursor, "price-next");
  const state = await calendar.loadMoreChoices();
  assert.equal(choiceCalls.length, 2);
  assert.equal(choiceCalls[1].searchParams.get("cursor"), "price-next");
  assert.deepEqual(state.booking_choices.map((row) => row.price_id), [ids.price, ids.otherPrice]);
  assert.equal(state.booking_choices_cursor, null);
  assert.equal(state.loading_choices, false);
  await calendar.loadMoreChoices();
  assert.equal(choiceCalls.length, 2, "an exhausted list makes no further request");
  repeatAvailabilityCursor = true;
  await assert.rejects(calendar.nextMonth(), (error) => error.name === "ArkyError" && error.code === "answer_mismatch" && /didn't advance/.test(error.message));
  assert.equal(availabilityCalls.length, 4);
  assert.equal(calendar.state.get().availability, null);
  assert.equal(calendar.state.get().loading, false);
  assert.equal(resourceCalls.length, 0);
  assert.equal("loadMoreAvailability" in calendar, false);
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
        booking_resources: [{ booking_offering_id: offeringId, tenant_location_id: locationId, booking_resource_id: requestedService, resource_key: requestedService, resource_blocks: [], timezone: "Europe/Sarajevo", days: [] }],
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
      return jsonResponse(storefrontResource({ id: request.pathname.split("/").at(-1) }));
    }
    if (request.pathname.includes("/booking-services/")) return jsonResponse(storefrontService({ id: request.pathname.split("/").at(-1) }));
    throw new Error(`Unexpected request ${url}`);
  });
  const facade = store();
  const calendar = facade.eshop.bookingCalendar({ buyer: { type: "user" }, package_id: ids.package });
  try {
    const first = calendar.select({ booking_service_id: serviceId, tenant_location_id: locationId });
    await pending;
    await calendar.select({ booking_service_id: newServiceId, tenant_location_id: locationId });
    releaseOld();
    await first;
    const state = calendar.state.get();
    assert.equal(state.booking_service.id, newServiceId);
    assert.equal(state.availability.booking_resources[0].booking_resource_id, newServiceId);
    assert.deepEqual(state.booking_resources, [{ id: newServiceId, key: newServiceId, blocks: [], timezone: "Europe/Sarajevo" }]);
    assert.deepEqual(resourceReads, []);
    assert.equal(state.loading, false);
    assert.equal("state" in facade.eshop, false);
  } finally {
    releaseOld?.();
  }
});

test("a booking offering sends its resources, times, branches, hours and add-ons, and an update sends only what it names", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return jsonResponse(bookingOffering());
  });
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const { id: _id, tenant_id: _tenant, status: _status, created_at: _created, updated_at: _updated, ...fields } = bookingOffering();
  const created = await admin.eshop.bookingOffering.create({ tenant_id: tenantId, id: offeringId, ...fields, status: { type: "active" } });
  assert.deepEqual(created.locations, { type: "ids", tenant_location_ids: [locationId] });
  const elsewhere = { type: "elsewhere", tenant_location_id: locationId };
  const onlyHours = { type: "only", hours: { weekly_availability: { friday: [{ from: 32_400_000, to: 43_200_000 }] }, date_overrides: {} } };
  await admin.eshop.bookingOffering.update({ tenant_id: tenantId, id: offeringId, expected_updated_at: 2, locations: elsewhere, hours: onlyHours });
  await admin.eshop.bookingOffering.update({ tenant_id: tenantId, id: offeringId, expected_updated_at: 3, resources: { type: "category", category_id: ids.picked }, add_ons: [] });
  await admin.eshop.bookingOffering.update({ tenant_id: tenantId, id: offeringId, expected_updated_at: 4, status: { type: "archived" } });
  await admin.eshop.bookingOffering.create({ tenant_id: tenantId, id: offeringId, ...fields, add_ons: undefined, status: { type: "draft" } });
  assert.deepEqual(calls.map((call) => [call.url.pathname, call.method, call.body]), [
    [`/v1/tenants/${tenantId}/booking-offerings`, "POST", { id: offeringId, ...fields, status: { type: "active" } }],
    [`/v1/tenants/${tenantId}/booking-offerings/${offeringId}`, "PUT", { locations: elsewhere, hours: onlyHours, expected_updated_at: 2 }],
    [`/v1/tenants/${tenantId}/booking-offerings/${offeringId}`, "PUT", { resources: { type: "category", category_id: ids.picked }, add_ons: [], expected_updated_at: 3 }],
    [`/v1/tenants/${tenantId}/booking-offerings/${offeringId}`, "PUT", { status: { type: "archived" }, expected_updated_at: 4 }],
    [`/v1/tenants/${tenantId}/booking-offerings`, "POST", { id: offeringId, ...fields, add_ons: [], status: { type: "draft" } }],
  ]);
  for (const removed of ["booking_resource_id", "venue", "max_per_day"]) assert.equal(removed in calls[0].body, false, removed);
  assert.equal("times" in calls[3].body, false, "an update that names no times keeps them");
});

test("staff change a booking line through one update route and take an add-on off with a credit", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET", body: init.body ? JSON.parse(String(init.body)) : null });
    return jsonResponse(order());
  });
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const target = { tenant_id: tenantId, order_id: ids.order, order_booking_item_id: lineId };
  const updates = [
    { type: "start", starts_at: 1_800_000_000_000 },
    { type: "branch", tenant_location_id: locationId },
    { type: "resource", booking_resource_id: resourceId },
    { type: "add_on", booked_add_on_id: bookedAddOnId, starts_at: 1_800_003_600_000, booking_resource_id: resourceId },
    { type: "add_add_on", add_on_id: addOnId, offering: { type: "any" }, resource: { type: "any" } },
  ];
  for (const [index, update] of updates.entries()) {
    await admin.eshop.order.updateBookingItem({ ...target, expected_updated_at: index + 1, update, notify_user: index === 0 });
  }
  await assert.rejects(async () => admin.eshop.order.updateBookingItem({ ...target, expected_updated_at: 9, update: updates[0] }), TypeError);
  await admin.eshop.order.takeOffBookingAddOn({ ...target, booked_add_on_id: bookedAddOnId, credit_id: creditId, expected_updated_at: 6 });
  await assert.rejects(async () => admin.eshop.order.takeOffBookingAddOn({ ...target, booked_add_on_id: bookedAddOnId, credit_id: "take-off", expected_updated_at: 6 }), TypeError);
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname, call.body]), [
    ...updates.map((update, index) => [
      "PATCH",
      `/v1/tenants/${tenantId}/orders/${ids.order}/booking-items/${lineId}`,
      { expected_updated_at: index + 1, update, notify_user: index === 0 },
    ]),
    ["POST", `/v1/tenants/${tenantId}/orders/${ids.order}/booking-items/${lineId}/add-ons/${bookedAddOnId}/take-off`, { credit_id: creditId, expected_updated_at: 6 }],
  ]);
});

test("a storefront resource slug keeps the locale and offering visibility context", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), headers: new Headers(init.headers) });
    return jsonResponse(storefrontResource());
  });
  const client = storefront({ locale: "bs-BA" });
  const resource = await client.eshop.bookingResource.get({ id: "ordinacija", offering_id: offeringId, package_id: ids.package });
  assert.equal(resource.id, resourceId);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, "/v1/storefront/booking-resources/ordinacija");
  assert.equal(calls[0].headers.get("x-arky-locale"), "bs-BA");
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { package_id: ids.package, offering_id: offeringId });
});

test("staff read booking offerings by ids and Tito pages of a service's or a resource's offerings, and the tenant's or a category's services and resources", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET" });
    return jsonResponse({ items: [], cursor: null });
  });
  const admin = createAdmin({ apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop;
  const categoryId = "11a3c5e7-9b2d-4f68-8a0c-2e4f6a8c0b1d";
  await admin.bookingOffering.find({ tenant_id: tenantId, ids: [offeringId, addOnOfferingId] });
  await admin.bookingOffering.findByService({ tenant_id: tenantId, booking_service_id: serviceId, limit: 100 });
  await admin.bookingOffering.findByResource({ tenant_id: tenantId, booking_resource_id: resourceId, cursor: "offerings:2" });
  await admin.bookingService.findAll({ tenant_id: tenantId, limit: 50 });
  await admin.bookingService.findByBlockTarget({ tenant_id: tenantId, block_target_id: taxCategoryId });
  await admin.bookingResource.findAll({ tenant_id: tenantId });
  await admin.bookingResource.findByCategory({ tenant_id: tenantId, category_id: categoryId, limit: 10, cursor: "resources:1" });
  await admin.bookingOffering.findAll({ tenant_id: tenantId, limit: 100, cursor: "offerings:3" });
  await admin.bookingOffering.findAll({ tenant_id: tenantId });
  assert.deepEqual(calls.map(({ method, url }) => [method, url.pathname, Object.fromEntries(url.searchParams)]), [
    ["GET", `/v1/tenants/${tenantId}/booking-offerings`, { ids: JSON.stringify([offeringId, addOnOfferingId]) }],
    ["GET", `/v1/tenants/${tenantId}/booking-offerings/by-service/${serviceId}`, { limit: "100" }],
    ["GET", `/v1/tenants/${tenantId}/booking-offerings/by-resource/${resourceId}`, { cursor: "offerings:2" }],
    ["GET", `/v1/tenants/${tenantId}/booking-services/all`, { limit: "50" }],
    ["GET", `/v1/tenants/${tenantId}/booking-services/by-block-target/${taxCategoryId}`, {}],
    ["GET", `/v1/tenants/${tenantId}/booking-resources/all`, {}],
    ["GET", `/v1/tenants/${tenantId}/booking-resources/by-category/${categoryId}`, { limit: "10", cursor: "resources:1" }],
    ["GET", `/v1/tenants/${tenantId}/booking-offerings/all`, { limit: "100", cursor: "offerings:3" }],
    ["GET", `/v1/tenants/${tenantId}/booking-offerings/all`, {}],
  ]);
  await assert.rejects(async () => admin.bookingOffering.findByService({ tenant_id: tenantId, booking_service_id: "service" }), TypeError);
  assert.equal(calls.length, 9);
});

test("a storefront reads several booking offerings, or several resources beside one offering, in one request under its package", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET" });
    return jsonResponse({ items: [], cursor: null });
  });
  const shop = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: ids.user, session_id: ids.session }, ...fixedIdFactories, apiUrl });
  assert.deepEqual(await shop.eshop.bookingOffering.findByIds({ ids: [offeringId], package_id: ids.package, include_price: true }), { items: [], cursor: null });
  await shop.eshop.bookingResource.findByIds({ ids: [resourceId], offering_id: offeringId, package_id: ids.package, company_id: ids.company });
  assert.deepEqual(calls.map(({ method, url }) => [method, url.pathname, Object.fromEntries(url.searchParams)]), [
    ["GET", "/v1/storefront/booking-offerings", { ids: JSON.stringify([offeringId]), package_id: ids.package, include_price: "true" }],
    ["GET", "/v1/storefront/booking-resources", { ids: JSON.stringify([resourceId]), offering_id: offeringId, package_id: ids.package, company_id: ids.company }],
  ]);
  assert.equal("find" in shop.eshop.bookingOffering, false);
  assert.equal("find" in shop.eshop.bookingResource, false);
});
