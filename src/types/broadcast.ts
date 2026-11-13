import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";
import type { EmailContent, EmailLayoutContent } from "./notification";

export type BroadcastMembers =
  | { type: "package"; package_id: string }
  | { type: "package_offering"; package_offering_id: string };

export type BroadcastCondition =
  | { type: "ordered_product"; product_id: string }
  | { type: "booked_service"; booking_service_id: string }
  | { type: "ordered_within"; days: number }
  | { type: "not_ordered_within"; days: number };

export type BroadcastAudience =
  | {
      type: "package_members";
      include: BroadcastMembers[];
      exclude: BroadcastMembers[];
      conditions: BroadcastCondition[];
    }
  | { type: "customers"; conditions: BroadcastCondition[] };

export interface EmailBroadcastContent {
  default_language: string;
  translations: Record<string, EmailContent>;
  layout: Record<string, EmailLayoutContent>;
  logo_media_id: string | null;
}

export interface SmsBroadcastContent {
  translations: Record<string, string>;
}

export type EmailBroadcastStatus =
  | { type: "draft" }
  | { type: "scheduled"; send_at: EpochMilliseconds; content: EmailBroadcastContent }
  | { type: "sending"; started_at: EpochMilliseconds; content: EmailBroadcastContent }
  | { type: "sent"; started_at: EpochMilliseconds; recipient_count: number; content: EmailBroadcastContent };

export type SmsBroadcastStatus =
  | { type: "draft" }
  | { type: "scheduled"; send_at: EpochMilliseconds; content: SmsBroadcastContent }
  | { type: "sending"; started_at: EpochMilliseconds; content: SmsBroadcastContent }
  | { type: "sent"; started_at: EpochMilliseconds; recipient_count: number; content: SmsBroadcastContent };

export type BroadcastStatusName = EmailBroadcastStatus["type"];

export type BroadcastTypeName = "email" | "sms";

export type BroadcastType =
  | {
      type: "email";
      email_template_id: string;
      email_address_id: string;
      from_name: string;
      reply_to_address_id: string;
      audience: BroadcastAudience;
      status: EmailBroadcastStatus;
    }
  | { type: "sms"; sms_template_id: string; audience: BroadcastAudience; status: SmsBroadcastStatus };

export type BroadcastTypeRequest =
  | {
      type: "email";
      email_template_id: string;
      email_address_id: string;
      from_name: string;
      reply_to_address_id: string;
      audience: BroadcastAudience;
    }
  | { type: "sms"; sms_template_id: string; audience: BroadcastAudience };

export interface Broadcast {
  id: string;
  store_id: string;
  key: string;
  type: BroadcastType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type BroadcastPreview =
  | { type: "email"; language: string; subject: string; html: string; text: string }
  | { type: "sms"; language: string; text: string };

export interface FindBroadcastsParams {
  store_id: string;
  type?: BroadcastTypeName;
  query?: string;
  status?: BroadcastStatusName;
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
  type: BroadcastTypeRequest;
}

export interface UpdateBroadcastParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  type?: BroadcastTypeRequest;
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
  outgoing_message_id: string;
  language: string;
}

export type BroadcastUnsubscribeResult = "unsubscribed";

export interface BroadcastUnsubscribeResponse {
  result: BroadcastUnsubscribeResult;
}

export interface UnsubscribeBroadcastParams {
  token: string;
}
