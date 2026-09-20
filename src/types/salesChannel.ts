import type { EpochMilliseconds } from "./time";

export type SalesChannelEditableStatus =
  { type: "active" } | { type: "archived" };
export type SalesChannelStatus =
  SalesChannelEditableStatus | { type: "deleting" };

export interface SalesChannel {
  id: string;
  store_id: string;
  key: string;
  name: string;
  status: SalesChannelStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface SalesChannelUsage {
  market_sales_channel_ids: string[];
  more_market_sales_channels: boolean;
  storefront_client_ids: string[];
  more_storefront_clients: boolean;
  fulfillment_routing_policy_ids: string[];
  more_fulfillment_routing_policies: boolean;
  shipping_rate_ids: string[];
  more_shipping_rates: boolean;
  catalog_entitlement_ids: string[];
  more_catalog_entitlements: boolean;
  cart_ids: string[];
  more_carts: boolean;
  is_default: boolean;
}

export interface CreateSalesChannelParams {
  store_id?: string;
  key: string;
  name: string;
  status: SalesChannelEditableStatus;
}

export interface GetSalesChannelParams {
  store_id?: string;
  id: string;
}

export interface UpdateSalesChannelParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  status: SalesChannelEditableStatus;
  replacement_default_sales_channel_id?: string;
}

export interface DeleteSalesChannelParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  replacement_default_sales_channel_id?: string;
}

export interface FindSalesChannelsParams {
  store_id?: string;
  key?: string;
  status?: SalesChannelStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface GetSalesChannelByKeyParams {
  store_id?: string;
  key: string;
}
