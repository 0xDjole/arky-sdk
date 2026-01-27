
export type {
  ApiResponse,
  EshopCartItem,
  EshopStoreState,
  ReservationStoreState,
  ReservationCartItem,
  Business,
  BusinessConfig,
  Block,
  Price,
  Payment,
  PaymentRefund,
  PaymentMethod,
  PaymentProviderConfig,
  AnalyticsConfig,
  ShippingMethod,
  ShippingWeightTier,
  Zone,
  Market,
  Location,
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
  WorkflowEdge,
  WorkflowTriggerNode,
  WorkflowHttpNode,
  WorkflowIfNode,
  WorkflowLoopNode,
  WorkflowWaitNode,
  WorkflowHttpMethod,
  Audience,
  AudienceAccessResponse,
  AudienceSubscribeResponse,
  AudienceSubscriber,
  BusinessEvent,
  BusinessEventAction,
} from "./types";

export { PaymentMethodType } from "./types";

export type {
  GetSlotsForDateParams,
  GetAvailabilityParams,
  DayAvailability,
  Slot,
  SystemTemplateKey,
} from "./types/api";

export type {
  LocationState,
  LocationCountry,
  GetCountriesResponse,
} from "./api/location";

export const SDK_VERSION = "0.4.20";
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
import { createReservationApi } from "./api/reservation";
import { createDatabaseApi } from "./api/database";
import { createLocationApi } from "./api/location";
import { createNetworkApi } from "./api/network";
import { createWorkflowApi } from "./api/workflow";
import { createAudienceApi } from "./api/audience";
import { createPlatformApi } from "./api/platform";
import {
  getImageUrl,
  getBlockValue,
  getBlockValues,
  getBlockLabel,
  getBlockTextValue,
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
  createPaymentForCheckout,
} from "./utils/price";
import { getCurrencySymbol, getCurrencyName, getCurrenciesCache, setCurrenciesCache, type CurrencyInfo } from "./utils/currency";
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

export async function createArkySDK(
  config: HttpClientConfig & {
    market: string;
    locale?: string;
    fetchFullConfig?: boolean;  // If true, fetch currencies for admin dropdowns
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
    businessApi.getBusiness({}).then(({ data: business }) => {
      if (business?.config?.analytics?.measurementId) {
        injectGA4Script(business.config.analytics.measurementId);
      }
    }).catch(() => {});

    // Auto-fetch platform config on init (browser only)
    // NOTE: Currencies are NOT fetched by default - use Intl API for symbol/name
    // Pass fetchFullConfig: true to fetch currencies (for admin dropdowns)
    const configParams = config.fetchFullConfig ? { params: { currencies: true } } : undefined;
    platformApi.getConfig(configParams).then(platformConfig => {
      if (platformConfig.currencies) {
        setCurrenciesCache(platformConfig.currencies);
      }
    }).catch(() => {
      // Silent fail - config will be fetched on demand
    });
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
    reservation: createReservationApi(apiConfig),
    database: createDatabaseApi(apiConfig),
    location: createLocationApi(apiConfig),
    network: createNetworkApi(apiConfig),
    workflow: createWorkflowApi(apiConfig),
    audience: createAudienceApi(apiConfig),

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
      getBlockValues,
      getBlockLabel,
      getBlockTextValue,
      getBlockObjectValues,
      getBlockFromArray,
      formatBlockValue,
      prepareBlocksForSubmission,
      extractBlockValues,

      formatPrice: (prices: any[], options: { showSymbols?: boolean; decimalPlaces?: number; showCompareAt?: boolean } = {}) =>
        formatPrice(prices, { ...options, marketId: apiConfig.market }),
      getPriceAmount: (prices: any[], fallbackMarket?: string) =>
        getPriceAmount(prices, apiConfig.market, fallbackMarket),
      formatPayment,
      formatMinor,
      createPaymentForCheckout,

      getCurrencySymbol,
      getCurrencyName,
      getCurrenciesCache,
      setCurrenciesCache,

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
    },

    // Platform config helpers
    getPlatformConfig: () => platformApi.getConfigCache(),
    getStripePublicKey: () => platformApi.getConfigCache()?.stripePublicKey,
    getStripeConnectClientId: () => platformApi.getConfigCache()?.stripeConnectClientId,
  };

  return sdk;
}

export type { HttpClientConfig } from "./services/createHttpClient";
export type { CurrencyInfo } from "./utils/currency";
export { getCurrencySymbol, getCurrencyName, getCurrenciesCache, setCurrenciesCache } from "./utils/currency";
