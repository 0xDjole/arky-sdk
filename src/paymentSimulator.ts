import type { StripeEmbeddedCheckoutAction } from "./types/embeddedCheckout";
import type { CheckoutPaymentAction, MonriComponentsAction, PaymentMethodSetupStart } from "./types/payment";
import { ArkyError } from "./types/apiError";
import { requireId } from "./utils/ids";

export type PaymentSimulation =
  | { type: "stripe_checkout"; action: StripeEmbeddedCheckoutAction; outcome: "complete" | "expire" }
  | { type: "monri"; action: MonriComponentsAction; payment_id: string; attempt_id: string; outcome: "complete" | "decline" }
  | { type: "card_setup"; setup: PaymentMethodSetupStart; outcome: "complete" | "cancel" | "decline" };

export interface SimulatePaymentParams {
  simulator_url: string;
  simulation: PaymentSimulation;
}

export interface SimulatePaymentOptions {
  signal?: AbortSignal;
}

const simulatorSecret = "_secret_emulator";
const notSimulated = "This payment isn't run by the local payment simulator";

export function isSimulatedPayment(value: CheckoutPaymentAction | PaymentMethodSetupStart): boolean {
  const secret = "client_secret" in value ? value.client_secret : null;
  return typeof secret === "string" && secret.endsWith(simulatorSecret);
}

function simulatorOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("The payment simulator address must be a loopback http origin, such as http://127.0.0.1:39090");
  }
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("The payment simulator address must be a loopback http origin, such as http://127.0.0.1:39090");
  }
  return url.origin;
}

function simulatedSession(secret: string | null, shape: RegExp): string {
  if (secret === null || !secret.endsWith(simulatorSecret)) throw new TypeError(notSimulated);
  const session = secret.slice(0, -simulatorSecret.length);
  if (!shape.test(session)) throw new TypeError(notSimulated);
  return session;
}

function requireOutcome(outcome: string, allowed: readonly string[]): string {
  if (!allowed.includes(outcome)) throw new TypeError(`A simulated outcome here is one of ${allowed.join(", ")}`);
  return outcome;
}

function simulatorRequest(simulation: PaymentSimulation): { path: string; body?: string } {
  switch (simulation.type) {
    case "stripe_checkout": {
      const outcome = requireOutcome(simulation.outcome, ["complete", "expire"]);
      const session = simulatedSession(simulation.action.client_secret, /^cs_[A-Za-z0-9_]+$/);
      return { path: `/local/checkout/${encodeURIComponent(session)}/${outcome}` };
    }
    case "monri": {
      const outcome = requireOutcome(simulation.outcome, ["complete", "decline"]);
      const session = simulatedSession(
        simulation.action.client_secret,
        /^monri_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      return {
        path: `/local/monri/payments/${encodeURIComponent(session)}/${outcome}`,
        body: JSON.stringify({
          attempt_id: requireId(simulation.attempt_id, "simulated payment attempt"),
          client_secret: simulation.action.client_secret,
          payment_id: requireId(simulation.payment_id, "payment"),
          authenticity_token: simulation.action.authenticity_token,
          environment: simulation.action.environment,
        }),
      };
    }
    case "card_setup": {
      const outcome = requireOutcome(simulation.outcome, ["complete", "cancel", "decline"]);
      const intent = simulatedSession(simulation.setup.client_secret, /^seti_[A-Za-z0-9_]+$/);
      return { path: `/local/setup/${encodeURIComponent(intent)}/${outcome}` };
    }
  }
}

export async function simulatePayment(params: SimulatePaymentParams, options?: SimulatePaymentOptions): Promise<void> {
  const origin = simulatorOrigin(params.simulator_url);
  const { path, body } = simulatorRequest(params.simulation);
  const deadline = AbortSignal.timeout(20_000);
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body }),
    credentials: "omit",
    redirect: "error",
    signal: options?.signal ? AbortSignal.any([options.signal, deadline]) : deadline,
  });
  if (response.status !== 204) {
    throw new ArkyError("not_confirmed", `The payment simulator didn't confirm the ${params.simulation.outcome} outcome (status ${response.status})`);
  }
}
