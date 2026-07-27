export * from "./api";

export type Currency =
  | "usd"
  | "eur"
  | "gbp"
  | "jpy"
  | "cny"
  | "chf"
  | "aud"
  | "cad"
  | "hkd"
  | "sgd"
  | "nzd"
  | "krw"
  | "sek"
  | "nok"
  | "dkk"
  | "inr"
  | "mxn"
  | "brl"
  | "zar"
  | "rub"
  | "try"
  | "pln"
  | "thb"
  | "idr"
  | "myr"
  | "php"
  | "czk"
  | "ils"
  | "aed"
  | "sar"
  | "huf"
  | "ron"
  | "bgn"
  | "hrk"
  | "bam"
  | "rsd"
  | "mkd"
  | "all";

export enum PaymentMethodType {
  Cash = "cash",
  CreditCard = "credit_card",
}

export interface OrderPaymentTax {
  amount: number;
  mode_snapshot?: string;
  rate_bps: number;
  lines: OrderPaymentTaxLine[];
}

export interface OrderPaymentTaxLine {
  rate_bps: number;
  amount: number;
  label?: string;
  scope?: string;
}

export interface OrderPaymentPromoCode {
  id: string;
  code: string;
  type: string;
  value: number;
}

export type PaymentTransactionProvider = "manual" | "stripe";
export type PaymentTransactionType =
  | "create"
  | "authorize"
  | "capture"
  | "sale"
  | "cancel"
  | "refund"
  | "mark_paid";
export type PaymentTransactionRequestType =
  "create_payment" | "confirm_payment" | "cancel_payment";
export type PaymentTransactionStatus =
  | "requested"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "rejected"
  | "failed"
  | "unknown"
  | "cancelled";

export interface PaymentTransaction {
  id: string;
  store_id: string;
  payment_id: string;
  order_id: string;
  parent_transaction_id?: string | null;
  type: PaymentTransactionType;
  request?: PaymentTransactionRequestType | null;
  status: PaymentTransactionStatus;
  revision: number;
  attempt_count: number;
  amount: number;
  currency: Currency;
  provider: PaymentTransactionProvider;
  requested_at?: number | null;
  processing_started_at?: number | null;
  processing_deadline_at?: number | null;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
  safe_error?: string | null;
}

export interface OrderRefund {
  id: string;
  store_id: string;
  order_id: string;
  attempt_count: number;
  total: number;
  currency: Currency;
  provider: PaymentTransactionProvider;
  status: import("./api").RefundStatus;
  safe_error?: string | null;
  requested_at: number;
  processing_started_at?: number | null;
  processing_deadline_at?: number | null;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface OrderPayment {
  id: string;
  store_id: string;
  order_id: string;
  status: OrderPaymentStatus;
  amount: number;
  currency: Currency;
  paid: number;
  authorized_amount: number;
  captured_amount: number;
  refunded_amount: number;
  voided_amount: number;
  method_type: PaymentMethodType;
  latest_transaction_id?: string | null;
  created_at: number;
  updated_at: number;
}

export interface OrderMoney {
  currency: Currency;
  market: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  tax?: OrderPaymentTax | null;
  promo_code?: OrderPaymentPromoCode | null;
  zone_id?: string | null;
  payment_method_key?: string | null;
  shipping_method_id?: string | null;
  method_type: PaymentMethodType;
}

export interface OrderFinancialSummary {
  status: OrderPaymentSummaryStatus;
  paid: number;
  authorized_amount: number;
  captured_amount: number;
  refunded_amount: number;
  voided_amount: number;
  updated_at: number;
}

export interface PromoCodeValidation {
  promo_code_id: string;
  code: string;
  discounts: import("./api").Discount[];
  conditions: import("./api").Condition[];
}

export interface OrderQuote {
  id?: string;
  expires_at?: number;
  market: string;
  zone: Zone | null;
  items: QuoteLine[];
  shipping_lines: ShippingLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  shipping_method: ShippingMethod | null;
  payment_method: PaymentMethod | null;
  payment_methods: PaymentMethod[];
  promo_code: PromoCodeValidation | null;
  money: OrderMoney;
  charge_amount: number;
}

export interface Price {
  currency: Currency;
  market: string;
  amount: number;
  compare_at?: number;
  contact_list_id?: string;
}

export type IntervalPeriod = "month" | "year";

export interface SubscriptionInterval {
  period: IntervalPeriod;
  count: number;
}

export interface PriceProvider {
  type: "stripe";
  id: string;
}

export interface SubscriptionPrice {
  currency: Currency;
  amount: number;
  compare_at?: number;
  interval?: SubscriptionInterval;
  providers: PriceProvider[];
}

export interface Address {
  name?: string | null;
  company?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeoLocation {
  coordinates?: Coordinates | null;
  label?: string | null;
}

export interface ZoneLocation {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
}

export interface EshopCartItem {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  product_slug: string;
  variant_attributes: Record<string, any>;
  requires_shipping: boolean;
  price: Price;
  quantity: number;
  added_at: number;
  max_stock?: number;
}

export type CartStatus = "active" | "abandoned" | "converted" | "expired";
export type CartOrigin = "storefront" | "admin";

export interface Cart {
  id: string;
  store_id: string;
  contact_id: string;
  token: string;
  status: CartStatus;
  origin: CartOrigin;
  created_by_account_id?: string | null;
  market: string;
  items: import("./api").OrderCheckoutItemInput[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms: FormEntry[];
  promo_code?: string | null;
  payment_method_key?: string | null;
  shipping_method_id?: string | null;
  quote_snapshot?: OrderQuote | null;
  converted_order_id?: string | null;
  item_count: number;
  last_action_at: number;
  abandoned_at?: number | null;
  recovery_sent_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface SocialConnectionCredential {
  expires_at: number | null;
  scopes: string[];
}

export interface SocialDestinationMetadata {
  external_account_id: string;
  external_account_name: string;
  handle: string | null;
  avatar_url: string | null;
}

export type SocialConnectionType =
  | "facebook_page"
  | "instagram_business"
  | "youtube_channel"
  | "tiktok_account"
  | "x_account";

export interface SocialConnectionProviderData {
  credential: SocialConnectionCredential;
  destination: SocialDestinationMetadata;
}

export type SocialConnectionData = SocialConnectionProviderData;

export type SocialPublicationStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "unknown"
  | "cancelled";

export type YoutubePrivacy = "public" | "unlisted" | "private";
export type TiktokPrivacy = "public" | "friends" | "private";
export type InstagramPlacement = "feed" | "reel" | "story";

export interface FacebookPageContent {
  type: "facebook_page";
  text?: string | null;
  media_ids: string[];
  link_url?: string | null;
}

export interface InstagramBusinessContent {
  type: "instagram_business";
  placement?: InstagramPlacement | null;
  share_to_feed?: boolean | null;
  caption?: string | null;
  media_ids: string[];
}

export interface YoutubeChannelContent {
  type: "youtube_channel";
  title: string;
  description?: string | null;
  video_media_id: string;
  privacy: YoutubePrivacy;
}

export interface TiktokAccountContent {
  type: "tiktok_account";
  caption?: string | null;
  video_media_id: string;
  privacy: TiktokPrivacy;
}

export interface XAccountContent {
  type: "x_account";
  text?: string | null;
  media_ids: string[];
}

export type SocialPublicationContent =
  | FacebookPageContent
  | InstagramBusinessContent
  | YoutubeChannelContent
  | TiktokAccountContent
  | XAccountContent;

export interface ValidationError {
  field: string;
  error: string;
}

export interface SocialPublicationValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface SocialPublication {
  id: string;
  store_id: string;
  social_connection_id: string;
  key: string;
  status: SocialPublicationStatus;
  content: SocialPublicationContent;
  scheduled_at: number;
  published_at?: number | null;
  provider_post_id?: string | null;
  provider_post_url?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  attempt_count: number;
  last_attempt_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface SocialPublicationMutationResponse {
  publication: SocialPublication;
  validation: SocialPublicationValidation;
  publish_requested: boolean;
}

export type SocialPublicationCommentStatus =
  "open" | "replied" | "hidden" | "deleted";

export type SocialPublicationCommentIntent =
  "lead" | "support" | "complaint" | "question" | "praise" | "spam" | "general";

export type SocialPublicationCommentPriority =
  "urgent" | "high" | "normal" | "low";

export interface SocialPublicationComment {
  id: string;
  store_id: string;
  publication_id: string;
  social_connection_id: string;
  type: SocialConnectionType;
  provider_post_id?: string | null;
  provider_comment_id: string;
  provider_parent_comment_id?: string | null;
  parent_comment_id?: string | null;
  root_comment_id?: string | null;
  depth: number;
  provider_reply_count?: number | null;
  synced_reply_count: number;
  has_more_replies: boolean;
  thread_last_synced_at?: number | null;
  author_is_channel: boolean;
  contact_id?: string | null;
  action_id?: string | null;
  opportunity_action_id?: string | null;
  author_name?: string | null;
  author_handle?: string | null;
  author_provider_user_id?: string | null;
  text: string;
  status: SocialPublicationCommentStatus;
  provider_created_at?: number | null;
  last_synced_at: number;
  replied_at?: number | null;
  classification_intent?: SocialPublicationCommentIntent | null;
  classification_priority?: SocialPublicationCommentPriority | null;
  classification_confidence?: number | null;
  classification_summary?: string | null;
  classification_reason?: string | null;
  suggested_reply?: string | null;
  classified_at?: number | null;
  classification_model?: string | null;
  created_at: number;
  updated_at: number;
}

export interface SocialPublicationMetricSnapshot {
  id: string;
  store_id: string;
  publication_id: string;
  social_connection_id: string;
  type: SocialConnectionType;
  provider_post_id?: string | null;
  metrics: Record<string, number>;
  collected_at: number;
  created_at: number;
  updated_at: number;
}

export type SocialCommentReplyStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type SocialCommentReplyError =
  | { type: "provider_call_not_started"; message: string; at: number }
  | {
      type: "provider_rejected";
      message: string;
      provider_code?: string | null;
      provider_status?: number | null;
      at: number;
    }
  | { type: "unknown_outcome"; message: string; at: number };

export interface SocialCommentReplyEvidence {
  provider_comment_id: string;
  provider_comment_url?: string | null;
}

export interface SocialCommentReply {
  id: string;
  store_id: string;
  publication_id: string;
  comment_id: string;
  social_connection_id: string;
  text: string;
  status: SocialCommentReplyStatus;
  requested_at: number;
  processing_started_at?: number | null;
  processing_deadline_at?: number | null;
  completed_at?: number | null;
  evidence?: SocialCommentReplyEvidence | null;
  error?: SocialCommentReplyError | null;
}

export interface SocialPublicationCommentReplyResponse {
  comment: SocialPublicationComment;
  reply: SocialCommentReply;
}

export type SocialPublicationEffectStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type SocialPublicationEffectError =
  | { type: "provider_call_not_started"; message: string; at: number }
  | {
      type: "provider_rejected";
      message: string;
      provider_code?: string | null;
      provider_status?: number | null;
      at: number;
    }
  | { type: "unknown_outcome"; message: string; at: number };

export type SocialPublicationEffectRequest =
  | {
      type: "x_upload_media";
      media_id: string;
      uploaded_media_ids: string[];
    }
  | { type: "x_publish_post"; uploaded_media_ids: string[] }
  | {
      type: "facebook_create_unpublished_photo";
      media_id: string;
      unpublished_photo_ids: string[];
    }
  | {
      type: "facebook_publish_post";
      unpublished_photo_ids: string[];
    }
  | {
      type: "instagram_create_media_container";
      media_id: string;
      placement: InstagramPlacement;
      carousel_item: boolean;
      child_container_ids: string[];
    }
  | {
      type: "instagram_create_carousel_container";
      child_container_ids: string[];
    }
  | {
      type: "instagram_publish_container";
      container_id: string;
      container_media_id?: string | null;
    }
  | { type: "youtube_initialize_upload"; media_id: string }
  | {
      type: "youtube_upload";
      media_id: string;
      total_bytes: number;
      has_upload_session: boolean;
    }
  | { type: "tiktok_initialize_upload"; media_id: string }
  | {
      type: "tiktok_upload";
      media_id: string;
      publish_id: string;
      total_bytes: number;
      has_upload_session: boolean;
    };

export interface SocialPublicationEffectEvidence {
  provider_object_id?: string | null;
  provider_object_url?: string | null;
  has_upload_session: boolean;
  upload_total_bytes?: number | null;
}

export interface SocialPublicationEffect {
  id: string;
  store_id: string;
  publication_id: string;
  social_connection_id: string;
  publication_revision: number;
  sequence: number;
  request: SocialPublicationEffectRequest;
  status: SocialPublicationEffectStatus;
  requested_at: number;
  processing_started_at?: number | null;
  processing_deadline_at?: number | null;
  completed_at?: number | null;
  evidence?: SocialPublicationEffectEvidence | null;
  error?: SocialPublicationEffectError | null;
}

export interface SocialPublicationEngagementSyncResult {
  publications_scanned: number;
  comment_pages_scanned: number;
  comments_synced: number;
  metrics_synced: number;
  comments: SocialPublicationComment[];
  metrics: SocialPublicationMetricSnapshot[];
  skipped_publication_ids: string[];
  errors: string[];
}

export interface SocialPublicationCommentClassificationResult {
  run_id: string;
  status: SocialCommentClassificationRunStatus;
  comments_scanned: number;
  comments_classified: number;
  comments_skipped: number;
  comments: SocialPublicationComment[];
  skipped_comment_ids: string[];
  errors: string[];
  processing_deadline_at?: number | null;
  completed_at?: number | null;
}

export type SocialCommentClassificationRunStatus =
  | "requested"
  | "processing"
  | "succeeded"
  | "failed"
  | "unknown";

export interface SocialEngagementCapabilities {
  read_comments: boolean;
  reply_to_comments: boolean;
}

export interface SocialAnalyticsCapabilities {
  read_post_metrics: boolean;
}

export interface SocialProviderCapability {
  type: SocialConnectionType;
  display_name: string;
  icon_key: string;
  publishing_supported: boolean;
  required_scopes: string[];
  media_requirements: string[];
  engagement: SocialEngagementCapabilities;
  analytics: SocialAnalyticsCapabilities;
}

export interface SocialConnectResponse {
  authorization_url: string;
  state: string;
}

export type SocialOAuthCallbackStatus =
  | "pending"
  | "processing"
  | "connected"
  | "selection_required"
  | "failed"
  | "unknown";

export interface SocialOAuthDestinationOption extends SocialDestinationMetadata {
  candidate_id: string;
}

export interface SocialOAuthCallbackResponse {
  status: SocialOAuthCallbackStatus;
  store_id: string;
  type: SocialConnectionType;
  account_id: string;
  attempt_id?: string | null;
  social_connection_id?: string | null;
  destination?: SocialDestinationMetadata | null;
  options: SocialOAuthDestinationOption[];
  message: string;
}

export type BuildHookType = "vercel" | "netlify" | "cloudflare" | "custom";

export interface BuildHook {
  id: string;
  store_id: string;
  key: string;
  type: BuildHookType;
  url: string;
  headers: Record<string, string>;
  active: boolean;
  created_at: number;
  updated_at: number;
}

export interface SocialConnection {
  id: string;
  store_id: string;
  type: SocialConnectionType;
  data: SocialConnectionData;
  created_at: number;
  updated_at: number;
}

export type PaymentProviderConnectionStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type PaymentProviderConnectionError =
  | { type: "provider_rejected"; message: string; at: number }
  | { type: "provider_call_not_started"; message: string; at: number }
  | { type: "unknown_outcome"; message: string; at: number };

export interface PaymentProviderConnection {
  status: PaymentProviderConnectionStatus;
  revision: number;
  attempts: number;
  requested_at: number;
  processing_started_at?: number | null;
  completed_at?: number | null;
  error?: PaymentProviderConnectionError | null;
}

export interface PaymentProvider {
  id: string;
  store_id: string;
  key: string;
  provider: {
    type: "stripe";
    onboarding_status: "pending" | "submitted" | "complete";
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  };
  connection: PaymentProviderConnection;
  created_at: number;
  updated_at: number;
}

export interface PaymentStoreConfig {
  provider: "stripe";
  publishable_key: string;
  connected_account_id: string;
}

export interface StripePaymentProviderConnectResponse {
  provider: PaymentProvider;
  onboarding_url: string | null;
}

export interface ShippingWeightTier {
  up_to_grams: number;
  amount: number;
}

export type PaymentMethod =
  | {
      type: "cash";
      id: string;
      key: string;
    }
  | {
      type: "credit_card";
      id: string;
      key: string;
      payment_provider_id: string;
    };

export interface ShippingMethod {
  id: string;
  taxable: boolean;
  eta_text: string;
  location_id?: string;
  amount: number;
  free_above?: number;
  weight_tiers?: ShippingWeightTier[];
}

export interface Location {
  id: string;
  store_id: string;
  key: string;
  address: Address;
  is_pickup_location: boolean;
  created_at: number;
  updated_at: number;
}

export interface InventoryLevel {
  location_id: string;
  available: number;
  reserved: number;
}

export interface ProductInventory {
  id: string;
  store_id: string;
  product_id: string;
  variant_id: string;
  location_id: string;
  available: number;
  reserved: number;
  updated_at: number;
}

export type DigitalAssetType = "file" | "external_link";
export type DigitalAssetStatus = "active" | "archived";
export type DigitalDeliveryPolicy = "automatic_after_payment" | "manual";

export interface DigitalAsset {
  id: string;
  name: string;
  type: DigitalAssetType;
  storage_ref?: string | null;
  external_url?: string | null;
  status: DigitalAssetStatus;
}

export interface ProductVariant {
  id: string;
  sku?: string;
  prices: Price[];
  inventory: ProductInventory[];
  attributes: Block[];
  requires_shipping: boolean;
  digital_delivery_policy: DigitalDeliveryPolicy;
  digital_assets: DigitalAsset[];
  download_limit?: number | null;
  access_expires_after_days?: number | null;
  tax_category_id?: string | null;
  weight?: number;
}

export interface Product {
  id: string;
  store_id: string;
  key: string;
  slug: Record<string, string>;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  variants: ProductVariant[];
  status: ProductStatus;
  created_at: number;
  updated_at: number;
}

export interface GalleryItem {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

export interface ProductLineItemSnapshot {
  product_key: string;
  variant_sku?: string;
  variant_attributes: Block[];
  requires_shipping: boolean;
  tax_category_id?: string | null;
  price: Price;
}

export interface ServiceLineItemSnapshot {
  service_key: string;
  provider_key: string;
  tax_category_id?: string | null;
  price: Price;
}

export interface DiscountAllocation {
  discount_application_id?: string | null;
  amount: number;
}

export interface TaxLine {
  id: string;
  title: string;
  rate_bps: number;
  amount: number;
  taxable_base: number;
  included_in_price: boolean;
  jurisdiction_country?: string | null;
  jurisdiction_region?: string | null;
  jurisdiction_city?: string | null;
  jurisdiction_postal_code?: string | null;
  tax_category_id?: string | null;
  tax_rate_id?: string | null;
  source: string;
  provider_tax_id?: string | null;
  provider_tax_line_id?: string | null;
}

export interface LineMoneySnapshot {
  unit_price: number;
  subtotal: number;
  discount_allocations: DiscountAllocation[];
  discount_total: number;
  taxable_base: number;
  tax_lines: TaxLine[];
  tax_total: number;
  total: number;
}

export type OrderItemFulfillmentStatus =
  "unfulfilled" | "partially_fulfilled" | "fulfilled" | "not_required";

export type BookingOrderItemStatus =
  "scheduled" | "completed" | "no_show" | "cancelled";

export type OrderItemSnapshot =
  ProductLineItemSnapshot | ServiceLineItemSnapshot;

export type ProductQuoteLineAvailability =
  { ok: true; available?: number } | { ok: false; reason: string };

export type ServiceQuoteLineAvailability =
  { ok: true; spots: number } | { ok: false; reason: string };

export interface ProductQuoteLine {
  type: "product";
  line_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  money: LineMoneySnapshot;
  snapshot: ProductLineItemSnapshot;
  availability: ProductQuoteLineAvailability;
}

export interface ServiceQuoteLine {
  type: "service";
  line_id: string;
  service_id: string;
  provider_id: string;
  from: number;
  to: number;
  quantity: 1;
  unit_price: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  money: LineMoneySnapshot;
  snapshot: ServiceLineItemSnapshot;
  availability: ServiceQuoteLineAvailability;
}

export type QuoteLine = ProductQuoteLine | ServiceQuoteLine;

export interface ProductLineItem {
  type: "product";
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  cancelled_quantity: number;
  allocated_quantity: number;
  fulfilled_quantity: number;
  location_id?: string;
  snapshot: ProductLineItemSnapshot;
  status: OrderItemStatus;
  fulfillment_status: OrderItemFulfillmentStatus;
  money: LineMoneySnapshot;
}

export interface ServiceLineItem {
  type: "service";
  id: string;
  service_id: string;
  provider_id: string;
  from: number;
  to: number;
  quantity: number;
  cancelled_quantity: number;
  fulfilled_quantity: number;
  forms: FormEntry[];
  snapshot: ServiceLineItemSnapshot;
  status: OrderItemStatus;
  booking_status: BookingOrderItemStatus;
  fulfillment_status: OrderItemFulfillmentStatus;
  money: LineMoneySnapshot;
}

export type OrderItem = ProductLineItem | ServiceLineItem;

export type OrderPaymentSummaryStatus =
  | "unpaid"
  | "pending"
  | "authorized"
  | "partially_paid"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "unknown"
  | "failed"
  | "voided"
  | "expired";

export type OrderFulfillmentStatus =
  | "unfulfilled"
  | "scheduled"
  | "on_hold"
  | "in_progress"
  | "partially_fulfilled"
  | "fulfilled"
  | "incomplete"
  | "not_required";

export interface OrderFulfillmentSummary {
  status: OrderFulfillmentStatus;
  required_quantity: number;
  allocated_quantity: number;
  fulfilled_quantity: number;
  open_order_count: number;
  updated_at: number;
}

export interface HistoryEntry {
  action: string;
  reason?: string;
  timestamp: number;
}

export type DigitalAccessGrantStatus =
  "pending" | "active" | "exhausted" | "revoked" | "expired";

export interface DigitalAccessGrant {
  id: string;
  store_id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  variant_id: string;
  contact_id: string;
  asset_id: string;
  asset_name_snapshot: string;
  type: DigitalAssetType;
  status: DigitalAccessGrantStatus;
  delivery_policy_snapshot: DigitalDeliveryPolicy;
  download_limit?: number | null;
  access_expires_after_days_snapshot?: number | null;
  download_count: number;
  expires_at?: number | null;
  granted_at?: number | null;
  revoked_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface DigitalAccessDownloadResponse {
  url: string;
  url_expires_at?: number | null;
  grant: DigitalAccessGrant;
}

export interface ShippingLine {
  id: string;
  shipping_method_id?: string | null;
  title: string;
  code?: string | null;
  source: string;
  carrier_identifier?: string | null;
  money: LineMoneySnapshot;
  created_at: number;
  updated_at: number;
}

export type FulfillmentOrderStatus =
  | "open"
  | "in_progress"
  | "closed"
  | "incomplete"
  | "on_hold"
  | "scheduled"
  | "cancelled";

export type FulfillmentOrderRequestStatus =
  | "unsubmitted"
  | "submitted"
  | "accepted"
  | "rejected"
  | "cancellation_requested"
  | "cancellation_accepted";

export interface FulfillmentOrderLine {
  id: string;
  order_item_id: string;
  quantity: number;
  allocated_quantity: number;
  fulfilled_quantity: number;
  remaining_quantity: number;
}

export interface FulfillmentOrder {
  id: string;
  store_id: string;
  order_id: string;
  assigned_location_id: string;
  status: FulfillmentOrderStatus;
  request_status: FulfillmentOrderRequestStatus;
  fulfill_at?: number | null;
  fulfill_by?: number | null;
  destination?: Address | null;
  lines: FulfillmentOrderLine[];
  created_at: number;
  updated_at: number;
}

export interface Order {
  id: string;
  revision: number;
  number: string;
  store_id: string;
  source_cart_id: string;
  contact_id: string;
  status: OrderStatus;
  payment_status: OrderPaymentSummaryStatus;
  fulfillment_status: OrderFulfillmentStatus;
  verified: boolean;
  items: OrderItem[];
  payment_id: string;
  money: OrderMoney;
  financial_summary: OrderFinancialSummary;
  fulfillment_summary: OrderFulfillmentSummary;
  shipping_lines: ShippingLine[];
  shipping_address?: Address;
  billing_address?: Address;
  forms: FormEntry[];
  history: HistoryEntry[];
  contact_list_id?: string;
  fired_reminders: number[];
  created_at: number;
  updated_at: number;
}

export type CheckoutPaymentAction =
  | { type: "none" }
  | {
      type: "handle_next_action";
      client_secret: string;
      connected_account_id: string;
    };

export interface OrderPaymentObservation extends OrderPayment {
  payment_action: CheckoutPaymentAction;
}

export interface OrderCheckoutResult {
  order_id: string;
  number: string;
  payment_action: CheckoutPaymentAction;
  payment: OrderPayment;
}

export interface Zone {
  id: string;
  store_id: string;
  market_id: string;
  countries: string[];
  states: string[];
  postal_codes: string[];
  tax_bps: number;
  shipping_methods: ShippingMethod[];
}

export interface Market {
  id: string;
  store_id: string;
  key: string;
  currency: Currency;
  tax_mode: "exclusive" | "inclusive";
  payment_methods: PaymentMethod[];
  zones: Zone[];
  created_at: number;
  updated_at: number;
}

export interface Language {
  id: string;
}

export interface StoreEmails {
  billing: string;
  support: string;
}

export type WebhookEventSubscription =
  | { event: "collection.created"; key?: string }
  | { event: "collection.updated"; key?: string }
  | { event: "collection.deleted"; key?: string }
  | { event: "entry.created"; collection_id?: string; key?: string }
  | { event: "entry.updated"; collection_id?: string; key?: string }
  | { event: "entry.deleted"; collection_id?: string; key?: string }
  | { event: "order.created" }
  | { event: "order.updated" }
  | { event: "order.confirmed" }
  | { event: "order.payment_received" }
  | { event: "order.payment_failed" }
  | { event: "order.refunded" }
  | { event: "order.digital_access_activated" }
  | { event: "order.digital_access_downloaded" }
  | { event: "order.digital_access_revoked" }
  | { event: "order.cancelled" }
  | { event: "order.reminder" }
  | { event: "order.shipment_created" }
  | { event: "order.shipment_in_transit" }
  | { event: "order.shipment_out_for_delivery" }
  | { event: "order.shipment_delivered" }
  | { event: "order.shipment_failed" }
  | { event: "order.shipment_returned" }
  | { event: "order.shipment_status_changed" }
  | { event: "cart.created" }
  | { event: "cart.updated" }
  | { event: "cart.abandoned" }
  | { event: "cart.converted" }
  | { event: "product.created" }
  | { event: "product.updated" }
  | { event: "product.deleted" }
  | { event: "provider.created" }
  | { event: "provider.updated" }
  | { event: "provider.deleted" }
  | { event: "service.created" }
  | { event: "service.updated" }
  | { event: "service.deleted" }
  | { event: "media.created" }
  | { event: "media.deleted" }
  | { event: "store.created" }
  | { event: "store.updated" }
  | { event: "contact_list.created" }
  | { event: "contact_list.updated" }
  | { event: "contact_list.contact_added" }
  | { event: "contact_list.contact_pending" }
  | { event: "contact_list.contact_confirmed" }
  | { event: "contact_list.contact_cancelled" }
  | { event: "contact.created" }
  | { event: "contact.updated" }
  | { event: "form_submission.created"; form_id?: string }
  | { event: "account.updated" };

export interface Webhook {
  id: string;
  store_id: string;
  key: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  enabled: boolean;
  created_at: number;
  updated_at: number;
}

export type StoreSubscriptionStatus =
  "pending" | "active" | "cancellation_scheduled" | "cancelled" | "expired";

export type StoreSubscriptionActionStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type StoreSubscriptionActionRequest =
  | { type: "select_plan"; data: { plan_id: string } }
  | { type: "cancel_at_period_end" }
  | { type: "reactivate" };

export type StoreSubscriptionActionError =
  | {
      type: "provider_rejected";
      data: { effect_id: string; message: string };
    }
  | {
      type: "unknown_outcome";
      data: { effect_id: string; message: string };
    }
  | {
      type: "provider_call_not_started";
      data: { effect_id: string; message: string };
    };

export type StoreSubscriptionActionResult = {
  type: "checkout";
  data: {
    session_id: string;
    checkout_url: string;
    expires_at: number;
  };
};

export interface StoreSubscriptionAction {
  id: string;
  subscription_id: string;
  store_id: string;
  request: StoreSubscriptionActionRequest;
  status: StoreSubscriptionActionStatus;
  error?: StoreSubscriptionActionError | null;
  result?: StoreSubscriptionActionResult | null;
  requested_at: number;
  completed_at?: number | null;
  updated_at: number;
}

export type StoreSubscriptionEffectType =
  | "create_checkout"
  | "cancel_at_period_end"
  | "cancel_immediately"
  | "reactivate"
  | "update_plan"
  | "create_schedule"
  | "update_schedule";

export type StoreSubscriptionEffectStatus = StoreSubscriptionActionStatus;

export type StoreSubscriptionEffectError =
  | { type: "provider_rejected"; data: { message: string } }
  | { type: "unknown_outcome"; data: { message: string } }
  | { type: "provider_call_not_started"; data: { message: string } };

export interface StoreSubscriptionEffect {
  id: string;
  action_id: string;
  subscription_id: string;
  store_id: string;
  sequence: number;
  type: StoreSubscriptionEffectType;
  status: StoreSubscriptionEffectStatus;
  error?: StoreSubscriptionEffectError | null;
  requested_at: number;
  processing_started_at?: number | null;
  completed_at?: number | null;
  updated_at: number;
}

export interface StoreSubscriptionPayment {
  currency: Currency;
  market: string;
}

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan_id: string;
  pending_plan_id: string | null;
  payment: StoreSubscriptionPayment;
  status: StoreSubscriptionStatus;
  start_date: number;
  end_date: number;
  created_at: number;
  updated_at: number;
}

export type ContactListMembershipPaymentAttemptStatus =
  | "pending"
  | "requires_action"
  | "processing"
  | "declined"
  | "failed"
  | "rejected"
  | "succeeded"
  | "expired"
  | "unknown";

export type ContactListMembershipPaymentAttemptType =
  | "create_customer"
  | "create_payment_intent"
  | "create_subscription"
  | "confirm_payment_intent";

export type ContactListMembershipPaymentAttemptSafeError =
  "payment_rejected" | "invalid_payment_state" | "unknown_outcome";

export interface ContactListMembershipPaymentAttempt {
  id: string;
  store_id: string;
  contact_list_id: string;
  membership_id: string;
  contact_id: string;
  generation: number;
  stage: number;
  type: ContactListMembershipPaymentAttemptType;
  status: ContactListMembershipPaymentAttemptStatus;
  plan_id: string;
  amount: number;
  currency: Currency;
  interval?: SubscriptionInterval | null;
  safe_error?: ContactListMembershipPaymentAttemptSafeError | null;
  started_at: number;
  updated_at: number;
}

export type ContactListMembershipRefundStatus =
  "requested" | "processing" | "succeeded" | "failed" | "rejected" | "unknown";

export type ContactListMembershipRefundType = "partial" | "full";

export type ContactListMembershipRefundSafeError =
  "provider_rejected" | "invalid_refund_state" | "unknown_outcome";

export interface ContactListMembershipRefund {
  id: string;
  store_id: string;
  contact_list_id: string;
  membership_id: string;
  payment_attempt_id: string;
  revision: number;
  type: ContactListMembershipRefundType;
  amount: number;
  currency: Currency;
  status: ContactListMembershipRefundStatus;
  safe_error?: ContactListMembershipRefundSafeError | null;
  created_at: number;
  updated_at: number;
}

export type ContactListMembershipCancellationStatus =
  "requested" | "processing" | "succeeded" | "failed" | "rejected" | "unknown";

export type ContactListMembershipCancellationType =
  "at_period_end" | "immediate";

export type ContactListMembershipCancellationSafeError =
  "provider_rejected" | "invalid_cancellation_state" | "unknown_outcome";

export interface ContactListMembershipCancellation {
  id: string;
  store_id: string;
  contact_list_id: string;
  membership_id: string;
  payment_attempt_id: string;
  refund_id?: string | null;
  revision: number;
  type: ContactListMembershipCancellationType;
  status: ContactListMembershipCancellationStatus;
  safe_error?: ContactListMembershipCancellationSafeError | null;
  created_at: number;
  updated_at: number;
}

export interface Store {
  id: string;
  key: string;
  publishable_key: string;
  default_market_id: string | null;
  timezone: string;
  languages?: Language[];
  emails?: StoreEmails;
  payment?: PaymentStoreConfig | null;
}

export interface EshopStoreState {
  store_id: string;
  selected_shipping_method_id: string | null;
  user_token: string | null;
  processing_checkout: boolean;
  loading: boolean;
  error: string | null;
}

export interface Block {
  id: string;
  key: string;
  type: string;
  properties?: any;
  value?: any;
}

export type TaxonomySchemaType = "text" | "number" | "boolean" | "geo_location";

export interface TaxonomySchema {
  id: string;
  key: string;
  type: TaxonomySchemaType;
  value?: string[];
  min?: number | null;
  max?: number | null;
}

export interface TaxonomyField {
  id: string;
  key: string;
  type: TaxonomySchemaType;
  value: any;
}

export interface TaxonomyFieldQuery {
  key: string;
  type: TaxonomySchemaType;
  operation?: string;
  value: any;
  center?: { lat: number; lon: number };
  radius?: number;
}

export interface TaxonomyEntry {
  taxonomy_id: string;
  fields: TaxonomyField[];
}

export interface TaxonomyQuery {
  taxonomy_id: string;
  query: TaxonomyFieldQuery[];
}

export type FormSchemaType =
  "text" | "number" | "boolean" | "date" | "geo_location" | "select";

interface FormSchemaBase {
  id: string;
  key: string;
  required: boolean;
}

export type FormSchema =
  | (FormSchemaBase & { type: "text" })
  | (FormSchemaBase & {
      type: "number";
      min?: number | null;
      max?: number | null;
    })
  | (FormSchemaBase & { type: "boolean" })
  | (FormSchemaBase & { type: "date" })
  | (FormSchemaBase & { type: "geo_location" })
  | (FormSchemaBase & { type: "select"; options: string[] });

export type FormFieldType =
  "text" | "number" | "boolean" | "date" | "geo_location" | "select";

interface FormFieldBase {
  id: string;
  key: string;
}

export type FormField =
  | (FormFieldBase & { type: "text"; value: string })
  | (FormFieldBase & { type: "number"; value: number })
  | (FormFieldBase & { type: "boolean"; value: boolean })
  | (FormFieldBase & { type: "date"; value: number })
  | (FormFieldBase & { type: "geo_location"; value: GeoLocation })
  | (FormFieldBase & { type: "select"; value: string[] });

export type FormValue = FormField["value"];
export type FormValues = Record<string, FormValue | undefined>;

export interface FormEntry {
  form_id: string;
  fields: FormField[];
}

export type BlockType =
  | "text"
  | "localized_text"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "object"
  | "media"
  | "entry"
  | "markdown"
  | "geo_location";

export interface GeoLocationBlockProperties {}

export interface GeoLocationBlock extends Block {
  type: "geo_location";
  properties: GeoLocationBlockProperties;
  value: GeoLocation | null;
}

export type Access = "public" | "private";

export type MediaSize = "original" | "thumbnail" | "small" | "medium" | "large";

export interface MediaResolution {
  id: string;
  size: MediaSize;
  url: string;
}

export interface Media {
  id: string;
  resolutions: Partial<Record<MediaSize, MediaResolution>>;
  mime_type: string;
  title?: string | null;
  description?: string | null;
  alt?: string | null;
  store_id: string;
  metadata?: string | null;
  created_at: number;
  slug: Record<string, string>;
}

export type SubscriptionPlanFeatureType =
  | "collections"
  | "entries"
  | "services"
  | "products"
  | "providers"
  | "workflows"
  | "contact_lists"
  | "crm_contacts"
  | "media"
  | "members"
  | "taxonomies"
  | "email_templates"
  | "forms"
  | "mailboxes"
  | "social_connections"
  | "webhooks"
  | "support_agents"
  | "lead_research_runs"
  | "outreach_campaigns";

export interface SubscriptionPlanFeature {
  limit: number | null;
  reset: "never" | "monthly";
}

export interface SubscriptionPlan {
  id: string;
  provider_price_id: string | null;
  name: string;
  tier: number;
  amount: number;
  currency: Currency;
  interval: "lifetime" | "month" | "year";
  interval_count: number;
  features: Record<SubscriptionPlanFeatureType, SubscriptionPlanFeature>;
}

export type AccountApiTokenStatus = "active" | "revoked" | "expired";

export interface AccountApiToken {
  id: string;
  token_hint: string;
  name: string;
  status: AccountApiTokenStatus;
  created_at: number;
  expires_at?: number | null;
  revoked_at?: number | null;
}

export interface StoreMembership {
  id: string;
  store_id: string;
  account_id: string;
  role: import("./api").StoreRole;
  status: "invited" | "active";
  invited_by_account_id?: string | null;
  invited_at?: number | null;
  joined_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface StoreMember {
  account: Account;
  membership: StoreMembership;
}

export interface AccountLifecycle {
  last_login_at?: number | null;
  onboarding_completed: boolean;
}

export interface Account {
  id: string;
  email: string;
  lifecycle: AccountLifecycle;
}

export interface AccountUpdateResponse {
  success: boolean;
}

export interface AccountApiTokenCreated {
  token: AccountApiToken;
  value: string;
}

export interface AccountSession {
  id: string;
  status: "active" | "revoked" | "expired";
  access_expires_at: number;
  refresh_expires_at: number;
  is_verified: boolean;
  created_at: number;
  revoked_at?: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  cursor: string | null;
}

export type ServiceStatus = "active" | "draft" | "archived";
export type ProviderStatus = "active" | "draft" | "archived";

export type ProductStatus = "active" | "draft" | "archived";
export type ContactStatus = "active" | "archived";
export type ContactListStatus = "active" | "draft" | "archived";
export type ContactListSource =
  "manual" | "import" | "signup" | "admin" | "system" | "lead_research";
export type ContactListMembershipStatus =
  | "pending"
  | "active"
  | "cancellation_scheduled"
  | "cancelled"
  | "expired"
  | "archived";
export type ContactListPlanStatus = "active" | "archived";
export type ContactListContentAccessStatus = "active" | "archived";
export type MailboxStatus = "active" | "draft" | "archived";
export type MailboxPreset = "gmail" | "zoho" | "microsoft" | "custom";
export type MailboxConnectionSecurity = "tls" | "start_tls";
export type MailboxSyncStatus = "not_ready" | "ready" | "failed";
export type SmtpImapMailboxProviderInput = {
  type: "smtp_imap";
  preset: MailboxPreset;
  smtp_host: string;
  smtp_port: number;
  smtp_security: MailboxConnectionSecurity;
  imap_host: string;
  imap_port: number;
  imap_security: MailboxConnectionSecurity;
  username: string;
  sync_enabled: boolean;
  sync_interval_seconds: number;
};
export type SmtpImapMailboxProvider = SmtpImapMailboxProviderInput & {
  password_configured: boolean;
  sync_status?: MailboxSyncStatus;
  sync_error?: string | null;
  sync_ready_at?: number | null;
  last_synced_at?: number | null;
  last_seen_uid?: number | null;
};
export interface GoogleMailboxProfile {
  external_account_id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
}
export type GoogleMailboxOAuthAttemptStatus =
  | "pending"
  | "requested"
  | "processing"
  | "succeeded"
  | "rejected"
  | "failed"
  | "unknown";
export type GoogleMailboxOAuthAttemptError =
  | {
      type: "provider_rejected";
      provider_status?: number | null;
      at: number;
    }
  | {
      type: "provider_call_not_started";
      message: string;
      at: number;
    }
  | {
      type: "unknown_outcome";
      message: string;
      provider_status?: number | null;
      at: number;
    };
export interface GoogleMailboxOAuthAttempt {
  attempt_id: string;
  store_id: string;
  mailbox_id: string;
  status: GoogleMailboxOAuthAttemptStatus;
  completed_at?: number | null;
  error?: GoogleMailboxOAuthAttemptError | null;
}
export type GoogleMailboxProvider = {
  type: "google";
  profile: GoogleMailboxProfile;
  access_configured: boolean;
  refresh_configured: boolean;
  token_expires_at?: number | null;
  token_type?: string | null;
  scopes: string[];
  sync_enabled: boolean;
  sync_interval_seconds: number;
  sync_status?: MailboxSyncStatus;
  sync_error?: string | null;
  sync_ready_at?: number | null;
  last_synced_at?: number | null;
  last_history_id?: string | null;
};
export type CampaignStatus =
  "draft" | "active" | "paused" | "completed" | "archived";
export type CampaignLaunchStatus =
  "idle" | "requested" | "processing" | "succeeded" | "failed";
export type CampaignEnrollmentStatus =
  | "pending"
  | "active"
  | "action_required"
  | "replied"
  | "completed"
  | "suppressed"
  | "failed"
  | "stopped";
export type CampaignEnrollmentImportSource =
  "contact_list" | "contact" | "manual";
export type CampaignMessageStatus =
  | "draft"
  | "scheduled"
  | "pending"
  | "sending"
  | "sent"
  | "received"
  | "action_required"
  | "completed"
  | "bounced"
  | "failed"
  | "unknown"
  | "skipped"
  | "stopped"
  | "superseded";
export type CampaignMessageType =
  | "campaign_step_email"
  | "manual_task"
  | "manual_reply"
  | "inbound_reply"
  | "delivery_failure"
  | "action";
export type CampaignMessageDirection = "outbound" | "inbound" | "action";
export type CampaignMessageCopySource = "template" | "generated" | "edited";
export type OutreachThreadMode = "new_thread" | "same_thread";
export type ManualTaskContinueBehavior =
  "continue_after_delay" | "wait_until_completed";
export type OutreachStepType =
  | {
      type: "email";
      template_id: string;
      template_vars?: Record<string, unknown>;
      body?: string | null;
      thread_mode?: OutreachThreadMode;
      attachments?: string[];
    }
  | {
      type: "manual_task";
      target_channel_type?: ChannelType | null;
      title: string;
      instructions: string;
      suggested_message?: string | null;
      external_url?: string | null;
      continue_behavior: ManualTaskContinueBehavior;
    };
export type CampaignManualTaskOutcome =
  "done" | "skipped" | "got_reply" | "do_not_contact";
export type OutreachPersonalizationStatus =
  "idle" | "running" | "completed" | "failed" | "unknown";
export type SuppressionStatus = "active" | "archived";
export type SuppressionTargetType = "email" | "domain" | "contact" | "phone";
export type SuppressionScopeType = "store" | "campaign";
export type SuppressionReason =
  "manual" | "unsubscribed" | "bounced" | "complained" | "replied";
export type SuppressionSource = "admin" | "import" | "reply" | "system";
export type WorkflowStatus = "active" | "draft" | "archived" | "deleting";
export type MutableWorkflowStatus = Exclude<WorkflowStatus, "deleting">;
export type PromoCodeStatus = "active" | "draft" | "archived";
export type CollectionStatus = "active" | "draft" | "archived";
export type EntryStatus = "active" | "draft" | "archived";
export type EmailTemplateStatus = "active" | "draft" | "archived";
export type EmailTemplateType =
  | "order_store_notification"
  | "order_contact_notification"
  | "order_reminder_contact"
  | "digital_access_ready_contact"
  | "contact_store_notification"
  | "subscription_confirmation"
  | "campaign_email"
  | "newsletter_email";

export type FormStatus = "active" | "draft" | "archived";
export type TaxonomyStatus = "active" | "draft" | "archived";

export type OrderCancellationReason =
  | "admin_rejected"
  | "contact_cancelled"
  | "payment_failed"
  | "expired"
  | "other";

export type OrderItemStatus =
  | { status: "pending"; expires_at: number }
  | { status: "confirmed" }
  | { status: "cancelled"; reason: OrderCancellationReason };

export type OrderStatus =
  | "pending"
  | "partially_confirmed"
  | "confirmed"
  | "partially_cancelled"
  | "cancelled"
  | "completed";

export type OrderPaymentStatus =
  | { status: "pending"; at: number }
  | { status: "requires_action"; at: number; reason?: string | null }
  | { status: "processing"; at: number }
  | { status: "authorized"; at: number; amount: number }
  | { status: "partially_captured"; at: number; amount: number }
  | { status: "captured"; at: number; amount: number }
  | { status: "partially_refunded"; at: number; amount: number }
  | { status: "refunded"; at: number; amount: number }
  | { status: "voided"; at: number; amount: number }
  | { status: "cancelled"; at: number; reason?: string | null }
  | { status: "expired"; at: number }
  | { status: "unknown"; at: number; reason?: string | null }
  | { status: "failed"; at: number; reason?: string | null };

export interface TimeRange {
  from: number;
  to: number;
}

export type BlockSchemaType =
  | "text"
  | "localized_text"
  | "number"
  | "boolean"
  | "date"
  | "geo_location"
  | "markdown"
  | "media"
  | "entry"
  | "array"
  | "object";

export interface BlockSchemaProperties {
  min_values?: number | null;
  max_values?: number | null;
  min_length?: number | null;
  max_length?: number | null;
  pattern?: string | null;
  min?: number | null;
  max?: number | null;
  collection_id?: string | null;
  on_delete?: "restrict" | "set_null" | null;
}

export interface BlockSchema {
  id: string;
  key: string;
  type: BlockSchemaType;
  required: boolean;
  properties: BlockSchemaProperties;
  children: BlockSchema[];
}

export interface Collection {
  id: string;
  store_id: string;
  key: string;
  schema: BlockSchema[];
  blocks: Block[];
  status: CollectionStatus;
  created_at: number;
  updated_at: number;
}

export interface MediaRef {
  media_id: string;
  url?: string | null;
  mime_type?: string | null;
  alt?: string | null;
}

export type FieldOperation =
  | "equals"
  | "not_equals"
  | "contains"
  | "in"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal";

export type EntryBlockQuery =
  | { type: "text"; key: string; values: string[] }
  | { type: "number"; key: string; operation: FieldOperation; value: number }
  | { type: "boolean"; key: string; value: boolean }
  | { type: "date"; key: string; operation: FieldOperation; value: number };

export interface CollectionEntry {
  id: string;
  store_id: string;
  collection_id: string;
  key: string;
  slug: Record<string, string>;
  blocks: Block[];
  status: EntryStatus;
  created_at: number;
  updated_at: number;
}

export interface EmailTemplate {
  id: string;
  key: string;
  store_id: string;
  type: EmailTemplateType;
  subject: Record<string, string>;
  body: string;
  preheader?: string;
  variables: EmailTemplateVariable[];
  sample_data: Record<string, unknown>;
  status: EmailTemplateStatus;
  created_at: number;
  updated_at: number;
}

export type EmailTemplateVariableSource = "template" | "system";

export interface EmailTemplateVariable {
  key: string;
  required: boolean;
  source: EmailTemplateVariableSource;
}

export interface Form {
  id: string;
  key: string;
  store_id: string;
  schema: FormSchema[];
  status: FormStatus;
  created_at: number;
  updated_at: number;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  store_id: string;
  contact_id: string;
  fields: FormField[];
  created_at: number;
}

export interface Taxonomy {
  id: string;
  key: string;
  store_id: string;
  parent_id?: string | null;
  schema?: TaxonomySchema[];
  status: TaxonomyStatus;
  created_at: number;
  updated_at: number;
}

export interface ServiceDuration {
  duration: number;
  is_pause: boolean;
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
  store_id: string;
  working_days: WorkingDay[];
  specific_dates: SpecificDate[];
  prices: Price[];
  durations: ServiceDuration[];
  slot_interval: number;
  forms: FormEntry[];
  reminders: number[];
  min_advance: number;
  max_advance: number;
  created_at: number;
  updated_at: number;
}

export interface Service {
  id: string;
  key: string;
  slug: Record<string, string>;
  store_id: string;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  created_at: number;
  updated_at: number;
  status: ServiceStatus;
}

export interface ProviderTimelinePoint {
  timestamp: number;
  booked: number;
}

export interface Provider {
  id: string;
  key: string;
  slug: Record<string, string>;
  store_id: string;
  status: ProviderStatus;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  timeline: ProviderTimelinePoint[];
  created_at: number;
  updated_at: number;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  output: string;
  back_edge: boolean;
}

export interface Workflow {
  id: string;
  key: string;
  store_id: string;
  secret: string;
  trigger_url: string;
  status: WorkflowStatus;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];

  schedule?: string;
  created_at: number;
  updated_at: number;
}

export type WorkflowNode =
  | WorkflowTriggerNode
  | WorkflowHttpNode
  | WorkflowSendEmailNode
  | WorkflowDeployWebhookNode
  | WorkflowGoogleDriveUploadNode
  | WorkflowSwitchNode
  | WorkflowTransformNode
  | WorkflowLoopNode;

export interface WorkflowTriggerNode {
  type: "trigger";
  delay_ms?: number;
  schema?: Block[];
}

interface WorkflowHttpNodeBase {
  type: "http";
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  timeout_ms: number;
  delay_ms: number;
}

export type WorkflowHttpNode = WorkflowHttpNodeBase &
  (
    | {
        method: "get";
        retries: number;
        retry_delay_ms: number;
      }
    | {
        method: Exclude<WorkflowHttpMethod, "get">;
        retries: 0;
        retry_delay_ms: 0;
      }
  );

export type EmailRecipients = string | string[];

export interface EmailSendTemplateData {
  store_id: string;
  mailbox_id: string;
  template_id: string;
  recipients: EmailRecipients;
  vars?: Record<string, unknown>;
}

export type EmailSend =
  | { type: "order_store_notification"; data: EmailSendTemplateData }
  | { type: "order_contact_notification"; data: EmailSendTemplateData }
  | { type: "order_reminder_contact"; data: EmailSendTemplateData }
  | { type: "digital_access_ready_contact"; data: EmailSendTemplateData }
  | { type: "contact_store_notification"; data: EmailSendTemplateData }
  | { type: "subscription_confirmation"; data: EmailSendTemplateData };

export interface EmailSendRequest {
  send_id: string;
  send: EmailSend;
}

export type EmailDeliveryErrorKind =
  "provider_call_not_started" | "provider_rejected" | "unknown_outcome";

export type EmailDeliveryStatus =
  | "pending"
  | "sending"
  | "sent"
  | "rejected"
  | "failed"
  | "unknown"
  | "skipped";

export type EmailDeliveryType =
  | {
      type: "platform_auth_code";
      data: { account_id: string; challenge_id: string };
    }
  | {
      type: "store_auth_code";
      data: { store_id: string; account_id: string; challenge_id: string };
    }
  | {
      type: "contact_verification";
      data: { store_id: string; contact_id: string; challenge_id: string };
    }
  | {
      type: "tenant_mailbox";
      data: {
        send_id: string;
        store_id: string;
        mailbox_id: string;
        template_id: string;
      };
    }
  | {
      type: "campaign_message";
      data: {
        store_id: string;
        campaign_message_id: string;
        mailbox_id: string;
      };
    }
  | {
      type: "support_message";
      data: {
        store_id: string;
        support_message_id: string;
        mailbox_id: string;
      };
    };

export interface EmailDeliveryError {
  type: EmailDeliveryErrorKind;
  message: string;
}

export interface EmailDelivery {
  id: string;
  revision: number;
  attempts: number;
  type: EmailDeliveryType;
  status: EmailDeliveryStatus;
  error?: EmailDeliveryError | null;
  provider_message_id?: string | null;
  provider_thread_id?: string | null;
  requested_at: number;
  processing_started_at?: number | null;
  completed_at?: number | null;
  sent_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface GetEmailDeliveryParams {
  delivery_id: string;
}

export interface RetryEmailDeliveryParams {
  delivery_id: string;
  revision: number;
}

export interface EmailSendDeliveryResult {
  delivery_id: string;
  revision: number;
  recipient: string;
  mailbox_id: string;
  template_id: string;
  status: EmailDeliveryStatus;
  error?: EmailDeliveryError | null;
  provider_message_id?: string | null;
  provider_thread_id?: string | null;
}

export interface EmailSendResult {
  sent: number;
  deliveries: EmailSendDeliveryResult[];
}

export interface WorkflowSendEmailNode {
  type: "send_email";
  send: EmailSend;
  delay_ms?: number;
}

export interface WorkflowDeployWebhookNode {
  type: "deploy_webhook";
  build_hook_id: string;
  timeout_ms?: number;
  delay_ms?: number;
}

export type WorkflowConnectionType = "google_drive";

export interface GoogleDriveWorkflowProfile {
  external_account_id: string;
  display_name: string;
  email?: string | null;
}

export interface GoogleDriveWorkflowConnectionData {
  type: "google_drive";
  connected: boolean;
  profile: GoogleDriveWorkflowProfile | null;
}

export type WorkflowConnectionData = GoogleDriveWorkflowConnectionData;

export interface WorkflowConnection {
  id: string;
  store_id: string;
  type: WorkflowConnectionType;
  data: WorkflowConnectionData;
  created_at: number;
  updated_at: number;
}

export interface WorkflowConnectionConnectUrl {
  authorization_url: string;
  state: string;
}

export type WorkflowConnectionOAuthAttemptStatus =
  | "pending"
  | "requested"
  | "processing"
  | "succeeded"
  | "rejected"
  | "failed"
  | "unknown";

export type WorkflowConnectionOAuthAttemptError =
  | {
      type: "provider_rejected";
      provider_status?: number | null;
      at: number;
    }
  | { type: "provider_call_not_started"; at: number }
  | { type: "unknown_outcome"; at: number };

export interface WorkflowConnectionOAuthAttempt {
  attempt_id: string;
  store_id: string;
  workflow_connection_id: string;
  type: WorkflowConnectionType;
  status: WorkflowConnectionOAuthAttemptStatus;
  completed_at?: number | null;
  error?: WorkflowConnectionOAuthAttemptError | null;
}

export interface WorkflowGoogleDriveUploadNode {
  type: "google_drive_upload";
  workflow_connection_id: string;
  name: string;
  mime_type?: string;
  content?: unknown;
  parent_folder_id?: string | null;
  timeout_ms?: number;
  delay_ms?: number;
}

export interface WorkflowSwitchRule {
  condition: string;
}

export interface WorkflowSwitchNode {
  type: "switch";
  rules: WorkflowSwitchRule[];
  delay_ms?: number;
}

export interface WorkflowTransformNode {
  type: "transform";
  code: string;
  delay_ms?: number;
}

export interface WorkflowLoopNode {
  type: "loop";
  expression: string;
  delay_ms?: number;
}

export type WorkflowHttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type ExecutionStatus =
  "pending" | "running" | "completed" | "failed" | "cancelled";

export interface NodeResult {
  output: any;
  route: string;
  started_at: number;
  completed_at: number;
  duration_ms: number;
  error?: string;
}

export type WorkflowExecutionInput =
  | { type: "webhook"; payload: unknown }
  | { type: "schedule"; schedule: string };

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  store_id: string;
  status: ExecutionStatus;
  input: WorkflowExecutionInput;
  results: Record<string, NodeResult>;
  error?: string;
  scheduled_at: number;
  started_at: number;
  completed_at?: number;
  created_at: number;
  updated_at: number;
}

export type WorkflowEffectType =
  "http_mutation" | "deploy_webhook" | "google_drive_upload";

export type WorkflowEffectStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export interface WorkflowEffectError {
  type: "provider_call_not_started" | "provider_rejected" | "unknown_outcome";
  message: string;
  at: number;
}

export interface WorkflowEffectEvidence {
  output: unknown;
}

export interface WorkflowEffect {
  id: string;
  store_id: string;
  workflow_id: string;
  execution_id: string;
  node_id: string;
  type: WorkflowEffectType;
  status: WorkflowEffectStatus;
  requested_at: number;
  processing_started_at?: number | null;
  completed_at?: number | null;
  evidence?: WorkflowEffectEvidence | null;
  error?: WorkflowEffectError | null;
  updated_at: number;
}

export type ContactListType =
  | { type: "standard" }
  | { type: "confirmation"; confirm_template_id?: string | null }
  | { type: "paid" };

export type ContactListPlanCatalogStatus =
  "requested" | "processing" | "succeeded" | "failed" | "unknown";

export type ContactListPlanCatalogType =
  { type: "create_product" } | { type: "create_price"; price_index: number };

export type ContactListPlanCatalogSafeError =
  "provider_rejected" | "invalid_catalog_state" | "unknown_outcome";

export interface ContactListPlan {
  id: string;
  store_id: string;
  contact_list_id: string;
  key: string;
  name: string;
  description?: string | null;
  status: ContactListPlanStatus;
  prices: SubscriptionPrice[];
  payment_provider_id?: string | null;
  catalog_revision: number;
  catalog_type: ContactListPlanCatalogType;
  catalog_status: ContactListPlanCatalogStatus;
  catalog_safe_error?: ContactListPlanCatalogSafeError | null;
  created_at: number;
  updated_at: number;
}

export type ContactListContentAccessTarget =
  | { type: "cms_entry"; entry_id: string }
  | { type: "cms_collection"; collection_id: string };

export interface ContactListContentAccess {
  id: string;
  target: ContactListContentAccessTarget;
  status: ContactListContentAccessStatus;
  created_at: number;
  updated_at: number;
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

export interface PromoUsage {
  promo_code_id: string;
  uses: number;
}

export type ChannelType =
  | "email"
  | "phone"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "messenger"
  | "linkedin_company"
  | "linkedin_person"
  | "contact_form"
  | "booking_link"
  | "telegram"
  | "tiktok"
  | "youtube"
  | "other";

export interface ContactChannel {
  type: ChannelType;
  label?: string | null;
  value: string;
  normalized_value?: string | null;
  provider?: string | null;
  provider_user_id?: string | null;
  verified_at?: number | null;
  is_primary?: boolean;
  consent_status?: ContactChannelConsentStatus;
  subscribed_at?: number | null;
  unsubscribed_at?: number | null;
  source_url?: string | null;
  confidence?: number | null;
  notes?: string | null;
  created_at: number;
  updated_at: number;
}

export type ContactChannelConsentStatus =
  "unknown" | "subscribed" | "unsubscribed" | "bounced" | "blocked";

export interface Contact {
  id: string;
  store_id: string;
  email: string | null;
  verified: boolean;
  status: ContactStatus;
  channels: ContactChannel[];
  promo_usage: PromoUsage[];
  taxonomies: TaxonomyEntry[];
  created_at: number;
  updated_at: number;
}

export interface ContactListAccessResponse {
  has_access: boolean;
  membership?: ContactListMembership | null;
}

export interface ContactListContentAccessResponse {
  has_access: boolean;
  contact_list?: ContactList | null;
  membership?: ContactListMembership | null;
}

export interface ContactListManagementContactList {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type: ContactListType;
  content_access: ContactListContentAccess[];
}

export interface ContactListManagementMembership {
  id: string;
  status: ContactListMembershipStatus;
  current_payment_attempt_id?: string | null;
  source: ContactListSource;
  start_date: number;
  end_date: number;
  created_at: number;
  updated_at: number;
}

export interface ContactListManagementResponse {
  has_access: boolean;
  contact_list: ContactListManagementContactList;
  membership: ContactListManagementMembership;
}

export interface ContactListSubscribeResponse {
  payment_action: CheckoutPaymentAction;
  payment_attempt?: StorefrontContactListPaymentAttemptSummary | null;
  membership?: ContactListMembership | null;
}

export interface ContactList {
  id: string;
  store_id: string;
  key: string;
  name: string;
  description?: string | null;
  status: ContactListStatus;
  type: ContactListType;
  content_access: ContactListContentAccess[];
  source: ContactListSource;
  member_count: number;
  created_at: number;
  updated_at: number;
}

export interface ContactListMembership {
  id: string;
  store_id: string;
  contact_id: string;
  contact_list_id: string;
  source: ContactListSource;
  fields: Record<string, unknown>;
  lead_description?: string | null;
  lead?: LeadInsight | null;
  status: ContactListMembershipStatus;
  current_payment_attempt_id?: string | null;
  start_date: number;
  end_date: number;
  created_at: number;
  updated_at: number;
}

export type StorefrontContactListType =
  "standard" | "confirmation" | "paid";

export interface StorefrontContactList {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type: StorefrontContactListType;
}

export interface StorefrontContactListPlan {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  prices: SubscriptionPrice[];
}

export interface StorefrontContactListPaymentAttemptSummary {
  plan_id: string;
  amount: number;
  currency: Currency;
  interval?: SubscriptionInterval | null;
  status: ContactListMembershipPaymentAttemptStatus;
}

export interface StorefrontContactListMembership {
  id: string;
  status: ContactListMembershipStatus;
  contact_list: StorefrontContactList;
  payment_attempt?: StorefrontContactListPaymentAttemptSummary | null;
  start_date: number;
  end_date: number;
  created_at: number;
  updated_at: number;
}

export interface ContactListMember {
  contact: Contact;
  membership: ContactListMembership;
}

export interface ActionLocation {
  country_code?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
}

export interface ActionDevice {
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  language?: string | null;
}

export interface ActionSession {
  idx?: number | null;
}

export interface ActionContext {
  location?: ActionLocation | null;
  device?: ActionDevice | null;
  session?: ActionSession | null;
}

export interface SocialActionAuthor {
  provider_user_id?: string | null;
  name?: string | null;
  handle?: string | null;
}

export type OpportunityType =
  | "lead"
  | "support"
  | "complaint"
  | "question"
  | "upsell"
  | "partnership"
  | "engagement";

export type OpportunityStage =
  "new" | "reviewing" | "contacted" | "won" | "lost" | "dismissed";

export type OpportunitySource =
  | {
      type: "social_comment";
      publication_id: string;
      comment_id: string;
      action_id?: string | null;
    }
  | {
      type: "form_submission";
      form_id: string;
      submission_id: string;
    }
  | {
      type: "tracked";
      key: string;
      action_id?: string | null;
    }
  | { type: "manual" };

export type ActionData =
  | {
      type: "tracked";
      value: {
        key: string;
        payload: Record<string, unknown>;
        context?: ActionContext | null;
      };
    }
  | {
      type: "form_submission";
      value: {
        form_id: string;
        form_key: string;
        submission_id: string;
        field_keys: string[];
        context?: ActionContext | null;
      };
    }
  | {
      type: "social_comment";
      value: {
        social_connection_id: string;
        type: SocialConnectionType;
        publication_id: string;
        comment_id: string;
        provider_comment_id: string;
        provider_parent_comment_id?: string | null;
        author: SocialActionAuthor;
        text: string;
      };
    }
  | {
      type: "social_reply";
      value: {
        social_connection_id: string;
        type: SocialConnectionType;
        publication_id: string;
        comment_id: string;
        provider_comment_id?: string | null;
        provider_comment_url?: string | null;
        text: string;
      };
    }
  | {
      type: "order";
      value: {
        order_id: string;
        status: string;
        total?: number | null;
      };
    }
  | {
      type: "campaign_reply";
      value: {
        campaign_id: string;
        enrollment_id: string;
        message_id: string;
        text: string;
      };
    }
  | {
      type: "direct_message";
      value: {
        social_connection_id: string;
        type: SocialConnectionType;
        thread_id: string;
        message_id: string;
        text: string;
      };
    }
  | {
      type: "manual";
      value: {
        text: string;
        account_id?: string | null;
      };
    }
  | {
      type: "opportunity";
      value: {
        type: OpportunityType;
        stage: OpportunityStage;
        score?: number | null;
        reason?: string | null;
        suggested_next_action?: string | null;
        source: OpportunitySource;
        lead?: LeadInsight | null;
      };
    };

export interface Action {
  id: string;
  store_id: string;
  contact_id: string;
  key: string;
  type: ActionData["type"];
  preview_text?: string | null;
  occurred_at: number;
  created_at: number;
  updated_at: number;
  data: ActionData;
}

export interface Mailbox {
  id: string;
  store_id: string;
  key: string;
  email: string;
  from_name: string;
  reply_to_email?: string | null;
  provider: SmtpImapMailboxProvider | GoogleMailboxProvider;
  status: MailboxStatus;
  daily_limit: number;
  sent_today: number;
  last_sent_at?: number | null;
  sync_revision: number;
  next_sync_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface OutreachStep {
  id?: string;
  position?: number;
  delay_seconds?: number;
  type?: OutreachStepType;
}

export interface OutreachPersonalizationCounters {
  total_profiles: number;
  draft_messages: number;
  generated_messages: number;
  template_messages: number;
  failed_messages: number;
}

export interface OutreachPersonalizationState {
  run_id: string;
  status: OutreachPersonalizationStatus;
  processing_deadline_at?: number | null;
  step_position?: number | null;
  contact_ids: string[];
  overwrite: boolean;
  instructions?: string | null;
  error?: string | null;
  counters: OutreachPersonalizationCounters;
  started_at?: number | null;
  completed_at?: number | null;
}

export interface CampaignLaunchState {
  revision: number;
  status: CampaignLaunchStatus;
  requested_at: number | null;
  completed_at: number | null;
  error: string | null;
}

export interface Campaign {
  id: string;
  store_id: string;
  key: string;
  name: string;
  mailbox_ids: string[];
  status: CampaignStatus;
  launch: CampaignLaunchState;
  steps: OutreachStep[];
  personalization: OutreachPersonalizationState;
  launched_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface CampaignLaunchReadiness {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  contact_count: number;
  sender_count: number;
  step_count: number;
  daily_capacity: number;
  expected_drafts: number;
  draft_count: number;
  pending_drafts: number;
  generated_drafts: number;
  template_drafts: number;
  edited_drafts: number;
  personalization_errors: number;
  stale_drafts: number;
  suppression_count: number;
}

export interface CampaignEnrollmentImportResult {
  imported_count: number;
  existing_count: number;
  skipped_count: number;
  draft_count: number;
}

export interface CampaignEnrollment {
  id: string;
  store_id: string;
  campaign_id: string;
  contact_id: string;
  contact_list_membership_id?: string | null;
  import_source: CampaignEnrollmentImportSource;
  import_source_id?: string | null;
  imported_at?: number | null;
  mailbox_id?: string | null;
  lead_description?: string | null;
  fields: Record<string, unknown>;
  status: CampaignEnrollmentStatus;
  current_step_position: number;
  next_action_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface CampaignMessage {
  id: string;
  store_id: string;
  campaign_id: string;
  campaign_enrollment_id: string;
  contact_id: string;
  mailbox_id: string;
  direction: CampaignMessageDirection;
  type: CampaignMessageType;
  step_id?: string | null;
  step_position?: number | null;
  template_copy_hash?: string | null;
  copy_source: CampaignMessageCopySource;
  personalized_at?: number | null;
  edited_at?: number | null;
  personalization_error?: string | null;
  in_reply_to_message_id?: string | null;
  status: CampaignMessageStatus;
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  body_html?: string | null;
  template_id?: string | null;
  template_vars: Record<string, unknown>;
  rendered_subject?: string | null;
  rendered_html?: string | null;
  rendered_text?: string | null;
  attachments: string[];
  target_channel_type?: ChannelType | null;
  resolved_channel?: ContactChannel | null;
  title?: string | null;
  instructions?: string | null;
  suggested_message?: string | null;
  external_url?: string | null;
  continue_behavior?: ManualTaskContinueBehavior | null;
  outcome?: CampaignManualTaskOutcome | null;
  note?: string | null;
  provider_message_id?: string | null;
  provider_thread_id?: string | null;
  error?: string | null;
  due_at?: number | null;
  completed_at?: number | null;
  sent_at?: number | null;
  received_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface CampaignEnrollmentConversationResponse {
  enrollment: CampaignEnrollment;
  messages: CampaignMessage[];
}

export interface Suppression {
  id: string;
  store_id: string;
  campaign_id?: string | null;
  contact_id?: string | null;
  email?: string | null;
  domain?: string | null;
  target_type: SuppressionTargetType;
  target_key: string;
  scope_type: SuppressionScopeType;
  scope_key: string;
  reason: SuppressionReason;
  status: SuppressionStatus;
  source: SuppressionSource;
  created_at: number;
  updated_at: number;
}

export type LeadResearchRunStatus =
  "draft" | "running" | "completed" | "failed" | "unknown" | "cancelled";

export type LeadEmailClassification =
  | "official_domain"
  | "role_official"
  | "personal_official"
  | "free_mail"
  | "unusable"
  | "unknown";

export type LeadValidationCheckStatus =
  "passed" | "warning" | "failed" | "unknown";

export type CampaignRoute =
  "email_only" | "email_manual_followup" | "manual_only" | "needs_review";

export interface LeadScores {
  fit: number;
  problem: number;
  channel: number;
  intent: number;
  data_quality: number;
}

export interface ChannelMessage {
  type: ChannelType;
  subject?: string | null;
  body: string;
}

export interface LeadInsight {
  company?: string | null;
  contact_name?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  description?: string | null;
  pain_points: string[];
  fit_reason?: string | null;
  scores: LeadScores;
  best_channel?: ChannelType | null;
  backup_channel?: ChannelType | null;
  route: CampaignRoute;
  first_messages: ChannelMessage[];
  run_id?: string | null;
  source_url?: string | null;
  source_excerpt?: string | null;
  reasoning_summary?: string | null;
}

export interface LeadResearchRun {
  id: string;
  store_id: string;
  contact_list_id: string;
  title?: string | null;
  status: LeadResearchRunStatus;
  error?: string | null;
  request_message_id?: string | null;
  started_at?: number | null;
  processing_deadline_at?: number | null;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface LeadValidationCheck {
  key: string;
  status: LeadValidationCheckStatus;
  message: string;
}

export interface LeadEmailValidationResult {
  email: string;
  normalized_email?: string | null;
  domain?: string | null;
  classification: LeadEmailClassification;
  confidence: number;
  importable: boolean;
  hard_blockers: string[];
  checks: LeadValidationCheck[];
}

export type LeadResearchMessageRole =
  "system" | "user" | "assistant" | "action";

export interface LeadResearchMessage {
  id: string;
  store_id: string;
  run_id: string;
  role: LeadResearchMessageRole;
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: number;
}

export interface ResearchContactListMember {
  contact: Contact;
  membership: ContactListMembership;
}

export interface SendLeadResearchMessageResult {
  response: string;
  run: LeadResearchRun;
  contact_list_members: ResearchContactListMember[];
}

export type EventAction =
  | { action: "order_created" }
  | { action: "order_updated" }
  | { action: "order_confirmed" }
  | {
      action: "order_payment_received";
      data: { amount: number; currency: Currency };
    }
  | { action: "order_payment_failed"; data: { reason?: string } }
  | {
      action: "order_refunded";
      data: { amount: number; currency: Currency; reason?: string };
    }
  | { action: "order_cancelled"; data: { reason?: string } }
  | { action: "order_shipment_created"; data: { shipment_id: string } }
  | { action: "order_shipment_in_transit"; data: { shipment_id: string } }
  | { action: "order_shipment_out_for_delivery"; data: { shipment_id: string } }
  | { action: "order_shipment_delivered"; data: { shipment_id: string } }
  | {
      action: "order_shipment_failed";
      data: { shipment_id: string; reason?: string };
    }
  | { action: "order_shipment_returned"; data: { shipment_id: string } }
  | {
      action: "order_shipment_status_changed";
      data: { shipment_id: string; from: string; to: string };
    }
  | { action: "product_created" }
  | { action: "product_updated" }
  | { action: "product_deleted" }
  | { action: "collection_created" }
  | { action: "collection_updated" }
  | { action: "collection_deleted" }
  | { action: "entry_created" }
  | { action: "entry_updated" }
  | { action: "entry_deleted" }
  | { action: "provider_created" }
  | { action: "provider_updated" }
  | { action: "provider_deleted" }
  | { action: "service_created" }
  | { action: "service_updated" }
  | { action: "service_deleted" }
  | { action: "account_created" }
  | { action: "account_updated" }
  | { action: "account_deleted" }
  | { action: "media_created" }
  | { action: "media_deleted" }
  | { action: "store_created" }
  | { action: "store_updated" }
  | { action: "contact_list_created" }
  | { action: "contact_list_updated" }
  | { action: "contact_list_contact_added" }
  | { action: "contact_list_contact_removed" }
  | { action: "contact_list_contact_pending" }
  | { action: "contact_list_contact_confirmed" }
  | { action: "contact_list_contact_cancelled" };

export interface Event {
  id: string;
  entity: string;
  event: EventAction;
  actor: string;
  created_at: number;
}

export type ShippingStatus =
  | "pending"
  | "label_created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

export type ShippingProvider = "shippo";

export interface ShippingRateLine {
  order_item_id: string;
  quantity: number;
}

export interface ShipmentLine {
  order_item_id: string;
  fulfillment_order_line_id?: string | null;
  quantity: number;
}

export type ShippingLabelStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type ShippingLabelRefundStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type ShippingLabelRefundReconciliationStatus =
  "not_started" | "succeeded" | "conflict";

export interface ShippingLabelRefund {
  id: string;
  shipment_id: string;
  amount: number;
  currency: Currency;
  status: ShippingLabelRefundStatus;
  revision: number;
  attempt_count: number;
  provider_refund_id?: string | null;
  provider_status?: string | null;
  credit_settlement_id?: string | null;
  allocation_reconciliation_status: ShippingLabelRefundReconciliationStatus;
  allocation_reconciliation_completed_at?: number | null;
  safe_allocation_reconciliation_error?: string | null;
  safe_error?: string | null;
  requested_at: number;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
}

export type ShippingLabelAdjustmentStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export interface ShippingLabelAdjustment {
  id: string;
  shipment_id: string;
  provider_adjustment_id: string;
  amount: number;
  currency: Currency;
  reason: string;
  status: ShippingLabelAdjustmentStatus;
  settlement_id: string;
  safe_error?: string | null;
  created_at: number;
  updated_at: number;
}

export type ShippingLabelSettlementDirection = "debit" | "credit";

export type ShippingLabelSettlementStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type ShipmentAllocationStatus = "reserved" | "fulfilled" | "released";

export type ShippingLabelSettlementType =
  | { type: "purchase_debit" }
  | { type: "purchase_compensation_credit" }
  | { type: "refund_credit"; refund_id: string }
  | { type: "adjustment_debit"; adjustment_id: string }
  | { type: "adjustment_credit"; adjustment_id: string };

export interface ShippingLabelSettlement {
  id: string;
  shipment_id: string;
  type: ShippingLabelSettlementType;
  direction: ShippingLabelSettlementDirection;
  amount: number;
  currency: Currency;
  status: ShippingLabelSettlementStatus;
  revision: number;
  attempt_count: number;
  provider_object_id?: string | null;
  provider_status?: string | null;
  safe_error?: string | null;
  requested_at: number;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface Shipment {
  id: string;
  store_id: string;
  order_id: string;
  provider: ShippingProvider;
  fulfillment_order_id?: string | null;
  location_id: string;
  rate_id: string;
  lines: ShipmentLine[];
  allocation_status: ShipmentAllocationStatus;
  carrier: string;
  service: string;
  postage_amount: number;
  fee_amount: number;
  total_amount: number;
  currency: Currency;
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  status: ShippingStatus;
  tracking_status_at_ms: number | null;
  revision: number;
  label_status: ShippingLabelStatus;
  label_revision: number;
  label_attempt_count: number;
  provider_transaction_id?: string | null;
  provider_status?: string | null;
  safe_label_error?: string | null;
  label_requested_at: number;
  label_completed_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  display_name: string;
  amount: number;
  currency: Currency;
  estimated_days?: number | null;
}

export interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  distance_unit: "cm" | "in" | "ft" | "mm" | "m" | "yd";
  mass_unit: "oz" | "lb" | "g" | "kg";
}

export interface CreateShipmentResponse {
  shipment_id: string;
  shipment: Shipment;
}

export interface CustomsItem {
  description: string;
  quantity: number;
  net_weight: string;
  mass_unit: string;
  value_amount: string;
  value_currency: Currency;
  origin_country: string;
  tariff_number?: string | null;
}

export interface CustomsDeclaration {
  contents_type: string;
  contents_explanation?: string | null;
  non_delivery_option: string;
  certify: boolean;
  certify_signer: string;
  items: CustomsItem[];
}

export interface PromoCode {
  id: string;
  store_id: string;
  code: string;
  discounts: import("./api").Discount[];
  conditions: import("./api").Condition[];
  status: PromoCodeStatus;
  uses: number;
  created_at: number;
  updated_at: number;
}
