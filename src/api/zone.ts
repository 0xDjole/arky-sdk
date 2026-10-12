import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateZoneParams,
  DeleteZoneParams,
  FindZonesParams,
  Zone,
  StoreRecordByKeyParams,
  StoreRecordParams,
  UpdateZoneParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "zones";

export const createZoneApi = (apiConfig: ApiConfig) => ({
  find(params: FindZonesParams, options?: RequestOptions): Promise<PaginatedResponse<Zone>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Zone>>(storePath(store_id, collection), { ...options, params: query });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<Zone> {
    return apiConfig.httpClient.get<Zone>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  getByKey(params: StoreRecordByKeyParams, options?: RequestOptions): Promise<Zone> {
    return apiConfig.httpClient.get<Zone>(storePath(params.store_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateZoneParams, options?: RequestOptions): Promise<Zone> {
    requireId(params.id, "zone");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Zone>(storePath(store_id, collection), body, options);
  },

  update(params: UpdateZoneParams, options?: RequestOptions): Promise<Zone> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Zone>(storeRecordPath(store_id, collection, id), body, options);
  },

  delete(params: DeleteZoneParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
