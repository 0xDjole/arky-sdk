import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import type { CheckoutPaymentAction, StorefrontPaymentMethodSetupStart } from "./payment";
import type { StoreCardSetup } from "./store";
import type { MonriBuyerDetails, MonriCheckoutError } from "./monriCheckout";

export type StripeEmbeddedCheckoutAction = Extract<
  CheckoutPaymentAction,
  { type: "stripe_embedded_checkout" }
>;

export type EmbeddedCheckoutAction = CheckoutPaymentAction;

export interface SimulatorTexts {
  title: string;
  description: string;
  complete: string;
  decline: string;
  expire: string;
  cancel: string;
}

export interface MountCheckoutActionParams {
  action: EmbeddedCheckoutAction;
  element: string | HTMLElement;
  payment_id?: string | null;
  simulator_texts?: SimulatorTexts;
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
    }
  | {
      type: "simulator";
      unmount(): void;
      destroy(): void;
    };

export interface MountPaymentMethodSetupParams {
  setup: StorefrontPaymentMethodSetupStart | StoreCardSetup;
  element: string | HTMLElement;
  simulator_texts?: SimulatorTexts;
}

export interface ConfirmPaymentMethodSetupParams {
  return_url: string;
}

export interface PaymentMethodSetupMount {
  confirm(params: ConfirmPaymentMethodSetupParams): Promise<{ type: "completed" | "pending"; setup_intent_id: string }>;
  destroy(): void;
}
