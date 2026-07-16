import type {
  Account,
  Contact,
  ContactListSubscribeResponse,
  ContactListMembershipPaymentAttemptStatus,
  ContactListMembershipPaymentAttemptType,
  ContactListPlanPriceInput,
  CreateShipmentParams,
  FindStoreSubscriptionActionEffectsParams,
  GetCollectionParams,
  GetShippingRatesParams,
  GetStoreSubscriptionActionEffectParams,
  OrderMoney,
  PaginatedResponse,
  ProductInventoryInput,
  ProductVariant,
  ServiceProvider,
  Shipment,
  ShippingStatus,
  SocialConnectionCredential,
  SocialConnectionData,
  SocialConnectionType,
  SocialOAuthCallbackStatus,
  SocialPublicationContent,
  SocialPublicationEffectRequest,
  SocialProviderCapability,
  StoreSubscriptionAction,
  StoreSubscriptionEffect,
  SubscriptionPlanFeatureType,
  TiktokPrivacy,
  StorefrontIdentifyResult,
  StorefrontGetSupportConversationParams,
  StorefrontSendSupportMessageParams,
  SupportConversationStartResponse,
  UpdateCartParams,
  MarketZoneInput,
  WorkflowHttpNode,
  WorkflowTool,
  WorkflowTriggerNode,
} from "../../dist/index.js";
import type { RequestOptions } from "../../dist/types.js";
import { PaymentMethodType, SDK_VERSION } from "../../dist/index.js";
import {
  createStorefront,
  initialize,
  type FormField,
  type FormSchema,
  type FormValues,
  type StorefrontIdentifyResult as StorefrontEntryIdentifyResult,
} from "../../dist/storefront.js";

const sdkVersionLiteral: "0.9.17" = SDK_VERSION;
const crmContactFeature: SubscriptionPlanFeatureType = "crm_contacts";
// @ts-expect-error the server's serialized feature key is crm_contacts.
const nonWireCrmProfileFeature: SubscriptionPlanFeatureType = "crm_profiles";
const contactListPlanPriceInput: ContactListPlanPriceInput = {
  currency: "usd",
  amount: 1200,
  interval: { period: "month", count: 1 },
};
const contactListPlanPriceWithProvider: ContactListPlanPriceInput = {
  currency: "usd",
  amount: 1200,
  // @ts-expect-error payment-provider bindings are server-owned output fields.
  providers: [{ type: "stripe", id: "price_untrusted" }],
};

const clearCartAddresses: UpdateCartParams = {
  id: "cart-contract",
  shipping_address: null,
  billing_address: null,
};

const inventoryInput: ProductInventoryInput = {
  location_id: "location-contract",
  available: 10,
  reserved: 0,
};
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
const storefrontServiceProviders: Promise<ServiceProvider[]> =
  storefrontClient.eshop.service.findProviders({
    service_id: "service-contract",
  });

declare const initializedStorefront: ReturnType<typeof initialize>;
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

const subscribeResult: ContactListSubscribeResponse = {
  payment_action: { type: "none" },
  payment_attempt: {
    plan_id: "plan-contract",
    amount: 1200,
    currency: "usd",
    interval: { period: "month", count: 1 },
    status: "unknown",
  },
};
const subscribeAttemptStatus: ContactListMembershipPaymentAttemptStatus | undefined =
  subscribeResult.payment_attempt?.status;
const paymentAttemptType: ContactListMembershipPaymentAttemptType = "create_payment_intent";
// @ts-expect-error payment attempt type is one flat discriminator, not a nested type object.
const nestedPaymentAttemptType: ContactListMembershipPaymentAttemptType = {
  type: "create_payment_intent",
};

declare const storefrontIdentify: StorefrontIdentifyResult;
const storefrontEntryIdentify: StorefrontEntryIdentifyResult =
  storefrontIdentify;
const verificationChallengeId: string | undefined =
  storefrontIdentify.verification_challenge?.challenge_id;
// @ts-expect-error session tokens stay private to the storefront client.
storefrontIdentify.token;

const orderMoney: OrderMoney = {
	currency: "usd",
  market: "us",
  subtotal: 1250,
  shipping: 0,
  discount: 0,
  total: 1250,
  tax: null,
  promo_code: null,
  zone_id: null,
  payment_method_key: "cash",
  shipping_method_id: null,
  method_type: PaymentMethodType.Cash,
};
// @ts-expect-error capture_method is transaction/provider state, not order money.
orderMoney.capture_method;

// @ts-expect-error refunds have their own lifecycle resource.
const embeddedRefundAttemptStatus: ContactListMembershipPaymentAttemptStatus =
  "refunded";
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

const storefrontSupportMessage: StorefrontSendSupportMessageParams = {
  conversation_id: "conversation-contract",
  support_token: "a".repeat(64),
  message_id: "018f477d-1cae-7c12-bf12-123456789abc",
  input: { type: "text", content: "Help" },
};

const storefrontSupportRead: StorefrontGetSupportConversationParams = {
  conversation_id: "conversation-contract",
  support_token: "a".repeat(64),
  message_limit: 25,
};

const findSubscriptionEffects: FindStoreSubscriptionActionEffectsParams = {
  action_id: "action-contract",
  limit: 25,
  cursor: null,
};

const getSubscriptionEffect: GetStoreSubscriptionActionEffectParams = {
  action_id: "action-contract",
  effect_id: "effect-contract",
};

declare const subscriptionAction: StoreSubscriptionAction;
declare const subscriptionEffect: StoreSubscriptionEffect;
const actionId: string = subscriptionAction.id;
const effectOwnerIds: [string, string, string] = [
  subscriptionEffect.store_id,
  subscriptionEffect.subscription_id,
  subscriptionEffect.action_id,
];

// @ts-expect-error storefront support messages require the capability token.
const supportMessageWithoutCapability: StorefrontSendSupportMessageParams = {
  conversation_id: "conversation-contract",
  message_id: "018f477d-1cae-7c12-bf12-123456789abc",
  input: { type: "text", content: "Help" },
};

declare const account: Account;
declare const contact: Contact;
declare const productVariant: ProductVariant;
declare const shipment: Shipment;
const shippingProvider: "shippo" = shipment.provider;
const shipmentAllocation: "reserved" | "fulfilled" | "released" =
  shipment.allocation_status;
const shipmentTrackingStatusAtMs: number | null =
  shipment.tracking_status_at_ms;
const cancelledShippingStatus: ShippingStatus = "cancelled";
const shippingRateRequest: GetShippingRatesParams = {
  order_id: "order-contract",
  location_id: "location-contract",
  lines: [{ order_item_id: "item-contract", quantity: 1 }],
  parcel: {
    length: 100,
    width: 75,
    height: 25,
    weight: 500,
    distance_unit: "mm",
    mass_unit: "g",
  },
};
const createShipmentRequest: CreateShipmentParams = {
  order_id: "order-contract",
  shipment_id: "018f477d-1cae-7c12-bf12-123456789abc",
  rate_id: "signed-rate-contract",
  location_id: "location-contract",
  fulfillment_order_id: "fulfillment-contract",
  lines: [
    {
      order_item_id: "item-contract",
      fulfillment_order_line_id: "fulfillment-line-contract",
      quantity: 1,
    },
  ],
};
// @ts-expect-error verification challenges are never part of the public account contract.
account.verification_codes;
// @ts-expect-error verification challenges are never part of the public contact contract.
contact.verification_codes;
// @ts-expect-error variant order, not an is_default field, defines the configured default.
productVariant.is_default;

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

// @ts-expect-error provider capabilities must state whether publishing is supported.
const missingPublishingCapability: SocialProviderCapability = {
  type: "x_account",
  display_name: "X Account",
  icon_key: "x_account",
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

const workflowToolWireDto: WorkflowTool = {
  id: "arky",
  name: "Arky",
  description: "Arky workflow operations",
  icon: "arky",
  color: "#000000",
  category: "core",
  configuration_required: false,
  url_patterns: ["^https://api\\.arky\\.io/"],
  resources: [],
  triggers: [
    {
      name: "Order created",
      value: "order.created",
      description: "An order was created",
      webhook_type: "incoming",
    },
  ],
};

const camelCaseWorkflowTool: WorkflowTool = {
  ...workflowToolWireDto,
  // @ts-expect-error the wire DTO is snake_case.
  configurationRequired: false,
};

void [
  supportStart,
  storefrontIdentify,
  storefrontEntryIdentify,
  verificationChallengeId,
  orderMoney,
  embeddedRefundAttemptStatus,
  codeReceivedCallback,
  safeSocialCredential,
  unsafeSocialCredential,
  safeSocialConnectionData,
  tiktokConnectionType,
  tiktokContent,
  tiktokInitializeEffect,
  tiktokUploadEffect,
  clearCartAddresses,
  shipmentTrackingStatusAtMs,
  supportCapability,
  storefrontSupportMessage,
  storefrontSupportRead,
  findSubscriptionEffects,
  getSubscriptionEffect,
  subscriptionAction,
  subscriptionEffect,
  actionId,
  effectOwnerIds,
  supportMessageWithoutCapability,
  account,
  contact,
  productVariant,
  trigger,
  getNode,
  mutationNode,
  missingHttpFields,
  retryingMutation,
  delayedMutationRetry,
  canonicalPage,
  missingPublishingCapability,
  workflowToolWireDto,
  camelCaseWorkflowTool,
  crmContactFeature,
  nonWireCrmProfileFeature,
  contactListPlanPriceInput,
  contactListPlanPriceWithProvider,
  paymentAttemptType,
  nestedPaymentAttemptType,
];
void sdkVersionLiteral;
