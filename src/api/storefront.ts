import type { EpochMilliseconds } from "../types/time";
import { createCartSelection } from "../services/cartSelection";
import type { CartSelectionContext } from "../types/cartSelection";
import { checkoutCart, pendingCartCheckout, recoverCartCheckout, withCartMutation } from "../services/cartCheckout";
import type { CartCheckoutTransport, CartCheckoutRequest } from "../types/cartCheckout";
import type { StorefrontApiConfig } from "../services/clientTypes";
import type { StorefrontCustomerGroup, GetStorefrontCustomerGroupParams } from "../types/customerGroup";
import type { StorefrontCustomerGroupPlan, FindStorefrontCustomerGroupPlansParams, GetStorefrontCustomerGroupPlanParams } from "../types/customerGroupPlan";
import type {
  AddCartCustomerGroupPlanParams,
  AvailabilityResponse,
  CheckoutCartParams,
  ClearCartParams,
  FindBookingOfferingsParams,
  FindStorefrontMarketsParams,
  FindStorefrontLocationsParams,
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
  GetOrderPaymentParams,
  FindOrderPaymentsParams,
  CancelBookingItemParams,
  GetProductParams,
  GetProductsParams,
  GetBookingResourceParams,
  FindBookingResourcesParams,
  GetBookingServiceParams,
  FindStorefrontBookingServicesParams,
  GetClassificationChildrenParams,
  GetStorefrontClassificationParams,
  QuoteCartParams,
  DownloadDigitalAssetParams,
  GetDigitalLibraryProductParams,
  FindStorefrontDigitalProductsParams,
  FindDigitalLibraryParams,
  GetStorefrontDigitalProductParams,
  RemoveCartItemParams,
  RequestOptions,
  SubmitFormParams,
} from "../types/api";
import type {
  Cart,
  CreatedCart,
  DigitalDownload,
  DigitalLibraryItem,
  DigitalLibraryProduct,
  DigitalLibraryAsset,
  StorefrontDigitalProduct,
  Collection,
  CollectionEntry,
  CustomerSessionIssued,
  CustomerEmailVerification,
  CustomerSessionRecord,
  FormPresentation,
  FormSubmission,
  Market,
  Media,
  Order,
  OrderCheckoutResult,
  CheckoutQuote,
  PaginatedResponse,
  Payment,
  Product,
  BookingResource,
  BookingService,
  BookingOffering,
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
  StorefrontProductVariant,
  GetStorefrontProductVariantParams,
  FindStorefrontProductVariantsParams,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontDto,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontParams,
} from "../types/storefront";
import type { CatalogReadOptions } from "../types/catalog";
import type { Checkout, GetCheckoutParams } from "../types/checkout";
export type {
  StorefrontCheckoutQuote,
  StorefrontCustomer,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontDto,
  StorefrontLocation,
  StorefrontMarket,
} from "../types/storefront";
import {
  publicCartReadOptions,
  sanitizePublicCartBookings,
  sanitizePublicCartCustomerGroupPlans,
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
  key: string;
  blocks: import("../types").Block[];
  type: "cash_on_delivery" | "manual" | "stripe" | "monri";
}

export interface StorefrontSetup {
  commerce:
    | { type: "uninitialized" }
    | { type: "initializing"; operation_id: string }
    | { type: "ready"; default_market_id: string; default_sales_channel_id: string };
  timezone: string;
  languages: {
    default: string | null;
    available: string[];
  };
  default_market: StorefrontMarket | null;
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
  status: { type: "active" };
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
  cartSelectionContext: CartSelectionContext,
) => {
  const base = "/v1/storefront";
  const checkoutScope = `storefront:${apiConfig.apiUrl}:${apiConfig.publishableKey}`;
  const cartSelection = createCartSelection(cartSelectionContext, checkoutScope, {
    get: (id, options) => apiConfig.httpClient.get<StorefrontDto<Cart>>(`${base}/carts/${encodeURIComponent(id)}`, publicCartReadOptions(options)),
    create: (params, options) => apiConfig.httpClient.post<StorefrontDto<CreatedCart>>(
      `${base}/carts`,
      { ...(params.company !== undefined ? { company: params.company === null ? null : {
        company_id: params.company.company_id,
        company_location_id: params.company.company_location_id,
      } } : {}) },
      publicCartReadOptions(options),
    ),
  });
  const checkoutTransport: CartCheckoutTransport<StorefrontDto<OrderCheckoutResult>> = {
    async post({ id, request_id, locale: _locale, ...request }, options) {
      await lifecycle.ensureVisitorSession();
      return apiConfig.httpClient.post<StorefrontDto<OrderCheckoutResult>>(
        `${base}/checkouts`,
        { ...request, request_id },
        options,
      );
    },
    async getCheckout(id, options) {
      await lifecycle.ensureVisitorSession();
      return apiConfig.httpClient.get<StorefrontDto<Checkout>>(`${base}/checkouts/${encodeURIComponent(id)}`, options);
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
        list(params: FindStorefrontLocationsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontLocation>> {
          return apiConfig.httpClient.get<PaginatedResponse<StorefrontLocation>>(
            `${base}/locations`,
            { ...options, params },
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
        getByKey(key: string, options?: RequestOptions): Promise<StorefrontMarket> {
          return apiConfig.httpClient.get<StorefrontMarket>(
            `${base}/markets/by-key/${encodeURIComponent(key)}`, options,
          );
        },
        list(params: FindStorefrontMarketsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontMarket>> {
          return apiConfig.httpClient.get<PaginatedResponse<StorefrontMarket>>(
            `${base}/markets`,
            { ...options, params },
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
        ): Promise<StorefrontDto<{ items: CollectionEntry[]; cursor: string | null }>> {
          return apiConfig.httpClient.get<
            StorefrontDto<{ items: CollectionEntry[]; cursor: string | null }>
          >(`${base}/entries`, { ...options, params });
        },
      },
    },
    forms: {
      get(
        params: StorefrontParams<GetFormParams>,
        options?: RequestOptions,
      ): Promise<StorefrontDto<FormPresentation>> {
        const identifier = params.id ?? params.key;
        if (!identifier) throw new Error("GetFormParams requires id or key");
        return apiConfig.httpClient.get<StorefrontDto<FormPresentation>>(
          `${base}/forms/${encodeURIComponent(identifier)}`,
          options,
        );
      },
      async submit(
        params: StorefrontParams<SubmitFormParams>,
        options?: RequestOptions,
      ): Promise<StorefrontDto<FormSubmission>> {
        const { form_id, locale, ...payload } = params;
        if (!form_id) throw new Error("SubmitFormParams requires form_id");
        if (!locale || locale !== apiConfig.locale) {
          throw new Error("Form presentation locale differs from the current storefront context; load and review the Form again");
        }
        await lifecycle.ensureVisitorSession();
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
      ): Promise<StorefrontDto<{ items: Classification[]; cursor: string | null }>> {
        const { id, ...query } = params;
        return apiConfig.httpClient.get<StorefrontDto<{ items: Classification[]; cursor: string | null }>>(
          `${base}/classifications/${id}/children`,
          { ...options, params: query },
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
            params: { company_id: params.company_id, company_location_id: params.company_location_id, include_price: params.include_price },
          });
        },
        async library(
          params: FindDigitalLibraryParams = {},
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
            `${base}/digital-products/library/${encodeURIComponent(params.digital_product_id)}`,
            { ...options, params: { company_id: params.company_id, company_location_id: params.company_location_id, limit: params.limit, cursor: params.cursor } },
          );
        },
        async getLibraryAssets(
          params: StorefrontParams<GetDigitalLibraryProductParams>,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<DigitalLibraryAsset>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<PaginatedResponse<DigitalLibraryAsset>>(
            `${base}/digital-products/library/${encodeURIComponent(params.digital_product_id)}/assets`,
            { ...options, params: { company_id: params.company_id, company_location_id: params.company_location_id, limit: params.limit, cursor: params.cursor } },
          );
        },
        async download(
          params: DownloadDigitalAssetParams,
          options?: RequestOptions,
        ): Promise<DigitalDownload> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<DigitalDownload>(
            `${base}/digital-products/${encodeURIComponent(params.digital_product_id)}/assets/${encodeURIComponent(params.asset_id)}/download`,
            { ...options, params: { reference: params.reference, company_id: params.company_id, company_location_id: params.company_location_id } },
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
            { ...options, params: { company_id: params.company_id, company_location_id: params.company_location_id, include_price: params.include_price } },
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
      productVariant: {
        get(params: GetStorefrontProductVariantParams, options?: RequestOptions): Promise<StorefrontProductVariant> {
          const { product_id, id, ...query } = params;
          return apiConfig.httpClient.get<StorefrontProductVariant>(
            `${base}/products/${encodeURIComponent(product_id)}/variants/${encodeURIComponent(id)}`,
            { ...options, params: query },
          );
        },
        find(params: FindStorefrontProductVariantsParams, options?: RequestOptions): Promise<PaginatedResponse<StorefrontProductVariant>> {
          const { product_id, ...query } = params;
          return apiConfig.httpClient.get<PaginatedResponse<StorefrontProductVariant>>(
            `${base}/products/${encodeURIComponent(product_id)}/variants`,
            { ...options, params: query },
          );
        },
      },
      checkout: {
        async get(params: Pick<GetCheckoutParams, "id">, options?: RequestOptions): Promise<StorefrontDto<Checkout>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<Checkout>>(`${base}/checkouts/${encodeURIComponent(params.id)}`, options);
        },
        async resumePayment(params: Pick<GetCheckoutParams, "id">, options?: RequestOptions): Promise<StorefrontDto<OrderCheckoutResult>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<OrderCheckoutResult>>(
            `${base}/checkouts/${encodeURIComponent(params.id)}/payment-action`, {}, options,
          );
        },
      },
      cart: {
        async create(
          params: StorefrontCurrentCartParams = {},
          options?: RequestOptions,
        ): Promise<StorefrontDto<CreatedCart>> {
          await lifecycle.ensureVisitorSession();
          return cartSelection.create(params, options);
        },
        async current(
          params: StorefrontCurrentCartParams = {},
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return cartSelection.current(params, options);
        },
        async get(
          params: StorefrontParams<GetCartParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}`,
            publicCartReadOptions(options, params.token),
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
        async addCustomerGroupPlan(
          params: StorefrontParams<AddCartCustomerGroupPlanParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Cart>> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(checkoutScope, () => apiConfig.httpClient.post<StorefrontDto<Cart>>(
            `${base}/carts/${encodeURIComponent(params.id)}/customer-group-plan-items`,
            {
              customer_group_plan: sanitizePublicCartCustomerGroupPlans([
                params.customer_group_plan,
              ])[0],
            },
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
        ): Promise<StorefrontDto<CheckoutQuote>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<CheckoutQuote>>(
            `${base}/carts/${encodeURIComponent(params.id)}/quote`,
            {},
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
          params: StorefrontParams<GetOrderPaymentParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Payment>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<Payment>>(
            `${base}/orders/${encodeURIComponent(params.order_id)}/payments/${encodeURIComponent(params.payment_id)}`,
            options,
          );
        },
        async findPayments(
          params: StorefrontParams<FindOrderPaymentsParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<PaginatedResponse<Payment>>> {
          await lifecycle.ensureVisitorSession();
          const { order_id, ...query } = params;
          return apiConfig.httpClient.get<StorefrontDto<PaginatedResponse<Payment>>>(
            `${base}/orders/${encodeURIComponent(order_id)}/payments`,
            { ...options, params: query },
          );
        },
        async find(
          params: StorefrontParams<GetOrdersParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<{ items: Order[]; cursor: string | null }>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<
            StorefrontDto<{ items: Order[]; cursor: string | null }>
          >(`${base}/orders`, { ...options, params });
        },
        async cancelBookingItem(
          params: StorefrontParams<CancelBookingItemParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<Order>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.post<StorefrontDto<Order>>(
            `${base}/orders/${encodeURIComponent(params.order_id)}/booking-items/${encodeURIComponent(params.order_booking_item_id)}/cancel`,
            { command_id: params.command_id },
            options,
          );
        },
      },
      bookingService: {
        get(
          params: StorefrontParams<GetBookingServiceParams> & CatalogReadOptions,
          options?: RequestOptions,
        ): Promise<StorefrontBookingService> {
          const identifier = params.id ?? params.slug;
          if (!identifier)
            throw new Error("GetBookingServiceParams requires id or slug");
          return apiConfig.httpClient.get<StorefrontBookingService>(
            `${base}/booking-services/${identifier}`,
            { ...options, params: { company_id: params.company_id, company_location_id: params.company_location_id, include_price: params.include_price } },
          );
        },
        find(
          params: FindStorefrontBookingServicesParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontBookingService>> {
          return apiConfig.httpClient.get<
            PaginatedResponse<StorefrontBookingService>
          >(`${base}/booking-services`, { ...options, params });
        },
        getAvailability(
          params: StorefrontParams<GetAvailabilityParams> & Pick<CatalogReadOptions, "company_id" | "company_location_id">,
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
        ): Promise<PaginatedResponse<StorefrontBookingOffering>> {
          return apiConfig.httpClient.get<PaginatedResponse<StorefrontBookingOffering>>(
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
    customer_groups: {
      get(
        params: GetStorefrontCustomerGroupParams,
        options?: RequestOptions,
      ): Promise<StorefrontCustomerGroup> {
        const { identifier, ...query } = params;
        return apiConfig.httpClient.get<StorefrontCustomerGroup>(
          `${base}/customer-groups/${encodeURIComponent(identifier)}`,
          { ...options, params: query },
        );
      },
    },
    customer_group_plans: {
      find(
        params: FindStorefrontCustomerGroupPlansParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<StorefrontCustomerGroupPlan>> {
        return apiConfig.httpClient.get<
          PaginatedResponse<StorefrontCustomerGroupPlan>
        >(`${base}/customer-group-plans`, { ...options, params });
      },
      get(
        params: GetStorefrontCustomerGroupPlanParams,
        options?: RequestOptions,
      ): Promise<StorefrontCustomerGroupPlan> {
        const { identifier, ...query } = params;
        return apiConfig.httpClient.get<StorefrontCustomerGroupPlan>(
          `${base}/customer-group-plans/${encodeURIComponent(identifier)}`,
          { ...options, params: query },
        );
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
