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
import type {
  Booking,
  BookingQuote,
  PaginatedResponse,
  Service,
  Provider,
  ServiceProvider,
} from "../types";

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
    ): Promise<Booking> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;

      return apiConfig.httpClient.post<Booking>(
        `/v1/stores/${target_store_id}/bookings`,
        { market: apiConfig.market, ...payload },
        options,
      );
    },

    async updateBooking(
      params: UpdateBookingParams,
      options?: RequestOptions,
    ): Promise<Booking> {
      const { id, ...payload } = params;
      return apiConfig.httpClient.put<Booking>(
        `/v1/stores/${apiConfig.storeId}/bookings/${id}`,
        payload,
        options,
      );
    },

    async getBooking(
      params: GetBookingParams,
      options?: RequestOptions,
    ): Promise<Booking> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Booking>(
        `/v1/stores/${target_store_id}/bookings/${params.id}`,
        options,
      );
    },

    async searchBookings(
      params: SearchBookingsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Booking>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Booking>>(
        `/v1/stores/${target_store_id}/bookings`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async getQuote(
      params: GetBookingQuoteParams,
      options?: RequestOptions,
    ): Promise<BookingQuote> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;

      return apiConfig.httpClient.post<BookingQuote>(
        `/v1/stores/${target_store_id}/bookings/quote`,
        { market: apiConfig.market, ...payload },
        options,
      );
    },

    async processRefund(
      params: ProcessBookingRefundParams,
      options?: RequestOptions,
    ): Promise<Booking> {
      return apiConfig.httpClient.post<Booking>(
        `/v1/stores/${apiConfig.storeId}/bookings/${params.id}/refund`,
        { amount: params.amount },
        options,
      );
    },

    async getAvailability(
      params: GetAvailabilityParams,
      options?: RequestOptions,
    ): Promise<AvailabilityResponse> {
      const { store_id, ...query } = params;
      const target_store_id = store_id || apiConfig.storeId;

      return apiConfig.httpClient.get<AvailabilityResponse>(
        `/v1/stores/${target_store_id}/bookings/availability`,
        { ...options, params: query },
      );
    },

    async createService(
      params: CreateServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Service>(
        `/v1/stores/${target_store_id}/services`,
        payload,
        options,
      );
    },

    async updateService(
      params: UpdateServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Service>(
        `/v1/stores/${target_store_id}/services/${params.id}`,
        payload,
        options,
      );
    },

    async deleteService(
      params: DeleteServiceParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/services/${params.id}`,
        options,
      );
    },

    async getService(
      params: GetServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetServiceParams requires id or slug");
      }

      return apiConfig.httpClient.get<Service>(
        `/v1/stores/${store_id}/services/${identifier}`,
        options,
      );
    },

    async getServices(
      params: GetServicesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Service>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Service>>(
        `/v1/stores/${target_store_id}/services`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async createProvider(
      params: CreateProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Provider>(
        `/v1/stores/${target_store_id}/providers`,
        payload,
        options,
      );
    },

    async updateProvider(
      params: UpdateProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Provider>(
        `/v1/stores/${target_store_id}/providers/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProvider(
      params: DeleteProviderParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/providers/${params.id}`,
        options,
      );
    },

    async getProvider(
      params: GetProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProviderParams requires id or slug");
      }

      return apiConfig.httpClient.get<Provider>(
        `/v1/stores/${store_id}/providers/${identifier}`,
        options,
      );
    },

    async getProviders(
      params: GetProvidersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Provider>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Provider>>(
        `/v1/stores/${target_store_id}/providers`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async cancelBookingItem(
      params: CancelBookingItemParams,
      options?: RequestOptions,
    ): Promise<Booking> {
      const { store_id, booking_id, item_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Booking>(
        `/v1/stores/${target_store_id}/bookings/${booking_id}/items/${item_id}/cancel`,
        payload,
        options,
      );
    },

    async findServiceProviders(
      params: FindServiceProvidersParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider[]> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<ServiceProvider[]>(
        `/v1/stores/${target_store_id}/service-providers`,
        { ...options, params: queryParams },
      );
    },

    async createServiceProvider(
      params: CreateServiceProviderParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ServiceProvider>(
        `/v1/stores/${target_store_id}/service-providers`,
        payload,
        options,
      );
    },

    async updateServiceProvider(
      params: UpdateServiceProviderParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<ServiceProvider>(
        `/v1/stores/${target_store_id}/service-providers/${id}`,
        payload,
        options,
      );
    },

    async deleteServiceProvider(
      params: DeleteServiceProviderParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/service-providers/${params.id}`,
        options,
      );
    },
  };
};
