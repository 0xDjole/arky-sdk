import type { EpochMilliseconds } from "./time";

export type SupportAccessStatus = { type: "active" } | { type: "ended"; at: EpochMilliseconds };

export interface SupportAccess {
  id: string;
  store_id: string;
  account_id: string;
  reason: string;
  expires_at: EpochMilliseconds;
  status: SupportAccessStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OpenSupportAccessParams {
  store_id: string;
  id: string;
  reason: string;
  expires_at: EpochMilliseconds;
}

export interface FindOwnSupportAccessesParams {
  limit?: number;
  cursor?: string | null;
}

export interface FindSupportAccessesParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetSupportAccessParams {
  store_id: string;
  id: string;
}

export interface EndSupportAccessParams {
  store_id: string;
  id: string;
}
