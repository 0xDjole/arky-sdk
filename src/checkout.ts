import { loadStripe } from "@stripe/stripe-js/pure/index.js";
import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import type { EmbeddedCheckoutAction, EmbeddedCheckoutCallbacks, EmbeddedCheckoutMount, StripeEmbeddedCheckoutAction } from "./types/embeddedCheckout";
import { mountMonriCheckoutAction } from "./services/monriCheckout";
export type { EmbeddedCheckoutAction, EmbeddedCheckoutCallbacks, EmbeddedCheckoutMount, StripeEmbeddedCheckoutAction } from "./types/embeddedCheckout";

export interface PaymentMethodSetupMount {
  confirm(returnUrl: string): Promise<{ type: "completed" | "pending"; setup_intent_id: string }>;
  destroy(): void;
}

export async function mountPaymentMethodSetup(
  action: Pick<import("./types/paymentMethod").PaymentMethodSetupStart, "client_secret" | "setup_intent_id" | "publishable_key" | "account_id">,
  location: string | HTMLElement,
): Promise<PaymentMethodSetupMount> {
  if (!action.client_secret || !action.setup_intent_id || !action.publishable_key || !action.account_id || !action.client_secret.startsWith(`${action.setup_intent_id}_secret_`)) throw new Error("Card setup requires its exact confirmation capability");
  const stripe = await loadStripe(action.publishable_key);
  if (!stripe) throw new Error("Stripe.js could not be loaded");
  const elements = stripe.elements({ clientSecret: action.client_secret });
  const payment = elements.create("payment");
  payment.mount(location);
  return {
    async confirm(returnUrl) {
      const submitted = await elements.submit();
      if (submitted.error) throw new Error(submitted.error.message ?? "Card setup details could not be submitted");
      const result = await stripe.confirmSetup({ elements, confirmParams: { return_url: returnUrl }, redirect: "if_required" });
      if (result.error) throw new Error(result.error.message ?? "Card setup could not be confirmed");
      if (!result.setupIntent || result.setupIntent.id !== action.setup_intent_id) throw new Error("Card confirmation returned a different setup");
      return { type: result.setupIntent.status === "succeeded" ? "completed" : "pending", setup_intent_id: result.setupIntent.id };
    },
    destroy: () => payment.destroy(),
  };
}

export async function createStripeEmbeddedCheckout(
  action: StripeEmbeddedCheckoutAction,
  callbacks: EmbeddedCheckoutCallbacks = {},
): Promise<StripeEmbeddedCheckout> {
  const stripe = await loadStripe(action.publishable_key);
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
