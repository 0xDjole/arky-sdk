// Export types
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
} from "./types";

// Export enums (must be exported as values, not types)
export { PaymentMethodType } from "./types";

// Export reservation types
export type {
  GetSlotsForDateParams,
  GetAvailabilityParams,
  DayAvailability,
  Slot,
  SystemTemplateKey,
} from "./types/api";

// Export location types
export type {
  LocationState,
  LocationCountry,
  GetCountriesResponse,
} from "./api/location";


export const SDK_VERSION = "0.3.167";
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
  getMarketPrice,
  getPriceAmount,
  formatPayment,
  formatMinor,
  createPaymentForCheckout,
} from "./utils/price";
import { getCurrencySymbol } from "./utils/currency";
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

export async function createArkySDK(
  config: HttpClientConfig & { market: string; locale?: string }
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

  const sdk = {
    auth: authApi,
    account: accountApi,
    business: createBusinessApi(apiConfig),
    media: createMediaApi(apiConfig),
    notification: createNotificationApi(apiConfig),
    promoCode: createPromoCodeApi(apiConfig),
    cms: createCmsApi(apiConfig),
    eshop: createEshopApi(apiConfig),
    reservation: createReservationApi(apiConfig),
    database: createDatabaseApi(apiConfig),
    location: createLocationApi(apiConfig),
    network: createNetworkApi(apiConfig),
    workflow: createWorkflowApi(apiConfig),
    audience: createAudienceApi(apiConfig),

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

    // Top-level block utilities for convenience
    extractBlockValues,

    utils: {
      // Block utilities
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

      // Price utilities
      getMarketPrice,
      getPriceAmount,
      formatPayment,
      formatMinor,
      createPaymentForCheckout,

      // Currency utilities
      getCurrencySymbol,

      // Validation utilities
      validatePhoneNumber,

      // Timezone utilities
      tzGroups,
      findTimeZone,

      // Text utilities
      slugify,
      humanize,
      categorify,
      formatDate,

      // SVG utilities
      getSvgContentForAstro,
      fetchSvgContent,
      injectSvgIntoElement,

      // Key validation utilities
      isValidKey,
      validateKey,
      toKey,
      nameToKey,
    },
  };

  return sdk;
}

export type { HttpClientConfig } from "./services/createHttpClient";
