import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  BatchCatalogItemPricesParams,
  BatchCatalogItemsParams,
  Catalog,
  CatalogAccess,
  CatalogCopyResult,
  CatalogItem,
  CatalogItemPrice,
  CatalogItemPricePage,
  CopyCatalogParams,
  CreateCatalogAccessParams,
  CreateCatalogItemParams,
  CreateCatalogItemPriceParams,
  CreateCatalogParams,
  DeleteCatalogAccessParams,
  DeleteCatalogItemParams,
  DeleteCatalogItemPriceParams,
  DeleteCatalogParams,
  FindCatalogAccessesParams,
  FindCatalogItemPricesParams,
  FindCatalogItemsParams,
  FindCatalogsParams,
  FindPurchasableCatalogsParams,
  GetCatalogAccessParams,
  GetCatalogByKeyParams,
  GetCatalogItemParams,
  GetCatalogItemPriceParams,
  GetCatalogParams,
  UpdateCatalogItemParams,
  UpdateCatalogItemPriceParams,
  UpdateCatalogParams,
} from "../types/catalog";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCatalogApi = (apiConfig: ApiConfig) => ({
  find(params: FindCatalogsParams, options?: RequestOptions): Promise<PaginatedResponse<Catalog>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Catalog>>(storePath(store_id, "catalogs"), { ...options, params: query });
  },

  async findPurchasable(params: FindPurchasableCatalogsParams, options?: RequestOptions): Promise<PaginatedResponse<Catalog>> {
    const { store_id, ...query } = params;
    const items = await apiConfig.httpClient.get<Catalog[]>(storePath(store_id, "catalogs/purchasable"), { ...options, params: query });
    return { items, cursor: null };
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
      { source_catalog_id: params.source_catalog_id, cursor: params.cursor ?? null },
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

export const createCatalogItemPriceApi = (apiConfig: ApiConfig) => ({
  find(params: FindCatalogItemPricesParams, options?: RequestOptions): Promise<CatalogItemPricePage> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<CatalogItemPricePage>(storePath(store_id, "catalog-item-prices"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCatalogItemPriceParams, options?: RequestOptions): Promise<CatalogItemPrice> {
    return apiConfig.httpClient.get<CatalogItemPrice>(
      storeRecordPath(params.store_id, "catalog-item-prices", params.id),
      options,
    );
  },

  create(params: CreateCatalogItemPriceParams, options?: RequestOptions): Promise<CatalogItemPrice> {
    requireId(params.id, "catalog item price");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<CatalogItemPrice>(storePath(store_id, "catalog-item-prices"), body, options);
  },

  update(params: UpdateCatalogItemPriceParams, options?: RequestOptions): Promise<CatalogItemPrice> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<CatalogItemPrice>(storeRecordPath(store_id, "catalog-item-prices", id), body, options);
  },

  batch(params: BatchCatalogItemPricesParams, options?: RequestOptions): Promise<CatalogItemPrice[]> {
    for (const operation of params.operations) {
      if (operation.type === "create") requireId(operation.id, "catalog item price");
    }
    return apiConfig.httpClient.post<CatalogItemPrice[]>(
      storePath(params.store_id, "catalog-item-prices/batch"),
      { operations: params.operations },
      options,
    );
  },

  delete(params: DeleteCatalogItemPriceParams, options?: RequestOptions): Promise<void> {
    return apiConfig.httpClient.delete<void>(storeRecordPath(params.store_id, "catalog-item-prices", params.id), {
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
