import type { PaymentTermsType } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export type PaymentTermsEditableStatus =
  | { type: "active" }
  | { type: "archived" };

export type PaymentTermsStatus = PaymentTermsEditableStatus | { type: "deleting" };

export interface PaymentTerms {
  id: string;
  store_id: string;
  key: string;
  type: PaymentTermsType;
  status: PaymentTermsStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreatePaymentTermsParams {
  store_id?: string;
  key: string;
  type: PaymentTermsType;
  status: PaymentTermsEditableStatus;
}

export interface UpdatePaymentTermsParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: PaymentTermsType;
  status: PaymentTermsEditableStatus;
}

export interface GetPaymentTermsParams {
  store_id?: string;
  id: string;
}

export interface FindPaymentTermsParams {
  store_id?: string;
  status?: PaymentTermsStatus["type"];
  limit?: number;
  cursor?: string;
}

export interface DeletePaymentTermsParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
