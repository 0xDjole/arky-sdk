import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateSalesChannelParams,
  DeleteSalesChannelParams,
  FindSalesChannelsParams,
  SalesChannel,
  StoreRecordByKeyParams,
  StoreRecordParams,
  UpdateSalesChannelParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "sales-channels";

export const createSalesChannelApi = (apiConfig: ApiConfig) => ({
  find(params: FindSalesChannelsParams, options?: RequestOptions): Promise<PaginatedResponse<SalesChannel>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<SalesChannel>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<SalesChannel> {
    return apiConfig.httpClient.get<SalesChannel>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  getByKey(params: StoreRecordByKeyParams, options?: RequestOptions): Promise<SalesChannel> {
    return apiConfig.httpClient.get<SalesChannel>(
      storePath(params.store_id, `${collection}/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateSalesChannelParams, options?: RequestOptions): Promise<SalesChannel> {
    requireId(params.id, "sales channel");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<SalesChannel>(storePath(store_id, collection), body, options);
  },

  update(params: UpdateSalesChannelParams, options?: RequestOptions): Promise<SalesChannel> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<SalesChannel>(storeRecordPath(store_id, collection, id), body, options);
  },

  delete(params: DeleteSalesChannelParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
