import type {
  SubscriptionCheckoutPayload,
  SubscriptionCheckoutResult,
  SubscriptionCheckoutSelection,
  SubscriptionPurchaseSelection,
} from "../types/subscription";
import {
  clearDurableRequest,
  DurableRequestStorageError,
  getOrCreateDurableRequest,
  withDurableRequestLock,
} from "../utils/durableRequest";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const label = "Subscription Checkout";
const selectionKeys = new Set([
  "audience_id", "membership_id", "company_id", "company_location_id", "market_id",
  "sales_channel_id", "payment_provider_id", "currency", "billing",
]);

function validId(value: unknown): value is string {
  return typeof value === "string" && uuid.test(value);
}

export function subscriptionSelection(input: SubscriptionPurchaseSelection): SubscriptionPurchaseSelection {
  if (!input || Object.keys(input).some((key) => !selectionKeys.has(key)) ||
    !validId(input.audience_id) || !validId(input.membership_id) ||
    [input.company_id, input.company_location_id, input.market_id, input.sales_channel_id, input.payment_provider_id]
      .some((value) => value != null && !validId(value)) ||
    (input.company_location_id != null && input.company_id == null) ||
    !input.billing || Object.keys(input.billing).some((key) => !["type", "interval", "interval_count"].includes(key)) ||
    input.billing.type !== "recurring" || !["month", "year"].includes(input.billing.interval) || input.billing.interval_count !== 1
  ) {
    throw new DurableRequestStorageError("Subscription requires exact purchase selections, not browser prices, payer data or ownership");
  }
  return {
    audience_id: input.audience_id,
    membership_id: input.membership_id,
    company_id: input.company_id ?? null,
    company_location_id: input.company_location_id ?? null,
    market_id: input.market_id ?? null,
    sales_channel_id: input.sales_channel_id ?? null,
    payment_provider_id: input.payment_provider_id ?? null,
    currency: input.currency,
    billing: { type: "recurring", interval: input.billing.interval, interval_count: 1 },
  };
}

export function subscriptionCheckoutPayload(input: SubscriptionCheckoutPayload): SubscriptionCheckoutPayload {
  const selection = subscriptionSelection(input.selection);
  if (!validId(input.request_id) || !validId(selection.market_id) ||
    !validId(selection.sales_channel_id) || !validId(selection.payment_provider_id) ||
    typeof input.presentation_digest !== "string" || !/^[0-9a-f]{64}$/.test(input.presentation_digest) ||
    typeof input.return_url !== "string" || input.return_url.length === 0 || input.return_url.length > 2_048 ||
    input.return_url !== input.return_url.trim()
  ) {
    throw new DurableRequestStorageError("Subscription Checkout requires a retained request UUID and the exact reviewed quote context");
  }
  return {
    request_id: input.request_id,
    selection: selection as SubscriptionCheckoutSelection,
    presentation_digest: input.presentation_digest,
    return_url: input.return_url,
  };
}

function matchingResult(result: SubscriptionCheckoutResult, requestId: string): boolean {
  return result != null && result.request_id === requestId &&
    validId(result.subscription_id) && validId(result.checkout_id) &&
    typeof result.connected_account_id === "string" && /^acct_[A-Za-z0-9_]+$/.test(result.connected_account_id) &&
    typeof result.publishable_key === "string" && result.publishable_key.length > 0 &&
    typeof result.client_secret === "string" && result.client_secret.length > 0 && result.client_secret.length <= 4_096 &&
    Number.isSafeInteger(result.expires_at) && result.expires_at > Date.now();
}

export async function checkoutSubscription(
  scope: string,
  input: SubscriptionCheckoutPayload,
  post: (payload: SubscriptionCheckoutPayload) => Promise<SubscriptionCheckoutResult>,
): Promise<SubscriptionCheckoutResult> {
  const payload = subscriptionCheckoutPayload(input);
  const send = async () => {
    const result = await post(payload);
    if (!matchingResult(result, payload.request_id)) {
      throw new DurableRequestStorageError("Subscription Checkout returned mismatched or invalid request evidence");
    }
    return result;
  };
  if (typeof globalThis.window === "undefined") return send();
  const key = `arky:commerce-subscription-checkout:v1:${encodeURIComponent(scope)}:${payload.selection.membership_id}`;
  return withDurableRequestLock(key, label, async () => {
    const durable = getOrCreateDurableRequest(key, payload, label);
    try {
      const result = await send();
      clearDurableRequest(durable, label);
      return result;
    } catch (error) {
      if (typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 400) {
        clearDurableRequest(durable, label);
      }
      throw error;
    }
  });
}
