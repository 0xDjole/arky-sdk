import type { EpochMilliseconds } from "./time";

export type StorefrontClientStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export interface StorefrontClientRegistration {
  id: string;
  store_id: string;
  key: string;
  name: string;
  sales_channel_ids: string[];
  status: StorefrontClientStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateStorefrontClientParams {
  store_id?: string;
  id: string;
  key: string;
  name: string;
  publishable_key: string;
  sales_channel_ids: string[];
}

export interface UpdateStorefrontClientParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  sales_channel_ids: string[];
}

export interface RevokeStorefrontClientParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetStorefrontClientParams {
  store_id?: string;
  id: string;
}

export interface FindStorefrontClientsParams {
  store_id?: string;
  sales_channel_id?: string;
  limit?: number;
  cursor?: string;
}
