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

export type TaxMode = "exclusive" | "inclusive";

export interface OrderTaxSnapshot {
  amount: number;
  mode: TaxMode;
  rate_bps: number;
  lines: OrderTaxLine[];
}

export interface OrderTaxLine {
  rate_bps: number;
  amount: number;
  label: string;
  scope: OrderTaxScope;
}

export type OrderTaxScope = "items" | "shipping";

export interface OrderPromoCodeSnapshot {
  id: string;
  code: string;
}

export type OrderPaymentType = "cash" | "card";
export type OrderPaymentStatus =
  | "pending"
  | "requires_action"
  | "processing"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "cancelled"
  | "expired"
  | "failed"
  | "unknown";
export type StripeDisputeStatus =
  | "warning_needs_response"
  | "warning_under_review"
  | "warning_closed"
  | "needs_response"
  | "under_review"
  | "won"
  | "lost"
  | "prevented";
export interface ProviderOrderDispute {
  dispute_id: string;
  transaction_id: string;
}
export interface OrderDispute {
  id: string;
  version: number;
  store_id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  currency: Currency;
  status?: StripeDisputeStatus | null;
  reason: string;
  provider: ProviderOrderDispute;
  created_at: number;
  updated_at: number;
}
export type OrderRefundType = "manual" | "provider";
export type RefundReason =
  "customer_request" | "duplicate" | "fraudulent" | "other" | "store_closure";
export type RefundRequestReason = Exclude<RefundReason, "store_closure">;
export interface OrderRefund {
  id: string;
  version: number;
  store_id: string;
  order_id: string;
  payment_id: string;
  type: OrderRefundType;
  amount: number;
  currency: Currency;
  allocations: OrderRefundAllocation[];
  requested_by_account_id?: string | null;
  reason: RefundReason;
  private_note?: string | null;
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
  version: number;
  store_id: string;
  order_id: string;
  type: OrderPaymentType;
  payment_method_key?: string | null;
  status: OrderPaymentStatus;
  amount: number;
  currency: Currency;
  paid_amount: number;
  refund_pending_amount: number;
  refunded_amount: number;
  checkout_expires_at: number;
  provider?: ProviderOrderPayment | null;
  requested_at: number;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
  safe_error?: string | null;
}

export interface ProviderOrderPayment {
  checkout_id?: string | null;
  payment_id?: string | null;
  status?: string | null;
}

export interface OrderMoney {
  currency: Currency;
  market: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  tax?: OrderTaxSnapshot | null;
  promo_code?: OrderPromoCodeSnapshot | null;
  zone_id?: string | null;
  shipping_method_id?: string | null;
}

export interface OrderQuote {
  product_lines: ProductQuoteLine[];
  booking_lines: BookingQuoteLine[];
  digital_lines: DigitalProductQuoteLine[];
  shipping_lines: ShippingLine[];
  shipping_methods: ShippingMethod[];
  payment_method_key: string;
  payment_methods: PaymentMethod[];
  money: OrderMoney;
}

export interface Price {
  currency: Currency;
  market: string;
  amount: number;
  compare_at?: number;
  audience_id?: string;
}

export interface DigitalPrice {
  currency: Currency;
  market: string;
  amount: number;
  compare_at?: number;
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
  id: string;
  currency: Currency;
  amount: number;
  compare_at?: number | null;
  interval?: SubscriptionInterval | null;
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
  product_items: CartProduct[];
  booking_items: CartBooking[];
  digital_items: CartDigitalProduct[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms: FormEntry[];
  promo_code?: string | null;
  payment_method_key?: string | null;
  shipping_method_id?: string | null;
  converted_order_id?: string | null;
  item_count: number;
  last_action_at: number;
  abandoned_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface CartProduct {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price?: Price | null;
}

export interface CartBooking {
  id: string;
  service_id: string;
  provider_id: string;
  slots: import("./api").SlotRange[];
  forms: FormEntry[];
  price?: Price | null;
}

export interface CartDigitalProduct {
  id: string;
  digital_product_id: string;
  price?: DigitalPrice | null;
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
  "requested" | "processing" | "succeeded" | "failed" | "unknown";

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

export type SocialOAuthCallbackStatus = "connected" | "selection_required";

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

export type PaymentProviderType = "stripe";

export interface PaymentProvider {
  id: string;
  store_id: string;
  type: PaymentProviderType;
  setup_status: "pending" | "submitted" | "complete";
  payments_enabled: boolean;
  payouts_enabled: boolean;
  platform_debits_authorized: boolean;
  state_observed_at: number;
  disabled_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface PaymentProviderConnectResponse {
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
      key: string;
    }
  | {
      type: "credit_card";
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

export interface ProductVariant {
  id: string;
  sku?: string;
  prices: Price[];
  attributes: Block[];
  requires_shipping: boolean;
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

export interface OrderProductSnapshot {
  product_key: string;
  variant_sku?: string;
  variant_attributes: Block[];
  requires_shipping: boolean;
  weight?: number | null;
  price: Price;
}

export interface OrderBookingSnapshot {
  service_key: string;
  provider_key: string;
  timezone: string;
  price: Price;
}

export interface OrderDigitalProductSnapshot {
  product_key: string;
  price: DigitalPrice;
}

export interface DiscountAllocation {
  discount_application_id?: string | null;
  amount: number;
}

export interface TaxLine {
  title: string;
  rate_bps: number;
  amount: number;
  taxable_base: number;
  included_in_price: boolean;
  jurisdiction_country?: string | null;
  jurisdiction_region?: string | null;
  jurisdiction_postal_code?: string | null;
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

export type OrderProductFulfillmentStatus =
  "unfulfilled" | "partially_fulfilled" | "fulfilled" | "not_required";

export type OrderProductStatus =
  | { status: "pending"; expires_at: number }
  | { status: "confirmed" }
  | { status: "cancelled"; reason: OrderCancellationReason };

export type OrderBookingStatus =
  | { status: "pending"; expires_at: number }
  | { status: "confirmed" }
  | { status: "completed" }
  | { status: "no_show" }
  | { status: "cancelled"; reason: OrderCancellationReason };

export type BookingQuoteLineAvailability =
  | { status: "available"; spots: number }
  | { status: "unavailable"; reason: string };

export interface ProductQuoteLine {
  product_id: string;
  variant_id: string;
  quantity: number;
  money: LineMoneySnapshot;
  snapshot: OrderProductSnapshot;
}

export interface BookingQuoteLine {
  service_id: string;
  provider_id: string;
  from: number;
  to: number;
  money: LineMoneySnapshot;
  snapshot: OrderBookingSnapshot;
  availability: BookingQuoteLineAvailability;
}

export interface DigitalProductQuoteLine {
  digital_product_id: string;
  money: LineMoneySnapshot;
  snapshot: OrderDigitalProductSnapshot;
}

export interface OrderProduct {
  id: string;
  version: number;
  product_id: string;
  variant_id: string;
  quantity: number;
  cancelled_quantity: number;
  allocated_quantity: number;
  fulfilled_quantity: number;
  location_id?: string;
  snapshot: OrderProductSnapshot;
  status: OrderProductStatus;
  fulfillment_status: OrderProductFulfillmentStatus;
  money: LineMoneySnapshot;
}

export interface OrderBooking {
  id: string;
  version: number;
  service_id: string;
  booking_provider_id: string;
  from: number;
  to: number;
  forms: FormEntry[];
  snapshot: OrderBookingSnapshot;
  status: OrderBookingStatus;
  money: LineMoneySnapshot;
}

export interface OrderDigitalProduct {
  id: string;
  version: number;
  store_id: string;
  order_id: string;
  contact_id: string;
  digital_product_id: string;
  snapshot: OrderDigitalProductSnapshot;
  status: OrderProductStatus;
  money: LineMoneySnapshot;
  created_at: number;
  updated_at: number;
}

export type OrderFulfillmentStatus =
  | "unfulfilled"
  | "in_progress"
  | "partially_fulfilled"
  | "fulfilled"
  | "not_required";

export interface OrderFulfillmentSummary {
  status: OrderFulfillmentStatus;
  required_quantity: number;
  allocated_quantity: number;
  fulfilled_quantity: number;
  open_order_count: number;
  updated_at: number;
}

export interface ShippingLine {
  id: string;
  shipping_method_id?: string | null;
  title: string;
  money: LineMoneySnapshot;
}

export type FulfillmentOrderStatus =
  "open" | "in_progress" | "completed" | "cancelled";

export interface FulfillmentOrderLine {
  id: string;
  order_product_id: string;
  quantity: number;
  allocated_quantity: number;
  fulfilled_quantity: number;
  remaining_quantity: number;
}

export interface FulfillmentOrder {
  id: string;
  version: number;
  store_id: string;
  order_id: string;
  location_id: string;
  status: FulfillmentOrderStatus;
  destination?: Address | null;
  lines: FulfillmentOrderLine[];
  created_at: number;
  updated_at: number;
}

export interface Order {
  id: string;
  version: number;
  number: string;
  store_id: string;
  source_cart_id: string;
  contact_id: string;
  status: OrderStatus;
  fulfillment_status: OrderFulfillmentStatus;
  verified: boolean;
  payment_id: string;
  money: OrderMoney;
  fulfillment_summary: OrderFulfillmentSummary;
  shipping_lines: ShippingLine[];
  shipping_address?: Address;
  billing_address?: Address;
  forms: FormEntry[];
  created_at: number;
  updated_at: number;
}

export type DigitalCatalogStatus = "draft" | "active" | "archived";
export type DigitalAssetStatus = "active" | "archived";

export interface DigitalProduct {
  id: string;
  store_id: string;
  key: string;
  slug: Record<string, string>;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  prices: DigitalPrice[];
  asset_ids: string[];
  status: DigitalCatalogStatus;
  created_at: number;
  updated_at: number;
}

export interface StorefrontDigitalProduct {
  id: string;
  key: string;
  slug: Record<string, string>;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  prices: DigitalPrice[];
}

export interface DigitalAsset {
  id: string;
  store_id: string;
  file_name: string;
  mime_type: string;
  status: DigitalAssetStatus;
  created_at: number;
  updated_at: number;
}

export interface DigitalLibraryAsset {
  id: string;
  file_name: string;
  mime_type: string;
}

export interface DigitalLibraryItem {
  digital_product_id: string;
  product_key: string;
  slug: Record<string, string>;
}

export interface DigitalLibraryProduct {
  digital_product_id: string;
  product_key: string;
  slug: Record<string, string>;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
  asset_ids: string[];
}

export interface DigitalDownload {
  url: string;
  expires_at: number;
  file_name: string;
  mime_type: string;
}

export type OrderRefundAllocation =
  | { type: "product"; order_product_id: string; amount: number }
  | { type: "booking"; order_booking_id: string; amount: number }
  | {
      type: "digital";
      order_digital_product_id: string;
      amount: number;
    }
  | { type: "shipping"; shipping_line_id: string; amount: number }
  | { type: "adjustment"; amount: number; reason: string };

export type CheckoutPaymentAction =
  | { type: "none" }
  | {
      type: "stripe_embedded_checkout";
      publishable_key: string;
      client_secret: string;
      stripe_account_id?: string | null;
      expires_at: number;
    };

export interface OrderCheckoutResult {
  order_id: string;
  number: string;
  payment_action: CheckoutPaymentAction;
  payment: OrderPayment;
}

export interface Zone {
  id: string;
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
  tax_mode: TaxMode;
  payment_methods: PaymentMethod[];
  zones: Zone[];
  created_at: number;
  updated_at: number;
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
  | { event: "order.cancelled" }
  | { event: "order_product.created" }
  | { event: "order_product.updated" }
  | { event: "order_product.confirmed" }
  | { event: "order_product.cancelled" }
  | { event: "order_product.fulfilled" }
  | { event: "order_booking.created" }
  | { event: "order_booking.updated" }
  | { event: "order_booking.confirmed" }
  | { event: "order_booking.completed" }
  | { event: "order_booking.no_show" }
  | { event: "order_booking.cancelled" }
  | { event: "order_booking.reminder" }
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
  | { event: "audience.created" }
  | { event: "audience.updated" }
  | { event: "audience.member_added" }
  | { event: "audience.member_removed" }
  | { event: "audience.member_pending" }
  | { event: "audience.member_confirmed" }
  | { event: "audience.member_access_cancelled" }
  | { event: "audience.member_email_unsubscribed" }
  | { event: "audience.member_email_resubscribed" }
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

export type StoreSubscriptionBillingStatus =
  | "pending"
  | "trialing"
  | "active"
  | "past_due"
  | "cancellation_scheduled"
  | "unpaid"
  | "cancelled"
  | "expired";

export type StoreSubscriptionCheckoutStatus =
  | "requested"
  | "processing"
  | "requires_action"
  | "succeeded"
  | "rejected"
  | "failed"
  | "unknown"
  | "expired";

export interface StoreSubscriptionCheckout {
  id: string;
  store_id: string;
  store_subscription_id: string;
  plan_id: string;
  trial_days: number | null;
  status: StoreSubscriptionCheckoutStatus;
  expires_at: number;
}

export interface StorePlanAccess {
  plan_id: string;
  started_at: number;
  /** Null means intentionally lifetime access. */
  access_until: number | null;
}

export interface StoreSubscriptionPayment {
  currency: Currency;
  market: string;
}

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan_access: StorePlanAccess | null;
  payment: StoreSubscriptionPayment;
  billing_status: StoreSubscriptionBillingStatus;
  checkout_id: string | null;
  payment_action: CheckoutPaymentAction;
  trial_started_at: number | null;
  created_at: number;
  updated_at: number;
}

export type AudiencePaymentStatus =
  | "pending"
  | "requires_action"
  | "processing"
  | "declined"
  | "failed"
  | "rejected"
  | "succeeded"
  | "expired"
  | "unknown";

export type AudiencePaymentSafeError =
  "payment_rejected" | "invalid_payment_state" | "unknown_outcome";

export type AudiencePaymentType = "initial" | "renewal" | "one_time";

export type AudiencePromotionUsageStatus = "reserved" | "redeemed" | "released";

export interface AudiencePromotionSnapshot {
  promo_code_id: string;
  code: string;
  discount: number;
  usage_status: AudiencePromotionUsageStatus;
}

export interface AudiencePayment {
  id: string;
  store_id: string;
  audience_id: string;
  member_id: string;
  /** Immutable Contact snapshot that initiated this provider payment. */
  payer_contact_id: string;
  generation: number;
  type: AudiencePaymentType;
  status: AudiencePaymentStatus;
  tier_id: string;
  tier_name: string;
  price_id: string;
  subtotal: number;
  discount: number;
  amount: number;
  currency: Currency;
  interval?: SubscriptionInterval | null;
  promotion?: AudiencePromotionSnapshot | null;
  safe_error?: AudiencePaymentSafeError | null;
  requested_at: number;
  updated_at: number;
}

export interface AudienceDispute {
  id: string;
  store_id: string;
  audience_id: string;
  member_id: string;
  payment_id: string;
  amount: number;
  currency: Currency;
  status: StripeDisputeStatus;
  reason: string;
  created_at: number;
  updated_at: number;
}

export type AudienceRefundStatus =
  "requested" | "processing" | "succeeded" | "failed" | "rejected" | "unknown";

export type AudienceRefundType = "partial" | "full";

export type AudienceRefundSafeError =
  "provider_rejected" | "invalid_refund_state" | "unknown_outcome";

export interface AudienceRefund {
  id: string;
  store_id: string;
  audience_id: string;
  member_id: string;
  payment_id: string;
  revision: number;
  type: AudienceRefundType;
  amount: number;
  currency: Currency;
  requested_by_account_id?: string | null;
  reason: RefundReason;
  private_note?: string | null;
  status: AudienceRefundStatus;
  safe_error?: AudienceRefundSafeError | null;
  created_at: number;
  updated_at: number;
}

export interface Store {
  id: string;
  key: string;
  publishable_key: string;
  lifecycle: "active" | "deleting";
  default_market_id: string | null;
  timezone: string;
  languages?: string[];
  emails?: StoreEmails;
}

export interface EshopStoreState {
  store_id: string;
  selected_shipping_method_id: string | null;
  user_token: string | null;
  processing_checkout: boolean;
  loading: boolean;
  error: string | null;
}

export interface BlockBase {
  id: string;
  key: string;
}

export type TextBlockProperties = Record<string, never>;

export type NumberBlockProperties = Record<string, never>;

export type ContainerBlockProperties = Record<string, never>;

export type ReferenceDeletePolicy = "restrict" | "set_null";

export interface MediaBlockProperties {
  on_delete?: ReferenceDeletePolicy;
}

export interface EntryBlockProperties {
  on_delete?: ReferenceDeletePolicy;
  collection_id?: string | null;
}

export interface ResourceBlockProperties {
  on_delete?: ReferenceDeletePolicy;
}

export interface TextBlock extends BlockBase {
  type: "text";
  properties: TextBlockProperties;
  value: string | null;
}

export interface LocalizedTextBlock extends BlockBase {
  type: "localized_text" | "markdown";
  properties: TextBlockProperties | Record<string, never>;
  value: Record<string, string> | null;
}

export interface NumberBlock extends BlockBase {
  type: "number";
  properties: NumberBlockProperties;
  value: number | null;
}

export interface BooleanBlock extends BlockBase {
  type: "boolean";
  properties: Record<string, never>;
  value: boolean | null;
}

export interface DateBlock extends BlockBase {
  type: "date";
  properties: Record<string, never>;
  value: number | null;
}

export interface MediaBlock extends BlockBase {
  type: "media";
  properties: MediaBlockProperties;
  value: string | null;
}

export interface EntryBlock extends BlockBase {
  type: "entry";
  properties: EntryBlockProperties;
  value: string | null;
}

export interface ProductBlock extends BlockBase {
  type: "product";
  properties: ResourceBlockProperties;
  value: string | null;
}

export interface DigitalProductBlock extends BlockBase {
  type: "digital_product";
  properties: ResourceBlockProperties;
  value: string | null;
}

export interface ArrayBlock extends BlockBase {
  type: "array";
  properties: ContainerBlockProperties;
  value: Block[];
}

export interface ObjectBlock extends BlockBase {
  type: "object";
  properties: ContainerBlockProperties;
  value: Record<string, Block>;
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
  | "product"
  | "digital_product"
  | "markdown"
  | "geo_location";

export interface GeoLocationBlockProperties {}

export interface GeoLocationBlock extends BlockBase {
  type: "geo_location";
  properties: GeoLocationBlockProperties;
  value: GeoLocation | null;
}

export type Block =
  | TextBlock
  | LocalizedTextBlock
  | NumberBlock
  | BooleanBlock
  | DateBlock
  | MediaBlock
  | EntryBlock
  | ProductBlock
  | DigitalProductBlock
  | ArrayBlock
  | ObjectBlock
  | GeoLocationBlock;

export type Access = "public" | "private";

export type MediaSize = "original" | "thumbnail" | "small" | "medium" | "large";

export interface MediaResolution {
  id: string;
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
  | "audiences"
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
  trial_days: number | null;
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
  invitation_delivery_status?: EmailDeliveryStatus | null;
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
export type AudienceStatus = "active" | "draft" | "archived";
export type AudienceSource = "manual" | "system" | "lead_research";
export type AudienceMemberSource =
  "admin" | "import" | "signup" | "system" | "lead_research";
export type AudienceMemberStatus = "pending" | "active" | "archived";
export type AudienceDeliveryStatus = "subscribed" | "unsubscribed";
export type AudienceTierStatus = "draft" | "active" | "archived";
export type AudiencePriceStatus = "draft" | "active" | "archived";
export type MailboxStatus = "active" | "draft" | "archived";
export type MailboxPreset = "gmail" | "zoho" | "microsoft" | "custom";
export type MailboxConnectionSecurity = "tls" | "start_tls";
export type MailboxSyncStatus = "not_ready" | "ready" | "failed";
export type MailboxSyncIssueType = "authentication" | "connection" | "recovery";
export interface MailboxSyncIssue {
  type: MailboxSyncIssueType;
  message: string;
  observed_at: number;
}
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
  sync_issue?: MailboxSyncIssue | null;
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
  sync_issue?: MailboxSyncIssue | null;
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
export type CampaignEnrollmentImportSource = "audience" | "contact" | "manual";
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
  "campaign_step_email" | "manual_task" | "manual_reply" | "inbound_reply";
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
export type SuppressionTarget =
  | { type: "email"; email: string }
  | { type: "domain"; domain: string }
  | { type: "contact"; contact_id: string };
export type SuppressionScope =
  { type: "store" } | { type: "campaign"; campaign_id: string };
export type SuppressionReason =
  "manual" | "unsubscribed" | "bounced" | "complained" | "replied";
export type SuppressionSource = "admin" | "system";
export type WorkflowStatus = "active" | "draft" | "archived" | "deleting";
export type MutableWorkflowStatus = Exclude<WorkflowStatus, "deleting">;
export type PromoCodeStatus = "active" | "draft" | "archived";
export type CollectionStatus = "active" | "draft" | "archived";
export type EntryStatus = "active" | "draft" | "archived";
export type EmailTemplateStatus = "active" | "draft" | "archived";
export type EmailTemplateType =
  | "order_store_notification"
  | "order_contact_notification"
  | "order_booking_reminder_contact"
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
  | "refunded"
  | "other";

export type OrderStatus =
  "pending" | "confirmed" | "partially_cancelled" | "cancelled";

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
  | "product"
  | "digital_product"
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

export interface Provider {
  id: string;
  key: string;
  slug: Record<string, string>;
  store_id: string;
  status: ProviderStatus;
  blocks: Block[];
  taxonomies: TaxonomyEntry[];
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
  status: WorkflowStatus;
  schedule?: string;
  created_at: number;
  updated_at: number;
}

export interface WorkflowTrigger {
  workflow_id: string;
  trigger_url: string;
}

export interface WorkflowDefinition {
  id: string;
  store_id: string;
  workflow_id: string;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
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
  | { type: "order_booking_reminder_contact"; data: EmailSendTemplateData }
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
  data: WorkflowConnectionData;
  created_at: number;
  updated_at: number;
}

export interface WorkflowConnectionConnectUrl {
  authorization_url: string;
  state: string;
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
  result_count: number;
  error?: string;
  scheduled_at: number;
  started_at: number;
  completed_at?: number;
  created_at: number;
  updated_at: number;
}

export interface WorkflowExecutionDefinition {
  id: string;
  workflow_id: string;
  workflow_execution_id: string;
  store_id: string;
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
  created_at: number;
}

export interface WorkflowExecutionInputCapture {
  id: string;
  workflow_id: string;
  workflow_execution_id: string;
  store_id: string;
  input: WorkflowExecutionInput;
  created_at: number;
}

export interface WorkflowExecutionResults {
  id: string;
  workflow_id: string;
  workflow_execution_id: string;
  store_id: string;
  results: Record<string, NodeResult>;
  created_at: number;
  updated_at: number;
}

export type WorkflowExternalOperationType =
  "http_mutation" | "deploy_webhook" | "google_drive_upload";

export type WorkflowExternalOperationStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export interface WorkflowExternalOperationError {
  type: "provider_call_not_started" | "provider_rejected" | "unknown_outcome";
  message: string;
  at: number;
}

export interface WorkflowExternalOperationResult {
  output: unknown;
}

export interface WorkflowExternalOperation {
  id: string;
  store_id: string;
  workflow_id: string;
  execution_id: string;
  node_id: string;
  type: WorkflowExternalOperationType;
  status: WorkflowExternalOperationStatus;
  requested_at: number;
  processing_started_at?: number | null;
  completed_at?: number | null;
  result?: WorkflowExternalOperationResult | null;
  error?: WorkflowExternalOperationError | null;
  updated_at: number;
}

export type AudienceType =
  | { type: "private" }
  | { type: "open" }
  | { type: "confirmation"; template_id: string; confirmation_url: string }
  | { type: "paid" };

export interface AudiencePrice {
  id: string;
  currency: Currency;
  amount: number;
  compare_at?: number | null;
  interval?: SubscriptionInterval | null;
  status: AudiencePriceStatus;
}

export interface AudienceTier {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  benefits: string[];
  status: AudienceTierStatus;
  prices: AudiencePrice[];
  payment_provider_id: string;
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
  | "x"
  | "other";

export interface ContactChannel {
  id: string;
  store_id: string;
  contact_id: string;
  type: ChannelType;
  label?: string | null;
  value: string;
  normalized_value?: string | null;
  provider?: string | null;
  provider_user_id?: string | null;
  verified_at?: number | null;
  is_primary: boolean;
  consent_status: ContactChannelConsentStatus;
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
  status: ContactStatus;
  taxonomies: TaxonomyEntry[];
  created_at: number;
  updated_at: number;
}

export interface AudienceAccessResponse {
  has_access: boolean;
  member?: StorefrontAudienceMemberState | null;
}

export interface AudienceManagementAudience {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type: AudienceManagementType;
}

export type AudienceManagementType =
  | { type: "private" }
  | { type: "open" }
  | { type: "confirmation" }
  | { type: "paid" };

export interface AudienceManagementMember {
  id: string;
  enrollment_status: AudienceMemberStatus;
  delivery_status: AudienceDeliveryStatus;
  access?: AudienceMemberAccess | null;
  source: AudienceMemberSource;
  created_at: number;
  updated_at: number;
}

export interface AudienceManagementResponse {
  has_access: boolean;
  payment_method_update_available: boolean;
  subscription_cancellation_available: boolean;
  audience: AudienceManagementAudience;
  member: AudienceManagementMember;
}

export interface AudiencePaymentMethodSessionResponse {
  portal_url: string;
}

export interface AudienceSubscribeResponse {
  payment_action: CheckoutPaymentAction;
  payment?: StorefrontAudiencePaymentSummary | null;
  member: StorefrontAudienceMemberState;
}

export type AudienceSubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "cancellation_scheduled"
  | "unpaid"
  | "cancelled"
  | "expired";

export interface AudienceSubscription {
  id: string;
  tier_id: string;
  price_id: string;
  status: AudienceSubscriptionStatus;
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at?: number | null;
  ended_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface Audience {
  id: string;
  version: number;
  store_id: string;
  key: string;
  name: string;
  description?: string | null;
  status: AudienceStatus;
  type: AudienceType;
  source: AudienceSource;
  digital_products: AudienceDigitalProduct[];
  member_count: number;
  created_at: number;
  updated_at: number;
}

export interface AudienceDigitalProduct {
  digital_product_id: string;
  /** Empty means every current member; otherwise current Tier must match. */
  tier_ids: string[];
}

export interface AudienceMember {
  id: string;
  version: number;
  store_id: string;
  contact_id: string;
  audience_id: string;
  source: AudienceMemberSource;
  fields: Record<string, unknown>;
  enrollment_status: AudienceMemberStatus;
  delivery_status: AudienceDeliveryStatus;
  access?: AudienceMemberAccess | null;
  created_at: number;
  updated_at: number;
}

export type RemoveAudienceMemberResult =
  | { type: "removed"; member_id: string }
  | { type: "subscription_cancellation_requested"; member_id: string }
  | { type: "already_removed"; member_id: string };

export type AudienceMemberAccessSource =
  | { type: "one_time"; payment_id: string }
  | { type: "subscription"; subscription_id: string };

export interface AudienceMemberAccess {
  source: AudienceMemberAccessSource;
  tier_id: string;
  starts_at?: number | null;
  ends_at?: number | null;
}

export type StorefrontAudienceType = "open" | "confirmation" | "paid";

export interface StorefrontAudience {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type: StorefrontAudienceType;
}

export interface StorefrontAudienceTier {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  benefits: string[];
  prices: StorefrontAudiencePrice[];
}

export interface StorefrontAudiencePrice {
  id: string;
  currency: Currency;
  amount: number;
  compare_at?: number | null;
  interval?: SubscriptionInterval | null;
}

export interface StorefrontAudiencePaymentSummary {
  id: string;
  tier_id: string;
  amount: number;
  currency: Currency;
  interval?: SubscriptionInterval | null;
  status: AudiencePaymentStatus;
}

export interface StorefrontAudienceSubscription {
  id: string;
  tier_id: string;
  price_id: string;
  status: AudienceSubscriptionStatus;
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at?: number | null;
  ended_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface StorefrontAudienceMemberState {
  id: string;
  enrollment_status: AudienceMemberStatus;
  delivery_status: AudienceDeliveryStatus;
  access?: AudienceMemberAccess | null;
  created_at: number;
  updated_at: number;
}

export interface StorefrontAudienceMember {
  id: string;
  enrollment_status: AudienceMemberStatus;
  delivery_status: AudienceDeliveryStatus;
  access?: AudienceMemberAccess | null;
  audience: StorefrontAudience;
  payment?: StorefrontAudiencePaymentSummary | null;
  created_at: number;
  updated_at: number;
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

export interface CampaignPersonalization {
  id: string;
  store_id: string;
  campaign_id: string;
  run_id: string;
  status: OutreachPersonalizationStatus;
  step_position?: number | null;
  contact_ids: string[];
  overwrite: boolean;
  instructions?: string | null;
  error?: string | null;
  counters: OutreachPersonalizationCounters;
  started_at?: number | null;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface CampaignLaunchState {
  revision: number;
  status: CampaignLaunchStatus;
  requested_at: number | null;
  processing_started_at: number | null;
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
  audience_member_id?: string | null;
  audience_tier_id?: string | null;
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
  content: CampaignMessageContent;
  step_id?: string | null;
  step_position?: number | null;
  template_copy_hash?: string | null;
  copy_source: CampaignMessageCopySource;
  personalization_run_id?: string | null;
  personalization_processing_deadline_at?: number | null;
  personalized_at?: number | null;
  edited_at?: number | null;
  personalization_error?: string | null;
  in_reply_to_message_id?: string | null;
  status: CampaignMessageStatus;
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

export interface CampaignEmailContent {
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  body_html?: string | null;
  template_id?: string | null;
  template_vars: Record<string, unknown>;
  attachments: string[];
}

export interface CampaignChannelTarget {
  channel_id: string;
  type: ChannelType;
  label?: string | null;
  value: string;
}

export interface CampaignManualTaskContent {
  target_channel_type?: ChannelType | null;
  target?: CampaignChannelTarget | null;
  title: string;
  instructions: string;
  suggested_message?: string | null;
  external_url?: string | null;
  continue_behavior: ManualTaskContinueBehavior;
  outcome?: CampaignManualTaskOutcome | null;
  note?: string | null;
}

export type CampaignMessageContent =
  | { type: "campaign_step_email"; data: CampaignEmailContent }
  | { type: "manual_task"; data: CampaignManualTaskContent }
  | { type: "manual_reply"; data: CampaignEmailContent }
  | { type: "inbound_reply"; data: CampaignEmailContent };

export interface CampaignEnrollmentConversationResponse {
  enrollment: CampaignEnrollment;
  messages: CampaignMessage[];
}

export interface Suppression {
  id: string;
  store_id: string;
  target: SuppressionTarget;
  scope: SuppressionScope;
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
  company_description?: string | null;
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
}

export interface AudienceLead {
  id: string;
  store_id: string;
  audience_id: string;
  member_id: string;
  insight: LeadInsight;
  created_at: number;
  updated_at: number;
}

export interface LeadResearchRun {
  id: string;
  store_id: string;
  audience_id: string;
  title?: string | null;
  status: LeadResearchRunStatus;
  error?: string | null;
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

export interface ResearchAudienceMember {
  contact: Contact;
  member: AudienceMember;
}

export interface SendLeadResearchMessageResult {
  response: string;
  run: LeadResearchRun;
  audience_members: ResearchAudienceMember[];
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
  | { action: "order_product_created" }
  | { action: "order_product_updated" }
  | { action: "order_product_confirmed" }
  | { action: "order_product_cancelled" }
  | { action: "order_product_fulfilled" }
  | { action: "order_booking_created" }
  | { action: "order_booking_updated" }
  | { action: "order_booking_confirmed" }
  | { action: "order_booking_completed" }
  | { action: "order_booking_no_show" }
  | { action: "order_booking_cancelled" }
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
  | { action: "audience_created" }
  | { action: "audience_updated" }
  | { action: "audience_member_added" }
  | { action: "audience_member_removed" }
  | { action: "audience_member_pending" }
  | { action: "audience_member_confirmed" }
  | { action: "audience_member_access_cancelled" }
  | { action: "audience_member_email_unsubscribed" }
  | { action: "audience_member_email_resubscribed" };

export interface Event {
  id: string;
  entity: string;
  event: EventAction;
  actor: string;
  created_at: number;
}

export type OrderShipmentStatus =
  | "pending"
  | "label_created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

export interface ShippingRateLine {
  order_product_id: string;
  quantity: number;
}

export interface OrderShipmentLine {
  order_product_id: string;
  fulfillment_order_line_id: string;
  quantity: number;
}

export type ShippoLabelStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type ShippoLabelRefundStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export interface ShippoLabelRefund {
  id: string;
  version: number;
  status: ShippoLabelRefundStatus;
  refund_id?: string | null;
  safe_error?: string | null;
  requested_at: number;
  completed_at?: number | null;
}

export interface ShippoLabel {
  id: string;
  version: number;
  status: ShippoLabelStatus;
  rate_id: string;
  transaction_id?: string | null;
  label_url?: string | null;
  postage_amount: number;
  fee_amount: number;
  currency: Currency;
  requested_at: number;
  completed_at?: number | null;
  refund?: ShippoLabelRefund | null;
  safe_error?: string | null;
}

export type OrderShipmentChargeDirection = "debit" | "credit";

export type OrderShipmentChargeStatus =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export type OrderShipmentChargeType =
  | { type: "label_purchase" }
  | { type: "label_purchase_reversal" }
  | { type: "label_refund"; refund_id: string };

export interface ProviderOrderShipmentCharge {
  transaction_id?: string | null;
  status?: string | null;
}

export interface OrderShipmentCharge {
  id: string;
  order_shipment_id: string;
  type: OrderShipmentChargeType;
  direction: OrderShipmentChargeDirection;
  amount: number;
  currency: Currency;
  status: OrderShipmentChargeStatus;
  version: number;
  attempt_count: number;
  provider: ProviderOrderShipmentCharge;
  safe_error?: string | null;
  requested_at: number;
  completed_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface OrderShipment {
  id: string;
  version: number;
  store_id: string;
  order_id: string;
  fulfillment_order_id: string;
  location_id: string;
  lines: OrderShipmentLine[];
  status: OrderShipmentStatus;
  carrier?: string | null;
  service?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  tracking_status_at?: number | null;
  shippo_label?: ShippoLabel | null;
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

export interface CreateOrderShipmentResponse {
  shipment_id: string;
  shipment: OrderShipment;
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
  contents_type:
    | "DOCUMENTS"
    | "GIFT"
    | "SAMPLE"
    | "MERCHANDISE"
    | "HUMANITARIAN_DONATION"
    | "RETURN_MERCHANDISE"
    | "OTHER";
  contents_explanation?: string | null;
  non_delivery_option: "ABANDON" | "RETURN";
  certify: boolean;
  certify_signer: string;
  eel_pfc?:
    | "NOEEI_30_37_a"
    | "NOEEI_30_37_h"
    | "NOEEI_30_37_f"
    | "NOEEI_30_36"
    | "AES_ITN"
    | null;
  aes_itn?: string | null;
  incoterm?: "DDP" | "DDU" | "FCA" | "DAP" | "eDAP" | null;
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
