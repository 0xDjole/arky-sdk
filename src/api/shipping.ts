import type { ApiConfig } from "../index";
import type {
  CreateShipmentParams,
  FindFulfillmentOrdersParams,
  FindShipmentsParams,
  FindShippingLabelAdjustmentsParams,
  FindShippingLabelRefundsParams,
  FindShippingLabelSettlementsParams,
  GetShipmentParams,
  GetFulfillmentOrderParams,
  GetShippingLabelRefundParams,
  GetShippingLabelSettlementParams,
  GetShippingRatesParams,
  RequestOptions,
  RequestShippingLabelRefundParams,
  RetryShipmentParams,
  RetryShippingLabelRefundParams,
  RetryShippingLabelSettlementParams,
} from "../types/api";
import type {
  CreateShipmentResponse,
  FulfillmentOrder,
  PaginatedResponse,
  Shipment,
  ShippingLabelAdjustment,
  ShippingLabelRefund,
  ShippingLabelSettlement,
  ShippingRate,
} from "../types";
import {
  pollScheduledResult,
  scheduledObservationOptions,
} from "../utils/scheduledResult";

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

    async findShipments(
      params: FindShipmentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Shipment>> {
      const { store_id, order_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Shipment>>(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments`,
        { ...options, params: queryParams },
      );
    },

    async getShipment(
      params: GetShipmentParams,
      options?: RequestOptions,
    ): Promise<Shipment> {
      return apiConfig.httpClient.get<Shipment>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}`,
        options,
      );
    },

    async createShipment(
      params: CreateShipmentParams,
      options?: RequestOptions,
    ): Promise<CreateShipmentResponse> {
      const { store_id, order_id, ...payload } = params;
      const response = await apiConfig.httpClient.post<CreateShipmentResponse>(
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

    async retryShipment(
      params: RetryShipmentParams,
      options?: RequestOptions,
    ): Promise<Shipment> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}`;
      const requested = await apiConfig.httpClient.post<Shipment>(
        `${path}/retry`,
        {},
        options,
      );
      if (
        requested.label_status !== "requested" &&
        requested.label_status !== "processing"
      ) {
        return requested;
      }
      return pollScheduledResult(
        requested,
        async (observationSignal) => {
          const observation = await apiConfig.httpClient.get<Shipment>(
            path,
            scheduledObservationOptions(options, observationSignal),
          );
          if (
            observation.id !== requested.id ||
            observation.label_revision !== requested.label_revision
          ) {
            throw new Error(
              "Shipment changed before its exact label retry result could be observed",
            );
          }
          return observation;
        },
        (shipment) =>
          shipment.label_status === "requested" ||
          shipment.label_status === "processing",
        options?.signal,
      );
    },

    async requestRefund(
      params: RequestShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      return apiConfig.httpClient.post<ShippingLabelRefund>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/refunds`,
        {},
        options,
      );
    },

    async findRefunds(
      params: FindShippingLabelRefundsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingLabelRefund>> {
      const { store_id, order_id, shipment_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ShippingLabelRefund>>(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments/${shipment_id}/refunds`,
        { ...options, params: queryParams },
      );
    },

    async getRefund(
      params: GetShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      return apiConfig.httpClient.get<ShippingLabelRefund>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/refunds/${params.refund_id}`,
        options,
      );
    },

    async retryRefund(
      params: RetryShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}/refunds/${params.refund_id}`;
      const requested = await apiConfig.httpClient.post<ShippingLabelRefund>(
        `${path}/retry`,
        {},
        options,
      );
      if (
        requested.status !== "requested" &&
        requested.status !== "processing"
      ) {
        return requested;
      }
      return pollScheduledResult(
        requested,
        async (observationSignal) => {
          const observation =
            await apiConfig.httpClient.get<ShippingLabelRefund>(
              path,
              scheduledObservationOptions(options, observationSignal),
            );
          if (
            observation.id !== requested.id ||
            observation.revision !== requested.revision
          ) {
            throw new Error(
              "Shipping label refund changed before its exact retry result could be observed",
            );
          }
          return observation;
        },
        (refund) =>
          refund.status === "requested" || refund.status === "processing",
        options?.signal,
      );
    },

    async findAdjustments(
      params: FindShippingLabelAdjustmentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingLabelAdjustment>> {
      const { store_id, order_id, shipment_id, ...queryParams } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<ShippingLabelAdjustment>
      >(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments/${shipment_id}/adjustments`,
        { ...options, params: queryParams },
      );
    },

    async findSettlements(
      params: FindShippingLabelSettlementsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingLabelSettlement>> {
      const { store_id, order_id, shipment_id, ...queryParams } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<ShippingLabelSettlement>
      >(
        `/v1/stores/${storeId(store_id)}/orders/${order_id}/shipments/${shipment_id}/settlements`,
        { ...options, params: queryParams },
      );
    },

    async getSettlement(
      params: GetShippingLabelSettlementParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelSettlement> {
      return apiConfig.httpClient.get<ShippingLabelSettlement>(
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}/shipments/${params.shipment_id}/settlements/${params.settlement_id}`,
        options,
      );
    },

    async retrySettlement(
      params: RetryShippingLabelSettlementParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelSettlement> {
      const path =
        `/v1/stores/${storeId(params.store_id)}/orders/${params.order_id}` +
        `/shipments/${params.shipment_id}/settlements/${params.settlement_id}`;
      const requested =
        await apiConfig.httpClient.post<ShippingLabelSettlement>(
          `${path}/retry`,
          {},
          options,
        );
      if (
        requested.status !== "requested" &&
        requested.status !== "processing"
      ) {
        return requested;
      }
      return pollScheduledResult(
        requested,
        async (observationSignal) => {
          const observation =
            await apiConfig.httpClient.get<ShippingLabelSettlement>(
              path,
              scheduledObservationOptions(options, observationSignal),
            );
          if (
            observation.id !== requested.id ||
            observation.revision !== requested.revision
          ) {
            throw new Error(
              "Shipping settlement changed before its exact retry result could be observed",
            );
          }
          return observation;
        },
        (settlement) =>
          settlement.status === "requested" ||
          settlement.status === "processing",
        options?.signal,
      );
    },
  };
};
