import type {
  Block,
  Currency,
  Money,
  Zone,
  ZoneLocation,
  Address,
  PostalAddress,
  BuildHookStatus,
  WebhookEventSubscription,
  WebhookStatus,
  Parcel,
  CustomsDeclaration,
  ShippingRateLine,
  OrderShipmentLine,
  ClassificationEntry,
  ClassificationQuery,
  BookingServiceStatus,
  BookingResourceStatus,
  BookingOfferingStatus,
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
  ClassificationStatus,
  FormSchema,
  FormField,
  ClassificationSchema,
  Price,
  ServiceDuration,
  WeeklyAvailability,
  DateOverride,
  BookingWindow,
  TimeRange,
  CustomerStatus,
  AudienceStatus,
  AudienceType,
  AudienceBillingCadence,
  AudienceRefundReason,
  MailboxStatus,
  SmtpImapMailboxProviderInput,
  CampaignStatusFilter,
  CampaignEnrollmentStatusFilter,
  CampaignEmailContent,
  CampaignStep,
  SuppressionStatus,
  SuppressionTarget,
  SuppressionScope,
  SuppressionReason,
  SocialConnectionType,
  SocialMessageSync,
  SocialPostContent,
  SubscriptionInterval,
  ProductInventory,
} from "./index";

export type {
  RequestOptions,
  ScheduledMutationOptions,
} from "../services/createHttpClient";

export interface CreateStoreLocationParams {
  key: string;
  address: PostalAddress;
  is_pickup_location?: boolean;
}

export interface UpdateStoreLocationParams {
  id: string;
  key?: string;
  address?: PostalAddress;
  is_pickup_location?: boolean;
}

export interface DeleteStoreLocationParams {
  id: string;
}

export type MarketZoneInput = Omit<Zone, "id"> & {
  id?: string;
};

export interface CreateMarketParams {
  key: string;
  currency: Currency;
  tax_mode: "inclusive" | "exclusive";
  payment_provider_ids?: string[];
  zones?: MarketZoneInput[];
}

export interface UpdateMarketParams {
  id: string;
  currency?: Currency;
  tax_mode?: "inclusive" | "exclusive";
  payment_provider_ids?: string[];
  zones?: MarketZoneInput[];
}

export interface DeleteMarketParams {
  id: string;
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
  price?: Price | null;
}

export interface BookingQuoteInput {
  booking_offering_id: string;
  requested_interval: TimeRange;
  form_submission_id?: string | null;
  price_override?: Price | null;
}

export interface DigitalProductQuoteInput {
  digital_product_id: string;
  form_submission_id?: string | null;
  price_override?: Price | null;
}

export interface CartBookingInput {
  id?: string;
  booking_offering_id: string;
  requested_interval: TimeRange;
  form_submission_id?: string | null;
}

export interface CartDigitalItemInput {
  id?: string;
  digital_product_id: string;
  form_submission_id?: string | null;
}

export interface TrustedCartProductInput extends CartProductInput {
  price_override?: Price | null;
}

export interface TrustedCartBookingInput extends CartBookingInput {
  price_override?: Price | null;
}

export interface TrustedCartDigitalItemInput extends CartDigitalItemInput {
  price_override?: Price | null;
}

export interface GetQuoteParams {
  store_id?: string;
  market: string;
  products?: ProductQuoteInput[];
  bookings?: BookingQuoteInput[];
  digital?: DigitalProductQuoteInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  payment_provider_id?: string;
  promo_code?: string;
  shipping_method_id?: string;
  customer_id?: string;
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
  customer_id?: string;
  statuses?: import("./index").CartStatus[];
  origins?: import("./index").CartOrigin[];
  has_items?: boolean;
  limit?: number;
  cursor?: string;
}

export interface CreateCartParams {
  store_id?: string;
  customer_id: string;
  market: string;
  product_items?: TrustedCartProductInput[];
  booking_items?: TrustedCartBookingInput[];
  digital_items?: TrustedCartDigitalItemInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  promo_code?: string | null;
  payment_provider_id?: string | null;
  shipping_method_id?: string | null;
}

export interface UpdateCartParams {
  id: string;
  store_id?: string;
  market?: string;
  product_items?: TrustedCartProductInput[];
  booking_items?: TrustedCartBookingInput[];
  digital_items?: TrustedCartDigitalItemInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  promo_code?: string;
  payment_provider_id?: string;
  shipping_method_id?: string;
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
  payment_provider_id?: string;
  return_url?: string;
}

export interface GetProductsParams {
  store_id?: string;
  ids?: string[];
  classification_query?: ClassificationQuery[];
  match_all?: boolean;
  status?: ProductStatus;

  query?: string;
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
  query?: string;
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
} & ({ id: string; key?: never } | { id?: never; key: string });

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
  mime_type?: string;
  sort_field?: string;
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
  verification_expires_at: number;
}

export interface AuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: number;
  refresh_expires_at: number;
  authenticated_at: number;
  created_at: number;
  updated_at: number;
}

export interface FindBookingServicesParams {
  store_id?: string;
  ids?: string[];
  booking_resource_id?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
  status?: BookingServiceStatus;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
  classification_query?: ClassificationQuery[];
  match_all?: boolean;
  from?: number;
  to?: number;
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

export type CreatePromotionDiscountInput =
  | { type: "item_percentage"; market: string; basis_points: number }
  | { type: "item_fixed"; market: string; money: Money }
  | { type: "shipping_percentage"; market: string; basis_points: number };

export type UpdatePromotionDiscountInput =
  | {
      type: "item_percentage";
      id?: string | null;
      market: string;
      basis_points: number;
    }
  | { type: "item_fixed"; id?: string | null; market: string; money: Money }
  | {
      type: "shipping_percentage";
      id?: string | null;
      market: string;
      basis_points: number;
    };

export type PromotionConditionInput =
  | { type: "products"; product_ids: string[] }
  | { type: "booking_services"; service_ids: string[] }
  | { type: "digital_products"; product_ids: string[] }
  | { type: "minimum_order_amount"; market: string; money: Money }
  | {
      type: "redemption_window";
      starts_at?: number | null;
      ends_at?: number | null;
    }
  | { type: "maximum_uses"; count: number }
  | { type: "maximum_uses_per_customer"; count: number };

export interface CreatePromoCodeParams {
  store_id?: string;
  code: string;
  discounts: CreatePromotionDiscountInput[];
  conditions?: PromotionConditionInput[];
}

export interface UpdatePromoCodeParams {
  id: string;
  store_id?: string;
  code?: string | null;
  discounts?: UpdatePromotionDiscountInput[] | null;
  conditions?: PromotionConditionInput[] | null;
  status?: PromoCodeStatus | null;
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
}

export interface CreateStoreParams {
  name: string;
  timezone: string;
  default_language: string;
  supported_languages: string[];
  /** Defaults to the creating Account's email when omitted. */
  email?: string;
}

export interface UpdateStoreParams {
  id: string;
  name?: string;
  default_market_id?: string;
  timezone?: string;
  default_language?: string;
  supported_languages?: string[];
  email?: string;
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
  response_status?: number | null;
  error?: string | null;
}

export type ProductInventoryInput = Pick<
  ProductInventory,
  "store_location_id" | "on_hand"
>;

export interface CreateProductVariantInput {
  sku?: string | null;
  prices: Price[];
  inventory: ProductInventoryInput[];
  attributes: Block[];
  requires_shipping?: boolean;
  weight_grams?: number | null;
}

export interface UpdateProductVariantInput {
  id: string;
  sku?: string | null;
  prices?: Price[];
  inventory?: ProductInventoryInput[];
  attributes?: Block[];
  requires_shipping?: boolean;
  weight_grams?: number | null;
}

export interface CreateProductParams {
  store_id?: string;
  key: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  variants?: CreateProductVariantInput[];
}

export interface UpdateProductParams {
  id: string;
  store_id?: string;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  variants?: UpdateProductVariantInput[];
  status?: ProductStatus;
}

export interface DeleteProductParams {
  id: string;
  store_id?: string;
}

export type GetProductParams = {
  store_id?: string;
} & ({ id: string; slug?: never } | { id?: never; slug: string });

export interface GetOrderParams {
  id: string;
  store_id?: string;
}

export interface GetOrdersParams {
  store_id?: string;
  customer_id?: string;
  statuses?: string[];
  product_statuses?: string[];
  booking_statuses?: string[];
  product_ids?: string[];
  booking_service_ids?: string[];
  booking_resource_ids?: string[];
  from?: number;
  to?: number;

  query?: string | number | null;
  limit?: number | null;
  cursor?: string | null;
  sort_field?: string | null;
  sort_direction?: "asc" | "desc" | null;
  created_at_from?: number | null;
  created_at_to?: number | null;
  audience_id?: string;
}

export interface UpdateOrderParams {
  id: string;
  store_id?: string;
  confirm?: boolean;
  cancel?: boolean;
  shipping_address?: Address | null;
  billing_address?: Address | null;
  product_items?: TrustedCartProductInput[];
}

export interface CancelOrderProductItemParams {
  store_id?: string;
  order_id: string;
  order_product_item_id: string;
  quantity: number;
}

export interface BookingItemLifecycleParams {
  store_id?: string;
  order_id: string;
  order_booking_item_id: string;
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
  prices: Price[];
  durations: ServiceDuration[];
  slot_interval_minutes: number;
  booking_window: BookingWindow;
  reminder_offsets_minutes: number[];
  status?: BookingOfferingStatus;
}

export interface UpdateBookingOfferingParams {
  store_id?: string;
  id: string;
  weekly_availability?: WeeklyAvailability[];
  date_overrides?: DateOverride[];
  prices?: Price[];
  durations?: ServiceDuration[];
  slot_interval_minutes?: number;
  booking_window?: BookingWindow;
  reminder_offsets_minutes?: number[];
  status?: BookingOfferingStatus;
}

export interface DeleteBookingOfferingParams {
  store_id?: string;
  id: string;
}

export type FindBookingOfferingsParams = {
  store_id?: string;
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

export interface FindBookingResourcesParams {
  store_id?: string;
  booking_service_id?: string;
  ids?: string[];
  classification_query?: ClassificationQuery[];
  match_all?: boolean;

  query?: string | number | null;
  status?: BookingResourceStatus;
  limit?: number;
  cursor?: string;
  sort_field?: string | null;
  sort_direction?: "asc" | "desc" | null;
  created_at_from?: number | null;
  created_at_to?: number | null;
  from?: number;
  to?: number;
}

export interface GetBookingResourceParams {
  id: string;
  store_id?: string;
}

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

export interface PermanentlyDeleteFormParams {
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

export interface FindCustomerActionsParams {
  store_id?: string;
  customer_id?: string;
  limit?: number;
  cursor?: string;
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
  cursor?: string;

  query?: string;
  status?: ClassificationStatus;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
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
}

export interface GetMeParams {}

export interface LogoutParams {}

export interface GetStoresParams {
  query?: string | number;
  limit?: number;
  cursor?: string;
}

export interface SetupAnalyticsParams {
  store_id?: string;
}

export interface CreateOrderRefundParams {
  order_id: string;
  refund_id: string;
  amount: number;
  allocations: import("./index").RefundAllocation[];
  reason: import("./index").RefundReason;
  private_note?: string | null;
  store_id?: string;
}

export interface RecordCashOnDeliveryRefundParams {
  order_id: string;
  refund_id: string;
  amount: number;
  allocations: import("./index").RefundAllocation[];
  reason: import("./index").RefundReason;
  private_note?: string | null;
  store_id?: string;
}

export interface GetOrderPaymentParams {
  order_id: string;
  store_id?: string;
}

export interface MarkCashOnDeliveryPaidParams {
  order_id: string;
  store_id?: string;
}

export interface FindPaymentDisputesParams {
  order_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetPaymentDisputeParams {
  order_id: string;
  dispute_id: string;
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

export interface CreateOrderRefundResponse {
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
  prices?: import("./index").Price[];
  asset_ids?: string[];
  status?: import("./index").DigitalProductStatus;
}

export interface UpdateDigitalProductParams {
  store_id?: string;
  digital_product_id: string;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: import("./index").Block[];
  classifications?: import("./index").ClassificationEntry[];
  prices?: import("./index").Price[];
  asset_ids?: string[];
  status?: import("./index").DigitalProductStatus;
}

export interface GetDigitalProductParams {
  store_id?: string;
  digital_product_id: string;
}

export interface FindDigitalProductsParams {
  store_id?: string;
  ids?: string[];
  classification_query?: ClassificationQuery[];
  match_all?: boolean;
  status?: import("./index").DigitalProductStatus;
  query?: string | number;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
}

export interface UploadDigitalAssetParams {
  store_id?: string;
  file: File;
}

export interface FindDigitalAssetsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface ArchiveDigitalAssetParams {
  store_id?: string;
  asset_id: string;
}

export interface DownloadDigitalAssetParams {
  digital_product_id: string;
  asset_id: string;
}

export interface FindStorefrontDigitalProductsParams {
  ids?: string[];
  limit?: number;
  cursor?: string;
}

export interface GetStorefrontDigitalProductParams {
  identifier: string;
}

export interface GetDigitalLibraryProductParams {
  digital_product_id: string;
}

export type SystemTemplateKey =
  | "system:order-status-update"
  | "system:user-confirmation"
  | "system:forgot-password";

export interface GetAvailabilityParams {
  store_id?: string;
  booking_service_id: string;
  from: number;
  to: number;
  booking_resource_id?: string;
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

export interface BookingResourceAvailability {
  booking_resource_id: string;
  resource_key: string;
  days: DaySlots[];
}

export interface AvailabilityResponse {
  from: number;
  to: number;
  booking_resources: BookingResourceAvailability[];
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
  status?: WorkflowStatus;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
  created_at_from?: number;
  created_at_to?: number;
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
  status?: import("./index").WorkflowExecutionStatus;
  limit?: number;
  cursor?: string;
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
}

export interface DeleteWorkflowConnectionParams {
  id: string;
  store_id?: string;
}

export interface CreateAudienceParams {
  store_id?: string;
  key: string;
  name: string;
  type: AudienceType;
}

export type PatchAudienceParams =
  | {
      store_id?: string;
      audience_id: string;
      type: "update_draft_key";
      data: { key: string };
    }
  | {
      store_id?: string;
      audience_id: string;
      type: "update_name";
      data: { name: string };
    }
  | {
      store_id?: string;
      audience_id: string;
      type: "replace_draft_paid_charge";
      data: {
        currency: Currency;
        charge: import("./index").AudiencePaidCharge;
      };
    }
  | {
      store_id?: string;
      audience_id: string;
      type: "replace_paid_amount";
      data: { cadence: AudienceBillingCadence; amount: number };
    };

export interface AudienceReferenceParams {
  store_id?: string;
  audience_id: string;
}

export interface FindAudiencesParams {
  store_id?: string;
  ids?: string[];
  status?: AudienceStatus;
  query?: string;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface GetAudienceParams {
  store_id?: string;
  audience_id: string;
}

export interface FindAudienceMembershipsParams extends AudienceReferenceParams {
  customer_id?: string;
  status?: "pending" | "subscribed" | "unsubscribed";
  limit?: number;
  cursor?: string;
}

export interface GetAudienceMembershipParams extends AudienceReferenceParams {
  membership_id: string;
}

export interface EnrollAudienceMembershipParams extends AudienceReferenceParams {
  email: string;
  insight?: Record<string, unknown> | null;
}

export interface AudienceMembershipImportRow {
  email: string;
  insight?: Record<string, unknown> | null;
}

export interface PreviewAudienceMembershipImportParams
  extends AudienceReferenceParams {
  rows: AudienceMembershipImportRow[];
}

export interface ImportAudienceMembershipsParams
  extends AudienceReferenceParams {
  rows: AudienceMembershipImportRow[];
}

export interface ReplaceAudienceMembershipInsightParams
  extends GetAudienceMembershipParams {
  insight: Record<string, unknown>;
}

export interface FindAudienceRefundsParams
  extends GetAudienceMembershipParams {
  limit?: number;
  cursor?: string;
}

export type AudienceRefundChargeSelector =
  | {
      type: "stripe_charge";
      payment_provider_id: string;
      stripe_charge_id: string;
    }
  | {
      type: "stripe_invoice";
      payment_provider_id: string;
      stripe_invoice_id: string;
    };

export interface RequestAudienceRefundParams
  extends GetAudienceMembershipParams {
  id: string;
  charge: AudienceRefundChargeSelector;
  amount: Money;
  reason: AudienceRefundReason;
  private_note?: string | null;
}

export interface GetAudienceRefundParams extends GetAudienceMembershipParams {
  refund_id: string;
}

export interface FindAudienceDisputesParams
  extends GetAudienceMembershipParams {
  limit?: number;
  cursor?: string;
}

export interface GetAudienceDisputeParams
  extends GetAudienceMembershipParams {
  dispute_id: string;
}

export interface FindStorefrontAudiencesParams {
  limit?: number;
  cursor?: string;
}

export interface GetStorefrontAudienceParams {
  key: string;
}

export interface JoinAudienceParams {
  store_id?: string;
  audience_id: string;
  email: string;
}

export interface StartAudienceCheckoutParams {
  store_id?: string;
  audience_id: string;
  request_id: string;
  email: string;
  cadence: AudienceBillingCadence;
  return_url: string;
}

export interface FindCustomerAudienceMembershipsParams {
  limit?: number;
  cursor?: string;
}

export interface CustomerAudienceMembershipReferenceParams {
  membership_id: string;
}

export interface CreateAudienceBillingPortalSessionParams
  extends CustomerAudienceMembershipReferenceParams {
  return_url: string;
}

export interface ConfirmAudienceParams {
  token: string;
}

export interface UnsubscribeAudienceParams {
  token: string;
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
  audience_membership_ids: string[];
}

export interface FindCampaignEnrollmentsParams {
  store_id?: string;
  campaign_id: string;
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

export interface CreateSuppressionParams {
  store_id?: string;
  target: SuppressionTarget;
  scope: SuppressionScope;
  reason?: SuppressionReason;
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
  target?: SuppressionTarget;
  scope?: SuppressionScope;
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

export interface CreateLeadResearchParams {
  id: string;
  audience_id?: string;
  account_message_id: string;
  content: string;
  store_id?: string;
}

export interface FindLeadResearchesParams {
  audience_id?: string;
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

export interface CancelLeadResearchMessageParams {
  lead_research_id: string;
  assistant_message_id: string;
  store_id?: string;
}

export interface ListBuildHooksParams {
  store_id: string;
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
}

export interface DisconnectSocialConnectionParams {
  connection_id: string;
  store_id?: string;
}

export interface ListPaymentProvidersParams {
  store_id?: string;
}

export interface RefreshStripePaymentProviderParams {
  store_id?: string;
}

export interface ConnectStripePaymentProviderParams {
  store_id?: string;
  return_url: string;
  refresh_url: string;
  authorize_account_debits: boolean;
  email?: string | null;
  country?: string | null;
  connected_account_id?: string | null;
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
  publish_at: number;
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

export interface GetShippingRatesParams {
  store_id?: string;
  order_id: string;
  store_location_id: string;
  lines: ShippingRateLine[];
  parcel: Parcel;
  customs_declaration?: CustomsDeclaration;
}

export interface FindOrderShipmentsParams {
  store_id?: string;
  order_id: string;
  limit?: number;
  cursor?: string;
}

export type FindFulfillmentOrdersParams = FindOrderShipmentsParams;

export interface GetFulfillmentOrderParams {
  store_id?: string;
  order_id: string;
  fulfillment_order_id: string;
}

export interface GetOrderShipmentParams {
  store_id?: string;
  order_id: string;
  shipment_id: string;
}

export interface CreateOrderShipmentParams {
  store_id?: string;
  order_id: string;
  shipment_id: string;
  rate_id: string;
  origin_store_location_id: string;
  fulfillment_order_id: string;
  lines: OrderShipmentLine[];
  parcel: Parcel;
  customs_declaration?: CustomsDeclaration;
}

export type RetryShippingLabelParams = GetOrderShipmentParams;

export type RequestShippingLabelRefundParams = GetOrderShipmentParams;

export type RetryShippingLabelRefundParams = GetOrderShipmentParams;

export type GetShippingLabelChargeParams = GetOrderShipmentParams;

export type RetryShippingLabelChargeParams = GetShippingLabelChargeParams;

export type GetShippingLabelChargeRefundParams = GetOrderShipmentParams;

export type RetryShippingLabelChargeRefundParams =
  GetShippingLabelChargeRefundParams;

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
}

export interface GetCustomerParams {
  id: string;
  store_id?: string;
}

export type ArchiveCustomerParams = GetCustomerParams;

export interface FindCustomersParams {
  store_id?: string;
  ids?: string[];

  query?: string | number;
  classification_query?: ClassificationQuery[];
  status?: CustomerStatus;
  has_verified_email?: boolean;
  has_customer_action?: boolean;
  has_cart?: boolean;
  limit?: number;
  cursor?: string;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}
