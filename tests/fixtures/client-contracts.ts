import { epochMilliseconds } from "arky-sdk";
import type { WorkflowExecutionStatus, GetWorkflowExecutionsParams, GetWorkflowExecutionParams } from "arky-sdk";
const executionStatus: WorkflowExecutionStatus = { type: "completed" };
const executionQuery: GetWorkflowExecutionsParams = { workflow_id: "workflow", status: "completed", query: "execution", limit: 1, cursor: "opaque", sort_field: "created_at", sort_direction: "desc" };
const exactExecution: GetWorkflowExecutionParams = { workflow_id: "workflow", execution_id: "execution" };
// @ts-expect-error Execution responses carry tagged lifecycle status.
const oldExecutionStatus: WorkflowExecutionStatus = "completed";
// @ts-expect-error Execution list filters carry a flat status value.
const invalidExecutionStatusFilter: GetWorkflowExecutionsParams = { workflow_id: "workflow", status: { type: "running" } };
// @ts-expect-error Execution errors are private detail, not a supported sort key.
const invalidExecutionSort: GetWorkflowExecutionsParams = { workflow_id: "workflow", sort_field: "error" };
export type WorkflowExecutionContracts = [typeof executionStatus, typeof executionQuery, typeof exactExecution];
import type { WorkflowConnectionAuthorizationStatus, GetWorkflowConnectionsParams, GetWorkflowConnectionParams } from "arky-sdk";
const workflowConnectionStatus: WorkflowConnectionAuthorizationStatus = { type: "reauthorization_required", detected_at: epochMilliseconds(0) };
const workflowConnectionsQuery: GetWorkflowConnectionsParams = { query: "Drive", type: "google_drive", status: "active", limit: 20, cursor: "opaque", sort_field: "updated_at", sort_direction: "asc" };
const exactWorkflowConnection: GetWorkflowConnectionParams = { id: "connection" };
// @ts-expect-error Connection response status is a tagged object, not a string.
const oldWorkflowConnectionStatus: WorkflowConnectionAuthorizationStatus = "active";
// @ts-expect-error Reauthorization retains its detection timestamp.
const incompleteWorkflowConnectionStatus: WorkflowConnectionAuthorizationStatus = { type: "reauthorization_required" };
// @ts-expect-error Connection search status is a flat filter.
const oldWorkflowConnectionFilter: GetWorkflowConnectionsParams = { status: { type: "active" } };
// @ts-expect-error Connection names are text predicates, not a supported ordering field.
const invalidWorkflowConnectionSort: GetWorkflowConnectionsParams = { sort_field: "name" };
export type WorkflowConnectionContracts = [typeof workflowConnectionStatus, typeof workflowConnectionsQuery, typeof exactWorkflowConnection];
import type { WorkflowStatus, GetWorkflowsParams, CreateWorkflowParams, WorkflowTransformNode, WorkflowLoopNode, WorkflowSwitchNode } from "arky-sdk";
const workflowLocalNodes: [WorkflowTransformNode, WorkflowLoopNode, WorkflowSwitchNode] = [
  { type: "transform", code: "return input;", delay_ms: null },
  { type: "loop", expression: "input.items", delay_ms: null },
  { type: "switch", rules: [], delay_ms: null },
];
const workflowStatusContract: WorkflowStatus = { type: "draft" };
const workflowListContract: GetWorkflowsParams = { status: "active", created_at_from: epochMilliseconds(-1) };
const workflowCreateContract: CreateWorkflowParams = { key: "demo_workflow", status: { type: "active" }, graph: { nodes: {}, edges: [] } };
// @ts-expect-error Workflow responses and writes use tagged status objects.
const legacyWorkflowStatusContract: WorkflowStatus = "active";
// @ts-expect-error Workflow search filters use a flat status value.
const legacyWorkflowFilterContract: GetWorkflowsParams = { status: { type: "active" } };
export type WorkflowStatusContracts = [typeof workflowStatusContract, typeof workflowListContract, typeof workflowCreateContract, typeof workflowLocalNodes];
import type { AccountActor, LeadResearchAssistantMessageStatus, LeadResearchMessageType, GetLeadResearchMessageParams } from "arky-sdk";

declare const leadResearchActor: AccountActor;
const leadResearchAccount: LeadResearchMessageType = {
  type: "account", actor: leadResearchActor, content: "Research independent suppliers",
};
const leadResearchAssistant: LeadResearchMessageType = {
  type: "assistant", responds_to_message_id: "account-message", requested_by: leadResearchActor,
  status: { type: "requested" },
};
const leadResearchCancelled: LeadResearchAssistantMessageStatus = {
  type: "cancelled", cancelled_by: leadResearchActor, cancelled_at: epochMilliseconds(1),
};
// @ts-expect-error Lead Research status uses the canonical type discriminator.
const legacyLeadResearchStatus: LeadResearchAssistantMessageStatus = { status: "requested" };
// @ts-expect-error Account authorship retains an actor snapshot, not a Session navigation ID.
const legacyLeadResearchAccount: LeadResearchMessageType = { type: "account", account_session_id: "session", content: "Research" };
// @ts-expect-error Assistant authorship retains an actor snapshot, not a Session navigation ID.
const legacyLeadResearchAssistant: LeadResearchMessageType = { type: "assistant", responds_to_message_id: "account-message", requested_by_account_session_id: "session", status: { type: "requested" } };
const exactResearchMessage: GetLeadResearchMessageParams = { lead_research_id: "research", message_id: "message" };
export type LeadResearchContracts = [typeof leadResearchAccount, typeof leadResearchAssistant, typeof leadResearchCancelled, typeof exactResearchMessage];
export type { BlockContracts } from "./block-contracts.js";
import type { MembershipContracts } from "./membership-contracts.js";
export type { MembershipContracts };
import type { CatalogContracts } from "./catalog-contracts.js";
import type { PriceContracts } from "./price-contracts.js";
import type { CompanyContracts } from "./company-contracts.js";
import type { OrderContracts } from "./order-contracts.js";
import type { CartContracts } from "./cart-contracts.js";
import type { InventoryContracts } from "./inventory-contracts.js";
export type { InventoryContracts };
export type { ShippingProfileContracts } from "./shipping-profile-contracts.js";
import type {
  AddMemberParams,
  TransferStoreOwnershipParams,
  ActivateEmailSuppressionParams,
  EmailSuppressionRecord,
  EmailSuppressionSource,
  EmailSuppressionStatus,
  FindEmailSuppressionsParams,
  ReleaseEmailSuppressionParams,
} from "arky-sdk";
import type {
  Account,
  AvailabilityResponse,
  AccountApiToken,
  AccountApiTokenStatus,
  AccountVerificationEmailStatus,
  AccountSession,
  AccountSessionScope,
  AccountSessionStatus,
  AuthToken,
  Block,
  BlockSchema,
  BuildHook,
  Classification,
  ClassificationCoordinates,
  ClassificationEntry,
  ClassificationFieldQuery,
  ClassificationGeoLocation,
  ClassificationNumberOperation,
  ClassificationSchema,
  Customer,
  Cart,
  CartBookingItem,
  CartDigitalItem,
  CartProductItem,
  CartDigitalItemInput,
  CartProductInput,
  CheckoutCartParams,
  CreateMarketParams,
  CreateProductParams,
  CreateProductVariantParams,
  CreateDigitalProductParams,
  CreateOrderShipmentParams,
  DigitalAsset,
  DigitalLibraryItem,
  DigitalLibraryProduct,
  DigitalProduct,
  DigitalProductStatus,
  DiscountAllocation,
  CampaignConversationMessage,
  GetCollectionParams,
  GetDigitalLibraryProductParams,
  GetStorefrontDigitalProductParams,
  QuoteShippingLabelParams,
  GetPaymentDisputeParams,
  OrderMoney,
  NodeResult,
  Order,
  OrderCheckoutResult,
  Refund,
  RefundProvider,
  RefundAllocation,
  RefundStatus,
  Payment,
  PaymentProviderBinding,
  PaymentAmounts,
  PaymentDispute,
  PaymentDisputeProvider,
  PaymentDisputeStatus,
  OrderDigitalSnapshot,
  OrderDigitalItem,
  OrderProductItem,
  TaxLine,
  OrderDeliveryGroup,
  AppliedPriceSnapshot,
  ShippingLabel,
  MerchantDebit,
  MerchantDebitReversal,
  ShippingLabelRefund,
  ShippingLabelQuoteRate,
  ShippingLabelPurchase,
  FulfillmentOrder,
  FulfillmentOrderStatus,
  FormBlock,
  PaginatedResponse,
  PendingAccountSession,
  Product,
  ProductInventory,
  ProductInventoryInput,
  ProductFulfillment,
  ProductStatus,
  ProductVariant,
  Price,
  ManualPrice,
  PurchaseOriginSnapshot,
  ManualPriceInput,
  RefundRequestReason,
  CreateRefundParams,
  RecordRefundMoneyParams,
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
  SocialCredential,
  SocialConnection,
  SocialMessage,
  SocialConnectionType,
  SocialPostContent,
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
  SupportEmailStatus,
  UpdateCartParams,
  UpdateDigitalProductParams,
  UpdateProductParams,
  UpdateProductVariantParams,
  UpdateOrderParams,
  CreateZoneParams,
  CreateMarketZoneParams,
  Mailbox,
  MailboxIncomingSource,
  MailboxSyncIssue,
  MailboxSyncIssueReason,
  FindMailboxSyncIssuesParams,
  MailboxSyncStatus,
  Market,
  Media,
  Money,
  OrderQuote,
  PaymentProvider,
  WorkflowHttpNode,
  WorkflowSendEmailNode,
  WorkflowExternalOperation,
  VerifyPendingAccountSessionParams,
  Webhook,
  FindDigitalProductsParams,
  RecordCashOnDeliveryCollectionParams,
  CustomerAction,
  CustomerActionType,
  CustomerActionFeedData,
  AnalyticsCustomerActionReportKey,
  CommonCustomerActionKey,
  CheckoutPaymentAction,
  CancelOrderProductItemParams,
  BookingItemLifecycleParams,
  CancelBookingItemParams,
  OrderBooking,
  GetOrderBookingParams,
  DigitalProductQuoteInput,
  GetQuoteParams,
  ProductQuoteInput,
  BookingQuoteInput,
  CreateExperimentParams,
  EventAction,
  Experiment,
  ExperimentUseResponse,
  SupportAction,
  TrackCustomerActionParams,
  WebhookEventSubscription,
} from "../../dist/index.js";

const localNodeResult: NodeResult = {
  source: { type: "local" },
  output: null,
  route: "success",
  started_at: epochMilliseconds(1),
  completed_at: epochMilliseconds(1),
  duration_ms: 0,
};
const externalNodeResult: NodeResult = {
  ...localNodeResult,
  source: { type: "external_operation", operation_id: "operation-id" },
};
// @ts-expect-error Every current NodeResult requires an explicit evidence source.
const missingNodeResultSource: NodeResult = { output: null, route: "success", started_at: epochMilliseconds(1), completed_at: epochMilliseconds(1), duration_ms: 0 };
// @ts-expect-error External evidence requires its exact operation ID.
const missingNodeOperationId: NodeResult["source"] = { type: "external_operation" };
void [localNodeResult, externalNodeResult, missingNodeResultSource, missingNodeOperationId];
// @ts-expect-error the Actions surface does not expose a generic Action compatibility alias.
import type { Action, ActionData } from "../../dist/index.js";
import type {
  // @ts-expect-error analytics exposes CustomerAction feed names exclusively.
  ActionFeedData,
  // @ts-expect-error analytics exposes CustomerAction report names exclusively.
  AnalyticsActionReportKey,
} from "../../dist/index.js";
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
  FindCustomerActionsParams,
  FindCustomersParams,
  RequestOptions,
} from "../../dist/types.js";
// @ts-expect-error Actions queries have no generic Action compatibility alias.
import type { FindActionsParams } from "../../dist/types.js";
import type {
  // @ts-expect-error embedded Cart items use their canonical Item names only.
  CartDigitalProduct,
  // @ts-expect-error embedded Order items use their canonical Item names only.
  OrderDigitalProduct,
  // @ts-expect-error embedded Order items use their canonical Item names only.
  OrderProduct,
} from "../../dist/index.js";
// @ts-expect-error Order product cancellation addresses an embedded product item.
import type { CancelOrderProductParams } from "../../dist/index.js";
// @ts-expect-error Audience promotion snapshots no longer expose mutable usage state.
import type { AudiencePromotionUsageStatus } from "../../dist/index.js";
// @ts-expect-error generic EmailDelivery persistence no longer has a public SDK type.
import type { EmailDelivery } from "../../dist/index.js";
// @ts-expect-error generic Notification email requests were removed.
import type { EmailSendRequest } from "../../dist/index.js";
// @ts-expect-error generic delivery retry inputs were removed.
import type { RetryEmailDeliveryParams } from "../../dist/index.js";
import { createAdmin, SDK_VERSION } from "../../dist/index.js";
import {
  COMMON_CUSTOMER_ACTION_KEYS,
  createStorefront,
  initialize,
  type FormField,
  type FormSchema,
  type FormValues,
  type EmbeddedCheckoutAction as StorefrontEmbeddedCheckoutAction,
  type StorefrontIdentifyResult as StorefrontEntryIdentifyResult,
} from "../../dist/storefront.js";
import type {
  // @ts-expect-error storefront tracking uses CustomerAction key names exclusively.
  CommonActionKey,
  // @ts-expect-error storefront tracking uses CustomerAction names exclusively.
  StorefrontAction,
  // @ts-expect-error storefront tracking uses CustomerAction parameter names exclusively.
  TrackActionParams,
} from "../../dist/storefront.js";
// @ts-expect-error storefront CustomerAction keys have no Action compatibility alias.
import { COMMON_ACTION_KEYS } from "../../dist/storefront.js";

const sdkVersionLiteral: "0.26.57" = SDK_VERSION;
const workflowExternalOperationContract: WorkflowExternalOperation = {
  id: "operation-contract",
  store_id: "store-contract",
  workflow_id: "workflow-contract",
  execution_id: "execution-contract",
  node_id: "http_1",
  iteration_key: "root",
  type: "http_mutation",
  status: { type: "succeeded" },
  requested_at: epochMilliseconds(1),
  processing_started_at: epochMilliseconds(2),
  completed_at: epochMilliseconds(3),
  result: { type: "provider", provider_status: 200 },
  error: null,
  updated_at: epochMilliseconds(3),
};
void workflowExternalOperationContract;
// @ts-expect-error External operation statuses use the tagged Server DTO.
const flatOperationStatus: WorkflowExternalOperation["status"] = "succeeded";
// @ts-expect-error Private provider response bodies are not public operation results.
const privateOperationOutput: WorkflowExternalOperation["result"] = { output: {} };
const sentEmailOperationResult: WorkflowExternalOperation["result"] = {
  type: "send_email",
  provider_message_id: "message-contract",
  provider_thread_id: null,
  sent_at: epochMilliseconds(3),
};
void flatOperationStatus;
void privateOperationOutput;
void sentEmailOperationResult;
const bookingServiceFeature: SubscriptionPlanFeatureType = "booking_services";
const bookingResourceFeature: SubscriptionPlanFeatureType = "booking_resources";
const customerFeature: SubscriptionPlanFeatureType = "customers";
const socialConnectionFeature: SubscriptionPlanFeatureType = "social_connections";
const mediaContract: Media = {
  id: "media-contract",
  store_id: "store-contract",
  original: {
    url: "https://media.example.test/file.png",
    file_name: "file.png",
    mime_type: "image/png",
    size_bytes: 100,
    width_px: 100,
    height_px: 100,
  },
  renditions: [],
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
// @ts-expect-error Media always exposes its owned Original file.
const mediaWithoutOriginal: Media = {
  id: "media-contract",
  store_id: "store-contract",
  renditions: [],
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const storeContract: Store = {
  id: "store-contract",
  branding: { logo_media_id: null, icon_media_id: null, accent_color: null },
  name: "Contract Store",
  billing_email: "owner@example.com",
  contact_email: null,
  commerce: {
    type: "ready",
    default_market_id: "market-contract",
    default_sales_channel_id: "channel-contract",
    seller: { legal_name: "Synthetic seller", address: { country: "US" }, registration_number: null, tax_registrations: [] },
    tax: { version: "fixture", noncommercial_customer_group_grants: false },
    invoicing: { series_key: "sales", issue_trigger: { type: "acceptance" } },
  },
  timezone: "Europe/Sarajevo",
  default_language: "en",
  supported_languages: ["en", "bs"],
};
const createStoreContract: CreateStoreParams = {
  name: "Contract Store",
  billing_email: "billing@example.com",
  contact_email: "contact@example.com",
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
// @ts-expect-error Store email fields are explicit, not a nested aliases object.
storeContract.emails;
// @ts-expect-error The overloaded Store email field is removed.
storeContract.email;
// @ts-expect-error Store creation accepts a name, not the removed mutable key.
createStoreContract.key;
// @ts-expect-error Store creation requires explicit language ownership fields.
createStoreContract.languages;
// @ts-expect-error Store creation accepts explicit billing and contact fields.
createStoreContract.emails;
// @ts-expect-error Store creation does not accept the overloaded email alias.
createStoreContract.email;

const storeLocationContract: StoreLocation = {
  id: "location-contract",
  store_id: "store-contract",
  key: "main",
  address: { city: "Sarajevo", country: "BA" },
  timezone: "Europe/Sarajevo",
  is_pickup_location: true,
  blocks: [],
  status: { type: "active" },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const createStoreLocationContract: CreateStoreLocationParams = {
  key: "main",
  address: storeLocationContract.address,
  timezone: storeLocationContract.timezone,
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
  status: { type: "disabled" },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const createBuildHookContract: CreateBuildHookParams = {
  store_id: "store-contract",
  url: "https://deploy.example.com/hook",
  status: { type: "active" },
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
  events: [{ type: "store.updated" }],
  headers: {},
  secret: "••••••••",
  status: { type: "active" },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const createWebhookContract: CreateWebhookParams = {
  store_id: "store-contract",
  url: "https://events.example.com/hook",
  events: [{ type: "store.updated" }],
  headers: {},
  secret: "s".repeat(32),
  status: { type: "disabled" },
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
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const monthlyStoreUsage: StoreUsage = {
  ...totalStoreUsage,
  id: "usage-month-contract",
  feature: "lead_research_operations",
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
  key: "cash",
  blocks: [],
  status: { type: "active" },
  configuration: { type: "cash_on_delivery" },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const stripeProvider: PaymentProvider = {
  id: "provider-stripe",
  store_id: "store-contract",
  key: "card",
  blocks: [],
  status: { type: "active" },
  configuration: {
    type: "stripe",
    connection: {
    type: "connected",
    connected_account_id: "acct_contract",
    account_setup_submitted: true,
    payments_enabled: true,
    payouts_enabled: true,
    state_observed_at: epochMilliseconds(2),
    platform_debit_consent: {
      accepted_by: { account_id: "account-contract", snapshot: { email: "owner@example.test", credential_type: "session" } },
      accepted_at: epochMilliseconds(2),
      terms_version: 1,
      revoked_at: null,
    },
    },
  },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const marketContract: Market = {
  id: "market-contract",
  store_id: "store-contract",
  key: "bih",
  currency: "bam",
  tax_mode: "inclusive",
  status: { type: "active" },
  payment_provider_ids: [cashOnDeliveryProvider.id, stripeProvider.id],
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const storefrontPaymentProviders: StorefrontPaymentProvider[] = [
  { id: cashOnDeliveryProvider.id, key: cashOnDeliveryProvider.key, blocks: cashOnDeliveryProvider.blocks, type: "cash_on_delivery" },
  { id: stripeProvider.id, key: stripeProvider.key, blocks: stripeProvider.blocks, type: "stripe" },
];
const storefrontSetupContract: StorefrontSetup = {
  commerce: { type: "ready", default_market_id: marketContract.id, default_sales_channel_id: "channel" },
  timezone: "Europe/Sarajevo",
  languages: { default: "en", available: ["en"] },
  default_market: marketContract,
  payment_providers: storefrontPaymentProviders,
  support: { email: "store@example.test" },
  readiness: { market: true, payment: true, commerce: true },
};
const storefrontProviderType: "cash_on_delivery" | "manual" | "stripe" | "monri" =
  storefrontSetupContract.payment_providers[1].type;
const createMarketContract: CreateMarketParams = {
  key: "bih",
  currency: "bam",
  tax_mode: "inclusive",
  payment_provider_ids: [cashOnDeliveryProvider.id, stripeProvider.id],
};
const checkoutContract: CheckoutCartParams = {
  id: "cart-contract",
  locale: "en",
  presentation_digest: "a".repeat(64),
  sources: { carts: [{ cart_id: "cart-contract", version: "reviewed-version" }], lines: [], delivery_groups: [] },
  payment_provider_id: stripeProvider.id,
  return_url: "https://storefront.example.test/checkout/return",
};
declare const quoteContract: OrderQuote;
const quotedProviderId: string | null = quoteContract.payment_provider_id;
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
const membershipInvitationEmailStatus: AccountVerificationEmailStatus | null | undefined =
  membershipContract.invitation_email_status;
// @ts-expect-error invitation state is Account-owned rather than a generic Delivery link.
membershipContract.invitation_delivery_status;
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
void membershipInvitationEmailStatus;
const merchantRefundReason: RefundRequestReason = "fraudulent";
const refundMoney: Money = { amount: 1_250, currency: "usd" };
const refundAllocation: RefundAllocation = {
  order_credit_id: "order-credit-contract",
  order_credit_allocation_id: "order-credit-allocation-contract",
  amount: 1_250,
};
const stripeRefundProvider: RefundProvider = {
  type: "stripe",
  payment_provider_id: "payment-provider-contract",
  refund_id: "stripe-refund-contract",
};
const orderRefundStatus: RefundStatus = { type: "succeeded" };
const orderRefund: Refund = {
  id: "order-refund-contract",
  store_id: "store-contract",
  order_id: "order-contract",
  order_payment_id: "order-payment-contract",
  order_payment_capture_id: null,
  provider: stripeRefundProvider,
  money: refundMoney,
  application: { type: "commercial_credit", allocations: [refundAllocation] },
  requester: {
    type: "account",
    actor: { account_id: "account-contract", snapshot: { email: "historical.operator@example.test", credential_type: "session" } },
    reason: "customer_request",
    private_note: null,
  },
  status: orderRefundStatus,
  financial_effects: [],
  safe_error: null,
  requested_at: epochMilliseconds(1),
  processing_started_at: epochMilliseconds(2),
  processing_deadline_at: epochMilliseconds(3),
  completed_at: epochMilliseconds(4),
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(4),
};
const createOrderRefund: CreateRefundParams = {
  payment_id: "payment-contract",
  refund_id: "order-refund-contract",
  payment_capture_id: null,
  money: refundMoney,
  application: { type: "commercial_credit", allocations: [refundAllocation] },
  reason: "customer_request",
  private_note: null,
  reference: null,
};
const recordRefundMoney: RecordRefundMoneyParams = {
  id: "cash-refund-contract",
  effect_id: "cash-receipt-contract",
  movement: { type: "sent" },
  money: refundMoney,
  allocations: [refundAllocation],
  reference: "cash-receipt-reference",
};
const paymentDisputeStatus: PaymentDisputeStatus = { type: "needs_response", response: { type: "due_at", due_at: epochMilliseconds(123_000) } };
const paymentDisputeProvider: PaymentDisputeProvider = {
  type: "stripe",
  dispute_id: "stripe-dispute-contract",
  charge_id: "stripe-charge-contract",
};
const paymentDispute: PaymentDispute = {
  id: "payment-dispute-contract",
  store_id: "store-contract",
  order_payment_id: "order-payment-contract",
  order_payment_capture_id: null,
  livemode: false,
  financial_effects: [{ type: "principal_withdrawn", effect_id: "effect-contract", money: { amount: 1_250, currency: "usd" }, observed_at: epochMilliseconds(2) }],
  money: { amount: 1_250, currency: "usd" },
  status: paymentDisputeStatus,
  reason: "fraudulent",
  provider: paymentDisputeProvider,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const findPaymentDisputes: FindPaymentDisputesParams = {
  payment_id: "payment-contract",
  limit: 20,
};
const getPaymentDispute: GetPaymentDisputeParams = {
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

const promotionDiscountAllocation: DiscountAllocation = {
  id: "allocation-promotion",
  source: { type: "promotion", promotion_id: "promotion", effect_id: itemPercentageDiscountId, promotion_code_id: null },
  amount: 500,
};
const automaticDiscountAllocation: DiscountAllocation = {
  id: "allocation-manual",
  source: { type: "manual", actor: { account_id: "account", snapshot: { email: "operator@example.test", credential_type: "api_token" } }, reason: "Agreed discount" },
  amount: 500,
};
// @ts-expect-error Allocations require their exact identity and typed provenance.
const allocationWithoutProvenance: DiscountAllocation = { amount: 500 };
const allocationWithLegacyProvenance: DiscountAllocation = {
  ...promotionDiscountAllocation,
  // @ts-expect-error Allocation provenance uses the promotion/effect source union.
  discount_application_id: itemPercentageDiscountId,
};
// @ts-expect-error Store closure is a system-only refund reason.
const systemRefundReasonFromClient: RefundRequestReason = "store_closure";
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

declare const digitalAsset: DigitalAsset;
const digitalAssetStatus: "active" | "archived" = digitalAsset.status.type;
const digitalAssetPage = adminClient.eshop.digital.asset.find({ status: digitalAssetStatus, limit: 20 });
const exactDigitalAsset = adminClient.eshop.digital.asset.get({ asset_id: digitalAsset.id });
const exactDigitalProduct = adminClient.eshop.digital.product.getByKey({ key: "guide" });
void [digitalAssetPage, exactDigitalAsset, exactDigitalProduct];
// @ts-expect-error object storage keys are internal and never exposed by Admin responses.
digitalAsset.object_key;
const digitalPrice: Price = {
  id: "e29a1c4b-3f76-4d18-8b05-7c6e2a91d430",
  store_id: "store-contract",
  sellable: {
    type: "digital_product",
    digital_product_id: "digital-product-contract",
  },
  price_list_id: null,
  currency: "usd",
  amount: 2500,
  compare_at: null,
  min_quantity: 1,
  max_quantity: null,
  status: { type: "active" },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const digitalProductContract: DigitalProduct = {
  id: "digital-product-contract",
  store_id: "store-contract",
  key: "digital-product-key",
  name_block_id: "digital-product-name-block",
  slugs: { en: "digital-product" },
  blocks: [],
  classifications: [],
  asset_ids: ["0198f8f7-2f25-4a14-86bb-64efc56e1a11"],
  tax_category_id: null,
  status: { type: "active" },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const storefrontDigitalProductContract: StorefrontDigitalProduct = {
  id: digitalProductContract.id,
  key: digitalProductContract.key,
  name_block_id: digitalProductContract.name_block_id,
  slugs: digitalProductContract.slugs,
  blocks: [],
  classifications: [],
  price: null,
  purchase_allowed: true,
};
const digitalLibraryItemContract: DigitalLibraryItem = {
  digital_product_id: digitalProductContract.id,
  product_key: digitalProductContract.key,
  product_name: { text: "Purchased guide", locale: "en" },
};
const digitalLibraryProductContract: DigitalLibraryProduct = {
  digital_product_id: digitalLibraryItemContract.digital_product_id,
  presentation: digitalLibraryItemContract,
  assets: { items: [{ id: digitalProductContract.asset_ids[0], file_name: "guide.txt", mime_type: "text/plain", download_reference: "protected-reference" }], cursor: null },
};
const createDigitalProductContract: CreateDigitalProductParams = {
  key: digitalProductContract.key,
  name_block_id: digitalProductContract.name_block_id,
  slugs: digitalProductContract.slugs,
  blocks: [],
  classifications: [],
  asset_ids: digitalProductContract.asset_ids,
  status: { type: "draft" },
};
const updateDigitalProductContract: UpdateDigitalProductParams = {
  digital_product_id: digitalProductContract.id,
  slugs: { en: "digital-product-updated" },
  status: { type: "archived" },
};
const findDigitalProductsContract: FindDigitalProductsParams = {
  ids: [digitalProductContract.id],
  classification_query: [
    {
      classification_id: "classification-contract",
      query: [{ type: "boolean", key: "featured", value: true }],
    },
  ],
  status: "active",
  query: 25,
  limit: 20,
  cursor: "cursor-contract",
  sort_field: "key",
  sort_direction: "asc",
  created_at_from: epochMilliseconds(1),
  created_at_to: epochMilliseconds(2),
};
const digitalProductLookupContract: GetStorefrontDigitalProductParams = {
  identifier: digitalProductContract.key,
};
const digitalLibraryLookupContract: GetDigitalLibraryProductParams = {
  digital_product_id: digitalProductContract.id,
  company_id: "company-contract",
  company_location_id: "company-branch-contract",
};
const manualPrice: ManualPrice = {
  allow_promotions: false,
  money: { currency: "usd", amount: 2500 },
  reason: "Negotiated contract price",
  authorized_by: {
    account_id: "account-contract",
    snapshot: { email: "operator@example.com", credential_type: "api_token" },
  },
};
const manualPriceInput: ManualPriceInput = {
  allow_promotions: false,
  currency: "usd",
  amount: 2500,
  reason: "Negotiated contract price",
};
const cartDigitalItemContract: CartDigitalItem = {
  id: "cart-digital-contract",
  digital_product_id: digitalProductContract.id,
  beneficiary_customer_id: "customer-contract",
  form_submission_id: null,
  price_override: manualPrice,
};
const appliedPrice: AppliedPriceSnapshot = {
  unit_price: { currency: 'usd', amount: 2500 },
  compare_at: null,
  tax_mode: 'exclusive',
  min_quantity: 1,
  max_quantity: null,
  source: { type: 'base', price_id: 'price-contract' },
  priced_at: epochMilliseconds(1),
};
const acceptedOrderPrice: OrderDigitalSnapshot['price'] = { type: 'direct', price: appliedPrice };
const orderDigitalSnapshotContract: OrderDigitalSnapshot = {
  product_key: digitalProductContract.key,
  product_name: { text: 'Accepted digital product', locale: 'en' },
  price: acceptedOrderPrice,
  source_digital_product_id: digitalProductContract.id,
  content: { type: 'accepted_assets', assets: [{ source_asset_id: 'asset', object_key: 'retained-object', version_id: 'retained-version', content_digest: 'retained-digest', file_name: 'lesson.pdf', mime_type: 'application/pdf' }] },
};
const productQuoteInputContract: ProductQuoteInput = {
  product_id: "product-contract",
  variant_id: "variant-contract",
  quantity: 1,
  form_submission_id: "form-submission-product-contract",
  price_override: manualPriceInput,
};
const bookingQuoteInputContract: BookingQuoteInput = {
  booking_offering_id: "booking-offering-contract",
  requested_interval: { from: epochMilliseconds(1_800_000_000_000), to: epochMilliseconds(1_800_003_600_000) },
  form_submission_id: "form-submission-booking-contract",
  price_override: manualPriceInput,
};
const digitalQuoteInputContract: DigitalProductQuoteInput = {
  digital_product_id: digitalProductContract.id,
  beneficiary_customer_id: "customer-contract",
  form_submission_id: "form-submission-digital-contract",
  price_override: manualPriceInput,
};
const cartProductInputContract: CartProductInput = {
  product_id: "product-contract",
  variant_id: "variant-contract",
  quantity: 1,
  form_submission_id: "form-submission-product-contract",
};
const cartDigitalInputContract: CartDigitalItemInput = {
  digital_product_id: digitalProductContract.id,
  beneficiary_customer_id: "customer-contract",
  form_submission_id: "form-submission-digital-contract",
};
const trustedCartProductInputContract: TrustedCartProductInput = {
  ...cartProductInputContract,
  price_override: manualPriceInput,
};
const trustedCartBookingInputContract: TrustedCartBookingInput = {
  ...bookingQuoteInputContract,
};
const trustedCartDigitalInputContract: TrustedCartDigitalItemInput = {
  ...cartDigitalInputContract,
  price_override: manualPriceInput,
};
const quoteInputContract: GetQuoteParams = {
  market: "us",
  customer_id: "customer-contract",
  line_items: [
    { type: "product", ...trustedCartProductInputContract },
    { type: "booking", ...trustedCartBookingInputContract },
    { type: "digital_product", ...trustedCartDigitalInputContract },
  ],
};
const digitalProductStatusContract: DigitalProductStatus =
  digitalProductContract.status;
// @ts-expect-error Digital Product localized records use slugs.
digitalProductContract.slug;
// @ts-expect-error Digital Product create input has no singular localized map.
type LegacyDigitalProductCreateSlug = CreateDigitalProductParams["slug"];
// @ts-expect-error Digital Product update input has no singular localized map.
type LegacyDigitalProductUpdateSlug = UpdateDigitalProductParams["slug"];
const legacyDigitalProductLookup: GetStorefrontDigitalProductParams = {
  // @ts-expect-error Storefront Digital Product lookup uses the server route identifier.
  id: digitalProductContract.id,
};
const invalidDigitalLibraryLookup: GetDigitalLibraryProductParams = {
  // @ts-expect-error Library routes require a Digital Product ID.
  identifier: digitalProductContract.key,
};
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
  const syncStatus: MailboxSyncStatus = mailbox.provider.sync_status;
  void hasCredential;
  void syncStatus;
}

const clearCartAddresses: UpdateCartParams = {
  id: "cart-contract",
  billing_address: null,
};

const inventoryInput: ProductInventoryInput = {
  store_location_id: "location-contract",
  on_hand: 10,
};
const createProductInput: CreateProductParams = {
  key: "canonical-product",
  name_block_id: "block-contract",
  slugs: { en: "canonical-product" },
};
const updateProductInput: UpdateProductParams = {
  id: "product-contract",
  expected_updated_at: epochMilliseconds(1),
  slugs: { en: "updated-product" },
  status: { type: "archived" },
};
// @ts-expect-error Product replacement requires the revision loaded by the editor.
const unversionedProductInput: UpdateProductParams = { id: "product-contract", key: "changed" };
const createProductVariantInput: CreateProductVariantParams = {
  product_id: "product-contract",
  sku: "SKU-CONTRACT",
  attributes: [],
  reference_labels: {},
  fulfillment: {
    type: "physical",
    shipping_profile_id: "shipping-profile-contract",
    inventory_requirements: [
      { inventory_item_id: "inventory-item-contract", quantity: 1 },
    ],
    backorder: { type: "disallow" },
  },
  tax_category_id: null,
};
const updateProductVariantInput: UpdateProductVariantParams = {
  id: "variant-contract",
  expected_updated_at: 1 as import("arky-sdk").EpochMilliseconds,
  sku: null,
  attributes: [],
  reference_labels: {},
  fulfillment: { type: "none" },
  tax_category_id: null,
  status: { type: "active" },
};
void createProductInput;
void updateProductInput;
void createProductVariantInput;
void updateProductVariantInput;
const deleteProductVariantResult: Promise<ProductVariant | void> = adminClient.eshop.productVariant.delete({
  id: "variant-id", expected_updated_at: updateProductVariantInput.expected_updated_at,
});
// @ts-expect-error An already-absent variant returns no record, not a guaranteed Deleting root.
const requiredDeletedVariant: Promise<ProductVariant> = deleteProductVariantResult;
void requiredDeletedVariant;
const variantListInput: import("arky-sdk").FindProductVariantsParams = {
  product_id: "product", sku: "full-exact-sku", status: "deleting", sort_field: "updated_at", sort_direction: "asc", limit: 200,
};
// @ts-expect-error Variant discovery does not imply quantity/context-dependent price ordering.
const variantPriceOrder: import("arky-sdk").FindProductVariantsParams = { sort_field: "price" };
// @ts-expect-error Variant status uses the current lifecycle, not a removed published label.
const variantPublishedFilter: import("arky-sdk").FindProductVariantsParams = { status: "published" };
void [variantListInput, variantPriceOrder, variantPublishedFilter];
const zoneInput: CreateZoneParams = {
  key: "us-zone",
  includes: [{ type: "country", country: "US" }],
  excludes: [],
  status: { type: "active" },
};
const marketZoneInput: CreateMarketZoneParams = {
  market_id: marketContract.id,
  zone_id: "zone-contract",
  priority: 0,
};
void marketZoneInput;
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
  properties: {},
  children: [],
};
const unsupportedReferencePropertySchema: BlockSchema = {
  id: "invalid-contact-form-schema",
  key: "invalid_contact_form",
  type: "form",
  required: false,
  properties: {
    // @ts-expect-error Reference properties are a closed contract.
    unsupported: true,
  },
  children: [],
};
// @ts-expect-error Markdown Blocks have one scalar string value.
const legacyMarkdownMap: Block = {
  id: "legacy-body",
  key: "legacy_body",
  type: "markdown",
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
  options: ["software", "services"],
  min: null,
};
const classificationCoordinates: ClassificationCoordinates = {
  lat: 43.8563,
  lon: 18.4131,
};
const classificationGeoLocation: ClassificationGeoLocation = {
  coordinates: classificationCoordinates,
};
const classificationNumberOperation: ClassificationNumberOperation =
  "greater_than_or_equal";
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
void unsupportedReferencePropertySchema;
void legacyMarkdownMap;
void blockWithValueProperties;
void classificationSchema;
void classificationCoordinates;
void classificationGeoLocation;
void classificationNumberOperation;
void classificationFieldQuery;
void classificationEntry;

const legacyClassificationOperation: ClassificationFieldQuery = {
  type: "number",
  key: "team_size",
  // @ts-expect-error Classification exposes only the five sealed comparison operations.
  operation: "contains",
  value: 10,
};
const legacyClassificationRadius: ClassificationFieldQuery = {
  type: "geo_location",
  key: "office",
  center: classificationCoordinates,
  // @ts-expect-error Classification geo queries use radius_meters, never radius.
  radius: 1_000,
};
void legacyClassificationOperation;
void legacyClassificationRadius;

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
// @ts-expect-error Zone ownership is assigned by the server.
zoneInput.store_id_assigned = "store-contract";

declare const storefrontClient: ReturnType<typeof createStorefront>;
storefrontClient.classification.get({ key: "topics" });
// @ts-expect-error Classification is a top-level module, not a Content child.
storefrontClient.content.classification;
declare const adminClient: ReturnType<typeof createAdmin>;
const ordinaryAdminInvitation: AddMemberParams = { email: "admin@example.test" };
const ownershipTransferParams: TransferStoreOwnershipParams = {
  account_id: "a35bc883-e98c-4fa9-94a2-8cbb7c3ac755",
};
const ownershipTransferResult: Promise<StoreMembership> =
  adminClient.store.member.transferOwnership(ownershipTransferParams);
adminClient.store.member.invite(ordinaryAdminInvitation);
// @ts-expect-error Ordinary membership creation cannot choose Owner or any other role.
adminClient.store.member.add({ email: "owner@example.test", role: "owner" });
// @ts-expect-error Invitations never grant Owner authority.
adminClient.store.member.invite({ email: "admin@example.test", role: "admin" });
void ownershipTransferResult;
const mailboxIssueQuery: FindMailboxSyncIssuesParams = {
  id: "mailbox-contract",
  store_id: "store-contract",
  limit: 50,
  cursor: "opaque-cursor",
};
const mailboxIssues: Promise<PaginatedResponse<MailboxSyncIssue>> =
  adminClient.notification.mailbox.findSyncIssues(mailboxIssueQuery);
const mailboxIssueSource: MailboxIncomingSource = {
  type: "imap", mailbox: "INBOX", uid_validity: 123, uid: 456,
};
const mailboxIssue: MailboxSyncIssue = {
  id: "issue-contract", store_id: "store-contract", mailbox_id: "mailbox-contract",
  source: mailboxIssueSource,
  reason: "missing_sender", message: "The email has no sender header",
  observed_at: epochMilliseconds(0),
};
const mailboxIssueInstant: import("arky-sdk").EpochMilliseconds = mailboxIssue.observed_at;
const nativeImapUid: number = mailboxIssueSource.uid;
const googleIssueSource: MailboxIncomingSource = { type: "google", message_id: "a123" };
// @ts-expect-error Diagnostics never expose retained raw mail.
mailboxIssue.raw_email;
// @ts-expect-error Credential generation is private to the Server.
mailboxIssue.credential_generation;
// @ts-expect-error Observed time requires checked epoch milliseconds.
mailboxIssue.observed_at = 1_800_000_000_001;
// @ts-expect-error Source identity uses the canonical type discriminator.
const legacyIssueSource: MailboxIncomingSource = { kind: "google", message_id: "a123" };
// @ts-expect-error Diagnostic reasons are fixed safe values, not arbitrary error text.
const unsafeIssueReason: MailboxSyncIssueReason = "private raw provider response";
// @ts-expect-error Diagnostics have no retry command.
adminClient.notification.mailbox.retrySyncIssue({ id: mailboxIssue.id });
// @ts-expect-error Diagnostics have no purge command.
adminClient.notification.mailbox.purgeSyncIssues({ id: "mailbox-contract" });
void [mailboxIssues, mailboxIssueInstant, nativeImapUid, googleIssueSource, legacyIssueSource, unsafeIssueReason];
const bookingItemLifecycleParams: BookingItemLifecycleParams = {
  order_id: "order-contract",
  order_booking_item_id: "order-booking-item-contract",
};
const getAppointment: GetOrderBookingParams = bookingItemLifecycleParams;
const appointment: Promise<OrderBooking> = adminClient.eshop.order.getBookingAppointment(getAppointment);
// @ts-expect-error Appointment inspection is an Admin operation, not public discovery.
storefrontClient.eshop.order.getBookingAppointment(getAppointment);
void appointment;
const cancelBookingItemParams: CancelBookingItemParams = {
  ...bookingItemLifecycleParams,
  command_id: "bef10d85-72e3-4853-9c12-8e419dc2d8dc",
};
const adminBookingCancellation: Promise<Order> =
  adminClient.eshop.order.cancelBookingItem(cancelBookingItemParams);
const adminBookingCompletion: Promise<Order> =
  adminClient.eshop.order.completeBookingItem(bookingItemLifecycleParams);
const adminBookingNoShow: Promise<Order> =
  adminClient.eshop.order.markBookingItemNoShow(bookingItemLifecycleParams);
const storefrontBookingCancellation: Promise<StorefrontDto<Order>> =
  storefrontClient.eshop.order.cancelBookingItem(cancelBookingItemParams);
// @ts-expect-error Cancellation requires a caller-retained command identity.
adminClient.eshop.order.cancelBookingItem(bookingItemLifecycleParams);
// @ts-expect-error Storefront cancellation requires the same stable command identity.
storefrontClient.eshop.order.cancelBookingItem(bookingItemLifecycleParams);
// @ts-expect-error A verified owning Customer cannot complete a booking item.
storefrontClient.eshop.order.completeBookingItem(bookingItemLifecycleParams);
// @ts-expect-error A verified owning Customer cannot mark a booking item as a no-show.
storefrontClient.eshop.order.markBookingItemNoShow(bookingItemLifecycleParams);
const classificationChildren: Promise<{ items: Classification[]; cursor: string | null }> =
  adminClient.classification.getChildren({ id: "classification-contract" });
adminClient.classification.get({ id: "classification-contract" });
// @ts-expect-error Admin Classification lookup uses its UUID, not a derived key.
adminClient.classification.get({ key: "topics" });
// @ts-expect-error Classification is a top-level module, not a Content child.
adminClient.content.classification;
void classificationChildren;
const storefrontBookingOfferings: Promise<PaginatedResponse<StorefrontDto<BookingOffering>>> =
  storefrontClient.eshop.bookingOffering.find({
    booking_service_id: "booking-service-contract",
  });
const bookingResources: Promise<
  StorefrontDto<PaginatedResponse<BookingResource>>
> = storefrontClient.eshop.bookingResource.find({
  booking_service_id: "booking-service-contract",
  sort_field: "key",
  sort_direction: "asc",
  created_at_from: epochMilliseconds(0),
});
// @ts-expect-error Resources have no Catalog price ordering.
storefrontClient.eshop.bookingResource.find({ sort_field: "price" });
// @ts-expect-error Availability windows belong to Service availability, not Resource discovery.
storefrontClient.eshop.bookingResource.find({ from: epochMilliseconds(0) });
// @ts-expect-error Availability windows belong to Service availability, not Resource discovery.
storefrontClient.eshop.bookingResource.find({ to: epochMilliseconds(1) });
// @ts-expect-error Resource classification predicates have no match_all switch.
adminClient.eshop.bookingResource.find({ match_all: true });
const bookingServices: Promise<
  StorefrontDto<PaginatedResponse<BookingService>>
> = storefrontClient.eshop.bookingService.find({ sort_field: "price", include_price: true });
const bookingAvailability: Promise<AvailabilityResponse> = storefrontClient.eshop.bookingService.getAvailability({
  booking_service_id: "booking-service-contract",
  company_id: "company-contract",
  company_location_id: "branch-contract",
  from: epochMilliseconds(1_800_000_000_000),
  to: epochMilliseconds(1_800_086_400_000),
  limit: 20,
  cursor: "availability-position",
});
void bookingAvailability;
// @ts-expect-error Storefront discovery determines publication; callers cannot select a status.
storefrontClient.eshop.bookingService.find({ status: "active" });
declare const bookingServiceContract: BookingService;
declare const bookingResourceContract: BookingResource;
const bookingServiceEnglishSlug: string = bookingServiceContract.slugs.en;
const bookingResourceEnglishSlug: string = bookingResourceContract.slugs.en;
// @ts-expect-error Booking Service records no longer expose the singular persisted field.
bookingServiceContract.slug;
// @ts-expect-error Booking Resource records no longer expose the singular persisted field.
bookingResourceContract.slug;
const requestedInterval: TimeRange = { from: epochMilliseconds(1_800_000_000_000), to: epochMilliseconds(1_800_003_600_000) };
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
  price_override: manualPrice,
};
const cartBookingItemContract: CartBookingItem = {
  id: "cart-booking-item-contract",
  booking_offering_id: bookingCartInput.booking_offering_id,
  requested_interval: requestedInterval,
  capacity_units: 1,
  form_submission_id: bookingCartInput.form_submission_id ?? null,
  price_override: null,
};
const canonicalCartContract: Cart = {
  id: "cart-contract",
  store_id: "store-contract",
  customer_id: "customer-contract",
  company: null,
  status: { type: "active" },
  origin: {
    type: "storefront",
    customer_id: "customer-contract",
    customer_session_id: "customer-session-contract",
  },
  market_id: "market-contract",
  sales_channel_id: "channel-contract",
  line_items: [
    { type: "product", ...cartProductItemContract },
    { type: "booking", ...cartBookingItemContract },
    { type: "digital_product", ...cartDigitalItemContract },
  ],
  delivery_groups: [],
  billing_address: null,
  promotion_code_ids: [],
  purchase_order_number: null,
  item_count: 3,
  last_action_at: epochMilliseconds(1),
  abandoned_at: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
// @ts-expect-error Form submissions belong to individual Cart items.
canonicalCartContract.forms;
declare const embeddedBookingItem: OrderBookingItem;
const embeddedOfferingId: string | null = embeddedBookingItem.booking_offering_id;
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
// @ts-expect-error Variants are an independently paginated resource.
storefrontProduct.variants;
declare const storefrontVariant: Awaited<ReturnType<typeof storefrontClient.eshop.productVariant.get>>;
// @ts-expect-error Public variants do not expose Store routing identity.
storefrontVariant.store_id;
// @ts-expect-error Public variants do not expose location stock balances.
storefrontVariant.inventory;
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
initializedStorefront.eshop.bookingService.loadMoreAvailability();
initializedStorefront.eshop.bookingService.select({
  ...bookingServiceContract,
  price: null,
  purchase_allowed: true,
}, { company_id: "company-contract", company_location_id: "branch-contract" });
initializedStorefront.classification.get({ key: "topics" });
// @ts-expect-error Classification is a top-level module, not a Content child.
initializedStorefront.content.classification;
const typedFormValues: FormValues = {
  name: "Jane",
  guests: 2,
  accepted: false,
  date: 1_725_000_000_000,
  location: { coordinates: { lat: 43.8563, lon: 18.4131 } },
  channels: ["email"],
};
declare const displayedForm: Awaited<ReturnType<typeof initializedStorefront.forms.get>>;
initializedStorefront.forms.submitByKey({
  id: 'accepted-form-request',
  key: "contact-form",
  presentation: displayedForm,
  values: typedFormValues,
});
initializedStorefront.forms.submitByKey({
  id: 'accepted-form-request',
  key: "contact-form",
  presentation: displayedForm,
  // @ts-expect-error Store IDs are not part of storefront request inputs.
  store_id: "store-contract",
  values: typedFormValues,
});
initializedStorefront.forms.submitByKey({
  id: 'accepted-form-request',
  key: "contact-form",
  presentation: displayedForm,
  values: {
    // @ts-expect-error form values cannot contain arbitrary objects.
    invalid: new Date(),
  },
});
const textFormSchema: FormSchema = {
  question: null,
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
void mediaWithoutOriginal;

declare const storefrontIdentify: StorefrontIdentifyResult;
const storefrontEntryIdentify: StorefrontEntryIdentifyResult =
  storefrontIdentify;
// @ts-expect-error issued credentials are nested under the Session variant.
storefrontIdentify.token;
// @ts-expect-error storefront DTOs strip routing ownership fields such as store_id.
storefrontIdentify.customer.store_id;
if (storefrontIdentify.session.type === "visitor") {
  const issuedVisitorToken: string = storefrontIdentify.session.token;
  void issuedVisitorToken;
}

declare const paymentStorefront: ReturnType<typeof initialize>;
// @ts-expect-error hosted Checkout removed the browser Stripe controller.
paymentStorefront.eshop.cart.payment;

const accountingTaxLine: TaxLine = {
  id: "tax-line",
  title: "Tax",
  calculation: { type: "percentage", rate: { numerator: 1, denominator: 5 }, compound: false },
  source: { type: "arky_component", component_id: "tax-component" },
  component_index: 0,
  amount: 250,
  taxable_base: 1_250,
  included_in_price: false,
  jurisdiction_country: "US",
  jurisdiction_region: null,
  jurisdiction_postal_code: null,
};
// @ts-expect-error no provider tax identity is fabricated by Arky.
accountingTaxLine.tax_rate_id;
const taxComponentId: string = accountingTaxLine.source.component_id;
// @ts-expect-error Tax calculation is an exact rational or fixed-money union, not basis points.
accountingTaxLine.rate_bps;
const orderMoney: OrderMoney = {
  currency: "usd",
  subtotal: 1250,
  delivery: 0,
  discount: 0,
  tax_total: 250,
  duty_total: 0,
  total: 1250,
  promotions: [],
};
// @ts-expect-error capture_method is transaction/provider state, not order money.
orderMoney.capture_method;

const paymentAmounts: PaymentAmounts = {
  currency: "usd",
  total: 1_250,
  authorized: 0,
  captured: 0,
  capture_pending: 0,
  refund_pending: 0,
  refunded: 0,
};
const stripeOrderPaymentProvider: PaymentProviderBinding = {
  type: "stripe_checkout",
  payment_provider_id: "payment-provider-contract",
  checkout_expires_at: epochMilliseconds(1_800_000_000_000),
  checkout_session_id: "checkout-session-contract",
  payment_intent_id: null,
};
const cashOrderPaymentProvider: PaymentProviderBinding = {
  type: "cash_on_delivery",
  payment_provider_id: "payment-provider-cash-contract",
  marked_paid_by_account_id: null,
};
const orderPayment: Payment = {
  id: "order-payment-contract",
  store_id: "store-contract",
  order_id: "order-contract",
  payer_customer_id: "customer-contract",
  provider: stripeOrderPaymentProvider,
  status: { type: "requires_action" },
  checkout_expiration: null,
  amounts: paymentAmounts,
  request_id: "payment-request-contract",
  reconciliation: { type: "clear" },
  completed_at: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
  safe_error: null,
};
const savedMethodPayment: Payment = {
  ...orderPayment,
  provider: { type: "stripe_saved_method", payment_provider_id: "provider", customer_payment_method_id: "method", payment_intent_id: null },
  status: { type: "authorized" },
};
const invoicePayment: Payment = {
  ...orderPayment,
  provider: { type: "stripe_invoice", payment_provider_id: "provider", stripe_invoice_id: "invoice", stripe_invoice_payment_id: "invoice-payment", payment_object: { type: "charge", charge_id: "charge" } },
  status: { type: "completed" },
  reconciliation: { type: "hold", opened_at: epochMilliseconds(2) },
};
const manualPayment: Payment = {
  ...orderPayment,
  provider: { type: "manual", payment_provider_id: "provider", reference: null, marked_paid_by_account_id: null },
};
const paymentOwners: string[] = [savedMethodPayment.order_id, invoicePayment.payer_customer_id, manualPayment.request_id];
// @ts-expect-error every collection belongs directly to its Order, not a polymorphic source.
orderPayment.source;
// @ts-expect-error captured money is independent of authorization and collection status.
orderPayment.amounts.paid;
// @ts-expect-error capture roots own collection evidence, not a duplicate settlement on Payment.
orderPayment.settlement;
const zeroTotalCheckout: OrderCheckoutResult = {
  checkout_id: "checkout-zero-total-contract",
  order_id: "order-zero-total-contract",
  number: "1000",
  payment_action: { type: "none" },
  payment: null,
};
const recordCashOnDeliveryCollection: RecordCashOnDeliveryCollectionParams = {
  id: "order-payment-contract",
  payment_capture_id: "capture-contract",
  money: { currency: "usd", amount: 1250 },
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
    expires_at: epochMilliseconds(2),
  },
  payment: orderPayment,
};

const shippingLine: OrderDeliveryGroup = {
  id: "shipping-line-contract",
  items: [{ order_product_item_id: "order-product-item-contract", quantity: 1, unit_spans: [{ first_unit: 0, quantity: 1 }] }],
  destination: { type: "delivery", address: { country: "US", street1: "1 Main Street", city: "Boston", postal_code: "02108" } },
  shipping_method_id: "shipping-method-contract",
  shipping_rate_id: "shipping-rate-contract",
  shipping_method_key: "standard",
  shipping_profile_key: "standard",
  name_block_id: "shipping-name",
  content: [{ id: "shipping-name", key: "name", type: "text", value: "Standard" }],
  delivery_estimate: null,
  scheduled_window: null,
  accepted_pricing: {
    source_shipping_method_id: "shipping-method-contract", source_shipping_rate_id: "shipping-rate-contract", source_shipping_profile_id: "profile-contract",
    selected_market_zone_id: "zone-contract", policy_digest: "policy", merchandise_basis: { currency: "usd", amount: 2500 }, weight_grams: null,
    calculation: { type: "flat", amount: { currency: "usd", amount: 500 } }, free_above_subtotal: null,
    customer_subtotal: { currency: "usd", amount: 500 }, accepted_at: epochMilliseconds(1), rounding_version: "rounding",
  },
  money: {
    unit_price: 500,
    subtotal: 500,
    discount_allocations: [],
    discount_total: 0,
    tax_lines: [],
    tax_total: 0,
    duty_lines: [],
    duty_total: 0,
    total: 500,
    tax_assessment: { type: "assessed", assessment: {
      tax_mode: "exclusive", treatment: { type: "not_collecting", reason_code: "not_registered" }, address_basis: { type: "delivery" },
      address: { country: "US", street1: "1 Main Street", city: "Boston", postal_code: "02108" }, location_evidence: [],
      source: { type: "arky_rule", market_zone_id: "zone-contract", tax_rule_id: "tax-rule", tax_category_id: null, tax_category_key: null },
      policy_version: "policy", rounding_version: "rounding", assessed_at: epochMilliseconds(1), tax_date: epochMilliseconds(1), buyer_evidence: null,
    } },
  },
};
// @ts-expect-error shipping method identity has one canonical field.
shippingLine.code;
const embeddedOrderProductItem: OrderProductItem = {
  id: "order-product-item-contract",
  origin: { type: "direct" },
  product_id: "product-contract",
  variant_id: "variant-contract",
  quantity: 1,
  cancelled_quantity: 0,
  backordered_quantity: 0,
  location_allocations: [
    {
      store_location_id: "store-location-contract",
      quantity: 1,
      cancelled_quantity: 0,
      fulfillment_order_id: "fulfillment-order", fulfillment_order_line_id: "fulfillment-line", order_delivery_group_id: shippingLine.id,
      unit_spans: [{ first_unit: 0, quantity: 1 }],
    },
  ],
  form_submission_id: "form-submission-product-contract",
  form_submission: { source_submission_id: "form-submission-product-contract", source_form_id: "form", form_version: "v1", values: {}, accepted_at: epochMilliseconds(1) },
  snapshot: {
    product_key: "product-contract",
    product_name: { text: "Accepted product", locale: "en" },
    variant_sku: null,
    variant_attributes: [],
    price: acceptedOrderPrice,
    fulfillment: { type: "physical", shipping_profile_id: "profile-contract", shipping_profile_key: "standard", source_shipping_profile_id: "profile-contract", backorder: { type: "disallow" }, inventory_requirements: [{ inventory_item_id: "inventory-item", source_inventory_item_id: "inventory-item", inventory_item_key: "shirt", quantity: 1, physical: { weight_grams: 750, dimensions: null }, customs: { origin_country: "US", hs_code: null, material: null }, tracking: { type: "tracked" }, sku: null, barcode: null }] },
    source_product_id: "product-contract", source_variant_id: "variant-contract",
  },
  status: { type: "confirmed" },
  money: shippingLine.money,
  money_runs: [{ id: "money-run", span: { first_unit: 0, quantity: 1 }, delivery_group_id: shippingLine.id, per_unit: shippingLine.money }],
  cancelled_units: [],
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const embeddedOrderBookingItem: OrderBookingItem = {
  id: "order-booking-item-contract",
  booking_offering_id: "booking-offering-contract",
  booking_service_id: "booking-service-contract",
  booking_resource_id: "booking-resource-contract",
  interval: requestedInterval,
  capacity_intervals: [requestedInterval],
  capacity_units: 1,
  form_submission_id: "form-submission-booking-contract",
  form_submission: { source_submission_id: "form-submission-booking-contract", source_form_id: "form", form_version: "v1", values: {}, accepted_at: epochMilliseconds(1) },
  snapshot: {
    service_key: "service-contract",
    service_name: { text: "Accepted service", locale: "en" },
    resource_key: "resource-contract",
    resource_name: { text: "Accepted resource", locale: "en" },
    timezone: "Europe/Sarajevo",
    price: appliedPrice,
    source_offering_id: "booking-offering-contract", source_service_id: "booking-service-contract", source_resource_id: "booking-resource-contract",
  },
  status: { type: "confirmed" },
  money: shippingLine.money,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const embeddedOrderDigitalItem: OrderDigitalItem = {
  id: "order-digital-item-contract",
  origin: { type: "direct" },
  access: { recipient: { type: "customer", customer_id: "customer-contract" }, validity: { type: "permanent" }, revocation: null },
  digital_product_id: digitalProductContract.id,
  form_submission_id: "form-submission-digital-contract",
  form_submission: { source_submission_id: "form-submission-digital-contract", source_form_id: "form", form_version: "v1", values: {}, accepted_at: epochMilliseconds(1) },
  snapshot: orderDigitalSnapshotContract,
  status: { type: "confirmed" },
  money: shippingLine.money,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const orderOrigin: PurchaseOriginSnapshot = {
  type: "storefront",
  customer_id: "customer-contract",
  customer_session_id: "customer-session-contract",
  authentication: { type: "visitor" },
};
const orderContract: Order = {
  id: "order-contract",
  number: "1002",
  store_id: "store-contract",
  type: {
    type: "purchase",
    source: { type: "checkout", checkout_id: "checkout-contract" },
  },
  customer_id: "customer-contract",
  customer_snapshot: {
    email: "buyer@example.test",
    authentication: { type: "visitor" },
    source_customer_id: "customer-contract",
    source_email_identity_id: null,
  },
  company: null,
  payment_terms: null,
  purchase_order_number: null,
  market_id: "market-contract",
  market_snapshot: {
    key: "web",
    currency: "usd",
    tax_mode: "exclusive",
    source_market_id: "market-contract",
  },
  sales_channel_id: "channel-contract",
  sales_channel_snapshot: {
    key: "web",
    name: "Web",
    source_sales_channel_id: "channel-contract",
  },
  origin: orderOrigin,
  status: { type: "confirmed" },
  line_items: [
    { type: "product", ...embeddedOrderProductItem },
    { type: "booking", ...embeddedOrderBookingItem },
    { type: "digital_product", ...embeddedOrderDigitalItem },
  ],
  money: orderMoney,
  delivery_groups: [],
  billing_address: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
  accepted_at: epochMilliseconds(1),
  seller: {
    profile: {
      legal_name: "Contract Seller",
      registration_number: null,
      tax_registrations: [],
      address: { country: "US" },
    },
    configuration_digest: "a".repeat(64),
  },
  invoice_policy: { type: "not_required", reason: "Contract fixture" },
  renewal_recovery: null,
  reconciliation: { type: "clear" },
  collection_policy: { type: "prepaid", due_at: epochMilliseconds(1) },
  promotion_redemptions: [],
  payment_authorization: {
    allowed_provider_ids: ["provider-contract"],
    actor: orderOrigin,
    accepted_at: epochMilliseconds(1),
  },
};
const cancelEmbeddedProductItem: CancelOrderProductItemParams = {
  order_id: orderContract.id,
  order_product_item_id: embeddedOrderProductItem.id,
  command_id: "product-cancellation-command",
  expected_updated_at: orderContract.updated_at,
  units: [{ first_unit: 0, quantity: 1 }],
};
const pendingOrderCancellation: Promise<import("arky-sdk").OrderCancellationReceipt> =
  adminClient.eshop.order.cancelPending({ order_id: orderContract.id, command_id: "cancellation-command" });
// @ts-expect-error general Order updates cannot cancel an accepted purchase.
adminClient.eshop.order.update({ id: orderContract.id, cancel: true });
// @ts-expect-error asynchronous pending cancellation requires a caller-owned command ID.
adminClient.eshop.order.cancelPending({ order_id: orderContract.id });
// @ts-expect-error pending whole-Order cancellation is Admin-only.
storefrontClient.eshop.order.cancelPending({ order_id: orderContract.id, command_id: "cancellation-command" });
// @ts-expect-error cancellation needs stable command identity, an Order revision and exact units.
const quantityOnlyProductCancellation: CancelOrderProductItemParams = { order_id: orderContract.id, order_product_item_id: embeddedOrderProductItem.id, quantity: 1 };
// @ts-expect-error product cancellation is an Admin-only command.
storefrontClient.eshop.order.cancelProductItem(cancelEmbeddedProductItem);
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
const fulfillmentOrderStatus: FulfillmentOrderStatus = { type: "open" };
declare const cart: Cart;
// @ts-expect-error cart recovery is not a product lifecycle in the current model.
cart.recovery_sent_at;

const safeSocialCredential: SocialCredential = {
  expires_at: null,
  scopes: ["posts.write"],
  has_refresh_token: true,
};
const unsafeSocialCredential: SocialCredential = {
  expires_at: null,
  scopes: [],
  has_refresh_token: false,
  // @ts-expect-error public social connection DTOs never contain provider secrets.
  access_token: "provider-secret",
};
declare const socialConnection: SocialConnection;
declare const socialMessage: SocialMessage;
const replyCount: number | null = socialMessage.reply_count;
const replied: boolean | null = socialMessage.replied;
// @ts-expect-error projection summary may be unavailable.
const alwaysKnownReplyCount: number = socialMessage.reply_count;
// @ts-expect-error projection summary may be unavailable.
const alwaysKnownReplied: boolean = socialMessage.replied;
const socialConnectionPage: Promise<{ items: SocialConnection[]; cursor: string | null }> =
  adminClient.social.connections.find({ query: "Facebook Garden", status: "connected", limit: 20 });
const exactSocialConnection: Promise<SocialConnection> = adminClient.social.connections.get({ connection_id: "connection-contract" });
// @ts-expect-error connection credentials are embedded and never publicly exposed.
socialConnection.credential;
const tiktokConnectionType: SocialConnectionType = "tiktok_account";
const tiktokPrivacy: TiktokPrivacy = "private";
const tiktokContent: SocialPostContent = {
  type: "tiktok_account",
  caption: "Launch",
  video_media_id: "media-contract",
  privacy: tiktokPrivacy,
};

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
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
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
  status: { type: "active" },
  variables: {},
  channel_metadata: {},
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const inboundSupportMessage: ReceiveSupportChannelMessageParams = {
  store_id: "store-contract",
  channel_id: "channel-contract",
  customer_id: "customer-contract",
  channel_context: {
    type: "email",
    thread_id: "thread-contract",
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
  attachments: [],
  metadata: {},
  ai_response_status: null,
  email_status: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const supportEmailStatus: SupportEmailStatus = {
  type: "sent",
  provider_message_id: "provider-support-message",
  provider_thread_id: null,
  provider_status: 202,
  sent_at: epochMilliseconds(2),
};

const campaignConversationMessage: CampaignConversationMessage = {
  message: {
    id: "campaign-message-contract",
    store_id: "store-contract",
    campaign_id: "campaign-contract",
    campaign_enrollment_id: "enrollment-contract",
    position: 1,
    parent_message_id: null,
    type: {
      type: "outgoing",
      origin: {
        type: "account_session",
        account_session_id: "account-session-contract",
      },
      status: { type: "submitted", delivery_status: { type: "requested", requested_at: epochMilliseconds(2) } },
    },
    content: {
      to_email: "recipient@example.test",
      from_email: "sender@example.test",
      subject: "Hello",
      body_text: "Hello",
      body_html: null,
    },
    created_at: epochMilliseconds(1),
    updated_at: epochMilliseconds(2),
  },
  email_status: { type: "requested", requested_at: epochMilliseconds(2) },
};

const workflowEmailNode: WorkflowSendEmailNode = {
  type: "send_email",
  send: {
    type: "contact_store_notification",
    data: {
      store_id: "{{input.store.id}}",
      mailbox_id: "mailbox-contract",
      template_id: "template-contract",
      recipient: "operations@example.test",
      vars: {},
    },
  },
  delay_ms: 0,
};
// @ts-expect-error one Workflow email operation accepts exactly one recipient.
workflowEmailNode.send.data.recipients;

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
  message_cursor: "opaque-history-position",
};
// @ts-expect-error history uses an opaque continuation, not a timestamp watermark.
storefrontSupportRead.after_created_at;
// @ts-expect-error public messages expose the safe AI status, not the private operation.
supportMessageWithNullState.ai_response;
// @ts-expect-error Support response statuses are tagged objects.
supportConversationWithNullableSession.status = "active";
// @ts-expect-error Support email status uses the type discriminator.
supportEmailStatus.status;
const supportPendingMessage: SupportMessage = {
  ...supportMessageWithNullState,
  ai_response_status: { type: "processing", started_at: epochMilliseconds(1), deadline_at: epochMilliseconds(2) },
};
// @ts-expect-error pending AI status must include its exact processing deadline.
supportPendingMessage.ai_response_status = { type: "processing", started_at: epochMilliseconds(1) };

const subscriptionStatus: StoreSubscriptionStatus = { type: "pending" };
const storeSubscriptionRead: StoreSubscription = {
  id: "d397ff50-690b-4da7-9fb9-17740e535d69",
  store_id: "store-contract",
  plan_access: null,
  status: subscriptionStatus,
  checkout: null,
  operation: null,
  payment_action: { type: "none" },
  trial_started_at: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const selectedStoreSubscription: StoreSubscription = {
  ...storeSubscriptionRead,
  payment_action: {
    type: "stripe_embedded_checkout",
    publishable_key: "pk_test_contract",
    client_secret: "cs_contract_secret_exact",
    stripe_account_id: null,
    expires_at: epochMilliseconds(2),
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
const invalidStoreSubscriptionStatus: StoreSubscriptionStatus =
  "requires_action";

// @ts-expect-error Subscription lifecycle responses are tagged, not bare strings.
const legacyStoreSubscriptionStatus: StoreSubscriptionStatus = "active";
const processingStoreCheckout: import('arky-sdk').StoreSubscriptionCheckoutStatus = {
  type: "processing", started_at: epochMilliseconds(1), deadline_at: epochMilliseconds(2), retry_error: null,
};
// @ts-expect-error Public subscription processing does not expose its private claim.
processingStoreCheckout.claim;
const requestedStoreCancellation: import('arky-sdk').StoreSubscriptionOperation = {
  id: "operation", type: "cancel_immediately", status: { type: "requested", requested_at: epochMilliseconds(1) },
};
// @ts-expect-error Public Checkout does not retain the private billing address.
storeSubscriptionRead.checkout?.billing_email;
// @ts-expect-error Return URLs belong to the command, not the public Checkout read.
storeSubscriptionRead.checkout?.return_url;
export type StoreSubscriptionStatusContracts = [typeof processingStoreCheckout, typeof requestedStoreCancellation];

// @ts-expect-error storefront support messages require the capability token.
const supportMessageWithoutCapability: StorefrontSendSupportMessageParams = {
  conversation_id: "conversation-contract",
  message_id: "018f477d-1cae-4c12-bf12-123456789abc",
  input: { type: "text", content: "Help" },
};

const account: Account = {
  id: "account-contract",
  email: "operator@example.test",
  platform_role: "standard",
  status: { type: "active" },
  last_login_at: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
// @ts-expect-error Account lifecycle/onboarding was removed.
account.lifecycle;

const pendingAccountSessionResponse: PendingAccountSession = {
  session_id: "session-contract",
  verification_expires_at: epochMilliseconds(600),
};
const verifyPendingAccountSession: VerifyPendingAccountSessionParams = {
  session_id: pendingAccountSessionResponse.session_id,
  code: "123456",
};
const authToken: AuthToken = {
  id: pendingAccountSessionResponse.session_id,
  scope: { type: "account" },
  access_token: "account_access_contract",
  refresh_token: "account_refresh_contract",
  access_expires_at: epochMilliseconds(3_600),
  refresh_expires_at: epochMilliseconds(604_800),
  authenticated_at: epochMilliseconds(10),
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(10),
};
// @ts-expect-error an Active Account Session is proof of verification.
authToken.is_verified;

const invitationEmailStatus: AccountVerificationEmailStatus = { type: "processing" };
const pendingAccountSession: AccountSession = {
  id: "pending-session-contract",
  scope: { type: "account" },
  status: { type: "pending_verification" },
  verification_expires_at: epochMilliseconds(600),
  access_expires_at: null,
  refresh_expires_at: null,
  authenticated_at: null,
  revoked_at: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const activeAccountSession: AccountSession = {
  id: "active-session-contract",
  scope: { type: "store", store_id: "store-contract" },
  status: { type: "active" },
  verification_expires_at: null,
  access_expires_at: epochMilliseconds(3_600),
  refresh_expires_at: epochMilliseconds(604_800),
  authenticated_at: epochMilliseconds(10),
  revoked_at: null,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(10),
};
const revokedAccountSession: AccountSession = {
  id: "revoked-session-contract",
  scope: { type: "account" },
  status: { type: "revoked" },
  verification_expires_at: null,
  access_expires_at: null,
  refresh_expires_at: null,
  authenticated_at: null,
  revoked_at: epochMilliseconds(20),
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(20),
};
const terminalSessionStatus: AccountSessionStatus = { type: "superseded" };
const storeSessionScope: AccountSessionScope = { type: "store", store_id: "store-contract" };
// @ts-expect-error Store confinement requires an exact Store.
const missingStoreSessionScope: AccountSessionScope = { type: "store" };
// @ts-expect-error Account-wide scope cannot carry a separate Store authority.
const accountScopeWithStore: AccountSessionScope = { type: "account", store_id: "store-contract" };
void storeSessionScope;
void missingStoreSessionScope;
void accountScopeWithStore;

const personalApiToken: AccountApiToken = {
  id: "api-token-contract",
  token_hint: "ract",
  name: "Local automation",
  status: { type: "active" },
  expires_at: epochMilliseconds(100),
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
  revoked_at: null,
};
// Expiry is derived from expires_at; it is not a persisted status.
// @ts-expect-error Account API Token status is only active or revoked.
const expiredApiTokenStatus: AccountApiTokenStatus = { type: "expired" };
// @ts-expect-error Account API Token status is a tagged value.
const untaggedApiTokenStatus: AccountApiTokenStatus = "active";
// @ts-expect-error Account Session status is a tagged value.
const untaggedAccountSessionStatus: AccountSessionStatus = "active";
declare const customer: Customer;
declare const product: Product;
declare const productInventory: ProductInventory;
declare const productVariant: ProductVariant;
const productStatus: ProductStatus = product.status;
// @ts-expect-error Product status is the canonical typed status union.
const invalidProductStatus: ProductStatus = { type: "enabled" };
const productSlugs: Record<string, string> = product.slugs;
const productFulfillment: ProductFulfillment = productVariant.fulfillment;
const inventoryStoreLocationId: string = productInventory.store_location_id;
const inventoryOnHand: number = productInventory.on_hand;
const inventoryReserved: number = productInventory.reserved;
void productStatus;
void productSlugs;
void productFulfillment;
void inventoryStoreLocationId;
void inventoryOnHand;
void inventoryReserved;
const labelParcel = {
  length: 100,
  width: 75,
  height: 25,
  weight: 500,
  distance_unit: "mm",
  mass_unit: "g",
};
const labelAddress = {
  name: "Warehouse",
  company: null,
  street1: "1 Main Street",
  street2: null,
  city: "Sarajevo",
  state: null,
  postal_code: "71000",
  country: "BA",
  phone: null,
  email: null,
};
const shippingLabelRefund: ShippingLabelRefund = {
  id: "6ba7b812-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  shipping_label_id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
  status: {
    type: "succeeded",
    carrier_refund_id: "carrier-refund-contract",
    completed_at: epochMilliseconds(3),
  },
  idempotency_key: "label-refund-contract",
  requested_money: { amount: 895, currency: "usd" },
  financial_effects: [],
  created_at: epochMilliseconds(2),
  updated_at: epochMilliseconds(3),
};
const merchantDebit: MerchantDebit = {
  id: "6ba7b815-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  shipping_label_id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
  payment_provider_id: "6ba7b81c-9dad-41d1-80b4-00c04fd430c8",
  connected_account_id: "acct_contract",
  authorization: {
    accepted_by_account_id: "6ba7b81d-9dad-41d1-80b4-00c04fd430c8",
    accepted_at: epochMilliseconds(1),
    terms_version: 1,
  },
  status: {
    type: "succeeded",
    account_debit_payment_id: "py_contract",
    source_transfer_id: "tr_contract",
    completed_at: epochMilliseconds(2),
  },
  money: { amount: 905, currency: "usd" },
  idempotency_key: "merchant-debit-contract",
  livemode: false,
  financial_effects: [],
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const merchantDebitReversal: MerchantDebitReversal = {
  id: "6ba7b816-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  reason: {
    type: "unused_label_refund",
    shipping_label_refund_id: shippingLabelRefund.id,
  },
  status: {
    type: "succeeded",
    transfer_reversal_id: "trr_contract",
    destination_payment_refund_id: "re_contract",
    completed_at: epochMilliseconds(4),
  },
  money: { amount: 905, currency: "usd" },
  idempotency_key: "merchant-debit-reversal-contract",
  merchant_debit_id: merchantDebit.id,
  financial_effects: [],
  created_at: epochMilliseconds(3),
  updated_at: epochMilliseconds(4),
};
const shippingLabel: ShippingLabel = {
  id: "6ba7b811-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  rate_id: "signed-rate-contract",
  metadata: "{}",
  postage: { amount: 895, currency: "usd" },
  platform_label_fee: { amount: 10, currency: "usd" },
  status: {
    type: "succeeded",
    transaction_id: "txn_contract",
    label_url: "https://labels.example.test/label.pdf",
    completed_at: epochMilliseconds(2),
  },
  owner: { type: "outbound_shipment", shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8" },
  request: {
    origin: labelAddress,
    destination: labelAddress,
    parcel: labelParcel,
    customs: null,
    accepted_at: epochMilliseconds(1),
  },
  operation_id: "6ba7b81e-9dad-41d1-80b4-00c04fd430c8",
  idempotency_key: "shipping-label-contract",
  fee_refundable_if_unused: true,
  provider_scope: "shippo",
  reconciliation: { type: "clear" },
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const shippingLabelPurchase: ShippingLabelPurchase = {
  label: shippingLabel,
  merchant_debit: merchantDebit,
};
void shippingLabelPurchase;
void merchantDebitReversal;
const fulfillmentOrder: FulfillmentOrder = {
  id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  work_key: "original",
  status: { type: "in_progress" },
  method: { type: "delivery", destination: labelAddress },
  recipient: {
    source_customer_id: "6ba7b815-9dad-41d1-80b4-00c04fd430c8",
    email: "recipient@example.com",
    company: {
      source_company_id: "6ba7b820-9dad-41d1-80b4-00c04fd430c8",
      company_name: "Company",
      source_company_location_id: "6ba7b821-9dad-41d1-80b4-00c04fd430c8",
      company_location_name: "Branch",
    },
  },
  scheduled_window: { from: epochMilliseconds(3), to: epochMilliseconds(4) },
  lines: [
    {
      id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
      source: {
        type: "order_product",
        order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
        order_delivery_group_id: "6ba7b812-9dad-41d1-80b4-00c04fd430c8",
        order_product_line_item_id: "6ba7b817-9dad-41d1-80b4-00c04fd430c8",
        order_unit_spans: [{ first_unit: 0, quantity: 2 }],
      },
      quantity: 2,
      allocated_quantity: 2,
      fulfilled_quantity: 1,
      released_units: [],
      cancelled_units: [],
    },
  ],
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
};
const shipment: OrderShipment = {
  id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  store_id: "6ba7b819-9dad-41d1-80b4-00c04fd430c8",
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  fulfillment_order_id: fulfillmentOrder.id,
  origin_store_location_id: fulfillmentOrder.store_location_id,
  lines: [
    {
      fulfillment_order_line_id: fulfillmentOrder.lines[0].id,
      unit_spans: [{ first_unit: 0, quantity: 1 }],
      unit_bindings: [],
    },
  ],
  status: { type: "label_created" },
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
  tracking_status_at: epochMilliseconds(2),
  selected_label_id: shippingLabel.id,
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(2),
  dispatch: null,
  origin_address: labelAddress,
  destination_address: labelAddress,
};
const shippingLabelRate: ShippingLabelQuoteRate = {
  quote: "signed-rate-contract",
  carrier: "USPS",
  service: "priority",
  display_name: "USPS Priority",
  postage: { amount: 895, currency: "usd" },
  platform_label_fee: { amount: 10, currency: "usd" },
  total: { amount: 905, currency: "usd" },
  fee_refundable_if_unused: true,
  estimated_days: 3,
  expires_at: epochMilliseconds(5),
};
const shipmentStatus: OrderShipmentStatus = shipment.status;
const shipmentTrackingStatusAt: number | null = shipment.tracking_status_at;
const cancelledShippingStatus: OrderShipmentStatus = { type: "cancelled" };
const shippingRateRequest: QuoteShippingLabelParams = {
  owner: {
    type: "outbound_shipment",
    shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  },
};
const createShipmentRequest: CreateOrderShipmentParams = {
  order_id: "6ba7b81a-9dad-41d1-80b4-00c04fd430c8",
  shipment_id: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  origin_store_location_id: "6ba7b818-9dad-41d1-80b4-00c04fd430c8",
  fulfillment_order_id: "6ba7b813-9dad-41d1-80b4-00c04fd430c8",
  lines: [
    {
      fulfillment_order_line_id: "6ba7b814-9dad-41d1-80b4-00c04fd430c8",
      unit_spans: [{ first_unit: 1, quantity: 1 }],
      unit_bindings: [],
    },
  ],
  parcel: labelParcel,
  customs_declaration: null,
};
// @ts-expect-error FulfillmentOrder roots do not expose persistence versions.
fulfillmentOrder.version;
// @ts-expect-error FulfillmentOrder points to the canonical StoreLocation field.
fulfillmentOrder.location_id;
// @ts-expect-error Shipment roots do not expose persistence versions.
shipment.version;
// @ts-expect-error Shipment labels are provider-neutral.
shipment.shippo_label;
// @ts-expect-error carrier labels are independent roots, not Shipment projections.
shipment.label;
// @ts-expect-error merchant debit retries are orchestration state, not Domain truth.
merchantDebit.attempt_count;
// @ts-expect-error public merchant debit DTOs do not expose provider identifiers.
merchantDebit.provider;
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

const customerActionPageParams: FindCustomerActionsParams = {
  store_id: "store-contract",
  customer_id: "customer-contract",
  limit: 20,
  cursor: "cursor-contract",
};
type AssertNever<T extends never> = T;
type UnsupportedCustomerActionFilterKeys = AssertNever<
  Extract<keyof FindCustomerActionsParams, "query" | "types" | "from" | "to">
>;
const customerActionType: CustomerActionType = {
  type: "custom",
  value: {
    key: "page.view",
    data: { path: "/products/example", context: { meaning: "caller-owned" } },
  },
};
const customerAction: CustomerAction = {
  id: "customer-action-contract",
  store_id: "store-contract",
  customer_id: "customer-contract",
  origin: {
    type: "customer_session",
    customer_session_id: "customer-session-contract",
  },
  type: customerActionType,
  occurred_at: epochMilliseconds(1),
};
// @ts-expect-error immutable CustomerAction facts do not expose update timestamps.
customerAction.updated_at;
const trackCustomerAction: TrackCustomerActionParams = {
  key: "page.view",
  data: { path: "/products/example" },
};
const commonCustomerActionKey: CommonCustomerActionKey =
  COMMON_CUSTOMER_ACTION_KEYS[0];
const customerActionFilter: FindCustomersParams = { has_customer_action: true };
const experiment: Experiment = {
  id: "experiment-contract",
  store_id: "store-contract",
  key: "homepage-hero",
  status: { type: "running", started_at: epochMilliseconds(1) },
  goal_action_key: "checkout.started",
  attribution_window_days: 7,
  variants: [
    { key: "control", allocation_bps: 5_000 },
    { key: "guided", allocation_bps: 5_000 },
  ],
  created_at: epochMilliseconds(1),
  updated_at: epochMilliseconds(1),
};
const createExperiment: CreateExperimentParams = {
  key: "homepage-hero",
  goal_action_key: "checkout.started",
  attribution_window_days: 7,
  variants: [
    { key: "control", allocation_bps: 5_000 },
    { key: "guided", allocation_bps: 5_000 },
  ],
};
const experimentUse: ExperimentUseResponse = {
  type: "assigned",
  experiment_id: "experiment-contract",
  experiment_key: "homepage-hero",
  variant_key: "control",
};
const customerActionReportKey: AnalyticsCustomerActionReportKey =
  "recent_customer_action";
const customerActionFeed: CustomerActionFeedData = {
  items: [
    {
      id: "analytics-fact-contract",
      entity: "customer_action",
      entity_id: customerAction.id,
      action: "tracked",
      event_type: "page.view",
      status: "",
      customer_id: customerAction.customer_id,
      category: "customer_actions",
      title: "Page viewed",
      description: "A customer viewed a product.",
      data: {},
      created_at: epochMilliseconds(1),
    },
  ],
  summary: {
    total: 1,
    orders: 0,
    submissions: 0,
    customers: 0,
    customer_groups: 0,
    abandoned_carts: 0,
    carts: 0,
    products: 0,
    services: 0,
    providers: 0,
    content: 0,
    workflows: 0,
    customer_actions: 1,
    window_start: epochMilliseconds(1),
  },
  next_cursor: { created_at: epochMilliseconds(1), id: "analytics-fact-contract" },
  meta: { row_count: 1, execution_ms: 1 },
};
const checkoutAction: CheckoutPaymentAction = {
  type: "stripe_embedded_checkout",
  publishable_key: "pk_test_contract",
  client_secret: "cs_contract_secret_exact",
  connected_account_id: "acct_contract",
  expires_at: epochMilliseconds(2),
};
const mediaUpdatedWebhook: WebhookEventSubscription = {
  type: "media.updated",
};
const productItemUpdatedWebhook: WebhookEventSubscription = {
  type: "order_product_item.updated",
};
const digitalItemConfirmedWebhook: WebhookEventSubscription = {
  type: "order_digital_item.confirmed",
};
const customerArchivedWebhook: WebhookEventSubscription = {
  type: "customer.archived",
};
const eventAction: EventAction = { action: "product_created" };
const supportAction: SupportAction = {
  type: "end_conversation",
  message: "Thanks",
};

void [
  supportStart,
  storefrontIdentify,
  storefrontEntryIdentify,
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
  recordRefundMoney,
  paymentDisputeStatus,
  paymentDisputeProvider,
  paymentDispute,
  findPaymentDisputes,
  getPaymentDispute,
  zeroTotalCheckout,
  recordCashOnDeliveryCollection,
  missingConnectedAccountCheckout,
  accountingTaxLine,
  shippingLine,
  embeddedOrderProductItem,
  embeddedOrderBookingItem,
  embeddedOrderDigitalItem,
  orderContract,
  cancelEmbeddedProductItem,
  forbiddenBookingRewrite,
  fulfillmentOrderStatus,
  cart,
  safeSocialCredential,
  unsafeSocialCredential,
  mediaUpdatedWebhook,
  productItemUpdatedWebhook,
  digitalItemConfirmedWebhook,
  customerArchivedWebhook,
  tiktokConnectionType,
  tiktokContent,
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
  supportEmailStatus,
  campaignConversationMessage,
  workflowEmailNode,
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
  invitationEmailStatus,
  pendingAccountSession,
  activeAccountSession,
  revokedAccountSession,
  terminalSessionStatus,
  personalApiToken,
  expiredApiTokenStatus,
  customer,
  productVariant,
  getNode,
  mutationNode,
  missingHttpFields,
  retryingMutation,
  delayedMutationRetry,
  canonicalPage,
  customerActionPageParams,
  customerAction,
  trackCustomerAction,
  commonCustomerActionKey,
  customerActionFilter,
  experiment,
  createExperiment,
  experimentUse,
  customerActionReportKey,
  customerActionFeed,
  checkoutAction,
  eventAction,
  supportAction,
];
void sdkVersionLiteral;

const emailRestrictionPage: Promise<import("arky-sdk").PaginatedResponse<EmailSuppressionRecord>> =
  adminClient.customers.emailSuppression.find({ status: "active", limit: 20 });
const emailRestrictionSearch: FindEmailSuppressionsParams = { query: "person@example.com", type: "unsubscribe" };
const emailRestrictionCommand: ActivateEmailSuppressionParams = {
  id: "restriction-id", email: "person@example.com", command_id: "command-id", expected_version: null, note: "Recipient request",
};
const emailRestrictionRelease: ReleaseEmailSuppressionParams = {
  id: "restriction-id", command_id: "command-id", expected_version: "opaque-version", note: "Recipient requested resubscription",
};
const emailRestrictionSource: EmailSuppressionSource = { type: "admin", account_session_id: null };
// @ts-expect-error A restriction lifecycle uses status.type, not a bare string.
const bareEmailRestrictionStatus: EmailSuppressionStatus = "active";
// @ts-expect-error Exact email lookup cannot silently combine bounded Store pagination.
const paginatedEmailRestrictionSearch: FindEmailSuppressionsParams = { query: "person@example.com", limit: 20 };
// @ts-expect-error A command must explicitly provide a known version or null for new activation.
const missingEmailRestrictionVersion: ActivateEmailSuppressionParams = { id: "id", email: "person@example.com", command_id: "command", note: "reason" };
// @ts-expect-error Recipient evidence is CampaignMessage-owned, never invented Customer-session proof.
const inventedEmailRestrictionSource: EmailSuppressionSource = { type: "customer", customer_id: "customer-id" };
// @ts-expect-error No arbitrary deletion or release-both bypass is exposed.
adminClient.customers.emailSuppression.delete({ id: "id" });
void [emailRestrictionPage, emailRestrictionSearch, emailRestrictionCommand, emailRestrictionRelease,
  emailRestrictionSource, bareEmailRestrictionStatus, paginatedEmailRestrictionSearch,
  missingEmailRestrictionVersion, inventedEmailRestrictionSource];
