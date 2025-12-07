import type { ApiConfig } from "../index";
import type {
  CreateReservationParams,
  UpdateReservationParams,
  ReservationCheckoutParams,
  GetReservationParams,
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
  GetServiceProvidersParams,
  GetReservationQuoteParams,
  RequestOptions,
  GetSlotsForDateParams,
  GetAvailabilityParams,
  DayAvailability,
  Slot,
  ProviderWithTimeline,
} from "../types/api";
import { formatIdOrSlug } from "../utils/slug";
import {
  computeSlotsForDate,
  hasAvailableSlots,
  formatSlotTime,
  type ServiceDuration,
} from "../utils/slots";

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
        businessId: apiConfig.businessId,
        market: apiConfig.market,
        ...params,
        items,
      };

      const result = await apiConfig.httpClient.post(
        `/v1/reservations/checkout`,
        payload,
        options,
      );

      // Clear cart after successful checkout
      cart = [];

      return result;
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
      const lines = params.items.map((item: any) => ({
        type: "SERVICE",
        serviceId: item.serviceId,
        quantity: 1,
      }));

      const { items, ...rest } = params;

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

    async getServiceProviders(
      params: GetServiceProvidersParams,
      options?: RequestOptions,
    ) {
      const { serviceId, ...queryParams } = params;

      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/services/${serviceId}/providers`,
        {
          ...options,
          params: queryParams,
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

    /**
     * Get available slots for a service on a specific date.
     * Returns slots ready to add to cart.
     */
    async getSlotsForDate(
      params: GetSlotsForDateParams,
      options?: RequestOptions,
    ): Promise<Slot[]> {
      const { serviceId, date, timezone, providerId } = params;

      const service = await this.getService({ id: serviceId }, options);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const fromTs = Math.floor(dayStart.getTime() / 1000);
      const toTs = Math.floor(dayEnd.getTime() / 1000);

      let providers: ProviderWithTimeline[] = await this.getServiceProviders(
        { serviceId, from: fromTs, to: toTs },
        options,
      );

      if (providerId) {
        providers = providers.filter((p) => p.id === providerId);
      }

      const durations: ServiceDuration[] = (service.durations || []).map(
        (d: any) => ({
          duration: d.duration,
          isPause: d.isPause || d.is_pause || false,
        }),
      );

      const raw = computeSlotsForDate({ providers, date, durations, timezone });

      // Format and include serviceId
      return raw.map((s, i) => ({
        id: `${serviceId}-${s.from}-${i}`,
        serviceId,
        providerId: s.providerId,
        from: s.from,
        to: s.to,
        timeText: formatSlotTime(s.from, s.to, timezone),
        dateText: new Date(s.from * 1000).toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: timezone,
        }),
      }));
    },

    /**
     * Get availability for a date range (useful for calendar UI).
     * Returns an array of dates with availability status.
     *
     * @example
     * const availability = await arky.reservation.getAvailability({
     *   serviceId: 'massage',
     *   from: new Date('2024-01-01'),
     *   to: new Date('2024-01-31'),
     *   timezone: 'Europe/Prague'
     * });
     * // Returns: [{ date: Date, available: true }, { date: Date, available: false }, ...]
     */
    async getAvailability(
      params: GetAvailabilityParams,
      options?: RequestOptions,
    ): Promise<DayAvailability[]> {
      const { serviceId, from, to, timezone } = params;

      // 1. Get service for durations
      const service = await this.getService({ id: serviceId }, options);

      // 2. Calculate range timestamps
      const fromTs = Math.floor(from.getTime() / 1000);
      const toTs = Math.floor(to.getTime() / 1000);

      // 3. Get providers with timeline for entire range (single API call)
      const providers: ProviderWithTimeline[] = await this.getServiceProviders(
        { serviceId, from: fromTs, to: toTs },
        options,
      );

      // 4. Extract durations from service
      const durations: ServiceDuration[] = (service.durations || []).map(
        (d: any) => ({
          duration: d.duration,
          isPause: d.isPause || d.is_pause || false,
        }),
      );

      // 5. Generate all dates in range
      const days: DayAvailability[] = [];
      const current = new Date(from);
      current.setHours(0, 0, 0, 0);
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);

      while (current <= endDate) {
        const date = new Date(current);
        const available = hasAvailableSlots({
          providers,
          date,
          durations,
          timezone,
        });
        days.push({ date, available });
        current.setDate(current.getDate() + 1);
      }

      return days;
    },
  };
};
