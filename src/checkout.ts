import {
  loadStripe,
  type StripeEmbeddedCheckout,
  type StripeEmbeddedCheckoutOptions,
} from "@stripe/stripe-js";
import type {
  CheckoutPaymentAction,
  StoreSubscriptionCheckoutAction,
} from "./types";

export type StripeEmbeddedCheckoutAction = Extract<
  CheckoutPaymentAction,
  { type: "stripe_embedded_checkout" }
> |
  Extract<
    StoreSubscriptionCheckoutAction,
    { type: "stripe_embedded_checkout" }
  >;

export type EmbeddedCheckoutAction =
  | CheckoutPaymentAction
  | StoreSubscriptionCheckoutAction;

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
  const checkout = await createStripeEmbeddedCheckout(action, callbacks);
  checkout.mount(location);
  return {
    checkout,
    unmount: () => checkout.unmount(),
    destroy: () => checkout.destroy(),
  };
}
