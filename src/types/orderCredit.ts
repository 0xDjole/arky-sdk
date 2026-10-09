import type { EpochMilliseconds } from "./time";
import type { AccountActor, Actor, Currency, SortDirection } from "./common";

export type OrderCreditSource =
  | { type: "cancellation"; by: Actor }
  | { type: "return"; return_id: string }
  | { type: "account"; actor: AccountActor; reason: string }
  | { type: "system"; reason: string };

export type CreditTarget =
  | { type: "product"; line_item_id: string; unit_index: number }
  | { type: "booking"; line_item_id: string }
  | { type: "rental_use"; line_item_id: string }
  | { type: "purchase_access"; line_item_id: string }
  | { type: "delivery"; delivery_group_id: string };

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
  | { type: "voided"; voided_at: EpochMilliseconds; actor: AccountActor };

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

export interface CreateOrderCreditParams {
  store_id: string;
  order_id: string;
  id: string;
  targets: CreditTarget[];
  reason: string;
}

export interface GetOrderCreditParams {
  store_id: string;
  order_id: string;
  credit_id: string;
}

export interface VoidOrderCreditParams {
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
