import type { ApiConfig } from "../index";
import type {
  GetShippingRatesParams,
  PurchaseLabelParams,
  RequestOptions,
} from "../types/api";
import type { ShippingRate, PurchaseLabelResult } from "../types";

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
     * Purchase a shipping label for a shipment
     */
    async purchaseLabel(
      params: PurchaseLabelParams,
      options?: RequestOptions
    ): Promise<PurchaseLabelResult> {
      const { orderId, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${orderId}/shipping/purchase`,
        payload,
        options
      );
    },
  };
};
