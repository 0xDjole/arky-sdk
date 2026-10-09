import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { Currency, PostalAddress, PostalAddressInput, SortDirection, TaxMode } from "./common";

export type MarketStatus = { type: "active" } | { type: "deleting" };

export interface Market {
  id: string;
  store_id: string;
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
  payment_option_ids: string[];
  status: MarketStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SalesChannelStatus = { type: "active" } | { type: "archived" };

export interface SalesChannel {
  id: string;
  store_id: string;
  key: string;
  market_ids: string[];
  status: SalesChannelStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontClientStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export interface StorefrontClientRegistration {
  id: string;
  store_id: string;
  key: string;
  publishable_key: string;
  sales_channel_ids: string[];
  status: StorefrontClientStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ZoneArea =
  | { type: "country"; country: string }
  | { type: "state"; country: string; state: string }
  | { type: "postal_code"; country: string; postal_code: string }
  | { type: "postal_code_prefix"; country: string; prefix: string };

export interface Zone {
  id: string;
  store_id: string;
  market_id: string;
  key: string;
  areas: ZoneArea[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreLocationStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type StoreLocationEditableStatus = Exclude<StoreLocationStatus, { type: "deleting" }>;

export interface StoreLocation {
  id: string;
  store_id: string;
  key: string;
  address: PostalAddress;
  timezone: string;
  blocks: Block[];
  status: StoreLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreRecordParams {
  store_id: string;
  id: string;
}

export interface StoreRecordByKeyParams {
  store_id: string;
  key: string;
}

export interface FindMarketsParams {
  store_id: string;
  key?: string;
  currency?: Currency;
  status?: MarketStatus["type"];
  sort_field?: "key" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateMarketParams {
  store_id: string;
  id: string;
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
}

export interface UpdateMarketParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  tax_mode?: TaxMode;
  payment_option_ids?: string[];
}

export interface DeleteMarketParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindSalesChannelsParams {
  store_id: string;
  key?: string;
  status?: SalesChannelStatus["type"];
  sort_field?: "key" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateSalesChannelParams {
  store_id: string;
  id: string;
  key: string;
  market_ids: string[];
  status: SalesChannelStatus;
}

export interface UpdateSalesChannelParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  market_ids: string[];
  status: SalesChannelStatus;
}

export interface DeleteSalesChannelParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindStorefrontClientsParams {
  store_id: string;
  sales_channel_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateStorefrontClientParams {
  store_id: string;
  id: string;
  key: string;
  sales_channel_ids: string[];
}

export interface UpdateStorefrontClientParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sales_channel_ids: string[];
}

export interface RevokeStorefrontClientParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindZonesParams {
  store_id: string;
  market_id?: string;
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateZoneParams {
  store_id: string;
  id: string;
  market_id: string;
  key: string;
  areas: ZoneArea[];
}

export interface UpdateZoneParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  areas?: ZoneArea[];
}

export interface DeleteZoneParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindStoreLocationsParams {
  store_id: string;
  query?: string;
  status?: StoreLocationStatus["type"];
  sort_field?: "key" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateStoreLocationParams {
  store_id: string;
  id: string;
  key: string;
  address?: PostalAddressInput;
  timezone: string;
  blocks?: Block[];
  status?: StoreLocationEditableStatus;
}

export interface UpdateStoreLocationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  address?: PostalAddressInput;
  timezone?: string;
  blocks?: Block[];
  status?: StoreLocationEditableStatus;
}

export interface DeleteStoreLocationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface LocationState {
  code: string;
  name: string;
}

export interface LocationCountry {
  code: string;
  name: string;
  states: LocationState[];
}
