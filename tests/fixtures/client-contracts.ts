import type {
  Account,
  AccountApiToken,
  AccountApiTokenStatus,
  AccountSession,
  AccountSessionStatus,
  AuthToken,
  AudiencePaymentStatus,
  AudienceSubscribeResponse,
  AudienceTierPriceInput,
  Block,
  BuildHook,
  Classification,
  ClassificationEntry,
  ClassificationFieldQuery,
  ClassificationSchema,
  Contact,
  Cart,
  CheckoutCartParams,
  Condition,
  CreateMarketParams,
  CreateSuppressionParams,
  CreateOrderShipmentParams,
  DigitalAsset,
  EmailDeliveryType,
  GetCollectionParams,
  GetShippingRatesParams,
  OrderMoney,
  OrderPromoCodeSnapshot,
  OrderTaxLine,
  OrderTaxScope,
  TaxLine,
  ShippingLine,
  FulfillmentOrderStatus,
  OrderFulfillmentStatus,
  PaginatedResponse,
  PendingAccountSession,
  ProductInventoryInput,
  ProductVariant,
  RefundRequestReason,
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
  SmtpImapMailboxProviderInput,
  StoreSubscription,
  Store,
  StoreLocation,
  StoreMembership,
  StoreSubscriptionCheckout,
  StoreUsage,
  SubscriptionPlanFeatureType,
  TiktokPrivacy,
  StorefrontIdentifyResult,
  StorefrontDto,
  StorefrontLocation,
  StorefrontGetSupportConversationParams,
  StorefrontSendSupportMessageParams,
  SupportAgentDefinition,
  SupportAgentNode,
  SupportConversation,
  SupportConversationStartResponse,
  SupportMessage,
  UpdateCartParams,
  MarketZoneInput,
  Mailbox,
  Market,
  OrderQuote,
  PaymentProvider,
  Suppression,
  WorkflowHttpNode,
  WorkflowTriggerNode,
  VerifyPendingAccountSessionParams,
  Webhook,
} from "../../dist/index.js";
import type {
  CreateBuildHookParams,
  CreateStoreLocationParams,
  CreateStoreParams,
  CreateWebhookParams,
  FindActionsParams,
  RequestOptions,
} from "../../dist/types.js";
import { createAdmin, SDK_VERSION } from "../../dist/index.js";
import {
  createStorefront,
  initialize,
  type FormField,
  type FormSchema,
  type FormValues,
  type StorefrontIdentifyResult as StorefrontEntryIdentifyResult,
} from "../../dist/storefront.js";

const sdkVersionLiteral: "0.25.0" = SDK_VERSION;
const crmContactFeature: SubscriptionPlanFeatureType = "crm_contacts";
// @ts-expect-error the server's serialized feature key is crm_contacts.
const nonWireCrmProfileFeature: SubscriptionPlanFeatureType = "crm_profiles";
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
declare const subscriptionCheckoutContract: StoreSubscriptionCheckout;
const persistedCheckoutId: string = subscriptionCheckoutContract.id;
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
void persistedCheckoutId;
const audienceTierPriceInput: AudienceTierPriceInput = {
  currency: "usd",
  amount: 1200,
  interval: { period: "month", count: 1 },
  status: "active",
};
const merchantRefundReason: RefundRequestReason = "fraudulent";
const digitalProductCondition: Condition = {
  type: "digital_products",
  digital_product_ids: ["digital-product-contract"],
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
if (suppression.target.type === "contact") {
  const suppressionContactId: string = suppression.target.contact_id;
  void suppressionContactId;
}
// @ts-expect-error suppression identity is expressed only by its tagged target.
suppression.target_key;
// @ts-expect-error suppression ownership scope is expressed only by its tagged scope.
suppression.campaign_id;
declare const digitalAsset: DigitalAsset;
// @ts-expect-error object storage keys are internal and never exposed by Admin responses.
digitalAsset.object_key;
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
  location_id: "location-contract",
  available: 10,
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

const localizedTitleBlock: Block = {
  id: "title",
  key: "title",
  type: "object",
  properties: {},
  value: {
    en: {
      id: "title-en",
      key: "en",
      type: "text",
      properties: {},
      value: "Welcome",
    },
  },
};
const markdownBlock: Block = {
  id: "body",
  key: "body",
  type: "markdown",
  properties: {},
  value: { en: "# Welcome" },
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
const classificationChildren: Promise<Classification[]> =
  adminClient.classification.getChildren({ id: "classification-contract" });
adminClient.classification.get({ id: "classification-contract" });
// @ts-expect-error Admin Classification lookup uses its UUID, not a derived key.
adminClient.classification.get({ key: "topics" });
// @ts-expect-error Classification is a top-level module, not a CMS child.
adminClient.cms.classification;
void classificationChildren;
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

const orderTaxScope: OrderTaxScope = "shipping";
// @ts-expect-error tax scope is a closed accounting enum.
const invalidOrderTaxScope: OrderTaxScope = "provider";
const orderTaxLine: OrderTaxLine = {
  rate_bps: 2_000,
  amount: 250,
  label: "Shipping Tax",
  scope: orderTaxScope,
};
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
  total: 1250,
  tax: {
    amount: 250,
    mode: "exclusive",
    rate_bps: 2_000,
    lines: [orderTaxLine],
  },
  promo_code: promoSnapshot,
  zone_id: null,
  shipping_method_id: null,
};
// @ts-expect-error capture_method is transaction/provider state, not order money.
orderMoney.capture_method;

const shippingLine: ShippingLine = {
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
const fulfillmentOrderStatus: FulfillmentOrderStatus = "open";
const orderFulfillmentStatus: OrderFulfillmentStatus = "partially_fulfilled";
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
const supportConversationWithNullReferences: SupportConversation = {
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
  contact_id: null,
  assigned_account_id: null,
  status: "active",
  variables: {},
  channel_metadata: {},
  created_at: 1,
  updated_at: 1,
};
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
  plan_access: null,
  payment: { currency: "usd", market: "us" },
  billing_status: "pending",
  checkout_id: null,
  payment_action: { type: "none" },
  trial_started_at: null,
  created_at: 1,
  updated_at: 1,
};
const storeSubscriptionWithCheckoutReference: StoreSubscription = {
  ...storeSubscriptionWithoutCheckout,
  checkout_id: "checkout-contract",
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
declare const contact: Contact;
declare const productVariant: ProductVariant;
declare const shipment: OrderShipment;
const shipmentStatus: OrderShipmentStatus = shipment.status;
const shipmentTrackingStatusAt: number | null | undefined =
  shipment.tracking_status_at;
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
  orderMoney,
  orderTaxLine,
  accountingTaxLine,
  promoSnapshot,
  shippingLine,
  fulfillmentOrderStatus,
  orderFulfillmentStatus,
  cart,
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
  supportInputNode,
  supportEndNode,
  invalidSupportMessageNode,
  invalidSupportActionNode,
  supportDefinitionWithNoAi,
  supportConversationWithNullReferences,
  supportMessageWithNullState,
  storefrontSupportMessage,
  storefrontSupportRead,
  storeSubscriptionWithoutCheckout,
  storeSubscriptionWithCheckoutReference,
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
  crmContactFeature,
  nonWireCrmProfileFeature,
  invalidOrderTaxScope,
  audienceTierPriceInput,
  audienceTierPriceWithProvider,
  subscribePaymentStatus,
];
void sdkVersionLiteral;
