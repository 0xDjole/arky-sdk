export type {
  ApiResponse,
  EshopCartItem,
  Cart,
  CartOrigin,
  CartStatus,
  EshopStoreState,
  Store,
  Webhook,
  WebhookEventSubscription,
  BuildHook,
  BuildHookType,
  PaymentStoreConfig,
  StoreRuntimeConfig,
  SocialConnectResponse,
  SocialDestinationMetadata,
  SocialOAuthCallbackResponse,
  SocialOAuthCallbackStatus,
  SocialOAuthCredential,
  SocialOAuthDestinationOption,
  SocialAccount,
  SocialProviderCapability,
  SocialProviderType,
  InstagramPlacement,
  SocialAnalyticsCapabilities,
  SocialEngagementCapabilities,
  SocialPublication,
  SocialPublicationComment,
  SocialPublicationCommentClassificationResult,
  SocialPublicationCommentIntent,
  SocialPublicationCommentPriority,
  SocialPublicationEngagementSyncResult,
  SocialPublicationCommentReply,
  SocialPublicationCommentReplyResponse,
  SocialPublicationCommentStatus,
  SocialPublicationContent,
  SocialPublicationMetricSnapshot,
  SocialPublicationMutationResponse,
  SocialPublicationStatus,
  SocialPublicationValidation,
  TiktokPrivacy,
  ValidationError,
  YoutubePrivacy,
  Block,
  Price,
  OrderPayment,
  PaymentProvider,
  StripePaymentProviderConnectResponse,
  OrderPaymentTax,
  OrderPaymentTaxLine,
  OrderPaymentPromoCode,
  OrderPaymentProvider,
  OrderPaymentRefund,
  RefundType,
  RefundLine,
  TaxLineReversal,
  PaymentTransactionProvider,
  PaymentCaptureMethod,
  PaymentTransactionType,
  PaymentTransactionStatus,
  PaymentTransaction,
  OrderQuote,
  StoreSubscription,
  StoreSubscriptionPayment,
  StoreSubscriptionProvider,
  StoreSubscriptionStatus,
  StoreSubscriptionSource,
  SubscriptionPlan,
  SubscriptionPrice,
  ContactListMembershipPayment,
  ContactListMembershipProvider,
  PaymentMethod,
  ShippingMethod,
  ShippingWeightTier,
  Zone,
  Market,
  Address,
  GeoLocation,
  ZoneLocation,
  Location,
  PromoCodeValidation,
  PaginatedResponse,
  Language,
  Access,
  Media,
  MediaResolution,
  Coordinates,
  ProviderWithTimeline,
  Collection,
  BlockSchema,
  BlockSchemaProperties,
  BlockSchemaType,
  CollectionEntry,
  EntryBlockQuery,
  MediaRef,
  FieldOperation,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTriggerNode,
  WorkflowHttpNode,
  WorkflowDeployWebhookNode,
  WorkflowGoogleDriveUploadNode,
  WorkflowAccount,
  WorkflowAccountProfile,
  WorkflowAccountType,
  WorkflowSwitchNode,
  WorkflowSwitchRule,
  WorkflowTransformNode,
  WorkflowLoopNode,
  WorkflowHttpMethod,
  WorkflowExecution,
  ExecutionStatus,
  NodeResult,
  ContactListType,
  ContactListAccessResponse,
  ContactListSubscribeResponse,
  Event,
  EventAction,
  ShippingStatus,
  OrderShipping,
  ShippingLine,
  FulfillmentOrderStatus,
  FulfillmentOrderRequestStatus,
  FulfillmentOrderLine,
  FulfillmentOrder,
  ShippingRate,
  ShippingAddress,
  Parcel,
  PurchaseLabelResult,
  ShipResult,
  ShipmentLine,
  Shipment,
  CustomsItem,
  CustomsDeclaration,
  GeoLocationBlock,
  Service,
  Provider,
  ServiceProvider,
  ServiceDuration,
  ProviderTimelinePoint,
  TimelinePoint,
  WorkingHour,
  WorkingDay,
  SpecificDate,
  Order,
  OrderItem,
  OrderItemSnapshot,
  ProductLineItem,
  ServiceLineItem,
  ProductLineItemSnapshot,
  ServiceLineItemSnapshot,
  DiscountAllocation,
  TaxLine,
  LineMoneySnapshot,
  OrderItemFulfillmentStatus,
  BookingOrderItemStatus,
  QuoteLine,
  ProductQuoteLine,
  ServiceQuoteLine,
  ProductQuoteLineAvailability,
  ServiceQuoteLineAvailability,
  OrderItemStatus,
  OrderStatus,
  OrderPaymentSummaryStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  OrderCancellationReason,
  HistoryEntry,
  DigitalAccessGrantStatus,
  DigitalAccessGrant,
  DigitalAccessDownloadResponse,
  Product,
  ProductVariant,
  ProductInventory,
  DigitalAssetType,
  DigitalAssetStatus,
  DigitalDeliveryPolicy,
  DigitalAsset,
  InventoryLevel,
  GalleryItem,
  EmailTemplate,
  Form,
  FormSubmission,
  FormSchema,
  FormSchemaType,
  FormField,
  FormFieldType,
  FormEntry,
  Taxonomy,
  TaxonomyEntry,
  TaxonomyQuery,
  TaxonomySchema,
  TaxonomySchemaType,
  TaxonomyField,
  TaxonomyFieldQuery,
  PromoCode,
  Contact,
  ContactChannel,
  ChannelType,
  OpportunityStage,
  OpportunityType,
  OpportunitySource,
  Action,
  ActionData,
  ActionContext,
  ContactList,
  ContactListMembership,
  ContactListMember,
  Mailbox,
  MailboxConnectionSecurity,
  MailboxProvider,
  MailboxPreset,
  MailboxSyncStatus,
  SmtpImapMailboxProvider,
  OutreachStep,
  OutreachStepType,
  ManualTaskContinueBehavior,
  CampaignManualTaskOutcome,
  CampaignEnrollmentStepExecutionOutcome,
  OutreachPersonalizationCounters,
  OutreachPersonalizationState,
  Campaign,
  CampaignLaunchReadiness,
  CampaignEnrollment,
  CampaignEnrollmentDraft,
  CampaignEnrollmentImportResult,
  CampaignEnrollmentConversationResponse,
  CampaignMessage,
  Suppression,
  LeadResearchRun,
  LeadResearchRunStatus,
  LeadScores,
  LeadInsight,
  CampaignRoute,
  ChannelMessage,
  LeadEmailClassification,
  LeadValidationCheck,
  LeadValidationCheckStatus,
  LeadEmailValidationResult,
  LeadResearchMessage,
  LeadResearchMessageRole,
  ResearchContactListMember,
  SendLeadResearchMessageResult,
  Account,
  AccountToken,
  AccountUpdateResponse,
  StoreMembership,
  Discount,
  Condition,
  ServiceStatus,
  ProviderStatus,
  ProductStatus,
  ContactStatus,
  ContactListStatus,
  ContactListSource,
  ContactListMembershipStatus,
  MailboxStatus,
  CampaignStatus,
  CampaignEnrollmentStatus,
  CampaignEnrollmentImportSource,
  CampaignMessageCopySource,
  CampaignMessageDirection,
  CampaignMessageType,
  CampaignMessageStatus,
  OutreachPersonalizationStatus,
  OutreachThreadMode,
  SuppressionStatus,
  SuppressionTargetType,
  SuppressionScopeType,
  SuppressionReason,
  SuppressionSource,
  WorkflowStatus,
  PromoCodeStatus,
  CollectionStatus,
  EntryStatus,
  EmailTemplateStatus,
  EmailTemplateVariable,
  FormStatus,
  TaxonomyStatus,
} from "./types";
export { PaymentMethodType } from "./types";

export type {
  GetAvailabilityParams,
  AvailabilitySlot,
  DaySlots,
  ProviderAvailability,
  AvailabilityResponse,
  Slot,
  SlotRange,
  EshopItem,
  EshopQuoteItem,
  ServiceCheckoutPart,
  ServiceQuoteItem,
  ConditionValue,
  ProductQuoteItemInput,
  ServiceQuoteItemInput,
  OrderQuoteItemInput,
  QuoteItemInput,
  OrderQuoteCompatibleItemInput,
  ProductCheckoutItemInput,
  ServiceCheckoutItemInput,
  OrderCheckoutItemInput,
  CheckoutItemInput,
  OrderCheckoutCompatibleItemInput,
  TrustedProductCheckoutItemInput,
  TrustedServiceCheckoutItemInput,
  TrustedOrderCheckoutItemInput,
  TrustedOrderCheckoutCompatibleItemInput,
  GetCurrentCartParams,
  GetCartParams,
  FindCartsParams,
  UpdateCartParams,
  AddCartItemParams,
  RemoveCartItemParams,
  ClearCartParams,
  QuoteCartParams,
  CheckoutCartParams,
  SystemTemplateKey,
  ImportFieldMapping,
  ImportPreviewRow,
  ImportContactsParams,
  ImportContactsPreviewParams,
  ImportContactsPreviewResult,
  ImportContactsResult,
  GetCollectionsParams,
  CreateCollectionParams,
  UpdateCollectionParams,
  GetCollectionParams,
  DeleteCollectionParams,
  GetEntriesParams,
  CreateEntryParams,
  UpdateEntryParams,
  GetEntryParams,
  DeleteEntryParams,
  GetShippingRatesParams,
  ShipParams,
  CreateContactListParams,
  UpdateContactListParams,
  FindContactListsParams,
  GetContactListParams,
  AddContactListContactParams,
  UpdateContactListContactParams,
  RemoveContactListContactParams,
  FindContactListContactsParams,
  ImportContactRowInput,
  ImportContactRowError,
  ImportContactRowResult,
  ImportContactListRowResult,
  ImportContactListPreviewParams,
  ImportContactsIntoContactListParams,
  ImportContactsIntoContactListResult,
  SubscribeContactListParams,
  ContactListAccessParams,
  CreateMailboxParams,
  UpdateMailboxParams,
  FindMailboxesParams,
  GetMailboxParams,
  PrepareMailboxParams,
  TestMailboxParams,
  TestMailboxResult,
  CreateCampaignParams,
  UpdateCampaignParams,
  FindCampaignsParams,
  GetCampaignParams,
  LaunchCampaignParams,
  DuplicateCampaignParams,
  ImportCampaignEnrollmentsParams,
  GetCampaignLaunchReadinessParams,
  GenerateOutreachPersonalizedDraftsParams,
  FindCampaignEnrollmentsParams,
  UpdateCampaignEnrollmentParams,
  UpdateCampaignEnrollmentDraftParams,
  UpdateCampaignEnrollmentStepExecutionParams,
  GetCampaignEnrollmentConversationParams,
  ReplyCampaignEnrollmentParams,
  StopCampaignEnrollmentParams,
  FindCampaignMessagesParams,
  UpdateCampaignMessageParams,
  CreateSuppressionParams,
  UpdateSuppressionParams,
  FindSuppressionsParams,
  GetSuppressionParams,
  CreateLeadResearchRunParams,
  FindLeadResearchRunsParams,
  GetLeadResearchRunParams,
  UpdateLeadResearchRunParams,
  CancelLeadResearchRunParams,
  SendLeadResearchMessageParams,
  FindLeadResearchMessagesParams,
  ValidateLeadEmailParams,
  CancelSocialPublicationParams,
  ClassifySocialPublicationCommentsParams,
  ConnectStripePaymentProviderParams,
  ConnectSocialAccountParams,
  CreateSocialPublicationParams,
  DeletePaymentProviderParams,
  DeleteSocialAccountParams,
  FindSocialPublicationCommentsParams,
  FindSocialPublicationsParams,
  GetSocialCapabilitiesParams,
  GetSocialOAuthAttemptParams,
  GetSocialPublicationCommentThreadParams,
  GetSocialPublicationCommentsParams,
  GetSocialPublicationMetricsParams,
  GetSocialPublicationParams,
  ListPaymentProvidersParams,
  ListSocialAccountsParams,
  ReplySocialPublicationCommentParams,
  ScheduleSocialPublicationParams,
  SyncSocialEngagementParams,
  UpdateSocialPublicationParams,
  ValidateSocialPublicationParams,
} from "./types/api";

export type {
  LocationState,
  LocationCountry,
  GetCountriesResponse,
} from "./api/location";

export type {
  AnalyticsTimeRange,
  AnalyticsReportKey,
  AnalyticsMetricReportKey,
  AnalyticsBreakdownReportKey,
  AnalyticsActionReportKey,
  AnalyticsCompositeReportKey,
  AnalyticsReportRequest,
  AnalyticsBlockRequest,
  AnalyticsRequest,
  AnalyticsMetricData,
  AnalyticsBreakdownItem,
  AnalyticsBreakdownData,
  BusinessOverviewData,
  RevenueByCurrencyData,
  ContactFunnelStage,
  ContactFunnelData,
  OutreachOverviewData,
  OutreachFunnelStage,
  OutreachFunnelData,
  EntityStatusOverviewData,
  DataHealthData,
  AnalyticsReport,
  AnalyticsBlockResponse,
  AnalyticsResponse,
  ActionFeedCategory,
  ActionFeedItem,
  ActionFeedSummary,
  ActionFeedCursor,
  ActionFeedData,
} from "./api/analytics";

export type {
  CreateLocationParams,
  UpdateLocationParams,
  DeleteLocationParams,
} from "./types/api";

export type {
  StorefrontAction,
  TrackActionParams,
  CommonActionKey,
  ExperimentUseResponse,
  UseExperimentParams,
} from "./api/storefront";
export { COMMON_ACTION_KEYS } from "./api/storefront";
export type {
  CreateExperimentParams,
  Experiment,
  ExperimentResults,
  ExperimentStatus,
  ExperimentVariant,
  ExperimentVariantResult,
  FindExperimentsParams,
  GetExperimentParams,
  UpdateExperimentParams,
} from "./api/experiments";
export {
  createCartController,
  type CartApi,
  type CartController,
  type CartControllerAddItemParams,
  type CartControllerCheckoutParams,
  type CartControllerClearParams,
  type CartControllerInitParams,
  type CartControllerListener,
  type CartControllerQuoteParams,
  type CartControllerRefreshParams,
  type CartControllerRemoveItemParams,
  type CartControllerState,
  type CartControllerUpdateParams,
} from "./cartController";

export type { TimelineParams } from "./api/crm";
export type {
  SupportAgent,
  SupportConversation,
  SupportMessage,
  SupportConversationResponse,
  SupportAgentNode,
  SupportAgentEdge,
  SupportAgentAiConfig,
  EdgeTrigger,
  SupportAction,
  AssignSupportConversationParams,
  GetSupportConversationParams,
  ReplySupportConversationParams,
  ResolveSupportConversationParams,
} from "./api/support";
export type {
  WorkflowToolOperation,
  WorkflowToolResource,
  WorkflowTool,
} from "./api/platform";

export const SDK_VERSION = "0.9.11";
export const SUPPORTED_FRAMEWORKS = [
  "astro",
  "react",
  "vue",
  "svelte",
  "vanilla",
] as const;

import type {
  Contact as ContactType,
  Store as StoreType,
  Market as MarketType,
} from "./types";

export interface ApiConfig {
  httpClient: HttpClient;
  storeId: string;
  baseUrl: string;
  market: string;
  locale: string;
  authStorage: AuthStorage;
}

export interface AdminSessionInternal {
  access_token: string;
  refresh_token: string;
  access_expires_at?: number;
  email?: string;
}

export interface ContactSessionInternal {
  access_token: string;
  contact: ContactType;
  store: StoreType;
  market: MarketType | null;
}

export interface AdminSession {
  email?: string;
}

export interface ContactSession {
  contact: ContactType;
  store: StoreType;
  market: MarketType | null;
}

export type AdminSessionUpdater = (
  updater: (prev: AdminSessionInternal | null) => AdminSessionInternal | null,
) => void;

export type ContactSessionUpdater = (
  updater: (
    prev: ContactSessionInternal | null,
  ) => ContactSessionInternal | null,
) => void;

export type AuthStateListener<T> = (session: T | null) => void;

import {
  createHttpClient,
  type HttpClientConfig,
  type HttpClient,
  type AuthStorage,
} from "./services/createHttpClient";
import { createAccountApi } from "./api/account";
import { createAuthApi } from "./api/auth";
import { createStoreApi } from "./api/store";
import { createMediaApi } from "./api/media";
import { createNotificationApi } from "./api/notification";
import { createPromoCodeApi } from "./api/promoCode";
import { createCmsApi } from "./api/cms";
import { createEshopApi } from "./api/eshop";
import { createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createContactApi } from "./api/crm";
import {
  createAdminSupportApi,
  createStorefrontSupportApi,
} from "./api/support";
import { createLeadResearchApi } from "./api/leadResearch";
import { createSocialApi } from "./api/social";
import { createWorkflowApi } from "./api/workflow";
import { createPlatformApi } from "./api/platform";
import { createShippingApi } from "./api/shipping";
import { createPaymentProvidersApi } from "./api/paymentProviders";
import { createEmailTemplateApi } from "./api/emailTemplate";
import { createFormApi } from "./api/form";
import { createTaxonomyApi } from "./api/taxonomy";
import { createAnalyticsApi } from "./api/analytics";
import { createExperimentsApi } from "./api/experiments";
import { createStorefrontApi } from "./api/storefront";
import { createCartController } from "./cartController";
import {
  getImageUrl,
  getBlockValue,
  getBlockTextValue,
  getBlockValues,
  getBlockLabel,
  getBlockObjectValues,
  getBlockFromArray,
  formatBlockValue,
  prepareBlocksForSubmission,
  extractBlockValues,
} from "./utils/blocks";
import {
  formatPrice,
  getPriceAmount,
  formatPayment,
  formatMinor,
  getCurrencySymbol,
  getCurrencyName,
} from "./utils/price";
import { validatePhoneNumber } from "./utils/validation";
import { tzGroups, findTimeZone } from "./utils/timezone";
import { slugify, humanize, categorify, formatDate } from "./utils/text";
import {
  getSvgContentForAstro,
  fetchSvgContent,
  injectSvgIntoElement,
} from "./utils/svg";
import {
  isValidKey,
  validateKey,
  toKey,
  nameToKey,
} from "./utils/keyValidation";
import {
  getAvailableStock,
  getReservedStock,
  hasStock,
  getInventoryAt,
  getFirstAvailableFCId,
} from "./utils/inventory";

function createUtilitySurface(apiConfig: ApiConfig) {
  return {
    getImageUrl: (imageBlock: any, isBlock = true) =>
      getImageUrl(imageBlock, isBlock),
    getBlockValue,
    getBlockTextValue,
    getBlockValues,
    getBlockLabel,
    getBlockObjectValues,
    getBlockFromArray,
    formatBlockValue,
    prepareBlocksForSubmission,
    extractBlockValues,

    formatPrice: (prices: any[]) => formatPrice(prices, apiConfig.market),
    getPriceAmount: (prices: any[]) => getPriceAmount(prices, apiConfig.market),
    formatPayment,
    formatMinor,
    getCurrencySymbol,
    getCurrencyName,
    validatePhoneNumber,

    tzGroups,
    findTimeZone,

    slugify,
    humanize,
    categorify,
    formatDate,

    getSvgContentForAstro,
    fetchSvgContent,
    injectSvgIntoElement,

    isValidKey,
    validateKey,
    toKey,
    nameToKey,

    getAvailableStock,
    getReservedStock,
    hasStock,
    getInventoryAt,
    getFirstAvailableFCId,
  };
}

const ADMIN_STORAGE_KEY = "arky_admin_session";

function readAdminSession(): AdminSessionInternal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminSessionInternal) : null;
  } catch {
    return null;
  }
}

function writeAdminSession(s: AdminSessionInternal | null): void {
  if (typeof window === "undefined") return;
  if (s) {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(s));
  } else {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }
}

export type CreateAdminConfig = Omit<
  HttpClientConfig,
  "authStorage" | "storeId"
> & {
  storeId: string;
  market: string;
  locale?: string;
  apiToken?: string;
};

export function createAdmin(config: CreateAdminConfig) {
  const locale = config.locale || "en";
  const listeners = new Set<AuthStateListener<AdminSession>>();

  function toPublic(s: AdminSessionInternal | null): AdminSession | null {
    return s ? { email: s.email } : null;
  }

  function emit(): void {
    const pub = toPublic(readAdminSession());
    for (const l of listeners) {
      Promise.resolve()
        .then(() => l(pub))
        .catch(() => {});
    }
  }

  const updateSession: AdminSessionUpdater = (updater) => {
    if (config.apiToken) return;
    const prev = readAdminSession();
    const next = updater(prev);
    writeAdminSession(next);
    emit();
  };

  const authStorage: AuthStorage = config.apiToken
    ? {
        getTokens: () => ({ access_token: config.apiToken! }),
        onTokensRefreshed: () => {},
        onForcedLogout: () => {},
      }
    : {
        getTokens() {
          const s = readAdminSession();
          if (!s) return null;
          return {
            access_token: s.access_token,
            refresh_token: s.refresh_token,
            access_expires_at: s.access_expires_at,
          };
        },
        onTokensRefreshed(tokens) {
          updateSession((prev) =>
            prev
              ? {
                  ...prev,
                  access_token: tokens.access_token,
                  refresh_token: tokens.refresh_token ?? prev.refresh_token,
                  access_expires_at:
                    tokens.access_expires_at ?? prev.access_expires_at,
                }
              : null,
          );
        },
        onForcedLogout() {
          updateSession(() => null);
        },
      };

  const httpClient = createHttpClient({
    baseUrl: config.baseUrl,
    storeId: config.storeId,
    refreshPath: config.refreshPath,
    navigate: config.navigate,
    loginFallbackPath: config.loginFallbackPath,
    authStorage,
  });

  const apiConfig: ApiConfig = {
    httpClient,
    storeId: config.storeId,
    baseUrl: config.baseUrl,
    market: config.market,
    locale,
    authStorage,
  };

  const accountApi = createAccountApi(apiConfig);
  const authApi = createAuthApi(apiConfig, updateSession);
  const storeApi = createStoreApi(apiConfig, updateSession);
  const platformApi = createPlatformApi(apiConfig);

  const cmsApi = createCmsApi(apiConfig);
  const eshopApi = createEshopApi(apiConfig);
  const promoCodeApi = createPromoCodeApi(apiConfig);
  const crmApi = createContactApi(apiConfig);
  const supportApi = createAdminSupportApi(apiConfig);
  const leadResearchApi = createLeadResearchApi(apiConfig);
  const socialApi = createSocialApi(apiConfig);
  const paymentProvidersApi = createPaymentProvidersApi(apiConfig);
  const leadResearch = {
    run: {
      create: leadResearchApi.createRun,
      find: leadResearchApi.findRuns,
      get: leadResearchApi.getRun,
      update: leadResearchApi.updateRun,
      cancel: leadResearchApi.cancelRun,
      sendMessage: leadResearchApi.sendMessage,
      findMessages: leadResearchApi.findMessages,
    },
    message: {
      send: leadResearchApi.sendMessage,
      find: leadResearchApi.findMessages,
    },
    email: {
      validate: leadResearchApi.validateEmail,
    },
    createRun: leadResearchApi.createRun,
    findRuns: leadResearchApi.findRuns,
    getRun: leadResearchApi.getRun,
    updateRun: leadResearchApi.updateRun,
    cancelRun: leadResearchApi.cancelRun,
    sendMessage: leadResearchApi.sendMessage,
    findMessages: leadResearchApi.findMessages,
    validateEmail: leadResearchApi.validateEmail,
  };
  const locationApi = createLocationApi(apiConfig);
  const marketApi = createMarketApi(apiConfig);
  const workflowApi = createWorkflowApi(apiConfig);
  const formApi = createFormApi(apiConfig);
  const taxonomyApi = createTaxonomyApi(apiConfig);
  const emailTemplateApi = createEmailTemplateApi(apiConfig);
  const analyticsApi = createAnalyticsApi(apiConfig);
  const experimentsApi = createExperimentsApi(apiConfig);

  const sdk = {
    auth: authApi,
    account: accountApi,
    store: {
      ...storeApi,
      location: locationApi,
      market: marketApi,
    },
    media: createMediaApi(apiConfig),
    notification: createNotificationApi(apiConfig),
    promoCode: promoCodeApi,
    platform: platformApi,
    social: socialApi,
    paymentProviders: paymentProvidersApi,
    shipping: createShippingApi(apiConfig),
    cms: {
      collection: {
        create: cmsApi.createCollection,
        update: cmsApi.updateCollection,
        delete: cmsApi.deleteCollection,
        get: cmsApi.getCollection,
        find: cmsApi.getCollections,
      },
      entry: {
        create: cmsApi.createEntry,
        update: cmsApi.updateEntry,
        delete: cmsApi.deleteEntry,
        get: cmsApi.getEntry,
        find: cmsApi.getEntries,
      },
      form: {
        create: formApi.createForm,
        update: formApi.updateForm,
        delete: formApi.deleteForm,
        get: formApi.getForm,
        find: formApi.getForms,
        submit: formApi.submit,
        getSubmissions: formApi.getSubmissions,
        getSubmission: formApi.getSubmission,
        updateSubmission: formApi.updateSubmission,
      },
      taxonomy: {
        create: taxonomyApi.createTaxonomy,
        update: taxonomyApi.updateTaxonomy,
        delete: taxonomyApi.deleteTaxonomy,
        get: taxonomyApi.getTaxonomy,
        find: taxonomyApi.getTaxonomies,
        getChildren: taxonomyApi.getTaxonomyChildren,
      },
      emailTemplate: {
        create: emailTemplateApi.createEmailTemplate,
        update: emailTemplateApi.updateEmailTemplate,
        delete: emailTemplateApi.deleteEmailTemplate,
        get: emailTemplateApi.getEmailTemplate,
        find: emailTemplateApi.getEmailTemplates,
        preview: emailTemplateApi.previewEmailTemplate,
      },
    },
    eshop: {
      product: {
        create: eshopApi.createProduct,
        update: eshopApi.updateProduct,
        delete: eshopApi.deleteProduct,
        get: eshopApi.getProduct,
        find: eshopApi.getProducts,
      },
      order: {
        update: eshopApi.updateOrder,
        get: eshopApi.getOrder,
        find: eshopApi.getOrders,
        getQuote: eshopApi.getQuote,
        processRefund: eshopApi.processRefund,
        downloadDigitalAccess: eshopApi.downloadDigitalAccess,
      },
      cart: {
        create: eshopApi.createCart,
        update: eshopApi.updateCart,
        get: eshopApi.getCart,
        find: eshopApi.getCarts,
        addItem: eshopApi.addCartItem,
        removeItem: eshopApi.removeCartItem,
        clear: eshopApi.clearCart,
        quote: eshopApi.quoteCart,
        checkout: eshopApi.checkoutCart,
      },
      service: {
        create: eshopApi.createService,
        update: eshopApi.updateService,
        delete: eshopApi.deleteService,
        get: eshopApi.getService,
        find: eshopApi.getServices,
        getAvailability: eshopApi.getServiceAvailability,
        findProviders: eshopApi.findServiceProviders,
        createProvider: eshopApi.createServiceProvider,
        updateProvider: eshopApi.updateServiceProvider,
        deleteProvider: eshopApi.deleteServiceProvider,
      },
      provider: {
        create: eshopApi.createProvider,
        update: eshopApi.updateProvider,
        delete: eshopApi.deleteProvider,
        get: eshopApi.getProvider,
        find: eshopApi.getProviders,
      },
      promoCode: promoCodeApi,
    },
    crm: {
      contact: {
        create: crmApi.create,
        get: crmApi.get,
        find: crmApi.find,
        update: crmApi.update,
        merge: crmApi.merge,
        import: crmApi.import,
        revokeToken: crmApi.revokeToken,
        revokeAllTokens: crmApi.revokeAllTokens,
      },
      contactList: crmApi.contactList,
      mailbox: crmApi.mailbox,
      campaign: crmApi.campaign,
      campaignEnrollment: crmApi.campaignEnrollment,
      campaignMessage: crmApi.campaignMessage,
      suppression: crmApi.suppression,
      leadResearch,
      action: crmApi.action,
    },
    leadResearch,
    automation: {
      workflow: {
        create: workflowApi.createWorkflow,
        update: workflowApi.updateWorkflow,
        delete: workflowApi.deleteWorkflow,
        get: workflowApi.getWorkflow,
        find: workflowApi.getWorkflows,
        trigger: workflowApi.triggerWorkflow,
        getExecutions: workflowApi.getWorkflowExecutions,
        getExecution: workflowApi.getWorkflowExecution,
        getAccounts: workflowApi.getWorkflowAccounts,
        connectGoogleDriveAccount: workflowApi.connectGoogleDriveWorkflowAccount,
        deleteAccount: workflowApi.deleteWorkflowAccount,
      },
      support: supportApi,
    },

    analytics: analyticsApi,
    experiments: experimentsApi,

    setStoreId: (storeId: string) => {
      apiConfig.storeId = storeId;
    },

    getStoreId: () => apiConfig.storeId,

    setMarket: (market: string) => {
      apiConfig.market = market;
    },

    getMarket: () => apiConfig.market,

    setLocale: (locale: string) => {
      apiConfig.locale = locale;
    },

    getLocale: () => apiConfig.locale,

    get session(): AdminSession | null {
      if (config.apiToken) return null;
      return toPublic(readAdminSession());
    },

    get currentSession(): AdminSession | null {
      if (config.apiToken) return null;
      return toPublic(readAdminSession());
    },

    get isAuthenticated(): boolean {
      if (config.apiToken) return true;
      return readAdminSession() !== null;
    },

    onAuthStateChanged(listener: AuthStateListener<AdminSession>): () => void {
      listeners.add(listener);
      const current = toPublic(readAdminSession());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(() => {});
      }
      return () => {
        listeners.delete(listener);
      };
    },

    async logout(): Promise<void> {
      if (config.apiToken) return;
      updateSession(() => null);
    },

    extractBlockValues,

    utils: createUtilitySurface(apiConfig),
  };

  return sdk;
}

const CONTACT_STORAGE_KEY = "arky_contact_session";

function readContactSession(): ContactSessionInternal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContactSessionInternal) : null;
  } catch {
    return null;
  }
}

function writeContactSession(s: ContactSessionInternal | null): void {
  if (typeof window === "undefined") return;
  if (s) {
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(s));
  } else {
    localStorage.removeItem(CONTACT_STORAGE_KEY);
  }
}

export type CreateStorefrontConfig = Omit<
  HttpClientConfig,
  "authStorage" | "storeId"
> & {
  storeId: string;
  market?: string;
  locale?: string;
  apiToken?: string;
};

export function createStorefront(config: CreateStorefrontConfig) {
  const locale = config.locale || "en";
  const initialMarket = config.market || "";
  const listeners = new Set<AuthStateListener<ContactSession>>();
  let bareIdentifyPromise: Promise<ContactSession> | null = null;

  function toPublic(s: ContactSessionInternal | null): ContactSession | null {
    return s ? { contact: s.contact, store: s.store, market: s.market } : null;
  }

  function emit(): void {
    const pub = toPublic(readContactSession());
    for (const l of listeners) {
      Promise.resolve()
        .then(() => l(pub))
        .catch(() => {});
    }
  }

  const updateSession: ContactSessionUpdater = (updater) => {
    if (config.apiToken) return;
    const prev = readContactSession();
    const next = updater(prev);
    writeContactSession(next);
    emit();
  };

  const authStorage: AuthStorage = config.apiToken
    ? {
        getTokens: () => ({ access_token: config.apiToken! }),
        onTokensRefreshed: () => {},
        onForcedLogout: () => {},
      }
    : {
        getTokens() {
          const s = readContactSession();
          return s ? { access_token: s.access_token } : null;
        },
        onTokensRefreshed() {
          // Contact tokens are one-shot; no refresh on this flow.
        },
        onForcedLogout() {
          bareIdentifyPromise = null;
          updateSession(() => null);
        },
      };

  const httpClient = createHttpClient({
    baseUrl: config.baseUrl,
    storeId: config.storeId,
    refreshPath: config.refreshPath,
    navigate: config.navigate,
    loginFallbackPath: config.loginFallbackPath,
    authStorage,
  });

  const apiConfig: ApiConfig = {
    httpClient,
    storeId: config.storeId,
    baseUrl: config.baseUrl,
    market: initialMarket,
    locale,
    authStorage,
  };

  const storefrontApi = createStorefrontApi(apiConfig, updateSession);
  const contactApi = storefrontApi.crm.contact;

  function identify(params?: {
    email?: string;
    verify?: boolean;
    market?: string;
  }): Promise<ContactSession> {
    if (params?.market !== undefined) apiConfig.market = params.market;

    const isBareCall = !params?.email && !params?.verify;
    if (isBareCall && bareIdentifyPromise) return bareIdentifyPromise;

    const promise = (async (): Promise<ContactSession> => {
      try {
        const result = await contactApi.identify({
          market: apiConfig.market,
          email: params?.email,
          verify: params?.verify,
        });
        return {
          contact: result.contact,
          store: result.store,
          market: result.market,
        };
      } catch (err: unknown) {
        const e = err as {
          statusCode?: number;
          status?: number;
          response?: { status?: number };
        };
        const status = e?.statusCode || e?.status || e?.response?.status;
        if (isBareCall && status === 401) {
          updateSession(() => null);
          const result = await contactApi.identify({
            market: apiConfig.market,
          });
          return {
            contact: result.contact,
            store: result.store,
            market: result.market,
          };
        }
        throw err;
      }
    })().catch((err) => {
      if (isBareCall) bareIdentifyPromise = null;
      throw err;
    });

    if (isBareCall) bareIdentifyPromise = promise;

    return promise;
  }

  async function verify(params: { code: string }) {
    const result = await contactApi.verify(params);
    bareIdentifyPromise = null;
    return result;
  }

  async function logout(): Promise<void> {
    if (config.apiToken) return;
    bareIdentifyPromise = null;
    try {
      await contactApi.logout();
    } catch {
      updateSession(() => null);
    }
  }

  return {
    identify,
    verify,
    logout,
    me: () => contactApi.getMe(),

    get session(): ContactSession | null {
      if (config.apiToken) return null;
      return toPublic(readContactSession());
    },

    get currentSession(): ContactSession | null {
      if (config.apiToken) return null;
      return toPublic(readContactSession());
    },

    get isAuthenticated(): boolean {
      if (config.apiToken) return true;
      const s = readContactSession();
      return s !== null && !!s.access_token;
    },

    onAuthStateChanged(
      listener: AuthStateListener<ContactSession>,
    ): () => void {
      listeners.add(listener);
      const current = toPublic(readContactSession());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(() => {});
      }
      return () => {
        listeners.delete(listener);
      };
    },

    store: storefrontApi.store,
    cart: createCartController(storefrontApi.eshop.cart),
    cms: storefrontApi.cms,
    eshop: storefrontApi.eshop,
    crm: storefrontApi.crm,
    action: storefrontApi.action,
    experiments: storefrontApi.experiments,
    support: createStorefrontSupportApi(apiConfig),
    setStoreId: (storeId: string) => {
      apiConfig.storeId = storeId;
      bareIdentifyPromise = null;
    },
    getStoreId: () => apiConfig.storeId,
    setMarket: (key: string) => {
      apiConfig.market = key;
      bareIdentifyPromise = null;
    },
    getMarket: () => apiConfig.market,
    setLocale: (l: string) => {
      apiConfig.locale = l;
    },
    getLocale: () => apiConfig.locale,
    extractBlockValues,
    utils: createUtilitySurface(apiConfig),
  };
}

export type { HttpClientConfig } from "./services/createHttpClient";
