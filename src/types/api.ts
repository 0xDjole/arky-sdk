import type {
  Block,
  Currency,
  Money,
  Zone,
  ZoneLocation,
  WorkflowNode,
  WorkflowEdge,
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
  FormEntry,
  ClassificationSchema,
  Price,
  ServiceDuration,
  WeeklyAvailability,
  DateOverride,
  BookingWindow,
  TimeRange,
  ContactStatus,
  Contact,
  ContactSessionIssued,
  ContactSessionRecord,
  CampaignEnrollmentImportResult,
  AudienceStatus,
  AudienceType,
  AudienceTierStatus,
  AudiencePriceStatus,
  AudienceMemberStatus,
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
  SuppressionTarget,
  SuppressionScope,
  SuppressionReason,
  SocialConnectionType,
  SocialPublicationCommentIntent,
  SocialPublicationCommentPriority,
  SocialPublicationCommentStatus,
  SocialPublicationContent,
  SocialPublicationStatus,
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
}

export interface ProductQuoteInput {
  product_id: string;
  variant_id: string;
  quantity: number;
  price?: Price;
}

export interface BookingQuoteInput {
  booking_offering_id: string;
  requested_interval: TimeRange;
  form_submission_id?: string | null;
  price_override?: Price;
}

export interface DigitalProductQuoteInput {
  digital_product_id: string;
  price?: import("./index").Price;
}

export interface CartBookingInput {
  id?: string;
  booking_offering_id: string;
  requested_interval: TimeRange;
  form_submission_id?: string | null;
}

export interface CartDigitalProductInput {
  id?: string;
  digital_product_id: string;
}

export interface TrustedCartProductInput extends CartProductInput {
  price?: Price;
}

export interface TrustedCartBookingInput extends CartBookingInput {
  price_override?: Price;
}

export interface TrustedCartDigitalProductInput extends CartDigitalProductInput {
  price?: import("./index").Price;
}

export interface GetQuoteParams {
  store_id?: string;
  market?: string;
  products?: ProductQuoteInput[];
  bookings?: BookingQuoteInput[];
  digital?: DigitalProductQuoteInput[];
  shipping_address?: Address;
  billing_address?: Address;
  forms?: FormEntry[];
  payment_provider_id?: string;
  promo_code?: string;
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
  product_items?: TrustedCartProductInput[];
  booking_items?: TrustedCartBookingInput[];
  digital_items?: TrustedCartDigitalProductInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms?: FormEntry[];
  promo_code?: string | null;
  payment_provider_id?: string | null;
  shipping_method_id?: string | null;
}

export interface UpdateCartParams {
  id: string;
  store_id?: string;
  market?: string;
  product_items?: CartProductInput[];
  booking_items?: CartBookingInput[];
  digital_items?: CartDigitalProductInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms?: FormEntry[];
  promo_code?: string;
  payment_provider_id?: string;
  shipping_method_id?: string;
}

export interface AddCartProductParams {
  id: string;
  store_id?: string;
  product: CartProductInput;
}

export interface AddCartBookingParams {
  id: string;
  store_id?: string;
  booking: CartBookingInput;
}

export interface AddCartDigitalProductParams {
  id: string;
  store_id?: string;
  digital: CartDigitalProductInput;
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

export interface ReplaceMediaContentParams {
  media_id: string;
  store_id?: string;
  file: File;
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

export interface VerificationChallengeResponse {
  challenge_id: string;
  expires_at: number;
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

export type StoreRole = "admin" | "owner" | "super";

export type CreatePromotionDiscountInput =
  | { type: "item_percentage"; market: string; basis_points: number }
  | { type: "item_fixed"; market: string; money: Money }
  | { type: "shipping_percentage"; market: string; basis_points: number }
  | {
      type: "audience_percentage";
      audience_id: string;
      tier_ids: string[];
      price_ids: string[];
      basis_points: number;
    };

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
    }
  | {
      type: "audience_percentage";
      id?: string | null;
      audience_id: string;
      tier_ids: string[];
      price_ids: string[];
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
  | { type: "maximum_uses_per_contact"; count: number };

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
  contact_id?: string;
  statuses?: string[];
  product_statuses?: string[];
  booking_statuses?: string[];
  product_ids?: string[];
  booking_service_ids?: string[];
  booking_resource_ids?: string[];
  from?: number;
  to?: number;
  verified?: boolean;

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
  version: number;
  store_id?: string;
  confirm?: boolean;
  cancel?: boolean;

  shipping_address?: Address | null;

  billing_address?: Address | null;
  forms?: FormEntry[];
  product_items?: TrustedCartProductInput[];
  booking_items?: TrustedCartBookingInput[];
}

export interface CancelOrderProductParams {
  store_id?: string;
  order_id: string;
  order_product_id: string;
  version: number;
  quantity: number;
}

export interface CreateBookingResourceParams {
  store_id?: string;
  key: string;
  slug?: Record<string, string>;
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
  slug?: Record<string, string>;
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
  slug?: Record<string, string>;
  blocks?: Block[];
  classifications?: ClassificationEntry[];
  status?: BookingServiceStatus;
}

export interface UpdateBookingServiceParams {
  id: string;
  store_id?: string;
  key?: string;
  slug?: Record<string, string>;
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

export interface GetClassificationsParams {
  store_id?: string;
  parent_id?: string;
  ids?: string[];
  key?: string;
  limit?: number;
  cursor?: string;

  query?: string | number;
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
  schema?: ClassificationSchema[];
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
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];

  schedule?: string;
}

export interface UpdateWorkflowParams {
  id: string;
  store_id?: string;
  key?: string;
  status?: MutableWorkflowStatus;
  schedule?: string;
}

export interface GetWorkflowDefinitionParams {
  workflow_id: string;
  store_id?: string;
}

export interface GetWorkflowTriggerParams {
  workflow_id: string;
  store_id?: string;
}

export interface ReplaceWorkflowDefinitionParams {
  workflow_id: string;
  store_id?: string;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
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

export interface InvokeWorkflowTriggerParams {
  trigger_url: string;
  payload: Record<string, unknown>;
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
  name?: string;
  description?: string | null;
  type: AudienceType;
}

export interface UpdateAudienceParams {
  id: string;
  store_id?: string;
  key?: string;
  name?: string;
  description?: string | null;
  status?: AudienceStatus;
  type?: AudienceType;
  digital_products?: import("./index").AudienceDigitalProduct[];
}

export interface CreateAudienceTierParams {
  store_id?: string;
  audience_id: string;
  key: string;
  name: string;
  description?: string | null;
  benefits: string[];
  status: AudienceTierStatus;
  prices: AudienceTierPriceInput[];
  payment_provider_id: string;
}

export interface UpdateAudienceTierParams {
  id: string;
  store_id?: string;
  audience_id: string;
  key?: string;
  name?: string;
  description?: string | null;
  benefits?: string[];
  status?: AudienceTierStatus;
  prices?: AudienceTierPriceInput[];
  payment_provider_id?: string;
}

export interface AudienceTierPriceInput {
  id?: string;
  currency: Currency;
  amount: number;
  compare_at?: number | null;
  interval?: SubscriptionInterval | null;
  status: AudiencePriceStatus;
}

export interface FindAudienceTiersParams {
  store_id?: string;
  audience_id: string;
  status?: AudienceTierStatus;
  limit?: number;
  cursor?: string;
}

export interface FindStorefrontAudienceTiersParams {
  store_id?: string;
  audience_id: string;
  limit?: number;
  cursor?: string;
}

export interface GetAudienceTierParams {
  id: string;
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
  id: string;
  store_id?: string;
}

export interface AddAudienceMemberParams {
  store_id?: string;
  audience_id: string;
  contact_id: string;
  fields?: Record<string, unknown>;
  lead_description?: string | null;
}

export interface UpdateAudienceMemberParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  enrollment_status?: AudienceMemberStatus;
  fields?: Record<string, unknown>;
  lead_description?: string | null;
}

export interface RemoveAudienceMemberParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
}

export interface FindAudienceMembersParams {
  store_id?: string;
  audience_id?: string;
  contact_id?: string;
  enrollment_status?: AudienceMemberStatus;
  limit?: number;
  cursor?: string;
}

export interface FindAudienceLeadsParams {
  store_id?: string;
  member_ids: string[];
}

export interface RefundAudienceMemberParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  payment_id: string;
  refund_id: string;
  amount?: number | null;
  reason: import("./index").RefundRequestReason;
  private_note?: string | null;
}

export interface RefundAudienceMemberResult {
  refund_id: string;
  amount: number;
  status: import("./index").AudienceRefundStatus;
  member: import("./index").AudienceMember;
}

export interface FindAudiencePaymentsParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  limit?: number;
  cursor?: string;
}

export interface FindStorefrontAudienceMembersParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetAudiencePaymentParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  id: string;
}

export interface FindAudienceDisputesParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  payment_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetAudienceDisputeParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  id: string;
}

export interface FindAudienceRefundsParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  payment_id?: string;
  limit?: number;
  cursor?: string;
}

export interface GetAudienceRefundParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
  id: string;
}

export interface RetryAudienceRefundParams extends GetAudienceRefundParams {}

export interface GetAudienceSubscriptionParams {
  store_id?: string;
  audience_id: string;
  member_id: string;
}

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

export interface ImportAudienceMembersParams {
  store_id?: string;
  audience_id: string;
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

export interface PreviewAudienceMemberImportParams extends ImportContactsPreviewParams {
  audience_id: string;
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

export interface ImportAudienceMemberRowResult {
  row: number;
  email: string;
  contact_id?: string | null;
  contact_created: boolean;
  contact_updated: boolean;
  member_added: boolean;
  member_updated: boolean;
  error?: string | null;
}

export interface ImportAudienceMembersResult {
  rows_total: number;
  contacts_created: number;
  contacts_updated: number;
  members_added: number;
  members_updated: number;
  members_failed: number;
  rows_failed: number;
  errors: ImportContactRowError[];
  rows: ImportAudienceMemberRowResult[];
}

export interface SubscribeAudienceParams {
  store_id?: string;
  audience_id: string;
  price_id?: string;
  promo_code?: string;
  return_url?: string;
}

export interface GetStorefrontAudiencePaymentParams {
  store_id?: string;
  audience_id: string;
  payment_id: string;
}

export interface AudienceAccessParams {
  store_id?: string;
  audience_id: string;
}

export interface GetStorefrontAudienceParams {
  store_id?: string;
  key: string;
}

export interface ManageAudienceParams {
  token: string;
}

export interface CreateAudiencePaymentMethodSessionParams extends ManageAudienceParams {
  return_url: string;
}

export interface UnsubscribeAudienceParams extends ManageAudienceParams {}

export interface ConfirmAudienceParams extends ManageAudienceParams {}

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
  audience_ids?: string[];
  audience_tier_ids?: string[];
  contact_ids?: string[];
  emails?: string[];
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

export interface CreateLeadResearchRunParams {
  store_id?: string;
  audience_id?: string;
  title?: string;
}

export interface FindLeadResearchRunsParams {
  store_id?: string;
  status?: LeadResearchRunStatus;
  audience_id?: string;
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

export interface DeletePaymentProviderParams {
  store_id: string;
  id: string;
}

export interface OpenStripeDashboardParams {
  store_id: string;
  id: string;
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
  run_id: string;
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
  location_id: string;
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
  location_id: string;
  fulfillment_order_id: string;
  lines: OrderShipmentLine[];
}

export type RetryOrderShipmentParams = GetOrderShipmentParams;

export type RequestShippoLabelRefundParams = GetOrderShipmentParams;

export type RetryShippoLabelRefundParams = GetOrderShipmentParams;

export interface FindOrderShipmentChargesParams extends FindOrderShipmentsParams {
  shipment_id: string;
}

export interface GetOrderShipmentChargeParams extends GetOrderShipmentParams {
  charge_id: string;
}

export type RetryOrderShipmentChargeParams = GetOrderShipmentChargeParams;

export interface ContactInfo {
  id: string;
  verified: boolean;
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

export interface SetContactEmailParams {
  email: string;
  store_id?: string;
}

export interface CreateContactParams {
  store_id?: string;
  email: string;
  classifications?: ClassificationEntry[];
}

export interface UpdateContactParams {
  id: string;
  store_id?: string;
  email?: string;
  classifications?: ClassificationEntry[];
  status?: ContactStatus;
}

export interface GetContactParams {
  id: string;
  store_id?: string;
}

export interface FindContactChannelsParams {
  contact_ids: string[];
  store_id?: string;
}

export interface FindContactsParams {
  store_id?: string;
  ids?: string[];

  query?: string | number;
  classification_query?: ClassificationQuery[];
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
