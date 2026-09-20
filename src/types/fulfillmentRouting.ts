import type { EpochMilliseconds } from "./time";

export type FulfillmentRoutingStrategy =
  | { type: "single_location" }
  | { type: "minimize_splits" }
  | { type: "split_by_priority" };

export type FulfillmentRoutingPolicyEditableStatus =
  | { type: "active" }
  | { type: "archived" };

export type FulfillmentRoutingPolicyStatus =
  FulfillmentRoutingPolicyEditableStatus | { type: "deleting" };

export interface FulfillmentRoutingLocation {
  store_location_id: string;
  priority: number;
}

export interface FulfillmentRoutingPolicy {
  id: string;
  store_id: string;
  key: string;
  market_id: string;
  sales_channel_id: string;
  market_zone_id: string | null;
  shipping_profile_id: string | null;
  strategy: FulfillmentRoutingStrategy;
  locations: FulfillmentRoutingLocation[];
  status: FulfillmentRoutingPolicyStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateFulfillmentRoutingPolicyParams {
  store_id?: string;
  key: string;
  market_id: string;
  sales_channel_id: string;
  market_zone_id: string | null;
  shipping_profile_id: string | null;
  strategy: FulfillmentRoutingStrategy;
  locations: FulfillmentRoutingLocation[];
  status: FulfillmentRoutingPolicyEditableStatus;
}

export interface UpdateFulfillmentRoutingPolicyParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  market_id: string;
  sales_channel_id: string;
  market_zone_id: string | null;
  shipping_profile_id: string | null;
  strategy: FulfillmentRoutingStrategy;
  locations: FulfillmentRoutingLocation[];
  status: FulfillmentRoutingPolicyEditableStatus;
}

export interface GetFulfillmentRoutingPolicyParams {
  store_id?: string;
  id: string;
}

export interface GetFulfillmentRoutingPolicyByKeyParams {
  store_id?: string;
  key: string;
}

export interface FindFulfillmentRoutingPoliciesParams {
  store_id?: string;
  market_id?: string;
  sales_channel_id?: string;
  limit?: number;
  cursor?: string;
}

export interface DeleteFulfillmentRoutingPolicyParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
