
export type {
  ApiResponse,
  EshopCartItem,
  EshopStoreState,
  BookingStoreState,
  BookingCartItem,
  Business,
  Webhook,
  WebhookEventSubscription,
  Integration,
  IntegrationProvider,
  Block,
  Price,
  BookingPayment,
  BookingPaymentTax,
  BookingPaymentTaxLine,
  BookingPaymentPromoCode,
  BookingPaymentProvider,
  BookingPaymentRefund,
  BookingQuote,
  OrderPayment,
  OrderPaymentTax,
  OrderPaymentTaxLine,
  OrderPaymentPromoCode,
  OrderPaymentProvider,
  OrderPaymentRefund,
  OrderQuote,
  BusinessSubscription,
  BusinessSubscriptionPayment,
  BusinessSubscriptionProvider,
  BusinessSubscriptionStatus,
  BusinessSubscriptionSource,
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
  WorkflowTransformNode,
  WorkflowHttpMethod,
  WorkflowExecution,
  ExecutionStatus,
  NodeResult,
  Audience,
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

  BookingServiceStatus,
  BookingProviderStatus,
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
  AnalyticsSummary,
  TimeSeriesPoint,
  TimeSeriesResponse,
  StatusBreakdown,
} from "./api/analytics";

export type {
  CreateLocationParams,
  UpdateLocationParams,
  DeleteLocationParams,
} from "./types/api";

export const SDK_VERSION = "0.7.70";
export const SUPPORTED_FRAMEWORKS = [
  "astro",
  "react",
  "vue",
  "svelte",
  "vanilla",
] as const;

export interface ApiConfig {
  httpClient: any;
  businessId: string;
  baseUrl: string;
  market: string;
  locale: string;
  setToken: (tokens: any) => void;
  getToken: () => Promise<any> | any;
}

import {
  createHttpClient,
  defaultGetToken,
  defaultSetToken,
  defaultLogout,
  defaultIsAuthenticated,
  type HttpClientConfig,
} from "./services/createHttpClient";
import { createAccountApi } from "./api/account";
import { createAuthApi } from "./api/auth";
import { createBusinessApi } from "./api/business";
import { createMediaApi } from "./api/media";
import { createNotificationApi } from "./api/notification";
import { createPromoCodeApi } from "./api/promoCode";
import { createCmsApi } from "./api/cms";
import { createEshopApi } from "./api/eshop";
import { createBookingApi } from "./api/booking";
import { createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createCustomerApi } from "./api/crm";
import { createReactionApi } from "./api/reaction";
export {
  DEFAULT_REACTION_KINDS,
  REACTION_KIND_REGEX,
  isValidReactionKind,
  computeAverageStars,
} from "./api/reaction";
export type {
  Reaction,
  ReactionTarget,
  ReactionTargetType,
  ReactionStatus,
  CreateReactionParams,
  UpdateReactionParams,
  GetReactionParams,
  FindReactionsParams,
  ModerateReactionParams,
  EngagementSummary,
  EngagementSummaryParams,
} from "./api/reaction";
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
import { injectGA4Script, track } from "./utils/analytics";
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

    track,

    getAvailableStock,
    getReservedStock,
    hasStock,
    getInventoryAt,
    getFirstAvailableFCId,
  };
}

export async function createAdmin(
  config: HttpClientConfig & {
    market: string;
    locale?: string;
  }
) {
  const locale = config.locale || "en";
  const getToken = config.getToken || defaultGetToken;
  const setToken = config.setToken || defaultSetToken;
  const logout = config.logout || defaultLogout;
  const isAuthenticated = config.isAuthenticated || defaultIsAuthenticated;

  const httpClient = createHttpClient({ ...config, getToken, setToken, logout });

  const apiConfig: ApiConfig = {
    httpClient,
    businessId: config.businessId,
    baseUrl: config.baseUrl,
    market: config.market,
    locale,
    setToken,
    getToken,
  };

  const accountApi = createAccountApi(apiConfig);
  const authApi = createAuthApi(apiConfig);
  const businessApi = createBusinessApi(apiConfig);
  const platformApi = createPlatformApi(apiConfig);

  if (typeof window !== "undefined" && apiConfig.businessId) {
    businessApi.getIntegrationConfig({ businessId: apiConfig.businessId, type: 'analytics' }).then((configs: any[]) => {
      if (!configs) return;
      for (const c of Array.isArray(configs) ? configs : [configs]) {
        if (c.measurementId) {
          injectGA4Script(c.measurementId);
        }
      }
    }).catch(() => {});
  }

  const cmsApi = createCmsApi(apiConfig);
  const eshopApi = createEshopApi(apiConfig);
  const bookingApi = createBookingApi(apiConfig);
  const crmApi = createCustomerApi(apiConfig);
  const reactionApi = createReactionApi(apiConfig);
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
    business: {
      ...businessApi,
      location: locationApi,
      market: marketApi,
    },
    media: createMediaApi(apiConfig),
    notification: createNotificationApi(apiConfig),
    promoCode: createPromoCodeApi(apiConfig),
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
        processRefund: eshopApi.processRefund,
      },
    },
    booking: {
      addToCart: bookingApi.addToCart,
      removeFromCart: bookingApi.removeFromCart,
      getCart: bookingApi.getCart,
      clearCart: bookingApi.clearCart,
      create: bookingApi.createBooking,
      update: bookingApi.updateBooking,
      get: bookingApi.getBooking,
      find: bookingApi.searchBookings,
      getQuote: bookingApi.getQuote,
      processRefund: bookingApi.processRefund,
      getAvailability: bookingApi.getAvailability,
      cancelItem: bookingApi.cancelBookingItem,
      service: {
        create: bookingApi.createService,
        update: bookingApi.updateService,
        delete: bookingApi.deleteService,
        get: bookingApi.getService,
        find: bookingApi.getServices,
        findProviders: bookingApi.findServiceProviders,
        createProvider: bookingApi.createServiceProvider,
        updateProvider: bookingApi.updateServiceProvider,
        deleteProvider: bookingApi.deleteServiceProvider,
      },
      provider: {
        create: bookingApi.createProvider,
        update: bookingApi.updateProvider,
        delete: bookingApi.deleteProvider,
        get: bookingApi.getProvider,
        find: bookingApi.getProviders,
      },
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
      reaction: reactionApi,
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
        getBusinessChats: agentApi.getBusinessChats,
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
      track,
      getSummary: analyticsApi.getSummary,
      getSeries: analyticsApi.getSeries,
      getStatusBreakdown: analyticsApi.getStatusBreakdown,
    },

    setBusinessId: (businessId: string) => {
      apiConfig.businessId = businessId;
    },

    getBusinessId: () => apiConfig.businessId,

    setMarket: (market: string) => {
      apiConfig.market = market;
    },

    getMarket: () => apiConfig.market,

    setLocale: (locale: string) => {
      apiConfig.locale = locale;
    },

    getLocale: () => apiConfig.locale,

    isAuthenticated,
    logout,
    setToken,

    extractBlockValues,

    utils: createUtilitySurface(apiConfig),

  };

  return sdk;
}

export async function createStorefront(
  config: HttpClientConfig & {
    market: string;
    locale?: string;
  }
) {
  const locale = config.locale || "en";
  const getToken = config.getToken || defaultGetToken;
  const setToken = config.setToken || defaultSetToken;
  const logout = config.logout || defaultLogout;
  const isAuthenticated = config.isAuthenticated || defaultIsAuthenticated;

  const httpClient = createHttpClient({
    ...config,
    getToken,
    setToken,
    logout,
    refreshPath: `/v1/storefront/${config.businessId}/customers/auth/refresh`,
  });

  const apiConfig: ApiConfig = {
    httpClient,
    businessId: config.businessId,
    baseUrl: config.baseUrl,
    market: config.market,
    locale,
    setToken,
    getToken,
  };

  const storefrontApi = createStorefrontApi(apiConfig);

  let sessionPromise: Promise<void> | null = null;

  function ensureSession(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if (sessionPromise) return sessionPromise;

    sessionPromise = (async () => {
      const tokens = await apiConfig.getToken();
      if (tokens.accessToken) return;

      const result = await storefrontApi.crm.customer.initialize();
      if (result?.accessToken) {
        apiConfig.setToken(result);
      }
    })().finally(() => {
      sessionPromise = null;
    });

    return sessionPromise;
  }

  if (typeof window !== "undefined") {
    ensureSession().catch(() => {});
    if (apiConfig.businessId) {
      storefrontApi.business.getIntegrationConfig({ businessId: apiConfig.businessId, type: 'analytics' }).then((configs: any[]) => {
        if (!configs) return;
        for (const c of Array.isArray(configs) ? configs : [configs]) {
          if (c.measurementId) {
            injectGA4Script(c.measurementId);
          }
        }
      }).catch(() => {});
    }
  }

  return {
    business: storefrontApi.business,
    cms: storefrontApi.cms,
    eshop: storefrontApi.eshop,
    booking: storefrontApi.booking,
    crm: storefrontApi.crm,
    automation: storefrontApi.automation,
    analytics: {
      track,
    },
    setBusinessId: (businessId: string) => {
      apiConfig.businessId = businessId;
    },
    getBusinessId: () => apiConfig.businessId,
    setMarket: (market: string) => {
      apiConfig.market = market;
    },
    getMarket: () => apiConfig.market,
    setLocale: (locale: string) => {
      apiConfig.locale = locale;
    },
    getLocale: () => apiConfig.locale,
    isAuthenticated,
    logout,
    setToken,
    extractBlockValues,
    utils: createUtilitySurface(apiConfig),
  };
}

export type { HttpClientConfig } from "./services/createHttpClient";
