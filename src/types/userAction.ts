import type { EpochMilliseconds } from "./time";
import type { AccountActor } from "./common";

export type UserActionOrigin =
  | { type: "storefront"; user_session_id: string }
  | { type: "account"; actor: AccountActor }
  | { type: "system" };

export type UserActionType =
  | { type: "custom"; key: string; data: Record<string, unknown> }
  | { type: "cart_item_added"; cart_id: string }
  | { type: "cart_item_removed"; cart_id: string }
  | { type: "order_placed"; order_id: string }
  | { type: "form_submitted"; form_id: string; submission_id: string }
  | { type: "support_conversation_started"; conversation_id: string }
  | { type: "support_conversation_escalated"; conversation_id: string }
  | { type: "support_conversation_resolved"; conversation_id: string }
  | { type: "package_member_activated"; package_id: string }
  | { type: "package_member_cancelled"; package_id: string }
  | { type: "package_member_switched"; from_package_id: string; to_package_id: string };

export const TYPED_USER_ACTION_KEYS = [
  "cart_item_added",
  "cart_item_removed",
  "order_placed",
  "form_submitted",
  "support_conversation_started",
  "support_conversation_escalated",
  "support_conversation_resolved",
  "package_member_activated",
  "package_member_cancelled",
  "package_member_switched",
] as const;


export interface UserAction {
  id: string;
  tenant_id: string;
  user_id: string;
  origin: UserActionOrigin;
  type: UserActionType;
  occurred_at: EpochMilliseconds;
}

export interface FindUserActionsParams {
  tenant_id: string;
  user_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface TrackUserActionParams {
  id?: string;
  key: string;
  data?: Record<string, unknown>;
}
