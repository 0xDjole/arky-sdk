import { ArkyApiError, ArkyError } from "./types/apiError";
import { requireId } from "./utils/ids";
import { isDefiniteRefusal } from "./utils/durableRequest";
import { isOrderToken } from "./utils/orderToken";
import { createAdminSessionState } from "./services/adminSession";
import { createHttpClient, refusedByArky } from "./services/createHttpClient";
import { durableCreateKey, runDurableCreate } from "./services/durableCreate";
import type { AuthStorage, HttpClientConfig, RequestContextOverride } from "./types/httpClient";
import type { RequestOptions } from "./types/api";
import type {
  AdminSessionInternal,
  AdminSessionUpdater,
  ApiConfig,
  StorefrontApiConfig,
  StorefrontFlowContext,
} from "./services/clientTypes";
import {
  CustomerGroupJoinError,
  type JoinFreeCustomerGroupResult,
  type JoinNewsletterParams,
  type RequestNewsletterCodeParams,
  type RequestNewsletterCodeResult,
} from "./types/customerGroupJoin";
import type {
  ChangeCustomerEmailParams,
  StorefrontCustomer,
  CustomerCodeResult,
  CustomerMe,
  CustomerSessionIssued,
  CustomerSessionResult,
  CustomerSessionStatus,
  UpdateCustomerMeParams,
} from "./types/customer";
import type { StorefrontSetup } from "./types/storefront";
import type { EmailContact } from "./types/common";
import { createAccountApi } from "./api/account";
import { createActionsApi } from "./api/actions";
import { createCountsApi } from "./api/counts";
import { createAuthApi } from "./api/auth";
import { createBookingOfferingApi, createBookingResourceApi, createBookingServiceApi } from "./api/booking";
import { createBroadcastApi, createStorefrontBroadcastApi } from "./api/broadcast";
import { createCartApi } from "./api/cart";
import { createCatalogAccessApi, createCatalogApi, createCatalogItemApi, createCatalogItemPriceApi } from "./api/catalog";
import { createCategoryApi } from "./api/category";
import {
  createCompanyApi,
  createCompanyLocationApi,
  createCompanyMembershipApi,
  createCompanyRoleApi,
} from "./api/company";
import { createCollectionApi, createEntryApi } from "./api/content";
import {
  createCustomerGroupApi,
  createCustomerGroupMemberApi,
  createCustomerGroupOfferingApi,
} from "./api/customerGroup";
import { createCustomersApi } from "./api/customers";
import { createDigitalAssetApi } from "./api/digitalAsset";
import { createEmailSuppressionApi } from "./api/emailSuppression";
import { createExperimentsApi } from "./api/experiments";
import { createFormsApi } from "./api/forms";
import {
  createFulfillmentApi,
  createFulfillmentJobApi,
  createFulfillmentRoutingApi,
  createMinimumProgressApi,
} from "./api/fulfillment";
import { createInventoryItemApi } from "./api/inventoryItem";
import { createInventoryLevelApi } from "./api/inventoryLevel";
import { createInventoryMovementApi } from "./api/inventoryMovement";
import { createInventoryUnitApi } from "./api/inventoryUnit";
import { createCountryApi, createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createMediaApi } from "./api/media";
import {
  createCompanyNoteApi,
  createCustomerNoteApi,
  createFormSubmissionNoteApi,
  createOrderNoteApi,
} from "./api/note";
import {
  createStoreEmailsApi,
  createEmailAddressApi,
  createEmailLayoutApi,
  createEmailProviderApi,
  createEmailTemplateApi,
  createOutgoingEmailApi,
  createOutgoingWebhookApi,
  createStoreResendEventApi,
} from "./api/notification";
import { createOrderApi } from "./api/order";
import { createPaymentApi, createIncomingWebhookApi } from "./api/payment";
import { createPaymentMethodApi } from "./api/paymentMethod";
import { createPaymentOptionApi } from "./api/paymentOption";
import { createPlatformApi } from "./api/platform";
import { createProductApi, createProductVariantApi } from "./api/product";
import { createPromotionApi, createPromotionCodeApi } from "./api/promotion";
import { createRentalApi } from "./api/rental";
import { createReturnApi } from "./api/return";
import { createSalesChannelApi } from "./api/salesChannel";
import { createShippingMethodApi } from "./api/shippingMethod";
import { createShippingProfileApi } from "./api/shippingProfile";
import { createStoreApi } from "./api/store";
import { createApiKeyApi } from "./api/apiKey";
import { createStoreRoleApi } from "./api/storeRole";
import {
  createStorefrontApi,
  type CustomerSessionInternal,
  type CustomerSessionUpdater,
  type RefreshCustomerSessionParams,
  type IdentifyCustomerParams,
  type RequestCustomerCodeParams,
  type VerifyCustomerCodeParams,
} from "./api/storefront";
import { createStorefrontPageViewsApi } from "./api/pageViews";
import { createAdminSupportApi, createStorefrontSupportApi } from "./api/support";
import { createTaxCategoryApi } from "./api/taxCategory";
import { createWebhookApi } from "./api/webhook";
import { createZoneApi } from "./api/zone";
import { isValidKey } from "./utils/keyValidation";

export * from "./types";
export type { AdminLogoutResult } from "./services/adminSession";
export type { RecordNoteApi } from "./api/note";
export type { FindAdminRentalReturnOptionsParams } from "./api/return";
export { COMMON_CUSTOMER_ACTION_KEYS } from "./api/storefront";
export type {
  CommonCustomerActionKey,
  IdentifyCustomerParams,
  OrderFromLink,
  OrderFromLinkParams,
  RefreshCustomerSessionParams,
  RequestCustomerCodeParams,
  StorefrontCheckoutCartRequest,
  VerifyCustomerCodeParams,
} from "./api/storefront";
export { ScheduledResultTimeoutError } from "./utils/scheduledResult";
export { isValidKey, validateKey, toKey } from "./utils/keyValidation";
export {
  epochMilliseconds,
  epochMillisecondsFromDate,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "./utils/time";
export { isCanonicalId, requireId } from "./utils/ids";
export { DurableRequestError, isDefiniteRefusal } from "./utils/durableRequest";
export type { DurableRequestErrorCode } from "./utils/durableRequest";
export { paginate, readAllPages } from "./utils/paginate";
export type { PageRead, PaginateOptions } from "./utils/paginate";
export { latestPayment, paymentOutcome } from "./utils/paymentOutcome";
export type { PaymentOutcome } from "./utils/paymentOutcome";
export { paymentAmounts } from "./utils/paymentAmounts";
export type { PaymentAmounts } from "./utils/paymentAmounts";
export {
  blockContent,
  collectBlockReferences,
  findBlock,
  formatBlockValue,
  getBlockContentValue,
  getBlockLabel,
  getBlockTextValue,
  getBlockValue,
  getBlockValues,
  getImageUrl,
  selectLocalizedText,
} from "./utils/blocks";
export type { BlockReferences } from "./utils/blocks";
export {
  convertToMajor,
  convertToMinor,
  formatMinor,
  formatMoney,
  formatPrice,
  getCurrencyMinorUnits,
  getCurrencyName,
  getCurrencySymbol,
  getPriceAmount,
} from "./utils/price";
export { buildFormAnswers, formValuesFromAnswers } from "./utils/formAnswers";
export { mountCheckoutAction, mountPaymentMethodSetup } from "./checkout";
export { isSimulatedPayment, simulatePayment } from "./paymentSimulator";
export type { PaymentSimulation, SimulatePaymentOptions, SimulatePaymentParams } from "./paymentSimulator";
export { CheckoutFlowError, initialize } from "./storefrontStore";
export type * from "./storefrontStore";

export const SDK_VERSION = "0.26.97";

export interface AdminSession {
  id: string;
  email?: string;
}

export interface StorefrontCustomerSession {
  customer: StorefrontCustomer;
  id: string;
  type: CustomerSessionIssued["type"];
  status: CustomerSessionStatus;
}

export type AuthStateListener<T> = (session: T | null) => void;

export interface CreateAdminConfig {
  apiUrl: string;
  secretKey?: string;
  refreshPath?: string | (() => string);
  forcedHeaders?: HttpClientConfig["forcedHeaders"];
  onUnauthorized?: HttpClientConfig["onUnauthorized"];
}

export function createAdmin(config: CreateAdminConfig) {
  const sessionState = createAdminSessionState(config.apiUrl, config.refreshPath);
  const readAdminSession = sessionState.read;
  const writeAdminSession = sessionState.write;
  let unsubscribeStorage: (() => void) | null = null;
  const listeners = new Set<AuthStateListener<AdminSession>>();

  function toPublic(session: AdminSessionInternal | null): AdminSession | null {
    return session ? { id: session.id, email: session.email } : null;
  }

  function emit(): void {
    const current = toPublic(readAdminSession());
    for (const listener of listeners) {
      Promise.resolve()
        .then(() => listener(current))
        .catch(() => {});
    }
  }

  const updateSession: AdminSessionUpdater = (updater) => {
    if (config.secretKey) return;
    writeAdminSession(updater(readAdminSession()));
    emit();
  };

  const secretKey = config.secretKey;
  const authStorage: AuthStorage = secretKey
    ? { getTokens: () => ({ access_token: secretKey }) }
    : {
        getTokens() {
          const session = readAdminSession();
          if (!session) return null;
          return {
            id: session.id,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            access_expires_at: session.access_expires_at,
          };
        },
      };

  const httpClient = createHttpClient({
    baseUrl: config.apiUrl,
    forcedHeaders: config.forcedHeaders,
    refreshCredentials: secretKey ? undefined : sessionState.refresh,
    onUnauthorized: secretKey ? () => false : config.onUnauthorized,
    authStorage,
  });

  const apiConfig: ApiConfig = { httpClient, baseUrl: config.apiUrl, authStorage };
  const authHttpClient = createHttpClient({
    baseUrl: config.apiUrl,
    authStorage: { getTokens: () => null },
    onUnauthorized: () => false,
  });

  const supportApi = createAdminSupportApi(apiConfig);

  return {
    account: {
      ...createAccountApi(apiConfig),
      auth: createAuthApi({ ...apiConfig, httpClient: authHttpClient }, updateSession, sessionState.refreshExplicit),
    },
    platform: createPlatformApi(apiConfig),
    store: {
      ...createStoreApi(apiConfig),
      country: createCountryApi(apiConfig),
      role: createStoreRoleApi(apiConfig),
      webhook: createWebhookApi(apiConfig),
      location: createLocationApi(apiConfig),
      market: createMarketApi(apiConfig),
      salesChannel: createSalesChannelApi(apiConfig),
      apiKey: createApiKeyApi(apiConfig),
      emails: createStoreEmailsApi(apiConfig),
      paymentOption: createPaymentOptionApi(apiConfig),
      zone: createZoneApi(apiConfig),
      taxCategory: createTaxCategoryApi(apiConfig),
      shippingProfile: createShippingProfileApi(apiConfig),
      shippingMethod: createShippingMethodApi(apiConfig),
    },
    notification: {
      incomingWebhook: createIncomingWebhookApi(apiConfig),
      outgoingEmail: createOutgoingEmailApi(apiConfig),
      outgoingWebhook: createOutgoingWebhookApi(apiConfig),
      template: createEmailTemplateApi(apiConfig),
      layout: createEmailLayoutApi(apiConfig),
      emailProvider: createEmailProviderApi(apiConfig),
      emailAddress: createEmailAddressApi(apiConfig),
      resendEvent: createStoreResendEventApi(apiConfig),
    },
    broadcast: createBroadcastApi(apiConfig),
    support: supportApi,
    media: createMediaApi(apiConfig),
    category: createCategoryApi(apiConfig),
    content: {
      collection: createCollectionApi(apiConfig),
      entry: createEntryApi(apiConfig),
    },
    forms: {
      ...createFormsApi(apiConfig),
      notes: createFormSubmissionNoteApi(apiConfig),
    },
    companies: {
      ...createCompanyApi(apiConfig),
      location: createCompanyLocationApi(apiConfig),
      role: createCompanyRoleApi(apiConfig),
      membership: createCompanyMembershipApi(apiConfig),
      notes: createCompanyNoteApi(apiConfig),
    },
    customers: {
      ...createCustomersApi(apiConfig),
      emailSuppression: createEmailSuppressionApi(apiConfig),
      notes: createCustomerNoteApi(apiConfig),
    },
    actions: createActionsApi(apiConfig),
    experiments: createExperimentsApi(apiConfig),
    counts: createCountsApi(apiConfig),
    eshop: {
      product: createProductApi(apiConfig),
      productVariant: createProductVariantApi(apiConfig),
      digitalAsset: createDigitalAssetApi(apiConfig),
      bookingService: createBookingServiceApi(apiConfig),
      bookingResource: createBookingResourceApi(apiConfig),
      bookingOffering: createBookingOfferingApi(apiConfig),
      catalog: createCatalogApi(apiConfig),
      catalogItem: createCatalogItemApi(apiConfig),
      catalogItemPrice: createCatalogItemPriceApi(apiConfig),
      catalogAccess: createCatalogAccessApi(apiConfig),
      promotion: createPromotionApi(apiConfig),
      promotionCode: createPromotionCodeApi(apiConfig),
      customerGroup: createCustomerGroupApi(apiConfig),
      customerGroupOffering: createCustomerGroupOfferingApi(apiConfig),
      customerGroupMember: createCustomerGroupMemberApi(apiConfig),
      paymentMethod: createPaymentMethodApi(apiConfig),
      payment: createPaymentApi(apiConfig),
      cart: createCartApi(apiConfig),
      order: {
        ...createOrderApi(apiConfig),
        notes: createOrderNoteApi(apiConfig),
      },
      inventoryItem: createInventoryItemApi(apiConfig),
      inventoryLevel: createInventoryLevelApi(apiConfig),
      inventoryUnit: createInventoryUnitApi(apiConfig),
      inventoryMovement: createInventoryMovementApi(apiConfig),
      fulfillmentRouting: createFulfillmentRoutingApi(apiConfig),
      fulfillmentJob: createFulfillmentJobApi(apiConfig),
      fulfillment: createFulfillmentApi(apiConfig),
      minimumProgress: createMinimumProgressApi(apiConfig),
      return: createReturnApi(apiConfig),
      rental: createRentalApi(apiConfig),
    },

    get session(): AdminSession | null {
      if (secretKey) return null;
      return toPublic(readAdminSession());
    },

    get isAuthenticated(): boolean {
      if (secretKey) return true;
      return readAdminSession() !== null;
    },

    onAuthStateChanged(listener: AuthStateListener<AdminSession>): () => void {
      listeners.add(listener);
      if (!unsubscribeStorage) unsubscribeStorage = sessionState.subscribe(emit);
      const current = toPublic(readAdminSession());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(() => {});
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribeStorage?.();
          unsubscribeStorage = null;
        }
      };
    },

    async logout(): Promise<import("./services/adminSession").AdminLogoutResult> {
      if (secretKey) return { type: "secret_key" };
      const result = await sessionState.logout();
      emit();
      return result;
    },
  };
}

export type AdminClient = ReturnType<typeof createAdmin>;

export interface StorefrontSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorefrontContext {
  locale?: string;
  market?: string;
}

export interface StorefrontOptions extends StorefrontContext {
  apiUrl?: string;
  sessionStorage?: StorefrontSessionStorage;
  visitorIdentity?: IdentifyCustomerParams;
  createVisitorIdentity: () => IdentifyCustomerParams;
  createSessionId: () => string;
  createId: () => string;
  createOrderToken: () => string;
}

export const DEFAULT_STOREFRONT_API_URL = "https://api.arky.io";

function defaultStorefrontSessionStorage(): StorefrontSessionStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeStorefrontApiUrl(value: string | undefined): string {
  const input = value?.trim() || DEFAULT_STOREFRONT_API_URL;
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new TypeError("Storefront apiUrl must be a valid HTTP(S) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError("Storefront apiUrl must use HTTP or HTTPS");
  }
  return input.replace(/\/+$/, "");
}

function validatePublishableKey(publishableKey: string): string {
  const message = "A valid Arky publishable key is required (arky_pk_ followed by 43 URL-safe characters)";
  if (typeof publishableKey !== "string") throw new TypeError(message);
  const key = publishableKey.trim();
  if (!/^arky_pk_[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(key)) throw new TypeError(message);
  return key;
}

function publishableKeyFingerprint(publishableKey: string): string {
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b9;
  for (let index = 0; index < publishableKey.length; index += 1) {
    const code = publishableKey.charCodeAt(index);
    hashA = Math.imul(hashA ^ code, 0x01000193);
    hashB = Math.imul(hashB ^ code, 0x85ebca6b);
  }
  return `${(hashA >>> 0).toString(36)}${(hashB >>> 0).toString(36)}`;
}

function storefrontSessionStorageKey(apiUrl: string, publishableKey: string): string {
  return `arky_customer_session:v4:${encodeURIComponent(apiUrl.toLowerCase())}:${publishableKeyFingerprint(publishableKey)}`;
}

interface StoredCustomerSession {
  version: 4;
  customer: StorefrontCustomer;
  session: CustomerSessionIssued;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEpochMilliseconds(value: unknown): boolean {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isIssuedCustomerSession(value: unknown): value is CustomerSessionIssued {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.customer_id !== "string" ||
    !isRecord(value.status) ||
    value.status.type !== "active" ||
    Object.keys(value.status).length !== 1
  ) {
    return false;
  }
  if (value.type === "visitor") {
    return (
      typeof value.token === "string" && value.token.startsWith("customer_visitor_") && isEpochMilliseconds(value.expires_at)
    );
  }
  return (
    value.type === "email_authenticated" &&
    typeof value.access_token === "string" &&
    value.access_token.startsWith("customer_access_") &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.startsWith("customer_refresh_") &&
    isEpochMilliseconds(value.access_expires_at) &&
    isEpochMilliseconds(value.refresh_expires_at) &&
    isEpochMilliseconds(value.authenticated_at)
  );
}

function isStoredContact(value: unknown): value is EmailContact {
  return isRecord(value) && typeof value.email === "string" && typeof value.language === "string";
}

function isStoredCustomer(value: unknown): value is StorefrontCustomer {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.store_id === "string" &&
    Array.isArray(value.profile) &&
    isRecord(value.type) &&
    (value.type.type === "anonymous" ||
      (value.type.type === "verified" && isStoredContact(value.type.contact) && Array.isArray(value.type.addresses))) &&
    isEpochMilliseconds(value.created_at) &&
    isEpochMilliseconds(value.updated_at)
  );
}

function parseStoredCustomerSession(value: string | null): CustomerSessionInternal | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !isRecord(parsed) ||
      parsed.version !== 4 ||
      !isStoredCustomer(parsed.customer) ||
      !isIssuedCustomerSession(parsed.session) ||
      parsed.session.customer_id !== parsed.customer.id
    ) {
      return null;
    }
    return { customer: parsed.customer, session: parsed.session };
  } catch {
    return null;
  }
}

function contextKey(value: string | undefined, label: string): string {
  const key = value?.trim() ?? "";
  if (key && !isValidKey(key)) throw new TypeError(`The ${label} must be a valid exact key`);
  return key;
}

function requireIdFactories(options: StorefrontOptions | undefined): StorefrontOptions {
  if (
    typeof options?.createVisitorIdentity !== "function" ||
    typeof options.createSessionId !== "function" ||
    typeof options.createId !== "function" ||
    typeof options.createOrderToken !== "function"
  ) {
    throw new TypeError(
      "A storefront needs createVisitorIdentity, createSessionId, createId and createOrderToken: the app picks every id and order token",
    );
  }
  return options;
}

function sameEmail(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function createStorefrontClientCore(publishableKeyInput: string, suppliedOptions: StorefrontOptions) {
  const publishableKey = validatePublishableKey(publishableKeyInput);
  const options = requireIdFactories(suppliedOptions);
  const apiUrl = normalizeStorefrontApiUrl(options.apiUrl);
  let locale = options.locale?.trim() ?? "";
  let market = contextKey(options.market, "market");
  const listeners = new Set<AuthStateListener<StorefrontCustomerSession>>();
  let automaticRefreshPromise: Promise<CustomerSessionResult> | null = null;
  let automaticRefreshId: string | null = null;
  let identifyPromise: Promise<CustomerSessionResult> | null = null;
  let identifyKey: string | null = null;
  let pendingVerifySessionId: string | null = null;
  let pendingVisitorIdentity: IdentifyCustomerParams | null = null;
  let visitorIdentityConsumed = false;
  let identityTail: Promise<void> = Promise.resolve();
  let setupPromise: Promise<StorefrontSetup> | null = null;
  let setupValue: StorefrontSetup | null = null;
  const explicitSessionStorage = options.sessionStorage;
  const sessionStorage = explicitSessionStorage || defaultStorefrontSessionStorage();
  const canCreateVisitorSession = typeof window !== "undefined" || Boolean(explicitSessionStorage);
  const storageKey = storefrontSessionStorageKey(apiUrl, publishableKey);
  let memorySession: CustomerSessionInternal | null = null;

  if (sessionStorage) {
    try {
      const stored = sessionStorage.getItem(storageKey);
      memorySession = parseStoredCustomerSession(stored);
      if (stored && !memorySession) sessionStorage.removeItem(storageKey);
    } catch {}
  }

  visitorIdentityConsumed = Boolean(memorySession && options.visitorIdentity && memorySession.session.id === options.visitorIdentity.session_id);

  function authorizationToken(session: CustomerSessionInternal | null = memorySession): string | null {
    if (!session || session.session.status.type !== "active") return null;
    return session.session.type === "visitor" ? session.session.token : session.session.access_token;
  }

  function writeCustomerSession(session: CustomerSessionInternal | null): void {
    if (session && (!isIssuedCustomerSession(session.session) || !isStoredCustomer(session.customer))) {
      throw new RangeError("The customer session must be active and carry epoch-millisecond times");
    }
    memorySession = session;
    if (!sessionStorage) return;
    try {
      if (session) {
        const stored: StoredCustomerSession = { version: 4, customer: session.customer, session: session.session };
        sessionStorage.setItem(storageKey, JSON.stringify(stored));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {}
  }

  function toPublic(value: CustomerSessionInternal | null): StorefrontCustomerSession | null {
    return value
      ? { customer: value.customer, id: value.session.id, type: value.session.type, status: value.session.status }
      : null;
  }

  function emit(): void {
    const current = toPublic(memorySession);
    for (const listener of listeners) {
      Promise.resolve()
        .then(() => listener(current))
        .catch(() => {});
    }
  }

  const updateSession: CustomerSessionUpdater = (updater) => {
    const next = updater(memorySession);
    if (next === memorySession) return;
    writeCustomerSession(next);
    emit();
  };

  const authStorage: AuthStorage = {
    getTokens() {
      if (!memorySession || memorySession.session.status.type !== "active") return null;
      const issued = memorySession.session;
      return issued.type === "visitor"
        ? { access_token: issued.token }
        : { access_token: issued.access_token, refresh_token: issued.refresh_token };
    },
  };

  let recoverUnauthorized: (authorizationToken: string | null, path: string, response: { status: number; data: unknown }) => Promise<boolean> = async () => false;
  let visitorRecoveryPromise: Promise<void> | null = null;

  function requestLocale(value: string | undefined): string {
    if (value === undefined) return locale;
    const requested = typeof value === "string" ? value.trim() : "";
    if (!requested) throw new TypeError("A per-call locale names a language");
    return requested;
  }

  function requestMarket(value: string | undefined): string {
    if (value === undefined) return market;
    const requested = contextKey(value, "market");
    if (!requested) throw new TypeError("A per-call market names a market key");
    return requested;
  }

  const storefrontHeaders = (context: RequestContextOverride): Record<string, string> => {
    const headerLocale = requestLocale(context.locale);
    const headerMarket = requestMarket(context.market);
    return {
      "X-Arky-Publishable-Key": publishableKey,
      ...(headerLocale ? { "X-Arky-Locale": headerLocale } : {}),
      ...(headerMarket ? { "X-Arky-Market": headerMarket } : {}),
    };
  };
  const httpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage,
    storefrontMode: true,
    forcedHeaders: storefrontHeaders,
    onUnauthorized: ({ authorizationToken, path, response }) => recoverUnauthorized(authorizationToken, path, response),
  });
  const publishableKeyHttpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage: { getTokens: () => null },
    storefrontMode: true,
    forcedHeaders: storefrontHeaders,
    onUnauthorized: () => false,
  });

  const apiConfig: StorefrontApiConfig = { httpClient, publishableKeyHttpClient, apiUrl, publishableKey, authStorage };

  function requireVisitorSessionCapability(): void {
    if (!canCreateVisitorSession) {
      throw new TypeError("Stateful storefront calls during SSR need an explicit request-local sessionStorage adapter");
    }
  }

  async function getSetup(requestOptions?: RequestOptions): Promise<StorefrontSetup> {
    if (setupValue) return setupValue;
    if (setupPromise) return setupPromise;
    setupPromise = httpClient
      .get<StorefrontSetup>("/v1/storefront", requestOptions)
      .then((setup) => {
        setupValue = setup;
        return setup;
      })
      .finally(() => {
        setupPromise = null;
      });
    return setupPromise;
  }

  async function ensureVisitorSession(): Promise<void> {
    if (authorizationToken()) return;
    requireVisitorSessionCapability();
    await identify();
  }

  function newId(label: string): string {
    return requireId(options.createId(), label);
  }

  function newOrderToken(): string {
    const token = options.createOrderToken();
    if (!isOrderToken(token)) {
      throw new TypeError("createOrderToken must answer an order token: 32 random bytes in canonical base64url after arky_ot_");
    }
    return token;
  }

  function pendingKey(flow: string, target: string): string {
    const customerId = memorySession?.customer.id;
    if (!customerId) throw new ArkyError("no_session", "A retry-safe create needs the customer session first");
    return durableCreateKey(storageKey, flow, customerId, target);
  }

  function verifiedContact(): EmailContact | null {
    const current = memorySession;
    if (!current || current.session.type !== "email_authenticated" || current.customer.type.type !== "verified") return null;
    return current.customer.type.contact;
  }

  const flows: StorefrontFlowContext = {
    newId,
    newOrderToken,
    pendingKey,
    locale(requestOptions) {
      const value = requestLocale(requestOptions?.locale);
      if (!value) throw new TypeError("Set the storefront locale with setContext({ locale }), or pass one with the call");
      return value;
    },
    verifiedContact,
  };

  const storefrontApi = createStorefrontApi(
    apiConfig,
    updateSession,
    { ensureVisitorSession, getSetup },
    {
      namespace: storageKey,
      storage: sessionStorage,
      customerId: () => memorySession?.customer.id ?? null,
      market: () => market || null,
    },
    flows,
  );
  const customerApi = storefrontApi.customer;

  function pickVisitorIdentity(): IdentifyCustomerParams {
    if (pendingVisitorIdentity) return pendingVisitorIdentity;
    const picked = !visitorIdentityConsumed && options.visitorIdentity
      ? options.visitorIdentity
      : options.createVisitorIdentity();
    pendingVisitorIdentity = {
      customer_id: requireId(picked.customer_id, "customer"),
      session_id: requireId(picked.session_id, "customer session"),
    };
    return pendingVisitorIdentity;
  }

  async function identify(params: IdentifyCustomerParams = pickVisitorIdentity()): Promise<CustomerSessionResult> {
    requireVisitorSessionCapability();
    const key = `${params.customer_id}:${params.session_id}`;
    if (identifyPromise && identifyKey === key) return identifyPromise;
    const promise = identityTail.then(() => customerApi.identify(params)).then((result) => {
      visitorIdentityConsumed = true;
      if (pendingVisitorIdentity?.customer_id === params.customer_id && pendingVisitorIdentity.session_id === params.session_id) pendingVisitorIdentity = null;
      return result;
    });
    identityTail = promise.then(
      () => undefined,
      () => undefined,
    );
    {
      identifyKey = key;
      identifyPromise = promise;
      void promise.then(
        () => {
          if (identifyPromise === promise) identifyPromise = null;
        },
        () => {
          if (identifyPromise === promise) identifyPromise = null;
        },
      );
    }
    return promise;
  }

  async function requestCode(params: RequestCustomerCodeParams): Promise<CustomerCodeResult> {
    requireVisitorSessionCapability();
    if (params.id !== undefined) requireId(params.id, "sign-in email");
    await ensureVisitorSession();
    const send = (id: string) =>
      customerApi.requestCode({ id, contact: params.contact, bot_check_token: params.bot_check_token });
    const result =
      params.id !== undefined
        ? await send(params.id)
        : await runDurableCreate({
            key: pendingKey("sign-in-email", ""),
            label: "sign-in code request",
            input: { contact: { email: params.contact.email, language: params.contact.language } },
            newId: () => newId("sign-in email"),
            send,
            confirms: () => true,
          });
    identifyPromise = null;
    return result;
  }

  async function verify(params: VerifyCustomerCodeParams): Promise<CustomerSessionResult> {
    requireVisitorSessionCapability();
    await ensureVisitorSession();
    pendingVerifySessionId ??= requireId(options.createSessionId(), "customer session");
    const sessionId = pendingVerifySessionId;
    try {
      const result = await customerApi.verify({ session_id: sessionId, code: params.code });
      pendingVerifySessionId = null;
      identifyPromise = null;
      return result;
    } catch (error) {
      if (isDefiniteRefusal(error)) pendingVerifySessionId = null;
      throw error;
    }
  }

  async function changeEmail(params: ChangeCustomerEmailParams, options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    const requested = memorySession;
    const result = await customerApi.changeEmail(params, options);
    applyAnsweredCustomer(requested, result);
    identifyPromise = null;
    return result;
  }

  async function refresh(params: RefreshCustomerSessionParams): Promise<CustomerSessionResult> {
    requireVisitorSessionCapability();
    const result = await customerApi.refresh(params);
    identifyPromise = null;
    return result;
  }

  function applyAnsweredCustomer(requested: CustomerSessionInternal | null, result: CustomerMe): void {
    const customer = result.customer;
    const current = memorySession;
    if (
      !requested ||
      !current ||
      current.session.id !== requested.session.id ||
      current.customer.id !== requested.customer.id ||
      customer.id !== requested.customer.id ||
      result.session.id !== requested.session.id ||
      result.session.customer_id !== requested.customer.id ||
      result.session.store_id !== requested.customer.store_id
    ) {
      return;
    }
    updateSession((previous) => (previous ? { ...previous, customer } : previous));
  }

  async function me(options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    const requested = memorySession;
    const result = await customerApi.getMe(options);
    applyAnsweredCustomer(requested, result);
    return result;
  }

  async function updateMe(params: UpdateCustomerMeParams, options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    const requested = memorySession;
    const result = await customerApi.updateMe(params, options);
    applyAnsweredCustomer(requested, result);
    return result;
  }

  async function resubscribe(options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    return customerApi.resubscribe(options);
  }

  async function unsubscribe(options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    return customerApi.unsubscribe(options);
  }

  async function logout(): Promise<void> {
    identifyPromise = null;
    if (!authorizationToken()) {
      updateSession(() => null);
      return;
    }
    try {
      await customerApi.logout();
    } catch {
      updateSession(() => null);
    }
  }

  async function requestNewsletterCode(params: RequestNewsletterCodeParams): Promise<RequestNewsletterCodeResult> {
    const signedIn = verifiedContact();
    if (signedIn !== null && sameEmail(signedIn.email, params.contact.email)) return { type: "verified" };
    if (memorySession?.session.type === "email_authenticated") await logout();
    await requestCode({ contact: params.contact, bot_check_token: params.bot_check_token });
    return { type: "code_sent" };
  }

  async function joinNewsletter(params: JoinNewsletterParams, requestOptions?: RequestOptions): Promise<JoinFreeCustomerGroupResult> {
    if (params.code !== undefined) {
      const result = await verify({ code: params.code });
      const email = result.customer.type.type === "verified" ? result.customer.type.contact.email : null;
      if (result.session.type !== "email_authenticated" || email === null || !sameEmail(email, params.email)) {
        throw new CustomerGroupJoinError("email_mismatch", "The code confirmed another email address; start again");
      }
    }
    const signedIn = verifiedContact();
    if (signedIn === null || !sameEmail(signedIn.email, params.email)) {
      throw new CustomerGroupJoinError("sign_in_required", "Confirm the email address with its code first");
    }
    return storefrontApi.eshop.customerGroup.joinFree(
      "id" in params
        ? { id: params.id, catalog_id: params.catalog_id, language: params.language }
        : { key: params.key, catalog_id: params.catalog_id, language: params.language },
      requestOptions,
    );
  }

  function setMarket(value: string): void {
    market = contextKey(value, "market");
    identifyPromise = null;
  }

  function setLocale(value: string): void {
    locale = value.trim();
  }

  function setContext(context: StorefrontContext): void {
    if (context.locale !== undefined) setLocale(context.locale);
    if (context.market !== undefined) setMarket(context.market);
  }

  recoverUnauthorized = async (failedAuthorizationToken: string | null, path: string, response: { status: number; data: unknown }) => {
    if (!failedAuthorizationToken) return false;
    const currentToken = authorizationToken();
    if (currentToken !== failedAuthorizationToken) {
      if (currentToken) return true;
      if (!visitorRecoveryPromise) return false;
      await visitorRecoveryPromise;
      return Boolean(authorizationToken());
    }
    if (memorySession?.session.type === "email_authenticated") {
      try {
        if (!automaticRefreshPromise) {
          const refreshSessionId = automaticRefreshId ?? requireId(options.createSessionId(), "customer session");
          automaticRefreshId = refreshSessionId;
          automaticRefreshPromise = refresh({ session_id: refreshSessionId }).then((result) => {
            automaticRefreshId = null;
            return result;
          }).finally(() => { automaticRefreshPromise = null; });
        }
        await automaticRefreshPromise;
        return true;
      } catch (error) {
        automaticRefreshId = null;
        if (!(error instanceof ArkyApiError) || !refusedByArky({ status: error.statusCode, data: error.response })) throw error;
        if (authorizationToken() === failedAuthorizationToken) updateSession(() => null);
        return false;
      }
    }
    if (!refusedByArky(response)) return false;
    updateSession(() => null);
    if (/\/customer\/identify$/.test(path)) return true;
    const recovery = ensureVisitorSession();
    const trackedRecovery = recovery.finally(() => {
      if (visitorRecoveryPromise === trackedRecovery) visitorRecoveryPromise = null;
    });
    visitorRecoveryPromise = trackedRecovery;
    await trackedRecovery;
    return true;
  };

  return {
    get session(): StorefrontCustomerSession | null {
      return toPublic(memorySession);
    },

    get hasSession(): boolean {
      return Boolean(authorizationToken());
    },

    get isAuthenticated(): boolean {
      return memorySession?.session.status.type === "active" && memorySession.session.type === "email_authenticated";
    },

    onAuthStateChanged(listener: AuthStateListener<StorefrontCustomerSession>): () => void {
      listeners.add(listener);
      const current = toPublic(memorySession);
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(() => {});
      }
      return () => {
        listeners.delete(listener);
      };
    },

    store: storefrontApi.store,
    category: storefrontApi.category,
    media: storefrontApi.media,
    content: storefrontApi.content,
    forms: storefrontApi.forms,
    eshop: storefrontApi.eshop,
    companies: storefrontApi.companies,
    customer: {
      identify,
      requestCode,
      verify,
      changeEmail,
      refresh,
      logout,
      getMe: me,
      updateMe,
      resubscribe,
      unsubscribe,
    },
    newsletter: {
      requestCode: requestNewsletterCode,
      join: joinNewsletter,
    },
    actions: storefrontApi.actions,
    experiments: storefrontApi.experiments,
    pageViews: createStorefrontPageViewsApi(apiConfig),
    support: createStorefrontSupportApi(httpClient, ensureVisitorSession, flows),
    broadcast: createStorefrontBroadcastApi(publishableKeyHttpClient),
    getSetup,
    setContext,
    getMarket: () => market,
    getLocale: () => locale,
  };
}

export type StorefrontClient = ReturnType<typeof createStorefrontClientCore>;

export function createStorefront(publishableKey: string, options: StorefrontOptions): StorefrontClient {
  return createStorefrontClientCore(publishableKey, options);
}

export { createOrderToken, isOrderToken, retainOrderToken, replaceOrderToken, readOrderToken } from "./utils/orderToken";
