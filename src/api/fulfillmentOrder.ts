import type { ApiConfig } from "../services/clientTypes";
import type { FulfillmentUnitSlots, ResolveFulfillmentUnitSlotsParams } from "../types/fulfillmentUnitSelection";
import type {
  AddFulfillmentHoldParams,
  FindFulfillmentOrdersParams,
  GetFulfillmentOrderParams,
  ReleaseFulfillmentHoldParams,
  RequestOptions,
} from "../types/api";
import type {
  ControlFulfillmentExecutorParams,
  FulfillmentOrder,
  PaginatedResponse,
} from "../types";

export const createFulfillmentOrderApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId || apiConfig.storeId)}/fulfillment-orders`;

  return {
    find(
      params: FindFulfillmentOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<FulfillmentOrder>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FulfillmentOrder>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    get(
      params: GetFulfillmentOrderParams,
      options?: RequestOptions,
    ): Promise<FulfillmentOrder> {
      return apiConfig.httpClient.get<FulfillmentOrder>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.fulfillment_order_id)}`,
        options,
      );
    },
    unitSlots(
      params: ResolveFulfillmentUnitSlotsParams,
      options?: RequestOptions,
    ): Promise<FulfillmentUnitSlots> {
      const { store_id, fulfillment_order_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentUnitSlots>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_order_id)}/unit-slots`,
        payload,
        options,
      );
    },
    addHold(
      params: AddFulfillmentHoldParams,
      options?: RequestOptions,
    ): Promise<FulfillmentOrder> {
      const { store_id, fulfillment_order_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentOrder>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_order_id)}/holds`,
        payload,
        options,
      );
    },
    releaseHold(
      params: ReleaseFulfillmentHoldParams,
      options?: RequestOptions,
    ): Promise<FulfillmentOrder> {
      const { store_id, fulfillment_order_id, hold_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentOrder>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_order_id)}/holds/${encodeURIComponent(hold_id)}/release`,
        payload,
        options,
      );
    },
    controlExecutor(
      params: ControlFulfillmentExecutorParams,
      options?: RequestOptions,
    ): Promise<FulfillmentOrder> {
      const { store_id, fulfillment_order_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentOrder>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_order_id)}/executor`,
        payload,
        options,
      );
    },
  };
};
