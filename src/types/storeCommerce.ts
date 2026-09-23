import type { Currency } from "./index";
import type { InvoiceIssueTrigger, SellerProfile, TaxMode } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export interface StoreTaxPolicy {
  version: string;
  noncommercial_customer_group_grants: boolean;
}

export interface StoreInvoicePolicy {
  series_key: string;
  issue_trigger: InvoiceIssueTrigger;
}

export interface CommerceInitializationRequest {
  market: { key: string; currency: Currency; tax_mode: TaxMode };
  sales_channel: { key: string; name: string };
  seller: SellerProfile;
  tax: StoreTaxPolicy;
  invoicing: StoreInvoicePolicy;
}

export type CommerceInitializationFailure = "configuration_conflict" | "storage_unavailable";

export type CommerceInitializationStatus =
  | { type: "pending"; last_error: CommerceInitializationFailure | null }
  | { type: "completed"; completed_at: EpochMilliseconds }
  | { type: "aborted"; aborted_at: EpochMilliseconds; account_id: string };

export interface StoreCommerceInitialization {
  id: string;
  store_id: string;
  account_id: string;
  request: CommerceInitializationRequest;
  request_fingerprint: string;
  market_id: string;
  sales_channel_id: string;
  market_sales_channel_id: string;
  assortment_id: string;
  catalog_id: string;
  status: CommerceInitializationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface InitializeStoreCommerceParams {
  store_id?: string;
  operation_id: string;
  request: CommerceInitializationRequest;
}

export interface GetStoreCommerceInitializationParams {
  store_id?: string;
  operation_id: string;
}

export type AbortStoreCommerceInitializationParams = GetStoreCommerceInitializationParams;
