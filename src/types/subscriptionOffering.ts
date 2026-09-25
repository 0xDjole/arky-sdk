import type { Block } from "./index";
import type { EpochMilliseconds } from "./time";

export type SubscriptionOfferingStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };

export type SubscriptionPlanTransitionTiming = { type: "next_occurrence" };

export interface SubscriptionPlanTransition {
  from_subscription_plan_id: string;
  to_subscription_plan_id: string;
  timing: SubscriptionPlanTransitionTiming;
}

export interface SubscriptionOffering {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  transitions: SubscriptionPlanTransition[];
  status: SubscriptionOfferingStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateSubscriptionOfferingParams {
  store_id?: string;
  key: string;
  blocks: Block[];
  status: SubscriptionOfferingStatus;
}

export interface UpdateSubscriptionOfferingParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  transitions: SubscriptionPlanTransition[];
  status: SubscriptionOfferingStatus;
}

export interface GetSubscriptionOfferingParams {
  store_id?: string;
  id: string;
}

export interface GetSubscriptionOfferingByKeyParams {
  store_id?: string;
  key: string;
}

export interface FindSubscriptionOfferingsParams {
  store_id?: string;
  key?: string;
  status?: SubscriptionOfferingStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface StorefrontSubscriptionOffering {
  id: string;
  key: string;
  blocks: Block[];
  transitions: SubscriptionPlanTransition[];
}

export interface GetStorefrontSubscriptionOfferingParams {
  identifier: string;
}
