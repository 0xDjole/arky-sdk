import assert from "node:assert/strict";
import test from "node:test";

import { initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  factoryId,
  ids,
  idFactories,
  idSequence,
  publishableKey,
  recordFetch,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const serviceId = "a3c5e7f9-1b2d-4f68-8a0c-2e4f6a8c0b1d";
const resourceId = "b4d6f8a0-2c3e-4a79-9b1d-3f5a7b9d1c2e";
const offeringId = "c5e7a9b1-3d4f-4b8a-8c2e-4a6b8c0e2d3f";
const customer = { type: "customer" };

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = (value) => `${year}-${String(month + 1).padStart(2, "0")}-${String(value).padStart(2, "0")}`;

function bookingService() {
  return {
    id: serviceId,
    store_id: ids.store,
    key: "apartment",
    slugs: { en: "apartment" },
    blocks: [],
    categories: [],
    segments: [{ type: "service", minutes: 2640 }],
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
    slot_interval_minutes: 1440,
    booking_window: { opens_before_start_minutes: null, closes_before_start_minutes: null },
    customer_changes: { type: "not_allowed" },
    reminder_offsets_minutes: [],
    tax_category_id: ids.paymentOption,
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    price: null,
  };
}

function bookingOffering() {
  return {
    id: offeringId,
    store_id: ids.store,
    booking_service_id: serviceId,
    booking_resource_id: resourceId,
    hours: { type: "resource" },
    venue: { type: "store_location", store_location_id: ids.companyLocation },
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    price: { tax_mode: "inclusive", unit_price: { amount: 5000, currency: "eur" }, compare_at: null, min_quantity: 1, max_quantity: null, priced_at: 1 },
  };
}

function calendarServer(context) {
  let cart = null;
  return recordFetch(context, (call) => {
    if (call.path === `/v1/storefront/booking-services/${serviceId}`) return bookingService();
    if (call.path === "/v1/storefront/booking-offerings") return { items: [bookingOffering()], cursor: null };
    if (call.path === "/v1/storefront/booking-resources") return { items: [{ id: resourceId, key: "apartment-one", blocks: [] }], cursor: null };
    if (call.path === "/v1/storefront/booking-services/availability") {
      return {
        from: Number(call.query.from),
        to: Number(call.query.to),
        cursor: null,
        booking_resources: [{
          booking_offering_id: offeringId,
          booking_resource_id: resourceId,
          resource_key: "apartment-one",
          timezone: "UTC",
          days: [{ date: day(10), slots: [{ from: Date.UTC(year, month, 10, 14), to: Date.UTC(year, month, 12, 10), spots: 1 }] }],
        }],
      };
    }
    if (call.path === "/v1/storefront/carts") {
      cart = cartRecord({ id: call.body.id, catalog_id: call.body.catalog_id });
      return { type: "created", cart, recovery_token: "token" };
    }
    if (call.path.endsWith("/booking-items")) {
      cart = { ...cart, updated_at: cart.updated_at + 1, line_items: [...cart.line_items, { type: "booking", ...call.body.booking, price_override: null }] };
      return cart;
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
}

function calendarStore(createId = idSequence(factoryId(1), factoryId(2))) {
  return initialize(publishableKey, { ...idFactories, createId, apiUrl, locale: "en", sessionStorage: visitorStorage() });
}

async function pickStay(calendar) {
  await calendar.select({ booking_service_id: serviceId });
  calendar.setTimezone({ timezone: "UTC" });
  calendar.selectDate({ date: day(10) });
  const [slot] = calendar.state.get().slots;
  calendar.selectSlot({ slot });
  return slot;
}

test("a stay over several nights is a multi-day slot shown as a date range across its calendar days", async (context) => {
  calendarServer(context);
  const calendar = calendarStore().eshop.bookingCalendar({ buyer: customer, catalog_id: ids.catalog });
  const slot = await pickStay(calendar);
  assert.equal(slot.is_multi_day, true);
  assert.equal(slot.booking_offering_id, offeringId);
  const format = (ts) => new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
  assert.equal(slot.time_text, `${format(slot.from)} - ${format(slot.to)}`);
  const state = calendar.state.get();
  assert.deepEqual(state.days.filter((cell) => cell.is_in_range).map((cell) => cell.iso), [day(10), day(11), day(12)]);
  assert.deepEqual(state.days.filter((cell) => cell.is_selected).map((cell) => cell.iso), [day(10)]);
  assert.equal(state.selected_slot.id, slot.id);
  assert.equal(calendar.month_label.get(), now.toLocaleString("en", { month: "long", year: "numeric" }));
});

test("addToCart creates the cart of the calendar's buyer and catalog and takes the line id from the factory", async (context) => {
  const calls = calendarServer(context);
  const store = calendarStore();
  const scope = { buyer: customer, catalog_id: ids.otherCatalog };
  const calendar = store.eshop.bookingCalendar(scope);
  const slot = await pickStay(calendar);
  const cart = await calendar.addToCart({ slot });
  assert.equal(cart.id, factoryId(1));
  assert.equal(cart.catalog_id, ids.otherCatalog);
  assert.equal(store.eshop.cart(scope).cart.get().id, factoryId(1));
  assert.equal(store.eshop.cart(scope).booking_items.get().length, 1);
  assert.equal(store.eshop.checkoutFlow(scope).cart.booking_items.get().length, 1);
  const create = calls.find((call) => call.path === "/v1/storefront/carts");
  assert.deepEqual(create.body, { id: factoryId(1), buyer: customer, catalog_id: ids.otherCatalog });
  const add = calls.find((call) => call.path.endsWith("/booking-items"));
  assert.equal(add.body.booking.id, factoryId(2));
  assert.deepEqual(add.body.booking.requested_interval, { from: slot.from, to: slot.to });
  assert.equal(calendar.state.get().selected_slot, null);
  assert.deepEqual(calendar.state.get().slots, []);
});

test("a slot of another booking service is refused before anything is sent", async (context) => {
  const calls = calendarServer(context);
  const calendar = calendarStore().eshop.bookingCalendar({ buyer: customer, catalog_id: ids.catalog });
  const slot = await pickStay(calendar);
  const other = { ...slot, booking_service_id: ids.product };
  assert.throws(() => calendar.selectSlot({ slot: other }), TypeError);
  await assert.rejects(calendar.addToCart({ slot: other }), TypeError);
  assert.equal(calls.some((call) => call.path === "/v1/storefront/carts"), false);
  calendar.selectFirstAvailableDate();
  assert.equal(calendar.state.get().selected_date, day(10));
});
