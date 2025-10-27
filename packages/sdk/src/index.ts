// Main export file for @arky/sdk

// ========================================
// TYPES
// ========================================
export * from './types';
export type {
    ApiResponse,
    EshopCartItem,
    EshopStoreState,
    ReservationStoreState,
    ReservationCartPart,
    Business,
    Block,
    Price
} from './types';

// ========================================
// APIs
// ========================================
export * from './api';

// ========================================
// UTILITIES
// ========================================

// Export all utilities via wildcard
export * from './utils/blocks';
export * from './utils/currency';
export * from './utils/errors';
export * from './utils/i18n';
export * from './utils/price';
export * from './utils/queryParams';
export * from './utils/svg';
export * from './utils/text';
export * from './utils/timezone';
export * from './utils/validation';

// ========================================
// SDK METADATA
// ========================================
export const SDK_VERSION = '0.3.0';
export const SUPPORTED_FRAMEWORKS = ['astro', 'react', 'vue', 'svelte', 'vanilla'] as const;

// ========================================
// INITIALIZATION
// ========================================
import { createHttpClient, type HttpClientConfig } from './services/createHttpClient';
import { createUserApi } from './api/user';
import { createBusinessApi } from './api/business';
import { createMediaApi } from './api/media';
import { createRoleApi } from './api/role';
import { createNotificationApi } from './api/notification';
import { createPromoCodeApi } from './api/promoCode';
import { createAnalyticsApi } from './api/analytics';
import { createBootApi } from './api/boot';
import { createCmsApi } from './api/cms';
import { createEshopApi } from './api/eshop';
import { createReservationApi } from './api/reservation';
import { createNewsletterApi } from './api/newsletter';
import { getImageUrl, thumbnailUrl, getGalleryThumbnail } from './utils/blocks';
import { getMarketPrice, getPriceAmount, formatPayment, formatMinor, createPaymentForCheckout } from './utils/price';
import { getCurrencySymbol } from './utils/currency';
import { validatePhoneNumber } from './utils/validation';
import { tzGroups, findTimeZone } from './utils/timezone';

export function createArkySDK(config: HttpClientConfig) {
    const httpClient = createHttpClient(config);
    const storageUrl = config.storageUrl || 'https://storage.arky.io/dev';
    const businessId = config.businessId;

    return {
        user: createUserApi(httpClient),
        business: createBusinessApi(httpClient),
        media: createMediaApi(httpClient, { baseUrl: config.baseUrl, getTokens: config.getTokens }),
        role: createRoleApi(httpClient),
        notification: createNotificationApi(httpClient),
        promoCode: createPromoCodeApi(httpClient),
        analytics: createAnalyticsApi(httpClient),
        boot: createBootApi(httpClient),
        cms: createCmsApi(httpClient, businessId),
        eshop: createEshopApi(httpClient, businessId),
        reservation: createReservationApi(httpClient, businessId),
        newsletter: createNewsletterApi(httpClient, businessId),

        // All utility functions
        utils: {
            // Image utilities
            getImageUrl: (imageBlock: any, isBlock = true) => getImageUrl(imageBlock, isBlock, storageUrl),
            thumbnailUrl: (service: any) => thumbnailUrl(service, storageUrl),
            getGalleryThumbnail,

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
            tzGroups,
            findTimeZone
        }
    };
}

export type { HttpClientConfig } from './services/createHttpClient';

// NOTE: Stores are exported via separate entry point: @arky/sdk/stores
// This keeps the main bundle small for API-only users
