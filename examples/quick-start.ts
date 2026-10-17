import { initialize } from "arky-sdk/storefront";
import { createOrderToken, getImageUrl } from "arky-sdk/utils";

export const store = initialize("arky_pk_...", {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const site = await store.content.load({ collection: { key: "website" } });
const info = site.object("info");
console.log(info?.text("title"), getImageUrl(site.media("hero"), "large"));

const catalogs = await store.eshop.catalog.find();
const catalog = catalogs.find((candidate) => candidate.key === "public-eu");
if (!catalog) throw new Error("The public catalog is missing");

const cart = store.eshop.carts.for({ buyer: { type: "customer" }, catalog_id: catalog.id });
await cart.ensure();
await cart.addProduct({ variant_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63", quantity: 1, purchase: { type: "catalog" } });

const form = await store.forms.get({ key: "contact" });
await store.forms.submitByKey({ key: "contact", form, values: { email: "ana@example.com", message: "Hello" }, language: "en" });
