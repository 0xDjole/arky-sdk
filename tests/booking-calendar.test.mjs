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
  storefrontIdentity,
  recordFetch,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const serviceId = "a3c5e7f9-1b2d-4f68-8a0c-2e4f6a8c0b1d";
const resourceId = "b4d6f8a0-2c3e-4a79-9b1d-3f5a7b9d1c2e";
const offeringId = "c5e7a9b1-3d4f-4b8a-8c2e-4a6b8c0e2d3f";
const laterResourceId = "d6f8b0c2-4e5a-4c9b-9d3f-5b7c9d1f3e4a";
const laterOfferingId = "e7a9c1d3-5f6b-4dac-8e4a-6c8d0e2a4f5b";
const otherPackageItemId = "f8b0d2e4-6a7c-4ebd-9f5b-7d9e1f3b5a6c";
const customer = { type: "customer" };
const dayMilliseconds = 24 * 60 * 60 * 1_000;

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = (value) => `${year}-${String(month + 1).padStart(2, "0")}-${String(value).padStart(2, "0")}`;

function zoned(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function localInstant(timeZone, dayOfMonth, hour, minute = 0) {
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  for (let offset = -14; offset <= 14; offset++) {
    const instant = Date.UTC(year, month, dayOfMonth, hour, minute) - offset * 60 * 60 * 1_000;
    const shown = zoned(instant, timeZone);
    if (shown.date === day(dayOfMonth) && shown.time === time) return instant;
  }
  throw new Error(`${time} on ${day(dayOfMonth)} doesn't exist in ${timeZone}`);
}

function slotTimes(from, to, timeZone) {
  return [from, to].map((value) => new Date(value).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", timeZone })).join(" - ");
}

function bookingService() {
  return {
    id: serviceId,
    store_id: ids.store,
    key: "apartment",
    slugs: { en: "apartment" },
    blocks: [],
    categories: [],
    segments: [{ type: "service", minutes: 1320 }],
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
    slot_interval_minutes: 1440,
    booking_window: { opens_before_start_minutes: null, closes_before_start_minutes: 0 },
    customer_changes: { type: "not_allowed" },
    reminder_offsets_minutes: [],
    tax_category_id: ids.paymentOption,
    status: { type: "active" },
    created_at: 1,
    updated_at: 1,
    package_item_id: ids.packageItem,
  };
}

function offeringChoice(bookingOfferingId = offeringId, priceId = ids.price) {
  return {
    price_id: priceId,
    sellable: { type: "booking_offering", booking_offering_id: bookingOfferingId },
    content: { sku: null, blocks: [], basis: { type: "booking_option" } },
    price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: priceId, tax_mode: "inclusive", unit_price: { amount: 5000, currency: "eur" }, compare_at: null, priced_at: 1 },
  };
}

function availabilityEntry({ bookingOfferingId = offeringId, bookingResourceId = resourceId, timezone = "UTC", days }) {
  return {
    booking_offering_id: bookingOfferingId,
    booking_resource_id: bookingResourceId,
    resource_key: `resource-${bookingResourceId.slice(0, 8)}`,
    timezone,
    days,
  };
}

function stayEntry() {
  return availabilityEntry({
    days: [{ date: day(10), slots: [{ from: Date.UTC(year, month, 10, 14), to: Date.UTC(year, month, 11, 12), spots: 1 }] }],
  });
}

function withinRange(entry, from, to) {
  return {
    ...entry,
    days: entry.days
      .map((serverDay) => ({ ...serverDay, slots: serverDay.slots.filter((slot) => slot.from >= from && slot.from < to) }))
      .filter((serverDay) => serverDay.slots.length > 0),
  };
}

function bookingLine(packageItemId, to) {
  return {
    type: "booking",
    id: factoryId(90),
    booking_offering_id: offeringId,
    requested_interval: { from: to - 60 * 60 * 1_000, to },
    capacity_units: 1,
    form_submission_id: null,
    price: { package_id: ids.package, package_item_id: packageItemId, price_id: ids.price },
  };
}

function calendarServer(context, { pages = [[stayEntry()]], choices = [offeringChoice()], lines = [] } = {}) {
  let cart = null;
  return recordFetch(context, (call) => {
    if (call.path === `/v1/storefront/booking-services/${serviceId}`) return bookingService();
    if (call.path === `/v1/storefront/package-items/${ids.packageItem}/prices`) return { items: choices, cursor: null };
    if (call.path.startsWith("/v1/storefront/booking-resources/")) {
      const id = call.path.split("/").at(-1);
      return { id, key: `resource-${id.slice(0, 8)}`, blocks: [] };
    }
    if (call.path === "/v1/storefront/booking-services/availability") {
      const from = Number(call.query.from);
      const to = Number(call.query.to);
      const index = call.query.cursor ? Number(call.query.cursor.split("-").at(-1)) : 0;
      return {
        from,
        to,
        cursor: index + 1 < pages.length ? `page-${index + 1}` : null,
        booking_resources: pages[index].map((entry) => withinRange(entry, from, to)),
      };
    }
    if (call.path === "/v1/storefront/carts") {
      cart = cartRecord({ id: call.body.id, package_id: call.body.package_id, line_items: lines });
      return { type: "created", cart, recovery_token: "token" };
    }
    if (call.path.endsWith("/booking-items")) {
      cart = { ...cart, updated_at: cart.updated_at + 1, line_items: [...cart.line_items, { type: "booking", ...call.body.booking }] };
      return cart;
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
}

function calendarStore(createId = idSequence(factoryId(1), factoryId(2))) {
  return initialize(storefrontIdentity, { ...idFactories, createId, apiUrl, locale: "en", market: "bih", sessionStorage: visitorStorage() });
}

function availabilityReads(calls) {
  return calls.filter((call) => call.path === "/v1/storefront/booking-services/availability");
}

function monthRange(monthIndex) {
  return { from: Date.UTC(year, monthIndex, 1) - dayMilliseconds, to: Date.UTC(year, monthIndex + 1, 1) + dayMilliseconds };
}

async function pickStay(calendar) {
  await calendar.select({ booking_service_id: serviceId });
  calendar.setTimezone({ timezone: "UTC" });
  calendar.selectDate({ date: day(10) });
  const [slot] = calendar.state.get().slots;
  calendar.selectSlot({ slot });
  return slot;
}

test("an overnight stay is a slot across midnight, shown as a date range", async (context) => {
  calendarServer(context);
  const calendar = calendarStore().eshop.bookingCalendar({ buyer: customer, package_id: ids.package });
  const slot = await pickStay(calendar);
  assert.equal(slot.is_multi_day, true);
  assert.equal(slot.booking_offering_id, offeringId);
  assert.equal(slot.timezone, "UTC");
  const format = (ts) => new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
  assert.equal(slot.time_text, `${format(slot.from)} - ${format(slot.to)}`);
  const state = calendar.state.get();
  assert.deepEqual(state.days.filter((cell) => cell.is_in_range).map((cell) => cell.iso), [day(10), day(11)]);
  assert.deepEqual(state.days.filter((cell) => cell.is_selected).map((cell) => cell.iso), [day(10)]);
  assert.equal(state.selected_slot.id, slot.id);
  assert.equal(calendar.month_label.get(), now.toLocaleString("en", { month: "long", year: "numeric" }));
});

test("addToCart creates the cart of the calendar's buyer and package and takes the line id from the factory", async (context) => {
  const calls = calendarServer(context);
  const store = calendarStore();
  const scope = { buyer: customer, package_id: ids.otherPackage };
  const calendar = store.eshop.bookingCalendar(scope);
  const slot = await pickStay(calendar);
  const cart = await calendar.addToCart({ slot });
  assert.equal(cart.id, factoryId(1));
  assert.equal(cart.package_id, ids.otherPackage);
  assert.equal(store.eshop.cart(scope).cart.get().id, factoryId(1));
  assert.equal(store.eshop.cart(scope).booking_items.get().length, 1);
  assert.equal(store.eshop.checkoutFlow(scope).cart.booking_items.get().length, 1);
  const create = calls.find((call) => call.path === "/v1/storefront/carts");
  assert.deepEqual(create.body, { id: factoryId(1), buyer: customer, package_id: ids.otherPackage, market_id: ids.market });
  const add = calls.find((call) => call.path.endsWith("/booking-items"));
  assert.equal(add.body.booking.id, factoryId(2));
  assert.deepEqual(add.body.booking.requested_interval, { from: slot.from, to: slot.to });
  assert.deepEqual(add.body.booking.price, { package_id: ids.otherPackage, package_item_id: ids.packageItem, price_id: ids.price });
  assert.equal(calendar.state.get().selected_slot, null);
  assert.deepEqual(calendar.state.get().slots, []);
});

test("a slot of another booking service is refused before anything is sent", async (context) => {
  const calls = calendarServer(context);
  const calendar = calendarStore().eshop.bookingCalendar({ buyer: customer, package_id: ids.package });
  const slot = await pickStay(calendar);
  const other = { ...slot, booking_service_id: ids.product };
  assert.throws(() => calendar.selectSlot({ slot: other }), TypeError);
  await assert.rejects(calendar.addToCart({ slot: other }), TypeError);
  assert.equal(calls.some((call) => call.path === "/v1/storefront/carts"), false);
  calendar.selectFirstAvailableDate();
  assert.equal(calendar.state.get().selected_date, day(10));
});

test("a month read covers a day on each side and shows a slot of the 1st before UTC midnight", async (context) => {
  const from = localInstant("Europe/Sarajevo", 1, 0, 30);
  const calls = calendarServer(context, {
    pages: [[availabilityEntry({ timezone: "Europe/Sarajevo", days: [{ date: day(1), slots: [{ from, to: from + 60 * 60 * 1_000, spots: 1 }] }] })]],
  });
  const calendar = calendarStore().eshop.bookingCalendar({ buyer: customer, package_id: ids.package });
  await calendar.select({ booking_service_id: serviceId });
  const [read] = availabilityReads(calls);
  assert.ok(from < Date.UTC(year, month, 1));
  assert.equal(Number(read.query.from), monthRange(month).from);
  assert.equal(Number(read.query.to), monthRange(month).to);
  assert.equal(calendar.state.get().days.find((cell) => cell.iso === day(1)).available, true);
  calendar.selectDate({ date: day(1) });
  const [slot] = calendar.state.get().slots;
  assert.equal(slot.from, from);
  assert.equal(slot.timezone, "Europe/Sarajevo");
  assert.equal(slot.time_text, slotTimes(slot.from, slot.to, "Europe/Sarajevo"));
});

test("every offering is read, one a page", async (context) => {
  const first = Date.UTC(year, month, 12, 9);
  const later = Date.UTC(year, month, 14, 9);
  const calls = calendarServer(context, {
    choices: [offeringChoice(), offeringChoice(laterOfferingId, ids.otherPrice)],
    pages: [
      [availabilityEntry({ days: [{ date: day(12), slots: [{ from: first, to: first + 60 * 60 * 1_000, spots: 1 }] }] })],
      [availabilityEntry({
        bookingOfferingId: laterOfferingId,
        bookingResourceId: laterResourceId,
        days: [{ date: day(14), slots: [{ from: later, to: later + 60 * 60 * 1_000, spots: 1 }] }],
      })],
    ],
  });
  const calendar = calendarStore().eshop.bookingCalendar({ buyer: customer, package_id: ids.package });
  const state = await calendar.select({ booking_service_id: serviceId });
  const reads = availabilityReads(calls);
  assert.deepEqual(reads.map((read) => read.query.limit), ["1", "1"]);
  assert.deepEqual(reads.map((read) => read.query.cursor), [undefined, "page-1"]);
  assert.equal(reads[1].query.from, reads[0].query.from);
  assert.equal(state.availability.cursor, null);
  assert.deepEqual(state.booking_resources.map((resource) => resource.id), [resourceId, laterResourceId]);
  assert.deepEqual(state.days.filter((cell) => cell.available).map((cell) => cell.iso), [day(12), day(14)]);
  calendar.selectDate({ date: day(14) });
  assert.deepEqual(calendar.state.get().slots.map((slot) => slot.booking_offering_id), [laterOfferingId]);
  assert.equal("loadMoreAvailability" in calendar, false);
});

test("slots show in their resource's timezone, and a chosen zone files them by its own date", async (context) => {
  const from = localInstant("Europe/Sarajevo", 10, 2);
  const to = from + 60 * 60 * 1_000;
  calendarServer(context, {
    pages: [[availabilityEntry({ timezone: "Europe/Sarajevo", days: [{ date: day(10), slots: [{ from, to, spots: 1 }] }] })]],
  });
  const calendar = calendarStore().eshop.bookingCalendar({ buyer: customer, package_id: ids.package });
  const state = await calendar.select({ booking_service_id: serviceId });
  assert.equal(state.timezone, null);
  calendar.selectDate({ date: day(10) });
  const [venue] = calendar.state.get().slots;
  assert.equal(venue.timezone, "Europe/Sarajevo");
  assert.equal(venue.time_text, slotTimes(from, to, "Europe/Sarajevo"));
  assert.equal(zoned(from, "Europe/Sarajevo").time, "02:00");
  calendar.setTimezone({ timezone: "America/New_York" });
  assert.equal(zoned(from, "America/New_York").date, day(9));
  assert.deepEqual(calendar.state.get().days.filter((cell) => cell.available).map((cell) => cell.iso), [day(9)]);
  assert.deepEqual(calendar.state.get().slots, []);
  calendar.selectDate({ date: day(9) });
  const [visitor] = calendar.state.get().slots;
  assert.equal(visitor.from, from);
  assert.equal(visitor.timezone, "America/New_York");
  assert.equal(visitor.time_text, slotTimes(from, to, "America/New_York"));
  calendar.setTimezone({ timezone: null });
  assert.deepEqual(calendar.state.get().days.filter((cell) => cell.available).map((cell) => cell.iso), [day(10)]);
});

test("month changes read the shown month while the cart holds a booking of another service", async (context) => {
  const calls = calendarServer(context, { lines: [bookingLine(otherPackageItemId, Date.UTC(year, month + 2, 3, 10))] });
  const store = calendarStore(idSequence(factoryId(1)));
  const scope = { buyer: customer, package_id: ids.package };
  await store.eshop.cart(scope).create();
  assert.equal(store.eshop.cart(scope).booking_items.get().length, 1);
  const calendar = store.eshop.bookingCalendar(scope);
  await calendar.select({ booking_service_id: serviceId });
  await calendar.nextMonth();
  const reads = availabilityReads(calls).map((read) => ({ from: Number(read.query.from), to: Number(read.query.to) }));
  assert.deepEqual(reads, [monthRange(month), monthRange(month + 1)]);
});

test("a booking of the same service in the cart opens the calendar on the month it ends in", async (context) => {
  const end = Date.UTC(year, month + 3, 5, 10);
  const calls = calendarServer(context, {
    lines: [bookingLine(otherPackageItemId, Date.UTC(year, month + 5, 3, 10)), bookingLine(ids.packageItem, end)],
  });
  const store = calendarStore(idSequence(factoryId(1)));
  const scope = { buyer: customer, package_id: ids.package };
  await store.eshop.cart(scope).create();
  const calendar = store.eshop.bookingCalendar(scope);
  const state = await calendar.select({ booking_service_id: serviceId });
  const shown = new Date(end);
  assert.equal(state.month.getTime(), new Date(shown.getFullYear(), shown.getMonth(), 1).getTime());
  const [read] = availabilityReads(calls);
  assert.equal(Number(read.query.from), Date.UTC(shown.getFullYear(), shown.getMonth(), 1) - dayMilliseconds);
  assert.equal(Number(read.query.to), Date.UTC(shown.getFullYear(), shown.getMonth() + 1, 1) + dayMilliseconds);
});
