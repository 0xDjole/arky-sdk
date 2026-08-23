import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateOrderShipmentParams,
  FindFulfillmentOrdersParams,
  FindOrderShipmentsParams,
  GetOrderShipmentParams,
  GetFulfillmentOrderParams,
  GetShippingLabelChargeParams,
  GetShippingLabelChargeRefundParams,
  GetShippingRatesParams,
  RequestOptions,
  RequestShippingLabelRefundParams,
  RetryShippingLabelParams,
  RetryShippingLabelRefundParams,
  RetryShippingLabelChargeParams,
  RetryShippingLabelChargeRefundParams,
} from "../types/api";
import type {
  CreateOrderShipmentResponse,
  FulfillmentOrder,
  PaginatedResponse,
  OrderShipment,
  ShippingLabelRefund,
  ShippingLabelCharge,
  ShippingLabelChargeRefund,
  ShippingRate,
} from "../types";

export const createShippingApi = (apiConfig: ApiConfig) => {
  const storeId = (value?: string) => value || apiConfig.storeId;

  return {
    async findFulfillmentOrders(
      params: FindFulfillmentOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<FulfillmentOrder>> {
      const { store_id, order_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FulfillmentOrder>>(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/fulfillment-orders`,
        { ...options, params: queryParams },
      );
    },

    async getFulfillmentOrder(
      params: GetFulfillmentOrderParams,
      options?: RequestOptions,
    ): Promise<FulfillmentOrder> {
      return apiConfig.httpClient.get<FulfillmentOrder>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/fulfillment-orders/${params.fulfillment_order_id}`,
        options,
      );
    },

    async getRates(
      params: GetShippingRatesParams,
      options?: RequestOptions,
    ): Promise<ShippingRate[]> {
      const { store_id, order_id, ...payload } = params;
      return apiConfig.httpClient.post<ShippingRate[]>(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipping/rates`,
        payload,
        options,
      );
    },

    async findOrderShipments(
      params: FindOrderShipmentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderShipment>> {
      const { store_id, order_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<OrderShipment>>(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments`,
        { ...options, params: queryParams },
      );
    },

    async getOrderShipment(
      params: GetOrderShipmentParams,
      options?: RequestOptions,
    ): Promise<OrderShipment> {
      return apiConfig.httpClient.get<OrderShipment>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}`,
        options,
      );
    },

    async createOrderShipment(
      params: CreateOrderShipmentParams,
      options?: RequestOptions,
    ): Promise<CreateOrderShipmentResponse> {
      const { store_id, order_id, ...payload } = params;
      const response = await apiConfig.httpClient.post<CreateOrderShipmentResponse>(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments`,
        payload,
        options,
      );
      if (
        response.shipment_id !== params.shipment_id ||
        response.shipment.id !== params.shipment_id
      ) {
        throw new Error(
          "Shipping response did not match the requested shipment_id",
        );
      }
      return response;
    },

    async retryShippingLabel(
      params: RetryShippingLabelParams,
      options?: RequestOptions,
    ): Promise<OrderShipment> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}`;
      return apiConfig.httpClient.post<OrderShipment>(
        `${path}/label/retry`,
        {},
        options,
      );
    },

    async requestShippingLabelRefund(
      params: RequestShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      return apiConfig.httpClient.post<ShippingLabelRefund>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/label/refund`,
        {},
        options,
      );
    },

    async retryShippingLabelRefund(
      params: RetryShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}/label/refund`;
      return apiConfig.httpClient.post<ShippingLabelRefund>(
        `${path}/retry`,
        {},
        options,
      );
    },

    async getShippingLabelCharge(
      params: GetShippingLabelChargeParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelCharge> {
      return apiConfig.httpClient.get<ShippingLabelCharge>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/shipping-label-charge`,
        options,
      );
    },

    async retryShippingLabelCharge(
      params: RetryShippingLabelChargeParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelCharge> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}/shipping-label-charge`;
      return apiConfig.httpClient.post<ShippingLabelCharge>(
        `${path}/retry`,
        {},
        options,
      );
    },

    async getShippingLabelChargeRefund(
      params: GetShippingLabelChargeRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelChargeRefund> {
      return apiConfig.httpClient.get<ShippingLabelChargeRefund>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/shipping-label-charge-refund`,
        options,
      );
    },

    async retryShippingLabelChargeRefund(
      params: RetryShippingLabelChargeRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelChargeRefund> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}/shipping-label-charge-refund`;
      return apiConfig.httpClient.post<ShippingLabelChargeRefund>(
        `${path}/retry`,
        {},
        options,
      );
    },
  };
};
