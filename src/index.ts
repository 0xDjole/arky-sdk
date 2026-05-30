
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
  Integration,
  IntegrationProvider,
  Block,
  Price,
  OrderPayment,
  OrderPaymentTax,
  OrderPaymentTaxLine,
  OrderPaymentPromoCode,
  OrderPaymentProvider,
  OrderPaymentRefund,
  OrderQuote,
  StoreSubscription,
  StoreSubscriptionPayment,
  StoreSubscriptionProvider,
  StoreSubscriptionStatus,
  StoreSubscriptionSource,
  SubscriptionPlan,
  SubscriptionPrice,
  ProfileListMembershipPayment,
  ProfileListMembershipProvider,
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
  ProviderWithTimeline,
  Node,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTriggerNode,
  WorkflowHttpNode,
  WorkflowSwitchNode,
  WorkflowSwitchRule,
  WorkflowTransformNode,
  WorkflowLoopNode,
  WorkflowHttpMethod,
  WorkflowExecution,
  ExecutionStatus,
  NodeResult,
  ProfileListType,
  ProfileListAccessResponse,
  ProfileListSubscribeResponse,
  Event,
  EventAction,

  ShippingStatus,
  OrderShipping,
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
  QuoteLine,
  ProductQuoteLine,
  ServiceQuoteLine,
  ProductQuoteLineAvailability,
  ServiceQuoteLineAvailability,
  OrderItemStatus,
  OrderStatus,
  OrderPaymentStatus,
  OrderCancellationReason,
  HistoryEntry,

  Product,
  ProductVariant,
  ProductInventory,
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

  Profile,
  ProfileList,
  ProfileListMembership,
  Mailbox,
  MailboxConnectionSecurity,
  MailboxProvider,
  MailboxPreset,
  MailboxSyncStatus,
  SmtpImapMailboxProvider,
  OutreachStep,
  OutreachStepVariant,
  OutreachPersonalizationCounters,
  OutreachPersonalizationState,
  OutreachCampaign,
  OutreachCampaignLaunchReadiness,
  OutreachEnrollment,
  OutreachMessage,
  OutreachReply,
  Suppression,
  LeadGenerationRun,
  LeadGenerationRunCounters,
  LeadGenerationRunStatus,
  LeadGenerationLead,
  LeadGenerationLeadStatus,
  LeadEmailClassification,
  LeadValidationCheck,
  LeadValidationCheckStatus,
  LeadEmailValidationResult,
  ImportLeadGenerationLeadsResult,
  LeadResearchMessage,
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
  ProfileStatus,
  ProfileListStatus,
  ProfileListSource,
  ProfileListMembershipStatus,
  MailboxStatus,
  OutreachCampaignStatus,
  OutreachEnrollmentStatus,
  OutreachMessageKind,
  OutreachMessageStatus,
  OutreachPersonalizationStatus,
  OutreachStepVariantStatus,
  OutreachThreadMode,
  SuppressionStatus,
  SuppressionTargetType,
  SuppressionScopeType,
  SuppressionReason,
  SuppressionSource,
  WorkflowStatus,
  PromoCodeStatus,
  NodeStatus,
  EmailTemplateStatus,
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
  ImportProfilesParams,
  ImportProfilesPreviewParams,
  ImportProfilesPreviewResult,
  ImportProfilesResult,
  
  GetShippingRatesParams,
  ShipParams,
  
  CreateProfileListParams,
  UpdateProfileListParams,
  FindProfileListsParams,
  GetProfileListParams,
  AddProfileListProfileParams,
  RemoveProfileListProfileParams,
  FindProfileListProfilesParams,
  ImportProfileRowInput,
  ImportProfileRowError,
  ImportProfileRowResult,
  ImportProfileListRowResult,
  ImportProfileListPreviewParams,
  ImportProfilesIntoProfileListParams,
  ImportProfilesIntoProfileListResult,
  SubscribeProfileListParams,
  ProfileListAccessParams,
  CreateMailboxParams,
  UpdateMailboxParams,
  FindMailboxesParams,
  GetMailboxParams,
  PrepareMailboxParams,
  TestMailboxParams,
  TestMailboxResult,
  CreateOutreachCampaignParams,
  UpdateOutreachCampaignParams,
  FindOutreachCampaignsParams,
  GetOutreachCampaignParams,
  LaunchOutreachCampaignParams,
  GetOutreachCampaignLaunchReadinessParams,
  GenerateOutreachPersonalizedDraftsParams,
  FindOutreachEnrollmentsParams,
  FindOutreachMessagesParams,
  UpdateOutreachMessageParams,
  RespondToOutreachReplyParams,
  FindOutreachRepliesParams,
  CreateSuppressionParams,
  UpdateSuppressionParams,
  FindSuppressionsParams,
  GetSuppressionParams,
  CreateLeadGenerationRunParams,
  FindLeadGenerationRunsParams,
  GetLeadGenerationRunParams,
  CancelLeadGenerationRunParams,
  SendLeadResearchMessageParams,
  FindLeadResearchMessagesParams,
  FindLeadGenerationLeadsParams,
  UpdateLeadGenerationLeadParams,
  ImportLeadGenerationLeadsParams,
  ValidateLeadEmailParams,
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
  AnalyticsActivityReportKey,
  AnalyticsCompositeReportKey,
  AnalyticsReportRequest,
  AnalyticsBlockRequest,
  AnalyticsRequest,
  AnalyticsMetricData,
  AnalyticsBreakdownItem,
  AnalyticsBreakdownData,
  BusinessOverviewData,
  RevenueByCurrencyData,
  ProfileFunnelStage,
  ProfileFunnelData,
  OutreachOverviewData,
  OutreachFunnelStage,
  OutreachFunnelData,
  OutreachVariantPerformanceItem,
  OutreachVariantPerformanceData,
  EntityStatusOverviewData,
  DataHealthData,
  AnalyticsReport,
  AnalyticsBlockResponse,
  AnalyticsResponse,
  ActivityFeedCategory,
  ActivityFeedItem,
  ActivityFeedSummary,
  ActivityFeedCursor,
  ActivityFeedData,
} from "./api/analytics";

export type {
  CreateLocationParams,
  UpdateLocationParams,
  DeleteLocationParams,
} from "./types/api";

export type {
  Activity,
  TrackParams,
  CommonActivityType,
} from "./api/storefront";
export { COMMON_ACTIVITY_TYPES } from "./api/storefront";
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
  ChatFlow,
  ChatSession,
  ChatMessage,
  ChatSessionResponse,
  ChatFlowNode,
  ChatFlowEdge,
  ChatAiConfig,
  EdgeTrigger,
  ChatAction,
} from "./api/chat";
export type {
  IntegrationOperation,
  IntegrationResource,
  IntegrationService,
} from "./api/platform";

export const SDK_VERSION = "0.9.2";
export const SUPPORTED_FRAMEWORKS = [
  "astro",
  "react",
  "vue",
  "svelte",
  "vanilla",
] as const;

import type { Profile as ProfileType, Store as StoreType, Market as MarketType } from "./types";

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

export interface ProfileSessionInternal {
  access_token: string;
  profile: ProfileType;
  store: StoreType;
  market: MarketType | null;
}

export interface AdminSession {
  email?: string;
}

export interface ProfileSession {
  profile: ProfileType;
  store: StoreType;
  market: MarketType | null;
}

export type AdminSessionUpdater = (
  updater: (prev: AdminSessionInternal | null) => AdminSessionInternal | null,
) => void;

export type ProfileSessionUpdater = (
  updater: (prev: ProfileSessionInternal | null) => ProfileSessionInternal | null,
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
import { createProfileApi } from "./api/crm";
import { createAdminChatApi, createStorefrontChatApi } from "./api/chat";
import { createLeadGenerationApi } from "./api/leadGeneration";
import { createWorkflowApi } from "./api/workflow";
import { createPlatformApi } from "./api/platform";
import { createShippingApi } from "./api/shipping";
import { createEmailTemplateApi } from "./api/emailTemplate";
import { createFormApi } from "./api/form";
import { createTaxonomyApi } from "./api/taxonomy";
import { createAnalyticsApi } from "./api/analytics";
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

export type CreateAdminConfig = Omit<HttpClientConfig, "authStorage" | "storeId"> & {
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
                  access_expires_at: tokens.access_expires_at ?? prev.access_expires_at,
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
  const crmApi = createProfileApi(apiConfig);
  const chatApi = createAdminChatApi(apiConfig);
  const leadGenerationApi = createLeadGenerationApi(apiConfig);
  const leadGeneration = {
    run: {
      create: leadGenerationApi.createRun,
      find: leadGenerationApi.findRuns,
      get: leadGenerationApi.getRun,
      cancel: leadGenerationApi.cancelRun,
      import: leadGenerationApi.importLeads,
      sendMessage: leadGenerationApi.sendMessage,
      findMessages: leadGenerationApi.findMessages,
    },
    message: {
      send: leadGenerationApi.sendMessage,
      find: leadGenerationApi.findMessages,
    },
    lead: {
      find: leadGenerationApi.findLeads,
      update: leadGenerationApi.updateLead,
    },
    email: {
      validate: leadGenerationApi.validateEmail,
    },
    createRun: leadGenerationApi.createRun,
    findRuns: leadGenerationApi.findRuns,
    getRun: leadGenerationApi.getRun,
    cancelRun: leadGenerationApi.cancelRun,
    sendMessage: leadGenerationApi.sendMessage,
    findMessages: leadGenerationApi.findMessages,
    findLeads: leadGenerationApi.findLeads,
    updateLead: leadGenerationApi.updateLead,
    importLeads: leadGenerationApi.importLeads,
    validateEmail: leadGenerationApi.validateEmail,
  };
  const locationApi = createLocationApi(apiConfig);
  const marketApi = createMarketApi(apiConfig);
  const workflowApi = createWorkflowApi(apiConfig);
  const formApi = createFormApi(apiConfig);
  const taxonomyApi = createTaxonomyApi(apiConfig);
  const emailTemplateApi = createEmailTemplateApi(apiConfig);
  const analyticsApi = createAnalyticsApi(apiConfig);

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
    shipping: createShippingApi(apiConfig),
    cms: {
      node: {
        create: cmsApi.createNode,
        update: cmsApi.updateNode,
        delete: cmsApi.deleteNode,
        get: cmsApi.getNode,
        find: cmsApi.getNodes,
        getChildren: cmsApi.getNodeChildren,
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
      profile: {
        create: crmApi.create,
        get: crmApi.get,
        find: crmApi.find,
        update: crmApi.update,
        merge: crmApi.merge,
        import: crmApi.import,
        revokeToken: crmApi.revokeToken,
        revokeAllTokens: crmApi.revokeAllTokens,
      },
      profileList: crmApi.profileList,
      mailbox: crmApi.mailbox,
      outreachCampaign: crmApi.outreachCampaign,
      outreachEnrollment: crmApi.outreachEnrollment,
      outreachMessage: crmApi.outreachMessage,
      outreachReply: crmApi.outreachReply,
      suppression: crmApi.suppression,
      leadGeneration,
      activity: crmApi.activity,
    },
    leadGeneration,
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
      },
      chat: chatApi,
    },

    analytics: analyticsApi,

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

const PROFILE_STORAGE_KEY = "arky_profile_session";

function readProfileSession(): ProfileSessionInternal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileSessionInternal) : null;
  } catch {
    return null;
  }
}

function writeProfileSession(s: ProfileSessionInternal | null): void {
  if (typeof window === "undefined") return;
  if (s) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(s));
  } else {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  }
}

export type CreateStorefrontConfig = Omit<HttpClientConfig, "authStorage" | "storeId"> & {
  storeId: string;
  market?: string;
  locale?: string;
  apiToken?: string;
};

export function createStorefront(config: CreateStorefrontConfig) {
  const locale = config.locale || "en";
  const initialMarket = config.market || "";
  const listeners = new Set<AuthStateListener<ProfileSession>>();
  let bareIdentifyPromise: Promise<ProfileSession> | null = null;

  function toPublic(s: ProfileSessionInternal | null): ProfileSession | null {
    return s ? { profile: s.profile, store: s.store, market: s.market } : null;
  }

  function emit(): void {
    const pub = toPublic(readProfileSession());
    for (const l of listeners) {
      Promise.resolve()
        .then(() => l(pub))
        .catch(() => {});
    }
  }

  const updateSession: ProfileSessionUpdater = (updater) => {
    if (config.apiToken) return;
    const prev = readProfileSession();
    const next = updater(prev);
    writeProfileSession(next);
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
          const s = readProfileSession();
          return s ? { access_token: s.access_token } : null;
        },
        onTokensRefreshed() {
          // Profile tokens are one-shot; no refresh on this flow.
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
  const profileApi = storefrontApi.crm.profile;

  function identify(
    params?: { email?: string; verify?: boolean; market?: string },
  ): Promise<ProfileSession> {
    if (params?.market !== undefined) apiConfig.market = params.market;

    const isBareCall = !params?.email && !params?.verify;
    if (isBareCall && bareIdentifyPromise) return bareIdentifyPromise;

    const promise = (async (): Promise<ProfileSession> => {
      try {
        const result = await profileApi.identify({
          market: apiConfig.market,
          email: params?.email,
          verify: params?.verify,
        });
        return {
          profile: result.profile,
          store: result.store,
          market: result.market,
        };
      } catch (err: unknown) {
        const e = err as { statusCode?: number; status?: number; response?: { status?: number } };
        const status = e?.statusCode || e?.status || e?.response?.status;
        if (isBareCall && status === 401) {
          updateSession(() => null);
          const result = await profileApi.identify({ market: apiConfig.market });
          return {
            profile: result.profile,
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
    const result = await profileApi.verify(params);
    bareIdentifyPromise = null;
    return result;
  }

  async function logout(): Promise<void> {
    if (config.apiToken) return;
    bareIdentifyPromise = null;
    try {
      await profileApi.logout();
    } catch {
      updateSession(() => null);
    }
  }

  return {
    identify,
    verify,
    logout,
    me: () => profileApi.getMe(),

    get session(): ProfileSession | null {
      if (config.apiToken) return null;
      return toPublic(readProfileSession());
    },

    get isAuthenticated(): boolean {
      if (config.apiToken) return true;
      const s = readProfileSession();
      return s !== null && !!s.access_token;
    },

    onAuthStateChanged(listener: AuthStateListener<ProfileSession>): () => void {
      listeners.add(listener);
      const current = toPublic(readProfileSession());
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
    activity: storefrontApi.activity,
    chat: createStorefrontChatApi(apiConfig),
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
