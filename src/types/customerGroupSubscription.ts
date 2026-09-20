import type { PurchaseOriginSnapshot } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export interface CustomerGroupCollectionBlock {
  command_id: string;
  reason: string;
  blocked_at: EpochMilliseconds;
}

export type CustomerGroupSubscriptionStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked"; block: CustomerGroupCollectionBlock }
  | {
      type: "paused";
      paused_at: EpochMilliseconds;
      actor: PurchaseOriginSnapshot;
      reason: string;
    }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export type CustomerGroupPurchaseState =
  | { type: "one_time" }
  | { type: "recurring"; next_occurrence_index: number };

export interface CustomerGroupSubscription {
  id: string;
  store_id: string;
  order_id: string;
  order_customer_group_line_item_id: string;
  customer_id: string;
  customer_group_member_id: string;
  purchases: CustomerGroupPurchaseState;
  status: CustomerGroupSubscriptionStatus;
  purchase_end_at: EpochMilliseconds | null;
  access_end_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetCustomerGroupSubscriptionParams {
  store_id?: string;
  id: string;
}

export type CustomerGroupSubscriptionSelfStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked" }
  | { type: "paused"; paused_at: EpochMilliseconds }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export interface CustomerGroupSubscriptionSelf
  extends Omit<CustomerGroupSubscription, "status"> {
  status: CustomerGroupSubscriptionSelfStatus;
}

export interface FindCustomerGroupSubscriptionsParams {
  store_id?: string;
  customer_id?: string;
  customer_group_member_id?: string;
  order_id?: string;
  status?: CustomerGroupSubscriptionStatus["type"];
  limit?: number;
  cursor?: string;
}

export interface FindCustomerGroupSubscriptionOrdersParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface FindCustomerGroupSubscriptionCommandsParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface GetCurrentCustomerGroupSubscriptionParams {
  store_id?: string;
  id: string;
}
