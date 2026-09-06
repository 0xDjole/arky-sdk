import type { EpochMilliseconds } from "./time";

export type EmailSuppressionType = "unsubscribe" | "admin_block";
export type EmailSuppressionStatus = { type: "active" } | { type: "released" };
export type EmailSuppressionSource =
  | { type: "campaign_unsubscribe"; campaign_message_id: string | null }
  | { type: "admin"; account_session_id: string | null };

export interface EmailSuppression {
  id: string;
  store_id: string;
  email: string;
  type: EmailSuppressionType;
  status: EmailSuppressionStatus;
  changed_by: EmailSuppressionSource;
  note: string | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailSuppressionRecord {
  restriction: EmailSuppression;
  version: string;
}

export interface GetEmailSuppressionParams {
  store_id?: string;
  id: string;
}

type EmailSuppressionFilters = {
  store_id?: string;
  type?: EmailSuppressionType;
  status?: EmailSuppressionStatus["type"];
};

export type FindEmailSuppressionsParams = EmailSuppressionFilters &
  (
    | { query: string; limit?: never; cursor?: never }
    | { query?: never; limit?: number; cursor?: string }
  );

export interface ActivateEmailSuppressionParams {
  store_id?: string;
  id: string;
  email: string;
  command_id: string;
  expected_version: string | null;
  note: string;
}

export interface ReleaseEmailSuppressionParams {
  store_id?: string;
  id: string;
  command_id: string;
  expected_version: string;
  note: string;
}
