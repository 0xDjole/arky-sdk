import type { ApiConfig } from "../index";
import type { RequestOptions, Slot } from "../types/api";
import {
  getBlockFromArray,
  getBlockObjectValues,
  getImageUrl,
} from "../utils/blocks";

export interface Activity {
  businessId: string;
  customerId: string;
  type: string;
  payload: Record<string, any>;
  createdAt: number;
}

export interface TrackParams {
  type: string;
  payload?: Record<string, any>;
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

async function ensureCustomer(apiConfig: ApiConfig): Promise<void> {
  if (apiConfig.getToken) {
    const tokens = await apiConfig.getToken();
    if (tokens?.accessToken) return;
  }

  const response = await apiConfig.httpClient.post(
    `/v1/storefront/${apiConfig.businessId}/customers/initialize`,
    {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
  );

  const accessToken = response?.accessToken;
  const refreshToken = response?.refreshToken;
  const accessExpiresAt = response?.accessExpiresAt;
  if (accessToken) {
    apiConfig.setToken?.({ accessToken, refreshToken, accessExpiresAt });
  }
}

export const createActivityApi = (apiConfig: ApiConfig) => ({
  COMMON_ACTIVITY_TYPES,
  async track(params: TrackParams): Promise<void> {
    await ensureCustomer(apiConfig);
    await apiConfig.httpClient.post(
      `/v1/storefront/${apiConfig.businessId}/activities/track`,
      { type: params.type, payload: params.payload },
    );
  },
});

function groupCartToItems(cart: Slot[]) {
  const groups = new Map<
    string,
    { serviceId: string; providerId: string; slots: { from: number; to: number }[] }
  >();

  for (const slot of cart) {
    const key = `${slot.serviceId}:${slot.providerId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        serviceId: slot.serviceId,
        providerId: slot.providerId,
        slots: [],
      });
    }
    groups.get(key)!.slots.push({ from: slot.from, to: slot.to });
  }

  return [...groups.values()];
}

export const createStorefrontApi = (apiConfig: ApiConfig) => {
  const base = (businessId = apiConfig.businessId) =>
    `/v1/storefront/${businessId}`;
  let cart: Slot[] = [];

  return {
    business: {
      getBusiness(options?: RequestOptions) {
        return apiConfig.httpClient.get(base(), options);
      },

      getIntegrationConfig(
        params: { businessId?: string; type: "payment" | "shipping" | "analytics" },
        options?: RequestOptions,
      ) {
        return apiConfig.httpClient.get(
          `${base(params.businessId)}/integrations/config/${params.type}`,
          options,
        );
      },

      location: {
        getCountries(options?: RequestOptions) {
          return apiConfig.httpClient.get(`/v1/platform/countries`, options);
        },

        getCountry(countryCode: string, options?: RequestOptions) {
          return apiConfig.httpClient.get(
            `/v1/platform/countries/${countryCode}`,
            options,
          );
        },

        list(options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/locations`, options);
        },

        get(id: string, options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/locations/${id}`, options);
        },
      },

      market: {
        list(options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/markets`, options);
        },

        get(id: string, options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/markets/${id}`, options);
        },
      },
    },

    cms: {
      node: {
        async get(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.slug) {
            identifier = `${businessId}:${apiConfig.locale}:${params.slug}`;
          } else if (params.key) {
            identifier = `${businessId}:${params.key}`;
          } else {
            throw new Error("GetNodeParams requires id, slug, or key");
          }

          const response = await apiConfig.httpClient.get(
            `${base(businessId)}/nodes/${identifier}`,
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

        find(params: any, options?: RequestOptions) {
          const { businessId, ...queryParams } = params;
          return apiConfig.httpClient.get(`${base(businessId)}/nodes`, {
            ...options,
            params: queryParams,
          });
        },

        getChildren(params: any, options?: RequestOptions) {
          const { id, businessId, ...queryParams } = params;
          return apiConfig.httpClient.get(`${base(businessId)}/nodes/${id}/children`, {
            ...options,
            params: queryParams,
          });
        },
      },

      form: {
        get(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.key) {
            identifier = `${businessId}:${params.key}`;
          } else {
            throw new Error("GetFormParams requires id or key");
          }

          return apiConfig.httpClient.get(
            `${base(businessId)}/forms/${identifier}`,
            options,
          );
        },

        submit(params: any, options?: RequestOptions) {
          const { businessId, formId, ...payload } = params;
          const targetBusinessId = businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(targetBusinessId)}/forms/${formId}/submissions`,
            { ...payload, formId, businessId: targetBusinessId },
            options,
          );
        },
      },

      taxonomy: {
        get(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.key) {
            identifier = `${businessId}:${params.key}`;
          } else {
            throw new Error("GetTaxonomyParams requires id or key");
          }

          return apiConfig.httpClient.get(
            `${base(businessId)}/taxonomies/${identifier}`,
            options,
          );
        },

        getChildren(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.get(
            `${base(businessId)}/taxonomies/${params.id}/children`,
            options,
          );
        },
      },
    },

    eshop: {
      product: {
        get(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.slug) {
            identifier = `${businessId}:${apiConfig.locale}:${params.slug}`;
          } else {
            throw new Error("GetProductParams requires id or slug");
          }

          return apiConfig.httpClient.get(
            `${base(businessId)}/products/${identifier}`,
            options,
          );
        },

        find(params: any, options?: RequestOptions) {
          const { businessId, ...queryParams } = params;
          return apiConfig.httpClient.get(`${base(businessId)}/products`, {
            ...options,
            params: queryParams,
          });
        },
      },

      order: {
        getQuote(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          const { location, businessId: _businessId, ...rest } = params;
          const shippingAddress = location
            ? {
                country: location.country || "",
                state: location.state || "",
                city: location.city || "",
                postalCode: location.postalCode || "",
                name: "",
                street1: "",
                street2: null,
              }
            : undefined;

          return apiConfig.httpClient.post(
            `${base(businessId)}/orders/quote`,
            { ...rest, shippingAddress, market: apiConfig.market },
            options,
          );
        },

        checkout(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/orders/checkout`,
            { ...params, businessId, market: apiConfig.market },
            options,
          );
        },

        get(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.get(
            `${base(businessId)}/orders/${params.id}`,
            options,
          );
        },

        find(params: any, options?: RequestOptions) {
          const { businessId, ...queryParams } = params;
          return apiConfig.httpClient.get(`${base(businessId)}/orders`, {
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

      checkout(params?: any, options?: RequestOptions) {
        const { businessId, items: paramItems, ...payload } = params || {};
        const targetBusinessId = businessId || apiConfig.businessId;
        const items = paramItems || groupCartToItems(cart);

        return apiConfig.httpClient.post(
          `${base(targetBusinessId)}/bookings/checkout`,
          { market: "booking", ...payload, items },
          options,
        );
      },

      get(params: any, options?: RequestOptions) {
        const businessId = params.businessId || apiConfig.businessId;
        return apiConfig.httpClient.get(
          `${base(businessId)}/bookings/${params.id}`,
          options,
        );
      },

      find(params: any, options?: RequestOptions) {
        const { businessId, ...queryParams } = params;
        return apiConfig.httpClient.get(`${base(businessId)}/bookings`, {
          ...options,
          params: queryParams,
        });
      },

      getQuote(params: any, options?: RequestOptions) {
        const { businessId, ...payload } = params;
        return apiConfig.httpClient.post(
          `${base(businessId)}/bookings/quote`,
          { market: "booking", ...payload },
          options,
        );
      },

      getAvailability(params: any, options?: RequestOptions) {
        const { businessId, ...queryParams } = params;
        return apiConfig.httpClient.get(
          `${base(businessId)}/bookings/availability`,
          { ...options, params: queryParams },
        );
      },

      cancelItem(params: any, options?: RequestOptions) {
        const { businessId, bookingId, itemId, ...payload } = params;
        return apiConfig.httpClient.post(
          `${base(businessId)}/bookings/${bookingId}/items/${itemId}/cancel`,
          payload,
          options,
        );
      },

      service: {
        get(params: any, options?: RequestOptions) {
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
            `${base(businessId)}/services/${identifier}`,
            options,
          );
        },

        find(params: any, options?: RequestOptions) {
          const { businessId, ...queryParams } = params;
          return apiConfig.httpClient.get(`${base(businessId)}/services`, {
            ...options,
            params: queryParams,
          });
        },

        findProviders(params: any, options?: RequestOptions) {
          const { businessId, ...queryParams } = params;
          return apiConfig.httpClient.get(`${base(businessId)}/service-providers`, {
            ...options,
            params: queryParams,
          });
        },
      },

      provider: {
        get(params: any, options?: RequestOptions) {
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
            `${base(businessId)}/providers/${identifier}`,
            options,
          );
        },

        find(params: any, options?: RequestOptions) {
          const { businessId, ...queryParams } = params;
          return apiConfig.httpClient.get(`${base(businessId)}/providers`, {
            ...options,
            params: queryParams,
          });
        },
      },
    },

    crm: {
      customer: {
        initialize(params?: { businessId?: string }, options?: RequestOptions) {
          const businessId = params?.businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/customers/initialize`,
            { businessId },
            options,
          );
        },

        signInAnonymously(params?: { businessId?: string }, options?: RequestOptions) {
          const businessId = params?.businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/customers/initialize`,
            { businessId },
            options,
          );
        },

        connect(params: any, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/customers/connect`,
            { email: params.email, businessId },
            options,
          );
        },

        requestCode(
          params: { email: string; businessId?: string },
          options?: RequestOptions,
        ) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/customers/auth/code`,
            { email: params.email, businessId },
            options,
          );
        },

        verify(
          params: { email: string; code: string; businessId?: string },
          options?: RequestOptions,
        ) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/customers/auth/verify`,
            { email: params.email, code: params.code, businessId },
            options,
          );
        },

        refreshToken(
          params: { refreshToken: string; businessId?: string },
          options?: RequestOptions,
        ) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/customers/auth/refresh`,
            { refreshToken: params.refreshToken },
            options,
          );
        },

        getMe(options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/customers/me`, options);
        },
      },

      audience: {
        get(params: any, options?: RequestOptions) {
          let identifier: string;
          if (params.id) {
            identifier = params.id;
          } else if (params.key) {
            identifier = `${apiConfig.businessId}:${params.key}`;
          } else {
            throw new Error("GetAudienceParams requires id or key");
          }

          return apiConfig.httpClient.get(
            `${base(apiConfig.businessId)}/audiences/${identifier}`,
            options,
          );
        },

        find(params: any, options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/audiences`, {
            ...options,
            params,
          });
        },

        subscribe(params: any, options?: RequestOptions) {
          return apiConfig.httpClient.post(
            `${base()}/audiences/${params.id}/subscribe`,
            {
              customerId: params.customerId,
              priceId: params.priceId,
              successUrl: params.successUrl,
              cancelUrl: params.cancelUrl,
              confirmUrl: params.confirmUrl,
            },
            options,
          );
        },

        checkAccess(params: { id: string }, options?: RequestOptions) {
          return apiConfig.httpClient.get(
            `${base()}/audiences/${params.id}/access`,
            options,
          );
        },

        unsubscribe(token: string, options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/audiences/unsubscribe`, {
            ...options,
            params: { token },
          });
        },

        confirm(token: string, options?: RequestOptions) {
          return apiConfig.httpClient.get(`${base()}/audiences/confirm`, {
            ...options,
            params: { token },
          });
        },
      },
    },

    activity: createActivityApi(apiConfig),

    automation: {
      agent: {
        getAgents(params?: any, options?: RequestOptions) {
          const businessId = params?.businessId || apiConfig.businessId;
          const queryParams = { ...(params || {}) };
          delete queryParams.businessId;
          return apiConfig.httpClient.get(`${base(businessId)}/agents`, {
            ...options,
            params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
          });
        },

        getAgent(params: { id: string; businessId?: string }, options?: RequestOptions) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.get(
            `${base(businessId)}/agents/${params.id}`,
            options,
          );
        },

        sendMessage(
          params: { id: string; message: string; chatId?: string; businessId?: string },
          options?: RequestOptions,
        ) {
          const businessId = params.businessId || apiConfig.businessId;
          const body: Record<string, any> = { message: params.message };
          if (params.chatId) body.chatId = params.chatId;
          return apiConfig.httpClient.post(
            `${base(businessId)}/agents/${params.id}/chats/messages`,
            body,
            options,
          );
        },

        getChat(
          params: { id: string; chatId: string; businessId?: string },
          options?: RequestOptions,
        ) {
          const businessId = params.businessId || apiConfig.businessId;
          return apiConfig.httpClient.get(
            `${base(businessId)}/agents/${params.id}/chats/${params.chatId}`,
            options,
          );
        },

        getChatMessages(
          params: { id: string; chatId: string; limit?: number; businessId?: string },
          options?: RequestOptions,
        ) {
          const businessId = params.businessId || apiConfig.businessId;
          const queryParams: Record<string, string> = {};
          if (params.limit) queryParams.limit = String(params.limit);
          return apiConfig.httpClient.get(
            `${base(businessId)}/agents/${params.id}/chats/${params.chatId}/messages`,
            {
              ...options,
              params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
            },
          );
        },

        rateChat(
          params: { id: string; chatId: string; rating: number; comment?: string; businessId?: string },
          options?: RequestOptions,
        ) {
          const businessId = params.businessId || apiConfig.businessId;
          const body: Record<string, any> = { rating: params.rating };
          if (params.comment) body.comment = params.comment;
          return apiConfig.httpClient.post(
            `${base(businessId)}/agents/${params.id}/chats/${params.chatId}/rate`,
            body,
            options,
          );
        },
      },
    },
  };
};
