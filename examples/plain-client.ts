import { createOrderToken, createStorefront, readAllPages } from "arky-sdk/storefront";

const client = createStorefront("arky_pk_...", {
  apiUrl: "https://api.arky.io",
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const { items: catalogs } = await client.eshop.catalog.find();
const catalog_id = catalogs[0]?.id;
if (!catalog_id) throw new Error("No catalog is open to this buyer");

const listings = await readAllPages((cursor) =>
  client.eshop.catalogItem.find({ catalog_id, include_price: true, selection: { types: ["product"] }, limit: 100, cursor }),
);
const italian = await client.content.entry.find({ collection_id: "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60", limit: 20 }, { locale: "it" });

const [listing] = listings;
if (!listing) throw new Error("The catalog lists no product");
const { items: choices } = await client.eshop.catalogItem.findPrices({ catalog_item_id: listing.catalog_item_id, catalog_id });
const [choice] = choices;
if (choice?.sellable.type !== "product_variant") throw new Error("The product has no price in this catalog");

const created = await client.eshop.cart.create({ id: crypto.randomUUID(), buyer: { type: "customer" }, catalog_id });
const cart = await client.eshop.cart.addProduct({
  id: created.cart.id,
  expected_updated_at: created.cart.updated_at,
  product: {
    id: crypto.randomUUID(),
    variant_id: choice.sellable.variant_id,
    quantity: 1,
    purchase: { type: "catalog", catalog_item_price_id: choice.catalog_item_price_id },
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
console.log(listings.length, italian.items.length);
