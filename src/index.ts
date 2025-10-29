// Export only types, not implementations
export type {
  ApiResponse,
  EshopCartItem,
  EshopStoreState,
  ReservationStoreState,
  ReservationCartPart,
  Business,
  Block,
  Price,
} from "./types";

export const SDK_VERSION = "0.3.8";
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
  storageUrl: string;
  baseUrl: string;
  market: string;
  setTokens: (tokens: any) => void;
  getTokens: () => Promise<any> | any;
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
import { createNewsletterApi } from "./api/newsletter";
import { createPaymentApi } from "./api/payment";
import { getImageUrl, thumbnailUrl, getGalleryThumbnail } from "./utils/blocks";
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

export function createArkySDK(config: HttpClientConfig & { market: string }) {
  console.log(
    `[Arky SDK v${SDK_VERSION}] Initializing with market: ${config.market}, businessId: ${config.businessId}`
  );

  const httpClient = createHttpClient(config);
  const storageUrl = config.storageUrl || "https://storage.arky.io/dev";

  const apiConfig: ApiConfig = {
    httpClient,
    businessId: config.businessId,
    storageUrl,
    baseUrl: config.baseUrl,
    market: config.market,
    setTokens: config.setToken,
    getTokens: config.getToken,
  };

  const userApi = createUserApi(apiConfig);

  const autoGuest = config.autoGuest !== undefined ? config.autoGuest : true;

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
    newsletter: createNewsletterApi(apiConfig),
    payment: createPaymentApi(apiConfig),

    setBusinessId: (businessId: string) => {
      apiConfig.businessId = businessId;
    },

    getBusinessId: () => apiConfig.businessId,

    setMarket: (market: string) => {
      apiConfig.market = market;
    },

    getMarket: () => apiConfig.market,

    isAuthenticated: config.isAuthenticated || (() => false),
    logout: config.logout,
    setToken: config.setToken,

    utils: {
      getImageUrl: (imageBlock: any, isBlock = true) =>
        getImageUrl(imageBlock, isBlock, storageUrl),
      thumbnailUrl: (service: any) => thumbnailUrl(service, storageUrl),
      getGalleryThumbnail,

      getMarketPrice,
      getPriceAmount,
      formatPayment,
      formatMinor,
      createPaymentForCheckout,

      getCurrencySymbol,

      validatePhoneNumber,
      tzGroups,
      findTimeZone,
    },
  };

  if (autoGuest) {
    Promise.resolve().then(async () => {
      try {
        const tokens = await config.getToken();
        if (!tokens.accessToken && !tokens.refreshToken) {
          const guestToken = await userApi.getGuestToken({});
          console.log(
            "[SDK Init] Created guest token:",
            guestToken ? "Success" : "Failed"
          );
        } else {
          console.log("[SDK Init] Using existing token from storage");
        }
      } catch (error) {
        console.error("[SDK Init] Failed to initialize auth:", error);
      }
    });
  }

  return sdk;
}

export type { HttpClientConfig } from "./services/createHttpClient";
