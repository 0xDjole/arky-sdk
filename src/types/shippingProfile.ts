import type { EpochMilliseconds } from "./time";

export type ShippingProfileEditableStatus =
  | { type: "active" }
  | { type: "archived" };
export type ShippingProfileStatus =
  ShippingProfileEditableStatus | { type: "deleting" };

export interface ShippingProfile {
  id: string;
  store_id: string;
  key: string;
  status: ShippingProfileStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateShippingProfileParams {
  store_id?: string;
  key: string;
  status: ShippingProfileEditableStatus;
}

export interface UpdateShippingProfileParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: ShippingProfileEditableStatus;
}

export interface GetShippingProfileParams {
  store_id?: string;
  id: string;
}

export interface FindShippingProfilesParams {
  store_id?: string;
  key?: string;
  status?: ShippingProfileStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface GetShippingProfileByKeyParams {
  store_id?: string;
  key: string;
}

export interface DeleteShippingProfileParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
