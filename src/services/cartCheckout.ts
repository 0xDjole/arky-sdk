import type { RequestOptions } from "../types/api";
import type { OrderCheckoutResult } from "../types/index";
import type { CartCheckoutRequest, CartCheckoutSubmission, CartCheckoutTransport } from "../types/cartCheckout";
import { CartPresentationChangedError } from "../types/cartCheckout";
import type { RequestSuccessContext } from "../types/httpClient";
import type { OrderQuote } from "../types/quote";
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
const requestKeys = new Set(["id", "locale", "presentation_digest", "payment_provider_id", "return_url"]);

function storageKey(scope: string): string {
  return `arky:commerce-cart-checkout:v1:${encodeURIComponent(scope)}`;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validPaymentResult(value: unknown, request: CartCheckoutRequest): boolean {
  if (!record(value) || typeof value.order_id !== "string" || !uuid.test(value.order_id) ||
    typeof value.number !== "string" || !value.number.length || !record(value.payment_action)) return false;
  const action = value.payment_action;
  if (action.type !== "none" && action.type !== "stripe_embedded_checkout") return false;
  if (value.payment === null) return action.type === "none";
  const payment = value.payment;
  if (!record(payment) || typeof payment.id !== "string" || !uuid.test(payment.id) ||
    !record(payment.source) || payment.source.type !== "order" || payment.source.order_id !== value.order_id ||
    !record(payment.provider) || typeof payment.provider.payment_provider_id !== "string" || !uuid.test(payment.provider.payment_provider_id) ||
    (request.payment_provider_id !== undefined && request.payment_provider_id !== payment.provider.payment_provider_id) ||
    !["cash_on_delivery", "stripe_checkout"].includes(String(payment.provider.type)) ||
    !record(payment.status) || !["pending", "requires_action", "processing", "paid", "partially_refunded", "refunded", "cancelled", "expired", "failed", "unknown"].includes(String(payment.status.type)) ||
    !record(payment.amounts) || typeof payment.amounts.currency !== "string" || !/^[a-z]{3}$/.test(payment.amounts.currency) ||
    ![payment.amounts.total, payment.amounts.paid, payment.amounts.refund_pending, payment.amounts.refunded].every((amount) => Number.isSafeInteger(amount) && Number(amount) >= 0)) return false;
  if (action.type === "none") return true;
  return payment.provider.type === "stripe_checkout" && payment.status.type === "requires_action" &&
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

function isOrderQuote(value: unknown): value is OrderQuote {
  return record(value) && typeof value.locale === "string" && value.locale.length > 0 &&
    typeof value.presentation_digest === "string" && /^[0-9a-f]{64}$/.test(value.presentation_digest) &&
    record(value.context) && record(value.money) &&
    [value.product_lines, value.booking_lines, value.digital_lines, value.audience_lines, value.shipping_lines, value.shipping_methods, value.payment_provider_ids].every(Array.isArray);
}

function presentationChanged(error: unknown): unknown {
  if (!record(error) || error.statusCode !== 409 || error.code !== "COMMERCE.PRESENTATION_CHANGED" ||
    !record(error.response) || !record(error.response.quote)) return error;
  const quote = error.response.quote;
  return isOrderQuote(quote) ? new CartPresentationChangedError(quote) : error;
}

export function cartCheckoutRequest(input: unknown): CartCheckoutRequest {
  if (!record(input) || Object.keys(input).some((key) => !requestKeys.has(key)) ||
    typeof input.id !== "string" || !uuid.test(input.id) ||
    typeof input.locale !== "string" || !input.locale.length || input.locale.length > 64 || input.locale !== input.locale.trim() ||
    typeof input.presentation_digest !== "string" || !/^[0-9a-f]{64}$/.test(input.presentation_digest) ||
    (input.payment_provider_id !== undefined && (typeof input.payment_provider_id !== "string" || !uuid.test(input.payment_provider_id))) ||
    (input.return_url !== undefined && (typeof input.return_url !== "string" || input.return_url.length === 0 || input.return_url.length > 2048 || input.return_url !== input.return_url.trim()))
  ) {
    throw new DurableRequestStorageError("Cart Checkout requires an exact Cart UUID and reviewed locale, presentation digest, provider and return URL");
  }
  return {
    id: input.id,
    locale: input.locale,
    presentation_digest: input.presentation_digest,
    ...(input.payment_provider_id !== undefined ? { payment_provider_id: input.payment_provider_id } : {}),
    ...(input.return_url !== undefined ? { return_url: input.return_url } : {}),
  };
}

async function submit<Result extends Pick<OrderCheckoutResult, "order_id" | "number" | "payment_action">>(
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
  const cart = await transport.getCart(request.id, { signal: options?.signal });
  if (!record(cart) || cart.id !== request.id || !record(cart.status) || cart.status.type !== "converted" || cart.converted_order_id !== result.order_id) {
    throw new DurableRequestStorageError("Cart Checkout did not confirm its exact accepted Order");
  }
  return { result, success };
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

export async function checkoutCart<Result extends Pick<OrderCheckoutResult, "order_id" | "number" | "payment_action">>(
  scope: string,
  input: CartCheckoutRequest,
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

export async function recoverCartCheckout<Result extends Pick<OrderCheckoutResult, "order_id" | "number" | "payment_action">>(
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
