import { loadStripe } from "@stripe/stripe-js/pure/index.js";
import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import type {
  EmbeddedCheckoutAction,
  EmbeddedCheckoutCallbacks,
  EmbeddedCheckoutMount,
  StripeEmbeddedCheckoutAction,
} from "./types/embeddedCheckout";
import type { PaymentMethodSetupStart } from "./types/payment";
import { mountMonriCheckoutAction } from "./services/monriCheckout";
export type {
  EmbeddedCheckoutAction,
  EmbeddedCheckoutCallbacks,
  EmbeddedCheckoutMount,
  StripeEmbeddedCheckoutAction,
} from "./types/embeddedCheckout";

export interface PaymentMethodSetupMount {
  confirm(returnUrl: string): Promise<{ type: "completed" | "pending"; setup_intent_id: string }>;
  destroy(): void;
}

function setupIntentId(start: PaymentMethodSetupStart): string {
  const status = start.method.type.type === "stripe" ? start.method.type.status : null;
  if (status && status.type === "requires_action") return status.setup_intent_id;
  const marker = start.client_secret.indexOf("_secret_");
  if (marker <= 0) throw new Error("Card setup requires its exact confirmation secret");
  return start.client_secret.slice(0, marker);
}

export async function mountPaymentMethodSetup(
  start: PaymentMethodSetupStart,
  location: string | HTMLElement,
): Promise<PaymentMethodSetupMount> {
  if (!start.client_secret || !start.publishable_key) {
    throw new Error("Card setup requires its exact confirmation secret and publishable key");
  }
  const expectedSetupIntentId = setupIntentId(start);
  const stripe = await loadStripe(start.publishable_key);
  if (!stripe) throw new Error("Stripe.js could not be loaded");
  const elements = stripe.elements({ clientSecret: start.client_secret });
  const payment = elements.create("payment");
  payment.mount(location);
  return {
    async confirm(returnUrl) {
      const submitted = await elements.submit();
      if (submitted.error) throw new Error(submitted.error.message ?? "Card setup details could not be submitted");
      const result = await stripe.confirmSetup({ elements, confirmParams: { return_url: returnUrl }, redirect: "if_required" });
      if (result.error) throw new Error(result.error.message ?? "Card setup could not be confirmed");
      if (!result.setupIntent || result.setupIntent.id !== expectedSetupIntentId) {
        throw new Error("Card confirmation returned a different setup");
      }
      return {
        type: result.setupIntent.status === "succeeded" ? "completed" : "pending",
        setup_intent_id: result.setupIntent.id,
      };
    },
    destroy: () => payment.destroy(),
  };
}

export async function createStripeEmbeddedCheckout(
  action: StripeEmbeddedCheckoutAction,
  callbacks: EmbeddedCheckoutCallbacks = {},
): Promise<StripeEmbeddedCheckout> {
  const stripe = await loadStripe(action.publishable_key);
  if (!stripe) throw new Error("Stripe.js could not be loaded");
  return stripe.createEmbeddedCheckoutPage({
    clientSecret: action.client_secret,
    onComplete: callbacks.onComplete,
  });
}

export async function mountCheckoutAction(
  action: EmbeddedCheckoutAction,
  location: string | HTMLElement,
  callbacks: EmbeddedCheckoutCallbacks = {},
  paymentId?: string,
): Promise<EmbeddedCheckoutMount | null> {
  if (action.type === "none") return null;
  if (action.type === "monri_components") {
    if (!paymentId) throw new Error("Monri card entry needs the id of the payment it pays");
    return mountMonriCheckoutAction(action, paymentId, location, callbacks);
  }
  const checkout = await createStripeEmbeddedCheckout(action, callbacks);
  checkout.mount(location);
  return {
    type: "stripe_embedded_checkout",
    checkout,
    unmount: () => checkout.unmount(),
    destroy: () => checkout.destroy(),
  };
}
