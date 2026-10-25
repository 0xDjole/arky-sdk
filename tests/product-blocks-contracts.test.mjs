import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const store = "75669224-5b13-4994-a4a7-98b0d3d90d89";
const product = "52718a47-c06b-49aa-b3a7-1ac29f9756a3";
const variant = "d31aa72d-5d0e-4b7f-b757-aab89c610d27";
const taxCategory = "296b1fa0-a628-48c5-8f76-14338a2e2606";

test("a product and its variants describe themselves with blocks only and send exactly the server body", async (context) => {
  const calls = recordFetch(context, (_call, index) => index === 1 ? { id: product } : { id: variant });
  const api = createAdmin({ apiUrl: "https://api.example.test", secretKey: "arky_secret_test" }).eshop;
  const productBlocks = [{ id: "a3f1c6e2-7b84-4d05-9e2a-1c6b8d3f5a70", key: "size", type: "localized_text", value: { en: "Large", bs: "Veliko" } }];
  const variantBlocks = [{ id: "c8e2b4d6-1f37-4a95-8b0c-6d2e9f1a3b57", key: "grams", type: "number", value: 250 }];
  await api.product.create({ store_id: store, id: product, key: "classic", slugs: { en: "classic" }, blocks: productBlocks, categories: [] });
  await api.productVariant.create({ store_id: store, id: variant, product_id: product, sku: "CL-250", blocks: variantBlocks, fulfillment: { type: "none" }, tax_category_id: taxCategory });
  await api.productVariant.update({ store_id: store, id: variant, expected_updated_at: 5, sku: null, blocks: [], fulfillment: { type: "none" }, tax_category_id: taxCategory, status: { type: "active" } });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${store}/products`, { id: product, key: "classic", slugs: { en: "classic" }, blocks: productBlocks, categories: [] }],
    ["POST", `/v1/stores/${store}/product-variants`, { id: variant, product_id: product, sku: "CL-250", blocks: variantBlocks, fulfillment: { type: "none" }, tax_category_id: taxCategory }],
    ["PUT", `/v1/stores/${store}/product-variants/${variant}`, { expected_updated_at: 5, sku: null, blocks: [], fulfillment: { type: "none" }, tax_category_id: taxCategory, status: { type: "active" } }],
  ]);
  for (const call of calls) {
    assert.equal("options" in call.body, false);
    assert.equal("options_valid" in call.body, false);
  }
});
