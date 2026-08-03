import type { CheckoutPaymentAction } from "./types";

export type StripeCheckoutAction = Extract<
  CheckoutPaymentAction,
  { type: "stripe_checkout" }
>;

export type MonriFormAction = Extract<
  CheckoutPaymentAction,
  { type: "monri_form" }
>;

function hasBrowser(): boolean {
  return typeof window !== "undefined";
}

function openStripeCheckout(action: StripeCheckoutAction): boolean {
  if (!hasBrowser()) return false;
  window.location.assign(action.url);
  return true;
}

function submitMonriForm(action: MonriFormAction): boolean {
  if (!hasBrowser()) return false;
  const form = window.document.createElement("form");
  form.method = "post";
  form.action = action.url;
  for (const [name, value] of Object.entries(action.fields)) {
    const input = window.document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  }
  window.document.body.append(form);
  form.submit();
  form.remove();
  return true;
}

export function followCheckoutAction(action: CheckoutPaymentAction): boolean {
  switch (action.type) {
    case "stripe_checkout":
      return openStripeCheckout(action);
    case "monri_form":
      return submitMonriForm(action);
    case "none":
      return false;
  }
}
