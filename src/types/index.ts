export * from "./api";

export enum PaymentMethodType {
  Cash = "cash",
  CreditCard = "credit_card",
}

export interface PaymentTaxLine {
  rate_bps: number;
  amount: number;
  label?: string;
  scope?: string;
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

export type OrderPaymentProvider = {
  type: "stripe";
  stripe_customer_id: string;
  payment_intent_id?: string | null;
};

export type PaymentProviderKind = "manual" | "stripe" | "gift_card" | "store_credit";
export type PaymentCaptureMethod = "automatic" | "manual";
export type PaymentTransactionType =
  | "authorize"
  | "capture"
  | "sale"
  | "void"
  | "cancel"
  | "refund"
  | "mark_paid"
  | "adjustment";
export type PaymentTransactionStatus =
  | "pending"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface PaymentTransaction {
  id: string;
  payment_id?: string | null;
  order_id?: string | null;
  parent_transaction_id?: string | null;
  type: PaymentTransactionType;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  provider: PaymentProviderKind;
  provider_transaction_id?: string | null;
  provider_payment_id?: string | null;
  provider_status?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  fee_amount?: number | null;
  net_amount?: number | null;
  settlement_currency?: string | null;
  settlement_exchange_rate?: number | null;
  payout_id?: string | null;
  idempotency_key?: string | null;
  raw_provider_status?: string | null;
  processed_at?: number | null;
  created_at: number;
}

export interface OrderPaymentRefund {
  id: string;
  type: RefundType;
  total: number;
  tax_amount: number;
  shipping_amount?: number | null;
  provider_refund_id?: string;
  status: string;
  reason?: string | null;
  lines: RefundLine[];
  transaction_ids: string[];
  created_at: number;
}

export interface OrderPayment {
  status: OrderPaymentStatus;
  currency: string;
  market: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paid: number;
  authorized_amount: number;
  captured_amount: number;
  refunded_amount: number;
  voided_amount: number;
  capture_method: PaymentCaptureMethod;
  tax?: OrderPaymentTax;
  promo_code?: OrderPaymentPromoCode;
  provider?: OrderPaymentProvider;
  refunds: OrderPaymentRefund[];
  transactions: PaymentTransaction[];
  provider_payment_id?: string | null;
  provider_customer_id?: string | null;
  provider_payment_method_id?: string | null;
  provider_status?: string | null;
  next_action?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
  idempotency_key?: string | null;
  zone_id?: string;
  payment_method_id?: string;
  shipping_method_id?: string;
  method_type: PaymentMethodType;
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
  payment: OrderPayment;
  charge_amount: number;
}

export interface Price {
  currency: string;
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
  type: string;
  id: string;
}

export interface SubscriptionPrice {
  currency: string;
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
  payment_method_id?: string | null;
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

export type IntegrationProvider =
  | { type: "arky"; api_key?: string }
  | {
      type: "stripe";
      secret_key?: string;
      publishable_key: string;
      webhook_secret?: string;
      currency: string;
    }
  | { type: "shippo"; api_token?: string; webhook_secret?: string }
  | { type: "brave_search"; api_key?: string }
  | SocialIntegrationProvider
  | { type: "vercel_deploy_hook"; url?: string }
  | { type: "netlify_deploy_hook"; url?: string }
  | { type: "cloudflare_deploy_hook"; url?: string }
  | { type: "custom_deploy_hook"; url?: string };

export interface SocialOAuthCredential {
  access_token?: string;
  refresh_token?: string | null;
  expires_at?: number | null;
  scopes: string[];
}

export interface SocialDestinationMetadata {
  external_account_id: string;
  external_account_name: string;
  handle?: string | null;
  avatar_url?: string | null;
}

export type SocialIntegrationProvider =
  | {
      type: "facebook_page";
      credential: SocialOAuthCredential;
      destination: SocialDestinationMetadata;
    }
  | {
      type: "instagram_business";
      credential: SocialOAuthCredential;
      destination: SocialDestinationMetadata;
    }
  | {
      type: "youtube_channel";
      credential: SocialOAuthCredential;
      destination: SocialDestinationMetadata;
    }
  | {
      type: "tiktok_account";
      credential: SocialOAuthCredential;
      destination: SocialDestinationMetadata;
    }
  | {
      type: "x_account";
      credential: SocialOAuthCredential;
      destination: SocialDestinationMetadata;
    };

export type SocialProviderId =
  | "facebook_page"
  | "instagram_business"
  | "youtube_channel"
  | "tiktok_account"
  | "x_account";

export type SocialPublicationStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
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
  integration_id: string;
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
  | "open"
  | "replied"
  | "hidden"
  | "deleted";

export type SocialPublicationCommentIntent =
  | "lead"
  | "support"
  | "complaint"
  | "question"
  | "praise"
  | "spam"
  | "general";

export type SocialPublicationCommentPriority =
  | "urgent"
  | "high"
  | "normal"
  | "low";

export interface SocialPublicationComment {
  id: string;
  store_id: string;
  publication_id: string;
  integration_id: string;
  provider_id: SocialProviderId;
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
  integration_id: string;
  provider_id: SocialProviderId;
  provider_post_id?: string | null;
  metrics: Record<string, number>;
  collected_at: number;
  created_at: number;
  updated_at: number;
}

export interface SocialPublicationCommentReply {
  provider_comment_id: string;
  provider_comment_url?: string | null;
}

export interface SocialPublicationCommentReplyResponse {
  comment: SocialPublicationComment;
  reply: SocialPublicationCommentReply;
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
  comments_scanned: number;
  comments_classified: number;
  comments_skipped: number;
  comments: SocialPublicationComment[];
  skipped_comment_ids: string[];
  errors: string[];
}

export interface SocialEngagementCapabilities {
  read_comments: boolean;
  reply_to_comments: boolean;
}

export interface SocialAnalyticsCapabilities {
  read_post_metrics: boolean;
}

export interface SocialIntegrationCapability {
  provider_id: SocialProviderId;
  display_name: string;
  icon_key: string;
  required_scopes: string[];
  media_requirements: string[];
  engagement: SocialEngagementCapabilities;
  analytics: SocialAnalyticsCapabilities;
}

export interface SocialConnectResponse {
  authorization_url: string;
  state: string;
}

export type SocialOAuthCallbackStatus = "code_received" | "connected" | "selection_required";

export interface SocialOAuthDestinationOption extends SocialDestinationMetadata {
  candidate_id: string;
}

export interface SocialOAuthCallbackResponse {
  status: SocialOAuthCallbackStatus;
  store_id: string;
  provider_id: SocialProviderId;
  account_id: string;
  attempt_id?: string | null;
  integration_id?: string | null;
  destination?: SocialDestinationMetadata | null;
  options: SocialOAuthDestinationOption[];
  message: string;
}

export interface Integration {
  id: string;
  store_id: string;
  key: string;
  provider: IntegrationProvider;
  created_at: number;
  updated_at: number;
}

export interface ShippingWeightTier {
  up_to_grams: number;
  amount: number;
}

export interface PaymentMethod {
  id: string;
  integration_id?: string;
}

export interface ShippingMethod {
  id: string;
  taxable: boolean;
  eta_text: string;
  location_id?: string;
  integration_id?: string;
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

export type DigitalAssetKind = "file" | "external_link";
export type DigitalAssetStatus = "active" | "archived";
export type DigitalDeliveryPolicy = "automatic_after_payment" | "manual";

export interface DigitalAsset {
  id: string;
  name: string;
  kind: DigitalAssetKind;
  storage_ref?: string | null;
  external_url?: string | null;
  status: DigitalAssetStatus;
}

export interface TaxLineReversal {
  tax_line_id: string;
  amount: number;
}

export interface RefundLine {
  order_item_id: string;
  quantity: number;
  subtotal_amount: number;
  discount_amount: number;
  taxable_base: number;
  amount: number;
  tax_amount: number;
  tax_line_reversals: TaxLineReversal[];
  restock: boolean;
}

export type RefundType = "item" | "shipping" | "goodwill" | "correction";

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
  filters?: TaxonomyEntry[];
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
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "not_required";

export type BookingOrderItemStatus =
  | "scheduled"
  | "completed"
  | "no_show"
  | "cancelled";

export type OrderItemSnapshot =
  | ProductLineItemSnapshot
  | ServiceLineItemSnapshot;

export type ProductQuoteLineAvailability =
  | { ok: true; available?: number }
  | { ok: false; reason: string };

export type ServiceQuoteLineAvailability =
  | { ok: true; spots: number }
  | { ok: false; reason: string };

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
  fulfilled_quantity: number;
  returned_quantity: number;
  refunded_quantity: number;
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
  refunded_quantity: number;
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

export interface HistoryEntry {
  action: string;
  reason?: string;
  timestamp: number;
}

export type DigitalAccessGrantStatus =
  | "pending"
  | "active"
  | "exhausted"
  | "revoked"
  | "expired";

export interface DigitalAccessGrant {
  id: string;
  order_id: string;
  order_item_id: string;
  product_id: string;
  variant_id: string;
  contact_id: string;
  asset_id: string;
  asset_name_snapshot: string;
  kind: DigitalAssetKind;
  access_url?: string | null;
  storage_ref?: string | null;
  status: DigitalAccessGrantStatus;
  delivery_policy_snapshot: DigitalDeliveryPolicy;
  download_limit?: number | null;
  download_count: number;
  expires_at?: number | null;
  granted_at?: number | null;
  revoked_at?: number | null;
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
  fulfilled_quantity: number;
}

export interface FulfillmentOrder {
  id: string;
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
  number: string;
  store_id: string;
  source_cart_id: string;
  contact_id: string;
  status: OrderStatus;
  payment_status: OrderPaymentSummaryStatus;
  fulfillment_status: OrderFulfillmentStatus;
  verified: boolean;
  items: OrderItem[];
  payment: OrderPayment;
  shipping_lines: ShippingLine[];
  fulfillment_orders: FulfillmentOrder[];
  shipping_address?: Address;
  billing_address?: Address;
  forms: FormEntry[];
  shipments: Shipment[];
  digital_access_grants: DigitalAccessGrant[];
  history: HistoryEntry[];
  contact_list_id?: string;
  fired_reminders: number[];
  created_at: number;
  updated_at: number;
}

export interface OrderCheckoutResult {
  order_id: string;
  number: string;
  client_secret: string | null;
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
  currency: string;
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
  | { event: "store.deleted" }
  | { event: "contact_list.created" }
  | { event: "contact_list.updated" }
  | { event: "contact_list.contact_added" }
  | { event: "contact_list.contact_pending" }
  | { event: "contact_list.contact_confirmed" }
  | { event: "contact_list.contact_cancelled" }
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
  | "pending"
  | "active"
  | "cancellation_scheduled"
  | "cancelled"
  | "expired";

export type StoreSubscriptionSource = "signup" | "admin" | "import";

export type StoreSubscriptionProvider = {
  type: "stripe";
  contact_id: string;
  subscription_id?: string;
  price_id?: string;
};

export interface StoreSubscriptionPayment {
  currency: string;
  market: string;
  provider?: StoreSubscriptionProvider;
}

export interface StoreSubscription {
  id: string;
  target: string;
  plan_id: string;
  pending_plan_id: string | null;
  payment: StoreSubscriptionPayment;
  status: StoreSubscriptionStatus;
  start_date: number;
  end_date: number;
  token: string;
  source: StoreSubscriptionSource;
}

export type ContactListMembershipProvider = {
  type: "stripe";
  stripe_customer_id: string;
  subscription_id?: string;
  price_id?: string;
};

export interface ContactListMembershipPayment {
  currency: string;
  market: string;
  provider?: ContactListMembershipProvider;
}

export interface Store {
  id: string;
  key: string;
  timezone: string;
  languages?: Language[];
  emails?: StoreEmails;
  subscription?: StoreSubscription;
  counts?: Record<string, number>;
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
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "geo_location"
  | "select";

export interface FormSchema {
  id: string;
  key: string;
  type: FormSchemaType;
  required?: boolean;
  min?: number | null;
  max?: number | null;
  options?: string[];
}

export type FormFieldType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "geo_location"
  | "select";

export interface FormField {
  id: string;
  key: string;
  type: FormFieldType;
  value?: any;
}

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

export type GeoLocationValue = GeoLocation;

export interface GeoLocationBlock extends Block {
  type: "geo_location";
  properties: GeoLocationBlockProperties;
  value: GeoLocation | null;
}

export type Access = "public" | "private";

export interface MediaResolution {
  id: string;
  size: string;
  url: string;
}

export interface Media {
  id: string;
  resolutions: { [key: string]: MediaResolution };
  mime_type: string;
  title?: string | null;
  description?: string | null;
  alt?: string | null;
  store_id: string;
  entity?: string;
  metadata?: string | null;
  created_at: number;
  slug: Record<string, string>;
}

export interface SubscriptionPlan {
  id: string;
  provider_price_id?: string | null;
  provider_product_id?: string | null;
  name: string;
  tier: number;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  trial_period_days: number;
}

export interface AccountToken {
  id: string;
  value?: string;
  name?: string | null;
  created_at: number;
  expires_at?: number | null;
  type?: string;
}

export interface StoreMembership {
  store_id: string;
  role: import("./api").StoreRole;
  invitation_token?: AccountToken | null;
  joined_at?: number | null;
}

export interface AccountLifecycle {
  last_login_at?: number | null;
  onboarding_completed: boolean;
}

export interface Account {
  id: string;
  email: string;
  memberships: StoreMembership[];
  api_tokens: AccountToken[];
  auth_tokens?: import("./api").AuthToken[];
  verification_codes?: unknown[];
  lifecycle?: AccountLifecycle;
}

export interface AccountUpdateResponse {
  success: boolean;
  newly_created_tokens: AccountToken[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cursor?: string;
  total?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  cursor: string | null;
  data?: T[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

export type ServiceStatus = "active" | "draft" | "archived";
export type ProviderStatus = "active" | "draft" | "archived";

export type ProductStatus = "active" | "draft" | "archived";
export type ContactStatus = "active" | "archived";
export type ContactListStatus = "active" | "draft" | "archived";
export type ContactListSource =
  | "manual"
  | "import"
  | "signup"
  | "admin"
  | "system"
  | "lead_research";
export type ContactListMembershipStatus =
  | "pending"
  | "active"
  | "cancellation_scheduled"
  | "cancelled"
  | "expired"
  | "archived";
export type MailboxStatus = "active" | "draft" | "archived";
export type MailboxPreset = "gmail" | "zoho" | "microsoft" | "custom";
export type MailboxConnectionSecurity = "tls" | "start_tls";
export type MailboxSyncStatus = "not_ready" | "ready" | "failed";
export type SmtpImapMailboxProvider = {
  type: "smtp_imap";
  preset: MailboxPreset;
  smtp_host: string;
  smtp_port: number;
  smtp_security: MailboxConnectionSecurity;
  imap_host: string;
  imap_port: number;
  imap_security: MailboxConnectionSecurity;
  username: string;
  password_configured: boolean;
  sync_enabled: boolean;
  sync_interval_seconds: number;
  sync_status?: MailboxSyncStatus;
  sync_error?: string | null;
  sync_ready_at?: number | null;
  last_synced_at?: number | null;
  last_seen_uid?: number | null;
};
export type MailboxProvider = { type: "fake" } | SmtpImapMailboxProvider;
export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";
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
  | "contact_list"
  | "contact"
  | "manual";
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
  | "continue_after_delay"
  | "wait_until_completed";
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
  | "done"
  | "skipped"
  | "got_reply"
  | "do_not_contact";
export type CampaignEnrollmentStepExecutionOutcome = CampaignManualTaskOutcome;
export type OutreachPersonalizationStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";
export type SuppressionStatus = "active" | "archived";
export type SuppressionTargetType = "email" | "domain" | "contact" | "phone";
export type SuppressionScopeType = "store" | "campaign";
export type SuppressionReason =
  | "manual"
  | "unsubscribed"
  | "bounced"
  | "complained"
  | "replied";
export type SuppressionSource = "admin" | "import" | "reply" | "system";
export type WorkflowStatus = "active" | "draft" | "archived";
export type PromoCodeStatus = "active" | "draft" | "archived";
export type CollectionStatus = "active" | "draft" | "archived";
export type EntryStatus = "active" | "draft" | "archived";
export type EmailTemplateStatus = "active" | "draft" | "archived";

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
  subject: Record<string, string>;
  body: string;
  from_name: string;
  from_email: string;
  reply_to?: string;
  preheader?: string;
  variables: EmailTemplateVariable[];
  sample_data: Record<string, unknown>;
  status: EmailTemplateStatus;
  created_at: number;
  updated_at: number;
}

export interface EmailTemplateVariable {
  key: string;
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
  filters?: TaxonomyEntry[];
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
  filters?: TaxonomyEntry[];
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
  | WorkflowSwitchNode
  | WorkflowTransformNode
  | WorkflowLoopNode;

export interface WorkflowTriggerNode {
  type: "trigger";
  event?: string;
  delay_ms?: number;
  schema?: Block[];
}

export interface WorkflowHttpNode {
  type: "http";
  method: WorkflowHttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout_ms?: number;
  integration_id?: string;
  integration_provider_id?: string;
  delay_ms?: number;
  retries?: number;
  retry_delay_ms?: number;
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
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface NodeResult {
  output: any;
  route: string;
  started_at: number;
  completed_at: number;
  duration_ms: number;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  store_id: string;
  status: ExecutionStatus;
  input: Record<string, any>;
  results: Record<string, NodeResult>;
  error?: string;
  scheduled_at: number;
  started_at: number;
  completed_at?: number;
  created_at: number;
  updated_at: number;
}

export type ContactListType =
  | { type: "standard" }
  | { type: "confirmation"; confirm_template_id?: string | null }
  | {
      type: "paid";
      prices: SubscriptionPrice[];
      payment_integration_id?: string | null;
    };

export interface ContactSessionToken {
  id: string;
  token: string;
  created_at: number;
}

export interface ContactVerificationCode {
  code: string;
  created_at: number;
  used: boolean;
  store_id?: string | null;
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
  | "unknown"
  | "subscribed"
  | "unsubscribed"
  | "bounced"
  | "blocked";

export interface Contact {
  id: string;
  store_id: string;
  email: string | null;
  verified: boolean;
  status: ContactStatus;
  channels: ContactChannel[];
  promo_usage: PromoUsage[];
  lists: ContactListMembership[];
  taxonomies: TaxonomyEntry[];
  auth_tokens: ContactSessionToken[];
  verification_codes: ContactVerificationCode[];
  created_at: number;
  updated_at: number;
}

export interface ContactListAccessResponse {
  has_access: boolean;
  membership?: ContactListMembership | null;
}

export interface ContactListSubscribeResponse {
  checkout_url?: string | null;
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
  plan_id: string;
  pending_plan_id: string | null;
  payment: ContactListMembershipPayment;
  start_date: number;
  end_date: number;
  token: string;
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
  | "new"
  | "reviewing"
  | "contacted"
  | "won"
  | "lost"
  | "dismissed";

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
        integration_id: string;
        provider_id: SocialProviderId;
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
        integration_id: string;
        provider_id: SocialProviderId;
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
        integration_id: string;
        provider_id: SocialProviderId;
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
  provider: MailboxProvider;
  status: MailboxStatus;
  daily_limit: number;
  sent_today: number;
  last_sent_at?: number | null;
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
  total_contacts: number;
  draft_messages: number;
  generated_messages: number;
  template_messages: number;
  failed_messages: number;
}

export interface OutreachPersonalizationState {
  status: OutreachPersonalizationStatus;
  step_position?: number | null;
  contact_ids: string[];
  overwrite: boolean;
  instructions?: string | null;
  error?: string | null;
  counters: OutreachPersonalizationCounters;
  started_at?: number | null;
  completed_at?: number | null;
}

export interface Campaign {
  id: string;
  store_id: string;
  key: string;
  name: string;
  mailbox_ids: string[];
  status: CampaignStatus;
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

export type CampaignEnrollmentDraft = CampaignMessage;

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
  | "draft"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type LeadEmailClassification =
  | "official_domain"
  | "role_official"
  | "personal_official"
  | "free_mail"
  | "unusable"
  | "unknown";

export type LeadValidationCheckStatus =
  | "passed"
  | "warning"
  | "failed"
  | "unknown";

export type CampaignRoute =
  | "email_only"
  | "email_manual_followup"
  | "manual_only"
  | "needs_review";

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
  started_at?: number | null;
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
  | "system"
  | "user"
  | "assistant"
  | "action"
  | "tool";

export interface LeadResearchMessage {
  id: string;
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
      data: { amount: number; currency: string };
    }
  | { action: "order_payment_failed"; data: { reason?: string } }
  | {
      action: "order_refunded";
      data: { amount: number; currency: string; reason?: string };
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
  | { action: "store_deleted" }
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
  | "returned";

export interface OrderShipping {
  carrier: string;
  service: string;
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  status: ShippingStatus;
}

export interface ShipmentLine {
  order_item_id: string;
  fulfillment_order_line_id?: string | null;
  quantity: number;
}

export interface Shipment {
  id: string;
  fulfillment_order_id?: string | null;
  location_id: string;
  lines: ShipmentLine[];
  carrier?: string | null;
  service?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  status: ShippingStatus;
  created_at: number;
  updated_at: number;
}

export interface ShippingRate {
  id: string;
  provider: string;
  carrier: string;
  service: string;
  display_name: string;
  amount: number;
  currency: string;
  estimated_days?: number | null;
}

export type ShippingAddress = Address;

export interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  distance_unit: "in" | "cm";
  mass_unit: "oz" | "lb" | "g" | "kg";
}

export interface PurchaseLabelResult {
  tracking_number: string;
  tracking_url?: string | null;
  label_url: string;
  carrier: string;
  service: string;
}

export interface ShipResult {
  shipment_id: string;
  tracking_number: string;
  tracking_url?: string | null;
  label_url: string;
}

export interface CustomsItem {
  description: string;
  quantity: number;
  net_weight: string;
  mass_unit: string;
  value_amount: string;
  value_currency: string;
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
