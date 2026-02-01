import type { Block, ZoneLocation, WorkflowNode, WorkflowEdge, Status, SubscriptionPrice, Address } from "./index";

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
  nodeIds?: string[] | null;
  nodeId?: string | null;
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
  access?: 'public' | 'private';
  writeAccess?: 'public' | 'private';
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
  access?: 'public' | 'private';
  writeAccess?: 'public' | 'private';
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

export interface UpdateMediaParams {
  mediaId: string;
  businessId?: string;
  seo?: any;
  title?: string;
  description?: string;
  alt?: string;
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

export interface AddPhoneNumberParams {
  phoneNumber: string;
}

export interface PhoneNumberConfirmParams {
  phoneNumber: string;
  code: string;
}

export interface GetServicesParams {
  businessId?: string;
  providerId?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  ids?: string[];
  statuses?: string[];
  nodeId?: string;
  blocks?: any[];
  sortField?: string;
  sortDirection?: string;
  priceFrom?: number;
  priceTo?: number;
}

export interface ReservationCheckoutParams {
  businessId?: string;
  items: any[];
  paymentMethodId?: string;
  blocks?: any[];
  promoCodeId?: string;
  /** Zone location for zone/market resolution */
  location?: ZoneLocation;
}

export interface ReservationQuoteItem {
  serviceId: string;
  from: number;
  to: number;
  providerId: string;
}

export interface GetReservationQuoteParams {
  businessId?: string;
  items: ReservationQuoteItem[];
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
  nodeIds: string[];
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
  role?: BusinessRole;
}

export interface HandleInvitationParams {
  token: string;
  action: string;
}

export interface TestWebhookParams {
  webhook: any;
}

export interface GenerateBlocksParams {
  [key: string]: any;
}

export interface GetVariableMetadataParams {
  nodeType: string;
}

export interface AccountSubscribeParams {
  target?: string;
  identifier: string;
  planId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateProductParams {
  key: string;
  description?: string;
  nodeIds?: string[];
  blocks?: any[];
  variants?: any[];
  status?: string;
  [key: string]: any;
}

export interface UpdateProductParams {
  id: string;
  key?: string;
  description?: string;
  nodeIds?: string[];
  blocks?: any[];
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

export interface CreateReservationParams {
  businessId?: string;
  [key: string]: any;
}

export interface UpdateReservationParams {
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
  nodeIds?: string[];
  blocks?: any[];
  concurrentLimit?: number;
  status?: Status;
  [key: string]: any;
}

export interface UpdateProviderParams {
  id: string;
  businessId?: string;
  key?: string;
  nodeIds?: string[];
  blocks?: any[];
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
  workingTime: WorkingTime;
}

export interface CreateServiceParams {
  businessId?: string;
  key: string;
  nodeIds?: string[];
  blocks?: any[];
  prices?: any[];
  durations?: any[];
  isApprovalRequired?: boolean;
  status?: Status;
  providers?: ServiceProviderInput[];
  [key: string]: any;
}

export interface UpdateServiceParams {
  id: string;
  businessId?: string;
  key?: string;
  nodeIds?: string[];
  blocks?: any[];
  prices?: any[];
  durations?: any[];
  isApprovalRequired?: boolean;
  status?: Status;
  providers?: ServiceProviderInput[];
  [key: string]: any;
}

export interface DeleteServiceParams {
  id: string;
  businessId?: string;
}

export interface BulkScheduleParams {
  serviceIds: string[];
  providerIds: string[];
  workingTime: WorkingTime;
}

export interface GetServiceParams {
  id?: string;
  slug?: string;
  businessId?: string;
}

export interface GetProvidersParams {
  businessId?: string;
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
  nodeId?: string | null;
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

export interface GetReservationParams {
  id: string;
  businessId?: string;
}

export interface SearchReservationsParams {
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

export interface GetDeliveryStatsParams {}

export interface UpdateNotificationsParams {}

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
  | "system:reservation-business-update"
  | "system:reservation-customer-update"
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
  edges: WorkflowEdge[];
  
  schedule?: string;
}

export interface UpdateWorkflowParams {
  id: string;
  key: string;
  status?: Status;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
  
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

export interface CreateAudienceParams {
  key: string;
  name: string;
  nodeIds?: string[];
  prices?: SubscriptionPrice[];
}

export interface UpdateAudienceParams {
  id: string;
  key?: string;
  name?: string;
  nodeIds?: string[];
  prices?: SubscriptionPrice[];
  status?: Status;
}

export interface GetAudienceParams {
  id: string;
}

export interface GetAudiencesParams {
  ids?: string[];
  nodeId?: string;
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

export interface AudienceSubscriber {
  accountId: string;
  email: string;
  subscribedAt?: number;
}

export interface RevokeAudienceSubscriptionParams {
  id: string;
  accountId: string;
}

export interface GetBusinessEventsParams {
  entity: string;
  limit?: number;
  cursor?: string;
}

export interface UpdateBusinessEventParams {
  eventId: string;
  payload: import('./index').BusinessEventAction;
}

export interface ConnectStripeParams {
  businessId: string;
  code: string;
}

export interface DisconnectStripeParams {
  businessId: string;
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
  fulfillmentCenterId: string;
  lines: import('./index').ShipmentLine[];
}
