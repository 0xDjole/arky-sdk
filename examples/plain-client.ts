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

const products = await readAllPages((cursor) => client.eshop.product.find({ catalog_id, include_price: true, limit: 100, cursor }));
const italian = await client.content.entry.find({ collection_id: "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60", limit: 20 }, { locale: "it" });

const created = await client.eshop.cart.create({ id: crypto.randomUUID(), buyer: { type: "customer" }, catalog_id });
const variant_id = "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63";
const cart = await client.eshop.cart.addProduct({
  id: created.cart.id,
  expected_updated_at: created.cart.updated_at,
  product: { id: crypto.randomUUID(), variant_id, quantity: 1, purchase: { type: "catalog" } },
});
const quote = await client.eshop.cart.quote({ id: cart.id, contact_email: "ana@example.com" });
if (quote.ready && quote.suggested_payment_option_id) {
  const accepted = await client.eshop.cart.checkout({
    cart_id: cart.id,
    expected_updated_at: cart.updated_at,
    presentation_digest: quote.presentation_digest,
    contact_email: "ana@example.com",
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
console.log(products.length, italian.items.length);
