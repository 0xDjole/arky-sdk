import type { EpochMilliseconds } from "./time";
import type { AccountActor } from "./common";
import type { StorePermission } from "./storeRole";

export type BotCheck =
  | { type: "off" }
  | { type: "turnstile"; site_key: string }
  | { type: "h_captcha"; site_key: string };

export type BotCheckInput =
  | { type: "off" }
  | { type: "turnstile"; site_key: string; secret_key: string }
  | { type: "h_captcha"; site_key: string; secret_key: string };

export type ApiKeyType =
  | { type: "publishable"; token: string; sales_channel_id: string; bot_check: BotCheck }
  | { type: "secret"; token_hint: string; permissions: StorePermission[]; created_by: AccountActor; expires_at: EpochMilliseconds | null };

export type ApiKeyStatus = { type: "active" } | { type: "revoked"; revoked_at: EpochMilliseconds };

export interface ApiKey {
  id: string;
  store_id: string;
  name: string;
  type: ApiKeyType;
  status: ApiKeyStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ApiKeyCreated =
  | { type: "created"; key: ApiKey; value?: string }
  | { type: "existing"; key: ApiKey };

export interface FindApiKeysParams {
  store_id: string;
  sales_channel_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetApiKeyParams { store_id: string; id: string }

export interface CreateApiKeyParams {
  store_id: string;
  id: string;
  name: string;
  type:
    | { type: "publishable"; sales_channel_id: string; bot_check: BotCheckInput }
    | { type: "secret"; permissions: StorePermission[]; expires_at: EpochMilliseconds | null };
}

export interface RevokeApiKeyParams { store_id: string; id: string; expected_updated_at: EpochMilliseconds }
export interface DeleteApiKeyParams { store_id: string; id: string; expected_updated_at: EpochMilliseconds }
