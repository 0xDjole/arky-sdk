// Main API exports - these are factory functions
export { createCmsApi } from './cms';
export { createEshopApi } from './eshop';
export { createReservationApi } from './reservation';
export { createNewsletterApi } from './newsletter';
export { createUserApi } from './user';
export { createBusinessApi } from './business';
export { createMediaApi } from './media';
export { createRoleApi } from './role';
export { createNotificationApi } from './notification';
export { createPromoCodeApi } from './promoCode';
export { createAnalyticsApi } from './analytics';
export { createPaymentApi } from './payment';
export { createBootApi } from './boot';

// Re-export types from individual files for better compatibility
export type { ApiResponse } from '../types/index';
