// Main API exports - these are factory functions
export { createCmsApi } from './cms';
export { createEshopApi } from './eshop';
export { createReservationApi } from './reservation';
export { createAccountApi } from './account';
export { createBusinessApi } from './business';
export { createMediaApi } from './media';
export { createNotificationApi } from './notification';
export { createPromoCodeApi } from './promoCode';
export { createAnalyticsApi } from './analytics';
export { createDatabaseApi } from './database';
export { createLocationApi } from './location';
export { createNetworkApi } from './network';
export { createWorkflowApi } from './workflow';
export { createAudienceApi } from './audience';

// Re-export types from individual files for better compatibility
export type { ApiResponse } from '../types/index';
