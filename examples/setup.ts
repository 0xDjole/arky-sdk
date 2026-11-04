import { createOrderToken, initialize } from "arky-sdk/storefront";

export const arky = initialize("arky_pk_...", {
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const { items: packages } = await arky.eshop.package.find();
const publicPackage = packages.find((candidate) => candidate.key === "public");
if (!publicPackage) throw new Error("The public package is missing");

export const shopPackage = publicPackage;
export const buyer = { type: "customer" } as const;
