import type { EpochMilliseconds } from "./time";

export type PaidAudienceSource =
  | { type: "order_item"; order_id: string; order_item_id: string }
  | { type: "subscription"; subscription_id: string };

export type AudienceConfirmationEmailStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; started_at: EpochMilliseconds; deadline_at: EpochMilliseconds }
  | { type: "sent"; sent_at: EpochMilliseconds }
  | { type: "rejected"; rejected_at: EpochMilliseconds }
  | { type: "failed"; failed_at: EpochMilliseconds }
  | { type: "unknown"; unknown_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export type AudienceConfirmationEmailAdminStatus =
  | Exclude<AudienceConfirmationEmailStatus, { type: "sent" | "rejected" }>
  | { type: "sent"; provider_message_id: string; provider_status: number | null; sent_at: EpochMilliseconds }
  | { type: "rejected"; provider_status: number | null; rejected_at: EpochMilliseconds };

export type AudienceMembershipType =
  | { type: "free" }
  | { type: "confirmation_pending"; expires_at: EpochMilliseconds; email_status: AudienceConfirmationEmailStatus }
  | { type: "paid"; source: PaidAudienceSource | null };

export type AudienceMembershipAdminType =
  | Exclude<AudienceMembershipType, { type: "confirmation_pending" }>
  | {
      type: "confirmation_pending";
      confirmation_id: string;
      issued_at: EpochMilliseconds;
      expires_at: EpochMilliseconds;
      email_status: AudienceConfirmationEmailAdminStatus;
    };
