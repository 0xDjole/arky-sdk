import { isOrderToken, orderTokenOptions, readOrderToken, replaceOrderToken, retainOrderToken } from "../utils/orderToken";
import type { StorefrontApiConfig, StorefrontFlowContext } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  StorefrontCart,
  StorefrontCartQuote,
  StorefrontCheckoutAcceptance,
  StorefrontCreatedCart,
  FindStorefrontCartOffersParams,
  PackageDeliveryOffers,
  StorefrontReorderedCart,
  StorefrontAddCartBookingParams,
  StorefrontAddCartPackageParams,
  StorefrontAddCartProductParams,
  StorefrontCheckoutCartParams,
  StorefrontClearCartParams,
  StorefrontCreateCartParams,
  StorefrontCurrentCartParams,
  StorefrontGetCartParams,
  StorefrontGetCartOrderParams,
  StorefrontKeptCheckoutParams,
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
import type { JoinFreePackageParams, JoinFreePackageResult } from "../types/packageJoin";
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
  FindStorefrontPackageItemPricesParams,
  FindStorefrontPackageItemsParams,
  FindStorefrontPackagesParams,
  GetStorefrontPackageItemByParentParams,
  PackageContext,
  PackageReadOptions,
  StorefrontPackageChoice,
  StorefrontPackageItem,
  StorefrontPackageItemDetails,
  StorefrontPackageItemPrice,
} from "../types/package";
import type { EmailContact } from "../types/common";
import type {
  Category,
  PublicCollection,
  PublicEntry,
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
  StorefrontOrder,
  StorefrontCancelOrderBookingItemParams,
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
  StorefrontPayment,
  StorefrontPaymentMethod,
  StorefrontPaymentMethodSetupStart,
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
  StorefrontReturn,
  StorefrontReturnDetail,
  StorefrontCreateReturnParams,
  StorefrontFindReturnsParams,
  StorefrontGetOrderReturnOptionsParams,
  StorefrontGetReturnParams,
} from "../types/return";
import type {
  FindStorefrontLocationsParams,
  FindStorefrontMarketsParams,
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
  checkoutCartWithAppIds,
  pendingCartCheckout,
  recoverCartCheckout,
  retainCartCheckout,
  withCartMutation,
} from "../services/cartCheckout";
import { loadContent, loadContentEntries, type ContentReads } from "../services/contentLoad";
import { runDurableCreate } from "../services/durableCreate";
import { pendingFormSubmission, recoverFormSubmission, retainFormSubmission } from "../services/keptFormSubmission";
import { joinFreePackage, type FreeJoinDeps } from "../services/freeJoin";
import {
  cartOffersQuery,
  cartTokenOptions,
  storefrontCartBooking,
  storefrontCartPackage,
  storefrontCartProduct,
  storefrontCartUpdateBody,
} from "../utils/cartInputs";
import { ArkyError } from "../types/apiError";
import { buildFormAnswers } from "../utils/formAnswers";
import { requireId } from "../utils/ids";
import { createStorefrontCompanyApi } from "./company";
import { createStorefrontFormsApi } from "./forms";
import { createStorefrontPackageApi } from "./packageMember";
import { createStorefrontPaymentMethodApi } from "./paymentMethod";
import { createSharedEntriesApi } from "./privateContent";
import { segment, storefrontBase } from "./paths";
import { createCountryApi } from "./location";

export type CustomerSessionUpdater = (
  updater: (previous: CustomerSessionResult | null) => CustomerSessionResult | null,
) => void;

export interface StorefrontLifecycle {
  ensureVisitorSession(): Promise<void>;
  hasSession(): boolean;
  getSetup(options?: RequestOptions): Promise<StorefrontSetup>;
}

export interface IdentifyCustomerParams {
  customer_id: string;
  session_id: string;
}

export interface RequestCustomerCodeRequest {
  id: string;
  contact: EmailContact;
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
  order: StorefrontOrder;
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

function packageContextQuery(params: PackageContext) {
  return {
    package_id: params.package_id,
    company_id: params.company_id,
    company_location_id: params.company_location_id,
  };
}

function packageQuery(params: PackageReadOptions) {
  return { ...packageContextQuery(params), include_price: params.include_price };
}

export const createStorefrontApi = (
  apiConfig: StorefrontApiConfig,
  updateCustomerSession: CustomerSessionUpdater,
  lifecycle: StorefrontLifecycle,
  cartSelectionContext: CartSelectionContext,
  flows: StorefrontFlowContext,
) => {
  const { httpClient } = apiConfig;
  const checkoutScope = `storefront:${apiConfig.apiUrl}:${apiConfig.storeId}:${apiConfig.salesChannelId}`;
  const cartPath = (id: string) => `${storefrontBase}/carts/${segment(id)}`;
  const keptCheckoutScopes = (): readonly string[] => {
    const customerId = cartSelectionContext.customerId();
    if (!customerId) throw new ArkyError("no_session", "A cart change or a kept checkout needs the customer session first");
    const signedInFrom = cartSelection.signedInFrom(customerId);
    const own = `${checkoutScope}:${customerId}`;
    return signedInFrom === null ? [own] : [own, `${checkoutScope}:${signedInFrom}`];
  };
  const cartSelection = createCartSelection(cartSelectionContext, keptCheckoutScopes, {
    get: (params, options) => httpClient.get<StorefrontCart>(cartPath(params.id), cartTokenOptions(options, params.token)),
    create: (params, options) =>
      httpClient.post<StorefrontCreatedCart>(
        `${storefrontBase}/carts`,
        { id: params.id, buyer: params.buyer, package_id: params.package_id, market_id: params.market_id },
        cartTokenOptions(options, null),
      ),
    reorder: (params, options) =>
      httpClient.post<StorefrontReorderedCart>(
        `${storefrontBase}/carts/reorder`,
        { id: params.id, order_id: params.order_id, buyer: params.buyer, package_id: params.package_id, market_id: params.market_id },
        cartTokenOptions(options, null),
      ),
  });
  const cartToken = (target: { id: string; token?: string | null }) => target.token ?? cartSelection.token(target.id);
  const cartMutation = <T>(target: { id: string; token?: string | null }, path: string, body: () => object, options?: RequestOptions) =>
    withCartMutation(keptCheckoutScopes(), { type: "cart", cart_id: target.id }, () =>
      httpClient.post<T>(`${cartPath(target.id)}/${path}`, body(), cartTokenOptions(options, cartToken(target))),
    );
  const keptSlot = (scope: StorefrontCurrentCartParams | undefined) => {
    if (scope === undefined) return null;
    requireId(scope.package_id, "package");
    return cartScopeKey(scope, cartSelectionContext.market());
  };
  const checkoutTransport: CartCheckoutTransport<CartCheckoutRequest> = {
    async post(request, options) {
      await lifecycle.ensureVisitorSession();
      return httpClient.post<StorefrontCheckoutAcceptance>(
        `${storefrontBase}/carts/accept`,
        request,
        cartTokenOptions(options, cartSelection.token(request.cart_id)),
      );
    },
    async getOrder(id, options) {
      await lifecycle.ensureVisitorSession();
      return httpClient.get<StorefrontOrder>(`${storefrontBase}/orders/${segment(id)}`, orderTokenOptions(options));
    },
  };
  const paymentMethods = createStorefrontPaymentMethodApi(httpClient);
  const forms = createStorefrontFormsApi(httpClient);
  const packages = createStorefrontPackageApi(httpClient, lifecycle.ensureVisitorSession);
  const orderPath = (id: string) => `${storefrontBase}/orders/${segment(id)}`;

  const media = {
    async find(params: StorefrontFindMediaParams, options?: RequestOptions): Promise<PaginatedResponse<Media>> {
      const items: Media[] = [];
      for (let start = 0; start < params.ids.length; start += mediaIdsPerRead) {
        const ids = params.ids.slice(start, start + mediaIdsPerRead);
        const found = await httpClient.get<Media[]>(`${storefrontBase}/media`, { ...options, params: { ids } });
        if (!Array.isArray(found)) throw new ArkyError("answer_mismatch", "The media read did not answer a list");
        for (const item of found) {
          if (!ids.includes(item.id)) throw new ArkyError("answer_mismatch", "The media read answered a file it was not asked for");
          items.push(item);
        }
      }
      return page(items);
    },
  };

  const collection = {
    get(params: StorefrontGetCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
      return httpClient.get<PublicCollection>(`${storefrontBase}/collections/${segment(params.id)}`, options);
    },
    getByKey(params: StorefrontGetCollectionByKeyParams, options?: RequestOptions): Promise<PublicCollection> {
      return httpClient.get<PublicCollection>(`${storefrontBase}/collections/${segment(params.key)}`, options);
    },
  };

  const entry = {
    find(params: StorefrontFindEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<PublicEntry>> {
      return httpClient.get<PaginatedResponse<PublicEntry>>(`${storefrontBase}/entries`, { ...options, params });
    },
    get(params: StorefrontGetEntryParams, options?: RequestOptions): Promise<PublicEntry> {
      return httpClient.get<PublicEntry>(`${storefrontBase}/entries/${segment(params.id)}`, options);
    },
  };

  const contentReads: ContentReads = {
    getCollection: (params, options) => ("id" in params ? collection.get(params, options) : collection.getByKey(params, options)),
    getEntry: (params, options) => entry.get(params, options),
    findEntries: (params, options) => entry.find(params, options),
    async findEntryBySlug(params, options) {
      const found = await entry.find({ collection_id: params.collection_id, slug: params.slug }, options);
      return found.items[0] ?? null;
    },
    findMedia: async (params, options) => (await media.find(params, options)).items,
  };

  const packageItems = {
    find(params: FindStorefrontPackageItemsParams, options?: RequestOptions): Promise<PaginatedResponse<StorefrontPackageItem>> {
      return httpClient.get<PaginatedResponse<StorefrontPackageItem>>(`${storefrontBase}/package-items`, {
        ...options,
        params: { ...packageQuery(params), selection: params.selection, limit: params.limit, cursor: params.cursor },
      });
    },

    getByParent(params: GetStorefrontPackageItemByParentParams, options?: RequestOptions): Promise<StorefrontPackageItemDetails> {
      return httpClient.get<StorefrontPackageItemDetails>(`${storefrontBase}/package-items/by-parent`, {
        ...options,
        params: { ...packageContextQuery(params), item: params.item },
      });
    },

    findPrices(params: FindStorefrontPackageItemPricesParams, options?: RequestOptions): Promise<PaginatedResponse<StorefrontPackageItemPrice>> {
      return httpClient.get<PaginatedResponse<StorefrontPackageItemPrice>>(`${storefrontBase}/package-items/${segment(params.package_item_id)}/prices`, {
        ...options,
        params: { ...packageQuery(params), limit: params.limit, cursor: params.cursor },
      });
    },
  };

  const freeJoin: FreeJoinDeps = {
    verifiedContact: flows.verifiedContact,
    pendingKey: flows.pendingKey,
    appId: flows.appId,
    appOrderToken: flows.appOrderToken,
    retainToken: (orderId, token) => retainOrderToken(checkoutScope, orderId, token),
    marketId: cartSelectionContext.marketId,
    getPackage: (params, options) =>
      "id" in params ? packages.package.get(params, options) : packages.package.getByKey(params, options),
    findPrices: (params, options) => packageItems.findPrices(params, options),
    async createCart(params, options) {
      requireId(params.id, "cart");
      const slot = cartScopeKey({ buyer: params.buyer, package_id: params.package_id }, cartSelectionContext.market());
      return withCartMutation(keptCheckoutScopes(), { type: "new_cart", slot }, () =>
        httpClient.post<StorefrontCreatedCart>(
          `${storefrontBase}/carts`,
          { id: params.id, buyer: params.buyer, package_id: params.package_id, market_id: params.market_id },
          cartTokenOptions(options, null),
        ),
      );
    },
    addPackageLine: (params, options) =>
      cartMutation<StorefrontCart>(
        params,
        "package-items",
        () => ({ expected_updated_at: params.expected_updated_at, package: storefrontCartPackage(params.package) }),
        options,
      ),
    quote: (params, options) => httpClient.post<StorefrontCartQuote>(`${cartPath(params.id)}/quote`, {}, cartTokenOptions(options, cartToken(params))),
    accept: (request, options) => checkoutTransport.post(request, options),
    getOrder: (id, orderToken, options) => httpClient.get<StorefrontOrder>(orderPath(id), orderTokenOptions({ ...options, order_token: orderToken })),
  };

  async function submitForm(params: SubmitFormParams, options?: RequestOptions): Promise<StorefrontFormSubmission> {
    const draft = submissionDraft(params);
    const request = (id: string): SubmitFormRequest => ({
      ...draft,
      id,
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
      appId: () => flows.appId("form submission"),
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
      () => flows.appId("form submission"),
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
          kept,
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
      const order = await httpClient.get<StorefrontOrder>(orderPath(params.id), orderTokenOptions({ ...options, order_token: token }));
      if (order.id !== params.id) throw new ArkyError("answer_mismatch", "The order link opened another order");
      replaceOrderToken(checkoutScope, params.id, token);
      fragment.delete("order_token");
      const rest = fragment.toString();
      link.hash = rest ? `#${rest}` : "";
      return { order, url: link.toString(), order_token: token };
    }
    const retained = readOrderToken(checkoutScope, params.id);
    const order = await httpClient.get<StorefrontOrder>(
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
    sharedEntries: createSharedEntriesApi(httpClient),
    customer: {
      async identify(params: IdentifyCustomerParams, options?: RequestOptions): Promise<CustomerSessionResult> {
        requireId(params.customer_id, "customer");
        requireId(params.session_id, "customer session");
        const result = await httpClient.post<CustomerSessionResult>(
          `${storefrontBase}/customer/identify`,
          { customer_id: params.customer_id, session_id: params.session_id },
          options,
        );
        return persistIssuedSession(result);
      },

      async requestCode(params: RequestCustomerCodeRequest, options?: RequestOptions): Promise<CustomerCodeResult> {
        requireId(params.id, "sign-in email");
        const result = await httpClient.post<CustomerCodeResult>(
          `${storefrontBase}/customer/request-code`,
          { id: params.id, contact: { email: params.contact.email, language: params.contact.language } },
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
          `${storefrontBase}/customer/me/change-email`,
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
          `${storefrontBase}/customer/verify`,
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
        const result = await apiConfig.publicHttpClient.post<CustomerSessionResult>(
          `${storefrontBase}/customer/refresh`,
          { session_id: requireId(params.session_id, "customer session"), refresh_token: refreshToken },
          options,
        );
        return persistIssuedSession(result);
      },

      async logout(options?: RequestOptions): Promise<void> {
        try {
          await httpClient.post<void>(`${storefrontBase}/customer/logout`, undefined, options);
        } finally {
          updateCustomerSession(() => null);
        }
      },

      async getMe(options?: RequestOptions): Promise<CustomerMe> {
        return persistCustomerRead(await httpClient.get<CustomerMe>(`${storefrontBase}/customer/me`, options));
      },

      async updateMe(params: UpdateCustomerMeParams, options?: RequestOptions): Promise<CustomerMe> {
        return persistCustomerRead(await httpClient.patch<CustomerMe>(`${storefrontBase}/customer/me`, params, options));
      },

      resubscribe(options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.post<CustomerMe>(`${storefrontBase}/customer/me/resubscribe`, undefined, options);
      },

      unsubscribe(options?: RequestOptions): Promise<CustomerMe> {
        return httpClient.post<CustomerMe>(`${storefrontBase}/customer/me/unsubscribe`, undefined, options);
      },
    },

    store: {
      country: createCountryApi({ httpClient }),
      location: {
        find(params: FindStorefrontLocationsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontLocation>> {
          return httpClient.get<PaginatedResponse<StorefrontLocation>>(`${storefrontBase}/locations`, { ...options, params });
        },
        get(params: StorefrontGetLocationParams, options?: RequestOptions): Promise<StorefrontLocation> {
          return httpClient.get<StorefrontLocation>(`${storefrontBase}/locations/${segment(params.id)}`, options);
        },
      },
      market: {
        find(params: FindStorefrontMarketsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontMarket>> {
          return httpClient.get<PaginatedResponse<StorefrontMarket>>(`${storefrontBase}/markets`, { ...options, params });
        },
        get(params: StorefrontGetMarketParams, options?: RequestOptions): Promise<StorefrontMarket> {
          return httpClient.get<StorefrontMarket>(`${storefrontBase}/markets/${segment(params.id)}`, options);
        },
        getByKey(params: StorefrontGetMarketByKeyParams, options?: RequestOptions): Promise<StorefrontMarket> {
          return httpClient.get<StorefrontMarket>(`${storefrontBase}/markets/by-key/${segment(params.key)}`, options);
        },
      },
    },

    media,

    content: {
      collection,
      entry,
      async load<P extends LoadContentParams>(params: P, options?: RequestOptions): Promise<LoadedContentFor<P>> {
        const loaded = await loadContent(contentReads, params, flows.locale(options), options);
        return loaded as LoadedContentFor<P>;
      },
      loadEntries(params: LoadContentEntriesParams, options?: RequestOptions): Promise<LoadedContent<PublicEntry>[]> {
        return loadContentEntries(contentReads, params, flows.locale(options), options);
      },
    },

    category: {
      get(params: StorefrontGetCategoryParams, options?: RequestOptions): Promise<Category> {
        const identifier = "id" in params ? params.id : params.slug;
        if (!identifier) throw new TypeError("A category read needs its id or its slug; a key is read with getByKey");
        return httpClient.get<Category>(`${storefrontBase}/categories/${segment(identifier)}`, options);
      },
      getByKey(params: StorefrontGetCategoryByKeyParams, options?: RequestOptions): Promise<Category> {
        return httpClient.get<Category>(`${storefrontBase}/categories/by-key/${segment(params.key)}`, options);
      },
      findChildren(params: StorefrontFindCategoryChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
        const { id, ...query } = params;
        return httpClient.get<PaginatedResponse<Category>>(`${storefrontBase}/categories/${segment(id)}/children`, {
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
      package: {
        async find(params: FindStorefrontPackagesParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontPackageChoice>> {
          return page(await httpClient.get<StorefrontPackageChoice[]>(`${storefrontBase}/packages`, { ...options, params }));
        },
        ...packages.package,
        joinFree(params: JoinFreePackageParams, options?: RequestOptions): Promise<JoinFreePackageResult> {
          return joinFreePackage(freeJoin, params, options);
        },
      },

      packageItem: packageItems,

      product: {
        get(params: GetStorefrontProductParams, options?: RequestOptions): Promise<StorefrontProduct> {
          const identifier = "id" in params ? params.id : params.slug;
          if (!identifier) throw new TypeError("A product read needs its id or its slug; a key is read with getByKey");
          return httpClient.get<StorefrontProduct>(`${storefrontBase}/products/${segment(identifier)}`, {
            ...options,
            params: packageContextQuery(params),
          });
        },
        getByKey(params: GetStorefrontProductByKeyParams, options?: RequestOptions): Promise<StorefrontProduct> {
          return httpClient.get<StorefrontProduct>(`${storefrontBase}/products/by-key/${segment(params.key)}`, {
            ...options,
            params: packageContextQuery(params),
          });
        },
      },

      productVariant: {
        get(params: GetStorefrontProductVariantParams, options?: RequestOptions): Promise<StorefrontProductVariant> {
          return httpClient.get<StorefrontProductVariant>(
            `${storefrontBase}/products/${segment(params.product_id)}/variants/${segment(params.id)}`,
            { ...options, params: packageQuery(params) },
          );
        },
      },

      bookingService: {
        get(params: GetStorefrontBookingServiceParams, options?: RequestOptions): Promise<StorefrontBookingService> {
          const identifier = "id" in params ? params.id : params.slug;
          if (!identifier) throw new TypeError("A booking service read needs its id or its slug; a key is read with getByKey");
          return httpClient.get<StorefrontBookingService>(`${storefrontBase}/booking-services/${segment(identifier)}`, {
            ...options,
            params: packageContextQuery(params),
          });
        },
        getByKey(params: GetStorefrontBookingServiceByKeyParams, options?: RequestOptions): Promise<StorefrontBookingService> {
          return httpClient.get<StorefrontBookingService>(`${storefrontBase}/booking-services/by-key/${segment(params.key)}`, {
            ...options,
            params: packageContextQuery(params),
          });
        },
        getAvailability(params: GetStorefrontAvailabilityParams, options?: RequestOptions): Promise<AvailabilityResponse> {
          return httpClient.get<AvailabilityResponse>(`${storefrontBase}/booking-services/availability`, {
            ...options,
            params: {
              ...packageContextQuery(params),
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
          return httpClient.get<StorefrontPromotion>(`${storefrontBase}/promotions/${segment(params.id)}`, options);
        },
      },

      bookingOffering: {
        get(params: GetStorefrontBookingOfferingParams, options?: RequestOptions): Promise<StorefrontBookingOffering> {
          return httpClient.get<StorefrontBookingOffering>(`${storefrontBase}/booking-offerings/${segment(params.id)}`, {
            ...options,
            params: packageQuery(params),
          });
        },
      },

      bookingResource: {
        get(params: GetStorefrontBookingResourceParams, options?: RequestOptions): Promise<StorefrontBookingResource> {
          return httpClient.get<StorefrontBookingResource>(`${storefrontBase}/booking-resources/${segment(params.id)}`, {
            ...options,
            params: { ...packageContextQuery(params), offering_id: params.offering_id },
          });
        },
      },

      cart: {
        async create(params: StorefrontCreateCartParams, options?: RequestOptions): Promise<StorefrontCreatedCart> {
          await lifecycle.ensureVisitorSession();
          return cartSelection.create(params, options);
        },

        async getCurrent(params: StorefrontCurrentCartParams, options?: RequestOptions): Promise<StorefrontCart | null> {
          requireId(params?.package_id, "package");
          if (!lifecycle.hasSession()) return null;
          return cartSelection.current(params, options);
        },

        forget(params: StorefrontCurrentCartParams): void {
          cartSelection.forget(params);
        },

        async get(params: StorefrontGetCartParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<StorefrontCart>(cartPath(params.id), cartTokenOptions(options, cartToken(params)));
        },

        async getOrder(params: StorefrontGetCartOrderParams, options?: RequestOptions): Promise<StorefrontOrder | null> {
          requireId(params.id, "cart");
          if ("token" in params) throw new TypeError("A Cart-to-Order read uses current buyer authorization");
          await lifecycle.ensureVisitorSession();
          return httpClient.get<StorefrontOrder | null>(`${cartPath(params.id)}/order`, cartTokenOptions(options, null));
        },

        async findOffers(params: FindStorefrontCartOffersParams, options?: RequestOptions): Promise<PaginatedResponse<StorefrontCart>> {
          const query = cartOffersQuery(params);
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<StorefrontCart>>(`${storefrontBase}/carts/offers`, { ...cartTokenOptions(options, null), params: query });
        },

        async reorder(params: StorefrontReorderParams, options?: RequestOptions): Promise<StorefrontReorderedCart> {
          requireId(params.id, "cart");
          requireId(params.package_id, "package");
          await lifecycle.ensureVisitorSession();
          return cartSelection.reorder(params, options);
        },

        async update(params: StorefrontUpdateCartParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(keptCheckoutScopes(), { type: "cart", cart_id: params.id }, () =>
            httpClient.put<StorefrontCart>(cartPath(params.id), storefrontCartUpdateBody(params), cartTokenOptions(options, cartToken(params))),
          );
        },

        async addProduct(params: StorefrontAddCartProductParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<StorefrontCart>(
            params,
            "product-items",
            () => ({ expected_updated_at: params.expected_updated_at, product: storefrontCartProduct(params.product) }),
            options,
          );
        },

        async addBooking(params: StorefrontAddCartBookingParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<StorefrontCart>(
            params,
            "booking-items",
            () => ({ expected_updated_at: params.expected_updated_at, booking: storefrontCartBooking(params.booking) }),
            options,
          );
        },

        async addPackage(params: StorefrontAddCartPackageParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<StorefrontCart>(
            params,
            "package-items",
            () => ({
              expected_updated_at: params.expected_updated_at,
              package: storefrontCartPackage(params.package),
            }),
            options,
          );
        },

        async removeItem(params: StorefrontRemoveCartItemParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<StorefrontCart>(
            params,
            "items/remove",
            () => ({ expected_updated_at: params.expected_updated_at, line_item_id: params.line_item_id }),
            options,
          );
        },

        async clear(params: StorefrontClearCartParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<StorefrontCart>(params, "clear", () => ({ expected_updated_at: params.expected_updated_at }), options);
        },

        async selectShippingMethod(params: StorefrontSelectCartShippingMethodParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return cartMutation<StorefrontCart>(
            params,
            "shipping-method",
            () => ({ expected_updated_at: params.expected_updated_at, shipping_method_id: params.shipping_method_id }),
            options,
          );
        },

        async setFutureDeliveries(params: StorefrontSetCartFutureDeliveriesParams, options?: RequestOptions): Promise<StorefrontCart> {
          await lifecycle.ensureVisitorSession();
          return withCartMutation(keptCheckoutScopes(), { type: "cart", cart_id: params.id }, () =>
            httpClient.put<StorefrontCart>(
              `${cartPath(params.id)}/future-deliveries`,
              { expected_updated_at: params.expected_updated_at, packages: params.packages },
              cartTokenOptions(options, cartToken(params)),
            ),
          );
        },

        async quoteFutureDeliveries(
          params: StorefrontQuoteCartFutureDeliveriesParams,
          options?: RequestOptions,
        ): Promise<PackageDeliveryOffers[]> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<PackageDeliveryOffers[]>(
            `${cartPath(params.id)}/future-delivery-quote`,
            { packages: params.packages },
            cartTokenOptions(options, cartToken(params)),
          );
        },

        async quote(params: StorefrontQuoteCartParams, options?: RequestOptions): Promise<StorefrontCartQuote> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<StorefrontCartQuote>(`${cartPath(params.id)}/quote`, params.contact_email !== undefined ? { contact_email: params.contact_email } : {}, cartTokenOptions(options, cartToken(params)));
        },

        async checkout(params: StorefrontCheckoutCartRequest, options?: RequestOptions): Promise<StorefrontCheckoutAcceptance> {
          const { token: _token, scope, order_id, order_token, ...draft } = params;
          if (order_id !== undefined && order_token !== undefined) {
            return checkoutCart({ ...draft, order_id, order_token }, checkoutTransport, options);
          }
          if (order_id !== undefined || order_token !== undefined) {
            throw new TypeError("A checkout names both its order_id and order_token, or neither so the app's factories pick them");
          }
          const slot = keptSlot(scope);
          await lifecycle.ensureVisitorSession();
          return checkoutCartWithAppIds(keptCheckoutScopes(), checkoutScope, slot, draft, flows, checkoutTransport, options);
        },

        async retainCheckout(params: StorefrontCheckoutCartParams): Promise<CartCheckoutRequest> {
          const { token: _token, scope, ...request } = params;
          const slot = keptSlot(scope);
          await lifecycle.ensureVisitorSession();
          return retainCartCheckout(keptCheckoutScopes(), checkoutScope, slot, request);
        },

        async pendingCheckout(params: StorefrontKeptCheckoutParams = {}): Promise<CartCheckoutRequest | null> {
          const slot = keptSlot(params.scope);
          if (!lifecycle.hasSession()) return null;
          return pendingCartCheckout(keptCheckoutScopes(), slot);
        },

        async recoverCheckout(params: StorefrontKeptCheckoutParams = {}, options?: RequestOptions): Promise<StorefrontCheckoutAcceptance | null> {
          const slot = keptSlot(params.scope);
          if (!lifecycle.hasSession()) return null;
          return recoverCartCheckout(keptCheckoutScopes(), slot, checkoutTransport, options);
        },
      },

      order: {
        async find(params: StorefrontFindOrdersParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontOrder>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<StorefrontOrder>>(`${storefrontBase}/orders`, { ...options, params });
        },

        async get(params: StorefrontGetOrderParams, options?: RequestOptions): Promise<StorefrontOrder> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<StorefrontOrder>(`${storefrontBase}/orders/${segment(params.id)}`, orderTokenOptions(options));
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
              `${storefrontBase}/orders/${segment(params.order_id)}/fulfillments`,
              orderTokenOptions(options),
            ),
          );
        },

        async findPayments(params: StorefrontFindOrderPaymentsParams, options?: RequestOptions): Promise<PaginatedResponse<StorefrontPayment>> {
          await lifecycle.ensureVisitorSession();
          return page(await httpClient.get<StorefrontPayment[]>(`${storefrontBase}/orders/${segment(params.order_id)}/payments`, orderTokenOptions(options)));
        },

        async getPayment(params: StorefrontOrderPaymentParams, options?: RequestOptions): Promise<StorefrontPayment> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<StorefrontPayment>(
            `${storefrontBase}/orders/${segment(params.order_id)}/payments/${segment(params.payment_id)}`,
            orderTokenOptions(options),
          );
        },

        async resumePayment(params: StorefrontResumeOrderPaymentParams, options?: RequestOptions): Promise<CheckoutPaymentAction> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<CheckoutPaymentAction>(
            `${storefrontBase}/orders/${segment(params.order_id)}/payment-action`,
            undefined,
            orderTokenOptions(options),
          );
        },

        async downloadAsset(params: StorefrontDownloadOrderAssetParams, options?: RequestOptions): Promise<DigitalDownload> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<DigitalDownload>(
            `${storefrontBase}/orders/${segment(params.order_id)}/digital-lines/${segment(params.line_item_id)}/assets/${segment(params.asset_id)}/download`,
            orderTokenOptions(options),
          );
        },

        async cancelBookingItem(params: StorefrontCancelOrderBookingItemParams, options?: RequestOptions): Promise<StorefrontOrder> {
          requireId(params.credit_id, "credit");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<StorefrontOrder>(
            `${storefrontBase}/orders/${segment(params.order_id)}/booking-items/${segment(params.line_item_id)}/cancel`,
            { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at },
            orderTokenOptions(options),
          );
        },

        async rescheduleBookingItem(params: StorefrontRescheduleOrderBookingItemParams, options?: RequestOptions): Promise<StorefrontOrder> {
          await lifecycle.ensureVisitorSession();
          return httpClient.post<StorefrontOrder>(
            `${storefrontBase}/orders/${segment(params.order_id)}/booking-items/${segment(params.line_item_id)}/reschedule`,
            { expected_updated_at: params.expected_updated_at, starts_at: params.starts_at },
            orderTokenOptions(options),
          );
        },
      },

      library: {
        async find(params: FindLibraryParams = {}, options?: RequestOptions): Promise<PaginatedResponse<LibraryItem>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<LibraryItem>>(`${storefrontBase}/digital-products/library`, { ...options, params });
        },

        async getProduct(params: GetLibraryProductParams, options?: RequestOptions): Promise<LibraryProduct> {
          await lifecycle.ensureVisitorSession();
          const { product_id, ...query } = params;
          return httpClient.get<LibraryProduct>(`${storefrontBase}/digital-products/library/${segment(product_id)}`, {
            ...options,
            params: query,
          });
        },

        async findAssets(params: FindLibraryAssetsParams, options?: RequestOptions): Promise<PaginatedResponse<LibraryAsset>> {
          await lifecycle.ensureVisitorSession();
          const { product_id, ...query } = params;
          return httpClient.get<PaginatedResponse<LibraryAsset>>(`${storefrontBase}/digital-products/library/${segment(product_id)}/assets`, {
            ...options,
            params: query,
          });
        },

        async download(params: DownloadLibraryAssetParams, options?: RequestOptions): Promise<DigitalDownload> {
          await lifecycle.ensureVisitorSession();
          const { product_id, asset_id, ...query } = params;
          return httpClient.get<DigitalDownload>(
            `${storefrontBase}/digital-products/${segment(product_id)}/assets/${segment(asset_id)}/download`,
            { ...options, params: query },
          );
        },
      },

      paymentMethod: {
        async find(params: StorefrontFindPaymentMethodsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontPaymentMethod>> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.find(params, options);
        },
        async get(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.get(params, options);
        },
        async requestSetup(params: StorefrontRequestPaymentMethodSetupParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.requestSetup(params, options);
        },
        async startSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethodSetupStart> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.startSetup(params, options);
        },
        async completeSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.completeSetup(params, options);
        },
        async cancelSetup(params: StorefrontCancelPaymentMethodSetupParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.cancelSetup(params, options);
        },
        async revoke(params: StorefrontRevokePaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
          await lifecycle.ensureVisitorSession();
          return paymentMethods.revoke(params, options);
        },
      },

      packageOffering: packages.packageOffering,
      packageMember: packages.packageMember,

      minimumProgress: {
        async get(params: StorefrontGetMinimumProgressParams, options?: RequestOptions): Promise<MinimumProgress> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<MinimumProgress>(`${storefrontBase}/minimum-progress`, { ...options, params });
        },
      },

      rental: {
        async find(params: FindCustomerRentalsParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerRental>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<CustomerRental>>(`${storefrontBase}/rentals`, { ...options, params });
        },

        async get(params: GetCustomerRentalParams, options?: RequestOptions): Promise<CustomerRental> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<CustomerRental>(`${storefrontBase}/rentals/${segment(params.id)}`, options);
        },
      },

      return: {
        async create(params: StorefrontCreateReturnParams, options?: RequestOptions): Promise<StorefrontReturn> {
          requireId(params.id, "return");
          await lifecycle.ensureVisitorSession();
          return httpClient.post<StorefrontReturn>(`${storefrontBase}/returns`, params, params.type.type === "order" ? orderTokenOptions(options) : options);
        },

        async get(params: StorefrontGetReturnParams, options?: RequestOptions): Promise<StorefrontReturnDetail> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<StorefrontReturnDetail>(`${storefrontBase}/returns/${segment(params.id)}`, orderTokenOptions(options));
        },

        async find(params: StorefrontFindReturnsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontReturn>> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<PaginatedResponse<StorefrontReturn>>(`${storefrontBase}/returns`, { ...(params.order_id ? orderTokenOptions(options) : options), params });
        },

        async getOrderOptions(params: StorefrontGetOrderReturnOptionsParams, options?: RequestOptions): Promise<OrderReturnOptions> {
          await lifecycle.ensureVisitorSession();
          return httpClient.get<OrderReturnOptions>(`${storefrontBase}/returns/orders/${segment(params.order_id)}/options`, orderTokenOptions(options));
        },

        async findRentalOptions(
          params: FindRentalReturnOptionsParams,
          options?: RequestOptions,
        ): Promise<PaginatedResponse<RentalReturnUnitOption>> {
          await lifecycle.ensureVisitorSession();
          const { rental_id, ...query } = params;
          return httpClient.get<PaginatedResponse<RentalReturnUnitOption>>(
            `${storefrontBase}/returns/rentals/${segment(rental_id)}/options`,
            { ...options, params: query },
          );
        },
      },
    },

    companies: createStorefrontCompanyApi(httpClient, lifecycle.ensureVisitorSession),

    actions: {
      async track(params: TrackCustomerActionParams, options?: RequestOptions): Promise<void> {
        const post = (id: string) =>
          httpClient.post<void>(
            `${storefrontBase}/actions/track`,
            params.data !== undefined ? { id, key: params.key, data: params.data } : { id, key: params.key },
            options,
          );
        if (params.id !== undefined) {
          requireId(params.id, "customer action");
          await lifecycle.ensureVisitorSession();
          await post(params.id);
          return;
        }
        await lifecycle.ensureVisitorSession();
        await runDurableCreate({
          key: flows.pendingKey("customer-action", params.key),
          label: "customer action",
          input: { key: params.key, data: params.data ?? null },
          appId: () => flows.appId("customer action"),
          send: (id) => post(id),
          confirms: () => true,
        });
      },
    },

    experiments: {
      async use(params: UseExperimentParams, options?: RequestOptions): Promise<ExperimentUseResponse> {
        await lifecycle.ensureVisitorSession();
        return httpClient.post<ExperimentUseResponse>(`${storefrontBase}/experiments/${segment(params.key)}/use`, undefined, options);
      },
    },
  };
};
