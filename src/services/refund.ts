import type { CreateRefundResponse } from "../types/api";
import type { RefundStatus } from "../types/refund";

const refundStatuses: RefundStatus["type"][] = [
  "requested",
  "processing",
  "succeeded",
  "rejected",
  "failed",
  "unknown",
];

export const validateRefundResponse = (
  response: CreateRefundResponse,
  refundId: string,
  amount: number,
): CreateRefundResponse => {
  if (response.refund_id !== refundId) {
    throw new Error("Refund response did not match the requested refund_id");
  }
  if (
    !response.money ||
    !Number.isSafeInteger(response.money.amount) ||
    response.money.amount !== amount
  ) {
    throw new Error("Refund response did not match the requested amount");
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
