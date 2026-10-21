import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl as baseUrl, ids, jsonResponse, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const storeId = ids.store;
const assetId = "0198f8f7-2f25-4a14-86bb-64efc56e1a11";

test("digital goods are products: storefront discovery searches the named catalog and reads a product by slug in the same context", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/catalog-items" ? { items: [], cursor: "opaque-next" } : { id: ids.product, catalog_item_id: ids.catalogItem });
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: baseUrl, market: "us", locale: "en" });
  const buyer = { catalog_id: ids.catalog, company_location_id: "8f9a5793-561f-4655-8f6b-42f5d6ded327" };
  const selection = { types: ["product"], text: "Košulja linen", choice: { price: { min_amount: 0, max_amount: 500 } }, sort: "starting_price", direction: "desc" };
  assert.deepEqual(await storefront.eshop.catalogItem.find({ ...buyer, include_price: true, selection, limit: 20, cursor: "opaque-current" }), { items: [], cursor: "opaque-next" });
  await storefront.eshop.product.get({ slug: "guide", ...buyer });
  const query = calls[0].url.searchParams;
  assert.equal(calls[0].path, "/v1/storefront/catalog-items");
  assert.equal(query.get("catalog_id"), ids.catalog);
  assert.deepEqual(JSON.parse(query.get("selection")), selection);
  assert.equal(query.get("include_price"), "true");
  assert.equal(query.get("limit"), "20");
  assert.equal(query.get("cursor"), "opaque-current");
  assert.equal(query.get("company_location_id"), buyer.company_location_id);
  assert.equal(query.has("company_id"), false);
  assert.equal(calls[1].path, "/v1/storefront/products/guide");
  assert.deepEqual(calls[1].query, buyer);
  assert.equal("find" in storefront.eshop.product, false);
  assert.equal("digital" in storefront.eshop, false);
});

test("Admin digital variants carry their asset ids and assets are uploaded under the app's id as multipart", async (context) => {
  const variant = {
    id: ids.variant, store_id: storeId, product_id: ids.product, sku: null, blocks: [],
    fulfillment: { type: "digital", asset_ids: [assetId] }, tax_category_id: ids.paymentOption,
    status: { type: "active" }, created_at: 1, updated_at: 1,
  };
  const asset = { id: assetId, store_id: storeId, file_name: "guide.pdf", mime_type: "application/pdf", size_bytes: 9, sha256: "b".repeat(64), status: { type: "active" }, created_at: 3, updated_at: 3 };
  const archivedAsset = { ...asset, status: { type: "archived" }, updated_at: 4 };
  const responses = [variant, asset, { items: [asset], cursor: "next-asset" }, archivedAsset];
  const calls = recordFetch(context, () => responses.shift());
  const admin = createAdmin({ apiUrl: baseUrl, secretKey: "arky_api_digital_contract" });
  const { store_id: _store, status: _status, created_at: _created, updated_at: _updated, ...create } = variant;
  assert.deepEqual(await admin.eshop.productVariant.create({ store_id: storeId, ...create }), variant);
  const uploaded = await admin.eshop.digitalAsset.upload({ store_id: storeId, id: assetId, file: new File(["protected"], "guide.pdf", { type: "application/pdf" }) });
  const assets = await admin.eshop.digitalAsset.find({ store_id: storeId, limit: 25, cursor: "asset-cursor" });
  const archived = await admin.eshop.digitalAsset.archive({ store_id: storeId, id: assetId, expected_updated_at: 3 });
  assert.deepEqual(uploaded, asset);
  assert.deepEqual(assets, { items: [asset], cursor: "next-asset" });
  assert.deepEqual(archived, archivedAsset);
  assert.deepEqual(calls.map((call) => [call.path, call.method]), [
    [`/v1/stores/${storeId}/product-variants`, "POST"],
    [`/v1/stores/${storeId}/digital-assets`, "POST"],
    [`/v1/stores/${storeId}/digital-assets`, "GET"],
    [`/v1/stores/${storeId}/digital-assets/${assetId}/archive`, "POST"],
  ]);
  assert.deepEqual(calls[0].body, create);
  assert.deepEqual(calls[0].body.fulfillment, { type: "digital", asset_ids: [assetId] });
  assert.ok(calls[1].body instanceof FormData);
  assert.equal(calls[1].body.get("id"), assetId);
  const uploadedFile = calls[1].body.get("file");
  assert.ok(uploadedFile instanceof File);
  assert.equal(uploadedFile.name, "guide.pdf");
  assert.equal(uploadedFile.type, "application/pdf");
  assert.equal(calls[1].headers.get("authorization"), "Bearer arky_api_digital_contract");
  assert.equal(calls[1].headers.get("content-type"), null);
  assert.deepEqual(calls[2].query, { limit: "25", cursor: "asset-cursor" });
  assert.deepEqual(calls[3].body, { expected_updated_at: 3 });
  await assert.rejects(async () => admin.eshop.digitalAsset.upload({ store_id: storeId, id: "asset-1", file: new File(["x"], "x.pdf") }), TypeError);
  await assert.rejects(async () => admin.eshop.digitalAsset.upload({ store_id: storeId, file: new File(["x"], "x.pdf") }), TypeError);
  assert.equal(calls.length, 4);
  assert.equal("digital" in admin.eshop, false);
});

test("the digital library keeps empty-page continuation and names a location alone on every access read", async (context) => {
  const responses = [
    { items: [], cursor: "opaque-grant-position" },
    { items: [], cursor: null },
    { product_id: "product/encoded", presentation: null, assets: { items: [], cursor: "protected-file-position" } },
    { items: [], cursor: "protected-file-position" },
    { url: "https://files.example.test/protected", expires_at: 10000, file_name: "guide.pdf", mime_type: "application/pdf" },
  ];
  const calls = recordFetch(context, () => responses.shift());
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: baseUrl, market: "us", locale: "en", sessionStorage: visitorStorage() });
  const location = { company_location_id: ids.companyLocation };
  const first = await storefront.eshop.library.find({ ...location, limit: 1 });
  assert.deepEqual(first, { items: [], cursor: "opaque-grant-position" });
  await storefront.eshop.library.find({ ...location, limit: 1, cursor: first.cursor });
  const product = await storefront.eshop.library.getProduct({ ...location, product_id: "product/encoded", limit: 10 });
  assert.equal(product.presentation, null);
  assert.equal(product.assets.cursor, "protected-file-position");
  const files = await storefront.eshop.library.findAssets({ ...location, product_id: "product/encoded", limit: 10, cursor: product.assets.cursor });
  assert.deepEqual(files, { items: [], cursor: "protected-file-position" });
  await storefront.eshop.library.download({ ...location, product_id: "product/encoded", asset_id: "asset/encoded", reference: "protected-reference" });
  assert.equal(calls.length, 5);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.query.company_location_id, ids.companyLocation);
    assert.equal("company_id" in call.query, false);
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  }
  assert.equal(calls[0].path, "/v1/storefront/digital-products/library");
  assert.equal(calls[1].query.cursor, "opaque-grant-position");
  assert.equal(calls[2].path, "/v1/storefront/digital-products/library/product%2Fencoded");
  assert.equal(calls[2].query.product_id, undefined);
  assert.equal(calls[3].path, "/v1/storefront/digital-products/library/product%2Fencoded/assets");
  assert.equal(calls[3].query.limit, "10");
  assert.equal(calls[3].query.cursor, "protected-file-position");
  assert.equal(calls[4].path, "/v1/storefront/digital-products/product%2Fencoded/assets/asset%2Fencoded/download");
  assert.equal(calls[4].query.reference, "protected-reference");
  for (const absent of ["order_id", "line_item_id", "product_id", "asset_id"]) assert.equal(absent in calls[4].query, false, absent);
});

test("a company's library reads and downloads name the company alone", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/download")
    ? { url: "https://files.example.test/protected", expires_at: 10000, file_name: "guide.pdf", mime_type: "application/pdf" }
    : { items: [], cursor: null });
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: baseUrl, sessionStorage: visitorStorage() });
  const company = { company_id: ids.company };
  await storefront.eshop.library.find({ ...company, limit: 5 });
  await storefront.eshop.library.findAssets({ ...company, product_id: ids.product, limit: 5 });
  await storefront.eshop.library.download({ ...company, product_id: ids.product, asset_id: assetId, reference: "r" });
  assert.deepEqual(calls.map((call) => [call.path, call.query]), [
    ["/v1/storefront/digital-products/library", { company_id: ids.company, limit: "5" }],
    [`/v1/storefront/digital-products/library/${ids.product}/assets`, { company_id: ids.company, limit: "5" }],
    [`/v1/storefront/digital-products/${ids.product}/assets/${assetId}/download`, { company_id: ids.company, reference: "r" }],
  ]);
});

test("library downloads never go to the retired library path", async (context) => {
  const calls = recordFetch(context, () => ({ url: "https://files.example.test/protected", expires_at: 10000, file_name: "guide.pdf", mime_type: "application/pdf" }));
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl: baseUrl, sessionStorage: visitorStorage() });
  await storefront.eshop.library.download({ product_id: ids.product, asset_id: assetId, reference: "r" });
  assert.equal(calls[0].path, `/v1/storefront/digital-products/${ids.product}/assets/${assetId}/download`);
  assert.equal(calls[0].path.startsWith("/v1/storefront/library"), false);
  assert.deepEqual(calls[0].query, { reference: "r" });
});
