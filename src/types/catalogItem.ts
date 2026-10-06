import type { EpochMilliseconds } from "./time";

export type CatalogItemRef =
  | { type: "product"; product_id: string }
  | { type: "digital_product"; digital_product_id: string }
  | { type: "booking_service"; booking_service_id: string }
  | { type: "subscription_offering"; subscription_offering_id: string };

export interface CatalogItem {
  id: string;
  store_id: string;
  catalog_id: string;
  item: CatalogItemRef;
  position: number | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCatalogItemParams {
  store_id: string;
  catalog_id: string;
  item: CatalogItemRef;
  position?: number | null;
}

export interface GetCatalogItemParams {
  store_id: string;
  id: string;
}

export interface UpdateCatalogItemParams extends GetCatalogItemParams {
  expected_updated_at: EpochMilliseconds;
  position: number | null;
}

export interface DeleteCatalogItemParams extends GetCatalogItemParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindCatalogItemsParams {
  store_id: string;
  catalog_id: string;
  item?: CatalogItemRef;
  limit?: number;
  cursor?: string;
}

export type CatalogItemBatchOperation =
  | { type: "create"; catalog_id: string; item: CatalogItemRef; position?: number | null }
  | { type: "update"; id: string; expected_updated_at: EpochMilliseconds; position: number | null }
  | { type: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface BatchCatalogItemsParams {
  store_id: string;
  operations: CatalogItemBatchOperation[];
}
