// Main API exports
export { cmsApi } from "./cms";
export { eshopApi } from "./eshop";
export { reservationApi } from "./reservation";
export { newsletterApi } from "./newsletter";

// Re-export types from individual files for better compatibility
export type { ApiResponse, Newsletter, PaginatedResponse } from "../types/index";
