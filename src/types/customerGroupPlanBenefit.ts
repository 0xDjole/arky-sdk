import type {
  CustomerGroupDeliverySchedule,
  CustomerGroupDigitalContent,
  CustomerGroupProductQuantity,
} from "./customerGroupPlan";
import type { EpochMilliseconds } from "./time";

export type CustomerGroupPlanBenefitType =
  | {
      type: "product";
      product_id: string;
      variant_id: string;
      quantity: CustomerGroupProductQuantity;
      delivery: CustomerGroupDeliverySchedule;
    }
  | {
      type: "digital_product";
      digital_product_id: string;
      content: CustomerGroupDigitalContent;
    }
  | {
      type: "rental";
      product_id: string;
      variant_id: string;
      quantity: number;
    };

export interface CustomerGroupPlanBenefit {
  id: string;
  store_id: string;
  customer_group_plan_id: string;
  type: CustomerGroupPlanBenefitType;
  allocation_weight: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindCustomerGroupPlanBenefitsParams {
  store_id?: string;
  customer_group_plan_id: string;
}

export interface CreateCustomerGroupPlanBenefitParams {
  store_id?: string;
  customer_group_plan_id: string;
  benefit_id: string;
  type: CustomerGroupPlanBenefitType;
  allocation_weight: number;
}

export interface UpdateCustomerGroupPlanBenefitParams {
  store_id?: string;
  customer_group_plan_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: CustomerGroupPlanBenefitType;
  allocation_weight: number;
}

export interface DeleteCustomerGroupPlanBenefitParams {
  store_id?: string;
  customer_group_plan_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
