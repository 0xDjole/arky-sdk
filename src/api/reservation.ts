import type { ApiConfig } from "../index";
import type {
  CreateReservationParams,
  UpdateReservationParams,
  ReservationCheckoutParams,
  GetReservationParams,
  SearchReservationsParams,
  CreateServiceParams,
  UpdateServiceParams,
  DeleteServiceParams,
  GetServiceParams,
  GetServicesParams,
  BulkScheduleParams,
  CreateProviderParams,
  UpdateProviderParams,
  DeleteProviderParams,
  GetProviderParams,
  GetProvidersParams,
  GetBusinessServiceWorkingTimeParams,
  GetReservationQuoteParams,
  RequestOptions,
  Slot,
} from "../types/api";
import { formatIdOrSlug } from "../utils/slug";

export const createReservationApi = (apiConfig: ApiConfig) => {
  // Cart state for multiple slots
  let cart: Slot[] = [];

  return {
    // ===== CART =====

    addToCart(slot: Slot) {
      cart.push(slot);
    },

    removeFromCart(slotId: string) {
      cart = cart.filter((s) => s.id !== slotId);
    },

    getCart(): Slot[] {
      return [...cart];
    },

    clearCart() {
      cart = [];
    },

    // ===== RESERVATIONS =====

    async createReservation(
      params: CreateReservationParams,
      options?: RequestOptions,
    ) {
      const payload = {
        market: apiConfig.market,
        ...params,
      };

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/reservations`,
        payload,
        options,
      );
    },

    async updateReservation(
      params: UpdateReservationParams,
      options?: RequestOptions,
    ) {
      const { id, ...payload } = params;
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/reservations/${id}`,
        payload,
        options,
      );
    },

    async checkout(
      params?: Partial<ReservationCheckoutParams>,
      options?: RequestOptions,
    ) {
      // Use cart if no items provided
      const items = params?.items || cart.map((s) => ({
        serviceId: s.serviceId,
        providerId: s.providerId,
        from: s.from,
        to: s.to,
      }));

      const payload = {
        market: apiConfig.market,
        ...params,
        items,
      };

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/reservations/checkout`,
        payload,
        options,
      );
    },

    async getReservation(
      params: GetReservationParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/reservations/${params.id}`,
        options,
      );
    },

    async searchReservations(
      params: SearchReservationsParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/reservations`,
        {
          ...options,
          params,
        },
      );
    },

    // ===== QUOTES =====

    async getQuote(
      params: GetReservationQuoteParams,
      options?: RequestOptions,
    ) {
      const payload = {
        market: apiConfig.market,
        ...params,
      };

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/reservations/quote`,
        payload,
        options,
      );
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

    async bulkSchedule(params: BulkScheduleParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/services/bulk-schedule`,
        params,
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
