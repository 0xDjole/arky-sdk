import {
  loadStripe,
  type StripeEmbeddedCheckout,
  type StripeEmbeddedCheckoutOptions,
} from "@stripe/stripe-js";
import type { CheckoutPaymentAction } from "./types";

export type StripeEmbeddedCheckoutAction = Extract<
  CheckoutPaymentAction,
  { type: "stripe_embedded_checkout" }
>;

export interface EmbeddedCheckoutMount {
  checkout: StripeEmbeddedCheckout;
  unmount(): void;
  destroy(): void;
}

export interface EmbeddedCheckoutCallbacks {
  onComplete?: StripeEmbeddedCheckoutOptions["onComplete"];
}

export async function createStripeEmbeddedCheckout(
  action: StripeEmbeddedCheckoutAction,
  callbacks: EmbeddedCheckoutCallbacks = {},
): Promise<StripeEmbeddedCheckout> {
  const stripe = await loadStripe(
    action.publishable_key,
    action.stripe_account_id
      ? { stripeAccount: action.stripe_account_id }
      : undefined,
  );
  if (!stripe) {
    throw new Error("Stripe.js could not be loaded");
  }
  return stripe.createEmbeddedCheckoutPage({
    clientSecret: action.client_secret,
    onComplete: callbacks.onComplete,
  });
}

export async function mountCheckoutAction(
  action: CheckoutPaymentAction,
  location: string | HTMLElement,
  callbacks: EmbeddedCheckoutCallbacks = {},
): Promise<EmbeddedCheckoutMount | null> {
  if (action.type === "none") return null;
  const checkout = await createStripeEmbeddedCheckout(action, callbacks);
  checkout.mount(location);
  return {
    checkout,
    unmount: () => checkout.unmount(),
    destroy: () => checkout.destroy(),
  };
}
