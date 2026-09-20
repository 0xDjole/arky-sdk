import type { EpochMilliseconds } from "./time";

export type MarketSalesChannelStatus =
  | { type: "active" }
  | { type: "deleting" };

export interface MarketSalesChannel {
  id: string;
  store_id: string;
  market_id: string;
  sales_channel_id: string;
  status: MarketSalesChannelStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateMarketSalesChannelParams {
  store_id?: string;
  market_id: string;
  sales_channel_id: string;
}

export interface GetMarketSalesChannelParams {
  store_id?: string;
  id: string;
}

export interface FindMarketSalesChannelsParams {
  store_id?:string;
  market_id?:string;
  sales_channel_id?:string;
  status?: "active"|"deleting";
  sort_field?: "created_at"|"updated_at";
  sort_direction?: "asc"|"desc";
  limit?:number;
  cursor?:string;
}

export interface GetMarketSalesChannelByBindingParams {
  store_id?:string;
  market_id:string;
  sales_channel_id:string;
}

export interface RemoveMarketSalesChannelParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
