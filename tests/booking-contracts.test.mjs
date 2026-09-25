#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin, orderBookingItems } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const apiUrl = "https://api.booking-contract.test";
const storeId = "store-booking-contract";
const publishableKey = `arky_pk_${"b".repeat(42)}A`;
const visitorToken = `customer_visitor_${"b".repeat(64)}`;
const cancellationCommandId = "bef10d85-72e3-4853-9c12-8e419dc2d8dc";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sessionStorage() {
  const values = new Map([
    [
      "seed",
      JSON.stringify({
        version: 2,
        customer: {
          id: "customer-booking-contract",
          status: { type: "active" },
          primary_email_identity_id: null,
          default_shipping_address_id: null,
          default_billing_address_id: null,
          classifications: [],
          created_at: 1,
          updated_at: 1,
        },
        session: {
          id: "visitor-session-booking-contract",
          customer_id: "customer-booking-contract",
          type: "visitor",
          token: visitorToken,
          status: { type: "active" },
          expires_at: Date.now() + 3_600_000,
        },
      }),
    ],
  ]);
  return storefrontSessionStorage(values.get("seed"));
}

function bookingService() {
  return {
    id: "booking-service",
    key: "consultation",
    slugs: { en: "consultation" },
    store_id: storeId,
    blocks: [],
    classifications: [],
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
}

function bookingResource() {
  return {
    id: "booking-resource",
    key: "room-one",
    slugs: { en: "room-one" },
    store_id: storeId,
    blocks: [],
    classifications: [],
    timezone: "Europe/Sarajevo",
    capacity: 3,
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
  };
}

function bookingOffering() {
  return {
    id: "booking-offering",
    store_id: storeId,
    booking_service_id: "booking-service",
    booking_resource_id: "booking-resource",
    weekly_availability: [
      {
        weekday: "monday",
        windows: [{ from_minute: 540, to_minute: 1020 }],
      },
    ],
    date_overrides: [{ local_date: "2026-08-24", windows: [] }],
    durations: [{ minutes: 60, is_pause: false }],
    slot_interval_minutes: 30,
    booking_window: {
      opens_before_start_minutes: 43_200,
      closes_before_start_minutes: 120,
    },
    reminder_offsets_minutes: [1440, 60],
    service_location_id: "service-location",
    tax_category_id: null,
    status: { type: "active" },
    price: { amount: 5000, currency: "eur", tax_mode: "exclusive" },
    purchase_allowed: true,
    created_at: 1,
    updated_at: 1,
  };
}

function embeddedBookingItem() {
  return {
    id: "order-booking-item",
    booking_offering_id: "booking-offering",
    booking_service_id: "booking-service",
    booking_resource_id: "booking-resource",
    interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
    capacity_intervals: [{ from: 1_800_000_000_000, to: 1_800_003_600_000 }],
    capacity_units: 1,
    form_submission_id: "form-submission",
    form_submission: null,
    snapshot: {
      service_key: "consultation",
      resource_key: "room-one",
      timezone: "Europe/Sarajevo",
      source_service_id: "booking-service",
      source_resource_id: "booking-resource",
      source_offering_id: "booking-offering",
      price: {
        unit_price: { amount: 5000, currency: "eur" },
        compare_at: null, tax_mode: "exclusive", min_quantity: 1, max_quantity: null,
        source: { type: "base", price_id: "booking-price" }, priced_at: 1,
      },
    },
    status: { type: "confirmed" },
    money: {
      unit_price: 5000,
      subtotal: 5000,
      discount_allocations: [],
      discount_total: 0,
      tax_lines: [],
      tax_total: 0,
      duty_lines: [],
      duty_total: 0,
      tax_assessment: {
        type: "assessed", assessment: {
          tax_mode: "exclusive", treatment: { type: "not_collecting", reason_code: "not_registered" },
          address_basis: { type: "billing" }, address: { country: "BA", street1: "1 Booking Street", city: "Sarajevo", postal_code: "71000" },
          location_evidence: [], source: { type: "arky_rule", market_zone_id: "market-zone", tax_rule_id: "tax-rule", tax_category_id: null, tax_category_key: null },
          policy_version: "fixture", rounding_version: "fixture", assessed_at: 1, tax_date: 1, buyer_evidence: null,
        },
      },
      total: 5000,
    },
    created_at: 1,
    updated_at: 2,
  };
}

function order() {
  return {
    id: "order-booking",
    number: "1001",
    store_id: storeId,
    source: { type: "direct", request_id: "request-booking" },
    customer_id: "customer-booking",
    customer_snapshot: {
      email: null,
      authentication: { type: "visitor" },
      source_customer_id: "customer-booking",
      source_email_identity_id: null,
    },
    company: null,
    payment_terms: null,
    purchase_order_number: null,
    market_id: "market-bih",
    market_snapshot: {
      key: "bih",
      currency: "eur",
      tax_mode: "exclusive",
      source_market_id: "market-bih",
    },
    sales_channel_id: "channel-booking",
    sales_channel_snapshot: {
      key: "web",
      name: "Web",
      source_sales_channel_id: "channel-booking",
    },
    origin: {
      type: "storefront",
      customer_id: "customer-booking",
      customer_session_id: "customer-session-booking",
      authentication: { type: "visitor" },
    },
    status: { type: "confirmed" },
    line_items: [{ type: "booking", ...embeddedBookingItem() }],
    money: {
      currency: "eur",
      subtotal: 5000,
      delivery: 0,
      discount: 0,
      tax_total: 0,
      duty_total: 0,
      total: 5000,
      promotions: [],
    },
    delivery_groups: [],
    billing_address: null,
    created_at: 1,
    updated_at: 2,
    accepted_at: 1,
    seller: {
      profile: { legal_name: "Booking Seller", registration_number: null, tax_registrations: [], address: { country: "BA" } },
      configuration_digest: "a".repeat(64),
    },
    invoice_policy: { type: "external" },
    renewal_recovery: null,
    reconciliation: { type: "clear" },
    collection_policy: { type: "prepaid", due_at: 1 },
    promotion_redemptions: [],
    payment_authorization: {
      allowed_provider_ids: [],
      actor: {
        type: "storefront",
        customer_id: "customer-booking",
        customer_session_id: "customer-session-booking",
        authentication: { type: "visitor" },
      },
      accepted_at: 1,
    },
  };
}

function cart(bookingItems = []) {
  return {
    id: "cart-booking",
    store_id: storeId,
    customer_id: "customer-booking-contract",
    company: null,
    sales_channel_id: "channel-booking",
    status: { type: "active" },
    origin: {
      type: "storefront",
      customer_id: "customer-booking-contract",
      customer_session_id: "visitor-session-booking-contract",
    },
    market_id: "market-bih",
    line_items: bookingItems.map((item) => ({
      type: "booking",
      id: item.id ?? "cart-booking-item",
      booking_offering_id: item.booking_offering_id,
      requested_interval: item.requested_interval,
      capacity_units: item.capacity_units ?? 1,
      form_submission_id: item.form_submission_id ?? null,
      price_override: item.price_override ?? null,
    })),
    delivery_groups: [],
    billing_address: null,
    promotion_code_ids: [],
    purchase_order_number: null,
    item_count: bookingItems.length,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 1,
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
  const admin = createAdmin({ baseUrl: apiUrl, storeId, apiToken: "token" });
  const storefront = createStorefront(publishableKey, { apiUrl, sessionStorage: sessionStorage() });
  const filters = {
    booking_service_id: "booking-service", query: "room", status: "active", limit: 1,
    sort_field: "key", sort_direction: "desc", created_at_from: 0, created_at_to: 10,
  };
  for (const client of [admin, storefront]) {
    const first = await client.eshop.bookingResource.find(filters);
    assert.deepEqual(first, { items: [], cursor });
    const second = await client.eshop.bookingResource.find({ ...filters, cursor: first.cursor });
    assert.deepEqual(second, { items: [bookingResource()], cursor: null });
  }
  assert.equal(calls.length, 4);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/booking-resources`);
  assert.equal(calls[2].url.pathname, "/v1/storefront/booking-resources");
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    for (const [key, value] of Object.entries(filters)) assert.equal(call.url.searchParams.get(key), String(value));
    for (const removed of ["from", "to", "match_all"]) assert.equal(call.url.searchParams.has(removed), false);
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), cursor);
  assert.equal(calls[3].url.searchParams.get("cursor"), cursor);
});

test("Admin booking runtime uses booking service, resource, and offering roots", async () => {
  const admin = createAdmin({ baseUrl: apiUrl, storeId, apiToken: "token" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(call);
    const pathname = new URL(call.url).pathname;
    if (pathname.endsWith("/booking-services"))
      return jsonResponse(bookingService());
    if (pathname.endsWith("/booking-resources"))
      return jsonResponse(bookingResource());
    if (pathname.endsWith("/booking-offerings"))
      return jsonResponse(bookingOffering());
    if (pathname.includes("/booking-items/")) return jsonResponse(order());
    if (pathname.endsWith("/orders/order-booking"))
      return call.method === "PUT"
        ? jsonResponse({ message: "Unknown field booking_items" }, 422)
        : jsonResponse(order());
    throw new Error(`Unexpected request ${call.method} ${call.url}`);
  };

  try {
    await admin.eshop.bookingService.create({
      key: "consultation",
      slugs: { en: "consultation" },
      status: { type: "active" },
    });
    await admin.eshop.bookingResource.create({
      key: "room-one",
      slugs: { en: "room-one" },
      timezone: "Europe/Sarajevo",
      capacity: 3,
      status: { type: "active" },
    });
    await admin.eshop.bookingOffering.create({
      booking_service_id: "booking-service",
      booking_resource_id: "booking-resource",
      weekly_availability: bookingOffering().weekly_availability,
      date_overrides: bookingOffering().date_overrides,
      durations: bookingOffering().durations,
      slot_interval_minutes: 30,
      booking_window: bookingOffering().booking_window,
      reminder_offsets_minutes: [1440, 60],
      service_location_id: "service-location",
      tax_category_id: null,
      status: { type: "active" },
    });
    const loadedOrder = await admin.eshop.order.get({ id: "order-booking" });
    assert.equal(orderBookingItems(loadedOrder)[0].id, "order-booking-item");
    await assert.rejects(
      admin.eshop.order.update({
        id: loadedOrder.id,
        booking_items: [{ id: "legacy-booking-rewrite" }],
      }),
      (error) => error.statusCode === 422,
    );
    await admin.eshop.order.cancelBookingItem({
      command_id: cancellationCommandId,
      order_id: loadedOrder.id,
      order_booking_item_id: orderBookingItems(loadedOrder)[0].id,
    });
    await admin.eshop.order.completeBookingItem({
      order_id: loadedOrder.id,
      order_booking_item_id: orderBookingItems(loadedOrder)[0].id,
    });
    await admin.eshop.order.markBookingItemNoShow({
      order_id: loadedOrder.id,
      order_booking_item_id: orderBookingItems(loadedOrder)[0].id,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("service" in admin.eshop, false);
  assert.equal("provider" in admin.eshop, false);
  assert.equal("getBookings" in admin.eshop.order, false);
  assert.deepEqual(
    calls.map((call) => [new URL(call.url).pathname, call.method]),
    [
      [`/v1/stores/${storeId}/booking-services`, "POST"],
      [`/v1/stores/${storeId}/booking-resources`, "POST"],
      [`/v1/stores/${storeId}/booking-offerings`, "POST"],
      [`/v1/stores/${storeId}/orders/order-booking`, "GET"],
      [`/v1/stores/${storeId}/orders/order-booking`, "PUT"],
      [
        `/v1/stores/${storeId}/orders/order-booking/booking-items/order-booking-item/cancel`,
        "POST",
      ],
      [
        `/v1/stores/${storeId}/orders/order-booking/booking-items/order-booking-item/complete`,
        "POST",
      ],
      [
        `/v1/stores/${storeId}/orders/order-booking/booking-items/order-booking-item/no-show`,
        "POST",
      ],
    ],
  );
  assert.deepEqual(calls[0].body, {
    key: "consultation",
    slugs: { en: "consultation" },
    status: { type: "active" },
  });
  assert.deepEqual(calls[1].body, {
    key: "room-one",
    slugs: { en: "room-one" },
    timezone: "Europe/Sarajevo",
    capacity: 3,
    status: { type: "active" },
  });
  assert.equal("forms" in calls[2].body, false);
  assert.equal("prices" in calls[2].body, false);
  assert.equal(calls[2].body.service_location_id, "service-location");
  assert.equal(calls[2].body.tax_category_id, null);
  assert.equal(calls[2].body.slot_interval_minutes, 30);
  assert.deepEqual(calls[2].body.reminder_offsets_minutes, [1440, 60]);
  assert.deepEqual(calls[4].body, {
    booking_items: [{ id: "legacy-booking-rewrite" }],
  });
  assert.deepEqual(calls[5].body, { command_id: cancellationCommandId });
  assert.deepEqual(calls[6].body, {});
  assert.deepEqual(calls[7].body, {});
});

test("storefront booking runtime sends one offering interval and reads embedded Order items", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    market: "bih",
    sessionStorage: sessionStorage(),
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(call);
    const pathname = new URL(call.url).pathname;
    if (pathname.endsWith("/booking-services"))
      return jsonResponse({ items: [bookingService()], cursor: null });
    if (pathname.endsWith("/booking-resources"))
      return jsonResponse({ items: [bookingResource()], cursor: null });
    if (pathname.endsWith("/booking-offerings"))
      return jsonResponse({ items: [bookingOffering()], cursor: null });
    if (pathname.endsWith("/booking-services/availability"))
      return jsonResponse({
        from: 1_800_000_000_000,
        to: 1_800_086_400_000,
        cursor: null,
        booking_resources: [
          {
            booking_offering_id: "booking-offering",
            booking_resource_id: "booking-resource",
            resource_key: "room-one",
            timezone: "Europe/Sarajevo",
            days: [],
          },
        ],
      });
    if (pathname.endsWith("/carts/cart-booking/booking-items"))
      return jsonResponse(cart([call.body.booking]));
    if (pathname.endsWith("/orders/order-booking/booking-items/order-booking-item/cancel"))
      return jsonResponse(order());
    if (pathname.endsWith("/orders/order-booking"))
      return jsonResponse(order());
    throw new Error(`Unexpected request ${call.method} ${call.url}`);
  };

  try {
    await storefront.eshop.bookingService.find({ sort_field: "price", include_price: true });
    await storefront.eshop.bookingResource.find({
      booking_service_id: "booking-service",
    });
    await storefront.eshop.bookingOffering.find({
      booking_service_id: "booking-service",
    });
    await storefront.eshop.bookingService.getAvailability({
      booking_service_id: "booking-service",
      booking_resource_id: "booking-resource",
      from: 1_800_000_000_000,
      to: 1_800_086_400_000,
    });
    await storefront.eshop.cart.addBooking({
      id: "cart-booking",
      booking: {
        booking_offering_id: "booking-offering",
        requested_interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
        capacity_units: 1,
        form_submission_id: "form-submission",
        price_override: { amount: 1, currency: "eur", market: "bih" },
      },
    });
    const loadedOrder = await storefront.eshop.order.get({
      id: "order-booking",
    });
    assert.equal(
      orderBookingItems(loadedOrder)[0].booking_resource_id,
      "booking-resource",
    );
    await storefront.eshop.order.cancelBookingItem({
      command_id: cancellationCommandId,
      order_id: loadedOrder.id,
      order_booking_item_id: orderBookingItems(loadedOrder)[0].id,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("service" in storefront.eshop, false);
  assert.equal("provider" in storefront.eshop, false);
  assert.equal("getBookings" in storefront.eshop.order, false);
  assert.deepEqual(calls[4].body, {
    booking: {
      booking_offering_id: "booking-offering",
      requested_interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
      capacity_units: 1,
      form_submission_id: "form-submission",
    },
  });
  assert.equal(
    new URL(calls[4].url).pathname,
    "/v1/storefront/carts/cart-booking/booking-items",
  );
  assert.equal("price_override" in calls[4].body.booking, false);
  assert.deepEqual(calls[6].body, { command_id: cancellationCommandId });
  assert.equal(
    new URL(calls[6].url).pathname,
    "/v1/storefront/orders/order-booking/booking-items/order-booking-item/cancel",
  );
});

test("Admin reads the independent appointment by its exact Order line without discovery", async () => {
  const admin = createAdmin({ baseUrl: apiUrl, storeId, apiToken: "token" });
  const originalFetch = globalThis.fetch;
  const calls = [];
  const appointment = {
    id: "appointment",
    store_id: "store/selected",
    order_id: "order/accepted",
    order_booking_line_item_id: "line/accepted",
    booking_resource_id: null,
    source_booking_resource_id: "historical-resource",
    interval: { from: 1_800_000_000_000, to: 1_800_003_600_000 },
    status: { type: "completed" },
    reminders: [{ offset_minutes: 60, due_at: 1_799_996_400_000, emitted_at: null }],
    created_at: 1_799_000_000_000,
    updated_at: 1_800_003_600_001,
  };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return jsonResponse(appointment);
  };
  try {
    assert.deepEqual(await admin.eshop.order.getBookingAppointment({
      store_id: appointment.store_id,
      order_id: appointment.order_id,
      order_booking_item_id: appointment.order_booking_line_item_id,
    }), appointment);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[0].url.search, "");
  assert.equal(calls[0].url.pathname, "/v1/stores/store%2Fselected/orders/order%2Faccepted/booking-items/line%2Faccepted/appointment");
});

test("booking cancellation preserves the caller command after an uncertain response", async () => {
  const admin = createAdmin({ baseUrl: apiUrl, storeId, apiToken: "token" });
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    market: "bih",
    sessionStorage: sessionStorage(),
  });
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    if (calls.length % 2 === 1) return jsonResponse({ message: "Response unavailable" }, 503);
    return jsonResponse(order());
  };
  try {
    for (const client of [admin, storefront]) {
      const request = {
        command_id: cancellationCommandId,
        order_id: "order/booking",
        order_booking_item_id: "item/booking",
      };
      await assert.rejects(client.eshop.order.cancelBookingItem(request), (error) => error.statusCode === 503);
      assert.equal((await client.eshop.order.cancelBookingItem(request)).id, order().id);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.equal(call.method, "POST");
    assert.deepEqual(call.body, { command_id: cancellationCommandId });
    assert.ok(call.url.pathname.endsWith("/orders/order%2Fbooking/booking-items/item%2Fbooking/cancel"));
  }
  assert.equal(calls[0].url.href, calls[1].url.href);
  assert.equal(calls[2].url.href, calls[3].url.href);
});

test("Booking Service slug lookup stays singular while records expose slugs", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    market: "bih",
    sessionStorage: sessionStorage(),
  });
  const originalFetch = globalThis.fetch;
  let call;
  globalThis.fetch = async (url, init = {}) => {
    call = { url: String(url), method: init.method || "GET" };
    return jsonResponse(bookingService());
  };

  try {
    const service = await storefront.eshop.bookingService.get({
      slug: "consultation",
      company_id: "company-context",
      company_location_id: "branch-context",
      include_price: true,
    });
    assert.equal(service.slugs.en, "consultation");
    assert.equal("slug" in service, false);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    new URL(call.url).pathname,
    "/v1/storefront/booking-services/consultation",
  );
  assert.equal(new URL(call.url).searchParams.get("company_id"), "company-context");
  assert.equal(new URL(call.url).searchParams.get("company_location_id"), "branch-context");
  assert.equal(new URL(call.url).searchParams.get("include_price"), "true");
  assert.equal(call.method, "GET");
});

test("booking discovery forwards the Resource filter, catalog pricing and protected cursor", async () => {
  const storefront = createStorefront(publishableKey, { apiUrl, market: "bih", sessionStorage: sessionStorage() });
  const originalFetch = globalThis.fetch;
  let called;
  globalThis.fetch = async (url) => {
    called = new URL(url);
    return jsonResponse({ items: [], cursor: "next-page" });
  };
  const params = { query: "čas gitare", booking_resource_id: "resource", price_filter: { min_amount: 0, max_amount: 800, quantity: 1 }, sort_field: "price", sort_direction: "asc", limit: 10, cursor: "previous-page", include_price: true };
  try {
    assert.deepEqual(await storefront.eshop.bookingService.find(params), { items: [], cursor: "next-page" });
  } finally { globalThis.fetch = originalFetch; }
  assert.equal(called.pathname, "/v1/storefront/booking-services");
  assert.equal(called.searchParams.get("booking_resource_id"), "resource");
  assert.equal(called.searchParams.get("query"), params.query);
  assert.equal(called.searchParams.get("sort_field"), "price");
  assert.equal(called.searchParams.get("cursor"), "previous-page");
  assert.deepEqual(JSON.parse(called.searchParams.get("price_filter")), params.price_filter);
  assert.equal(called.searchParams.has("status"), false);
});

test("high-level booking flow creates one Cart item per appointment", async () => {
  const store = initialize(publishableKey, {
    apiUrl,
    market: "bih",
    sessionStorage: sessionStorage(),
  });
  const calls = [];
  const calendarDate = new Date();
  const availableLocalDate = `${calendarDate.getFullYear()}-${String(
    calendarDate.getMonth() + 1,
  ).padStart(2, "0")}-01`;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      method: init.method || "GET",
      body: init.body ? JSON.parse(String(init.body)) : null,
    };
    calls.push(call);
    const pathname = new URL(call.url).pathname;
    if (pathname.endsWith("/booking-services/booking-service"))
      return jsonResponse(bookingService());
    if (pathname.endsWith("/booking-offerings"))
      return jsonResponse({ items: [bookingOffering()], cursor: null });
    if (pathname.endsWith("/booking-resources"))
      return jsonResponse({ items: [bookingResource()], cursor: null });
    if (pathname.endsWith("/booking-services/availability"))
      return jsonResponse({
        from: Number(new URL(call.url).searchParams.get("from")),
        to: Number(new URL(call.url).searchParams.get("to")),
        cursor: null,
        booking_resources: [
          {
            booking_offering_id: "booking-offering",
            booking_resource_id: "booking-resource",
            resource_key: "room-one",
            timezone: "Europe/Sarajevo",
            days: [
              {
                date: availableLocalDate,
                slots: [
                  { from: 1_800_000_000_000, to: 1_800_003_600_000, spots: 2 },
                  { from: 1_800_003_600_000, to: 1_800_007_200_000, spots: 0 },
                ],
              },
            ],
          },
        ],
      });
    if (pathname.endsWith("/carts")) return jsonResponse({ cart: cart(), recovery_token: "cart-recovery-token" });
    if (pathname.endsWith("/carts/cart-booking"))
      return jsonResponse(
        cart(
          (call.body.line_items || [])
            .filter((item) => item.type === "booking")
            .map(({ type, ...item }) => item),
        ),
      );
    if (pathname === "/v1/storefront")
      return jsonResponse({
        timezone: "Europe/Sarajevo",
        languages: { default: "en", available: ["en"] },
        commerce: { type: "ready", default_market_id: "market-bih", default_sales_channel_id: "channel-bih" },
        default_market: {
              id: "market-bih",
              key: "bih",
              currency: "eur",
              tax_mode: "inclusive",
              payment_provider_ids: [],
        },
        payment_providers: [],
        support: { email: "support@example.test" },
        readiness: { market: true, payment: false, commerce: true },
      });
    throw new Error(`Unexpected request ${call.method} ${call.url}`);
  };

  const slot = {
    id: "slot-one",
    bookingServiceId: "booking-service",
    bookingResourceId: "booking-resource",
    bookingOfferingId: "booking-offering",
    from: 1_800_000_000_000,
    to: 1_800_003_600_000,
    timeText: "10:00 - 11:00",
    dateText: "Monday, January 15",
  };
  try {
    await store.eshop.bookingService.select(bookingService());
    const availableDay = store.eshop.bookingService.state
      .get()
      .calendar.find((day) => day.iso === availableLocalDate);
    assert.equal(availableDay?.available, true);
    store.eshop.bookingService.selectDate(availableDay);
    const rendered = store.eshop.bookingService.state.get().slots[0];
    const timezone = store.eshop.bookingService.state.get().timezone;
    assert.equal(rendered.from, slot.from);
    assert.equal(rendered.dateText, new Date(slot.from).toLocaleDateString([], {
      weekday: "short", month: "short", day: "numeric", timeZone: timezone,
    }));
    assert.equal(rendered.timeText, [slot.from, slot.to].map((value) => new Date(value).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", timeZone: timezone,
    })).join(" - "));
    assert.deepEqual(
      store.eshop.bookingService.state.get().slots.map((candidate) => ({
        bookingOfferingId: candidate.bookingOfferingId,
        bookingResourceId: candidate.bookingResourceId,
      })),
      [
        {
          bookingOfferingId: "booking-offering",
          bookingResourceId: "booking-resource",
        },
      ],
    );
    const items = store.eshop.bookingService.bookingItemsFromSlots([
      slot,
      { ...slot, id: "slot-two", from: slot.to, to: slot.to + 3_600_000 },
    ]);
    assert.equal(items.length, 2);
    assert.deepEqual(items[0].requested_interval, {
      from: slot.from,
      to: slot.to,
    });
    await store.eshop.bookingService.addToCart(
      [slot],
      "form-submission",
    );
    await store.eshop.bookingService.loadMonth();
  } finally {
    globalThis.fetch = originalFetch;
  }

  const availabilityCalls = calls.filter((call) => new URL(call.url).pathname.endsWith("/booking-services/availability"));
  const firstBounds = new URL(availabilityCalls[0].url).searchParams;
  assert.equal(Number(firstBounds.get("from")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth(), 1));
  assert.equal(Number(firstBounds.get("to")), Date.UTC(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  const chainedBounds = new URL(availabilityCalls.at(-1).url).searchParams;
  assert.equal(Number(chainedBounds.get("from")), slot.to);
  assert.equal(Number(chainedBounds.get("to")), slot.to + 31 * 24 * 60 * 60 * 1_000);

  const update = calls.find(
    (call) =>
      call.method === "PUT" &&
      new URL(call.url).pathname.endsWith("/carts/cart-booking"),
  );
  assert.ok(update);
  const bookingLines = update.body.line_items.filter((item) => item.type === "booking");
  assert.equal(bookingLines.length, 1);
  assert.deepEqual(
    {
      ...bookingLines[0],
      id: "generated",
    },
    {
      type: "booking",
      id: "generated",
      booking_offering_id: "booking-offering",
      requested_interval: { from: slot.from, to: slot.to },
      capacity_units: 1,
      form_submission_id: "form-submission",
    },
  );
  assert.equal("form_state" in store.eshop.bookingService, false);
});

test("booking selection retains Company context and explicitly follows Offering and availability pages", async () => {
  const store = initialize(publishableKey, { apiUrl, market: "bih", sessionStorage: sessionStorage() });
  const originalFetch = globalThis.fetch;
  const offeringCalls = [];
  const resourceCalls = [];
  const availabilityCalls = [];
  let repeatAvailabilityCursor = false;
  const laterOffering = { ...bookingOffering(), id: "offering-later", booking_resource_id: "resource-later" };
  const laterResource = { ...bookingResource(), id: "resource-later" };
  globalThis.fetch = async (url) => {
    const request = new URL(String(url));
    if (!request.pathname.endsWith("/booking-resources")) {
      assert.equal(request.searchParams.get("company_id"), "company-one");
      assert.equal(request.searchParams.get("company_location_id"), "branch-one");
    }
    if (request.pathname.endsWith("/booking-services/booking-service")) return jsonResponse(bookingService());
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
      const ids = JSON.parse(request.searchParams.get("ids"));
      assert.equal(ids.length, 1, "resources must be loaded only for this bounded Offering page");
      return jsonResponse({ items: [ids[0] === "resource-later" ? laterResource : bookingResource()], cursor: null });
    }
    if (request.pathname.endsWith("/booking-services/availability")) {
      availabilityCalls.push(request);
      assert.equal(request.searchParams.get("limit"), "20");
      assert.equal(request.searchParams.has("include_price"), false);
      return jsonResponse({
        from: Number(request.searchParams.get("from")), to: Number(request.searchParams.get("to")),
        booking_resources: [{ booking_offering_id: request.searchParams.has("cursor") ? laterOffering.id : "booking-offering", booking_resource_id: request.searchParams.has("cursor") ? "resource-later" : "booking-resource", resource_key: "room", timezone: "Europe/Sarajevo", days: [] }],
        cursor: request.searchParams.has("cursor") && !repeatAvailabilityCursor ? null : "availability-next",
      });
    }
    throw new Error(`Unexpected request ${url}`);
  };
  try {
    await store.eshop.bookingService.select(bookingService(), { company_id: "company-one", company_location_id: "branch-one" });
    assert.equal(offeringCalls.length, 1);
    assert.equal(availabilityCalls.length, 1, "availability must not eagerly follow continuations");
    assert.equal(store.eshop.bookingService.state.get().availability.cursor, "availability-next");
    assert.equal(store.eshop.bookingService.state.get().bookingOfferingsCursor, "offering-next");
    await store.eshop.bookingService.loadMoreOfferings();
    const state = store.eshop.bookingService.state.get();
    assert.equal(offeringCalls.length, 2);
    assert.equal(offeringCalls[1].searchParams.get("cursor"), "offering-next");
    assert.deepEqual(state.bookingOfferings.map((row) => row.id), ["booking-offering", "offering-later"]);
    assert.deepEqual(state.bookingResources.map((row) => row.id), ["booking-resource", "resource-later"]);
    assert.equal(state.bookingOfferingsCursor, null);
    assert.equal(state.loadingOfferings, false);
    await store.eshop.bookingService.loadMoreOfferings();
    assert.equal(offeringCalls.length, 2, "an exhausted list makes no further request");
    assert.equal(resourceCalls.length, 2);
    repeatAvailabilityCursor = true;
    await assert.rejects(store.eshop.bookingService.loadMoreAvailability(), /did not advance/);
    assert.equal(store.eshop.bookingService.state.get().availability.cursor, "availability-next");
    assert.equal(store.eshop.bookingService.state.get().availability.booking_resources.length, 1);
    assert.equal(store.eshop.bookingService.state.get().loading, false);
    repeatAvailabilityCursor = false;
    await store.eshop.bookingService.loadMoreAvailability();
    assert.equal(availabilityCalls.length, 3);
    assert.equal(availabilityCalls[1].searchParams.get("cursor"), "availability-next");
    assert.equal(availabilityCalls[1].searchParams.get("from"), availabilityCalls[0].searchParams.get("from"));
    assert.deepEqual(store.eshop.bookingService.state.get().availability.booking_resources.map((row) => row.booking_resource_id), ["booking-resource", "resource-later"]);
    assert.equal(store.eshop.bookingService.state.get().availability.cursor, null);
    await store.eshop.bookingService.loadMoreAvailability();
    assert.equal(availabilityCalls.length, 3);
  } finally { globalThis.fetch = originalFetch; }
});

test("late availability cannot replace a newer Service selection or its shared read state", async () => {
  const store = initialize(publishableKey, { apiUrl, market: "bih", sessionStorage: sessionStorage() });
  const originalFetch = globalThis.fetch;
  let announcePending;
  let releaseOld;
  const pending = new Promise((resolve) => { announcePending = resolve; });
  globalThis.fetch = async (url) => {
    const request = new URL(String(url));
    if (request.pathname.endsWith("/booking-services/availability")) {
      const serviceId = request.searchParams.get("booking_service_id");
      const response = {
        from: Number(request.searchParams.get("from")),
        to: Number(request.searchParams.get("to")),
        cursor: null,
        booking_resources: [{ booking_offering_id: `offering-${serviceId}`, booking_resource_id: serviceId, resource_key: serviceId, timezone: "Europe/Sarajevo", days: [] }],
      };
      if (serviceId === "booking-service") {
        announcePending();
        return new Promise((resolve) => { releaseOld = () => resolve(jsonResponse(response)); });
      }
      return jsonResponse(response);
    }
    if (request.pathname.endsWith("/booking-offerings")) return jsonResponse({ items: [], cursor: null });
    if (request.pathname.includes("/booking-services/")) return jsonResponse({
      ...bookingService(), id: request.pathname.split("/").at(-1),
    });
    throw new Error(`Unexpected request ${url}`);
  };
  try {
    const first = store.eshop.bookingService.select(bookingService());
    await pending;
    await store.eshop.bookingService.select({ ...bookingService(), id: "service-new" });
    releaseOld();
    await first;
    const state = store.eshop.bookingService.state.get();
    assert.equal(state.bookingService.id, "service-new");
    assert.equal(state.availability.booking_resources[0].booking_resource_id, "service-new");
    assert.equal(state.loading, false);
    assert.equal(store.eshop.state.get().availability.booking_resources[0].booking_resource_id, "service-new");
    assert.equal(store.eshop.state.get().loading_availability, false);
  } finally {
    releaseOld?.();
    globalThis.fetch = originalFetch;
  }
});
