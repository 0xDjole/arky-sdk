import type {
  Account,
  AudienceCatalogMutationStatus,
  AudiencePaymentStatus,
  AudienceSubscribeResponse,
  AudienceTierPriceInput,
  Contact,
  CreateOrderShipmentParams,
  GetCollectionParams,
  GetShippingRatesParams,
  OrderMoney,
  PaginatedResponse,
  ProductInventoryInput,
  ProductVariant,
  ServiceProvider,
  OrderShipment,
  OrderShipmentStatus,
  SocialConnectionCredential,
  SocialConnectionData,
  SocialConnectionType,
  SocialOAuthCallbackStatus,
  SocialPublicationContent,
  SocialPublicationEffectRequest,
  SocialProviderCapability,
  StoreSubscription,
  SubscriptionPlanFeatureType,
  TiktokPrivacy,
  StorefrontIdentifyResult,
  StorefrontDto,
  StorefrontGetSupportConversationParams,
  StorefrontSendSupportMessageParams,
  SupportConversationStartResponse,
  UpdateCartParams,
  MarketZoneInput,
  WorkflowHttpNode,
  WorkflowTool,
  WorkflowTriggerNode,
} from "../../dist/index.js";
import type { FindActionsParams, RequestOptions } from "../../dist/types.js";
import { SDK_VERSION } from "../../dist/index.js";
import {
  createStorefront,
  initialize,
  type FormField,
  type FormSchema,
  type FormValues,
  type StorefrontIdentifyResult as StorefrontEntryIdentifyResult,
} from "../../dist/storefront.js";

const sdkVersionLiteral: "0.15.0" = SDK_VERSION;
const crmContactFeature: SubscriptionPlanFeatureType = "crm_contacts";
// @ts-expect-error the server's serialized feature key is crm_contacts.
const nonWireCrmProfileFeature: SubscriptionPlanFeatureType = "crm_profiles";
const rejectedCatalogStatus: AudienceCatalogMutationStatus = "rejected";
const audienceTierPriceInput: AudienceTierPriceInput = {
  currency: "usd",
  amount: 1200,
  interval: { period: "month", count: 1 },
  status: "active",
};
const audienceTierPriceWithProvider: AudienceTierPriceInput = {
  currency: "usd",
  amount: 1200,
  status: "active",
  // @ts-expect-error payment-provider bindings are server-owned output fields.
  provider: { type: "stripe", price_id: "price_untrusted" },
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
const storefrontServiceProviders: Promise<StorefrontDto<ServiceProvider>[]> =
  storefrontClient.eshop.service.findProviders({
    service_id: "service-contract",
  });
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
  ReturnType<typeof storefrontClient.verify>
>;
declare const nestedStorefrontIdentification: Awaited<
  ReturnType<typeof storefrontClient.crm.contact.identify>
>;
// @ts-expect-error Store ownership is not exposed by public catalog DTOs.
storefrontProduct.store_id;
// @ts-expect-error Nested Store ownership is not exposed by public inventory DTOs.
storefrontProduct.variants[0].inventory[0].store_id;
// @ts-expect-error Store ownership is not exposed by public cart DTOs.
storefrontCart.store_id;
// @ts-expect-error Store ownership is not exposed by public support DTOs.
storefrontSupport.conversation.store_id;
// @ts-expect-error Visitor credentials stay private after verification.
storefrontVerification.token;
// @ts-expect-error Visitor credentials stay private on the nested CRM facade.
nestedStorefrontIdentification.token;
const userAuthoredStoreId: unknown =
  storefrontSupport.conversation.metadata.store_id;
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
// @ts-expect-error storefront initialization accepts a publishable key, not legacy connection fields.
initialize({ baseUrl: "http://localhost:8000", storeId: "store-contract" });

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

declare const storefrontIdentify: StorefrontIdentifyResult;
const storefrontEntryIdentify: StorefrontEntryIdentifyResult =
  storefrontIdentify;
const verificationChallengeId: string | undefined =
  storefrontIdentify.verification_challenge?.challenge_id;
// @ts-expect-error session tokens stay private to the storefront client.
storefrontIdentify.token;
// @ts-expect-error storefront Contact DTOs do not expose tenant routing IDs.
storefrontIdentify.contact.store_id;

declare const paymentStorefront: ReturnType<typeof initialize>;
// @ts-expect-error hosted Checkout removed the browser Stripe controller.
paymentStorefront.eshop.cart.payment;

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
  shipping_method_id: null,
};
// @ts-expect-error capture_method is transaction/provider state, not order money.
orderMoney.capture_method;

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

const storeSubscriptionWithoutCheckout: StoreSubscription = {
  id: "subscription-contract",
  store_id: "store-contract",
  plan_id: "free",
  payment: { currency: "usd", market: "us" },
  billing_status: "active",
  checkout: null,
  payment_action: { type: "none" },
  access_started_at: 1,
  access_until: 2,
  created_at: 1,
  updated_at: 1,
};
const storeSubscriptionWithEmbeddedCheckout: StoreSubscription = {
  ...storeSubscriptionWithoutCheckout,
  checkout: {
    plan_id: "business",
    status: "requires_action",
    expires_at: 2,
  },
  payment_action: {
    type: "stripe_embedded_checkout",
    publishable_key: "pk_test_contract",
    client_secret: "cs_contract_secret_exact",
    stripe_account_id: null,
    expires_at: 2,
  },
};

// @ts-expect-error storefront support messages require the capability token.
const supportMessageWithoutCapability: StorefrontSendSupportMessageParams = {
  conversation_id: "conversation-contract",
  message_id: "018f477d-1cae-7c12-bf12-123456789abc",
  input: { type: "text", content: "Help" },
};

declare const account: Account;
declare const contact: Contact;
declare const productVariant: ProductVariant;
declare const shipment: OrderShipment;
const shipmentStatus: OrderShipmentStatus = shipment.status;
const shipmentTrackingStatusAt: number | null | undefined = shipment.tracking_status_at;
const cancelledShippingStatus: OrderShipmentStatus = "cancelled";
const shippingRateRequest: GetShippingRatesParams = {
  order_id: "order-contract",
  location_id: "location-contract",
  lines: [{ order_product_id: "product-contract", quantity: 1 }],
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
  order_id: "order-contract",
  shipment_id: "018f477d-1cae-7c12-bf12-123456789abc",
  rate_id: "signed-rate-contract",
  location_id: "location-contract",
  fulfillment_order_id: "fulfillment-contract",
  lines: [
    {
      order_product_id: "product-contract",
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

const actionPageParams: FindActionsParams = {
  store_id: "store-contract",
  contact_id: "contact-contract",
  limit: 20,
  cursor: "cursor-contract",
};
type AssertNever<T extends never> = T;
type UnsupportedActionFilterKeys = AssertNever<
  Extract<keyof FindActionsParams, "query" | "types" | "from" | "to">
>;

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
  embeddedRefundPaymentStatus,
  codeReceivedCallback,
  safeSocialCredential,
  unsafeSocialCredential,
  safeSocialConnectionData,
  tiktokConnectionType,
  tiktokContent,
  tiktokInitializeEffect,
  tiktokUploadEffect,
  clearCartAddresses,
  shipmentStatus,
  shipmentTrackingStatusAt,
  supportCapability,
  storefrontSupportMessage,
  storefrontSupportRead,
  storeSubscriptionWithoutCheckout,
  storeSubscriptionWithEmbeddedCheckout,
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
  actionPageParams,
  missingPublishingCapability,
  workflowToolWireDto,
  camelCaseWorkflowTool,
  crmContactFeature,
  nonWireCrmProfileFeature,
  audienceTierPriceInput,
  audienceTierPriceWithProvider,
  subscribePaymentStatus,
  rejectedCatalogStatus,
];
void sdkVersionLiteral;
