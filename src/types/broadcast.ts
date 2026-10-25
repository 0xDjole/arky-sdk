import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";
import type { Email, EmailContent, EmailLayoutContent, EmailTemplatePreview } from "./notification";

export type BroadcastMembers =
  | { type: "customer_group"; customer_group_id: string }
  | { type: "customer_group_offering"; customer_group_offering_id: string };

export type BroadcastCondition =
  | { type: "ordered_product"; product_id: string }
  | { type: "ordered_within"; days: number }
  | { type: "not_ordered_within"; days: number };

export interface BroadcastAudience {
  include: BroadcastMembers[];
  exclude: BroadcastMembers[];
  conditions: BroadcastCondition[];
}

export interface BroadcastContent {
  default_language: string;
  translations: Record<string, EmailContent>;
  layout: Record<string, EmailLayoutContent>;
  logo_media_id: string | null;
}

export type BroadcastStatus =
  | { type: "draft" }
  | { type: "scheduled"; send_at: EpochMilliseconds; content: BroadcastContent }
  | { type: "sending"; started_at: EpochMilliseconds; content: BroadcastContent }
  | { type: "sent"; started_at: EpochMilliseconds; recipient_count: number; content: BroadcastContent };

export interface Broadcast {
  id: string;
  store_id: string;
  key: string;
  audience: BroadcastAudience;
  email: Email;
  status: BroadcastStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type BroadcastPreview = EmailTemplatePreview;

export interface FindBroadcastsParams {
  store_id: string;
  query?: string;
  status?: BroadcastStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetBroadcastParams {
  store_id: string;
  id: string;
}

export interface CreateBroadcastParams {
  store_id: string;
  id: string;
  key: string;
  audience: BroadcastAudience;
  email: Email;
}

export interface UpdateBroadcastParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  audience?: BroadcastAudience;
  email?: Email;
}

export interface DeleteBroadcastParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ScheduleBroadcastParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  send_at: EpochMilliseconds;
}

export interface UnscheduleBroadcastParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface SendBroadcastParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface PreviewBroadcastParams {
  store_id: string;
  id: string;
  language: string;
}

export interface SendBroadcastTestParams {
  store_id: string;
  id: string;
  outgoing_email_id: string;
  language: string;
}

export type BroadcastUnsubscribeResult = "unsubscribed";

export interface BroadcastUnsubscribeResponse {
  result: BroadcastUnsubscribeResult;
}

export interface UnsubscribeBroadcastParams {
  token: string;
}
