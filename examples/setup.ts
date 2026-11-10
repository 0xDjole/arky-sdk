import { createOrderToken, initialize } from "arky-sdk/storefront";

export const arky = initialize({ storeId: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19", salesChannelId: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28" }, {
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
