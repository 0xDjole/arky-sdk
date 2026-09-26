import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types";
import type {
  Fulfillment,
  FindFulfillmentsParams,
  GetFulfillmentParams,
  CreateFulfillmentParams,
  ControlFulfillmentParams,
  UpdateFulfillmentTrackingParams,
  MarkFulfillmentDeliveredParams,
} from "../types/fulfillment";

export const createFulfillmentApi = (config: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId || config.storeId)}/fulfillments`;

  return {
    create(
      params: CreateFulfillmentParams,
      options?: RequestOptions,
    ): Promise<Fulfillment> {
      const { store_id, ...payload } = params;
      return config.httpClient.post<Fulfillment>(
        basePath(store_id),
        payload,
        options,
      );
    },
    execute(
      params: ControlFulfillmentParams,
      options?: RequestOptions,
    ): Promise<Fulfillment> {
      const { store_id, fulfillment_id, ...payload } = params;
      return config.httpClient.post<Fulfillment>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_id)}/commands`,
        payload,
        options,
      );
    },
    updateTracking(
      params: UpdateFulfillmentTrackingParams,
      options?: RequestOptions,
    ): Promise<Fulfillment> {
      const { store_id, fulfillment_id, ...payload } = params;
      return config.httpClient.post<Fulfillment>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_id)}/tracking`,
        payload,
        options,
      );
    },
    markDelivered(
      params: MarkFulfillmentDeliveredParams,
      options?: RequestOptions,
    ): Promise<Fulfillment> {
      const { store_id, fulfillment_id, ...payload } = params;
      return config.httpClient.post<Fulfillment>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_id)}/delivered`,
        payload,
        options,
      );
    },
    find(
      params: FindFulfillmentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Fulfillment>> {
      const { store_id, ...query } = params;
      return config.httpClient.get<PaginatedResponse<Fulfillment>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    get(
      params: GetFulfillmentParams,
      options?: RequestOptions,
    ): Promise<Fulfillment> {
      return config.httpClient.get<Fulfillment>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.fulfillment_id)}`,
        options,
      );
    },
  };
};
