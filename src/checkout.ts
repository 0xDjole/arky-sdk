import {
  loadStripe,
  type StripeEmbeddedCheckout,
} from "@stripe/stripe-js";
import type { EmbeddedCheckoutAction, EmbeddedCheckoutCallbacks, EmbeddedCheckoutMount, StripeEmbeddedCheckoutAction } from "./types/embeddedCheckout";
import { mountMonriCheckoutAction } from "./services/monriCheckout";
export type { EmbeddedCheckoutAction, EmbeddedCheckoutCallbacks, EmbeddedCheckoutMount, StripeEmbeddedCheckoutAction } from "./types/embeddedCheckout";

export async function createStripeEmbeddedCheckout(
  action: StripeEmbeddedCheckoutAction,
  callbacks: EmbeddedCheckoutCallbacks = {},
): Promise<StripeEmbeddedCheckout> {
  const stripeAccount =
    "connected_account_id" in action
      ? action.connected_account_id
      : action.stripe_account_id;
  const stripe = await loadStripe(
    action.publishable_key,
    stripeAccount ? { stripeAccount } : undefined,
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
  action: EmbeddedCheckoutAction,
  location: string | HTMLElement,
  callbacks: EmbeddedCheckoutCallbacks = {},
): Promise<EmbeddedCheckoutMount | null> {
  if (action.type === "none") return null;
  if (action.type === "monri_components") return mountMonriCheckoutAction(action, location, callbacks);
  const checkout = await createStripeEmbeddedCheckout(action, callbacks);
  checkout.mount(location);
  return {
    type: "stripe_embedded_checkout",
    checkout,
    unmount: () => checkout.unmount(),
    destroy: () => checkout.destroy(),
  };
}
