import type { EpochMilliseconds } from "./time";

export type RoutingCondition =
  | { type: "markets"; market_ids: string[] }
  | { type: "sales_channels"; sales_channel_ids: string[] }
  | { type: "zones"; zone_ids: string[] }
  | { type: "shipping_profiles"; shipping_profile_ids: string[] };

export type RoutingConditionType = RoutingCondition["type"];

export type LocationPick = { type: "in_list_order" } | { type: "most_stock" };

export type RoutingSplit = { type: "never" } | { type: "when_needed" };

export type RoutingAssign =
  | { type: "staff" }
  | { type: "automatic"; pick: LocationPick; split: RoutingSplit };

export interface RoutingTarget {
  location_ids: string[];
  assign: RoutingAssign;
}

export type RoutingRuleStatus = { type: "active" } | { type: "paused" };

export interface RoutingRule {
  id: string;
  key: string;
  conditions: RoutingCondition[];
  target: RoutingTarget;
  status: RoutingRuleStatus;
}

export interface FulfillmentRouting {
  store_id: string;
  rules: RoutingRule[];
  otherwise: RoutingTarget;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetFulfillmentRoutingParams {
  store_id: string;
}

export interface UpdateFulfillmentRoutingParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  rules: RoutingRule[];
  otherwise: RoutingTarget;
}
