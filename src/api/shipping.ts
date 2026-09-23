import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateOrderShipmentParams,
  FindFulfillmentOrdersParams,
  FindOrderShipmentsParams,
  GetOrderShipmentParams,
  GetFulfillmentOrderParams,
  DispatchOrderShipmentParams,
  CancelOrderShipmentParams,
  RequestOptions,
} from "../types/api";
import type {
  CreateOrderShipmentResponse,
  FulfillmentOrder,
  PaginatedResponse,
  OrderShipment,
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

    async cancelOrderShipment(
      params: CancelOrderShipmentParams,
      options?: RequestOptions,
    ): Promise<OrderShipment> {
      const { store_id, order_id, shipment_id, ...payload } = params;
      return apiConfig.httpClient.post<OrderShipment>(
        `/v1/stores/${encodeURIComponent(storeId(store_id))}/orders/${encodeURIComponent(order_id)}/shipments/${encodeURIComponent(shipment_id)}/cancel`,
        payload,
        options,
      );
    },

    async dispatchOrderShipment(
      params: DispatchOrderShipmentParams,
      options?: RequestOptions,
    ): Promise<OrderShipment> {
      const { store_id, order_id, shipment_id, ...payload } = params;
      return apiConfig.httpClient.post<OrderShipment>(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments/${shipment_id}/dispatch`,
        payload,
        options,
      );
    },
  };
};
