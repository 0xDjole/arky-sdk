import type { EpochMilliseconds } from "../types/time";
import type { StorefrontApiConfig } from "../services/clientTypes";
import type {
  AddCartBookingParams,
  AddCartDigitalProductParams,
  AddCartProductParams,
  AvailabilityResponse,
  CheckoutCartParams,
  ClearCartParams,
  ConfirmAudienceParams,
  CreateAudienceBillingPortalSessionParams,
  CustomerAudienceMembershipReferenceParams,
  FindCustomerAudienceMembershipsParams,
  FindBookingOfferingsParams,
  FindStorefrontAudiencesParams,
  GetAvailabilityParams,
  GetCartParams,
  GetCollectionParams,
  GetEntriesParams,
  GetEntriesByIdsParams,
  GetMediaByIdsParams,
  GetEntryParams,
  GetFormParams,
  GetOrderParams,
  GetOrdersParams,
  BookingItemLifecycleParams,
  GetProductParams,
  GetProductsParams,
  GetBookingResourceParams,
  FindBookingResourcesParams,
  GetBookingServiceParams,
  FindBookingServicesParams,
  GetStorefrontAudienceParams,
  GetClassificationChildrenParams,
  GetStorefrontClassificationParams,
  QuoteCartParams,
  DownloadDigitalAssetParams,
  GetDigitalLibraryProductParams,
  FindStorefrontDigitalProductsParams,
  GetStorefrontDigitalProductParams,
  RemoveCartItemParams,
  RequestOptions,
  JoinAudienceParams,
  StartAudienceCheckoutParams,
  SubmitFormParams,
  UnsubscribeAudienceParams,
  UpdateCartParams,
} from "../types/api";
import type {
  Cart,
  DigitalDownload,
  DigitalLibraryItem,
  DigitalLibraryProduct,
  DigitalLibraryAsset,
  StorefrontDigitalProduct,
  Collection,
  CollectionEntry,
  AudienceBillingPortalSession,
  AudienceJoinResult,
  CustomerAudienceMembership,
  CustomerSessionIssued,
  CustomerEmailVerification,
  CustomerSessionRecord,
  Form,
  FormSubmission,
  Market,
  Media,
  Order,
  OrderCheckoutResult,
  OrderQuote,
  PaginatedResponse,
  Product,
  ProductInventory,
  BookingResource,
  BookingService,
  BookingOffering,
  StartAudienceCheckoutResult,
  StorefrontAudience,
  Classification,
} from "../types";
import type {
  StorefrontCustomer,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontDto,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontParams,
  StorefrontZone,
} from "../types/storefront";
export type {
  StorefrontCustomer,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontDto,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontZone,
} from "../types/storefront";
import {
  sanitizePublicCartBookings,
  sanitizePublicCartDigitalProducts,
  sanitizePublicCartProducts,
} from "../utils/cartInputs";
import {
  DurableRequestStorageError,
  clearDurableRequest,
  durableRequestPayload,
  getOrCreateDurableRequest,
  readDurableRequest,
  withDurableRequestLock,
} from "../utils/durableRequest";

const audienceCheckoutLabel = "Audience Checkout";
const canonicalUuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

interface DurableAudienceCheckoutRequest {
  audience_id: string;
  request_id: string;
  email: string;
  cadence: "one_time" | "monthly" | "yearly";
  return_url: string;
}

function browserHasDurableStorage(): boolean {
  return typeof globalThis.window !== "undefined";
}

function responseStatusCode(value: unknown): number | null {
  if (typeof value !== "object" || value === null || !("statusCode" in value)) {
    return null;
  }
  return typeof value.statusCode === "number" ? value.statusCode : null;
}

function newAudienceCheckoutRequestId(): string {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id || !canonicalUuidV4.test(id)) {
    throw new DurableRequestStorageError(
      `Cannot safely start ${audienceCheckoutLabel} because UUID-v4 generation is unavailable`,
    );
  }
  return id;
}

function audienceCheckoutStorageKey(
  apiConfig: StorefrontApiConfig,
  audienceId: string,
): string {
  return `arky:audience-checkout:v1:${encodeURIComponent(apiConfig.apiUrl.toLowerCase())}:${encodeURIComponent(apiConfig.publishableKey)}:${encodeURIComponent(audienceId)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function persistedAudienceCheckoutRequest(
  value: unknown,
): DurableAudienceCheckoutRequest {
  if (!isRecord(value)) {
    throw new DurableRequestStorageError(
      `Cannot safely continue ${audienceCheckoutLabel} because its durable payload is invalid`,
    );
  }
  const keys = Object.keys(value);
  const expectedKeys = [
    "audience_id",
    "request_id",
    "email",
    "cadence",
    "return_url",
  ];
  if (
    keys.length !== expectedKeys.length ||
    expectedKeys.some((key) => !keys.includes(key)) ||
    typeof value.audience_id !== "string" ||
    typeof value.request_id !== "string" ||
    !canonicalUuidV4.test(value.request_id) ||
    typeof value.email !== "string" ||
    (value.cadence !== "one_time" &&
      value.cadence !== "monthly" &&
      value.cadence !== "yearly") ||
    typeof value.return_url !== "string"
  ) {
    throw new DurableRequestStorageError(
      `Cannot safely continue ${audienceCheckoutLabel} because its durable payload is invalid`,
    );
  }
  return value as unknown as DurableAudienceCheckoutRequest;
}

function audienceCheckoutInputMatches(
  request: DurableAudienceCheckoutRequest,
  params: StorefrontParams<StartAudienceCheckoutParams>,
): boolean {
  return (
    request.audience_id === params.audience_id &&
    request.email === params.email &&
    request.cadence === params.cadence &&
    request.return_url === params.return_url
  );
}

function matchingAudienceCheckoutResult(
  value: StartAudienceCheckoutResult,
): boolean {
  return (
    canonicalUuidV4.test(value.checkout_id) &&
    typeof value.publishable_key === "string" &&
    value.publishable_key.length > 0 &&
    typeof value.client_secret === "string" &&
    value.client_secret.length > 0 &&
    typeof value.connected_account_id === "string" &&
    value.connected_account_id.length > 0 &&
    Number.isSafeInteger(value.expires_at) &&
    value.expires_at > 0
  );
}

export interface CustomerSessionInternal {
  customer: StorefrontCustomer;
  session: CustomerSessionIssued;
}

export type CustomerSessionUpdater = (
  updater: (
    previous: CustomerSessionInternal | null,
  ) => CustomerSessionInternal | null,
) => void;

export interface StorefrontPaymentProvider {
  id: string;
  type: "cash_on_delivery" | "stripe";
}

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
  payment_providers: StorefrontPaymentProvider[];
  support: {
    email: string | null;
  };
  readiness: {
    market: boolean;
    payment: boolean;
    commerce: boolean;
  };
}

export type IdentifyResponse = {
  customer: StorefrontCustomer;
  session: CustomerSessionIssued;
};

export type StorefrontVisitorSessionRecord = {
  id: string;
  customer_id: string;
  type: "visitor";
  status: "active";
  superseded_at: null;
  revoked_at: null;
  expires_at: EpochMilliseconds;
  email_verification: CustomerEmailVerification;
  last_seen_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
};

export type RequestCodeResponse = {
  customer: StorefrontCustomer;
  session: StorefrontVisitorSessionRecord;
  email_verification: {
    sent_at: EpochMilliseconds;
    expires_at: EpochMilliseconds;
  };
};

export type VerifyResponse = IdentifyResponse;
export type RefreshResponse = IdentifyResponse;

export type CustomerMeResponse = {
  customer: StorefrontCustomer;
  session: StorefrontDto<CustomerSessionRecord>;
};

type Country = {
  code: string;
  name: string;
  states: { code: string; name: string }[];
};

type CountriesResponse = { items: Country[]; cursor: string | null };

export interface TrackCustomerActionParams {
  key: string;
  data?: Record<string, unknown>;
}

export const COMMON_CUSTOMER_ACTION_KEYS = [
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

export type CommonCustomerActionKey = (typeof COMMON_CUSTOMER_ACTION_KEYS)[number];

export interface UseExperimentParams {
  key: string;
}

export type ExperimentUseResponse =
  | {
      type: "assigned";
      experiment_id: string;
      experiment_key: string;
      variant_key: string;
    }
  | { type: "inactive" };

export interface StorefrontLifecycle {
  ensureVisitorSession(): Promise<void>;
  getSetup(options?: RequestOptions): Promise<StorefrontSetup>;
}

export const createActionsStorefrontApi = (
  apiConfig: StorefrontApiConfig,
  lifecycle: StorefrontLifecycle,
) => ({
  COMMON_CUSTOMER_ACTION_KEYS,
  async track(params: TrackCustomerActionParams): Promise<void> {
    await lifecycle.ensureVisitorSession();
    await apiConfig.httpClient.post<void>("/v1/storefront/actions/track", {
      key: params.key,
      data: params.data,
    });
  },
});

export const createStorefrontApi = (
  apiConfig: StorefrontApiConfig,
  updateCustomerSession: CustomerSessionUpdater,
  lifecycle: StorefrontLifecycle,
) => {
  const base = "/v1/storefront";

  function persistIssuedSession<T extends IdentifyResponse>(result: T): T {
    updateCustomerSession(() => ({
      customer: result.customer,
      session: result.session,
    }));
    return result;
  }

  async function submitIdentification(
    path: "identify",
    params?: { email?: string },
    options?: RequestOptions,
  ): Promise<IdentifyResponse> {
    const result = await apiConfig.httpClient.post<IdentifyResponse>(
      `${base}/customer/${path}`,
      { email: params?.email },
      options,
    );
    return persistIssuedSession(result);
  }

  return {
    customer: {
      identify(
        params?: { email?: string },
        options?: RequestOptions,
      ): Promise<IdentifyResponse> {
        return submitIdentification("identify", params, options);
      },
      async requestCode(
        params: { email: string },
        options?: RequestOptions,
      ): Promise<RequestCodeResponse> {
        const result = await apiConfig.httpClient.post<RequestCodeResponse>(
          `${base}/customer/request-code`,
          { email: params.email },
          options,
        );
        updateCustomerSession((previous) => {
          if (
            !previous ||
            previous.session.type !== "visitor" ||
            previous.session.id !== result.session.id ||
            previous.session.customer_id !== result.session.customer_id
          ) {
            throw new Error(
              "Customer request-code response does not match the active Visitor session",
            );
          }
          return { ...previous, customer: result.customer };
        });
        return result;
      },
      async verify(
        params: { code: string },
        options?: RequestOptions,
      ): Promise<VerifyResponse> {
        const result = await apiConfig.httpClient.post<VerifyResponse>(
          `${base}/customer/verify`,
          { code: params.code },
          options,
        );
        return persistIssuedSession(result);
      },
      async refresh(options?: RequestOptions): Promise<RefreshResponse> {
        const refresh_token = apiConfig.authStorage.getTokens()?.refresh_token;
        if (!refresh_token) {
          throw new Error("An email-authenticated Customer session is required");
        }
        const result = await apiConfig.publishableKeyHttpClient.post<RefreshResponse>(
          `${base}/customer/refresh`,
          { refresh_token },
          options,
        );
        return persistIssuedSession(result);
      },
      async logout(options?: RequestOptions): Promise<void> {
        try {
          await apiConfig.httpClient.post<void>(
            `${base}/customer/logout`,
            {},
            options,
          );
        } finally {
          updateCustomerSession(() => null);
        }
      },
      getMe(options?: RequestOptions): Promise<CustomerMeResponse> {
        return apiConfig.httpClient.get<CustomerMeResponse>(
          `${base}/customer/me`,
          options,
        );
      },
    },
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
    media: {
      findByIds(
        params: StorefrontParams<GetMediaByIdsParams>,
        options?: RequestOptions,
      ): Promise<StorefrontDto<Media[]>> {
        return apiConfig.httpClient.get<StorefrontDto<Media[]>>(
          `${base}/media`,
          { ...options, params },
        );
      },
    },
    content: {
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
        findByIds(
          params: StorefrontParams<GetEntriesByIdsParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<CollectionEntry>>> {
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<CollectionEntry>>
          >(`${base}/entries`, { ...options, params });
        },
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
          >(`${base}/entries`, { ...options, params });
        },
      },
    },
    forms: {
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
    classification: {
      get(
        params: StorefrontParams<GetStorefrontClassificationParams>,
        options?: RequestOptions,
      ): Promise<StorefrontDto<Classification>> {
        const identifier = params.id ?? params.key;
        if (!identifier)
          throw new Error(
            "GetStorefrontClassificationParams requires id or key",
          );
        return apiConfig.httpClient.get<StorefrontDto<Classification>>(
          `${base}/classifications/${identifier}`,
          options,
        );
      },
      getChildren(
        params: StorefrontParams<GetClassificationChildrenParams>,
        options?: RequestOptions,
      ): Promise<StorefrontDto<Classification[]>> {
        return apiConfig.httpClient.get<StorefrontDto<Classification[]>>(
          `${base}/classifications/${params.id}/children`,
          options,
        );
      },
    },
    eshop: {
      digital: {
        async find(
          params: FindStorefrontDigitalProductsParams = {},
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<StorefrontDigitalProduct>>> {
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<StorefrontDigitalProduct>>
          >(`${base}/digital-products`, { ...options, params });
        },
        async get(
          params: GetStorefrontDigitalProductParams,
          options?: RequestOptions,
        ): Promise<StorefrontDto<StorefrontDigitalProduct>> {
          return apiConfig.httpClient.get<
            StorefrontDto<StorefrontDigitalProduct>
          >(`${base}/digital-products/${params.identifier}`, options);
        },
        async library(
          params: FindStorefrontDigitalProductsParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<DigitalLibraryItem>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<
            PaginatedResponse<DigitalLibraryItem>
          >(`${base}/digital-products/library`, { ...options, params });
        },
        async getLibraryProduct(
          params: StorefrontParams<GetDigitalLibraryProductParams>,
          options?: RequestOptions,
        ): Promise<DigitalLibraryProduct> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<DigitalLibraryProduct>(
            `${base}/digital-products/library/${params.digital_product_id}`,
            options,
          );
        },
        async getLibraryAssets(
          params: StorefrontParams<GetDigitalLibraryProductParams>,
          options?: RequestOptions,
        ): Promise<DigitalLibraryAsset[]> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<DigitalLibraryAsset[]>(
            `${base}/digital-products/library/${params.digital_product_id}/assets`,
            options,
          );
        },
        async download(
          params: DownloadDigitalAssetParams,
          options?: RequestOptions,
        ): Promise<DigitalDownload> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<DigitalDownload>(
            `${base}/digital-products/${params.digital_product_id}/assets/${params.asset_id}/download`,
            options,
          );
        },
      },
      product: {
        get(
          params: StorefrontParams<GetProductParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Product>> {
          const identifier = params.id ?? params.slug;
          if (!identifier)
            throw new Error("GetProductParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontDto<Product>>(
            `${base}/products/${identifier}`,
            options,
          );
        },
        getInventory(
          params: StorefrontParams<GetProductParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<ProductInventory[]>> {
          const identifier = params.id ?? params.slug;
          if (!identifier)
            throw new Error("GetProductParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontDto<ProductInventory[]>>(
            `${base}/products/${identifier}/inventory`,
            options,
          );
        },
        find(
          params: StorefrontParams<GetProductsParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Product>>> {
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<Product>>
          >(`${base}/products`, { ...options, params });
        },
      },
      cart: {
        async current(options?: RequestOptions): Promise<StorefrontDto<Cart>> {
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
          const { product_items, booking_items, digital_items, ...payload } =
            params;
          return apiConfig.httpClient.put<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}`,
            {
              ...payload,
              ...(product_items
                ? { product_items: sanitizePublicCartProducts(product_items) }
                : {}),
              ...(booking_items
                ? { booking_items: sanitizePublicCartBookings(booking_items) }
                : {}),
              ...(digital_items
                ? {
                    digital_items:
                      sanitizePublicCartDigitalProducts(digital_items),
                  }
                : {}),
            },
            options,
          );
        },
        async addProduct(
          params: StorefrontParams<AddCartProductParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { product, ...payload } = params;
          return apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}/product-items`,
            { ...payload, product: sanitizePublicCartProducts([product])[0] },
            options,
          );
        },
        async addBooking(
          params: StorefrontParams<AddCartBookingParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { booking, ...payload } = params;
          return apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}/booking-items`,
            { ...payload, booking: sanitizePublicCartBookings([booking])[0] },
            options,
          );
        },
        async addDigital(
          params: StorefrontParams<AddCartDigitalProductParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { digital, ...payload } = params;
          return apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${params.id}/digital-items`,
            {
              ...payload,
              digital: sanitizePublicCartDigitalProducts([digital])[0],
            },
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
              payment_provider_id: params.payment_provider_id,
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
        async getPayment(
          params: StorefrontParams<GetOrderParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<OrderCheckoutResult>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<OrderCheckoutResult>>(
            `${base}/orders/${params.id}/payment`,
            options,
          );
        },
        async find(
          params: StorefrontParams<GetOrdersParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Order>>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<Order>>
          >(`${base}/orders`, { ...options, params });
        },
        async cancelBookingItem(
          params: StorefrontParams<BookingItemLifecycleParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Order>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<Order>>(
            `${base}/orders/${params.order_id}/booking-items/${params.order_booking_item_id}/cancel`,
            {},
            options,
          );
        },
      },
      bookingService: {
        get(
          params: StorefrontParams<GetBookingServiceParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<BookingService>> {
          const identifier = params.id ?? params.slug;
          if (!identifier)
            throw new Error("GetBookingServiceParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontDto<BookingService>>(
            `${base}/booking-services/${identifier}`,
            options,
          );
        },
        find(
          params: StorefrontParams<FindBookingServicesParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<BookingService>>> {
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<BookingService>>
          >(`${base}/booking-services`, { ...options, params });
        },
        getAvailability(
          params: StorefrontParams<GetAvailabilityParams>,
          options?: RequestOptions,
        ): Promise<AvailabilityResponse> {
          return apiConfig.httpClient.get<AvailabilityResponse>(
            `${base}/booking-services/availability`,
            { ...options, params },
          );
        },
      },
      bookingOffering: {
        find(
          params: StorefrontParams<FindBookingOfferingsParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<BookingOffering[]>> {
          return apiConfig.httpClient.get<StorefrontDto<BookingOffering[]>>(
            `${base}/booking-offerings`,
            { ...options, params },
          );
        },
      },
      bookingResource: {
        get(
          params: StorefrontParams<GetBookingResourceParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<BookingResource>> {
          return apiConfig.httpClient.get<StorefrontDto<BookingResource>>(
            `${base}/booking-resources/${params.id}`,
            options,
          );
        },
        find(
          params: StorefrontParams<FindBookingResourcesParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<BookingResource>>> {
          return apiConfig.httpClient.get<
            StorefrontDto<PaginatedResponse<BookingResource>>
          >(`${base}/booking-resources`, { ...options, params });
        },
      },
    },
    audiences: {
      find(
        params: FindStorefrontAudiencesParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontAudience>> {
        return apiConfig.httpClient.get<
          PaginatedResponse<StorefrontAudience>
        >(`${base}/audiences`, { ...options, params });
      },
      get(
        params: GetStorefrontAudienceParams,
        options?: RequestOptions,
      ): Promise<StorefrontAudience> {
        return apiConfig.httpClient.get<StorefrontAudience>(
          `${base}/audiences/${params.key}`,
          options,
        );
      },
      async join(
        params: StorefrontParams<JoinAudienceParams>,
        options?: RequestOptions,
      ): Promise<AudienceJoinResult> {
        await lifecycle.ensureVisitorSession();
        const { audience_id, ...payload } = params;
        return apiConfig.httpClient.post<AudienceJoinResult>(
          `${base}/audiences/${audience_id}/join`,
          payload,
          options,
        );
      },
      async checkout(
        params: StorefrontParams<StartAudienceCheckoutParams>,
        options?: RequestOptions,
      ): Promise<StartAudienceCheckoutResult> {
        await lifecycle.ensureVisitorSession();
        const post = (request: DurableAudienceCheckoutRequest) => {
          const { audience_id, ...payload } = request;
          return apiConfig.httpClient.post<StartAudienceCheckoutResult>(
            `${base}/audiences/${audience_id}/checkout`,
            payload,
            options,
          );
        };
        const freshRequest = (): DurableAudienceCheckoutRequest => ({
          audience_id: params.audience_id,
          request_id: newAudienceCheckoutRequestId(),
          email: params.email,
          cadence: params.cadence,
          return_url: params.return_url,
        });

        if (!browserHasDurableStorage()) {
          return post(freshRequest());
        }

        const storageKey = audienceCheckoutStorageKey(
          apiConfig,
          params.audience_id,
        );
        return withDurableRequestLock(
          storageKey,
          audienceCheckoutLabel,
          async () => {
            const retained = readDurableRequest(storageKey, audienceCheckoutLabel);
            const payload = retained
              ? persistedAudienceCheckoutRequest(durableRequestPayload(retained))
              : freshRequest();
            if (!audienceCheckoutInputMatches(payload, params)) {
              throw new DurableRequestStorageError(
                `Cannot safely continue ${audienceCheckoutLabel} because its unresolved request has different immutable input`,
              );
            }
            const durable = getOrCreateDurableRequest(
              storageKey,
              payload,
              audienceCheckoutLabel,
            );
            const exactPayload = persistedAudienceCheckoutRequest(
              durableRequestPayload(durable),
            );
            let result: StartAudienceCheckoutResult;
            try {
              result = await post(exactPayload);
            } catch (error) {
              if (responseStatusCode(error) === 400) {
                clearDurableRequest(durable, audienceCheckoutLabel);
              }
              throw error;
            }
            if (!matchingAudienceCheckoutResult(result)) {
              throw new DurableRequestStorageError(
                `Cannot safely continue ${audienceCheckoutLabel} because Server returned invalid Checkout evidence`,
              );
            }
            clearDurableRequest(durable, audienceCheckoutLabel);
            return result;
          },
        );
      },
      customer: {
        async find(
          params: FindCustomerAudienceMembershipsParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<CustomerAudienceMembership>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<
            PaginatedResponse<CustomerAudienceMembership>
          >("/v1/customer/audience-memberships", { ...options, params });
        },

        async get(
          params: CustomerAudienceMembershipReferenceParams,
          options?: RequestOptions,
        ): Promise<CustomerAudienceMembership> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<CustomerAudienceMembership>(
            `/v1/customer/audience-memberships/${params.membership_id}`,
            options,
          );
        },

        async resendConfirmation(
          params: CustomerAudienceMembershipReferenceParams,
          options?: RequestOptions,
        ): Promise<CustomerAudienceMembership> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<CustomerAudienceMembership>(
            `/v1/customer/audience-memberships/${params.membership_id}/confirmation/resend`,
            {},
            options,
          );
        },

        async resubscribe(
          params: CustomerAudienceMembershipReferenceParams,
          options?: RequestOptions,
        ): Promise<CustomerAudienceMembership> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<CustomerAudienceMembership>(
            `/v1/customer/audience-memberships/${params.membership_id}/resubscribe`,
            {},
            options,
          );
        },

        async leave(
          params: CustomerAudienceMembershipReferenceParams,
          options?: RequestOptions,
        ): Promise<CustomerAudienceMembership> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<CustomerAudienceMembership>(
            `/v1/customer/audience-memberships/${params.membership_id}/leave`,
            {},
            options,
          );
        },

        async cancelRenewal(
          params: CustomerAudienceMembershipReferenceParams,
          options?: RequestOptions,
        ): Promise<CustomerAudienceMembership> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<CustomerAudienceMembership>(
            `/v1/customer/audience-memberships/${params.membership_id}/renewal/cancel`,
            {},
            options,
          );
        },

        async createBillingPortal(
          params: CreateAudienceBillingPortalSessionParams,
          options?: RequestOptions,
        ): Promise<AudienceBillingPortalSession> {
          await lifecycle.ensureVisitorSession();
          const { membership_id, ...payload } = params;
          return apiConfig.httpClient.post<AudienceBillingPortalSession>(
            `/v1/customer/audience-memberships/${membership_id}/billing-portal`,
            payload,
            options,
          );
        },

        async confirm(
          params: ConfirmAudienceParams,
          options?: RequestOptions,
        ): Promise<CustomerAudienceMembership> {
          return apiConfig.httpClient.post<CustomerAudienceMembership>(
            "/v1/customer/audience-memberships/confirm",
            params,
            options,
          );
        },

        async unsubscribe(
          params: UnsubscribeAudienceParams,
          options?: RequestOptions,
        ): Promise<boolean> {
          return apiConfig.httpClient.post<boolean>(
            "/v1/customer/audience-memberships/unsubscribe",
            params,
            options,
          );
        },
      },
    },
    actions: createActionsStorefrontApi(apiConfig, lifecycle),
    experiments: {
      async use(
        params: UseExperimentParams,
        options?: RequestOptions,
      ): Promise<ExperimentUseResponse> {
        await lifecycle.ensureVisitorSession();
        return apiConfig.httpClient.post<ExperimentUseResponse>(
          `${base}/experiments/${encodeURIComponent(params.key)}/use`,
          undefined,
          options,
        );
      },
    },
  };
};
