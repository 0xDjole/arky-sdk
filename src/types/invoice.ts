import type { EpochMilliseconds } from "./time";

export type InvoiceType =
  | { type: "invoice" }
  | { type: "credit_note"; invoice_id: string };

export interface Invoice {
  id: string;
  store_id: string;
  order_id: string;
  type: InvoiceType;
  number: string;
  url: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindInvoicesParams {
  store_id: string;
  order_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateInvoiceParams {
  store_id: string;
  order_id: string;
  id: string;
  type: InvoiceType;
  number: string;
  url: string;
}

export interface DeleteInvoiceParams {
  store_id: string;
  order_id: string;
  invoice_id: string;
  expected_updated_at: EpochMilliseconds;
}
