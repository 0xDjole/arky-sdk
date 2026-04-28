
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
  CreateLocationParams,
  UpdateLocationParams,
  DeleteLocationParams,
} from "./types/api";

export const SDK_VERSION = "0.7.59";
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

  const httpClient = createHttpClient(config);

  const apiConfig: ApiConfig = {
    httpClient,
    businessId: config.businessId,
    baseUrl: config.baseUrl,
    market: config.market,
    locale,
    setToken: config.setToken,
    getToken: config.getToken,
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
  const sdk = {
    auth: authApi,
    account: accountApi,
    business: businessApi,
    media: createMediaApi(apiConfig),
    notification: createNotificationApi(apiConfig),
    promoCode: createPromoCodeApi(apiConfig),
    platform: platformApi,
    cms: cmsApi,
    eshop: {
      createProduct: eshopApi.createProduct,
      updateProduct: eshopApi.updateProduct,
      deleteProduct: eshopApi.deleteProduct,
      getProduct: eshopApi.getProduct,
      getProducts: eshopApi.getProducts,
      createOrder: eshopApi.createOrder,
      updateOrder: eshopApi.updateOrder,
      getOrder: eshopApi.getOrder,
      getOrders: eshopApi.getOrders,
      getQuote: eshopApi.getQuote,
      processRefund: eshopApi.processRefund,
    },
    booking: {
      addToCart: bookingApi.addToCart,
      removeFromCart: bookingApi.removeFromCart,
      getCart: bookingApi.getCart,
      clearCart: bookingApi.clearCart,
      createBooking: bookingApi.createBooking,
      updateBooking: bookingApi.updateBooking,
      getBooking: bookingApi.getBooking,
      searchBookings: bookingApi.searchBookings,
      getQuote: bookingApi.getQuote,
      processRefund: bookingApi.processRefund,
      getAvailability: bookingApi.getAvailability,
      createService: bookingApi.createService,
      updateService: bookingApi.updateService,
      deleteService: bookingApi.deleteService,
      getService: bookingApi.getService,
      getServices: bookingApi.getServices,
      createProvider: bookingApi.createProvider,
      updateProvider: bookingApi.updateProvider,
      deleteProvider: bookingApi.deleteProvider,
      getProvider: bookingApi.getProvider,
      getProviders: bookingApi.getProviders,
      cancelBookingItem: bookingApi.cancelBookingItem,
      findServiceProviders: bookingApi.findServiceProviders,
      createServiceProvider: bookingApi.createServiceProvider,
      updateServiceProvider: bookingApi.updateServiceProvider,
      deleteServiceProvider: bookingApi.deleteServiceProvider,
    },
    location: createLocationApi(apiConfig),
    market: createMarketApi(apiConfig),
    crm: {
      create: crmApi.create,
      get: crmApi.get,
      find: crmApi.find,
      update: crmApi.update,
      merge: crmApi.merge,
      revokeToken: crmApi.revokeToken,
      revokeAllTokens: crmApi.revokeAllTokens,
      audiences: {
        create: crmApi.audiences.create,
        update: crmApi.audiences.update,
        get: crmApi.audiences.get,
        find: crmApi.audiences.find,
        getSubscribers: crmApi.audiences.getSubscribers,
        addSubscriber: crmApi.audiences.addSubscriber,
        removeSubscriber: crmApi.audiences.removeSubscriber,
      },
    },
    reaction: reactionApi,
    workflow: createWorkflowApi(apiConfig),
    shipping: createShippingApi(apiConfig),
    agent: createAgentApi(apiConfig),
    emailTemplate: createEmailTemplateApi(apiConfig),
    form: createFormApi(apiConfig),
    taxonomy: createTaxonomyApi(apiConfig),

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

    isAuthenticated: config.isAuthenticated || (() => false),
    logout: config.logout,
    setToken: config.setToken,

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
  const httpClient = createHttpClient({
    ...config,
    refreshPath: `/v1/storefront/${config.businessId}/customers/auth/refresh`,
  });

  const apiConfig: ApiConfig = {
    httpClient,
    businessId: config.businessId,
    baseUrl: config.baseUrl,
    market: config.market,
    locale,
    setToken: config.setToken,
    getToken: config.getToken,
  };

  const storefrontApi = createStorefrontApi(apiConfig);

  if (typeof window !== "undefined" && apiConfig.businessId) {
    storefrontApi.business.getIntegrationConfig({ businessId: apiConfig.businessId, type: 'analytics' }).then((configs: any[]) => {
      if (!configs) return;
      for (const c of Array.isArray(configs) ? configs : [configs]) {
        if (c.measurementId) {
          injectGA4Script(c.measurementId);
        }
      }
    }).catch(() => {});
  }

  return {
    business: storefrontApi.business,
    cms: storefrontApi.cms,
    form: storefrontApi.form,
    taxonomy: storefrontApi.taxonomy,
    eshop: storefrontApi.eshop,
    booking: storefrontApi.booking,
    location: storefrontApi.location,
    market: storefrontApi.market,
    crm: storefrontApi.crm,
    reaction: storefrontApi.reaction,
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
    isAuthenticated: config.isAuthenticated || (() => false),
    logout: config.logout,
    setToken: config.setToken,
    extractBlockValues,
    utils: createUtilitySurface(apiConfig),
  };
}

export type { HttpClientConfig } from "./services/createHttpClient";
