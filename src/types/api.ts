import type {
  Block,
  Zone,
  ZoneLocation,
  WorkflowNode,
  WorkflowEdge,
  Address,
  AudienceSubscriptionStatus,
  AudienceSubscriptionSource,
  AudienceType,
  IntegrationProvider,
  WebhookEventSubscription,
  Parcel,
  CustomsDeclaration,
  ShipmentLine,
  TaxonomyEntry,
  TaxonomyQuery,
  PaymentMethod,
  ServiceStatus,
  ProviderStatus,
  WorkflowStatus,
  PromoCodeStatus,
  ProductStatus,
  NodeStatus,
  EmailTemplateStatus,
  FormStatus,
  TaxonomyStatus,
  FormSchema,
  FormField,
  FormEntry,
  TaxonomySchema,
  Price,
  ServiceDuration,
  WorkingDay,
  SpecificDate,
  Language,
  StoreEmails,
  AgentChatStatus,
  CustomerStatus,
  AudienceStatus,
} from "./index";


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

export interface EshopQuoteItem {
  product_id: string;
  variant_id: string;
  quantity: number;
  price?: Price;
}

export interface SlotRange {
  from: number;
  to: number;
}

export interface ServiceQuoteItem {
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
  forms?: FormEntry[];
  price?: Price;
}

export interface ServiceCheckoutPart {
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
  forms: FormEntry[];
}

export interface ProductQuoteItemInput extends EshopQuoteItem {
  type: "product";
}

export interface ServiceQuoteItemInput extends ServiceQuoteItem {
  type: "booking";
}

export type OrderQuoteItemInput =
  | ProductQuoteItemInput
  | ServiceQuoteItemInput;

export type QuoteItemInput = OrderQuoteItemInput;

export type OrderQuoteCompatibleItemInput =
  | OrderQuoteItemInput
  | EshopQuoteItem
  | ServiceQuoteItem;

export interface ProductCheckoutItemInput extends EshopItem {
  type: "product";
}

export interface ServiceCheckoutItemInput {
  type: "booking";
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
  forms?: FormEntry[];
  price?: Price;
}

export type OrderCheckoutItemInput =
  | ProductCheckoutItemInput
  | ServiceCheckoutItemInput;

export type CheckoutItemInput = OrderCheckoutItemInput;

export type OrderCheckoutCompatibleItemInput =
  | OrderCheckoutItemInput
  | EshopItem
  | ServiceCheckoutPart;


export interface GetQuoteParams {
  store_id?: string;
  market?: string;
  items: OrderQuoteCompatibleItemInput[];
  shipping_address?: Address;
  billing_address?: Address;
  forms?: FormEntry[];
  payment_method_id?: string;
  promo_code?: string;
  shipping_method_id?: string;

  location?: ZoneLocation;
}


export interface OrderCheckoutParams {
  store_id?: string;
  market?: string;
  items: OrderCheckoutCompatibleItemInput[];
  payment_method_id?: string;
  shipping_address?: Address;
  billing_address?: Address;
  forms?: FormEntry[];
  promo_code_id?: string;
  shipping_method_id?: string;
}

export interface GetProductsParams {
  store_id?: string;
  ids?: string[];
  taxonomy_query?: TaxonomyQuery[];
  match_all?: boolean;
  status?: ProductStatus;

  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  created_at_from?: number | null;
  created_at_to?: number | null;
}

export interface GetNodesParams {
  store_id?: string;
  ids?: string[];
  parent_id?: string;
  key?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
  status?: NodeStatus;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateNodeParams {
  store_id?: string;
  key: string;
  parent_id?: string | null;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  slug?: Record<string, string>;
}

export interface UpdateNodeParams {
  id: string;
  store_id?: string;
  key?: string;
  parent_id?: string | null;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  status?: NodeStatus;
  slug?: Record<string, string>;
}

export interface GetNodeParams {
  id?: string;
  slug?: string;
  key?: string;
  store_id?: string;
}

export interface DeleteNodeParams {
  id: string;
  store_id?: string;
}

export interface GetNodeChildrenParams {
  id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface UploadStoreMediaParams {
  store_id?: string;
  files?: File[];
  urls?: string[];
}

export interface DeleteStoreMediaParams {
  id: string;
  media_id: string;
}

export interface GetMediaParams {
  media_id: string;
  store_id?: string;
}

export interface UpdateMediaParams {
  media_id: string;
  store_id?: string;
  slug?: Record<string, string>;
}

export interface GetStoreMediaParams {
  store_id?: string;
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
  store_id?: string;
}

export interface MagicLinkVerifyParams {
  email: string;
  code: string;
}


export interface GetServicesParams {
  store_id?: string;
  ids?: string[];
  provider_id?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
  status?: ServiceStatus;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  created_at_from?: number;
  created_at_to?: number;
  taxonomy_query?: TaxonomyQuery[];
  match_all?: boolean;
  from?: number;
  to?: number;
}

export interface TimelinePoint {
  timestamp: number;
  booked: number;
}

export interface ProviderWithTimeline {
  id: string;
  key: string;
  store_id: string;
  slug: Record<string, string>;
  status: ProviderStatus;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
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

export type StoreRole = 'admin' | 'owner' | 'super';

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
  store_id?: string;
  code: string;
  discounts: Discount[];
  conditions: Condition[];
}

export interface UpdatePromoCodeParams {
  id: string;
  store_id?: string;
  code: string;
  discounts: Discount[];
  conditions: Condition[];
  status?: PromoCodeStatus;
}

export interface DeletePromoCodeParams {
  id: string;
  store_id?: string;
}

export interface GetPromoCodeParams {
  id: string;
  store_id?: string;
}

export interface GetPromoCodesParams {
  store_id?: string;

  query?: string | number;
  status?: PromoCodeStatus;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  created_at_from?: number;
  created_at_to?: number;
  starts_at_from?: number;
  starts_at_to?: number;
  expires_at_from?: number;
  expires_at_to?: number;
}

export interface CreateStoreParams {
  key: string;
  timezone: string;
  billing_email: string;
  languages?: Language[];
  emails?: StoreEmails;
}

export interface UpdateStoreParams {
  id: string;
  key?: string;
  timezone?: string;
  languages?: Language[];
  emails?: StoreEmails;
}

export interface DeleteStoreParams {
  id: string;
}

export interface GetStoreParams {}


export interface SubscribeParams {
  store_id?: string;
  plan_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreatePortalSessionParams {
  store_id?: string;
  return_url: string;
}

export interface InviteUserParams {
  email: string;
  role?: StoreRole;
}

export interface RemoveMemberParams {
  account_id: string;
}

export interface HandleInvitationParams {
  token: string;
  action: string;
  store_id?: string;
}

export interface TestWebhookParams {
  webhook: import('./index').Webhook;
}


export interface CreateProductVariantInput {
  sku?: string;
  prices: Price[];
  inventory: import('./index').ProductInventory[];
  attributes: Block[];
  weight?: number;
}


export interface UpdateProductVariantInput {
  id: string;
  sku?: string | null;
  prices?: Price[];
  inventory?: import('./index').ProductInventory[];
  attributes?: Block[];
  weight?: number | null;
}


export interface CreateProductParams {
  store_id?: string;
  key: string;
  slug?: Record<string, string>;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  filters?: TaxonomyEntry[];
  variants?: CreateProductVariantInput[];
}


export interface UpdateProductParams {
  id: string;
  store_id?: string;
  key?: string;
  slug?: Record<string, string>;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  filters?: TaxonomyEntry[];
  variants?: UpdateProductVariantInput[];
  status?: ProductStatus;
}

export interface DeleteProductParams {
  id: string;
  store_id?: string;
}

export interface GetProductParams {
  id?: string;
  slug?: string;
  store_id?: string;
}

export interface GetOrderParams {
  id: string;
  store_id?: string;
}

export interface GetOrdersParams {
  store_id?: string;
  customer_id?: string;
  item_statuses?: string[];
  product_ids?: string[];
  verified?: boolean;

  query?: string | number | null;
  limit?: number | null;
  cursor?: string | null;
  sort_field?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
  created_at_from?: number | null;
  created_at_to?: number | null;
  audience_id?: string;
}


export interface OrderUpdateItem extends EshopItem {}


export interface UpdateOrderParams {
  id: string;
  store_id?: string;
  confirm?: boolean;
  cancel?: boolean;

  shipping_address?: Address | null;

  billing_address?: Address | null;
  forms?: FormEntry[];
  items?: OrderCheckoutCompatibleItemInput[];
  payment?: import('./index').OrderPayment;
}


export interface CreateOrderParams {
  store_id?: string;
  market?: string;
  customer_id: string;
  forms?: FormEntry[];
  items: OrderCheckoutCompatibleItemInput[];
  shipping_address?: Address;
  billing_address?: Address;
}

export interface CreateProviderParams {
  store_id?: string;
  key: string;
  slug?: Record<string, string>;
  status?: ProviderStatus;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  filters?: TaxonomyEntry[];
}


export interface UpdateProviderParams {
  id: string;
  store_id?: string;
  key?: string;
  slug?: Record<string, string>;
  status?: ProviderStatus;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  filters?: TaxonomyEntry[];
}

export interface DeleteProviderParams {
  id: string;
  store_id?: string;
}


export interface ServiceProviderInput {
  provider_id: string;
  store_id?: string;
  prices?: Price[];
  durations?: ServiceDuration[];
  working_days: WorkingDay[];
  specific_dates: SpecificDate[];
}


export interface CreateServiceParams {
  store_id?: string;
  key: string;
  slug?: Record<string, string>;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  filters?: TaxonomyEntry[];
  location?: ZoneLocation;
  status?: ServiceStatus;
}


export interface UpdateServiceParams {
  id: string;
  store_id?: string;
  key?: string;
  slug?: Record<string, string>;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  filters?: TaxonomyEntry[];
  location?: ZoneLocation | null;
  status?: ServiceStatus;
}

export interface CreateServiceProviderParams {
  store_id?: string;
  service_id: string;
  provider_id: string;
  working_days: WorkingDay[];
  specific_dates: SpecificDate[];
  prices?: Price[];
  durations?: ServiceDuration[];
  slot_interval: number;
  forms?: FormEntry[];
  reminders?: number[];
  min_advance?: number;
  max_advance?: number;
}

export interface UpdateServiceProviderParams {
  store_id?: string;
  id: string;
  working_days?: WorkingDay[];
  specific_dates?: SpecificDate[];
  prices?: Price[];
  durations?: ServiceDuration[];
  slot_interval?: number;
  forms?: FormEntry[];
  reminders?: number[];
  min_advance?: number;
  max_advance?: number;
}

export interface DeleteServiceProviderParams {
  store_id?: string;
  id: string;
}

export interface FindServiceProvidersParams {
  store_id?: string;
  service_id?: string;
  provider_id?: string;
}

export interface DeleteServiceParams {
  id: string;
  store_id?: string;
}

export interface GetServiceParams {
  id?: string;
  slug?: string;
  store_id?: string;
}

export interface GetProvidersParams {
  store_id?: string;
  service_id?: string;
  ids?: string[];
  taxonomy_query?: TaxonomyQuery[];
  match_all?: boolean;

  query?: string | number | null;
  status?: ProviderStatus;
  limit?: number;
  cursor?: string;
  sort_field?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
  created_at_from?: number | null;
  created_at_to?: number | null;
  from?: number;
  to?: number;
}

export interface GetProviderParams {
  id?: string;
  slug?: string;
  store_id?: string;
}

export interface SearchOrderServiceItemsParams {
  store_id?: string;
  customer_id?: string;
  service_ids?: string[];
  provider_ids?: string[];
  from?: number;
  to?: number;
  item_statuses?: string[];
  sort_field?: string;
  sort_order?: string;
  limit?: number;
  cursor?: string;
  verified?: boolean;

  query?: string | number;
  audience_id?: string;
}


export interface AccountAddress {
  label?: string;
  address: Address;
}


export interface AccountApiToken {
  id: string;
  name: string;
  token: string;
  created_at: number;
  last_used_at?: number;
}


export interface UpdateAccountProfileParams {
  phone_numbers?: string[];
  addresses?: AccountAddress[];
  api_tokens?: AccountApiToken[] | null;
}

export interface SearchAccountsParams {
  limit?: number;
  cursor?: string | null;

  query?: string | number;
  owner?: string;
}

export interface DeleteAccountParams {}


export interface TriggerNotificationParams {
  channel: string;
  store_id: string;
  email_template_id?: string;
  recipients?: string[];
  audience_id?: string;
  vars?: Record<string, any>;
}


export interface GetEmailTemplatesParams {
  store_id?: string;
  ids?: string[];
  key?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
  status?: EmailTemplateStatus;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateEmailTemplateParams {
  store_id?: string;
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
  store_id?: string;
  key?: string;
  subject?: Record<string, string>;
  body?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  preheader?: string;
  status?: EmailTemplateStatus;
}

export interface GetEmailTemplateParams {
  id?: string;
  key?: string;
  store_id?: string;
}

export interface DeleteEmailTemplateParams {
  id: string;
  store_id?: string;
}


export interface GetFormsParams {
  store_id?: string;
  ids?: string[];
  key?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
  status?: FormStatus;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateFormParams {
  store_id?: string;
  key: string;
  schema?: FormSchema[];
}

export interface UpdateFormParams {
  id: string;
  store_id?: string;
  key?: string;
  schema?: FormSchema[];
  status?: FormStatus;
}

export interface GetFormParams {
  id?: string;
  key?: string;
  store_id?: string;
}

export interface DeleteFormParams {
  id: string;
  store_id?: string;
}

export interface SubmitFormParams {
  form_id: string;
  store_id?: string;
  fields: FormField[];
}

export interface GetFormSubmissionsParams {
  form_ids?: string[];
  store_id?: string;
  customer_id?: string;

  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface FindActivitiesParams {
  store_id?: string;
  customer_id?: string;
  types?: string[];
  from?: number;
  to?: number;
  limit?: number;
  cursor?: string;
}

export interface GetFormSubmissionParams {
  id: string;
  form_id: string;
  store_id?: string;
}

export interface UpdateFormSubmissionParams {
  id: string;
  form_id: string;
  store_id?: string;
  fields: FormField[];
}


export interface GetTaxonomiesParams {
  store_id?: string;
  parent_id?: string;
  ids?: string[];
  key?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
  status?: TaxonomyStatus;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateTaxonomyParams {
  store_id?: string;
  key: string;
  parent_id?: string | null;
  schema?: TaxonomySchema[];
}

export interface UpdateTaxonomyParams {
  id: string;
  store_id?: string;
  key?: string;
  parent_id?: string | null;
  schema?: TaxonomySchema[];
  status?: TaxonomyStatus;
}

export interface GetTaxonomyParams {
  id?: string;
  key?: string;
  store_id?: string;
}

export interface DeleteTaxonomyParams {
  id: string;
  store_id?: string;
}

export interface GetTaxonomyChildrenParams {
  id: string;
  store_id?: string;
}

export interface GetMeParams {}

export interface LogoutParams {}

export interface GetStoresParams {

  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface GetSubscriptionPlansParams {}


export interface SetupAnalyticsParams {
  store_id?: string;
}

export interface GetStoreMediaParams2 {
  id: string;
  cursor?: string | null;
  limit: number;
  ids?: string[];

  query?: string | number;
  mime_type?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface ProcessOrderRefundParams {
  id: string;
  amount: number;
}

export type SystemTemplateKey =
  | "system:user-invitation"
  | "system:order-status-update"
  | "system:user-confirmation"
  | "system:forgot-password";

export interface GetAvailabilityParams {
  store_id?: string;
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
  store_id?: string;
  key: string;
  status?: WorkflowStatus;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];

  schedule?: string;
}

export interface UpdateWorkflowParams {
  id: string;
  store_id?: string;
  key: string;
  status?: WorkflowStatus;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];

  schedule?: string;
}

export interface DeleteWorkflowParams {
  id: string;
  store_id?: string;
}

export interface GetWorkflowParams {
  id: string;
  store_id?: string;
}

export interface GetWorkflowsParams {
  store_id?: string;
  ids?: string[];

  query?: string | number;
  status?: WorkflowStatus;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  created_at_from?: number;
  created_at_to?: number;
}


export interface TriggerWorkflowParams {

  secret: string;

  input?: Record<string, unknown>;
}


export interface GetWorkflowExecutionsParams {
  workflow_id: string;
  store_id?: string;
  status?: import('./index').ExecutionStatus;
  limit?: number;
  cursor?: string;
}

export interface GetWorkflowExecutionParams {
  workflow_id: string;
  execution_id: string;
  store_id?: string;
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
  store_id?: string;
  ids?: string[];
  status?: import('./index').AudienceStatus;

  query?: string | number;
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
  store_id: string;
  provider: string;
  code: string;
  redirect_uri: string;
}

export interface OAuthDisconnectParams {
  store_id: string;
  provider: string;
}


export interface ListIntegrationsParams {
  store_id: string;
}

export interface GetIntegrationParams {
  store_id: string;
  id: string;
}

export interface CreateIntegrationParams {
  store_id: string;
  key: string;
  provider: IntegrationProvider;
}

export interface UpdateIntegrationParams {
  store_id: string;
  id: string;
  key?: string;
  provider?: IntegrationProvider;
}

export interface DeleteIntegrationParams {
  store_id: string;
  id: string;
}


export interface ListWebhooksParams {
  store_id: string;
}

export interface CreateWebhookParams {
  store_id: string;
  key: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  enabled: boolean;
}

export interface UpdateWebhookParams {
  store_id: string;
  id: string;
  key: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  enabled: boolean;
}

export interface DeleteWebhookParams {
  store_id: string;
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
  store_id?: string;
  key: string;
  prompt: string;
  status?: AgentStatus;
  model_id: string;
  channel_ids?: string[];
}

export interface UpdateAgentParams {
  id: string;
  store_id?: string;
  key: string;
  prompt: string;
  status: AgentStatus;
  model_id: string;
  channel_ids?: string[];
}

export interface DeleteAgentParams {
  id: string;
  store_id?: string;
}

export interface GetAgentParams {
  id: string;
  store_id?: string;
}

export interface GetAgentsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface RunAgentParams {
  id: string;
  store_id?: string;
  message: string;
  chat_id?: string;
  direct?: boolean;
}

export interface GetAgentChatsParams {
  id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetStoreChatsParams {
  store_id?: string;
  agent_id?: string;
  status?: AgentChatStatus;

  query?: string | number;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface GetAgentChatParams {
  id: string;
  store_id?: string;
  chat_id: string;
}

export interface UpdateAgentChatParams {
  id: string;
  store_id?: string;
  chat_id: string;
  status: 'active' | 'archived';
}

export interface RateAgentChatParams {
  id: string;
  store_id?: string;
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
  is_verified: boolean;
}

export interface CustomerInfo {
  id: string;
  verified: boolean;
}

export interface CustomerAuthToken {
  id: string;
  token: string;
  created_at: number;
}

export interface CustomerVerificationCode {
  code: string;
  created_at: number;
  used: boolean;
  store_id?: string | null;
}

export interface PromoUsage {
  promo_code_id: string;
  uses: number;
}

export interface Customer {
  id: string;
  store_id: string;
  email: string | null;
  verified: boolean;
  status: CustomerStatus;
  promo_usage: PromoUsage[];
  taxonomies: TaxonomyEntry[];
  auth_tokens: CustomerAuthToken[];
  verification_codes: CustomerVerificationCode[];
  created_at: number;
  updated_at: number;
}

export interface CustomerDetail {
  customer: Customer;
  orders: import('./index').Order[];
  audience_subscriptions: import('./index').AudienceSubscription[];
  form_submissions: import('./index').FormSubmission[];
}

export interface SetCustomerEmailParams {
  email: string;
  store_id?: string;
}

export interface CreateCustomerParams {
  store_id?: string;
  email: string;
  taxonomies?: TaxonomyEntry[];
}

export interface UpdateCustomerParams {
  id: string;
  store_id?: string;
  email?: string;
  taxonomies?: TaxonomyEntry[];
  status?: CustomerStatus;
}

export interface GetCustomerParams {
  id: string;
  store_id?: string;
}

export interface FindCustomersParams {
  store_id?: string;

  query?: string | number;
  taxonomy_query?: TaxonomyQuery[];
  status?: CustomerStatus;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface MergeCustomersParams {
  target_id: string;
  source_id: string;
  store_id?: string;
}
