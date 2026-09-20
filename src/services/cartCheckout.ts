import type { RequestOptions } from "../types/api";
import type { OrderCheckoutResult } from "../types/index";
import type {
  CartCheckoutInput,
  CartCheckoutRequest,
  CartCheckoutSubmission,
  CartCheckoutTransport,
} from "../types/cartCheckout";
import { CartPresentationChangedError } from "../types/cartCheckout";
import type { RequestSuccessContext } from "../types/httpClient";
import type { CheckoutQuote } from "../types/checkout";
import { checkoutQuoteSources } from "./checkoutSources";
import {
  clearDurableRequest,
  DurableRequestStorageError,
  durableRequestPayload,
  getOrCreateDurableRequest,
  readDurableRequest,
  withDurableRequestLock,
} from "../utils/durableRequest";

const label = "Cart Checkout";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const requestKeys = new Set(["id", "request_id", "locale", "presentation_digest", "sources", "payment_provider_id", "return_url", "save_payment_method", "payment_method_terms_version"]);

function storageKey(scope: string): string {
  return `arky:commerce-cart-checkout:v1:${encodeURIComponent(scope)}`;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validPaymentResult(value: unknown, request: CartCheckoutRequest): boolean {
  if (!record(value) || typeof value.order_id !== "string" || !uuid.test(value.order_id) ||
    typeof value.checkout_id !== "string" || !uuid.test(value.checkout_id) ||
    typeof value.number !== "string" || !value.number.length || !record(value.payment_action)) return false;
  const action = value.payment_action;
  if (action.type !== "none" && action.type !== "stripe_embedded_checkout") return false;
  if (value.payment === null) return action.type === "none";
  const payment = value.payment;
  if (!record(payment) || typeof payment.id !== "string" || !uuid.test(payment.id) ||
    payment.order_id !== value.order_id ||
    !record(payment.provider) || typeof payment.provider.payment_provider_id !== "string" || !uuid.test(payment.provider.payment_provider_id) ||
    (request.payment_provider_id !== undefined && request.payment_provider_id !== payment.provider.payment_provider_id) ||
    !["cash_on_delivery", "stripe_checkout"].includes(String(payment.provider.type)) ||
    !record(payment.status) || !["pending", "requires_action", "processing", "authorized", "completed", "cancelled", "expired", "failed", "unknown"].includes(String(payment.status.type)) ||
    !record(payment.reconciliation) || !["clear", "hold"].includes(String(payment.reconciliation.type)) ||
    (payment.reconciliation.type === "hold" && (!Number.isSafeInteger(payment.reconciliation.opened_at) || Number(payment.reconciliation.opened_at) < 0)) ||
    !record(payment.amounts) || typeof payment.amounts.currency !== "string" || !/^[a-z]{3}$/.test(payment.amounts.currency) ||
    ![payment.amounts.total, payment.amounts.authorized, payment.amounts.captured, payment.amounts.capture_pending, payment.amounts.refund_pending, payment.amounts.refunded].every((amount) => Number.isSafeInteger(amount) && Number(amount) >= 0) ||
    Number(payment.amounts.total) <= 0) return false;
  if (action.type === "none") return true;
  return payment.provider.type === "stripe_checkout" && payment.status.type === "requires_action" &&
    payment.reconciliation.type === "clear" && payment.checkout_expiration === null &&
    payment.amounts.captured === 0 && payment.amounts.capture_pending === 0 &&
    typeof action.publishable_key === "string" && action.publishable_key.length > 0 && action.publishable_key.length <= 4096 &&
    typeof action.client_secret === "string" && action.client_secret.length > 0 && action.client_secret.length <= 4096 &&
    typeof action.connected_account_id === "string" && /^acct_[A-Za-z0-9_]+$/.test(action.connected_account_id) &&
    Number.isSafeInteger(action.expires_at) && Number(action.expires_at) > Date.now() &&
    action.expires_at === payment.provider.checkout_expires_at;
}

function finish<Result>(submission: CartCheckoutSubmission<Result>, options?: RequestOptions): Result {
  if (options?.onSuccess && submission.success) {
    const context = submission.success;
    Promise.resolve().then(() => options.onSuccess?.(context)).catch(() => {});
  }
  return submission.result;
}

function isCheckoutQuote(value: unknown): value is CheckoutQuote {
  if (!record(value) || typeof value.presentation_digest !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.presentation_digest) || !record(value.order)) return false;
  if (value.sources !== null && (!record(value.sources) ||
    ![value.sources.carts, value.sources.lines, value.sources.delivery_groups].every(Array.isArray))) return false;
  const order = value.order;
  return (order.locale === null || (typeof order.locale === "string" && order.locale.length > 0)) &&
    typeof order.presentation_digest === "string" && /^[0-9a-f]{64}$/.test(order.presentation_digest) &&
    record(order.context) && (order.money === null || record(order.money)) &&
    [order.product_lines, order.booking_lines, order.digital_lines, order.customer_group_lines, order.delivery_groups, order.payment_provider_ids].every(Array.isArray);
}

function presentationChanged(error: unknown): unknown {
  if (!record(error) || error.statusCode !== 409 || error.code !== "COMMERCE.PRESENTATION_CHANGED" ||
    !record(error.response) || !record(error.response.quote)) return error;
  const quote = error.response.quote;
  return isCheckoutQuote(quote) ? new CartPresentationChangedError(quote) : error;
}

function newCheckoutRequestId(): string {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id || !uuid.test(id)) {
    throw new DurableRequestStorageError(
      `Cannot safely start ${label} because UUID-v4 generation is unavailable`,
    );
  }
  return id;
}

export function cartCheckoutRequest(input: unknown): CartCheckoutRequest {
  if (!record(input) || Object.keys(input).some((key) => !requestKeys.has(key)) ||
    typeof input.id !== "string" || !uuid.test(input.id) ||
    (input.request_id !== undefined && (typeof input.request_id !== "string" || !uuid.test(input.request_id))) ||
    typeof input.locale !== "string" || !input.locale.length || input.locale.length > 64 || input.locale !== input.locale.trim() ||
    typeof input.presentation_digest !== "string" || !/^[0-9a-f]{64}$/.test(input.presentation_digest) ||
    (input.payment_provider_id !== undefined && (typeof input.payment_provider_id !== "string" || !uuid.test(input.payment_provider_id))) ||
    (input.return_url !== undefined && (typeof input.return_url !== "string" || input.return_url.length === 0 || input.return_url.length > 2048 || input.return_url !== input.return_url.trim())) ||
    (input.save_payment_method !== undefined && typeof input.save_payment_method !== "boolean") ||
    (input.payment_method_terms_version !== undefined && (typeof input.payment_method_terms_version !== "string" ||
      input.payment_method_terms_version.length === 0 || input.payment_method_terms_version.length > 256 ||
      input.payment_method_terms_version !== input.payment_method_terms_version.trim() || /[\u0000-\u001f\u007f-\u009f]/.test(input.payment_method_terms_version))) ||
    (input.save_payment_method === true && (input.payment_provider_id === undefined || input.payment_method_terms_version === undefined))
  ) {
    throw new DurableRequestStorageError("Cart Checkout requires an exact Cart UUID and reviewed locale, presentation digest, provider and return URL");
  }
  const sources = checkoutQuoteSources(input.sources);
  if (sources.carts.length !== 1 || sources.carts[0].cart_id !== input.id) {
    throw new DurableRequestStorageError("Cart Checkout requires the reviewed source to match this exact Cart");
  }
  return {
    id: input.id,
    request_id: typeof input.request_id === "string" ? input.request_id : newCheckoutRequestId(),
    locale: input.locale,
    presentation_digest: input.presentation_digest,
    sources,
    ...(input.payment_provider_id !== undefined ? { payment_provider_id: input.payment_provider_id } : {}),
    ...(input.return_url !== undefined ? { return_url: input.return_url } : {}),
    ...(input.save_payment_method !== undefined ? { save_payment_method: input.save_payment_method } : {}),
    ...(input.payment_method_terms_version !== undefined ? { payment_method_terms_version: input.payment_method_terms_version } : {}),
  };
}

async function submit<Result extends Pick<OrderCheckoutResult, "checkout_id" | "order_id" | "number" | "payment_action">>(
  request: CartCheckoutRequest,
  transport: CartCheckoutTransport<Result>,
  options?: RequestOptions,
  onDefiniteRejection?: () => void,
): Promise<CartCheckoutSubmission<Result>> {
  let result: Result;
  let success: RequestSuccessContext | undefined;
  try {
    result = await transport.post(request, { ...options, onSuccess: (context) => { success = context; } });
  } catch (error) {
    if (record(error) && error.statusCode === 400) onDefiniteRejection?.();
    throw presentationChanged(error);
  }
  if (!validPaymentResult(result, request)) {
    throw new DurableRequestStorageError("Cart Checkout returned invalid purchase evidence");
  }
  const checkout = await transport.getCheckout(result.checkout_id, { signal: options?.signal });
  if (
    !record(checkout) ||
    checkout.id !== result.checkout_id ||
    checkout.request_id !== request.request_id ||
    !Array.isArray(checkout.carts) || checkout.carts.length !== 1 ||
    !record(checkout.carts[0]) || checkout.carts[0].cart_id !== request.id ||
    checkout.carts[0].version !== request.sources.carts[0].version ||
    !record(checkout.state) || checkout.state.type !== "accepted" ||
    !record(checkout.state.result) || checkout.state.result.order_id !== result.order_id ||
    !Array.isArray(checkout.state.result.bindings) ||
    !sameBindings(checkout.state.result.bindings, request)
  ) {
    throw new DurableRequestStorageError("Cart Checkout did not confirm its exact retained acceptance receipt");
  }
  return { result, success };
}

function sameBindings(bindings: unknown[], request: CartCheckoutRequest): boolean {
  try {
    const actual = checkoutQuoteSources({ ...request.sources, lines: bindings }).lines;
    if (actual.length !== request.sources.lines.length) return false;
    const expected = new Map(request.sources.lines.map((line) => [line.cart_line_item.line_item_id, line]));
    return actual.every((line) => {
      const accepted = expected.get(line.cart_line_item.line_item_id);
      return accepted !== undefined && line.cart_line_item.type === accepted.cart_line_item.type &&
        line.order_line_item.line_item_id === accepted.order_line_item.line_item_id &&
        line.cart_units.quantity === accepted.cart_units.quantity;
    });
  } catch {
    return false;
  }
}

export async function pendingCartCheckout(scope: string): Promise<CartCheckoutRequest | null> {
  if (typeof globalThis.window === "undefined") return null;
  const key = storageKey(scope);
  return withDurableRequestLock(key, label, async () => {
    const pending = readDurableRequest(key, label);
    return pending ? cartCheckoutRequest(durableRequestPayload(pending)) : null;
  });
}

export async function withCartMutation<T>(scope: string, operation: () => Promise<T>): Promise<T> {
  if (typeof globalThis.window === "undefined") return operation();
  const key = storageKey(scope);
  return withDurableRequestLock(key, label, async () => {
    if (readDurableRequest(key, label)) {
      throw new DurableRequestStorageError("Recover the unresolved Cart Checkout before changing the Cart or starting another purchase");
    }
    return operation();
  });
}

export async function checkoutCart<Result extends Pick<OrderCheckoutResult, "checkout_id" | "order_id" | "number" | "payment_action">>(
  scope: string,
  input: CartCheckoutInput,
  transport: CartCheckoutTransport<Result>,
  options?: RequestOptions,
): Promise<Result> {
  const request = cartCheckoutRequest(input);
  if (typeof globalThis.window === "undefined") return finish(await submit(request, transport, options), options);
  const key = storageKey(scope);
  return withDurableRequestLock(key, label, async () => {
    const pending = getOrCreateDurableRequest(key, request, label);
    const result = await submit(request, transport, options, () => clearDurableRequest(pending, label));
    clearDurableRequest(pending, label);
    return finish(result, options);
  });
}

export async function recoverCartCheckout<Result extends Pick<OrderCheckoutResult, "checkout_id" | "order_id" | "number" | "payment_action">>(
  scope: string,
  transport: CartCheckoutTransport<Result>,
  options?: RequestOptions,
): Promise<Result | null> {
  if (typeof globalThis.window === "undefined") return null;
  const key = storageKey(scope);
  return withDurableRequestLock(key, label, async () => {
    const pending = readDurableRequest(key, label);
    if (!pending) return null;
    const request = cartCheckoutRequest(durableRequestPayload(pending));
    const result = await submit(request, transport, options, () => clearDurableRequest(pending, label));
    clearDurableRequest(pending, label);
    return finish(result, options);
  });
}
