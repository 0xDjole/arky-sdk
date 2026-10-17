import { initialize, readAllPages } from "arky-sdk/storefront";
import { createOrderToken } from "arky-sdk/utils";

export const store = initialize("arky_pk_...", {
  locale: "en",
  market: "us",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const [catalog] = await store.eshop.catalog.find();
const retail = store.eshop.carts.for({ buyer: { type: "customer" }, catalog_id: catalog.id });
await retail.load();

const companyId = "f581728f-8a86-4598-b27b-ef5ea7636277";
const wholesale = store.eshop.carts.for({
  buyer: { type: "company", company_id: companyId, purchase_order_number: null },
  catalog_id: catalog.id,
});
await wholesale.ensure();

const products = await readAllPages((cursor) =>
  store.client.eshop.product.find({ catalog_id: catalog.id, include_price: true, limit: 100, ...(cursor ? { cursor } : {}) }),
);
const italian = await store.content.entry.find({ collection_id: "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60", limit: 20 }, { locale: "it" });
console.log(products.length, italian.items.length, retail.item_count.get(), wholesale.item_count.get());
