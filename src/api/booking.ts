import type { ApiConfig } from "../index";
import type {
  CreateBookingParams,
  UpdateBookingParams,
  GetBookingParams,
  SearchBookingsParams,
  CancelBookingItemParams,
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
  CreateServiceProviderParams,
  UpdateServiceProviderParams,
  DeleteServiceProviderParams,
  FindServiceProvidersParams,
  GetBookingQuoteParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  ProcessBookingRefundParams,
  RequestOptions,
  Slot,
} from "../types/api";

function groupCartToItems(cart: Slot[]) {
  const groups = new Map<string, { service_id: string; provider_id: string; slots: { from: number; to: number }[] }>();
  for (const s of cart) {
    const key = `${s.service_id}:${s.provider_id}`;
    if (!groups.has(key)) {
      groups.set(key, { service_id: s.service_id, provider_id: s.provider_id, slots: [] });
    }
    groups.get(key)!.slots.push({ from: s.from, to: s.to });
  }
  return [...groups.values()];
}

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
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;

      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/bookings`,
        { market: "booking", ...payload },
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

    async getBooking(
      params: GetBookingParams,
      options?: RequestOptions,
    ) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/bookings/${params.id}`,
        options,
      );
    },

    async searchBookings(
      params: SearchBookingsParams,
      options?: RequestOptions,
    ) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/bookings`,
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
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;

      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/bookings/quote`,
        { market: "booking", ...payload },
        options,
      );
    },

    async processRefund(
      params: ProcessBookingRefundParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/bookings/${params.id}/refund`,
        { amount: params.amount },
        options,
      );
    },

    async getAvailability(
      params: GetAvailabilityParams,
      options?: RequestOptions,
    ): Promise<AvailabilityResponse> {
      const { business_id, ...query } = params;
      const target_business_id = business_id || apiConfig.businessId;

      return apiConfig.httpClient.get<AvailabilityResponse>(
        `/v1/businesses/${target_business_id}/bookings/availability`,
        { ...options, params: query },
      );
    },

    async createService(params: CreateServiceParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/services`,
        payload,
        options,
      );
    },

    async updateService(params: UpdateServiceParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/services/${params.id}`,
        payload,
        options,
      );
    },

    async deleteService(params: DeleteServiceParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${target_business_id}/services/${params.id}`,
        options,
      );
    },

    async getService(params: GetServiceParams, options?: RequestOptions) {
      const business_id = params.business_id || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${business_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetServiceParams requires id or slug");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${business_id}/services/${identifier}`,
        options,
      );
    },

    async getServices(params: GetServicesParams, options?: RequestOptions) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/services`,
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
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/providers`,
        payload,
        options,
      );
    },

    async updateProvider(
      params: UpdateProviderParams,
      options?: RequestOptions,
    ) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/providers/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProvider(
      params: DeleteProviderParams,
      options?: RequestOptions,
    ) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${target_business_id}/providers/${params.id}`,
        options,
      );
    },

    async getProvider(params: GetProviderParams, options?: RequestOptions) {
      const business_id = params.business_id || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${business_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProviderParams requires id or slug");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${business_id}/providers/${identifier}`,
        options,
      );
    },

    async getProviders(params: GetProvidersParams, options?: RequestOptions) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/providers`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async cancelBookingItem(
      params: CancelBookingItemParams,
      options?: RequestOptions,
    ) {
      const { business_id, booking_id, item_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/bookings/${booking_id}/items/${item_id}/cancel`,
        payload,
        options,
      );
    },

    async findServiceProviders(
      params: FindServiceProvidersParams,
      options?: RequestOptions,
    ) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/service-providers`,
        { ...options, params: queryParams },
      );
    },

    async createServiceProvider(
      params: CreateServiceProviderParams,
      options?: RequestOptions,
    ) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/service-providers`,
        payload,
        options,
      );
    },

    async updateServiceProvider(
      params: UpdateServiceProviderParams,
      options?: RequestOptions,
    ) {
      const { business_id, id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/service-providers/${id}`,
        payload,
        options,
      );
    },

    async deleteServiceProvider(
      params: DeleteServiceProviderParams,
      options?: RequestOptions,
    ) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${target_business_id}/service-providers/${params.id}`,
        options,
      );
    },
  };
};
