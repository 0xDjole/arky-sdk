import type { Block, Zone, ZoneLocation, WorkflowNode, Address, AudienceSubscriptionStatus, AudienceSubscriptionSource, AudienceType, IntegrationProvider, WebhookEventSubscription, Parcel, CustomsDeclaration, ShipmentLine, TaxonomyEntry, PaymentMethod, ShippingMethod, BookingServiceStatus, BookingProviderStatus, WorkflowStatus, PromoCodeStatus, AudienceStatus } from "./index";


export interface CreateLocationParams {
  key: string;
  address: Address;
  isPickupLocation?: boolean;
}

export interface UpdateLocationParams {
  id: string;
  key: string;
  address: Address;
  isPickupLocation?: boolean;
}

export interface DeleteLocationParams {
  id: string;
}


export interface CreateMarketParams {
  key: string;
  currency: string;
  taxMode: 'inclusive' | 'exclusive';
  paymentMethods?: PaymentMethod[];
  zones?: Zone[];
}

export interface UpdateMarketParams {
  id: string;
  key?: string;
  currency?: string;
  taxMode?: 'inclusive' | 'exclusive';
  paymentMethods?: PaymentMethod[];
  zones?: Zone[];
}

export interface DeleteMarketParams {
  id: string;
}

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
  
  location?: ZoneLocation;
}

export interface OrderCheckoutParams {
  items: EshopItem[];
  paymentMethodId?: string;
  blocks?: any[];
  shippingMethodId: string;
  promoCodeId?: string;
  
  shippingAddress?: Address;
  
  billingAddress?: Address;
}

export interface GetProductsParams {
  ids?: string[];
  taxonomyQuery?: any[];
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
}

export interface CreateNodeParams {
  businessId?: string;
  key: string;
  parentId?: string | null;
  blocks?: any[];
  filters?: any[];
  slug?: Record<string, string>;
  audienceIds?: string[];
  status?: string;
}

export interface UpdateNodeParams {
  id: string;
  businessId?: string;
  key?: string;
  parentId?: string | null;
  blocks?: any[];
  filters?: any[];
  slug?: Record<string, string>;
  audienceIds?: string[];
  status?: string;
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
  taxonomyQuery?: any[];
  limit?: number;
  cursor?: string;
  query?: string;
  ids?: string[];
  statuses?: string[];
  sortField?: string;
  sortDirection?: string;
}

export interface BookingCheckoutParams {
  businessId?: string;
  items: any[];
  paymentMethodId?: string;
  forms?: any[];
  promoCodeId?: string;
}

export interface SlotRange {
  from: number;
  to: number;
}

export interface BookingQuoteItem {
  serviceId: string;
  providerId: string;
  slots: SlotRange[];
}

export interface GetBookingQuoteParams {
  businessId?: string;
  items: BookingQuoteItem[];
  paymentMethodId?: string;
  promoCode?: string;
}

export interface TimelinePoint {
  timestamp: number;
  booked: number;
}

export interface WorkingHour {
  from: number;
  to: number;
}

export interface WorkingDay {
  day: string;
  workingHours: WorkingHour[];
}

export interface SpecificDate {
  date: number;
  workingHours: WorkingHour[];
}

export interface CancellationRule {
  beforeHours: number;
  refundPercentage: number;
}

export interface ServiceProvider {
  id: string;
  serviceId: string;
  providerId: string;
  businessId: string;
  workingDays: WorkingDay[];
  specificDates: SpecificDate[];
  prices?: any[];
  durations?: any[];
  bookingType?: 'instant' | 'request_blocking' | 'request_non_blocking';
  slotInterval: number;
  cancellationRules: CancellationRule[];
  createdAt?: number;
  updatedAt?: number;
}

export interface ProviderWithTimeline {
  id: string;
  key: string;
  businessId: string;
  seo: any;
  status: BookingProviderStatus;
  audienceIds: string[];
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  workingDays?: WorkingDay[];
  specificDates?: SpecificDate[];
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
  status?: PromoCodeStatus;
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
  timezone: string;
  configs: any;
}

export interface DeleteBusinessParams {
  id: string;
}

export interface GetBusinessParams {}


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
  taxonomies?: any[];
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
  taxonomies?: any[];
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
  statuses?: string[] | null;
  workflowStatus?: string;
  productIds?: string[];
  verified?: boolean;
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
  payment?: Partial<import('./index').OrderPayment> | null;
  confirm?: boolean;
  cancel?: boolean;
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
  status?: 'active' | 'archived';
  approve?: boolean;
  cancel?: boolean;
  forms?: any;
  items?: any;
  payment?: Partial<import('./index').BookingPayment> | null;
  [key: string]: any;
}

export interface CreateProviderParams {
  businessId?: string;
  key: string;
  audienceIds?: string[];
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingProviderStatus;
  [key: string]: any;
}

export interface UpdateProviderParams {
  id: string;
  businessId?: string;
  key?: string;
  audienceIds?: string[];
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingProviderStatus;
  [key: string]: any;
}

export interface DeleteProviderParams {
  id: string;
  businessId?: string;
}

export interface ServiceProviderInput {
  providerId: string;
  businessId?: string;
  prices?: any[];
  durations?: any[];
  bookingType?: 'instant' | 'request_blocking' | 'request_non_blocking';
  workingDays: WorkingDay[];
  specificDates: SpecificDate[];
}

export interface CreateServiceParams {
  businessId?: string;
  key: string;
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingServiceStatus;
  [key: string]: any;
}

export interface UpdateServiceParams {
  id: string;
  businessId?: string;
  key?: string;
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingServiceStatus;
  [key: string]: any;
}

export interface CreateServiceProviderParams {
  businessId?: string;
  serviceId: string;
  providerId: string;
  workingDays: WorkingDay[];
  specificDates: SpecificDate[];
  prices?: any[];
  durations?: any[];
  bookingType?: 'instant' | 'request_blocking' | 'request_non_blocking';
  slotInterval: number;
  cancellationRules?: CancellationRule[];
}

export interface UpdateServiceProviderParams {
  businessId?: string;
  id: string;
  workingDays: WorkingDay[];
  specificDates: SpecificDate[];
  prices?: any[];
  durations?: any[];
  bookingType?: 'instant' | 'request_blocking' | 'request_non_blocking';
  slotInterval: number;
  cancellationRules?: CancellationRule[];
}

export interface DeleteServiceProviderParams {
  businessId?: string;
  id: string;
}

export interface FindServiceProvidersParams {
  businessId?: string;
  serviceId?: string;
  providerId?: string;
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
  taxonomyQuery?: any[];
  ids?: string[];
  query?: string | null;
  statuses?: string[] | null;
  limit?: number;
  cursor?: string;
  sortField?: string | null;
  sortDirection?: string | null;
  createdAtFrom?: string | null;
  createdAtTo?: string | null;
}

export interface GetProviderParams {
  id?: string;
  slug?: string;
  businessId?: string;
}

export interface GetBookingParams {
  id: string;
  businessId?: string;
}

export interface CancelBookingItemParams {
  businessId?: string;
  bookingId: string;
  itemId: string;
  reason?: string;
}

export interface SearchBookingsParams {
  businessId?: string;
  query?: string;
  serviceIds?: string[];
  providerIds?: string[];
  from?: number;
  to?: number;
  status?: string;
  workflowStatus?: string;
  verified?: boolean;
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
  emailTemplateId?: string;
  recipients?: string[];
  audienceId?: string;
  vars?: Record<string, any>;
}


export interface GetEmailTemplatesParams {
  businessId?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  key?: string;
  status?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  createdAtFrom?: number;
  createdAtTo?: number;
}

export interface CreateEmailTemplateParams {
  businessId?: string;
  key: string;
  subject?: Record<string, string>;
  body?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  preheader?: string;
}

export interface UpdateEmailTemplateParams {
  id: string;
  businessId?: string;
  key?: string;
  subject?: Record<string, string>;
  body?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  preheader?: string;
  status?: string;
}

export interface GetEmailTemplateParams {
  id?: string;
  key?: string;
  businessId?: string;
}

export interface DeleteEmailTemplateParams {
  id: string;
  businessId?: string;
}


export interface GetFormsParams {
  businessId?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  key?: string;
  status?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  createdAtFrom?: number;
  createdAtTo?: number;
}

export interface CreateFormParams {
  businessId?: string;
  key: string;
  schema?: any[];
}

export interface UpdateFormParams {
  id: string;
  businessId?: string;
  key?: string;
  schema?: any[];
  status?: string;
}

export interface GetFormParams {
  id?: string;
  key?: string;
  businessId?: string;
}

export interface DeleteFormParams {
  id: string;
  businessId?: string;
}

export interface SubmitFormParams {
  formId: string;
  businessId?: string;
  fields: any[];
}

export interface GetFormSubmissionsParams {
  formId: string;
  businessId?: string;
  query?: string;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  createdAtFrom?: number;
  createdAtTo?: number;
}

export interface GetFormSubmissionParams {
  id: string;
  formId: string;
  businessId?: string;
}

export interface UpdateFormSubmissionParams {
  id: string;
  formId: string;
  businessId?: string;
  fields: any[];
}


export interface GetTaxonomiesParams {
  businessId?: string;
  parentId?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  key?: string;
  status?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  createdAtFrom?: number;
  createdAtTo?: number;
}

export interface CreateTaxonomyParams {
  businessId?: string;
  key: string;
  parentId?: string | null;
  schema?: any[];
}

export interface UpdateTaxonomyParams {
  id: string;
  businessId?: string;
  key?: string;
  parentId?: string | null;
  schema?: any[];
  status?: string;
}

export interface GetTaxonomyParams {
  id?: string;
  key?: string;
  businessId?: string;
}

export interface DeleteTaxonomyParams {
  id: string;
  businessId?: string;
}

export interface GetTaxonomyChildrenParams {
  id: string;
  businessId?: string;
}

export interface GetMeParams {}

export interface LogoutParams {}

export interface GetBusinessesParams {
  query?: string;
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

export interface ProcessBookingRefundParams {
  id: string;
  amount: number;
}

export interface ProcessOrderRefundParams {
  id: string;
  amount: number;
}

export type SystemTemplateKey =
  | "system:booking-business-update"
  | "system:booking-customer-update"
  | "system:user-invitation"
  | "system:order-status-update"
  | "system:user-confirmation"
  | "system:forgot-password";

export interface GetAvailabilityParams {
  businessId?: string;
  serviceId: string;
  month: string;
  providerId?: string;
}

export interface AvailabilitySlot {
  from: number;
  to: number;
  spots: number;
}

export interface DaySlots {
  date: string;
  slots: AvailabilitySlot[];
}

export interface ProviderAvailability {
  providerId: string;
  providerKey: string;
  days: DaySlots[];
}

export interface AvailabilityResponse {
  month: string;
  providers: ProviderAvailability[];
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
  status?: WorkflowStatus;
  nodes: Record<string, WorkflowNode>;

  schedule?: string;
}

export interface UpdateWorkflowParams {
  id: string;
  key: string;
  status?: WorkflowStatus;
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
  type?: AudienceType;
  confirmTemplateId?: string;
}

export interface UpdateAudienceParams {
  id: string;
  key?: string;
  status?: AudienceStatus;
  confirmTemplateId?: string;
}

export interface GetAudienceParams {
  id?: string;
  key?: string;
}

export interface GetAudiencesParams {
  ids?: string[];
  status?: string;
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface SubscribeAudienceParams {
  id: string;
  customerId: string;
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  confirmUrl?: string;
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
  customerId: string;
  email: string;
  subscribedAt?: number;
  source?: AudienceSubscriptionSource;
  status?: AudienceSubscriptionStatus;
}

export interface RemoveAudienceSubscriberParams {
  id: string;
  customerId: string;
}

export interface AddAudienceSubscriberParams {
  id: string;
  customerId: string;
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


export interface ListIntegrationsParams {
  businessId: string;
}

export interface GetIntegrationParams {
  businessId: string;
  id: string;
}

export interface CreateIntegrationParams {
  businessId: string;
  key: string;
  provider: IntegrationProvider;
}

export interface UpdateIntegrationParams {
  businessId: string;
  id: string;
  key?: string;
  provider?: IntegrationProvider;
}

export interface DeleteIntegrationParams {
  businessId: string;
  id: string;
}


export interface ListWebhooksParams {
  businessId: string;
}

export interface CreateWebhookParams {
  businessId: string;
  key: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  enabled: boolean;
}

export interface UpdateWebhookParams {
  businessId: string;
  id: string;
  key: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  enabled: boolean;
}

export interface DeleteWebhookParams {
  businessId: string;
  id: string;
}


export interface GetShippingRatesParams {
  orderId: string;
  shippingProviderId: string;
  fromAddress: Address;
  toAddress: Address;
  parcel: Parcel;
  customsDeclaration?: CustomsDeclaration;
}


export interface ShipParams {
  orderId: string;
  rateId: string;
  carrier: string;
  service: string;
  locationId: string;
  lines: ShipmentLine[];
}


export type AgentStatus = 'active' | 'draft' | 'archived';

export interface CreateAgentParams {
  businessId?: string;
  key: string;
  prompt: string;
  status?: AgentStatus;
  modelId: string;
  channelIds?: string[];
}

export interface UpdateAgentParams {
  id: string;
  key: string;
  prompt: string;
  status: AgentStatus;
  modelId: string;
  channelIds?: string[];
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

export interface RunAgentParams {
  id: string;
  message: string;
  chatId?: string;
  direct?: boolean;
}

export interface GetAgentChatsParams {
  id: string;
  limit?: number;
  cursor?: string;
}

export interface GetBusinessChatsParams {
  businessId?: string;
  agentId?: string;
  status?: string;
  query?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface GetAgentChatParams {
  id: string;
  chatId: string;
}

export interface UpdateAgentChatParams {
  id: string;
  chatId: string;
  status: 'active' | 'archived';
}

export interface RateAgentChatParams {
  id: string;
  chatId: string;
  rating: number;
  comment?: string;
}


export interface AuthToken {
  id: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  createdAt: number;
  lastUsedAt: number;
  isVerified: boolean;
}

export interface CustomerInfo {
  id: string;
  verified: boolean;
}

export interface CustomerAuthToken {
  id: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  createdAt: number;
  lastUsedAt: number;
  isVerified: boolean;
  userAgent?: string | null;
}

export interface CustomerVerificationCode {
  code: string;
  createdAt: number;
  used: boolean;
  businessId?: string | null;
}

export interface PromoUsage {
  promoCodeId: string;
  uses: number;
}

export interface Customer {
  id: string;
  businessId: string;
  emails: string[];
  status: 'active' | 'archived';
  promoUsage: PromoUsage[];
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  authTokens: CustomerAuthToken[];
  verificationCodes: CustomerVerificationCode[];
  audienceSubscriptions: any[];
  reactions: any[];
  createdAt: number;
  updatedAt: number;
}

export interface ConnectCustomerParams {
  email: string;
  businessId?: string;
}

export interface CreateCustomerParams {
  businessId?: string;
  email: string;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
}

export interface UpdateCustomerParams {
  id: string;
  businessId?: string;
  emails?: string[];
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  status?: 'active' | 'archived';
}

export interface GetCustomerParams {
  id: string;
  businessId?: string;
}

export interface FindCustomersParams {
  businessId?: string;
  query?: string;
  limit?: number;
  cursor?: string;
  sortField?: string;
  sortDirection?: string;
}

export interface MergeCustomersParams {
  targetId: string;
  sourceId: string;
  businessId?: string;
}
