import type { StripeEmbeddedCheckout, StripeEmbeddedCheckoutOptions } from "@stripe/stripe-js";
import type { CheckoutPaymentAction, StoreSubscriptionCheckoutAction } from "./index";
import type { MonriBuyerDetails } from "./monriCheckout";

export type StripeEmbeddedCheckoutAction = Extract<
  CheckoutPaymentAction | StoreSubscriptionCheckoutAction,
  { type: "stripe_embedded_checkout" }
>;

export type EmbeddedCheckoutAction = CheckoutPaymentAction | StoreSubscriptionCheckoutAction;

export interface EmbeddedCheckoutCallbacks {
  onComplete?: StripeEmbeddedCheckoutOptions["onComplete"];
  onValidationError?: (message: string | null) => void;
}

export type EmbeddedCheckoutMount =
  | {
      type: "stripe_embedded_checkout";
      checkout: StripeEmbeddedCheckout;
      unmount(): void;
      destroy(): void;
    }
  | {
      type: "monri_components";
      confirm(details: MonriBuyerDetails): Promise<void>;
      unmount(): void;
      destroy(): void;
    };
