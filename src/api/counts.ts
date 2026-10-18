import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type {
  GetStoreStatusCountsParams,
  GetStoreCountReportParams,
  StoreCountReport,
  StoreStatusCounts,
} from "../types/storeCount";
import { storePath } from "./paths";

export const createCountsApi = (apiConfig: ApiConfig) => ({
  getStatuses(params: GetStoreStatusCountsParams, options?: RequestOptions): Promise<StoreStatusCounts> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<StoreStatusCounts>(storePath(store_id, "counts/statuses"), {
      ...options,
      params: query,
    });
  },

  getReport(params: GetStoreCountReportParams, options?: RequestOptions): Promise<StoreCountReport> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<StoreCountReport>(storePath(store_id, "counts/report"), {
      ...options,
      params: query,
    });
  },
});
