import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  ActOnFulfillmentJobParams,
  ActOnFulfillmentParams,
  CreateFulfillmentParams,
  FindFulfillmentJobsParams,
  FindFulfillmentsParams,
  Fulfillment,
  FulfillmentJob,
  FulfillmentJobItem,
  FulfillmentRouting,
  GetFulfillmentJobParams,
  GetFulfillmentParams,
  GetFulfillmentRoutingParams,
  GetMinimumProgressParams,
  MarkFulfillmentDeliveredParams,
  MinimumProgress,
  UpdateFulfillmentRoutingParams,
  UpdateFulfillmentTrackingParams,
} from "../types/fulfillment";
import type { FulfillmentUnitSlots, ResolveFulfillmentUnitSlotsParams } from "../types/fulfillmentUnitSelection";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createFulfillmentRoutingApi = (apiConfig: ApiConfig) => ({
  get(params: GetFulfillmentRoutingParams, options?: RequestOptions): Promise<FulfillmentRouting> {
    return apiConfig.httpClient.get<FulfillmentRouting>(storePath(params.store_id, "fulfillment-routing"), options);
  },

  update(params: UpdateFulfillmentRoutingParams, options?: RequestOptions): Promise<FulfillmentRouting> {
    const { store_id, ...body } = params;
    return apiConfig.httpClient.put<FulfillmentRouting>(storePath(store_id, "fulfillment-routing"), body, options);
  },
});

export const createFulfillmentJobApi = (apiConfig: ApiConfig) => {
  const jobPath = (storeId: string, id: string) => storeRecordPath(storeId, "fulfillment-jobs", id);
  return {
    find(params: FindFulfillmentJobsParams, options?: RequestOptions): Promise<PaginatedResponse<FulfillmentJob>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FulfillmentJob>>(storePath(store_id, "fulfillment-jobs"), {
        ...options,
        params: query,
      });
    },

    get(params: GetFulfillmentJobParams, options?: RequestOptions): Promise<FulfillmentJob> {
      return apiConfig.httpClient.get<FulfillmentJob>(jobPath(params.store_id, params.fulfillment_job_id), options);
    },

    items(params: GetFulfillmentJobParams, options?: RequestOptions): Promise<FulfillmentJobItem[]> {
      return apiConfig.httpClient.get<FulfillmentJobItem[]>(
        `${jobPath(params.store_id, params.fulfillment_job_id)}/items`,
        options,
      );
    },

    unitSlots(params: ResolveFulfillmentUnitSlotsParams, options?: RequestOptions): Promise<FulfillmentUnitSlots> {
      const { store_id, fulfillment_job_id, ...body } = params;
      return apiConfig.httpClient.post<FulfillmentUnitSlots>(`${jobPath(store_id, fulfillment_job_id)}/unit-slots`, body, options);
    },

    decide(params: ActOnFulfillmentJobParams, options?: RequestOptions): Promise<FulfillmentJob> {
      if (params.action.type === "split") requireId(params.action.fulfillment_job_id, "fulfillment job");
      return apiConfig.httpClient.post<FulfillmentJob>(
        `${jobPath(params.store_id, params.fulfillment_job_id)}/decisions`,
        { expected_updated_at: params.expected_updated_at, action: params.action },
        options,
      );
    },
  };
};

export const createFulfillmentApi = (apiConfig: ApiConfig) => {
  const fulfillmentPath = (storeId: string, id: string) => storeRecordPath(storeId, "fulfillments", id);
  return {
    find(params: FindFulfillmentsParams, options?: RequestOptions): Promise<PaginatedResponse<Fulfillment>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Fulfillment>>(storePath(store_id, "fulfillments"), {
        ...options,
        params: query,
      });
    },

    get(params: GetFulfillmentParams, options?: RequestOptions): Promise<Fulfillment> {
      return apiConfig.httpClient.get<Fulfillment>(fulfillmentPath(params.store_id, params.fulfillment_id), options);
    },

    create(params: CreateFulfillmentParams, options?: RequestOptions): Promise<Fulfillment> {
      requireId(params.id, "fulfillment");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Fulfillment>(storePath(store_id, "fulfillments"), body, options);
    },

    execute(params: ActOnFulfillmentParams, options?: RequestOptions): Promise<Fulfillment> {
      const { store_id, fulfillment_id, ...body } = params;
      return apiConfig.httpClient.post<Fulfillment>(`${fulfillmentPath(store_id, fulfillment_id)}/commands`, body, options);
    },

    updateTracking(params: UpdateFulfillmentTrackingParams, options?: RequestOptions): Promise<Fulfillment> {
      const { store_id, fulfillment_id, ...body } = params;
      return apiConfig.httpClient.post<Fulfillment>(`${fulfillmentPath(store_id, fulfillment_id)}/tracking`, body, options);
    },

    markDelivered(params: MarkFulfillmentDeliveredParams, options?: RequestOptions): Promise<Fulfillment> {
      const { store_id, fulfillment_id, ...body } = params;
      return apiConfig.httpClient.post<Fulfillment>(`${fulfillmentPath(store_id, fulfillment_id)}/delivered`, body, options);
    },
  };
};

export const createMinimumProgressApi = (apiConfig: ApiConfig) => ({
  get(params: GetMinimumProgressParams, options?: RequestOptions): Promise<MinimumProgress> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<MinimumProgress>(storePath(store_id, "minimum-progress"), { ...options, params: query });
  },
});
