
export type {
  ApiResponse,
  EshopCartItem,
  EshopStoreState,
  BookingStoreState,
  BookingCartItem,
  Business,
  BusinessConfig,
  BusinessChannel,
  Channel,
  ChannelAction,
  Integration,
  IntegrationStatus,
  IntegrationProvider,
  Block,
  Price,
  Payment,
  PaymentRefund,
  PaymentMethod,
  ShippingMethod,
  ShippingWeightTier,
  Zone,
  Market,
  // Address types
  Address,
  GeoLocation,
  ZoneLocation,
  Location, // deprecated - use Address for addresses, GeoLocation for map pins
  Quote,
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
  // Shipping types
  ShippingStatus,
  OrderShipping,
  ShippingRate,
  ShippingAddress, // deprecated - use Address
  Parcel,
  PurchaseLabelResult,
  ShipResult,
  ShipmentLine,
  Shipment,
  CustomsItem,
  CustomsDeclaration,
  // Block types
  GeoLocationBlock,
} from "./types";

export { PaymentMethodType } from "./types";

export type {
  GetSlotsForDateParams,
  GetAvailabilityParams,
  DayAvailability,
  Slot,
  SystemTemplateKey,
  // Shipping API params
  GetShippingRatesParams,
  ShipParams,
  // Agent API params
  AgentProviderConfig,
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

export const SDK_VERSION = "0.5.20";
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
import { createNetworkApi } from "./api/network";
import { createWorkflowApi } from "./api/workflow";
import { createAudienceApi } from "./api/audience";
import { createPlatformApi } from "./api/platform";
import { createShippingApi } from "./api/shipping";
import { createAgentApi } from "./api/agent";
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
import {
  getPaymentConfig,
  getAnalyticsConfigs,
} from "./utils/integrations";

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

  if (typeof window !== "undefined") {
    // Fetch business config for analytics
    businessApi.getBusiness({}).then(({ data: business }) => {
      const configs = business?.configs || business?.config;
      if (configs?.integrations) {
        for (const i of configs.integrations) {
          if (i.provider?.type === 'google_analytics4') {
            injectGA4Script(i.provider.measurementId);
          }
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
    network: createNetworkApi(apiConfig),
    workflow: createWorkflowApi(apiConfig),
    audience: createAudienceApi(apiConfig),
    shipping: createShippingApi(apiConfig),
    agent: createAgentApi(apiConfig),

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

      getPaymentConfig,
      getAnalyticsConfigs,
    },

  };

  return sdk;
}

export type { HttpClientConfig } from "./services/createHttpClient";
