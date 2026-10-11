import type { StorefrontApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Cart,
  CartAccessProductPreview,
  CartQuote,
  CheckoutAcceptance,
  CreatedCart,
  CustomerGroupDeliveryOffers,
  FindStorefrontCartOffersParams,
  ReorderedCart,
  StorefrontAddCartBookingParams,
  StorefrontAddCartCustomerGroupParams,
  StorefrontAddCartProductParams,
  StorefrontCheckoutCartParams,
  StorefrontClearCartParams,
  StorefrontCreateCartParams,
  StorefrontCurrentCartParams,
  StorefrontGetCartParams,
  StorefrontPreviewCartAccessProductParams,
  StorefrontQuoteCartFutureDeliveriesParams,
  StorefrontQuoteCartParams,
  StorefrontRemoveCartItemParams,
  StorefrontReorderParams,
  StorefrontSelectCartShippingMethodParams,
  StorefrontSetCartFutureDeliveriesParams,
  StorefrontUpdateCartParams,
} from "../types/cart";
import type { CartCheckoutRequest, CartCheckoutTransport } from "../types/cartCheckout";
import type { CartSelectionContext } from "../types/cartSelection";
import type { CatalogReadOptions, FindStorefrontCatalogsParams, StorefrontCatalog } from "../types/catalog";
import type {
  CompanyCustomerAccess,
  CompanyLocation,
  CompanyMembership,
  StorefrontFindCompanyLocationsParams,
  StorefrontFindCompanyMembershipsParams,
} from "../types/company";
import type {
  Category,
  Collection,
  Entry,
  FindCategoryChildrenParams,
  FindEntriesByIdsParams,
  GetEntryParams,
  Media,
  StorefrontFindEntriesParams,
  StorefrontFindEntryBySlugParams,
  StorefrontGetCategoryByKeyParams,
  StorefrontGetCategoryParams,
  StorefrontGetCollectionParams,
} from "../types/content";
import type {
  ChangeCustomerEmailParams,
  Customer,
  CustomerCodeResult,
  CustomerMe,
  CustomerSessionIssued,
  CustomerSessionResult,
  UpdateCustomerMeParams,
} from "../types/customer";
import type { TrackCustomerActionParams } from "../types/customerAction";
import type { ExperimentUseResponse, UseExperimentParams } from "../types/experiment";
import type {
  CustomerOrderFulfillment,
  FindCustomerOrderFulfillmentsParams,
  MinimumProgress,
  StorefrontGetMinimumProgressParams,
} from "../types/fulfillment";
import type {
  Order,
  StorefrontCancelOrderBookingItemParams,
  StorefrontCancelOrderProductItemParams,
  StorefrontFindOrderPaymentsParams,
  StorefrontFindOrdersParams,
  StorefrontGetOrderParams,
  StorefrontOrderPaymentParams,
} from "../types/order";
import type { CheckoutPaymentAction, Payment } from "../types/payment";
import type {
  AvailabilityResponse,
  DigitalDownload,
  DownloadLibraryAssetParams,
  FindLibraryAssetsParams,
  FindLibraryParams,
  FindStorefrontBookingOfferingsParams,
  FindStorefrontBookingResourcesParams,
  FindStorefrontBookingServicesParams,
  FindStorefrontProductsParams,
  FindStorefrontProductVariantsParams,
  GetLibraryProductParams,
  GetStorefrontAvailabilityParams,
  GetStorefrontBookingServiceByKeyParams,
  GetStorefrontBookingServiceParams,
  GetStorefrontProductByKeyParams,
  GetStorefrontProductParams,
  GetStorefrontProductVariantParams,
  LibraryAsset,
  LibraryItem,
  LibraryProduct,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontProduct,
  StorefrontProductVariant,
} from "../types/product";
import type { CustomerRental, FindCustomerRentalsParams, GetCustomerRentalParams } from "../types/rental";
import type {
  FindRentalReturnOptionsParams,
  OrderReturnOptions,
  RentalReturnUnitOption,
  Return,
  StorefrontCreateReturnParams,
  StorefrontFindReturnsParams,
  StorefrontGetReturnParams,
} from "../types/return";
import type {
  FindStorefrontLocationsParams,
  FindStorefrontMarketsParams,
  StorefrontCountries,
  StorefrontCountry,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontParams,
  StorefrontSetup,
} from "../types/storefront";
import { createCartSelection } from "../services/cartSelection";
import {
  checkoutCart,
  pendingCartCheckout,
  recoverCartCheckout,
  retainCartCheckout,
  withCartMutation,
} from "../services/cartCheckout";
import {
  cartOffersQuery,
  cartTokenOptions,
  storefrontCartBooking,
  storefrontCartCustomerGroup,
  storefrontCartProduct,
  storefrontCartUpdateBody,
} from "../utils/cartInputs";
import { requireId } from "../utils/ids";
import { createStorefrontCustomerGroupApi } from "./customerGroup";
import { createStorefrontFormsApi } from "./forms";
import { createStorefrontPaymentMethodApi } from "./paymentMethod";
import { segment } from "./paths";

export interface CustomerSessionInternal {
  customer: Customer;
  session: CustomerSessionIssued;
}

export type CustomerSessionUpdater = (
  updater: (previous: CustomerSessionInternal | null) => CustomerSessionInternal | null,
) => void;

export interface StorefrontLifecycle {
  ensureVisitorSession(): Promise<void>;
  getSetup(options?: RequestOptions): Promise<StorefrontSetup>;
}

export interface IdentifyCustomerParams {
  email?: string;
}

export interface RequestCustomerCodeParams {
  id: string;
  email: string;
  language: string;
}

export interface VerifyCustomerCodeParams {
  code: string;
}

export const COMMON_CUSTOMER_ACTION_KEYS = [
  "page.view",
  "product.view",
  "booking_service.view",
  "booking_resource.view",
  "checkout.started",
  "signin",
  "signup",
  "verified.email",
  "search",
  "share",
  "wishlist.added",
] as const;

export type CommonCustomerActionKey = (typeof COMMON_CUSTOMER_ACTION_KEYS)[number];

const base = "/v1/storefront";

function catalogQuery(params: CatalogReadOptions) {
  return {
    catalog_id: params.catalog_id,
    company_id: params.company_id,
    company_location_id: params.company_location_id,
    include_price: params.include_price,
  };
}

export const createStorefrontApi = (
  apiConfig: StorefrontApiConfig,
  updateCustomerSession: CustomerSessionUpdater,
  lifecycle: StorefrontLifecycle,
  cartSelectionContext: CartSelectionContext,
) => {
  const { httpClient } = apiConfig;
  const checkoutScope = `storefront:${apiConfig.apiUrl}:${apiConfig.publishableKey}`;
  const cartPath = (id: string) => `${base}/carts/${segment(id)}`;
  const cartSelection = createCartSelection(cartSelectionContext, checkoutScope, {
    get: (params, options) => httpClient.get<Cart>(cartPath(params.id), cartTokenOptions(options, params.token)),
    create: (params, options) =>
      httpClient.post<CreatedCart>(
        `${base}/carts`,
        { id: params.id, buyer: params.buyer, catalog_id: params.catalog_id },
        options,
      ),
    reorder: (params, options) =>
      httpClient.post<ReorderedCart>(
        `${base}/carts/reorder`,
        { id: params.id, order_id: params.order_id, buyer: params.buyer },
        options,
      ),
  });
  const cartToken = (target: { id: string; token?: string | null }) => target.token ?? cartSelection.token(target.id);
  const cartMutation = <T>(target: { id: string; token?: string | null }, path: string, body: object, options?: RequestOptions) =>
    withCartMutation(checkoutScope, () =>
      httpClient.post<T>(`${cartPath(target.id)}/${path}`, body, cartTokenOptions(options, cartToken(target))),
    );
  const checkoutTransport: CartCheckoutTransport<CartCheckoutRequest> = {
    async post(request, options) {
      await lifecycle.ensureVisitorSession();
      return httpClient.post<CheckoutAcceptance>(
        `${base}/carts/accept`,
        request,
        cartTokenOptions(options, cartSelection.token(request.cart_id)),
      );
    },
    async getOrder(id, options) {
      await lifecycle.ensureVisitorSession();
      return httpClient.get<Order>(`${base}/orders/${segment(id)}`, options);
    },
  };
  const paymentMethods = createStorefrontPaymentMethodApi(httpClient);
  const forms = createStorefrontFormsApi(httpClient);
  const customerGroups = createStorefrontCustomerGroupApi(httpClient, lifecycle.ensureVisitorSession);

  function persistIssuedSession<T extends CustomerSessionResult>(result: T): T {
    updateCustomerSession(() => ({ customer: result.customer, session: result.session }));
    return result;
  }

  return {
    customer: {
      async identify(params: IdentifyCustomerParams = {}, options?: RequestOptions): Promise<CustomerSessionResult> {
        const result = await httpClient.post<CustomerSessionResult>(
          `${base}/customer/identify`,
          params.email !== undefined ? { email: params.email } : {},
          options,
        );
        return persistIssuedSession(result);
      },

      async requestCode(params: RequestCustomerCodeParams, options?: RequestOptions): Promise<CustomerCodeResult> {
        requireId(params.id, "sign-in email");
        const result = await httpClient.post<CustomerCodeResult>(
          `${base}/customer/request-code`,
          { id: params.id, email: params.email, language: params.language },
          options,
        );
        updateCustomerSession((previous) => {
          if (
            !previous ||
            previous.session.id !== result.session.id ||
            previous.session.customer_id !== result.session.customer_id
          ) {
            throw new Error("The code answer does not match the active customer session");
          }
          return { ...previous, customer: result.customer };
        });
        return result;
      },

      changeEmail(params: ChangeCustomerEmailParams, options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.post<CustomerMe>(
          `${base}/customer/me/change-email`,
          { code: params.code, language: params.language },
          options,
        );
      },

      async verify(params: VerifyCustomerCodeParams, options?: RequestOptions): Promise<CustomerSessionResult> {
        const signedInFrom = cartSelectionContext.customerId();
        const result = await httpClient.post<CustomerSessionResult>(
          `${base}/customer/verify`,
          { code: params.code },
          options,
        );
        persistIssuedSession(result);
        cartSelection.signedIn(signedInFrom, result.customer.id);
        return result;
      },

      async refresh(options?: RequestOptions): Promise<CustomerSessionResult> {
        const refreshToken = apiConfig.authStorage.getTokens()?.refresh_token;
        if (!refreshToken) throw new Error("An email-authenticated customer session is required");
        const result = await apiConfig.publishableKeyHttpClient.post<CustomerSessionResult>(
          `${base}/customer/refresh`,
          { refresh_token: refreshToken },
          options,
        );
        return persistIssuedSession(result);
      },

      async logout(options?: RequestOptions): Promise<void> {
        try {
          await httpClient.post<void>(`${base}/customer/logout`, undefined, options);
        } finally {
          updateCustomerSession(() => null);
        }
      },

      getMe(options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.get<CustomerMe>(`${base}/customer/me`, options);
      },

      updateMe(params: UpdateCustomerMeParams, options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.patch<CustomerMe>(`${base}/customer/me`, params, options);
      },

      resubscribe(options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.post<CustomerMe>(`${base}/customer/me/resubscribe`, undefined, options);
      },
    },

    store: {
      getSetup: lifecycle.getSetup,
      location: {
        getCountries(options?: RequestOptions): Promise<StorefrontCountries> {
          return httpClient.get<StorefrontCountries>("/v1/platform/countries", options);
        },
        getCountry(countryCode: string, options?: RequestOptions): Promise<StorefrontCountry> {
          return httpClient.get<StorefrontCountry>(`/v1/platform/countries/${segment(countryCode)}`, options);
        },
        list(params: FindStorefrontLocationsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontLocation>> {
          return httpClient.get<PaginatedResponse<StorefrontLocation>>(`${base}/locations`, { ...options, params });
        },
        get(id: string, options?: RequestOptions): Promise<StorefrontLocation> {
          return httpClient.get<StorefrontLocation>(`${base}/locations/${segment(id)}`, options);
        },
      },
      market: {
        getByKey(key: string, options?: RequestOptions): Promise<StorefrontMarket> {
          return httpClient.get<StorefrontMarket>(`${base}/markets/by-key/${segment(key)}`, options);
        },
        list(params: FindStorefrontMarketsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontMarket>> {
          return httpClient.get<PaginatedResponse<StorefrontMarket>>(`${base}/markets`, { ...options, params });
        },
        get(id: string, options?: RequestOptions): Promise<StorefrontMarket> {
          return httpClient.get<StorefrontMarket>(`${base}/markets/${segment(id)}`, options);
        },
      },
    },

    media: {
      findByIds(params: { ids: string[] }, options?: RequestOptions): Promise<Media[]> {
        return httpClient.get<Media[]>(`${base}/media`, { ...options, params: { ids: params.ids } });
      },
    },

    content: {
      collection: {
        get(params: StorefrontGetCollectionParams, options?: RequestOptions): Promise<Collection> {
          const identifier = "id" in params ? params.id : params.key;
          return httpClient.get<Collection>(`${base}/collections/${segment(identifier)}`, options);
        },
      },
      entry: {
        find(params: StorefrontFindEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<Entry>> {
          return httpClient.get<PaginatedResponse<Entry>>(`${base}/entries`, { ...options, params });
        },
        findByIds(params: StorefrontParams<FindEntriesByIdsParams>, options?: RequestOptions): Promise<PaginatedResponse<Entry>> {
          return httpClient.get<PaginatedResponse<Entry>>(`${base}/entries`, { ...options, params: { ids: params.ids } });
        },
        async findBySlug(params: StorefrontFindEntryBySlugParams, options?: RequestOptions): Promise<Entry | null> {
          const page = await httpClient.get<PaginatedResponse<Entry>>(`${base}/entries`, {
            ...options,
            params: { collection_id: params.collection_id, slug: params.slug },
          });
          return page.items[0] ?? null;
        },
        get(params: StorefrontParams<GetEntryParams>, options?: RequestOptions): Promise<Entry> {
          return httpClient.get<Entry>(`${base}/entries/${segment(params.id)}`, options);
        },
      },
    },

    category: {
      get(params: StorefrontGetCategoryParams, options?: RequestOptions): Promise<Category> {
        const identifier = "id" in params ? params.id : params.slug;
        if (!identifier) throw new Error("A category read needs its id or its slug; a key is read with getByKey");
        return httpClient.get<Category>(`${base}/categories/${segment(identifier)}`, options);
      },
      getByKey(params: StorefrontGetCategoryByKeyParams, options?: RequestOptions): Promise<Category> {
        return httpClient.get<Category>(`${base}/categories/by-key/${segment(params.key)}`, options);
      },
      getChildren(params: StorefrontParams<FindCategoryChildrenParams>, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
        const { id, ...query } = params;
        return httpClient.get<PaginatedResponse<Category>>(`${base}/categories/${segment(id)}/children`, {
          ...options,
          params: query,
        });
      },
    },

    forms: {
      get: forms.get,
      async submit(params: Parameters<typeof forms.submit>[0], options?: RequestOptions) {
        await lifecycle.ensureVisitorSession();
        return forms.submit(params, options);
      },
    },

    eshop: {
      catalog: {
        find(params: FindStorefrontCatalogsParams = {}, options?: RequestOptions): Promise<StorefrontCatalog[]> {
          return httpClient.get<StorefrontCatalog[]>(`${base}/catalogs`, { ...options, params });
        },
      },

      product: {
        get(params: GetStorefrontProductParams, options?: RequestOptions): Promise<StorefrontProduct> {
          const identifier = params.id ?? params.slug;
          if (!identifier) throw new Error("A product read needs its id or its slug");
          return httpClient.get<StorefrontProduct>(`${base}/products/${segment(identifier)}`, {
            ...options,
            params: catalogQuery(params),
          });
        },
        getByKey(params: GetStorefrontProductByKeyParams, options?: RequestOptions): Promise<StorefrontProduct> {
          return httpClient.get<StorefrontProduct>(`${base}/products/by-key/${segment(params.key)}`, {
            ...options,
            params: catalogQuery(params),
          });
        },
        find(params: FindStorefrontProductsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontProduct>> {
          return httpClient.get<PaginatedResponse<StorefrontProduct>>(`${base}/products`, { ...options, params });
        },
      },

      productVariant: {
        get(params: GetStorefrontProductVariantParams, options?: RequestOptions): Promise<StorefrontProductVariant> {
          const { product_id, id, ...query } = params;
          return httpClient.get<StorefrontProductVariant>(
            `${base}/products/${segment(product_id)}/variants/${segment(id)}`,
            { ...options, params: query },
          );
        },
        find(
          params: FindStorefrontProductVariantsParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontProductVariant>> {
          const { product_id, ...query } = params;
          return httpClient.get<PaginatedResponse<StorefrontProductVariant>>(
            `${base}/products/${segment(product_id)}/variants`,
            { ...options, params: query },
          );
        },
      },

      bookingService: {
        get(params: GetStorefrontBookingServiceParams, options?: RequestOptions): Promise<StorefrontBookingService> {
          const identifier = params.id ?? params.slug;
          if (!identifier) throw new Error("A booking service read needs its id or its slug");
          return httpClient.get<StorefrontBookingService>(`${base}/booking-services/${segment(identifier)}`, {
            ...options,
            params: catalogQuery(params),
          });
        },
        getByKey(params: GetStorefrontBookingServiceByKeyParams, options?: RequestOptions): Promise<StorefrontBookingService> {
          return httpClient.get<StorefrontBookingService>(`${base}/booking-services/by-key/${segment(params.key)}`, {
            ...options,
            params: catalogQuery(params),
          });
        },
        find(
          params: FindStorefrontBookingServicesParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontBookingService>> {
          return httpClient.get<PaginatedResponse<StorefrontBookingService>>(`${base}/booking-services`, {
            ...options,
            params,
          });
        },
        getAvailability(params: GetStorefrontAvailabilityParams, options?: RequestOptions): Promise<AvailabilityResponse> {
          return httpClient.get<AvailabilityResponse>(`${base}/booking-services/availability`, { ...options, params });
        },
      },

      bookingOffering: {
        find(
          params: FindStorefrontBookingOfferingsParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontBookingOffering>> {
          return httpClient.get<PaginatedResponse<StorefrontBookingOffering>>(`${base}/booking-offerings`, {
            ...options,
            params,
          });
        },
      },

      bookingResource: {
        get(id: string, options?: RequestOptions): Promise<StorefrontBookingResource> {
          return httpClient.get<StorefrontBookingResource>(`${base}/booking-resources/${segment(id)}`, options);
        },
        find(
          params: FindStorefrontBookingResourcesParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<StorefrontBookingResource>> {
          return httpClient.get<PaginatedResponse<StorefrontBookingResource>>(`${base}/booking-resources`, {
            ...options,
            params,
          });
        },
      },

      cart: {
        async create(params: StorefrontCreateCartParams, options?: RequestOptions): Promise<CreatedCart> {
          await lifecycle.ensureVisitorSession();
          return cartSelection.create(params, options);
        },

        async current(params: StorefrontCurrentCartParams = {}, options?: RequestOptions): Promise<Cart | null> {
          await lifecycle.ensureVisitorSession();
          return cartSelection.current(params, options);
        },

        forget(params: StorefrontCurrentCartParams = {}): void {
          cartSelection.forget(params);
        },

        async get(params: StorefrontGetCartParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Cart>(cartPath(params.id), cartTokenOptions(options, cartToken(params)));
        },

        async offers(params: FindStorefrontCartOffersParams, options?: RequestOptions): Promise<PaginatedResponse<Cart>> {
          const query = cartOffersQuery(params);
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<Cart>>(`${base}/carts/offers`, { ...cartTokenOptions(options, null), params: query });
        },

        async reorder(params: StorefrontReorderParams, options?: RequestOptions): Promise<ReorderedCart> {
          requireId(params.id, "cart");
          await lifecycle.ensureVisitorSession();
          return cartSelection.reorder(params, options);
        },

        async update(params: StorefrontUpdateCartParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(checkoutScope, () =>
            httpClient.put<Cart>(cartPath(params.id), storefrontCartUpdateBody(params), cartTokenOptions(options, cartToken(params))),
          );
        },

        async addProduct(params: StorefrontAddCartProductParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "product-items",
            { expected_updated_at: params.expected_updated_at, product: storefrontCartProduct(params.product) },
            options,
          );
        },

        async addBooking(params: StorefrontAddCartBookingParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "booking-items",
            { expected_updated_at: params.expected_updated_at, booking: storefrontCartBooking(params.booking) },
            options,
          );
        },

        async addCustomerGroup(params: StorefrontAddCartCustomerGroupParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "customer-group-items",
            {
              expected_updated_at: params.expected_updated_at,
              customer_group: storefrontCartCustomerGroup(params.customer_group),
            },
            options,
          );
        },

        async removeItem(params: StorefrontRemoveCartItemParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "items/remove",
            { expected_updated_at: params.expected_updated_at, line_item_id: params.line_item_id },
            options,
          );
        },

        async clear(params: StorefrontClearCartParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(params, "clear", { expected_updated_at: params.expected_updated_at }, options);
        },

        async selectShippingMethod(params: StorefrontSelectCartShippingMethodParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "shipping-method",
            { expected_updated_at: params.expected_updated_at, shipping_method_id: params.shipping_method_id },
            options,
          );
        },

        async setFutureDeliveries(params: StorefrontSetCartFutureDeliveriesParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(checkoutScope, () =>
            httpClient.put<Cart>(
              `${cartPath(params.id)}/future-deliveries`,
              { expected_updated_at: params.expected_updated_at, customer_groups: params.customer_groups },
              cartTokenOptions(options, cartToken(params)),
            ),
          );
        },

        async quoteFutureDeliveries(
          params: StorefrontQuoteCartFutureDeliveriesParams,
          options?: RequestOptions,
        ): Promise<CustomerGroupDeliveryOffers[]> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<CustomerGroupDeliveryOffers[]>(
            `${cartPath(params.id)}/future-delivery-quote`,
            { customer_groups: params.customer_groups },
            cartTokenOptions(options, cartToken(params)),
          );
        },

        async previewAccessProduct(
          params: StorefrontPreviewCartAccessProductParams,
          options?: RequestOptions,
        ): Promise<CartAccessProductPreview> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<CartAccessProductPreview>(
            `${cartPath(params.id)}/access-product-preview`,
            {
              line_item_id: params.line_item_id,
              variant_id: params.variant_id,
              quantity: params.quantity,
              purchase: params.purchase,
            },
            cartTokenOptions(options, cartToken(params)),
          );
        },

        async quote(params: StorefrontQuoteCartParams, options?: RequestOptions): Promise<CartQuote> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<CartQuote>(`${cartPath(params.id)}/quote`, {}, cartTokenOptions(options, cartToken(params)));
        },

        async checkout(params: StorefrontCheckoutCartParams, options?: RequestOptions): Promise<CheckoutAcceptance> {
          const { token: _token, ...request } = params;
          return checkoutCart(request, checkoutTransport, options);
        },

        async retainCheckout(params: StorefrontCheckoutCartParams): Promise<CartCheckoutRequest> {
          const { token: _token, ...request } = params;
          return retainCartCheckout(checkoutScope, request);
        },

        pendingCheckout(): Promise<CartCheckoutRequest | null> {
          return pendingCartCheckout(checkoutScope);
        },

        recoverCheckout(options?: RequestOptions): Promise<CheckoutAcceptance | null> {
          return recoverCartCheckout(checkoutScope, checkoutTransport, options);
        },
      },

      order: {
        async find(params: StorefrontFindOrdersParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<Order>>(`${base}/orders`, { ...options, params });
        },

        async get(params: StorefrontGetOrderParams, options?: RequestOptions): Promise<Order> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Order>(`${base}/orders/${segment(params.id)}`, options);
        },

        async fulfillments(
          params: FindCustomerOrderFulfillmentsParams,
          options?: RequestOptions,
        ): Promise<CustomerOrderFulfillment[]> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<CustomerOrderFulfillment[]>(`${base}/orders/${segment(params.order_id)}/fulfillments`, options);
        },

        async findPayments(params: StorefrontFindOrderPaymentsParams, options?: RequestOptions): Promise<Payment[]> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Payment[]>(`${base}/orders/${segment(params.order_id)}/payments`, options);
        },

        async getPayment(params: StorefrontOrderPaymentParams, options?: RequestOptions): Promise<Payment> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Payment>(
            `${base}/orders/${segment(params.order_id)}/payments/${segment(params.payment_id)}`,
            options,
          );
        },

        async paymentAction(params: { order_id: string }, options?: RequestOptions): Promise<CheckoutPaymentAction> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<CheckoutPaymentAction>(
            `${base}/orders/${segment(params.order_id)}/payment-action`,
            undefined,
            options,
          );
        },

        async cancelBookingItem(params: StorefrontCancelOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
          requireId(params.credit_id, "credit");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<Order>(
            `${base}/orders/${segment(params.order_id)}/booking-items/${segment(params.line_item_id)}/cancel`,
            { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at },
            options,
          );
        },

        async cancelProductItem(params: StorefrontCancelOrderProductItemParams, options?: RequestOptions): Promise<Order> {
          requireId(params.credit_id, "credit");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<Order>(
            `${base}/orders/${segment(params.order_id)}/product-items/${segment(params.line_item_id)}/cancel`,
            { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at, units: params.units },
            options,
          );
        },
      },

      library: {
        async find(params: FindLibraryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<LibraryItem>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<LibraryItem>>(`${base}/digital-products/library`, { ...options, params });
        },

        async getProduct(params: GetLibraryProductParams, options?: RequestOptions): Promise<LibraryProduct> {
          await lifecycle.ensureVisitorSession();
          const { product_id, ...query } = params;
          return httpClient.get<LibraryProduct>(`${base}/digital-products/library/${segment(product_id)}`, {
            ...options,
            params: query,
          });
        },

        async findAssets(params: FindLibraryAssetsParams, options?: RequestOptions): Promise<PaginatedResponse<LibraryAsset>> {
          await lifecycle.ensureVisitorSession();
          const { product_id, ...query } = params;
          return httpClient.get<PaginatedResponse<LibraryAsset>>(`${base}/digital-products/library/${segment(product_id)}/assets`, {
            ...options,
            params: query,
          });
        },

        async download(params: DownloadLibraryAssetParams, options?: RequestOptions): Promise<DigitalDownload> {
          await lifecycle.ensureVisitorSession();
          const { product_id, asset_id, ...query } = params;
          return httpClient.get<DigitalDownload>(
            `${base}/digital-products/${segment(product_id)}/assets/${segment(asset_id)}/download`,
            { ...options, params: query },
          );
        },
      },

      paymentMethod: {
        async find(...args: Parameters<typeof paymentMethods.find>) {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.find(...args);
        },
        async get(...args: Parameters<typeof paymentMethods.get>) {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.get(...args);
        },
        async requestSetup(...args: Parameters<typeof paymentMethods.requestSetup>) {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.requestSetup(...args);
        },
        async startSetup(...args: Parameters<typeof paymentMethods.startSetup>) {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.startSetup(...args);
        },
        async completeSetup(...args: Parameters<typeof paymentMethods.completeSetup>) {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.completeSetup(...args);
        },
        async cancelSetup(...args: Parameters<typeof paymentMethods.cancelSetup>) {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.cancelSetup(...args);
        },
        async revoke(...args: Parameters<typeof paymentMethods.revoke>) {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.revoke(...args);
        },
        consentText: paymentMethods.consentText,
        currentConsentText: paymentMethods.currentConsentText,
      },

      customerGroup: customerGroups.customerGroup,
      customerGroupOffering: customerGroups.customerGroupOffering,
      customerGroupMember: customerGroups.customerGroupMember,

      minimumProgress: {
        async get(params: StorefrontGetMinimumProgressParams, options?: RequestOptions): Promise<MinimumProgress> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<MinimumProgress>(`${base}/minimum-progress`, { ...options, params });
        },
      },

      rental: {
        async find(params: FindCustomerRentalsParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerRental>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<CustomerRental>>(`${base}/rentals`, { ...options, params });
        },

        async get(params: GetCustomerRentalParams, options?: RequestOptions): Promise<CustomerRental> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<CustomerRental>(`${base}/rentals/${segment(params.rental_id)}`, options);
        },
      },

      return: {
        async create(params: StorefrontCreateReturnParams, options?: RequestOptions): Promise<Return> {
          requireId(params.id, "return");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<Return>(`${base}/returns`, params, options);
        },

        async get(params: StorefrontGetReturnParams, options?: RequestOptions): Promise<Return> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Return>(`${base}/returns/${segment(params.return_id)}`, options);
        },

        async find(params: StorefrontFindReturnsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Return>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<Return>>(`${base}/returns`, { ...options, params });
        },

        async orderOptions(params: { order_id: string }, options?: RequestOptions): Promise<OrderReturnOptions> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<OrderReturnOptions>(`${base}/returns/orders/${segment(params.order_id)}/options`, options);
        },

        async rentalOptions(
          params: FindRentalReturnOptionsParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<RentalReturnUnitOption>> {
          await lifecycle.ensureVisitorSession();
          const { rental_id, ...query } = params;
          return httpClient.get<PaginatedResponse<RentalReturnUnitOption>>(
            `${base}/returns/rentals/${segment(rental_id)}/options`,
            { ...options, params: query },
          );
        },
      },
    },

    companies: {
      async memberships(
        params: StorefrontFindCompanyMembershipsParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<CompanyMembership>> {
        await lifecycle.ensureVisitorSession();
        return httpClient.get<PaginatedResponse<CompanyMembership>>(`${base}/company-memberships`, { ...options, params });
      },

      async access(params: { id: string }, options?: RequestOptions): Promise<CompanyCustomerAccess> {
        await lifecycle.ensureVisitorSession();
        return httpClient.get<CompanyCustomerAccess>(`${base}/companies/${segment(params.id)}/access`, options);
      },

      async locations(
        params: StorefrontFindCompanyLocationsParams = {},
        options?: RequestOptions,
      ): Promise<PaginatedResponse<CompanyLocation>> {
        await lifecycle.ensureVisitorSession();
        return httpClient.get<PaginatedResponse<CompanyLocation>>(`${base}/company-locations`, { ...options, params });
      },

      async location(params: { id: string }, options?: RequestOptions): Promise<CompanyLocation> {
        await lifecycle.ensureVisitorSession();
        return httpClient.get<CompanyLocation>(`${base}/company-locations/${segment(params.id)}`, options);
      },
    },

    actions: {
      COMMON_CUSTOMER_ACTION_KEYS,
      async track(params: TrackCustomerActionParams, options?: RequestOptions): Promise<void> {
        await lifecycle.ensureVisitorSession();
        await httpClient.post<void>(
          `${base}/actions/track`,
          params.data !== undefined ? { key: params.key, data: params.data } : { key: params.key },
          options,
        );
      },
    },

    experiments: {
      async use(params: UseExperimentParams, options?: RequestOptions): Promise<ExperimentUseResponse> {
        await lifecycle.ensureVisitorSession();
        return httpClient.post<ExperimentUseResponse>(`${base}/experiments/${segment(params.key)}/use`, undefined, options);
      },
    },
  };
};
