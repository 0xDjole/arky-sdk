import type { Money, ProviderEffectError, ProviderOperationClaim } from "./index";
import type { CommerceProviderObservation } from "./payment";
import type { EpochMilliseconds } from "./time";

export interface DocumentArtifact {
  object_key: string;
  version_id: string;
  content_digest: string;
  mime_type: string;
}

export interface OrderInvoiceProvider {
  type: "stripe";
  connected_account_id: string;
  livemode: boolean;
  stripe_invoice_id: string;
  last_observation: CommerceProviderObservation;
}

export type FiscalDocument =
  | { type: "native"; series_key: string; number: string; issued_at: EpochMilliseconds; due_at: EpochMilliseconds | null; artifact: DocumentArtifact }
  | { type: "stripe"; provider: OrderInvoiceProvider; number: string; issued_at: EpochMilliseconds; due_at: EpochMilliseconds | null; artifact: DocumentArtifact | null };

export type OrderInvoiceReconciliation =
  | { type: "unverified" }
  | { type: "matched"; basis_digest: string; adjustments_digest: string; document_digest: string }
  | { type: "mismatch"; reason: string; noticed_at: EpochMilliseconds };

export type OrderInvoiceState =
  | { type: "requested" }
  | { type: "issuing"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "issued"; document: FiscalDocument; reconciliation: OrderInvoiceReconciliation }
  | { type: "cancelled_before_issue"; reason: string; ended_at: EpochMilliseconds };

export interface OrderInvoice {
  id: string;
  store_id: string;
  order_id: string;
  basis_credit_ids: string[];
  basis_digest: string;
  money: Money;
  request_id: string;
  state: OrderInvoiceState;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindOrderInvoicesParams {
  store_id?: string;
  order_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetOrderInvoiceParams {
  store_id?: string;
  order_id: string;
  invoice_id: string;
}
