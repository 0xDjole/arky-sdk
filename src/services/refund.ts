import type { CreateRefundResponse } from "../types/api";
import type { RefundStatus, RecordedRefundMoney, RecordRefundMoneyParams } from "../types/refund";
import type { Money } from "../types/index";

const refundStatuses: RefundStatus["type"][] = [
  "requested",
  "processing",
  "requires_action",
  "pending",
  "succeeded",
  "rejected",
  "failed",
  "cancelled",
  "unknown",
];

export const validateRefundResponse = (
  response: CreateRefundResponse,
  refundId: string,
  money: Money,
): CreateRefundResponse => {
  if (!response || response.refund_id !== refundId) {
    throw new Error("Refund response did not match the requested refund_id");
  }
  if (
    !response.money ||
    !Number.isSafeInteger(response.money.amount) ||
    response.money.amount !== money.amount ||
    response.money.currency !== money.currency
  ) {
    throw new Error("Refund response did not match the requested money");
  }
  if (
    !response.status ||
    typeof response.status !== "object" ||
    Array.isArray(response.status) ||
    Object.keys(response.status).length !== 1 ||
    !refundStatuses.includes(response.status.type)
  ) {
    throw new Error("Refund response contained an invalid status");
  }
  return response;
};

export function validateRefundMoneyOwner(response: RecordedRefundMoney, refundId: string, storeId: string): RecordedRefundMoney {
  const refund = response?.refund;
  const payment = response?.payment;
  if (!refund || refund.id !== refundId || refund.store_id !== storeId ||
    !payment || payment.id !== refund.payment_id || payment.order_id !== refund.order_id || payment.store_id !== storeId ||
    !refund.money || payment.amounts?.currency !== refund.money.currency || response.financial_summary?.currency !== refund.money.currency ||
    !response.money || ![response.money.sent, response.money.returned, response.money.refunded, response.money.refund_pending].every(
      (money) => money?.currency === refund.money.currency && Number.isSafeInteger(money?.amount) && money.amount >= 0) ||
    !Array.isArray(refund.financial_effects)) {
    throw new Error("Refund money response did not match its exact financial owners");
  }
  return response;
}

export function validateRecordedRefundMoney(response: RecordedRefundMoney, request: RecordRefundMoneyParams, storeId: string): RecordedRefundMoney {
  validateRefundMoneyOwner(response, request.id, storeId);
  const matches = response.refund.financial_effects.filter((effect) => effect.effect_id === request.effect_id);
  const effect = matches[0];
  if (matches.length !== 1 || effect.type !== request.movement.type ||
    (effect.type === "returned" && (request.movement.type !== "returned" || effect.sent_effect_id !== request.movement.sent_effect_id)) ||
    effect.money?.amount !== request.money.amount || effect.money.currency !== request.money.currency ||
    JSON.stringify(effect.allocations) !== JSON.stringify(request.allocations) ||
    effect.evidence?.type !== "manual" || effect.evidence.reference !== request.reference) {
    throw new Error("Refund money response did not confirm the exact recorded receipt");
  }
  return response;
}
