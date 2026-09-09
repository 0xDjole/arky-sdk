import type { EpochMilliseconds } from "../types/time";
import type { CheckoutSubscriptionParams, QuoteSubscriptionParams, SubscriptionCheckoutResult, SubscriptionQuote } from "../types/subscription";
import { checkoutSubscription, subscriptionSelection } from "../services/subscription";
import { checkoutCart, pendingCartCheckout, recoverCartCheckout, withCartMutation } from "../services/cartCheckout";
import type { CartCheckoutTransport, CartCheckoutRequest } from "../types/cartCheckout";
import type { StorefrontApiConfig } from "../services/clientTypes";
import type {
  AddCartAudienceParams,
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
  SubmitFormParams,
  UnsubscribeAudienceParams,
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
  StorefrontAudience,
  Classification,
} from "../types";
import type {
  StorefrontCustomer,
  StorefrontCurrentCartParams,
  StorefrontUpdateCartParams,
  StorefrontAddCartProductParams,
  StorefrontAddCartBookingParams,
  StorefrontAddCartDigitalParams,
  StorefrontProduct,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontDto,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontParams,
  StorefrontZone,
} from "../types/storefront";
import type { CatalogReadOptions } from "../types/catalog";
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
  sanitizePublicCartAudiences,
  sanitizePublicCartUpdate,
  sanitizePublicCartDigitalProducts,
  sanitizePublicCartProducts,
} from "../utils/cartInputs";

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
  const checkoutScope = `storefront:${apiConfig.apiUrl}:${apiConfig.publishableKey}`;
  const checkoutTransport: CartCheckoutTransport<StorefrontDto<OrderCheckoutResult>> = {
    async post({ id, ...request }, options) {
      await lifecycle.ensureVisitorSession();
      return apiConfig.httpClient.post<StorefrontDto<OrderCheckoutResult>>(
        `${base}/carts/${encodeURIComponent(id)}/checkout`, request, options,
      );
    },
    async getCart(id, options) {
      await lifecycle.ensureVisitorSession();
      return apiConfig.httpClient.get<StorefrontDto<Cart>>(`${base}/carts/${encodeURIComponent(id)}`, options);
    },
  };

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
          >(`${base}/digital-products/${encodeURIComponent(params.identifier)}`, {
            ...options,
            params: { company_id: params.company_id, include_price: params.include_price },
          });
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
          params: StorefrontParams<GetProductParams> & CatalogReadOptions,
          options?: RequestOptions,
        ): Promise<StorefrontProduct> {
          const identifier = params.id ?? params.slug;
          if (!identifier)
            throw new Error("GetProductParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontProduct>(
            `${base}/products/${encodeURIComponent(identifier)}`,
            { ...options, params: { company_id: params.company_id, include_price: params.include_price } },
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
          params: StorefrontParams<Omit<GetProductsParams, "status">> & CatalogReadOptions,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontProduct>> {
          return apiConfig.httpClient.get<
            PaginatedResponse<StorefrontProduct>
          >(`${base}/products`, { ...options, params });
        },
      },
      cart: {
        subscription: {
          async quote(
            params: StorefrontParams<QuoteSubscriptionParams>,
            options?: RequestOptions,
          ): Promise<StorefrontDto<SubscriptionQuote>> {
            const selection = subscriptionSelection(params.selection);
            await lifecycle.ensureVisitorSession();
            return apiConfig.httpClient.post<StorefrontDto<SubscriptionQuote>>(
              `${base}/carts/subscriptions/quote`, { selection }, options,
            );
          },
          async checkout(
            params: StorefrontParams<CheckoutSubscriptionParams>,
            options?: RequestOptions,
          ): Promise<SubscriptionCheckoutResult> {
            return checkoutSubscription(`${apiConfig.apiUrl}:${apiConfig.publishableKey}`, params, async (payload) => {
              await lifecycle.ensureVisitorSession();
              return apiConfig.httpClient.post<SubscriptionCheckoutResult>(
                `${base}/carts/subscriptions/checkout`, payload, options,
              );
            });
          },
        },
        async current(
          params: StorefrontCurrentCartParams = {},
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const pending = await pendingCartCheckout(checkoutScope);
          if (pending) {
            const cart = await apiConfig.httpClient.get<StorefrontDto<Cart>>(`${base}/carts/${encodeURIComponent(pending.id)}`, options);
            if ((params.company_id !== undefined && params.company_id !== cart.company_id) ||
              (params.company_location_id !== undefined && params.company_location_id !== cart.company_location_id))
              throw new Error("Recover the unresolved Cart Checkout before changing Company context");
            return cart;
          }
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/current`,
            {
              ...(params.company_id !== undefined ? { company_id: params.company_id } : {}),
              ...(params.company_location_id !== undefined ? { company_location_id: params.company_location_id } : {}),
            },
            options,
          ));
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
            `${base}/carts/${encodeURIComponent(params.id)}`,
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
          params: StorefrontUpdateCartParams,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { id, ...payload } = sanitizePublicCartUpdate(params);
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.put<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(id)}`,
            payload,
            options,
          ));
        },
        async addProduct(
          params: StorefrontAddCartProductParams,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { product } = params;
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}/product-items`,
            { product: sanitizePublicCartProducts([product])[0] },
            options,
          ));
        },
        async addBooking(
          params: StorefrontAddCartBookingParams,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { booking } = params;
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}/booking-items`,
            { booking: sanitizePublicCartBookings([booking])[0] },
            options,
          ));
        },
        async addDigital(
          params: StorefrontAddCartDigitalParams,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          const { digital } = params;
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}/digital-items`,
            {
              digital: sanitizePublicCartDigitalProducts([digital])[0],
            },
            options,
          ));
        },
        async addAudience(
          params: StorefrontParams<AddCartAudienceParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}/audience-items`,
            { audience: sanitizePublicCartAudiences([params.audience])[0] },
            options,
          ));
        },
        async removeItem(
          params: StorefrontParams<RemoveCartItemParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}/items/remove`,
            params,
            options,
          ));
        },
        async clear(
          params: StorefrontParams<ClearCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}/clear`,
            { id: params.id },
            options,
          ));
        },
        async quote(
          params: StorefrontParams<QuoteCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<OrderQuote>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<OrderQuote>>(
            `${base}/carts/${encodeURIComponent(params.id)}/quote`,
            { locale: params.locale ?? apiConfig.locale },
            options,
          );
        },
        async checkout(
          params: StorefrontParams<CheckoutCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<OrderCheckoutResult>> {
          return checkoutCart(checkoutScope, params, checkoutTransport, options);
        },
        async pendingCheckout(): Promise<CartCheckoutRequest | null> {
          return pendingCartCheckout(checkoutScope);
        },
        async recoverCheckout(options?: RequestOptions): Promise<StorefrontDto<OrderCheckoutResult> | null> {
          return recoverCartCheckout(checkoutScope, checkoutTransport, options);
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
          params: StorefrontParams<Omit<FindBookingOfferingsParams, "status">> & CatalogReadOptions,
          options?: RequestOptions,
        ): Promise<StorefrontBookingOffering[]> {
          return apiConfig.httpClient.get<StorefrontBookingOffering[]>(
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
        const { key, ...query } = params;
        return apiConfig.httpClient.get<StorefrontAudience>(
          `${base}/audiences/${encodeURIComponent(key)}`,
          { ...options, params: query },
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
