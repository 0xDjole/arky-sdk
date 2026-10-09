import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  BatchCatalogItemsParams,
  BatchPricesParams,
  Catalog,
  CatalogAccess,
  CatalogCopyResult,
  CatalogItem,
  CopyCatalogParams,
  CreateCatalogAccessParams,
  CreateCatalogItemParams,
  CreateCatalogParams,
  CreatePriceParams,
  DeleteCatalogAccessParams,
  DeleteCatalogItemParams,
  DeleteCatalogParams,
  DeletePriceParams,
  FindCatalogAccessesParams,
  FindCatalogItemsParams,
  FindCatalogsParams,
  FindPricesParams,
  FindPurchasableCatalogsParams,
  GetCatalogAccessParams,
  GetCatalogByKeyParams,
  GetCatalogItemParams,
  GetCatalogParams,
  GetPriceParams,
  Price,
  UpdateCatalogItemParams,
  UpdateCatalogParams,
  UpdatePriceParams,
} from "../types/catalog";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCatalogApi = (apiConfig: ApiConfig) => ({
  find(params: FindCatalogsParams, options?: RequestOptions): Promise<PaginatedResponse<Catalog>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Catalog>>(storePath(store_id, "catalogs"), { ...options, params: query });
  },

  findPurchasable(params: FindPurchasableCatalogsParams, options?: RequestOptions): Promise<Catalog[]> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<Catalog[]>(storePath(store_id, "catalogs/purchasable"), { ...options, params: query });
  },

  get(params: GetCatalogParams, options?: RequestOptions): Promise<Catalog> {
    return apiConfig.httpClient.get<Catalog>(storeRecordPath(params.store_id, "catalogs", params.id), options);
  },

  getByKey(params: GetCatalogByKeyParams, options?: RequestOptions): Promise<Catalog> {
    return apiConfig.httpClient.get<Catalog>(storePath(params.store_id, `catalogs/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateCatalogParams, options?: RequestOptions): Promise<Catalog> {
    requireId(params.id, "catalog");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Catalog>(storePath(store_id, "catalogs"), body, options);
  },

  update(params: UpdateCatalogParams, options?: RequestOptions): Promise<Catalog> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Catalog>(storeRecordPath(store_id, "catalogs", id), body, options);
  },

  copy(params: CopyCatalogParams, options?: RequestOptions): Promise<CatalogCopyResult> {
    return apiConfig.httpClient.post<CatalogCopyResult>(
      `${storeRecordPath(params.store_id, "catalogs", params.id)}/copy`,
      { source_catalog_id: params.source_catalog_id },
      options,
    );
  },

  delete(params: DeleteCatalogParams, options?: RequestOptions): Promise<Catalog> {
    return apiConfig.httpClient.delete<Catalog>(storeRecordPath(params.store_id, "catalogs", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createPriceApi = (apiConfig: ApiConfig) => ({
  find(params: FindPricesParams, options?: RequestOptions): Promise<PaginatedResponse<Price>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Price>>(storePath(store_id, "prices"), { ...options, params: query });
  },

  get(params: GetPriceParams, options?: RequestOptions): Promise<Price> {
    return apiConfig.httpClient.get<Price>(storeRecordPath(params.store_id, "prices", params.id), options);
  },

  create(params: CreatePriceParams, options?: RequestOptions): Promise<Price> {
    requireId(params.id, "price");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Price>(storePath(store_id, "prices"), body, options);
  },

  update(params: UpdatePriceParams, options?: RequestOptions): Promise<Price> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Price>(storeRecordPath(store_id, "prices", id), body, options);
  },

  batch(params: BatchPricesParams, options?: RequestOptions): Promise<Price[]> {
    for (const operation of params.operations) {
      if (operation.type === "create") requireId(operation.id, "price");
    }
    return apiConfig.httpClient.post<Price[]>(
      storePath(params.store_id, "prices/batch"),
      { operations: params.operations },
      options,
    );
  },

  delete(params: DeletePriceParams, options?: RequestOptions): Promise<void> {
    return apiConfig.httpClient.delete<void>(storeRecordPath(params.store_id, "prices", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCatalogItemApi = (apiConfig: ApiConfig) => ({
  find(params: FindCatalogItemsParams, options?: RequestOptions): Promise<PaginatedResponse<CatalogItem>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CatalogItem>>(storePath(store_id, "catalog-items"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
    return apiConfig.httpClient.get<CatalogItem>(storeRecordPath(params.store_id, "catalog-items", params.id), options);
  },

  create(params: CreateCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
    requireId(params.id, "catalog item");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CatalogItem>(storePath(store_id, "catalog-items"), body, options);
  },

  update(params: UpdateCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<CatalogItem>(storeRecordPath(store_id, "catalog-items", id), body, options);
  },

  batch(params: BatchCatalogItemsParams, options?: RequestOptions): Promise<CatalogItem[]> {
    for (const operation of params.operations) {
      if (operation.type === "create") requireId(operation.id, "catalog item");
    }
    return apiConfig.httpClient.post<CatalogItem[]>(
      storePath(params.store_id, "catalog-items/batch"),
      { operations: params.operations },
      options,
    );
  },

  delete(params: DeleteCatalogItemParams, options?: RequestOptions): Promise<void> {
    return apiConfig.httpClient.delete<void>(storeRecordPath(params.store_id, "catalog-items", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createCatalogAccessApi = (apiConfig: ApiConfig) => ({
  find(params: FindCatalogAccessesParams, options?: RequestOptions): Promise<PaginatedResponse<CatalogAccess>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CatalogAccess>>(storePath(store_id, "catalog-accesses"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCatalogAccessParams, options?: RequestOptions): Promise<CatalogAccess> {
    return apiConfig.httpClient.get<CatalogAccess>(storeRecordPath(params.store_id, "catalog-accesses", params.id), options);
  },

  create(params: CreateCatalogAccessParams, options?: RequestOptions): Promise<CatalogAccess> {
    requireId(params.id, "catalog access");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CatalogAccess>(storePath(store_id, "catalog-accesses"), body, options);
  },

  delete(params: DeleteCatalogAccessParams, options?: RequestOptions): Promise<void> {
    return apiConfig.httpClient.delete<void>(storeRecordPath(params.store_id, "catalog-accesses", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
