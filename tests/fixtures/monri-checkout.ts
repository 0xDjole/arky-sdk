import { MonriCheckoutError, mountCheckoutAction } from "arky-sdk";
import type { CheckoutPaymentAction, EmbeddedCheckoutCallbacks, EmbeddedCheckoutMount, MonriBuyerDetails, MonriComponentsAction } from "arky-sdk";
import { mountCheckoutAction as mountStorefront } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type MonriMount = Extract<EmbeddedCheckoutMount, { type: "monri_components" }>;
type StripeMount = Extract<EmbeddedCheckoutMount, { type: "stripe_embedded_checkout" }>;

export type MonriCheckoutContracts = [
  Assert<Equal<Extract<CheckoutPaymentAction, { type: "monri_components" }>, MonriComponentsAction>>,
  Assert<Equal<keyof MonriComponentsAction, "type" | "environment" | "authenticity_token" | "client_secret" | "save_card">>,
  Assert<Missing<MonriComponentsAction, "payment_id" | "expires_at" | "merchant_key">>,
  Assert<Equal<MonriComponentsAction["save_card"], boolean>>,
  Assert<Equal<Parameters<MonriMount["confirm"]>[0], MonriBuyerDetails>>,
  Assert<Missing<MonriMount, "checkout">>,
  Assert<Missing<StripeMount, "confirm">>,
  Assert<Equal<typeof mountCheckoutAction, typeof mountStorefront>>,
  Assert<Equal<Parameters<typeof mountCheckoutAction>[3], string | undefined>>,
  Assert<Equal<NonNullable<Parameters<typeof mountCheckoutAction>[2]>, EmbeddedCheckoutCallbacks>>,
  Assert<Equal<MonriCheckoutError["code"], "invalid_action" | "unavailable" | "invalid_details" | "already_submitted" | "unknown_result">>,
];

export function inspectMount(mount: EmbeddedCheckoutMount): void {
  if (mount.type === "monri_components") {
    void mount.confirm({ fullName: "Test Buyer", address: "Test Street 1", city: "Sarajevo", zip: "71000", phone: "+38761123456", country: "BA", email: "buyer@example.test" });
  } else {
    void mount.checkout;
  }
  mount.destroy();
  mount.unmount();
}

export const invalid = new MonriCheckoutError("invalid_details", "Check billing details");
