import { isOrderToken, orderTokenOptions, readOrderToken, replaceOrderToken, retainOrderToken } from "../utils/orderToken";
import type { StorefrontApiConfig, StorefrontFlowContext } from "../services/clientTypes";
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
  StorefrontGetCartOrderParams,
  StorefrontKeptCheckoutParams,
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
import type { LoadContentEntriesParams, LoadContentParams, LoadedContent, LoadedContentFor } from "../types/contentView";
import type { JoinFreeCustomerGroupParams, JoinFreeCustomerGroupResult } from "../types/customerGroupJoin";
import type {
  FormAnswerInput,
  KeptFormSubmission,
  PendingFormSubmissionParams,
  RecoverFormSubmissionParams,
  RetainFormSubmissionParams,
  StorefrontFormSubmission,
  SubmitFormParams,
  SubmitFormRequest,
} from "../types/forms";
import type { CartSelectionContext } from "../types/cartSelection";
import type {
  CatalogChoice,
  CatalogContext,
  CatalogListing,
  CatalogListingDetails,
  CatalogReadOptions,
  FindStorefrontCatalogItemPricesParams,
  FindStorefrontCatalogItemsParams,
  FindStorefrontCatalogsParams,
  GetStorefrontCatalogItemByParentParams,
  StorefrontCatalog,
} from "../types/catalog";
import type { EmailContact } from "../types/common";
import type {
  CompanyCustomerAccess,
  CompanyLocation,
  CompanyMembership,
  StorefrontFindCompanyLocationsParams,
  StorefrontFindCompanyMembershipsParams,
  StorefrontGetCompanyAccessParams,
  StorefrontGetCompanyLocationParams,
} from "../types/company";
import type {
  Category,
  Collection,
  Entry,
  Media,
  StorefrontFindCategoryChildrenParams,
  StorefrontFindEntriesParams,
  StorefrontFindMediaParams,
  StorefrontGetCategoryByKeyParams,
  StorefrontGetCategoryParams,
  StorefrontGetCollectionByKeyParams,
  StorefrontGetCollectionParams,
  StorefrontGetEntryParams,
} from "../types/content";
import type {
  ChangeCustomerEmailParams,
  StorefrontCustomer,
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
  StorefrontDownloadOrderAssetParams,
  StorefrontFindOrderPaymentsParams,
  StorefrontFindOrdersParams,
  StorefrontGetOrderParams,
  StorefrontOrderPaymentParams,
  StorefrontRescheduleOrderBookingItemParams,
  StorefrontResumeOrderPaymentParams,
  StorefrontRetainedOrderTokenParams,
} from "../types/order";
import type {
  CheckoutPaymentAction,
  Payment,
  PaymentMethod,
  PaymentMethodSetupStart,
  StorefrontCancelPaymentMethodSetupParams,
  StorefrontFindPaymentMethodsParams,
  StorefrontGetPaymentMethodParams,
  StorefrontRequestPaymentMethodSetupParams,
  StorefrontRevokePaymentMethodParams,
} from "../types/payment";
import type { GetStorefrontPromotionParams, StorefrontPromotion } from "../types/promotion";
import type {
  AvailabilityResponse,
  DigitalDownload,
  DownloadLibraryAssetParams,
  FindLibraryAssetsParams,
  FindLibraryParams,
  GetLibraryProductParams,
  GetStorefrontAvailabilityParams,
  GetStorefrontBookingOfferingParams,
  GetStorefrontBookingResourceParams,
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
  StorefrontGetOrderReturnOptionsParams,
  StorefrontGetReturnParams,
} from "../types/return";
import type {
  FindStorefrontLocationsParams,
  FindStorefrontMarketsParams,
  StorefrontCountry,
  StorefrontGetCountryParams,
  StorefrontGetLocationParams,
  StorefrontGetMarketByKeyParams,
  StorefrontGetMarketParams,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontSetup,
} from "../types/storefront";
import { cartScopeKey, createCartSelection } from "../services/cartSelection";
import {
  checkoutCart,
  checkoutCartWithNewIds,
  pendingCartCheckout,
  recoverCartCheckout,
  retainCartCheckout,
  withCartMutation,
} from "../services/cartCheckout";
import { loadContent, loadContentEntries, type ContentReads } from "../services/contentLoad";
import { runDurableCreate } from "../services/durableCreate";
import { pendingFormSubmission, recoverFormSubmission, retainFormSubmission } from "../services/keptFormSubmission";
import { joinFreeCustomerGroup, type FreeJoinDeps } from "../services/freeJoin";
import {
  cartOffersQuery,
  cartTokenOptions,
  storefrontCartBooking,
  storefrontCartCustomerGroup,
  storefrontCartProduct,
  storefrontCartUpdateBody,
} from "../utils/cartInputs";
import { ArkyError } from "../types/apiError";
import { buildFormAnswers } from "../utils/formAnswers";
import { requireId } from "../utils/ids";
import { createStorefrontCustomerGroupApi } from "./customerGroup";
import { createStorefrontFormsApi } from "./forms";
import { createStorefrontPaymentMethodApi } from "./paymentMethod";
import { segment } from "./paths";

export interface CustomerSessionInternal {
  customer: StorefrontCustomer;
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
  customer_id: string;
  session_id: string;
}

export interface RequestCustomerCodeRequest {
  id: string;
  contact: EmailContact;
  bot_check_token?: string;
}

export type RequestCustomerCodeParams = Omit<RequestCustomerCodeRequest, "id"> & { id?: string };

export interface VerifyCustomerCodeParams {
  code: string;
}

export type StorefrontCheckoutCartRequest = Omit<StorefrontCheckoutCartParams, "order_id" | "order_token"> & {
  order_id?: string;
  order_token?: string;
};

export interface OrderFromLinkParams {
  id: string;
  url: string;
}

export interface OrderFromLink {
  order: Order;
  url: string;
  order_token: string | null;
}

export interface RefreshCustomerSessionParams { session_id: string }

export const COMMON_CUSTOMER_ACTION_KEYS = [
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

const mediaIdsPerRead = 100;

function page<T>(items: T[]): PaginatedResponse<T> {
  return { items, cursor: null };
}

function submissionDraft(params: SubmitFormParams | RetainFormSubmissionParams): {
  form_id: string;
  questions_updated_at: SubmitFormRequest["questions_updated_at"];
  language: string;
  answers: FormAnswerInput[];
} {
  if ("form" in params) {
    return {
      form_id: params.form.id,
      questions_updated_at: params.form.questions_updated_at,
      language: params.language,
      answers: buildFormAnswers(params.form, params.values),
    };
  }
  return {
    form_id: params.form_id,
    questions_updated_at: params.questions_updated_at,
    language: params.language,
    answers: params.answers,
  };
}

function catalogContextQuery(params: CatalogContext) {
  return {
    catalog_id: params.catalog_id,
    company_id: params.company_id,
    company_location_id: params.company_location_id,
  };
}

function catalogQuery(params: CatalogReadOptions) {
  return { ...catalogContextQuery(params), include_price: params.include_price };
}

export const createStorefrontApi = (
  apiConfig: StorefrontApiConfig,
  updateCustomerSession: CustomerSessionUpdater,
  lifecycle: StorefrontLifecycle,
  cartSelectionContext: CartSelectionContext,
  flows: StorefrontFlowContext,
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
        cartTokenOptions(options, null),
      ),
    reorder: (params, options) =>
      httpClient.post<ReorderedCart>(
        `${base}/carts/reorder`,
        { id: params.id, order_id: params.order_id, buyer: params.buyer },
        cartTokenOptions(options, null),
      ),
  });
  const cartToken = (target: { id: string; token?: string | null }) => target.token ?? cartSelection.token(target.id);
  const cartMutation = <T>(target: { id: string; token?: string | null }, path: string, body: () => object, options?: RequestOptions) =>
    withCartMutation(checkoutScope, { type: "cart", cart_id: target.id }, () =>
      httpClient.post<T>(`${cartPath(target.id)}/${path}`, body(), cartTokenOptions(options, cartToken(target))),
    );
  const keptSlot = (scope: StorefrontCurrentCartParams | undefined) => {
    if (scope === undefined) return null;
    requireId(scope.catalog_id, "catalog");
    return cartScopeKey(scope);
  };
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
      return httpClient.get<Order>(`${base}/orders/${segment(id)}`, orderTokenOptions(options));
    },
  };
  const paymentMethods = createStorefrontPaymentMethodApi(httpClient);
  const forms = createStorefrontFormsApi(httpClient);
  const customerGroups = createStorefrontCustomerGroupApi(httpClient, lifecycle.ensureVisitorSession);
  const orderPath = (id: string) => `${base}/orders/${segment(id)}`;

  const contentReads: ContentReads = {
    getCollection: (params, options) => {
      const identifier = "id" in params ? params.id : params.key;
      return httpClient.get<Collection>(`${base}/collections/${segment(identifier)}`, options);
    },
    getEntry: (params, options) => httpClient.get<Entry>(`${base}/entries/${segment(params.id)}`, options),
    findEntries: (params, options) => httpClient.get<PaginatedResponse<Entry>>(`${base}/entries`, { ...options, params }),
    async findEntryBySlug(params, options) {
      const page = await httpClient.get<PaginatedResponse<Entry>>(`${base}/entries`, {
        ...options,
        params: { collection_id: params.collection_id, slug: params.slug },
      });
      return page.items[0] ?? null;
    },
    findMedia: (params, options) => httpClient.get<Media[]>(`${base}/media`, { ...options, params: { ids: params.ids } }),
  };

  const catalogItems = {
    find(params: FindStorefrontCatalogItemsParams, options?: RequestOptions): Promise<PaginatedResponse<CatalogListing>> {
      return httpClient.get<PaginatedResponse<CatalogListing>>(`${base}/catalog-items`, {
        ...options,
        params: { ...catalogQuery(params), selection: params.selection, limit: params.limit, cursor: params.cursor },
      });
    },

    getByParent(params: GetStorefrontCatalogItemByParentParams, options?: RequestOptions): Promise<CatalogListingDetails> {
      return httpClient.get<CatalogListingDetails>(`${base}/catalog-items/by-parent`, {
        ...options,
        params: { ...catalogContextQuery(params), item: params.item },
      });
    },

    findPrices(params: FindStorefrontCatalogItemPricesParams, options?: RequestOptions): Promise<PaginatedResponse<CatalogChoice>> {
      return httpClient.get<PaginatedResponse<CatalogChoice>>(`${base}/catalog-items/${segment(params.catalog_item_id)}/prices`, {
        ...options,
        params: { ...catalogQuery(params), limit: params.limit, cursor: params.cursor },
      });
    },
  };

  const freeJoin: FreeJoinDeps = {
    verifiedContact: flows.verifiedContact,
    pendingKey: flows.pendingKey,
    newId: flows.newId,
    newOrderToken: flows.newOrderToken,
    retainToken: (orderId, token) => retainOrderToken(checkoutScope, orderId, token),
    getGroup: (params, options) =>
      "id" in params ? customerGroups.customerGroup.get(params, options) : customerGroups.customerGroup.getByKey(params, options),
    findChoices: (params, options) => catalogItems.findPrices(params, options),
    async createCart(params, options) {
      requireId(params.id, "cart");
      const slot = cartScopeKey({ buyer: params.buyer, catalog_id: params.catalog_id });
      return withCartMutation(checkoutScope, { type: "new_cart", slot }, () =>
        httpClient.post<CreatedCart>(
          `${base}/carts`,
          { id: params.id, buyer: params.buyer, catalog_id: params.catalog_id },
          cartTokenOptions(options, null),
        ),
      );
    },
    addGroupLine: (params, options) =>
      cartMutation<Cart>(
        params,
        "customer-group-items",
        () => ({ expected_updated_at: params.expected_updated_at, customer_group: storefrontCartCustomerGroup(params.customer_group) }),
        options,
      ),
    quote: (params, options) => httpClient.post<CartQuote>(`${cartPath(params.id)}/quote`, {}, cartTokenOptions(options, cartToken(params))),
    accept: (request, options) => checkoutTransport.post(request, options),
    getOrder: (id, orderToken, options) => httpClient.get<Order>(orderPath(id), orderTokenOptions({ ...options, order_token: orderToken })),
  };

  async function submitForm(params: SubmitFormParams, options?: RequestOptions): Promise<StorefrontFormSubmission> {
    const draft = submissionDraft(params);
    const request = (id: string): SubmitFormRequest => ({
      ...draft,
      id,
      ...(params.bot_check_token !== undefined ? { bot_check_token: params.bot_check_token } : {}),
    });
    if (params.id !== undefined) {
      requireId(params.id, "form submission");
      await lifecycle.ensureVisitorSession();
      return forms.submit(request(params.id), options);
    }
    await lifecycle.ensureVisitorSession();
    return runDurableCreate({
      key: flows.pendingKey("form-submission", draft.form_id),
      label: "form submission",
      input: draft,
      newId: () => flows.newId("form submission"),
      send: (submissionId) => forms.submit(request(submissionId), options),
      confirms: (submission, submissionId) => submission.id === submissionId && submission.form_id === draft.form_id,
    });
  }

  const keptFormKey = (formId: string) => flows.pendingKey("kept-form-submission", formId);

  async function retainSubmission(params: RetainFormSubmissionParams): Promise<KeptFormSubmission> {
    if (params.id !== undefined) requireId(params.id, "form submission");
    const draft = submissionDraft(params);
    await lifecycle.ensureVisitorSession();
    return retainFormSubmission(
      keptFormKey(draft.form_id),
      { ...draft, ...(params.id !== undefined ? { id: params.id } : {}) },
      () => flows.newId("form submission"),
    );
  }

  async function pendingSubmission(params: PendingFormSubmissionParams): Promise<KeptFormSubmission | null> {
    await lifecycle.ensureVisitorSession();
    return pendingFormSubmission(keptFormKey(params.form_id));
  }

  async function recoverSubmission(
    params: RecoverFormSubmissionParams,
    options?: RequestOptions,
  ): Promise<StorefrontFormSubmission | null> {
    await lifecycle.ensureVisitorSession();
    return recoverFormSubmission(
      keptFormKey(params.form_id),
      (kept, sendOptions) =>
        forms.submit(
          { ...kept, ...(params.bot_check_token !== undefined ? { bot_check_token: params.bot_check_token } : {}) },
          sendOptions,
        ),
      options,
    );
  }

  async function orderFromLink(params: OrderFromLinkParams, options?: RequestOptions): Promise<OrderFromLink> {
    requireId(params.id, "order");
    if (typeof globalThis.localStorage === "undefined") {
      throw new TypeError("order.fromLink keeps the order token in localStorage; call it in the browser");
    }
    const link = new URL(params.url);
    const fragment = new URLSearchParams(link.hash.slice(1));
    const tokens = fragment.getAll("order_token");
    await lifecycle.ensureVisitorSession();
    if (tokens.length > 0) {
      const [token] = tokens;
      if (tokens.length !== 1 || !isOrderToken(token)) throw new ArkyError("invalid_link", "The order link carries an invalid order token");
      const order = await httpClient.get<Order>(orderPath(params.id), orderTokenOptions({ ...options, order_token: token }));
      if (order.id !== params.id) throw new ArkyError("answer_mismatch", "The order link opened another order");
      replaceOrderToken(checkoutScope, params.id, token);
      fragment.delete("order_token");
      const rest = fragment.toString();
      link.hash = rest ? `#${rest}` : "";
      return { order, url: link.toString(), order_token: token };
    }
    const retained = readOrderToken(checkoutScope, params.id);
    const order = await httpClient.get<Order>(
      orderPath(params.id),
      orderTokenOptions(retained ? { ...options, order_token: retained } : options),
    );
    if (order.id !== params.id) throw new ArkyError("answer_mismatch", "The order read answered another order");
    return { order, url: link.toString(), order_token: retained };
  }

  function persistIssuedSession<T extends CustomerSessionResult>(result: T): T {
    updateCustomerSession(() => ({ customer: result.customer, session: result.session }));
    return result;
  }

  function persistCustomerRead(result: CustomerMe): CustomerMe {
    if (result.session.customer_id !== result.customer.id ||
        result.session.store_id !== result.customer.store_id) {
      throw new ArkyError("answer_mismatch", "The customer answer does not match its customer session");
    }
    updateCustomerSession((previous) => {
      if (!previous || previous.session.id !== result.session.id ||
          previous.session.customer_id !== result.session.customer_id ||
          previous.customer.id !== result.customer.id ||
          previous.customer.store_id !== result.customer.store_id) {
        return previous;
      }
      return { ...previous, customer: result.customer };
    });
    return result;
  }

  return {
    customer: {
      async identify(params: IdentifyCustomerParams, options?: RequestOptions): Promise<CustomerSessionResult> {
        requireId(params.customer_id, "customer");
        requireId(params.session_id, "customer session");
        const result = await httpClient.post<CustomerSessionResult>(
          `${base}/customer/identify`,
          { customer_id: params.customer_id, session_id: params.session_id },
          options,
        );
        return persistIssuedSession(result);
      },

      async requestCode(params: RequestCustomerCodeRequest, options?: RequestOptions): Promise<CustomerCodeResult> {
        requireId(params.id, "sign-in email");
        const result = await httpClient.post<CustomerCodeResult>(
          `${base}/customer/request-code`,
          { id: params.id, contact: { email: params.contact.email, language: params.contact.language }, bot_check_token: params.bot_check_token },
          options,
        );
        updateCustomerSession((previous) => {
          if (
            !previous ||
            previous.session.id !== result.session.id ||
            previous.session.customer_id !== result.session.customer_id
          ) {
            throw new ArkyError("answer_mismatch", "The code answer does not match the active customer session");
          }
          return { ...previous, customer: result.customer };
        });
        return result;
      },

      async changeEmail(params: ChangeCustomerEmailParams, options?: RequestOptions): Promise<CustomerMe> {
        const result = await httpClient.post<CustomerMe>(
          `${base}/customer/me/change-email`,
          { code: params.code },
          options,
        );
        updateCustomerSession((previous) => {
          if (!previous || previous.session.id !== result.session.id ||
              previous.session.customer_id !== result.session.customer_id ||
              previous.customer.id !== result.customer.id ||
              previous.customer.store_id !== result.customer.store_id ||
              result.session.store_id !== result.customer.store_id) {
            throw new ArkyError("answer_mismatch", "The email-change answer does not match the active customer session");
          }
          return { ...previous, customer: result.customer };
        });
        return result;
      },

      async verify(params: VerifyCustomerCodeParams & { session_id: string }, options?: RequestOptions): Promise<CustomerSessionResult> {
        const signedInFrom = cartSelectionContext.customerId();
        const result = await httpClient.post<CustomerSessionResult>(
          `${base}/customer/verify`,
          { session_id: requireId(params.session_id, "customer session"), code: params.code },
          options,
        );
        persistIssuedSession(result);
        cartSelection.signedIn(signedInFrom, result.customer.id);
        return result;
      },

      async refresh(params: RefreshCustomerSessionParams, options?: RequestOptions): Promise<CustomerSessionResult> {
        const refreshToken = apiConfig.authStorage.getTokens()?.refresh_token;
        if (!refreshToken) throw new ArkyError("no_session", "An email-authenticated customer session is required");
        const result = await apiConfig.publishableKeyHttpClient.post<CustomerSessionResult>(
          `${base}/customer/refresh`,
          { session_id: requireId(params.session_id, "customer session"), refresh_token: refreshToken },
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

      async getMe(options?: RequestOptions): Promise<CustomerMe> {
        return persistCustomerRead(await httpClient.get<CustomerMe>(`${base}/customer/me`, options));
      },

      async updateMe(params: UpdateCustomerMeParams, options?: RequestOptions): Promise<CustomerMe> {
        return persistCustomerRead(await httpClient.patch<CustomerMe>(`${base}/customer/me`, params, options));
      },

      resubscribe(options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.post<CustomerMe>(`${base}/customer/me/resubscribe`, undefined, options);
      },

      unsubscribe(options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.post<CustomerMe>(`${base}/customer/me/unsubscribe`, undefined, options);
      },
    },

    store: {
      country: {
        find(options?: RequestOptions): Promise<PaginatedResponse<StorefrontCountry>> {
          return httpClient.get<PaginatedResponse<StorefrontCountry>>("/v1/platform/countries", options);
        },
        get(params: StorefrontGetCountryParams, options?: RequestOptions): Promise<StorefrontCountry> {
          return httpClient.get<StorefrontCountry>(`/v1/platform/countries/${segment(params.code)}`, options);
        },
      },
      location: {
        find(params: FindStorefrontLocationsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontLocation>> {
          return httpClient.get<PaginatedResponse<StorefrontLocation>>(`${base}/locations`, { ...options, params });
        },
        get(params: StorefrontGetLocationParams, options?: RequestOptions): Promise<StorefrontLocation> {
          return httpClient.get<StorefrontLocation>(`${base}/locations/${segment(params.id)}`, options);
        },
      },
      market: {
        find(params: FindStorefrontMarketsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontMarket>> {
          return httpClient.get<PaginatedResponse<StorefrontMarket>>(`${base}/markets`, { ...options, params });
        },
        get(params: StorefrontGetMarketParams, options?: RequestOptions): Promise<StorefrontMarket> {
          return httpClient.get<StorefrontMarket>(`${base}/markets/${segment(params.id)}`, options);
        },
        getByKey(params: StorefrontGetMarketByKeyParams, options?: RequestOptions): Promise<StorefrontMarket> {
          return httpClient.get<StorefrontMarket>(`${base}/markets/by-key/${segment(params.key)}`, options);
        },
      },
    },

    media: {
      async find(params: StorefrontFindMediaParams, options?: RequestOptions): Promise<PaginatedResponse<Media>> {
        const items: Media[] = [];
        for (let start = 0; start < params.ids.length; start += mediaIdsPerRead) {
          const ids = params.ids.slice(start, start + mediaIdsPerRead);
          items.push(...(await httpClient.get<Media[]>(`${base}/media`, { ...options, params: { ids } })));
        }
        return page(items);
      },
    },

    content: {
      collection: {
        get(params: StorefrontGetCollectionParams, options?: RequestOptions): Promise<Collection> {
          return httpClient.get<Collection>(`${base}/collections/${segment(params.id)}`, options);
        },
        getByKey(params: StorefrontGetCollectionByKeyParams, options?: RequestOptions): Promise<Collection> {
          return httpClient.get<Collection>(`${base}/collections/${segment(params.key)}`, options);
        },
      },
      entry: {
        find(params: StorefrontFindEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<Entry>> {
          return httpClient.get<PaginatedResponse<Entry>>(`${base}/entries`, { ...options, params });
        },
        get(params: StorefrontGetEntryParams, options?: RequestOptions): Promise<Entry> {
          return httpClient.get<Entry>(`${base}/entries/${segment(params.id)}`, options);
        },
      },
      async load<P extends LoadContentParams>(params: P, options?: RequestOptions): Promise<LoadedContentFor<P>> {
        const loaded = await loadContent(contentReads, params, flows.locale(options), options);
        return loaded as LoadedContentFor<P>;
      },
      loadEntries(params: LoadContentEntriesParams, options?: RequestOptions): Promise<LoadedContent<Entry>[]> {
        return loadContentEntries(contentReads, params, flows.locale(options), options);
      },
    },

    category: {
      get(params: StorefrontGetCategoryParams, options?: RequestOptions): Promise<Category> {
        const identifier = "id" in params ? params.id : params.slug;
        if (!identifier) throw new TypeError("A category read needs its id or its slug; a key is read with getByKey");
        return httpClient.get<Category>(`${base}/categories/${segment(identifier)}`, options);
      },
      getByKey(params: StorefrontGetCategoryByKeyParams, options?: RequestOptions): Promise<Category> {
        return httpClient.get<Category>(`${base}/categories/by-key/${segment(params.key)}`, options);
      },
      findChildren(params: StorefrontFindCategoryChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
        const { id, ...query } = params;
        return httpClient.get<PaginatedResponse<Category>>(`${base}/categories/${segment(id)}/children`, {
          ...options,
          params: query,
        });
      },
    },

    forms: {
      get: forms.get,
      getByKey: forms.getByKey,
      submit: submitForm,
      retainSubmission,
      pendingSubmission,
      recoverSubmission,
    },

    eshop: {
      catalog: {
        async find(params: FindStorefrontCatalogsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontCatalog>> {
          return page(await httpClient.get<StorefrontCatalog[]>(`${base}/catalogs`, { ...options, params }));
        },
      },

      catalogItem: catalogItems,

      product: {
        get(params: GetStorefrontProductParams, options?: RequestOptions): Promise<StorefrontProduct> {
          const identifier = "id" in params ? params.id : params.slug;
          if (!identifier) throw new TypeError("A product read needs its id or its slug; a key is read with getByKey");
          return httpClient.get<StorefrontProduct>(`${base}/products/${segment(identifier)}`, {
            ...options,
            params: catalogContextQuery(params),
          });
        },
        getByKey(params: GetStorefrontProductByKeyParams, options?: RequestOptions): Promise<StorefrontProduct> {
          return httpClient.get<StorefrontProduct>(`${base}/products/by-key/${segment(params.key)}`, {
            ...options,
            params: catalogContextQuery(params),
          });
        },
      },

      productVariant: {
        get(params: GetStorefrontProductVariantParams, options?: RequestOptions): Promise<StorefrontProductVariant> {
          return httpClient.get<StorefrontProductVariant>(
            `${base}/products/${segment(params.product_id)}/variants/${segment(params.id)}`,
            { ...options, params: catalogQuery(params) },
          );
        },
      },

      bookingService: {
        get(params: GetStorefrontBookingServiceParams, options?: RequestOptions): Promise<StorefrontBookingService> {
          const identifier = "id" in params ? params.id : params.slug;
          if (!identifier) throw new TypeError("A booking service read needs its id or its slug; a key is read with getByKey");
          return httpClient.get<StorefrontBookingService>(`${base}/booking-services/${segment(identifier)}`, {
            ...options,
            params: catalogContextQuery(params),
          });
        },
        getByKey(params: GetStorefrontBookingServiceByKeyParams, options?: RequestOptions): Promise<StorefrontBookingService> {
          return httpClient.get<StorefrontBookingService>(`${base}/booking-services/by-key/${segment(params.key)}`, {
            ...options,
            params: catalogContextQuery(params),
          });
        },
        getAvailability(params: GetStorefrontAvailabilityParams, options?: RequestOptions): Promise<AvailabilityResponse> {
          return httpClient.get<AvailabilityResponse>(`${base}/booking-services/availability`, {
            ...options,
            params: {
              ...catalogContextQuery(params),
              booking_service_id: params.booking_service_id,
              booking_resource_id: params.booking_resource_id,
              from: params.from,
              to: params.to,
              limit: params.limit,
              cursor: params.cursor,
            },
          });
        },
      },

      promotion: {
        get(params: GetStorefrontPromotionParams, options?: RequestOptions): Promise<StorefrontPromotion> {
          return httpClient.get<StorefrontPromotion>(`${base}/promotions/${segment(params.id)}`, options);
        },
      },

      bookingOffering: {
        get(params: GetStorefrontBookingOfferingParams, options?: RequestOptions): Promise<StorefrontBookingOffering> {
          return httpClient.get<StorefrontBookingOffering>(`${base}/booking-offerings/${segment(params.id)}`, {
            ...options,
            params: catalogQuery(params),
          });
        },
      },

      bookingResource: {
        get(params: GetStorefrontBookingResourceParams, options?: RequestOptions): Promise<StorefrontBookingResource> {
          return httpClient.get<StorefrontBookingResource>(`${base}/booking-resources/${segment(params.id)}`, {
            ...options,
            params: { ...catalogContextQuery(params), offering_id: params.offering_id },
          });
        },
      },

      cart: {
        async create(params: StorefrontCreateCartParams, options?: RequestOptions): Promise<CreatedCart> {
          await lifecycle.ensureVisitorSession();
          return cartSelection.create(params, options);
        },

        async getCurrent(params: StorefrontCurrentCartParams, options?: RequestOptions): Promise<Cart | null> {
          await lifecycle.ensureVisitorSession();
          return cartSelection.current(params, options);
        },

        forget(params: StorefrontCurrentCartParams): void {
          cartSelection.forget(params);
        },

        async get(params: StorefrontGetCartParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Cart>(cartPath(params.id), cartTokenOptions(options, cartToken(params)));
        },

        async getOrder(params: StorefrontGetCartOrderParams, options?: RequestOptions): Promise<Order | null> {
          requireId(params.id, "cart");
          if ("token" in params) throw new TypeError("A Cart-to-Order read uses current buyer authorization");
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Order | null>(`${cartPath(params.id)}/order`, cartTokenOptions(options, null));
        },

        async findOffers(params: FindStorefrontCartOffersParams, options?: RequestOptions): Promise<PaginatedResponse<Cart>> {
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
          return withCartMutation(checkoutScope, { type: "cart", cart_id: params.id }, () =>
            httpClient.put<Cart>(cartPath(params.id), storefrontCartUpdateBody(params), cartTokenOptions(options, cartToken(params))),
          );
        },

        async addProduct(params: StorefrontAddCartProductParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "product-items",
            () => ({ expected_updated_at: params.expected_updated_at, product: storefrontCartProduct(params.product) }),
            options,
          );
        },

        async addBooking(params: StorefrontAddCartBookingParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "booking-items",
            () => ({ expected_updated_at: params.expected_updated_at, booking: storefrontCartBooking(params.booking) }),
            options,
          );
        },

        async addCustomerGroup(params: StorefrontAddCartCustomerGroupParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "customer-group-items",
            () => ({
              expected_updated_at: params.expected_updated_at,
              customer_group: storefrontCartCustomerGroup(params.customer_group),
            }),
            options,
          );
        },

        async removeItem(params: StorefrontRemoveCartItemParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "items/remove",
            () => ({ expected_updated_at: params.expected_updated_at, line_item_id: params.line_item_id }),
            options,
          );
        },

        async clear(params: StorefrontClearCartParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(params, "clear", () => ({ expected_updated_at: params.expected_updated_at }), options);
        },

        async selectShippingMethod(params: StorefrontSelectCartShippingMethodParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<Cart>(
            params,
            "shipping-method",
            () => ({ expected_updated_at: params.expected_updated_at, shipping_method_id: params.shipping_method_id }),
            options,
          );
        },

        async setFutureDeliveries(params: StorefrontSetCartFutureDeliveriesParams, options?: RequestOptions): Promise<Cart> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(checkoutScope, { type: "cart", cart_id: params.id }, () =>
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
          return httpClient.post<CartQuote>(`${cartPath(params.id)}/quote`, params.contact_email !== undefined ? { contact_email: params.contact_email } : {}, cartTokenOptions(options, cartToken(params)));
        },

        async checkout(params: StorefrontCheckoutCartRequest, options?: RequestOptions): Promise<CheckoutAcceptance> {
          const { token: _token, scope, order_id, order_token, ...draft } = params;
          if (order_id !== undefined && order_token !== undefined) {
            return checkoutCart({ ...draft, order_id, order_token }, checkoutTransport, options);
          }
          if (order_id !== undefined || order_token !== undefined) {
            throw new TypeError("A checkout names both its order_id and order_token, or neither so the app's factories pick them");
          }
          return checkoutCartWithNewIds(checkoutScope, keptSlot(scope), draft, flows, checkoutTransport, options);
        },

        async retainCheckout(params: StorefrontCheckoutCartParams): Promise<CartCheckoutRequest> {
          const { token: _token, scope, ...request } = params;
          return retainCartCheckout(checkoutScope, keptSlot(scope), request);
        },

        pendingCheckout(params: StorefrontKeptCheckoutParams = {}): Promise<CartCheckoutRequest | null> {
          return pendingCartCheckout(checkoutScope, keptSlot(params.scope));
        },

        recoverCheckout(params: StorefrontKeptCheckoutParams = {}, options?: RequestOptions): Promise<CheckoutAcceptance | null> {
          return recoverCartCheckout(checkoutScope, keptSlot(params.scope), checkoutTransport, options);
        },
      },

      order: {
        async find(params: StorefrontFindOrdersParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<Order>>(`${base}/orders`, { ...options, params });
        },

        async get(params: StorefrontGetOrderParams, options?: RequestOptions): Promise<Order> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Order>(`${base}/orders/${segment(params.id)}`, orderTokenOptions(options));
        },

        fromLink: orderFromLink,

        retainedToken(params: StorefrontRetainedOrderTokenParams): string | null {
          requireId(params.order_id, "order");
          return typeof globalThis.localStorage === "undefined" ? null : readOrderToken(checkoutScope, params.order_id);
        },

        async findFulfillments(
          params: FindCustomerOrderFulfillmentsParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<CustomerOrderFulfillment>> {
          await lifecycle.ensureVisitorSession();
          return page(
            await httpClient.get<CustomerOrderFulfillment[]>(
              `${base}/orders/${segment(params.order_id)}/fulfillments`,
              orderTokenOptions(options),
            ),
          );
        },

        async findPayments(params: StorefrontFindOrderPaymentsParams, options?: RequestOptions): Promise<PaginatedResponse<Payment>> {
          await lifecycle.ensureVisitorSession();
          return page(await httpClient.get<Payment[]>(`${base}/orders/${segment(params.order_id)}/payments`, orderTokenOptions(options)));
        },

        async getPayment(params: StorefrontOrderPaymentParams, options?: RequestOptions): Promise<Payment> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Payment>(
            `${base}/orders/${segment(params.order_id)}/payments/${segment(params.payment_id)}`,
            orderTokenOptions(options),
          );
        },

        async resumePayment(params: StorefrontResumeOrderPaymentParams, options?: RequestOptions): Promise<CheckoutPaymentAction> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<CheckoutPaymentAction>(
            `${base}/orders/${segment(params.order_id)}/payment-action`,
            undefined,
            orderTokenOptions(options),
          );
        },

        async downloadAsset(params: StorefrontDownloadOrderAssetParams, options?: RequestOptions): Promise<DigitalDownload> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<DigitalDownload>(
            `${base}/orders/${segment(params.order_id)}/digital-lines/${segment(params.line_item_id)}/assets/${segment(params.asset_id)}/download`,
            orderTokenOptions(options),
          );
        },

        async cancelBookingItem(params: StorefrontCancelOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
          requireId(params.credit_id, "credit");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<Order>(
            `${base}/orders/${segment(params.order_id)}/booking-items/${segment(params.line_item_id)}/cancel`,
            { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at },
            orderTokenOptions(options),
          );
        },

        async rescheduleBookingItem(params: StorefrontRescheduleOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<Order>(
            `${base}/orders/${segment(params.order_id)}/booking-items/${segment(params.line_item_id)}/reschedule`,
            { expected_updated_at: params.expected_updated_at, starts_at: params.starts_at },
            orderTokenOptions(options),
          );
        },

        async cancelProductItem(params: StorefrontCancelOrderProductItemParams, options?: RequestOptions): Promise<Order> {
          requireId(params.credit_id, "credit");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<Order>(
            `${base}/orders/${segment(params.order_id)}/product-items/${segment(params.line_item_id)}/cancel`,
            { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at, units: params.units },
            orderTokenOptions(options),
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
        async find(params: StorefrontFindPaymentMethodsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<PaymentMethod>> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.find(params, options);
        },
        async get(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.get(params, options);
        },
        async requestSetup(params: StorefrontRequestPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.requestSetup(params, options);
        },
        async startSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethodSetupStart> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.startSetup(params, options);
        },
        async completeSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.completeSetup(params, options);
        },
        async cancelSetup(params: StorefrontCancelPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.cancelSetup(params, options);
        },
        async revoke(params: StorefrontRevokePaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.revoke(params, options);
        },
      },

      customerGroup: {
        ...customerGroups.customerGroup,
        joinFree(params: JoinFreeCustomerGroupParams, options?: RequestOptions): Promise<JoinFreeCustomerGroupResult> {
          return joinFreeCustomerGroup(freeJoin, params, options);
        },
      },
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
          return httpClient.get<CustomerRental>(`${base}/rentals/${segment(params.id)}`, options);
        },
      },

      return: {
        async create(params: StorefrontCreateReturnParams, options?: RequestOptions): Promise<Return> {
          requireId(params.id, "return");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<Return>(`${base}/returns`, params, params.type.type === "order" ? orderTokenOptions(options) : options);
        },

        async get(params: StorefrontGetReturnParams, options?: RequestOptions): Promise<Return> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<Return>(`${base}/returns/${segment(params.id)}`, orderTokenOptions(options));
        },

        async find(params: StorefrontFindReturnsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Return>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<Return>>(`${base}/returns`, { ...(params.order_id ? orderTokenOptions(options) : options), params });
        },

        async getOrderOptions(params: StorefrontGetOrderReturnOptionsParams, options?: RequestOptions): Promise<OrderReturnOptions> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<OrderReturnOptions>(`${base}/returns/orders/${segment(params.order_id)}/options`, orderTokenOptions(options));
        },

        async findRentalOptions(
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
      async getAccess(params: StorefrontGetCompanyAccessParams, options?: RequestOptions): Promise<CompanyCustomerAccess> {
        await lifecycle.ensureVisitorSession();
        return httpClient.get<CompanyCustomerAccess>(`${base}/companies/${segment(params.id)}/access`, options);
      },

      membership: {
        async find(
          params: StorefrontFindCompanyMembershipsParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<CompanyMembership>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<CompanyMembership>>(`${base}/company-memberships`, { ...options, params });
        },
      },

      location: {
        async find(
          params: StorefrontFindCompanyLocationsParams = {},
          options?: RequestOptions,
        ): Promise<PaginatedResponse<CompanyLocation>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<CompanyLocation>>(`${base}/company-locations`, { ...options, params });
        },

        async get(params: StorefrontGetCompanyLocationParams, options?: RequestOptions): Promise<CompanyLocation> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<CompanyLocation>(`${base}/company-locations/${segment(params.id)}`, options);
        },
      },
    },

    actions: {
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
