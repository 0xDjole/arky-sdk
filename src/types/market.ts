import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { Currency, PostalAddress, PostalAddressInput, SortDirection, TaxMode } from "./common";

export type MarketStatus = { type: "active" } | { type: "deleting" };

export interface Market {
  id: string;
  tenant_id: string;
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
  tenant_id: string;
  key: string;
  market_ids: string[];
  status: SalesChannelStatus;
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
  tenant_id: string;
  market_id: string;
  key: string;
  areas: ZoneArea[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type TenantLocationStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type TenantLocationEditableStatus = Exclude<TenantLocationStatus, { type: "deleting" }>;

export type FiscalJurisdiction =
  | "croatia"
  | "fbih2009"
  | "fbih2026"
  | "republika_srpska"
  | "brcko"
  | "serbia";

export type CroatiaOnlineFiscalDevice =
  | { type: "none" }
  | { type: "device"; fiscal_device_id: string };

export type RepublikaSrpskaOnlineFiscalDevice =
  | { type: "none" }
  | { type: "device"; fiscal_device_id: string };

export type TenantLocationFiscal =
  | { type: "not_fiscal" }
  | { type: "croatia"; online_fiscal_device: CroatiaOnlineFiscalDevice }
  | { type: "republika_srpska"; online_fiscal_device: RepublikaSrpskaOnlineFiscalDevice }
  | { type: "serbia" }
  | { type: "fbih2009" }
  | { type: "fbih2026" }
  | { type: "brcko" };

export interface TenantLocation {
  id: string;
  tenant_id: string;
  key: string;
  address: PostalAddress;
  timezone: string;
  blocks: Block[];
  fiscal: TenantLocationFiscal;
  status: TenantLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface TenantRecordParams {
  tenant_id: string;
  id: string;
}

export interface TenantRecordByKeyParams {
  tenant_id: string;
  key: string;
}

export interface FindMarketsParams {
  tenant_id: string;
  key?: string;
  currency?: Currency;
  status?: MarketStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateMarketParams {
  tenant_id: string;
  id: string;
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
}

export interface UpdateMarketParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  payment_option_ids?: string[];
}

export interface DeleteMarketParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindSalesChannelsParams {
  tenant_id: string;
  key?: string;
  status?: SalesChannelStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateSalesChannelParams {
  tenant_id: string;
  id: string;
  key: string;
  market_ids: string[];
  status: SalesChannelStatus;
}

export interface UpdateSalesChannelParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  market_ids: string[];
  status: SalesChannelStatus;
}

export interface DeleteSalesChannelParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindZonesParams {
  tenant_id: string;
  market_id?: string;
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateZoneParams {
  tenant_id: string;
  id: string;
  market_id: string;
  key: string;
  areas: ZoneArea[];
}

export interface UpdateZoneParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  areas?: ZoneArea[];
}

export interface DeleteZoneParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindTenantLocationsParams {
  tenant_id: string;
  key?: string;
  status?: TenantLocationStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateTenantLocationParams {
  tenant_id: string;
  id: string;
  key: string;
  address: PostalAddressInput;
  timezone: string;
  blocks?: Block[];
  status?: TenantLocationEditableStatus;
}

export interface UpdateTenantLocationParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  address?: PostalAddressInput;
  timezone?: string;
  blocks?: Block[];
  status?: TenantLocationEditableStatus;
}

export interface SetTenantLocationFiscalParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  fiscal: TenantLocationFiscal;
}

export interface DeleteTenantLocationParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface LocationState {
  code: string;
  name: string;
}

export interface GetCountryParams {
  code: string;
}

export interface LocationCountry {
  code: string;
  name: string;
  states: LocationState[];
}
