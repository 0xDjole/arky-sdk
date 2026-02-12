import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface NetworkSearchParams {
  query?: string;
  limit?: number;
  cursor?: string;
  statuses?: string[];
  blocks?: any[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
  createdAtFrom?: number;
  createdAtTo?: number;
  priceFrom?: number;
  priceTo?: number;
  matchAll?: boolean;
}

export const createNetworkApi = (apiConfig: ApiConfig) => {
  return {
    
    async searchServices(
      networkKey: string,
      params?: NetworkSearchParams,
      options?: RequestOptions
    ) {
      const queryParams: Record<string, any> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.statuses && params.statuses.length > 0)
        queryParams.statuses = params.statuses.join(",");
      if (params?.sortField) queryParams.sortField = params.sortField;
      if (params?.sortDirection) queryParams.sortDirection = params.sortDirection;
      if (params?.createdAtFrom !== undefined)
        queryParams.createdAtFrom = params.createdAtFrom;
      if (params?.createdAtTo !== undefined)
        queryParams.createdAtTo = params.createdAtTo;
      if (params?.priceFrom !== undefined) queryParams.priceFrom = params.priceFrom;
      if (params?.priceTo !== undefined) queryParams.priceTo = params.priceTo;
      if (params?.matchAll !== undefined) queryParams.matchAll = params.matchAll;
      if (params?.blocks && params.blocks.length > 0)
        queryParams.blocks = JSON.stringify(params.blocks);

      return apiConfig.httpClient.get(`/v1/networks/${networkKey}/services`, {
        ...options,
        params: queryParams,
      });
    },

    async searchProducts(
      networkKey: string,
      params?: NetworkSearchParams,
      options?: RequestOptions
    ) {
      const queryParams: Record<string, any> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.statuses && params.statuses.length > 0)
        queryParams.statuses = params.statuses.join(",");
      if (params?.sortField) queryParams.sortField = params.sortField;
      if (params?.sortDirection) queryParams.sortDirection = params.sortDirection;
      if (params?.createdAtFrom !== undefined)
        queryParams.createdAtFrom = params.createdAtFrom;
      if (params?.createdAtTo !== undefined)
        queryParams.createdAtTo = params.createdAtTo;
      if (params?.priceFrom !== undefined) queryParams.priceFrom = params.priceFrom;
      if (params?.priceTo !== undefined) queryParams.priceTo = params.priceTo;
      if (params?.matchAll !== undefined) queryParams.matchAll = params.matchAll;
      if (params?.blocks && params.blocks.length > 0)
        queryParams.blocks = JSON.stringify(params.blocks);

      return apiConfig.httpClient.get(`/v1/networks/${networkKey}/products`, {
        ...options,
        params: queryParams,
      });
    },

    async searchProviders(
      networkKey: string,
      params?: NetworkSearchParams,
      options?: RequestOptions
    ) {
      const queryParams: Record<string, any> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;
      if (params?.statuses && params.statuses.length > 0)
        queryParams.statuses = params.statuses.join(",");
      if (params?.sortField) queryParams.sortField = params.sortField;
      if (params?.sortDirection) queryParams.sortDirection = params.sortDirection;
      if (params?.createdAtFrom !== undefined)
        queryParams.createdAtFrom = params.createdAtFrom;
      if (params?.createdAtTo !== undefined)
        queryParams.createdAtTo = params.createdAtTo;
      if (params?.matchAll !== undefined) queryParams.matchAll = params.matchAll;
      if (params?.blocks && params.blocks.length > 0)
        queryParams.blocks = JSON.stringify(params.blocks);

      return apiConfig.httpClient.get(`/v1/networks/${networkKey}/providers`, {
        ...options,
        params: queryParams,
      });
    },
  };
};
