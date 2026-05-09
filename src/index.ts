
export type {
  ApiResponse,
  EshopCartItem,
  EshopStoreState,
  Store,
  Webhook,
  WebhookEventSubscription,
  Integration,
  IntegrationProvider,
  Block,
  Price,
  OrderPayment,
  OrderPaymentTax,
  OrderPaymentTaxLine,
  OrderPaymentPromoCode,
  OrderPaymentProvider,
  OrderPaymentRefund,
  OrderQuote,
  StoreSubscription,
  StoreSubscriptionPayment,
  StoreSubscriptionProvider,
  StoreSubscriptionStatus,
  StoreSubscriptionSource,
  AudienceSubscription,
  AudienceSubscriptionPayment,
  AudienceSubscriptionProvider,
  AudienceSubscriptionStatus,
  AudienceSubscriptionSource,
  PaymentMethod,
  ShippingMethod,
  ShippingWeightTier,
  Zone,
  Market,

  Address,
  GeoLocation,
  ZoneLocation,
  Location,
  PromoCodeValidation,
  PaginatedResponse,
  Language,
  Access,
  Media,
  MediaResolution,
  ProviderWithTimeline,
  Node,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTriggerNode,
  WorkflowHttpNode,
  WorkflowSwitchNode,
  WorkflowSwitchRule,
  WorkflowTransformNode,
  WorkflowLoopNode,
  WorkflowHttpMethod,
  WorkflowExecution,
  ExecutionStatus,
  NodeResult,
  Audience,
  AudienceType,
  AudienceAccessResponse,
  AudienceSubscribeResponse,
  AudienceSubscriber,
  Event,
  EventAction,

  ShippingStatus,
  OrderShipping,
  ShippingRate,
  ShippingAddress,
  Parcel,
  PurchaseLabelResult,
  ShipResult,
  ShipmentLine,
  Shipment,
  CustomsItem,
  CustomsDeclaration,

  GeoLocationBlock,

  Service,
  Provider,
  ServiceProvider,
  ServiceDuration,
  ProviderTimelinePoint,
  TimelinePoint,
  WorkingHour,
  WorkingDay,
  SpecificDate,

  Order,
  OrderItem,
  OrderItemSnapshot,
  ProductOrderItem,
  ServiceOrderItem,
  ProductOrderItemSnapshot,
  ServiceOrderItemSnapshot,
  QuoteLine,
  ProductQuoteLine,
  ServiceQuoteLine,
  ProductQuoteLineAvailability,
  ServiceQuoteLineAvailability,
  OrderItemStatus,
  OrderPaymentStatus,
  OrderCancellationReason,
  HistoryEntry,

  Product,
  ProductVariant,
  ProductInventory,
  InventoryLevel,
  GalleryItem,

  EmailTemplate,
  Form,
  FormSubmission,
  FormSchema,
  FormSchemaType,
  FormField,
  FormFieldType,
  FormEntry,
  Taxonomy,
  TaxonomyEntry,
  TaxonomyQuery,
  TaxonomySchema,
  TaxonomySchemaType,
  TaxonomyField,
  TaxonomyFieldQuery,

  Agent,
  AgentChat,
  AgentChatMessage,
  PromoCode,

  Customer,
  Discount,
  Condition,

  ServiceStatus,
  ProviderStatus,
  ProductStatus,
  CustomerStatus,
  AudienceStatus,
  AgentChatStatus,
  WorkflowStatus,
  PromoCodeStatus,
  NodeStatus,
  EmailTemplateStatus,
  FormStatus,
  TaxonomyStatus,
} from "./types";

export { PaymentMethodType } from "./types";

export type {
  GetAvailabilityParams,
  AvailabilitySlot,
  DaySlots,
  ProviderAvailability,
  AvailabilityResponse,
  Slot,
  SlotRange,
  EshopItem,
  EshopQuoteItem,
  ServiceCheckoutPart,
  ServiceQuoteItem,
  ProductQuoteItemInput,
  ServiceQuoteItemInput,
  OrderQuoteItemInput,
  QuoteItemInput,
  OrderQuoteCompatibleItemInput,
  ProductCheckoutItemInput,
  ServiceCheckoutItemInput,
  OrderCheckoutItemInput,
  CheckoutItemInput,
  OrderCheckoutCompatibleItemInput,
  SystemTemplateKey,
  
  GetShippingRatesParams,
  ShipParams,
  
  CreateAgentParams,
  UpdateAgentParams,
  GetAgentParams,
  GetAgentsParams,
  AgentStatus,
} from "./types/api";

export type {
  LocationState,
  LocationCountry,
  GetCountriesResponse,
} from "./api/location";

export type {
  AnalyticsQuery,
  AnalyticsQueryResponse,
  AnalyticsRow,
  Measure,
  Dimension,
  Filter,
  FilterField,
  FilterOp,
  Granularity,
  EntityKind,
  TimeRange,
  TimeUnit,
  OrderBy,
} from "./api/analytics";

export type {
  CreateLocationParams,
  UpdateLocationParams,
  DeleteLocationParams,
} from "./types/api";

export type {
  Activity,
  TrackParams,
  CommonActivityType,
} from "./api/storefront";
export { COMMON_ACTIVITY_TYPES } from "./api/storefront";

export type { TimelineParams } from "./api/crm";

export const SDK_VERSION = "0.7.112";
export const SUPPORTED_FRAMEWORKS = [
  "astro",
  "react",
  "vue",
  "svelte",
  "vanilla",
] as const;

import type { Customer as CustomerType, Store as StoreType, Market as MarketType } from "./types";

export interface ApiConfig {
  httpClient: HttpClient;
  storeId: string;
  baseUrl: string;
  market: string;
  locale: string;
  authStorage: AuthStorage;
}

export interface AdminSessionInternal {
  access_token: string;
  refresh_token: string;
  access_expires_at?: number;
  email?: string;
}

export interface CustomerSessionInternal {
  access_token: string;
  customer: CustomerType;
  store: StoreType;
  market: MarketType | null;
}

export interface AdminSession {
  email?: string;
}

export interface CustomerSession {
  customer: CustomerType;
  store: StoreType;
  market: MarketType | null;
}

export type AdminSessionUpdater = (
  updater: (prev: AdminSessionInternal | null) => AdminSessionInternal | null,
) => void;

export type CustomerSessionUpdater = (
  updater: (prev: CustomerSessionInternal | null) => CustomerSessionInternal | null,
) => void;

export type AuthStateListener<T> = (session: T | null) => void;

import {
  createHttpClient,
  type HttpClientConfig,
  type HttpClient,
  type AuthStorage,
} from "./services/createHttpClient";
import { createAccountApi } from "./api/account";
import { createAuthApi } from "./api/auth";
import { createStoreApi } from "./api/store";
import { createMediaApi } from "./api/media";
import { createNotificationApi } from "./api/notification";
import { createPromoCodeApi } from "./api/promoCode";
import { createCmsApi } from "./api/cms";
import { createEshopApi } from "./api/eshop";
import { createSchedulingApi } from "./api/scheduling";
import { createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createCustomerApi } from "./api/crm";
import { createWorkflowApi } from "./api/workflow";
import { createPlatformApi } from "./api/platform";
import { createShippingApi } from "./api/shipping";
import { createAgentApi } from "./api/agent";
import { createEmailTemplateApi } from "./api/emailTemplate";
import { createFormApi } from "./api/form";
import { createTaxonomyApi } from "./api/taxonomy";
import { createAnalyticsApi } from "./api/analytics";
import { createStorefrontApi } from "./api/storefront";
import {
  getImageUrl,
  getBlockValue,
  getBlockTextValue,
  getBlockValues,
  getBlockLabel,
  getBlockObjectValues,
  getBlockFromArray,
  formatBlockValue,
  prepareBlocksForSubmission,
  extractBlockValues,
} from "./utils/blocks";
import {
  formatPrice,
  getPriceAmount,
  formatPayment,
  formatMinor,
  getCurrencySymbol,
  getCurrencyName,
} from "./utils/price";
import { validatePhoneNumber } from "./utils/validation";
import { tzGroups, findTimeZone } from "./utils/timezone";
import { slugify, humanize, categorify, formatDate } from "./utils/text";
import {
  getSvgContentForAstro,
  fetchSvgContent,
  injectSvgIntoElement,
} from "./utils/svg";
import {
  isValidKey,
  validateKey,
  toKey,
  nameToKey,
} from "./utils/keyValidation";
import {
  getAvailableStock,
  getReservedStock,
  hasStock,
  getInventoryAt,
  getFirstAvailableFCId,
} from "./utils/inventory";

function createUtilitySurface(apiConfig: ApiConfig) {
  return {
    getImageUrl: (imageBlock: any, isBlock = true) =>
      getImageUrl(imageBlock, isBlock),
    getBlockValue,
    getBlockTextValue,
    getBlockValues,
    getBlockLabel,
    getBlockObjectValues,
    getBlockFromArray,
    formatBlockValue,
    prepareBlocksForSubmission,
    extractBlockValues,

    formatPrice: (prices: any[]) => formatPrice(prices, apiConfig.market),
    getPriceAmount: (prices: any[]) => getPriceAmount(prices, apiConfig.market),
    formatPayment,
    formatMinor,
    getCurrencySymbol,
    getCurrencyName,
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

    getAvailableStock,
    getReservedStock,
    hasStock,
    getInventoryAt,
    getFirstAvailableFCId,
  };
}

const ADMIN_STORAGE_KEY = "arky_admin_session";

function readAdminSession(): AdminSessionInternal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminSessionInternal) : null;
  } catch {
    return null;
  }
}

function writeAdminSession(s: AdminSessionInternal | null): void {
  if (typeof window === "undefined") return;
  if (s) {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(s));
  } else {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }
}

export type CreateAdminConfig = Omit<HttpClientConfig, "authStorage" | "storeId"> & {
  storeId: string;
  market: string;
  locale?: string;
  apiToken?: string;
};

export function createAdmin(config: CreateAdminConfig) {
  const locale = config.locale || "en";
  const listeners = new Set<AuthStateListener<AdminSession>>();

  function toPublic(s: AdminSessionInternal | null): AdminSession | null {
    return s ? { email: s.email } : null;
  }

  function emit(): void {
    const pub = toPublic(readAdminSession());
    for (const l of listeners) {
      Promise.resolve()
        .then(() => l(pub))
        .catch(() => {});
    }
  }

  const updateSession: AdminSessionUpdater = (updater) => {
    if (config.apiToken) return;
    const prev = readAdminSession();
    const next = updater(prev);
    writeAdminSession(next);
    emit();
  };

  const authStorage: AuthStorage = config.apiToken
    ? {
        getTokens: () => ({ access_token: config.apiToken! }),
        onTokensRefreshed: () => {},
        onForcedLogout: () => {},
      }
    : {
        getTokens() {
          const s = readAdminSession();
          if (!s) return null;
          return {
            access_token: s.access_token,
            refresh_token: s.refresh_token,
            access_expires_at: s.access_expires_at,
          };
        },
        onTokensRefreshed(tokens) {
          updateSession((prev) =>
            prev
              ? {
                  ...prev,
                  access_token: tokens.access_token,
                  refresh_token: tokens.refresh_token ?? prev.refresh_token,
                  access_expires_at: tokens.access_expires_at ?? prev.access_expires_at,
                }
              : null,
          );
        },
        onForcedLogout() {
          updateSession(() => null);
        },
      };

  const httpClient = createHttpClient({
    baseUrl: config.baseUrl,
    storeId: config.storeId,
    refreshPath: config.refreshPath,
    navigate: config.navigate,
    loginFallbackPath: config.loginFallbackPath,
    authStorage,
  });

  const apiConfig: ApiConfig = {
    httpClient,
    storeId: config.storeId,
    baseUrl: config.baseUrl,
    market: config.market,
    locale,
    authStorage,
  };

  const accountApi = createAccountApi(apiConfig);
  const authApi = createAuthApi(apiConfig, updateSession);
  const storeApi = createStoreApi(apiConfig, updateSession);
  const platformApi = createPlatformApi(apiConfig);

  const cmsApi = createCmsApi(apiConfig);
  const eshopApi = createEshopApi(apiConfig);
  const schedulingApi = createSchedulingApi(apiConfig);
  const promoCodeApi = createPromoCodeApi(apiConfig);
  const crmApi = createCustomerApi(apiConfig);
  const locationApi = createLocationApi(apiConfig);
  const marketApi = createMarketApi(apiConfig);
  const agentApi = createAgentApi(apiConfig);
  const workflowApi = createWorkflowApi(apiConfig);
  const formApi = createFormApi(apiConfig);
  const taxonomyApi = createTaxonomyApi(apiConfig);
  const emailTemplateApi = createEmailTemplateApi(apiConfig);
  const analyticsApi = createAnalyticsApi(apiConfig);

  const sdk = {
    auth: authApi,
    account: accountApi,
    store: {
      ...storeApi,
      location: locationApi,
      market: marketApi,
    },
    media: createMediaApi(apiConfig),
    notification: createNotificationApi(apiConfig),
    promoCode: promoCodeApi,
    platform: platformApi,
    shipping: createShippingApi(apiConfig),
    cms: {
      node: {
        create: cmsApi.createNode,
        update: cmsApi.updateNode,
        delete: cmsApi.deleteNode,
        get: cmsApi.getNode,
        find: cmsApi.getNodes,
        getChildren: cmsApi.getNodeChildren,
      },
      form: {
        create: formApi.createForm,
        update: formApi.updateForm,
        delete: formApi.deleteForm,
        get: formApi.getForm,
        find: formApi.getForms,
        submit: formApi.submit,
        getSubmissions: formApi.getSubmissions,
        getSubmission: formApi.getSubmission,
        updateSubmission: formApi.updateSubmission,
      },
      taxonomy: {
        create: taxonomyApi.createTaxonomy,
        update: taxonomyApi.updateTaxonomy,
        delete: taxonomyApi.deleteTaxonomy,
        get: taxonomyApi.getTaxonomy,
        find: taxonomyApi.getTaxonomies,
        getChildren: taxonomyApi.getTaxonomyChildren,
      },
      emailTemplate: {
        create: emailTemplateApi.createEmailTemplate,
        update: emailTemplateApi.updateEmailTemplate,
        delete: emailTemplateApi.deleteEmailTemplate,
        get: emailTemplateApi.getEmailTemplate,
        find: emailTemplateApi.getEmailTemplates,
      },
    },
    eshop: {
      product: {
        create: eshopApi.createProduct,
        update: eshopApi.updateProduct,
        delete: eshopApi.deleteProduct,
        get: eshopApi.getProduct,
        find: eshopApi.getProducts,
      },
      order: {
        create: eshopApi.createOrder,
        update: eshopApi.updateOrder,
        get: eshopApi.getOrder,
        find: eshopApi.getOrders,
        getQuote: eshopApi.getQuote,
        checkout: eshopApi.checkoutOrder,
        getAvailability: eshopApi.getOrderAvailability,
        processRefund: eshopApi.processRefund,
      },
      service: {
        create: schedulingApi.createService,
        update: schedulingApi.updateService,
        delete: schedulingApi.deleteService,
        get: schedulingApi.getService,
        find: schedulingApi.getServices,
        findProviders: schedulingApi.findServiceProviders,
        createProvider: schedulingApi.createServiceProvider,
        updateProvider: schedulingApi.updateServiceProvider,
        deleteProvider: schedulingApi.deleteServiceProvider,
      },
      provider: {
        create: schedulingApi.createProvider,
        update: schedulingApi.updateProvider,
        delete: schedulingApi.deleteProvider,
        get: schedulingApi.getProvider,
        find: schedulingApi.getProviders,
      },
      promoCode: promoCodeApi,
    },
    crm: {
      customer: {
        create: crmApi.create,
        get: crmApi.get,
        find: crmApi.find,
        update: crmApi.update,
        merge: crmApi.merge,
        revokeToken: crmApi.revokeToken,
        revokeAllTokens: crmApi.revokeAllTokens,
      },
      audience: {
        create: crmApi.audiences.create,
        update: crmApi.audiences.update,
        get: crmApi.audiences.get,
        find: crmApi.audiences.find,
        getSubscribers: crmApi.audiences.getSubscribers,
        addSubscriber: crmApi.audiences.addSubscriber,
        removeSubscriber: crmApi.audiences.removeSubscriber,
      },
      activity: crmApi.activity,
    },
    automation: {
      agent: {
        create: agentApi.createAgent,
        update: agentApi.updateAgent,
        delete: agentApi.deleteAgent,
        get: agentApi.getAgent,
        find: agentApi.getAgents,
        sendMessage: agentApi.sendMessage,
        getChats: agentApi.getChats,
        getChat: agentApi.getChat,
        updateChat: agentApi.updateChat,
        rateChat: agentApi.rateChat,
        getStoreChats: agentApi.getStoreChats,
        getChatMessages: agentApi.getChatMessages,
      },
      workflow: {
        create: workflowApi.createWorkflow,
        update: workflowApi.updateWorkflow,
        delete: workflowApi.deleteWorkflow,
        get: workflowApi.getWorkflow,
        find: workflowApi.getWorkflows,
        trigger: workflowApi.triggerWorkflow,
        getExecutions: workflowApi.getWorkflowExecutions,
        getExecution: workflowApi.getWorkflowExecution,
      },
    },

    analytics: {
      query: analyticsApi.query,
    },

    setStoreId: (storeId: string) => {
      apiConfig.storeId = storeId;
    },

    getStoreId: () => apiConfig.storeId,

    setMarket: (market: string) => {
      apiConfig.market = market;
    },

    getMarket: () => apiConfig.market,

    setLocale: (locale: string) => {
      apiConfig.locale = locale;
    },

    getLocale: () => apiConfig.locale,

    get session(): AdminSession | null {
      if (config.apiToken) return null;
      return toPublic(readAdminSession());
    },

    get isAuthenticated(): boolean {
      if (config.apiToken) return true;
      return readAdminSession() !== null;
    },

    onAuthStateChanged(listener: AuthStateListener<AdminSession>): () => void {
      listeners.add(listener);
      const current = toPublic(readAdminSession());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(() => {});
      }
      return () => {
        listeners.delete(listener);
      };
    },

    async logout(): Promise<void> {
      if (config.apiToken) return;
      updateSession(() => null);
    },

    extractBlockValues,

    utils: createUtilitySurface(apiConfig),

  };

  return sdk;
}

const CUSTOMER_STORAGE_KEY = "arky_customer_session";

function readCustomerSession(): CustomerSessionInternal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomerSessionInternal) : null;
  } catch {
    return null;
  }
}

function writeCustomerSession(s: CustomerSessionInternal | null): void {
  if (typeof window === "undefined") return;
  if (s) {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(s));
  } else {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  }
}

export type CreateStorefrontConfig = Omit<HttpClientConfig, "authStorage" | "storeId"> & {
  storeId: string;
  market?: string;
  locale?: string;
  apiToken?: string;
};

export function createStorefront(config: CreateStorefrontConfig) {
  const locale = config.locale || "en";
  const initialMarket = config.market || "";
  const listeners = new Set<AuthStateListener<CustomerSession>>();
  let bareIdentifyPromise: Promise<CustomerSession> | null = null;

  function toPublic(s: CustomerSessionInternal | null): CustomerSession | null {
    return s ? { customer: s.customer, store: s.store, market: s.market } : null;
  }

  function emit(): void {
    const pub = toPublic(readCustomerSession());
    for (const l of listeners) {
      Promise.resolve()
        .then(() => l(pub))
        .catch(() => {});
    }
  }

  const updateSession: CustomerSessionUpdater = (updater) => {
    if (config.apiToken) return;
    const prev = readCustomerSession();
    const next = updater(prev);
    writeCustomerSession(next);
    emit();
  };

  const authStorage: AuthStorage = config.apiToken
    ? {
        getTokens: () => ({ access_token: config.apiToken! }),
        onTokensRefreshed: () => {},
        onForcedLogout: () => {},
      }
    : {
        getTokens() {
          const s = readCustomerSession();
          return s ? { access_token: s.access_token } : null;
        },
        onTokensRefreshed() {
          // Customer tokens are one-shot; no refresh on this flow.
        },
        onForcedLogout() {
          bareIdentifyPromise = null;
          updateSession(() => null);
        },
      };

  const httpClient = createHttpClient({
    baseUrl: config.baseUrl,
    storeId: config.storeId,
    refreshPath: config.refreshPath,
    navigate: config.navigate,
    loginFallbackPath: config.loginFallbackPath,
    authStorage,
  });

  const apiConfig: ApiConfig = {
    httpClient,
    storeId: config.storeId,
    baseUrl: config.baseUrl,
    market: initialMarket,
    locale,
    authStorage,
  };

  const storefrontApi = createStorefrontApi(apiConfig, updateSession);
  const customerApi = storefrontApi.crm.customer;

  function identify(
    params?: { email?: string; verify?: boolean; market?: string },
  ): Promise<CustomerSession> {
    if (params?.market !== undefined) apiConfig.market = params.market;

    const isBareCall = !params?.email && !params?.verify;
    if (isBareCall && bareIdentifyPromise) return bareIdentifyPromise;

    const promise = (async (): Promise<CustomerSession> => {
      try {
        const result = await customerApi.identify({
          market: apiConfig.market,
          email: params?.email,
          verify: params?.verify,
        });
        return {
          customer: result.customer,
          store: result.store,
          market: result.market,
        };
      } catch (err: unknown) {
        const e = err as { statusCode?: number; status?: number; response?: { status?: number } };
        const status = e?.statusCode || e?.status || e?.response?.status;
        if (isBareCall && status === 401) {
          updateSession(() => null);
          const result = await customerApi.identify({ market: apiConfig.market });
          return {
            customer: result.customer,
            store: result.store,
            market: result.market,
          };
        }
        throw err;
      }
    })().catch((err) => {
      if (isBareCall) bareIdentifyPromise = null;
      throw err;
    });

    if (isBareCall) bareIdentifyPromise = promise;

    return promise;
  }

  async function verify(params: { code: string }) {
    const result = await customerApi.verify(params);
    bareIdentifyPromise = null;
    return result;
  }

  async function logout(): Promise<void> {
    if (config.apiToken) return;
    bareIdentifyPromise = null;
    try {
      await customerApi.logout();
    } catch {
      updateSession(() => null);
    }
  }

  return {
    identify,
    verify,
    logout,
    me: () => customerApi.getMe(),

    get session(): CustomerSession | null {
      if (config.apiToken) return null;
      return toPublic(readCustomerSession());
    },

    get isAuthenticated(): boolean {
      if (config.apiToken) return true;
      const s = readCustomerSession();
      return s !== null && !!s.access_token;
    },

    onAuthStateChanged(listener: AuthStateListener<CustomerSession>): () => void {
      listeners.add(listener);
      const current = toPublic(readCustomerSession());
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
    cms: storefrontApi.cms,
    eshop: storefrontApi.eshop,
    crm: storefrontApi.crm,
    activity: storefrontApi.activity,
    automation: storefrontApi.automation,
    setStoreId: (storeId: string) => {
      apiConfig.storeId = storeId;
      bareIdentifyPromise = null;
    },
    getStoreId: () => apiConfig.storeId,
    setMarket: (key: string) => {
      apiConfig.market = key;
      bareIdentifyPromise = null;
    },
    getMarket: () => apiConfig.market,
    setLocale: (l: string) => {
      apiConfig.locale = l;
    },
    getLocale: () => apiConfig.locale,
    extractBlockValues,
    utils: createUtilitySurface(apiConfig),
  };
}

export type { HttpClientConfig } from "./services/createHttpClient";
