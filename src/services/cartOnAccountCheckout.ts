import type { RequestOptions } from "../types/api";
import type { OrderCheckoutResult } from "../types/index";
import type { RequestSuccessContext } from "../types/httpClient";
import type { CartCheckoutSubmission } from "../types/cartCheckout";
import type { CartOnAccountCheckoutRequest, CartOnAccountCheckoutTransport } from "../types/cartOnAccountCheckout";
import { DurableRequestStorageError } from "../utils/durableRequest";
import {
  cartCheckoutPresentationChanged,
  cartCheckoutRequest,
  finishCartCheckoutSubmission,
  pendingCartCheckoutCommand,
  recoverCartCheckoutCommand,
  retainCartCheckoutCommand,
  sameConvertedLines,
} from "./cartCheckout";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const requestKeys = new Set(["id", "request_id", "locale", "presentation_digest", "sources", "payment_option_id", "reason"]);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function cartOnAccountCheckoutRequest(value: unknown): CartOnAccountCheckoutRequest {
  if (!record(value) || Object.keys(value).some((key) => !requestKeys.has(key)) ||
    typeof value.reason !== "string" || value.reason.length === 0 ||
    value.reason !== value.reason.trim() || new TextEncoder().encode(value.reason).length > 2048 ||
    /[\u0000-\u001f\u007f-\u009f]/.test(value.reason)) {
    throw new DurableRequestStorageError("OnAccount Cart Checkout requires an explicit trimmed merchant reason of at most 2048 UTF-8 bytes without control characters");
  }
  const { reason, ...purchase } = value;
  const request = cartCheckoutRequest(purchase);
  return {
    id: request.id,
    request_id: request.request_id,
    locale: request.locale,
    presentation_digest: request.presentation_digest,
    sources: request.sources,
    ...(request.payment_option_id !== undefined ? { payment_option_id: request.payment_option_id } : {}),
    reason,
  };
}

async function submit(
  request: CartOnAccountCheckoutRequest,
  storeId: string,
  accountId: string,
  transport: CartOnAccountCheckoutTransport,
  options?: RequestOptions,
  onDefiniteRejection?: () => void,
): Promise<CartCheckoutSubmission<OrderCheckoutResult>> {
  let result: OrderCheckoutResult;
  let success: RequestSuccessContext | undefined;
  try {
    result = await transport.post(request, { ...options, onSuccess: (context) => { success = context; } });
  } catch (error) {
    if (record(error) && error.statusCode === 400) onDefiniteRejection?.();
    throw cartCheckoutPresentationChanged(error);
  }
  if (!record(result) || typeof result.order_id !== "string" || !uuid.test(result.order_id) ||
    typeof result.number !== "string" || !result.number.length || result.payment !== null ||
    !record(result.payment_action) || result.payment_action.type !== "none" ||
    Object.keys(result.payment_action).length !== 1) {
    throw new DurableRequestStorageError("OnAccount Cart Checkout returned invalid credit purchase evidence");
  }
  const order = await transport.getOrder(result.order_id, { signal: options?.signal });
  const policy = record(order) && record(order.collection_policy) ? order.collection_policy : null;
  const source = record(order) && record(order.source) ? order.source : null;
  const origin = record(order) && record(order.origin) ? order.origin : null;
  const authorization = record(order) && record(order.payment_authorization) ? order.payment_authorization : null;
  const company = record(order) && record(order.company) ? order.company : null;
  const expectedOptions = request.payment_option_id === undefined ? [] : [request.payment_option_id];
  if (!record(order) || order.id !== result.order_id || order.number !== result.number || order.store_id !== storeId ||
    source === null || source.type !== "cart_acceptance" || source.request_id !== request.request_id ||
    typeof source.submission_fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(source.submission_fingerprint) ||
    source.initial_payment_id !== null || source.first_order_terms !== null || !record(source.cart) ||
    source.cart.cart_id !== request.id || source.cart.version !== request.sources.cart.version ||
    !Array.isArray(source.converted_lines) || !sameConvertedLines(source.converted_lines, request) ||
    policy === null || policy.type !== "on_account" || policy.reason !== request.reason ||
    !record(policy.authorized_by) || policy.authorized_by.account_id !== accountId ||
    !record(policy.authorized_by.snapshot) ||
    typeof policy.authorized_by.snapshot.email !== "string" || !policy.authorized_by.snapshot.email.length ||
    !["session", "api_token"].includes(String(policy.authorized_by.snapshot.credential_type)) ||
    origin === null || origin.type !== "admin" || !record(origin.actor) ||
    origin.actor.account_id !== accountId || !record(origin.actor.snapshot) ||
    origin.actor.snapshot.email !== policy.authorized_by.snapshot.email ||
    origin.actor.snapshot.credential_type !== policy.authorized_by.snapshot.credential_type ||
    authorization === null || authorization.accepted_at !== order.accepted_at ||
    !Array.isArray(authorization.allowed_payment_option_ids) ||
    authorization.allowed_payment_option_ids.length !== expectedOptions.length ||
    authorization.allowed_payment_option_ids.some((id, index) => id !== expectedOptions[index]) ||
    !record(authorization.actor) || authorization.actor.type !== "admin" || !record(authorization.actor.actor) ||
    authorization.actor.actor.account_id !== accountId || !record(authorization.actor.actor.snapshot) ||
    authorization.actor.actor.snapshot.email !== policy.authorized_by.snapshot.email ||
    authorization.actor.actor.snapshot.credential_type !== policy.authorized_by.snapshot.credential_type ||
    company === null || !record(company.company_snapshot) ||
    typeof company.company_snapshot.source_company_id !== "string" || !uuid.test(company.company_snapshot.source_company_id) ||
    !record(company.company_location_snapshot) || typeof company.company_location_snapshot.source_company_location_id !== "string" ||
    !uuid.test(company.company_location_snapshot.source_company_location_id) || !record(company.company_location_snapshot.commerce) ||
    typeof company.company_location_snapshot.commerce.payment_terms_id !== "string" ||
    !uuid.test(company.company_location_snapshot.commerce.payment_terms_id) || !record(order.payment_terms) ||
    typeof order.payment_terms.key !== "string" || !order.payment_terms.key.length || !record(order.payment_terms.type) ||
    !["due_on_receipt", "net_days"].includes(String(order.payment_terms.type.type)) ||
    (order.payment_terms.type.type === "net_days" && (!Number.isSafeInteger(order.payment_terms.type.days) ||
      Number(order.payment_terms.type.days) < 1 || Number(order.payment_terms.type.days) > 65535)) ||
    !Number.isSafeInteger(order.accepted_at) || Number(order.accepted_at) < 0 ||
    !Number.isSafeInteger(order.payment_terms.due_at) || Number(order.payment_terms.due_at) < Number(order.accepted_at) ||
    (order.payment_terms.type.type === "due_on_receipt" && order.payment_terms.due_at !== order.accepted_at) ||
    !Array.isArray(order.line_items) || order.line_items.some((line) => !record(line) || line.type === "subscription_plan")) {
    throw new DurableRequestStorageError("OnAccount Cart Checkout did not confirm its exact accepted merchant credit Order");
  }
  return { result, success };
}

export async function checkoutCartOnAccount(
  input: CartOnAccountCheckoutRequest,
  storeId: string,
  accountId: string,
  transport: CartOnAccountCheckoutTransport,
  options?: RequestOptions,
): Promise<OrderCheckoutResult> {
  return finishCartCheckoutSubmission(await submit(cartOnAccountCheckoutRequest(input), storeId, accountId, transport, options), options);
}

export async function retainCartOnAccountCheckout(scope: string, input: CartOnAccountCheckoutRequest): Promise<CartOnAccountCheckoutRequest> {
  const request = cartOnAccountCheckoutRequest(input);
  await retainCartCheckoutCommand(scope, "on_account", request);
  return request;
}

export async function pendingCartOnAccountCheckout(scope: string): Promise<CartOnAccountCheckoutRequest | null> {
  const request = await pendingCartCheckoutCommand(scope, "on_account");
  return request === null ? null : cartOnAccountCheckoutRequest(request);
}

export async function recoverCartOnAccountCheckout(
  scope: string,
  storeId: string,
  accountId: string,
  transport: CartOnAccountCheckoutTransport,
  options?: RequestOptions,
): Promise<OrderCheckoutResult | null> {
  return recoverCartCheckoutCommand(scope, "on_account", (input, onDefiniteRejection) => {
    return submit(cartOnAccountCheckoutRequest(input), storeId, accountId, transport, options, onDefiniteRejection);
  }, options);
}
