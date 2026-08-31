export { ScheduledResultTimeoutError } from "./utils/scheduledResult";
export { createStripeEmbeddedCheckout, mountCheckoutAction } from "./checkout";
export { selectLocalizedObjectText } from "./utils/blocks";
export type {
  EmbeddedCheckoutCallbacks,
  EmbeddedCheckoutAction,
  EmbeddedCheckoutMount,
  StripeEmbeddedCheckoutAction,
} from "./checkout";
export type { ScheduledMutationOptions } from "./services/createHttpClient";

export type {
  EshopCartItem,
  CartProductItem,
  CartBookingItem,
  CartDigitalItem,
  Cart,
  CartOrigin,
  CartStatus,
  EshopStoreState,
  Store,
  StoreStatus,
  StoreDeletionResult,
  StoreUsage,
  UsagePeriod,
  Webhook,
  WebhookStatus,
  WebhookEventSubscription,
  BuildHook,
  BuildHookStatus,
  SocialConnectResult,
  SocialDestination,
  SocialConnection,
  SocialConnectionStatus,
  SocialCredential,
  SocialCredentialRefresh,
  SocialCredentialRefreshStatus,
  SocialConnectionType,
  InstagramPlacement,
  SocialPost,
  SocialPostContent,
  SocialPostStatus,
  SocialPublishEvidence,
  SocialPublishOperation,
  SocialPublishOperationStatus,
  SocialPublishOperationType,
  SocialPublishProgress,
  SocialPublishRequest,
  SocialMessage,
  SocialMessageType,
  SocialMessageSync,
  SocialMessageSyncType,
  SocialMessageSyncResult,
  SocialIncomingCommentRelation,
  SocialCommentAuthor,
  SocialCommentDirection,
  SocialOutgoingCommentStatus,
  TiktokPrivacy,
  ValidationError,
  YoutubePrivacy,
  Block,
  BlockBase,
  TextBlock,
  MarkdownBlock,
  NumberBlock,
  BooleanBlock,
  DateBlock,
  MediaBlock,
  EntryBlock,
  FormBlock,
  ProductBlock,
  DigitalProductBlock,
  ArrayBlock,
  ObjectBlock,
  Currency,
  Money,
  Price,
  OrderPayment,
  OrderPaymentProvider,
  PaymentAmounts,
  OrderMoney,
  PaymentProvider,
  PaymentProviderConfiguration,
  PaymentProviderConfigurationType,
  PaymentProviderConnectResponse,
  StripePlatformDebitConsent,
  TaxMode,
  OrderPromoCodeSnapshot,
  OrderRefund,
  OrderRefundProvider,
  RefundAllocation,
  RefundStatus,
  RefundReason,
  RefundRequestReason,
  OrderDigitalItem,
  OrderDigitalSnapshot,
  DigitalProductQuoteLine,
  DigitalProduct,
  StorefrontDigitalProduct,
  DigitalAsset,
  DigitalProductStatus,
  DigitalAssetStatus,
  DigitalDownload,
  DigitalLibraryAsset,
  DigitalLibraryItem,
  DigitalLibraryProduct,
  PaymentDisputeProvider,
  PaymentDispute,
  PaymentDisputeStatus,
  StripeDisputeStatus,
  OrderQuote,
  CheckoutPaymentAction,
  StoreSubscriptionCheckoutAction,
  OrderCheckoutResult,
  StoreSubscription,
  StoreSubscriptionCheckout,
  StoreSubscriptionCheckoutStatus,
  StorePlanAccess,
  StoreSubscriptionStatus,
  ProviderOperationClaim,
  ProviderEffectError,
  SubscriptionPlan,
  SubscriptionPlanFeature,
  SubscriptionPlanFeatureType,
  SubscriptionPrice,
  Audience,
  AudienceStatus,
  AudiencePaidCharge,
  AudienceType,
  StorefrontAudience,
  StorefrontAudienceType,
  AudienceMembershipStatus,
  AudienceCheckoutState,
  AudienceBillingTerms,
  AudienceOneTimeState,
  AudienceSubscriptionState,
  AudienceCancellation,
  AudienceMembershipType,
  AudienceMembership,
  CustomerAudienceMembership,
  AudienceJoinResult,
  StartAudienceCheckoutResult,
  AudienceBillingPortalSession,
  AudienceMembershipBilling,
  AudienceMembershipBillingRow,
  AudienceBillingTimeRange,
  AudienceRefund,
  AudienceRefundStatus,
  AudienceRefundReason,
  AudienceSystemRefundReason,
  AudienceRefundRequester,
  AudienceDispute,
  AudienceDisputeResponse,
  AudienceDisputeStatus,
  ShippingMethod,
  ShippingWeightTier,
  Zone,
  Market,
  Address,
  PostalAddress,
  GeoLocation,
  ZoneLocation,
  StoreLocation,
  PaginatedResponse,
  Access,
  Media,
  MediaFile,
  MediaRendition,
  MediaRenditionType,
  Coordinates,
  Collection,
  BlockSchema,
  BlockSchemaProperties,
  BlockSchemaType,
  CollectionEntry,
  EntryBlockQuery,
  MediaRef,
  FieldOperation,
  Workflow,
  WorkflowListItem,
  WorkflowGraph,
  WorkflowWebhookUrl,
  WorkflowNode,
  WorkflowEdge,
  WorkflowHttpNode,
  WorkflowDeployWebhookNode,
  WorkflowGoogleDriveUploadNode,
  WorkflowConnection,
  WorkflowConnectionConnectUrl,
  WorkflowConnectionData,
  WorkflowConnectionType,
  GoogleDriveWorkflowConnectionData,
  GoogleDriveWorkflowAccount,
  WorkflowConnectionAuthorizationStatus,
  WorkflowSwitchNode,
  WorkflowSwitchRule,
  WorkflowTransformNode,
  WorkflowLoopNode,
  WorkflowHttpMethod,
  WorkflowExecution,
  WorkflowExecutionListItem,
  WorkflowExecutionStarted,
  WorkflowExecutionInput,
  WorkflowExecutionStatus,
  WorkflowExternalOperation,
  WorkflowExternalOperationError,
  WorkflowExternalOperationErrorType,
  WorkflowExternalOperationResult,
  WorkflowExternalOperationStatus,
  WorkflowExternalOperationType,
  NodeResult,
  Event,
  EventAction,
  OrderShipmentStatus,
  ShippingRateLine,
  OrderShippingLine,
  FulfillmentOrderStatus,
  FulfillmentOrderLine,
  FulfillmentOrder,
  ShippingRate,
  Parcel,
  ShippingLabelStatus,
  ShippingLabel,
  ShippingLabelRefund,
  ShippingLabelRefundStatus,
  ShippingLabelCharge,
  ShippingLabelChargeStatus,
  ShippingLabelChargeRefund,
  ShippingLabelChargeRefundReason,
  ShippingLabelChargeRefundStatus,
  OrderShipmentLine,
  OrderShipment,
  CreateOrderShipmentResponse,
  CustomsItem,
  CustomsDeclaration,
  GeoLocationBlock,
  BookingService,
  BookingResource,
  BookingOffering,
  BookingCapacityClaim,
  BookingResourceCapacityDay,
  BookingWindow,
  BookingReminderScheduleItem,
  ServiceDuration,
  Weekday,
  WorkingWindow,
  WeeklyAvailability,
  DateOverride,
  TimeRange,
  Order,
  OrderProductItem,
  OrderProductInventoryAllocation,
  OrderBookingItem,
  OrderProductSnapshot,
  OrderBookingSnapshot,
  DiscountAllocation,
  TaxLine,
  LineMoneySnapshot,
  OrderItemStatus,
  OrderBookingStatus,
  ProductQuoteLine,
  BookingQuoteLine,
  BookingQuoteLineAvailability,
  OrderStatus,
  OrderPaymentStatus,
  OrderCancellationReason,
  Product,
  ProductVariant,
  ProductInventory,
  GalleryItem,
  EmailTemplate,
  EmailTemplateType,
  AccountVerificationEmailStatus,
  CampaignEmailStatus,
  EmailAttachmentReference,
  WorkflowEmailSend,
  WorkflowEmailSendTemplateData,
  Form,
  FormSubmission,
  FormSchema,
  FormSchemaType,
  FormField,
  FormFieldType,
  FormValue,
  FormValues,
  FormEntry,
  Classification,
  ClassificationEntry,
  ClassificationQuery,
  ClassificationSchema,
  ClassificationSchemaType,
  ClassificationField,
  ClassificationFieldQuery,
  ClassificationCoordinates,
  ClassificationGeoLocation,
  ClassificationNumberOperation,
  PromotionDiscount,
  PromotionCondition,
  PromoCode,
  Customer,
  CustomerIdentity,
  CustomerEmailVerification,
  CustomerSessionRecord,
  CustomerSessionIssued,
  CustomerSessionStatus,
  AudienceOutreachChannel,
  CustomerAction,
  CustomerActionType,
  CustomerActionOrigin,
  CustomerActionProviderObservation,
  AudienceMembershipJoinSource,
  AudienceBillingCadence,
  AudienceUnsubscribeReason,
  AudienceCancellationTiming,
  AudienceActionTimeRange,
  AudienceRefundActionStatus,
  AudienceDisputeActionStatus,
  Mailbox,
  MailboxConnectionSecurity,
  MailboxPreset,
  MailboxSyncStatus,
  MailboxSyncIssue,
  MailboxSyncIssueType,
  GoogleMailboxProvider,
  SmtpImapMailboxProviderInput,
  SmtpImapMailboxProvider,
  CampaignStep,
  Campaign,
  CampaignEnrollment,
  CampaignConversationMessage,
  CampaignEnrollmentConversationResponse,
  EnrollCampaignResult,
  CampaignMessage,
  LeadResearch,
  LeadResearchCreated,
  LeadResearchMessage,
  LeadResearchMessageType,
  LeadResearchMessagePair,
  LeadResearchAssistantMessageStatus,
  LeadResearchAssistantFailureReason,
  Account,
  AccountApiToken,
  AccountApiTokenStatus,
  AccountApiTokenCreated,
  AccountSession,
  AccountSessionStatus,
  StoreMembership,
  StoreMember,
  BookingServiceStatus,
  BookingResourceStatus,
  BookingOfferingStatus,
  ProductStatus,
  CustomerStatus,
  MailboxStatus,
  CampaignStatus,
  CampaignStatusFilter,
  CampaignThreadMode,
  CampaignEnrollmentStatus,
  CampaignEnrollmentStatusFilter,
  CampaignEnrollmentStopReason,
  CampaignOutgoingOrigin,
  CampaignMessageType,
  CampaignEmailContent,
  WorkflowStatus,
  MutableWorkflowStatus,
  WorkflowSendEmailNode,
  PromoCodeStatus,
  CollectionStatus,
  EntryStatus,
  EmailTemplateStatus,
  EmailTemplateVariable,
  EmailTemplateVariableSource,
  FormStatus,
  ClassificationStatus,
} from "./types";
export type {
  CreateMediaParams,
  DeleteMediaParams,
  FindMediaParams,
  GetMediaParams,
  GetMediaByIdsParams,
  ReplaceMediaContentParams,
  CreateCustomerParams,
  UpdateCustomerParams,
  GetCustomerParams,
  ArchiveCustomerParams,
  FindCustomersParams,
  FindCustomerSessionsParams,
  RevokeAllCustomerSessionsParams,
  RevokeCustomerSessionParams,
  GetAvailabilityParams,
  AvailabilitySlot,
  DaySlots,
  BookingResourceAvailability,
  AvailabilityResponse,
  BookingItemLifecycleParams,
  CreateBookingServiceParams,
  UpdateBookingServiceParams,
  DeleteBookingServiceParams,
  GetBookingServiceParams,
  FindBookingServicesParams,
  CreateBookingResourceParams,
  UpdateBookingResourceParams,
  DeleteBookingResourceParams,
  GetBookingResourceParams,
  FindBookingResourcesParams,
  CreateBookingOfferingParams,
  UpdateBookingOfferingParams,
  DeleteBookingOfferingParams,
  FindBookingOfferingsParams,
  CreatePromoCodeParams,
  UpdatePromoCodeParams,
  CreatePromotionDiscountInput,
  UpdatePromotionDiscountInput,
  PromotionConditionInput,
  DeletePromoCodeParams,
  GetPromoCodeParams,
  GetPromoCodesParams,
  CreateProductParams,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  GetProductsParams,
  ProductQuoteInput,
  BookingQuoteInput,
  GetQuoteParams,
  GetOrderParams,
  GetOrdersParams,
  UpdateOrderParams,
  CartProductInput,
  CartBookingInput,
  CartDigitalItemInput,
  DigitalProductQuoteInput,
  TrustedCartProductInput,
  TrustedCartBookingInput,
  TrustedCartDigitalItemInput,
  CreateOrderRefundParams,
  RecordCashOnDeliveryRefundParams,
  CancelOrderProductItemParams,
  CreateOrderRefundResponse,
  FindOrderRefundsParams,
  GetOrderRefundParams,
  GetOrderPaymentParams,
  MarkCashOnDeliveryPaidParams,
  GetCurrentCartParams,
  GetCartParams,
  FindCartsParams,
  CreateCartParams,
  UpdateCartParams,
  AddCartProductParams,
  AddCartBookingParams,
  AddCartDigitalProductParams,
  CreateDigitalProductParams,
  UpdateDigitalProductParams,
  GetDigitalProductParams,
  FindDigitalProductsParams,
  UploadDigitalAssetParams,
  FindDigitalAssetsParams,
  ArchiveDigitalAssetParams,
  DownloadDigitalAssetParams,
  FindStorefrontDigitalProductsParams,
  GetStorefrontDigitalProductParams,
  GetDigitalLibraryProductParams,
  RemoveCartItemParams,
  ClearCartParams,
  QuoteCartParams,
  CheckoutCartParams,
  SystemTemplateKey,
  ImportCustomersParams,
  ImportCustomersPreviewParams,
  ImportCustomersPreviewResult,
  ImportCustomersResult,
  ImportCustomerRowInput,
  ImportCustomerFieldError,
  ImportCustomerPreviewRow,
  ImportCustomerRowResult,
  GetCollectionsParams,
  CreateCollectionParams,
  UpdateCollectionParams,
  GetCollectionParams,
  DeleteCollectionParams,
  GetClassificationsParams,
  CreateClassificationParams,
  UpdateClassificationParams,
  GetClassificationParams,
  GetStorefrontClassificationParams,
  DeleteClassificationParams,
  GetClassificationChildrenParams,
  GetEntriesParams,
  CreateEntryParams,
  UpdateEntryParams,
  GetEntryParams,
  DeleteEntryParams,
  GetShippingRatesParams,
  FindOrderShipmentsParams,
  FindFulfillmentOrdersParams,
  GetFulfillmentOrderParams,
  GetOrderShipmentParams,
  CreateOrderShipmentParams,
  RetryShippingLabelParams,
  RequestShippingLabelRefundParams,
  RetryShippingLabelRefundParams,
  GetShippingLabelChargeParams,
  RetryShippingLabelChargeParams,
  GetShippingLabelChargeRefundParams,
  RetryShippingLabelChargeRefundParams,
  FindPaymentDisputesParams,
  GetPaymentDisputeParams,
  SelectStoreSubscriptionParams,
  CancelStoreSubscriptionParams,
  ReactivateStoreSubscriptionParams,
  TestWebhookParams,
  TestWebhookResponse,
  WebhookDeliveryStatus,
  CreateAudienceParams,
  PatchAudienceParams,
  AudienceReferenceParams,
  FindAudiencesParams,
  GetAudienceParams,
  FindAudienceMembershipsParams,
  GetAudienceMembershipParams,
  EnrollAudienceMembershipParams,
  AudienceMembershipImportRow,
  PreviewAudienceMembershipImportParams,
  ImportAudienceMembershipsParams,
  ReplaceAudienceMembershipInsightParams,
  AudienceRefundChargeSelector,
  RequestAudienceRefundParams,
  FindAudienceRefundsParams,
  GetAudienceRefundParams,
  FindAudienceDisputesParams,
  GetAudienceDisputeParams,
  FindStorefrontAudiencesParams,
  GetStorefrontAudienceParams,
  JoinAudienceParams,
  StartAudienceCheckoutParams,
  FindCustomerAudienceMembershipsParams,
  CustomerAudienceMembershipReferenceParams,
  CreateAudienceBillingPortalSessionParams,
  ConfirmAudienceParams,
  UnsubscribeAudienceParams,
  CreateMailboxParams,
  UpdateMailboxParams,
  FindMailboxesParams,
  GetMailboxParams,
  PrepareMailboxParams,
  TestMailboxParams,
  TestMailboxResult,
  CreateCampaignParams,
  ReplaceDraftCampaignParams,
  FindCampaignsParams,
  GetCampaignParams,
  EnrollCampaignParams,
  FindCampaignEnrollmentsParams,
  RemovePendingCampaignEnrollmentParams,
  GetCampaignEnrollmentConversationParams,
  ReplyCampaignEnrollmentParams,
  StopCampaignEnrollmentParams,
  ReplaceCampaignMessageDraftParams,
  CreateLeadResearchParams,
  FindLeadResearchesParams,
  GetLeadResearchParams,
  SendLeadResearchMessageParams,
  FindLeadResearchMessagesParams,
  RetryLeadResearchMessageParams,
  CancelLeadResearchMessageParams,
  CancelSocialPostParams,
  ConnectStripePaymentProviderParams,
  ConnectSocialConnectionParams,
  CreateSocialMessageParams,
  CreateSocialPostParams,
  DisconnectSocialConnectionParams,
  FindSocialConnectionsParams,
  FindSocialMessagesParams,
  FindSocialPostsParams,
  OpenStripeDashboardParams,
  GetSocialPostParams,
  ListPaymentProvidersParams,
  RefreshStripePaymentProviderParams,
  SyncSocialMessagesParams,
  AuthToken,
  PendingAccountSession,
  RefreshAccountSessionParams,
  RequestPendingAccountSessionParams,
  VerifyPendingAccountSessionParams,
  PlatformRole,
  StoreRole,
  UpdatePlatformRoleParams,
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
  AnalyticsCustomerActionReportKey,
  AnalyticsCompositeReportKey,
  AnalyticsReportRequest,
  AnalyticsBlockRequest,
  AnalyticsRequest,
  AnalyticsMetricData,
  AnalyticsRateData,
  AnalyticsBreakdownItem,
  AnalyticsBreakdownData,
  BusinessOverviewData,
  RevenueByCurrencyData,
  CustomerFunnelStage,
  CustomerFunnelData,
  OutreachOverviewData,
  OutreachFunnelStage,
  OutreachFunnelData,
  EntityStatusOverviewData,
  DataHealthData,
  AnalyticsReport,
  AnalyticsReportScope,
  AnalyticsBlockResponse,
  AnalyticsResponse,
  CustomerActionFeedCategory,
  CustomerActionFeedItem,
  CustomerActionFeedSummary,
  CustomerActionFeedCursor,
  CustomerActionFeedData,
} from "./api/analytics";

export type {
  CreateStoreLocationParams,
  UpdateStoreLocationParams,
  DeleteStoreLocationParams,
  CreateMarketParams,
  UpdateMarketParams,
  MarketZoneInput,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  ProductInventoryInput,
} from "./types/api";

export type {
  RegenerateWorkflowWebhookUrlParams,
  InvokeWorkflowWebhookParams,
} from "./types/api";

export type {
  TrackCustomerActionParams,
  CommonCustomerActionKey,
  ExperimentUseResponse,
  StorefrontCustomer,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontDto,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontPaymentProvider,
  StorefrontSetup,
  StorefrontVisitorSessionRecord,
  StorefrontZone,
  UseExperimentParams,
} from "./api/storefront";
export { COMMON_CUSTOMER_ACTION_KEYS } from "./api/storefront";
export type {
  CreateExperimentParams,
  Experiment,
  ExperimentLifecycleParams,
  ExperimentResults,
  ExperimentStatus,
  ExperimentStatusFilter,
  ExperimentVariant,
  ExperimentVariantResult,
  FindExperimentsParams,
  GetExperimentParams,
  ReplaceDraftExperimentParams,
} from "./api/experiments";
export {
  createCartController,
  type CartApi,
  type CartController,
  type CartControllerAddProductParams,
  type CartControllerAddBookingParams,
  type CartControllerAddDigitalParams,
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

export type { FindCustomerActionsParams } from "./types/api";
export type {
  SupportAgent,
  SupportAgentDefinition,
  SupportAgentStatus,
  SupportChannel,
  SupportChannelConfig,
  SupportChannelStatus,
  SupportChannelType,
  SupportConversation,
  SupportConversationChannelContext,
  SupportAiResponse,
  SupportAiResponseStatus,
  SupportEmailStatus,
  SupportMessage,
  SupportConversationResponse,
  SupportConversationStartResponse,
  StorefrontSupportConversationResponse,
  StorefrontSupportConversationStartResponse,
  SendSupportMessageParams,
  StorefrontSendSupportMessageParams,
  StorefrontGetSupportConversationParams,
  StorefrontGetSupportMessageParams,
  SupportAgentNode,
  SupportAgentEdge,
  SupportAgentAiConfig,
  EdgeTrigger,
  SupportAction,
  AssignSupportConversationParams,
  GetSupportConversationParams,
  GetSupportMessageParams,
  ReplySupportConversationParams,
  ResolveSupportConversationParams,
  CreateSupportChannelParams,
  UpdateSupportChannelParams,
  FindSupportChannelsParams,
  FindSupportConversationsParams,
  ReceiveSupportChannelMessageParams,
} from "./api/support";
export type { EventMetadata, EventScopeField } from "./api/platform";

export const SDK_VERSION = "0.26.2";
export const SUPPORTED_FRAMEWORKS = [
  "astro",
  "react",
  "vue",
  "svelte",
  "vanilla",
] as const;

import type { Price } from "./types";

export interface AdminSession {
  email?: string;
}

export interface StorefrontCustomerSession {
  customer: import("./api/storefront").StorefrontCustomer;
  id: string;
  type: import("./types").CustomerSessionIssued["type"];
  status: import("./types").CustomerSessionStatus;
}

export type StorefrontIdentifyResult =
  import("./api/storefront").IdentifyResponse;
export type StorefrontRequestCodeResult =
  import("./api/storefront").RequestCodeResponse;
export type StorefrontVerifyResult = import("./api/storefront").VerifyResponse;
export type StorefrontRefreshResult =
  import("./api/storefront").RefreshResponse;

export type AuthStateListener<T> = (session: T | null) => void;

import {
  createHttpClient,
  type HttpClientConfig,
  type HttpClient,
  type AuthStorage,
} from "./services/createHttpClient";
import type {
  AdminSessionInternal,
  AdminSessionUpdater,
  ApiConfig,
  StorefrontApiConfig,
} from "./services/clientTypes";
export type {
  AdminSessionInternal,
  AdminSessionUpdater,
  ApiConfig,
  StorefrontApiConfig,
} from "./services/clientTypes";
import { createAccountApi } from "./api/account";
import { createAuthApi } from "./api/auth";
import { createStoreApi } from "./api/store";
import { createMediaApi } from "./api/media";
import { createPromoCodeApi } from "./api/promoCode";
import { createContentApi } from "./api/content";
import { createEshopApi } from "./api/eshop";
import { createDigitalApi } from "./api/digital";
import { createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createCustomersApi } from "./api/customers";
import { createAudiencesApi } from "./api/audiences";
import { createActionsApi } from "./api/actions";
import { createMailboxApi } from "./api/mailbox";
import { createCampaignApi } from "./api/campaign";
import {
  createAdminSupportApi,
  createStorefrontSupportApi,
} from "./api/support";
import { createLeadResearchApi } from "./api/leadResearch";
import { createSocialApi } from "./api/social";
import { createWorkflowApi } from "./api/workflow";
import { createPlatformApi } from "./api/platform";
import { createShippingApi } from "./api/shipping";
import { createPaymentProviderApi } from "./api/paymentProvider";
import { createEmailTemplateApi } from "./api/emailTemplate";
import { createFormsApi } from "./api/forms";
import { createClassificationApi } from "./api/classification";
import { createAnalyticsApi } from "./api/analytics";
import { createExperimentsApi } from "./api/experiments";
import {
  createStorefrontApi,
  type CustomerSessionInternal,
  type CustomerSessionUpdater,
} from "./api/storefront";
export type {
  CustomerSessionInternal,
  CustomerSessionUpdater,
} from "./api/storefront";
import {
  getImageUrl,
  getBlockValue,
  getBlockTextValue,
  getBlockContentValue,
  getBlockValues,
  getBlockLabel,
  getBlockObjectValues,
  getBlockFromArray,
  formatBlockValue,
  prepareBlocksForSubmission,
  extractBlockValues,
  collectBlockReferences,
  selectLocalizedObjectText,
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
  getFreeToSellStock,
  getReservedStock,
  hasStock,
  getInventoryAt,
  getFirstAvailableStoreLocationId,
} from "./utils/inventory";

function createUtilitySurface(apiConfig: Pick<ApiConfig, "market">) {
  return {
    getImageUrl: (imageBlock: unknown, isBlock = true) =>
      getImageUrl(imageBlock, isBlock),
    getBlockValue,
    getBlockTextValue,
    getBlockContentValue,
    getBlockValues,
    getBlockLabel,
    getBlockObjectValues,
    getBlockFromArray,
    formatBlockValue,
    prepareBlocksForSubmission,
    extractBlockValues,
    collectBlockReferences,
    selectLocalizedObjectText,

    formatPrice: (prices: Price[]) => formatPrice(prices, apiConfig.market),
    getPriceAmount: (prices: Price[]) =>
      getPriceAmount(prices, apiConfig.market),
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

    getFreeToSellStock,
    getReservedStock,
    hasStock,
    getInventoryAt,
    getFirstAvailableStoreLocationId,
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

  const contentApi = createContentApi(apiConfig);
  const eshopApi = createEshopApi(apiConfig);
  const digitalApi = createDigitalApi(apiConfig);
  const promoCodeApi = createPromoCodeApi(apiConfig);
  const customersApi = createCustomersApi(apiConfig);
  const audienceApi = createAudiencesApi(apiConfig);
  const actionsApi = createActionsApi(apiConfig);
  const mailboxApi = createMailboxApi(apiConfig);
  const campaignApi = createCampaignApi(apiConfig);
  const supportApi = createAdminSupportApi(apiConfig);
  const leadResearchApi = createLeadResearchApi(apiConfig);
  const socialApi = createSocialApi(apiConfig);
  const paymentProviderApi = createPaymentProviderApi(apiConfig);
  const shippingApi = createShippingApi(apiConfig);
  const locationApi = createLocationApi(apiConfig);
  const marketApi = createMarketApi(apiConfig);
  const workflowApi = createWorkflowApi(apiConfig);
  const storePaymentProviderApi = {
    list: paymentProviderApi.list,
    stripe: {
      connect: paymentProviderApi.connectStripe,
      refresh: paymentProviderApi.refreshStripe,
      openDashboard: paymentProviderApi.openDashboard,
    },
  };
  const workflowPublicApi = {
    create: workflowApi.createWorkflow,
    update: workflowApi.updateWorkflow,
    delete: workflowApi.deleteWorkflow,
    get: workflowApi.getWorkflow,
    regenerateWebhookUrl: workflowApi.regenerateWorkflowWebhookUrl,
    find: workflowApi.getWorkflows,
    invokeWebhook: workflowApi.invokeWorkflowWebhook,
    getExecutions: workflowApi.getWorkflowExecutions,
    getExecution: workflowApi.getWorkflowExecution,
    listExternalOperations: workflowApi.getWorkflowExternalOperations,
    getExternalOperation: workflowApi.getWorkflowExternalOperation,
    listConnections: workflowApi.getWorkflowConnections,
    getConnectionConnectUrl: workflowApi.getWorkflowConnectionConnectUrl,
    deleteConnection: workflowApi.deleteWorkflowConnection,
  };
  const formsApi = createFormsApi(apiConfig);
  const classificationApi = createClassificationApi(apiConfig);
  const emailTemplateApi = createEmailTemplateApi(apiConfig);
  const analyticsApi = createAnalyticsApi(apiConfig);
  const experimentsApi = createExperimentsApi(apiConfig);

  const sdk = {
    account: {
      delete: accountApi.deleteAccount,
      getMe: accountApi.getMe,
      search: accountApi.searchAccounts,
      updatePlatformRole: accountApi.updatePlatformRole,
      apiToken: {
        list: accountApi.listApiTokens,
        create: accountApi.createApiToken,
        update: accountApi.updateApiToken,
        revoke: accountApi.revokeApiToken,
      },
      session: {
        list: accountApi.listSessions,
        revoke: accountApi.revokeSession,
      },
      auth: authApi,
    },
    store: {
      create: storeApi.createStore,
      update: storeApi.updateStore,
      get: storeApi.getStore,
      find: storeApi.getStores,
      requestDeletion: storeApi.requestDeletion,
      regeneratePublishableKey: storeApi.regeneratePublishableKey,
      subscription: {
        get: storeApi.getSubscription,
        getPlans: storeApi.getSubscriptionPlans,
        select: storeApi.selectSubscription,
        cancel: storeApi.cancelSubscription,
        reactivate: storeApi.reactivateSubscription,
        createPortalSession: storeApi.createPortalSession,
      },
      member: {
        add: storeApi.addMember,
        invite: storeApi.inviteUser,
        find: storeApi.findMembers,
        findOwn: storeApi.findOwnMemberships,
        remove: storeApi.removeMember,
      },
      buildHook: {
        list: storeApi.listBuildHooks,
        create: storeApi.createBuildHook,
        update: storeApi.updateBuildHook,
        delete: storeApi.deleteBuildHook,
      },
      webhook: {
        test: storeApi.testWebhook,
        list: storeApi.listWebhooks,
        create: storeApi.createWebhook,
        update: storeApi.updateWebhook,
        delete: storeApi.deleteWebhook,
      },
      location: locationApi,
      market: marketApi,
      paymentProvider: storePaymentProviderApi,
    },
    media: createMediaApi(apiConfig),
    notification: {
      template: {
        create: emailTemplateApi.createEmailTemplate,
        update: emailTemplateApi.updateEmailTemplate,
        delete: emailTemplateApi.deleteEmailTemplate,
        get: emailTemplateApi.getEmailTemplate,
        find: emailTemplateApi.getEmailTemplates,
        preview: emailTemplateApi.previewEmailTemplate,
      },
      mailbox: mailboxApi,
    },
    platform: platformApi,
    social: socialApi,
    classification: {
      create: classificationApi.createClassification,
      update: classificationApi.updateClassification,
      delete: classificationApi.deleteClassification,
      get: classificationApi.getClassification,
      find: classificationApi.getClassifications,
      getChildren: classificationApi.getClassificationChildren,
    },
    content: {
      collection: {
        create: contentApi.createCollection,
        update: contentApi.updateCollection,
        delete: contentApi.deleteCollection,
        get: contentApi.getCollection,
        find: contentApi.getCollections,
      },
      entry: {
        create: contentApi.createEntry,
        update: contentApi.updateEntry,
        delete: contentApi.deleteEntry,
        get: contentApi.getEntry,
        find: contentApi.getEntries,
        findByIds: contentApi.getEntriesByIds,
      },
    },
    forms: {
      create: formsApi.createForm,
      update: formsApi.updateForm,
      delete: formsApi.deleteForm,
      permanentlyDelete: formsApi.permanentlyDeleteForm,
      get: formsApi.getForm,
      find: formsApi.getForms,
      submit: formsApi.submit,
      getSubmissions: formsApi.getSubmissions,
      getSubmission: formsApi.getSubmission,
      deleteSubmission: formsApi.deleteSubmission,
    },
    eshop: {
      digital: {
        product: {
          create: digitalApi.createProduct,
          update: digitalApi.updateProduct,
          delete: digitalApi.deleteProduct,
          get: digitalApi.getProduct,
          find: digitalApi.findProducts,
        },
        asset: {
          upload: digitalApi.uploadAsset,
          find: digitalApi.findAssets,
          archive: digitalApi.archiveAsset,
        },
      },
      product: {
        create: eshopApi.createProduct,
        update: eshopApi.updateProduct,
        delete: eshopApi.deleteProduct,
        get: eshopApi.getProduct,
        getInventory: eshopApi.getProductInventory,
        find: eshopApi.getProducts,
      },
      order: {
        update: eshopApi.updateOrder,
        cancelProductItem: eshopApi.cancelOrderProductItem,
        cancelBookingItem: eshopApi.cancelBookingItem,
        completeBookingItem: eshopApi.completeBookingItem,
        markBookingItemNoShow: eshopApi.markBookingItemNoShow,
        get: eshopApi.getOrder,
        find: eshopApi.getOrders,
        getQuote: eshopApi.getQuote,
        createRefund: eshopApi.createRefund,
        recordCashOnDeliveryRefund: eshopApi.recordCashOnDeliveryRefund,
        getRefund: eshopApi.getRefund,
        getRefunds: eshopApi.getRefunds,
        getPayment: eshopApi.getPayment,
        markCashOnDeliveryPaid: eshopApi.markCashOnDeliveryPaid,
        getDisputes: eshopApi.getDisputes,
        getDispute: eshopApi.getDispute,
      },
      shipment: {
        getRates: shippingApi.getRates,
        create: shippingApi.createOrderShipment,
        get: shippingApi.getOrderShipment,
        find: shippingApi.findOrderShipments,
        fulfillment: {
          find: shippingApi.findFulfillmentOrders,
          get: shippingApi.getFulfillmentOrder,
        },
        label: {
          retry: shippingApi.retryShippingLabel,
          refund: {
            request: shippingApi.requestShippingLabelRefund,
            retry: shippingApi.retryShippingLabelRefund,
          },
        },
        shippingLabelCharge: {
          get: shippingApi.getShippingLabelCharge,
          retry: shippingApi.retryShippingLabelCharge,
        },
        shippingLabelChargeRefund: {
          get: shippingApi.getShippingLabelChargeRefund,
          retry: shippingApi.retryShippingLabelChargeRefund,
        },
      },
      cart: {
        create: eshopApi.createCart,
        update: eshopApi.updateCart,
        get: eshopApi.getCart,
        find: eshopApi.getCarts,
        addProduct: eshopApi.addCartProduct,
        addBooking: eshopApi.addCartBooking,
        addDigital: eshopApi.addCartDigitalProduct,
        removeItem: eshopApi.removeCartItem,
        clear: eshopApi.clearCart,
        quote: eshopApi.quoteCart,
        checkout: eshopApi.checkoutCart,
      },
      bookingService: {
        create: eshopApi.createBookingService,
        update: eshopApi.updateBookingService,
        delete: eshopApi.deleteBookingService,
        get: eshopApi.getBookingService,
        find: eshopApi.findBookingServices,
        getAvailability: eshopApi.getBookingServiceAvailability,
      },
      bookingResource: {
        create: eshopApi.createBookingResource,
        update: eshopApi.updateBookingResource,
        delete: eshopApi.deleteBookingResource,
        get: eshopApi.getBookingResource,
        find: eshopApi.findBookingResources,
      },
      bookingOffering: {
        create: eshopApi.createBookingOffering,
        update: eshopApi.updateBookingOffering,
        delete: eshopApi.deleteBookingOffering,
        find: eshopApi.findBookingOfferings,
      },
      promoCode: promoCodeApi,
    },
    customer: {
      audienceMemberships: audienceApi.customer,
    },
    customers: {
      create: customersApi.create,
      get: customersApi.get,
      find: customersApi.find,
      update: customersApi.update,
      archive: customersApi.archive,
      import: customersApi.import,
      previewImport: customersApi.previewImport,
      findSessions: customersApi.findSessions,
      revokeSession: customersApi.revokeSession,
      revokeAllSessions: customersApi.revokeAllSessions,
    },
    audiences: {
      create: audienceApi.create,
      find: audienceApi.find,
      get: audienceApi.get,
      patch: audienceApi.patch,
      activate: audienceApi.activate,
      close: audienceApi.close,
      reopen: audienceApi.reopen,
      archive: audienceApi.archive,
      memberships: audienceApi.memberships,
    },
    actions: actionsApi,
    campaign: campaignApi.campaign,
    campaignEnrollment: campaignApi.campaignEnrollment,
    campaignMessage: campaignApi.campaignMessage,
    leadResearch: leadResearchApi,
    workflow: workflowPublicApi,
    support: {
      createChannel: supportApi.channel.create,
      getChannel: supportApi.channel.get,
      findChannels: supportApi.channel.find,
      updateChannel: supportApi.channel.update,
      deleteChannel: supportApi.channel.delete,
      receiveChannelMessage: supportApi.channel.receiveMessage,
      createAgent: supportApi.agent.create,
      getAgent: supportApi.agent.get,
      getAgentDefinition: supportApi.agent.getDefinition,
      findAgents: supportApi.agent.find,
      updateAgent: supportApi.agent.update,
      replaceAgentDefinition: supportApi.agent.replaceDefinition,
      deleteAgent: supportApi.agent.delete,
      findConversations: supportApi.conversation.find,
      getConversation: supportApi.conversation.get,
      getConversationMessage: supportApi.conversation.getMessage,
      sendConversationMessage: supportApi.conversation.sendMessage,
      replyToConversation: supportApi.conversation.reply,
      resolveConversation: supportApi.conversation.resolve,
      assignConversation: supportApi.conversation.assign,
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

    utils: createUtilitySurface(apiConfig),
  };

  return sdk;
}

export interface StorefrontSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorefrontContext {
  locale?: string;
  market?: string;
}

export interface StorefrontOptions extends StorefrontContext {
  apiUrl?: string;
  sessionStorage?: StorefrontSessionStorage;
}

export const DEFAULT_STOREFRONT_API_URL = "https://api.arky.io";
let storefrontScopeSequence = 0;

function defaultStorefrontSessionStorage(): StorefrontSessionStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeStorefrontApiUrl(value: string | undefined): string {
  const input = value?.trim() || DEFAULT_STOREFRONT_API_URL;
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Storefront apiUrl must be a valid HTTP(S) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Storefront apiUrl must use HTTP or HTTPS");
  }
  return input.replace(/\/+$/, "");
}

function validatePublishableKey(publishableKey: string): string {
  if (typeof publishableKey !== "string") {
    throw new Error(
      "A valid Arky publishable key is required (arky_pk_ followed by 43 URL-safe characters)",
    );
  }
  const key = publishableKey.trim();
  if (!/^arky_pk_[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(key)) {
    throw new Error(
      "A valid Arky publishable key is required (arky_pk_ followed by 43 URL-safe characters)",
    );
  }
  return key;
}

function publishableKeyFingerprint(publishableKey: string): string {
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b9;
  for (let index = 0; index < publishableKey.length; index += 1) {
    const code = publishableKey.charCodeAt(index);
    hashA = Math.imul(hashA ^ code, 0x01000193);
    hashB = Math.imul(hashB ^ code, 0x85ebca6b);
  }
  return `${(hashA >>> 0).toString(36)}${(hashB >>> 0).toString(36)}`;
}

function storefrontSessionStorageKey(
  apiUrl: string,
  publishableKey: string,
): string {
  return `arky_customer_session:v1:${encodeURIComponent(apiUrl.toLowerCase())}:${publishableKeyFingerprint(publishableKey)}`;
}

interface StoredCustomerSessionV1 {
  version: 1;
  customer: import("./api/storefront").StorefrontCustomer;
  session: import("./types").CustomerSessionIssued;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIssuedCustomerSession(
  value: unknown,
): value is import("./types").CustomerSessionIssued {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.customer_id !== "string" ||
    value.status !== "active"
  ) {
    return false;
  }
  if (value.type === "visitor") {
    return (
      typeof value.token === "string" &&
      value.token.startsWith("customer_visitor_") &&
      typeof value.expires_at === "number"
    );
  }
  return (
    value.type === "email_authenticated" &&
    typeof value.identity_id === "string" &&
    typeof value.access_token === "string" &&
    value.access_token.startsWith("customer_access_") &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.startsWith("customer_refresh_") &&
    typeof value.access_expires_at === "number" &&
    typeof value.refresh_expires_at === "number" &&
    typeof value.authenticated_at === "number"
  );
}

function parseStoredCustomerSession(
  value: string | null,
): CustomerSessionInternal | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      !isRecord(parsed.customer) ||
      !isIssuedCustomerSession(parsed.session)
    ) {
      return null;
    }
    return {
      customer:
        parsed.customer as unknown as import("./api/storefront").StorefrontCustomer,
      session: parsed.session,
    };
  } catch {
    return null;
  }
}

function createStorefrontClientCore(
  publishableKeyInput: string,
  options: StorefrontOptions = {},
  isolatedSession = false,
) {
  const publishableKey = validatePublishableKey(publishableKeyInput);
  const apiUrl = normalizeStorefrontApiUrl(options.apiUrl);
  let locale = options.locale?.trim() || "";
  let market = options.market?.trim() || "";
  const listeners = new Set<AuthStateListener<StorefrontCustomerSession>>();
  let identifyPromise: Promise<StorefrontIdentifyResult> | null = null;
  let identityTail: Promise<void> = Promise.resolve();
  let setupPromise: Promise<import("./api/storefront").StorefrontSetup> | null =
    null;
  let setupValue: import("./api/storefront").StorefrontSetup | null = null;
  const explicitSessionStorage = options.sessionStorage;
  const sessionStorage = isolatedSession
    ? explicitSessionStorage || null
    : explicitSessionStorage || defaultStorefrontSessionStorage();
  const canCreateVisitorSession =
    typeof window !== "undefined" || Boolean(explicitSessionStorage);
  const storageSuffix = isolatedSession
    ? `:scope:${++storefrontScopeSequence}`
    : "";
  const storageKey = `${storefrontSessionStorageKey(apiUrl, publishableKey)}${
    storageSuffix
  }`;
  let memorySession: CustomerSessionInternal | null = null;

  if (sessionStorage) {
    try {
      const stored = sessionStorage.getItem(storageKey);
      memorySession = parseStoredCustomerSession(stored);
      if (stored && !memorySession) sessionStorage.removeItem(storageKey);
    } catch {}
  }

  function authorizationToken(
    session: CustomerSessionInternal | null = memorySession,
  ): string | null {
    if (!session || session.session.status !== "active") return null;
    return session.session.type === "visitor"
      ? session.session.token
      : session.session.access_token;
  }

  function writeCustomerSession(session: CustomerSessionInternal | null): void {
    memorySession = session;
    if (!sessionStorage) return;
    try {
      if (session) {
        const stored: StoredCustomerSessionV1 = {
          version: 1,
          customer: session.customer,
          session: session.session,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(stored));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {}
  }

  function toPublic(
    value: CustomerSessionInternal | null,
  ): StorefrontCustomerSession | null {
    return value
      ? {
          customer: value.customer,
          id: value.session.id,
          type: value.session.type,
          status: value.session.status,
        }
      : null;
  }

  function emit(): void {
    const pub = toPublic(memorySession);
    for (const l of listeners) {
      Promise.resolve()
        .then(() => l(pub))
        .catch(() => {});
    }
  }

  const updateSession: CustomerSessionUpdater = (updater) => {
    const next = updater(memorySession);
    writeCustomerSession(next);
    emit();
  };

  const authStorage: AuthStorage = {
    getTokens() {
      if (!memorySession || memorySession.session.status !== "active")
        return null;
      const issued = memorySession.session;
      return issued.type === "visitor"
        ? { access_token: issued.token }
        : {
            access_token: issued.access_token,
            refresh_token: issued.refresh_token,
          };
    },
    onTokensRefreshed() {},
    onForcedLogout() {
      identifyPromise = null;
      updateSession(() => null);
    },
  };

  let recoverUnauthorized: (
    authorizationToken: string | null,
    path: string,
  ) => Promise<boolean> = async () => false;
  let visitorRecoveryPromise: Promise<void> | null = null;

  const storefrontHeaders = () => ({
    "X-Arky-Publishable-Key": publishableKey,
    ...(locale ? { "X-Arky-Locale": locale } : {}),
    ...(market ? { "X-Arky-Market": market } : {}),
  });
  const httpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage,
    storefrontMode: true,
    forcedHeaders: storefrontHeaders,
    onUnauthorized: ({ authorizationToken, path }) =>
      recoverUnauthorized(authorizationToken, path),
  });
  const publishableKeyHttpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage: {
      getTokens: () => null,
      onTokensRefreshed: () => {},
      onForcedLogout: () => {},
    },
    storefrontMode: true,
    forcedHeaders: storefrontHeaders,
    onUnauthorized: () => false,
  });

  const apiConfig: StorefrontApiConfig = {
    httpClient,
    publishableKeyHttpClient,
    apiUrl,
    publishableKey,
    market,
    locale,
    authStorage,
  };

  function requireVisitorSessionCapability(): void {
    if (!canCreateVisitorSession) {
      throw new Error(
        "Stateful storefront operations during SSR require an explicit request-local sessionStorage adapter",
      );
    }
  }

  async function getSetup(
    requestOptions?: import("./types/api").RequestOptions,
  ): Promise<import("./api/storefront").StorefrontSetup> {
    if (setupValue) return setupValue;
    if (setupPromise) return setupPromise;
    setupPromise = httpClient
      .get<import("./api/storefront").StorefrontSetup>(
        "/v1/storefront",
        requestOptions,
      )
      .then((setup) => {
        setupValue = setup;
        return setup;
      })
      .finally(() => {
        setupPromise = null;
      });
    return setupPromise;
  }

  async function ensureVisitorSession(): Promise<void> {
    if (authorizationToken()) return;
    requireVisitorSessionCapability();
    await identify();
  }

  const storefrontApi = createStorefrontApi(apiConfig, updateSession, {
    ensureVisitorSession,
    getSetup,
  });
  const customerApi = storefrontApi.customer;

  function identify(params?: {
    email?: string;
    market?: string;
  }): Promise<StorefrontIdentifyResult> {
    requireVisitorSessionCapability();
    if (params?.market !== undefined) setMarket(params.market);

    const isBareCall = !params?.email;
    if (isBareCall && identifyPromise) return identifyPromise;

    const run = async (): Promise<StorefrontIdentifyResult> => {
      return customerApi.identify({ email: params?.email });
    };

    const promise = identityTail.then(run);
    identityTail = promise.then(
      () => undefined,
      () => undefined,
    );

    if (isBareCall) {
      identifyPromise = promise;
      void promise.then(
        () => {
          if (identifyPromise === promise) identifyPromise = null;
        },
        () => {
          if (identifyPromise === promise) identifyPromise = null;
        },
      );
    }

    return promise;
  }

  async function requestCode(params: {
    email: string;
    market?: string;
  }): Promise<StorefrontRequestCodeResult> {
    requireVisitorSessionCapability();
    if (params.market !== undefined) setMarket(params.market);
    await ensureVisitorSession();
    const result = await customerApi.requestCode({ email: params.email });
    identifyPromise = null;
    return result;
  }

  async function verify(params: {
    code: string;
  }): Promise<StorefrontVerifyResult> {
    requireVisitorSessionCapability();
    await ensureVisitorSession();
    const result = await customerApi.verify({ code: params.code });
    identifyPromise = null;
    return result;
  }

  async function refresh(): Promise<StorefrontRefreshResult> {
    requireVisitorSessionCapability();
    const result = await customerApi.refresh();
    identifyPromise = null;
    return result;
  }

  async function me(): Promise<import("./api/storefront").CustomerMeResponse> {
    await ensureVisitorSession();
    const result = await customerApi.getMe();
    updateSession((previous) =>
      previous ? { ...previous, customer: result.customer } : previous,
    );
    return result;
  }

  async function logout(): Promise<void> {
    identifyPromise = null;
    if (!authorizationToken()) {
      updateSession(() => null);
      return;
    }
    try {
      await customerApi.logout();
    } catch {
      updateSession(() => null);
    }
  }

  function setMarket(value: string): void {
    market = value.trim();
    apiConfig.market = market;
    identifyPromise = null;
  }

  function setLocale(value: string): void {
    locale = value.trim();
    apiConfig.locale = locale;
  }

  function setContext(context: StorefrontContext): void {
    if (context.locale !== undefined) setLocale(context.locale);
    if (context.market !== undefined) setMarket(context.market);
  }

  recoverUnauthorized = async (
    failedAuthorizationToken: string | null,
    path: string,
  ) => {
    if (!failedAuthorizationToken) return false;
    const currentToken = authorizationToken();
    if (currentToken !== failedAuthorizationToken) {
      if (currentToken) return true;
      if (!visitorRecoveryPromise) return false;
      await visitorRecoveryPromise;
      return Boolean(authorizationToken());
    }
    if (/\/customer\/refresh$/.test(path)) {
      updateSession(() => null);
      return false;
    }
    if (memorySession?.session.type === "email_authenticated") {
      try {
        await refresh();
        return true;
      } catch {
        updateSession(() => null);
        return false;
      }
    }
    updateSession(() => null);
    if (/\/customer\/identify$/.test(path)) return true;
    const recovery = ensureVisitorSession();
    const trackedRecovery = recovery.finally(() => {
      if (visitorRecoveryPromise === trackedRecovery) {
        visitorRecoveryPromise = null;
      }
    });
    visitorRecoveryPromise = trackedRecovery;
    await trackedRecovery;
    return true;
  };

  return {
    get session(): StorefrontCustomerSession | null {
      return toPublic(memorySession);
    },

    get hasSession(): boolean {
      return Boolean(authorizationToken());
    },

    get isAuthenticated(): boolean {
      return (
        memorySession?.session.status === "active" &&
        memorySession.session.type === "email_authenticated"
      );
    },

    onAuthStateChanged(
      listener: AuthStateListener<StorefrontCustomerSession>,
    ): () => void {
      listeners.add(listener);
      const current = toPublic(memorySession);
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
    classification: storefrontApi.classification,
    media: storefrontApi.media,
    content: storefrontApi.content,
    forms: storefrontApi.forms,
    eshop: storefrontApi.eshop,
    customer: {
      identify,
      requestCode,
      verify,
      refresh,
      logout,
      getMe: me,
    },
    audiences: storefrontApi.audiences,
    actions: storefrontApi.actions,
    experiments: storefrontApi.experiments,
    support: createStorefrontSupportApi(apiConfig, ensureVisitorSession),
    getSetup,
    setContext,
    setMarket,
    getMarket: () => market,
    setLocale,
    getLocale: () => locale,
    utils: createUtilitySurface(apiConfig),
  };
}

type StorefrontClientCore = ReturnType<typeof createStorefrontClientCore>;

export type StorefrontClient = StorefrontClientCore & {
  withContext(context: StorefrontContext): StorefrontClient;
};

function createStorefrontClient(
  publishableKey: string,
  options: StorefrontOptions = {},
  isolatedSession = false,
): StorefrontClient {
  const client = createStorefrontClientCore(
    publishableKey,
    options,
    isolatedSession,
  );
  return Object.assign(client, {
    withContext(context: StorefrontContext): StorefrontClient {
      return createStorefrontClient(
        publishableKey,
        {
          ...options,
          locale: context.locale ?? client.getLocale(),
          market: context.market ?? client.getMarket(),
        },
        true,
      );
    },
  });
}

export function createStorefront(
  publishableKey: string,
  options: StorefrontOptions = {},
): StorefrontClient {
  return createStorefrontClient(publishableKey, options);
}

export type { HttpClientConfig } from "./services/createHttpClient";
export {
  buildFormFields,
  createFormEntry,
  createFormEntryFromValues,
  initialize,
} from "./storefrontStore";
export type {
  ArkyBookingServiceStore,
  ArkyCartStore,
  ArkyStore,
  ArkyStoreConfig,
  ArkyStoreContext,
} from "./storefrontStore";
