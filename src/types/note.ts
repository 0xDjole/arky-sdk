import type { AccountActor } from "./accountActor";
import type { EpochMilliseconds } from "./time";

export type NoteTarget =
  | { type: "form_submission"; form_submission_id: string }
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_id: string }
  | { type: "order"; order_id: string };

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

export interface FindOrderNotesParams {
  store_id: string;
  order_id: string;
  limit?: number;
  cursor?: string;
}

export interface CreateOrderNoteParams {
  store_id: string;
  order_id: string;
  id: string;
  body: string;
}

export interface UpdateOrderNoteParams {
  store_id: string;
  order_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  body: string;
}

export interface DeleteOrderNoteParams {
  store_id: string;
  order_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomerNotesParams {
  store_id: string;
  customer_id: string;
  limit?: number;
  cursor?: string;
}

export interface CreateCustomerNoteParams {
  store_id: string;
  customer_id: string;
  id: string;
  body: string;
}

export interface UpdateCustomerNoteParams {
  store_id: string;
  customer_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  body: string;
}

export interface DeleteCustomerNoteParams {
  store_id: string;
  customer_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyNotesParams {
  store_id: string;
  company_id: string;
  limit?: number;
  cursor?: string;
}

export interface CreateCompanyNoteParams {
  store_id: string;
  company_id: string;
  id: string;
  body: string;
}

export interface UpdateCompanyNoteParams {
  store_id: string;
  company_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  body: string;
}

export interface DeleteCompanyNoteParams {
  store_id: string;
  company_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
