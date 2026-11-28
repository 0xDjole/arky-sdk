import { ArkyApiError, ArkyError } from "./types/apiError";
import { requireId } from "./utils/ids";
import { isRecord } from "./utils/record";
import { isEpochMilliseconds } from "./utils/time";
import { isDefiniteRefusal } from "./utils/durableRequest";
import { isOrderToken } from "./utils/orderToken";
import { createAdminSessionState } from "./services/adminSession";
import { exclusive } from "./services/sessionLock";
import { shareRequest, type SharedRequest } from "./services/sharedRequest";
import { createHttpClient, refusedByArky } from "./services/createHttpClient";
import { durableCreateKey, runDurableCreate } from "./services/durableCreate";
import type { AuthStorage, HttpClientConfig, RequestContextOverride } from "./types/httpClient";
import type { AdminRequestOptions, RequestOptions } from "./types/api";
import type {
  AdminSessionInternal,
  AdminSessionUpdater,
  ApiConfig,
  StorefrontApiConfig,
  StorefrontFlowContext,
} from "./services/clientTypes";
import {
  PackageJoinError,
  type JoinFreePackageResult,
  type JoinNewsletterParams,
  type RequestNewsletterCodeParams,
  type RequestNewsletterCodeResult,
} from "./types/packageJoin";
import type {
  AddOwnContactParams,
  OwnContactParams,
  OwnLinkRemoved,
  RemoveOwnContactParams,
  StorefrontUser,
  UserCodeResult,
  UserMe,
  UserSessionIssued,
  UserSessionResult,
  NetworkUserTenantKeyStatus,
  TenantUserSignedInByEmailStatus,
  TenantUserSignedInByPhoneStatus,
  UpdateUserMeParams,
  UpdateOwnContactParams,
  VerifyOwnContactParams,
  VisitorStatus,
} from "./types/user";
import type { LoginAddress } from "./types/account";
import type { NetworkUserTenantKey } from "./types/networkUser";
import { CartError } from "./types/cartSelection";
import type { StorefrontMarket, StorefrontSetup } from "./types/storefront";
import type { EmailContact } from "./types/common";
import { createAccountApi } from "./api/account";
import { createActionsApi } from "./api/actions";
import { createAuditLogApi } from "./api/auditLog";
import { createCountsApi } from "./api/counts";
import { createAuthApi } from "./api/auth";
import { createBookingOfferingApi, createBookingResourceApi, createBookingServiceApi } from "./api/booking";
import { createBroadcastApi, createStorefrontBroadcastApi } from "./api/broadcast";
import { createCartApi } from "./api/cart";
import { createCategoryApi } from "./api/category";
import {
  createCompanyApi,
  createCompanyLocationApi,
  createCompanyMembershipApi,
  createCompanyRoleApi,
} from "./api/company";
import { createCollectionApi, createEntryApi } from "./api/content";
import { createPrivateCollectionApi, createPrivateEntryApi } from "./api/privateContent";
import { createUsersApi } from "./api/users";
import { createDigitalAssetApi } from "./api/digitalAsset";
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
import { createLayoutApi } from "./api/layout";
import { createCountryApi, createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createMediaApi } from "./api/media";
import {
  createCompanyNoteApi,
  createUserNoteApi,
  createFormSubmissionNoteApi,
  createOrderNoteApi,
} from "./api/note";
import {
  createEmailAddressApi,
  createEmailLayoutApi,
  createNotificationApi,
  createOutgoingMessageApi,
  createOutgoingWebhookApi,
  createTenantResendEventApi,
  createTemplateApi,
} from "./api/notification";
import { createOrderApi } from "./api/order";
import { createInvoiceApi, createInvoiceCounterApi, createTenantInvoicingApi, createTenantSellerApi } from "./api/invoice";
import { createFiscalDeviceApi } from "./api/fiscalDevice";
import { createFiscalReceiptApi } from "./api/fiscalReceipt";
import { createPackageAccessApi, createPackageApi, createPackageItemApi, createPackageItemPriceApi } from "./api/package";
import { createPackageMemberApi, createPackageOfferingApi } from "./api/packageMember";
import { createPaymentApi, createIncomingWebhookApi } from "./api/payment";
import { createPaymentMethodApi } from "./api/paymentMethod";
import { createPaymentOptionApi } from "./api/paymentOption";
import { createPhoneNumberApi } from "./api/phoneNumber";
import { createNetworkApi } from "./api/network";
import { createPlatformApi } from "./api/platform";
import { createProductApi, createProductVariantApi } from "./api/product";
import { createPromotionApi, createPromotionCodeApi } from "./api/promotion";
import { createRentalApi } from "./api/rental";
import { createReturnApi } from "./api/return";
import { createSalesChannelApi } from "./api/salesChannel";
import { createShippingMethodApi } from "./api/shippingMethod";
import { createShippingProfileApi } from "./api/shippingProfile";
import { createTenantSimulatorApi } from "./api/simulator";
import { createTenantApi } from "./api/tenant";
import { createTenantProviderApi } from "./api/tenantProvider";
import { createUserRoleApi, createTenantAssistantMembershipApi, createTenantRoleApi } from "./api/tenantRole";
import { createSuppressionApi } from "./api/suppression";
import {
  createStorefrontApi,
  type UserSessionUpdater,
  type RefreshUserSessionParams,
  type IdentifyUserParams,
  type RequestUserCodeParams,
  type VerifyUserCodeParams,
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
export { COMMON_USER_ACTION_KEYS } from "./api/storefront";
export type {
  CommonUserActionKey,
  IdentifyUserParams,
  OrderFromLink,
  OrderFromLinkParams,
  RefreshUserSessionParams,
  RequestUserCodeParams,
  StorefrontCheckoutCartRequest,
  VerifyUserCodeParams,
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
export { DurableRequestError, isDefiniteRefusal, refusalClearsKeptRequest } from "./utils/durableRequest";
export type { DurableRequestErrorCode } from "./utils/durableRequest";
export { paginate, readAllPages } from "./utils/paginate";
export type { PageRead, PaginateOptions } from "./utils/paginate";
export { latestPayment, paymentOutcome } from "./utils/paymentOutcome";
export type { PaymentOutcome } from "./utils/paymentOutcome";
export { disputeWithdrawnAmount, paymentAmounts, refundAmounts } from "./utils/paymentAmounts";
export type { PaymentAmounts, PaymentRefundView } from "./utils/paymentAmounts";
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
export { createNetworkUser } from "./networkUser";
export type { NetworkUserClient } from "./networkUser";

export const SDK_VERSION = "0.26.146";

export interface AdminSession {
  id: string;
  email?: string;
}

export type StorefrontLogoutResult =
  | { type: "revoked"; session_id: string }
  | { type: "unconfirmed"; session_id: string }
  | { type: "local_only" };

export type StorefrontUserSession = {
  user: StorefrontUser;
  id: string;
  signed_in_with: LoginAddress | null;
} & (
  | { type: "visitor"; status: VisitorStatus }
  | { type: "tenant_user_signed_in_by_email"; status: TenantUserSignedInByEmailStatus }
  | { type: "tenant_user_signed_in_by_phone"; status: TenantUserSignedInByPhoneStatus }
  | { type: "network_user_tenant_key"; status: NetworkUserTenantKeyStatus }
);

export type AuthStateListener<T> = (session: T | null) => void;

function reportListenerFailure(error: unknown): void {
  console.error("An Arky auth state listener failed", error);
}

export interface CreateAdminConfig {
  apiUrl: string;
  accountToken?: string;
  refreshPath?: string | (() => string);
  forcedHeaders?: HttpClientConfig["forcedHeaders"];
  onUnauthorized?: HttpClientConfig["onUnauthorized"];
}

function validateAccountToken(accountToken: string): string {
  const message = "A valid Arky account token is required (arky_at_ followed by 43 URL-safe characters)";
  if (typeof accountToken !== "string") throw new TypeError(message);
  const token = accountToken.trim();
  if (!/^arky_at_[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(token)) throw new TypeError(message);
  return token;
}

function createAdminClient(config: CreateAdminConfig) {
  const accountToken = config.accountToken === undefined ? null : validateAccountToken(config.accountToken);
  const apiUrl = config.apiUrl.replace(/\/+$/, "");
  const sessionState = createAdminSessionState(apiUrl, config.refreshPath);
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
        .catch(reportListenerFailure);
    }
  }

  const updateSession: AdminSessionUpdater = (updater) => {
    if (accountToken) return;
    writeAdminSession(updater(readAdminSession()));
    emit();
  };

  const authStorage: AuthStorage = accountToken
    ? { getTokens: () => ({ access_token: accountToken }) }
    : {
        getTokens() {
          const session = readAdminSession();
          if (!session) return null;
          return {
            id: session.id,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          };
        },
      };

  const httpClient = createHttpClient({
    baseUrl: apiUrl,
    forcedHeaders: config.forcedHeaders,
    refreshCredentials: accountToken ? undefined : sessionState.refresh,
    onUnauthorized: accountToken ? () => false : config.onUnauthorized,
    authStorage,
  });

  const apiConfig: ApiConfig = { httpClient, baseUrl: apiUrl, authStorage };
  const authHttpClient = createHttpClient({
    baseUrl: apiUrl,
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
    network: createNetworkApi(apiConfig),
    tenant: {
      ...createTenantApi(apiConfig),
      country: createCountryApi(apiConfig),
      role: createTenantRoleApi(apiConfig),
      userRole: createUserRoleApi(apiConfig),
      assistantMembership: createTenantAssistantMembershipApi(apiConfig),
      webhook: createWebhookApi(apiConfig),
      location: createLocationApi(apiConfig),
      market: createMarketApi(apiConfig),
      salesChannel: createSalesChannelApi(apiConfig),
      provider: createTenantProviderApi(apiConfig),
      phoneNumber: createPhoneNumberApi(apiConfig),
      auditLog: createAuditLogApi(apiConfig),
      paymentOption: createPaymentOptionApi(apiConfig),
      simulator: createTenantSimulatorApi(apiConfig),
      zone: createZoneApi(apiConfig),
      taxCategory: createTaxCategoryApi(apiConfig),
      shippingProfile: createShippingProfileApi(apiConfig),
      shippingMethod: createShippingMethodApi(apiConfig),
      seller: createTenantSellerApi(apiConfig),
      invoicing: createTenantInvoicingApi(apiConfig),
      invoiceCounter: createInvoiceCounterApi(apiConfig),
      fiscalDevice: createFiscalDeviceApi(apiConfig),
    },
    notification: {
      notification: createNotificationApi(apiConfig),
      incomingWebhook: createIncomingWebhookApi(apiConfig),
      outgoingMessage: createOutgoingMessageApi(apiConfig),
      outgoingWebhook: createOutgoingWebhookApi(apiConfig),
      template: createTemplateApi(apiConfig),
      layout: createEmailLayoutApi(apiConfig),
      emailAddress: createEmailAddressApi(apiConfig),
      resendEvent: createTenantResendEventApi(apiConfig),
    },
    broadcast: createBroadcastApi(apiConfig),
    support: supportApi,
    media: createMediaApi(apiConfig),
    category: createCategoryApi(apiConfig),
    layout: createLayoutApi(apiConfig),
    content: {
      collection: createCollectionApi(apiConfig),
      entry: createEntryApi(apiConfig),
      privateCollection: createPrivateCollectionApi(apiConfig),
      privateEntry: createPrivateEntryApi(apiConfig),
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
    users: {
      ...createUsersApi(apiConfig),
      suppression: createSuppressionApi(apiConfig),
      notes: createUserNoteApi(apiConfig),
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
      package: createPackageApi(apiConfig),
      packageItem: createPackageItemApi(apiConfig),
      packageItemPrice: createPackageItemPriceApi(apiConfig),
      packageAccess: createPackageAccessApi(apiConfig),
      packageOffering: createPackageOfferingApi(apiConfig),
      packageMember: createPackageMemberApi(apiConfig),
      promotion: createPromotionApi(apiConfig),
      promotionCode: createPromotionCodeApi(apiConfig),
      paymentMethod: createPaymentMethodApi(apiConfig),
      payment: createPaymentApi(apiConfig),
      cart: createCartApi(apiConfig),
      order: {
        ...createOrderApi(apiConfig),
        notes: createOrderNoteApi(apiConfig),
        invoice: createInvoiceApi(apiConfig),
        fiscalReceipt: createFiscalReceiptApi(apiConfig),
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
      if (accountToken) return null;
      return toPublic(readAdminSession());
    },

    getAccessToken(): string | null {
      if (accountToken) return accountToken;
      return readAdminSession()?.access_token ?? null;
    },

    get isAuthenticated(): boolean {
      if (accountToken) return true;
      return readAdminSession() !== null;
    },

    get sessionStorageUnavailable(): boolean {
      return sessionState.isStorageUnavailable();
    },

    onAuthStateChanged(listener: AuthStateListener<AdminSession>): () => void {
      if (accountToken) return () => {};
      listeners.add(listener);
      if (!unsubscribeStorage) unsubscribeStorage = sessionState.subscribe(emit);
      const current = toPublic(readAdminSession());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(reportListenerFailure);
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
      if (accountToken) return { type: "account_token" };
      const result = await sessionState.logout();
      emit();
      return result;
    },
  };
}

type SameType<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type AdminArguments<Args extends readonly unknown[]> = {
  [Index in keyof Args]: SameType<Args[Index], RequestOptions | undefined> extends true ? AdminRequestOptions | undefined : Args[Index];
};

type AdminSurface<Surface> = {
  [Name in keyof Surface]: Surface[Name] extends (...args: infer Args) => infer Answer
    ? (...args: AdminArguments<Args>) => Answer
    : Surface[Name] extends object
      ? AdminSurface<Surface[Name]>
      : Surface[Name];
};

export type AdminClient = AdminSurface<ReturnType<typeof createAdminClient>>;

export function createAdmin(config: CreateAdminConfig): AdminClient {
  return createAdminClient(config);
}

export interface StorefrontSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorefrontContext {
  locale?: string;
  market?: string;
}

export interface StorefrontIdentity {
  tenantId: string;
  salesChannelId: string;
}

export interface StorefrontOptions extends StorefrontContext {
  apiUrl?: string;
  sessionStorage?: StorefrontSessionStorage;
  visitorIdentity?: IdentifyUserParams;
  createVisitorIdentity: () => IdentifyUserParams;
  createSessionId: () => string;
  createId: () => string;
  createOrderToken: () => string;
}

export const DEFAULT_STOREFRONT_API_URL = "https://api.arky.io";

type DefaultSessionStorage =
  | { type: "none" }
  | { type: "refused" }
  | { type: "available"; storage: StorefrontSessionStorage };

function defaultStorefrontSessionStorage(): DefaultSessionStorage {
  if (typeof window === "undefined") return { type: "none" };
  try {
    return { type: "available", storage: window.localStorage };
  } catch {
    return { type: "refused" };
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

function storefrontSessionStorageKey(apiUrl: string, tenantId: string, salesChannelId: string): string {
  return `arky_user_session:v5:${encodeURIComponent(apiUrl)}:${tenantId}:${salesChannelId}`;
}

type StoredUserSession = UserSessionResult & { version: 5 };

function isSignedInByCode(value: Record<string, unknown>): boolean {
  return (
    typeof value.access_token === "string" &&
    value.access_token.startsWith("user_access_") &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.startsWith("user_refresh_") &&
    isEpochMilliseconds(value.access_expires_at) &&
    isEpochMilliseconds(value.refresh_expires_at) &&
    isEpochMilliseconds(value.authenticated_at)
  );
}

function isIssuedUserSession(value: unknown): value is UserSessionIssued {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.user_id !== "string" ||
    !isRecord(value.status) ||
    value.status.type !== "active" ||
    Object.keys(value.status).length !== 1
  ) {
    return false;
  }
  switch (value.type) {
    case "visitor":
      return (
        typeof value.token === "string" && value.token.startsWith("user_visitor_") && isEpochMilliseconds(value.expires_at)
      );
    case "tenant_user_signed_in_by_email":
      return typeof value.email === "string" && isSignedInByCode(value);
    case "tenant_user_signed_in_by_phone":
      return typeof value.number === "string" && isSignedInByCode(value);
    case "network_user_tenant_key":
      return (
        typeof value.access_token === "string" &&
        value.access_token.startsWith("user_tenant_key_") &&
        value.refresh_token === undefined
      );
    default:
      return false;
  }
}

function publicSession({ user, session }: UserSessionResult): StorefrontUserSession {
  switch (session.type) {
    case "visitor":
      return { user, id: session.id, type: session.type, status: session.status, signed_in_with: null };
    case "tenant_user_signed_in_by_email":
      return {
        user,
        id: session.id,
        type: session.type,
        status: session.status,
        signed_in_with: { type: "email", email: session.email },
      };
    case "tenant_user_signed_in_by_phone":
      return {
        user,
        id: session.id,
        type: session.type,
        status: session.status,
        signed_in_with: { type: "phone", number: session.number },
      };
    case "network_user_tenant_key":
      return { user, id: session.id, type: session.type, status: session.status, signed_in_with: null };
  }
}

function hasRefreshToken(session: UserSessionIssued): boolean {
  return session.type === "tenant_user_signed_in_by_email" || session.type === "tenant_user_signed_in_by_phone";
}

function isStoredName(value: unknown): boolean {
  return value === null || (isRecord(value) && typeof value.first_name === "string" && typeof value.last_name === "string");
}

function isStoredOptionalId(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isStoredUser(value: unknown): value is StorefrontUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.tenant_id === "string" &&
    isStoredName(value.name) &&
    Array.isArray(value.links) &&
    Array.isArray(value.contacts) &&
    Array.isArray(value.addresses) &&
    isStoredOptionalId(value.default_shipping_address_id) &&
    isStoredOptionalId(value.default_billing_address_id) &&
    Array.isArray(value.profile) &&
    isEpochMilliseconds(value.created_at) &&
    isEpochMilliseconds(value.updated_at)
  );
}

function parseStoredUserSession(value: string | null): UserSessionResult | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !isRecord(parsed) ||
      parsed.version !== 5 ||
      !isStoredUser(parsed.user) ||
      !isIssuedUserSession(parsed.session) ||
      parsed.session.user_id !== parsed.user.id
    ) {
      return null;
    }
    return { user: parsed.user, session: parsed.session };
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

function createStorefrontClientCore(identity: StorefrontIdentity, suppliedOptions: StorefrontOptions) {
  const tenantId = requireId(identity?.tenantId, "tenant");
  const salesChannelId = requireId(identity?.salesChannelId, "sales channel");
  const options = requireIdFactories(suppliedOptions);
  const apiUrl = normalizeStorefrontApiUrl(options.apiUrl);
  let locale = options.locale?.trim() ?? "";
  let market = contextKey(options.market, "market");
  const listeners = new Set<AuthStateListener<StorefrontUserSession>>();
  let automaticRefreshPromise: Promise<UserSessionResult> | null = null;
  let identifyPromise: Promise<UserSessionResult> | null = null;
  let identifyKey: string | null = null;
  let pendingVerifySessionId: string | null = null;
  let pendingVisitorIdentity: IdentifyUserParams | null = null;
  let visitorIdentityConsumed = false;
  let identityTail: Promise<void> = Promise.resolve();
  let setupRequest: SharedRequest<StorefrontSetup> | null = null;
  let setupValue: StorefrontSetup | null = null;
  const explicitSessionStorage = options.sessionStorage;
  const defaultSessionStorage: DefaultSessionStorage = explicitSessionStorage
    ? { type: "none" }
    : defaultStorefrontSessionStorage();
  const sessionStorage: StorefrontSessionStorage | null =
    explicitSessionStorage ?? (defaultSessionStorage.type === "available" ? defaultSessionStorage.storage : null);
  const sharedWithOtherTabs = !explicitSessionStorage && defaultSessionStorage.type === "available";
  let storageUnavailable = defaultSessionStorage.type === "refused";
  const canCreateVisitorSession = typeof window !== "undefined" || Boolean(explicitSessionStorage);
  const storageKey = storefrontSessionStorageKey(apiUrl, tenantId, salesChannelId);
  let memorySession: UserSessionResult | null = null;
  let unsubscribeStorage: (() => void) | null = null;

  function readStoredText(): { type: "read"; value: string | null } | { type: "refused" } {
    if (!sessionStorage || storageUnavailable) return { type: "refused" };
    try {
      return { type: "read", value: sessionStorage.getItem(storageKey) };
    } catch {
      storageUnavailable = true;
      return { type: "refused" };
    }
  }

  const startup = readStoredText();
  if (startup.type === "read") {
    memorySession = parseStoredUserSession(startup.value);
    if (startup.value && !memorySession && sessionStorage) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        storageUnavailable = true;
      }
    }
  }

  function storedSession(): UserSessionResult | null {
    const read = readStoredText();
    if (read.type === "refused") return memorySession;
    memorySession = parseStoredUserSession(read.value);
    return memorySession;
  }

  visitorIdentityConsumed = Boolean(memorySession && options.visitorIdentity && memorySession.session.id === options.visitorIdentity.session_id);

  function authorizationToken(session: UserSessionResult | null = storedSession()): string | null {
    if (!session || session.session.status.type !== "active") return null;
    return session.session.type === "visitor" ? session.session.token : session.session.access_token;
  }

  function writeUserSession(session: UserSessionResult | null): void {
    if (
      session &&
      (!isIssuedUserSession(session.session) ||
        !isStoredUser(session.user) ||
        session.session.user_id !== session.user.id)
    ) {
      throw new RangeError("The user session must be active, name its user and carry epoch-millisecond times");
    }
    memorySession = session;
    if (!sessionStorage || storageUnavailable) return;
    try {
      if (session) {
        const stored: StoredUserSession = {
          version: 5,
          user: session.user,
          session: session.session,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(stored));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      storageUnavailable = true;
    }
  }

  function toPublic(value: UserSessionResult | null): StorefrontUserSession | null {
    return value ? publicSession(value) : null;
  }

  function emit(): void {
    const current = toPublic(storedSession());
    for (const listener of listeners) {
      Promise.resolve()
        .then(() => listener(current))
        .catch(reportListenerFailure);
    }
  }

  const updateSession: UserSessionUpdater = (updater) => {
    const previous = storedSession();
    const next = updater(previous);
    if (next === previous) return;
    writeUserSession(next);
    emit();
  };

  const authStorage: AuthStorage = {
    getTokens() {
      const current = storedSession();
      if (!current || current.session.status.type !== "active") return null;
      const issued = current.session;
      switch (issued.type) {
        case "visitor":
          return { access_token: issued.token };
        case "tenant_user_signed_in_by_email":
        case "tenant_user_signed_in_by_phone":
          return { access_token: issued.access_token, refresh_token: issued.refresh_token };
        case "network_user_tenant_key":
          return { access_token: issued.access_token };
      }
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
      "X-Arky-Tenant-Id": tenantId,
      "X-Arky-Sales-Channel-Id": salesChannelId,
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
    onRefused: forgetChangedSetup,
  });
  const publicHttpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage: { getTokens: () => null },
    storefrontMode: true,
    forcedHeaders: storefrontHeaders,
    onUnauthorized: () => false,
  });

  const apiConfig: StorefrontApiConfig = { httpClient, publicHttpClient, apiUrl, tenantId, salesChannelId, authStorage };

  function requireVisitorSessionCapability(): void {
    if (!canCreateVisitorSession) {
      throw new TypeError("Stateful storefront calls during SSR need an explicit request-local sessionStorage adapter");
    }
  }

  function forgetChangedSetup(error: ArkyApiError): void {
    if (error.code === "PAYMENT_METHOD.TERMS_CHANGED") setupValue = null;
  }

  async function getSetup(requestOptions?: RequestOptions): Promise<StorefrontSetup> {
    if (setupValue) return setupValue;
    if (!setupRequest || setupRequest.abandoned) {
      const request = shareRequest({ method: "GET", url: `${apiUrl}/v1/storefront` }, (signal) =>
        httpClient
          .get<StorefrontSetup>("/v1/storefront", { ...requestOptions, signal })
          .then((setup) => {
            setupValue = setup;
            return setup;
          })
          .finally(() => {
            if (setupRequest === request) setupRequest = null;
          }),
      );
      setupRequest = request;
    }
    return setupRequest.join(requestOptions?.signal);
  }

  async function ensureVisitorSession(): Promise<void> {
    if (authorizationToken()) return;
    requireVisitorSessionCapability();
    try {
      await identify();
    } catch (error) {
      if (!(error instanceof ArkyApiError) || error.statusCode !== 409) throw error;
      await identify();
    }
  }

  const markets = new Map<string, Promise<StorefrontMarket>>();

  function currentMarket(): Promise<StorefrontMarket> {
    const key = market;
    if (!key) return Promise.reject(new CartError("not_ready", "Set the storefront market with setContext({ market }) first"));
    const known = markets.get(key);
    if (known) return known;
    const read = httpClient
      .get<StorefrontMarket>(`/v1/storefront/markets/by-key/${encodeURIComponent(key)}`)
      .then((value) => {
        if (value.key !== key) throw new CartError("answer_mismatch", "The market read didn't confirm the selected key");
        return value;
      })
      .catch((error: unknown) => {
        markets.delete(key);
        throw error;
      });
    markets.set(key, read);
    return read;
  }

  function marketId(): Promise<string> {
    return currentMarket().then((value) => value.id);
  }

  function appId(label: string): string {
    return requireId(options.createId(), label);
  }

  function appOrderToken(): string {
    const token = options.createOrderToken();
    if (!isOrderToken(token)) {
      throw new TypeError("createOrderToken must answer an order token: 32 random bytes in canonical base64url after arky_ot_");
    }
    return token;
  }

  function pendingKey(flow: string, target: string): string {
    const userId = storedSession()?.user.id;
    if (!userId) throw new ArkyError("no_session", "A retry-safe create needs the user session first");
    return durableCreateKey(storageKey, flow, userId, target);
  }

  function verifiedContact(): EmailContact | null {
    const current = storedSession();
    if (!current || current.session.type !== "tenant_user_signed_in_by_email") return null;
    const signedInEmail = current.session.email;
    for (const contact of current.user.contacts) {
      if (contact.type === "confirmed_email" && sameEmail(contact.email, signedInEmail)) {
        return { email: contact.email, language: contact.language };
      }
    }
    return null;
  }

  function confirmedEmail(email: string): EmailContact | null {
    const current = storedSession();
    if (!current || current.session.type === "visitor" || current.session.status.type !== "active") return null;
    for (const contact of current.user.contacts) {
      if (contact.type === "confirmed_email" && sameEmail(contact.email, email)) {
        return { email: contact.email, language: contact.language };
      }
    }
    return null;
  }

  const flows: StorefrontFlowContext = {
    appId,
    appOrderToken,
    pendingKey,
    locale(requestOptions) {
      const value = requestLocale(requestOptions?.locale);
      if (!value) throw new TypeError("Set the storefront locale with setContext({ locale }), or pass one with the call");
      return value;
    },
    verifiedContact,
    confirmedEmail,
  };

  const storefrontApi = createStorefrontApi(
    apiConfig,
    updateSession,
    { ensureVisitorSession, hasSession: () => Boolean(authorizationToken()), getSetup },
    {
      namespace: storageKey,
      storage: sessionStorage,
      storageRefused: () => {
        storageUnavailable = true;
      },
      userId: () => storedSession()?.user.id ?? null,
      market: () => market || null,
      marketId,
    },
    flows,
  );
  const userApi = storefrontApi.user;

  function pickVisitorIdentity(): IdentifyUserParams {
    if (pendingVisitorIdentity) return pendingVisitorIdentity;
    const picked = !visitorIdentityConsumed && options.visitorIdentity
      ? options.visitorIdentity
      : options.createVisitorIdentity();
    pendingVisitorIdentity = {
      user_id: requireId(picked.user_id, "user"),
      session_id: requireId(picked.session_id, "user session"),
    };
    return pendingVisitorIdentity;
  }

  async function identify(params: IdentifyUserParams = pickVisitorIdentity()): Promise<UserSessionResult> {
    requireVisitorSessionCapability();
    const key = `${params.user_id}:${params.session_id}`;
    if (identifyPromise && identifyKey === key) return identifyPromise;
    const pending = () =>
      pendingVisitorIdentity?.user_id === params.user_id && pendingVisitorIdentity.session_id === params.session_id;
    const promise = identityTail.then(() => userApi.identify(params)).then(
      (result) => {
        visitorIdentityConsumed = true;
        if (pending()) pendingVisitorIdentity = null;
        return result;
      },
      (error: unknown) => {
        if (error instanceof ArkyApiError && isDefiniteRefusal(error) && pending()) {
          pendingVisitorIdentity = null;
          visitorIdentityConsumed = true;
          const replacement = options.createVisitorIdentity();
          pendingVisitorIdentity = {
            user_id: requireId(replacement.user_id, "user"),
            session_id: requireId(replacement.session_id, "user session"),
          };
        }
        throw error;
      },
    );
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

  async function requestCode(params: RequestUserCodeParams): Promise<UserCodeResult> {
    requireVisitorSessionCapability();
    if (params.id !== undefined) requireId(params.id, "sign-in email");
    await ensureVisitorSession();
    const send = (id: string) =>
      userApi.requestCode({ id, contact: params.contact });
    const result =
      params.id !== undefined
        ? await send(params.id)
        : await runDurableCreate({
            key: pendingKey("sign-in-email", ""),
            label: "sign-in code request",
            input: { contact: params.contact },
            appId: () => appId("sign-in email"),
            send,
            confirms: () => true,
          });
    identifyPromise = null;
    return result;
  }

  async function verify(params: VerifyUserCodeParams): Promise<UserSessionResult> {
    requireVisitorSessionCapability();
    await ensureVisitorSession();
    pendingVerifySessionId ??= requireId(options.createSessionId(), "user session");
    const sessionId = pendingVerifySessionId;
    try {
      const result = await userApi.verify({
        session_id: sessionId,
        code: params.code,
        email: params.email,
        number: params.number,
      });
      pendingVerifySessionId = null;
      identifyPromise = null;
      return result;
    } catch (error) {
      if (isDefiniteRefusal(error)) pendingVerifySessionId = null;
      throw error;
    }
  }

  async function verifyContact(params: VerifyOwnContactParams, options?: RequestOptions): Promise<UserMe> {
    await ensureVisitorSession();
    const requested = storedSession();
    const result = await userApi.verifyContact(params, options);
    applyAnsweredUser(requested, result);
    identifyPromise = null;
    return result;
  }

  async function addContact(params: AddOwnContactParams, options?: RequestOptions): Promise<UserMe> {
    await ensureVisitorSession();
    const requested = storedSession();
    const result = await userApi.addContact(params, options);
    applyAnsweredUser(requested, result);
    return result;
  }

  async function updateContact(params: UpdateOwnContactParams, options?: RequestOptions): Promise<UserMe> {
    await ensureVisitorSession();
    const requested = storedSession();
    const result = await userApi.updateContact(params, options);
    applyAnsweredUser(requested, result);
    return result;
  }

  async function removeContact(params: RemoveOwnContactParams, options?: RequestOptions): Promise<UserMe> {
    await ensureVisitorSession();
    const requested = storedSession();
    const result = await userApi.removeContact(params, options);
    applyAnsweredUser(requested, result);
    return result;
  }

  async function removeLink(options?: RequestOptions): Promise<OwnLinkRemoved> {
    const current = storedSession();
    if (!current || current.session.type === "visitor" || !authorizationToken(current)) {
      throw new ArkyError("no_session", "Removing the link needs a signed-in user");
    }
    identifyPromise = null;
    return userApi.removeLink(options);
  }

  function useTenantKey(key: NetworkUserTenantKey): UserSessionResult {
    identifyPromise = null;
    return userApi.useTenantKey(key);
  }

  function visitorToken(): string | null {
    const current = storedSession();
    return current && current.session.type === "visitor" && current.session.status.type === "active"
      ? current.session.token
      : null;
  }

  async function refresh(params: RefreshUserSessionParams): Promise<UserSessionResult> {
    requireVisitorSessionCapability();
    const result = await userApi.refresh(params);
    identifyPromise = null;
    return result;
  }

  function applyAnsweredUser(requested: UserSessionResult | null, result: UserMe): void {
    const user = result.user;
    const current = storedSession();
    if (
      !requested ||
      !current ||
      current.session.id !== requested.session.id ||
      current.user.id !== requested.user.id ||
      user.id !== requested.user.id ||
      result.session.id !== requested.session.id ||
      result.session.user_id !== requested.user.id ||
      result.session.tenant_id !== requested.user.tenant_id
    ) {
      return;
    }
    updateSession((previous) => (previous ? { ...previous, user } : previous));
  }

  async function me(options?: RequestOptions): Promise<UserMe | null> {
    if (!authorizationToken()) return null;
    const requested = storedSession();
    const result = await userApi.getMe(options);
    applyAnsweredUser(requested, result);
    return result;
  }

  async function updateMe(params: UpdateUserMeParams, options?: RequestOptions): Promise<UserMe> {
    await ensureVisitorSession();
    const requested = storedSession();
    const result = await userApi.updateMe(params, options);
    applyAnsweredUser(requested, result);
    return result;
  }

  async function resubscribe(params: OwnContactParams, options?: RequestOptions): Promise<UserMe> {
    await ensureVisitorSession();
    return userApi.resubscribe(params, options);
  }

  async function unsubscribe(params: OwnContactParams, options?: RequestOptions): Promise<UserMe> {
    await ensureVisitorSession();
    return userApi.unsubscribe(params, options);
  }

  async function logout(): Promise<StorefrontLogoutResult> {
    identifyPromise = null;
    const requested = storedSession();
    if (!requested || !authorizationToken(requested)) {
      updateSession(() => null);
      return { type: "local_only" };
    }
    try {
      await userApi.logout();
      return { type: "revoked", session_id: requested.session.id };
    } catch {
      return { type: "unconfirmed", session_id: requested.session.id };
    }
  }

  async function requestNewsletterCode(params: RequestNewsletterCodeParams): Promise<RequestNewsletterCodeResult> {
    if (confirmedEmail(params.contact.email) !== null) return { type: "verified" };
    const current = storedSession();
    if (current && current.session.type !== "visitor") await logout();
    await requestCode({
      contact: { type: "email", email: params.contact.email, language: params.contact.language },
    });
    return { type: "code_sent" };
  }

  async function joinNewsletter(params: JoinNewsletterParams, requestOptions?: RequestOptions): Promise<JoinFreePackageResult> {
    if (params.code !== undefined) {
      const result = await verify({ code: params.code });
      const email = result.session.type === "tenant_user_signed_in_by_email" ? result.session.email : null;
      if (email === null || !sameEmail(email, params.email)) {
        throw new PackageJoinError("email_mismatch", "The code confirmed another email address; start again");
      }
    }
    if (confirmedEmail(params.email) === null) {
      throw new PackageJoinError("sign_in_required", "Confirm the email address with its code first");
    }
    return storefrontApi.eshop.package.joinFree(
      "id" in params
        ? { id: params.id, package_id: params.package_id, language: params.language, email: params.email }
        : { key: params.key, package_id: params.package_id, language: params.language, email: params.email },
      requestOptions,
    );
  }

  function setMarket(value: string): void {
    market = contextKey(value, "market");
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
    const stored = storedSession();
    const storedToken = authorizationToken(stored);
    if (storedToken && storedToken !== failedAuthorizationToken) return true;
    if (storedToken === failedAuthorizationToken && stored && hasRefreshToken(stored.session)) {
      try {
        await exclusive(`${storageKey}:refresh`, async () => {
          if (authorizationToken() !== failedAuthorizationToken) return;
          if (!automaticRefreshPromise) {
            automaticRefreshPromise = refresh({ session_id: requireId(options.createSessionId(), "user session") }).finally(() => {
              automaticRefreshPromise = null;
            });
          }
          await automaticRefreshPromise;
        });
        return true;
      } catch (error) {
        if (!(error instanceof ArkyApiError) || !refusedByArky({ status: error.statusCode, data: error.response })) throw error;
        if (authorizationToken() === failedAuthorizationToken) updateSession(() => null);
        return false;
      }
    }
    if (visitorRecoveryPromise) {
      await visitorRecoveryPromise;
      return Boolean(authorizationToken());
    }
    if (!refusedByArky(response)) return false;
    if (authorizationToken() === failedAuthorizationToken) updateSession(() => null);
    if (/\/user\/identify$/.test(path)) return true;
    if (/\/user\/logout$/.test(path)) return false;
    const recovery = ensureVisitorSession();
    const trackedRecovery = recovery.finally(() => {
      if (visitorRecoveryPromise === trackedRecovery) visitorRecoveryPromise = null;
    });
    visitorRecoveryPromise = trackedRecovery;
    await trackedRecovery;
    return true;
  };

  function watchOtherTabs(): void {
    if (unsubscribeStorage || !sharedWithOtherTabs || typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) emit();
    };
    window.addEventListener("storage", onStorage);
    unsubscribeStorage = () => window.removeEventListener("storage", onStorage);
  }

  return {
    get session(): StorefrontUserSession | null {
      return toPublic(storedSession());
    },

    get hasSession(): boolean {
      return Boolean(authorizationToken());
    },

    get isAuthenticated(): boolean {
      const current = storedSession();
      return current?.session.status.type === "active" && current.session.type !== "visitor";
    },

    get sessionStorageUnavailable(): boolean {
      return storageUnavailable;
    },

    onAuthStateChanged(listener: AuthStateListener<StorefrontUserSession>): () => void {
      listeners.add(listener);
      watchOtherTabs();
      const current = toPublic(storedSession());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(reportListenerFailure);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribeStorage?.();
          unsubscribeStorage = null;
        }
      };
    },

    tenant: {
      ...storefrontApi.tenant,
      market: { ...storefrontApi.tenant.market, getCurrent: currentMarket },
    },
    category: storefrontApi.category,
    media: storefrontApi.media,
    content: storefrontApi.content,
    userEntries: storefrontApi.userEntries,
    forms: storefrontApi.forms,
    eshop: storefrontApi.eshop,
    companies: storefrontApi.companies,
    user: {
      identify,
      ensureSession: ensureVisitorSession,
      requestCode,
      verify,
      verifyContact,
      addContact,
      updateContact,
      removeContact,
      removeLink,
      useTenantKey,
      get visitorToken(): string | null {
        return visitorToken();
      },
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
    broadcast: createStorefrontBroadcastApi(publicHttpClient),
    getSetup,
    setContext,
    getMarket: () => market,
    getLocale: () => locale,
  };
}

export type StorefrontClient = ReturnType<typeof createStorefrontClientCore>;

export function createStorefront(identity: StorefrontIdentity, options: StorefrontOptions): StorefrontClient {
  return createStorefrontClientCore(identity, options);
}

export { createOrderToken, isOrderToken, retainOrderToken, replaceOrderToken, readOrderToken } from "./utils/orderToken";
