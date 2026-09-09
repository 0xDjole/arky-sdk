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
  limit?: number;
  cursor?: string;
  key?: string;
  status?: SalesChannelStatus;
}
