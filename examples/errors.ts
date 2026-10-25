import { ArkyApiError, ArkyError, CartPresentationChangedError, isDefiniteRefusal } from "arky-sdk/storefront";
import { arky } from "./setup.js";

export function errorKey(error: unknown): string {
  if (error instanceof CartPresentationChangedError) return `quote_changed:${error.quote.totals.total}`;
  if (error instanceof ArkyApiError) return error.code;
  if (error instanceof ArkyError) return `sdk.${error.name}.${error.code}`;
  if (error instanceof TypeError) return "bug";
  return "failed";
}

try {
  await arky.customer.requestCode({ contact: { email: "ana@example.com", language: "en" } });
} catch (error) {
  console.log(errorKey(error), isDefiniteRefusal(error) ? "change the request first" : "the same request can be sent again");
}
