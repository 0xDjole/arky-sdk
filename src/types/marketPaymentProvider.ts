import type { EpochMilliseconds } from "./time";

export type MarketPaymentProviderStatus =
  | { type: "active" }
  | { type: "deleting" };

export interface MarketPaymentProvider {
  id: string;
  store_id: string;
  market_id: string;
  payment_provider_id: string;
  status: MarketPaymentProviderStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateMarketPaymentProviderParams {
  store_id?: string;
  market_id: string;
  payment_provider_id: string;
}

export interface GetMarketPaymentProviderParams {
  store_id?: string;
  id: string;
}

export interface FindMarketPaymentProvidersParams {
  store_id?: string;
  market_id?: string;
  payment_provider_id?: string;
  status?: "active" | "deleting";
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface GetMarketPaymentProviderByBindingParams {
  store_id?: string;
  market_id: string;
  payment_provider_id: string;
}

export interface RemoveMarketPaymentProviderParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
