import { loadStripe } from "@stripe/stripe-js/pure/index.js";
import type {
  EmbeddedCheckoutMount,
  MountCheckoutActionParams,
  MountPaymentMethodSetupParams,
  PaymentMethodSetupMount,
} from "./types/embeddedCheckout";
import type { PaymentMethodSetupStart } from "./types/payment";
import { ArkyError } from "./types/apiError";
import { mountMonriCheckoutAction } from "./services/monriCheckout";
export type {
  ConfirmPaymentMethodSetupParams,
  EmbeddedCheckoutAction,
  EmbeddedCheckoutMount,
  MountCheckoutActionParams,
  MountPaymentMethodSetupParams,
  PaymentMethodSetupMount,
  StripeEmbeddedCheckoutAction,
} from "./types/embeddedCheckout";

function setupIntentId(start: PaymentMethodSetupStart): string {
  const status = start.method.type.type === "stripe" ? start.method.type.status : null;
  if (status && status.type === "requires_action") return status.setup_intent_id;
  const secret = start.client_secret;
  if (!secret) throw new TypeError("Card setup requires its exact confirmation secret");
  const marker = secret.indexOf("_secret_");
  if (marker <= 0) throw new TypeError("Card setup requires its exact confirmation secret");
  return secret.slice(0, marker);
}

async function stripeFor(publishableKey: string) {
  const stripe = await loadStripe(publishableKey);
  if (!stripe) throw new ArkyError("unavailable", "Stripe.js could not be loaded");
  return stripe;
}

export async function mountPaymentMethodSetup(params: MountPaymentMethodSetupParams): Promise<PaymentMethodSetupMount> {
  const start = params.setup;
  if (!start.client_secret || !start.publishable_key) {
    throw new TypeError("Card setup requires its exact confirmation secret and publishable key");
  }
  const expectedSetupIntentId = setupIntentId(start);
  const stripe = await stripeFor(start.publishable_key);
  const elements = stripe.elements({ clientSecret: start.client_secret });
  const payment = elements.create("payment");
  payment.mount(params.element);
  return {
    async confirm(confirmation) {
      const submitted = await elements.submit();
      if (submitted.error) {
        throw new ArkyError("invalid_details", submitted.error.message ?? "Card setup details could not be submitted");
      }
      const result = await stripe.confirmSetup({ elements, confirmParams: { return_url: confirmation.return_url }, redirect: "if_required" });
      if (result.error) throw new ArkyError("declined", result.error.message ?? "Card setup could not be confirmed");
      if (!result.setupIntent || result.setupIntent.id !== expectedSetupIntentId) {
        throw new ArkyError("answer_mismatch", "Card confirmation returned a different setup");
      }
      return {
        type: result.setupIntent.status === "succeeded" ? "completed" : "pending",
        setup_intent_id: result.setupIntent.id,
      };
    },
    destroy: () => payment.destroy(),
  };
}

export async function mountCheckoutAction(params: MountCheckoutActionParams): Promise<EmbeddedCheckoutMount | null> {
  const { action } = params;
  if (action.type === "none") return null;
  if (action.type === "monri_components") {
    if (!params.payment_id) throw new TypeError("Monri card entry needs the payment_id of the payment it pays");
    return mountMonriCheckoutAction(action, params.payment_id, params.element, params);
  }
  const stripe = await stripeFor(action.publishable_key);
  const checkout = await stripe.createEmbeddedCheckoutPage({
    clientSecret: action.client_secret,
    onComplete: params.onComplete,
  });
  checkout.mount(params.element);
  return {
    type: "stripe_embedded_checkout",
    checkout,
    unmount: () => checkout.unmount(),
    destroy: () => checkout.destroy(),
  };
}
