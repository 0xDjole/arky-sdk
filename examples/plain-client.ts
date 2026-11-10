import { createOrderToken, createStorefront, readAllPages } from "arky-sdk/storefront";

const client = createStorefront({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, {
  apiUrl: "https://api.arky.io",
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const { items: packages } = await client.eshop.package.find();
const package_id = packages[0]?.id;
if (!package_id) throw new Error("No package is open to this buyer");

const items = await readAllPages((cursor) =>
  client.eshop.packageItem.find({ package_id, include_price: true, selection: { types: ["product"] }, limit: 100, cursor }),
);
const italian = await client.content.entry.find({ collection_id: "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60", limit: 20 }, { locale: "it" });

const [item] = items;
if (!item) throw new Error("The package lists no product");
const { items: choices } = await client.eshop.packageItem.findPrices({ package_item_id: item.package_item_id, package_id });
const [choice] = choices;
if (choice?.sellable.type !== "product_variant") throw new Error("The product has no price in this package");

const created = await client.eshop.cart.create({ id: crypto.randomUUID(), buyer: { type: "customer" }, package_id });
const cart = await client.eshop.cart.addProduct({
  id: created.cart.id,
  expected_updated_at: created.cart.updated_at,
  product: {
    id: crypto.randomUUID(),
    variant_id: choice.sellable.variant_id,
    quantity: 1,
    price: { package_id, package_item_id: item.package_item_id, price_id: choice.price_id },
  },
});
const quote = await client.eshop.cart.quote({ id: cart.id, contact_email: "ana@example.com" });
if (quote.ready && quote.suggested_payment_option_id) {
  const accepted = await client.eshop.cart.checkout({
    cart_id: cart.id,
    expected_updated_at: cart.updated_at,
    presentation_digest: quote.presentation_digest,
    contact_email: { email: "ana@example.com", language: "en" },
    payment: {
      type: "payment_option",
      payment_option_id: quote.suggested_payment_option_id,
      return_url: location.href,
      save_payment_method: false,
      payment_method_terms: null,
    },
  });
  console.log(accepted.type);
}
console.log(items.length, italian.items.length);
