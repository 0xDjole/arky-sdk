import type { ApiConfig, ProfileSessionUpdater } from "../index";
import type {
  RequestOptions,
  GetCollectionParams,
  GetEntryParams,
  GetEntriesParams,
  GetFormParams,
  SubmitFormParams,
  GetTaxonomyParams,
  GetTaxonomyChildrenParams,
  GetProductParams,
  GetProductsParams,
  GetOrderParams,
  GetOrdersParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  GetServiceParams,
  GetServicesParams,
  FindServiceProvidersParams,
  GetProviderParams,
  GetProvidersParams,
  GetProfileListParams,
  FindProfileListsParams,
  SubscribeProfileListParams,
  ProfileListAccessParams,
  GetCurrentCartParams,
  GetCartParams,
  UpdateCartParams,
  AddCartItemParams,
  RemoveCartItemParams,
  ClearCartParams,
  QuoteCartParams,
  CheckoutCartParams,
} from "../types/api";
import type {
  Entry,
  Collection,
  Form,
  FormSubmission,
  Taxonomy,
  ProfileList,
  ProfileListAccessResponse,
  ProfileListSubscribeResponse,
  Service,
  Provider,
  Store,
  Location,
  Market,
  OrderQuote,
  Order,
  OrderCheckoutResult,
  Product,
  Profile,
  ProfileDetail,
  Cart,
  PaginatedResponse,
} from "../types";
import {
  getBlockFromArray,
  getBlockObjectValues,
  getImageUrl,
} from "../utils/blocks";
import { normalizePublicCheckoutItems } from "../utils/orderItems";

export type ProfileToken = {
  id: string;
  token: string;
  created_at: number;
};

export type IdentifyResponse = {
  profile: Profile;
  token: ProfileToken;
  store: Store;
  market: Market | null;
  code_sent: boolean;
};

export type VerifyResponse = ProfileToken;
type LogoutResponse = void;
type Country = {
  code: string;
  name: string;
  states: { code: string; name: string }[];
};
type CountriesResponse = { items: Country[]; cursor: string | null };

export interface Activity {
  store_id: string;
  profile_id: string;
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
  "order_created",
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

export const createStorefrontApi = (apiConfig: ApiConfig, updateProfileSession: ProfileSessionUpdater) => {
  const base = (storeId = apiConfig.storeId) =>
    `/v1/storefront/${storeId}`;

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
      collection: {
        get(params: GetCollectionParams, options?: RequestOptions): Promise<Collection> {
          const store_id = params.store_id || apiConfig.storeId;
          if (!params.id) {
            throw new Error("GetCollectionParams requires id");
          }
          return apiConfig.httpClient.get<Collection>(
            `${base(store_id)}/collections/${params.id}`,
            options,
          );
        },
      },

      entry: {
        get(params: GetEntryParams, options?: RequestOptions): Promise<Entry> {
          const store_id = params.store_id || apiConfig.storeId;
          if (!params.id) {
            throw new Error("GetEntryParams requires id");
          }
          return apiConfig.httpClient.get<Entry>(
            `${base(store_id)}/entries/${params.id}`,
            options,
          );
        },

        find(params: GetEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<Entry>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Entry>>(`${base(store_id)}/entries`, {
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

      cart: {
        current(params: GetCurrentCartParams = {}, options?: RequestOptions): Promise<Cart> {
          const store_id = params.store_id || apiConfig.storeId;
          const { store_id: _store_id, ...payload } = params;
          return apiConfig.httpClient.post<Cart>(
            `${base(store_id)}/carts/current`,
            { ...payload, store_id, market: payload.market || apiConfig.market },
            options,
          );
        },

        get(params: GetCartParams, options?: RequestOptions): Promise<Cart> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<Cart>(`${base(store_id)}/carts/${params.id}`, {
            ...options,
            params: params.token ? { token: params.token } : options?.params,
          });
        },

        update(params: UpdateCartParams, options?: RequestOptions): Promise<Cart> {
          const { store_id, items, ...payload } = params;
          const target = store_id || apiConfig.storeId;
          return apiConfig.httpClient.put<Cart>(
            `${base(target)}/carts/${params.id}`,
            {
              ...payload,
              store_id: target,
              ...(items ? { items: normalizePublicCheckoutItems(items) } : {}),
            },
            options,
          );
        },

        addItem(params: AddCartItemParams, options?: RequestOptions): Promise<Cart> {
          const { store_id, item, ...payload } = params;
          const target = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<Cart>(
            `${base(target)}/carts/${params.id}/items`,
            {
              ...payload,
              store_id: target,
              item: normalizePublicCheckoutItems([item])[0],
            },
            options,
          );
        },

        removeItem(params: RemoveCartItemParams, options?: RequestOptions): Promise<Cart> {
          const { store_id, ...payload } = params;
          const target = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<Cart>(
            `${base(target)}/carts/${params.id}/items/remove`,
            { ...payload, store_id: target },
            options,
          );
        },

        clear(params: ClearCartParams, options?: RequestOptions): Promise<Cart> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<Cart>(
            `${base(store_id)}/carts/${params.id}/clear`,
            { id: params.id, store_id },
            options,
          );
        },

        quote(params: QuoteCartParams, options?: RequestOptions): Promise<OrderQuote> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<OrderQuote>(
            `${base(store_id)}/carts/${params.id}/quote`,
            { id: params.id, store_id },
            options,
          );
        },

        checkout(params: CheckoutCartParams, options?: RequestOptions): Promise<OrderCheckoutResult> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<OrderCheckoutResult>(
            `${base(store_id)}/carts/${params.id}/checkout`,
            {
              id: params.id,
              store_id,
              payment_method_id: params.payment_method_id,
            },
            options,
          );
        },
      },

      order: {
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

        getAvailability(params: GetAvailabilityParams, options?: RequestOptions): Promise<AvailabilityResponse> {
          const { store_id, ...queryParams } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<AvailabilityResponse>(
            `${base(target_store_id)}/services/availability`,
            { ...options, params: queryParams },
          );
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
      profile: {
        async identify(
          params?: { email?: string; verify?: boolean; market?: string },
          options?: RequestOptions,
        ): Promise<IdentifyResponse> {
          const store_id = apiConfig.storeId;
          const result = await apiConfig.httpClient.post<IdentifyResponse>(
            `${base(store_id)}/profiles/identify`,
            {
              store_id,
              market: params?.market || apiConfig.market || null,
              email: params?.email,
              verify: params?.verify ?? false,
            },
            options,
          );
          if (result?.token?.token) {
            updateProfileSession(() => ({
              access_token: result.token.token,
              profile: result.profile,
              store: result.store,
              market: result.market,
            }));
          }
          return result;
        },

        async verify(
          params: { code: string },
          options?: RequestOptions,
        ): Promise<VerifyResponse> {
          const store_id = apiConfig.storeId;
          const result = await apiConfig.httpClient.post<VerifyResponse>(
            `${base(store_id)}/profiles/verify`,
            { store_id, code: params.code },
            options,
          );
          if (result?.token) {
            updateProfileSession((prev) =>
              prev ? { ...prev, access_token: result.token } : null,
            );
          }
          return result;
        },

        async logout(options?: RequestOptions): Promise<LogoutResponse> {
          const store_id = apiConfig.storeId;
          try {
            await apiConfig.httpClient.post<void>(
              `${base(store_id)}/profiles/logout`,
              {},
              options,
            );
          } finally {
            updateProfileSession(() => null);
          }
        },

        getMe(options?: RequestOptions): Promise<ProfileDetail> {
          return apiConfig.httpClient.get<ProfileDetail>(`${base()}/profiles/me`, options);
        },
      },

      profileList: {
        get(params: GetProfileListParams, options?: RequestOptions): Promise<ProfileList> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<ProfileList>(
            `${base(store_id)}/profile-lists/${params.id}`,
            options,
          );
        },

        find(params?: FindProfileListsParams, options?: RequestOptions): Promise<PaginatedResponse<ProfileList>> {
          const { store_id, ...queryParams } = params || {};
          return apiConfig.httpClient.get<PaginatedResponse<ProfileList>>(`${base(store_id)}/profile-lists`, {
            ...options,
            params: queryParams,
          });
        },

        subscribe(params: SubscribeProfileListParams, options?: RequestOptions): Promise<ProfileListSubscribeResponse> {
          const { store_id, id, ...payload } = params;
          return apiConfig.httpClient.post<ProfileListSubscribeResponse>(
            `${base(store_id)}/profile-lists/${id}/subscribe`,
            payload,
            options,
          );
        },

        checkAccess(params: ProfileListAccessParams, options?: RequestOptions): Promise<ProfileListAccessResponse> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<ProfileListAccessResponse>(
            `${base(store_id)}/profile-lists/${params.id}/access`,
            options,
          );
        },

        unsubscribe(token: string, options?: RequestOptions): Promise<{ unsubscribed: boolean }> {
          return apiConfig.httpClient.get<{ unsubscribed: boolean }>(`${base()}/profile-lists/unsubscribe`, {
            ...options,
            params: { token },
          });
        },

        confirm(token: string, options?: RequestOptions): Promise<{ confirmed: boolean }> {
          return apiConfig.httpClient.get<{ confirmed: boolean }>(`${base()}/profile-lists/confirm`, {
            ...options,
            params: { token },
          });
        },
      },
    },

    activity: createActivityApi(apiConfig),
  };
};
