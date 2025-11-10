import type { ApiConfig } from "../index";
import type {
  CreateReservationParams,
  UpdateReservationParams,
  ReservationCheckoutParams,
  GetReservationParams,
  GetReservationPartsParams,
  SearchReservationsParams,
  SearchMyReservationsParams,
  CreateServiceParams,
  UpdateServiceParams,
  DeleteServiceParams,
  GetServiceParams,
  GetServicesParams,
  CreateProviderParams,
  UpdateProviderParams,
  DeleteProviderParams,
  GetProviderParams,
  GetProvidersParams,
  GetBusinessServiceWorkingTimeParams,
  GetAvailableSlotsParams,
  GetReservationQuoteParams,
  RequestOptions,
} from "../types/api";
import { formatIdOrSlug } from "../utils/slug";

export const createReservationApi = (apiConfig: ApiConfig) => {
  return {
    // ===== RESERVATIONS =====

    async createReservation(
      params: CreateReservationParams,
      options?: RequestOptions,
    ) {
      const payload = {
        businessId: apiConfig.businessId,
        market: apiConfig.market,
        ...params,
      };

      return apiConfig.httpClient.post(`/v1/reservations`, payload, options);
    },

    async updateReservation(
      params: UpdateReservationParams,
      options?: RequestOptions,
    ) {
      const { id, ...payload } = params;
      return apiConfig.httpClient.put(
        `/v1/reservations/${id}`,
        payload,
        options,
      );
    },

    async checkout(
      params: ReservationCheckoutParams,
      options?: RequestOptions,
    ) {
      const payload = {
        businessId: apiConfig.businessId,
        market: apiConfig.market,
        ...params,
      };

      return apiConfig.httpClient.post(
        `/v1/reservations/checkout`,
        payload,
        options,
      );
    },

    async getReservation(
      params: GetReservationParams,
      options?: RequestOptions,
    ) {
      // Reservations use UUID only - no SEO slug support
      return apiConfig.httpClient.get(`/v1/reservations/${params.id}`, {
        ...options,
        params: { businessId: apiConfig.businessId },
      });
    },

    async getReservationParts(
      params: GetReservationPartsParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.get(`/v1/reservations/parts`, {
        ...options,
        params,
      });
    },

    async searchReservations(
      params: SearchReservationsParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.get(`/v1/reservations/search`, {
        ...options,
        params: {
          ...params,
          businessId: apiConfig.businessId,
        },
      });
    },

    async searchMyReservations(
      params: SearchMyReservationsParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.get(`/v1/reservations`, {
        ...options,
        params,
      });
    },

    // ===== QUOTES =====

    async getQuote(
      params: GetReservationQuoteParams,
      options?: RequestOptions,
    ) {
      const lines = params.parts.map((part: any) => ({
        type: "SERVICE",
        serviceId: part.serviceId,
        quantity: 1,
      }));

      const { parts, ...rest } = params;

      const payload = {
        businessId: apiConfig.businessId,
        market: apiConfig.market,
        lines: lines,
        ...rest,
      };

      return apiConfig.httpClient.post(`/v1/payments/quote`, payload, options);
    },

    // ===== SERVICES =====

    async createService(params: CreateServiceParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/services`,
        params,
        options,
      );
    },

    async updateService(params: UpdateServiceParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/services/${params.id}`,
        params,
        options,
      );
    },

    async deleteService(params: DeleteServiceParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/services/${params.id}`,
        options,
      );
    },

    async getService(params: GetServiceParams, options?: RequestOptions) {
      const formattedId = formatIdOrSlug(params.id, apiConfig);
      const response = await apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/services/${formattedId}`,
        options,
      );

      // Add helper methods that automatically use SDK's current locale
      return {
        ...response,
        getName() {
          const locale = apiConfig.locale;
          return response.name?.[locale] || response.name?.en || response.name || '';
        },
        getDescription() {
          const locale = apiConfig.locale;
          return response.description?.[locale] || response.description?.en || response.description || '';
        }
      };
    },

    async getServices(params: GetServicesParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/services`,
        {
          ...options,
          params,
        },
      );
    },

    async getAvailableSlots(
      params: GetAvailableSlotsParams,
      options?: RequestOptions,
    ) {
      const { serviceId, ...queryParams } = params;

      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/services/${serviceId}/available-slots`,
        {
          ...options,
          params: {
            ...queryParams,
            limit: queryParams.limit || 1000,
          },
        },
      );
    },

    // ===== PROVIDERS =====

    async createProvider(
      params: CreateProviderParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/providers`,
        params,
        options,
      );
    },

    async updateProvider(
      params: UpdateProviderParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/providers/${params.id}`,
        params,
        options,
      );
    },

    async deleteProvider(
      params: DeleteProviderParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/providers/${params.id}`,
        options,
      );
    },

    async getProvider(params: GetProviderParams, options?: RequestOptions) {
      // Providers use UUID only - no SEO slug support
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/providers/${params.id}`,
        options,
      );
    },

    async getProviders(params: GetProvidersParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/providers`,
        {
          ...options,
          params: params,
        },
      );
    },

    async getProviderWorkingTime(
      params: GetBusinessServiceWorkingTimeParams,
      options?: RequestOptions,
    ) {
      const { providerId, ...queryParams } = params;
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/providers/${providerId}/working-time`,
        {
          ...options,
          params: queryParams,
        },
      );
    },
  };
};
