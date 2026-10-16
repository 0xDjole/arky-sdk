import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const store = "75669224-5b13-4994-a4a7-98b0d3d90d89";
const product = "52718a47-c06b-49aa-b3a7-1ac29f9756a3";
const variant = "d31aa72d-5d0e-4b7f-b757-aab89c610d27";
const option = "296b1fa0-a628-48c5-8f76-14338a2e2606";

test("product and variant preserve ordered localized options and native validity evidence", async (context) => {
  const calls = recordFetch(context, (_call, index) => index === 1 ? { id: product } : { id: variant, options_valid: false });
  const api = createAdmin({ baseUrl: "https://api.example.test", secretKey: "arky_secret_test" }).eshop;
  const options = [{ id: option, key: "size", label: { en: "Size", bs: "Veličina" },
    values: [{ key: "large", label: { en: "Large" } }, { key: "small", label: { en: "Small" } }] }];
  await api.product.create({ store_id: store, id: product, key: "classic", slugs: {}, blocks: [], options, categories: [] });
  const choices = [{ option_id: option, value_key: "large" }];
  const result = await api.productVariant.create({ store_id: store, id: variant, product_id: product,
    sku: null, blocks: [], options: choices, fulfillment: { type: "none" }, tax_category_id: option });
  assert.deepEqual(calls[0].body.options, options);
  assert.deepEqual(calls[1].body.options, choices);
  assert.deepEqual(calls[1].body.blocks, []);
  assert.equal("attributes" in calls[1].body, false);
  assert.equal("options_valid" in calls[1].body, false);
  assert.equal(result.options_valid, false);
  assert.deepEqual(options[0].values.map((value) => value.key), ["large", "small"]);
});
