import {
  ArkyApiError,
  CartPresentationChangedError,
  CheckoutFlowError,
  CustomerGroupJoinError,
  isDefiniteRefusal,
} from "arky-sdk/storefront";
import { store } from "./quick-start.js";

export function errorText(error: unknown): string {
  if (error instanceof CartPresentationChangedError) return `The order changed; the new total is ${error.quote.totals.total}`;
  if (error instanceof CheckoutFlowError) return `Checkout ${error.code}: ${error.message}`;
  if (error instanceof CustomerGroupJoinError) return `Sign-up ${error.code}: ${error.message}`;
  if (error instanceof ArkyApiError) {
    if (error.code === "GENERAL.VALIDATION_FAILED") return error.validationErrors.map((item) => item.field).join(", ");
    return `${error.statusCode} ${error.code}: ${error.message}`;
  }
  return "Something went wrong; try again";
}

try {
  await store.customer.requestCode({ email: "ana@example.com", language: "en" });
} catch (error) {
  const retry = !isDefiniteRefusal(error);
  console.log(errorText(error), retry ? "the same request can be sent again" : "change the request first");
}
