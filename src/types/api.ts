import type { Block, ZoneLocation, WorkflowNode, Status, SubscriptionPrice, Address } from "./index";

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
  blocks?: any[];
  /** Zone location for zone/market resolution */
  location?: ZoneLocation;
}

export interface OrderCheckoutParams {
  items: EshopItem[];
  paymentMethodId?: string;
  blocks?: any[];
  shippingMethodId: string;
  promoCodeId?: string;
  /** Shipping address for the order */
  shippingAddress?: Address;
  /** Billing address (defaults to shipping address if not provided) */
  billingAddress?: Address;
}

export interface GetProductsParams {
  ids?: string[];
  blocks?: any[] | null;
  filterId?: string;
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
  businessId?: string;
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
  includeChildren?: boolean;
}

export interface CreateNodeParams {
  businessId?: string;
  key: string;
  parentId?: string | null;
  blocks?: any[];
  slug?: Record<string, string>;
  writeAccess?: 'public' | 'private';
  audienceIds?: string[];
  status?: string;

  emailSubject?: Record<string, string>;
}

export interface UpdateNodeParams {
  id: string;
  businessId?: string;
  key?: string;
  parentId?: string | null;
  blocks?: any[];
  slug?: Record<string, string>;
  writeAccess?: 'public' | 'private';
  audienceIds?: string[];
  status?: string;

  emailSubject?: Record<string, string>;
}

export interface GetNodeParams {
  id?: string;
  slug?: string;
  key?: string;
  businessId?: string;
}

export interface DeleteNodeParams {
  id: string;
  businessId?: string;
}

export interface GetNodeChildrenParams {
  id: string;
  businessId?: string;
  limit?: number;
  cursor?: string;
}

export interface UploadBusinessMediaParams {
  businessId?: string;
  files?: File[];
  urls?: string[];
}

export interface DeleteBusinessMediaParams {
  id: string;
  mediaId: string;
}

export interface GetMediaParams {
  mediaId: string;
  businessId?: string;
}

export interface UpdateMediaParams {
  mediaId: string;
  businessId?: string;
  slug?: Record<string, string>;
}

export interface GetBusinessMediaParams {
  businessId?: string;
  cursor?: string | null;
  limit: number;
  ids?: string[];
  query?: string;
  mimeType?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface LoginAccountParams {
  email?: string;
  provider: string;
  token?: string;
}

export interface MagicLinkRequestParams {
  email: string;
  businessId?: string;
}

export interface MagicLinkVerifyParams {
  email: string;
  code: string;
}


export interface GetServicesParams {
  businessId?: string;
  providerId?: string;
  filterId?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  ids?: string[];
  statuses?: string[];
  blocks?: any[];
  sortField?: string;
  sortDirection?: string;
  priceFrom?: number;
  priceTo?: number;
}

export interface BookingCheckoutParams {
  businessId?: string;
  items: any[];
  paymentMethodId?: string;
  blocks?: any[];
  promoCodeId?: string;
  /** Zone location for zone/market resolution */
  location?: ZoneLocation;
}

export interface BookingQuoteItem {
  serviceId: string;
  from: number;
  to: number;
  providerId: string;
}

export interface GetBookingQuoteParams {
  businessId?: string;
  items: BookingQuoteItem[];
  paymentMethodId?: string;
  promoCode?: string;
  /** Zone location for zone/market resolution */
  location?: ZoneLocation;
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
  status: Status;
  concurrentLimit: number;
  audienceIds: string[];
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  workingTime: WorkingTime | null;
  timeline: TimelinePoint[];
}

export interface GetAnalyticsParams {
  metrics?: string[];
  period?: string;
  startDate?: string;
  endDate?: string;
  interval?: string;
}

export interface GetAnalyticsHealthParams {
  
}

export interface TrackEmailOpenParams {
  trackingPixelId: string;
}

export interface GetDeliveryStatsParams {}

export type BusinessRole = 'admin' | 'owner' | 'super';

export interface Discount {
  type: "items_percentage" | "items_fixed" | "shipping_percentage";
  marketId: string;
  bps?: number;
  amount?: number;
}

export interface Condition {
  type:
    | "products"
    | "services"
    | "min_order_amount"
    | "date_range"
    | "max_uses"
    | "max_uses_per_user";
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
  status?: Status;
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

export interface CreateBusinessParams {
  key: string;
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
  key: string;
  networkKey: string | null;
  timezone: string;
  status: Status;
  configs: any;
}

export interface DeleteBusinessParams {
  id: string;
}

export interface GetBusinessParams {}


export interface TriggerBuildsParams {
  id: string;
}


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
  role?: BusinessRole;
}

export interface RemoveMemberParams {
  accountId: string;
}

export interface HandleInvitationParams {
  token: string;
  action: string;
}

export interface TestWebhookParams {
  webhook: any;
}


export interface CreateProductParams {
  key: string;
  description?: string;
  audienceIds?: string[];
  blocks?: any[];
  filters?: any[];
  variants?: any[];
  status?: string;
  [key: string]: any;
}

export interface UpdateProductParams {
  id: string;
  key?: string;
  description?: string;
  audienceIds?: string[];
  blocks?: any[];
  filters?: any[];
  variants?: any[];
  status?: string;
  [key: string]: any;
}

export interface DeleteProductParams {
  id: string;
}

export interface GetProductParams {
  id?: string;
  slug?: string;
}

export interface GetOrderParams {
  id: string;
}

export interface GetOrdersParams {
  accountId?: string | null;
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
  status: string;
  blocks: any[];
  items: any[];
  address?: any | null;
  billingAddress?: any | null;
  payment?: any | null;
}

export interface CreateOrderParams {
  [key: string]: any;
}

export interface CreateBookingParams {
  businessId?: string;
  [key: string]: any;
}

export interface UpdateBookingParams {
  id: string;
  status?: string;
  blocks?: any;
  parts?: any;
  payment?: any | null;
  [key: string]: any;
}

export interface CreateProviderParams {
  businessId?: string;
  key: string;
  audienceIds?: string[];
  blocks?: any[];
  filters?: any[];
  concurrentLimit?: number;
  status?: Status;
  [key: string]: any;
}

export interface UpdateProviderParams {
  id: string;
  businessId?: string;
  key?: string;
  audienceIds?: string[];
  blocks?: any[];
  filters?: any[];
  concurrentLimit?: number;
  status?: Status;
  [key: string]: any;
}

export interface DeleteProviderParams {
  id: string;
  businessId?: string;
}

export interface ServiceProviderInput {
  id?: string;
  providerId: string;
  prices?: any[];
  durations?: any[];
  isApprovalRequired?: boolean;
  workingTime: WorkingTime;
  audienceIds: string[];
}

export interface CreateServiceParams {
  businessId?: string;
  key: string;
  blocks?: any[];
  filters?: any[];
  status?: Status;
  providers?: ServiceProviderInput[];
  [key: string]: any;
}

export interface UpdateServiceParams {
  id: string;
  businessId?: string;
  key?: string;
  blocks?: any[];
  filters?: any[];
  status?: Status;
  providers?: ServiceProviderInput[];
  [key: string]: any;
}

export interface DeleteServiceParams {
  id: string;
  businessId?: string;
}

export interface GetServiceParams {
  id?: string;
  slug?: string;
  businessId?: string;
}

export interface GetProvidersParams {
  businessId?: string;
  serviceId?: string;
  filterId?: string;
  ids?: string[];
  query?: string | null;
  statuses?: string[] | null;
  limit?: number;
  cursor?: string;
  sortField?: string | null;
  sortDirection?: string | null;
  createdAtFrom?: string | null;
  createdAtTo?: string | null;
  blocks?: string | null;
}

export interface GetProviderParams {
  id?: string;
  slug?: string;
  businessId?: string;
}

export interface GetBusinessServiceWorkingTimeParams {
  providerId: string;
  serviceId?: string;
}

export interface GetBookingParams {
  id: string;
  businessId?: string;
}

export interface SearchBookingsParams {
  businessId?: string;
  query?: string;
  serviceIds?: string[];
  providerIds?: string[];
  accountId?: string;
  from?: number;
  to?: number;
  status?: string;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortOrder?: string;
}

export interface UpdateAccountProfileParams {
  phoneNumbers?: string[];
  addresses?: any[];
  apiTokens?: any[] | null;
}

export interface SearchAccountsParams {
  limit?: number;
  cursor?: string | null;
  query?: string;
  owner?: string;
}

export interface DeleteAccountParams {}

export interface TrackEmailOpenParams {
  trackingPixelId: string;
}


export interface TriggerNotificationParams {
  channel: string;
  businessId: string;
  nodeId?: string;
  recipients?: string[];
  audienceId?: string;
  fromName?: string;
  vars?: Record<string, any>;
}

export interface GetMeParams {}

export interface LogoutParams {}

export interface GetBusinessesParams {
  query?: string;
  isNetwork?: boolean;
  statuses?: string[];
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface GetSubscriptionPlansParams {}

export interface SetupAnalyticsParams {
  [key: string]: any;
}

export interface GetBusinessMediaParams2 {
  id: string;
  cursor?: string | null;
  limit: number;
  ids?: string[];
  query?: string;
  mimeType?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DeleteProductParams {
  id: string;
}

export interface ProcessRefundParams {
  id: string;
  entity: string;
  amount: number;
}

export type SystemTemplateKey =
  | "system:booking-business-update"
  | "system:booking-customer-update"
  | "system:user-invitation"
  | "system:order-status-update"
  | "system:user-confirmation"
  | "system:forgot-password";

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

export interface Slot {
  id: string;
  serviceId: string;
  providerId: string;
  from: number;
  to: number;
  timeText: string;
  dateText: string;
}

export interface CreateWorkflowParams {
  businessId?: string;
  key: string;
  status?: Status;
  nodes: Record<string, WorkflowNode>;

  schedule?: string;
}

export interface UpdateWorkflowParams {
  id: string;
  key: string;
  status?: Status;
  nodes: Record<string, WorkflowNode>;

  schedule?: string;
}

export interface DeleteWorkflowParams {
  id: string;
}

export interface GetWorkflowParams {
  id: string;
}

export interface GetWorkflowsParams {
  businessId?: string;
  ids?: string[];
  query?: string;
  statuses?: string[];
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  createdAtFrom?: number;
  createdAtTo?: number;
}

export interface TriggerWorkflowParams {

  secret: string;

  [key: string]: any;
}

export interface GetWorkflowExecutionsParams {
  workflowId: string;
  businessId?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

export interface GetWorkflowExecutionParams {
  workflowId: string;
  executionId: string;
  businessId?: string;
}

export interface CreateAudienceParams {
  key: string;
  name: string;
  prices?: SubscriptionPrice[];
}

export interface UpdateAudienceParams {
  id: string;
  key?: string;
  name?: string;
  prices?: SubscriptionPrice[];
  status?: Status;
}

export interface GetAudienceParams {
  id?: string;
  key?: string;
}

export interface GetAudiencesParams {
  ids?: string[];
  statuses?: string[];
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface SubscribeAudienceParams {
  id: string;
  
  priceId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface DeleteAudienceParams {
  id: string;
}

export interface GetAudienceSubscribersParams {
  id: string;
  limit?: number;
  cursor?: string;
}

export enum SubscriptionSource {
  Signup = 'signup',
  Admin = 'admin',
  Import = 'import'
}

export interface AudienceSubscriber {
  accountId: string;
  email: string;
  subscribedAt?: number;
  source?: SubscriptionSource;
}

export interface RemoveAudienceSubscriberParams {
  id: string;
  accountId: string;
}

export interface AddAudienceSubscriberParams {
  id: string;
  email: string;
}

export interface AddAudienceSubscriberResponse {
  subscriber: AudienceSubscriber | null;
  skipped: boolean;
}


export interface OAuthConnectParams {
  businessId: string;
  provider: string;
  code: string;
  redirectUri: string;
}

export interface OAuthDisconnectParams {
  businessId: string;
  provider: string;
}

// Shipping API Parameters

/** Get shipping rates for a shipment */
export interface GetShippingRatesParams {
  orderId: string;
  shippingProviderId: string;
  fromAddress: Address;
  toAddress: Address;
  parcel: import('./index').Parcel;
  customsDeclaration?: import('./index').CustomsDeclaration;
}

/** Ship items: creates shipment + purchases label atomically */
export interface ShipParams {
  orderId: string;
  rateId: string;
  carrier: string;
  service: string;
  locationId: string;
  lines: import('./index').ShipmentLine[];
}

// ===== Agent API Parameters =====

export type AgentStatus = 'active' | 'disabled';
export type AgentProvider = 'deep_seek' | 'open_ai' | 'google_gemini' | 'perplexity';

export interface AgentProviderConfig {
  type: AgentProvider;
  integrationId: string;
  model: string;
}

export interface CreateAgentParams {
  businessId?: string;
  key: string;
  rolePrompt: string;
  status?: AgentStatus;
  provider: AgentProviderConfig;
  toolsConfig?: string[];
}

export interface UpdateAgentParams {
  id: string;
  key: string;
  rolePrompt: string;
  status: AgentStatus;
  provider: AgentProviderConfig;
  toolsConfig: string[];
}

export interface DeleteAgentParams {
  id: string;
}

export interface GetAgentParams {
  id: string;
}

export interface GetAgentsParams {
  businessId?: string;
  limit?: number;
  cursor?: string;
}

export interface SetupChannelWebhookParams {
  businessId?: string;
  integrationId: string;
  webhookBaseUrl: string;
}

export interface RunAgentParams {
  id: string;
  message: string;
}

export interface GetAgentMemoriesParams {
  id: string;
  category?: 'soul' | 'message' | 'fact';
  limit?: number;
}

export interface DeleteAgentMemoryParams {
  id: string;
  memoryId: string;
}

