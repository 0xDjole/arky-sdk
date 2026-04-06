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
      const { orderId, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${orderId}/shipping/rates`,
        payload,
        options
      );
    },

    
    async ship(
      params: ShipParams,
      options?: RequestOptions
    ): Promise<ShipResult> {
      const { orderId, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${orderId}/ship`,
        payload,
        options
      );
    },
  };
};
