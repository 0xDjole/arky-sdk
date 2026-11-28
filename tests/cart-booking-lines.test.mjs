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

const visitorIdentity = { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" };
const doctorOffering = "6a1f2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const roomOffering = "7b2a3c4d-5e6f-4a71-9b8c-0d1e2f3a4b5c";
const roomAddOn = "8c3b4d5e-6f7a-4b82-8c9d-1e2f3a4b5c6d";
const nurseAddOn = "9d4c5e6f-7a8b-4c93-9daf-2f3a4b5c6d7e";
const branch = "ae5d6f7a-8b9c-4da4-8eb0-3a4b5c6d7e8f";
const roomResource = "bf6e7a8b-9cad-4eb5-9fc1-4b5c6d7e8f90";
const price = { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price };

const visit = {
  type: "booking",
  id: ids.line,
  booking_offering_id: doctorOffering,
  tenant_location_id: branch,
  resource: { type: "any" },
  requested_interval: { from: 1_800_000_000_000, to: 1_800_001_800_000 },
  add_ons: [
    {
      add_on_id: roomAddOn,
      booking_offering_id: roomOffering,
      resource: { type: "resource", booking_resource_id: roomResource },
      form_submission_id: null,
      add_ons: [{ add_on_id: nurseAddOn, booking_offering_id: roomOffering, resource: { type: "any" }, form_submission_id: null, add_ons: [] }],
    },
  ],
  capacity_units: 1,
  form_submission_id: null,
  price,
  session: null,
};
const coffee = { type: "product", id: factoryId(7), variant_id: ids.variant, quantity: 1, form_submission_id: null, price };

function visitInput() {
  return {
    id: ids.line,
    booking_offering_id: doctorOffering,
    tenant_location_id: branch,
    resource: { type: "any" },
    requested_interval: { from: 1_800_000_000_000, to: 1_800_001_800_000 },
    add_ons: [
      {
        add_on_id: roomAddOn,
        resource: { type: "resource", booking_resource_id: roomResource },
        add_ons: [{ add_on_id: nurseAddOn, resource: { type: "any" }, add_ons: [] }],
      },
    ],
    capacity_units: 1,
    price,
  };
}

function storefront() {
  return createStorefront(storefrontIdentity, { visitorIdentity, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
}

test("a storefront booking line names its branch, its resource and its add-ons, nested add-ons included", async (context) => {
  const calls = recordFetch(context, () => cartRecord({ updated_at: 1_700_000_000_002, line_items: [visit] }));
  const client = storefront();
  await client.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 1_700_000_000_002, booking: { ...visitInput(), booking_type: { type: "main" } } });
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [["POST", `/v1/storefront/carts/${ids.cart}/booking-items`]]);
  assert.deepEqual(calls[0].body.booking, visitInput(), "an old booking_type never reaches the wire");
  assert.equal("booking_type" in calls[0].body.booking, false);
});

test("a booking line without its branch, its resource or its add-on list is refused before any request", async (context) => {
  const calls = recordFetch(context, () => cartRecord());
  const client = storefront();
  const input = visitInput();
  for (const booking of [
    { ...input, tenant_location_id: "branch" },
    { ...input, resource: undefined },
    { ...input, resource: { type: "resource", booking_resource_id: "room" } },
    { ...input, add_ons: undefined },
    { ...input, add_ons: [{ add_on_id: "room", resource: { type: "any" }, add_ons: [] }] },
    { ...input, add_ons: [{ add_on_id: roomAddOn, resource: { type: "chosen" }, add_ons: [] }] },
  ]) {
    await assert.rejects(async () => client.eshop.cart.addBooking({ id: ids.cart, expected_updated_at: 1, booking }), TypeError);
  }
  assert.equal(calls.length, 0);
});

test("a store cart with a booking and its add-ons saves them unchanged when it saves the cart's lines again", async (context) => {
  const lines = [coffee, visit];
  const calls = recordFetch(context, (call) => {
    if (call.method === "POST" && call.path === "/v1/storefront/carts") {
      return { type: "created", cart: cartRecord({ id: call.body.id, line_items: lines }), recovery_token: "token" };
    }
    if (call.method === "PUT" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      return cartRecord({ updated_at: 1_700_000_000_002, line_items: lines.map((line) => (line.id === coffee.id ? { ...line, quantity: 2 } : line)) });
    }
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  const store = initialize(storefrontIdentity, { visitorIdentity, ...fixedIdFactories, apiUrl, locale: "en", market: "hrv", sessionStorage: visitorStorage() });
  const cart = store.eshop.cart({ buyer: { type: "user" }, package_id: ids.package });
  await cart.create({ id: ids.cart });
  await cart.setProductQuantity({ line_item_id: coffee.id, quantity: 2 });
  const saved = calls.find((call) => call.method === "PUT");
  assert.ok(saved, "the quantity change saves the cart's lines");
  assert.deepEqual(saved.body.line_items, [{ ...coffee, quantity: 2 }, { type: "booking", ...visitInput(), form_submission_id: null, add_ons: [
    {
      add_on_id: roomAddOn,
      resource: { type: "resource", booking_resource_id: roomResource },
      form_submission_id: null,
      add_ons: [{ add_on_id: nurseAddOn, resource: { type: "any" }, form_submission_id: null, add_ons: [] }],
    },
  ] }]);
  assert.equal("booking_offering_id" in saved.body.line_items[1].add_ons[0], false, "an add-on's offering is Arky's pick, never sent back");
  assert.equal(cart.item_count.get(), 3);
});
