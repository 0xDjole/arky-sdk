import type { StorefrontApiConfig } from "../services/clientTypes";
import type {
  AddCartBookingParams,
  AddCartDigitalProductParams,
  AddCartProductParams,
  AvailabilityResponse,
  CheckoutCartParams,
  ClearCartParams,
  ConfirmAudienceParams,
  AudienceAccessParams,
  FindBookingOfferingsParams,
  FindStorefrontAudienceMembersParams,
  FindStorefrontAudienceTiersParams,
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
  GetProductParams,
  GetProductsParams,
  GetBookingResourceParams,
  FindBookingResourcesParams,
  GetBookingServiceParams,
  FindBookingServicesParams,
  GetStorefrontAudienceParams,
  GetStorefrontAudiencePaymentParams,
  GetClassificationChildrenParams,
  GetStorefrontClassificationParams,
  QuoteCartParams,
  DownloadDigitalAssetParams,
  GetDigitalLibraryProductParams,
  FindStorefrontDigitalProductsParams,
  GetStorefrontDigitalProductParams,
  RemoveCartItemParams,
  RequestOptions,
  SubmitFormParams,
  SubscribeAudienceParams,
  UpdateCartParams,
  VerificationChallengeResponse,
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
  Contact,
  AudienceAccessResponse,
  AudienceSubscribeResponse,
  ContactSessionIssued,
  Form,
  FormSubmission,
  Market,
  Media,
  Order,
  OrderCheckoutResult,
  OrderQuote,
  OrderProduct,
  OrderDigitalProduct,
  PaginatedResponse,
  Product,
  ProductInventory,
  BookingResource,
  BookingService,
  BookingOffering,
  StorefrontAudience,
  StorefrontAudienceMember,
  StorefrontAudienceTier,
  Classification,
} from "../types";
import type {
  StorefrontContact,
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
  StorefrontContact,
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

export interface ContactSessionInternal {
  sessionToken: string;
  contact: StorefrontContact;
}

export type ContactSessionUpdater = (
  updater: (
    previous: ContactSessionInternal | null,
  ) => ContactSessionInternal | null,
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
    await apiConfig.httpClient.post<void>("/v1/storefront/actions/track", {
      key: params.key,
      payload: params.payload,
    });
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
        async getProducts(
          params: StorefrontParams<GetOrderParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<OrderProduct[]>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<OrderProduct[]>>(
            `${base}/orders/${params.id}/products`,
            options,
          );
        },
        async getDigitalProducts(
          params: StorefrontParams<GetOrderParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<OrderDigitalProduct[]>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<StorefrontDto<OrderDigitalProduct[]>>(
            `${base}/orders/${params.id}/digital-products`,
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
      audience: {
        get(
          params: StorefrontParams<GetStorefrontAudienceParams>,
          options?: RequestOptions,
        ): Promise<StorefrontAudience> {
          return apiConfig.httpClient.get<StorefrontAudience>(
            `${base}/audiences/${params.key}`,
            options,
          );
        },
        tiers: {
          find(
            params: StorefrontParams<FindStorefrontAudienceTiersParams>,
            options?: RequestOptions,
          ): Promise<PaginatedResponse<StorefrontAudienceTier>> {
            const { audience_id, ...queryParams } = params;
            return apiConfig.httpClient.get<
              PaginatedResponse<StorefrontAudienceTier>
            >(`${base}/audiences/${audience_id}/tiers`, {
              ...options,
              params: queryParams,
            });
          },
        },
        members: {
          async find(
            params: StorefrontParams<FindStorefrontAudienceMembersParams> = {},
            options?: RequestOptions,
          ): Promise<
            StorefrontDto<PaginatedResponse<StorefrontAudienceMember>>
          > {
            await lifecycle.ensureVisitorSession();
            return apiConfig.httpClient.get<
              StorefrontDto<PaginatedResponse<StorefrontAudienceMember>>
            >(`${base}/audiences/members`, {
              ...options,
              params,
            });
          },
        },
        async subscribe(
          params: StorefrontParams<SubscribeAudienceParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<AudienceSubscribeResponse>> {
          await lifecycle.ensureVisitorSession();
          const { audience_id, ...payload } = params;
          return apiConfig.httpClient.post<
            StorefrontDto<AudienceSubscribeResponse>
          >(`${base}/audiences/${audience_id}/subscribe`, payload, options);
        },
        async confirm(
          params: ConfirmAudienceParams,
          options?: RequestOptions,
        ): Promise<{ success: boolean }> {
          return apiConfig.httpClient.post<{ success: boolean }>(
            "/v1/customer/audiences/confirm",
            params,
            options,
          );
        },
        payments: {
          async get(
            params: StorefrontParams<GetStorefrontAudiencePaymentParams>,
            options?: RequestOptions,
          ): Promise<StorefrontDto<AudienceSubscribeResponse>> {
            await lifecycle.ensureVisitorSession();
            return apiConfig.httpClient.get<
              StorefrontDto<AudienceSubscribeResponse>
            >(
              `${base}/audiences/${params.audience_id}/payments/${params.payment_id}`,
              options,
            );
          },
        },
        async checkAccess(
          params: StorefrontParams<AudienceAccessParams>,
          options?: RequestOptions,
        ): Promise<StorefrontDto<AudienceAccessResponse>> {
          await lifecycle.ensureVisitorSession();
          return apiConfig.httpClient.get<
            StorefrontDto<AudienceAccessResponse>
          >(`${base}/audiences/${params.audience_id}/access`, options);
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
