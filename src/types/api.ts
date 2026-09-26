import type { EpochMilliseconds } from "./time";
import type { ManualPriceInput } from "./price";
import type { CatalogReadOptions } from "./catalog";
import type { CartLineItemRef, CheckoutQuoteSources } from "./checkout";
import type {
  AccountSessionScope,
  Block,
  StoreLocationStatus,
  Currency,
  Money,
  ZoneLocation,
  Address,
  PostalAddress,
  BuildHookStatus,
  WebhookEventSubscription,
  WebhookStatus,
  ShippingRateLine,
  Tracking,
  ShipmentLine,
  ClassificationEntry,
  ClassificationQuery,
  BookingServiceStatus,
  BookingResourceStatus,
  BookingOfferingStatus,
  MutableWorkflowStatus,
  WorkflowStatus,
  ProductStatus,
  CollectionStatus,
  EntryStatus,
  BlockSchema,
  EntryBlockQuery,
  EmailTemplateStatus,
  EmailTemplateType,
  EmailTemplateVariable,
  FormStatus,
  ClassificationStatus,
  FormSchema,
  FormField,
  ClassificationSchema,
  ServiceDuration,
  WeeklyAvailability,
  DateOverride,
  BookingWindow,
  TimeRange,
  CustomerStatus,
  MailboxStatus,
  SmtpImapMailboxProviderInput,
  CampaignStatusFilter,
  CampaignEnrollmentStatusFilter,
  CampaignGroupRecipient,
  CampaignEmailContent,
  CampaignStep,
  SocialConnectionType,
  SocialMessageSync,
  SocialPostContent,
  ProductInventory,
  ProductFulfillment,
  ProductVariantEditableStatus,
  ProductVariantStatus,
  MonriEnvironment,
  PaymentOptionTypeName,
} from "./index";

export type {
  RequestOptions,
  ScheduledMutationOptions,
} from "../services/createHttpClient";

export interface ConfigurationPageParams {
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}
export interface FindMarketsParams extends ConfigurationPageParams {
  store_id?: string;
  currency?: Currency;
  status?: "active" | "deleting";
}
export interface FindStoreLocationsParams extends ConfigurationPageParams {
  store_id?: string;
  is_pickup_location?: boolean;
  status?: "active" | "archived" | "deleting";
}
export type FindStorefrontMarketsParams = Omit<FindMarketsParams, "status" | "store_id">;
export type FindStorefrontLocationsParams = Omit<FindStoreLocationsParams, "status" | "store_id">;

export interface GetStoreConfigurationByKeyParams { store_id?: string; key: string }
export interface GetStoreConfigurationParams { store_id?: string; id: string }
export interface GetPaymentOptionParams { store_id?: string; id: string }
export interface GetPaymentOptionByTypeParams {
  store_id?: string;
  type_name: PaymentOptionTypeName;
}
export interface CreateStoreLocationParams {
  key: string;
  address: PostalAddress;
  timezone: string;
  is_pickup_location?: boolean;
  blocks?: Block[];
  status?: StoreLocationStatus;
}

export interface UpdateStoreLocationParams {
  id: string;
  key?: string;
  address?: PostalAddress;
  timezone?: string;
  is_pickup_location?: boolean;
  blocks?: Block[];
  status?: StoreLocationStatus;
}

export interface DeleteStoreLocationParams {
  id: string;
}

export interface CreateMarketParams {
  store_id?: string;
  key: string;
  currency: Currency;
  tax_mode: "inclusive" | "exclusive";
}

export interface UpdateMarketParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  tax_mode?: "inclusive" | "exclusive";
}

export interface DeleteMarketParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  replacement_default_market_id?: string;
}

export interface CartProductInput {
  id?: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  form_submission_id?: string | null;
}

export interface ProductQuoteInput {
  product_id: string;
  variant_id: string;
  quantity: number;
  form_submission_id?: string | null;
  price_override?: ManualPriceInput | null;
}

export interface BookingQuoteInput {
  booking_offering_id: string;
  requested_interval: TimeRange;
  form_submission_id?: string | null;
  price_override?: ManualPriceInput | null;
}

export interface DigitalProductQuoteInput {
  digital_product_id: string;
  beneficiary_customer_id: string;
  form_submission_id?: string | null;
  price_override?: ManualPriceInput | null;
}

export interface CartBookingInput {
  id?: string;
  booking_offering_id: string;
  requested_interval: TimeRange;
  capacity_units: number;
  form_submission_id?: string | null;
}

export interface CartDigitalInput {
  id?: string;
  digital_product_id: string;
  beneficiary_customer_id: string;
  form_submission_id?: string | null;
}

export interface CartDigitalItemInput extends CartDigitalInput {
  price_override?: ManualPriceInput | null;
}

export type CustomerGroupMemberType =
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_id: string };

export type SubscriptionPlanStart =
  | { type: "on_acceptance" }
  | { type: "scheduled"; starts_at: number };

export type CartDeliveryDestination =
  | { type: "delivery"; address: PostalAddress }
  | { type: "pickup"; store_location_id: string };

export interface DeliveryQuoteAcceptance {
  quote_digest: string;
  customer_subtotal: Money;
  expires_at: number;
  cart_version: string;
}

export type CartPhysicalLineRef =
  | { type: "product"; line_item_id: string }
  | { type: "subscription_entitlement"; line_item_id: string; entitlement_id: string };

export interface CartDeliveryGroupItem {
  line_item: CartPhysicalLineRef;
  quantity: number;
}

export interface CartDeliveryUnitAssignment {
  cart_delivery_group_id: string;
  line_item: CartPhysicalLineRef;
  unit_span: import("./orderContract").UnitSpan;
}

export interface CartDeliveryRentalAssignment {
  cart_delivery_group_id: string;
  line_item: CartPhysicalLineRef;
  quantity: number;
}

export interface CartDeliveryGroup {
  id: string;
  items: CartDeliveryGroupItem[];
  destination: CartDeliveryDestination;
  shipping_rate_id: string | null;
  quote_acceptance: DeliveryQuoteAcceptance | null;
  scheduled_window: TimeRange | null;
}

export interface CartSubscriptionDelivery {
  id: string;
  entitlement_ids: string[];
  destination: CartDeliveryDestination;
  shipping_rate_id: string | null;
  quote_acceptance: DeliveryQuoteAcceptance;
}

export interface CartSubscriptionPlanInput {
  id?: string;
  subscription_plan_id: string;
  subject: import("./subscription").SubscriptionSubject;
  start: SubscriptionPlanStart;
  deliveries: CartSubscriptionDelivery[];
  price_override?: ManualPriceInput | null;
}

export interface TrustedCartProductInput extends CartProductInput {
  price_override?: ManualPriceInput | null;
}

export interface TrustedCartBookingInput extends CartBookingInput {
  price_override?: ManualPriceInput | null;
}

export interface TrustedCartDigitalItemInput extends CartDigitalItemInput {
  price_override?: ManualPriceInput | null;
}

export type CartLineItemInput =
  | ({ type: "product" } & TrustedCartProductInput)
  | ({ type: "booking" } & TrustedCartBookingInput)
  | ({ type: "digital_product" } & TrustedCartDigitalItemInput)
  | ({ type: "subscription_plan" } & CartSubscriptionPlanInput);

export interface GetQuoteParams {
  store_id?: string;
  locale?: string;
  market?: string;
  currency?: Currency;
  sales_channel_id?: string;
  company_id?: string | null;
  company_location_id?: string | null;
  line_items?: CartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: Address | null;
  promotion_codes?: string[];
  purchase_order_number?: string | null;
  customer_id?: string | null;
}

export interface GetCurrentCartParams {
  store_id?: string;
  company?: import("./cart").CartCompanyContext | null;
  market_id?: string;
  sales_channel_id?: string;
}

export interface GetCartParams {
  id: string;
  store_id?: string;
  token?: string;
}

export interface FindCartsParams {
  store_id?: string;
  customer_id?: string;
  statuses?: import("./cart").CartStatus["type"][];
  origins?: import("./commerce").PurchaseOrigin["type"][];
  has_items?: boolean;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface CreateCartParams {
  store_id?: string;
  customer_id: string;
  company?: import("./cart").CartCompanyContext | null;
  market_id?: string;
  sales_channel_id?: string;
  line_items?: CartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: Address | null;
  promotion_codes?: string[];
  purchase_order_number?: string | null;
}

export interface UpdateCartParams {
  id: string;
  store_id?: string;
  company?: import("./cart").CartCompanyContext | null;
  market_id?: string;
  sales_channel_id?: string;
  line_items?: CartLineItemInput[];
  delivery_groups?: CartDeliveryGroup[];
  billing_address?: Address | null;
  promotion_codes?: string[];
  purchase_order_number?: string | null;
}

export interface AddCartProductParams {
  id: string;
  store_id?: string;
  product: TrustedCartProductInput;
}

export interface AddCartBookingParams {
  id: string;
  store_id?: string;
  booking: TrustedCartBookingInput;
}

export interface AddCartDigitalProductParams {
  id: string;
  store_id?: string;
  digital: TrustedCartDigitalItemInput;
}

export interface AddCartSubscriptionPlanParams {
  id: string;
  store_id?: string;
  subscription_plan: CartSubscriptionPlanInput;
}

export interface RemoveCartItemParams {
  id: string;
  store_id?: string;
  line_item: CartLineItemRef;
}

export interface ClearCartParams {
  id: string;
  store_id?: string;
}

export interface QuoteCartParams {
  id: string;
  store_id?: string;
  locale?: string;
}

export interface CheckoutCartParams {
  id: string;
  store_id?: string;
  request_id?: string;
  locale: string;
  presentation_digest: string;
  sources: CheckoutQuoteSources;
  payment_option_id?: string;
  return_url?: string;
  save_payment_method?: boolean;
  payment_method_terms_version?: string;
}

export interface CatalogPriceFilter {
  min_amount?: number | null;
  max_amount?: number | null;
  quantity?: number;
}

export interface GetProductsParams {
  store_id?: string;
  ids?: string[];
  classification_query?: ClassificationQuery[];
  filters?: EntryBlockQuery[];
  variant_filters?: EntryBlockQuery[];
  status?: ProductStatus["type"];
  price_filter?: CatalogPriceFilter;

  query?: string;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds | null;
  created_at_to?: EpochMilliseconds | null;
}

export interface GetCollectionsParams {
  store_id?: string;
  ids?: string[];
  key?: string;
  limit?: number;
  cursor?: string | null;
  query?: string;
  status?: CollectionStatus["type"];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface CreateCollectionParams {
  store_id?: string;
  key: string;
  schema: BlockSchema[];
  blocks: Block[];
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
} & ({ id: string; key?: never } | { id?: never; key: string });

export interface DeleteCollectionParams {
  id: string;
  store_id?: string;
}

export interface GetEntriesParams {
  store_id?: string;
  collection_id: string;
  key?: string;
  status?: EntryStatus["type"];
  query?: string;
  filters?: EntryBlockQuery[];
  limit?: number;
  cursor?: string | null;
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface GetEntriesByIdsParams {
  store_id?: string;
  ids: string[];
}

export interface GetMediaByIdsParams {
  store_id?: string;
  ids: string[];
}

export interface CreateEntryParams {
  store_id?: string;
  collection_id: string;
  key: string;
  slug: Record<string, string>;
  blocks: Block[];
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

export type CreateMediaParams =
  | {
      store_id?: string;
      media_id: string;
      file: File;
      source_url?: never;
    }
  | {
      store_id?: string;
      media_id: string;
      source_url: string;
      file?: never;
    };

export interface DeleteMediaParams {
  store_id?: string;
  media_id: string;
}

export interface GetMediaParams {
  media_id: string;
  store_id?: string;
}

export interface ReplaceMediaContentParams {
  media_id: string;
  store_id?: string;
  file: File;
}

export interface FindMediaParams {
  store_id?: string;
  cursor?: string | null;
  limit?: number;
  ids?: string[];
  query?: string;
  mime_type?: "image" | "video" | "application" | "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "video/mp4" | "video/webm" | "video/quicktime" | "application/pdf";
  sort_field?: "original_file_name" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface RequestPendingAccountSessionParams {
  email: string;
}

export interface VerifyPendingAccountSessionParams {
  session_id: string;
  code: string;
}

export interface RefreshAccountSessionParams {
  refresh_token: string;
}

export interface PendingAccountSession {
  session_id: string;
  verification_expires_at: EpochMilliseconds;
}

export interface AuthToken {
  id: string;
  scope: AccountSessionScope;
  access_token: string;
  refresh_token: string;
  access_expires_at: EpochMilliseconds;
  refresh_expires_at: EpochMilliseconds;
  authenticated_at: EpochMilliseconds;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindBookingServicesParams {
  store_id?: string;
  ids?: string[];
  booking_resource_id?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
  status?: BookingServiceStatus["type"];
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  classification_query?: ClassificationQuery[];
  match_all?: boolean;
  from?: EpochMilliseconds;
  to?: EpochMilliseconds;
}

export interface FindStorefrontBookingServicesParams extends CatalogReadOptions {
  ids?: string[];
  booking_resource_id?: string;
  classification_query?: ClassificationQuery[];
  price_filter?: CatalogPriceFilter;
  query?: string | number;
  sort_field?: "key" | "created_at" | "price";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string;
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

export type StoreRole = "admin" | "owner";
export type PlatformRole = "standard" | "administrator";

export interface UpdatePlatformRoleParams {
  account_id: string;
  platform_role: PlatformRole;
}

export interface InitialMarketInput {
  key: string;
  currency: Currency;
  tax_mode: "inclusive" | "exclusive";
}

export interface CreateStoreParams {
  name: string;
  timezone: string;
  default_language: string | null;
  supported_languages: string[];
  billing_email: string;
  contact_email?: string | null;
}

export interface UpdateStoreParams {
  id: string;
  name?: string;
  default_market_id?: string;
  default_sales_channel_id?: string;
  timezone?: string;
  default_language?: string | null;
  supported_languages?: string[];
  billing_email?: string;
  contact_email?: string | null;
}

export interface GetStoreParams {
  id?: string;
}

export interface RequestStoreDeletionParams {
  id?: string;
  confirmation: string;
}

export interface SelectStoreSubscriptionParams {
  store_id?: string;
  checkout_id?: string;
  plan_id: string;
  return_url: string;
}

export interface GetStoreSubscriptionParams {
  store_id?: string;
}

export interface CancelStoreSubscriptionParams {
  store_id?: string;
  mode: "at_period_end" | "immediate";
}

export interface ReactivateStoreSubscriptionParams {
  store_id?: string;
}

export interface CreatePortalSessionParams {
  store_id?: string;
  return_url: string;
}

export interface AddMemberParams {
  email: string;
  store_id?: string;
}

export interface TransferStoreOwnershipParams {
  account_id: string;
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

export interface FindOwnStoreMembershipsParams {
  limit?: number;
  cursor?: string | null;
}

export interface GetOwnStoreMembershipParams {
  store_id?: string;
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
  response_status?: number | null;
  error?: string | null;
}

export type ProductInventoryInput = Pick<
  ProductInventory,
  "store_location_id" | "on_hand"
>;

export interface CreateProductVariantParams {
  store_id?: string;
  product_id: string;
  sku: string | null;
  attributes: Block[];
  reference_labels: Record<string, Record<string, string>>;
  fulfillment: ProductFulfillment;
  tax_category_id: string | null;
}

export interface UpdateProductVariantParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sku: string | null;
  attributes: Block[];
  reference_labels: Record<string, Record<string, string>>;
  fulfillment: ProductFulfillment;
  tax_category_id: string | null;
  status: ProductVariantEditableStatus;
}

export interface GetProductVariantParams {
  store_id?: string;
  id: string;
}

export interface FindProductVariantsParams {
  store_id?: string;
  product_id?: string;
  sku?: string;
  status?: ProductVariantStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface DeleteProductVariantParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreateProductParams {
  store_id?: string;
  key: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
}

export interface UpdateProductParams {
  id: string;
  store_id?: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  status?: ProductStatus;
}

export interface DeleteProductParams {
  id: string;
  store_id?: string;
}

export type GetProductParams = {
  store_id?: string;
} & ({ id: string; slug?: never } | { id?: never; slug: string });

export interface GetProductByKeyParams {
  store_id?: string;
  key: string;
}

export interface GetOrderParams {
  id: string;
  store_id?: string;
}

export interface GetOrdersParams {
  store_id?: string;
  customer_id?: string;
  statuses?: ("pending" | "confirmed" | "partially_cancelled" | "cancelled")[];
  sources?: ("cart_acceptance" | "direct" | "subscription")[];
  product_statuses?: ("pending" | "confirmed" | "cancelled")[];
  booking_statuses?: ("pending" | "confirmed" | "completed" | "no_show" | "cancelled")[];
  product_ids?: string[];
  booking_service_ids?: string[];
  booking_resource_ids?: string[];
  from?: EpochMilliseconds;
  to?: EpochMilliseconds;

  query?: string | null;
  limit?: number | null;
  cursor?: string | null;
  sort_field?: "number" | "price" | "status" | "created_at" | "updated_at" | null;
  sort_direction?: "asc" | "desc" | null;
  created_at_from?: EpochMilliseconds | null;
  created_at_to?: EpochMilliseconds | null;
  updated_at_from?: EpochMilliseconds | null;
  subscription_id?: string;
}

export interface UpdateOrderParams {
  id: string;
  store_id?: string;
  confirm?: boolean;
}

export interface CancelOrderProductItemParams {
  store_id?: string;
  order_id: string;
  order_product_item_id: string;
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  units: import("./orderContract").UnitSpan[];
}

export interface BookingItemLifecycleParams {
  store_id?: string;
  order_id: string;
  order_booking_item_id: string;
}

export interface CancelBookingItemParams extends BookingItemLifecycleParams {
  command_id: string;
}

export interface CreateBookingResourceParams {
  store_id?: string;
  key: string;
  slugs?: Record<string, string>;
  status?: BookingResourceStatus;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  timezone: string;
  capacity: number;
}

export interface UpdateBookingResourceParams {
  id: string;
  store_id?: string;
  key?: string;
  slugs?: Record<string, string>;
  status?: BookingResourceStatus;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  timezone?: string;
  capacity?: number;
}

export interface DeleteBookingResourceParams {
  id: string;
  store_id?: string;
}

export interface CreateBookingServiceParams {
  store_id?: string;
  key: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  status?: BookingServiceStatus;
}

export interface UpdateBookingServiceParams {
  id: string;
  store_id?: string;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  status?: BookingServiceStatus;
}

export interface CreateBookingOfferingParams {
  store_id?: string;
  booking_service_id: string;
  booking_resource_id: string;
  weekly_availability: WeeklyAvailability[];
  date_overrides: DateOverride[];
  durations: ServiceDuration[];
  slot_interval_minutes: number;
  booking_window: BookingWindow;
  reminder_offsets_minutes: number[];
  service_location_id?: string | null;
  tax_category_id?: string | null;
  status?: BookingOfferingStatus;
}

export interface UpdateBookingOfferingParams {
  store_id?: string;
  id: string;
  weekly_availability?: WeeklyAvailability[];
  date_overrides?: DateOverride[];
  durations?: ServiceDuration[];
  slot_interval_minutes?: number;
  booking_window?: BookingWindow;
  reminder_offsets_minutes?: number[];
  service_location_id?: string | null;
  tax_category_id?: string | null;
  status?: BookingOfferingStatus;
}

export interface DeleteBookingOfferingParams {
  store_id?: string;
  id: string;
}

export interface LookupBookingOfferingParams {
  store_id?: string;
  booking_service_id: string;
  booking_resource_id: string;
}

export type FindBookingOfferingsParams = {
  store_id?: string;
  limit?: number;
  cursor?: string;
  status?: "draft" | "active" | "archived" | "deleting";
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
} & (
  | { booking_service_id: string; booking_resource_id?: string }
  | { booking_service_id?: string; booking_resource_id: string }
);

export interface DeleteBookingServiceParams {
  id: string;
  store_id?: string;
}

export type GetBookingServiceParams = {
  store_id?: string;
} & ({ id: string; slug?: never } | { id?: never; slug: string });

export interface GetBookingServiceByKeyParams {
  store_id?: string;
  key: string;
}

export interface FindBookingResourcesParams {
  store_id?: string;
  booking_service_id?: string;
  ids?: string[];
  classification_query?: ClassificationQuery[];

  query?: string | number | null;
  status?: BookingResourceStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "key" | "status" | "created_at" | "updated_at" | null;
  sort_direction?: "asc" | "desc" | null;
  created_at_from?: EpochMilliseconds | null;
  created_at_to?: EpochMilliseconds | null;
}

export interface GetBookingResourceParams {
  id: string;
  store_id?: string;
}

export interface GetBookingResourceByKeyParams {
  store_id?: string;
  key: string;
}

export interface ListAccountApiTokensParams {
  limit?: number;
  cursor?: string | null;
}

export interface ListAccountSessionsParams {
  limit?: number;
  cursor?: string | null;
}

export interface CreateAccountApiTokenParams {
  name: string;
  expires_at?: EpochMilliseconds | null;
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
  cursor?: string | null;

  query?: string;
  status?: EmailTemplateStatus["type"];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
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
  preheader?: string | null;
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
  type: string;
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
  key?: string;
  limit?: number;
  cursor?: string | null;
  query?: string;
  status?: FormStatus["type"];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface GetFormsByIdsParams {
  store_id?: string;
  ids: string[];
}

export interface CreateFormParams {
  store_id?: string;
  key: string;
  schema: FormSchema[];
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

export interface PermanentlyDeleteFormParams {
  id: string;
  store_id?: string;
}

export interface SubmitFormParams {
  id: string;
  locale: string;
  presentation_digest: string;
  form_id: string;
  store_id?: string;
  fields: FormField[];
}

export interface GetFormSubmissionsParams {
  form_id?: string;
  form_ids?: string[];
  store_id?: string;
  customer_id?: string;

  query?: string;
  limit?: number;
  cursor?: string | null;
  sort_field?: "created_at";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface FindCustomerActionsParams {
  store_id?: string;
  customer_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetFormSubmissionParams {
  id: string;
  form_id: string;
  store_id?: string;
}

export interface DeleteFormSubmissionParams {
  id: string;
  form_id: string;
  store_id?: string;
}

export interface GetClassificationsParams {
  store_id?: string;
  parent_id?: string;
  ids?: string[];
  key?: string;
  limit?: number;
  cursor?: string | null;

  query?: string;
  status?: ClassificationStatus["type"];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface CreateClassificationParams {
  store_id?: string;
  key: string;
  parent_id?: string | null;
  schema: ClassificationSchema[];
}

export interface UpdateClassificationParams {
  id: string;
  store_id?: string;
  key?: string;
  parent_id?: string | null;
  schema?: ClassificationSchema[];
  status?: ClassificationStatus;
}

export interface GetClassificationParams {
  id: string;
  store_id?: string;
}

export type GetStorefrontClassificationParams = {
  store_id?: string;
} & ({ id: string; key?: never } | { id?: never; key: string });

export interface DeleteClassificationParams {
  id: string;
  store_id?: string;
}

export interface GetClassificationChildrenParams {
    id: string;
    store_id?: string;
    limit?: number;
    cursor?: string | null;
}

export interface GetMeParams {}

export interface LogoutParams {}

export interface GetStoresParams {
  query?: string;
  limit?: number;
  cursor?: string | null;
  sort_field?: "name";
  sort_direction?: "asc" | "desc";
}

export interface SetupAnalyticsParams {
  store_id?: string;
}

export interface CreateRefundParams {
  payment_id: string;
  refund_id: string;
  payment_capture_id: string | null;
  money: import("./index").Money;
  application: import("./refund").RefundApplication;
  reason: import("./index").RefundReason;
  private_note: string | null;
  reference: string | null;
  store_id?: string;
}

export interface FindPaymentsParams {
  store_id?: string;
  order_id?: string;
  status?: import("./payment").PaymentStatus["type"];
  updated_at_from?: EpochMilliseconds;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string | null;
}

export interface GetPaymentParams {
  id: string;
  store_id?: string;
}

export interface GetOrderPaymentParams {
  store_id?: string;
  order_id: string;
  payment_id: string;
}

export interface FindOrderPaymentsParams extends Omit<FindPaymentsParams, "order_id" | "updated_at_from"> {
  order_id: string;
}

export interface FindPaymentDisputesParams {
  payment_id?: string;
  store_id?: string;
  status?: import("./index").PaymentDisputeStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string | null;
}

export interface GetPaymentDisputeParams {
  dispute_id: string;
  store_id?: string;
}

export interface FindRefundsParams {
  payment_id?: string;
  order_id?: string;
  store_id?: string;
  status?: import("./refund").RefundStatus["type"];
  updated_at_from?: EpochMilliseconds;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string | null;
}

export interface GetRefundParams {
  id: string;
  store_id?: string;
}

export interface CreateRefundResponse {
  refund_id: string;
  money: import("./index").Money;
  status: import("./index").RefundStatus;
}

export interface CreateDigitalProductParams {
  store_id?: string;
  key: string;
  slugs?: Record<string, string>;
  blocks?: import("./index").Block[];
  classifications?: import("./index").ClassificationEntry[];
  asset_ids?: string[];
  tax_category_id?: string | null;
  status?: import("./index").DigitalProductStatus;
}

export interface UpdateDigitalProductParams {
  store_id?: string;
  digital_product_id: string;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: import("./index").Block[];
  classifications?: import("./index").ClassificationEntry[];
  asset_ids?: string[];
  tax_category_id?: string | null;
  status?: import("./index").DigitalProductStatus;
}

export interface GetDigitalProductParams {
  store_id?: string;
  digital_product_id: string;
}

export interface GetDigitalProductByKeyParams {
  store_id?: string;
  key: string;
}

export interface FindDigitalProductsParams {
  store_id?: string;
  ids?: string[];
  classification_query?: ClassificationQuery[];
  status?: import("./index").DigitalProductStatus["type"];
  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: "key" | "created_at" | "status";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface UploadDigitalAssetParams {
  store_id?: string;
  file: File;
}

export interface FindDigitalAssetsParams {
  store_id?: string;
  status?: import("./index").DigitalAssetStatus["type"];
  limit?: number;
  cursor?: string;
}

export interface GetDigitalAssetParams {
  store_id?: string;
  asset_id: string;
}

export interface ArchiveDigitalAssetParams {
  store_id?: string;
  asset_id: string;
}

export interface DownloadDigitalAssetParams {
  digital_product_id: string;
  asset_id: string;
  reference: string;
  company_id?: string;
  company_location_id?: string;
}

export interface FindStorefrontDigitalProductsParams extends CatalogReadOptions {
  ids?: string[];
  classification_query?: ClassificationQuery[];
  price_filter?: CatalogPriceFilter;
  query?: string | number;
  sort_field?: "key" | "created_at" | "price";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string;
}

export interface FindDigitalLibraryParams {
  company_id?: string;
  company_location_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetStorefrontDigitalProductParams extends CatalogReadOptions {
  identifier: string;
}

export interface GetDigitalLibraryProductParams extends FindDigitalLibraryParams {
  digital_product_id: string;
}

export type SystemTemplateKey =
  | "system:order-status-update"
  | "system:user-confirmation"
  | "system:forgot-password";

export interface GetAvailabilityParams {
  store_id?: string;
  booking_service_id: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  booking_resource_id?: string;
  limit?: number;
  cursor?: string;
}

export interface AvailabilitySlot {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  spots: number;
}

export interface DaySlots {
  date: string;
  slots: AvailabilitySlot[];
}

export interface BookingResourceAvailability {
  booking_offering_id: string;
  booking_resource_id: string;
  resource_key: string;
  timezone: string;
  days: DaySlots[];
}

export interface AvailabilityResponse {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  booking_resources: BookingResourceAvailability[];
  cursor: string | null;
}

export interface CreateWorkflowParams {
  store_id?: string;
  key: string;
  status?: MutableWorkflowStatus;
  schedule?: string | null;
  graph: import("./index").WorkflowGraph;
}

export interface UpdateWorkflowParams {
  id: string;
  store_id?: string;
  key?: string;
  status?: MutableWorkflowStatus;
  schedule?: string | null;
  graph: import("./index").WorkflowGraph;
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
  status?: WorkflowStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface RegenerateWorkflowWebhookUrlParams {
  workflow_id: string;
  store_id?: string;
}

export interface InvokeWorkflowWebhookParams {
  webhook_url: string;
  payload: Record<string, unknown>;
}

export interface GetWorkflowExecutionsParams {
  workflow_id: string;
  store_id?: string;
  status?: import("./index").WorkflowExecutionStatus["type"];
  limit?: number;
  cursor?: string;
  query?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface GetWorkflowExecutionParams {
  workflow_id: string;
  execution_id: string;
  store_id?: string;
}

export interface GetWorkflowExternalOperationsParams {
  workflow_id: string;
  execution_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetWorkflowExternalOperationParams {
  workflow_id: string;
  execution_id: string;
  operation_id: string;
  store_id?: string;
}

export interface GetWorkflowConnectionConnectUrlParams {
  store_id?: string;
  type: import("./index").WorkflowConnectionType;
}

export interface GetWorkflowConnectionsParams {
  store_id?: string;
  query?: string;
  type?: import("./index").WorkflowConnectionType;
  status?: import("./index").WorkflowConnectionAuthorizationStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface GetWorkflowConnectionParams {
  store_id?: string;
  id: string;
}

export interface DeleteWorkflowConnectionParams {
  id: string;
  store_id?: string;
}

export interface ImportCustomerRowInput {
  email: string;
  customer_id?: string;
  classifications: ClassificationEntry[];
}

export interface ImportCustomersParams {
  store_id?: string;
  rows: ImportCustomerRowInput[];
}

export interface ImportCustomersPreviewParams {
  store_id?: string;
  rows: ImportCustomerRowInput[];
}

export interface ImportCustomerFieldError {
  field: string;
  message: string;
}

export interface ImportCustomerPreviewRow {
  row: number;
  email: string;
  customer_id?: string | null;
  valid: boolean;
  errors: ImportCustomerFieldError[];
}

export interface ImportCustomersPreviewResult {
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  rows: ImportCustomerPreviewRow[];
}

export interface ImportCustomerRowResult {
  row: number;
  email: string;
  customer_id?: string | null;
  created: boolean;
  updated: boolean;
  error?: string | null;
}

export interface ImportCustomersResult {
  rows_total: number;
  customers_created: number;
  customers_updated: number;
  rows_failed: number;
  rows: ImportCustomerRowResult[];
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
  status?: MailboxStatus["type"];
  provider_type?: "smtp_imap" | "google";
  query?: string;
  limit?: number;
  cursor?: string | null;
  sort_field?: "key" | "email" | "status" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface GetMailboxParams {
  id: string;
  store_id?: string;
}

export interface FindMailboxSyncIssuesParams {
  id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface DisconnectMailboxParams {
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
  id: string;
  store_id?: string;
  name: string;
  mailbox_ids: string[];
  steps: CampaignStep[];
}

export interface ReplaceDraftCampaignParams {
  id: string;
  store_id?: string;
  name: string;
  mailbox_ids: string[];
  steps: CampaignStep[];
}

export interface FindCampaignsParams {
  store_id?: string;
  status?: CampaignStatusFilter;
  query?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface GetCampaignParams {
  id: string;
  store_id?: string;
}

export interface EnrollCampaignParams {
  store_id?: string;
  campaign_id: string;
  customer_ids: string[];
  group_recipients: CampaignGroupRecipient[];
}

export interface FindCampaignEnrollmentsParams {
  store_id?: string;
  campaign_id?: string;
  customer_id?: string;
  status?: CampaignEnrollmentStatusFilter;
  limit?: number;
  cursor?: string;
}

export interface RemovePendingCampaignEnrollmentParams {
  store_id?: string;
  campaign_id: string;
  id: string;
}

export interface GetCampaignEnrollmentConversationParams {
  store_id?: string;
  campaign_id: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface ReplyCampaignEnrollmentParams {
  message_id: string;
  store_id?: string;
  campaign_id: string;
  id: string;
  parent_message_id: string;
  content: CampaignEmailContent;
  media_ids: string[];
}

export interface StopCampaignEnrollmentParams {
  store_id?: string;
  campaign_id: string;
  id: string;
}

export interface ReplaceCampaignMessageDraftParams {
  id: string;
  store_id?: string;
  campaign_id: string;
  campaign_enrollment_id: string;
  content: CampaignEmailContent;
}

export interface CreateLeadResearchParams {
  id: string;
  customer_group_id?: string;
  account_message_id: string;
  content: string;
  store_id?: string;
}

export interface FindLeadResearchesParams {
  customer_group_id?: string;
  limit?: number;
  cursor?: string;
  store_id?: string;
}

export interface GetLeadResearchParams {
  lead_research_id: string;
  store_id?: string;
}

export interface SendLeadResearchMessageParams {
  lead_research_id: string;
  account_message_id: string;
  content: string;
  store_id?: string;
}

export interface FindLeadResearchMessagesParams {
  lead_research_id: string;
  limit?: number;
  cursor?: string;
  store_id?: string;
}

export interface RetryLeadResearchMessageParams {
  lead_research_id: string;
  account_message_id: string;
  assistant_message_id: string;
  store_id?: string;
}

export interface GetLeadResearchMessageParams {
  lead_research_id: string;
  message_id: string;
  store_id?: string;
}

export interface CancelLeadResearchMessageParams {
  lead_research_id: string;
  assistant_message_id: string;
  store_id?: string;
}

export interface ListBuildHooksParams {
  store_id: string;
  query?: string;
  status?: BuildHookStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string | null;
}

export interface CreateBuildHookParams {
  store_id: string;
  url: string;
  headers?: Record<string, string>;
  status?: BuildHookStatus;
}

export interface UpdateBuildHookParams {
  store_id: string;
  id: string;
  url?: string;
  headers?: Record<string, string>;
  status?: BuildHookStatus;
}

export interface DeleteBuildHookParams {
  store_id: string;
  id: string;
}

export interface FindSocialConnectionsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  type?: SocialConnectionType;
  status?: "connected" | "disconnected";
}

export interface GetSocialConnectionParams {
  store_id?: string;
  connection_id: string;
}

export interface DisconnectSocialConnectionParams {
  connection_id: string;
  store_id?: string;
}

export interface ListPaymentOptionsParams extends ConfigurationPageParams {
  store_id?: string;
  type_name?: PaymentOptionTypeName;
  status?: "active" | "disabled" | "deleting";
}

export interface CreateLocalPaymentOptionParams {
  store_id?: string;
  id: string;
  key: string;
  blocks: Block[];
  type: { type: "manual" | "cash_on_delivery" | "stripe" };
  status: { type: "active" | "disabled" };
}

export interface RefreshStripePaymentOptionParams {
  store_id?: string;
}

export interface CreateMonriPaymentOptionParams {
  store_id?: string;
  id: string;
  key: string;
  blocks: Block[];
  environment: MonriEnvironment;
  merchant_key: string;
  authenticity_token: string;
  status: { type: "active" | "disabled" };
}

export interface UpdatePaymentOptionParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  status: { type: "active" | "disabled" };
}

export interface ConnectStripePaymentOptionParams {
  store_id?: string;
  payment_option_id: string;
  operation_id: string;
  return_url: string;
  refresh_url: string;
  email?: string | null;
  country?: string | null;
  connected_account_id?: string | null;
}

export interface GetStripeConnectionOperationParams {
  store_id?: string;
  operation_id: string;
}

export interface OpenStripeDashboardParams {
  store_id: string;
  id: string;
}

export interface ConnectSocialConnectionParams {
  store_id?: string;
  type: SocialConnectionType;
}

export interface FindSocialPostsParams {
  social_connection_id?: string;
  limit?: number;
  cursor?: string;
  store_id?: string;
}

export interface CreateSocialPostParams {
  social_connection_id: string;
  content: SocialPostContent;
  publish_at: EpochMilliseconds;
  store_id?: string;
}

export interface GetSocialPostParams {
  post_id: string;
  store_id?: string;
}

export type CancelSocialPostParams = GetSocialPostParams;

export interface FindSocialMessagesParams {
  post_id: string;
  parent_message_id?: string;
  limit?: number;
  cursor?: string;
  store_id?: string;
}

export interface CreateSocialMessageParams {
  post_id: string;
  id: string;
  parent_message_id: string;
  text: string;
  store_id?: string;
}

export interface SyncSocialMessagesParams {
  post_id: string;
  sync: SocialMessageSync;
  store_id?: string;
}

export interface ListWebhooksParams {
  store_id: string;
  query?: string;
  status?: WebhookStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string | null;
}

export interface CreateWebhookParams {
  store_id: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  status?: WebhookStatus;
}

export interface UpdateWebhookParams {
  store_id: string;
  id: string;
  url?: string;
  events?: WebhookEventSubscription[];
  headers?: Record<string, string>;
  secret?: string;
  status?: WebhookStatus;
}

export interface DeleteWebhookParams {
  store_id: string;
  id: string;
}

export type FindShipmentsParams = {
  store_id?: string;
  limit?: number;
  cursor?: string;
} & (
  | { order_id: string; fulfillment_order_id?: never; rental_id?: never }
  | { fulfillment_order_id: string; order_id?: never; rental_id?: never }
  | { rental_id: string; order_id?: never; fulfillment_order_id?: never }
);

export type FindFulfillmentOrdersParams = {
  store_id?: string;
  limit?: number;
  cursor?: string;
} & (
  | { order_id: string; rental_id?: never }
  | { rental_id: string; order_id?: never }
);

export interface GetFulfillmentOrderParams {
  store_id?: string;
  fulfillment_order_id: string;
}

export interface GetShipmentParams {
  store_id?: string;
  shipment_id: string;
}

export interface CreateShipmentParams {
  store_id?: string;
  shipment_id: string;
  origin_store_location_id: string;
  fulfillment_order_id: string;
  lines: ShipmentLine[];
}

export interface DispatchShipmentParams {
  store_id?: string;
  shipment_id: string;
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  late_reason: string | null;
  tracking: Tracking | null;
}

export interface CancelShipmentParams extends GetShipmentParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomerSessionsParams {
  customer_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface RevokeCustomerSessionParams {
  customer_id: string;
  session_id: string;
  store_id?: string;
}

export interface RevokeAllCustomerSessionsParams {
  customer_id: string;
  store_id?: string;
}

export interface CaptureCustomerEmailParams {
  email: string;
}

export interface CreateCustomerParams {
  store_id?: string;
  email?: string;
  classifications?: ClassificationEntry[];
}

export interface UpdateCustomerParams {
  id: string;
  store_id?: string;
  email?: string;
  classifications?: ClassificationEntry[];
  status?: CustomerStatus;
}

export interface GetCustomerParams {
  id: string;
  store_id?: string;
}

export type ArchiveCustomerParams = GetCustomerParams;

export interface FindCustomerIdentitiesParams {
  store_id?: string;
  customer_id: string;
  status?: "active" | "revoked";
  verified?: boolean;
  limit?: number;
  cursor?: string;
}

export interface CustomerIdentityCommandParams {
  store_id?: string;
  customer_id: string;
  identity_id: string;
}

export interface FindCustomersParams {
  store_id?: string;
  ids?: string[];

  query?: string;
  classification_query?: ClassificationQuery[];
  status?: CustomerStatus["type"];
  has_verified_email?: boolean;
  has_customer_action?: boolean;
  has_cart?: boolean;
  limit?: number;
  cursor?: string | null;
  sort_field?: "id" | "email" | "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}
