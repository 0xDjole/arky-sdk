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
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.orderId}/shipping/rates`,
        {
          shippingProviderId: params.shippingProviderId,
          fromAddress: params.fromAddress,
          toAddress: params.toAddress,
          parcel: params.parcel,
        },
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
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.orderId}/shipping/purchase`,
        {
          shipmentId: params.shipmentId,
          rateId: params.rateId,
          carrier: params.carrier,
          service: params.service,
        },
        options
      );
    },
  };
};
