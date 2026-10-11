import type { RequestOptions, RequestSuccessContext } from "../types/httpClient";
import type { CartQuote, CheckoutAcceptance } from "../types/cart";
import type { CartCheckoutRequest, CartCheckoutSubmission, CartCheckoutTransport } from "../types/cartCheckout";
import { CartPresentationChangedError } from "../types/cartCheckout";
import { isCanonicalId } from "../utils/ids";
import {
  clearDurableRequest,
  DurableRequestStorageError,
  durableRequestPayload,
  getOrCreateDurableRequest,
  isDefiniteRefusal,
  readDurableRequest,
  withDurableRequestLock,
} from "../utils/durableRequest";

const label = "Cart checkout";

function storageKey(scope: string): string {
  return `arky:cart-checkout:v4:${encodeURIComponent(scope)}`;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && value === value.trim();
}

function checkoutPayment(value: unknown): CartCheckoutRequest["payment"] | null {
  if (!record(value)) return null;
  if (value.type === "free" && Object.keys(value).length === 1) return { type: "free" };
  if (value.type === "on_account" && isCanonicalId(value.payment_option_id)) {
    return { type: "on_account", payment_option_id: value.payment_option_id };
  }
  if (
    value.type === "payment_option" &&
    isCanonicalId(value.payment_option_id) &&
    (value.return_url === null || text(value.return_url, 2048)) &&
    typeof value.save_payment_method === "boolean" &&
    (value.payment_method_terms_version === null || text(value.payment_method_terms_version, 256)) &&
    (!value.save_payment_method || value.payment_method_terms_version !== null)
  ) {
    return {
      type: "payment_option",
      payment_option_id: value.payment_option_id,
      return_url: value.return_url as string | null,
      save_payment_method: value.save_payment_method,
      payment_method_terms_version: value.payment_method_terms_version as string | null,
    };
  }
  return null;
}

export function cartCheckoutRequest(input: unknown): CartCheckoutRequest {
  const payment = record(input) ? checkoutPayment(input.payment) : null;
  if (
    !record(input) ||
    !isCanonicalId(input.order_id) ||
    !isCanonicalId(input.cart_id) ||
    typeof input.expected_updated_at !== "number" ||
    !Number.isSafeInteger(input.expected_updated_at) ||
    !text(input.presentation_digest, 256) ||
    (input.contact_email !== null && !text(input.contact_email, 320)) ||
    !payment
  ) {
    throw new DurableRequestStorageError(
      "Cart checkout needs the app's order id, the cart id, the cart's updated_at, the reviewed presentation, the contact email or null, and how the order is paid",
    );
  }
  return {
    order_id: input.order_id as string,
    cart_id: input.cart_id as string,
    expected_updated_at: input.expected_updated_at as CartCheckoutRequest["expected_updated_at"],
    presentation_digest: input.presentation_digest as string,
    contact_email: input.contact_email as string | null,
    payment,
  };
}

function isCartQuote(value: unknown): value is CartQuote {
  return (
    record(value) &&
    typeof value.presentation_digest === "string" &&
    value.presentation_digest.length > 0 &&
    Array.isArray(value.lines) &&
    Array.isArray(value.deliveries)
  );
}

export function cartCheckoutPresentationChanged(error: unknown): unknown {
  if (
    !record(error) ||
    error.statusCode !== 409 ||
    error.code !== "COMMERCE.PRESENTATION_CHANGED" ||
    !record(error.response) ||
    !isCartQuote(error.response.quote)
  ) {
    return error;
  }
  return new CartPresentationChangedError(error.response.quote);
}

export function finishCartCheckoutSubmission(
  submission: CartCheckoutSubmission,
  options?: RequestOptions,
): CheckoutAcceptance {
  if (options?.onSuccess && submission.success) {
    const context = submission.success;
    Promise.resolve()
      .then(() => options.onSuccess?.(context))
      .catch(() => {});
  }
  return submission.result;
}

async function submit(
  request: CartCheckoutRequest,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
  onDefiniteRefusal?: () => void,
): Promise<CartCheckoutSubmission> {
  let result: CheckoutAcceptance;
  let success: RequestSuccessContext | undefined;
  try {
    result = await transport.post(request, {
      ...options,
      onSuccess: (context) => {
        success = context;
      },
    });
  } catch (error) {
    if (isDefiniteRefusal(error)) onDefiniteRefusal?.();
    throw cartCheckoutPresentationChanged(error);
  }
  if (record(result) && result.type === "already_member") {
    if (!isCanonicalId(result.customer_group_member_id)) {
      throw new DurableRequestStorageError("Cart checkout did not name the customer group member the buyer already holds");
    }
    return { result, success };
  }
  if (
    !record(result) ||
    result.type !== "placed" ||
    result.order_id !== request.order_id ||
    typeof result.number !== "string" ||
    !record(result.payment_action) ||
    (result.payment_id !== null && !isCanonicalId(result.payment_id))
  ) {
    throw new DurableRequestStorageError("Cart checkout did not return the order it was asked to place");
  }
  const order = await transport.getOrder(result.order_id, { signal: options?.signal });
  if (!record(order) || order.id !== request.order_id || order.source.type !== "cart" || order.source.cart_id !== request.cart_id) {
    throw new DurableRequestStorageError("Cart checkout did not confirm the order placed from this cart");
  }
  return { result, success };
}

export async function withCartMutation<T>(scope: string, operation: () => Promise<T>): Promise<T> {
  if (typeof globalThis.window === "undefined") return operation();
  const key = storageKey(scope);
  return withDurableRequestLock(key, label, async () => {
    if (readDurableRequest(key, label)) {
      throw new DurableRequestStorageError(
        "Recover the unfinished cart checkout before changing the cart or starting another purchase",
      );
    }
    return operation();
  });
}

export async function checkoutCart(
  input: CartCheckoutRequest,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
): Promise<CheckoutAcceptance> {
  const request = cartCheckoutRequest(input);
  return finishCartCheckoutSubmission(await submit(request, transport, options), options);
}

export async function retainCartCheckout(scope: string, input: CartCheckoutRequest): Promise<CartCheckoutRequest> {
  const request = cartCheckoutRequest(input);
  const key = storageKey(scope);
  await withDurableRequestLock(key, label, async () => {
    getOrCreateDurableRequest(key, request, label);
  });
  return request;
}

export async function pendingCartCheckout(scope: string): Promise<CartCheckoutRequest | null> {
  if (typeof globalThis.window === "undefined") return null;
  const key = storageKey(scope);
  return withDurableRequestLock(key, label, async () => {
    const pending = readDurableRequest(key, label);
    return pending ? cartCheckoutRequest(durableRequestPayload(pending)) : null;
  });
}

export async function recoverCartCheckout(
  scope: string,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
): Promise<CheckoutAcceptance | null> {
  if (typeof globalThis.window === "undefined") return null;
  const key = storageKey(scope);
  return withDurableRequestLock(key, label, async () => {
    const pending = readDurableRequest(key, label);
    if (!pending) return null;
    const request = cartCheckoutRequest(durableRequestPayload(pending));
    const submitted = await submit(request, transport, options, () => clearDurableRequest(pending, label));
    clearDurableRequest(pending, label);
    return finishCartCheckoutSubmission(submitted, options);
  });
}
