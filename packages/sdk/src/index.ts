// Main export file for @arky/sdk

// ========================================
// CONFIGURATION
// ========================================
export * from './config';
export type { ArkyConfig } from './config';

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
// SERVICES
// ========================================
export {
    getGuestToken,
    updateProfilePhone,
    verifyPhoneCode,
    getBusinessConfig
} from './services/auth';

export { default as httpClient } from './services/http';

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
import { setGlobalConfig, type ArkyConfig } from './config';
import { createHttpClient, type HttpClientConfig } from './services/createHttpClient';
import { createUserApi } from './api/user';
import { createBusinessApi } from './api/business';
import { createMediaApi } from './api/media';
import { createRoleApi } from './api/role';
import { createNotificationApi } from './api/notification';
import { createPromoCodeApi } from './api/promoCode';
import { createAnalyticsApi } from './api/analytics';
import { createBootApi } from './api/boot';

export function initArky(config: ArkyConfig): ArkyConfig {
    if (!config.apiUrl) {
        throw new Error('apiUrl is required');
    }
    if (!config.businessId) {
        throw new Error('businessId is required');
    }

    setGlobalConfig(config);
    return config;
}

export function createArkySDK(config: HttpClientConfig) {
    const httpClient = createHttpClient(config);

    return {
        user: createUserApi(httpClient),
        business: createBusinessApi(httpClient),
        media: createMediaApi(httpClient, { baseUrl: config.baseUrl, getTokens: config.getTokens }),
        role: createRoleApi(httpClient),
        notification: createNotificationApi(httpClient),
        promoCode: createPromoCodeApi(httpClient),
        analytics: createAnalyticsApi(httpClient),
        boot: createBootApi(httpClient)
    };
}

export type { HttpClientConfig } from './services/createHttpClient';

// NOTE: Stores are exported via separate entry point: @arky/sdk/stores
// This keeps the main bundle small for API-only users
