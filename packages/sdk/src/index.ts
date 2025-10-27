// Main export file for @arky/sdk

// Configuration
export * from './config';
export type { ArkyConfig } from './config';

// Types
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

// APIs
export * from './api';

// Services
export * from './services/auth';
export { default as httpClient } from './services/http';

// NOTE: Stores are exported via separate entry point: @arky/sdk/stores
// This keeps the main bundle small for API-only users

// Utilities
export * from './utils/blocks';
export * from './utils/errors';
export * from './utils/price';
export * from './utils/svg';
export * from './utils/text';
export * from './utils/timezone';
export * from './utils/validation';

// Re-export commonly used functions for convenience

export { 
    // Validation utilities
    validatePhoneNumber,
    validateEmail,
    validateVerificationCode,
    validateRequired
} from './utils/validation';

export { 
    // Block utilities
    getBlockLabel,
    getBlockTextValue,
    getBlockValue,
    getBlockValues,
    getImageUrl,
    thumbnailUrl
} from './utils/blocks';

export { 
    // Auth utilities
    getGuestToken,
    updateProfilePhone,
    verifyPhoneCode,
    getBusinessConfig
} from './services/auth';

export { 
    // SVG utilities
    fetchSvgContent,
    getSvgContentForAstro,
    injectSvgIntoElement
} from './utils/svg';

export { 
    // Text utilities
    slugify,
    humanize,
    categorify,
    formatDate
} from './utils/text';

export { 
    // Timezone utilities
    findTimeZone,
    tzGroups
} from './utils/timezone';

export { 
    // Error utilities
    getErrorMessage,
    isErrorCode,
    ERROR_CODES,
    ERROR_CONSTANTS
} from './utils/errors';

// SDK Version
export const SDK_VERSION = '0.1.2';
export const SUPPORTED_FRAMEWORKS = ['astro', 'react', 'vue', 'svelte', 'vanilla'] as const;

// SDK initialization function
import { setGlobalConfig, type ArkyConfig } from './config';
import { businessActions } from './stores/business';

export function initArky(config: ArkyConfig): ArkyConfig {
    if (!config.apiUrl) {
        throw new Error('apiUrl is required');
    }
    if (!config.businessId) {
        throw new Error('businessId is required');
    }

    setGlobalConfig(config);

    // Initialize business store after config is set
    if (typeof window !== 'undefined') {
        businessActions.init().catch(console.error);
    }

    return config;
}