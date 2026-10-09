import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";
import type { EmailContent, EmailTemplatePreview } from "./notification";

export type BroadcastAudience =
  | { type: "offering"; subscription_offering_id: string }
  | { type: "plans"; subscription_plan_ids: string[] };

export type BroadcastStatus =
  | { type: "draft" }
  | { type: "scheduled"; send_at: EpochMilliseconds }
  | { type: "sending"; started_at: EpochMilliseconds }
  | { type: "sent"; started_at: EpochMilliseconds; recipient_count: number };

export interface Broadcast {
  id: string;
  store_id: string;
  key: string;
  audience: BroadcastAudience;
  sender_id: string;
  content: Record<string, EmailContent>;
  status: BroadcastStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type BroadcastPreview = EmailTemplatePreview;

export const BROADCAST_FIELDS = [
  "customer.first_name",
  "customer.last_name",
  "customer.email",
  "store.name",
  "subscription.offering.key",
  "subscription.plan.key",
  "unsubscribe_url",
] as const;

export type BroadcastField = (typeof BROADCAST_FIELDS)[number];

export const BROADCAST_BLOCK_FIELD_PREFIXES = ["subscription.offering.blocks.", "subscription.plan.blocks."] as const;

export type BroadcastBlockField = `${(typeof BROADCAST_BLOCK_FIELD_PREFIXES)[number]}${string}`;

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
  sender_id: string;
  content: Record<string, EmailContent>;
}

export interface UpdateBroadcastParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  audience?: BroadcastAudience;
  sender_id?: string;
  content?: Record<string, EmailContent>;
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
  content?: EmailContent;
}

export interface SendBroadcastTestParams {
  store_id: string;
  id: string;
  notification_id: string;
  language: string;
}
