import assert from "node:assert/strict";
import test from "node:test";

import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  factoryId,
  fixedIdFactories,
  ids,
  recordFetch,
  storefrontIdentity,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const visitorIdentity = { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" };
const doctorOffering = "6a1f2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const roomOffering = "7b2a3c4d-5e6f-4a71-9b8c-0d1e2f3a4b5c";
const price = { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price };

function bookingLine(id, offeringId, bookingType) {
  return {
    type: "booking",
    id,
    booking_type: bookingType,
    booking_offering_id: offeringId,
    requested_interval: { from: 1_800_000_000_000, to: 1_800_001_800_000 },
    capacity_units: 1,
    form_submission_id: null,
    price,
  };
}

const visit = bookingLine(ids.line, doctorOffering, { type: "main" });
const room = bookingLine(ids.otherLine, roomOffering, { type: "extra", main_line_id: ids.line });
const coffee = { type: "product", id: factoryId(7), variant_id: ids.variant, quantity: 1, form_submission_id: null, price };

function storefront() {
  return createStorefront(storefrontIdentity, { visitorIdentity, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
}

test("storefront cart calls send each booking line's booking_type, an extra line's main line included", async (context) => {
  const calls = recordFetch(context, () => cartRecord({ updated_at: 1_700_000_000_002, line_items: [visit, room] }));
  const client = storefront();
  const { type: _visit, ...visitInput } = visit;
  const { type: _room, ...roomInput } = room;
  await client.eshop.cart.update({ id: ids.cart, expected_updated_at: 1_700_000_000_001, line_items: [visit, room] });
  await client.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 1_700_000_000_002, booking: roomInput });
  const { booking_type: _main, ...unnamed } = visitInput;
  await client.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 1_700_000_000_002, booking: unnamed });
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["PUT", `/v1/storefront/carts/${ids.cart}`],
    ["POST", `/v1/storefront/carts/${ids.cart}/booking-items`],
    ["POST", `/v1/storefront/carts/${ids.cart}/booking-items`],
  ]);
  assert.deepEqual(calls[0].body.line_items, [visit, room], "a saved extra line stays an extra of its main line");
  assert.deepEqual(calls[1].body.booking, roomInput);
  assert.deepEqual(calls[2].body.booking, unnamed, "a line that names no booking_type is sent without one, so it is a main line");
});

test("a booking_type that is neither main nor an extra of a real line id is refused before any request", async (context) => {
  const calls = recordFetch(context, () => cartRecord());
  const client = storefront();
  const { type: _room, ...roomInput } = room;
  for (const bookingType of [
    { type: "extra" },
    { type: "extra", main_line_id: "visit-line" },
    { type: "room" },
    null,
  ]) {
    await assert.rejects(
      async () => client.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 1, booking: { ...roomInput, booking_type: bookingType } }),
      TypeError,
      JSON.stringify(bookingType),
    );
  }
  assert.equal(calls.length, 0);
});

test("a store cart with an extra line round-trips it unchanged when it saves the cart's lines again", async (context) => {
  const lines = [coffee, visit, room];
  const calls = recordFetch(context, (call) => {
    if (call.method === "POST" && call.path === "/v1/storefront/carts") {
      return { type: "created", cart: cartRecord({ id: call.body.id, line_items: lines }), recovery_token: "token" };
    }
    if (call.method === "PUT" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      return cartRecord({ updated_at: 1_700_000_000_002, line_items: call.body.line_items });
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const store = initialize(storefrontIdentity, { visitorIdentity, ...fixedIdFactories, apiUrl, locale: "en", market: "hrv", sessionStorage: visitorStorage() });
  const cart = store.eshop.cart({ buyer: { type: "customer" }, package_id: ids.package });
  await cart.create({ id: ids.cart });
  await cart.setProductQuantity({ line_item_id: coffee.id, quantity: 2 });
  const saved = calls.find((call) => call.method === "PUT");
  assert.ok(saved, "the quantity change saves the cart's lines");
  assert.deepEqual(saved.body.line_items, [{ ...coffee, quantity: 2 }, visit, room]);
  assert.deepEqual(saved.body.line_items[2].booking_type, { type: "extra", main_line_id: ids.line });
  assert.deepEqual(cart.cart.get().line_items, [{ ...coffee, quantity: 2 }, visit, room]);
});
