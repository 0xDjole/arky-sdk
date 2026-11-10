import { isOrderToken, retainOrderToken } from "../utils/orderToken";
import { reportHookFailure } from "./createHttpClient";
import type { RequestOptions, RequestSuccessContext } from "../types/httpClient";
import type { StorefrontCartQuote, StorefrontCheckoutAcceptance } from "../types/cart";
import type { CartCheckoutRequest, CartCheckoutSubmission, CartCheckoutTransport } from "../types/cartCheckout";
import { CartPresentationChangedError } from "../types/cartCheckout";
import { isCanonicalId } from "../utils/ids";
import { isRecord } from "../utils/record";
import {
  clearDurableRequest,
  DurableRequestError,
  durableRequestKeys,
  durableRequestPayload,
  getOrCreateDurableRequest,
  readDurableRequest,
  refusalClearsKeptRequest,
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
  | { type: "new_cart"; slot: string };

interface KeptCheckout {
  key: string;
  request: CartCheckoutRequest;
}

function text(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum && value === value.trim();
}

function contactEmail(value: unknown): CartCheckoutRequest["contact_email"] | undefined {
  if (value === null) return null;
  if (!isRecord(value) || Object.keys(value).length !== 2 || !text(value.email, 320) || !text(value.language, 35)) return undefined;
  return { email: value.email, language: value.language };
}

function contactName(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function cardTerms(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && new TextEncoder().encode(value).length <= 40_000;
}

function checkoutPayment(value: unknown): CartCheckoutRequest["payment"] | null {
  if (!isRecord(value)) return null;
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
  const payment = isRecord(input) ? checkoutPayment(input.payment) : null;
  const contact = isRecord(input) ? contactEmail(input.contact_email) : undefined;
  const firstName = isRecord(input) ? input.contact_first_name : undefined;
  const lastName = isRecord(input) ? input.contact_last_name : undefined;
  if (
    !isRecord(input) ||
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

function keptCheckouts(scopes: readonly string[]): KeptCheckout[] {
  return scopes.flatMap((scope) => {
    const shared = slotKey(scope, null);
    return [shared, ...durableRequestKeys(`${shared}:`, label)].flatMap((key) => {
      const kept = readDurableRequest(key, label);
      return kept ? [{ key, request: keptCheckout(kept) }] : [];
    });
  });
}

function inSlot(scopes: readonly string[], key: string, slot: string | null): boolean {
  return scopes.some((scope) => key === slotKey(scope, slot));
}

function isCartQuote(value: unknown): value is StorefrontCartQuote {
  return (
    isRecord(value) &&
    typeof value.presentation_digest === "string" &&
    value.presentation_digest.length > 0 &&
    Array.isArray(value.lines) &&
    Array.isArray(value.deliveries)
  );
}

export function cartCheckoutPresentationChanged(error: unknown): unknown {
  if (
    !isRecord(error) ||
    error.statusCode !== 409 ||
    error.code !== "COMMERCE.PRESENTATION_CHANGED" ||
    !isRecord(error.response) ||
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
): StorefrontCheckoutAcceptance {
  if (options?.onSuccess && submission.success) {
    const context = submission.success;
    Promise.resolve()
      .then(() => options.onSuccess?.(context))
      .catch(reportHookFailure);
  }
  return submission.result;
}

async function submit(
  request: CartCheckoutRequest,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
  onDefiniteRefusal?: () => void,
): Promise<CartCheckoutSubmission> {
  let result: StorefrontCheckoutAcceptance;
  let success: RequestSuccessContext | undefined;
  try {
    result = await transport.post(request, {
      ...options,
      onSuccess: (context) => {
        success = context;
      },
    });
  } catch (error) {
    if (refusalClearsKeptRequest(error)) onDefiniteRefusal?.();
    throw cartCheckoutPresentationChanged(error);
  }
  if (isRecord(result) && result.type === "already_member") {
    if (!isCanonicalId(result.package_member_id)) {
      throw new DurableRequestError("answer_mismatch", "Cart checkout did not name the package member the buyer already holds");
    }
    return { result, success };
  }
  if (
    !isRecord(result) ||
    result.type !== "placed" ||
    result.order_id !== request.order_id ||
    typeof result.number !== "string" ||
    !isRecord(result.payment_action) ||
    (result.payment_id !== null && !isCanonicalId(result.payment_id))
  ) {
    throw new DurableRequestError("answer_mismatch", "Cart checkout did not return the order it was asked to place");
  }
  const order = await transport.getOrder(result.order_id, { signal: options?.signal, order_token: request.order_token });
  if (!isRecord(order) || order.id !== request.order_id || order.source.type !== "cart" || order.source.cart_id !== request.cart_id) {
    throw new DurableRequestError("answer_mismatch", "Cart checkout did not confirm the order placed from this cart");
  }
  return { result, success };
}

export async function withCartMutation<T>(
  scopes: readonly string[],
  target: CartMutationTarget,
  operation: () => Promise<T>,
): Promise<T> {
  if (typeof globalThis.window === "undefined") return operation();
  return withDurableRequestLock(slotKey(scopes[0], null), label, async () => {
    const blocked = keptCheckouts(scopes).some(
      (kept) =>
        inSlot(scopes, kept.key, null) ||
        (target.type === "cart" && kept.request.cart_id === target.cart_id) ||
        (target.type === "new_cart" && inSlot(scopes, kept.key, target.slot)),
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
): Promise<StorefrontCheckoutAcceptance> {
  const request = cartCheckoutRequest(input);
  return finishCartCheckoutSubmission(await submit(request, transport, options), options);
}

export async function retainCartCheckout(
  scopes: readonly string[],
  tokenScope: string,
  slot: string | null,
  input: CartCheckoutRequest,
): Promise<CartCheckoutRequest> {
  const request = cartCheckoutRequest(input);
  const key = slotKey(scopes[0], slot);
  await withDurableRequestLock(key, label, async () => {
    const elsewhere = keptCheckouts(scopes).some(
      (kept) =>
        kept.key !== key &&
        (inSlot(scopes, kept.key, null) || inSlot(scopes, kept.key, slot) || kept.request.cart_id === request.cart_id),
    );
    if (elsewhere) throw new DurableRequestError("pending", "Recover the unfinished cart checkout before starting another one");
    getOrCreateDurableRequest(key, request, label);
    retainOrderToken(tokenScope, request.order_id, request.order_token);
  });
  return request;
}

export interface CartCheckoutIds {
  appId(label: string): string;
  appOrderToken(): string;
}

export type CartCheckoutDraft = Omit<CartCheckoutRequest, "order_id" | "order_token">;

function sameCheckout(pending: CartCheckoutRequest, draft: CartCheckoutDraft): boolean {
  const asked = cartCheckoutRequest({ ...draft, order_id: pending.order_id, order_token: pending.order_token });
  return JSON.stringify(asked) === JSON.stringify(pending);
}

export async function checkoutCartWithAppIds(
  scopes: readonly string[],
  tokenScope: string,
  slot: string | null,
  draft: CartCheckoutDraft,
  ids: CartCheckoutIds,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
): Promise<StorefrontCheckoutAcceptance> {
  const pending = await pendingCartCheckout(scopes, slot);
  if (pending && !sameCheckout(pending, draft)) {
    throw new DurableRequestError("pending", "Recover the unfinished cart checkout before starting another one");
  }
  if (!pending) {
    await retainCartCheckout(scopes, tokenScope, slot, { ...draft, order_id: ids.appId("order"), order_token: ids.appOrderToken() });
  }
  const result = await recoverCartCheckout(scopes, slot, transport, options);
  if (!result) throw new DurableRequestError("settled_elsewhere", "The kept cart checkout was settled elsewhere; read the order");
  return result;
}

export async function pendingCartCheckout(scopes: readonly string[], slot: string | null): Promise<CartCheckoutRequest | null> {
  if (typeof globalThis.window === "undefined") return null;
  for (const scope of scopes) {
    const key = slotKey(scope, slot);
    const pending = await withDurableRequestLock(key, label, async () => {
      const kept = readDurableRequest(key, label);
      return kept ? keptCheckout(kept) : null;
    });
    if (pending) return pending;
  }
  return null;
}

export async function recoverCartCheckout(
  scopes: readonly string[],
  slot: string | null,
  transport: CartCheckoutTransport<CartCheckoutRequest>,
  options?: RequestOptions,
): Promise<StorefrontCheckoutAcceptance | null> {
  if (typeof globalThis.window === "undefined") return null;
  for (const scope of scopes) {
    const key = slotKey(scope, slot);
    const recovered = await withDurableRequestLock(key, label, async () => {
      const pending = readDurableRequest(key, label);
      if (!pending) return null;
      const request = keptCheckout(pending);
      const submitted = await submit(request, transport, options, () => clearDurableRequest(pending, label));
      clearDurableRequest(pending, label);
      return finishCartCheckoutSubmission(submitted, options);
    });
    if (recovered) return recovered;
  }
  return null;
}
