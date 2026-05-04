import type { ApiConfig } from "../index";
import type {
  GetShippingRatesParams,
  ShipParams,
  RequestOptions,
} from "../types/api";
import type { ShippingRate, ShipResult } from "../types";

export const createShippingApi = (apiConfig: ApiConfig) => {
  return {
    
    async getRates(
      params: GetShippingRatesParams,
      options?: RequestOptions
    ): Promise<{ rates: ShippingRate[] }> {
      const { order_id, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${order_id}/shipping/rates`,
        payload,
        options
      );
    },


    async ship(
      params: ShipParams,
      options?: RequestOptions
    ): Promise<ShipResult> {
      const { order_id, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${order_id}/ship`,
        payload,
        options
      );
    },
  };
};
