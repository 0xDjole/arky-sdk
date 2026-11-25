import type { EpochMilliseconds } from "./time";
import type { AccountActor, Actor, Currency, SortDirection, UnitSpan } from "./common";

export type OrderCreditSource =
  | { type: "cancellation"; by: Actor }
  | { type: "return"; return_id: string; actor: AccountActor }
  | { type: "account"; actor: AccountActor; reason: string }
  | { type: "add_on_taken_off"; actor: AccountActor; booked_add_on_id: string }
  | { type: "system" };

export type CreditTarget =
  | { type: "product"; line_item_id: string; span: UnitSpan }
  | { type: "booking"; line_item_id: string }
  | { type: "rental_use"; line_item_id: string }
  | { type: "delivery"; delivery_group_id: string };

export type OrderCreditAmount =
  | { type: "remaining" }
  | { type: "part"; subtotal_reduction: number };

export interface OrderCreditLeft {
  target: CreditTarget;
  subtotal: number;
  total: number;
}

export interface OrderRefundAllocationMaximum {
  order_credit_id: string;
  order_credit_allocation_id: string;
  target: CreditTarget;
  maximum: number;
}

export type OrderMoneyLeft =
  | {
      type: "shown";
      credit_left: OrderCreditLeft[];
      refund_allocation_maximums: OrderRefundAllocationMaximum[];
    }
  | { type: "not_shown" };

export interface OrderCreditRequestTarget {
  target: CreditTarget;
  amount: OrderCreditAmount;
}

export interface DiscountReversal {
  promotion_id: string;
  effect_id: string;
  amount: number;
}

export interface TaxReversal {
  component_id: string;
  amount: number;
}

export interface CreditMoney {
  subtotal_reduction: number;
  discount_reversals: DiscountReversal[];
  tax_reversals: TaxReversal[];
}

export interface OrderCreditAllocation {
  id: string;
  target: CreditTarget;
  money: CreditMoney;
}

export type OrderCreditStatus =
  | { type: "active" }
  | { type: "voided"; voided_at: EpochMilliseconds; actor: AccountActor; reason: string };

export interface OrderCredit {
  id: string;
  store_id: string;
  order_id: string;
  source: OrderCreditSource;
  allocations: OrderCreditAllocation[];
  status: OrderCreditStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  currency: Currency;
  total: number;
}

export type StorefrontOrderCreditSource =
  | { type: "cancellation" }
  | { type: "return"; return_id: string }
  | { type: "account" }
  | { type: "add_on_taken_off"; booked_add_on_id: string }
  | { type: "system" };

export type StorefrontOrderCreditStatus =
  | { type: "active" }
  | { type: "voided"; voided_at: EpochMilliseconds };

export interface StorefrontOrderCredit {
  id: string;
  store_id: string;
  order_id: string;
  source: StorefrontOrderCreditSource;
  status: StorefrontOrderCreditStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  currency: Currency;
  total: number;
}

export interface CreateOrderCreditParams {
  store_id: string;
  order_id: string;
  id: string;
  targets: OrderCreditRequestTarget[];
  reason: string;
  fiscal_device_id: string | null;
}

export interface GetOrderCreditParams {
  store_id: string;
  order_id: string;
  credit_id: string;
}

export interface VoidOrderCreditParams {
  reason: string;
  store_id: string;
  order_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindOrderCreditsParams {
  store_id: string;
  order_id?: string;
  updated_at_from?: EpochMilliseconds;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}
