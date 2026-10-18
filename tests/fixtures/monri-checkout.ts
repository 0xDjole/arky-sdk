import { MonriCheckoutError, mountCheckoutAction } from "arky-sdk";
import type { CheckoutPaymentAction, EmbeddedCheckoutMount, MonriBuyerDetails, MonriComponentsAction, MountCheckoutActionParams } from "arky-sdk";
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
  Assert<Equal<keyof MonriBuyerDetails, "full_name" | "address" | "city" | "zip" | "phone" | "country" | "email">>,
  Assert<Missing<MonriMount, "checkout">>,
  Assert<Missing<StripeMount, "confirm">>,
  Assert<Equal<typeof mountCheckoutAction, typeof mountStorefront>>,
  Assert<Equal<Parameters<typeof mountCheckoutAction>, [MountCheckoutActionParams]>>,
  Assert<Equal<MountCheckoutActionParams["payment_id"], string | null | undefined>>,
  Assert<Equal<MountCheckoutActionParams["element"], string | HTMLElement>>,
  Assert<Equal<NonNullable<MountCheckoutActionParams["onValidationError"]>, (error: MonriCheckoutError | null) => void>>,
  Assert<Equal<MonriCheckoutError["code"], "invalid_action" | "unavailable" | "invalid_card" | "invalid_details" | "already_submitted" | "unknown_result">>,
];

export function inspectMount(mount: EmbeddedCheckoutMount): void {
  if (mount.type === "monri_components") {
    void mount.confirm({ full_name: "Test Buyer", address: "Test Street 1", city: "Sarajevo", zip: "71000", phone: "+38761123456", country: "BA", email: "buyer@example.test" });
  } else {
    void mount.checkout;
  }
  mount.destroy();
  mount.unmount();
}

export const invalid = new MonriCheckoutError("invalid_details", "Check billing details");
