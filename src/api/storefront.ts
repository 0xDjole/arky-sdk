import type { ContactSessionUpdater, StorefrontApiConfig } from "../index";
import type {
  AddCartItemParams,
  AvailabilityResponse,
  CheckoutCartParams,
  ClearCartParams,
  ContactListAccessParams,
  ContactListContentAccessParams,
  DownloadDigitalAccessParams,
  FindDigitalAccessGrantsParams,
  FindServiceProvidersParams,
  FindStorefrontContactListMembershipsParams,
  FindStorefrontContactListPlansParams,
  FindStorefrontContactListsParams,
  GetAvailabilityParams,
  GetCartParams,
  GetCollectionParams,
  GetContactListParams,
  GetDigitalAccessGrantParams,
  GetEntriesParams,
  GetEntryParams,
  GetFormParams,
  GetOrderParams,
  GetOrdersParams,
  GetProductParams,
  GetProductsParams,
  GetProviderParams,
  GetProvidersParams,
  GetServiceParams,
  GetServicesParams,
  GetTaxonomyChildrenParams,
  GetTaxonomyParams,
  QuoteCartParams,
  RemoveCartItemParams,
  RequestOptions,
  SubmitFormParams,
  SubscribeContactListParams,
  UpdateCartParams,
  VerificationChallengeResponse,
} from "../types/api";
import type {
  Cart,
  Collection,
  CollectionEntry,
  Contact,
  ContactListAccessResponse,
  ContactListContentAccessResponse,
  ContactListSubscribeResponse,
  ContactSessionIssued,
  DigitalAccessDownloadResponse,
  DigitalAccessGrant,
  Form,
  FormSubmission,
  Location,
  Market,
  Order,
  OrderCheckoutResult,
  OrderQuote,
  PaginatedResponse,
  PaymentStoreConfig,
  Product,
  Provider,
  Service,
  ServiceProvider,
  StorefrontContactList,
  StorefrontContactListMembership,
  StorefrontContactListPlan,
  Taxonomy,
  Zone,
} from "../types";
import { sanitizePublicCheckoutItems } from "../utils/orderItems";

type StorefrontParams<T> = T extends unknown
  ? Omit<T, "store_id" | "market">
  : never;

type StorefrontOpaqueKey =
  | "attributes"
  | "blocks"
  | "context"
  | "data"
  | "fields"
  | "metadata"
  | "payload"
  | "properties"
  | "schema"
  | "value";

/**
 * The public Storefront wire shape of an Admin/domain DTO.
 *
 * Store ownership is resolved from the publishable key and is intentionally
 * absent from Storefront responses. User-authored JSON containers stay opaque
 * so a legitimate content key named `store_id` is not erased from its type.
 */
export type StorefrontDto<T> = T extends readonly (infer Item)[]
  ? StorefrontDto<Item>[]
  : T extends object
    ? {
        [Key in keyof T as Key extends "store_id" ? never : Key]:
          Key extends StorefrontOpaqueKey ? T[Key] : StorefrontDto<T[Key]>;
      }
    : T;

export type StorefrontContact = StorefrontDto<Contact>;
export type StorefrontLocation = StorefrontDto<Location>;
export type StorefrontZone = Omit<Zone, "store_id" | "market_id">;
export type StorefrontMarket = Omit<
  Market,
  "store_id" | "created_at" | "updated_at" | "zones"
> & {
  zones: StorefrontZone[];
};

export interface StorefrontSetup {
  timezone: string;
  languages: {
    default: string;
    available: string[];
  };
  markets: {
    default: string | null;
    available: StorefrontMarket[];
  };
  support: {
    email: string | null;
  };
  payment: PaymentStoreConfig | null;
  readiness: {
    market: boolean;
    payment: boolean;
    commerce: boolean;
  };
}

export type IdentifyResponse = {
  contact: StorefrontContact;
  token: ContactSessionIssued | null;
  verification_challenge: VerificationChallengeResponse | null;
};

export type VerifyResponse = {
  contact: StorefrontContact;
  token: ContactSessionIssued;
};

type Country = {
  code: string;
  name: string;
  states: { code: string; name: string }[];
};

type CountriesResponse = { items: Country[]; cursor: string | null };

export interface StorefrontAction {
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
}

export interface ExperimentUseResponse {
  experiment_key: string;
  experiment_version: number;
  variant_key: string;
  goal_action_key: string;
}

export interface StorefrontLifecycle {
  ensureVisitorSession(): Promise<void>;
  getSetup(options?: RequestOptions): Promise<StorefrontSetup>;
}

export const createActionApi = (
  apiConfig: StorefrontApiConfig,
  lifecycle: StorefrontLifecycle,
) => ({
  COMMON_ACTION_KEYS,
  async track(params: TrackActionParams): Promise<void> {
    await lifecycle.ensureVisitorSession();
    try {
      await apiConfig.httpClient.post<void>("/v1/storefront/actions/track", {
        key: params.key,
        payload: params.payload,
      });
    } catch {}
  },
});

export const createStorefrontApi = (
  apiConfig: StorefrontApiConfig,
  updateContactSession: ContactSessionUpdater,
  lifecycle: StorefrontLifecycle,
) => {
  const base = "/v1/storefront";

  function persistIdentification(result: IdentifyResponse): IdentifyResponse {
    const sessionToken =
      result.token?.token ?? apiConfig.authStorage.getTokens()?.access_token;
    if (sessionToken) {
      updateContactSession(() => ({
        sessionToken,
        contact: result.contact,
      }));
    } else {
      updateContactSession(() => null);
    }
    return result;
  }

  async function submitIdentification(
    path: "identify" | "code",
    params?: { email?: string },
    options?: RequestOptions,
  ): Promise<IdentifyResponse> {
    const result = await apiConfig.httpClient.post<IdentifyResponse>(
      `${base}/account/${path}`,
      { email: params?.email },
      options,
    );
    return persistIdentification(result);
  }

  return {
    store: {
      getSetup: lifecycle.getSetup,
      location: {
        getCountries(options?: RequestOptions): Promise<CountriesResponse> {
          return apiConfig.httpClient.get<CountriesResponse>(
            "/v1/platform/countries",
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
        list(options?: RequestOptions): Promise<StorefrontLocation[]> {
          return apiConfig.httpClient.get<StorefrontLocation[]>(
            `${base}/locations`,
            options,
          );
        },
        get(id: string, options?: RequestOptions): Promise<StorefrontLocation> {
          return apiConfig.httpClient.get<StorefrontLocation>(
            `${base}/locations/${id}`,
            options,
          );
        },
      },
      market: {
        list(options?: RequestOptions): Promise<StorefrontMarket[]> {
          return apiConfig.httpClient.get<StorefrontMarket[]>(
            `${base}/markets`,
            options,
          );
        },
        get(id: string, options?: RequestOptions): Promise<StorefrontMarket> {
          return apiConfig.httpClient.get<StorefrontMarket>(
            `${base}/markets/${id}`,
            options,
          );
        },
      },
    },
    cms: {
      collection: {
        get(
          params: StorefrontParams<GetCollectionParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Collection>> {
          const identifier = params.id ?? params.key;
          return apiConfig.httpClient.get<StorefrontDto<Collection>>(
            `${base}/collections/${identifier}`,
            options,
          );
        },
      },
      entry: {
        get(
          params: StorefrontParams<GetEntryParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<CollectionEntry>> {
          return apiConfig.httpClient.get<StorefrontDto<CollectionEntry>>(
            `${base}/entries/${params.id}`,
            options,
          );
        },
        find(
          params: StorefrontParams<GetEntriesParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<CollectionEntry>>> {
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<CollectionEntry>>
          >(
            `${base}/entries`,
            { ...options, params },
          );
        },
      },
      form: {
        get(
          params: StorefrontParams<GetFormParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Form>> {
          const identifier = params.id ?? params.key;
          if (!identifier) throw new Error("GetFormParams requires id or key");
          return apiConfig.httpClient.get<StorefrontDto<Form>>(
            `${base}/forms/${identifier}`,
            options,
          );
        },
        async submit(
          params: StorefrontParams<SubmitFormParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<FormSubmission>> {
          await lifecycle.ensureVisitorSession();
          const { form_id, ...payload } = params;
          if (!form_id) throw new Error("SubmitFormParams requires form_id");
          return apiConfig.httpClient.post<StorefrontDto<FormSubmission>>(
            `${base}/forms/${form_id}/submissions`,
            { ...payload, form_id },
            options,
          );
        },
      },
      taxonomy: {
        get(
          params: StorefrontParams<GetTaxonomyParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Taxonomy>> {
          const identifier = params.id ?? params.key;
          if (!identifier) throw new Error("GetTaxonomyParams requires id or key");
          return apiConfig.httpClient.get<StorefrontDto<Taxonomy>>(
            `${base}/taxonomies/${identifier}`,
            options,
          );
        },
        getChildren(
          params: StorefrontParams<GetTaxonomyChildrenParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Taxonomy>>> {
          return apiConfig.httpClient.get<StorefrontDto<PaginatedResponse<Taxonomy>>>(
            `${base}/taxonomies/${params.id}/children`,
            options,
          );
        },
      },
    },
    eshop: {
      product: {
        get(
          params: StorefrontParams<GetProductParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Product>> {
          const identifier = params.id ?? params.slug;
          if (!identifier) throw new Error("GetProductParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontDto<Product>>(
            `${base}/products/${identifier}`,
            options,
          );
        },
        find(
          params: StorefrontParams<GetProductsParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Product>>> {
          return apiConfig.httpClient.get<StorefrontDto<PaginatedResponse<Product>>>(
            `${base}/products`,
            { ...options, params },
          );
        },
      },
      cart: {
        async current(
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/current`,
            {},
            options,
          );
        },
        async get(
          params: StorefrontParams<GetCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const queryParams = Object.fromEntries(
            Object.entries(
              (options?.params || {}) as Record<string, unknown>,
            ).filter(
              ([name]) => !["token", "cart_token"].includes(name.toLowerCase()),
            ),
          );
          const headers = Object.fromEntries(
            Object.entries(options?.headers || {}).filter(
              ([name]) => name.toLowerCase() !== "x-arky-cart-token",
            ),
          );
          return apiConfig.httpClient.get<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}`,
            {
              ...options,
              headers: {
                ...headers,
                ...(params.token ? { "X-Arky-Cart-Token": params.token } : {}),
              },
              params:
                Object.keys(queryParams).length > 0 ? queryParams : undefined,
            },
          );
        },
        async update(
          params: StorefrontParams<UpdateCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { items, ...payload } = params;
          return apiConfig.httpClient.put<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}`,
            {
              ...payload,
              ...(items ? { items: sanitizePublicCheckoutItems(items) } : {}),
            },
            options,
          );
        },
        async addItem(
          params: StorefrontParams<AddCartItemParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { item, ...payload } = params;
          return apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}/items`,
            { ...payload, item: sanitizePublicCheckoutItems([item])[0] },
            options,
          );
        },
        async removeItem(
          params: StorefrontParams<RemoveCartItemParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}/items/remove`,
            params,
            options,
          );
        },
        async clear(
          params: StorefrontParams<ClearCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}/clear`,
            { id: params.id },
            options,
          );
        },
        async quote(
          params: StorefrontParams<QuoteCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<OrderQuote>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<OrderQuote>>(
            `${base}/carts/${params.id}/quote`,
            { id: params.id },
            options,
          );
        },
        async checkout(
          params: StorefrontParams<CheckoutCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<OrderCheckoutResult>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<OrderCheckoutResult>>(
            `${base}/carts/${params.id}/checkout`,
            {
              id: params.id,
              payment_method_key: params.payment_method_key,
              confirmation_token_id: params.confirmation_token_id,
              return_url: params.return_url,
            },
            options,
          );
        },
      },
      order: {
        async get(
          params: StorefrontParams<GetOrderParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Order>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<Order>>(
            `${base}/orders/${params.id}`,
            options,
          );
        },
        async find(
          params: StorefrontParams<GetOrdersParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Order>>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<PaginatedResponse<Order>>>(
            `${base}/orders`,
            { ...options, params },
          );
        },
        async downloadDigitalAccess(
          params: StorefrontParams<DownloadDigitalAccessParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<DigitalAccessDownloadResponse>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<
            StorefrontDto<DigitalAccessDownloadResponse>
          >(
            `${base}/orders/${params.order_id}/digital-access/${params.grant_id}/download`,
            {},
            options,
          );
        },
        async findDigitalAccess(
          params: StorefrontParams<FindDigitalAccessGrantsParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<DigitalAccessGrant>>> {
          await lifecycle.ensureVisitorSession();
          const { order_id, ...queryParams } = params;
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<DigitalAccessGrant>>
          >(
            `${base}/orders/${order_id}/digital-access`,
            { ...options, params: queryParams },
          );
        },
        async getDigitalAccess(
          params: StorefrontParams<GetDigitalAccessGrantParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<DigitalAccessGrant>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<DigitalAccessGrant>>(
            `${base}/orders/${params.order_id}/digital-access/${params.grant_id}`,
            options,
          );
        },
      },
      service: {
        get(
          params: StorefrontParams<GetServiceParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Service>> {
          const identifier = params.id ?? params.slug;
          if (!identifier) throw new Error("GetServiceParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontDto<Service>>(
            `${base}/services/${identifier}`,
            options,
          );
        },
        find(
          params: StorefrontParams<GetServicesParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Service>>> {
          return apiConfig.httpClient.get<StorefrontDto<PaginatedResponse<Service>>>(
            `${base}/services`,
            { ...options, params },
          );
        },
        findProviders(
          params: StorefrontParams<FindServiceProvidersParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<ServiceProvider[]>> {
          return apiConfig.httpClient.get<StorefrontDto<ServiceProvider[]>>(
            `${base}/service-providers`,
            { ...options, params },
          );
        },
        getAvailability(
          params: StorefrontParams<GetAvailabilityParams>,
          options?: RequestOptions,
        ): Promise<AvailabilityResponse> {
          return apiConfig.httpClient.get<AvailabilityResponse>(
            `${base}/services/availability`,
            { ...options, params },
          );
        },
      },
      provider: {
        get(
          params: StorefrontParams<GetProviderParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Provider>> {
          const identifier = params.id ?? params.slug;
          if (!identifier) throw new Error("GetProviderParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontDto<Provider>>(
            `${base}/providers/${identifier}`,
            options,
          );
        },
        find(
          params: StorefrontParams<GetProvidersParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Provider>>> {
          return apiConfig.httpClient.get<StorefrontDto<PaginatedResponse<Provider>>>(
            `${base}/providers`,
            { ...options, params },
          );
        },
      },
    },
    crm: {
      contact: {
        identify(
          params?: { email?: string },
          options?: RequestOptions,
        ): Promise<IdentifyResponse> {
          return submitIdentification("identify", params, options);
        },
        requestCode(
          params?: { email?: string },
          options?: RequestOptions,
        ): Promise<IdentifyResponse> {
          return submitIdentification("code", params, options);
        },
        async verify(
          params: { challenge_id: string; code: string },
          options?: RequestOptions,
        ): Promise<VerifyResponse> {
          const result = await apiConfig.httpClient.post<VerifyResponse>(
            `${base}/account/verify`,
            params,
            options,
          );
          if (result.token?.token) {
            updateContactSession(() => ({
              sessionToken: result.token.token,
              contact: result.contact,
            }));
          }
          return result;
        },
        async logout(options?: RequestOptions): Promise<void> {
          try {
            await apiConfig.httpClient.post<void>(
              `${base}/account/logout`,
              {},
              options,
            );
          } finally {
            updateContactSession(() => null);
          }
        },
        getMe(options?: RequestOptions): Promise<StorefrontContact> {
          return apiConfig.httpClient.get<StorefrontContact>(
            `${base}/account/me`,
            options,
          );
        },
      },
      contactList: {
        get(
          params: StorefrontParams<GetContactListParams>,
          options?: RequestOptions,
        ): Promise<StorefrontContactList> {
          return apiConfig.httpClient.get<StorefrontContactList>(
            `${base}/contact-lists/${params.id}`,
            options,
          );
        },
        find(
          params: StorefrontParams<FindStorefrontContactListsParams> = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontContactList>> {
          return apiConfig.httpClient.get<PaginatedResponse<StorefrontContactList>>(
            `${base}/contact-lists`,
            { ...options, params },
          );
        },
        plans: {
          find(
            params: StorefrontParams<FindStorefrontContactListPlansParams>,
            options?: RequestOptions,
          ): Promise<PaginatedResponse<StorefrontContactListPlan>> {
            const { contact_list_id, ...queryParams } = params;
            return apiConfig.httpClient.get<PaginatedResponse<StorefrontContactListPlan>>(
              `${base}/contact-lists/${contact_list_id}/plans`,
              { ...options, params: queryParams },
            );
          },
        },
        memberships: {
          async find(
            params: StorefrontParams<FindStorefrontContactListMembershipsParams> = {},
            options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<StorefrontContactListMembership>>> {
            await lifecycle.ensureVisitorSession();
            return apiConfig.httpClient.get<
              StorefrontDto<PaginatedResponse<StorefrontContactListMembership>>
            >(`${base}/contact-lists/memberships`, {
              ...options,
              params,
            });
          },
        },
        async subscribe(
          params: StorefrontParams<SubscribeContactListParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<ContactListSubscribeResponse>> {
          await lifecycle.ensureVisitorSession();
          const { id, ...payload } = params;
          return apiConfig.httpClient.post<StorefrontDto<ContactListSubscribeResponse>>(
            `${base}/contact-lists/${id}/subscribe`,
            payload,
            options,
          );
        },
        async checkAccess(
          params: StorefrontParams<ContactListAccessParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<ContactListAccessResponse>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<ContactListAccessResponse>>(
            `${base}/contact-lists/${params.id}/access`,
            options,
          );
        },
        async checkContentAccess(
          params: StorefrontParams<ContactListContentAccessParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<ContactListContentAccessResponse>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<
            StorefrontDto<ContactListContentAccessResponse>
          >(
            `${base}/contact-lists/access`,
            params,
            options,
          );
        },
      },
    },
    action: createActionApi(apiConfig, lifecycle),
    experiments: {
      async use(
        params: UseExperimentParams,
        options?: RequestOptions,
      ): Promise<ExperimentUseResponse> {
        await lifecycle.ensureVisitorSession();
        return apiConfig.httpClient.post<ExperimentUseResponse>(
          `${base}/experiments/use`,
          { key: params.key },
          options,
        );
      },
    },
  };
};
