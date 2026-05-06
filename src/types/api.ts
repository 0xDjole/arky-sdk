import type { Block, Zone, ZoneLocation, WorkflowNode, WorkflowEdge, Address, AudienceSubscriptionStatus, AudienceSubscriptionSource, AudienceType, IntegrationProvider, WebhookEventSubscription, Parcel, CustomsDeclaration, ShipmentLine, TaxonomyEntry, PaymentMethod, ShippingMethod, BookingServiceStatus, BookingProviderStatus, WorkflowStatus, PromoCodeStatus, AudienceStatus } from "./index";


export interface CreateLocationParams {
  key: string;
  address: Address;
  is_pickup_location?: boolean;
}

export interface UpdateLocationParams {
  id: string;
  key: string;
  address: Address;
  is_pickup_location?: boolean;
}

export interface DeleteLocationParams {
  id: string;
}


export interface CreateMarketParams {
  key: string;
  currency: string;
  tax_mode: 'inclusive' | 'exclusive';
  payment_methods?: PaymentMethod[];
  zones?: Zone[];
}

export interface UpdateMarketParams {
  id: string;
  key?: string;
  currency?: string;
  tax_mode?: 'inclusive' | 'exclusive';
  payment_methods?: PaymentMethod[];
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
    duration_ms?: number;
    request_id?: string | null;
  }) => void | Promise<void>;
  onError?: (ctx: {
    error: any;
    method: string;
    url: string;
    status?: number;
    request?: any;
    response?: any;
    duration_ms?: number;
    request_id?: string | null;
    aborted?: boolean;
  }) => void | Promise<void>;
}

export interface EshopItem {
  product_id: string;
  variant_id: string;
  quantity: number;
}

export interface GetQuoteParams {
  items: EshopItem[];
  payment_method_id?: string;
  shipping_method_id?: string;
  promo_code?: string;
  blocks?: any[];

  location?: ZoneLocation;
}

export interface OrderCheckoutParams {
  items: EshopItem[];
  payment_method_id?: string;
  blocks?: any[];
  shipping_method_id: string;
  promo_code_id?: string;

  shipping_address?: Address;

  billing_address?: Address;
}

export interface GetProductsParams {
  business_id?: string;
  ids?: string[];
  taxonomy_query?: any[];
  status?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  statuses?: string[];
  sort_field?: string;
  sort_direction?: string;
  created_at_from?: number | null;
  created_at_to?: number | null;
}

export interface GetNodesParams {
  business_id?: string;
  parent_id?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  type?: string;
  key?: string;
  statuses?: string[];
  sort_field?: string;
  sort_direction?: string;
  created_at_from?: string;
  created_at_to?: string;
}

export interface CreateNodeParams {
  business_id?: string;
  key: string;
  parent_id?: string | null;
  blocks?: any[];
  filters?: any[];
  slug?: Record<string, string>;
  audience_ids?: string[];
  status?: string;
}

export interface UpdateNodeParams {
  id: string;
  business_id?: string;
  key?: string;
  parent_id?: string | null;
  blocks?: any[];
  filters?: any[];
  slug?: Record<string, string>;
  audience_ids?: string[];
  status?: string;
}

export interface GetNodeParams {
  id?: string;
  slug?: string;
  key?: string;
  business_id?: string;
}

export interface DeleteNodeParams {
  id: string;
  business_id?: string;
}

export interface GetNodeChildrenParams {
  id: string;
  business_id?: string;
  limit?: number;
  cursor?: string;
}

export interface UploadBusinessMediaParams {
  business_id?: string;
  files?: File[];
  urls?: string[];
}

export interface DeleteBusinessMediaParams {
  id: string;
  media_id: string;
}

export interface GetMediaParams {
  media_id: string;
  business_id?: string;
}

export interface UpdateMediaParams {
  media_id: string;
  business_id?: string;
  slug?: Record<string, string>;
}

export interface GetBusinessMediaParams {
  business_id?: string;
  cursor?: string | null;
  limit: number;
  ids?: string[];
  query?: string;
  mime_type?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface LoginAccountParams {
  email?: string;
  provider: string;
  token?: string;
}

export interface MagicLinkRequestParams {
  email: string;
  business_id?: string;
}

export interface MagicLinkVerifyParams {
  email: string;
  code: string;
}


export interface GetServicesParams {
  business_id?: string;
  provider_id?: string;
  taxonomy_query?: any[];
  limit?: number;
  cursor?: string;
  query?: string;
  ids?: string[];
  statuses?: string[];
  sort_field?: string;
  sort_direction?: string;
}

export interface BookingCheckoutParams {
  business_id?: string;
  items: any[];
  payment_method_id?: string;
  forms?: any[];
  promo_code_id?: string;
}

export interface SlotRange {
  from: number;
  to: number;
}

export interface BookingQuoteItem {
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
}

export interface GetBookingQuoteParams {
  business_id?: string;
  items: BookingQuoteItem[];
  payment_method_id?: string;
  promo_code?: string;
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
  working_hours: WorkingHour[];
}

export interface SpecificDate {
  date: number;
  working_hours: WorkingHour[];
}

export interface ServiceProvider {
  id: string;
  service_id: string;
  provider_id: string;
  business_id: string;
  working_days: WorkingDay[];
  specific_dates: SpecificDate[];
  prices?: any[];
  durations?: any[];
  slot_interval: number;
  min_advance: number;
  max_advance: number;
  reminders: number[];
  created_at?: number;
  updated_at?: number;
}

export interface ProviderWithTimeline {
  id: string;
  key: string;
  business_id: string;
  seo: any;
  status: BookingProviderStatus;
  audience_ids: string[];
  blocks: Block[];
  created_at: number;
  updated_at: number;
  working_days?: WorkingDay[];
  specific_dates?: SpecificDate[];
  timeline: TimelinePoint[];
}

export interface GetAnalyticsParams {
  metrics?: string[];
  period?: string;
  start_date?: string;
  end_date?: string;
  interval?: string;
}

export interface GetAnalyticsHealthParams {
  
}

export interface TrackEmailOpenParams {
  tracking_pixel_id: string;
}

export interface GetDeliveryStatsParams {}

export type BusinessRole = 'admin' | 'owner' | 'super';

export interface Discount {
  type: "items_percentage" | "items_fixed" | "shipping_percentage";
  market_id: string;
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
  business_id?: string;
  code: string;
  discounts: Discount[];
  conditions: Condition[];
}

export interface UpdatePromoCodeParams {
  id: string;
  business_id?: string;
  code: string;
  discounts: Discount[];
  conditions: Condition[];
  status?: PromoCodeStatus;
}

export interface DeletePromoCodeParams {
  id: string;
  business_id?: string;
}

export interface GetPromoCodeParams {
  id: string;
  business_id?: string;
}

export interface GetPromoCodesParams {
  business_id?: string;
  statuses?: string[];
  query?: string;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: string;
  created_at_from?: string;
  created_at_to?: string;
  starts_at_from?: string;
  starts_at_to?: string;
  expires_at_from?: string;
  expires_at_to?: string;
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
  business_id?: string;
  plan_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreatePortalSessionParams {
  business_id?: string;
  return_url: string;
}

export interface InviteUserParams {
  email: string;
  role?: BusinessRole;
}

export interface RemoveMemberParams {
  account_id: string;
}

export interface HandleInvitationParams {
  token: string;
  action: string;
  business_id?: string;
}

export interface TestWebhookParams {
  webhook: any;
}


export interface CreateProductParams {
  business_id?: string;
  key: string;
  description?: string;
  audience_ids?: string[];
  blocks?: any[];
  taxonomies?: any[];
  variants?: any[];
  status?: string;
  [key: string]: any;
}

export interface UpdateProductParams {
  id: string;
  business_id?: string;
  key?: string;
  description?: string;
  audience_ids?: string[];
  blocks?: any[];
  taxonomies?: any[];
  variants?: any[];
  status?: string;
  [key: string]: any;
}

export interface DeleteProductParams {
  id: string;
  business_id?: string;
}

export interface GetProductParams {
  id?: string;
  slug?: string;
  business_id?: string;
}

export interface GetOrderParams {
  id: string;
  business_id?: string;
}

export interface GetOrdersParams {
  business_id?: string;
  item_statuses?: string[] | null;
  product_ids?: string[];
  verified?: boolean;
  query?: string | null;
  limit?: number | null;
  cursor?: string | null;
  sort_field?: string | null;
  sort_direction?: string | null;
  created_at_from?: string | null;
  created_at_to?: string | null;
}

export interface UpdateOrderParams {
  id: string;
  business_id?: string;
  status: string;
  blocks: any[];
  items: any[];
  address?: any | null;
  billing_address?: any | null;
  payment?: Partial<import('./index').OrderPayment> | null;
  confirm?: boolean;
  cancel?: boolean;
}

export interface CreateOrderParams {
  business_id?: string;
  [key: string]: any;
}

export interface CreateBookingParams {
  business_id?: string;
  [key: string]: any;
}

export interface UpdateBookingParams {
  id: string;
  status?: 'active' | 'archived';
  forms?: any;
  items?: any;
  payment?: Partial<import('./index').BookingPayment> | null;
  [key: string]: any;
}

export interface CreateProviderParams {
  business_id?: string;
  key: string;
  audience_ids?: string[];
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingProviderStatus;
  [key: string]: any;
}

export interface UpdateProviderParams {
  id: string;
  business_id?: string;
  key?: string;
  audience_ids?: string[];
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingProviderStatus;
  [key: string]: any;
}

export interface DeleteProviderParams {
  id: string;
  business_id?: string;
}

export interface ServiceProviderInput {
  provider_id: string;
  business_id?: string;
  prices?: any[];
  durations?: any[];
  working_days: WorkingDay[];
  specific_dates: SpecificDate[];
}

export interface CreateServiceParams {
  business_id?: string;
  key: string;
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingServiceStatus;
  [key: string]: any;
}

export interface UpdateServiceParams {
  id: string;
  business_id?: string;
  key?: string;
  blocks?: any[];
  taxonomies?: any[];
  status?: BookingServiceStatus;
  [key: string]: any;
}

export interface CreateServiceProviderParams {
  business_id?: string;
  service_id: string;
  provider_id: string;
  working_days: WorkingDay[];
  specific_dates: SpecificDate[];
  prices?: any[];
  durations?: any[];
  slot_interval: number;
  min_advance?: number;
  max_advance?: number;
  reminders?: number[];
}

export interface UpdateServiceProviderParams {
  business_id?: string;
  id: string;
  working_days: WorkingDay[];
  specific_dates: SpecificDate[];
  prices?: any[];
  durations?: any[];
  slot_interval: number;
  min_advance?: number;
  max_advance?: number;
  reminders?: number[];
}

export interface DeleteServiceProviderParams {
  business_id?: string;
  id: string;
}

export interface FindServiceProvidersParams {
  business_id?: string;
  service_id?: string;
  provider_id?: string;
}

export interface DeleteServiceParams {
  id: string;
  business_id?: string;
}

export interface GetServiceParams {
  id?: string;
  slug?: string;
  business_id?: string;
}

export interface GetProvidersParams {
  business_id?: string;
  service_id?: string;
  taxonomy_query?: any[];
  ids?: string[];
  query?: string | null;
  statuses?: string[] | null;
  limit?: number;
  cursor?: string;
  sort_field?: string | null;
  sort_direction?: string | null;
  created_at_from?: string | null;
  created_at_to?: string | null;
}

export interface GetProviderParams {
  id?: string;
  slug?: string;
  business_id?: string;
}

export interface GetBookingParams {
  id: string;
  business_id?: string;
}

export interface CancelBookingItemParams {
  business_id?: string;
  booking_id: string;
  item_id: string;
  reason?: string;
}

export interface SearchBookingsParams {
  business_id?: string;
  query?: string;
  service_ids?: string[];
  provider_ids?: string[];
  from?: number;
  to?: number;
  item_statuses?: string[];
  verified?: boolean;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_order?: string;
}

export interface UpdateAccountProfileParams {
  phone_numbers?: string[];
  addresses?: any[];
  api_tokens?: any[] | null;
}

export interface SearchAccountsParams {
  limit?: number;
  cursor?: string | null;
  query?: string;
  owner?: string;
}

export interface DeleteAccountParams {}

export interface TrackEmailOpenParams {
  tracking_pixel_id: string;
}


export interface TriggerNotificationParams {
  channel: string;
  business_id: string;
  email_template_id?: string;
  recipients?: string[];
  audience_id?: string;
  vars?: Record<string, any>;
}


export interface GetEmailTemplatesParams {
  business_id?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  key?: string;
  status?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateEmailTemplateParams {
  business_id?: string;
  key: string;
  subject?: Record<string, string>;
  body?: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  preheader?: string;
}

export interface UpdateEmailTemplateParams {
  id: string;
  business_id?: string;
  key?: string;
  subject?: Record<string, string>;
  body?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  preheader?: string;
  status?: string;
}

export interface GetEmailTemplateParams {
  id?: string;
  key?: string;
  business_id?: string;
}

export interface DeleteEmailTemplateParams {
  id: string;
  business_id?: string;
}


export interface GetFormsParams {
  business_id?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  key?: string;
  status?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateFormParams {
  business_id?: string;
  key: string;
  schema?: any[];
}

export interface UpdateFormParams {
  id: string;
  business_id?: string;
  key?: string;
  schema?: any[];
  status?: string;
}

export interface GetFormParams {
  id?: string;
  key?: string;
  business_id?: string;
}

export interface DeleteFormParams {
  id: string;
  business_id?: string;
}

export interface SubmitFormParams {
  form_id: string;
  business_id?: string;
  fields: any[];
}

export interface GetFormSubmissionsParams {
  form_id: string;
  business_id?: string;
  query?: string;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface GetFormSubmissionParams {
  id: string;
  form_id: string;
  business_id?: string;
}

export interface UpdateFormSubmissionParams {
  id: string;
  form_id: string;
  business_id?: string;
  fields: any[];
}


export interface GetTaxonomiesParams {
  business_id?: string;
  parent_id?: string;
  limit?: number;
  cursor?: string;
  ids?: string[];
  query?: string;
  key?: string;
  status?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateTaxonomyParams {
  business_id?: string;
  key: string;
  parent_id?: string | null;
  schema?: any[];
}

export interface UpdateTaxonomyParams {
  id: string;
  business_id?: string;
  key?: string;
  parent_id?: string | null;
  schema?: any[];
  status?: string;
}

export interface GetTaxonomyParams {
  id?: string;
  key?: string;
  business_id?: string;
}

export interface DeleteTaxonomyParams {
  id: string;
  business_id?: string;
}

export interface GetTaxonomyChildrenParams {
  id: string;
  business_id?: string;
}

export interface GetMeParams {}

export interface LogoutParams {}

export interface GetBusinessesParams {
  query?: string;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
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
  mime_type?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
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
  business_id?: string;
  service_id: string;
  from: number;
  to: number;
  provider_id?: string;
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
  provider_id: string;
  provider_key: string;
  days: DaySlots[];
}

export interface AvailabilityResponse {
  from: number;
  to: number;
  providers: ProviderAvailability[];
}

export interface Slot {
  id: string;
  service_id: string;
  provider_id: string;
  from: number;
  to: number;
  time_text: string;
  date_text: string;
}

export interface CreateWorkflowParams {
  business_id?: string;
  key: string;
  status?: WorkflowStatus;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];

  schedule?: string;
}

export interface UpdateWorkflowParams {
  id: string;
  business_id?: string;
  key: string;
  status?: WorkflowStatus;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];

  schedule?: string;
}

export interface DeleteWorkflowParams {
  id: string;
  business_id?: string;
}

export interface GetWorkflowParams {
  id: string;
  business_id?: string;
}

export interface GetWorkflowsParams {
  business_id?: string;
  ids?: string[];
  query?: string;
  statuses?: string[];
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  created_at_from?: number;
  created_at_to?: number;
}

export interface TriggerWorkflowParams {

  secret: string;

  [key: string]: any;
}

export interface GetWorkflowExecutionsParams {
  workflow_id: string;
  business_id?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

export interface GetWorkflowExecutionParams {
  workflow_id: string;
  execution_id: string;
  business_id?: string;
}

export interface CreateAudienceParams {
  key: string;
  type?: AudienceType;
  confirm_template_id?: string;
}

export interface UpdateAudienceParams {
  id: string;
  key?: string;
  status?: AudienceStatus;
  confirm_template_id?: string;
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
  customer_id: string;
  price_id?: string;
  success_url?: string;
  cancel_url?: string;
  confirm_url?: string;
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
  customer_id: string;
  email: string;
  subscribed_at?: number;
  source?: AudienceSubscriptionSource;
  status?: AudienceSubscriptionStatus;
}

export interface RemoveAudienceSubscriberParams {
  id: string;
  customer_id: string;
}

export interface AddAudienceSubscriberParams {
  id: string;
  customer_id: string;
}

export interface AddAudienceSubscriberResponse {
  subscriber: AudienceSubscriber | null;
  skipped: boolean;
}


export interface OAuthConnectParams {
  business_id: string;
  provider: string;
  code: string;
  redirect_uri: string;
}

export interface OAuthDisconnectParams {
  business_id: string;
  provider: string;
}


export interface ListIntegrationsParams {
  business_id: string;
}

export interface GetIntegrationParams {
  business_id: string;
  id: string;
}

export interface CreateIntegrationParams {
  business_id: string;
  key: string;
  provider: IntegrationProvider;
}

export interface UpdateIntegrationParams {
  business_id: string;
  id: string;
  key?: string;
  provider?: IntegrationProvider;
}

export interface DeleteIntegrationParams {
  business_id: string;
  id: string;
}


export interface ListWebhooksParams {
  business_id: string;
}

export interface CreateWebhookParams {
  business_id: string;
  key: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  enabled: boolean;
}

export interface UpdateWebhookParams {
  business_id: string;
  id: string;
  key: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  enabled: boolean;
}

export interface DeleteWebhookParams {
  business_id: string;
  id: string;
}


export interface GetShippingRatesParams {
  order_id: string;
  shipping_provider_id: string;
  from_address: Address;
  to_address: Address;
  parcel: Parcel;
  customs_declaration?: CustomsDeclaration;
}


export interface ShipParams {
  order_id: string;
  rate_id: string;
  carrier: string;
  service: string;
  location_id: string;
  lines: ShipmentLine[];
}


export type AgentStatus = 'active' | 'draft' | 'archived';

export interface CreateAgentParams {
  business_id?: string;
  key: string;
  prompt: string;
  status?: AgentStatus;
  model_id: string;
  channel_ids?: string[];
}

export interface UpdateAgentParams {
  id: string;
  business_id?: string;
  key: string;
  prompt: string;
  status: AgentStatus;
  model_id: string;
  channel_ids?: string[];
}

export interface DeleteAgentParams {
  id: string;
  business_id?: string;
}

export interface GetAgentParams {
  id: string;
  business_id?: string;
}

export interface GetAgentsParams {
  business_id?: string;
  limit?: number;
  cursor?: string;
}

export interface RunAgentParams {
  id: string;
  business_id?: string;
  message: string;
  chat_id?: string;
  direct?: boolean;
}

export interface GetAgentChatsParams {
  id: string;
  business_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetBusinessChatsParams {
  business_id?: string;
  agent_id?: string;
  status?: string;
  query?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface GetAgentChatParams {
  id: string;
  business_id?: string;
  chat_id: string;
}

export interface UpdateAgentChatParams {
  id: string;
  business_id?: string;
  chat_id: string;
  status: 'active' | 'archived';
}

export interface RateAgentChatParams {
  id: string;
  business_id?: string;
  chat_id: string;
  rating: number;
  comment?: string;
}


export interface AuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: number;
  refresh_expires_at: number;
  created_at: number;
  last_used_at: number;
  is_verified: boolean;
}

export interface CustomerInfo {
  id: string;
  verified: boolean;
}

export interface CustomerAuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: number;
  refresh_expires_at: number;
  created_at: number;
  last_used_at: number;
  is_verified: boolean;
  user_agent?: string | null;
}

export interface CustomerVerificationCode {
  code: string;
  created_at: number;
  used: boolean;
  business_id?: string | null;
}

export interface PromoUsage {
  promo_code_id: string;
  uses: number;
}

export interface Customer {
  id: string;
  business_id: string;
  emails: string[];
  status: 'active' | 'archived';
  promo_usage: PromoUsage[];
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  auth_tokens: CustomerAuthToken[];
  verification_codes: CustomerVerificationCode[];
  addresses: Address[];
  audience_subscriptions: any[];
  created_at: number;
  updated_at: number;
}

export interface ConnectCustomerParams {
  email: string;
  business_id?: string;
}

export interface CreateCustomerParams {
  business_id?: string;
  email: string;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
}

export interface UpdateCustomerParams {
  id: string;
  business_id?: string;
  emails?: string[];
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  status?: 'active' | 'archived';
  addresses?: Address[];
}

export interface GetCustomerParams {
  id: string;
  business_id?: string;
}

export interface FindCustomersParams {
  business_id?: string;
  query?: string;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: string;
}

export interface MergeCustomersParams {
  target_id: string;
  source_id: string;
  business_id?: string;
}
