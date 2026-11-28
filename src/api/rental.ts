import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { ActOnRentalParams, FindRentalsParams, GetRentalParams, Rental, RentalDetail, RentalListItem } from "../types/rental";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

export const createRentalApi = (apiConfig: ApiConfig) => ({
  find(params: FindRentalsParams, options?: RequestOptions): Promise<PaginatedResponse<RentalListItem>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<RentalListItem>>(tenantPath(tenant_id, "rentals"), { ...options, params: query });
  },

  get(params: GetRentalParams, options?: RequestOptions): Promise<RentalDetail> {
    return apiConfig.httpClient.get<RentalDetail>(tenantRecordPath(params.tenant_id, "rentals", params.id), options);
  },

  execute(params: ActOnRentalParams, options?: RequestOptions): Promise<Rental> {
    if (params.command.type === "request_replacement") {
      requireId(params.command.fulfillment_job_id, "fulfillment job");
      requireId(params.command.fulfillment_job_line_id, "fulfillment job line");
    }
    return apiConfig.httpClient.post<Rental>(
      `${tenantRecordPath(params.tenant_id, "rentals", params.id)}/execute`,
      { expected_updated_at: params.expected_updated_at, command: params.command },
      options,
    );
  },
});
