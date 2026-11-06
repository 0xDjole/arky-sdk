import type { EmbeddedCheckoutMount, MountCheckoutActionParams } from "../types/embeddedCheckout";
import type { MonriComponentsAction, MonriEnvironment, PaymentRunsOn } from "../types/payment";
import type { MonriBrowserBuyerDetails, MonriBrowserFactory, MonriBuyerDetails } from "../types/monriCheckout";
import { MonriCheckoutError } from "../types/monriCheckout";
import { simulatePayment } from "../paymentSimulator";
import { createSimulatorPanel } from "./simulatorPanel";
import { isRecord } from "../utils/record";

let loaded: { environment: MonriEnvironment; factory: Promise<MonriBrowserFactory> } | undefined;
const origins = { test: "https://ipgtest.monri.com", live: "https://ipg.monri.com" } as const;
const visible = (value: unknown, maximum: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= maximum && /^[\x21-\x7e]+$/.test(value);

function isPaymentRunsOn(value: unknown): value is PaymentRunsOn {
  if (!isRecord(value)) return false;
  if (value.type === "provider") return Object.keys(value).length === 1;
  return value.type === "simulator" && Object.keys(value).length === 2 && typeof value.api_url === "string" && value.api_url.length > 0;
}

export function isMonriComponentsAction(value: unknown): value is MonriComponentsAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const action = value as Record<string, unknown>;
  return Object.keys(action).length === 6 && action.type === "monri_components" &&
    (action.environment === "test" || action.environment === "live") &&
    visible(action.authenticity_token, 512) && visible(action.client_secret, 128) &&
    typeof action.save_card === "boolean" && isPaymentRunsOn(action.runs_on);
}

function loadMonri(environment: MonriEnvironment): Promise<MonriBrowserFactory> {
  if (typeof window === "undefined" || typeof document === "undefined" || window.location.protocol !== "https:") {
    return Promise.reject(new MonriCheckoutError("unavailable", "Monri card entry requires an HTTPS browser page."));
  }
  if (loaded) {
    return loaded.environment === environment ? loaded.factory : Promise.reject(
      new MonriCheckoutError("unavailable", "Use a separate page when switching Monri test and live environments."),
    );
  }
  const url = `${origins[environment]}/dist/components.js`;
  const scripts = Array.from(document.scripts);
  if (scripts.some((script) => Object.values(origins).some((origin) => script.src === `${origin}/dist/components.js`) && script.src !== url)) {
    return Promise.reject(new MonriCheckoutError("unavailable", "A different Monri environment is already loaded."));
  }
  const existing = scripts.find((script) => script.src === url);
  const global = window as Window & { Monri?: MonriBrowserFactory };
  if (global.Monri && !existing) {
    return Promise.reject(new MonriCheckoutError("unavailable", "Monri Components must load from its official origin."));
  }
  const factory = new Promise<MonriBrowserFactory>((resolve, reject) => {
    if (existing && typeof global.Monri === "function") { resolve(global.Monri); return; }
    const script = existing ?? document.createElement("script");
    const finish = () => {
      window.clearTimeout(timeout);
      script.removeEventListener("load", success);
      script.removeEventListener("error", failure);
    };
    const failure = () => {
      finish();
      if (!existing) script.remove();
      reject(new MonriCheckoutError("unavailable", "Monri card entry could not load."));
    };
    const success = () => {
      if (typeof global.Monri !== "function") { failure(); return; }
      finish();
      resolve(global.Monri);
    };
    const timeout = window.setTimeout(failure, 15_000);
    script.addEventListener("load", success);
    script.addEventListener("error", failure);
    if (!existing) {
      script.src = url;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  loaded = { environment, factory };
  void factory.catch(() => { if (loaded?.factory === factory) loaded = undefined; });
  return factory;
}

function buyerDetails(value: MonriBuyerDetails): MonriBrowserBuyerDetails {
  const bounds = { full_name: [3, 30], address: [3, 100], city: [3, 30], zip: [3, 9], phone: [3, 30], country: [2, 3], email: [3, 100] } as const;
  for (const field of Object.keys(bounds) as (keyof MonriBuyerDetails)[]) {
    const input = value[field];
    const [minimum, maximum] = bounds[field];
    if (typeof input !== "string" || input !== input.trim() || input.length < minimum || input.length > maximum || /[\u0000-\u001f\u007f]/.test(input)) {
      throw new MonriCheckoutError("invalid_details", `Check the billing ${field} before submitting payment.`);
    }
  }
  return {
    fullName: value.full_name,
    address: value.address,
    city: value.city,
    zip: value.zip,
    phone: value.phone,
    country: value.country,
    email: value.email,
  };
}

function monriContainer(element: string | HTMLElement): HTMLElement {
  const target = typeof element === "string" ? document.querySelector<HTMLElement>(element) : element;
  if (!target || !target.isConnected) throw new MonriCheckoutError("unavailable", "The payment form container is unavailable.");
  return target;
}

function mountSimulatedMonri(
  action: MonriComponentsAction,
  element: string | HTMLElement,
  callbacks: Pick<MountCheckoutActionParams, "onComplete">,
): Extract<EmbeddedCheckoutMount, { type: "monri_components" }> {
  if (typeof document === "undefined") throw new MonriCheckoutError("unavailable", "The test payment form needs a browser page.");
  let disposed = false;
  let submitted = false;
  let chosen: "complete" | "decline" = "complete";
  const panel = createSimulatorPanel(
    monriContainer(element),
    {
      title: "Test payment",
      description: "This payment runs on Arky's provider simulator. No real money moves. Pick the outcome, then submit the payment.",
      choices: [
        { outcome: "complete", label: "Approve" },
        { outcome: "decline", label: "Decline" },
      ],
    },
    (outcome) => {
      chosen = outcome;
      panel.markChosen(outcome);
    },
  );
  panel.markChosen(chosen);
  const destroy = () => { disposed = true; panel.remove(); };
  return {
    type: "monri_components", unmount: destroy, destroy,
    async confirm(details) {
      if (disposed) throw new MonriCheckoutError("unavailable", "The payment form is closed.");
      if (submitted) throw new MonriCheckoutError("already_submitted", "Payment was already submitted. Check the same payment before continuing.");
      buyerDetails(details);
      submitted = true;
      panel.setDisabled(true);
      try {
        await simulatePayment({ simulation: { type: "monri", action, outcome: chosen } });
      } catch {
        throw new MonriCheckoutError("unknown_result", "The payment result could not be confirmed. Check the same ARKY payment; do not start another checkout.");
      }
      if (!disposed) await callbacks.onComplete?.();
    },
  };
}

let monriHostSequence = 0;

export async function mountMonriCheckoutAction(
  action: MonriComponentsAction,
  paymentId: string,
  element: string | HTMLElement,
  callbacks: Pick<MountCheckoutActionParams, "onComplete" | "onValidationError">,
): Promise<Extract<EmbeddedCheckoutMount, { type: "monri_components" }>> {
  if (!isMonriComponentsAction(action) || typeof paymentId !== "string" || !paymentId.length) {
    throw new MonriCheckoutError("invalid_action", "The Monri payment action is invalid.");
  }
  if (action.runs_on.type === "simulator") return mountSimulatedMonri(action, element, callbacks);
  const accepted = { ...action, environment: action.environment as MonriEnvironment, payment_id: paymentId };
  const factory = await loadMonri(accepted.environment);
  const target = monriContainer(element);
  const host = document.createElement("div");
  monriHostSequence += 1;
  host.id = `arky-monri-${monriHostSequence}`;
  target.appendChild(host);
  let disposed = false;
  let submitted = false;
  const destroy = () => { disposed = true; host.remove(); };
  try {
    const monri = factory(accepted.authenticity_token);
    const card = monri.components({ clientSecret: accepted.client_secret }).create("card", {
      tokenizePan: accepted.save_card, tokenizePanOffered: false, showInstallmentsSelection: false,
    });
    card.onChange((event) => {
      if (!disposed) {
        callbacks.onValidationError?.(
          event.error ? new MonriCheckoutError("invalid_card", "Check the card details before submitting payment.") : null,
        );
      }
    });
    card.mount(host.id);
    return {
      type: "monri_components", unmount: destroy, destroy,
      async confirm(details) {
        if (disposed) throw new MonriCheckoutError("unavailable", "The payment form is closed.");
        if (submitted) throw new MonriCheckoutError("already_submitted", "Payment was already submitted. Check the same payment before continuing.");
        const input = buyerDetails(details);
        submitted = true;
        let observed: unknown;
        try {
          observed = await monri.confirmPayment(card, { ...input, orderInfo: `ARKY payment ${accepted.payment_id}` });
        } catch {
          throw new MonriCheckoutError("unknown_result", "The payment result could not be confirmed. Check the same ARKY payment; do not start another checkout.");
        }
        if (!isRecord(observed) || observed.error != null || !isRecord(observed.result) ||
          observed.result.order_number !== accepted.payment_id || !["approved", "declined"].includes(String(observed.result.status))) {
          throw new MonriCheckoutError("unknown_result", "The payment result needs checking on the same ARKY payment.");
        }
        if (!disposed) await callbacks.onComplete?.();
      },
    };
  } catch (error) {
    destroy();
    if (error instanceof MonriCheckoutError) throw error;
    throw new MonriCheckoutError("unavailable", "Monri card entry could not be initialized.");
  }
}
