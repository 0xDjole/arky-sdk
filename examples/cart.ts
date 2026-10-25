import { findBlock, getBlockTextValue } from "arky-sdk/storefront";
import { arky, buyer, catalog } from "./setup.js";

export const cart = arky.eshop.cart({ buyer, catalog_id: catalog.id });

cart.item_count.subscribe((count) => console.log("items in the cart", count));
cart.status.subscribe((status) => {
  if (status.error) console.log("show the CMS text for", status.error.code);
});

const product = await arky.eshop.product.get({ slug: "classic", catalog_id: catalog.id });
const { items: choices } = await arky.eshop.catalogItem.findPrices({ catalog_item_id: product.catalog_item_id, catalog_id: catalog.id });
const [choice] = choices;

await cart.ensure();
if (choice?.sellable.type === "product_variant") {
  await cart.addProduct({
    variant_id: choice.sellable.variant_id,
    quantity: 1,
    purchase: { type: "catalog", catalog_item_price_id: choice.catalog_item_price_id },
  });
}

const [line] = cart.product_items.get();
if (line) {
  await cart.setProductQuantity({ line_item_id: line.id, quantity: 2 });
}

const quote = await cart.quote();
const productIds = [...new Set(quote.lines.flatMap((quoted) => (quoted.type === "product" ? [quoted.product_id] : [])))];
const products = await Promise.all(productIds.map((id) => arky.eshop.product.get({ id, catalog_id: catalog.id })));
const rows = quote.lines.flatMap((quoted) => {
  if (quoted.type !== "product") return [];
  const named = products.find((candidate) => candidate.id === quoted.product_id);
  return [
    {
      line_item_id: quoted.line_item_id,
      name: getBlockTextValue(findBlock(named, "name"), "en"),
      sku: quoted.snapshot.variant_sku,
      quantity: quoted.quantity,
    },
  ];
});
console.log(rows, quote.totals.total, quote.currency);

if (line) await cart.removeItem({ line_item_id: line.id });
