import { requireRequestId } from "../utils/requestId";
import { requireStoreId } from "../utils/storeTarget";
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
  ControlPartnerRequestParams,
  MoveFulfillmentOrderParams,
  MoveFulfillmentOrderResult,
  FulfillmentOrder,
  FulfillmentJobItem,
  PaginatedResponse,
} from "../types";

export const createFulfillmentOrderApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/fulfillment-orders`;

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
    items(params: GetFulfillmentOrderParams, options?: RequestOptions): Promise<FulfillmentJobItem[]> {
      return apiConfig.httpClient.get<FulfillmentJobItem[]>(`${basePath(params.store_id)}/${encodeURIComponent(params.fulfillment_order_id)}/items`, options);
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
    move(params: MoveFulfillmentOrderParams, options?: RequestOptions): Promise<MoveFulfillmentOrderResult> {
      requireRequestId(params.request_id);
      const { store_id, fulfillment_order_id, ...payload } = params;
      return apiConfig.httpClient.post<MoveFulfillmentOrderResult>(`${basePath(store_id)}/${encodeURIComponent(fulfillment_order_id)}/move`, payload, options);
    },
    controlPartner(
      params: ControlPartnerRequestParams,
      options?: RequestOptions,
    ): Promise<FulfillmentOrder> {
      requireRequestId(params.request_id);
      const { store_id, fulfillment_order_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentOrder>(
        `${basePath(store_id)}/${encodeURIComponent(fulfillment_order_id)}/partner`,
        payload,
        options,
      );
    },
  };
};
