import type { ApiConfig } from "../index";
import type {
  CreateBookingParams,
  UpdateBookingParams,
  BookingCheckoutParams,
  GetBookingParams,
  SearchBookingsParams,
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
  GetBookingQuoteParams,
  RequestOptions,
  Slot,
} from "../types/api";

export const createBookingApi = (apiConfig: ApiConfig) => {
  
  let cart: Slot[] = [];

  return {
    
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

    async createBooking(
      params: CreateBookingParams,
      options?: RequestOptions,
    ) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;

      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/bookings`,
        { market: apiConfig.market, ...payload },
        options,
      );
    },

    async updateBooking(
      params: UpdateBookingParams,
      options?: RequestOptions,
    ) {
      const { id, ...payload } = params;
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/bookings/${id}`,
        payload,
        options,
      );
    },

    async checkout(
      params?: Partial<BookingCheckoutParams>,
      options?: RequestOptions,
    ) {
      const { businessId, items: paramItems, ...payload } = params || {};
      const targetBusinessId = businessId || apiConfig.businessId;

      const items = paramItems || cart.map((s) => ({
        serviceId: s.serviceId,
        providerId: s.providerId,
        from: s.from,
        to: s.to,
      }));

      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/bookings/checkout`,
        { market: apiConfig.market, ...payload, items },
        options,
      );
    },

    async getBooking(
      params: GetBookingParams,
      options?: RequestOptions,
    ) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/bookings/${params.id}`,
        options,
      );
    },

    async searchBookings(
      params: SearchBookingsParams,
      options?: RequestOptions,
    ) {
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/bookings`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async getQuote(
      params: GetBookingQuoteParams,
      options?: RequestOptions,
    ) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;

      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/bookings/quote`,
        { market: apiConfig.market, ...payload },
        options,
      );
    },

    async createService(params: CreateServiceParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/services`,
        payload,
        options,
      );
    },

    async updateService(params: UpdateServiceParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${targetBusinessId}/services/${params.id}`,
        payload,
        options,
      );
    },

    async deleteService(params: DeleteServiceParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${targetBusinessId}/services/${params.id}`,
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
      const businessId = params.businessId || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${businessId}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetServiceParams requires id or slug");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/services/${identifier}`,
        options,
      );
    },

    async getServices(params: GetServicesParams, options?: RequestOptions) {
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/services`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async createProvider(
      params: CreateProviderParams,
      options?: RequestOptions,
    ) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/providers`,
        payload,
        options,
      );
    },

    async updateProvider(
      params: UpdateProviderParams,
      options?: RequestOptions,
    ) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${targetBusinessId}/providers/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProvider(
      params: DeleteProviderParams,
      options?: RequestOptions,
    ) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${targetBusinessId}/providers/${params.id}`,
        options,
      );
    },

    async getProvider(params: GetProviderParams, options?: RequestOptions) {
      const businessId = params.businessId || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${businessId}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProviderParams requires id or slug");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/providers/${identifier}`,
        options,
      );
    },

    async getProviders(params: GetProvidersParams, options?: RequestOptions) {
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/providers`,
        {
          ...options,
          params: queryParams,
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
