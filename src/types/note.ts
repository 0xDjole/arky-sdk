import type { EpochMilliseconds } from "./time";
import type { AccountActor } from "./common";

export type NoteTarget =
  | { type: "form_submission"; form_submission_id: string }
  | {
      type: "form_submission_stage_change";
      form_submission_id: string;
      changed_at: EpochMilliseconds;
    }
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_id: string }
  | { type: "order"; order_id: string }
  | { type: "conversation"; conversation_id: string };

export type NoteTargetType = NoteTarget["type"];

export interface Note {
  id: string;
  store_id: string;
  target: NoteTarget;
  body: string;
  actor: AccountActor;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface NotePageParams {
  limit?: number;
  cursor?: string | null;
}

export interface NoteCreateParams {
  id: string;
  body: string;
}

export interface NoteUpdateParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  body: string;
}

export interface NoteDeleteParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface OrderNoteTarget {
  store_id: string;
  order_id: string;
}

export interface CustomerNoteTarget {
  store_id: string;
  customer_id: string;
}

export interface CompanyNoteTarget {
  store_id: string;
  company_id: string;
}

export interface FormSubmissionNoteTarget {
  store_id: string;
  form_id: string;
  form_submission_id: string;
}

export interface ConversationNoteTarget {
  store_id: string;
  conversation_id: string;
}

