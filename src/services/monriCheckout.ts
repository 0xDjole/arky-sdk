import type { EmbeddedCheckoutCallbacks, EmbeddedCheckoutMount } from "../types/embeddedCheckout";
import type { MonriEnvironment } from "../types/index";
import type { MonriBrowserFactory, MonriBuyerDetails, MonriComponentsAction } from "../types/monriCheckout";
import { MonriCheckoutError } from "../types/monriCheckout";

let loaded: { environment: MonriEnvironment; factory: Promise<MonriBrowserFactory> } | undefined;
const origins = { test: "https://ipgtest.monri.com", live: "https://ipg.monri.com" } as const;
const visible = (value: unknown, maximum: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= maximum && /^[\x21-\x7e]+$/.test(value);

export function isMonriComponentsAction(value: unknown): value is MonriComponentsAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const action = value as Record<string, unknown>;
  return Object.keys(action).length === 5 && action.type === "monri_components" &&
    typeof action.payment_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(action.payment_id) &&
    (action.environment === "test" || action.environment === "live") &&
    visible(action.authenticity_token, 512) && visible(action.client_secret, 128);
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

function buyerDetails(value: MonriBuyerDetails): MonriBuyerDetails {
  const bounds = { fullName: [3, 30], address: [3, 100], city: [3, 30], zip: [3, 9], phone: [3, 30], country: [2, 3], email: [3, 100] } as const;
  const result = {} as MonriBuyerDetails;
  for (const field of Object.keys(bounds) as (keyof MonriBuyerDetails)[]) {
    const input = value[field];
    const [minimum, maximum] = bounds[field];
    if (typeof input !== "string" || input !== input.trim() || input.length < minimum || input.length > maximum || /[\u0000-\u001f\u007f]/.test(input)) {
      throw new MonriCheckoutError("invalid_details", `Check the billing ${field} before submitting payment.`);
    }
    result[field] = input;
  }
  return result;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function mountMonriCheckoutAction(
  action: MonriComponentsAction,
  location: string | HTMLElement,
  callbacks: EmbeddedCheckoutCallbacks,
): Promise<Extract<EmbeddedCheckoutMount, { type: "monri_components" }>> {
  if (!isMonriComponentsAction(action)) throw new MonriCheckoutError("invalid_action", "The Monri payment action is invalid.");
  const factory = await loadMonri(action.environment);
  const target = typeof location === "string" ? document.querySelector<HTMLElement>(location) : location;
  if (!target || !target.isConnected) throw new MonriCheckoutError("unavailable", "The payment form container is unavailable.");
  const host = document.createElement("div");
  host.id = `arky-monri-${globalThis.crypto.randomUUID()}`;
  target.appendChild(host);
  let disposed = false;
  let submitted = false;
  const destroy = () => { disposed = true; host.remove(); };
  try {
    const monri = factory(action.authenticity_token);
    const card = monri.components({ clientSecret: action.client_secret }).create("card", {
      tokenizePan: false, tokenizePanOffered: false, showInstallmentsSelection: false,
    });
    card.onChange((event) => {
      if (!disposed) callbacks.onValidationError?.(event.error ? "Check the card details before submitting payment." : null);
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
          observed = await monri.confirmPayment(card, { ...input, orderInfo: `ARKY payment ${action.payment_id}` });
        } catch {
          throw new MonriCheckoutError("unknown_result", "The payment result could not be confirmed. Check the same ARKY payment; do not start another checkout.");
        }
        if (!record(observed) || observed.error != null || !record(observed.result) ||
          observed.result.order_number !== action.payment_id || !["approved", "declined"].includes(String(observed.result.status))) {
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
