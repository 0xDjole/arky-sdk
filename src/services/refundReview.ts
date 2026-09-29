import { requireRequestId } from "../utils/requestId";
import { requireStoreId } from "../utils/storeTarget";
import { validateRefundMoneyOwner } from "./refund";
import type {
  FindMonriRefundReviewEvidenceParams, MonriRefundReviewEvidencePage,
  ProviderNotificationOwner, ProviderNotificationState, RecordedRefundMoney, ReviewMonriRefundParams,
} from "../types/refund";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const id = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
const time = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown, maximum: number): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim() && value.length <= maximum && !/\p{Cc}/u.test(value);

export function snapshotMonriRefundReview(input: ReviewMonriRefundParams): ReviewMonriRefundParams {
  requireStoreId(input.store_id);
  requireRequestId(input.request_id);
  if (!id(input.refund_id) || !id(input.notification_id) || !time(input.expected_updated_at)
    || input.association?.type !== "provider_confirmed" || !text(input.association.reference, 255)
    || !text(input.association.explanation, 2048)) {
    throw new TypeError("Refund review requires the original request, notification, version and explicit provider-confirmed association");
  }
  return {
    store_id: input.store_id, refund_id: input.refund_id, request_id: input.request_id,
    notification_id: input.notification_id, expected_updated_at: input.expected_updated_at,
    association: { type: "provider_confirmed", reference: input.association.reference, explanation: input.association.explanation },
  };
}

export function validateMonriRefundReview(response: RecordedRefundMoney, input: ReviewMonriRefundParams): RecordedRefundMoney {
  validateRefundMoneyOwner(response, input.refund_id, input.store_id);
  const provider = response.refund.provider;
  const result = provider.type === "monri" ? provider.result : null;
  const review = result?.evidence?.type === "reviewed_notification" ? result.evidence.review : null;
  if (!result || !review || review.request_id !== input.request_id || review.notification_id !== input.notification_id
    || review.expected_updated_at !== input.expected_updated_at || !id(review.actor?.account_id)
    || review.association?.type !== input.association.type || review.association.reference !== input.association.reference
    || review.association.explanation !== input.association.explanation || !/^monri:[0-9a-f]{64}$/.test(review.evidence_key)
    || !time(result.observed_at) || result.observed_at <= input.expected_updated_at
    || !time(result.transaction_created_at) || result.transaction_created_at > result.observed_at
    || !text(result.transaction_id, 20) || !/^[1-9][0-9]*$/.test(result.transaction_id) || !time(result.amount) || result.currency !== response.refund.money.currency
    || !id(result.claim?.id) || result.claim.fence !== 1 || !time(result.claim.started_at)
    || !time(result.claim.deadline_at) || result.claim.deadline_at <= result.claim.started_at
    || result.claim.started_at > input.expected_updated_at) {
    throw new Error("Refund review response did not confirm the exact accepted evidence and original claim");
  }
  const effects = response.refund.financial_effects;
  if (result.status === "approved") {
    const effect = effects[0];
    if (result.amount <= 0 || effects.length !== 1 || effect.type !== "sent" || effect.evidence.type !== "monri"
      || effect.evidence.transaction_id !== result.transaction_id || effect.money.amount !== result.amount
      || effect.money.currency !== result.currency || effect.observed_at !== result.observed_at
      || !["succeeded", "unknown"].includes(response.refund.status.type)) {
      throw new Error("Approved refund review did not preserve the actual provider money");
    }
  } else if (result.status !== "declined" || response.refund.status.type !== "rejected" || effects.length !== 0) {
    throw new Error("Declined refund review contained inconsistent financial effects");
  }
  return response;
}

function owner(value: ProviderNotificationOwner): boolean {
  if (!value || typeof value !== "object") return false;
  switch (value.type) {
    case "payment": return id(value.payment_id);
    case "capture": return id(value.payment_id) && id(value.capture_id);
    case "refund": return id(value.payment_id) && id(value.refund_id);
    case "dispute": return id(value.dispute_id);
    case "method": return id(value.payment_method_id);
    case "payment_option": return id(value.payment_option_id);
    case "store_subscription": return id(value.store_subscription_id);
    default: return false;
  }
}

function state(value: ProviderNotificationState, receivedAt: number): boolean {
  if (!value || typeof value !== "object") return false;
  switch (value.type) {
    case "pending": return true;
    case "associated": return owner(value.owner) && time(value.associated_at) && value.associated_at >= receivedAt;
    case "processed": return time(value.processed_at) && value.processed_at >= receivedAt;
    case "unassociated": return time(value.checked_at) && value.checked_at >= receivedAt;
    case "applied": return owner(value.owner) && time(value.applied_at) && value.applied_at >= receivedAt;
    case "review": return (value.owner === null || owner(value.owner)) && time(value.checked_at) && value.checked_at >= receivedAt
      && ["monri_payment_scope_mismatch", "monri_financial_evidence_unresolved", "stripe_financial_facts_mismatch", "stripe_provider_refusal", "stripe_source_scope_mismatch", "stripe_subscription_facts_mismatch"].includes(value.reason);
    default: return false;
  }
}

export function snapshotMonriRefundEvidenceQuery(input: FindMonriRefundReviewEvidenceParams): FindMonriRefundReviewEvidenceParams {
  requireStoreId(input.store_id);
  if (!id(input.refund_id) || input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 25)
    || input.cursor !== undefined && !text(input.cursor, 2048)) {
    throw new TypeError("Refund evidence requires an exact Refund and a bounded page");
  }
  return { store_id: input.store_id, refund_id: input.refund_id, limit: input.limit ?? 25, cursor: input.cursor };
}

export function validateMonriRefundEvidencePage(page: MonriRefundReviewEvidencePage, input: FindMonriRefundReviewEvidenceParams): MonriRefundReviewEvidencePage {
  if (!page || page.refund_id !== input.refund_id || page.store_id !== input.store_id || !id(page.payment_id)
    || !id(page.payment_option_id) || !time(page.refund_updated_at) || !Array.isArray(page.items) || page.items.length > (input.limit ?? 25)
    || page.cursor !== null && (!text(page.cursor, 2048) || page.cursor === input.cursor)) {
    throw new Error("Refund evidence page changed its owner, version or bounds");
  }
  const ids = new Set<string>();
  for (const evidence of page.items) {
    if (!evidence || !id(evidence.notification_id) || ids.has(evidence.notification_id)
      || evidence.store_id !== page.store_id || evidence.payment_id !== page.payment_id || evidence.payment_option_id !== page.payment_option_id
      || !["test", "live"].includes(evidence.environment) || !text(evidence.transaction_id, 20) || !/^[1-9][0-9]*$/.test(evidence.transaction_id)
      || !time(evidence.money?.amount) || !/^[a-z]{3}$/.test(evidence.money.currency)
      || !["approved", "declined"].includes(evidence.status) || !text(evidence.response_code, 32)
      || !time(evidence.transaction_created_at) || !time(evidence.received_at)
      || typeof evidence.matches_dispatch_scope !== "boolean" || !state(evidence.state, evidence.received_at)) {
      throw new Error("Refund evidence contained malformed or foreign provider facts");
    }
    ids.add(evidence.notification_id);
  }
  return page;
}
