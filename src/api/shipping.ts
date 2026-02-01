import type { ApiConfig } from "../index";
import type {
  GetShippingRatesParams,
  ShipParams,
  RequestOptions,
} from "../types/api";
import type { ShippingRate, ShipResult } from "../types";

export const createShippingApi = (apiConfig: ApiConfig) => {
  return {
    /**
     * Get available shipping rates for a shipment
     */
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

    /**
     * Ship items: creates shipment + purchases label atomically
     */
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
