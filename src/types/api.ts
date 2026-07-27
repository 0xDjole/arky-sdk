import type {
  Block,
  Currency,
  Zone,
  ZoneLocation,
  WorkflowNode,
  WorkflowEdge,
  Address,
  BuildHookType,
  WebhookEventSubscription,
  Parcel,
  CustomsDeclaration,
  ShippingRateLine,
  ShipmentLine,
  TaxonomyEntry,
  TaxonomyQuery,
  PaymentMethod,
  ServiceStatus,
  ProviderStatus,
  MutableWorkflowStatus,
  WorkflowStatus,
  PromoCodeStatus,
  ProductStatus,
  CollectionStatus,
  EntryStatus,
  BlockSchema,
  EntryBlockQuery,
  EmailTemplateStatus,
  EmailTemplateType,
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
  ContactStatus,
  ContactListStatus,
  ContactListType,
  ContactListSource,
  ContactListPlanStatus,
  ContactListContentAccess,
  ContactListContentAccessTarget,
  ContactListMembershipStatus,
  MailboxStatus,
  SmtpImapMailboxProviderInput,
  CampaignStatus,
  CampaignEnrollmentStatus,
  CampaignMessageDirection,
  CampaignMessageType,
  CampaignMessageStatus,
  CampaignMessageCopySource,
  OutreachStep,
  CampaignManualTaskOutcome,
  LeadResearchRunStatus,
  SuppressionStatus,
  SuppressionReason,
  SuppressionSource,
  SocialConnectionType,
  SocialPublicationCommentIntent,
  SocialPublicationCommentPriority,
  SocialPublicationCommentStatus,
  SocialPublicationContent,
  SocialPublicationStatus,
  SubscriptionPrice,
  ProductInventory,
} from "./index";

export type { RequestOptions } from "../services/createHttpClient";

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

export type MarketZoneInput = Omit<Zone, "id" | "store_id" | "market_id"> & {
  id?: string;
};

export interface CreateMarketParams {
  key: string;
  currency: Currency;
  tax_mode: "inclusive" | "exclusive";
  payment_methods?: PaymentMethod[];
  zones?: MarketZoneInput[];
}

export interface UpdateMarketParams {
  id: string;
  key?: string;
  currency?: Currency;
  tax_mode?: "inclusive" | "exclusive";
  payment_methods?: PaymentMethod[];
  zones?: MarketZoneInput[];
}

export interface DeleteMarketParams {
  id: string;
  replacement_default_market_id?: string;
}

export interface ProductCheckoutItemInput {
  type: "product";
  id?: string;
  product_id: string;
  variant_id: string;
  quantity: number;
}

export interface ProductQuoteItemInput {
  type: "product";
  product_id: string;
  variant_id: string;
  quantity: number;
  price?: Price;
}

export interface SlotRange {
  from: number;
  to: number;
}

export interface ServiceQuoteItemInput {
  type: "service";
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
  forms?: FormEntry[];
  price?: Price;
}

export interface ServiceCheckoutItemInput {
  type: "service";
  id?: string;
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
  forms?: FormEntry[];
}

export type OrderQuoteItemInput = ProductQuoteItemInput | ServiceQuoteItemInput;

export type OrderCheckoutItemInput =
  ProductCheckoutItemInput | ServiceCheckoutItemInput;

export interface TrustedProductCheckoutItemInput extends ProductCheckoutItemInput {
  price?: Price;
}

export interface TrustedServiceCheckoutItemInput extends ServiceCheckoutItemInput {
  price?: Price;
}

export type TrustedOrderCheckoutItemInput =
  TrustedProductCheckoutItemInput | TrustedServiceCheckoutItemInput;

export interface GetQuoteParams {
  store_id?: string;
  market?: string;
  items: OrderQuoteItemInput[];
  shipping_address?: Address;
  billing_address?: Address;
  forms?: FormEntry[];
  payment_method_key?: string;
  promo_code?: string;
  shipping_method_id?: string;

  location?: ZoneLocation;
}

export interface OrderCheckoutParams {
  store_id?: string;
  market?: string;
  items: OrderCheckoutItemInput[];
  payment_method_key?: string;
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
  contact_id?: string;
  statuses?: import("./index").CartStatus[];
  origins?: import("./index").CartOrigin[];
  has_items?: boolean;
  limit?: number;
  cursor?: string;
}

export interface CreateCartParams {
  store_id?: string;
  contact_id: string;
  market: string;
  items?: TrustedOrderCheckoutItemInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms?: FormEntry[];
  promo_code?: string | null;
  payment_method_key?: string | null;
  shipping_method_id?: string | null;
}

export interface UpdateCartParams {
  id: string;
  store_id?: string;
  market?: string;
  items?: OrderCheckoutItemInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms?: FormEntry[];
  promo_code?: string;
  payment_method_key?: string;
  shipping_method_id?: string;
}

export interface AddCartItemParams {
  id: string;
  store_id?: string;
  item: OrderCheckoutItemInput;
}

export type RemoveCartItemParams = {
  id: string;
  store_id?: string;
} & (
  | { item_id: string; product_id?: never; variant_id?: never }
  | { item_id?: never; product_id: string; variant_id: string }
);

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
  payment_method_key?: string;
  confirmation_token_id?: string;
  return_url?: string;
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

export interface GetCollectionsParams {
  store_id?: string;
  ids?: string[];
  key?: string;
  limit?: number;
  cursor?: string;
  query?: string | number;
  status?: CollectionStatus;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateCollectionParams {
  store_id?: string;
  key: string;
  schema?: BlockSchema[];
  blocks?: Block[];
}

export interface UpdateCollectionParams {
  id: string;
  store_id?: string;
  key?: string;
  schema?: BlockSchema[];
  blocks?: Block[];
  status?: CollectionStatus;
}

export type GetCollectionParams = {
  store_id?: string;
} & (
  | { id: string; key?: never }
  | { id?: never; key: string }
);

export interface DeleteCollectionParams {
  id: string;
  store_id?: string;
}

export interface GetEntriesParams {
  store_id?: string;
  collection_id: string;
  ids?: string[];
  key?: string;
  status?: EntryStatus;
  query?: string | number;
  filters?: EntryBlockQuery[];
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface CreateEntryParams {
  store_id?: string;
  collection_id: string;
  key: string;
  slug?: Record<string, string>;
  blocks?: Block[];
}

export interface UpdateEntryParams {
  id: string;
  store_id?: string;
  key?: string;
  slug?: Record<string, string>;
  blocks?: Block[];
  status?: EntryStatus;
}

export interface GetEntryParams {
  id: string;
  store_id?: string;
}

export interface DeleteEntryParams {
  id: string;
  store_id?: string;
}

export interface UploadStoreMediaParams {
  store_id?: string;
  files?: File[];
  urls?: string[];
}

export interface DeleteStoreMediaParams {
  store_id?: string;
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

export interface AuthCodeVerifyParams {
  challenge_id: string;
  code: string;
}

export interface VerificationChallengeResponse {
  challenge_id: string;
  expires_at: number;
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
  languages?: Language[];
  emails: StoreEmails;
}

export interface UpdateStoreParams {
  id: string;
  key?: string;
  default_market_id?: string;
  timezone?: string;
  languages?: Language[];
  emails?: StoreEmails;
}

export interface GetStoreParams {}

export type CreateStoreSubscriptionActionParams = {
  store_id?: string;
  action_id: string;
} & (
  | {
      type: "select_plan";
      plan_id: string;
      success_url: string;
      cancel_url: string;
    }
  | { type: "cancel_at_period_end" }
  | { type: "reactivate" }
);

export interface GetStoreSubscriptionParams {
  store_id?: string;
}

export interface RetryStoreSubscriptionActionParams {
  store_id?: string;
  action_id: string;
}

export interface GetStoreSubscriptionActionParams {
  store_id?: string;
  action_id: string;
}

export interface FindStoreSubscriptionActionsParams {
  store_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindStoreSubscriptionActionEffectsParams {
  store_id?: string;
  action_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetStoreSubscriptionActionEffectParams {
  store_id?: string;
  action_id: string;
  effect_id: string;
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

export interface RemoveMemberParams {
  account_id: string;
  store_id?: string;
}

export type AccountSortField = "email";

export interface FindStoreMembersParams {
  store_id?: string;
  query?: string | number;
  limit?: number;
  cursor?: string | null;
  sort_field?: AccountSortField | null;
  sort_direction?: "asc" | "desc" | null;
}

export interface TestWebhookParams {
  delivery_id: string;
  webhook_id: string;
}

export type WebhookDeliveryStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export interface TestWebhookResponse {
  delivery_id: string;
  status: WebhookDeliveryStatus;
  provider_status_code?: number | null;
  error?: string | null;
}

export type ProductInventoryInput = Pick<
  ProductInventory,
  "location_id" | "available" | "reserved"
>;

export interface CreateProductVariantInput {
  sku?: string;
  prices: Price[];
  inventory: ProductInventoryInput[];
  attributes: Block[];
  requires_shipping?: boolean;
  digital_delivery_policy?: import("./index").DigitalDeliveryPolicy;
  digital_assets?: import("./index").DigitalAsset[];
  download_limit?: number | null;
  access_expires_after_days?: number | null;
  tax_category_id?: string | null;
  weight?: number;
}

export interface UpdateProductVariantInput {
  id: string;
  sku?: string | null;
  prices?: Price[];
  inventory?: ProductInventoryInput[];
  attributes?: Block[];
  requires_shipping?: boolean;
  digital_delivery_policy?: import("./index").DigitalDeliveryPolicy;
  digital_assets?: import("./index").DigitalAsset[];
  download_limit?: number | null;
  access_expires_after_days?: number | null;
  tax_category_id?: string | null;
  weight?: number | null;
}

export interface CreateProductParams {
  store_id?: string;
  key: string;
  slug?: Record<string, string>;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  variants?: CreateProductVariantInput[];
}

export interface UpdateProductParams {
  id: string;
  store_id?: string;
  key?: string;
  slug?: Record<string, string>;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
  variants?: UpdateProductVariantInput[];
  status?: ProductStatus;
}

export interface DeleteProductParams {
  id: string;
  store_id?: string;
}

export type GetProductParams = {
  store_id?: string;
} & (
  | { id: string; slug?: never }
  | { id?: never; slug: string }
);

export interface GetOrderParams {
  id: string;
  store_id?: string;
}

export interface GetOrdersParams {
  store_id?: string;
  contact_id?: string;
  statuses?: string[];
  item_statuses?: string[];
  product_ids?: string[];
  service_ids?: string[];
  provider_ids?: string[];
  verified?: boolean;

  query?: string | number | null;
  limit?: number | null;
  cursor?: string | null;
  sort_field?: string | null;
  sort_direction?: "asc" | "desc" | null;
  created_at_from?: number | null;
  created_at_to?: number | null;
  contact_list_id?: string;
}

export interface UpdateOrderParams {
  id: string;
  revision: number;
  store_id?: string;
  confirm?: boolean;
  cancel?: boolean;

  shipping_address?: Address | null;

  billing_address?: Address | null;
  forms?: FormEntry[];
  items?: TrustedOrderCheckoutItemInput[];
}

export interface CreateProviderParams {
  store_id?: string;
  key: string;
  slug?: Record<string, string>;
  status?: ProviderStatus;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
}

export interface UpdateProviderParams {
  id: string;
  store_id?: string;
  key?: string;
  slug?: Record<string, string>;
  status?: ProviderStatus;
  blocks?: Block[];
  taxonomies?: TaxonomyEntry[];
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

export type FindServiceProvidersParams = {
  store_id?: string;
} & (
  | { service_id: string; provider_id?: string }
  | { service_id?: string; provider_id: string }
);

export interface DeleteServiceParams {
  id: string;
  store_id?: string;
}

export type GetServiceParams = {
  store_id?: string;
} & (
  | { id: string; slug?: never }
  | { id?: never; slug: string }
);

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

export type GetProviderParams = {
  store_id?: string;
} & (
  | { id: string; slug?: never }
  | { id?: never; slug: string }
);

export interface SearchOrderServiceItemsParams {
  store_id?: string;
  contact_id?: string;
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
  contact_list_id?: string;
}

export interface FindDigitalAccessGrantsParams {
  order_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetDigitalAccessGrantParams {
  order_id: string;
  grant_id: string;
  store_id?: string;
}

export type DownloadDigitalAccessParams = GetDigitalAccessGrantParams;

export interface ActivateDigitalAccessGrantParams extends GetDigitalAccessGrantParams {}

export interface RevokeDigitalAccessGrantParams extends GetDigitalAccessGrantParams {}

export interface UpdateAccountContactParams {}

export interface CreateAccountApiTokenParams {
  name: string;
  expires_at?: number | null;
}

export interface UpdateAccountApiTokenParams {
  id: string;
  name: string;
}

export interface SearchAccountsParams {
  limit?: number;
  cursor?: string | null;

  query?: string | number;
  sort_field?: AccountSortField | null;
  sort_direction?: "asc" | "desc" | null;
}

export interface DeleteAccountParams {}

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
  type: EmailTemplateType;
  subject: Record<string, string>;
  body: string;
  preheader?: string;
  variables?: EmailTemplateVariable[];
  sample_data?: Record<string, unknown>;
}

export interface UpdateEmailTemplateParams {
  id: string;
  store_id?: string;
  key?: string;
  type?: EmailTemplateType;
  subject?: Record<string, string>;
  body?: string;
  preheader?: string;
  variables?: EmailTemplateVariable[];
  sample_data?: Record<string, unknown>;
  status?: EmailTemplateStatus;
}

export interface PreviewEmailTemplateParams {
  id: string;
  store_id?: string;
  subject?: Record<string, string>;
  body?: string;
  preheader?: string | null;
  vars?: Record<string, unknown>;
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
  contact_id?: string;

  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface FindActionsParams {
  store_id?: string;
  contact_id?: string;
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

export interface CreateOrderRefundParams {
  order_id: string;
  refund_id: string;
  amount: number;
  store_id?: string;
}

export interface GetOrderPaymentParams {
  order_id: string;
  store_id?: string;
}

export interface RetryPaymentTransactionParams {
  order_id: string;
  transaction_id: string;
  store_id?: string;
}

export interface FindPaymentTransactionsParams {
  order_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetPaymentTransactionParams {
  order_id: string;
  transaction_id: string;
  store_id?: string;
}

export interface FindOrderRefundsParams {
  order_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetOrderRefundParams {
  order_id: string;
  refund_id: string;
  store_id?: string;
}

export type RefundStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export interface CreateOrderRefundResponse {
  refund_id: string;
  amount: number;
  status: RefundStatus;
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
  status?: MutableWorkflowStatus;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];

  schedule?: string;
}

export interface UpdateWorkflowParams {
  id: string;
  store_id?: string;
  key: string;
  status?: MutableWorkflowStatus;
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
  [key: string]: unknown;
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

export interface GetWorkflowEffectsParams {
  workflow_id: string;
  execution_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetWorkflowEffectParams {
  workflow_id: string;
  execution_id: string;
  effect_id: string;
  store_id?: string;
}

export interface GetWorkflowConnectionConnectUrlParams {
  store_id?: string;
  type: import("./index").WorkflowConnectionType;
}

export interface GetWorkflowConnectionsParams {
  store_id?: string;
}

export interface GetWorkflowConnectionOAuthAttemptParams {
  store_id?: string;
  attempt_id: string;
}

export interface DeleteWorkflowConnectionParams {
  id: string;
  store_id?: string;
}

export interface CreateContactListParams {
  store_id?: string;
  key: string;
  name?: string;
  description?: string | null;
  type?: ContactListType;
  content_access?: ContactListContentAccess[];
  source?: ContactListSource;
}

export interface UpdateContactListParams {
  id: string;
  store_id?: string;
  key?: string;
  name?: string;
  description?: string | null;
  status?: ContactListStatus;
  type?: ContactListType;
  content_access?: ContactListContentAccess[];
}

export interface CreateContactListPlanParams {
  store_id?: string;
  contact_list_id: string;
  key: string;
  name?: string;
  description?: string | null;
  status?: ContactListPlanStatus;
  prices: ContactListPlanPriceInput[];
  payment_provider_id?: string;
}

export interface UpdateContactListPlanParams {
  id: string;
  store_id?: string;
  contact_list_id: string;
  key?: string;
  name?: string;
  description?: string | null;
  status?: ContactListPlanStatus;
  prices?: ContactListPlanPriceInput[];
  payment_provider_id?: string;
}

export type ContactListPlanPriceInput = Omit<SubscriptionPrice, "providers">;

export interface FindContactListPlansParams {
  store_id?: string;
  contact_list_id: string;
  status?: ContactListPlanStatus;
  limit?: number;
  cursor?: string;
}

export interface FindStorefrontContactListPlansParams {
  store_id?: string;
  contact_list_id: string;
  limit?: number;
  cursor?: string;
}

export interface GetContactListPlanParams {
  id: string;
  store_id?: string;
  contact_list_id: string;
}

export interface RetryContactListPlanCatalogParams {
  store_id?: string;
  contact_list_id: string;
  plan_id: string;
}

export interface FindContactListsParams {
  store_id?: string;
  ids?: string[];
  status?: ContactListStatus;
  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface FindStorefrontContactListsParams {
  store_id?: string;
  ids?: string[];
  query?: string;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface GetContactListParams {
  id: string;
  store_id?: string;
}

export interface AddContactListContactParams {
  store_id?: string;
  contact_list_id: string;
  contact_id: string;
  fields?: Record<string, unknown>;
  lead_description?: string | null;
}

export interface UpdateContactListContactParams {
  store_id?: string;
  contact_list_id: string;
  contact_id: string;
  status?: ContactListMembershipStatus;
  fields?: Record<string, unknown>;
  lead_description?: string | null;
}

export interface RemoveContactListContactParams {
  store_id?: string;
  contact_list_id: string;
  contact_id: string;
}

export interface FindContactListContactsParams {
  store_id?: string;
  contact_list_id?: string;
  contact_id?: string;
  status?: ContactListMembershipStatus;
  limit?: number;
  cursor?: string;
}

export interface RefundContactListMembershipParams {
  store_id?: string;
  contact_list_id: string;
  membership_id: string;
  refund_id: string;
  amount?: number | null;
}

export interface RefundContactListMembershipResult {
  refund_id: string;
  amount: number;
  status: import("./index").ContactListMembershipRefundStatus;
  membership: import("./index").ContactListMembership;
}

export interface FindContactListMembershipPaymentAttemptsParams {
  store_id?: string;
  contact_list_id: string;
  membership_id: string;
  limit?: number;
  cursor?: string;
}

export interface FindStorefrontContactListMembershipsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetContactListMembershipPaymentAttemptParams {
  store_id?: string;
  contact_list_id: string;
  membership_id: string;
  id: string;
}

export interface FindContactListMembershipRefundsParams {
  store_id?: string;
  contact_list_id: string;
  membership_id: string;
  payment_attempt_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetContactListMembershipRefundParams {
  store_id?: string;
  contact_list_id: string;
  membership_id: string;
  id: string;
}

export interface RetryContactListMembershipRefundParams extends GetContactListMembershipRefundParams {}

export interface FindContactListMembershipCancellationsParams {
  store_id?: string;
  contact_list_id: string;
  membership_id: string;
  payment_attempt_id?: string;
  refund_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetContactListMembershipCancellationParams {
  store_id?: string;
  contact_list_id: string;
  membership_id: string;
  id: string;
}

export interface RetryContactListMembershipCancellationParams extends GetContactListMembershipCancellationParams {}

export interface ImportContactRowInput {
  email: string;
  contact_id?: string;
  fields?: Record<string, unknown>;
  lead_description?: string;
}

export interface ImportContactsParams {
  store_id?: string;
  csv?: string;
  spreadsheet_base64?: string;
  sheet_name?: string | null;
  email_column?: string | null;
  field_mappings?: ImportFieldMapping[];
  rows?: ImportContactRowInput[];
}

export interface ImportContactsIntoContactListParams {
  store_id?: string;
  contact_list_id: string;
  csv?: string;
  spreadsheet_base64?: string;
  sheet_name?: string | null;
  email_column?: string | null;
  field_mappings?: ImportFieldMapping[];
  rows?: ImportContactRowInput[];
}

export interface ImportContactsPreviewParams {
  store_id?: string;
  csv?: string;
  spreadsheet_base64?: string;
  sheet_name?: string | null;
}

export interface ImportContactListPreviewParams extends ImportContactsPreviewParams {
  contact_list_id: string;
}

export interface ImportFieldMapping {
  source: string;
  field: string;
}

export interface ImportPreviewRow {
  row: number;
  values: Record<string, unknown>;
}

export interface ImportContactsPreviewResult {
  sheets: string[];
  selected_sheet?: string | null;
  header_row: number;
  headers: string[];
  detected_email_column?: string | null;
  rows_total: number;
  sample_rows: ImportPreviewRow[];
  suggested_field_mappings: ImportFieldMapping[];
}

export interface ImportContactRowError {
  row: number;
  field: string;
  message: string;
}

export interface ImportContactRowResult {
  row: number;
  email: string;
  contact_id?: string | null;
  created: boolean;
  updated: boolean;
  error?: string | null;
}

export interface ImportContactsResult {
  rows_total: number;
  contacts_created: number;
  contacts_updated: number;
  rows_failed: number;
  errors: ImportContactRowError[];
  rows: ImportContactRowResult[];
}

export interface ImportContactListRowResult {
  row: number;
  email: string;
  contact_id?: string | null;
  contact_created: boolean;
  contact_updated: boolean;
  added_to_list: boolean;
  updated_in_list: boolean;
  error?: string | null;
}

export interface ImportContactsIntoContactListResult {
  rows_total: number;
  contacts_created: number;
  contacts_updated: number;
  contacts_added: number;
  contacts_updated_in_list: number;
  contacts_failed_to_add: number;
  rows_failed: number;
  errors: ImportContactRowError[];
  rows: ImportContactListRowResult[];
}

export interface SubscribeContactListParams {
  store_id?: string;
  id: string;
  contact_id: string;
  price_id?: string;
  confirm_url?: string;
  confirmation_token_id?: string;
  return_url?: string;
}

export interface ContactListAccessParams {
  store_id?: string;
  id: string;
}

export interface ContactListContentAccessParams {
  store_id?: string;
  target: ContactListContentAccessTarget;
}

export interface CreateMailboxParams {
  store_id?: string;
  key: string;
  email: string;
  from_name?: string;
  reply_to_email?: string | null;
  provider: SmtpImapMailboxProviderInput;
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
  provider?: SmtpImapMailboxProviderInput;
  password?: string;
  status?: MailboxStatus;
  daily_limit?: number;
  sync_enabled?: boolean;
  sync_interval_seconds?: number;
}

export interface FindMailboxesParams {
  store_id?: string;
  ids?: string[];
  status?: MailboxStatus;
  provider_type?: "smtp_imap" | "google";
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

export interface ConnectGoogleMailboxParams {
  id?: string | null;
  store_id?: string;
  key: string;
  from_name?: string | null;
  reply_to_email?: string | null;
  daily_limit?: number;
  sync_enabled: boolean;
  sync_interval_seconds: number;
}

export interface GetGoogleMailboxOAuthAttemptParams {
  store_id?: string;
  attempt_id: string;
}

export interface GoogleMailboxConnectUrl {
  authorization_url: string;
  state: string;
}

export type TestMailboxResult =
  | {
      type: "smtp_imap";
      ok: boolean;
      smtp_ok: boolean;
      imap_ok: boolean;
      skipped: boolean;
      smtp_error?: string | null;
      imap_error?: string | null;
    }
  | {
      type: "google";
      ok: boolean;
      skipped: boolean;
      error?: string | null;
    };

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
  copy_enrollments?: boolean;
}

export interface GetCampaignLaunchReadinessParams {
  id: string;
  store_id?: string;
}

export interface ImportCampaignEnrollmentsParams {
  id: string;
  store_id?: string;
  contact_list_id?: string;
  contact_list_ids?: string[];
  contact_ids?: string[];
  emails?: string[];
}

export interface CampaignEnrollmentImportResult {
  imported_count: number;
  existing_count: number;
  skipped_count: number;
  draft_count: number;
}

export interface GenerateOutreachPersonalizedDraftsParams {
  id: string;
  store_id?: string;
  step_position?: number;
  contact_ids?: string[];
  overwrite?: boolean;
  instructions?: string;
}

export interface FindCampaignEnrollmentsParams {
  store_id?: string;
  campaign_id?: string;
  contact_id?: string;
  mailbox_id?: string;
  status?: CampaignEnrollmentStatus;
  limit?: number;
  cursor?: string;
}

export interface UpdateCampaignEnrollmentParams {
  store_id?: string;
  id: string;
  mailbox_id?: string | null;
  lead_description?: string | null;
  fields?: Record<string, unknown>;
}

export interface UpdateCampaignEnrollmentDraftParams {
  store_id?: string;
  id: string;
  draft_id: string;
  template_vars?: Record<string, unknown>;
  body?: string;
  suggested_message?: string;
}

export interface UpdateCampaignEnrollmentStepExecutionParams {
  store_id?: string;
  id: string;
  execution_id: string;
  outcome: CampaignManualTaskOutcome;
  note?: string;
}

export interface FindCampaignMessagesParams {
  store_id?: string;
  campaign_id?: string;
  campaign_enrollment_id?: string;
  contact_id?: string;
  mailbox_id?: string;
  direction?: CampaignMessageDirection;
  type?: CampaignMessageType;
  status?: CampaignMessageStatus;
  copy_source?: CampaignMessageCopySource;
  step_position?: number;
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface GetCampaignEnrollmentConversationParams {
  store_id?: string;
  id: string;
  message_limit?: number;
  after_created_at?: number;
  after_id?: string;
}

export interface ReplyCampaignEnrollmentParams {
  message_id: string;
  store_id?: string;
  id: string;
  subject?: string | null;
  body: string;
  attachments?: string[];
}

export interface StopCampaignEnrollmentParams {
  store_id?: string;
  id: string;
}

export interface UpdateCampaignMessageParams {
  id: string;
  store_id?: string;
  template_vars?: Record<string, unknown>;
}

export interface CreateSuppressionParams {
  store_id?: string;
  campaign_id?: string;
  contact_id?: string;
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
  contact_id?: string;
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
  contact_list_id?: string;
  title?: string;
}

export interface FindLeadResearchRunsParams {
  store_id?: string;
  status?: LeadResearchRunStatus;
  contact_list_id?: string;
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
  title?: string;
}

export interface CancelLeadResearchRunParams {
  id: string;
  store_id?: string;
}

export interface SendLeadResearchMessageParams {
  message_id: string;
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

export interface ListBuildHooksParams {
  store_id: string;
}

export interface CreateBuildHookParams {
  store_id: string;
  key: string;
  type: BuildHookType;
  url: string;
  headers?: Record<string, string>;
  active?: boolean;
}

export interface UpdateBuildHookParams {
  store_id: string;
  id: string;
  key?: string;
  type?: BuildHookType;
  url?: string;
  headers?: Record<string, string>;
  active?: boolean;
}

export interface DeleteBuildHookParams {
  store_id: string;
  id: string;
}

export interface ListSocialConnectionsParams {
  store_id?: string;
}

export interface DeleteSocialConnectionParams {
  store_id: string;
  id: string;
}

export interface ListPaymentProvidersParams {
  store_id?: string;
}

export interface RefreshPaymentProvidersParams {
  store_id?: string;
}

export interface ConnectStripePaymentProviderParams {
  store_id?: string;
  return_url: string;
  refresh_url: string;
  email?: string | null;
  country?: string | null;
  connected_account_id?: string | null;
}

export interface DeletePaymentProviderParams {
  store_id: string;
  id: string;
}

export interface GetPaymentProviderDeletionParams {
  store_id: string;
  id: string;
}

export interface GetPaymentProviderConnectionParams {
  store_id: string;
  id: string;
}

export interface RetryPaymentProviderDeletionParams {
  store_id: string;
  id: string;
  expected_revision: number;
}

export interface FindSocialPublicationsParams {
  store_id?: string;
  status?: SocialPublicationStatus;
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface GetSocialPublicationParams {
  store_id?: string;
  id: string;
}

export interface ValidateSocialPublicationParams {
  store_id?: string;
  social_connection_id: string;
  scheduled_at?: number | null;
  content: SocialPublicationContent;
}

export interface CreateSocialPublicationParams {
  store_id?: string;
  social_connection_id: string;
  key?: string | null;
  scheduled_at?: number | null;
  content: SocialPublicationContent;
}

export interface UpdateSocialPublicationParams {
  store_id?: string;
  id: string;
  social_connection_id?: string | null;
  key?: string | null;
  scheduled_at?: number | null;
  content?: SocialPublicationContent | null;
}

export interface ScheduleSocialPublicationParams {
  store_id?: string;
  id: string;
  scheduled_at: number;
}

export interface CancelSocialPublicationParams {
  store_id?: string;
  id: string;
}

export interface GetSocialPublicationCommentsParams {
  store_id?: string;
  publication_id: string;
  limit?: number;
  cursor?: string | null;
}

export type SyncSocialPublicationCommentsParams =
  GetSocialPublicationCommentsParams;

export interface GetSocialPublicationCommentThreadParams {
  store_id?: string;
  publication_id: string;
  comment_id: string;
  limit?: number;
  cursor?: string | null;
}

export type SyncSocialPublicationCommentThreadParams =
  GetSocialPublicationCommentThreadParams;

export interface FindSocialPublicationCommentsParams {
  store_id?: string;
  publication_id?: string;
  social_connection_id?: string;
  type?: SocialConnectionType;
  status?: SocialPublicationCommentStatus;
  intent?: SocialPublicationCommentIntent;
  priority?: SocialPublicationCommentPriority;
  include_replies?: boolean;
  limit?: number;
  cursor?: string | null;
}

export interface ClassifySocialPublicationCommentsParams {
  store_id?: string;
  publication_id?: string;
  social_connection_id?: string;
  type?: SocialConnectionType;
  status?: SocialPublicationCommentStatus;
  intent?: SocialPublicationCommentIntent;
  priority?: SocialPublicationCommentPriority;
  limit?: number;
  force?: boolean;
}

export interface GetSocialCommentClassificationRunParams {
  store_id?: string;
  run_id: string;
}

export interface CreateSocialCommentReplyParams {
  store_id?: string;
  publication_id: string;
  comment_id: string;
  reply_id: string;
  text: string;
}

export interface ListSocialCommentRepliesParams {
  store_id?: string;
  publication_id: string;
  comment_id: string;
  limit: number;
  cursor?: string | null;
}

export interface GetSocialCommentReplyParams {
  store_id?: string;
  publication_id: string;
  comment_id: string;
  reply_id: string;
}

export type RetrySocialCommentReplyParams = GetSocialCommentReplyParams;

export interface ListSocialPublicationEffectsParams {
  store_id?: string;
  publication_id: string;
  limit: number;
  cursor?: string | null;
}

export interface GetSocialPublicationEffectParams {
  store_id?: string;
  publication_id: string;
  effect_id: string;
}

export interface GetSocialPublicationMetricsParams {
  store_id?: string;
  publication_id: string;
}

export type SyncSocialPublicationMetricsParams =
  GetSocialPublicationMetricsParams;

export interface SyncSocialEngagementParams {
  store_id?: string;
  publication_ids?: string[];
  max_publications?: number;
  max_comment_pages_per_publication?: number;
  max_comments_per_publication?: number;
  sync_metrics?: boolean;
}

export interface GetSocialCapabilitiesParams {
  store_id?: string;
}

export interface ConnectSocialConnectionParams {
  store_id?: string;
  type: SocialConnectionType;
}

export interface SelectSocialDestinationParams {
  store_id?: string;
  type: SocialConnectionType;
  attempt_id: string;
  candidate_id: string;
}

export interface GetSocialOAuthAttemptParams {
  store_id?: string;
  attempt_id: string;
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
  key?: string;
  url?: string;
  events?: WebhookEventSubscription[];
  headers?: Record<string, string>;
  secret?: string;
  enabled?: boolean;
}

export interface DeleteWebhookParams {
  store_id: string;
  id: string;
}

export interface GetShippingRatesParams {
  store_id?: string;
  order_id: string;
  location_id: string;
  lines: ShippingRateLine[];
  parcel: Parcel;
  customs_declaration?: CustomsDeclaration;
}

export interface FindShipmentsParams {
  store_id?: string;
  order_id: string;
  limit?: number;
  cursor?: string;
}

export type FindFulfillmentOrdersParams = FindShipmentsParams;

export interface GetFulfillmentOrderParams {
  store_id?: string;
  order_id: string;
  fulfillment_order_id: string;
}

export interface GetShipmentParams {
  store_id?: string;
  order_id: string;
  shipment_id: string;
}

export interface CreateShipmentParams {
  store_id?: string;
  order_id: string;
  shipment_id: string;
  rate_id: string;
  location_id: string;
  fulfillment_order_id?: string | null;
  lines: ShipmentLine[];
}

export type RetryShipmentParams = GetShipmentParams;

export type RequestShippingLabelRefundParams = GetShipmentParams;

export interface FindShippingLabelRefundsParams extends FindShipmentsParams {
  shipment_id: string;
}

export interface GetShippingLabelRefundParams extends GetShipmentParams {
  refund_id: string;
}

export type RetryShippingLabelRefundParams = GetShippingLabelRefundParams;

export interface FindShippingLabelAdjustmentsParams extends FindShipmentsParams {
  shipment_id: string;
}

export interface FindShippingLabelSettlementsParams extends FindShipmentsParams {
  shipment_id: string;
}

export interface GetShippingLabelSettlementParams extends GetShipmentParams {
  settlement_id: string;
}

export type RetryShippingLabelSettlementParams =
  GetShippingLabelSettlementParams;

export interface AuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: number;
  refresh_expires_at: number;
  created_at: number;
  is_verified: boolean;
}

export interface ContactInfo {
  id: string;
  verified: boolean;
}

export type ContactSessionStatus = "active" | "revoked" | "expired";

export interface ContactSessionRecord {
  id: string;
  store_id: string;
  contact_id: string;
  status: ContactSessionStatus;
  created_at: number;
  expires_at: number;
  revoked_at: number | null;
  last_seen_at: number | null;
}

export interface ContactSessionIssued {
  id: string;
  token: string;
  status: ContactSessionStatus;
  created_at: number;
  expires_at: number;
}

export interface FindContactSessionsParams {
  contact_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface RevokeContactSessionParams {
  contact_id: string;
  session_id: string;
  store_id?: string;
}

export interface RevokeAllContactSessionsParams {
  contact_id: string;
  store_id?: string;
}

export interface PromoUsage {
  promo_code_id: string;
  uses: number;
}

export interface Contact {
  id: string;
  store_id: string;
  email: string | null;
  verified: boolean;
  status: ContactStatus;
  channels: import("./index").ContactChannel[];
  promo_usage: PromoUsage[];
  taxonomies: TaxonomyEntry[];
  created_at: number;
  updated_at: number;
}

export interface SetContactEmailParams {
  email: string;
  store_id?: string;
}

export interface CreateContactParams {
  store_id?: string;
  email: string;
  taxonomies?: TaxonomyEntry[];
}

export interface UpdateContactParams {
  id: string;
  store_id?: string;
  email?: string;
  taxonomies?: TaxonomyEntry[];
  status?: ContactStatus;
}

export interface GetContactParams {
  id: string;
  store_id?: string;
}

export interface FindContactsParams {
  store_id?: string;
  ids?: string[];

  query?: string | number;
  taxonomy_query?: TaxonomyQuery[];
  status?: ContactStatus;
  has_action?: boolean;
  has_cart?: boolean;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface MergeContactsParams {
  target_id: string;
  source_id: string;
  store_id?: string;
}
