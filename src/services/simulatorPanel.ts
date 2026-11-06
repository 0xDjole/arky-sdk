import { simulatePayment } from "../paymentSimulator";
import type {
  EmbeddedCheckoutMount,
  MountCheckoutActionParams,
  PaymentMethodSetupMount,
  StripeEmbeddedCheckoutAction,
} from "../types/embeddedCheckout";
import type { StorefrontPaymentMethodSetupStart } from "../types/payment";
import { ArkyError } from "../types/apiError";

export interface SimulatorPanelChoice<Outcome extends string> {
  outcome: Outcome;
  label: string;
}

export interface SimulatorPanelContent<Outcome extends string> {
  title: string;
  description: string;
  choices: readonly SimulatorPanelChoice<Outcome>[];
}

export interface SimulatorPanel<Outcome extends string> {
  markChosen(outcome: Outcome): void;
  setDisabled(disabled: boolean): void;
  setError(message: string | null): void;
  remove(): void;
}

const panelStyle = "display:grid;gap:8px;padding:16px;border:1px dashed currentColor;border-radius:8px;color:inherit;font:inherit";
const textStyle = "margin:0";
const choicesStyle = "display:flex;flex-wrap:wrap;gap:8px";
const buttonStyle = "padding:8px 12px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer";

function failureMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The provider simulator didn't confirm this outcome";
}

function panelContainer(element: string | HTMLElement): HTMLElement {
  if (typeof document === "undefined") throw new ArkyError("unavailable", "The test payment form needs a browser page");
  const target = typeof element === "string" ? document.querySelector<HTMLElement>(element) : element;
  if (!target || !target.isConnected) throw new ArkyError("unavailable", "The payment form container is unavailable.");
  return target;
}

export function createSimulatorPanel<Outcome extends string>(
  target: HTMLElement,
  content: SimulatorPanelContent<Outcome>,
  onClick: (outcome: Outcome) => void,
): SimulatorPanel<Outcome> {
  const host = document.createElement("div");
  host.setAttribute("data-arky-simulator-panel", "");
  host.setAttribute("role", "group");
  host.setAttribute("aria-label", content.title);
  host.style.cssText = panelStyle;

  const title = document.createElement("strong");
  title.textContent = content.title;
  host.appendChild(title);

  const description = document.createElement("p");
  description.textContent = content.description;
  description.style.cssText = textStyle;
  host.appendChild(description);

  const choices = document.createElement("div");
  choices.style.cssText = choicesStyle;
  host.appendChild(choices);

  const buttons = content.choices.map((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.label;
    button.setAttribute("data-arky-simulator-outcome", choice.outcome);
    button.style.cssText = buttonStyle;
    button.addEventListener("click", () => onClick(choice.outcome));
    choices.appendChild(button);
    return { outcome: choice.outcome, button };
  });

  const failure = document.createElement("p");
  failure.setAttribute("role", "alert");
  failure.style.cssText = textStyle;
  failure.hidden = true;
  host.appendChild(failure);

  target.appendChild(host);

  return {
    markChosen(outcome) {
      for (const entry of buttons) {
        const chosen = entry.outcome === outcome;
        entry.button.setAttribute("aria-pressed", String(chosen));
        entry.button.style.fontWeight = chosen ? "700" : "400";
        entry.button.style.borderWidth = chosen ? "2px" : "1px";
      }
    },
    setDisabled(disabled) {
      for (const entry of buttons) entry.button.disabled = disabled;
    },
    setError(message) {
      failure.textContent = message ?? "";
      failure.hidden = message === null;
    },
    remove() {
      host.remove();
    },
  };
}

export function mountSimulatedStripeCheckout(
  action: StripeEmbeddedCheckoutAction,
  element: string | HTMLElement,
  onComplete: MountCheckoutActionParams["onComplete"],
): Extract<EmbeddedCheckoutMount, { type: "simulator" }> {
  let disposed = false;

  async function send(outcome: "complete" | "decline" | "expire"): Promise<void> {
    panel.setDisabled(true);
    panel.setError(null);
    try {
      await simulatePayment({ simulation: { type: "stripe_checkout", action, outcome } });
    } catch (error) {
      if (disposed) return;
      panel.setDisabled(false);
      panel.setError(failureMessage(error));
      return;
    }
    if (disposed) return;
    if (outcome === "decline") panel.setDisabled(false);
    await onComplete?.();
  }

  const panel = createSimulatorPanel(
    panelContainer(element),
    {
      title: "Test payment",
      description: "This payment runs on Arky's provider simulator. No real money moves.",
      choices: [
        { outcome: "complete", label: "Pay" },
        { outcome: "decline", label: "Decline" },
        { outcome: "expire", label: "Expire" },
      ],
    },
    (outcome) => void send(outcome),
  );

  const destroy = () => {
    disposed = true;
    panel.remove();
  };

  return { type: "simulator", unmount: destroy, destroy };
}

export function mountSimulatedCardSetup(
  start: StorefrontPaymentMethodSetupStart,
  setupIntentId: string,
  element: string | HTMLElement,
): PaymentMethodSetupMount {
  let disposed = false;
  let chosen: "complete" | "decline" | "cancel" = "complete";

  const panel = createSimulatorPanel(
    panelContainer(element),
    {
      title: "Test card",
      description: "This card setup runs on Arky's provider simulator. No real card is saved and no real money moves. Pick the outcome, then confirm.",
      choices: [
        { outcome: "complete", label: "Save card" },
        { outcome: "decline", label: "Decline" },
        { outcome: "cancel", label: "Cancel" },
      ],
    },
    (outcome) => {
      chosen = outcome;
      panel.markChosen(outcome);
    },
  );
  panel.markChosen(chosen);

  return {
    async confirm() {
      if (disposed) throw new ArkyError("unavailable", "The card form is closed");
      const outcome = chosen;
      panel.setDisabled(true);
      try {
        await simulatePayment({ simulation: { type: "card_setup", setup: start, outcome } });
      } finally {
        if (!disposed) panel.setDisabled(false);
      }
      if (outcome === "decline") throw new ArkyError("declined", "The simulated card was declined");
      return { type: outcome === "complete" ? "completed" : "pending", setup_intent_id: setupIntentId };
    },
    destroy() {
      disposed = true;
      panel.remove();
    },
  };
}
