import type {
  Account,
  AccountApiToken,
  AccountApiTokenStatus,
  AccountSession,
  AccountSessionStatus,
  AuthToken,
  AudiencePaymentStatus,
  AudiencePromotionSnapshot,
  AudienceSubscribeResponse,
  AudienceTierPriceInput,
  Block,
  BlockSchema,
  BuildHook,
  Classification,
  ClassificationEntry,
  ClassificationFieldQuery,
  ClassificationSchema,
  Customer,
  Cart,
  CartBookingItem,
  CartDigitalItem,
  CartProductItem,
  CartDigitalItemInput,
  CartProductInput,
  CheckoutCartParams,
  CreatePromoCodeParams,
  CreatePromotionDiscountInput,
  CreateMarketParams,
  CreateProductParams,
  CreateDigitalProductParams,
  CreateSuppressionParams,
  CreateOrderShipmentParams,
  DigitalAsset,
  DigitalLibraryItem,
  DigitalLibraryProduct,
  DigitalProduct,
  DigitalProductStatus,
  DiscountAllocation,
  EmailDeliveryType,
  GetCollectionParams,
  GetDigitalLibraryProductParams,
  GetStorefrontDigitalProductParams,
  GetShippingRatesParams,
  GetPaymentDisputeParams,
  GetPromoCodesParams,
  OrderMoney,
  Order,
  OrderCheckoutResult,
  OrderRefund,
  OrderRefundProvider,
  RefundAllocation,
  RefundStatus,
  OrderPayment,
  OrderPaymentProvider,
  PaymentAmounts,
  PaymentDispute,
  PaymentDisputeProvider,
  PaymentDisputeStatus,
  PromoCode,
  PromotionCondition,
  PromotionConditionInput,
  PromotionDiscount,
  OrderDigitalSnapshot,
  OrderDigitalItem,
  OrderProductItem,
  OrderPromoCodeSnapshot,
  TaxLine,
  OrderShippingLine,
  ShippingLabel,
  ShippingLabelCharge,
  ShippingLabelChargeRefund,
  ShippingLabelChargeRefundReason,
  ShippingLabelRefund,
  ShippingRate,
  FulfillmentOrder,
  FulfillmentOrderStatus,
  FormBlock,
  PaginatedResponse,
  PendingAccountSession,
  Product,
  ProductInventory,
  ProductInventoryInput,
  ProductStatus,
  ProductVariant,
  Price,
  RefundRequestReason,
  CreateOrderRefundParams,
  RecordCashOnDeliveryRefundParams,
  FindPaymentDisputesParams,
  BookingOffering,
  BookingResource,
  BookingService,
  CartBookingInput,
  TrustedCartBookingInput,
  TrustedCartDigitalItemInput,
  TrustedCartProductInput,
  OrderBookingItem,
  TimeRange,
  OrderShipment,
  OrderShipmentStatus,
  SocialConnectionCredential,
  SocialConnectionData,
  SocialConnectionType,
  SocialOAuthCallbackStatus,
  SocialPublicationContent,
  SocialPublicationEffectRequest,
  SocialProviderCapability,
  SmtpImapMailboxProviderInput,
  StoreSubscription,
  Store,
  StoreLocation,
  StoreMembership,
  StoreSubscriptionStatus,
  StoreUsage,
  SubscriptionPlanFeatureType,
  TiktokPrivacy,
  StorefrontIdentifyResult,
  StorefrontDigitalProduct,
  StorefrontDto,
  StorefrontLocation,
  StorefrontPaymentProvider,
  StorefrontSetup,
  StorefrontGetSupportConversationParams,
  StorefrontSendSupportMessageParams,
  ReceiveSupportChannelMessageParams,
  SupportAgentDefinition,
  SupportAgentNode,
  SupportConversation,
  SupportConversationStartResponse,
  SupportMessage,
  UpdateCartParams,
  UpdateDigitalProductParams,
  UpdatePromoCodeParams,
  UpdatePromotionDiscountInput,
  UpdateProductParams,
  UpdateOrderParams,
  MarketZoneInput,
  Mailbox,
  Market,
  Media,
  Money,
  OrderQuote,
  PaymentProvider,
  Suppression,
  WorkflowHttpNode,
  WorkflowTriggerNode,
  VerifyPendingAccountSessionParams,
  Webhook,
  FindDigitalProductsParams,
  MarkCashOnDeliveryPaidParams,
  Activity,
  ActivityContext,
  ActivityData,
  ActivityFeedData,
  AnalyticsActivityReportKey,
  CommonActivityKey,
  CampaignMessageDirection,
  CheckoutPaymentAction,
  CancelOrderProductItemParams,
  BookingItemLifecycleParams,
  DigitalProductQuoteInput,
  GetQuoteParams,
  ProductQuoteInput,
  BookingQuoteInput,
  CreateExperimentParams,
  EventAction,
  Experiment,
  ExperimentUseResponse,
  StorefrontActivity,
  SupportAction,
  TrackActivityParams,
  WebhookEventSubscription,
} from "../../dist/index.js";
// @ts-expect-error CRM customer/business facts use the Activity name exclusively.
import type { Action, ActionData } from "../../dist/index.js";
// @ts-expect-error analytics exposes Activity feed and report names exclusively.
import type { ActionFeedData, AnalyticsActionReportKey } from "../../dist/index.js";
// @ts-expect-error Promotion command and response types are lifecycle-specific.
import type { Discount } from "../../dist/index.js";
// @ts-expect-error Promotion conditions use their full domain name.
import type { Condition } from "../../dist/index.js";
// @ts-expect-error Digital Product prices use the shared Price contract.
import type { DigitalPrice } from "../../dist/index.js";
// @ts-expect-error Digital Product status has its own canonical name.
import type { DigitalCatalogStatus } from "../../dist/index.js";
// @ts-expect-error payment method identity is represented by OrderPaymentProvider.
import type { OrderPaymentType } from "../../dist/index.js";
// @ts-expect-error the loose legacy provider record is no longer public.
import type { ProviderOrderPayment } from "../../dist/index.js";
// @ts-expect-error the canonical refund allocation type has no Order prefix.
import type { OrderRefundAllocation } from "../../dist/index.js";
// @ts-expect-error refund provider kind is a tagged provider value, not a flat root type.
import type { OrderRefundType } from "../../dist/index.js";
// @ts-expect-error Commerce disputes use the PaymentDispute name.
import type { OrderDispute } from "../../dist/index.js";
// @ts-expect-error Payment dispute provider evidence has its canonical tagged name.
import type { ProviderOrderDispute } from "../../dist/index.js";
// @ts-expect-error dispute query inputs use the PaymentDispute name.
import type { FindOrderDisputesParams } from "../../dist/index.js";
// @ts-expect-error dispute query inputs use the PaymentDispute name.
import type { GetOrderDisputeParams } from "../../dist/index.js";
// @ts-expect-error carrier-label DTOs are provider-neutral.
import type { ShippoLabel } from "../../dist/index.js";
// @ts-expect-error merchant label debits use their literal root name.
import type { OrderShipmentCharge } from "../../dist/index.js";
import type {
  CreateBuildHookParams,
  CreateStoreLocationParams,
  CreateStoreParams,
  CreateWebhookParams,
  FindActivitiesParams,
  FindCustomersParams,
  RequestOptions,
} from "../../dist/types.js";
// @ts-expect-error CRM Activity queries have no Action compatibility alias.
import type { FindActionsParams } from "../../dist/types.js";
// @ts-expect-error embedded Cart/Order items use their canonical Item names only.
import type { CartDigitalProduct, OrderDigitalProduct, OrderProduct } from "../../dist/index.js";
// @ts-expect-error Order product cancellation addresses an embedded product item.
import type { CancelOrderProductParams } from "../../dist/index.js";
// @ts-expect-error Audience promotion snapshots no longer expose mutable usage state.
import type { AudiencePromotionUsageStatus } from "../../dist/index.js";
import { createAdmin, SDK_VERSION } from "../../dist/index.js";
import {
  COMMON_ACTIVITY_KEYS,
  createStorefront,
  initialize,
  type FormField,
  type FormSchema,
  type FormValues,
  type EmbeddedCheckoutAction as StorefrontEmbeddedCheckoutAction,
  type StorefrontIdentifyResult as StorefrontEntryIdentifyResult,
} from "../../dist/storefront.js";
// @ts-expect-error storefront tracking uses Activity type names exclusively.
import type { CommonActionKey, StorefrontAction, TrackActionParams } from "../../dist/storefront.js";
// @ts-expect-error storefront Activity keys have no Action compatibility alias.
import { COMMON_ACTION_KEYS } from "../../dist/storefront.js";

const sdkVersionLiteral: "0.26.0" = SDK_VERSION;
// @ts-expect-error mandatory Visitor Customer bootstrap is unmetered.
const legacyCrmContactFeature: SubscriptionPlanFeatureType = "crm_contacts";
const bookingServiceFeature: SubscriptionPlanFeatureType = "booking_services";
const bookingResourceFeature: SubscriptionPlanFeatureType = "booking_resources";
// @ts-expect-error Customer bootstrap has no replacement quota feature key.
const nonWireCrmProfileFeature: SubscriptionPlanFeatureType = "crm_profiles";
// @ts-expect-error Booking Service quota keys use the full domain name.
const legacyServiceFeature: SubscriptionPlanFeatureType = "services";
// @ts-expect-error Booking Resource quota keys use the full domain name.
const legacyProviderFeature: SubscriptionPlanFeatureType = "providers";
const mediaContract: Media = {
  id: "media-contract",
  creation_key: "owned:content-digest",
  resolutions: {
    original: { id: "resolution-contract", url: "stores/store-contract/media/file" },
  },
  mime_type: "image/png",
  title: "file.png",
  description: null,
  alt: null,
  store_id: "store-contract",
  metadata: null,
  created_at: 1,
  updated_at: 1,
  slug: { en: "file" },
};
// @ts-expect-error Media always exposes its durable creation key.
const mediaWithoutCreationKey: Media = {
  id: "media-contract",
  resolutions: {},
  mime_type: "image/png",
  store_id: "store-contract",
  created_at: 1,
  updated_at: 1,
  slug: {},
};
const storeContract: Store = {
  id: "store-contract",
  name: "Contract Store",
  email: "owner@example.com",
  publishable_key: `arky_pk_${"a".repeat(43)}`,
  status: "active",
  default_market_id: null,
  timezone: "Europe/Sarajevo",
  default_language: "en",
  supported_languages: ["en", "bs"],
};
const createStoreContract: CreateStoreParams = {
  name: "Contract Store",
  timezone: "Europe/Sarajevo",
  default_language: "en",
  supported_languages: ["en", "bs"],
};
// @ts-expect-error Store routing identity is no longer a mutable key.
storeContract.key;
// @ts-expect-error Store lifecycle is represented by the typed status field.
storeContract.lifecycle;
// @ts-expect-error Store language defaults are explicit rather than positional.
storeContract.languages;
// @ts-expect-error Store email is one root field, not a billing/support object.
storeContract.emails;
// @ts-expect-error Store creation accepts a name, not the removed mutable key.
createStoreContract.key;
// @ts-expect-error Store creation requires explicit language ownership fields.
createStoreContract.languages;
// @ts-expect-error Store creation accepts one optional email field.
createStoreContract.emails;

const storeLocationContract: StoreLocation = {
  id: "location-contract",
  store_id: "store-contract",
  key: "main",
  address: { city: "Sarajevo", country: "BA" },
  is_pickup_location: true,
  created_at: 1,
  updated_at: 1,
};
const createStoreLocationContract: CreateStoreLocationParams = {
  key: "main",
  address: storeLocationContract.address,
};
declare const storefrontLocationContract: StorefrontLocation;
const storefrontCountry: string | null | undefined =
  storefrontLocationContract.address.country;
// @ts-expect-error Storefront locations omit Admin persistence timestamps.
storefrontLocationContract.created_at;
void storefrontCountry;

const buildHookContract: BuildHook = {
  id: "build-hook-contract",
  store_id: "store-contract",
  url: "••••••••",
  headers: { authorization: "••••••••" },
  status: "disabled",
  created_at: 1,
  updated_at: 1,
};
const createBuildHookContract: CreateBuildHookParams = {
  store_id: "store-contract",
  url: "https://deploy.example.com/hook",
  status: "active",
};
// @ts-expect-error Build Hooks are addressed by UUID, not a mutable key.
buildHookContract.key;
// @ts-expect-error Build Hooks no longer store a provider classification.
buildHookContract.type;
// @ts-expect-error Build Hook state is represented by status.
buildHookContract.active;
// @ts-expect-error Build Hook creation has no mutable key.
createBuildHookContract.key;
// @ts-expect-error Build Hook creation has no provider classification.
createBuildHookContract.type;
// @ts-expect-error Build Hook creation uses typed status.
createBuildHookContract.active;

const webhookContract: Webhook = {
  id: "webhook-contract",
  store_id: "store-contract",
  url: "••••••••",
  events: [{ event: "store.updated" }],
  headers: {},
  secret: "••••••••",
  status: "active",
  created_at: 1,
  updated_at: 1,
};
const createWebhookContract: CreateWebhookParams = {
  store_id: "store-contract",
  url: "https://events.example.com/hook",
  events: [{ event: "store.updated" }],
  headers: {},
  secret: "s".repeat(32),
  status: "disabled",
};
// @ts-expect-error Webhooks are addressed by UUID, not a mutable key.
webhookContract.key;
// @ts-expect-error Webhook state is represented by status.
webhookContract.enabled;
// @ts-expect-error Webhook creation has no mutable key.
createWebhookContract.key;
// @ts-expect-error Webhook creation uses typed status.
createWebhookContract.enabled;

const totalStoreUsage: StoreUsage = {
  id: "usage-total-contract",
  store_id: "store-contract",
  feature: "products",
  period: { type: "total" },
  count: 4,
  created_at: 1,
  updated_at: 1,
};
const monthlyStoreUsage: StoreUsage = {
  ...totalStoreUsage,
  id: "usage-month-contract",
  feature: "lead_research_runs",
  period: { type: "monthly", year: 2026, month: 8 },
};
const invalidMonthlyStoreUsage: StoreUsage = {
  ...totalStoreUsage,
  // @ts-expect-error Monthly usage always identifies its UTC calendar month.
  period: { type: "monthly" },
};

const cashOnDeliveryProvider: PaymentProvider = {
  id: "provider-cash-on-delivery",
  store_id: "store-contract",
  configuration: { type: "cash_on_delivery" },
  disabled_at: null,
  created_at: 1,
  updated_at: 1,
};
const stripeProvider: PaymentProvider = {
  id: "provider-stripe",
  store_id: "store-contract",
  configuration: {
    type: "stripe",
    connected_account_id: "acct_contract",
    account_setup_submitted: true,
    payments_enabled: true,
    payouts_enabled: true,
    state_observed_at: 2,
    platform_debit_consent: {
      connected_account_id: "acct_contract",
      accepted_by_account_id: "account-contract",
      accepted_at: 2,
      terms_version: 1,
    },
  },
  disabled_at: null,
  created_at: 1,
  updated_at: 2,
};
const marketContract: Market = {
  id: "market-contract",
  store_id: "store-contract",
  key: "bih",
  currency: "bam",
  tax_mode: "inclusive",
  payment_provider_ids: [cashOnDeliveryProvider.id, stripeProvider.id],
  zones: [],
  created_at: 1,
  updated_at: 2,
};
const storefrontPaymentProviders: StorefrontPaymentProvider[] = [
  { id: cashOnDeliveryProvider.id, type: "cash_on_delivery" },
  { id: stripeProvider.id, type: "stripe" },
];
const storefrontSetupContract: StorefrontSetup = {
  timezone: "Europe/Sarajevo",
  languages: { default: "en", available: ["en"] },
  markets: {
    default: marketContract.key,
    available: [marketContract],
  },
  payment_providers: storefrontPaymentProviders,
  support: { email: "store@example.test" },
  readiness: { market: true, payment: true, commerce: true },
};
const storefrontProviderType: "cash_on_delivery" | "stripe" =
  storefrontSetupContract.payment_providers[1].type;
const createMarketContract: CreateMarketParams = {
  key: "bih",
  currency: "bam",
  tax_mode: "inclusive",
  payment_provider_ids: [cashOnDeliveryProvider.id, stripeProvider.id],
};
const checkoutContract: CheckoutCartParams = {
  id: "cart-contract",
  payment_provider_id: stripeProvider.id,
  return_url: "https://storefront.example.test/checkout/return",
};
declare const quoteContract: OrderQuote;
const quotedProviderId: string = quoteContract.payment_provider_id;
const quotedProviderIds: string[] = quoteContract.payment_provider_ids;
// @ts-expect-error Market no longer embeds Payment Methods.
marketContract.payment_methods;
// @ts-expect-error Market creation accepts provider UUIDs, not Payment Methods.
createMarketContract.payment_methods;
// @ts-expect-error Cart checkout selects a Payment Provider UUID.
checkoutContract.payment_method_key;
// @ts-expect-error Provider configuration is a tagged value, not a flat provider type.
stripeProvider.type;
// @ts-expect-error Provider setup observations live inside the Stripe configuration.
stripeProvider.payments_enabled;
// @ts-expect-error Quote returns provider UUID selection and allowlist fields.
quoteContract.payment_methods;

declare const membershipContract: StoreMembership;
const serverGeneratedMembershipUuid: string = membershipContract.id;
void createStoreContract;
void createStoreLocationContract;
void createBuildHookContract;
void createWebhookContract;
void monthlyStoreUsage;
void invalidMonthlyStoreUsage;
void cashOnDeliveryProvider;
void stripeProvider;
void marketContract;
void createMarketContract;
void checkoutContract;
void quotedProviderId;
void quotedProviderIds;
void serverGeneratedMembershipUuid;
const audienceTierPriceInput: AudienceTierPriceInput = {
  currency: "usd",
  amount: 1200,
  interval: { period: "month", count: 1 },
  status: "active",
};
const merchantRefundReason: RefundRequestReason = "fraudulent";
const refundMoney: Money = { amount: 1_250, currency: "usd" };
const refundAllocation: RefundAllocation = {
  type: "product",
  item_id: "order-product-contract",
  amount: 1_250,
};
const stripeRefundProvider: OrderRefundProvider = {
  type: "stripe",
  payment_provider_id: "payment-provider-contract",
  refund_id: "stripe-refund-contract",
  refund_status: "succeeded",
  failure_reason: null,
};
const orderRefundStatus: RefundStatus = "succeeded";
const orderRefund: OrderRefund = {
  id: "order-refund-contract",
  store_id: "store-contract",
  order_id: "order-contract",
  payment_id: "order-payment-contract",
  provider: stripeRefundProvider,
  money: refundMoney,
  allocations: [refundAllocation],
  requested_by_account_id: "account-contract",
  reason: "customer_request",
  private_note: null,
  status: orderRefundStatus,
  safe_error: null,
  requested_at: 1,
  processing_started_at: 2,
  processing_deadline_at: 3,
  completed_at: 4,
  created_at: 1,
  updated_at: 4,
};
const createOrderRefund: CreateOrderRefundParams = {
  order_id: "order-contract",
  refund_id: "order-refund-contract",
  amount: 1_250,
  allocations: [refundAllocation],
  reason: "customer_request",
};
const recordCashOnDeliveryRefund: RecordCashOnDeliveryRefundParams = {
  order_id: "order-contract",
  refund_id: "cash-refund-contract",
  amount: 1_250,
  allocations: [{ type: "adjustment", amount: 1_250, reason: "cash return" }],
  reason: "other",
};
const paymentDisputeStatus: PaymentDisputeStatus = "needs_response";
const paymentDisputeProvider: PaymentDisputeProvider = {
  type: "stripe",
  dispute_id: "stripe-dispute-contract",
  charge_id: "stripe-charge-contract",
};
const paymentDispute: PaymentDispute = {
  id: "payment-dispute-contract",
  store_id: "store-contract",
  order_id: "order-contract",
  payment_id: "order-payment-contract",
  money: { amount: 1_250, currency: "usd" },
  status: paymentDisputeStatus,
  reason: "fraudulent",
  provider: paymentDisputeProvider,
  created_at: 1,
  updated_at: 2,
};
const findPaymentDisputes: FindPaymentDisputesParams = {
  order_id: "order-contract",
  limit: 20,
};
const getPaymentDispute: GetPaymentDisputeParams = {
  order_id: "order-contract",
  dispute_id: paymentDispute.id,
};
// @ts-expect-error refunds expose Money instead of flat amount fields.
orderRefund.amount;
// @ts-expect-error refunds do not expose persistence versions.
orderRefund.version;
// @ts-expect-error refund provider kind is carried by provider.type.
orderRefund.type;
// @ts-expect-error product allocations use the canonical item_id.
refundAllocation.order_product_id;
// @ts-expect-error disputes expose Money instead of flat currency fields.
paymentDispute.currency;
// @ts-expect-error disputes do not expose persistence versions.
paymentDispute.version;
// @ts-expect-error Stripe dispute evidence uses charge_id.
paymentDisputeProvider.transaction_id;
const itemPercentageDiscountId = "86b7bf60-67e8-4c92-b14c-e98f4b2f4101";
const itemFixedDiscountId = "fca5ba8e-86af-4dd8-a1cd-6d19bca62e12";
const shippingDiscountId = "d8b35cf1-6867-49b0-863d-fdc1a6a6e6dc";
const audienceDiscountId = "ac4425e9-c3ee-4b85-820c-7c8d9314d034";

const promotionDiscounts: PromotionDiscount[] = [
  {
    type: "item_percentage",
    id: itemPercentageDiscountId,
    market: "us",
    basis_points: 1_000,
  },
  {
    type: "item_fixed",
    id: itemFixedDiscountId,
    market: "eu",
    money: { amount: 500, currency: "eur" },
  },
  {
    type: "shipping_percentage",
    id: shippingDiscountId,
    market: "us",
    basis_points: 2_000,
  },
  {
    type: "audience_percentage",
    id: audienceDiscountId,
    audience_id: "audience-contract",
    tier_ids: ["tier-contract"],
    price_ids: ["price-contract"],
    basis_points: 1_500,
  },
];

const promotionConditions: PromotionCondition[] = [
  { type: "products", product_ids: ["product-contract"] },
  { type: "booking_services", service_ids: ["booking-service-contract"] },
  { type: "digital_products", product_ids: ["digital-product-contract"] },
  {
    type: "minimum_order_amount",
    market: "us",
    money: { amount: 2_500, currency: "usd" },
  },
  { type: "redemption_window", starts_at: null, ends_at: 1_800_000_000 },
  { type: "maximum_uses", count: 100 },
  { type: "maximum_uses_per_customer", count: 1 },
];

const promoCodeContract: PromoCode = {
  id: "b7091941-b7f6-4776-8dc9-5167bc28fdc2",
  store_id: "store-contract",
  code: "SAVE10",
  discounts: promotionDiscounts,
  conditions: promotionConditions,
  status: "active",
  uses: 0,
  created_at: 1,
  updated_at: 1,
};

const createPromotionDiscounts: CreatePromotionDiscountInput[] = [
  { type: "item_percentage", market: "us", basis_points: 1_000 },
  {
    type: "item_fixed",
    market: "eu",
    money: { amount: 500, currency: "eur" },
  },
  { type: "shipping_percentage", market: "us", basis_points: 2_000 },
  {
    type: "audience_percentage",
    audience_id: "audience-contract",
    tier_ids: ["tier-contract"],
    price_ids: ["price-contract"],
    basis_points: 1_500,
  },
];

const promotionConditionInputs: PromotionConditionInput[] = [
  { type: "products", product_ids: ["product-contract"] },
  { type: "booking_services", service_ids: ["booking-service-contract"] },
  { type: "digital_products", product_ids: ["digital-product-contract"] },
  {
    type: "minimum_order_amount",
    market: "us",
    money: { amount: 2_500, currency: "usd" },
  },
  { type: "redemption_window", starts_at: null },
  { type: "maximum_uses", count: 100 },
  { type: "maximum_uses_per_customer", count: 1 },
];

const createPromoCodeContract: CreatePromoCodeParams = {
  code: "SAVE10",
  discounts: createPromotionDiscounts,
  conditions: promotionConditionInputs,
};
const createPromoCodeWithoutConditions: CreatePromoCodeParams = {
  code: "SAVE20",
  discounts: [
    { type: "item_percentage", market: "us", basis_points: 2_000 },
  ],
};

const updatePromotionDiscounts: UpdatePromotionDiscountInput[] = [
  {
    type: "item_percentage",
    id: itemPercentageDiscountId,
    market: "us",
    basis_points: 2_000,
  },
  { type: "shipping_percentage", market: "us", basis_points: 1_000 },
  {
    type: "item_fixed",
    id: null,
    market: "eu",
    money: { amount: 750, currency: "eur" },
  },
];
const updatePromoCodeContract: UpdatePromoCodeParams = {
  id: promoCodeContract.id,
  discounts: updatePromotionDiscounts,
  status: "draft",
};
const nullablePromoCodeUpdate: UpdatePromoCodeParams = {
  id: promoCodeContract.id,
  code: null,
  discounts: null,
  conditions: null,
  status: null,
};

// @ts-expect-error Server responses require one UUID-v4 ID on every discount.
const promotionDiscountWithoutId: PromotionDiscount = {
  type: "item_percentage",
  market: "us",
  basis_points: 1_000,
};
const createPromotionDiscountWithId: CreatePromotionDiscountInput = {
  type: "item_percentage",
  market: "us",
  basis_points: 1_000,
  // @ts-expect-error Create commands never accept an embedded discount ID.
  id: itemPercentageDiscountId,
};
// @ts-expect-error Response redemption windows always serialize both nullable keys.
const responseWindowWithoutEnd: PromotionCondition = {
  type: "redemption_window",
  starts_at: null,
};

const legacyDiscountTag: CreatePromotionDiscountInput = {
  // @ts-expect-error The response and command tag is singular item_percentage.
  type: "items_percentage",
  market: "us",
  basis_points: 1_000,
};
const legacyDiscountMarket: CreatePromotionDiscountInput = {
  type: "item_percentage",
  // @ts-expect-error Promotion discounts identify the canonical Market key as market.
  market_key: "us",
  basis_points: 1_000,
};
const legacyDiscountBasisPoints: CreatePromotionDiscountInput = {
  type: "shipping_percentage",
  market: "us",
  // @ts-expect-error Percentage values use basis_points.
  bps: 1_000,
};
const legacyFixedAmount: CreatePromotionDiscountInput = {
  type: "item_fixed",
  market: "us",
  // @ts-expect-error Fixed discounts carry typed Money.
  amount: 500,
};
const legacyBookingCondition: PromotionConditionInput = {
  // @ts-expect-error Booking targets use the booking_services tag.
  type: "services",
  service_ids: ["booking-service-contract"],
};
const legacyDigitalCondition: PromotionConditionInput = {
  type: "digital_products",
  // @ts-expect-error Digital targets share the canonical product_ids field.
  digital_product_ids: ["digital-product-contract"],
};
const legacyMinimumCondition: PromotionConditionInput = {
  // @ts-expect-error Minimum conditions use the full minimum_order_amount tag.
  type: "min_order_amount",
  market: "us",
  money: { amount: 500, currency: "usd" },
};
const legacyWindowCondition: PromotionConditionInput = {
  // @ts-expect-error Redemption windows use the redemption_window tag.
  type: "date_range",
  starts_at: 1,
  ends_at: 2,
};
const legacyMaximumUsesCondition: PromotionConditionInput = {
  // @ts-expect-error Redemption limits use the maximum_uses tag.
  type: "max_uses",
  count: 10,
};
const legacyCustomerLimitCondition: PromotionConditionInput = {
  // @ts-expect-error Per-Customer limits use the canonical tag.
  type: "max_uses_per_user",
  count: 1,
};

const supportedPromoCodeList: GetPromoCodesParams = {
  ids: [promoCodeContract.id],
  query: "SAVE",
  status: "active",
  limit: 20,
  cursor: "20",
  sort_field: "created_at",
  sort_direction: "desc",
  created_at_from: 1,
  created_at_to: 2,
};
const promoCodeListWithStartFrom: GetPromoCodesParams = {
  // @ts-expect-error Redemption-window bounds are not list endpoint filters.
  starts_at_from: 1,
};
const promoCodeListWithStartTo: GetPromoCodesParams = {
  // @ts-expect-error Redemption-window bounds are not list endpoint filters.
  starts_at_to: 1,
};
const promoCodeListWithExpiryFrom: GetPromoCodesParams = {
  // @ts-expect-error Expiry bounds are not list endpoint filters.
  expires_at_from: 1,
};
const promoCodeListWithExpiryTo: GetPromoCodesParams = {
  // @ts-expect-error Expiry bounds are not list endpoint filters.
  expires_at_to: 1,
};

const promotionDiscountAllocation: DiscountAllocation = {
  promotion_discount_id: itemPercentageDiscountId,
  amount: 500,
};
const automaticDiscountAllocation: DiscountAllocation = {
  promotion_discount_id: null,
  amount: 500,
};
// @ts-expect-error Allocation provenance is a required nullable wire key.
const allocationWithoutProvenance: DiscountAllocation = { amount: 500 };
const allocationWithLegacyProvenance: DiscountAllocation = {
  promotion_discount_id: null,
  amount: 500,
  // @ts-expect-error Allocations point to the embedded PromotionDiscount ID.
  discount_application_id: itemPercentageDiscountId,
};
// @ts-expect-error Store closure is a system-only refund reason.
const systemRefundReasonFromClient: RefundRequestReason = "store_closure";
const audienceTierPriceWithProvider: AudienceTierPriceInput = {
  currency: "usd",
  amount: 1200,
  status: "active",
  // @ts-expect-error payment-provider bindings are server-owned output fields.
  provider: { type: "stripe", price_id: "price_untrusted" },
};
const smtpImapMailboxProviderInput: SmtpImapMailboxProviderInput = {
  type: "smtp_imap",
  preset: "custom",
  smtp_host: "smtp.example.com",
  smtp_port: 587,
  smtp_security: "start_tls",
  imap_host: "imap.example.com",
  imap_port: 993,
  imap_security: "tls",
  username: "mailbox@example.com",
  sync_enabled: true,
  sync_interval_seconds: 300,
};
// @ts-expect-error SMTP/IMAP mailbox providers require an explicit discriminator.
const smtpImapMailboxProviderWithoutType: SmtpImapMailboxProviderInput = {
  preset: "custom",
  smtp_host: "smtp.example.com",
  smtp_port: 587,
  smtp_security: "start_tls",
  imap_host: "imap.example.com",
  imap_port: 993,
  imap_security: "tls",
  username: "mailbox@example.com",
  sync_enabled: true,
  sync_interval_seconds: 300,
};
void smtpImapMailboxProviderInput;
void smtpImapMailboxProviderWithoutType;

const suppressionInput: CreateSuppressionParams = {
  target: { type: "email", email: "person@example.com" },
  scope: { type: "campaign", campaign_id: "campaign-contract" },
  reason: "manual",
};
declare const suppression: Suppression;
if (suppression.target.type === "customer") {
  const suppressionCustomerId: string = suppression.target.customer_id;
  void suppressionCustomerId;
}
// @ts-expect-error suppression identity is expressed only by its tagged target.
suppression.target_key;
// @ts-expect-error suppression ownership scope is expressed only by its tagged scope.
suppression.campaign_id;
declare const digitalAsset: DigitalAsset;
// @ts-expect-error object storage keys are internal and never exposed by Admin responses.
digitalAsset.object_key;
const digitalPrice: Price = {
  currency: "usd",
  market: "us",
  amount: 2500,
  compare_at: null,
  audience_id: null,
};
const digitalProductContract: DigitalProduct = {
  id: "digital-product-contract",
  store_id: "store-contract",
  key: "digital-product-key",
  slugs: { en: "digital-product" },
  blocks: [],
  classifications: [],
  prices: [digitalPrice],
  asset_ids: ["0198f8f7-2f25-4a14-86bb-64efc56e1a11"],
  status: "active",
  created_at: 1,
  updated_at: 2,
};
const storefrontDigitalProductContract: StorefrontDigitalProduct = {
  id: digitalProductContract.id,
  key: digitalProductContract.key,
  slugs: digitalProductContract.slugs,
  blocks: [],
  classifications: [],
  prices: [digitalPrice],
};
const digitalLibraryItemContract: DigitalLibraryItem = {
  digital_product_id: digitalProductContract.id,
  product_key: digitalProductContract.key,
  slugs: digitalProductContract.slugs,
};
const digitalLibraryProductContract: DigitalLibraryProduct = {
  ...digitalLibraryItemContract,
  blocks: [],
  classifications: [],
  asset_ids: digitalProductContract.asset_ids,
};
const createDigitalProductContract: CreateDigitalProductParams = {
  key: digitalProductContract.key,
  slugs: digitalProductContract.slugs,
  blocks: [],
  classifications: [],
  prices: [digitalPrice],
  asset_ids: digitalProductContract.asset_ids,
  status: "draft",
};
const updateDigitalProductContract: UpdateDigitalProductParams = {
  digital_product_id: digitalProductContract.id,
  slugs: { en: "digital-product-updated" },
  prices: [digitalPrice],
  status: "archived",
};
const findDigitalProductsContract: FindDigitalProductsParams = {
  ids: [digitalProductContract.id],
  classification_query: [
    {
      classification_id: "classification-contract",
      query: [{ type: "boolean", key: "featured", value: true }],
    },
  ],
  match_all: true,
  status: "active",
  query: 25,
  limit: 20,
  cursor: "cursor-contract",
  sort_field: "price",
  sort_direction: "asc",
  created_at_from: 1,
  created_at_to: 2,
};
const digitalProductLookupContract: GetStorefrontDigitalProductParams = {
  identifier: digitalProductContract.key,
};
const digitalLibraryLookupContract: GetDigitalLibraryProductParams = {
  digital_product_id: digitalProductContract.id,
};
const cartDigitalItemContract: CartDigitalItem = {
  id: "cart-digital-contract",
  digital_product_id: digitalProductContract.id,
  form_submission_id: null,
  price_override: digitalPrice,
};
const orderDigitalSnapshotContract: OrderDigitalSnapshot = {
  product_key: digitalProductContract.key,
  price: digitalPrice,
};
const productQuoteInputContract: ProductQuoteInput = {
  product_id: "product-contract",
  variant_id: "variant-contract",
  quantity: 1,
  form_submission_id: "form-submission-product-contract",
  price: digitalPrice,
};
const bookingQuoteInputContract: BookingQuoteInput = {
  booking_offering_id: "booking-offering-contract",
  requested_interval: { from: 1_800_000_000, to: 1_800_003_600 },
  form_submission_id: "form-submission-booking-contract",
  price_override: digitalPrice,
};
const digitalQuoteInputContract: DigitalProductQuoteInput = {
  digital_product_id: digitalProductContract.id,
  form_submission_id: "form-submission-digital-contract",
  price_override: digitalPrice,
};
const quoteInputContract: GetQuoteParams = {
  market: "us",
  customer_id: "customer-contract",
  products: [productQuoteInputContract],
  bookings: [bookingQuoteInputContract],
  digital: [digitalQuoteInputContract],
};
const cartProductInputContract: CartProductInput = {
  product_id: "product-contract",
  variant_id: "variant-contract",
  quantity: 1,
  form_submission_id: "form-submission-product-contract",
};
const cartDigitalInputContract: CartDigitalItemInput = {
  digital_product_id: digitalProductContract.id,
  form_submission_id: "form-submission-digital-contract",
};
const trustedCartProductInputContract: TrustedCartProductInput = {
  ...cartProductInputContract,
  price_override: digitalPrice,
};
const trustedCartBookingInputContract: TrustedCartBookingInput = {
  ...bookingQuoteInputContract,
};
const trustedCartDigitalInputContract: TrustedCartDigitalItemInput = {
  ...cartDigitalInputContract,
  price_override: digitalPrice,
};
const digitalProductStatusContract: DigitalProductStatus =
  digitalProductContract.status;
// @ts-expect-error Digital Product localized records use slugs.
digitalProductContract.slug;
// @ts-expect-error Digital Product create input has no singular localized map.
type LegacyDigitalProductCreateSlug = CreateDigitalProductParams["slug"];
// @ts-expect-error Digital Product update input has no singular localized map.
type LegacyDigitalProductUpdateSlug = UpdateDigitalProductParams["slug"];
// @ts-expect-error Storefront Digital Product lookup uses the server route identifier.
const legacyDigitalProductLookup: GetStorefrontDigitalProductParams = { id: digitalProductContract.id };
// @ts-expect-error Library routes require a Digital Product ID.
const invalidDigitalLibraryLookup: GetDigitalLibraryProductParams = { identifier: digitalProductContract.key };
// @ts-expect-error Digital Product status is draft, active, or archived.
const invalidDigitalProductStatus: DigitalProductStatus = "enabled";
void storefrontDigitalProductContract;
void digitalLibraryProductContract;
void createDigitalProductContract;
void updateDigitalProductContract;
void findDigitalProductsContract;
void digitalProductLookupContract;
void digitalLibraryLookupContract;
void cartDigitalItemContract;
void orderDigitalSnapshotContract;
void quoteInputContract;
void trustedCartProductInputContract;
void trustedCartBookingInputContract;
void trustedCartDigitalInputContract;
void digitalProductStatusContract;
void legacyDigitalProductLookup;
void invalidDigitalLibraryLookup;
void invalidDigitalProductStatus;
declare const mailbox: Mailbox;
if (mailbox.provider.type === "smtp_imap") {
  const hasCredential: boolean = mailbox.provider.password_configured;
  const safeIssueType: string | undefined = mailbox.provider.sync_issue?.type;
  void hasCredential;
  void safeIssueType;
}
void suppressionInput;

const clearCartAddresses: UpdateCartParams = {
  id: "cart-contract",
  shipping_address: null,
  billing_address: null,
};

const inventoryInput: ProductInventoryInput = {
  store_location_id: "location-contract",
  on_hand: 10,
};
const createProductInput: CreateProductParams = {
  key: "canonical-product",
  slugs: { en: "canonical-product" },
  variants: [
    {
      prices: [],
      inventory: [inventoryInput],
      attributes: [],
      requires_shipping: true,
      weight_grams: 500,
    },
  ],
};
const updateProductInput: UpdateProductParams = {
  id: "product-contract",
  slugs: { en: "updated-product" },
  variants: [
    {
      id: "variant-contract",
      inventory: [inventoryInput],
      weight_grams: null,
    },
  ],
  status: "archived",
};
void createProductInput;
void updateProductInput;
const zoneInput: MarketZoneInput = {
  countries: ["US"],
  states: [],
  postal_codes: [],
  tax_bps: 0,
  shipping_methods: [],
};
const collectionById: GetCollectionParams = { id: "collection-contract" };
const collectionByKey: GetCollectionParams = {
  key: "articles",
  store_id: "store-contract",
};
// @ts-expect-error collection lookup requires exactly one identifier.
const collectionWithoutIdentifier: GetCollectionParams = {};
// @ts-expect-error collection lookup cannot mix an ID and key.
const ambiguousCollection: GetCollectionParams = {
  id: "collection-contract",
  key: "articles",
};

const localizedTitleBlock: Block = {
  id: "title",
  key: "title",
  type: "object",
  value: {
    en: {
      id: "title-en",
      key: "en",
      type: "text",
      value: "Welcome",
    },
  },
};
const markdownBlock: Block = {
  id: "body",
  key: "body",
  type: "markdown",
  value: "# Welcome",
};
const formBlock: FormBlock = {
  id: "contact-form",
  key: "contact_form",
  type: "form",
  value: "form-contract",
};
const formBlockSchema: BlockSchema = {
  id: "contact-form-schema",
  key: "contact_form",
  type: "form",
  required: false,
  properties: { on_delete: "set_null" },
  children: [],
};
const legacyMarkdownMap: Block = {
  id: "legacy-body",
  key: "legacy_body",
  type: "markdown",
  // @ts-expect-error Markdown Blocks have one scalar string value.
  value: { en: "# Legacy" },
};
const blockWithValueProperties: Block = {
  id: "legacy-title",
  key: "legacy_title",
  type: "text",
  // @ts-expect-error Block values never carry schema properties.
  properties: {},
  value: "Legacy",
};
const classificationSchema: ClassificationSchema = {
  id: "classification-schema-industry",
  key: "industry",
  type: "text",
  value: ["software", "services"],
  min: null,
};
const classificationFieldQuery: ClassificationFieldQuery = {
  type: "number",
  key: "team_size",
  operation: "greater_than_or_equal",
  value: 10,
};
const classificationEntry: ClassificationEntry = {
  classification_id: "classification-contract",
  fields: [
    {
      id: "classification-field-industry",
      key: "industry",
      type: "text",
      value: ["software"],
    },
  ],
};
void localizedTitleBlock;
void markdownBlock;
void formBlock;
void formBlockSchema;
void legacyMarkdownMap;
void blockWithValueProperties;
void classificationSchema;
void classificationFieldQuery;
void classificationEntry;

const typedRequestOptions: RequestOptions<{ ok: true }> = {
  params: { filters: [{ type: "text", key: "title", values: ["Arky"] }] },
  transformRequest: (data: unknown) => data,
  onSuccess: ({ data }) => {
    const requestSucceeded: true = data.ok;
    void requestSucceeded;
  },
  onError: ({ error }) => {
    if (error instanceof Error) error.message;
  },
};
const unsafeRequestTransform: RequestOptions = {
  // @ts-expect-error request transforms must accept unknown input safely.
  transformRequest: (data: string) => data,
};
// @ts-expect-error inventory persistence IDs are assigned by the server.
inventoryInput.product_id = "product-contract";
// @ts-expect-error market ownership is assigned by the server.
zoneInput.market_id = "market-contract";

declare const storefrontClient: ReturnType<typeof createStorefront>;
storefrontClient.classification.get({ key: "topics" });
// @ts-expect-error Classification is a top-level module, not a CMS child.
storefrontClient.cms.classification;
declare const adminClient: ReturnType<typeof createAdmin>;
const bookingItemLifecycleParams: BookingItemLifecycleParams = {
  order_id: "order-contract",
  order_booking_item_id: "order-booking-item-contract",
};
const adminBookingCancellation: Promise<Order> =
  adminClient.eshop.order.cancelBookingItem(bookingItemLifecycleParams);
const adminBookingCompletion: Promise<Order> =
  adminClient.eshop.order.completeBookingItem(bookingItemLifecycleParams);
const adminBookingNoShow: Promise<Order> =
  adminClient.eshop.order.markBookingItemNoShow(bookingItemLifecycleParams);
const storefrontBookingCancellation: Promise<StorefrontDto<Order>> =
  storefrontClient.eshop.order.cancelBookingItem(bookingItemLifecycleParams);
// @ts-expect-error A verified owning Customer cannot complete a booking item.
storefrontClient.eshop.order.completeBookingItem(bookingItemLifecycleParams);
// @ts-expect-error A verified owning Customer cannot mark a booking item as a no-show.
storefrontClient.eshop.order.markBookingItemNoShow(bookingItemLifecycleParams);
const classificationChildren: Promise<Classification[]> =
  adminClient.classification.getChildren({ id: "classification-contract" });
adminClient.classification.get({ id: "classification-contract" });
// @ts-expect-error Admin Classification lookup uses its UUID, not a derived key.
adminClient.classification.get({ key: "topics" });
// @ts-expect-error Classification is a top-level module, not a CMS child.
adminClient.cms.classification;
void classificationChildren;
const storefrontBookingOfferings: Promise<StorefrontDto<BookingOffering>[]> =
  storefrontClient.eshop.bookingOffering.find({
    booking_service_id: "booking-service-contract",
  });
const bookingResources: Promise<StorefrontDto<PaginatedResponse<BookingResource>>> =
  storefrontClient.eshop.bookingResource.find({
    booking_service_id: "booking-service-contract",
  });
const bookingServices: Promise<StorefrontDto<PaginatedResponse<BookingService>>> =
  storefrontClient.eshop.bookingService.find({ status: "active" });
declare const bookingServiceContract: BookingService;
declare const bookingResourceContract: BookingResource;
const bookingServiceEnglishSlug: string = bookingServiceContract.slugs.en;
const bookingResourceEnglishSlug: string = bookingResourceContract.slugs.en;
// @ts-expect-error Booking Service records no longer expose the singular persisted field.
bookingServiceContract.slug;
// @ts-expect-error Booking Resource records no longer expose the singular persisted field.
bookingResourceContract.slug;
const requestedInterval: TimeRange = { from: 1_800_000_000, to: 1_800_003_600 };
const bookingCartInput: CartBookingInput = {
  booking_offering_id: "booking-offering-contract",
  requested_interval: requestedInterval,
  form_submission_id: "form-submission-contract",
};
const cartProductItemContract: CartProductItem = {
  id: "cart-product-item-contract",
  product_id: "product-contract",
  variant_id: "variant-contract",
  quantity: 1,
  form_submission_id: "form-submission-product-contract",
  price_override: digitalPrice,
};
const cartBookingItemContract: CartBookingItem = {
  id: "cart-booking-item-contract",
  booking_offering_id: bookingCartInput.booking_offering_id,
  requested_interval: requestedInterval,
  form_submission_id: bookingCartInput.form_submission_id ?? null,
  price_override: null,
};
const canonicalCartContract: Cart = {
  id: "cart-contract",
  store_id: "store-contract",
  customer_id: "customer-contract",
  customer_session_id: "customer-session-contract",
  token: "cart-token-contract",
  status: "active",
  origin: "storefront",
  created_by_account_id: null,
  market: "us",
  product_items: [cartProductItemContract],
  booking_items: [cartBookingItemContract],
  digital_items: [cartDigitalItemContract],
  shipping_address: null,
  billing_address: null,
  promo_code: null,
  payment_provider_id: null,
  shipping_method_id: null,
  converted_order_id: null,
  item_count: 3,
  last_action_at: 1,
  abandoned_at: null,
  created_at: 1,
  updated_at: 1,
};
// @ts-expect-error Form submissions belong to individual Cart items.
canonicalCartContract.forms;
declare const embeddedBookingItem: OrderBookingItem;
const embeddedOfferingId: string = embeddedBookingItem.booking_offering_id;
// @ts-expect-error The legacy booking Service Provider facade was removed.
storefrontClient.eshop.service;
void storefrontBookingOfferings;
void bookingResources;
void bookingServices;
void bookingCartInput;
void canonicalCartContract;
void embeddedOfferingId;
void bookingItemLifecycleParams;
void adminBookingCancellation;
void adminBookingCompletion;
void adminBookingNoShow;
void storefrontBookingCancellation;
void bookingServiceEnglishSlug;
void bookingResourceEnglishSlug;
declare const storefrontProduct: Awaited<
  ReturnType<typeof storefrontClient.eshop.product.get>
>;
declare const storefrontCart: Awaited<
  ReturnType<typeof storefrontClient.eshop.cart.current>
>;
declare const storefrontSupport: Awaited<
  ReturnType<typeof storefrontClient.support.startConversation>
>;
declare const storefrontVerification: Awaited<
  ReturnType<typeof storefrontClient.customer.verify>
>;
declare const nestedStorefrontIdentification: Awaited<
  ReturnType<typeof storefrontClient.customer.identify>
>;
// @ts-expect-error Store ownership is not exposed by public catalog DTOs.
storefrontProduct.store_id;
// @ts-expect-error Nested Store ownership is not exposed by public inventory DTOs.
storefrontProduct.variants[0].inventory[0].store_id;
// @ts-expect-error Store ownership is not exposed by public cart DTOs.
storefrontCart.store_id;
// @ts-expect-error Store ownership is not exposed by public support DTOs.
storefrontSupport.conversation.store_id;
// @ts-expect-error issued credentials are nested under the immutable Session variant.
storefrontVerification.token;
// @ts-expect-error issued credentials are nested under the immutable Session variant.
nestedStorefrontIdentification.token;
const userAuthoredStoreId: unknown =
  storefrontSupport.conversation.channel_metadata.store_id;
// @ts-expect-error Market context is sent in X-Arky-Market, not cart bodies.
storefrontClient.eshop.cart.current({ market: "ita" });

type StorefrontOpaqueContract = StorefrontDto<{
  store_id: string;
  outside: {
    store_id: string;
    child: { store_id: string };
    payload: { store_id: string };
  };
  attributes: { store_id: string };
  blocks: Array<{ store_id: string }>;
  context: { store_id: string };
  data: { store_id: string };
  fields: { store_id: string };
  metadata: { store_id: string };
  payload: { store_id: string };
  properties: { store_id: string };
  schema: { store_id: string };
  value: { store_id: string };
}>;
declare const storefrontOpaqueContract: StorefrontOpaqueContract;
// @ts-expect-error Top-level routing Store IDs are stripped.
storefrontOpaqueContract.store_id;
// @ts-expect-error Routing Store IDs outside opaque user JSON are stripped.
storefrontOpaqueContract.outside.store_id;
// @ts-expect-error Routing Store IDs remain stripped recursively outside opaque user JSON.
storefrontOpaqueContract.outside.child.store_id;
const preservedOpaqueStoreIds: string[] = [
  storefrontOpaqueContract.attributes.store_id,
  storefrontOpaqueContract.blocks[0].store_id,
  storefrontOpaqueContract.context.store_id,
  storefrontOpaqueContract.data.store_id,
  storefrontOpaqueContract.fields.store_id,
  storefrontOpaqueContract.metadata.store_id,
  storefrontOpaqueContract.payload.store_id,
  storefrontOpaqueContract.properties.store_id,
  storefrontOpaqueContract.schema.store_id,
  storefrontOpaqueContract.value.store_id,
  storefrontOpaqueContract.outside.payload.store_id,
];
void preservedOpaqueStoreIds;

initialize(`arky_pk_${"a".repeat(42)}A`, {
  apiUrl: "http://localhost:8000",
  locale: "it",
  market: "ita",
});
// @ts-expect-error storefront initialization accepts a publishable key, not connection fields.
initialize({ baseUrl: "http://localhost:8000", storeId: "store-contract" });

declare const initializedStorefront: ReturnType<typeof initialize>;
initializedStorefront.classification.get({ key: "topics" });
// @ts-expect-error Classification is a top-level module, not a CMS child.
initializedStorefront.cms.classification;
const typedFormValues: FormValues = {
  name: "Jane",
  guests: 2,
  accepted: false,
  date: 1_725_000_000,
  location: { coordinates: { lat: 43.8563, lon: 18.4131 } },
  channels: ["email"],
};
initializedStorefront.cms.form.submitByKey({
  key: "contact-form",
  values: typedFormValues,
});
initializedStorefront.cms.form.submitByKey({
  key: "contact-form",
  // @ts-expect-error Store IDs are not part of storefront request inputs.
  store_id: "store-contract",
  values: typedFormValues,
});
initializedStorefront.cms.form.submitByKey({
  key: "contact-form",
  values: {
    // @ts-expect-error form values cannot contain arbitrary objects.
    invalid: new Date(),
  },
});
const textFormSchema: FormSchema = {
  id: "field-name",
  key: "name",
  type: "text",
  required: true,
};
const textFormField: FormField = {
  id: "field-name",
  key: "name",
  type: "text",
  value: "Jane",
};
// @ts-expect-error text fields require string values.
const invalidTextFormField: FormField = {
  id: "field-name",
  key: "name",
  type: "text",
  value: 42,
};
void textFormSchema;
void textFormField;
void invalidTextFormField;
void mediaContract;
void mediaWithoutCreationKey;

const subscribeResult: AudienceSubscribeResponse = {
  payment_action: { type: "none" },
  payment: {
    id: "payment-contract",
    tier_id: "tier-contract",
    amount: 1200,
    currency: "usd",
    interval: { period: "month", count: 1 },
    status: "unknown",
  },
  member: {
    id: "member-contract",
    enrollment_status: "pending",
    delivery_status: "subscribed",
    created_at: 1,
    updated_at: 1,
  },
};
const subscribePaymentStatus: AudiencePaymentStatus | undefined =
  subscribeResult.payment?.status;
const audiencePromotionSnapshot: AudiencePromotionSnapshot = {
  promo_code_id: "promo-contract",
  code: "WELCOME10",
  discount: 250,
};
// @ts-expect-error promotion usage is internal checkout state, not public payment history.
audiencePromotionSnapshot.usage_status;

declare const storefrontIdentify: StorefrontIdentifyResult;
const storefrontEntryIdentify: StorefrontEntryIdentifyResult =
  storefrontIdentify;
// @ts-expect-error challenge identifiers were removed; verification is code-only.
storefrontIdentify.challenge_id;
// @ts-expect-error issued credentials are nested under the Session variant.
storefrontIdentify.token;
// @ts-expect-error storefront Customer DTOs do not expose tenant routing IDs.
storefrontIdentify.customer.store_id;
if (storefrontIdentify.session.type === "visitor") {
  const issuedVisitorToken: string = storefrontIdentify.session.token;
  void issuedVisitorToken;
}

declare const paymentStorefront: ReturnType<typeof initialize>;
// @ts-expect-error hosted Checkout removed the browser Stripe controller.
paymentStorefront.eshop.cart.payment;

const accountingTaxLine: TaxLine = {
  title: "Tax",
  rate_bps: 2_000,
  amount: 250,
  taxable_base: 1_250,
  included_in_price: false,
  jurisdiction_country: "US",
  jurisdiction_region: null,
  jurisdiction_postal_code: null,
};
// @ts-expect-error no provider tax identity is fabricated by Arky.
accountingTaxLine.tax_rate_id;
// @ts-expect-error tax provenance is already expressed by typed line context.
accountingTaxLine.source;
const promoSnapshot: OrderPromoCodeSnapshot = {
  id: "promo-contract",
  code: "SAVE10",
};
const orderMoney: OrderMoney = {
  currency: "usd",
  market: "us",
  subtotal: 1250,
  shipping: 0,
  discount: 0,
  tax_total: 250,
  total: 1250,
  promo_code: promoSnapshot,
  zone_id: null,
  shipping_method_id: null,
};
// @ts-expect-error capture_method is transaction/provider state, not order money.
orderMoney.capture_method;

const paymentAmounts: PaymentAmounts = {
  currency: "usd",
  total: 1_250,
  paid: 0,
  refund_pending: 0,
  refunded: 0,
};
const stripeOrderPaymentProvider: OrderPaymentProvider = {
  type: "stripe",
  payment_provider_id: "payment-provider-contract",
  checkout_expires_at: 1_800_000_000,
  checkout_session_id: "checkout-session-contract",
  payment_intent_id: null,
  checkout_session_status: "open",
  checkout_payment_status: "unpaid",
};
const cashOrderPaymentProvider: OrderPaymentProvider = {
  type: "cash_on_delivery",
  payment_provider_id: "payment-provider-cash-contract",
  marked_paid_by_account_id: null,
};
const orderPayment: OrderPayment = {
  id: "order-payment-contract",
  store_id: "store-contract",
  order_id: "order-contract",
  provider: stripeOrderPaymentProvider,
  status: "requires_action",
  amounts: paymentAmounts,
  requested_at: 1,
  completed_at: null,
  created_at: 1,
  updated_at: 2,
  safe_error: null,
};
const zeroTotalCheckout: OrderCheckoutResult = {
  order_id: "order-zero-total-contract",
  number: "1000",
  payment_action: { type: "none" },
  payment: null,
};
const markCashOnDeliveryPaid: MarkCashOnDeliveryPaidParams = {
  order_id: "order-contract",
};
// @ts-expect-error payment kind is the provider union tag, not a flat type.
orderPayment.type;
// @ts-expect-error amounts are grouped into the canonical amounts object.
orderPayment.amount;
// @ts-expect-error payment records do not expose persistence versions.
orderPayment.version;
// @ts-expect-error provider checkout identity uses checkout_session_id.
stripeOrderPaymentProvider.checkout_id;
const missingConnectedAccountCheckout: OrderCheckoutResult = {
  order_id: "order-stripe-contract",
  number: "1002",
  // @ts-expect-error Commerce checkout actions require a connected account.
  payment_action: {
    type: "stripe_embedded_checkout",
    publishable_key: "pk_test_contract",
    client_secret: "cs_test_contract",
    expires_at: 2,
  },
  payment: orderPayment,
};

const shippingLine: OrderShippingLine = {
  id: "shipping-line-contract",
  shipping_method_id: "shipping-method-contract",
  title: "Standard",
  money: {
    unit_price: 500,
    subtotal: 500,
    discount_allocations: [],
    discount_total: 0,
    taxable_base: 500,
    tax_lines: [],
    tax_total: 0,
    total: 500,
  },
};
// @ts-expect-error shipping method identity has one canonical field.
shippingLine.code;
const embeddedOrderProductItem: OrderProductItem = {
  id: "order-product-item-contract",
  product_id: "product-contract",
  variant_id: "variant-contract",
  quantity: 1,
  inventory_allocations: [
    {
      store_location_id: "store-location-contract",
      quantity: 1,
      cancelled_quantity: 0,
    },
  ],
  form_submission_id: "form-submission-product-contract",
  snapshot: {
    product_key: "product-contract",
    variant_sku: null,
    variant_attributes: [],
    price: digitalPrice,
    requires_shipping: true,
    weight_grams: 750,
  },
  status: { status: "confirmed" },
  money: shippingLine.money,
  created_at: 1,
  updated_at: 1,
};
const embeddedOrderBookingItem: OrderBookingItem = {
  id: "order-booking-item-contract",
  customer_session_id: null,
  booking_offering_id: "booking-offering-contract",
  booking_service_id: "booking-service-contract",
  booking_resource_id: "booking-resource-contract",
  interval: requestedInterval,
  capacity_intervals: [requestedInterval],
  form_submission_id: "form-submission-booking-contract",
  reminders: [],
  snapshot: {
    service_key: "service-contract",
    resource_key: "resource-contract",
    timezone: "Europe/Sarajevo",
    price: digitalPrice,
  },
  status: { status: "confirmed" },
  money: shippingLine.money,
  created_at: 1,
  updated_at: 1,
};
const embeddedOrderDigitalItem: OrderDigitalItem = {
  id: "order-digital-item-contract",
  digital_product_id: digitalProductContract.id,
  form_submission_id: "form-submission-digital-contract",
  snapshot: orderDigitalSnapshotContract,
  status: { status: "confirmed" },
  money: shippingLine.money,
  created_at: 1,
  updated_at: 1,
};
const orderContract: Order = {
  id: "order-contract",
  number: "1002",
  store_id: "store-contract",
  source_cart_id: canonicalCartContract.id,
  customer_id: "customer-contract",
  customer_session_id: "customer-session-contract",
  status: "confirmed",
  payment_id: orderPayment.id,
  product_items: [embeddedOrderProductItem],
  booking_items: [embeddedOrderBookingItem],
  digital_items: [embeddedOrderDigitalItem],
  money: orderMoney,
  shipping_lines: [shippingLine],
  shipping_address: null,
  billing_address: null,
  created_at: 1,
  updated_at: 2,
};
const nullableOrderPaymentId: string | null = orderContract.payment_id;
const cancelEmbeddedProductItem: CancelOrderProductItemParams = {
  order_id: orderContract.id,
  order_product_item_id: embeddedOrderProductItem.id,
  quantity: 1,
};
const forbiddenBookingRewrite: UpdateOrderParams = {
  id: orderContract.id,
  // @ts-expect-error persisted booking items change only through dedicated lifecycle commands.
  booking_items: [embeddedOrderBookingItem],
};
// @ts-expect-error Order children are embedded and no longer use persistence versions.
orderContract.version;
// @ts-expect-error Order facts never duplicate Customer verification state.
orderContract.verified;
// @ts-expect-error Form submissions belong to embedded Order items.
orderContract.forms;
// @ts-expect-error fulfillment is represented by dedicated FulfillmentOrder resources.
orderContract.fulfillment_status;
const fulfillmentOrderStatus: FulfillmentOrderStatus = "open";
declare const cart: Cart;
// @ts-expect-error cart recovery is not a product lifecycle in the current model.
cart.recovery_sent_at;

// @ts-expect-error refunds have their own lifecycle resource.
const embeddedRefundPaymentStatus: AudiencePaymentStatus = "refunded";
// @ts-expect-error the server never emits this callback status.
const codeReceivedCallback: SocialOAuthCallbackStatus = "code_received";

const safeSocialCredential: SocialConnectionCredential = {
  expires_at: null,
  scopes: ["posts.write"],
};
const unsafeSocialCredential: SocialConnectionCredential = {
  expires_at: null,
  scopes: [],
  // @ts-expect-error public social connection DTOs never contain provider secrets.
  access_token: "provider-secret",
};
const safeSocialConnectionData: SocialConnectionData = {
  credential: safeSocialCredential,
  destination: {
    external_account_id: "social-account",
    external_account_name: "Arky",
    handle: null,
    avatar_url: null,
  },
};
const tiktokConnectionType: SocialConnectionType = "tiktok_account";
const tiktokPrivacy: TiktokPrivacy = "private";
const tiktokContent: SocialPublicationContent = {
  type: "tiktok_account",
  caption: "Launch",
  video_media_id: "media-contract",
  privacy: tiktokPrivacy,
};
const tiktokInitializeEffect: SocialPublicationEffectRequest = {
  type: "tiktok_initialize_upload",
  media_id: "media-contract",
};
const tiktokUploadEffect: SocialPublicationEffectRequest = {
  type: "tiktok_upload",
  media_id: "media-contract",
  publish_id: "publish-contract",
  total_bytes: 1024,
  has_upload_session: true,
};
// @ts-expect-error the provider discriminator belongs to SocialConnection.type, not data.
safeSocialConnectionData.type;

declare const supportStart: SupportConversationStartResponse;
const supportCapability: string = supportStart.support_token;

const supportMessageNode: SupportAgentNode = {
  type: "message",
  text: "How can we help?",
  buttons: ["Billing"],
};
const supportInputNode: SupportAgentNode = {
  type: "input",
  prompt: "What is your email?",
  field: "email",
  input_type: "email",
  validation: null,
};
const supportEndNode: SupportAgentNode = {
  type: "action",
  action: { type: "end_conversation", message: "Thanks" },
};
// @ts-expect-error message nodes require their serialized text.
const invalidSupportMessageNode: SupportAgentNode = {
  type: "message",
  buttons: [],
};
const invalidSupportActionNode: SupportAgentNode = {
  type: "action",
  // @ts-expect-error end_conversation actions require a message.
  action: { type: "end_conversation" },
};
const supportDefinitionWithNoAi: SupportAgentDefinition = {
  id: "definition-contract",
  store_id: "store-contract",
  support_agent_id: "agent-contract",
  entry_node_id: "message",
  nodes: { message: supportMessageNode },
  edges: [],
  ai_config: null,
  created_at: 1,
  updated_at: 1,
};
const supportConversationWithNullableSession: SupportConversation = {
  id: "conversation-contract",
  store_id: "store-contract",
  agent_id: null,
  channel_id: null,
  channel_context: {
    type: "web",
    visitor_id: null,
    session_id: null,
  },
  current_node_id: null,
  customer_id: "customer-contract",
  customer_session_id: null,
  assigned_account_id: null,
  status: "active",
  variables: {},
  channel_metadata: {},
  created_at: 1,
  updated_at: 1,
};
const inboundSupportMessage: ReceiveSupportChannelMessageParams = {
  store_id: "store-contract",
  channel_id: "channel-contract",
  customer_id: "customer-contract",
  channel_context: {
    type: "email",
    from: "person@example.com",
    to: "support@example.com",
    subject: "Help",
    reply_to: "person@example.com",
    message_id: null,
    references: [],
  },
  content: "Help",
};
const storefrontSupportStart: NonNullable<
  Parameters<typeof storefrontClient.support.startConversation>[0]
> = { agent_key: "default" };
// @ts-expect-error storefront support provenance is derived from Customer auth.
storefrontSupportStart.customer_id;
// @ts-expect-error storefront support provenance is derived from Customer auth.
storefrontSupportStart.customer_session_id;
const supportMessageWithNullState: SupportMessage = {
  id: "message-contract",
  store_id: "store-contract",
  conversation_id: "conversation-contract",
  role: "system",
  content: "Hello",
  buttons: null,
  metadata: {},
  ai_response: null,
  created_at: 1,
  updated_at: 1,
};

const storefrontSupportMessage: StorefrontSendSupportMessageParams = {
  conversation_id: "conversation-contract",
  support_token: "a".repeat(64),
  message_id: "018f477d-1cae-4c12-bf12-123456789abc",
  input: { type: "text", content: "Help" },
};

const storefrontSupportRead: StorefrontGetSupportConversationParams = {
  conversation_id: "conversation-contract",
  support_token: "a".repeat(64),
  message_limit: 25,
};

const subscriptionStatus: StoreSubscriptionStatus = "pending";
const storeSubscriptionRead: StoreSubscription = {
  id: "d397ff50-690b-4da7-9fb9-17740e535d69",
  store_id: "store-contract",
  plan_access: null,
  status: subscriptionStatus,
  payment_action: { type: "none" },
  trial_started_at: null,
  created_at: 1,
  updated_at: 1,
};
const selectedStoreSubscription: StoreSubscription = {
  ...storeSubscriptionRead,
  payment_action: {
    type: "stripe_embedded_checkout",
    publishable_key: "pk_test_contract",
    client_secret: "cs_contract_secret_exact",
    stripe_account_id: null,
    expires_at: 2,
  },
};
const storefrontSubscriptionCheckoutAction: StorefrontEmbeddedCheckoutAction =
  selectedStoreSubscription.payment_action;
// @ts-expect-error durable provider identity is not part of the public wire DTO.
storeSubscriptionRead.provider;
// @ts-expect-error subscription payment context is no longer stored on this DTO.
storeSubscriptionRead.payment;
// @ts-expect-error subscription state uses the shared status field name.
storeSubscriptionRead.billing_status;
// @ts-expect-error selection does not persist a checkout reference.
storeSubscriptionRead.checkout_id;
// @ts-expect-error checkout state is not a subscription status.
const invalidStoreSubscriptionStatus: StoreSubscriptionStatus = "requires_action";

// @ts-expect-error storefront support messages require the capability token.
const supportMessageWithoutCapability: StorefrontSendSupportMessageParams = {
  conversation_id: "conversation-contract",
  message_id: "018f477d-1cae-4c12-bf12-123456789abc",
  input: { type: "text", content: "Help" },
};

const account: Account = {
  id: "account-contract",
  email: "operator@example.test",
  last_login_at: null,
  created_at: 1,
  updated_at: 1,
};
// @ts-expect-error Account lifecycle/onboarding was removed.
account.lifecycle;

const pendingAccountSessionResponse: PendingAccountSession = {
  session_id: "session-contract",
  verification_expires_at: 600,
};
const verifyPendingAccountSession: VerifyPendingAccountSessionParams = {
  session_id: pendingAccountSessionResponse.session_id,
  code: "123456",
};
const authToken: AuthToken = {
  id: pendingAccountSessionResponse.session_id,
  access_token: "account_access_contract",
  refresh_token: "account_refresh_contract",
  access_expires_at: 3_600,
  refresh_expires_at: 604_800,
  authenticated_at: 10,
  created_at: 1,
  updated_at: 10,
};
// @ts-expect-error an Active Account Session is proof of verification.
authToken.is_verified;

const accountAuthDelivery: EmailDeliveryType = {
  type: "platform_auth_code",
  data: {
    account_id: "account-contract",
    session_id: pendingAccountSessionResponse.session_id,
  },
};
const staleAccountAuthDelivery: EmailDeliveryType = {
  type: "platform_auth_code",
  // @ts-expect-error Account auth deliveries now reference the pending Session.
  data: {
    account_id: "account-contract",
    challenge_id: "challenge-contract",
  },
};

const pendingAccountSession: AccountSession = {
  id: "pending-session-contract",
  status: "pending_verification",
  verification_expires_at: 600,
  access_expires_at: null,
  refresh_expires_at: null,
  authenticated_at: null,
  revoked_at: null,
  created_at: 1,
  updated_at: 1,
};
const activeAccountSession: AccountSession = {
  id: "active-session-contract",
  status: "active",
  verification_expires_at: null,
  access_expires_at: 3_600,
  refresh_expires_at: 604_800,
  authenticated_at: 10,
  revoked_at: null,
  created_at: 1,
  updated_at: 10,
};
const revokedAccountSession: AccountSession = {
  id: "revoked-session-contract",
  status: "revoked",
  verification_expires_at: null,
  access_expires_at: null,
  refresh_expires_at: null,
  authenticated_at: null,
  revoked_at: 20,
  created_at: 1,
  updated_at: 20,
};
const terminalSessionStatus: AccountSessionStatus = "superseded";

const personalApiToken: AccountApiToken = {
  id: "api-token-contract",
  token_hint: "ract",
  name: "Local automation",
  status: "active",
  expires_at: 100,
  created_at: 1,
  updated_at: 1,
  revoked_at: null,
};
// Expiry is derived from expires_at; it is not a persisted status.
// @ts-expect-error Account API Token status is only active or revoked.
const expiredApiTokenStatus: AccountApiTokenStatus = "expired";
declare const customer: Customer;
declare const product: Product;
declare const productInventory: ProductInventory;
declare const productVariant: ProductVariant;
const productStatus: ProductStatus = product.status;
// @ts-expect-error Product status is the canonical draft/active/archived union.
const invalidProductStatus: ProductStatus = "enabled";
const productSlugs: Record<string, string> = product.slugs;
const productWeightGrams: number | null = productVariant.weight_grams;
const inventoryStoreLocationId: string = productInventory.store_location_id;
const inventoryOnHand: number = productInventory.on_hand;
const inventoryReserved: number = productInventory.reserved;
void productStatus;
void productSlugs;
void productWeightGrams;
void inventoryStoreLocationId;
void inventoryOnHand;
void inventoryReserved;
const shippingLabelRefund: ShippingLabelRefund = {
  id: "6ba7b812-9dad-41d1-80b4-00c04fd430c8",
  status: "succeeded",
  safe_error: null,
  requested_at: 2,
  completed_at: 3,
};
const shippingLabel: ShippingLabel = {
  id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
  status: "succeeded",
  label_url: "https://labels.example.test/label.pdf",
  postage: { amount: 895, currency: "usd" },
  platform_label_fee: { amount: 10, currency: "usd" },
  total: { amount: 905, currency: "usd" },
  requested_at: 1,
  completed_at: 2,
  refund: shippingLabelRefund,
  safe_error: null,
};
const fulfillmentOrder: FulfillmentOrder = {
  id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  status: "in_progress",
  destination: null,
  lines: [
    {
      id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
      order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
      quantity: 2,
      allocated_quantity: 2,
      fulfilled_quantity: 1,
    },
  ],
  created_at: 1,
  updated_at: 2,
};
const shipment: OrderShipment = {
  id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  fulfillment_order_id: fulfillmentOrder.id,
  origin_store_location_id: fulfillmentOrder.store_location_id,
  lines: [
    {
      order_product_item_id: fulfillmentOrder.lines[0].order_product_item_id,
      fulfillment_order_line_id: fulfillmentOrder.lines[0].id,
      quantity: 1,
    },
  ],
  status: "label_created",
  parcel: {
    length: 100,
    width: 75,
    height: 25,
    weight: 500,
    distance_unit: "mm",
    mass_unit: "g",
  },
  customs_declaration: null,
  carrier: "USPS",
  service: "priority",
  tracking_number: "9400000000000000000000",
  tracking_url: "https://tracking.example.test/9400000000000000000000",
  tracking_status_at: 2,
  label: shippingLabel,
  created_at: 1,
  updated_at: 2,
};
const shippingRate: ShippingRate = {
  id: "signed-rate-contract",
  carrier: "USPS",
  service: "priority",
  display_name: "USPS Priority",
  postage: { amount: 895, currency: "usd" },
  platform_label_fee: { amount: 10, currency: "usd" },
  total: { amount: 905, currency: "usd" },
  estimated_days: 3,
};
const shippingLabelCharge: ShippingLabelCharge = {
  id: "6ba7b815-9dad-41d1-80b4-00c04fd430c8",
  order_shipment_id: shipment.id,
  amount: shippingRate.total,
  status: "succeeded",
  safe_error: null,
  requested_at: 1,
  completed_at: 2,
  created_at: 1,
  updated_at: 2,
};
const chargeRefundReason: ShippingLabelChargeRefundReason = {
  type: "unused_label_refund",
  shipping_label_refund_id: shippingLabelRefund.id,
};
const shippingLabelChargeRefund: ShippingLabelChargeRefund = {
  id: "6ba7b816-9dad-41d1-80b4-00c04fd430c8",
  order_shipment_id: shipment.id,
  shipping_label_charge_id: shippingLabelCharge.id,
  reason: chargeRefundReason,
  amount: shippingLabelCharge.amount,
  status: "succeeded",
  safe_error: null,
  requested_at: 3,
  completed_at: 4,
  created_at: 3,
  updated_at: 4,
};
const shipmentStatus: OrderShipmentStatus = shipment.status;
const shipmentTrackingStatusAt: number | null = shipment.tracking_status_at;
const cancelledShippingStatus: OrderShipmentStatus = "cancelled";
const shippingRateRequest: GetShippingRatesParams = {
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  lines: [
    {
      order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
      quantity: 1,
    },
  ],
  parcel: {
    length: 100,
    width: 75,
    height: 25,
    weight: 500,
    distance_unit: "mm",
    mass_unit: "g",
  },
};
const createShipmentRequest: CreateOrderShipmentParams = {
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  rate_id: "signed-rate-contract",
  origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
  lines: [
    {
      order_product_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
      fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
      quantity: 1,
    },
  ],
  parcel: shippingRateRequest.parcel,
};
// @ts-expect-error FulfillmentOrder roots do not expose persistence versions.
fulfillmentOrder.version;
// @ts-expect-error FulfillmentOrder points to the canonical StoreLocation field.
fulfillmentOrder.location_id;
// @ts-expect-error Shipment roots do not expose persistence versions.
shipment.version;
// @ts-expect-error Shipment labels are provider-neutral.
shipment.shippo_label;
// @ts-expect-error provider rate identity remains inside the server label state.
shippingLabel.rate_id;
// @ts-expect-error merchant charge retries are orchestration state, not Domain truth.
shippingLabelCharge.attempt_count;
// @ts-expect-error public merchant charge DTOs do not expose provider identifiers.
shippingLabelCharge.provider;
// @ts-expect-error verification challenges are never part of the public account contract.
account.verification_codes;
// @ts-expect-error verification challenges are never part of the public Customer contract.
customer.verification_codes;
// @ts-expect-error variant order, not an is_default field, defines the configured default.
productVariant.is_default;
// @ts-expect-error Product localized routes use the canonical slugs map.
product.slug;
// @ts-expect-error ProductVariant weight is expressed in unsigned grams.
productVariant.weight;
// @ts-expect-error ProductInventory has one on_hand stock truth.
productInventory.available;
// @ts-expect-error ProductInventory references its StoreLocation explicitly.
productInventory.location_id;
// @ts-expect-error Product create inputs use slugs, never the removed singular map field.
type LegacyProductSlugInput = CreateProductParams["slug"];
// @ts-expect-error Inventory inputs set on_hand, never a mutable available field.
type LegacyInventoryAvailableInput = ProductInventoryInput["available"];
// @ts-expect-error Inventory inputs name the StoreLocation relationship explicitly.
type LegacyInventoryLocationInput = ProductInventoryInput["location_id"];

const trigger: WorkflowTriggerNode = {
  type: "trigger",
  delay_ms: 0,
};

const getNode: WorkflowHttpNode = {
  type: "http",
  method: "get",
  url: "https://api.example.test/orders",
  headers: { Accept: "application/json" },
  timeout_ms: 30_000,
  delay_ms: 0,
  retries: 3,
  retry_delay_ms: 1_000,
};

const mutationNode: WorkflowHttpNode = {
  type: "http",
  method: "post",
  url: "https://api.example.test/orders",
  headers: { "Content-Type": "application/json" },
  body: { id: "order-1" },
  timeout_ms: 30_000,
  delay_ms: 0,
  retries: 0,
  retry_delay_ms: 0,
};

// @ts-expect-error required HTTP timing and header fields cannot be omitted.
const missingHttpFields: WorkflowHttpNode = {
  type: "http",
  method: "get",
  url: "https://api.example.test/orders",
  retries: 0,
  retry_delay_ms: 0,
};

// @ts-expect-error mutating HTTP nodes require a literal zero retry count.
const retryingMutation: WorkflowHttpNode = {
  type: "http",
  method: "delete",
  url: "https://api.example.test/orders/order-1",
  headers: {},
  timeout_ms: 30_000,
  delay_ms: 0,
  retries: 1,
  retry_delay_ms: 0,
};

// @ts-expect-error mutating HTTP nodes require a literal zero retry delay.
const delayedMutationRetry: WorkflowHttpNode = {
  type: "http",
  method: "patch",
  url: "https://api.example.test/orders/order-1",
  headers: { "Content-Type": "application/json" },
  timeout_ms: 30_000,
  delay_ms: 0,
  retries: 0,
  retry_delay_ms: 1_000,
};

const canonicalPage: PaginatedResponse<{ id: string }> = {
  items: [{ id: "item-1" }],
  cursor: "cursor-2",
};

const activityPageParams: FindActivitiesParams = {
  store_id: "store-contract",
  customer_id: "customer-contract",
  limit: 20,
  cursor: "cursor-contract",
};
type AssertNever<T extends never> = T;
type UnsupportedActivityFilterKeys = AssertNever<
  Extract<keyof FindActivitiesParams, "query" | "types" | "from" | "to">
>;
type RemovedContactActionFilterKey = AssertNever<
  Extract<keyof FindCustomersParams, "has_action">
>;
type RemovedExperimentActionGoalKey = AssertNever<
  Extract<keyof CreateExperimentParams, "goal_action_key">
>;

const activityContext: ActivityContext = {
  location: { country_code: "BA", city: "Sarajevo" },
  device: { device_type: "desktop", browser: "Firefox" },
  session: { idx: 1 },
};
const activityData: ActivityData = {
  type: "tracked",
  value: {
    key: "page.view",
    payload: { path: "/products/example" },
    context: activityContext,
  },
};
const opportunityActivityData: ActivityData = {
  type: "opportunity",
  value: {
    type: "lead",
    stage: "new",
    suggested_next_action: "Reply to the contact",
    source: { type: "manual" },
  },
};
const activity: Activity = {
  id: "activity-contract",
  store_id: "store-contract",
  customer_id: "customer-contract",
  customer_session_id: "customer-session-contract",
  key: "page.view",
  type: "tracked",
  preview_text: "Viewed product",
  occurred_at: 1,
  created_at: 1,
  data: activityData,
};
// @ts-expect-error immutable Activity facts do not expose update timestamps.
activity.updated_at;
const storefrontActivity: StorefrontActivity = {
  customer_id: "customer-contract",
  customer_session_id: "customer-session-contract",
  key: "page.view",
  payload: { path: "/products/example" },
  created_at: 1,
};
const trackActivity: TrackActivityParams = {
  key: "page.view",
  payload: { path: "/products/example" },
};
const commonActivityKey: CommonActivityKey = COMMON_ACTIVITY_KEYS[0];
const activityContactFilter: FindCustomersParams = { has_activity: true };
const experiment: Experiment = {
  id: "experiment-contract",
  store_id: "store-contract",
  key: "homepage-hero",
  status: "running",
  version: 1,
  goal_activity_key: "checkout.started",
  attribution_window_days: 7,
  variants: [{ key: "control", weight: 100 }],
  created_at: 1,
  updated_at: 1,
};
const createExperiment: CreateExperimentParams = {
  key: "homepage-hero",
  goal_activity_key: "checkout.started",
  variants: [{ key: "control", weight: 100 }],
};
const experimentUse: ExperimentUseResponse = {
  experiment_key: "homepage-hero",
  experiment_version: 1,
  variant_key: "control",
  goal_activity_key: "checkout.started",
};
const activityReportKey: AnalyticsActivityReportKey = "recent_activity";
const activityFeed: ActivityFeedData = {
  items: [
    {
      id: "analytics-fact-contract",
      entity: "activity",
      entity_id: activity.id,
      action: "tracked",
      event_type: "activity_tracked",
      status: "",
      customer_id: activity.customer_id,
      category: "activities",
      title: "Page viewed",
      description: "A contact viewed a product.",
      data: {},
      payload: {},
      created_at: 1,
    },
  ],
  summary: {
    total: 1,
    orders: 0,
    submissions: 0,
    contacts: 0,
    audiences: 0,
    abandoned_carts: 0,
    carts: 0,
    promo_codes: 0,
    products: 0,
    services: 0,
    providers: 0,
    cms: 0,
    workflows: 0,
    activities: 1,
    window_start: 1,
  },
  next_cursor: { created_at: 1, id: "analytics-fact-contract" },
  meta: { row_count: 1, execution_ms: 1 },
};
const checkoutAction: CheckoutPaymentAction = {
  type: "stripe_embedded_checkout",
  publishable_key: "pk_test_contract",
  client_secret: "cs_contract_secret_exact",
  connected_account_id: "acct_contract",
  expires_at: 2,
};
const mediaUpdatedWebhook: WebhookEventSubscription = {
  event: "media.updated",
};
const productItemUpdatedWebhook: WebhookEventSubscription = {
  event: "order_product_item.updated",
};
const digitalItemConfirmedWebhook: WebhookEventSubscription = {
  event: "order_digital_item.confirmed",
};
const customerArchivedWebhook: WebhookEventSubscription = {
  event: "customer.archived",
};
const eventAction: EventAction = { action: "product_created" };
const supportAction: SupportAction = {
  type: "end_conversation",
  message: "Thanks",
};
const campaignMessageDirection: CampaignMessageDirection = "action";

// @ts-expect-error provider capabilities must state whether publishing is supported.
const missingPublishingCapability: SocialProviderCapability = {
  type: "x_account",
  display_name: "X Account",
  required_scopes: [],
  media_requirements: [],
  engagement: {
    read_comments: true,
    reply_to_comments: true,
  },
  analytics: {
    read_post_metrics: true,
  },
};

void [
  supportStart,
  storefrontIdentify,
  storefrontEntryIdentify,
  verificationChallengeId,
  audiencePromotionSnapshot,
  orderMoney,
  paymentAmounts,
  stripeOrderPaymentProvider,
  cashOrderPaymentProvider,
  orderPayment,
  refundMoney,
  refundAllocation,
  stripeRefundProvider,
  orderRefundStatus,
  orderRefund,
  createOrderRefund,
  recordCashOnDeliveryRefund,
  paymentDisputeStatus,
  paymentDisputeProvider,
  paymentDispute,
  findPaymentDisputes,
  getPaymentDispute,
  zeroTotalCheckout,
  markCashOnDeliveryPaid,
  nullableOrderPaymentId,
  missingConnectedAccountCheckout,
  accountingTaxLine,
  promoSnapshot,
  shippingLine,
  embeddedOrderProductItem,
  embeddedOrderBookingItem,
  embeddedOrderDigitalItem,
  orderContract,
  cancelEmbeddedProductItem,
  forbiddenBookingRewrite,
  fulfillmentOrderStatus,
  cart,
  embeddedRefundPaymentStatus,
  codeReceivedCallback,
  safeSocialCredential,
  unsafeSocialCredential,
  safeSocialConnectionData,
  mediaUpdatedWebhook,
  productItemUpdatedWebhook,
  digitalItemConfirmedWebhook,
  customerArchivedWebhook,
  tiktokConnectionType,
  tiktokContent,
  tiktokInitializeEffect,
  tiktokUploadEffect,
  clearCartAddresses,
  shipmentStatus,
  shipmentTrackingStatusAt,
  supportCapability,
  supportInputNode,
  supportEndNode,
  invalidSupportMessageNode,
  invalidSupportActionNode,
  supportDefinitionWithNoAi,
  supportConversationWithNullableSession,
  inboundSupportMessage,
  storefrontSupportStart,
  supportMessageWithNullState,
  storefrontSupportMessage,
  storefrontSupportRead,
  storeSubscriptionRead,
  selectedStoreSubscription,
  storefrontSubscriptionCheckoutAction,
  invalidStoreSubscriptionStatus,
  supportMessageWithoutCapability,
  account,
  pendingAccountSessionResponse,
  verifyPendingAccountSession,
  authToken,
  accountAuthDelivery,
  staleAccountAuthDelivery,
  pendingAccountSession,
  activeAccountSession,
  revokedAccountSession,
  terminalSessionStatus,
  personalApiToken,
  expiredApiTokenStatus,
  customer,
  productVariant,
  trigger,
  getNode,
  mutationNode,
  missingHttpFields,
  retryingMutation,
  delayedMutationRetry,
  canonicalPage,
  activityPageParams,
  activity,
  opportunityActivityData,
  storefrontActivity,
  trackActivity,
  commonActivityKey,
  activityContactFilter,
  experiment,
  createExperiment,
  experimentUse,
  activityReportKey,
  activityFeed,
  checkoutAction,
  eventAction,
  supportAction,
  campaignMessageDirection,
  missingPublishingCapability,
  legacyCrmContactFeature,
  nonWireCrmProfileFeature,
  audienceTierPriceInput,
  audienceTierPriceWithProvider,
  subscribePaymentStatus,
];
void sdkVersionLiteral;
