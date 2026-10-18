import { findBlock, getBlockTextValue } from "arky-sdk/storefront";
import { arky, buyer, catalog } from "./setup.js";

export const cart = arky.eshop.cart({ buyer, catalog_id: catalog.id });

cart.item_count.subscribe((count) => console.log("items in the cart", count));
cart.status.subscribe((status) => {
  if (status.error) console.log("show the CMS text for", status.error.code);
});

await cart.ensure();
const filled = await cart.addProduct({ variant_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63", quantity: 1, purchase: { type: "catalog" } });

const [line] = cart.product_items.get();
if (line) {
  await cart.setProductQuantity({ line_item_id: line.id, quantity: 2 });
}

const quote = await cart.quote();
const productIds = [...new Set(quote.lines.flatMap((quoted) => (quoted.type === "product" ? [quoted.product_id] : [])))];
const { items: products } = await arky.eshop.product.find({ ids: productIds, catalog_id: catalog.id, limit: 100 });
const rows = quote.lines.flatMap((quoted) => {
  if (quoted.type !== "product") return [];
  const product = products.find((candidate) => candidate.id === quoted.product_id);
  return [{ line_item_id: quoted.line_item_id, name: getBlockTextValue(findBlock(product, "name"), "en"), quantity: quoted.quantity }];
});
console.log(filled.id, rows, quote.totals.total, quote.currency);

if (line) await cart.removeItem({ line_item_id: line.id });
