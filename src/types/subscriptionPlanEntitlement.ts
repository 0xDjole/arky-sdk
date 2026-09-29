import type { PriceScope } from "./price";
import type { PurchaseLimitDefinition } from "./purchaseAccess";
import type {
  SubscriptionDeliverySchedule,
  SubscriptionDigitalContent,
  SubscriptionProductQuantity,
} from "./subscriptionPlan";
import type { EpochMilliseconds } from "./time";

export type SubscriptionPlanEntitlementType =
  | {
      type: "product";
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
      variant_id: string;
      quantity: number;
      tax_category_id: string | null;
    }
  | {
      type: "purchase_access";
      variant_ids: string[];
      price_scope: PriceScope;
      limits: PurchaseLimitDefinition[];
      tax_category_id: string | null;
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
  store_id: string;
  subscription_plan_id: string;
}

export interface CreateSubscriptionPlanEntitlementParams {
  store_id: string;
  subscription_plan_id: string;
  entitlement_id: string;
  type: SubscriptionPlanEntitlementType;
  allocation_weight: number;
}

export interface UpdateSubscriptionPlanEntitlementParams {
  store_id: string;
  subscription_plan_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: SubscriptionPlanEntitlementType;
  allocation_weight: number;
}

export interface DeleteSubscriptionPlanEntitlementParams {
  store_id: string;
  subscription_plan_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
