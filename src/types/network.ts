import type { Currency } from "./common";
import type { EpochMilliseconds } from "./time";
import type { FeatureType } from "./store";

export type NetworkPayments = { type: "none" } | { type: "stripe"; account_id: string; publishable_key: string };

export interface Network {
  id: string;
  name: string;
  payments: NetworkPayments;
  email: {
    from_name: string;
    from_address: string;
    resend_webhook_id: string;
    sign_in_subject: string;
    sign_in_body: string;
  };
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PlanLimit = { type: "unlimited" } | { type: "max"; count: number };
export type PlanFeatures = Record<FeatureType, PlanLimit>;
export type NetworkPlanPrice =
  | { type: "free" }
  | { type: "lifetime"; amount: number; currency: Currency }
  | { type: "monthly"; amount: number; currency: Currency; months: number; trial_days: number | null }
  | { type: "yearly"; amount: number; currency: Currency; years: number; trial_days: number | null };

export interface NetworkPlan {
  id: string;
  network_id: string;
  name: string;
  tier: number;
  price: NetworkPlanPrice;
  features: PlanFeatures;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindNetworksParams { limit?: number; cursor?: string | null }
export interface GetNetworkParams { id: string }
export interface CreateNetworkParams {
  id: string;
  name: string;
  from_name: string;
  from_address: string;
  sign_in_subject: string;
  sign_in_body: string;
  resend_api_key: string;
}
export interface UpdateNetworkParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
  from_name?: string;
  from_address?: string;
  sign_in_subject?: string;
  sign_in_body?: string;
}
export interface DeleteNetworkParams { id: string; expected_updated_at: EpochMilliseconds }
export interface SetNetworkStripeParams extends DeleteNetworkParams {
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
}
export interface ReplaceNetworkResendKeyParams extends DeleteNetworkParams { api_key: string }
export interface FindNetworkPlansParams extends FindNetworksParams { network_id: string }
export interface CreateNetworkPlanParams {
  id: string;
  network_id: string;
  name: string;
  tier: number;
  price: NetworkPlanPrice;
  features: PlanFeatures;
}
export interface UpdateNetworkPlanParams {
  id: string;
  network_id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
  tier?: number;
  price?: NetworkPlanPrice;
  features?: PlanFeatures;
}
export interface DeleteNetworkPlanParams extends DeleteNetworkParams { network_id: string }
