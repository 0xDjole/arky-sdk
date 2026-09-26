import type { AccountActor } from "./accountActor";
import type { Money } from "./index";
import type { EpochMilliseconds } from "./time";

export type CreditTarget =
  | { type: "product"; line_item_id: string; unit_index: number }
  | { type: "booking"; line_item_id: string }
  | { type: "digital"; line_item_id: string }
  | { type: "subscription_plan"; line_item_id: string }
  | { type: "rental_use"; line_item_id: string }
  | { type: "delivery"; delivery_group_id: string };

export type OrderCreditSource =
  | { type: "cancellation" }
  | { type: "return"; return_id: string }
  | { type: "account"; actor: AccountActor; reason: string; private_note: string | null }
  | { type: "system"; reason: string };

export type OrderCreditStatus =
  | { type: "active" }
  | { type: "voided"; voided_at: EpochMilliseconds; actor: AccountActor };

export interface DiscountReversal {
  source_discount_allocation_id: string;
  amount: number;
}

export interface TaxComponentReversal {
  source_tax_line_id: string;
  amount: number;
}

export interface DutyComponentReversal {
  source_duty_line_id: string;
  amount: number;
}

export interface CreditMoney {
  subtotal_reduction: number;
  discount_reversals: DiscountReversal[];
  tax_reversals: TaxComponentReversal[];
  duty_reversals: DutyComponentReversal[];
  total: number;
  calculation_policy_version: string;
}

export interface OrderCreditAllocation {
  id: string;
  target: CreditTarget;
  money: CreditMoney;
}

export interface OrderCredit {
  id: string;
  store_id: string;
  order_id: string;
  command_id: string;
  source: OrderCreditSource;
  allocations: OrderCreditAllocation[];
  money: Money;
  status: OrderCreditStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateOrderCreditParams {
  store_id?: string;
  order_id: string;
  credit_id: string;
  command_id: string;
  targets: CreditTarget[];
  reason: string;
  private_note: string | null;
}

export interface GetOrderCreditParams {
  store_id?: string;
  order_id: string;
  credit_id: string;
}

export interface FindOrderCreditsParams {
  store_id?: string;
  order_id?: string;
  updated_at_from?: EpochMilliseconds;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}
