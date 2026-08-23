import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-digital-contract";
const publishableKey = `arky_pk_${"d".repeat(42)}A`;
const visitorToken = `arky_vst_${"d".repeat(64)}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function visitorStorage() {
  return {
    getItem: () => visitorToken,
    setItem() {},
    removeItem() {},
  };
}

test("Admin Digital Product and Digital Asset methods use the canonical contracts", async () => {
  const admin = createAdmin({
    baseUrl,
    storeId,
    market: "us",
    apiToken: "arky_api_digital_contract",
  });
  const price = {
    currency: "usd",
    market: "us",
    amount: 2500,
    compare_at: null,
    audience_id: null,
  };
  const create = {
    key: "digital-product-key",
    slugs: { en: "digital-product" },
    blocks: [],
    classifications: [],
    prices: [price],
    asset_ids: [],
    status: "draft",
  };
  const product = {
    id: "0198f8f7-2f25-4a14-86bb-64efc56e1a10",
    store_id: storeId,
    ...create,
    created_at: 1,
    updated_at: 1,
  };
  const update = {
    digital_product_id: product.id,
    slugs: { en: "digital-product-updated" },
    status: "active",
  };
  const updatedProduct = {
    ...product,
    slugs: update.slugs,
    status: update.status,
    updated_at: 2,
  };
  const asset = {
    id: "0198f8f7-2f25-4a14-86bb-64efc56e1a11",
    store_id: storeId,
    file_name: "guide.pdf",
    mime_type: "application/pdf",
    status: "active",
    created_at: 3,
    updated_at: 3,
  };
  const archivedAsset = { ...asset, status: "archived", updated_at: 4 };
  const calls = [];
  const responses = [
    product,
    updatedProduct,
    { items: [updatedProduct], cursor: "next-product" },
    asset,
    { items: [asset], cursor: "next-asset" },
    archivedAsset,
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      headers: new Headers(init.headers),
      body:
        init.body instanceof FormData
          ? init.body
          : init.body
            ? JSON.parse(String(init.body))
            : null,
    });
    return jsonResponse(responses.shift());
  };

  let created;
  let updated;
  let found;
  let uploaded;
  let assets;
  let archived;
  try {
    created = await admin.eshop.digital.product.create(create);
    updated = await admin.eshop.digital.product.update(update);
    found = await admin.eshop.digital.product.find({
      ids: [product.id],
      classification_query: [
        {
          classification_id: "classification-digital",
          query: [{ type: "boolean", key: "featured", value: true }],
        },
      ],
      match_all: true,
      status: "active",
      query: 25,
      limit: 10,
      cursor: "product-cursor",
      sort_field: "price",
      sort_direction: "asc",
      created_at_from: 10,
      created_at_to: 20,
    });
    uploaded = await admin.eshop.digital.asset.upload({
      file: new File(["protected"], "guide.pdf", {
        type: "application/pdf",
      }),
    });
    assets = await admin.eshop.digital.asset.find({
      limit: 25,
      cursor: "asset-cursor",
    });
    archived = await admin.eshop.digital.asset.archive({
      asset_id: asset.id,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(created, product);
  assert.deepEqual(updated, updatedProduct);
  assert.deepEqual(found, { items: [updatedProduct], cursor: "next-product" });
  assert.deepEqual(uploaded, asset);
  assert.deepEqual(assets, { items: [asset], cursor: "next-asset" });
  assert.deepEqual(archived, archivedAsset);
  assert.match(
    uploaded.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );

  assert.deepEqual(
    calls.map((call) => [new URL(call.url).pathname, call.method]),
    [
      [`/v1/stores/${storeId}/digital-products`, "POST"],
      [`/v1/stores/${storeId}/digital-products/${product.id}`, "PUT"],
      [`/v1/stores/${storeId}/digital-products`, "GET"],
      [`/v1/stores/${storeId}/digital-assets`, "POST"],
      [`/v1/stores/${storeId}/digital-assets`, "GET"],
      [`/v1/stores/${storeId}/digital-assets/${asset.id}`, "DELETE"],
    ],
  );
  assert.deepEqual(calls[0].body, create);
  assert.deepEqual(calls[1].body, {
    slugs: update.slugs,
    status: update.status,
  });
  assert.equal("slug" in calls[0].body, false);
  assert.equal("slug" in calls[1].body, false);

  const productQuery = new URL(calls[2].url).searchParams;
  assert.deepEqual(JSON.parse(productQuery.get("ids")), [product.id]);
  assert.deepEqual(JSON.parse(productQuery.get("classification_query")), [
    {
      classification_id: "classification-digital",
      query: [{ type: "boolean", key: "featured", value: true }],
    },
  ]);
  assert.equal(productQuery.get("match_all"), "true");
  assert.equal(productQuery.get("status"), "active");
  assert.equal(productQuery.get("query"), "25");
  assert.equal(productQuery.get("limit"), "10");
  assert.equal(productQuery.get("cursor"), "product-cursor");
  assert.equal(productQuery.get("sort_field"), "price");
  assert.equal(productQuery.get("sort_direction"), "asc");
  assert.equal(productQuery.get("created_at_from"), "10");
  assert.equal(productQuery.get("created_at_to"), "20");

  assert.ok(calls[3].body instanceof FormData);
  const uploadedFile = calls[3].body.get("file");
  assert.ok(uploadedFile instanceof File);
  assert.equal(uploadedFile.name, "guide.pdf");
  assert.equal(uploadedFile.type, "application/pdf");
  assert.equal(
    calls[3].headers.get("authorization"),
    "Bearer arky_api_digital_contract",
  );
  assert.equal(calls[3].headers.get("content-type"), null);

  const assetQuery = new URL(calls[4].url).searchParams;
  assert.equal(assetQuery.get("limit"), "25");
  assert.equal(assetQuery.get("cursor"), "asset-cursor");
  assert.ok(
    calls.every(
      (call) => !new URL(call.url).pathname.includes("/digital-products/assets"),
    ),
  );
});

test("Storefront Digital Product lookup and library routes keep distinct selectors", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl,
    market: "us",
    locale: "en",
    sessionStorage: visitorStorage(),
  });
  const product = {
    id: "0198f8f7-2f25-4a14-86bb-64efc56e1a10",
    key: "digital-product-key",
    slugs: { en: "digital-product" },
    blocks: [],
    classifications: [],
    prices: [
      {
        currency: "usd",
        market: "us",
        amount: 2500,
        compare_at: null,
        audience_id: null,
      },
    ],
  };
  const libraryProduct = {
    digital_product_id: product.id,
    product_key: product.key,
    slugs: product.slugs,
    blocks: [],
    classifications: [],
    asset_ids: ["0198f8f7-2f25-4a14-86bb-64efc56e1a11"],
  };
  const calls = [];
  const responses = [product, libraryProduct, []];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      headers: new Headers(init.headers),
    });
    return jsonResponse(responses.shift());
  };

  let loaded;
  let library;
  try {
    loaded = await storefront.eshop.digital.get({
      identifier: product.key,
    });
    library = await storefront.eshop.digital.getLibraryProduct({
      digital_product_id: product.id,
    });
    await storefront.eshop.digital.getLibraryAssets({
      digital_product_id: product.id,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(loaded, product);
  assert.deepEqual(library, libraryProduct);
  assert.deepEqual(
    calls.map((call) => new URL(call.url).pathname),
    [
      `/v1/storefront/digital-products/${product.key}`,
      `/v1/storefront/digital-products/library/${product.id}`,
      `/v1/storefront/digital-products/library/${product.id}/assets`,
    ],
  );
  assert.ok(
    calls.every(
      (call) =>
        call.headers.get("x-arky-publishable-key") === publishableKey,
    ),
  );
  assert.ok(
    calls.every(
      (call) =>
        call.headers.get("authorization") === `Bearer ${visitorToken}`,
    ),
  );
});
