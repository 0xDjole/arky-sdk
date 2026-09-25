import type { PurchaseOriginSnapshot } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export interface SubscriptionCollectionBlock {
  command_id: string;
  reason: string;
  blocked_at: EpochMilliseconds;
}

export type SubscriptionStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked"; block: SubscriptionCollectionBlock }
  | {
      type: "paused";
      paused_at: EpochMilliseconds;
      actor: PurchaseOriginSnapshot;
      reason: string;
    }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export type SubscriptionPurchaseState =
  | { type: "one_time" }
  | { type: "recurring"; next_occurrence_index: number };

export type SubscriptionSubject =
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_id: string };

export interface Subscription {
  id: string;
  store_id: string;
  order_id: string;
  order_subscription_line_item_id: string;
  customer_id: string;
  subject: SubscriptionSubject;
  purchases: SubscriptionPurchaseState;
  status: SubscriptionStatus;
  purchase_end_at: EpochMilliseconds | null;
  access_end_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetSubscriptionParams {
  store_id?: string;
  id: string;
}

export type SubscriptionSelfStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked" }
  | { type: "paused"; paused_at: EpochMilliseconds }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export interface SubscriptionSelf
  extends Omit<Subscription, "status"> {
  status: SubscriptionSelfStatus;
}

export type SubscriptionControlType =
  | { type: "pause"; reason: string }
  | { type: "cancel"; reason: string };

export interface SubscriptionControl {
  subscription_id: string;
  expected_updated_at: EpochMilliseconds;
  type: SubscriptionControlType;
}

export interface ControlSubscriptionParams {
  store_id?: string;
  command_id: string;
  request: SubscriptionControl;
}

export interface SubscriptionControlResult {
  command_id: string;
  accepted_at: EpochMilliseconds;
  subscription: SubscriptionSelf;
}

export interface FindSubscriptionsParams {
  store_id?: string;
  customer_id?: string;
  company_id?: string;
  order_id?: string;
  status?: SubscriptionStatus["type"];
  limit?: number;
  cursor?: string;
}

export interface FindSubscriptionOrdersParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface FindSubscriptionCommandsParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface GetCurrentSubscriptionParams {
  store_id?: string;
  id: string;
}
