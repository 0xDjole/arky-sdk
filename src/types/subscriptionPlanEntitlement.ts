import type {
  SubscriptionDeliverySchedule,
  SubscriptionDigitalContent,
  SubscriptionProductQuantity,
} from "./subscriptionPlan";
import type { EpochMilliseconds } from "./time";

export type SubscriptionPlanEntitlementType =
  | {
      type: "product";
      product_id: string;
      variant_id: string;
      quantity: SubscriptionProductQuantity;
      delivery: SubscriptionDeliverySchedule;
    }
  | {
      type: "digital_product";
      digital_product_id: string;
      content: SubscriptionDigitalContent;
    }
  | {
      type: "rental";
      product_id: string;
      variant_id: string;
      quantity: number;
    };

export interface SubscriptionPlanEntitlement {
  id: string;
  store_id: string;
  subscription_plan_id: string;
  type: SubscriptionPlanEntitlementType;
  allocation_weight: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindSubscriptionPlanEntitlementsParams {
  store_id?: string;
  subscription_plan_id: string;
}

export interface CreateSubscriptionPlanEntitlementParams {
  store_id?: string;
  subscription_plan_id: string;
  entitlement_id: string;
  type: SubscriptionPlanEntitlementType;
  allocation_weight: number;
}

export interface UpdateSubscriptionPlanEntitlementParams {
  store_id?: string;
  subscription_plan_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: SubscriptionPlanEntitlementType;
  allocation_weight: number;
}

export interface DeleteSubscriptionPlanEntitlementParams {
  store_id?: string;
  subscription_plan_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
