
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
  WorkflowConnection,
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

  OrderStatus,
  BookingStatus,
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

export const SDK_VERSION = "0.7.27";
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

export async function createArkySDK(
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

  const sdk = {
    auth: authApi,
    account: accountApi,
    business: businessApi,
    media: createMediaApi(apiConfig),
    notification: createNotificationApi(apiConfig),
    promoCode: createPromoCodeApi(apiConfig),
    platform: platformApi,
    cms: createCmsApi(apiConfig),
    eshop: createEshopApi(apiConfig),
    booking: createBookingApi(apiConfig),
    location: createLocationApi(apiConfig),
    market: createMarketApi(apiConfig),
    crm: createCustomerApi(apiConfig),
    reaction: createReactionApi(apiConfig),
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

    utils: {

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

    },

  };

  return sdk;
}

export type { HttpClientConfig } from "./services/createHttpClient";
