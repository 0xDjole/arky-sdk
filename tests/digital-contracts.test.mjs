import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-digital-contract";
const publishableKey = `arky_pk_${"d".repeat(42)}A`;
const visitorToken = `customer_visitor_${"d".repeat(64)}`;

function storedVisitorSession(token, customerId = "customer-digital-contract") {
  return JSON.stringify({
    version: 2,
    customer: {
      id: customerId,
      status: "active",
      identities: [],
      classifications: [],
      created_at: 1,
      updated_at: 1,
    },
    session: {
      id: `session-${customerId}`,
      customer_id: customerId,
      status: "active",
      type: "visitor",
      token,
      expires_at: 10_000,
    },
  });
}

test("Digital discovery forwards catalog price filters, ordering and opaque continuation", async () => {
  const storefront = createStorefront(publishableKey, { apiUrl: baseUrl, market: "us", locale: "en" });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(new URL(url));
    return jsonResponse({ items: [], cursor: "opaque-next" });
  };
  const params = {
    query: "Košulja linen",
    price_filter: { min_amount: 0, max_amount: 500, quantity: 1 },
    sort_field: "price", sort_direction: "desc", limit: 20, cursor: "opaque-current",
    company_id: "7b9a5793-561f-4655-8f6b-42f5d6ded326",
    company_location_id: "8f9a5793-561f-4655-8f6b-42f5d6ded327", include_price: true,
  };
  try {
    assert.deepEqual(await storefront.eshop.digital.find(params), { items: [], cursor: "opaque-next" });
    await storefront.eshop.digital.get({ identifier: "guide", company_id: params.company_id, company_location_id: params.company_location_id, include_price: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
  const query = calls[0].searchParams;
  assert.equal(query.get("query"), params.query);
  assert.equal(query.get("sort_field"), "price");
  assert.equal(query.get("sort_direction"), "desc");
  assert.equal(query.get("cursor"), "opaque-current");
  assert.deepEqual(JSON.parse(query.get("price_filter")), params.price_filter);
  assert.equal(query.get("company_location_id"), params.company_location_id);
  assert.equal(calls[1].searchParams.get("company_location_id"), params.company_location_id);
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function visitorStorage() {
  return {
    getItem: () => storedVisitorSession(visitorToken),
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
  const create = {
    key: "digital-product-key",
    name_block_id: "32a0602a-9d84-4e6c-9e84-fb6801f8d898",
    slugs: { en: "digital-product" },
    blocks: [],
    classifications: [],
    asset_ids: [],
    tax_category_id: null,
    status: { type: "draft" },
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
    status: { type: "active" },
    tax_category_id: null,
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
    status: { type: "active" },
    created_at: 3,
    updated_at: 3,
  };
  const archivedAsset = { ...asset, status: { type: "archived" }, updated_at: 4 };
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
      status: "active",
      query: 25,
      limit: 10,
      cursor: "product-cursor",
      sort_field: "key",
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
    tax_category_id: null,
  });
  assert.equal("slug" in calls[0].body, false);
  assert.equal("prices" in calls[0].body, false);
  assert.equal("slug" in calls[1].body, false);

  const productQuery = new URL(calls[2].url).searchParams;
  assert.deepEqual(JSON.parse(productQuery.get("ids")), [product.id]);
  assert.deepEqual(JSON.parse(productQuery.get("classification_query")), [
    {
      classification_id: "classification-digital",
      query: [{ type: "boolean", key: "featured", value: true }],
    },
  ]);
  assert.equal(productQuery.has("match_all"), false);
  assert.equal(productQuery.get("status"), "active");
  assert.equal(productQuery.get("query"), "25");
  assert.equal(productQuery.get("limit"), "10");
  assert.equal(productQuery.get("cursor"), "product-cursor");
  assert.equal(productQuery.get("sort_field"), "key");
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

test("Digital library retains empty-page continuation and explicit Company context on every access read", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl: baseUrl, market: "us", locale: "en", sessionStorage: visitorStorage(),
  });
  const calls = [];
  const responses = [
    { items: [], cursor: "opaque-grant-position" },
    { items: [], cursor: null },
    { digital_product_id: "product/encoded", presentation: null, assets: { items: [], cursor: "protected-file-position" } },
    { items: [], cursor: "protected-file-position" },
    { url: "https://files.example.test/protected", expires_at: 10000, file_name: "guide.pdf", mime_type: "application/pdf" },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return jsonResponse(responses.shift());
  };
  const selection = { company_id: "company-id", company_location_id: "branch-id" };
  try {
    const first = await storefront.eshop.digital.library({ ...selection, limit: 1 });
    assert.deepEqual(first, { items: [], cursor: "opaque-grant-position" });
    await storefront.eshop.digital.library({ ...selection, limit: 1, cursor: first.cursor });
    const product = await storefront.eshop.digital.getLibraryProduct({ ...selection, digital_product_id: "product/encoded", limit: 10 });
    assert.equal(product.presentation, null);
    assert.equal(product.assets.cursor, "protected-file-position");
    const files = await storefront.eshop.digital.getLibraryAssets({ ...selection, digital_product_id: "product/encoded", limit: 10, cursor: product.assets.cursor });
    assert.deepEqual(files, { items: [], cursor: "protected-file-position" });
    await storefront.eshop.digital.download({ ...selection, digital_product_id: "product/encoded", asset_id: "asset/encoded", reference: "protected-reference" });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls.length, 5);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.url.searchParams.get("company_id"), selection.company_id);
    assert.equal(call.url.searchParams.get("company_location_id"), selection.company_location_id);
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), "opaque-grant-position");
  assert.equal(calls[2].url.pathname, "/v1/storefront/digital-products/library/product%2Fencoded");
  assert.equal(calls[3].url.pathname, "/v1/storefront/digital-products/library/product%2Fencoded/assets");
  assert.equal(calls[3].url.searchParams.get("limit"), "10");
  assert.equal(calls[3].url.searchParams.get("cursor"), "protected-file-position");
  assert.equal(calls[4].url.pathname, "/v1/storefront/digital-products/product%2Fencoded/assets/asset%2Fencoded/download");
  assert.equal(calls[4].url.searchParams.get("reference"), "protected-reference");
  assert.equal(calls[4].url.searchParams.has("order_id"), false);
  assert.equal(calls[4].url.searchParams.has("line_item_id"), false);
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
    name_block_id: "32a0602a-9d84-4e6c-9e84-fb6801f8d898",
    slugs: { en: "digital-product" },
    blocks: [],
    classifications: [],
    price: null,
    purchase_allowed: true,
  };
  const libraryProduct = {
    digital_product_id: product.id,
    presentation: { digital_product_id: product.id, product_key: product.key, product_name: { text: "Purchased guide", locale: "en" } },
    assets: { items: [{ id: "0198f8f7-2f25-4a14-86bb-64efc56e1a11", file_name: "guide.txt", mime_type: "text/plain", download_reference: "protected-reference" }], cursor: null },
  };
  const calls = [];
  const responses = [product, libraryProduct, { items: [], cursor: null }];
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
