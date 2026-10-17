import { createStorefront } from "arky-sdk/storefront";
import { createOrderToken } from "arky-sdk/utils";

export const arky = createStorefront("arky_pk_...", {
  apiUrl: "https://api.arky.io",
  locale: "en",
  market: "eu",
  createVisitorIdentity: () => ({ customer_id: crypto.randomUUID(), session_id: crypto.randomUUID() }),
  createSessionId: () => crypto.randomUUID(),
  createId: () => crypto.randomUUID(),
  createOrderToken,
});

const setup = await arky.getSetup();
console.log(setup.name, setup.languages);
