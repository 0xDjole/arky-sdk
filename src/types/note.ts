import type { EpochMilliseconds } from "./time";
import type { AccountActor } from "./common";

export type NoteTarget =
  | { type: "form_submission"; form_submission_id: string }
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

export type FindOrderNotesParams = OrderNoteTarget & NotePageParams;
export type CreateOrderNoteParams = OrderNoteTarget & NoteCreateParams;
export type UpdateOrderNoteParams = OrderNoteTarget & NoteUpdateParams;
export type DeleteOrderNoteParams = OrderNoteTarget & NoteDeleteParams;

export type FindCustomerNotesParams = CustomerNoteTarget & NotePageParams;
export type CreateCustomerNoteParams = CustomerNoteTarget & NoteCreateParams;
export type UpdateCustomerNoteParams = CustomerNoteTarget & NoteUpdateParams;
export type DeleteCustomerNoteParams = CustomerNoteTarget & NoteDeleteParams;

export type FindCompanyNotesParams = CompanyNoteTarget & NotePageParams;
export type CreateCompanyNoteParams = CompanyNoteTarget & NoteCreateParams;
export type UpdateCompanyNoteParams = CompanyNoteTarget & NoteUpdateParams;
export type DeleteCompanyNoteParams = CompanyNoteTarget & NoteDeleteParams;

export type FindFormSubmissionNotesParams = FormSubmissionNoteTarget & NotePageParams;
export type CreateFormSubmissionNoteParams = FormSubmissionNoteTarget & NoteCreateParams;
export type UpdateFormSubmissionNoteParams = FormSubmissionNoteTarget & NoteUpdateParams;
export type DeleteFormSubmissionNoteParams = FormSubmissionNoteTarget & NoteDeleteParams;

export type FindConversationNotesParams = ConversationNoteTarget & NotePageParams;
export type CreateConversationNoteParams = ConversationNoteTarget & NoteCreateParams;
export type UpdateConversationNoteParams = ConversationNoteTarget & NoteUpdateParams;
export type DeleteConversationNoteParams = ConversationNoteTarget & NoteDeleteParams;
