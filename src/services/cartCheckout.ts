import { isOrderToken, retainOrderToken } from "../utils/orderToken";
import type { RequestOptions, RequestSuccessContext } from "../types/httpClient";
import type { CartQuote, CheckoutAcceptance } from "../types/cart";
import type { CartCheckoutRequest, CartCheckoutSubmission, CartCheckoutTransport } from "../types/cartCheckout";
import { CartPresentationChangedError } from "../types/cartCheckout";
import { isCanonicalId } from "../utils/ids";
import {
  clearDurableRequest,
  DurableRequestError,
  durableRequestKeys,
  durableRequestPayload,
  getOrCreateDurableRequest,
  isDefiniteRefusal,
  readDurableRequest,
  withDurableRequestLock,
  type DurableRequest,
} from "../utils/durableRequest";

const label = "Cart checkout";

function slotKey(scope: string, slot: string | null): string {
  const shared = `arky:cart-checkout:v5:${encodeURIComponent(scope)}`;
  return slot === null ? shared : `${shared}:${encodeURIComponent(slot)}`;
}

export type CartMutationTarget =
  | { type: "cart"; cart_id: string }
  | { type: "new_cart"; slot: string }
  | { type: "reorder" };

interface KeptCheckout {
  key: string;
  request: CartCheckoutRequest;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && value === value.trim();
}

function contactEmail(value: unknown): CartCheckoutRequest["contact_email"] | undefined {
  if (value === null) return null;
  if (!record(value) || Object.keys(value).length !== 2 || !text(value.email, 320) || !text(value.language, 35)) return undefined;
  return { email: value.email, language: value.language };
}

function contactName(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function cardTerms(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && new TextEncoder().encode(value).length <= 40_000;
}

function checkoutPayment(value: unknown): CartCheckoutRequest["payment"] | null {
  if (!record(value)) return null;
  if (value.type === "free" && Object.keys(value).length === 1) return { type: "free" };
  if (value.type === "on_account" && Object.keys(value).length === 2 && isCanonicalId(value.payment_option_id)) {
    return { type: "on_account", payment_option_id: value.payment_option_id };
  }
  if (
    value.type === "payment_option" &&
    Object.keys(value).length === 5 &&
    isCanonicalId(value.payment_option_id) &&
    (value.return_url === null || text(value.return_url, 2048)) &&
    typeof value.save_payment_method === "boolean" &&
    (value.save_payment_method ? cardTerms(value.payment_method_terms) : value.payment_method_terms === null)
  ) {
    return {
      type: "payment_option",
      payment_option_id: value.payment_option_id,
      return_url: value.return_url as string | null,
      save_payment_method: value.save_payment_method,
      payment_method_terms: value.payment_method_terms as string | null,
    };
  }
  return null;
}

export function cartCheckoutRequest(input: unknown): CartCheckoutRequest {
  const payment = record(input) ? checkoutPayment(input.payment) : null;
  const contact = record(input) ? contactEmail(input.contact_email) : undefined;
  const firstName = record(input) ? input.contact_first_name : undefined;
  const lastName = record(input) ? input.contact_last_name : undefined;
  if (
    !record(input) ||
    !isCanonicalId(input.order_id) ||
    !isOrderToken(input.order_token) ||
    !isCanonicalId(input.cart_id) ||
    typeof input.expected_updated_at !== "number" ||
    !Number.isSafeInteger(input.expected_updated_at) ||
    !text(input.presentation_digest, 256) ||
    contact === undefined ||
    !contactName(firstName) ||
    !contactName(lastName) ||
    !payment
  ) {
    throw new TypeError(
      "Cart checkout needs the app's order id, the cart id, the cart's updated_at, the reviewed presentation, the contact email and language or null, any contact names as text or null, and how the order is paid",
    );
  }
  return {
    order_token: input.order_token as string,
    order_id: input.order_id as string,
    cart_id: input.cart_id as string,
    expected_updated_at: input.expected_updated_at as CartCheckoutRequest["expected_updated_at"],
    presentation_digest: input.presentation_digest as string,
    contact_email: contact,
    ...(firstName !== undefined ? { contact_first_name: firstName } : {}),
    ...(lastName !== undefined ? { contact_last_name: lastName } : {}),
    payment,
  };
}

function keptCheckout(pending: DurableRequest): CartCheckoutRequest {
  try {
    return cartCheckoutRequest(durableRequestPayload(pending));
  } catch {
    throw new DurableRequestError("storage", "The kept cart checkout can't be read; nothing was sent");
  }
}

function keptCheckouts(scope: string): KeptCheckout[] {
  const shared = slotKey(scope, null);
  return [shared, ...durableRequestKeys(`${shared}:`, label)].flatMap((key) => {
    const kept = readDurableRequest(key, label);
    return kept ? [{ key, request: keptCheckout(kept) }] : [];
  });
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
  return new CartPresentationChangedError(error.response.quote, {
    response: error.response,
    method: typeof error.method === "string" ? error.method : undefined,
    url: typeof error.url === "string" ? error.url : undefined,
    requestId: typeof error.requestId === "string" ? error.requestId : undefined,
  });
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
      throw new DurableRequestError("answer_mismatch", "Cart checkout did not name the customer group member the buyer already holds");
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
    throw new DurableRequestError("answer_mismatch", "Cart checkout did not return the order it was asked to place");
  }
  const order = await transport.getOrder(result.order_id, { signal: options?.signal, order_token: request.order_token });
  if (!record(order) || order.id !== request.order_id || order.source.type !== "cart" || order.source.cart_id !== request.cart_id) {
    throw new DurableRequestError("answer_mismatch", "Cart checkout did not confirm the order placed from this cart");
  }
  return { result, success };
}

export async function withCartMutation<T>(
  scope: string,
  target: CartMutationTarget,
  operation: () => Promise<T>,
): Promise<T> {
  if (typeof globalThis.window === "undefined") return operation();
  const shared = slotKey(scope, null);
  return withDurableRequestLock(shared, label, async () => {
    const blocked = keptCheckouts(scope).some(
      (kept) =>
        kept.key === shared ||
        (target.type === "cart" && kept.request.cart_id === target.cart_id) ||
        (target.type === "new_cart" && kept.key === slotKey(scope, target.slot)),
    );
    if (blocked) {
      throw new DurableRequestError(
        "pending",
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

export async function retainCartCheckout(
  scope: string,
  slot: string | null,
  input: CartCheckoutRequest,
): Promise<CartCheckoutRequest> {
  const request = cartCheckoutRequest(input);
  const key = slotKey(scope, slot);
  const shared = slotKey(scope, null);
  await withDurableRequestLock(key, label, async () => {
    const elsewhere = keptCheckouts(scope).some(
      (kept) => kept.key !== key && (kept.key === shared || kept.request.cart_id === request.cart_id),
    );
    if (elsewhere) throw new DurableRequestError("pending", "Recover the unfinished cart checkout before starting another one");
    getOrCreateDurableRequest(key, request, label);
    retainOrderToken(scope, request.order_id, request.order_token);
  });
  return request;
}

export interface CartCheckoutIds {
  newId(label: string): string;
  newOrderToken(): string;
}

export type CartCheckoutDraft = Omit<CartCheckoutRequest, "order_id" | "order_token">;

function sameCheckout(pending: CartCheckoutRequest, draft: CartCheckoutDraft): boolean {
  const asked = cartCheckoutRequest({ ...draft, order_id: pending.order_id, order_token: pending.order_token });
  return JSON.stringify(asked) === JSON.stringify(pending);
}

export async function checkoutCartWithNewIds(
  scope: string,
  slot: string | null,
  draft: CartCheckoutDraft,
  ids: CartCheckoutIds,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
): Promise<CheckoutAcceptance> {
  const pending = await pendingCartCheckout(scope, slot);
  if (pending && !sameCheckout(pending, draft)) {
    throw new DurableRequestError("pending", "Recover the unfinished cart checkout before starting another one");
  }
  if (!pending) {
    await retainCartCheckout(scope, slot, { ...draft, order_id: ids.newId("order"), order_token: ids.newOrderToken() });
  }
  const result = await recoverCartCheckout(scope, slot, transport, options);
  if (!result) throw new DurableRequestError("settled_elsewhere", "The kept cart checkout was settled elsewhere; read the order");
  return result;
}

export async function pendingCartCheckout(scope: string, slot: string | null): Promise<CartCheckoutRequest | null> {
  if (typeof globalThis.window === "undefined") return null;
  const key = slotKey(scope, slot);
  return withDurableRequestLock(key, label, async () => {
    const pending = readDurableRequest(key, label);
    return pending ? keptCheckout(pending) : null;
  });
}

export async function recoverCartCheckout(
  scope: string,
  slot: string | null,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
): Promise<CheckoutAcceptance | null> {
  if (typeof globalThis.window === "undefined") return null;
  const key = slotKey(scope, slot);
  return withDurableRequestLock(key, label, async () => {
    const pending = readDurableRequest(key, label);
    if (!pending) return null;
    const request = keptCheckout(pending);
    const submitted = await submit(request, transport, options, () => clearDurableRequest(pending, label));
    clearDurableRequest(pending, label);
    return finishCartCheckoutSubmission(submitted, options);
  });
}
