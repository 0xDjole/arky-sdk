import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import type { CheckoutPaymentAction, PaymentMethodSetupStart } from "./payment";
import type { StoreSubscriptionPaymentAction } from "./store";
import type { MonriBuyerDetails, MonriCheckoutError } from "./monriCheckout";

export type StripeEmbeddedCheckoutAction = Extract<
  CheckoutPaymentAction | StoreSubscriptionPaymentAction,
  { type: "stripe_embedded_checkout" }
>;

export type EmbeddedCheckoutAction = CheckoutPaymentAction | StoreSubscriptionPaymentAction;

export interface MountCheckoutActionParams {
  action: EmbeddedCheckoutAction;
  element: string | HTMLElement;
  payment_id?: string | null;
  onComplete?: () => void | Promise<void>;
  onValidationError?: (error: MonriCheckoutError | null) => void;
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

export interface MountPaymentMethodSetupParams {
  setup: PaymentMethodSetupStart;
  element: string | HTMLElement;
}

export interface ConfirmPaymentMethodSetupParams {
  return_url: string;
}

export interface PaymentMethodSetupMount {
  confirm(params: ConfirmPaymentMethodSetupParams): Promise<{ type: "completed" | "pending"; setup_intent_id: string }>;
  destroy(): void;
}
