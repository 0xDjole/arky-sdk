import type { EpochMilliseconds } from "./time";
import type { AccountActor } from "./common";

export type CustomerActionOrigin =
  | { type: "storefront"; customer_session_id: string }
  | { type: "account"; actor: AccountActor }
  | { type: "system" };

export type CustomerActionType =
  | { type: "custom"; key: string; data: Record<string, unknown> }
  | { type: "cart_item_added"; cart_id: string }
  | { type: "cart_item_removed"; cart_id: string }
  | { type: "order_placed"; order_id: string }
  | { type: "form_submitted"; form_id: string; submission_id: string }
  | { type: "support_conversation_started"; conversation_id: string }
  | { type: "support_conversation_escalated"; conversation_id: string }
  | { type: "support_conversation_resolved"; conversation_id: string }
  | { type: "customer_group_member_added"; customer_group_id: string }
  | { type: "customer_group_member_removed"; customer_group_id: string };

export type CustomerActionKind = CustomerActionType["type"];

export const TYPED_CUSTOMER_ACTION_KEYS = [
  "cart_item_added",
  "cart_item_removed",
  "order_placed",
  "form_submitted",
  "support_conversation_started",
  "support_conversation_escalated",
  "support_conversation_resolved",
  "customer_group_member_added",
  "customer_group_member_removed",
] as const;

export type TypedCustomerActionKey = (typeof TYPED_CUSTOMER_ACTION_KEYS)[number];

export interface CustomerAction {
  id: string;
  store_id: string;
  customer_id: string;
  origin: CustomerActionOrigin;
  type: CustomerActionType;
  occurred_at: EpochMilliseconds;
}

export interface FindCustomerActionsParams {
  store_id: string;
  customer_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface TrackCustomerActionParams {
  key: string;
  data?: Record<string, unknown>;
}
