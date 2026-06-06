import type {
  Block,
  Zone,
  ZoneLocation,
  WorkflowNode,
  WorkflowEdge,
  Address,
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
  EmailTemplateUsage,
  EmailTemplateVariable,
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
  ProfileStatus,
  ProfileListStatus,
  ProfileListType,
  ProfileListSource,
  ProfileListMembershipStatus,
  MailboxStatus,
  MailboxProvider,
  CampaignStatus,
  CampaignRecipientStatus,
  CampaignMessageDirection,
  CampaignMessageKind,
  CampaignMessageStatus,
  CampaignMessageCopySource,
  OutreachStep,
  LeadResearchRunStatus,
  SuppressionStatus,
  SuppressionReason,
  SuppressionSource,
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
  tax_mode: "inclusive" | "exclusive";
  payment_methods?: PaymentMethod[];
  zones?: Zone[];
}

export interface UpdateMarketParams {
  id: string;
  key?: string;
  currency?: string;
  tax_mode?: "inclusive" | "exclusive";
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
  type: "service";
}

export type OrderQuoteItemInput = ProductQuoteItemInput | ServiceQuoteItemInput;

export type QuoteItemInput = OrderQuoteItemInput;

export type OrderQuoteCompatibleItemInput =
  | OrderQuoteItemInput
  | EshopQuoteItem
  | ServiceQuoteItem;

export interface ProductCheckoutItemInput extends EshopItem {
  type: "product";
  id?: string;
}

export interface ServiceCheckoutItemInput {
  type: "service";
  id?: string;
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
  forms?: FormEntry[];
}

export type OrderCheckoutItemInput =
  | ProductCheckoutItemInput
  | ServiceCheckoutItemInput;

export type CheckoutItemInput = OrderCheckoutItemInput;

export type OrderCheckoutCompatibleItemInput =
  | OrderCheckoutItemInput
  | EshopItem
  | ServiceCheckoutPart;

export interface TrustedProductCheckoutItemInput extends ProductCheckoutItemInput {
  price?: Price;
}

export interface TrustedServiceCheckoutItemInput extends ServiceCheckoutItemInput {
  price?: Price;
}

export type TrustedOrderCheckoutItemInput =
  | TrustedProductCheckoutItemInput
  | TrustedServiceCheckoutItemInput;

export type TrustedOrderCheckoutCompatibleItemInput =
  | TrustedOrderCheckoutItemInput
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

export interface GetCurrentCartParams {
  store_id?: string;
  market?: string;
}

export interface GetCartParams {
  id: string;
  store_id?: string;
  token?: string;
}

export interface FindCartsParams {
  store_id?: string;
  profile_id?: string;
  statuses?: import("./index").CartStatus[];
  origins?: import("./index").CartOrigin[];
  has_items?: boolean;
  limit?: number;
  cursor?: string;
}

export interface CreateCartParams {
  store_id?: string;
  profile_id: string;
  market: string;
  items?: TrustedOrderCheckoutCompatibleItemInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms?: FormEntry[];
  promo_code?: string | null;
  payment_method_id?: string | null;
  shipping_method_id?: string | null;
}

export interface UpdateCartParams {
  id: string;
  store_id?: string;
  market?: string;
  items?: OrderCheckoutCompatibleItemInput[];
  shipping_address?: Address;
  billing_address?: Address;
  forms?: FormEntry[];
  promo_code?: string;
  payment_method_id?: string;
  shipping_method_id?: string;
}

export interface AddCartItemParams {
  id: string;
  store_id?: string;
  item: OrderCheckoutCompatibleItemInput;
}

export interface RemoveCartItemParams {
  id: string;
  store_id?: string;
  item_id?: string;
  product_id?: string;
  variant_id?: string;
}

export interface ClearCartParams {
  id: string;
  store_id?: string;
}

export interface QuoteCartParams {
  id: string;
  store_id?: string;
}

export interface CheckoutCartParams {
  id: string;
  store_id?: string;
  payment_method_id?: string;
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
  sort_direction?: "asc" | "desc";
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
  sort_direction?: "asc" | "desc";
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
  sort_direction?: "asc" | "desc";
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
  sort_direction?: "asc" | "desc";
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

export interface GetAnalyticsHealthParams {}

export interface TrackEmailOpenParams {
  tracking_pixel_id: string;
}

export interface GetDeliveryStatsParams {}

export type StoreRole = "admin" | "owner" | "super";

export type Discount =
  | { type: "items_percentage"; market_id: string; bps: number }
  | { type: "items_fixed"; market_id: string; amount: number }
  | { type: "shipping_percentage"; market_id: string; bps: number };

export type ConditionValue =
  | { type: "ids"; value: string[] }
  | { type: "amount"; value: number }
  | { type: "count"; value: number }
  | { type: "date_range"; value: { start?: number; end?: number } };

export interface Condition {
  type:
    | "products"
    | "services"
    | "min_order_amount"
    | "date_range"
    | "max_uses"
    | "max_uses_per_user";
  value: ConditionValue;
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
  code?: string;
  discounts?: Discount[];
  conditions?: Condition[];
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
  ids?: string[];

  query?: string | number;
  status?: PromoCodeStatus;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
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

export interface AddMemberParams {
  email: string;
  role?: StoreRole;
  store_id?: string;
}

export interface InviteUserParams extends AddMemberParams {}

export interface RemoveMemberParams {
  account_id: string;
}

export interface TestWebhookParams {
  webhook: import("./index").Webhook;
}

export interface CreateProductVariantInput {
  sku?: string;
  prices: Price[];
  inventory: import("./index").ProductInventory[];
  attributes: Block[];
  weight?: number;
}

export interface UpdateProductVariantInput {
  id: string;
  sku?: string | null;
  prices?: Price[];
  inventory?: import("./index").ProductInventory[];
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
  profile_id?: string;
  statuses?: string[];
  item_statuses?: string[];
  product_ids?: string[];
  verified?: boolean;

  query?: string | number | null;
  limit?: number | null;
  cursor?: string | null;
  sort_field?: string | null;
  sort_direction?: "asc" | "desc" | null;
  created_at_from?: number | null;
  created_at_to?: number | null;
  profile_list_id?: string;
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
  items?: TrustedOrderCheckoutCompatibleItemInput[];
  payment?: import("./index").OrderPayment;
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
  sort_direction?: "asc" | "desc" | null;
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
  profile_id?: string;
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
  profile_list_id?: string;
}

export interface AccountAddress {
  label?: string;
  address: Address;
}

export interface AccountApiToken {
  id: string | null;
  value?: string;
  name?: string | null;
  created_at?: number;
  expires_at?: number | null;
  type?: string;
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
  store_id?: string;
  sort_field?: string | null;
  sort_direction?: "asc" | "desc" | null;
}

export interface DeleteAccountParams {}

export interface TriggerNotificationParams {
  channel: string;
  store_id: string;
  email_template_id: string;
  mailbox_id: string;
  recipients: string[];
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
  variables?: EmailTemplateVariable[];
  sample_data?: Record<string, unknown>;
  usage?: EmailTemplateUsage;
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
  variables?: EmailTemplateVariable[];
  sample_data?: Record<string, unknown>;
  usage?: EmailTemplateUsage;
  status?: EmailTemplateStatus;
}

export interface PreviewEmailTemplateParams {
  id: string;
  store_id?: string;
  subject?: Record<string, string>;
  body?: string;
  preheader?: string | null;
  vars?: Record<string, any>;
}

export interface PreviewEmailTemplateWarning {
  kind: string;
  variable: string;
  message: string;
}

export interface PreviewEmailTemplateResponse {
  subject: string;
  html: string;
  warnings: PreviewEmailTemplateWarning[];
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
  profile_id?: string;

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
  profile_id?: string;
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
  sort_direction?: "asc" | "desc";
}

export interface ProcessOrderRefundParams {
  id: string;
  amount: number;
}

export type SystemTemplateKey =
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
  sort_direction?: "asc" | "desc";
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
  status?: import("./index").ExecutionStatus;
  limit?: number;
  cursor?: string;
}

export interface GetWorkflowExecutionParams {
  workflow_id: string;
  execution_id: string;
  store_id?: string;
}

export interface CreateProfileListParams {
  store_id?: string;
  key: string;
  name?: string;
  description?: string | null;
  type?: ProfileListType;
  source?: ProfileListSource;
}

export interface UpdateProfileListParams {
  id: string;
  store_id?: string;
  key?: string;
  name?: string;
  description?: string | null;
  status?: ProfileListStatus;
  type?: ProfileListType;
}

export interface FindProfileListsParams {
  store_id?: string;
  ids?: string[];
  status?: ProfileListStatus;
  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface GetProfileListParams {
  id: string;
  store_id?: string;
}

export interface AddProfileListProfileParams {
  store_id?: string;
  profile_list_id: string;
  profile_id: string;
  fields?: Record<string, unknown>;
  lead_description?: string | null;
}

export interface UpdateProfileListProfileParams {
  store_id?: string;
  profile_list_id: string;
  profile_id: string;
  status?: ProfileListMembershipStatus;
  fields?: Record<string, unknown>;
  lead_description?: string | null;
}

export interface RemoveProfileListProfileParams {
  store_id?: string;
  profile_list_id: string;
  profile_id: string;
}

export interface FindProfileListProfilesParams {
  store_id?: string;
  profile_list_id?: string;
  profile_id?: string;
  status?: ProfileListMembershipStatus;
  limit?: number;
  cursor?: string;
}

export interface ImportProfileRowInput {
  email: string;
  profile_id?: string;
  fields?: Record<string, unknown>;
  lead_description?: string;
}

export interface ImportProfilesParams {
  store_id?: string;
  csv?: string;
  spreadsheet_base64?: string;
  sheet_name?: string | null;
  email_column?: string | null;
  field_mappings?: ImportFieldMapping[];
  rows?: ImportProfileRowInput[];
}

export interface ImportProfilesIntoProfileListParams {
  store_id?: string;
  profile_list_id: string;
  csv?: string;
  spreadsheet_base64?: string;
  sheet_name?: string | null;
  email_column?: string | null;
  field_mappings?: ImportFieldMapping[];
  rows?: ImportProfileRowInput[];
}

export interface ImportProfilesPreviewParams {
  store_id?: string;
  csv?: string;
  spreadsheet_base64?: string;
  sheet_name?: string | null;
}

export interface ImportProfileListPreviewParams extends ImportProfilesPreviewParams {
  profile_list_id: string;
}

export interface ImportFieldMapping {
  source: string;
  field: string;
}

export interface ImportPreviewRow {
  row: number;
  values: Record<string, unknown>;
}

export interface ImportProfilesPreviewResult {
  sheets: string[];
  selected_sheet?: string | null;
  header_row: number;
  headers: string[];
  detected_email_column?: string | null;
  rows_total: number;
  sample_rows: ImportPreviewRow[];
  suggested_field_mappings: ImportFieldMapping[];
}

export interface ImportProfileRowError {
  row: number;
  field: string;
  message: string;
}

export interface ImportProfileRowResult {
  row: number;
  email: string;
  profile_id?: string | null;
  created: boolean;
  updated: boolean;
  error?: string | null;
}

export interface ImportProfilesResult {
  rows_total: number;
  profiles_created: number;
  profiles_updated: number;
  rows_failed: number;
  errors: ImportProfileRowError[];
  rows: ImportProfileRowResult[];
}

export interface ImportProfileListRowResult {
  row: number;
  email: string;
  profile_id?: string | null;
  profile_created: boolean;
  profile_updated: boolean;
  added_to_list: boolean;
  updated_in_list: boolean;
  error?: string | null;
}

export interface ImportProfilesIntoProfileListResult {
  rows_total: number;
  profiles_created: number;
  profiles_updated: number;
  profiles_added: number;
  profiles_updated_in_list: number;
  profiles_failed_to_add: number;
  rows_failed: number;
  errors: ImportProfileRowError[];
  rows: ImportProfileListRowResult[];
}

export interface SubscribeProfileListParams {
  store_id?: string;
  id: string;
  profile_id: string;
  price_id?: string;
  success_url?: string;
  cancel_url?: string;
  confirm_url?: string;
}

export interface ProfileListAccessParams {
  store_id?: string;
  id: string;
}

export interface CreateMailboxParams {
  store_id?: string;
  key: string;
  email: string;
  from_name?: string;
  reply_to_email?: string | null;
  provider: MailboxProvider;
  password?: string;
  daily_limit?: number;
}

export interface UpdateMailboxParams {
  id: string;
  store_id?: string;
  key?: string;
  email?: string;
  from_name?: string;
  reply_to_email?: string | null;
  provider?: MailboxProvider;
  password?: string;
  status?: MailboxStatus;
  daily_limit?: number;
}

export interface FindMailboxesParams {
  store_id?: string;
  ids?: string[];
  status?: MailboxStatus;
  provider_type?: "fake" | "smtp_imap";
  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface GetMailboxParams {
  id: string;
  store_id?: string;
}

export interface TestMailboxParams {
  id: string;
  store_id?: string;
}

export interface PrepareMailboxParams {
  id: string;
  store_id?: string;
}

export interface TestMailboxResult {
  ok: boolean;
  smtp_ok: boolean;
  imap_ok: boolean;
  skipped: boolean;
  smtp_error?: string | null;
  imap_error?: string | null;
}

export interface CreateCampaignParams {
  store_id?: string;
  key: string;
  name?: string;
  mailbox_ids: string[];
  steps: OutreachStep[];
}

export interface UpdateCampaignParams {
  id: string;
  store_id?: string;
  key?: string;
  name?: string;
  mailbox_ids?: string[];
  status?: CampaignStatus;
  steps?: OutreachStep[];
}

export interface FindCampaignsParams {
  store_id?: string;
  ids?: string[];
  status?: CampaignStatus;
  mailbox_id?: string;
  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface GetCampaignParams {
  id: string;
  store_id?: string;
}

export interface LaunchCampaignParams {
  id: string;
  store_id?: string;
}

export interface DuplicateCampaignParams {
  id: string;
  store_id?: string;
  key?: string;
  name?: string;
  copy_recipients?: boolean;
}

export interface GetCampaignLaunchReadinessParams {
  id: string;
  store_id?: string;
}

export interface ImportCampaignRecipientsParams {
  id: string;
  store_id?: string;
  profile_list_id?: string;
  profile_list_ids?: string[];
  profile_ids?: string[];
  emails?: string[];
}

export interface CampaignRecipientImportResult {
  imported_count: number;
  existing_count: number;
  skipped_count: number;
  draft_count: number;
}

export interface GenerateOutreachPersonalizedDraftsParams {
  id: string;
  store_id?: string;
  step_position?: number;
  profile_ids?: string[];
  overwrite?: boolean;
  model_integration_id?: string;
  instructions?: string;
}

export interface FindCampaignRecipientsParams {
  store_id?: string;
  campaign_id?: string;
  profile_id?: string;
  mailbox_id?: string;
  status?: CampaignRecipientStatus;
  limit?: number;
  cursor?: string;
}

export interface UpdateCampaignRecipientParams {
  store_id?: string;
  id: string;
  mailbox_id?: string | null;
  lead_description?: string | null;
  fields?: Record<string, unknown>;
}

export interface UpdateCampaignRecipientDraftParams {
  store_id?: string;
  id: string;
  draft_id: string;
  subject?: string;
  body?: string;
}

export interface FindCampaignMessagesParams {
  store_id?: string;
  campaign_id?: string;
  campaign_recipient_id?: string;
  profile_id?: string;
  mailbox_id?: string;
  direction?: CampaignMessageDirection;
  kind?: CampaignMessageKind;
  status?: CampaignMessageStatus;
  copy_source?: CampaignMessageCopySource;
  step_position?: number;
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface GetCampaignRecipientConversationParams {
  store_id?: string;
  id: string;
  message_limit?: number;
  after_created_at?: number;
  after_id?: string;
}

export interface ReplyCampaignRecipientParams {
  store_id?: string;
  id: string;
  subject?: string | null;
  body: string;
  attachments?: string[];
}

export interface StopCampaignRecipientParams {
  store_id?: string;
  id: string;
}

export interface UpdateCampaignMessageParams {
  id: string;
  store_id?: string;
  subject?: string;
  body?: string;
}

export interface CreateSuppressionParams {
  store_id?: string;
  campaign_id?: string;
  profile_id?: string;
  email?: string;
  domain?: string;
  reason?: SuppressionReason;
  source?: SuppressionSource;
}

export interface UpdateSuppressionParams {
  id: string;
  store_id?: string;
  status?: SuppressionStatus;
  reason?: SuppressionReason;
}

export interface FindSuppressionsParams {
  store_id?: string;
  status?: SuppressionStatus;
  profile_id?: string;
  email?: string;
  domain?: string;
  campaign_id?: string;
  reason?: SuppressionReason;
  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface GetSuppressionParams {
  id: string;
  store_id?: string;
}

export interface CreateLeadResearchRunParams {
  store_id?: string;
  integration_id: string;
  profile_list_id?: string;
  title?: string;
}

export interface FindLeadResearchRunsParams {
  store_id?: string;
  status?: LeadResearchRunStatus;
  profile_list_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetLeadResearchRunParams {
  id: string;
  store_id?: string;
}

export interface UpdateLeadResearchRunParams {
  id: string;
  store_id?: string;
  integration_id: string;
}

export interface CancelLeadResearchRunParams {
  id: string;
  store_id?: string;
}

export interface SendLeadResearchMessageParams {
  run_id: string;
  store_id?: string;
  message: string;
}

export interface FindLeadResearchMessagesParams {
  run_id: string;
  store_id?: string;
  limit?: number;
  after_created_at?: number;
  after_id?: string;
}

export interface ValidateLeadEmailParams {
  store_id?: string;
  email: string;
  website_url?: string;
  email_source_url?: string;
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

export interface AuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: number;
  refresh_expires_at: number;
  created_at: number;
  is_verified: boolean;
}

export interface ProfileInfo {
  id: string;
  verified: boolean;
}

export interface ProfileAuthToken {
  id: string;
  token: string;
  created_at: number;
}

export interface ProfileVerificationCode {
  code: string;
  created_at: number;
  used: boolean;
  store_id?: string | null;
}

export interface PromoUsage {
  promo_code_id: string;
  uses: number;
}

export interface Profile {
  id: string;
  store_id: string;
  email: string | null;
  verified: boolean;
  status: ProfileStatus;
  promo_usage: PromoUsage[];
  lists: import("./index").ProfileListMembership[];
  taxonomies: TaxonomyEntry[];
  auth_tokens: ProfileAuthToken[];
  verification_codes: ProfileVerificationCode[];
  created_at: number;
  updated_at: number;
}

export interface ProfileDetail {
  profile: Profile;
  carts: import("./index").Cart[];
  orders: import("./index").Order[];
  form_submissions: import("./index").FormSubmission[];
}

export interface SetProfileEmailParams {
  email: string;
  store_id?: string;
}

export interface CreateProfileParams {
  store_id?: string;
  email: string;
  taxonomies?: TaxonomyEntry[];
}

export interface UpdateProfileParams {
  id: string;
  store_id?: string;
  email?: string;
  taxonomies?: TaxonomyEntry[];
  status?: ProfileStatus;
}

export interface GetProfileParams {
  id: string;
  store_id?: string;
}

export interface FindProfilesParams {
  store_id?: string;
  ids?: string[];

  query?: string | number;
  taxonomy_query?: TaxonomyQuery[];
  status?: ProfileStatus;
  has_activity?: boolean;
  has_cart?: boolean;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface MergeProfilesParams {
  target_id: string;
  source_id: string;
  store_id?: string;
}
