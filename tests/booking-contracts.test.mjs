#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";

const apiUrl = "https://api.booking-contract.test";
const storeId = "store-booking-contract";
const publishableKey = `arky_pk_${"b".repeat(42)}A`;
const visitorToken = `customer_visitor_${"b".repeat(64)}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sessionStorage() {
  const values = new Map([["seed", visitorToken]]);
  return {
    getItem: () => values.get("seed") ?? null,
    setItem: (_key, value) => values.set("seed", value),
    removeItem: () => values.delete("seed"),
  };
}

function bookingService() {
  return {
    id: "booking-service",
    key: "consultation",
    slugs: { en: "consultation" },
    store_id: storeId,
    blocks: [],
    classifications: [],
    status: "active",
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
    status: "active",
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
    prices: [{ amount: 5000, currency: "eur", market: "bih" }],
    durations: [{ minutes: 60, is_pause: false }],
    slot_interval_minutes: 30,
    booking_window: {
      opens_before_start_minutes: 43_200,
      closes_before_start_minutes: 120,
    },
    reminder_offsets_minutes: [1440, 60],
    status: "active",
    created_at: 1,
    updated_at: 1,
  };
}

function embeddedBookingItem() {
  return {
    id: "order-booking-item",
    customer_session_id: null,
    booking_offering_id: "booking-offering",
    booking_service_id: "booking-service",
    booking_resource_id: "booking-resource",
    interval: { from: 1_800_000_000, to: 1_800_003_600 },
    capacity_intervals: [{ from: 1_800_000_000, to: 1_800_003_600 }],
    form_submission_id: "form-submission",
    reminders: [
      { offset_minutes: 60, due_at: 1_799_996_400, emitted_at: null },
    ],
    snapshot: {
      service_key: "consultation",
      resource_key: "room-one",
      timezone: "Europe/Sarajevo",
      price: { amount: 5000, currency: "eur", market: "bih" },
    },
    status: { status: "confirmed" },
    money: {
      unit_price: 5000,
      subtotal: 5000,
      discount_allocations: [],
      discount_total: 0,
      taxable_base: 5000,
      tax_lines: [],
      tax_total: 0,
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
    source_cart_id: "cart-booking",
    customer_id: "customer-booking",
    customer_session_id: "customer-session-booking",
    status: "confirmed",
    payment_id: "payment-booking",
    product_items: [],
    booking_items: [embeddedBookingItem()],
    digital_items: [],
    money: {
      currency: "eur",
      market: "bih",
      subtotal: 5000,
      shipping: 0,
      discount: 0,
      tax_total: 0,
      total: 5000,
      promo_code: null,
      zone_id: null,
      shipping_method_id: null,
    },
    shipping_lines: [],
    shipping_address: null,
    billing_address: null,
    created_at: 1,
    updated_at: 2,
  };
}

function cart(bookingItems = []) {
  return {
    id: "cart-booking",
    customer_id: "customer-booking",
    customer_session_id: "customer-session-booking",
    token: "cart-token",
    status: "active",
    origin: "storefront",
    created_by_account_id: null,
    market: "bih",
    product_items: [],
    booking_items: bookingItems.map((item) => ({
      ...item,
      form_submission_id: item.form_submission_id ?? null,
      price_override: item.price_override ?? null,
    })),
    digital_items: [],
    shipping_address: null,
    billing_address: null,
    promo_code: null,
    payment_provider_id: null,
    shipping_method_id: null,
    converted_order_id: null,
    item_count: bookingItems.length,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 1,
  };
}

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
      return jsonResponse(order());
    throw new Error(`Unexpected request ${call.method} ${call.url}`);
  };

  try {
    await admin.eshop.bookingService.create({
      key: "consultation",
      slugs: { en: "consultation" },
      status: "active",
    });
    await admin.eshop.bookingResource.create({
      key: "room-one",
      slugs: { en: "room-one" },
      timezone: "Europe/Sarajevo",
      capacity: 3,
      status: "active",
    });
    await admin.eshop.bookingOffering.create({
      booking_service_id: "booking-service",
      booking_resource_id: "booking-resource",
      weekly_availability: bookingOffering().weekly_availability,
      date_overrides: bookingOffering().date_overrides,
      prices: bookingOffering().prices,
      durations: bookingOffering().durations,
      slot_interval_minutes: 30,
      booking_window: bookingOffering().booking_window,
      reminder_offsets_minutes: [1440, 60],
      status: "active",
    });
    const loadedOrder = await admin.eshop.order.get({ id: "order-booking" });
    assert.equal(loadedOrder.booking_items[0].id, "order-booking-item");
    await admin.eshop.order.update({
      id: loadedOrder.id,
      booking_items: [{ id: "legacy-booking-rewrite" }],
    });
    await admin.eshop.order.cancelBookingItem({
      order_id: loadedOrder.id,
      order_booking_item_id: loadedOrder.booking_items[0].id,
    });
    await admin.eshop.order.completeBookingItem({
      order_id: loadedOrder.id,
      order_booking_item_id: loadedOrder.booking_items[0].id,
    });
    await admin.eshop.order.markBookingItemNoShow({
      order_id: loadedOrder.id,
      order_booking_item_id: loadedOrder.booking_items[0].id,
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
    status: "active",
  });
  assert.deepEqual(calls[1].body, {
    key: "room-one",
    slugs: { en: "room-one" },
    timezone: "Europe/Sarajevo",
    capacity: 3,
    status: "active",
  });
  assert.equal("forms" in calls[2].body, false);
  assert.equal(calls[2].body.slot_interval_minutes, 30);
  assert.deepEqual(calls[2].body.reminder_offsets_minutes, [1440, 60]);
  assert.deepEqual(calls[4].body, {});
  assert.deepEqual(calls[5].body, {});
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
      return jsonResponse([bookingOffering()]);
    if (pathname.endsWith("/booking-services/availability"))
      return jsonResponse({
        from: 1_800_000_000,
        to: 1_800_086_400,
        booking_resources: [
          {
            booking_resource_id: "booking-resource",
            resource_key: "room-one",
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
    await storefront.eshop.bookingService.find({ status: "active" });
    await storefront.eshop.bookingResource.find({
      booking_service_id: "booking-service",
    });
    await storefront.eshop.bookingOffering.find({
      booking_service_id: "booking-service",
    });
    await storefront.eshop.bookingService.getAvailability({
      booking_service_id: "booking-service",
      booking_resource_id: "booking-resource",
      from: 1_800_000_000,
      to: 1_800_086_400,
    });
    await storefront.eshop.cart.addBooking({
      id: "cart-booking",
      booking: {
        booking_offering_id: "booking-offering",
        requested_interval: { from: 1_800_000_000, to: 1_800_003_600 },
        form_submission_id: "form-submission",
        price_override: { amount: 1, currency: "eur", market: "bih" },
      },
    });
    const loadedOrder = await storefront.eshop.order.get({
      id: "order-booking",
    });
    assert.equal(
      loadedOrder.booking_items[0].booking_resource_id,
      "booking-resource",
    );
    await storefront.eshop.order.cancelBookingItem({
      order_id: loadedOrder.id,
      order_booking_item_id: loadedOrder.booking_items[0].id,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("service" in storefront.eshop, false);
  assert.equal("provider" in storefront.eshop, false);
  assert.equal("getBookings" in storefront.eshop.order, false);
  assert.deepEqual(calls[4].body, {
    id: "cart-booking",
    booking: {
      booking_offering_id: "booking-offering",
      requested_interval: { from: 1_800_000_000, to: 1_800_003_600 },
      form_submission_id: "form-submission",
    },
  });
  assert.equal("price_override" in calls[4].body.booking, false);
  assert.deepEqual(calls[6].body, {});
  assert.equal(
    new URL(calls[6].url).pathname,
    "/v1/storefront/orders/order-booking/booking-items/order-booking-item/cancel",
  );
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
  assert.equal(call.method, "GET");
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
      return jsonResponse([bookingOffering()]);
    if (pathname.endsWith("/booking-resources"))
      return jsonResponse({ items: [bookingResource()], cursor: null });
    if (pathname.endsWith("/booking-services/availability"))
      return jsonResponse({
        from: 1_800_000_000,
        to: 1_802_678_400,
        booking_resources: [
          {
            booking_resource_id: "booking-resource",
            resource_key: "room-one",
            days: [
              {
                date: availableLocalDate,
                slots: [
                  { from: 1_800_000_000, to: 1_800_003_600, spots: 2 },
                  { from: 1_800_003_600, to: 1_800_007_200, spots: 0 },
                ],
              },
            ],
          },
        ],
      });
    if (pathname.endsWith("/carts/current")) return jsonResponse(cart());
    if (pathname.endsWith("/carts/cart-booking"))
      return jsonResponse(cart(call.body.booking_items));
    if (pathname === "/v1/storefront")
      return jsonResponse({
        timezone: "Europe/Sarajevo",
        languages: { default: "en", available: ["en"] },
        markets: {
          default: "bih",
          available: [
            {
              id: "market-bih",
              key: "bih",
              currency: "EUR",
              tax_mode: "inclusive",
              payment_provider_ids: [],
              zones: [],
            },
          ],
        },
        support: { email: "support@example.test" },
        readiness: { market: true, payment: true, commerce: true },
      });
    throw new Error(`Unexpected request ${call.method} ${call.url}`);
  };

  const slot = {
    id: "slot-one",
    bookingServiceId: "booking-service",
    bookingResourceId: "booking-resource",
    bookingOfferingId: "booking-offering",
    from: 1_800_000_000,
    to: 1_800_003_600,
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
      { ...slot, id: "slot-two", from: slot.to, to: slot.to + 3600 },
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
  } finally {
    globalThis.fetch = originalFetch;
  }

  const update = calls.find(
    (call) =>
      call.method === "PUT" &&
      new URL(call.url).pathname.endsWith("/carts/cart-booking"),
  );
  assert.ok(update);
  assert.equal(update.body.booking_items.length, 1);
  assert.deepEqual(
    {
      ...update.body.booking_items[0],
      id: "generated",
    },
    {
      id: "generated",
      booking_offering_id: "booking-offering",
      requested_interval: { from: slot.from, to: slot.to },
      form_submission_id: "form-submission",
    },
  );
  assert.equal("form_state" in store.eshop.bookingService, false);
});
