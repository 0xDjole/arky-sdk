import type { ApiConfig } from "../index";
import type {
  GetShippingRatesParams,
  RefundShippingLabelParams,
  ShipParams,
  RequestOptions,
} from "../types/api";
import type { ShippingLabelRefund, ShippingRate, ShipResult } from "../types";

export const createShippingApi = (apiConfig: ApiConfig) => {
  return {
    
    async getRates(
      params: GetShippingRatesParams,
      options?: RequestOptions
    ): Promise<{ rates: ShippingRate[] }> {
      const { order_id, ...payload } = params;
      return apiConfig.httpClient.post<{ rates: ShippingRate[] }>(
        `/v1/stores/${apiConfig.storeId}/orders/${order_id}/shipping/rates`,
        payload,
        options
      );
    },


    async ship(
      params: ShipParams,
      options?: RequestOptions
    ): Promise<ShipResult> {
      const { order_id, ...payload } = params;
      return apiConfig.httpClient.post<ShipResult>(
        `/v1/stores/${apiConfig.storeId}/orders/${order_id}/ship`,
        payload,
        options
      );
    },

    async refundLabel(
      params: RefundShippingLabelParams,
      options?: RequestOptions
    ): Promise<{ refund: ShippingLabelRefund }> {
      const { order_id, shipment_id } = params;
      return apiConfig.httpClient.post<{ refund: ShippingLabelRefund }>(
        `/v1/stores/${apiConfig.storeId}/orders/${order_id}/shipments/${shipment_id}/label/refund`,
        {},
        options
      );
    },
  };
};
