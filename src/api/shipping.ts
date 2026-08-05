import type { ApiConfig } from "../index";
import type {
  CreateOrderShipmentParams,
  FindFulfillmentOrdersParams,
  FindOrderShipmentsParams,
  FindOrderShipmentSettlementsParams,
  GetOrderShipmentParams,
  GetFulfillmentOrderParams,
  GetOrderShipmentSettlementParams,
  GetShippingRatesParams,
  RequestOptions,
  RequestShippoLabelRefundParams,
  RetryOrderShipmentParams,
  RetryShippoLabelRefundParams,
  RetryOrderShipmentSettlementParams,
} from "../types/api";
import type {
  CreateOrderShipmentResponse,
  FulfillmentOrder,
  PaginatedResponse,
  OrderShipment,
  ShippoLabelRefund,
  OrderShipmentSettlement,
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

    async retryOrderShipment(
      params: RetryOrderShipmentParams,
      options?: RequestOptions,
    ): Promise<OrderShipment> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}`;
      return apiConfig.httpClient.post<OrderShipment>(
        `${path}/retry`,
        {},
        options,
      );
    },

    async requestShippoLabelRefund(
      params: RequestShippoLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippoLabelRefund> {
      return apiConfig.httpClient.post<ShippoLabelRefund>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/shippo-label/refund`,
        {},
        options,
      );
    },

    async retryShippoLabelRefund(
      params: RetryShippoLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippoLabelRefund> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}/shippo-label/refund`;
      return apiConfig.httpClient.post<ShippoLabelRefund>(
        `${path}/retry`,
        {},
        options,
      );
    },

    async findOrderShipmentSettlements(
      params: FindOrderShipmentSettlementsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderShipmentSettlement>> {
      const { store_id, order_id, shipment_id, ...queryParams } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<OrderShipmentSettlement>
      >(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments/${shipment_id}/settlements`,
        { ...options, params: queryParams },
      );
    },

    async getOrderShipmentSettlement(
      params: GetOrderShipmentSettlementParams,
      options?: RequestOptions,
    ): Promise<OrderShipmentSettlement> {
      return apiConfig.httpClient.get<OrderShipmentSettlement>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/settlements/${params.settlement_id}`,
        options,
      );
    },

    async retryOrderShipmentSettlement(
      params: RetryOrderShipmentSettlementParams,
      options?: RequestOptions,
    ): Promise<OrderShipmentSettlement> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}/settlements/${params.settlement_id}`;
      return apiConfig.httpClient.post<OrderShipmentSettlement>(
          `${path}/retry`,
          {},
          options,
        );
    },
  };
};
