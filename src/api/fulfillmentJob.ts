import { requireRequestId } from "../utils/requestId";
import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  DecideFulfillmentJobParams,
  FindFulfillmentJobsParams,
  FulfillmentJob,
  FulfillmentJobItem,
  GetFulfillmentJobParams,
} from "../types/fulfillmentJob";
import type {
  FulfillmentUnitSlots,
  ResolveFulfillmentUnitSlotsParams,
} from "../types/fulfillmentUnitSelection";

export const createFulfillmentJobApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/fulfillment-jobs`;
  const jobPath = (storeId: string, fulfillmentJobId: string) =>
    `${basePath(storeId)}/${encodeURIComponent(fulfillmentJobId)}`;

  return {
    find(
      params: FindFulfillmentJobsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<FulfillmentJob>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FulfillmentJob>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    get(params: GetFulfillmentJobParams, options?: RequestOptions): Promise<FulfillmentJob> {
      return apiConfig.httpClient.get<FulfillmentJob>(
        jobPath(params.store_id, params.fulfillment_job_id),
        options,
      );
    },
    items(
      params: GetFulfillmentJobParams,
      options?: RequestOptions,
    ): Promise<FulfillmentJobItem[]> {
      return apiConfig.httpClient.get<FulfillmentJobItem[]>(
        `${jobPath(params.store_id, params.fulfillment_job_id)}/items`,
        options,
      );
    },
    unitSlots(
      params: ResolveFulfillmentUnitSlotsParams,
      options?: RequestOptions,
    ): Promise<FulfillmentUnitSlots> {
      const { store_id, fulfillment_job_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentUnitSlots>(
        `${jobPath(store_id, fulfillment_job_id)}/unit-slots`,
        payload,
        options,
      );
    },
    decide(
      params: DecideFulfillmentJobParams,
      options?: RequestOptions,
    ): Promise<FulfillmentJob> {
      requireRequestId(params.request_id);
      const { store_id, fulfillment_job_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentJob>(
        `${jobPath(store_id, fulfillment_job_id)}/decisions`,
        payload,
        options,
      );
    },
  };
};
