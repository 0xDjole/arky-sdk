import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { ActOnRentalParams, FindRentalsParams, GetRentalParams, Rental, RentalDetail } from "../types/rental";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createRentalApi = (apiConfig: ApiConfig) => ({
  find(params: FindRentalsParams, options?: RequestOptions): Promise<PaginatedResponse<Rental>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Rental>>(storePath(store_id, "rentals"), { ...options, params: query });
  },

  get(params: GetRentalParams, options?: RequestOptions): Promise<RentalDetail> {
    return apiConfig.httpClient.get<RentalDetail>(storeRecordPath(params.store_id, "rentals", params.id), options);
  },

  execute(params: ActOnRentalParams, options?: RequestOptions): Promise<Rental> {
    if (params.action.type === "request_replacement") {
      requireId(params.action.fulfillment_job_id, "fulfillment job");
      requireId(params.action.fulfillment_job_line_id, "fulfillment job line");
    }
    return apiConfig.httpClient.post<Rental>(
      `${storeRecordPath(params.store_id, "rentals", params.id)}/commands`,
      { expected_updated_at: params.expected_updated_at, type: params.action },
      options,
    );
  },
});
