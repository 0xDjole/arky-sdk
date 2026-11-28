import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  BatchPackageItemPricesParams,
  BatchPackageItemsParams,
  CopyPackageParams,
  CreatePackageAccessParams,
  CreatePackageItemParams,
  CreatePackageItemPriceParams,
  CreatePackageParams,
  DeletePackageAccessParams,
  DeletePackageItemParams,
  DeletePackageItemPriceParams,
  DeletePackageParams,
  FindPackageAccessesParams,
  FindPackageItemPricesParams,
  FindPackageItemsParams,
  FindPackagesByIdsParams,
  FindPackagesParams,
  FindPurchasablePackagesParams,
  GetPackageAccessParams,
  GetPackageByKeyParams,
  GetPackageItemParams,
  GetPackageItemPriceByChoiceParams,
  GetPackageItemPriceParams,
  GetPackageParams,
  Package,
  PackageAccess,
  PackageCopyResult,
  PackageDetail,
  PackageItem,
  PackageItemPrice,
  PackageItemPricePage,
  PackageSummary,
  SetPackageItemPricesParams,
  UpdatePackageItemParams,
  UpdatePackageItemPriceParams,
  UpdatePackageParams,
} from "../types/package";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createPackageApi = (apiConfig: ApiConfig) => ({
  find(params: FindPackagesParams, options?: RequestOptions): Promise<PaginatedResponse<PackageSummary>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PackageSummary>>(tenantPath(tenant_id, "packages"), { ...options, params: query });
  },

  findPurchasable(params: FindPurchasablePackagesParams, options?: RequestOptions): Promise<Package[]> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<Package[]>(tenantPath(tenant_id, "packages/purchasable"), { ...options, params: query });
  },

  findByIds(params: FindPackagesByIdsParams, options?: RequestOptions): Promise<PaginatedResponse<PackageDetail>> {
    return apiConfig.httpClient.get<PaginatedResponse<PackageDetail>>(tenantPath(params.tenant_id, "packages/by-ids"), {
      ...options,
      params: { ids: params.ids },
    });
  },

  get(params: GetPackageParams, options?: RequestOptions): Promise<PackageDetail> {
    return apiConfig.httpClient.get<PackageDetail>(tenantRecordPath(params.tenant_id, "packages", params.id), options);
  },

  getByKey(params: GetPackageByKeyParams, options?: RequestOptions): Promise<PackageDetail> {
    return apiConfig.httpClient.get<PackageDetail>(tenantPath(params.tenant_id, `packages/by-key/${segment(params.key)}`), options);
  },

  create(params: CreatePackageParams, options?: RequestOptions): Promise<PackageDetail> {
    requireId(params.id, "package");
    for (const operation of params.items) {
      if (operation.action === "create") requireId(operation.id, "package item");
    }
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PackageDetail>(tenantPath(tenant_id, "packages"), body, options);
  },

  update(params: UpdatePackageParams, options?: RequestOptions): Promise<PackageDetail> {
    for (const operation of params.items) {
      if (operation.action === "create") requireId(operation.id, "package item");
    }
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PackageDetail>(tenantRecordPath(tenant_id, "packages", id), body, options);
  },

  copy(params: CopyPackageParams, options?: RequestOptions): Promise<PackageCopyResult> {
    return apiConfig.httpClient.post<PackageCopyResult>(
      `${tenantRecordPath(params.tenant_id, "packages", params.id)}/copy`,
      {
        source_package_id: params.source_package_id,
        source_market_id: params.source_market_id,
        target_market_id: params.target_market_id,
        cursor: params.cursor ?? null,
      },
      options,
    );
  },

  delete(params: DeletePackageParams, options?: RequestOptions): Promise<Package> {
    return apiConfig.httpClient.delete<Package>(tenantRecordPath(params.tenant_id, "packages", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createPackageItemPriceApi = (apiConfig: ApiConfig) => ({
  find(params: FindPackageItemPricesParams, options?: RequestOptions): Promise<PackageItemPricePage> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PackageItemPricePage>(tenantPath(tenant_id, "package-item-prices"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPackageItemPriceParams, options?: RequestOptions): Promise<PackageItemPrice> {
    return apiConfig.httpClient.get<PackageItemPrice>(
      tenantRecordPath(params.tenant_id, "package-item-prices", params.id),
      options,
    );
  },

  getByChoice(params: GetPackageItemPriceByChoiceParams, options?: RequestOptions): Promise<PackageItemPrice> {
    requireId(params.package_item_id, "package item");
    return apiConfig.httpClient.get<PackageItemPrice>(tenantPath(params.tenant_id, "package-item-prices/by-choice"), {
      ...options,
      params: { package_item_id: params.package_item_id, sellable: params.sellable },
    });
  },

  create(params: CreatePackageItemPriceParams, options?: RequestOptions): Promise<PackageItemPrice> {
    requireId(params.id, "package item price");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PackageItemPrice>(tenantPath(tenant_id, "package-item-prices"), body, options);
  },

  update(params: UpdatePackageItemPriceParams, options?: RequestOptions): Promise<PackageItemPrice> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PackageItemPrice>(tenantRecordPath(tenant_id, "package-item-prices", id), body, options);
  },

  batch(params: BatchPackageItemPricesParams, options?: RequestOptions): Promise<PackageItemPrice[]> {
    for (const operation of params.operations) {
      if (operation.type === "create") requireId(operation.id, "package item price");
    }
    return apiConfig.httpClient.post<PackageItemPrice[]>(
      tenantPath(params.tenant_id, "package-item-prices/batch"),
      { operations: params.operations },
      options,
    );
  },

  delete(params: DeletePackageItemPriceParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, "package-item-prices", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createPackageItemApi = (apiConfig: ApiConfig) => ({
  find(params: FindPackageItemsParams, options?: RequestOptions): Promise<PaginatedResponse<PackageItem>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PackageItem>>(tenantPath(tenant_id, "package-items"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPackageItemParams, options?: RequestOptions): Promise<PackageItem> {
    return apiConfig.httpClient.get<PackageItem>(tenantRecordPath(params.tenant_id, "package-items", params.id), options);
  },

  create(params: CreatePackageItemParams, options?: RequestOptions): Promise<PackageItem> {
    requireId(params.id, "package item");
    if (params.item.type === "package") requireId(params.item.price.id, "package item price");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PackageItem>(tenantPath(tenant_id, "package-items"), body, options);
  },

  update(params: UpdatePackageItemParams, options?: RequestOptions): Promise<PackageItem> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PackageItem>(tenantRecordPath(tenant_id, "package-items", id), body, options);
  },

  setAllPrices(params: SetPackageItemPricesParams, options?: RequestOptions): Promise<PackageItem> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<PackageItem>(`${tenantRecordPath(tenant_id, "package-items", id)}/prices/all`, body, options);
  },

  batch(params: BatchPackageItemsParams, options?: RequestOptions): Promise<PackageItem[]> {
    for (const operation of params.operations) {
      if (operation.type !== "create") continue;
      requireId(operation.id, "package item");
      if (operation.item.type === "package") requireId(operation.item.price.id, "package item price");
    }
    return apiConfig.httpClient.post<PackageItem[]>(
      tenantPath(params.tenant_id, "package-items/batch"),
      { operations: params.operations },
      options,
    );
  },

  delete(params: DeletePackageItemParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, "package-items", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createPackageAccessApi = (apiConfig: ApiConfig) => ({
  find(params: FindPackageAccessesParams, options?: RequestOptions): Promise<PaginatedResponse<PackageAccess>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PackageAccess>>(tenantPath(tenant_id, "package-accesses"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPackageAccessParams, options?: RequestOptions): Promise<PackageAccess> {
    return apiConfig.httpClient.get<PackageAccess>(tenantRecordPath(params.tenant_id, "package-accesses", params.id), options);
  },

  create(params: CreatePackageAccessParams, options?: RequestOptions): Promise<PackageAccess> {
    requireId(params.id, "package access");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PackageAccess>(tenantPath(tenant_id, "package-accesses"), body, options);
  },

  delete(params: DeletePackageAccessParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, "package-accesses", params.id), options);
  },
});
