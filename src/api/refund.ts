import type { ApiConfig } from "../services/clientTypes";
import { validateRefundResponse } from "../services/refund";
import type { PaginatedResponse } from "../types";
import type { Refund } from "../types/refund";
import type {
  CreateRefundParams,
  CreateRefundResponse,
  FindRefundsParams,
  GetRefundParams,
  RecordCashOnDeliveryRefundParams,
  RequestOptions,
} from "../types/api";

export const createRefundApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;
  return {
    async create(
      params: CreateRefundParams,
      options?: RequestOptions,
    ): Promise<CreateRefundResponse> {
      const { store_id, ...payload } = params;
      const result = await apiConfig.httpClient.post<CreateRefundResponse>(
        `/v1/stores/${storeId(store_id)}/refunds`, payload, options,
      );
      return validateRefundResponse(result, params.refund_id, params.amount);
    },
    async recordCashOnDelivery(
      params: RecordCashOnDeliveryRefundParams,
      options?: RequestOptions,
    ): Promise<CreateRefundResponse> {
      const { store_id, ...payload } = params;
      const result = await apiConfig.httpClient.post<CreateRefundResponse>(
        `/v1/stores/${storeId(store_id)}/refunds/cash-on-delivery`, payload, options,
      );
      return validateRefundResponse(result, params.refund_id, params.amount);
    },
    async get(params: GetRefundParams, options?: RequestOptions): Promise<Refund> {
      return apiConfig.httpClient.get<Refund>(
        `/v1/stores/${storeId(params.store_id)}/refunds/${params.id}`, options,
      );
    },
    async find(
      params: FindRefundsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Refund>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Refund>>(
        `/v1/stores/${storeId(store_id)}/refunds`, { ...options, params: query },
      );
    },
  };
};
