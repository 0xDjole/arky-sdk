import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateMarketParams,
  DeleteMarketParams,
  FindMarketsParams,
  Market,
  StoreRecordByKeyParams,
  StoreRecordParams,
  UpdateMarketParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createMarketApi = (apiConfig: ApiConfig) => ({
  list(params: FindMarketsParams, options?: RequestOptions): Promise<PaginatedResponse<Market>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Market>>(storePath(store_id, "markets"), { ...options, params: query });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<Market> {
    return apiConfig.httpClient.get<Market>(storeRecordPath(params.store_id, "markets", params.id), options);
  },

  getByKey(params: StoreRecordByKeyParams, options?: RequestOptions): Promise<Market> {
    return apiConfig.httpClient.get<Market>(storePath(params.store_id, `markets/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateMarketParams, options?: RequestOptions): Promise<Market> {
    requireId(params.id, "market");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Market>(storePath(store_id, "markets"), body, options);
  },

  update(params: UpdateMarketParams, options?: RequestOptions): Promise<Market> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Market>(storeRecordPath(store_id, "markets", id), body, options);
  },

  delete(params: DeleteMarketParams, options?: RequestOptions): Promise<Market> {
    return apiConfig.httpClient.delete<Market>(storeRecordPath(params.store_id, "markets", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
