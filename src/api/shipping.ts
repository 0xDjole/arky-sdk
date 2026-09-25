import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateShipmentParams,
  FindShipmentsParams,
  GetShipmentParams,
  DispatchShipmentParams,
  CancelShipmentParams,
  RequestOptions,
} from "../types/api";
import type {
  CreateShipmentResponse,
  PaginatedResponse,
  Shipment,
} from "../types";

export const createShippingApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId || apiConfig.storeId)}/shipments`;

  return {
    async findShipments(
      params: FindShipmentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Shipment>> {
      const { store_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Shipment>>(
        basePath(store_id),
        { ...options, params: queryParams },
      );
    },

    async getShipment(
      params: GetShipmentParams,
      options?: RequestOptions,
    ): Promise<Shipment> {
      return apiConfig.httpClient.get<Shipment>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.shipment_id)}`,
        options,
      );
    },

    async createShipment(
      params: CreateShipmentParams,
      options?: RequestOptions,
    ): Promise<CreateShipmentResponse> {
      const { store_id, ...payload } = params;
      const response = await apiConfig.httpClient.post<CreateShipmentResponse>(
        basePath(store_id),
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

    async cancelShipment(
      params: CancelShipmentParams,
      options?: RequestOptions,
    ): Promise<Shipment> {
      const { store_id, shipment_id, ...payload } = params;
      return apiConfig.httpClient.post<Shipment>(
        `${basePath(store_id)}/${encodeURIComponent(shipment_id)}/cancel`,
        payload,
        options,
      );
    },

    async dispatchShipment(
      params: DispatchShipmentParams,
      options?: RequestOptions,
    ): Promise<Shipment> {
      const { store_id, shipment_id, ...payload } = params;
      return apiConfig.httpClient.post<Shipment>(
        `${basePath(store_id)}/${encodeURIComponent(shipment_id)}/dispatch`,
        payload,
        options,
      );
    },
  };
};
