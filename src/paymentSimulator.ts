import type { StripeEmbeddedCheckoutAction } from "./types/embeddedCheckout";
import type { CheckoutPaymentAction, MonriComponentsAction, StorefrontPaymentMethodSetupStart, PaymentRunsOn } from "./types/payment";
import type { StoreCardSetup, StoreSubscriptionPayment } from "./types/store";
import { ArkyError } from "./types/apiError";

export type PaymentSimulation =
  | { type: "stripe_checkout"; action: StripeEmbeddedCheckoutAction; outcome: "complete" | "decline" | "expire" }
  | { type: "stripe_payment_intent"; action: Extract<StoreSubscriptionPayment, { type: "stripe" }>; outcome: "complete" | "decline" }
  | { type: "monri"; action: MonriComponentsAction; outcome: "complete" | "decline" }
  | { type: "card_setup"; setup: StorefrontPaymentMethodSetupStart | StoreCardSetup; outcome: "complete" | "cancel" | "decline" };

export interface SimulatePaymentParams {
  simulation: PaymentSimulation;
}

export interface SimulatePaymentOptions {
  signal?: AbortSignal;
}

interface SimulatorRequest {
  url: string;
  body: { type: PaymentSimulation["type"]; client_secret: string; outcome: string };
}

const notSimulated = "This payment isn't run by Arky's provider simulator";

export function isSimulatedPayment(value: CheckoutPaymentAction | StoreSubscriptionPayment | StorefrontPaymentMethodSetupStart | StoreCardSetup): boolean {
  return "runs_on" in value && value.runs_on.type === "simulator";
}

function simulatorPaymentsUrl(runsOn: PaymentRunsOn | undefined): string {
  if (runsOn?.type !== "simulator" || !runsOn.api_url) throw new TypeError(notSimulated);
  return `${runsOn.api_url}/v1/simulator/payments`;
}

function requireSecret(secret: string | null | undefined): string {
  if (!secret) throw new TypeError(notSimulated);
  return secret;
}

function requireOutcome(outcome: string, allowed: readonly string[]): string {
  if (!allowed.includes(outcome)) throw new TypeError(`A simulated outcome here is one of ${allowed.join(", ")}`);
  return outcome;
}

function simulatorRequest(simulation: PaymentSimulation): SimulatorRequest {
  switch (simulation.type) {
    case "stripe_checkout":
      return {
        url: simulatorPaymentsUrl(simulation.action.runs_on),
        body: {
          type: simulation.type,
          client_secret: requireSecret(simulation.action.client_secret),
          outcome: requireOutcome(simulation.outcome, ["complete", "decline", "expire"]),
        },
      };
    case "stripe_payment_intent":
    case "monri":
      return {
        url: simulatorPaymentsUrl(simulation.action.runs_on),
        body: {
          type: simulation.type,
          client_secret: requireSecret(simulation.action.client_secret),
          outcome: requireOutcome(simulation.outcome, ["complete", "decline"]),
        },
      };
    case "card_setup":
      return {
        url: simulatorPaymentsUrl(simulation.setup.runs_on),
        body: {
          type: simulation.type,
          client_secret: requireSecret(simulation.setup.client_secret),
          outcome: requireOutcome(simulation.outcome, ["complete", "cancel", "decline"]),
        },
      };
  }
}

function notConfirmed(outcome: string, detail: string): ArkyError {
  return new ArkyError("not_confirmed", `The provider simulator didn't confirm the ${outcome} outcome (${detail})`);
}

export async function simulatePayment(params: SimulatePaymentParams, options?: SimulatePaymentOptions): Promise<void> {
  const { url, body } = simulatorRequest(params.simulation);
  const deadline = AbortSignal.timeout(20_000);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      redirect: "error",
      signal: options?.signal ? AbortSignal.any([options.signal, deadline]) : deadline,
    });
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw notConfirmed(body.outcome, "no answer");
  }
  if (response.status !== 204) throw notConfirmed(body.outcome, `status ${response.status}`);
}
