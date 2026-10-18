import { createOrderToken, initialize } from "arky-sdk/storefront";

export const arky = initialize("arky_pk_...", {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const { items: catalogs } = await arky.eshop.catalog.find();
const publicCatalog = catalogs.find((candidate) => candidate.key === "public-eu");
if (!publicCatalog) throw new Error("The public catalog is missing");

export const catalog = publicCatalog;
export const buyer = { type: "customer" } as const;
