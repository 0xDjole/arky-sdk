import { createAdminSessionState } from "./services/adminSession";
import { createHttpClient } from "./services/createHttpClient";
import type { AuthStorage, HttpClientConfig } from "./types/httpClient";
import type { RequestOptions } from "./types/api";
import type {
  AdminSessionInternal,
  AdminSessionUpdater,
  ApiConfig,
  StorefrontApiConfig,
} from "./services/clientTypes";
import type {
  Customer,
  CustomerCodeResult,
  CustomerMe,
  CustomerSessionIssued,
  CustomerSessionResult,
  CustomerSessionStatus,
  UpdateCustomerMeParams,
} from "./types/customer";
import type { StorefrontSetup } from "./types/storefront";
import { createAccountApi } from "./api/account";
import { createActionsApi } from "./api/actions";
import { createAnalyticsApi } from "./api/analytics";
import { createAuthApi } from "./api/auth";
import { createBookingOfferingApi, createBookingResourceApi, createBookingServiceApi } from "./api/booking";
import { createBroadcastApi } from "./api/broadcast";
import { createCartApi } from "./api/cart";
import { createCatalogAccessApi, createCatalogApi, createCatalogItemApi, createPriceApi } from "./api/catalog";
import { createCategoryApi } from "./api/category";
import {
  createCompanyApi,
  createCompanyLocationApi,
  createCompanyMembershipApi,
  createCompanyRoleApi,
} from "./api/company";
import { createCollectionApi, createEntryApi } from "./api/content";
import { createCustomerGroupApi, createCustomerGroupMemberApi } from "./api/customerGroup";
import { createCustomersApi } from "./api/customers";
import { createDigitalAssetApi } from "./api/digitalAsset";
import { createEmailSuppressionApi } from "./api/emailSuppression";
import { createExperimentsApi } from "./api/experiments";
import { createFormsApi } from "./api/forms";
import { createFulfillmentApi, createFulfillmentJobApi, createFulfillmentRoutingApi } from "./api/fulfillment";
import { createInventoryItemApi } from "./api/inventoryItem";
import { createInventoryLevelApi } from "./api/inventoryLevel";
import { createInventoryMovementApi } from "./api/inventoryMovement";
import { createInventoryUnitApi } from "./api/inventoryUnit";
import { createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createMediaApi } from "./api/media";
import {
  createCompanyNoteApi,
  createCustomerNoteApi,
  createFormSubmissionNoteApi,
  createOrderNoteApi,
} from "./api/note";
import {
  createEmailDomainApi,
  createEmailSenderApi,
  createEmailTemplateApi,
  createNotificationApi,
} from "./api/notification";
import { createOrderApi } from "./api/order";
import { createPaymentApi, createProviderEventApi } from "./api/payment";
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
import { createStorefrontClientApi } from "./api/storefrontClient";
import { createStoreRoleApi } from "./api/storeRole";
import {
  createStorefrontApi,
  type CustomerSessionInternal,
  type CustomerSessionUpdater,
  type RequestCustomerCodeParams,
  type VerifyCustomerCodeParams,
} from "./api/storefront";
import {
  createSubscriptionApi,
  createSubscriptionOfferingApi,
  createSubscriptionPlanApi,
} from "./api/subscription";
import { createAdminSupportApi, createStorefrontSupportApi } from "./api/support";
import { createTaxCategoryApi } from "./api/taxCategory";
import { createWebhookApi } from "./api/webhook";
import { createZoneApi } from "./api/zone";
import {
  blockContent,
  collectBlockReferences,
  extractBlockValues,
  findBlock,
  formatBlockValue,
  getBlockContentValue,
  getBlockFromArray,
  getBlockLabel,
  getBlockObjectValues,
  getBlockTextValue,
  getBlockValue,
  getBlockValues,
  getImageUrl,
  selectLocalizedText,
} from "./utils/blocks";
import {
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
import { validatePhoneNumber } from "./utils/validation";
import { findTimeZone, tzGroups } from "./utils/timezone";
import { categorify, formatDate, humanize, slugify } from "./utils/text";
import { fetchSvgContent, getSvgContentForAstro, injectSvgIntoElement } from "./utils/svg";
import { isValidKey, nameToKey, toKey, validateKey } from "./utils/keyValidation";

export type * from "./types";
export {
  CURRENCY_MINOR_UNITS,
  WEBHOOK_UNIT_EVENT_TYPES,
  TYPED_CUSTOMER_ACTION_KEYS,
  BROADCAST_FIELDS,
  BROADCAST_BLOCK_FIELD_PREFIXES,
  cartProductItems,
  cartBookingItems,
  cartSubscriptionPlanItems,
  orderLineItemsOfType,
  orderProductItems,
  orderBookingItems,
  orderSubscriptionPlanItems,
  orderRentalUseItems,
  orderPurchaseAccessItems,
  MonriCheckoutError,
  CartPresentationChangedError,
  CartSelectionError,
  FulfillmentSelectionError,
} from "./types";
export type { AdminLogoutResult } from "./services/adminSession";
export type { AdminSessionInternal, AdminSessionUpdater, ApiConfig, StorefrontApiConfig } from "./services/clientTypes";
export type * from "./api/analytics";
export type { GetCountriesResponse } from "./api/location";
export type { RecordNoteApi } from "./api/note";
export type { FindAdminRentalReturnOptionsParams } from "./api/return";
export {
  COMMON_CUSTOMER_ACTION_KEYS,
} from "./api/storefront";
export type {
  CommonCustomerActionKey,
  CustomerSessionInternal,
  CustomerSessionUpdater,
  IdentifyCustomerParams,
  RequestCustomerCodeParams,
  StorefrontLifecycle,
  VerifyCustomerCodeParams,
} from "./api/storefront";
export { ScheduledResultTimeoutError } from "./utils/scheduledResult";
export { isValidKey, validateKey, toKey, nameToKey } from "./utils/keyValidation";
export {
  epochMilliseconds,
  epochMillisecondsFromDate,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "./utils/time";
export { isCanonicalId, requireId } from "./utils/ids";
export {
  blockContent,
  collectBlockReferences,
  getBlockContentValue,
  getBlockTextValue,
  getImageUrl,
  selectLocalizedText,
} from "./utils/blocks";
export type { BlockReferences } from "./utils/blocks";
export { createStripeEmbeddedCheckout, mountCheckoutAction, mountPaymentMethodSetup } from "./checkout";
export type { PaymentMethodSetupMount } from "./checkout";
export { createCartController } from "./cartController";
export { buildFormAnswers, initialize } from "./storefrontStore";
export type * from "./storefrontStore";

export const SDK_VERSION = "0.26.85";
export const SUPPORTED_FRAMEWORKS = ["astro", "react", "vue", "svelte", "vanilla"] as const;

export interface AdminSession {
  id: string;
  email?: string;
}

export interface StorefrontCustomerSession {
  customer: Customer;
  id: string;
  type: CustomerSessionIssued["type"];
  status: CustomerSessionStatus;
}

export type AuthStateListener<T> = (session: T | null) => void;

function createUtilitySurface() {
  return {
    getImageUrl,
    findBlock,
    blockContent,
    getBlockValue,
    getBlockTextValue,
    getBlockContentValue,
    getBlockValues,
    getBlockLabel,
    getBlockObjectValues,
    getBlockFromArray,
    formatBlockValue,
    extractBlockValues,
    collectBlockReferences,
    selectLocalizedText,
    formatPrice,
    formatMoney,
    formatMinor,
    getPriceAmount,
    getCurrencySymbol,
    getCurrencyName,
    getCurrencyMinorUnits,
    convertToMajor,
    convertToMinor,
    validatePhoneNumber,
    tzGroups,
    findTimeZone,
    slugify,
    humanize,
    categorify,
    formatDate,
    getSvgContentForAstro,
    fetchSvgContent,
    injectSvgIntoElement,
    isValidKey,
    validateKey,
    toKey,
    nameToKey,
  };
}

export type CreateAdminConfig = Omit<HttpClientConfig, "authStorage" | "refreshCredentials"> & {
  apiToken?: string;
};

export function createAdmin(config: CreateAdminConfig) {
  const sessionState = createAdminSessionState(config.baseUrl, config.refreshPath);
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
    if (config.apiToken) return;
    writeAdminSession(updater(readAdminSession()));
    emit();
  };

  const apiToken = config.apiToken;
  const authStorage: AuthStorage = apiToken
    ? {
        getTokens: () => ({ access_token: apiToken }),
        onTokensRefreshed: () => {},
        onForcedLogout: () => {},
      }
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
        onTokensRefreshed() {},
        onForcedLogout() {},
      };

  const httpClient = createHttpClient({
    baseUrl: config.baseUrl,
    refreshPath: config.refreshPath,
    refreshCredentials: apiToken ? undefined : sessionState.refresh,
    onUnauthorized: apiToken ? () => false : config.onUnauthorized,
    navigate: config.navigate,
    loginFallbackPath: config.loginFallbackPath,
    authStorage,
  });

  const apiConfig: ApiConfig = { httpClient, baseUrl: config.baseUrl, authStorage };
  const authHttpClient = createHttpClient({
    baseUrl: config.baseUrl,
    authStorage: { getTokens: () => null, onTokensRefreshed() {}, onForcedLogout() {} },
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
      role: createStoreRoleApi(apiConfig),
      webhook: createWebhookApi(apiConfig),
      location: createLocationApi(apiConfig),
      market: createMarketApi(apiConfig),
      salesChannel: createSalesChannelApi(apiConfig),
      storefrontClient: createStorefrontClientApi(apiConfig),
      paymentOption: createPaymentOptionApi(apiConfig),
      zone: createZoneApi(apiConfig),
      taxCategory: createTaxCategoryApi(apiConfig),
      shippingProfile: createShippingProfileApi(apiConfig),
      shippingMethod: createShippingMethodApi(apiConfig),
    },
    notification: {
      ...createNotificationApi(apiConfig),
      template: createEmailTemplateApi(apiConfig),
      emailDomain: createEmailDomainApi(apiConfig),
      emailSender: createEmailSenderApi(apiConfig),
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
    analytics: createAnalyticsApi(apiConfig),
    eshop: {
      product: createProductApi(apiConfig),
      productVariant: createProductVariantApi(apiConfig),
      digitalAsset: createDigitalAssetApi(apiConfig),
      bookingService: createBookingServiceApi(apiConfig),
      bookingResource: createBookingResourceApi(apiConfig),
      bookingOffering: createBookingOfferingApi(apiConfig),
      price: createPriceApi(apiConfig),
      catalog: createCatalogApi(apiConfig),
      catalogItem: createCatalogItemApi(apiConfig),
      catalogAccess: createCatalogAccessApi(apiConfig),
      promotion: createPromotionApi(apiConfig),
      promotionCode: createPromotionCodeApi(apiConfig),
      customerGroup: createCustomerGroupApi(apiConfig),
      customerGroupMember: createCustomerGroupMemberApi(apiConfig),
      subscriptionOffering: createSubscriptionOfferingApi(apiConfig),
      subscriptionPlan: createSubscriptionPlanApi(apiConfig),
      subscription: createSubscriptionApi(apiConfig),
      paymentMethod: createPaymentMethodApi(apiConfig),
      payment: createPaymentApi(apiConfig),
      providerEvent: createProviderEventApi(apiConfig),
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
      return: createReturnApi(apiConfig),
      rental: createRentalApi(apiConfig),
    },

    get session(): AdminSession | null {
      if (apiToken) return null;
      return toPublic(readAdminSession());
    },

    get isAuthenticated(): boolean {
      if (apiToken) return true;
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
      if (apiToken) return { type: "api_token" };
      const result = await sessionState.logout();
      emit();
      return result;
    },

    utils: createUtilitySurface(),
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
  salesChannel?: string;
}

export interface StorefrontOptions extends StorefrontContext {
  apiUrl?: string;
  sessionStorage?: StorefrontSessionStorage;
}

export const DEFAULT_STOREFRONT_API_URL = "https://api.arky.io";
let storefrontScopeSequence = 0;

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
    throw new Error("Storefront apiUrl must be a valid HTTP(S) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Storefront apiUrl must use HTTP or HTTPS");
  }
  return input.replace(/\/+$/, "");
}

function validatePublishableKey(publishableKey: string): string {
  const message = "A valid Arky publishable key is required (arky_pk_ followed by 43 URL-safe characters)";
  if (typeof publishableKey !== "string") throw new Error(message);
  const key = publishableKey.trim();
  if (!/^arky_pk_[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(key)) throw new Error(message);
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
  return `arky_customer_session:v3:${encodeURIComponent(apiUrl.toLowerCase())}:${publishableKeyFingerprint(publishableKey)}`;
}

interface StoredCustomerSession {
  version: 3;
  customer: Customer;
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

function isStoredCustomer(value: unknown): value is Customer {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
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
      parsed.version !== 3 ||
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
  if (key && !isValidKey(key)) throw new Error(`The ${label} must be a valid exact key`);
  return key;
}

function createStorefrontClientCore(publishableKeyInput: string, options: StorefrontOptions = {}, isolatedSession = false) {
  const publishableKey = validatePublishableKey(publishableKeyInput);
  const apiUrl = normalizeStorefrontApiUrl(options.apiUrl);
  let locale = options.locale?.trim() ?? "";
  let market = contextKey(options.market, "market");
  let salesChannel = contextKey(options.salesChannel, "sales channel");
  const listeners = new Set<AuthStateListener<StorefrontCustomerSession>>();
  let identifyPromise: Promise<CustomerSessionResult> | null = null;
  let identityTail: Promise<void> = Promise.resolve();
  let setupPromise: Promise<StorefrontSetup> | null = null;
  let setupValue: StorefrontSetup | null = null;
  const explicitSessionStorage = options.sessionStorage;
  const sessionStorage = isolatedSession
    ? explicitSessionStorage || null
    : explicitSessionStorage || defaultStorefrontSessionStorage();
  const canCreateVisitorSession = typeof window !== "undefined" || Boolean(explicitSessionStorage);
  const storageSuffix = isolatedSession ? `:scope:${++storefrontScopeSequence}` : "";
  const storageKey = `${storefrontSessionStorageKey(apiUrl, publishableKey)}${storageSuffix}`;
  let memorySession: CustomerSessionInternal | null = null;

  if (sessionStorage) {
    try {
      const stored = sessionStorage.getItem(storageKey);
      memorySession = parseStoredCustomerSession(stored);
      if (stored && !memorySession) sessionStorage.removeItem(storageKey);
    } catch {}
  }

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
        const stored: StoredCustomerSession = { version: 3, customer: session.customer, session: session.session };
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
    writeCustomerSession(updater(memorySession));
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
    onTokensRefreshed() {},
    onForcedLogout() {
      identifyPromise = null;
      updateSession(() => null);
    },
  };

  let recoverUnauthorized: (authorizationToken: string | null, path: string) => Promise<boolean> = async () => false;
  let visitorRecoveryPromise: Promise<void> | null = null;

  const storefrontHeaders = (): Record<string, string> => ({
    "X-Arky-Publishable-Key": publishableKey,
    ...(locale ? { "X-Arky-Locale": locale } : {}),
    ...(market ? { "X-Arky-Market": market } : {}),
    ...(salesChannel ? { "X-Arky-Sales-Channel": salesChannel } : {}),
  });
  const httpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage,
    storefrontMode: true,
    forcedHeaders: storefrontHeaders,
    onUnauthorized: ({ authorizationToken, path }) => recoverUnauthorized(authorizationToken, path),
  });
  const publishableKeyHttpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage: { getTokens: () => null, onTokensRefreshed: () => {}, onForcedLogout: () => {} },
    storefrontMode: true,
    forcedHeaders: storefrontHeaders,
    onUnauthorized: () => false,
  });

  const apiConfig: StorefrontApiConfig = { httpClient, publishableKeyHttpClient, apiUrl, publishableKey, authStorage };

  function requireVisitorSessionCapability(): void {
    if (!canCreateVisitorSession) {
      throw new Error("Stateful storefront calls during SSR need an explicit request-local sessionStorage adapter");
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

  const storefrontApi = createStorefrontApi(
    apiConfig,
    updateSession,
    { ensureVisitorSession, getSetup },
    {
      namespace: storageKey,
      storage: sessionStorage,
      customerId: () => memorySession?.customer.id ?? null,
      market: () => market || null,
      salesChannel: () => salesChannel || null,
    },
  );
  const customerApi = storefrontApi.customer;

  async function identify(params: { email?: string } = {}): Promise<CustomerSessionResult> {
    requireVisitorSessionCapability();
    const isBareCall = !params.email;
    if (isBareCall && identifyPromise) return identifyPromise;
    const promise = identityTail.then(() => customerApi.identify(params));
    identityTail = promise.then(
      () => undefined,
      () => undefined,
    );
    if (isBareCall) {
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
    await ensureVisitorSession();
    const result = await customerApi.requestCode(params);
    identifyPromise = null;
    return result;
  }

  async function verify(params: VerifyCustomerCodeParams): Promise<CustomerSessionResult> {
    requireVisitorSessionCapability();
    await ensureVisitorSession();
    const result = await customerApi.verify(params);
    identifyPromise = null;
    return result;
  }

  async function refresh(): Promise<CustomerSessionResult> {
    requireVisitorSessionCapability();
    const result = await customerApi.refresh();
    identifyPromise = null;
    return result;
  }

  function applyAnsweredCustomer(requested: CustomerSessionInternal | null, customer: Customer): void {
    const current = memorySession;
    if (
      !requested ||
      !current ||
      current.session.id !== requested.session.id ||
      current.customer.id !== requested.customer.id ||
      customer.id !== requested.customer.id
    ) {
      return;
    }
    updateSession((previous) => (previous ? { ...previous, customer } : previous));
  }

  async function me(options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    const requested = memorySession;
    const result = await customerApi.getMe(options);
    applyAnsweredCustomer(requested, result.customer);
    return result;
  }

  async function updateMe(params: UpdateCustomerMeParams, options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    const requested = memorySession;
    const result = await customerApi.updateMe(params, options);
    applyAnsweredCustomer(requested, result.customer);
    return result;
  }

  async function resubscribe(options?: RequestOptions): Promise<CustomerMe> {
    await ensureVisitorSession();
    return customerApi.resubscribe(options);
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

  function setMarket(value: string): void {
    market = contextKey(value, "market");
    identifyPromise = null;
  }

  function setSalesChannel(value: string): void {
    salesChannel = contextKey(value, "sales channel");
    identifyPromise = null;
  }

  function setLocale(value: string): void {
    locale = value.trim();
  }

  function setContext(context: StorefrontContext): void {
    if (context.locale !== undefined) setLocale(context.locale);
    if (context.market !== undefined) setMarket(context.market);
    if (context.salesChannel !== undefined) setSalesChannel(context.salesChannel);
  }

  recoverUnauthorized = async (failedAuthorizationToken: string | null, path: string) => {
    if (!failedAuthorizationToken) return false;
    const currentToken = authorizationToken();
    if (currentToken !== failedAuthorizationToken) {
      if (currentToken) return true;
      if (!visitorRecoveryPromise) return false;
      await visitorRecoveryPromise;
      return Boolean(authorizationToken());
    }
    if (/\/customer\/refresh$/.test(path)) {
      updateSession(() => null);
      return false;
    }
    if (memorySession?.session.type === "email_authenticated") {
      try {
        await refresh();
        return true;
      } catch {
        updateSession(() => null);
        return false;
      }
    }
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
      refresh,
      logout,
      getMe: me,
      updateMe,
      resubscribe,
    },
    subscription_offerings: storefrontApi.subscription_offerings,
    subscription_plans: storefrontApi.subscription_plans,
    actions: storefrontApi.actions,
    experiments: storefrontApi.experiments,
    support: createStorefrontSupportApi(httpClient, ensureVisitorSession),
    getSetup,
    setContext,
    setMarket,
    getMarket: () => market,
    setSalesChannel,
    getSalesChannel: () => salesChannel,
    setLocale,
    getLocale: () => locale,
    utils: createUtilitySurface(),
  };
}

type StorefrontClientCore = ReturnType<typeof createStorefrontClientCore>;

export type StorefrontClient = StorefrontClientCore & {
  withContext(context: StorefrontContext): StorefrontClient;
};

function createStorefrontClient(publishableKey: string, options: StorefrontOptions = {}, isolatedSession = false): StorefrontClient {
  const client = createStorefrontClientCore(publishableKey, options, isolatedSession);
  return Object.assign(client, {
    withContext(context: StorefrontContext): StorefrontClient {
      return createStorefrontClient(
        publishableKey,
        {
          ...options,
          locale: context.locale ?? client.getLocale(),
          market: context.market ?? client.getMarket(),
          salesChannel: context.salesChannel ?? client.getSalesChannel(),
        },
        true,
      );
    },
  });
}

export function createStorefront(publishableKey: string, options: StorefrontOptions = {}): StorefrontClient {
  return createStorefrontClient(publishableKey, options);
}
