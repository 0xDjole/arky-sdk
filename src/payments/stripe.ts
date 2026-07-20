import type {
  Stripe,
  StripeElements,
  StripeElementsOptions,
  StripePaymentElement,
} from "@stripe/stripe-js";

export interface StripeConfirmationTokenControllerConfig {
  publishableKey: string;
  connectedAccountId?: string;
  amount: number;
  currency: string;
  appearance?: StripeElementsOptions["appearance"];
  setupFutureUsage?: "off_session" | "on_session";
}

export interface StripeConfirmationTokenOptions {
  return_url?: string;
  billing_details?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export interface StripeConfirmationTokenResult {
  confirmation_token_id: string;
  return_url?: string;
}

export interface StripeConfirmationTokenController {
  mount(target: string | HTMLElement): void;
  update(input: { amount?: number; currency?: string }): void;
  createConfirmationToken(
    options?: StripeConfirmationTokenOptions,
  ): Promise<StripeConfirmationTokenResult>;
  handleNextAction(clientSecret: string): Promise<void>;
  destroy(): void;
}

type StripeLoader = (
  publishableKey: string,
  options?: { stripeAccount: string },
) => PromiseLike<Stripe | null>;

async function defaultStripeLoader(
  publishableKey: string,
  options?: { stripeAccount: string },
): Promise<Stripe | null> {
  const { loadStripe } = await import("@stripe/stripe-js");
  return loadStripe(publishableKey, options);
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toLowerCase();
}

export async function createStripeConfirmationTokenController(
  config: StripeConfirmationTokenControllerConfig,
  stripeLoader: StripeLoader = defaultStripeLoader,
): Promise<StripeConfirmationTokenController> {
  const stripe = await stripeLoader(
    config.publishableKey,
    config.connectedAccountId
      ? { stripeAccount: config.connectedAccountId }
      : undefined,
  );
  if (!stripe) throw new Error("Stripe failed to initialize");

  let elements = createElements(stripe, config);
  let paymentElement: StripePaymentElement | null = elements.create("payment", {
    layout: "tabs",
  });

  return {
    mount(target) {
      if (!paymentElement) {
        paymentElement = elements.create("payment", { layout: "tabs" });
      }
      paymentElement.mount(target);
    },

    update(input) {
      elements.update({
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency ? { currency: normalizeCurrency(input.currency) } : {}),
      });
    },

    async createConfirmationToken(options = {}) {
      const submitResult = await elements.submit();
      if (submitResult.error) {
        throw new Error(submitResult.error.message || "Payment details are incomplete");
      }

      const tokenInput: Parameters<Stripe["createConfirmationToken"]>[0] = {
        elements,
        params: {
          ...(options.return_url ? { return_url: options.return_url } : {}),
          ...(options.billing_details
            ? { payment_method_data: { billing_details: options.billing_details } }
            : {}),
        },
      };
      const result = await stripe.createConfirmationToken(tokenInput);
      if (result.error) {
        throw new Error(result.error.message || "Payment confirmation token failed");
      }
      if (!result.confirmationToken?.id) {
        throw new Error("Stripe did not return a confirmation token");
      }
      return {
        confirmation_token_id: result.confirmationToken.id,
        return_url: options.return_url,
      };
    },

    async handleNextAction(clientSecret) {
      const result = await stripe.handleNextAction({ clientSecret });
      if (result.error) {
        throw new Error(result.error.message || "Payment authentication failed");
      }
    },

    destroy() {
      paymentElement?.destroy();
      paymentElement = null;
    },
  };
}

function createElements(
  stripe: Stripe,
  config: StripeConfirmationTokenControllerConfig,
): StripeElements {
  return stripe.elements({
    mode: "payment",
    amount: config.amount,
    currency: normalizeCurrency(config.currency),
    paymentMethodCreation: "manual",
    ...(config.appearance ? { appearance: config.appearance } : {}),
    ...(config.setupFutureUsage
      ? { setupFutureUsage: config.setupFutureUsage }
      : {}),
  });
}
