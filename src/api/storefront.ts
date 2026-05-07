import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  Slot,
  GetNodeParams,
  GetNodesParams,
  GetNodeChildrenParams,
  GetFormParams,
  SubmitFormParams,
  GetTaxonomyParams,
  GetTaxonomyChildrenParams,
  GetProductParams,
  GetProductsParams,
  GetQuoteParams,
  OrderCheckoutParams,
  GetOrderParams,
  GetOrdersParams,
  GetBookingParams,
  SearchBookingsParams,
  GetBookingQuoteParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  CancelBookingItemParams,
  GetServiceParams,
  GetServicesParams,
  FindServiceProvidersParams,
  GetProviderParams,
  GetProvidersParams,
  GetAudienceParams,
  GetAudiencesParams,
  SubscribeAudienceParams,
  GetAgentsParams,
  BookingCheckoutParams,
} from "../types/api";
import type {
  Node,
  Form,
  FormSubmission,
  Taxonomy,
  Audience,
  AudienceAccessResponse,
  AudienceSubscribeResponse,
  Booking,
  BookingQuote,
  Service,
  Provider,
  Store,
  Location,
  Market,
  OrderQuote,
  Order,
  Product,
  Agent,
  AgentChat,
  AgentChatMessage,
  Customer,
  CustomerDetail,
  PaginatedResponse,
} from "../types";
import {
  getBlockFromArray,
  getBlockObjectValues,
  getImageUrl,
} from "../utils/blocks";

export type CustomerToken = {
  id: string;
  token: string;
  created_at: number;
};

export type IdentifyResponse = {
  customer: Customer;
  token: CustomerToken;
  store: Store;
  market: Market | null;
  code_sent: boolean;
};

export type VerifyResponse = CustomerToken;
type LogoutResponse = void;
type Country = {
  code: string;
  name: string;
  states: { code: string; name: string }[];
};
type CountriesResponse = { items: Country[]; cursor: string | null };

export interface Activity {
  store_id: string;
  customer_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: number;
}

export interface TrackParams {
  type: string;
  payload?: Record<string, unknown>;
}

export const COMMON_ACTIVITY_TYPES = [
  "page_view",
  "product_view",
  "service_view",
  "provider_view",
  "cart_added",
  "cart_removed",
  "checkout_started",
  "purchase",
  "booking_created",
  "signin",
  "signup",
  "verified_email",
  "search",
  "share",
  "wishlist_added",
] as const;

export type CommonActivityType = (typeof COMMON_ACTIVITY_TYPES)[number];

export const createActivityApi = (apiConfig: ApiConfig) => ({
  COMMON_ACTIVITY_TYPES,
  async track(params: TrackParams): Promise<void> {
    try {
      await apiConfig.httpClient.post<void>(
        `/v1/storefront/${apiConfig.storeId}/activities/track`,
        { type: params.type, payload: params.payload },
      );
    } catch {}
  },
});

function groupCartToItems(cart: Slot[]) {
  const groups = new Map<
    string,
    { service_id: string; provider_id: string; slots: { from: number; to: number }[] }
  >();

  for (const slot of cart) {
    const key = `${slot.service_id}:${slot.provider_id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        service_id: slot.service_id,
        provider_id: slot.provider_id,
        slots: [],
      });
    }
    groups.get(key)!.slots.push({ from: slot.from, to: slot.to });
  }

  return [...groups.values()];
}

export const createStorefrontApi = (apiConfig: ApiConfig) => {
  const base = (storeId = apiConfig.storeId) =>
    `/v1/storefront/${storeId}`;
  let cart: Slot[] = [];

  return {
    store: {
      getStore(options?: RequestOptions): Promise<Store> {
        return apiConfig.httpClient.get<Store>(base(), options);
      },

      location: {
        getCountries(options?: RequestOptions): Promise<CountriesResponse> {
          return apiConfig.httpClient.get<CountriesResponse>(`/v1/platform/countries`, options);
        },

        getCountry(countryCode: string, options?: RequestOptions): Promise<Country> {
          return apiConfig.httpClient.get<Country>(
            `/v1/platform/countries/${countryCode}`,
            options,
          );
        },

        list(options?: RequestOptions): Promise<Location[]> {
          return apiConfig.httpClient.get<Location[]>(`${base()}/locations`, options);
        },

        get(id: string, options?: RequestOptions): Promise<Location> {
          return apiConfig.httpClient.get<Location>(`${base()}/locations/${id}`, options);
        },
      },

      market: {
        list(options?: RequestOptions): Promise<Market[]> {
          return apiConfig.httpClient.get<Market[]>(`${base()}/markets`, options);
        },

        get(id: string, options?: RequestOptions): Promise<Market> {
          return apiConfig.httpClient.get<Market>(`${base()}/markets/${id}`, options);
        },
      },
    },

    cms: {
      node: {
        async get(params: GetNodeParams, options?: RequestOptions) {
          const store_id = params.store_id || apiConfig.storeId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.slug) {
            identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
          } else if (params.key) {
            identifier = `${store_id}:${params.key}`;
          } else {
            throw new Error("GetNodeParams requires id, slug, or key");
          }

          const response = await apiConfig.httpClient.get<Node>(
            `${base(store_id)}/nodes/${identifier}`,
            options,
          );

          return {
            ...response,
            getBlock(key: string) {
              return getBlockFromArray(response, key, apiConfig.locale);
            },
            getBlockValues(key: string) {
              return getBlockObjectValues(response, key, apiConfig.locale);
            },
            getImage(key: string) {
              const block = getBlockFromArray(response, key, apiConfig.locale);
              return getImageUrl(block, true);
            },
          };
        },

        find(params: GetNodesParams, options?: RequestOptions): Promise<PaginatedResponse<Node>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Node>>(`${base(store_id)}/nodes`, {
            ...options,
            params: queryParams,
          });
        },

        getChildren(params: GetNodeChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Node>> {
          const { id, store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Node>>(`${base(store_id)}/nodes/${id}/children`, {
            ...options,
            params: queryParams,
          });
        },
      },

      form: {
        get(params: GetFormParams, options?: RequestOptions): Promise<Form> {
          const store_id = params.store_id || apiConfig.storeId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.key) {
            identifier = `${store_id}:${params.key}`;
          } else {
            throw new Error("GetFormParams requires id or key");
          }

          return apiConfig.httpClient.get<Form>(
            `${base(store_id)}/forms/${identifier}`,
            options,
          );
        },

        submit(params: SubmitFormParams, options?: RequestOptions): Promise<FormSubmission> {
          const { store_id, form_id, ...payload } = params;
          const target_store_id = store_id || apiConfig.storeId;
          if (!form_id) {
            throw new Error("SubmitFormParams requires form_id");
          }

          return apiConfig.httpClient.post<FormSubmission>(
            `${base(target_store_id)}/forms/${form_id}/submissions`,
            { ...payload, form_id, store_id: target_store_id },
            options,
          );
        },
      },

      taxonomy: {
        get(params: GetTaxonomyParams, options?: RequestOptions): Promise<Taxonomy> {
          const store_id = params.store_id || apiConfig.storeId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.key) {
            identifier = `${store_id}:${params.key}`;
          } else {
            throw new Error("GetTaxonomyParams requires id or key");
          }

          return apiConfig.httpClient.get<Taxonomy>(
            `${base(store_id)}/taxonomies/${identifier}`,
            options,
          );
        },

        getChildren(params: GetTaxonomyChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Taxonomy>> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<PaginatedResponse<Taxonomy>>(
            `${base(store_id)}/taxonomies/${params.id}/children`,
            options,
          );
        },
      },
    },

    eshop: {
      product: {
        get(params: GetProductParams, options?: RequestOptions): Promise<Product> {
          const store_id = params.store_id || apiConfig.storeId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.slug) {
            identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
          } else {
            throw new Error("GetProductParams requires id or slug");
          }

          return apiConfig.httpClient.get<Product>(
            `${base(store_id)}/products/${identifier}`,
            options,
          );
        },

        find(params: GetProductsParams, options?: RequestOptions): Promise<PaginatedResponse<Product>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Product>>(`${base(store_id)}/products`, {
            ...options,
            params: queryParams,
          });
        },
      },

      order: {
        getQuote(params: GetQuoteParams & { store_id?: string }, options?: RequestOptions): Promise<OrderQuote> {
          const store_id = params.store_id || apiConfig.storeId;
          const { location, store_id: _store_id, ...rest } = params;
          const shipping_address = location
            ? {
                country: location.country || "",
                state: location.state || "",
                city: location.city || "",
                postal_code: location.postal_code || "",
                name: "",
                street1: "",
                street2: null,
              }
            : undefined;

          return apiConfig.httpClient.post<OrderQuote>(
            `${base(store_id)}/orders/quote`,
            { ...rest, shipping_address, market: apiConfig.market },
            options,
          );
        },

        checkout(params: OrderCheckoutParams & { store_id?: string }, options?: RequestOptions): Promise<Order> {
          const { store_id, ...rest } = params;
          const target = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<Order>(
            `${base(target)}/orders/checkout`,
            { ...rest, store_id: target, market: apiConfig.market },
            options,
          );
        },

        get(params: GetOrderParams, options?: RequestOptions): Promise<Order> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<Order>(
            `${base(store_id)}/orders/${params.id}`,
            options,
          );
        },

        find(params: GetOrdersParams, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Order>>(`${base(store_id)}/orders`, {
            ...options,
            params: queryParams,
          });
        },
      },
    },

    booking: {
      addToCart(slot: Slot) {
        cart.push(slot);
      },

      removeFromCart(slotId: string) {
        cart = cart.filter((slot) => slot.id !== slotId);
      },

      getCart() {
        return [...cart];
      },

      clearCart() {
        cart = [];
      },

      checkout(params?: Partial<BookingCheckoutParams>, options?: RequestOptions): Promise<Booking> {
        const { store_id, items: paramItems, ...payload } = params || {};
        const target_store_id = store_id || apiConfig.storeId;
        const items = paramItems || groupCartToItems(cart);

        return apiConfig.httpClient.post<Booking>(
          `${base(target_store_id)}/bookings/checkout`,
          { market: apiConfig.market, ...payload, items },
          options,
        );
      },

      get(params: GetBookingParams, options?: RequestOptions): Promise<Booking> {
        const store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<Booking>(
          `${base(store_id)}/bookings/${params.id}`,
          options,
        );
      },

      find(params: SearchBookingsParams, options?: RequestOptions): Promise<PaginatedResponse<Booking>> {
        const { store_id, ...queryParams } = params;
        return apiConfig.httpClient.get<PaginatedResponse<Booking>>(`${base(store_id)}/bookings`, {
          ...options,
          params: queryParams,
        });
      },

      getQuote(params: GetBookingQuoteParams, options?: RequestOptions): Promise<BookingQuote> {
        const { store_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<BookingQuote>(
          `${base(target_store_id)}/bookings/quote`,
          { market: apiConfig.market, ...payload },
          options,
        );
      },

      getAvailability(params: GetAvailabilityParams, options?: RequestOptions): Promise<AvailabilityResponse> {
        const { store_id, ...queryParams } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.get<AvailabilityResponse>(
          `${base(target_store_id)}/bookings/availability`,
          { ...options, params: queryParams },
        );
      },

      cancelItem(params: CancelBookingItemParams, options?: RequestOptions): Promise<Booking> {
        const { store_id, booking_id, item_id, ...payload } = params;
        const target_store_id = store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<Booking>(
          `${base(target_store_id)}/bookings/${booking_id}/items/${item_id}/cancel`,
          payload,
          options,
        );
      },

      service: {
        get(params: GetServiceParams, options?: RequestOptions): Promise<Service> {
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
            `${base(store_id)}/services/${identifier}`,
            options,
          );
        },

        find(params: GetServicesParams, options?: RequestOptions): Promise<PaginatedResponse<Service>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Service>>(`${base(store_id)}/services`, {
            ...options,
            params: queryParams,
          });
        },

        findProviders(params: FindServiceProvidersParams, options?: RequestOptions): Promise<Provider[]> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<Provider[]>(`${base(store_id)}/service-providers`, {
            ...options,
            params: queryParams,
          });
        },
      },

      provider: {
        get(params: GetProviderParams, options?: RequestOptions): Promise<Provider> {
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
            `${base(store_id)}/providers/${identifier}`,
            options,
          );
        },

        find(params: GetProvidersParams, options?: RequestOptions): Promise<PaginatedResponse<Provider>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Provider>>(`${base(store_id)}/providers`, {
            ...options,
            params: queryParams,
          });
        },
      },
    },

    crm: {
      customer: {
        async identify(
          params?: { email?: string; verify?: boolean; market?: string },
          options?: RequestOptions,
        ): Promise<IdentifyResponse> {
          const store_id = apiConfig.storeId;
          const result = await apiConfig.httpClient.post<IdentifyResponse>(
            `${base(store_id)}/customers/identify`,
            {
              store_id,
              market: params?.market || apiConfig.market || null,
              email: params?.email,
              verify: params?.verify ?? false,
            },
            options,
          );
          if (result?.token?.token) {
            apiConfig.setToken({ access_token: result.token.token });
          }
          return result;
        },

        async verify(
          params: { code: string },
          options?: RequestOptions,
        ): Promise<VerifyResponse> {
          const store_id = apiConfig.storeId;
          const result = await apiConfig.httpClient.post<VerifyResponse>(
            `${base(store_id)}/customers/verify`,
            { store_id, code: params.code },
            options,
          );
          if (result?.token) {
            apiConfig.setToken({ access_token: result.token });
          }
          return result;
        },

        async logout(options?: RequestOptions): Promise<LogoutResponse> {
          const store_id = apiConfig.storeId;
          try {
            await apiConfig.httpClient.post<void>(
              `${base(store_id)}/customers/logout`,
              {},
              options,
            );
          } finally {
            apiConfig.setToken({ access_token: "" });
          }
        },

        getMe(options?: RequestOptions): Promise<CustomerDetail> {
          return apiConfig.httpClient.get<CustomerDetail>(`${base()}/customers/me`, options);
        },
      },

      audience: {
        get(params: GetAudienceParams, options?: RequestOptions): Promise<Audience> {
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.key) {
            identifier = `${apiConfig.storeId}:${params.key}`;
          } else {
            throw new Error("GetAudienceParams requires id or key");
          }

          return apiConfig.httpClient.get<Audience>(
            `${base(apiConfig.storeId)}/audiences/${identifier}`,
            options,
          );
        },

        find(params: GetAudiencesParams, options?: RequestOptions): Promise<PaginatedResponse<Audience>> {
          return apiConfig.httpClient.get<PaginatedResponse<Audience>>(`${base()}/audiences`, {
            ...options,
            params,
          });
        },

        subscribe(params: SubscribeAudienceParams, options?: RequestOptions): Promise<AudienceSubscribeResponse> {
          return apiConfig.httpClient.post<AudienceSubscribeResponse>(
            `${base()}/audiences/${params.id}/subscribe`,
            {
              customer_id: params.customer_id,
              price_id: params.price_id,
              success_url: params.success_url,
              cancel_url: params.cancel_url,
              confirm_url: params.confirm_url,
            },
            options,
          );
        },

        checkAccess(params: { id: string }, options?: RequestOptions): Promise<AudienceAccessResponse> {
          return apiConfig.httpClient.get<AudienceAccessResponse>(
            `${base()}/audiences/${params.id}/access`,
            options,
          );
        },

        unsubscribe(token: string, options?: RequestOptions): Promise<{ unsubscribed: boolean }> {
          return apiConfig.httpClient.get<{ unsubscribed: boolean }>(`${base()}/audiences/unsubscribe`, {
            ...options,
            params: { token },
          });
        },

        confirm(token: string, options?: RequestOptions): Promise<{ confirmed: boolean }> {
          return apiConfig.httpClient.get<{ confirmed: boolean }>(`${base()}/audiences/confirm`, {
            ...options,
            params: { token },
          });
        },
      },
    },

    activity: createActivityApi(apiConfig),

    automation: {
      agent: {
        getAgents(params?: GetAgentsParams, options?: RequestOptions): Promise<PaginatedResponse<Agent>> {
          const store_id = params?.store_id || apiConfig.storeId;
          const queryParams: Record<string, unknown> = { ...(params || {}) };
          delete queryParams.store_id;
          return apiConfig.httpClient.get<PaginatedResponse<Agent>>(`${base(store_id)}/agents`, {
            ...options,
            params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
          });
        },

        getAgent(params: { id: string; store_id?: string }, options?: RequestOptions): Promise<Agent> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<Agent>(
            `${base(store_id)}/agents/${params.id}`,
            options,
          );
        },

        sendMessage(
          params: { id: string; message: string; chat_id?: string; store_id?: string },
          options?: RequestOptions,
        ): Promise<AgentChatMessage> {
          const store_id = params.store_id || apiConfig.storeId;
          const body: Record<string, unknown> = { message: params.message };
          if (params.chat_id) body.chat_id = params.chat_id;
          return apiConfig.httpClient.post<AgentChatMessage>(
            `${base(store_id)}/agents/${params.id}/chats/messages`,
            body,
            options,
          );
        },

        getChat(
          params: { id: string; chat_id: string; store_id?: string },
          options?: RequestOptions,
        ): Promise<AgentChat> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<AgentChat>(
            `${base(store_id)}/agents/${params.id}/chats/${params.chat_id}`,
            options,
          );
        },

        getChatMessages(
          params: { id: string; chat_id: string; limit?: number; store_id?: string },
          options?: RequestOptions,
        ): Promise<PaginatedResponse<AgentChatMessage>> {
          const store_id = params.store_id || apiConfig.storeId;
          const queryParams: Record<string, string> = {};
          if (params.limit) queryParams.limit = String(params.limit);
          return apiConfig.httpClient.get<PaginatedResponse<AgentChatMessage>>(
            `${base(store_id)}/agents/${params.id}/chats/${params.chat_id}/messages`,
            {
              ...options,
              params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
            },
          );
        },

        rateChat(
          params: { id: string; chat_id: string; rating: number; comment?: string; store_id?: string },
          options?: RequestOptions,
        ): Promise<AgentChat> {
          const store_id = params.store_id || apiConfig.storeId;
          const body: Record<string, unknown> = { rating: params.rating };
          if (params.comment) body.comment = params.comment;
          return apiConfig.httpClient.post<AgentChat>(
            `${base(store_id)}/agents/${params.id}/chats/${params.chat_id}/rate`,
            body,
            options,
          );
        },
      },
    },
  };
};
