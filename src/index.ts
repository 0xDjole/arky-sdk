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
  Seo,
  Media,
  MediaResolution,
  ProviderWithTimeline,
  Taxonomy,
} from "./types";

// Export enums (must be exported as values, not types)
export { PaymentMethodType, TaxonomyScope, NodeType } from "./types";

// Export reservation types
export type {
  GetSlotsForDateParams,
  GetAvailabilityParams,
  DayAvailability,
  Slot,
} from "./types/api";

// Export email template types
export type {
  EmailType,
  EmailTemplate,
  EmailTemplateListItem,
  GetEmailTemplatesParams,
  GetEmailTemplateParams,
  UpsertEmailTemplateParams,
} from "./types/api";

// Export location types
export type {
  LocationState,
  LocationCountry,
  GetCountriesResponse,
} from "./api/location";

// Export taxonomy types
export type {
  GetTaxonomiesParams,
  GetTaxonomyParams,
  CreateTaxonomyParams,
  UpdateTaxonomyParams,
  DeleteTaxonomyParams,
  GetTaxonomyChildrenParams,
} from "./api/taxonomy";

export const SDK_VERSION = "0.3.88";
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
import { createUserApi } from "./api/user";
import { createBusinessApi } from "./api/business";
import { createMediaApi } from "./api/media";
import { createRoleApi } from "./api/role";
import { createNotificationApi } from "./api/notification";
import { createPromoCodeApi } from "./api/promoCode";
import { createAnalyticsApi } from "./api/analytics";
import { createCmsApi } from "./api/cms";
import { createEshopApi } from "./api/eshop";
import { createReservationApi } from "./api/reservation";
import { createDatabaseApi } from "./api/database";
import { createFeatureFlagsApi } from "./api/featureFlags";
import { createLocationApi } from "./api/location";
import { createNewsletterApi } from "./api/newsletter";
import { createEmailTemplateApi } from "./api/emailTemplate";
import { createTaxonomyApi } from "./api/taxonomy";
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

  const userApi = createUserApi(apiConfig);

  const autoGuest = config.autoGuest !== undefined ? config.autoGuest : true;

  // If autoGuest, login before returning SDK
  if (autoGuest) {
    try {
      const tokens = await config.getToken();
      if (!tokens.accessToken && !tokens.refreshToken) {
        const result: any = await httpClient.post("/v1/users/login", {
          provider: "GUEST",
        });
        const token = result.accessToken || result.token || "";
        if (token) {
          config.setToken(result);
        }
      }
    } catch (error) {
      // Silent fail - guest auth is optional
    }
  }

  const sdk = {
    user: userApi,
    business: createBusinessApi(apiConfig),
    media: createMediaApi(apiConfig),
    role: createRoleApi(apiConfig),
    notification: createNotificationApi(apiConfig),
    promoCode: createPromoCodeApi(apiConfig),
    analytics: createAnalyticsApi(apiConfig),
    cms: createCmsApi(apiConfig),
    eshop: createEshopApi(apiConfig),
    reservation: createReservationApi(apiConfig),
    database: createDatabaseApi(apiConfig),
    featureFlags: createFeatureFlagsApi(apiConfig),
    location: createLocationApi(apiConfig),
    newsletter: createNewsletterApi(apiConfig),
    emailTemplate: createEmailTemplateApi(apiConfig),
    taxonomy: createTaxonomyApi(apiConfig),

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
    },
  };

  return sdk;
}

export type { HttpClientConfig } from "./services/createHttpClient";
