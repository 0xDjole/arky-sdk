import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, fixedIdFactories, ids, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

const offeringId = "8d1c2f4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f";
const memberPackageId = "6b7f3f38-2a8b-4a1e-9f02-7a1d9a2f0f21";
const otherPackageId = "3c9e5a71-8d24-4f06-b2a8-5e1c7d3f9b40";
const automaticItemId = "0b9a4b7e-51a1-4d5f-9d9f-7a0e3f9ce0a1";
const STORE_ID = "d7b1f4e9-2a63-4c58-8e0d-5b9c3a6f1e24";
const OTHER_STORE_ID = "0a6e3c9f-5d21-4b87-9f4a-8c2e1b7d5a03";

function admin() {
  return createAdmin({ secretKey: "test-token", apiUrl: apiUrl });
}

test("storefront package and offering reads name their shop, answer the plan's item and offering, and never ask for a price", async (context) => {
  const calls = recordFetch(context, (call) => call.path.includes("/package-offerings/")
    ? { id: offeringId, key: "members-club", blocks: [], package_ids: [memberPackageId] }
    : { id: memberPackageId, package_item_id: ids.packageItem, package_offering_id: offeringId });
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "us", locale: "en" });
  const memberPackage = await client.eshop.package.getByKey({ key: "monthly/plan", package_id: ids.package, company_id: ids.company });
  assert.equal(memberPackage.package_item_id, ids.packageItem);
  assert.equal(memberPackage.package_offering_id, offeringId);
  await client.eshop.package.get({ id: memberPackageId, package_id: ids.package, company_location_id: ids.companyLocation });
  const offering = await client.eshop.packageOffering.getByKey({ key: "members-club", package_id: ids.package });
  assert.deepEqual(offering, { id: offeringId, key: "members-club", blocks: [], package_ids: [memberPackageId] });
  await client.eshop.packageOffering.get({ id: offeringId, package_id: ids.package, company_id: ids.company });
  await client.eshop.package.getProductChoices({ key: "monthly", package_item_id: automaticItemId, quantity: 2, package_id: ids.package, company_location_id: ids.companyLocation });
  assert.deepEqual(calls.map((call) => [call.path, call.query]), [
    ["/v1/storefront/packages/monthly%2Fplan", { package_id: ids.package, company_id: ids.company }],
    [`/v1/storefront/packages/${memberPackageId}`, { package_id: ids.package, company_location_id: ids.companyLocation }],
    ["/v1/storefront/package-offerings/members-club", { package_id: ids.package }],
    [`/v1/storefront/package-offerings/${offeringId}`, { package_id: ids.package, company_id: ids.company }],
    [`/v1/storefront/packages/monthly/product-choices/${automaticItemId}`, { package_id: ids.package, company_location_id: ids.companyLocation, quantity: "2" }],
  ]);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.headers.get("x-arky-market"), "us");
    assert.equal(call.headers.get("x-arky-locale"), "en");
    assert.equal(call.headers.get("authorization"), null);
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
  }
  for (const removed of ["subscription_plans", "subscription_offerings"]) assert.equal(removed in client, false, removed);
});

test("a storefront package names each machine it lends by the product the Server read for it, or null once that product is gone", async (context) => {
  const rentalId = "5d2a7c94-1e63-4b08-9f2d-8a6c3e1b7f50";
  const goneRentalId = "2c8e6a13-7b49-4d05-a1f6-3e9d5c2b8a74";
  const machine = {
    id: ids.product,
    key: "milkpal",
    blocks: [{ id: ids.line, key: "name", type: "text", value: "MilkPal · Marco" }],
  };
  const rental = (id) => ({
    id,
    type: { type: "rent_product", variant_id: ids.variant, quantity: 1, tax_category_id: STORE_ID },
  });
  const package_ = {
    id: memberPackageId,
    key: "milkpal-package",
    blocks: [],
    renewal: { type: "never" },
    stay: { type: "any_time" },
    minimum: { type: "none" },
    items: [rental(rentalId), rental(goneRentalId)],
    rental_products: [
      { package_item_id: rentalId, product: machine },
      { package_item_id: goneRentalId, product: null },
    ],
    package_item_id: ids.packageItem,
    package_offering_id: null,
  };
  const calls = recordFetch(context, () => package_);
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "us", locale: "en" });
  for (const read of [
    await client.eshop.package.get({ id: memberPackageId, package_id: ids.package, company_location_id: ids.companyLocation }),
    await client.eshop.package.getByKey({ key: "milkpal-package", package_id: ids.package, company_location_id: ids.companyLocation }),
  ]) {
    assert.deepEqual(read.rental_products, package_.rental_products);
    assert.deepEqual(read.rental_products[0].product, machine);
    assert.equal(read.rental_products[1].product, null);
    assert.deepEqual(
      read.rental_products.map((item) => item.package_item_id),
      read.items.filter((item) => item.type.type === "rent_product").map((item) => item.id),
    );
    assert.equal("product" in read.items[0].type, false);
  }
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", `/v1/storefront/packages/${memberPackageId}`],
    ["GET", "/v1/storefront/packages/milkpal-package"],
  ]);
});

test("a package owns its renewal, stay and automatic item operations, and is created under the app-picked id", async (context) => {
  const items = [{ action: "create", id: automaticItemId, type: { type: "rent_product", variant_id: ids.variant, quantity: 1, tax_category_id: "tax", allocation_weight: 0 } }];
  const renewal = {
    type: "every",
    agreed: { cadence: { interval: "month", interval_count: 1 }, on_exhaustion: { type: "pause" }, unpaid_order: { type: "retain_debt" } },
    timing: { retry_offsets_seconds: [86_400], recovery_window_seconds: 604_800, reminder: { type: "none" } },
  };
  const stay = { type: "at_least", length: { interval: "year", interval_count: 1 }, then: { type: "renew_once" } };
  const create = {
    store_id: STORE_ID,
    id: memberPackageId,
    key: "monthly",
    blocks: [],
    renewal,
    stay,
    minimum: { type: "none" },
    schedule: { type: "always" },
    status: { type: "active" },
    items,
  };
  const { store_id: _store, ...body } = create;
  const calls = recordFetch(context, () => ({ ...body, store_id: STORE_ID, created_at: 1, updated_at: 1 }));
  const before = structuredClone(create);
  const saved = await admin().eshop.package.create(create);
  assert.deepEqual(saved.renewal, renewal);
  assert.deepEqual(saved.stay, stay);
  assert.deepEqual(create, before);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [["POST", `/v1/stores/${STORE_ID}/packages`, body]]);
  for (const removed of ["subscriptionPlan", "subscriptionOffering"]) assert.equal(removed in admin().eshop, false, removed);
  for (const id of [undefined, "monthly", memberPackageId.toUpperCase()]) {
    await assert.rejects(async () => admin().eshop.package.create({ ...create, id }), {
      name: "TypeError",
      message: "The package id must be a canonical UUID v4 picked by the app",
    });
  }
  assert.equal(calls.length, 1);
});

test("package and offering edits carry the version, offerings list their packages with no status, and deletes send the version as a query", async (context) => {
  const deleting = { id: memberPackageId, status: { type: "deleting" } };
  const calls = recordFetch(context, (call) => call.method === "DELETE"
    ? call.path.includes("/package-offerings/") ? new Response(null, { status: 204 }) : deleting
    : call.method === "GET" ? { items: [], cursor: null } : { id: "record" });
  const client = admin().eshop;
  const update = { store_id: OTHER_STORE_ID, id: memberPackageId, expected_updated_at: 5, blocks: [], renewal: { type: "never" }, stay: { type: "any_time" }, minimum: { type: "none" }, schedule: { type: "always" }, status: { type: "closed" }, items: [] };
  await client.package.update(update);
  assert.deepEqual(await client.package.delete({ store_id: OTHER_STORE_ID, id: memberPackageId, expected_updated_at: 6 }), deleting);
  await client.package.find({ store_id: STORE_ID, package_offering_id: offeringId, status: { type: "active" }, sort_field: "status", limit: 5 });
  await client.packageOffering.create({ store_id: STORE_ID, id: offeringId, key: "members-club", blocks: [], package_ids: [memberPackageId] });
  await client.packageOffering.update({ store_id: STORE_ID, id: offeringId, expected_updated_at: 7, blocks: [], package_ids: [memberPackageId, otherPackageId] });
  await client.packageOffering.find({ store_id: STORE_ID, key: "members-club", limit: 5 });
  assert.equal(await client.packageOffering.delete({ store_id: STORE_ID, id: offeringId, expected_updated_at: 8 }), undefined);
  const { store_id: _store, id: _id, ...updateBody } = update;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["PUT", `/v1/stores/${OTHER_STORE_ID}/packages/${memberPackageId}`, {}, updateBody],
    ["DELETE", `/v1/stores/${OTHER_STORE_ID}/packages/${memberPackageId}`, { expected_updated_at: "6" }, null],
    ["GET", `/v1/stores/${STORE_ID}/packages`, { package_offering_id: offeringId, status: JSON.stringify({ type: "active" }), sort_field: "status", limit: "5" }, null],
    ["POST", `/v1/stores/${STORE_ID}/package-offerings`, {}, { id: offeringId, key: "members-club", blocks: [], package_ids: [memberPackageId] }],
    ["PUT", `/v1/stores/${STORE_ID}/package-offerings/${offeringId}`, {}, { expected_updated_at: 7, blocks: [], package_ids: [memberPackageId, otherPackageId] }],
    ["GET", `/v1/stores/${STORE_ID}/package-offerings`, { key: "members-club", limit: "5" }, null],
    ["DELETE", `/v1/stores/${STORE_ID}/package-offerings/${offeringId}`, { expected_updated_at: "8" }, null],
  ]);
  await assert.rejects(async () => client.packageOffering.create({ store_id: STORE_ID, id: "members-club", key: "members-club", blocks: [], package_ids: [] }), {
    name: "TypeError",
    message: "The package offering id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 7);
});

test("package offerings are read by id or by key on the named store, and never from a remembered one", async (context) => {
  const calls = recordFetch(context, () => ({ id: offeringId }));
  const client = admin().eshop.packageOffering;
  await client.get({ store_id: STORE_ID, id: offeringId });
  await client.getByKey({ store_id: OTHER_STORE_ID, key: "members/club" });
  await admin().eshop.package.get({ store_id: STORE_ID, id: memberPackageId });
  await assert.rejects(async () => client.getByKey({ key: "members-club" }), TypeError);
  assert.deepEqual(calls.map(({ path }) => path), [
    `/v1/stores/${STORE_ID}/package-offerings/${offeringId}`,
    `/v1/stores/${OTHER_STORE_ID}/package-offerings/by-key/members%2Fclub`,
    `/v1/stores/${STORE_ID}/packages/${memberPackageId}`,
  ]);
});
