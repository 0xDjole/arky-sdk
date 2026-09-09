import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  SalesChannel,
  CreateSalesChannelParams,
  GetSalesChannelParams,
  FindSalesChannelsParams,
  DeleteSalesChannelParams,
  UpdateSalesChannelParams,
  SalesChannelUsage,
} from "../types/salesChannel";

export const createSalesChannelApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/sales-channels`;
  return {
    create(
      params: CreateSalesChannelParams,
      options?: RequestOptions,
    ): Promise<SalesChannel> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SalesChannel>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetSalesChannelParams,
      options?: RequestOptions,
    ): Promise<SalesChannel> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<SalesChannel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindSalesChannelsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SalesChannel>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SalesChannel>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateSalesChannelParams,
      options?: RequestOptions,
    ): Promise<SalesChannel> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<SalesChannel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteSalesChannelParams,
      options?: RequestOptions,
    ): Promise<SalesChannel> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<SalesChannel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
    usage(
      params: GetSalesChannelParams,
      options?: RequestOptions,
    ): Promise<SalesChannelUsage> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<SalesChannelUsage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/usage`,
        options,
      );
    },
  };
};
