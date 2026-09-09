import type { EpochMilliseconds } from "./time";
import type { SellableRef } from "./sellable";

export interface AssortmentItem {
  id: string;
  store_id: string;
  assortment_id: string;
  sellable: SellableRef;
  position: number | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateAssortmentItemParams {
  store_id?: string;
  assortment_id: string;
  sellable: SellableRef;
  position?: number | null;
}

export interface GetAssortmentItemParams {
  store_id?: string;
  id: string;
}

export interface UpdateAssortmentItemParams extends GetAssortmentItemParams {
  expected_updated_at: EpochMilliseconds;
  position: number | null;
}

export interface DeleteAssortmentItemParams extends GetAssortmentItemParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindAssortmentItemsParams {
  store_id?: string;
  assortment_id: string;
  limit?: number;
  cursor?: string;
}
