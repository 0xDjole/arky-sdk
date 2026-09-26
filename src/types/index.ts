import type { Payment } from "./payment";
import type { MonriComponentsAction } from "./monriCheckout";
export type { MonriComponentsAction, MonriBuyerDetails } from "./monriCheckout";
export type { ShippingLabelRequestResolution } from "./shippingLabel";
export type * from "./fulfillmentUnitSelection";
import type { SellerProfile } from "./orderContract";
import type { StoreTaxPolicy, StoreInvoicePolicy } from "./storeCommerce";
export type * from "./storeCommerce";
import type { StripeConnectionOperation } from "./stripeConnection";
export type { StripeConnectionOperation, StripeConnectionEffectStatus } from "./stripeConnection";
import type { AppliedPriceSnapshot, DisplayTextSnapshot, StorefrontPrice } from "./commerce";
import type { OrderBookingSnapshot, OrderDigitalSnapshot, OrderProductSnapshot } from "./orderSnapshot";
import type { AcceptedProductMoneyRun, LineMoneySnapshot, ProductMoneyTotals } from "./orderMoney";
export type * from "./orderSnapshot";
export type * from "./orderMoney";
export type * from "./orderLineItem";
import type { AcceptedFormSubmission, OrderAccess, OrderLineItemOrigin, OrderProductLocationAllocation } from "./orderLineItem";
export type { Price, PriceScope } from "./price";
export type { Zone, ZoneMatch, ZoneStatus, ZoneEditableStatus } from "./zone";
export type { ShippingMethod, ShippingRate } from "./shipping";
export type { StorefrontPrice } from "./commerce";
export type { AppliedPriceSnapshot, AppliedPriceSource, DisplayTextSnapshot, OrderSubscriptionPlanItem } from "./commerce";
export type { CompanySnapshot, PurchaseCustomerSnapshot, PurchaseOrigin, PurchaseQuoteContext, SalesChannelSnapshot } from "./commerce";
export type { SubscriptionAcceptedTerms, SubscriptionPlanSnapshot, SubscriptionPlanEntitlementSnapshot, SubscriptionPlanEntitlementSnapshotType, SubscriptionProductSnapshot, SubscriptionDigitalSnapshot, SubscriptionDeliveryTerms, SubscriptionPurchaseOccurrence, OrderSubscriptionTerms, OrderAccessRevocation } from "./commerce";
export type { BillingPeriod } from "./commerce";
export type { MonriCaptureProof, PaymentCaptureEvidence, CaptureFinancialEffect, PaymentCaptureStatus, OrderPaymentCapture, RecordedCollection, RecordCashOnDeliveryCollectionParams, RecordManualCollectionParams, CreateManualPaymentParams } from "./paymentCapture";
export type { CommerceProviderObservation, Payment, PaymentStatus, PaymentAmounts, PaymentProviderBinding, PaymentCheckoutExpiration, PaymentReconciliation, StripeInvoicePaymentObject, MonriAuthorizationVoid, MonriVoidStatus, MonriVoidResult } from "./payment";
import type { EpochMilliseconds } from "./time";
export type { Order, OrderSource, OrderSourceFilter, OrderRentalUseItem, OrderStatus, OrderLineItem, OrderCompanyContext, OrderFinancialSummary, OrderFinancialConcern, GetOrderFinancialSummaryParams } from "./order";
export type {
  MarketSnapshot,
  PurchaseOriginSnapshot,
  CompanyLocationSnapshot,
  SellerProfile,
  SellerTaxRegistration,
  SellerSnapshot,
  InvoiceIssueTrigger,
  OrderInvoicePolicy,
  RenewalRecovery,
  RenewalRecoveryStatus,
  ReconciliationState,
  CollectionPolicySnapshot,
  PromotionRedemption,
  CheckoutPaymentAuthorization,
  PaymentTermsSnapshot,
  PaymentTermsType,
  OrderDeliveryGroup,
  AcceptedDeliveryPricing,
  AcceptedDeliveryPricingSource,
  AcceptedDeliveryCalculation,
  AcceptedCarrierQuoteLeg,
} from "./orderContract";
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

export interface Money {
  amount: number;
  currency: Currency;
}

export type TaxMode = "exclusive" | "inclusive";

export interface OrderPromotionSnapshot {
  promotion_id: string | null;
  promotion_key: string;
  promotion_code_id: string | null;
  code: string | null;
  effect_ids: string[];
  policy_digest: string;
  algorithm_version: number;
}

export type PaymentDisputeResponse =
  | { type: "due_at"; due_at: EpochMilliseconds }
  | { type: "response_not_allowed" };

export type PaymentDisputeStatus =
  | { type: "warning_needs_response"; response: PaymentDisputeResponse }
  | { type: "needs_response"; response: PaymentDisputeResponse }
  | { type: "warning_under_review" }
  | { type: "warning_closed" }
  | { type: "under_review" }
  | { type: "won" }
  | { type: "lost" }
  | { type: "prevented" };

export type StripeDisputeStatus =
  | "warning_needs_response"
  | "warning_under_review"
  | "warning_closed"
  | "needs_response"
  | "under_review"
  | "won"
  | "lost"
  | "prevented";

export type PaymentDisputeProvider = {
  type: "stripe";
  dispute_id: string;
  charge_id: string;
};

export interface PaymentDispute {
  id: string;
  store_id: string;
  order_payment_id: string;
  order_payment_capture_id: string | null;
  livemode: boolean;
  financial_effects: DisputeFinancialEffect[];
  money: Money;
  status: PaymentDisputeStatus;
  reason: string;
  provider: PaymentDisputeProvider;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface DisputeFinancialEffect {
  type: "principal_withdrawn" | "principal_reinstated" | "fee";
  effect_id: string;
  money: Money;
  observed_at: EpochMilliseconds;
}

import type { AccountActor } from "./accountActor";
export type { AccountActor, AccountActorSnapshot, AccountCredentialType } from "./accountActor";
export type { Refund, RefundProvider, MonriRefundResult, RefundAllocation, RefundApplication, RefundRequester, SystemRefundReason, RefundReason, RefundRequestReason, RefundStatus } from "./refund";
export type { CustomerMoneyEvidence, RefundFinancialEffect, RefundAllocationBalance, RefundMoneySummary, RecordedRefundMoney, LocalRefundMovement, RecordRefundMoneyParams, CancelLocalRefundParams } from "./refund";

export interface OrderMoney {
  currency: Currency;
  subtotal: number;
  delivery: number;
  discount: number;
  tax_total: number;
  duty_total: number;
  total: number;
  promotions: OrderPromotionSnapshot[];
}

export type * from "./quote";
export type { CheckoutQuote, CheckoutQuoteSources } from "./checkout";

/** Shared postal-address value used across Store and commerce resources. */
export interface PostalAddress {
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

/** Commerce compatibility name for the shared postal-address value. */
export type Address = PostalAddress;

export interface TimeRange {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
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
  shipping_profile_id: string | null;
  price: StorefrontPrice | null;
  quantity: number;
  form_submission_id?: string | null;
  added_at: EpochMilliseconds;
  max_stock?: number;
}

export type { Cart, CreatedCart, CartStatus, CartLineItem, CartCompanyContext, CartProductItem, CartBookingItem, CartDigitalItem, CartSubscriptionPlanItem } from "./cart";
export type { QuotedDeliveryGroup, QuotedShippingOffer, QuotedDeliveryPricing, ShippingDeliveryEstimate } from "./quote";

export type SocialConnectionType =
  | "facebook_page"
  | "instagram_business"
  | "youtube_channel"
  | "tiktok_account"
  | "x_account";

export interface SocialDestination {
  provider_id: string;
  name: string;
  handle?: string | null;
  avatar_url?: string | null;
}

export type SocialCredentialRefreshStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; started_at: EpochMilliseconds; deadline_at: EpochMilliseconds }
  | { type: "succeeded"; completed_at: EpochMilliseconds }
  | { type: "rejected"; error: string; rejected_at: EpochMilliseconds }
  | { type: "failed"; error: string; failed_at: EpochMilliseconds }
  | { type: "unknown"; error: string; detected_at: EpochMilliseconds };

export interface SocialCredentialRefresh {
  credential_generation: number;
  status: SocialCredentialRefreshStatus;
}

export interface SocialCredential {
  expires_at?: EpochMilliseconds | null;
  scopes: string[];
  has_refresh_token: boolean;
}

export type SocialConnectionStatus =
  | {
      type: "connected";
      credential: SocialCredential;
      refresh: SocialCredentialRefresh;
    }
  | {
      type: "disconnected";
      disconnected_at: EpochMilliseconds;
      last_refresh: SocialCredentialRefresh;
    };

export interface SocialConnection {
  id: string;
  store_id: string;
  type: SocialConnectionType;
  destination: SocialDestination;
  status: SocialConnectionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface SocialConnectResult {
  authorization_url: string;
}

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

export type SocialPostContent =
  | FacebookPageContent
  | InstagramBusinessContent
  | YoutubeChannelContent
  | TiktokAccountContent
  | XAccountContent;

export interface ValidationError {
  field: string;
  error: string;
}

export type SocialPublishRequest =
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

export type SocialPublishEvidence =
  | { type: "x_media_uploaded"; provider_media_id: string }
  | {
      type: "x_post_published";
      provider_post_id: string;
      provider_post_url?: string | null;
    }
  | { type: "facebook_photo_created"; provider_photo_id: string }
  | {
      type: "facebook_post_published";
      provider_post_id: string;
      provider_post_url?: string | null;
    }
  | { type: "instagram_media_container_created"; container_id: string }
  | { type: "instagram_carousel_container_created"; container_id: string }
  | {
      type: "instagram_container_published";
      provider_post_id: string;
      provider_post_url?: string | null;
    }
  | {
      type: "youtube_upload_initialized";
      has_upload_session: boolean;
      total_bytes: number;
    }
  | {
      type: "youtube_video_uploaded";
      provider_post_id: string;
      provider_post_url?: string | null;
    }
  | {
      type: "tiktok_upload_initialized";
      publish_id: string;
      has_upload_session: boolean;
      total_bytes: number;
    }
  | {
      type: "tiktok_video_uploaded";
      provider_post_id: string;
      provider_post_url?: string | null;
    };

export type SocialPublishOperationStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; started_at: EpochMilliseconds; deadline_at: EpochMilliseconds }
  | { type: "succeeded"; evidence: SocialPublishEvidence; completed_at: EpochMilliseconds }
  | { type: "failed"; error: string; failed_at: EpochMilliseconds }
  | { type: "rejected"; error: string; rejected_at: EpochMilliseconds }
  | { type: "unknown"; error: string; detected_at: EpochMilliseconds };

export interface SocialPublishOperation {
  id: string;
  request: SocialPublishRequest;
  status: SocialPublishOperationStatus;
}

export interface SocialPublishProgress {
  completed: SocialPublishOperation[];
  current: SocialPublishOperation;
}

export type SocialPostStatus =
  | { type: "scheduled"; progress: SocialPublishProgress }
  | { type: "publishing"; progress: SocialPublishProgress }
  | {
      type: "published";
      progress: SocialPublishProgress;
      published_at: EpochMilliseconds;
    }
  | {
      type: "failed";
      progress: SocialPublishProgress;
      error: string;
      failed_at: EpochMilliseconds;
    }
  | {
      type: "rejected";
      progress: SocialPublishProgress;
      error: string;
      rejected_at: EpochMilliseconds;
    }
  | {
      type: "unknown";
      progress: SocialPublishProgress;
      error: string;
      detected_at: EpochMilliseconds;
    }
  | {
      type: "cancelled";
      progress: SocialPublishProgress;
      cancelled_at: EpochMilliseconds;
    };

export interface SocialPost {
  id: string;
  store_id: string;
  social_connection_id: string;
  content: SocialPostContent;
  publish_at: EpochMilliseconds;
  status: SocialPostStatus;
  comment_sync: SocialCommentSyncStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SocialCommentSyncStatus =
  | { type: "idle" }
  | {
      type: "processing";
      claim_id: string;
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
    }
  | { type: "succeeded"; claim_id: string; completed_at: EpochMilliseconds }
  | { type: "failed"; claim_id: string; error: string; failed_at: EpochMilliseconds }
  | { type: "unknown"; claim_id: string; error: string; detected_at: EpochMilliseconds };

export type SocialIncomingCommentRelation =
  { type: "root" } | { type: "reply"; parent_message_id: string };

export type SocialCommentAuthor =
  | {
      type: "identified";
      provider_author_id: string;
      name?: string | null;
      handle?: string | null;
      avatar_url?: string | null;
    }
  | {
      type: "named";
      name: string;
      handle?: string | null;
      avatar_url?: string | null;
    }
  | { type: "handled"; handle: string; avatar_url?: string | null }
  | { type: "unavailable" };

export type SocialOutgoingCommentStatus =
  | { type: "queued"; requested_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds }
  | { type: "sending"; started_at: EpochMilliseconds; deadline_at: EpochMilliseconds }
  | { type: "sent"; provider_comment_id: string; sent_at: EpochMilliseconds }
  | { type: "failed"; error: string; failed_at: EpochMilliseconds }
  | { type: "rejected"; error: string; rejected_at: EpochMilliseconds }
  | { type: "unknown"; error: string; detected_at: EpochMilliseconds };

export type SocialCommentDirection =
  | {
      type: "incoming";
      relation: SocialIncomingCommentRelation;
      provider_comment_id: string;
      author: SocialCommentAuthor;
      provider_created_at: EpochMilliseconds;
      observed_at: EpochMilliseconds;
    }
  | {
      type: "outgoing_reply";
      parent_message_id: string;
      account_session_id: string;
      status: SocialOutgoingCommentStatus;
    };

export type SocialMessageType = {
  type: "comment";
  post_id: string;
  text: string;
  direction: SocialCommentDirection;
};

export interface SocialMessage {
  id: string;
  store_id: string;
  type: SocialMessageType;
  root_message_id: string;
  depth: number;
  reply_count: number | null;
  replied: boolean | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SocialMessageSyncType =
  | { type: "top_level"; cursor?: string | null; limit: number }
  | {
      type: "thread";
      parent_message_id: string;
      cursor?: string | null;
      limit: number;
    };

export interface SocialMessageSync {
  type: SocialMessageSyncType;
}

export type SocialMessageSyncResult =
  | {
      type: "applied";
      inserted: number;
      reconciled: number;
      next_cursor?: string | null;
    }
  | { type: "deferred"; retry_after_at: EpochMilliseconds };

export type BuildHookStatus = { type: "active" } | { type: "disabled" };

export interface BuildHook {
  id: string;
  store_id: string;
  url: string;
  headers: Record<string, string>;
  status: BuildHookStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StripePlatformDebitConsent {
  accepted_by: AccountActor;
  accepted_at: EpochMilliseconds;
  terms_version: number;
  revoked_at: EpochMilliseconds | null;
}

export type PaymentProviderStatus = { type: "active" } | { type: "disabled" } | { type: "deleting" };

export type StripeProviderConnection =
  | { type: "unconnected" }
  | {
      type: "connected";
      connected_account_id: string;
      account_setup_submitted: boolean;
      payments_enabled: boolean;
      payouts_enabled: boolean;
      state_observed_at: EpochMilliseconds;
      platform_debit_consent: StripePlatformDebitConsent | null;
    };

export type PaymentProviderConfiguration =
  | { type: "cash_on_delivery" }
  | { type: "manual" }
  | {
      type: "stripe";
      connection: StripeProviderConnection;
    }
  | { type: "monri"; environment: MonriEnvironment };

export type MonriEnvironment = "test" | "live";

export type PaymentProviderConfigurationType =
  PaymentProviderConfiguration["type"];

export interface PaymentProvider {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  status: PaymentProviderStatus;
  configuration: PaymentProviderConfiguration;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PaymentProviderConnectResponse {
  provider: PaymentProvider;
  onboarding_url: string | null;
  operation: StripeConnectionOperation;
}

export interface StoreLocationStatus {
  type: "active" | "archived" | "deleting";
}

export interface StoreLocation {
  id: string;
  store_id: string;
  key: string;
  address: PostalAddress;
  timezone: string;
  is_pickup_location: boolean;
  blocks: Block[];
  status: StoreLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ProductInventory {
  id: string;
  store_id: string;
  product_id: string;
  variant_id: string;
  store_location_id: string;
  on_hand: number;
  reserved: number;
  updated_at: EpochMilliseconds;
}

export interface InventoryRequirement {
  inventory_item_id: string;
  quantity: number;
}

export type BackorderPolicy = { type: "disallow" } | { type: "allow" };

export type ProductFulfillment =
  | { type: "none" }
  | {
      type: "physical";
      shipping_profile_id: string;
      inventory_requirements: InventoryRequirement[];
      backorder: BackorderPolicy;
    };

export type ProductVariantEditableStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "archived" };
export type ProductVariantStatus =
  ProductVariantEditableStatus | { type: "deleting" };

export interface ProductVariant {
  id: string;
  store_id: string;
  product_id: string;
  sku: string | null;
  attributes: Block[];
  reference_labels: Record<string, Record<string, string>>;
  fulfillment: ProductFulfillment;
  tax_category_id: string | null;
  status: ProductVariantStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface Product {
  id: string;
  store_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  classifications: ClassificationEntry[];
  status: ProductStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GalleryItem {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

export type OrderItemStatus =
  | { type: "pending"; expires_at: EpochMilliseconds | null }
  | { type: "confirmed" }
  | { type: "cancelled"; reason: OrderCancellationReason };

/** Operational appointment status, separate from its accepted Order line. */
export type OrderBookingStatus =
  | { type: "pending"; expires_at: EpochMilliseconds }
  | { type: "confirmed" }
  | { type: "completed" }
  | { type: "no_show" }
  | { type: "cancelled"; reason: OrderCancellationReason };

export interface BookingReminderScheduleItem {
  offset_minutes: number;
  due_at: EpochMilliseconds;
  emitted_at: EpochMilliseconds | null;
}

export interface OrderProductItem {
  id: string;
  origin: OrderLineItemOrigin;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  cancelled_quantity: number;
  backordered_quantity: number;
  location_allocations: OrderProductLocationAllocation[];
  form_submission_id: string | null;
  form_submission: AcceptedFormSubmission | null;
  snapshot: OrderProductSnapshot;
  status: OrderItemStatus;
  money: ProductMoneyTotals;
  money_runs: AcceptedProductMoneyRun[];
  cancelled_units: import("./orderContract").UnitSpan[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderBookingItem {
  id: string;
  booking_offering_id: string | null;
  booking_service_id: string | null;
  booking_resource_id: string | null;
  interval: TimeRange;
  capacity_intervals: TimeRange[];
  capacity_units: number;
  form_submission_id: string | null;
  form_submission: AcceptedFormSubmission | null;
  snapshot: OrderBookingSnapshot;
  status: OrderItemStatus;
  money: LineMoneySnapshot;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderDigitalItem {
  id: string;
  origin: OrderLineItemOrigin;
  digital_product_id: string | null;
  access: OrderAccess;
  form_submission_id: string | null;
  form_submission: AcceptedFormSubmission | null;
  snapshot: OrderDigitalSnapshot;
  status: OrderItemStatus;
  money: LineMoneySnapshot;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type FulfillmentOrderStatus =
  { type: "open" | "in_progress" | "completed" | "cancelled" };

export interface FulfillmentUnitSpan {
  first_unit: number;
  quantity: number;
}

export interface RentalIssueReplacement {
  predecessor_inventory_unit_id: string;
  predecessor_fulfillment_order_line_id: string;
  predecessor_fulfillment_unit_index: number;
  overlap_authorized: boolean;
}

export type FulfillmentOrderLineSource = {
  type: "order_product";
  order_id: string;
  order_delivery_group_id: string;
  order_product_line_item_id: string;
  order_unit_spans: import("./orderContract").UnitSpan[];
} | {
  type: "rental_issue";
  rental_id: string;
  terms_revision_id: string;
  replacement: RentalIssueReplacement | null;
};

export interface FulfillmentOrderLine {
  id: string;
  source: FulfillmentOrderLineSource;
  quantity: number;
  allocated_quantity: number;
  fulfilled_quantity: number;
  released_units: FulfillmentUnitSpan[];
  cancelled_units: FulfillmentUnitSpan[];
}

export interface FulfillmentCompanyRecipient {
  source_company_id: string;
  company_name: string;
  source_company_location_id: string;
  company_location_name: string;
}

export interface FulfillmentRecipient {
  source_customer_id: string;
  email: string | null;
  company: FulfillmentCompanyRecipient | null;
}

export interface FulfillmentWindow {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export type FulfillmentOrderMethod =
  | { type: "pickup" }
  | { type: "delivery"; destination: PostalAddress };

export interface FulfillmentOrder {
  id: string;
  store_id: string;
  work_key: string;
  store_location_id: string;
  status: FulfillmentOrderStatus;
  method: FulfillmentOrderMethod;
  recipient: FulfillmentRecipient;
  scheduled_window: FulfillmentWindow | null;
  lines: FulfillmentOrderLine[];
  executor: FulfillmentExecutor;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type FulfillmentExternalStatus =
  | { type: "assigned" }
  | { type: "requested"; webhook_delivery_id: string; requested_at: EpochMilliseconds }
  | {
      type: "acknowledged";
      webhook_delivery_id: string;
      requested_at: EpochMilliseconds;
      acknowledged_at: EpochMilliseconds;
      actor: import("./accountActor").AccountActor;
    }
  | {
      type: "rejected";
      webhook_delivery_id: string | null;
      reason: string;
      rejected_at: EpochMilliseconds;
      actor: import("./accountActor").AccountActor;
    };

export type FulfillmentExecutor =
  | { type: "internal" }
  | {
      type: "external";
      webhook_endpoint_id: string;
      request_id: string;
      assigned_by: import("./accountActor").AccountActor;
      assigned_at: EpochMilliseconds;
      status: FulfillmentExternalStatus;
    };

export type FulfillmentExecutorCommand =
  | { type: "assign_external"; webhook_endpoint_id: string }
  | { type: "assign_internal" }
  | { type: "request_external" }
  | { type: "record_acknowledged" }
  | { type: "record_rejected"; reason: string };

export interface ControlFulfillmentExecutorParams {
  store_id?: string;
  fulfillment_order_id: string;
  expected_updated_at: EpochMilliseconds;
  command: FulfillmentExecutorCommand;
}

export type DigitalProductStatus = { type: "draft" } | { type: "active" } | { type: "archived" };
export type DigitalAssetStatus = { type: "active" } | { type: "archived" };

export interface DigitalProduct {
  id: string;
  store_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  classifications: ClassificationEntry[];
  asset_ids: string[];
  tax_category_id: string | null;
  status: DigitalProductStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontDigitalProduct {
  id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  classifications: ClassificationEntry[];
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
}

export interface DigitalAsset {
  id: string;
  store_id: string;
  file_name: string;
  mime_type: string;
  status: DigitalAssetStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface DigitalLibraryAsset {
  id: string;
  file_name: string;
  mime_type: string;
  download_reference: string;
}

export interface DigitalLibraryItem {
  digital_product_id: string;
  product_key: string;
}

export interface DigitalLibraryProduct {
  digital_product_id: string;
  presentation: DigitalLibraryItem | null;
  assets: PaginatedResponse<DigitalLibraryAsset>;
}

export interface DigitalDownload {
  url: string;
  expires_at: EpochMilliseconds;
  file_name: string;
  mime_type: string;
}

export type CheckoutPaymentAction =
  | { type: "none" }
  | MonriComponentsAction
  | {
      type: "stripe_embedded_checkout";
      publishable_key: string;
      client_secret: string;
      connected_account_id: string;
      expires_at: EpochMilliseconds;
    };

export type StoreSubscriptionCheckoutAction =
  | { type: "none" }
  | {
      type: "stripe_embedded_checkout";
      publishable_key: string;
      client_secret: string;
      stripe_account_id: string | null;
      expires_at: EpochMilliseconds;
    };

export interface OrderCheckoutResult {
  order_id: string;
  number: string;
  payment_action: CheckoutPaymentAction;
  payment: Payment | null;
}

export type MarketStatus = { type: "active" } | { type: "deleting" };

export interface MarketUsage {
  market_payment_provider_ids: string[];
  more_market_payment_providers: boolean;
  market_sales_channel_ids: string[];
  more_market_sales_channels: boolean;
  fulfillment_routing_policy_ids: string[];
  more_fulfillment_routing_policies: boolean;
  market_zone_ids: string[];
  more_market_zones: boolean;
  catalog_entitlement_ids: string[];
  more_catalog_entitlements: boolean;
  cart_ids: string[];
  more_carts: boolean;
  is_default: boolean;
}

export interface Market {
  id: string;
  store_id: string;
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
  status: MarketStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type WebhookEventSubscription =
  | { type: "collection.created"; key?: string | null }
  | { type: "collection.updated"; key?: string | null }
  | { type: "collection.deleted"; key?: string | null }
  | { type: "entry.created"; collection_id?: string | null; key?: string | null }
  | { type: "entry.updated"; collection_id?: string | null; key?: string | null }
  | { type: "entry.deleted"; collection_id?: string | null; key?: string | null }
  | { type: "form_submission.created"; form_id?: string | null }
  | { type: "order.created" }
  | { type: "order.updated" }
  | { type: "order.confirmed" }
  | { type: "order.payment_received" }
  | { type: "order.payment_failed" }
  | { type: "order.refunded" }
  | { type: "refund.succeeded" }
  | { type: "order.cancelled" }
  | { type: "order_product_item.created" }
  | { type: "order_product_item.updated" }
  | { type: "order_product_item.confirmed" }
  | { type: "order_product_item.cancelled" }
  | { type: "order_booking_item.created" }
  | { type: "order_booking_item.updated" }
  | { type: "order_booking_item.confirmed" }
  | { type: "order_booking_item.completed" }
  | { type: "order_booking_item.no_show" }
  | { type: "order_booking_item.cancelled" }
  | { type: "order_booking_item.reminder" }
  | { type: "order_digital_item.created" }
  | { type: "order_digital_item.updated" }
  | { type: "order_digital_item.confirmed" }
  | { type: "order_digital_item.cancelled" }
  | { type: "shipment.created" }
  | { type: "shipment.in_transit" }
  | { type: "shipment.out_for_delivery" }
  | { type: "shipment.delivered" }
  | { type: "shipment.failed" }
  | { type: "shipment.returned" }
  | { type: "shipment.status_changed" }
  | { type: "pickup.created" }
  | { type: "pickup.ready" }
  | { type: "pickup.collected" }
  | { type: "pickup.cancelled" }
  | { type: "cart.created" }
  | { type: "cart.updated" }
  | { type: "cart.abandoned" }
  | { type: "cart.converted" }
  | { type: "product.created" }
  | { type: "product.updated" }
  | { type: "product.deleted" }
  | { type: "booking_resource.created" }
  | { type: "booking_resource.updated" }
  | { type: "booking_resource.deleted" }
  | { type: "booking_service.created" }
  | { type: "booking_service.updated" }
  | { type: "booking_service.deleted" }
  | { type: "media.created" }
  | { type: "media.updated" }
  | { type: "media.deleted" }
  | { type: "store.created" }
  | { type: "store.updated" }
  | { type: "customer_group.created" }
  | { type: "customer_group.updated" }
  | { type: "customer_group.member_added" }
  | { type: "customer_group.member_removed" }
  | { type: "customer_group.member_pending" }
  | { type: "customer_group.member_confirmed" }
  | { type: "customer_group.member_access_cancelled" }
  | { type: "customer_group.member_email_unsubscribed" }
  | { type: "customer_group.member_email_resubscribed" }
  | { type: "customer.created" }
  | { type: "customer.updated" }
  | { type: "customer.archived" }
  | { type: "account.updated" };

export type WebhookStatus = { type: "active" } | { type: "disabled" };

export interface Webhook {
  id: string;
  store_id: string;
  url: string;
  events: WebhookEventSubscription[];
  headers: Record<string, string>;
  secret: string;
  status: WebhookStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreSubscriptionStatus =
  | { type: "pending" }
  | { type: "trialing" }
  | { type: "active" }
  | { type: "past_due" }
  | { type: "cancellation_scheduled" }
  | { type: "unpaid" }
  | { type: "cancelled" }
  | { type: "expired" };

export interface ProviderOperationClaim {
  id: string;
  started_at: EpochMilliseconds;
  deadline_at: EpochMilliseconds;
  fence: number;
}

export type ProviderEffectError =
  | {
      type: "provider_rejected";
      message: string;
      provider_code: string | null;
      provider_http_status: number | null;
      at: EpochMilliseconds;
    }
  | { type: "provider_call_not_started"; message: string; at: EpochMilliseconds }
  | {
      type: "unknown_outcome";
      message: string;
      provider_code: string | null;
      provider_http_status: number | null;
      at: EpochMilliseconds;
    };

export type StoreSubscriptionCheckoutStatus =
  | { type: "requested" }
  | {
      type: "processing";
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
      retry_error: ProviderEffectError | null;
    }
  | { type: "open"; stripe_checkout_session_id: string }
  | {
      type: "completed";
      stripe_checkout_session_id: string;
      stripe_subscription_id: string;
    }
  | { type: "expired"; stripe_checkout_session_id: string }
  | { type: "failed"; error: ProviderEffectError }
  | {
      type: "unknown";
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
      stripe_checkout_session_id: string | null;
      error: ProviderEffectError;
    };

export interface StoreSubscriptionCheckout {
  id: string;
  plan_id: string;
  stripe_price_id: string;
  stripe_customer_id: string | null;
  trial_end: EpochMilliseconds | null;
  expires_at: EpochMilliseconds;
  status: StoreSubscriptionCheckoutStatus;
  requested_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorePlanAccess {
  plan_id: string;
  started_at: EpochMilliseconds;
  /** Null means intentionally lifetime access. */
  access_until: EpochMilliseconds | null;
}

export type StoreSubscriptionOperationType =
  | "cancel_at_period_end"
  | "cancel_immediately"
  | "reactivate";

export type StoreSubscriptionOperationStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | {
      type: "processing";
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
      retry_error: ProviderEffectError | null;
    }
  | { type: "succeeded"; observed_at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError }
  | {
      type: "unknown";
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
      error: ProviderEffectError;
    };

export interface StoreSubscriptionOperation {
  id: string;
  type: StoreSubscriptionOperationType;
  status: StoreSubscriptionOperationStatus;
}

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan_access: StorePlanAccess | null;
  status: StoreSubscriptionStatus;
  checkout: StoreSubscriptionCheckout | null;
  operation: StoreSubscriptionOperation | null;
  payment_action: StoreSubscriptionCheckoutAction;
  trial_started_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreDeletionResult {
  success: true;
  store_id: string;
}

export type StoreCommerceState =
  | { type: "uninitialized" }
  | { type: "initializing"; operation_id: string }
  | {
      type: "ready";
      default_market_id: string;
      default_sales_channel_id: string;
      seller: SellerProfile;
      tax: StoreTaxPolicy;
      invoicing: StoreInvoicePolicy;
    };

export interface Store {
  id: string;
  name: string;
  billing_email: string;
  contact_email: string | null;
  branding: import("./storeBranding").StoreBranding;
  commerce: StoreCommerceState;
  timezone: string;
  default_language: string | null;
  supported_languages: string[];
}

export type { StoreBranding, StoreBrandingPresentation, UpdateStoreBrandingParams } from "./storeBranding";

export interface BlockBase {
  id: string;
  key: string;
}

export interface TextBlock extends BlockBase {
  type: "text";
  value: string | null;
}

export type LocalizedText = Record<string, string>;

export interface LocalizedTextBlock extends BlockBase {
  type: "localized_text";
  value: LocalizedText | null;
}

export interface MarkdownBlock extends BlockBase {
  type: "markdown";
  value: string | null;
}

export interface NumberBlock extends BlockBase {
  type: "number";
  value: number | null;
}

export interface BooleanBlock extends BlockBase {
  type: "boolean";
  value: boolean | null;
}

export interface DateBlock extends BlockBase {
  type: "date";
  value: EpochMilliseconds | null;
}

export interface MediaBlock extends BlockBase {
  type: "media";
  value: string | null;
}

export interface EntryBlock extends BlockBase {
  type: "entry";
  value: string | null;
}

export interface FormBlock extends BlockBase {
  type: "form";
  value: string | null;
}

export interface ProductBlock extends BlockBase {
  type: "product";
  value: string | null;
}

export interface DigitalProductBlock extends BlockBase {
  type: "digital_product";
  value: string | null;
}

export interface ArrayBlock extends BlockBase {
  type: "array";
  value: Block[];
}

export interface ObjectBlock extends BlockBase {
  type: "object";
  value: Record<string, Block>;
}

interface ClassificationSchemaBase {
  id: string;
  key: string;
}

export type ClassificationSchema =
  | (ClassificationSchemaBase & {
      type: "text";
      options: string[];
      min: number | null;
    })
  | (ClassificationSchemaBase & {
      type: "number";
      min: number | null;
      max: number | null;
    })
  | (ClassificationSchemaBase & { type: "boolean" })
  | (ClassificationSchemaBase & { type: "geo_location" });

export type ClassificationSchemaType = ClassificationSchema["type"];

export interface ClassificationCoordinates {
  lat: number;
  lon: number;
}

export interface ClassificationGeoLocation {
  coordinates: ClassificationCoordinates;
}

export type ClassificationNumberOperation =
  | "less_than"
  | "less_than_or_equal"
  | "equals"
  | "greater_than_or_equal"
  | "greater_than";

interface ClassificationFieldBase {
  id: string;
  key: string;
}

export type ClassificationField =
  | (ClassificationFieldBase & { type: "text"; value: string[] })
  | (ClassificationFieldBase & { type: "number"; value: number })
  | (ClassificationFieldBase & { type: "boolean"; value: boolean })
  | (ClassificationFieldBase & {
      type: "geo_location";
      value: ClassificationGeoLocation;
    });

export type ClassificationFieldQuery =
  | { type: "text"; key: string; value: string[] }
  | {
      type: "number";
      key: string;
      operation: ClassificationNumberOperation;
      value: number;
    }
  | { type: "boolean"; key: string; value: boolean }
  | {
      type: "geo_location";
      key: string;
      center: ClassificationCoordinates;
      radius_meters: number;
    };

export interface ClassificationEntry {
  classification_id: string;
  fields: ClassificationField[];
}

export interface ClassificationQuery {
  classification_id: string;
  query: ClassificationFieldQuery[];
}

export type FormSchemaType =
  "text" | "number" | "boolean" | "date" | "geo_location" | "select";

interface FormSchemaBase<Question> {
  id: string;
  key: string;
  required: boolean;
  question: Question | null;
}

type FormSchemaDefinition<Question> =
  | (FormSchemaBase<Question> & { type: "text" })
  | (FormSchemaBase<Question> & {
      type: "number";
      min?: number | null;
      max?: number | null;
    })
  | (FormSchemaBase<Question> & { type: "boolean" })
  | (FormSchemaBase<Question> & { type: "date" })
  | (FormSchemaBase<Question> & { type: "geo_location" })
  | (FormSchemaBase<Question> & { type: "select"; options: string[] });

export type FormSchema = FormSchemaDefinition<LocalizedText>;
export type FormPresentedSchema = FormSchemaDefinition<DisplayTextSnapshot>;

export interface FormPresentation {
  id: string;
  store_id: string;
  key: string;
  locale: string;
  presentation_digest: string;
  schema: FormPresentedSchema[];
}

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
  | (FormFieldBase & { type: "date"; value: EpochMilliseconds })
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
  | "form"
  | "product"
  | "digital_product"
  | "markdown"
  | "geo_location";

export interface GeoLocationBlock extends BlockBase {
  type: "geo_location";
  value: GeoLocation | null;
}

export type Block =
  | TextBlock
  | LocalizedTextBlock
  | MarkdownBlock
  | NumberBlock
  | BooleanBlock
  | DateBlock
  | MediaBlock
  | EntryBlock
  | FormBlock
  | ProductBlock
  | DigitalProductBlock
  | ArrayBlock
  | ObjectBlock
  | GeoLocationBlock;

export type Access = "public" | "private";

export type MediaRenditionType = "thumbnail" | "small" | "medium" | "large";

export interface MediaFile {
  url: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width_px: number | null;
  height_px: number | null;
}

export interface MediaRendition {
  type: MediaRenditionType;
  file: MediaFile;
}

export interface Media {
  id: string;
  store_id: string;
  original: MediaFile;
  renditions: MediaRendition[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorePlanFeatureType =
  | "collections"
  | "entries"
  | "booking_services"
  | "products"
  | "booking_resources"
  | "workflows"
  | "customer_groups"
  | "customers"
  | "media"
  | "members"
  | "classifications"
  | "email_templates"
  | "forms"
  | "mailboxes"
  | "social_connections"
  | "webhooks"
  | "support_agents"
  | "lead_research_operations"
  | "campaigns";

/** A Store's current total or one UTC calendar month's consumption. */
export type UsagePeriod =
  { type: "total" } | { type: "monthly"; year: number; month: number };

export interface StoreUsage {
  id: string;
  store_id: string;
  feature: StorePlanFeatureType;
  period: UsagePeriod;
  count: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorePlanFeature {
  limit: number | null;
  reset: "never" | "monthly";
}

export interface StorePlan {
  id: string;
  provider_price_id: string | null;
  name: string;
  tier: number;
  amount: number;
  currency: Currency;
  interval: "lifetime" | "month" | "year";
  interval_count: number;
  trial_days: number | null;
  features: Record<StorePlanFeatureType, StorePlanFeature>;
}

export type AccountApiTokenStatus = { type: "active" | "revoked" };

export type AccountVerificationEmailStatus =
  { type: "requested" | "processing" | "sent" | "rejected" | "failed" | "unknown" | "cancelled" };

export interface AccountApiToken {
  id: string;
  token_hint: string;
  name: string;
  status: AccountApiTokenStatus;
  expires_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  revoked_at: EpochMilliseconds | null;
}

export interface StoreMembership {
  /** Opaque UUID-v4 generated by the Server. */
  id: string;
  store_id: string;
  account_id: string;
  role: import("./api").StoreRole;
  status: { type: "invited" | "active" };
  invited_by_account_id: string | null;
  invited_at: EpochMilliseconds | null;
  invitation_email_status: AccountVerificationEmailStatus | null;
  joined_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreMember {
  account: Account;
  membership: StoreMembership;
}

export interface Account {
  id: string;
  email: string;
  platform_role: import("./api").PlatformRole;
  status: { type: "active" | "deleting" };
  last_login_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface AccountApiTokenCreated {
  token: AccountApiToken;
  value: string;
}

export type AccountSessionScope =
  | { type: "account" }
  | { type: "store"; store_id: string };

interface AccountSessionBase {
  id: string;
  scope: AccountSessionScope;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type AccountSession = AccountSessionBase &
  (
    | {
        status: { type: "pending_verification" };
        verification_expires_at: EpochMilliseconds;
        access_expires_at: null;
        refresh_expires_at: null;
        authenticated_at: null;
        revoked_at: null;
      }
    | {
        status: { type: "active" };
        verification_expires_at: null;
        access_expires_at: EpochMilliseconds;
        refresh_expires_at: EpochMilliseconds;
        authenticated_at: EpochMilliseconds;
        revoked_at: null;
      }
    | {
        status: { type: "locked" | "superseded" };
        verification_expires_at: null;
        access_expires_at: null;
        refresh_expires_at: null;
        authenticated_at: null;
        revoked_at: null;
      }
    | {
        status: { type: "revoked" };
        verification_expires_at: null;
        access_expires_at: null;
        refresh_expires_at: null;
        authenticated_at: null;
        revoked_at: EpochMilliseconds;
      }
  );

export type AccountSessionStatus = AccountSession["status"];

export interface PaginatedResponse<T> {
  items: T[];
  cursor: string | null;
}

export type BookingServiceStatus = { type: "active" } | { type: "draft" } | { type: "archived" };
export type BookingResourceStatus = { type: "active" } | { type: "draft" } | { type: "archived" };
export type BookingOfferingStatus = { type: "active" } | { type: "draft" } | { type: "archived" };

export type ProductEditableStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" };
export type ProductStatus = ProductEditableStatus | { type: "deleting" };
export type CustomerStatus = { type: "active" } | { type: "archived" };

export type MailboxStatus = { type: "active" } | { type: "draft" } | { type: "archived" };
export type MailboxPreset = "gmail" | "zoho" | "microsoft" | "custom";
export type MailboxConnectionSecurity = "tls" | "start_tls";
export type MailboxSyncFailureKind = "authentication" | "connection" | "recovery";
export interface MailboxSyncRecoveryWarning {
  message: string;
  observed_at: EpochMilliseconds;
}
export interface MailboxSyncFailure {
  kind: MailboxSyncFailureKind;
  message: string;
  observed_at: EpochMilliseconds;
}
export type MailboxSyncStatus =
  | { type: "not_ready" }
  | {
      type: "ready";
      ready_at: EpochMilliseconds;
      recovery_warning: MailboxSyncRecoveryWarning | null;
    }
  | { type: "failed"; failure: MailboxSyncFailure };
export interface ImapCursor {
  mailbox: "INBOX";
  uid_validity: number;
  next_uid: number;
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
  sync_status: MailboxSyncStatus;
  last_synced_at?: EpochMilliseconds | null;
  imap_cursor?: ImapCursor | null;
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
  token_expires_at?: EpochMilliseconds | null;
  token_type?: string | null;
  scopes: string[];
  sync_enabled: boolean;
  sync_interval_seconds: number;
  sync_status: MailboxSyncStatus;
  last_synced_at?: EpochMilliseconds | null;
  last_history_id?: string | null;
};
export type CampaignThreadMode = "new_thread" | "reply_to_previous";
export type CampaignStatus =
  | { type: "draft" }
  | { type: "active"; launched_at: EpochMilliseconds }
  | { type: "paused"; launched_at: EpochMilliseconds; paused_at: EpochMilliseconds }
  | { type: "completed"; launched_at: EpochMilliseconds; completed_at: EpochMilliseconds };
export type CampaignStatusFilter = CampaignStatus["type"];
export type CampaignEnrollmentStopReason =
  | { type: "operator" }
  | { type: "delivery"; message_id: string }
  | { type: "outbound_unavailable" }
  | { type: "email_suppression" };
export type CampaignEnrollmentStatus =
  | { type: "pending"; next_step_index: number }
  | { type: "active"; next_step_index: number; next_step_at: EpochMilliseconds }
  | { type: "replied"; message_id: string; replied_at: EpochMilliseconds }
  | { type: "completed"; completed_at: EpochMilliseconds }
  | {
      type: "stopped";
      reason: CampaignEnrollmentStopReason;
      stopped_at: EpochMilliseconds;
    };
export type CampaignEnrollmentStatusFilter = CampaignEnrollmentStatus["type"];
export type CampaignOutgoingOrigin =
  | {
      type: "campaign_step";
      campaign_step_id: string;
      edited_by_account_session_id?: string | null;
    }
  | { type: "account_session"; account_session_id: string };
export type CampaignMessageType =
  | {
      type: "outgoing";
      origin: CampaignOutgoingOrigin;
      status: CampaignOutgoingStatus;
    }
  | {
      type: "incoming";
      mailbox_id: string;
      provider_message_id: string;
      provider_thread_id?: string | null;
      provider_references: string[];
      attachments: EmailAttachmentReference[];
      received_at: EpochMilliseconds;
    };
export type CampaignOutgoingStatus =
  | { type: "draft"; media_ids: string[] }
  | { type: "submitted"; delivery_status: CampaignEmailStatus };
export type WorkflowStatus = { type: "active" } | { type: "draft" };
export type MutableWorkflowStatus = WorkflowStatus;
export type CollectionStatus = { type: "active" } | { type: "draft" } | { type: "archived" };
export type EntryStatus = { type: "active" } | { type: "draft" } | { type: "archived" };
export type EmailTemplateStatus = { type: "active" } | { type: "draft" } | { type: "archived" };
export type EmailTemplateType =
  | "order_store_notification"
  | "order_contact_notification"
  | "order_booking_reminder_contact"
  | "contact_store_notification"
  | "subscription_confirmation"
  | "campaign_email";

export type FormStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" };
export type ClassificationStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" };

export type OrderCancellationReason =
  | "admin_rejected"
  | "contact_cancelled"
  | "payment_failed"
  | "expired"
  | "refunded"
  | "other";

export interface TimeRange {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
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
  | "form"
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
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
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
  | { type: "localized_text"; key: string; locale: string; values: string[] }
  | { type: "number"; key: string; operation: FieldOperation; value: number }
  | { type: "boolean"; key: string; value: boolean }
  | { type: "date"; key: string; operation: FieldOperation; value: EpochMilliseconds };

export interface CollectionEntry {
  id: string;
  store_id: string;
  collection_id: string;
  key: string;
  slug: Record<string, string>;
  blocks: Block[];
  status: EntryStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailTemplate {
  id: string;
  key: string;
  store_id: string;
  type: EmailTemplateType;
  subject: Record<string, string>;
  body: string;
  preheader: string | null;
  variables: EmailTemplateVariable[];
  sample_data: Record<string, unknown>;
  status: EmailTemplateStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
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
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  store_id: string;
  customer_id: string;
  customer_session_id: string;
  authentication: import("./orderContract").CustomerAuthenticationSnapshot;
  snapshot: FormSubmissionSnapshot;
  fields: FormField[];
  created_at: EpochMilliseconds;
}

export interface FormSubmissionSnapshot {
  form_key: string;
  questions: FormQuestionSnapshot[];
}

export interface FormQuestionSnapshot {
  field_id: string;
  question: DisplayTextSnapshot;
}

export interface Classification {
  id: string;
  key: string;
  store_id: string;
  parent_id: string | null;
  schema: ClassificationSchema[];
  status: ClassificationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ServiceDuration {
  minutes: number;
  is_pause: boolean;
}

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WorkingWindow {
  from_minute: number;
  to_minute: number;
}

export interface WeeklyAvailability {
  weekday: Weekday;
  windows: WorkingWindow[];
}

export interface DateOverride {
  local_date: string;
  windows: WorkingWindow[];
}

export interface BookingWindow {
  opens_before_start_minutes?: number | null;
  closes_before_start_minutes: number;
}

export interface BookingOffering {
  id: string;
  store_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  weekly_availability: WeeklyAvailability[];
  date_overrides: DateOverride[];
  durations: ServiceDuration[];
  slot_interval_minutes: number;
  booking_window: BookingWindow;
  reminder_offsets_minutes: number[];
  service_location_id: string | null;
  tax_category_id: string | null;
  status: BookingOfferingStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface BookingService {
  id: string;
  key: string;
  slugs: Record<string, string>;
  store_id: string;
  blocks: Block[];
  classifications: ClassificationEntry[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  status: BookingServiceStatus;
}

export interface BookingResource {
  id: string;
  key: string;
  slugs: Record<string, string>;
  store_id: string;
  status: BookingResourceStatus;
  blocks: Block[];
  classifications: ClassificationEntry[];
  timezone: string;
  capacity: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface BookingCapacityClaim {
  order_id: string;
  order_booking_item_id: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export interface BookingResourceCapacityDay {
  id: string;
  store_id: string;
  booking_resource_id: string;
  local_date: string;
  timezone: string;
  claims: BookingCapacityClaim[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
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
  schedule?: string | null;
  webhook_url: string;
  graph: WorkflowGraph;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface WorkflowListItem {
  id: string;
  key: string;
  store_id: string;
  status: WorkflowStatus;
  schedule?: string | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface WorkflowWebhookUrl {
  workflow_id: string;
  webhook_url: string;
}

export interface WorkflowGraph {
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
}

export type WorkflowNode =
  | WorkflowHttpNode
  | WorkflowSendEmailNode
  | WorkflowDeployWebhookNode
  | WorkflowGoogleDriveUploadNode
  | WorkflowSwitchNode
  | WorkflowTransformNode
  | WorkflowLoopNode;

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

export interface WorkflowEmailSendTemplateData {
  store_id: string;
  mailbox_id: string;
  template_id: string;
  recipient: string;
  vars?: Record<string, unknown>;
}

export type WorkflowEmailSend =
  | { type: "order_store_notification"; data: WorkflowEmailSendTemplateData }
  | { type: "order_contact_notification"; data: WorkflowEmailSendTemplateData }
  | {
      type: "order_booking_reminder_contact";
      data: WorkflowEmailSendTemplateData;
    }
  | { type: "contact_store_notification"; data: WorkflowEmailSendTemplateData }
  | { type: "subscription_confirmation"; data: WorkflowEmailSendTemplateData };

export interface EmailAttachmentReference {
  filename: string;
  mime_type: string;
  blob_key: string;
  content_sha256: string;
  size_bytes: number;
}

export interface WorkflowSendEmailNode {
  type: "send_email";
  send: WorkflowEmailSend;
  delay_ms?: number;
}

export interface WorkflowDeployWebhookNode {
  type: "deploy_webhook";
  build_hook_id: string;
  timeout_ms?: number;
  delay_ms?: number;
}

export type WorkflowConnectionType = "google_drive";

export interface GoogleDriveWorkflowAccount {
  external_account_id: string;
  display_name?: string | null;
  email?: string | null;
}

export type WorkflowConnectionAuthorizationStatus =
  | { type: "active" }
  | { type: "reauthorization_required"; detected_at: EpochMilliseconds };

export interface GoogleDriveWorkflowConnectionData {
  type: "google_drive";
  account: GoogleDriveWorkflowAccount;
  authorization_status: WorkflowConnectionAuthorizationStatus;
}

export type WorkflowConnectionData = GoogleDriveWorkflowConnectionData;

export interface WorkflowConnection {
  id: string;
  store_id: string;
  data: WorkflowConnectionData;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
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
  delay_ms?: number | null;
}

export interface WorkflowTransformNode {
  type: "transform";
  code: string;
  delay_ms?: number | null;
}

export interface WorkflowLoopNode {
  type: "loop";
  expression: string;
  delay_ms?: number | null;
}

export type WorkflowHttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type WorkflowExecutionStatus =
  | { type: "pending" }
  | { type: "running" }
  | { type: "completed" }
  | { type: "failed" }
  | { type: "cancelled" };

export type NodeResultSource =
  | { type: "local" }
  | { type: "external_operation"; operation_id: string };

export interface NodeResult {
  source: NodeResultSource;
  output: any;
  route: string;
  started_at: EpochMilliseconds;
  completed_at: EpochMilliseconds;
  duration_ms: number;
  error?: string;
}

export type WorkflowExecutionInput =
  { type: "webhook"; payload: unknown } | { type: "schedule" };

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  store_id: string;
  graph: WorkflowGraph;
  input: WorkflowExecutionInput;
  results: Record<string, NodeResult>;
  status: WorkflowExecutionStatus;
  error?: string | null;
  scheduled_at: EpochMilliseconds;
  started_at?: EpochMilliseconds | null;
  completed_at?: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface WorkflowExecutionListItem {
  id: string;
  workflow_id: string;
  status: WorkflowExecutionStatus;
  error?: string | null;
  scheduled_at: EpochMilliseconds;
  started_at?: EpochMilliseconds | null;
  completed_at?: EpochMilliseconds | null;
}

export interface WorkflowExecutionStarted {
  id: string;
  status: WorkflowExecutionStatus;
}

export type WorkflowExternalOperationType =
  | "http_mutation"
  | "send_email"
  | "deploy_webhook"
  | "google_drive_upload";

export type WorkflowExternalOperationStatus =
  | { type: "requested" }
  | { type: "processing" }
  | { type: "succeeded" }
  | { type: "rejected" }
  | { type: "failed" }
  | { type: "unknown" };

export type WorkflowExternalOperationErrorType =
  "provider_call_not_started" | "provider_rejected" | "unknown_outcome";

export type WorkflowExternalOperationResult =
  | { type: "provider"; provider_status?: number; provider_file_id?: string }
  | {
      type: "send_email";
      provider_message_id: string;
      provider_thread_id: string | null;
      sent_at: EpochMilliseconds;
    };

export interface WorkflowExternalOperationError {
  type: WorkflowExternalOperationErrorType;
  message: string;
  at: EpochMilliseconds;
  provider_status?: number;
}

export interface WorkflowExternalOperation {
  id: string;
  store_id: string;
  workflow_id: string;
  execution_id: string;
  node_id: string;
  iteration_key: string;
  type: WorkflowExternalOperationType;
  status: WorkflowExternalOperationStatus;
  requested_at: EpochMilliseconds;
  processing_started_at: EpochMilliseconds | null;
  completed_at: EpochMilliseconds | null;
  result: WorkflowExternalOperationResult | null;
  error: WorkflowExternalOperationError | null;
  updated_at: EpochMilliseconds;
}

export type CustomerSessionStatus =
  | { type: "active" }
  | { type: "superseded" }
  | { type: "revoked" };

export interface CustomerEmailVerification {
  identity_id: string;
  failed_attempts: number;
  sent_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}

interface CustomerSessionRecordBase {
  id: string;
  store_id: string;
  customer_id: string;
  last_seen_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

type CustomerSessionLifecycle =
  | { status: { type: "active" }; superseded_at: null; revoked_at: null }
  | { status: { type: "superseded" }; superseded_at: EpochMilliseconds; revoked_at: null }
  | {
      status: { type: "revoked" };
      superseded_at: EpochMilliseconds | null;
      revoked_at: EpochMilliseconds;
    };

type CustomerSessionSafeType =
  | {
      type: "visitor";
      expires_at: EpochMilliseconds;
      email_verification: CustomerEmailVerification | null;
    }
  | {
      type: "email_authenticated";
      identity_id: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    };

export type CustomerSessionRecord = CustomerSessionRecordBase &
  CustomerSessionLifecycle &
  CustomerSessionSafeType;

export type CustomerSessionIssued =
  | {
      id: string;
      customer_id: string;
      status: { type: "active" };
      type: "visitor";
      token: string;
      expires_at: EpochMilliseconds;
    }
  | {
      id: string;
      customer_id: string;
      status: { type: "active" };
      type: "email_authenticated";
      identity_id: string;
      access_token: string;
      refresh_token: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    };

export interface CustomerIdentity {
  id: string;
  store_id: string;
  customer_id: string;
  type: { type: "email"; email: string };
  verified_at: EpochMilliseconds | null;
  status: { type: "active" | "revoked" };
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface Customer {
  id: string;
  store_id: string;
  status: CustomerStatus;
  primary_email_identity_id: string | null;
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  classifications: ClassificationEntry[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerListItem extends Customer {
  primary_email: string | null;
  has_verified_email: boolean;
  primary_email_verified_at: EpochMilliseconds | null;
}

export type CustomerActionOrigin =
  | { type: "customer_session"; customer_session_id: string }
  | { type: "account_session"; account_session_id: string }
  | { type: "import"; account_session_id: string }
  | { type: "workflow"; workflow_execution_id: string }
  | { type: "lead_research"; assistant_message_id: string }
  | { type: "confirmation_capability"; membership_id: string }
  | { type: "unsubscribe_capability"; membership_id: string }
  | {
      type: "stripe";
      payment_provider_id: string;
      observation: CustomerActionProviderObservation;
    }
  | { type: "system" };

export type CustomerActionProviderObservation =
  | {
      type: "stripe_event";
      event_id: string;
      event_created_at: EpochMilliseconds;
    }
  | {
      type: "exact_read";
      observed_at: EpochMilliseconds;
      provider_updated_at?: EpochMilliseconds | null;
    };

export type CustomerGroupMemberJoinSource =
  | "private_admin"
  | "import"
  | "workflow"
  | "lead_research"
  | "open"
  | "confirmation";

export type CustomerGroupUnsubscribeReason =
  | "customer_email_opt_out"
  | "customer_left"
  | "admin_ended"
  | "store_closure";

interface CustomerGroupMemberActionValue {
  customer_group_id: string;
  membership_id: string;
}

export type CustomerActionType =
  | {
      type: "custom";
      value: {
        key: string;
        data: Record<string, unknown>;
      };
    }
  | {
      type: "form_submission";
      value: {
        form_id: string;
        submission_id: string;
      };
    }
  | {
      type: "social_comment";
      value: {
        social_connection_id: string;
        post_id: string;
        comment_id: string;
      };
    }
  | {
      type: "social_reply";
      value: {
        social_connection_id: string;
        post_id: string;
        comment_id: string;
      };
    }
  | {
      type: "order";
      value: {
        order_id: string;
      };
    }
  | {
      type: "campaign_reply";
      value: {
        campaign_id: string;
        enrollment_id: string;
        message_id: string;
      };
    }
  | {
      type: "customer_group_member_joined";
      value: CustomerGroupMemberActionValue & {
        source: CustomerGroupMemberJoinSource;
      };
    }
  | {
      type:
        | "customer_group_confirmation_requested"
        | "customer_group_confirmation_completed"
        | "customer_group_member_resubscribed"
        | "customer_group_member_left"
        | "customer_group_member_insight_replaced";
      value: CustomerGroupMemberActionValue;
    }
  | {
      type: "customer_group_member_unsubscribed";
      value: CustomerGroupMemberActionValue & {
        reason: CustomerGroupUnsubscribeReason;
      };
    };

export interface CustomerAction {
  id: string;
  store_id: string;
  customer_id: string;
  origin: CustomerActionOrigin;
  type: CustomerActionType;
  occurred_at: EpochMilliseconds;
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
  last_sent_at?: EpochMilliseconds | null;
  sync_revision: number;
  next_sync_at?: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type MailboxIncomingSource =
  | { type: "imap"; mailbox: "INBOX"; uid_validity: number; uid: number }
  | { type: "google"; message_id: string };

export type MailboxSyncIssueReason =
  | "invalid_mime"
  | "missing_sender"
  | "invalid_sender"
  | "invalid_body_encoding"
  | "invalid_attachment_encoding"
  | "header_limit_exceeded"
  | "attachment_limit_exceeded"
  | "content_limit_exceeded";

export interface MailboxSyncIssue {
  id: string;
  store_id: string;
  mailbox_id: string;
  source: MailboxIncomingSource;
  reason: MailboxSyncIssueReason;
  message: string;
  observed_at: EpochMilliseconds;
}

export interface CampaignStep {
  id: string;
  delay_seconds: number;
  subject: string;
  body_text: string;
  body_html?: string | null;
  media_ids: string[];
  thread_mode: CampaignThreadMode;
}

export interface Campaign {
  id: string;
  store_id: string;
  name: string;
  mailbox_ids: string[];
  status: CampaignStatus;
  steps: CampaignStep[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CampaignEnrollmentSource =
  | { type: "customer" }
  | {
      type: "customer_group";
      email_consent_id: string;
      customer_group_member_id: string;
    };

export interface CampaignGroupRecipient {
  email_consent_id: string;
  customer_group_member_id: string;
}

export interface CampaignEnrollment {
  id: string;
  store_id: string;
  campaign_id: string;
  customer_id: string;
  customer_identity_id: string;
  source: CampaignEnrollmentSource;
  mailbox_id: string;
  status: CampaignEnrollmentStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EnrollCampaignResult {
  created_count: number;
  existing_count: number;
  rejected_count: number;
  created_enrollment_ids: string[];
}

export interface CampaignMessage {
  id: string;
  store_id: string;
  campaign_id: string;
  campaign_enrollment_id: string;
  position: number;
  parent_message_id?: string | null;
  type: CampaignMessageType;
  content: CampaignEmailContent;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CampaignEmailContent {
  to_email: string;
  from_email: string;
  subject: string;
  body_text: string;
  body_html?: string | null;
}

export type CampaignEmailStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; started_at: EpochMilliseconds; deadline_at: EpochMilliseconds }
  | {
      type: "sent";
      provider_message_id: string;
      provider_thread_id?: string | null;
      provider_status?: number | null;
      delivery_failure?: string | null;
      sent_at: EpochMilliseconds;
    }
  | {
      type: "rejected";
      provider_status?: number | null;
      rejected_at: EpochMilliseconds;
    }
  | { type: "failed"; failed_at: EpochMilliseconds }
  | { type: "unknown"; unknown_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface CampaignConversationMessage {
  message: CampaignMessage;
  email_status?: CampaignEmailStatus | null;
}

export interface CampaignEnrollmentConversationResponse {
  enrollment: CampaignEnrollment;
  messages: PaginatedResponse<CampaignConversationMessage>;
}

export interface LeadResearchSnapshot {
  customer_group_key: string;
  customer_group_name: DisplayTextSnapshot;
}

export interface LeadResearch {
  id: string;
  store_id: string;
  customer_group_id: string;
  snapshot: LeadResearchSnapshot;
  title: string;
  created_at: EpochMilliseconds;
}

export type LeadResearchAssistantFailureReason =
  "pre_call" | "provider_rejected";

export type LeadResearchAssistantMessageStatus =
  | { type: "requested" }
  | { type: "processing"; deadline_at: EpochMilliseconds }
  | { type: "completed"; content: string; completed_at: EpochMilliseconds }
  | {
      type: "failed";
      reason: LeadResearchAssistantFailureReason;
      error: string;
      failed_at: EpochMilliseconds;
    }
  | { type: "unknown"; error: string; detected_at: EpochMilliseconds }
  | {
      type: "cancelled";
      cancelled_by: AccountActor;
      cancelled_at: EpochMilliseconds;
    };

export type LeadResearchMessageType =
  | {
      type: "account";
      actor: AccountActor;
      content: string;
    }
  | {
      type: "assistant";
      responds_to_message_id: string;
      requested_by: AccountActor;
      status: LeadResearchAssistantMessageStatus;
    };

export interface LeadResearchMessage {
  id: string;
  store_id: string;
  lead_research_id: string;
  position: number;
  type: LeadResearchMessageType;
  created_at: EpochMilliseconds;
}

export interface LeadResearchMessagePair {
  account_message: LeadResearchMessage;
  assistant_message: LeadResearchMessage;
}

export interface LeadResearchCreated extends LeadResearchMessagePair {
  lead_research: LeadResearch;
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
  | { action: "order_booking_item_created" }
  | { action: "order_booking_item_updated" }
  | { action: "order_booking_item_confirmed" }
  | { action: "order_booking_item_completed" }
  | { action: "order_booking_item_no_show" }
  | { action: "order_booking_item_cancelled" }
  | { action: "order_booking_item_reminder_due" }
  | { action: "order_booking_item_reminder" }
  | { action: "shipment_created"; data: { shipment_id: string } }
  | { action: "shipment_in_transit"; data: { shipment_id: string } }
  | { action: "shipment_out_for_delivery"; data: { shipment_id: string } }
  | { action: "shipment_delivered"; data: { shipment_id: string } }
  | {
      action: "shipment_failed";
      data: { shipment_id: string; reason?: string };
    }
  | { action: "shipment_returned"; data: { shipment_id: string } }
  | {
      action: "shipment_status_changed";
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
  | { action: "booking_resource_created" }
  | { action: "booking_resource_updated" }
  | { action: "booking_resource_deleted" }
  | { action: "booking_service_created" }
  | { action: "booking_service_updated" }
  | { action: "booking_service_deleted" }
  | { action: "account_created" }
  | { action: "account_updated" }
  | { action: "account_deleted" }
  | { action: "media_created" }
  | { action: "media_deleted" }
  | { action: "store_created" }
  | { action: "store_updated" }
  | { action: "customer_group_created" }
  | { action: "customer_group_updated" }
  | { action: "customer_group_deletion_requested" }
  | { action: "customer_group_deleted" }
  | { action: "customer_group_member_created" }
  | { action: "customer_group_member_updated" }
  | { action: "customer_group_confirmation_requested" }
  | { action: "subscription_plan_created" }
  | { action: "subscription_plan_updated" }
  | { action: "subscription_activated" }
  | { action: "subscription_paused" }
  | { action: "subscription_resumed" }
  | { action: "subscription_cancelled" }
  | { action: "subscription_funding_changed" }
  | { action: "subscription_next_purchase_skipped" }
  | { action: "subscription_renewal_due" }
  | { action: "subscription_renewal_collection_due" };

export interface Event {
  id: string;
  entity: string;
  event: EventAction;
  actor: string;
  created_at: EpochMilliseconds;
}

export type ShipmentStatus =
  { type: "pending"
  | "label_created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled" };

export interface ShippingRateLine {
  order_product_item_id: string;
  quantity: number;
}

export interface ShipmentLine {
  fulfillment_order_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
  unit_bindings: ShipmentUnitBinding[];
}

export interface ShipmentUnitBinding {
  fulfillment_unit_index: number;
  inventory_unit_id: string;
}

export interface FulfillmentExecution {
  command_id: string;
  executed_at: EpochMilliseconds;
  actor: AccountActor;
}

export interface Shipment {
  id: string;
  store_id: string;
  fulfillment_order_id: string;
  origin_store_location_id: string;
  lines: ShipmentLine[];
  status: ShipmentStatus;
  parcel: Parcel;
  customs_declaration: CustomsDeclaration | null;
  carrier: string | null;
  service: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  tracking_status_at: EpochMilliseconds | null;
  selected_label_id: string | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  dispatch: FulfillmentExecution | null;
  origin_address: PostalAddress;
  destination_address: PostalAddress;
}

export interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  distance_unit: string;
  mass_unit: string;
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
  eel_pfc?: string | null;
  aes_itn?: string | null;
  incoterm?: string | null;
  items: CustomsItem[];
}
