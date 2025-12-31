import type { Block, Location } from "./index";

export interface RequestOptions<T = any> {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  transformRequest?: (data: any) => any;
  onSuccess?: (ctx: {
    data: T;
    method: string;
    url: string;
    status: number;
    request?: any;
    durationMs?: number;
    requestId?: string | null;
  }) => void | Promise<void>;
  onError?: (ctx: {
    error: any;
    method: string;
    url: string;
    status?: number;
    request?: any;
    response?: any;
    durationMs?: number;
    requestId?: string | null;
    aborted?: boolean;
  }) => void | Promise<void>;
}

export interface EshopItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface GetQuoteParams {
  items: EshopItem[];
  paymentMethodId?: string;
  shippingMethodId?: string;
  promoCode?: string;
  location?: Location;
}

export interface OrderCheckoutParams {
  items: EshopItem[];
  paymentMethodId?: string;
  blocks?: any[];
  shippingMethodId: string;
  promoCodeId?: string;
  address?: Location;
  email?: string;
  phone?: string;
}

export interface GetProductsParams {
  ids?: string[];
  taxonomyIds?: string[] | null;
  taxonomyId?: string | null;
  blocks?: any[] | null;
  status?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  statuses?: string[];
  sortField?: string;
  sortDirection?: string;
  createdAtFrom?: number | null;
  createdAtTo?: number | null;
}

export interface GetNodesParams {
  parentId?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  type?: string;
  key?: string;
  statuses?: string[];
  sortField?: string;
  sortDirection?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface CreateNodeParams {
  key: string;
  blocks?: any[];
  parentId?: string | null;
  hasChildren?: boolean;
  seo?: any;
  status?: string;
}

export interface UpdateNodeParams {
  id: string;
  key?: string;
  blocks?: any[];
  parentId?: string | null;
  hasChildren?: boolean;
  seo?: any;
  status?: string;
}

export interface GetNodeParams {
  id: string;
}

export interface DeleteNodeParams {
  id: string;
}

export interface GetNodeChildrenParams {
  id: string;
  limit?: number;
  cursor?: string;
}

export interface UploadBusinessMediaParams {
  files?: File[];
  urls?: string[];
}

export interface DeleteBusinessMediaParams {
  id: string;
  mediaId: string;
}

export interface UpdateMediaParams {
  mediaId: string;
  seo?: any;
  title?: string;
  description?: string;
  alt?: string;
}

export interface GetBusinessMediaParams {
  cursor?: string | null;
  limit?: number;
}

export interface LoginUserParams {
  email?: string;
  password?: string;
  provider: string;
  token?: string;
  code?: string;
  originUrl?: string;
}

export interface RegisterUserParams {
  name: string;
  email: string;
  password: string;
}

export interface AddPhoneNumberParams {
  phoneNumber: string;
}

export interface PhoneNumberConfirmParams {
  phoneNumber: string;
  code: string;
}

export interface GetServicesParams {
  providerId?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  ids?: string[];
  statuses?: string[];
  taxonomyId?: string;
  blocks?: any[];
  sortField?: string;
  sortDirection?: string;
  priceFrom?: number;
  priceTo?: number;
}

export interface ReservationCheckoutParams {
  items: any[];
  paymentMethodId?: string;
  blocks?: any[];
  promoCodeId?: string;
  email?: string;
  phone?: string;
  location?: Location;
}

export interface ReservationQuoteItem {
  serviceId: string;
  from: number;
  to: number;
  providerId: string;
}

export interface GetReservationQuoteParams {
  items: ReservationQuoteItem[];
  paymentMethodId?: string;
  promoCode?: string;
  location?: Location;
}

export interface TimelinePoint {
  timestamp: number;
  concurrent: number;
}

export interface WorkingHour {
  from: number;
  to: number;
}

export interface WorkingDay {
  day: string;
  workingHours: WorkingHour[];
}

export interface OutcastDate {
  month: number;
  day: number;
  workingHours: WorkingHour[];
}

export interface SpecificDate {
  date: number;
  workingHours: WorkingHour[];
}

export interface WorkingTime {
  workingDays: WorkingDay[];
  outcastDates: OutcastDate[];
  specificDates: SpecificDate[];
}

// ServiceProvider - embedded provider with working time in a Service
export interface ServiceProvider {
  id: string;
  providerId: string;
  workingTime: WorkingTime;
  provider?: ProviderWithTimeline;
}

export interface ProviderWithTimeline {
  id: string;
  key: string;
  businessId: string;
  seo: any;
  statuses: any[];
  concurrentLimit: number;
  taxonomyIds: string[];
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  workingTime: WorkingTime | null;
  timeline: TimelinePoint[];
}

// Analytics API Types
export interface GetAnalyticsParams {
  metrics?: string[];
  period?: string;
  startDate?: string;
  endDate?: string;
  interval?: string;
}

export interface GetAnalyticsHealthParams {
  // No params needed - uses apiConfig.businessId
}

// Notification API Types
export interface TrackEmailOpenParams {
  trackingPixelId: string;
}

export interface GetDeliveryStatsParams {}

// Role API Types
export interface CreateRoleParams {
  name: string;
  parentRoles?: string[];
  permissions?: any[];
  [key: string]: any;
}

export interface UpdateRoleParams {
  id: string;
  name?: string;
  parentRoles?: string[];
  permissions?: any[];
  [key: string]: any;
}

export interface DeleteRoleParams {
  id: string;
}

export interface GetRoleParams {
  id: string;
}

export interface GetRolesParams {
  action: string;
  ids?: string[];
}

// Promo Code API Types
export interface Discount {
  type: "ITEMS_PERCENTAGE" | "ITEMS_FIXED" | "SHIPPING_PERCENTAGE";
  marketId: string;
  bps?: number;
  amount?: number;
}

export interface Condition {
  type:
    | "PRODUCTS"
    | "SERVICES"
    | "MIN_ORDER_AMOUNT"
    | "DATE_RANGE"
    | "MAX_USES"
    | "MAX_USES_PER_USER";
  value: string[] | number | { start?: number; end?: number };
}

export interface CreatePromoCodeParams {
  code: string;
  discounts: Discount[];
  conditions: Condition[];
}

export interface UpdatePromoCodeParams {
  id: string;
  code: string;
  discounts: Discount[];
  conditions: Condition[];
  statuses?: any[];
}

export interface DeletePromoCodeParams {
  id: string;
}

export interface GetPromoCodeParams {
  id: string;
}

export interface GetPromoCodesParams {
  statuses?: string[];
  query?: string;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  startsAtFrom?: string;
  startsAtTo?: string;
  expiresAtFrom?: string;
  expiresAtTo?: string;
}

// Business API Types
export interface CreateBusinessParams {
  name: string;
  slug?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: any;
  settings?: any;
  [key: string]: any;
}

export interface UpdateBusinessParams {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: any;
  settings?: any;
  [key: string]: any;
}

export interface DeleteBusinessParams {
  id: string;
}

export interface GetBusinessParams {}

export interface GetBusinessParentsParams {}

export interface TriggerBuildsParams {
  id: string;
}

export interface GetSubscriptionParams {}

export interface SubscribeParams {
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePortalSessionParams {
  returnUrl: string;
}

export interface InviteUserParams {
  email: string;
  roleIds?: string[] | null;
}

export interface HandleInvitationParams {
  token: string;
  action: string;
}

export interface TestWebhookParams {
  webhook: any;
}

// Additional CMS API Types
export interface FormPropsParams {
  isPubliclyReadable?: boolean;
  isPubliclyWritable?: boolean;
  isSubmissionEnabled?: boolean;
  isCaptchaRequired?: boolean;
  notificationEmails?: string[];
}

export interface GenerateBlocksParams {
  [key: string]: any;
}

export interface GetVariableMetadataParams {
  nodeType: string;
}

export interface UserSubscribeParams {
  target?: string;
  identifier: string;
  planId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

// E-shop API Types
export interface CreateProductParams {
  key: string;
  description?: string;
  taxonomyIds?: string[];
  blocks?: any[];
  variants?: any[];
  status?: string;
  [key: string]: any;
}

export interface UpdateProductParams {
  id: string;
  key?: string;
  description?: string;
  taxonomyIds?: string[];
  blocks?: any[];
  variants?: any[];
  status?: string;
  [key: string]: any;
}

export interface DeleteProductParams {
  id: string;
}

export interface GetProductParams {
  id: string;
}

export interface GetOrderParams {
  id: string;
}

export interface GetOrdersParams {
  userId?: string | null;
  statuses?: string[] | null;
  productIds?: string[];
  query?: string | null;
  limit?: number | null;
  cursor?: string | null;
  sortField?: string | null;
  sortDirection?: string | null;
  createdAtFrom?: string | null;
  createdAtTo?: string | null;
}

export interface UpdateOrderParams {
  id: string;
  statuses: any[];
  blocks: any[];
  items: any[];
  address?: any | null;
  email?: string | null;
  phone?: string | null;
  payment?: any | null;
}

export interface CreateOrderParams {
  [key: string]: any;
}

// Additional Reservation API Types
export interface CreateReservationParams {
  [key: string]: any;
}

export interface UpdateReservationParams {
  id: string;
  statuses?: any;
  blocks?: any;
  parts?: any;
  payment?: any | null;
  [key: string]: any;
}

export interface CreateProviderParams {
  key: string;
  taxonomyIds?: string[];
  blocks?: any[];
  concurrentLimit?: number;
  statuses?: any[];
  [key: string]: any;
}

export interface UpdateProviderParams {
  id: string;
  key?: string;
  taxonomyIds?: string[];
  blocks?: any[];
  concurrentLimit?: number;
  statuses?: any[];
  [key: string]: any;
}

export interface DeleteProviderParams {
  id: string;
}

export interface ServiceProviderInput {
  id?: string;
  providerId: string;
  workingTime: WorkingTime;
}

export interface CreateServiceParams {
  key: string;
  taxonomyIds?: string[];
  blocks?: any[];
  prices?: any[];
  durations?: any[];
  isApprovalRequired?: boolean;
  statuses?: any[];
  providers?: ServiceProviderInput[];
  [key: string]: any;
}

export interface UpdateServiceParams {
  id: string;
  key?: string;
  taxonomyIds?: string[];
  blocks?: any[];
  prices?: any[];
  durations?: any[];
  isApprovalRequired?: boolean;
  statuses?: any[];
  providers?: ServiceProviderInput[];
  [key: string]: any;
}

export interface DeleteServiceParams {
  id: string;
}

export interface BulkScheduleParams {
  serviceIds: string[];
  providerIds: string[];
  workingTime: WorkingTime;
}

export interface GetServiceParams {
  id: string;
}

export interface GetProvidersParams {
  serviceId?: string;
  ids?: string[];
  query?: string | null;
  statuses?: string[] | null;
  limit?: number;
  cursor?: string;
  sortField?: string | null;
  sortDirection?: string | null;
  createdAtFrom?: string | null;
  createdAtTo?: string | null;
  taxonomyId?: string | null;
  blocks?: string | null;
}

export interface GetProviderParams {
  id: string;
}

export interface GetBusinessServiceWorkingTimeParams {
  providerId: string;
  serviceId?: string;
}


export interface GetReservationParams {
  id: string;
}

export interface SearchReservationsParams {
  query?: string;
  serviceIds?: string[];
  providerIds?: string[];
  userId?: string;
  from?: number;
  to?: number;
  status?: string;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortOrder?: string;
}

// Additional User API Types
export interface UpdateUserProfileParams {
  name?: string;
  phoneNumbers?: string[];
  addresses?: any[];
  apiTokens?: any[] | null;
}

export interface SetRoleParams {
  userId: string;
  roleId: string;
}

export interface SearchUsersParams {
  limit?: number;
  cursor?: string | null;
  query?: string;
  roleIds?: string[];
  owner?: string;
}

export interface ConfirmUserParams {
  token: string;
}

export interface GetLoginUrlParams {
  provider: string;
  originUrl: string;
  redirectUrl: string;
}

export interface ForgotPasswordParams {
  email: string;
}

export interface ResetForgotPasswordParams {
  token: string;
  password: string;
}

export interface ResetPasswordParams {
  newPassword: string;
  oldPassword?: string;
}

export interface DeleteUserParams {}

// Notification Tracking API Types
export interface TrackEmailOpenParams {
  trackingPixelId: string;
}

export interface GetDeliveryStatsParams {}

export interface UpdateNotificationsParams {}

export interface GetMeParams {}

export interface LogoutParams {}

export interface GetBusinessesParams {}

export interface GetSubscriptionPlansParams {}

// Analytics Admin API Types
export interface SetupAnalyticsParams {
  [key: string]: any;
}

export interface GetBusinessMediaParams2 {
  id: string;
  cursor?: string | null;
  limit?: number;
}

export interface DeleteProductParams {
  id: string;
}

export interface ProcessRefundParams {
  id: string;
  entity: string;
  amount: number;
}

// Feature Flag API Types
export type FeatureFlagStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface VariantInput {
  key: string;
  name: string;
  weight: number;
  payload?: Block[];
}

export interface Variant extends VariantInput {
  assignments: number;
  conversions: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  businessId: string;
  status: FeatureFlagStatus;
  variants: Variant[];
  goalEvent?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VariantResult {
  variantKey: string;
  assignments: number;
  conversions: number;
  conversionRate: number;
  improvement?: number;
}

export interface FlagResults {
  totalAssignments: number;
  totalConversions: number;
  variantResults: VariantResult[];
}

export interface GetVariantResponse {
  flagKey: string;
  variantKey: string;
  variantName: string;
  payload: Block[];
  isNewAssignment: boolean;
}

export interface TrackEventResponse {
  tracked: boolean;
  experimentsUpdated: number;
}

export interface CreateFeatureFlagParams {
  key: string;
  name: string;
  description?: string;
  variants: VariantInput[];
  goalEvent?: string;
}

export interface UpdateFeatureFlagParams {
  id: string;
  name?: string;
  description?: string;
  variants?: VariantInput[];
  goalEvent?: string;
  status?: FeatureFlagStatus;
}

export interface DeleteFeatureFlagParams {
  id: string;
}

export interface GetFeatureFlagParams {
  id: string;
}

export interface GetFeatureFlagsParams {
  status?: FeatureFlagStatus;
}

export interface GetFeatureFlagResultsParams {
  id: string;
}

export interface GetVariantParams {
  flagKey: string;
}

export interface TrackEventParams {
  eventName: string;
  value?: number;
}

// === Newsletter Types ===

export type SendStatus = "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED" | "FAILED";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price?: number;
  marketId?: string;
}

export interface NewsletterSend {
  id: string;
  scheduledAt: number;
  status: SendStatus;
  sentCount: number;
  failedCount: number;
  createdAt: number;
}

export interface Newsletter {
  id: string;
  businessId: string;
  key: string;
  plans: SubscriptionPlan[];
  statuses: any[];
  createdAt: number;
  updatedAt: number;
}

export interface NewsletterPost {
  id: string;
  newsletterId: string;
  businessId: string;
  key: string;
  subject: string;
  contentMjml: string;
  sends: NewsletterSend[];
  statuses: any[];
  createdAt: number;
  updatedAt: number;
}

export interface SubscriberInfo {
  userId: string;
  email: string;
  name: string;
  subscribedAt: number;
}

export interface Paginated<T> {
  items: T[];
  cursor: string | null;
}

// Newsletter API Params
export interface CreateNewsletterParams {
  key: string;
  plans?: SubscriptionPlan[];
}

export interface GetNewsletterParams {
  id: string;
}

export interface GetNewslettersParams {
  limit?: number;
  cursor?: string;
}

export interface UpdateNewsletterParams {
  id: string;
  key?: string;
  plans?: SubscriptionPlan[];
  status?: string;
}

export interface DeleteNewsletterParams {
  id: string;
}

export interface GetSubscribersParams {
  id: string;
}

// Newsletter Post API Params
export interface CreateNewsletterPostParams {
  newsletterId: string;
  key: string;
  subject: string;
  contentMjml?: string;
}

export interface GetNewsletterPostParams {
  newsletterId: string;
  postId: string;
}

export interface GetNewsletterPostsParams {
  newsletterId: string;
  limit?: number;
  cursor?: string;
}

export interface UpdateNewsletterPostParams {
  newsletterId: string;
  postId: string;
  key?: string;
  subject?: string;
  contentMjml?: string;
  status?: string;
}

export interface DeleteNewsletterPostParams {
  newsletterId: string;
  postId: string;
}

// Newsletter Send API Params
export interface ScheduleSendParams {
  newsletterId: string;
  postId: string;
  scheduledAt?: number;
}

export interface CancelSendParams {
  newsletterId: string;
  postId: string;
  sendId: string;
}

// === Email Template Types ===

export type EmailType =
  | "RESERVATION_BUSINESS_UPDATE"
  | "RESERVATION_CUSTOMER_UPDATE"
  | "USER_INVITATION"
  | "ORDER_STATUS_UPDATE"
  | "USER_CONFIRMATION"
  | "FORGOT_PASSWORD"
  | "INQUIRY";

export interface EmailTemplate {
  id: string;
  businessId: string;
  emailType: EmailType;
  subject: Record<string, string>; // i18n: { en: "...", es: "..." }
  mjml: string;
  createdAt: number;
  updatedAt: number;
}

export interface EmailTemplateListItem {
  emailType: EmailType;
  displayName: string;
  isConfigured: boolean;
  template: EmailTemplate | null;
}

// Email Template API Params
export interface GetEmailTemplatesParams {
  businessId?: string;
}

export interface GetEmailTemplateParams {
  emailType: EmailType;
  businessId?: string;
}

export interface UpsertEmailTemplateParams {
  emailType: EmailType;
  subject: Record<string, string>;
  mjml: string;
  businessId?: string;
}

// === Reservation Slot Types ===

export interface GetSlotsForDateParams {
  serviceId: string;
  date: Date;
  timezone: string;
  providerId?: string;
}

export interface GetAvailabilityParams {
  serviceId: string;
  from: Date;
  to: Date;
  timezone: string;
}

export interface DayAvailability {
  date: Date;
  available: boolean;
}

/**
 * A bookable time slot returned by getSlotsForDate.
 * Contains all information needed to display and book the slot.
 */
export interface Slot {
  id: string;
  serviceId: string;
  providerId: string;
  from: number;
  to: number;
  timeText: string;
  dateText: string;
}
