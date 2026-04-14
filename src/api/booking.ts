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
  RequestOptions,
  Slot,
} from "../types/api";

function groupCartToItems(cart: Slot[]) {
  const groups = new Map<string, { serviceId: string; providerId: string; slots: { from: number; to: number }[] }>();
  for (const s of cart) {
    const key = `${s.serviceId}:${s.providerId}`;
    if (!groups.has(key)) {
      groups.set(key, { serviceId: s.serviceId, providerId: s.providerId, slots: [] });
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
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;

      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/bookings`,
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

    async checkout(
      params?: Partial<BookingCheckoutParams>,
      options?: RequestOptions,
    ) {
      const { businessId, items: paramItems, ...payload } = params || {};
      const targetBusinessId = businessId || apiConfig.businessId;

      const items = paramItems || groupCartToItems(cart);

      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/bookings/checkout`,
        { market: "booking", ...payload, items },
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
        { market: "booking", ...payload },
        options,
      );
    },

    async getAvailability(
      params: GetAvailabilityParams,
      options?: RequestOptions,
    ): Promise<AvailabilityResponse> {
      const { businessId, ...query } = params;
      const targetBusinessId = businessId || apiConfig.businessId;

      return apiConfig.httpClient.get<AvailabilityResponse>(
        `/v1/businesses/${targetBusinessId}/bookings/availability`,
        { ...options, params: query },
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

    async findServiceProviders(
      params: FindServiceProvidersParams,
      options?: RequestOptions,
    ) {
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/service-providers`,
        { ...options, params: queryParams },
      );
    },

    async createServiceProvider(
      params: CreateServiceProviderParams,
      options?: RequestOptions,
    ) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/service-providers`,
        payload,
        options,
      );
    },

    async updateServiceProvider(
      params: UpdateServiceProviderParams,
      options?: RequestOptions,
    ) {
      const { businessId, id, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${targetBusinessId}/service-providers/${id}`,
        payload,
        options,
      );
    },

    async deleteServiceProvider(
      params: DeleteServiceProviderParams,
      options?: RequestOptions,
    ) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${targetBusinessId}/service-providers/${params.id}`,
        options,
      );
    },
  };
};
