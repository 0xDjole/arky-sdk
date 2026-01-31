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
     * Get available shipping rates for an order
     */
    async getRates(
      params: GetShippingRatesParams,
      options?: RequestOptions
    ): Promise<{ rates: ShippingRate[] }> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.orderId}/shipping/rates`,
        {
          parcel: params.parcel,
          fromAddress: params.fromAddress,
        },
        options
      );
    },

    /**
     * Purchase a shipping label using a selected rate
     */
    async purchaseLabel(
      params: PurchaseLabelParams,
      options?: RequestOptions
    ): Promise<PurchaseLabelResult> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.orderId}/shipping/purchase`,
        {
          rateId: params.rateId,
          carrier: params.carrier,
          service: params.service,
        },
        options
      );
    },
  };
};
