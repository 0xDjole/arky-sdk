export { ScheduledResultTimeoutError } from "./utils/scheduledResult";
export { createStripeEmbeddedCheckout, mountCheckoutAction } from "./checkout";
export { selectLocalizedObjectText } from "./utils/blocks";
export type {
  EmbeddedCheckoutCallbacks,
  EmbeddedCheckoutMount,
  StripeEmbeddedCheckoutAction,
} from "./checkout";
export type { ScheduledMutationOptions } from "./services/createHttpClient";

export type {
  EshopCartItem,
  CartProduct,
  CartBooking,
  CartDigitalProduct,
  Cart,
  CartOrigin,
  CartStatus,
  EshopStoreState,
  Store,
  StoreStatus,
  StoreUsage,
  UsagePeriod,
  Webhook,
  WebhookStatus,
  WebhookEventSubscription,
  BuildHook,
  BuildHookStatus,
  SocialConnectResponse,
  SocialDestinationMetadata,
  SocialOAuthCallbackResponse,
  SocialOAuthCallbackStatus,
  SocialOAuthDestinationOption,
  SocialConnection,
  SocialConnectionCredential,
  SocialConnectionData,
  SocialConnectionProviderData,
  SocialProviderCapability,
  SocialConnectionType,
  InstagramPlacement,
  SocialAnalyticsCapabilities,
  SocialEngagementCapabilities,
  SocialPublication,
  SocialPublicationComment,
  SocialPublicationCommentClassificationResult,
  SocialCommentClassificationRunStatus,
  SocialPublicationCommentIntent,
  SocialPublicationCommentPriority,
  SocialPublicationEngagementSyncResult,
  SocialCommentReply,
  SocialCommentReplyError,
  SocialCommentReplyEvidence,
  SocialCommentReplyStatus,
  SocialPublicationCommentReplyResponse,
  SocialPublicationCommentStatus,
  SocialPublicationContent,
  SocialPublicationEffect,
  SocialPublicationEffectError,
  SocialPublicationEffectEvidence,
  SocialPublicationEffectRequest,
  SocialPublicationEffectStatus,
  SocialPublicationMetricSnapshot,
  SocialPublicationMutationResponse,
  SocialPublicationStatus,
  SocialPublicationValidation,
  TiktokPrivacy,
  ValidationError,
  YoutubePrivacy,
  Block,
  BlockBase,
  TextBlockProperties,
  MarkdownBlockProperties,
  NumberBlockProperties,
  ContainerBlockProperties,
  ReferenceDeletePolicy,
  MediaBlockProperties,
  EntryBlockProperties,
  ResourceBlockProperties,
  TextBlock,
  MarkdownBlock,
  NumberBlock,
  BooleanBlock,
  DateBlock,
  MediaBlock,
  EntryBlock,
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
  OrderTaxSnapshot,
  OrderTaxLine,
  OrderTaxScope,
  TaxMode,
  OrderPromoCodeSnapshot,
  OrderRefund,
  OrderRefundProvider,
  RefundAllocation,
  RefundStatus,
  RefundReason,
  RefundRequestReason,
  OrderDigitalProduct,
  OrderDigitalProductSnapshot,
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
  OrderCheckoutResult,
  StoreSubscription,
  StorePlanAccess,
  StoreSubscriptionStatus,
  SubscriptionPlan,
  SubscriptionPlanFeature,
  SubscriptionPlanFeatureType,
  SubscriptionPrice,
  AudiencePayment,
  AudienceDispute,
  AudiencePaymentSafeError,
  AudiencePaymentStatus,
  AudiencePaymentType,
  AudiencePromotionSnapshot,
  AudienceRefund,
  AudienceRefundSafeError,
  AudienceRefundStatus,
  AudienceRefundType,
  StorefrontAudience,
  StorefrontAudienceType,
  StorefrontAudienceTier,
  StorefrontAudiencePrice,
  StorefrontAudienceMember,
  StorefrontAudiencePaymentSummary,
  AudienceMemberAccess,
  AudienceMemberAccessSource,
  StorefrontAudienceMemberState,
  StorefrontAudienceSubscription,
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
  MediaSize,
  MediaResolution,
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
  WorkflowTrigger,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTriggerNode,
  WorkflowHttpNode,
  WorkflowDeployWebhookNode,
  WorkflowGoogleDriveUploadNode,
  WorkflowConnection,
  WorkflowConnectionConnectUrl,
  WorkflowConnectionData,
  WorkflowConnectionType,
  GoogleDriveWorkflowConnectionData,
  GoogleDriveWorkflowProfile,
  WorkflowSwitchNode,
  WorkflowSwitchRule,
  WorkflowTransformNode,
  WorkflowLoopNode,
  WorkflowHttpMethod,
  WorkflowExecution,
  WorkflowExecutionDefinition,
  WorkflowExecutionInputCapture,
  WorkflowExecutionResults,
  WorkflowExternalOperation,
  WorkflowExternalOperationResult,
  WorkflowExternalOperationError,
  WorkflowExternalOperationStatus,
  WorkflowExternalOperationType,
  WorkflowExecutionInput,
  ExecutionStatus,
  NodeResult,
  AudienceType,
  Audience,
  AudienceDigitalProduct,
  AudienceMember,
  AudienceMemberStatus,
  AudienceDeliveryStatus,
  AudienceTier,
  AudiencePrice,
  AudiencePriceStatus,
  AudienceTierStatus,
  AudienceLead,
  AudienceSubscription,
  AudienceSubscriptionStatus,
  AudienceAccessResponse,
  AudienceManagementAudience,
  AudienceManagementType,
  AudienceManagementMember,
  AudienceManagementResponse,
  AudiencePaymentMethodSessionResponse,
  AudienceSubscribeResponse,
  RemoveAudienceMemberResult,
  Event,
  EventAction,
  OrderShipmentStatus,
  ShippingRateLine,
  ShippingLine,
  FulfillmentOrderStatus,
  FulfillmentOrderLine,
  FulfillmentOrder,
  OrderFulfillmentSummary,
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
  OrderProduct,
  OrderBookingItem,
  OrderProductSnapshot,
  OrderBookingSnapshot,
  DiscountAllocation,
  TaxLine,
  LineMoneySnapshot,
  OrderProductFulfillmentStatus,
  OrderProductStatus,
  OrderBookingStatus,
  ProductQuoteLine,
  BookingQuoteLine,
  BookingQuoteLineAvailability,
  OrderStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  OrderCancellationReason,
  Product,
  ProductVariant,
  ProductInventory,
  GalleryItem,
  EmailTemplate,
  EmailTemplateType,
  EmailRecipients,
  EmailSend,
  EmailSendRequest,
  EmailSendResult,
  EmailSendDeliveryResult,
  EmailDelivery,
  EmailDeliveryError,
  EmailDeliveryErrorKind,
  EmailDeliveryStatus,
  EmailDeliveryType,
  GetEmailDeliveryParams,
  RetryEmailDeliveryParams,
  EmailSendTemplateData,
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
  PromotionDiscount,
  PromotionCondition,
  PromoCode,
  Contact,
  ContactSessionRecord,
  ContactSessionIssued,
  ContactSessionStatus,
  ContactChannel,
  ChannelType,
  OpportunityStage,
  OpportunityType,
  OpportunitySource,
  Action,
  ActionData,
  ActionContext,
  Mailbox,
  MailboxConnectionSecurity,
  MailboxPreset,
  MailboxSyncStatus,
  MailboxSyncIssue,
  MailboxSyncIssueType,
  GoogleMailboxProvider,
  SmtpImapMailboxProviderInput,
  SmtpImapMailboxProvider,
  OutreachStep,
  OutreachStepType,
  ManualTaskContinueBehavior,
  CampaignManualTaskOutcome,
  OutreachPersonalizationCounters,
  CampaignPersonalization,
  CampaignLaunchState,
  Campaign,
  CampaignLaunchReadiness,
  CampaignEnrollment,
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
  ResearchAudienceMember,
  SendLeadResearchMessageResult,
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
  ContactStatus,
  AudienceStatus,
  AudienceSource,
  AudienceMemberSource,
  MailboxStatus,
  CampaignStatus,
  CampaignLaunchStatus,
  CampaignEnrollmentStatus,
  CampaignEnrollmentImportSource,
  CampaignMessageCopySource,
  CampaignMessageDirection,
  CampaignMessageType,
  CampaignMessageStatus,
  CampaignEmailContent,
  CampaignChannelTarget,
  CampaignManualTaskContent,
  CampaignMessageContent,
  OutreachPersonalizationStatus,
  OutreachThreadMode,
  SuppressionStatus,
  SuppressionTarget,
  SuppressionScope,
  SuppressionReason,
  SuppressionSource,
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
  FindContactSessionsParams,
  RevokeAllContactSessionsParams,
  RevokeContactSessionParams,
  GetAvailabilityParams,
  AvailabilitySlot,
  DaySlots,
  BookingResourceAvailability,
  AvailabilityResponse,
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
  CartProductInput,
  CartBookingInput,
  CartDigitalProductInput,
  DigitalProductQuoteInput,
  TrustedCartProductInput,
  TrustedCartBookingInput,
  TrustedCartDigitalProductInput,
  CreateOrderRefundParams,
  RecordCashOnDeliveryRefundParams,
  CancelOrderProductParams,
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
  UpdateAudienceParams,
  FindAudiencesParams,
  GetAudienceParams,
  GetStorefrontAudienceParams,
  CreateAudienceTierParams,
  UpdateAudienceTierParams,
  AudienceTierPriceInput,
  FindAudienceTiersParams,
  FindStorefrontAudienceTiersParams,
  GetAudienceTierParams,
  AddAudienceMemberParams,
  UpdateAudienceMemberParams,
  RemoveAudienceMemberParams,
  FindAudienceMembersParams,
  FindAudienceLeadsParams,
  RefundAudienceMemberParams,
  RefundAudienceMemberResult,
  FindAudiencePaymentsParams,
  FindStorefrontAudienceMembersParams,
  GetAudiencePaymentParams,
  FindAudienceDisputesParams,
  GetAudienceDisputeParams,
  FindAudienceRefundsParams,
  GetAudienceRefundParams,
  RetryAudienceRefundParams,
  GetAudienceSubscriptionParams,
  ImportContactRowInput,
  ImportContactRowError,
  ImportContactRowResult,
  ImportAudienceMemberRowResult,
  PreviewAudienceMemberImportParams,
  ImportAudienceMembersParams,
  ImportAudienceMembersResult,
  SubscribeAudienceParams,
  GetStorefrontAudiencePaymentParams,
  AudienceAccessParams,
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
  ConnectSocialConnectionParams,
  CreateSocialCommentReplyParams,
  CreateSocialPublicationParams,
  DeletePaymentProviderParams,
  DeleteSocialConnectionParams,
  FindSocialPublicationCommentsParams,
  FindSocialPublicationsParams,
  GetSocialCommentClassificationRunParams,
  GetSocialCapabilitiesParams,
  OpenStripeDashboardParams,
  GetSocialOAuthAttemptParams,
  GetSocialCommentReplyParams,
  GetSocialPublicationCommentThreadParams,
  GetSocialPublicationCommentsParams,
  GetSocialPublicationEffectParams,
  GetSocialPublicationMetricsParams,
  GetSocialPublicationParams,
  ListPaymentProvidersParams,
  ListSocialCommentRepliesParams,
  ListSocialConnectionsParams,
  ListSocialPublicationEffectsParams,
  RefreshStripePaymentProviderParams,
  RetrySocialCommentReplyParams,
  ScheduleSocialPublicationParams,
  SyncSocialEngagementParams,
  SyncSocialPublicationCommentsParams,
  SyncSocialPublicationCommentThreadParams,
  SyncSocialPublicationMetricsParams,
  UpdateSocialPublicationParams,
  ValidateSocialPublicationParams,
  ManageAudienceParams,
  CreateAudiencePaymentMethodSessionParams,
  UnsubscribeAudienceParams,
  ConfirmAudienceParams,
  AuthToken,
  PendingAccountSession,
  RefreshAccountSessionParams,
  RequestPendingAccountSessionParams,
  VerifyPendingAccountSessionParams,
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
  AnalyticsRateData,
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
  AnalyticsReportScope,
  AnalyticsBlockResponse,
  AnalyticsResponse,
  ActionFeedCategory,
  ActionFeedItem,
  ActionFeedSummary,
  ActionFeedCursor,
  ActionFeedData,
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
  GetWorkflowTriggerParams,
  InvokeWorkflowTriggerParams,
} from "./types/api";

export type {
  StorefrontAction,
  TrackActionParams,
  CommonActionKey,
  ExperimentUseResponse,
  StorefrontContact,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontDto,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontPaymentProvider,
  StorefrontSetup,
  StorefrontZone,
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

export type { TimelineParams } from "./api/crm";
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

export const SDK_VERSION = "0.25.0";
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

export interface ContactSession {
  contact: import("./api/storefront").StorefrontContact;
}

export interface StorefrontIdentifyResult {
  contact: import("./api/storefront").StorefrontContact;
  verification_challenge:
    import("./types/api").VerificationChallengeResponse | null;
}

export interface StorefrontVerifyResult {
  contact: import("./api/storefront").StorefrontContact;
}

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
import { createNotificationApi } from "./api/notification";
import { createPromoCodeApi } from "./api/promoCode";
import { createCmsApi } from "./api/cms";
import { createEshopApi } from "./api/eshop";
import { createDigitalApi } from "./api/digital";
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
import { createPaymentProviderApi } from "./api/paymentProvider";
import { createEmailTemplateApi } from "./api/emailTemplate";
import { createFormApi } from "./api/form";
import { createClassificationApi } from "./api/classification";
import { createAnalyticsApi } from "./api/analytics";
import { createExperimentsApi } from "./api/experiments";
import {
  createStorefrontApi,
  type ContactSessionInternal,
  type ContactSessionUpdater,
} from "./api/storefront";
export type {
  ContactSessionInternal,
  ContactSessionUpdater,
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

  const cmsApi = createCmsApi(apiConfig);
  const eshopApi = createEshopApi(apiConfig);
  const digitalApi = createDigitalApi(apiConfig);
  const promoCodeApi = createPromoCodeApi(apiConfig);
  const crmApi = createContactApi(apiConfig);
  const supportApi = createAdminSupportApi(apiConfig);
  const leadResearchApi = createLeadResearchApi(apiConfig);
  const socialApi = createSocialApi(apiConfig);
  const paymentProviderApi = createPaymentProviderApi(apiConfig);
  const notificationApi = createNotificationApi(apiConfig);
  const shippingApi = createShippingApi(apiConfig);
  const locationApi = createLocationApi(apiConfig);
  const marketApi = createMarketApi(apiConfig);
  const workflowApi = createWorkflowApi(apiConfig);
  const storePaymentProviderApi = {
    list: paymentProviderApi.list,
    delete: paymentProviderApi.delete,
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
    getDefinition: workflowApi.getWorkflowDefinition,
    getTrigger: workflowApi.getWorkflowTrigger,
    rotateTrigger: workflowApi.rotateWorkflowTrigger,
    replaceDefinition: workflowApi.replaceWorkflowDefinition,
    find: workflowApi.getWorkflows,
    trigger: workflowApi.triggerWorkflow,
    invokeTrigger: workflowApi.invokeWorkflowTrigger,
    getExecutions: workflowApi.getWorkflowExecutions,
    getExecution: workflowApi.getWorkflowExecution,
    getExecutionDefinition: workflowApi.getWorkflowExecutionDefinition,
    getExecutionInput: workflowApi.getWorkflowExecutionInput,
    getExecutionResults: workflowApi.getWorkflowExecutionResults,
    listExternalOperations: workflowApi.getWorkflowExternalOperations,
    getExternalOperation: workflowApi.getWorkflowExternalOperation,
    listConnections: workflowApi.getWorkflowConnections,
    getConnectionConnectUrl: workflowApi.getWorkflowConnectionConnectUrl,
    deleteConnection: workflowApi.deleteWorkflowConnection,
  };
  const formApi = createFormApi(apiConfig);
  const classificationApi = createClassificationApi(apiConfig);
  const emailTemplateApi = createEmailTemplateApi(apiConfig);
  const analyticsApi = createAnalyticsApi(apiConfig);
  const experimentsApi = createExperimentsApi(apiConfig);

  const sdk = {
    account: {
      delete: accountApi.deleteAccount,
      getMe: accountApi.getMe,
      search: accountApi.searchAccounts,
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
      email: {
        send: notificationApi.sendEmail,
        getDelivery: notificationApi.getEmailDelivery,
        retryDelivery: notificationApi.retryEmailDelivery,
      },
      mailbox: crmApi.mailbox,
    },
    platform: platformApi,
    social: {
      connection: {
        getCapabilities: socialApi.getCapabilities,
        list: socialApi.listConnections,
        connect: socialApi.connect,
        getOAuthAttempt: socialApi.getOAuthAttempt,
        selectDestination: socialApi.selectDestination,
        delete: socialApi.deleteConnection,
      },
      publication: {
        create: socialApi.createPublication,
        update: socialApi.updatePublication,
        get: socialApi.getPublication,
        find: socialApi.findPublications,
        validate: socialApi.validatePublication,
        schedule: socialApi.schedulePublication,
        cancel: socialApi.cancelPublication,
        getComments: socialApi.getPublicationComments,
        syncComments: socialApi.syncPublicationComments,
        getCommentThread: socialApi.getPublicationCommentThread,
        syncCommentThread: socialApi.syncPublicationCommentThread,
        findComments: socialApi.findPublicationComments,
        classifyComments: socialApi.classifyPublicationComments,
        getCommentClassificationRun: socialApi.getCommentClassificationRun,
        commentReply: {
          create: socialApi.createCommentReply,
          list: socialApi.listCommentReplies,
          get: socialApi.getCommentReply,
          retry: socialApi.retryCommentReply,
        },
        effect: {
          list: socialApi.listPublicationEffects,
          get: socialApi.getPublicationEffect,
        },
        getMetrics: socialApi.getPublicationMetrics,
        syncMetrics: socialApi.syncPublicationMetrics,
        syncEngagement: socialApi.syncEngagement,
      },
    },
    classification: {
      create: classificationApi.createClassification,
      update: classificationApi.updateClassification,
      delete: classificationApi.deleteClassification,
      get: classificationApi.getClassification,
      find: classificationApi.getClassifications,
      getChildren: classificationApi.getClassificationChildren,
    },
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
        findByIds: cmsApi.getEntriesByIds,
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
        cancelProduct: eshopApi.cancelOrderProduct,
        get: eshopApi.getOrder,
        getProducts: eshopApi.getOrderProducts,
        getDigitalProducts: eshopApi.getOrderDigitalProducts,
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
      audience: crmApi.audience.customer,
    },
    crm: {
      contact: {
        create: crmApi.create,
        get: crmApi.get,
        getChannels: crmApi.getChannels,
        findChannels: crmApi.findChannels,
        find: crmApi.find,
        update: crmApi.update,
        merge: crmApi.merge,
        import: crmApi.import,
        findSessions: crmApi.findSessions,
        revokeSession: crmApi.revokeSession,
        revokeAllSessions: crmApi.revokeAllSessions,
      },
      audience: {
        create: crmApi.audience.create,
        update: crmApi.audience.update,
        get: crmApi.audience.get,
        find: crmApi.audience.find,
        importMembers: crmApi.audience.importMembers,
        previewMemberImport: crmApi.audience.previewMemberImport,
        tiers: crmApi.audience.tiers,
        leads: crmApi.audience.leads,
        members: {
          add: crmApi.audience.members.add,
          update: crmApi.audience.members.update,
          remove: crmApi.audience.members.remove,
          find: crmApi.audience.members.find,
          refund: crmApi.audience.members.refund,
          payments: crmApi.audience.members.payments,
          disputes: crmApi.audience.members.disputes,
          refunds: crmApi.audience.members.refunds,
          subscription: crmApi.audience.members.subscription,
        },
      },
      action: crmApi.action,
    },
    outreach: {
      campaign: crmApi.campaign,
      campaignEnrollment: crmApi.campaignEnrollment,
      campaignMessage: crmApi.campaignMessage,
      suppression: crmApi.suppression,
      leadResearch: leadResearchApi,
    },
    automation: {
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
  return `arky_visitor_session:${encodeURIComponent(apiUrl.toLowerCase())}:${publishableKeyFingerprint(publishableKey)}`;
}

function isVisitorSessionToken(value: string | null): value is string {
  return Boolean(value && /^arky_vst_[0-9a-f]{64}$/.test(value));
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
  const listeners = new Set<AuthStateListener<ContactSession>>();
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
  const storageKey = `${storefrontSessionStorageKey(apiUrl, publishableKey)}${
    isolatedSession ? `:scope:${++storefrontScopeSequence}` : ""
  }`;
  let memorySession: ContactSessionInternal | null = null;
  let memorySessionToken: string | null = null;

  function readSessionToken(): string | null {
    if (!sessionStorage) return memorySessionToken;
    try {
      const stored = sessionStorage.getItem(storageKey);
      return isVisitorSessionToken(stored) ? stored : memorySessionToken;
    } catch {
      return memorySessionToken;
    }
  }

  function writeContactSession(session: ContactSessionInternal | null): void {
    memorySession = session;
    memorySessionToken = session?.sessionToken || null;
    if (!sessionStorage) return;
    try {
      if (session) {
        sessionStorage.setItem(storageKey, session.sessionToken);
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {}
  }

  function toPublic(s: ContactSessionInternal | null): ContactSession | null {
    return s ? { contact: s.contact } : null;
  }

  function emit(): void {
    const pub = toPublic(memorySession);
    for (const l of listeners) {
      Promise.resolve()
        .then(() => l(pub))
        .catch(() => {});
    }
  }

  const updateSession: ContactSessionUpdater = (updater) => {
    const next = updater(memorySession);
    writeContactSession(next);
    emit();
  };

  const authStorage: AuthStorage = {
    getTokens() {
      const sessionToken = readSessionToken();
      return sessionToken ? { access_token: sessionToken } : null;
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

  const httpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage,
    storefrontMode: true,
    forcedHeaders: () => ({
      "X-Arky-Publishable-Key": publishableKey,
      ...(locale ? { "X-Arky-Locale": locale } : {}),
      ...(market ? { "X-Arky-Market": market } : {}),
    }),
    onUnauthorized: ({ authorizationToken, path }) =>
      recoverUnauthorized(authorizationToken, path),
  });

  const apiConfig: StorefrontApiConfig = {
    httpClient,
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
    if (readSessionToken()) return;
    requireVisitorSessionCapability();
    await identify();
  }

  const storefrontApi = createStorefrontApi(apiConfig, updateSession, {
    ensureVisitorSession,
    getSetup,
  });
  const contactApi = storefrontApi.crm.contact;

  function identify(params?: {
    email?: string;
    verify?: boolean;
    market?: string;
  }): Promise<StorefrontIdentifyResult> {
    requireVisitorSessionCapability();
    if (params?.market !== undefined) setMarket(params.market);

    const isBareCall = !params?.email && !params?.verify;
    if (isBareCall && identifyPromise) return identifyPromise;

    const run = async (): Promise<StorefrontIdentifyResult> => {
      const result = await (params?.verify
        ? contactApi.requestCode({ email: params.email })
        : contactApi.identify({ email: params?.email }));
      return {
        contact: result.contact,
        verification_challenge: result.verification_challenge,
      };
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

  async function verify(params: {
    challenge_id: string;
    code: string;
  }): Promise<StorefrontVerifyResult> {
    requireVisitorSessionCapability();
    const result = await contactApi.verify(params);
    identifyPromise = null;
    return { contact: result.contact };
  }

  async function me(): Promise<import("./api/storefront").StorefrontContact> {
    await ensureVisitorSession();
    return contactApi.getMe();
  }

  async function logout(): Promise<void> {
    identifyPromise = null;
    if (!readSessionToken()) {
      updateSession(() => null);
      return;
    }
    try {
      await contactApi.logout();
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
    authorizationToken: string | null,
    path: string,
  ) => {
    if (!authorizationToken) return false;
    const currentToken = readSessionToken();
    if (currentToken !== authorizationToken) {
      if (currentToken) return true;
      if (!visitorRecoveryPromise) return false;
      await visitorRecoveryPromise;
      return Boolean(readSessionToken());
    }
    updateSession(() => null);
    if (/\/account\/(identify|code)$/.test(path)) return true;
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
    identify,
    verify,
    logout,
    me,

    get session(): ContactSession | null {
      return toPublic(memorySession);
    },

    get isAuthenticated(): boolean {
      return Boolean(readSessionToken());
    },

    onAuthStateChanged(
      listener: AuthStateListener<ContactSession>,
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
    cms: storefrontApi.cms,
    eshop: storefrontApi.eshop,
    crm: {
      ...storefrontApi.crm,
      contact: {
        identify: (params?: { email?: string }) => identify(params),
        requestCode: (params?: { email?: string }) =>
          identify({ ...params, verify: true }),
        verify,
        logout,
        getMe: me,
      },
    },
    action: storefrontApi.action,
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
