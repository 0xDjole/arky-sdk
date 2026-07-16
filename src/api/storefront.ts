import type { ApiConfig, ContactSessionUpdater } from "../index";
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
  FindDigitalAccessGrantsParams,
  GetDigitalAccessGrantParams,
  DownloadDigitalAccessParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  GetServiceParams,
  GetServicesParams,
  FindServiceProvidersParams,
  GetProviderParams,
  GetProvidersParams,
  GetContactListParams,
  FindStorefrontContactListPlansParams,
  FindStorefrontContactListsParams,
  FindStorefrontContactListMembershipsParams,
  SubscribeContactListParams,
  ContactListAccessParams,
  ContactListContentAccessParams,
  GetCurrentCartParams,
  GetCartParams,
  UpdateCartParams,
  AddCartItemParams,
  RemoveCartItemParams,
  ClearCartParams,
  QuoteCartParams,
  CheckoutCartParams,
  VerificationChallengeResponse,
} from "../types/api";
import type {
  CollectionEntry,
  Collection,
  Form,
  FormSubmission,
  Taxonomy,
  StorefrontContactList,
  StorefrontContactListPlan,
  ContactListAccessResponse,
  ContactListContentAccessResponse,
  ContactListManagementResponse,
  ContactListSubscribeResponse,
  StorefrontContactListMembership,
  Service,
  ServiceProvider,
  Provider,
  Store,
  Location,
  Market,
  OrderQuote,
  Order,
  DigitalAccessGrant,
  DigitalAccessDownloadResponse,
  OrderCheckoutResult,
  Product,
  Contact,
  ContactSessionIssued,
  Cart,
  PaginatedResponse,
} from "../types";
import { sanitizePublicCheckoutItems } from "../utils/orderItems";

export type IdentifyResponse = {
  contact: Contact;
  token: ContactSessionIssued | null;
  store: Store;
  market: Market | null;
  verification_challenge: VerificationChallengeResponse | null;
};

export type VerifyResponse = {
  contact: Contact;
  token: ContactSessionIssued;
};
type LogoutResponse = void;
type Country = {
  code: string;
  name: string;
  states: { code: string; name: string }[];
};
type CountriesResponse = { items: Country[]; cursor: string | null };

export interface StorefrontAction {
  store_id: string;
  contact_id: string;
  key: string;
  payload: Record<string, unknown>;
  created_at: number;
}

export interface TrackActionParams {
  key: string;
  payload?: Record<string, unknown>;
}

export const COMMON_ACTION_KEYS = [
  "page.view",
  "product.view",
  "service.view",
  "provider.view",
  "cart.added",
  "cart.removed",
  "checkout.started",
  "order.created",
  "signin",
  "signup",
  "verified.email",
  "search",
  "share",
  "wishlist.added",
] as const;

export type CommonActionKey = (typeof COMMON_ACTION_KEYS)[number];

export interface UseExperimentParams {
  key: string;
  store_id?: string;
}

export interface ExperimentUseResponse {
  experiment_key: string;
  experiment_version: number;
  variant_key: string;
  goal_action_key: string;
}

export const createActionApi = (apiConfig: ApiConfig) => ({
  COMMON_ACTION_KEYS,
  async track(params: TrackActionParams): Promise<void> {
    try {
      await apiConfig.httpClient.post<void>(
        `/v1/storefront/${apiConfig.storeId}/actions/track`,
        { key: params.key, payload: params.payload },
      );
    } catch {}
  },
});

export const createStorefrontApi = (
  apiConfig: ApiConfig,
  updateContactSession: ContactSessionUpdater,
) => {
  const base = (storeId = apiConfig.storeId) => `/v1/storefront/${storeId}`;
  const pendingVerifications = new Map<
    string,
    Pick<IdentifyResponse, "store" | "market">
  >();

  function persistIdentification(result: IdentifyResponse): IdentifyResponse {
    const issued = result.token;
    if (issued?.token) {
      updateContactSession(() => ({
        access_token: issued.token,
        contact: result.contact,
        store: result.store,
        market: result.market,
      }));
    } else {
      if (result.verification_challenge) {
        pendingVerifications.set(result.verification_challenge.challenge_id, {
          store: result.store,
          market: result.market,
        });
      }
      updateContactSession((current) =>
        current
          ? {
              ...current,
              contact: result.contact,
              store: result.store,
              market: result.market,
            }
          : null,
      );
    }
    return result;
  }

  async function submitIdentification(
    path: "identify" | "code",
    params?: { email?: string; market?: string },
    options?: RequestOptions,
  ): Promise<IdentifyResponse> {
    const store_id = apiConfig.storeId;
    const result = await apiConfig.httpClient.post<IdentifyResponse>(
      `${base(store_id)}/account/${path}`,
      {
        store_id,
        market: params?.market || apiConfig.market || null,
        email: params?.email,
      },
      options,
    );
    return persistIdentification(result);
  }

  return {
    store: {
      getStore(options?: RequestOptions): Promise<Store> {
        return apiConfig.httpClient.get<Store>(base(), options);
      },

      location: {
        getCountries(options?: RequestOptions): Promise<CountriesResponse> {
          return apiConfig.httpClient.get<CountriesResponse>(
            `/v1/platform/countries`,
            options,
          );
        },

        getCountry(
          countryCode: string,
          options?: RequestOptions,
        ): Promise<Country> {
          return apiConfig.httpClient.get<Country>(
            `/v1/platform/countries/${countryCode}`,
            options,
          );
        },

        list(options?: RequestOptions): Promise<Location[]> {
          return apiConfig.httpClient.get<Location[]>(
            `${base()}/locations`,
            options,
          );
        },

        get(id: string, options?: RequestOptions): Promise<Location> {
          return apiConfig.httpClient.get<Location>(
            `${base()}/locations/${id}`,
            options,
          );
        },
      },

      market: {
        list(options?: RequestOptions): Promise<Market[]> {
          return apiConfig.httpClient.get<Market[]>(
            `${base()}/markets`,
            options,
          );
        },

        get(id: string, options?: RequestOptions): Promise<Market> {
          return apiConfig.httpClient.get<Market>(
            `${base()}/markets/${id}`,
            options,
          );
        },
      },
    },

    cms: {
      collection: {
        get(
          params: GetCollectionParams,
          options?: RequestOptions,
        ): Promise<Collection> {
          const store_id = params.store_id || apiConfig.storeId;
          const identifier = params.id !== undefined
            ? params.id
            : `${store_id}:${params.key}`;
          return apiConfig.httpClient.get<Collection>(
            `${base(store_id)}/collections/${identifier}`,
            options,
          );
        },
      },

      entry: {
        get(
          params: GetEntryParams,
          options?: RequestOptions,
        ): Promise<CollectionEntry> {
          const store_id = params.store_id || apiConfig.storeId;
          if (!params.id) {
            throw new Error("GetEntryParams requires id");
          }
          return apiConfig.httpClient.get<CollectionEntry>(
            `${base(store_id)}/entries/${params.id}`,
            options,
          );
        },

        find(
          params: GetEntriesParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<CollectionEntry>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<CollectionEntry>>(
            `${base(store_id)}/entries`,
            {
              ...options,
              params: queryParams,
            },
          );
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

        submit(
          params: SubmitFormParams,
          options?: RequestOptions,
        ): Promise<FormSubmission> {
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
        get(
          params: GetTaxonomyParams,
          options?: RequestOptions,
        ): Promise<Taxonomy> {
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

        getChildren(
          params: GetTaxonomyChildrenParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<Taxonomy>> {
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
        get(
          params: GetProductParams,
          options?: RequestOptions,
        ): Promise<Product> {
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

        find(
          params: GetProductsParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<Product>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Product>>(
            `${base(store_id)}/products`,
            {
              ...options,
              params: queryParams,
            },
          );
        },
      },

      cart: {
        current(
          params: GetCurrentCartParams = {},
          options?: RequestOptions,
        ): Promise<Cart> {
          const store_id = params.store_id || apiConfig.storeId;
          const { store_id: _store_id, ...payload } = params;
          return apiConfig.httpClient.post<Cart>(
            `${base(store_id)}/carts/current`,
            {
              ...payload,
              store_id,
              market: payload.market || apiConfig.market,
            },
            options,
          );
        },

        get(params: GetCartParams, options?: RequestOptions): Promise<Cart> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<Cart>(
            `${base(store_id)}/carts/${params.id}`,
            {
              ...options,
              params: params.token ? { token: params.token } : options?.params,
            },
          );
        },

        update(
          params: UpdateCartParams,
          options?: RequestOptions,
        ): Promise<Cart> {
          const { store_id, items, ...payload } = params;
          const target = store_id || apiConfig.storeId;
          return apiConfig.httpClient.put<Cart>(
            `${base(target)}/carts/${params.id}`,
            {
              ...payload,
              store_id: target,
              ...(items ? { items: sanitizePublicCheckoutItems(items) } : {}),
            },
            options,
          );
        },

        addItem(
          params: AddCartItemParams,
          options?: RequestOptions,
        ): Promise<Cart> {
          const { store_id, item, ...payload } = params;
          const target = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<Cart>(
            `${base(target)}/carts/${params.id}/items`,
            {
              ...payload,
              store_id: target,
              item: sanitizePublicCheckoutItems([item])[0],
            },
            options,
          );
        },

        removeItem(
          params: RemoveCartItemParams,
          options?: RequestOptions,
        ): Promise<Cart> {
          const { store_id, ...payload } = params;
          const target = store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<Cart>(
            `${base(target)}/carts/${params.id}/items/remove`,
            { ...payload, store_id: target },
            options,
          );
        },

        clear(
          params: ClearCartParams,
          options?: RequestOptions,
        ): Promise<Cart> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<Cart>(
            `${base(store_id)}/carts/${params.id}/clear`,
            { id: params.id, store_id },
            options,
          );
        },

        quote(
          params: QuoteCartParams,
          options?: RequestOptions,
        ): Promise<OrderQuote> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<OrderQuote>(
            `${base(store_id)}/carts/${params.id}/quote`,
            { id: params.id, store_id },
            options,
          );
        },

        checkout(
          params: CheckoutCartParams,
          options?: RequestOptions,
        ): Promise<OrderCheckoutResult> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<OrderCheckoutResult>(
            `${base(store_id)}/carts/${params.id}/checkout`,
            {
              id: params.id,
              store_id,
              payment_method_key: params.payment_method_key,
              confirmation_token_id: params.confirmation_token_id,
              return_url: params.return_url,
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

        find(
          params: GetOrdersParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<Order>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Order>>(
            `${base(store_id)}/orders`,
            {
              ...options,
              params: queryParams,
            },
          );
        },

        downloadDigitalAccess(
          params: DownloadDigitalAccessParams,
          options?: RequestOptions,
        ): Promise<DigitalAccessDownloadResponse> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.post<DigitalAccessDownloadResponse>(
            `${base(store_id)}/orders/${params.order_id}/digital-access/${params.grant_id}/download`,
            {},
            options,
          );
        },

        findDigitalAccess(
          params: FindDigitalAccessGrantsParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<DigitalAccessGrant>> {
          const { order_id, store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<DigitalAccessGrant>>(
            `${base(store_id)}/orders/${order_id}/digital-access`,
            { ...options, params: queryParams },
          );
        },

        getDigitalAccess(
          params: GetDigitalAccessGrantParams,
          options?: RequestOptions,
        ): Promise<DigitalAccessGrant> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<DigitalAccessGrant>(
            `${base(store_id)}/orders/${params.order_id}/digital-access/${params.grant_id}`,
            options,
          );
        },
      },

      service: {
        get(
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
            `${base(store_id)}/services/${identifier}`,
            options,
          );
        },

        find(
          params: GetServicesParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<Service>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Service>>(
            `${base(store_id)}/services`,
            {
              ...options,
              params: queryParams,
            },
          );
        },

        findProviders(
          params: FindServiceProvidersParams,
          options?: RequestOptions,
        ): Promise<ServiceProvider[]> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<ServiceProvider[]>(
            `${base(store_id)}/service-providers`,
            {
              ...options,
              params: queryParams,
            },
          );
        },

        getAvailability(
          params: GetAvailabilityParams,
          options?: RequestOptions,
        ): Promise<AvailabilityResponse> {
          const { store_id, ...queryParams } = params;
          const target_store_id = store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<AvailabilityResponse>(
            `${base(target_store_id)}/services/availability`,
            { ...options, params: queryParams },
          );
        },
      },

      provider: {
        get(
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
            `${base(store_id)}/providers/${identifier}`,
            options,
          );
        },

        find(
          params: GetProvidersParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<Provider>> {
          const { store_id, ...queryParams } = params;
          return apiConfig.httpClient.get<PaginatedResponse<Provider>>(
            `${base(store_id)}/providers`,
            {
              ...options,
              params: queryParams,
            },
          );
        },
      },
    },

    crm: {
      contact: {
        identify(
          params?: { email?: string; market?: string },
          options?: RequestOptions,
        ): Promise<IdentifyResponse> {
          return submitIdentification("identify", params, options);
        },

        requestCode(
          params?: { email?: string; market?: string },
          options?: RequestOptions,
        ): Promise<IdentifyResponse> {
          return submitIdentification("code", params, options);
        },

        async verify(
          params: { challenge_id: string; code: string },
          options?: RequestOptions,
        ): Promise<VerifyResponse> {
          const store_id = apiConfig.storeId;
          const result = await apiConfig.httpClient.post<VerifyResponse>(
            `${base(store_id)}/account/verify`,
            { store_id, challenge_id: params.challenge_id, code: params.code },
            options,
          );
          if (result?.token?.token) {
            const pending = pendingVerifications.get(params.challenge_id);
            const identifiedStore =
              pending?.store ||
              (await apiConfig.httpClient.get<Store>(base(store_id), options));
            updateContactSession((prev) =>
              prev
                ? {
                    ...prev,
                    access_token: result.token.token,
                    contact: result.contact,
                  }
                : {
                    access_token: result.token.token,
                    contact: result.contact,
                    store: identifiedStore,
                    market: pending?.market || null,
                  },
            );
            pendingVerifications.delete(params.challenge_id);
          }
          return result;
        },

        async logout(options?: RequestOptions): Promise<LogoutResponse> {
          const store_id = apiConfig.storeId;
          try {
            await apiConfig.httpClient.post<void>(
              `${base(store_id)}/account/logout`,
              {},
              options,
            );
          } finally {
            updateContactSession(() => null);
          }
        },

        getMe(options?: RequestOptions): Promise<Contact> {
          return apiConfig.httpClient.get<Contact>(
            `${base()}/account/me`,
            options,
          );
        },
      },

      contactList: {
        get(
          params: GetContactListParams,
          options?: RequestOptions,
        ): Promise<StorefrontContactList> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<StorefrontContactList>(
            `${base(store_id)}/contact-lists/${params.id}`,
            options,
          );
        },

        find(
          params?: FindStorefrontContactListsParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontContactList>> {
          const { store_id, ...queryParams } = params || {};
          return apiConfig.httpClient.get<PaginatedResponse<StorefrontContactList>>(
            `${base(store_id)}/contact-lists`,
            {
              ...options,
              params: queryParams,
            },
          );
        },

        plans: {
          find(
            params: FindStorefrontContactListPlansParams,
            options?: RequestOptions,
          ): Promise<PaginatedResponse<StorefrontContactListPlan>> {
            const { store_id, contact_list_id, ...queryParams } = params;
            return apiConfig.httpClient.get<PaginatedResponse<StorefrontContactListPlan>>(
              `${base(store_id)}/contact-lists/${contact_list_id}/plans`,
              { ...options, params: queryParams },
            );
          },
        },

        memberships: {
          find(
            params?: FindStorefrontContactListMembershipsParams,
            options?: RequestOptions,
          ): Promise<PaginatedResponse<StorefrontContactListMembership>> {
            const { store_id, ...queryParams } = params || {};
            return apiConfig.httpClient.get<
              PaginatedResponse<StorefrontContactListMembership>
            >(`${base(store_id)}/contact-lists/memberships`, {
              ...options,
              params: queryParams,
            });
          },
        },

        subscribe(
          params: SubscribeContactListParams,
          options?: RequestOptions,
        ): Promise<ContactListSubscribeResponse> {
          const { store_id, id, ...payload } = params;
          return apiConfig.httpClient.post<ContactListSubscribeResponse>(
            `${base(store_id)}/contact-lists/${id}/subscribe`,
            payload,
            options,
          );
        },

        checkAccess(
          params: ContactListAccessParams,
          options?: RequestOptions,
        ): Promise<ContactListAccessResponse> {
          const store_id = params.store_id || apiConfig.storeId;
          return apiConfig.httpClient.get<ContactListAccessResponse>(
            `${base(store_id)}/contact-lists/${params.id}/access`,
            options,
          );
        },

        checkContentAccess(
          params: ContactListContentAccessParams,
          options?: RequestOptions,
        ): Promise<ContactListContentAccessResponse> {
          const { store_id, ...payload } = params;
          return apiConfig.httpClient.post<ContactListContentAccessResponse>(
            `${base(store_id)}/contact-lists/access`,
            payload,
            options,
          );
        },

        manage(
          token: string,
          options?: RequestOptions,
        ): Promise<ContactListManagementResponse> {
          return apiConfig.httpClient.post<ContactListManagementResponse>(
            `${base()}/contact-lists/manage`,
            { token },
            options,
          );
        },

        unsubscribe(
          token: string,
          options?: RequestOptions,
        ): Promise<{ success: boolean }> {
          const headers = { ...options?.headers };
          for (const name of Object.keys(headers)) {
            if (name.toLowerCase() === "content-type") delete headers[name];
          }
          return apiConfig.httpClient.post<{ success: boolean }>(
            `${base()}/contact-lists/unsubscribe`,
            new URLSearchParams({ "List-Unsubscribe": "One-Click" }),
            {
              ...options,
              params: { ...(options?.params || {}), token },
              headers: {
                ...headers,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            },
          );
        },

        confirm(
          token: string,
          options?: RequestOptions,
        ): Promise<{ success: boolean }> {
          return apiConfig.httpClient.post<{ success: boolean }>(
            `${base()}/contact-lists/confirm`,
            { token },
            options,
          );
        },
      },
    },

    action: createActionApi(apiConfig),
    experiments: {
      use(
        params: UseExperimentParams,
        options?: RequestOptions,
      ): Promise<ExperimentUseResponse> {
        const store_id = params.store_id || apiConfig.storeId;
        return apiConfig.httpClient.post<ExperimentUseResponse>(
          `${base(store_id)}/experiments/use`,
          { key: params.key },
          options,
        );
      },
    },
  };
};
