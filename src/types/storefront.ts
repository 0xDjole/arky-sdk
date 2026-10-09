import type { Currency, PostalAddress, SortDirection, TaxMode } from "./common";
import type { StorefrontPaymentOption } from "./payment";

export interface StorefrontSetup {
  name: string;
  timezone: string;
  languages: string[];
  payment_options: StorefrontPaymentOption[];
}

export interface StorefrontMarket {
  id: string;
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
  payment_option_ids: string[];
}

export interface StorefrontLocation {
  id: string;
  key: string;
  address: PostalAddress;
  pickup_point: boolean;
}

export interface FindStorefrontLocationsParams {
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface FindStorefrontMarketsParams {
  key?: string;
  currency?: Currency;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontCountryState {
  code: string;
  name: string;
}

export interface StorefrontCountry {
  code: string;
  name: string;
  states: StorefrontCountryState[];
}

export interface StorefrontCountries {
  items: StorefrontCountry[];
  cursor: string | null;
}

export interface StorefrontPageParams {
  limit?: number;
  cursor?: string | null;
  sort_direction?: SortDirection;
}

export type StorefrontParams<T> = Omit<T, "store_id">;
