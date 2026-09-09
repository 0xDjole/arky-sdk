import type { AccountActor } from "./accountActor";
import type { Money } from "./index";
import type { EpochMilliseconds } from "./time";

export type RefundStatus =
  | { type: "requested" }
  | { type: "processing" }
  | { type: "succeeded" }
  | { type: "rejected" }
  | { type: "failed" }
  | { type: "unknown" };

export type RefundReason =
  | "customer_request"
  | "duplicate"
  | "fraudulent"
  | "other"
  | "store_closure";
export type RefundRequestReason = Exclude<RefundReason, "store_closure">;
export type SystemRefundReason = "store_closure" | "late_charge";

export type RefundAllocation =
  | { type: "product"; item_id: string; amount: number }
  | { type: "booking"; item_id: string; amount: number }
  | { type: "digital"; item_id: string; amount: number }
  | { type: "audience"; item_id: string; amount: number }
  | { type: "shipping"; line_id: string; amount: number }
  | { type: "adjustment"; amount: number; reason: string };

export type RefundApplication =
  | { type: "order_items"; allocations: RefundAllocation[] }
  | { type: "subscription_invoice" };

export type RefundRequester =
  | {
      type: "account";
      actor: AccountActor;
      reason: RefundReason;
      private_note: string | null;
    }
  | { type: "system"; reason: SystemRefundReason }
  | { type: "stripe" };

export type RefundProvider =
  | { type: "cash_on_delivery"; payment_provider_id: string }
  | { type: "stripe"; payment_provider_id: string; refund_id: string | null };

export interface Refund {
  id: string;
  store_id: string;
  payment_id: string;
  provider: RefundProvider;
  money: Money;
  application: RefundApplication;
  requester: RefundRequester;
  status: RefundStatus;
  safe_error: string | null;
  requested_at: EpochMilliseconds;
  processing_started_at: EpochMilliseconds | null;
  processing_deadline_at: EpochMilliseconds | null;
  completed_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}
