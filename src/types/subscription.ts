import type { Money } from "./index";
import type { SubscriptionCalendarChange, SubscriptionFundingChange, SubscriptionPlanChange, SubscriptionTaxCorrection, SubscriptionRevisionChangeResult, SubscriptionCardUpdateRequest } from "./subscriptionRevision";
import type { PurchaseOriginSnapshot } from "./orderContract";
import type { EpochMilliseconds } from "./time";
import type { PurchaseRequirement, PurchaseRequirementInput } from "./purchaseRequirement";

export interface SubscriptionCollectionBlock {
  request_id: string;
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
  store_id: string;
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
  store_id: string;
  request_id: string;
  request: SubscriptionControl;
}

export interface SubscriptionControlResult {
  request_id: string;
  accepted_at: EpochMilliseconds;
  subscription: SubscriptionSelf;
}

export interface FindSubscriptionsParams {
  store_id: string;
  customer_id?: string;
  company_id?: string;
  order_id?: string;
  status?: SubscriptionStatus["type"];
  limit?: number;
  cursor?: string;
}

export interface FindSubscriptionOrdersParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface FindSubscriptionCommandsParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface GetCurrentSubscriptionParams {
  store_id: string;
  id: string;
}

export interface FindCustomerSubscriptionsParams {
  company_id?: string;
  company_location_id?: string;
  status?: "awaiting_activation" | "active" | "blocked" | "paused" | "cancelled";
  limit?: number;
  cursor?: string;
}

export type SubscriptionChangeType =
  | { type: "purchase_requirement_changed"; subscription_id: string; actor_account_id: string; actor: PurchaseOriginSnapshot; expected_updated_at: EpochMilliseconds; effective_at: EpochMilliseconds; previous: PurchaseRequirement | null; current: PurchaseRequirement | null; selection: PurchaseRequirementInput | null }
  | { type: "calendar"; change: { request: SubscriptionCalendarChange; actor: PurchaseOriginSnapshot; result: SubscriptionRevisionChangeResult } }
  | { type: "funding"; change: { request: SubscriptionFundingChange; actor: PurchaseOriginSnapshot; result: SubscriptionRevisionChangeResult } }
  | { type: "plan"; change: { request: SubscriptionPlanChange; actor: PurchaseOriginSnapshot; result: SubscriptionRevisionChangeResult } }
  | { type: "tax_correction"; change: { request: SubscriptionTaxCorrection; actor: PurchaseOriginSnapshot; assessment_digest: string; result: SubscriptionRevisionChangeResult } }
  | { type: "control"; request: SubscriptionControl; actor: PurchaseOriginSnapshot }
  | { type: "card"; update: { request: SubscriptionCardUpdateRequest; actor: PurchaseOriginSnapshot; closed_payment_id: string; payment_id: string; capture_id: string; amount: Money; funding_request_id: string | null } };

export interface SubscriptionChange {
  request_id: string;
  store_id: string;
  subscription_id: string;
  change: SubscriptionChangeType;
  accepted_at: EpochMilliseconds;
}
