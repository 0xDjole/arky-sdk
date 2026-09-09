import type { EpochMilliseconds } from "./time";

export type AssortmentEditableStatus =
  { type: "draft" } | { type: "active" } | { type: "archived" };

export type AssortmentStatus = AssortmentEditableStatus | { type: "deleting" };

export interface Assortment {
  id: string;
  store_id: string;
  key: string;
  name: string;
  status: AssortmentStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface AssortmentUsage {
  catalog_ids: string[];
  more_catalogs: boolean;
  item_ids: string[];
  more_items: boolean;
}

export interface CreateAssortmentParams {
  store_id?: string;
  key: string;
  name: string;
  status: AssortmentEditableStatus;
}

export interface GetAssortmentParams {
  store_id?: string;
  id: string;
}

export interface UpdateAssortmentParams extends GetAssortmentParams {
  expected_updated_at: EpochMilliseconds;
  name: string;
  status: AssortmentEditableStatus;
}

export interface DeleteAssortmentParams extends GetAssortmentParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindAssortmentsParams {
  store_id?: string;
  key?: string;
  limit?: number;
  cursor?: string;
}
