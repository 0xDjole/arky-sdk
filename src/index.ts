import { createAdminSessionState } from "./services/adminSession";
export type { AdminLogoutResult } from "./services/adminSession";
export type * from "./types/storeCustomerWorkspace";
export { ScheduledResultTimeoutError } from "./utils/scheduledResult";
export { MonriCheckoutError } from "./types/monriCheckout";
export type { MonriComponentsAction, MonriBuyerDetails } from "./types/monriCheckout";
export { isValidKey, validateKey, toKey, nameToKey } from "./utils/keyValidation";
export { CartPresentationChangedError } from "./types/cartCheckout";
export { CartSelectionError } from "./types/cartSelection";
export {
  cartProductItems,
  cartBookingItems,
  cartDigitalItems,
  cartSubscriptionPlanItems,
} from "./types/cart";
export {
  orderProductItems,
  orderBookingItems,
  orderDigitalItems,
  orderSubscriptionPlanItems,
  orderRentalUseItems,
  orderPurchaseAccessItems,
} from "./types/order";
export type { CartCheckoutRequest, CartAcceptanceProof, RecoverCartCheckoutParams } from "./types/cartCheckout";
export type { CheckoutCartOnAccountParams, CartOnAccountCheckoutRequest } from "./types/cartOnAccountCheckout";
export type * from "./types/firstOrderTerms";
export type { InitialMarketInput, CartDeliveryGroup, CartDeliveryGroupItem, CartDeliveryWindow, CartDeliveryDestination, CartSubscriptionDelivery } from "./types/api";
export type * from "./types/cartDelivery";
export type { CaptureCustomerEmailParams } from "./types/api";
export type { StorefrontCart, StorefrontOrderCheckoutResult } from "./types/storefront";
export type { GetEmailTemplatesParams, GetEmailTemplateParams, CreateEmailTemplateParams, UpdateEmailTemplateParams, DeleteEmailTemplateParams, PreviewEmailTemplateParams, PreviewEmailTemplateResponse, SendEmailTemplateTestParams } from "./types/api";
export type { GetFormsParams, GetFormsByIdsParams, GetFormParams, CreateFormParams, UpdateFormParams, DeleteFormParams, PermanentlyDeleteFormParams, SubmitFormParams, GetFormSubmissionsParams, GetFormSubmissionParams, DeleteFormSubmissionParams, GetFormPresentationParams, CreateStaffFormSubmissionParams, ChangeFormSubmissionStageParams, FormSubmissionStageNote, SetFormSubmissionCompanyParams, AssignFormSubmissionParams, CreateFormSubmissionNoteParams, FindFormSubmissionNotesParams, UpdateFormSubmissionNoteParams, DeleteFormSubmissionNoteParams, UpdateCustomerMeParams } from "./types/api";
export type { MarketStatus, MarketUsage } from "./types";
export type { CompanyAddress, CompanyProfile, CompanyEditableStatus, CompanyStatus, Company, CompanyUsage, CreateCompanyParams, GetCompanyParams, UpdateCompanyParams, DeleteCompanyParams, FindCompaniesParams } from "./types/company";
export type { CompanyMembershipEditableStatus, CompanyMembershipStatus, CompanyLocationReach, CompanyMembership, CreateCompanyMembershipParams, GetCompanyMembershipParams, UpdateCompanyMembershipParams, DeleteCompanyMembershipParams, FindCompanyMembershipsParams } from "./types/companyMembership";
export type { CompanyPermission, CompanyRoleStatus, CompanyRole, CompanyRoleUsage, CreateCompanyRoleParams, GetCompanyRoleParams, UpdateCompanyRoleParams, DeleteCompanyRoleParams, FindCompanyRolesParams } from "./types/companyRole";
export type { CompanyLocationEditableStatus, CompanyLocationStatus, CompanyLocation, CreateCompanyLocationParams, GetCompanyLocationParams, UpdateCompanyLocationParams, DeleteCompanyLocationParams, FindCompanyLocationsParams, SetCompanyLocationServedFromParams } from "./types/companyLocation";
export type { CompanyLocationTaxSettings, CompanyLocationCommercePolicy, TaxRegistration, TaxRegistrationStatus, TaxExemption } from "./types/companyLocation";
export type { SetCompanyLocationCommercePolicyParams } from "./types/companyLocation";
export type { InventoryItem, InventoryItemStatus, InventoryItemEditableStatus, InventoryTracking, InventoryPhysical, InventoryCustoms, InventoryDimensions, CreateInventoryItemParams, UpdateInventoryItemParams, GetInventoryItemParams, GetInventoryItemByKeyParams, FindInventoryItemsParams, DeleteInventoryItemParams } from "./types/inventoryItem";
export type { InventoryLevel, InventoryStockLevel, IncomingStock, ReceiveStockMoveParams, CreateInventoryLevelParams, GetInventoryLevelParams, RemoveInventoryLevelParams, FindInventoryLevelsParams, ChangeSetAsideParams, MoveInventoryParams, InventoryQuantity, InventoryMovement, InventoryMovementReason, ManualInventoryMovementReason, RecordInventoryMovementParams, GetInventoryMovementParams, FindInventoryMovementsParams, UnitSpan } from "./types/inventory";
export type * from "./types/inventoryUnit";
export type * from "./types/return";
export type * from "./types/fulfillmentUnitSelection";
export type { Promotion, PromotionStatus, PromotionEditableStatus, PromotionActivation, PromotionStacking, PromotionEligibility, PromotionTarget, PromotionEffect, PromotionBuyRequirement, PromotionGetDiscount, PromotionProductVariantRef, CreatePromotionParams, UpdatePromotionParams, GetPromotionParams, GetPromotionByKeyParams, FindPromotionsParams, DeletePromotionParams, PromotionCode, PromotionCodeStatus, PromotionCodeEditableStatus, CreatePromotionCodeParams, UpdatePromotionCodeParams, GetPromotionCodeParams, GetPromotionCodeByCodeParams, FindPromotionCodesParams, DeletePromotionCodeParams } from "./types/promotion";
export type { TaxCategory, TaxCategoryStatus, TaxCategoryEditableStatus, CreateTaxCategoryParams, UpdateTaxCategoryParams, GetTaxCategoryParams, FindTaxCategoriesParams, DeleteTaxCategoryParams, TaxRate, TaxCalculation, TaxComponent, TaxTreatment, TaxRule, TaxRuleStatus, TaxRuleEditableStatus, CreateTaxRuleParams, UpdateTaxRuleParams, GetTaxRuleParams, FindTaxRulesParams, DeleteTaxRuleParams } from "./types/tax";
export type { PaymentTerms, PaymentTermsStatus, PaymentTermsEditableStatus, CreatePaymentTermsParams, UpdatePaymentTermsParams, GetPaymentTermsParams, FindPaymentTermsParams, DeletePaymentTermsParams } from "./types/paymentTerms";
export type { OrderCredit, OrderCreditAllocation, OrderCreditSource, OrderCreditStatus, CreditTarget, CreditMoney, DiscountReversal, TaxComponentReversal, DutyComponentReversal, CreateOrderCreditParams, GetOrderCreditParams, FindOrderCreditsParams } from "./types/orderCredit";
export type { PaymentMethod, PaymentMethodOwner, PaymentMethodDetails, PaymentMethodProviderName, PaymentMethodState, PaymentMethodCheckoutCardFailure, PaymentMethodCheckoutCardOutcome, PaymentMethodOperation, PaymentMethodOperationType, PaymentMethodRevocation, PaymentMethodRevocationRecord, PaymentMethodRevocationRequest, NativeSetupOutcome, NativeCustomerSetupOutcome, GetPaymentMethodParams, FindPaymentMethodsParams, FindPaymentMethodOperationsParams, RevokePaymentMethodParams, PaymentMethodSetupRequest, RequestPaymentMethodSetupParams, PaymentMethodSetupStart } from "./types/paymentMethod";
export type { CustomerGroupEmailConsent, CustomerGroupEmailConsentStatus, CustomerGroupEmailConfirmation, CustomerGroupConfirmationHistoryEntry, CustomerGroupConsentEvent, CustomerGroupConsentEventType, CustomerGroupConsentSource, CustomerGroupUnsubscribeReason, RecordCustomerGroupEmailDecision, SubscribeCustomerGroupEmailsParams, RecordCustomerGroupEmailConsentParams, ImportCustomerGroupEmailConsentEntry, ImportCustomerGroupEmailConsentsParams, ImportCustomerGroupEmailConsentsResult, ConfirmCustomerGroupEmailsParams, UnsubscribeCustomerGroupEmailsParams, ResendCustomerGroupConfirmationParams, GetCustomerGroupEmailConsentParams, FindCustomerGroupEmailConsentsParams, FindCustomerGroupEmailConsentHistoryParams } from "./types/customerGroupEmailConsent";
export type { CheckoutCartVersion, ConvertedCartLine, CartLineItemRef, OrderLineItemRef, CheckoutQuote, CheckoutQuoteSources } from "./types/checkout";
export type { StorefrontClientRegistration, StorefrontClientStatus, CreateStorefrontClientParams, UpdateStorefrontClientParams, RevokeStorefrontClientParams, GetStorefrontClientParams, FindStorefrontClientsParams } from "./types/storefrontClient";
export type { ShippingMethod, ShippingMethodType, ShippingMethodStatus, ShippingMethodEditableStatus, CreateShippingMethodParams, UpdateShippingMethodParams, GetShippingMethodParams, FindShippingMethodsParams, DeleteShippingMethodParams, ShippingRateCondition, ShippingRateWeightTier, ShippingRatePricing, ShippingRate, ShippingRateStatus, ShippingRateEditableStatus, CreateShippingRateParams, UpdateShippingRateParams, GetShippingRateParams, FindShippingRatesParams, DeleteShippingRateParams } from "./types/shipping";
export type { Zone, ZoneMatch, ZoneStatus, ZoneEditableStatus, CreateZoneParams, UpdateZoneParams, GetZoneParams, FindZonesParams, DeleteZoneParams, MarketZone, MarketZoneStatus, MarketZoneEditableStatus, CreateMarketZoneParams, UpdateMarketZoneParams, GetMarketZoneParams, FindMarketZonesParams, DeleteMarketZoneParams } from "./types/zone";
export type { ShippingProfile, ShippingProfileStatus, ShippingProfileEditableStatus, CreateShippingProfileParams, UpdateShippingProfileParams, GetShippingProfileParams, GetShippingProfileByKeyParams, FindShippingProfilesParams, DeleteShippingProfileParams } from "./types/shippingProfile";
export type { CustomerGroupEditableStatus, CustomerGroupStatus, CustomerGroupJoinPolicy, CustomerGroupConsentPolicy, CustomerGroupCommunication, CustomerGroup, CustomerGroupUsage, CreateCustomerGroupParams, GetCustomerGroupParams, GetCustomerGroupByKeyParams, UpdateCustomerGroupParams, DeleteCustomerGroupParams, FindCustomerGroupsParams, StorefrontCustomerGroup, GetStorefrontCustomerGroupParams } from "./types/customerGroup";
export type { SubscriptionPlan, SubscriptionPlanTerm, SubscriptionPlanStatus, SubscriptionCommitment, SubscriptionCommitmentEndAction, SubscriptionProductQuantity, SubscriptionDeliverySchedule, SubscriptionDigitalContent, RecurringCadence, RenewalRecoveryPolicy, BillingInterval, CreateSubscriptionPlanParams, UpdateSubscriptionPlanParams, GetSubscriptionPlanParams, FindSubscriptionPlansParams, StorefrontSubscriptionPlan, StorefrontSubscriptionPlanEntitlement, FindStorefrontSubscriptionPlansParams, GetStorefrontSubscriptionPlanParams } from "./types/subscriptionPlan";
export type { SubscriptionPlanEntitlement, SubscriptionPlanEntitlementType, FindSubscriptionPlanEntitlementsParams, CreateSubscriptionPlanEntitlementParams, UpdateSubscriptionPlanEntitlementParams, DeleteSubscriptionPlanEntitlementParams } from "./types/subscriptionPlanEntitlement";
export type { SubscriptionChange, SubscriptionChangeType, Subscription, SubscriptionSubject, SubscriptionStatus, SubscriptionPurchaseState, SubscriptionCollectionBlock, GetSubscriptionParams, FindSubscriptionsParams, FindSubscriptionOrdersParams, FindSubscriptionCommandsParams, GetCurrentSubscriptionParams, SubscriptionControlType, SubscriptionControl, ControlSubscriptionParams, SubscriptionControlResult } from "./types/subscription";
export type * from "./types/subscriptionRevision";
export type * from "./types/subscriptionOffering";
export type * from "./types/purchaseAccess";
export type * from "./types/rental";
export type * from "./types/purchaseRequirement";
export type * from "./types/minimumProgress";
export type * from "./types/messageDelivery";
export type * from "./types/automation";
export type * from "./types/fulfillmentJob";
export type * from "./types/fulfillmentRouting";
export type * from "./types/note";
export type * from "./types/storeRole";
export type * from "./types/catalogItem";
export type * from "./types/catalogAccess";
export type { CustomerGroupAdmission, CustomerGroupAdmissionSource, CustomerGroupDecisionSource, CustomerGroupAdministrativeAccess, CustomerGroupMember, CustomerGroupMemberSelf, CustomerGroupSelfAdmission, CustomerGroupJoinResult, CustomerGroupMemberCommandResponse, CustomerGroupMemberChange, CustomerGroupMemberCommandResult, CustomerGroupMemberCommandResultType, LookupCustomerGroupMemberParams, CustomerGroupJoinScope, CustomerGroupJoinRequest, JoinCustomerGroupParams, GetCustomerGroupMemberParams, FindCustomerGroupMembersParams, GetCurrentCustomerGroupMemberParams, FindCustomerGroupMemberCommandsParams, CustomerGroupMemberCommand, ExecuteCustomerGroupMemberCommandParams } from "./types/customerGroupMember";
export type { SalesChannelEditableStatus, SalesChannelStatus, SalesChannel, SalesChannelUsage, CreateSalesChannelParams, GetSalesChannelParams, UpdateSalesChannelParams, DeleteSalesChannelParams, FindSalesChannelsParams } from "./types/salesChannel";
export type { SellableRef } from "./types/sellable";
export type { OrderBooking, GetOrderBookingParams } from "./types/orderBooking";
export type { CancelPendingOrderParams, OrderCancellationAcceptance } from "./types/orderCancellation";
export type * from "./types/storeCommerce";
export type { SellerProfile, SellerTaxRegistration } from "./types/orderContract";

export type {
  Catalog,
  CatalogEditableStatus,
  CatalogStatus,
  CatalogUsage,
  CatalogSubscriptionBenefitUsage,
  CatalogSubscriptionRevisionUsage,
  CreateCatalogParams,
  UpdateCatalogParams,
  DeleteCatalogParams,
  GetCatalogParams,
  GetCatalogByKeyParams,
  FindCatalogsParams,
  CopyCatalogParams,
  CatalogCopyResult,
  FindPurchasableCatalogsParams,
  FindStorefrontCatalogsParams,
  StorefrontCatalog,
} from "./types/catalog";
export type { CatalogReadOptions } from "./types/catalog";
export type { StorefrontProduct, StorefrontProductVariant, GetStorefrontProductVariantParams, FindStorefrontProductVariantsParams } from "./types/storefront";
export type { StorefrontCurrentCartParams, FindStorefrontPreparedCartsParams, StorefrontUpdateCartParams, StorefrontAddCartProductParams, StorefrontAddCartBookingParams, StorefrontAddCartDigitalParams } from "./types/storefront";
export {
  epochMilliseconds,
  epochMillisecondsFromDate,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "./utils/time";
export type { EpochMilliseconds } from "./types/time";
export type { CompanySnapshot, PurchaseCustomerSnapshot, PurchaseOrigin, PurchaseQuoteContext, SalesChannelSnapshot } from "./types/commerce";
export type { SubscriptionAcceptedTerms, SubscriptionPlanSnapshot, SubscriptionPlanEntitlementSnapshot, SubscriptionPlanEntitlementSnapshotType, SubscriptionProductSnapshot, SubscriptionDigitalSnapshot, SubscriptionDeliveryTerms, SubscriptionPurchaseOccurrence, OrderSubscriptionTerms, OrderAccessRevocation } from "./types/commerce";
export type * from "./types/orderMoney";
export type * from "./types/orderLineItem";
export type { OrderLinePrice, OrderInventoryRequirementSnapshot, OrderProductFulfillmentSnapshot, AcceptedAsset, OrderDigitalContent } from "./types/orderSnapshot";
export type { CheckoutProductSnapshot, CheckoutBookingSnapshot, CheckoutDigitalSnapshot, QuotedProductMoneyRun, SubscriptionEntitlementOrderQuoteLine, QuotedDeliveryGroup, QuotedShippingOffer, QuotedDeliveryPricing, ShippingDeliveryEstimate } from "./types/quote";
export type { OrderDeliveryGroup, OrderDeliveryGroupItem, OrderDeliveryGroupRentalItem, OrderDeliveryDestinationSnapshot, AcceptedDeliveryPricing, AcceptedDeliveryPricingSource, AcceptedDeliveryCalculation } from "./types/orderContract";
export type {
  ActivateEmailSuppressionParams,
  EmailSuppression,
  EmailSuppressionRecord,
  EmailSuppressionSource,
  EmailSuppressionStatus,
  EmailSuppressionType,
  FindEmailSuppressionsParams,
  GetEmailSuppressionParams,
  ReleaseEmailSuppressionParams,
} from "./types/emailSuppression";
export { createStripeEmbeddedCheckout, mountCheckoutAction, mountPaymentMethodSetup } from "./checkout";
export type { PaymentMethodSetupMount } from "./checkout";
export { selectLocalizedObjectText, selectLocalizedText } from "./utils/blocks";
export type {
  EmbeddedCheckoutCallbacks,
  EmbeddedCheckoutAction,
  EmbeddedCheckoutMount,
  StripeEmbeddedCheckoutAction,
} from "./checkout";
export type { ScheduledMutationOptions } from "./services/createHttpClient";

export type {
  EshopCartItem,
  CartLineItem,
  CartCompanyContext,
  CreatedCart,
  RepeatedCart,
  RepeatLeftOutLine,
  CartProductItem,
  CartBookingItem,
  CartDigitalItem,
  CartSubscriptionPlanItem,
  Cart,
  CartStatus,
  Store,
  StoreDeletionResult,
  StoreUsage,
  UsagePeriod,
  Webhook,
  WebhookStatus,
  WebhookEventSubscription,
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
  LocalizedText,
  LocalizedTextBlock,
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
  Payment,
  CommerceProviderObservation,
  PaymentReconciliation,
  PaymentRoute,
  PaymentCheckoutExpiration,
  MonriAuthorizationVoid,
  MonriVoidStatus,
  MonriVoidResult,
  BillingPeriod,
  PaymentAmounts,
  PaymentCaptureEvidence,
  MonriCaptureProof,
  CaptureFinancialEffect,
  PaymentCaptureStatus,
  PaymentCapture,
  RecordedCollection,
  RecordCashOnDeliveryCollectionParams,
  RecordManualCollectionParams,
  CreateManualPaymentParams,
  OrderMoney,
  OrderPromotionSnapshot,
  PaymentOption,
  PaymentOptionType,
  MonriEnvironment,
  PaymentOptionTypeName,
  StripeProviderConnection,
  StripeMerchantConfiguration,
  StripeMerchantWebhook,
  StripeWebhookDelivery,
  StripeConfigurationChange,
  StripeConfigurationResolution,
  StripeMerchantSetup,
  PaymentOptionStatus,
  TaxMode,
  AccountActor,
  AccountActorSnapshot,
  AccountCredentialType,
  RefundApplication,
  RefundRequester,
  SystemRefundReason,
  PaymentRefund,
  RefundProvider,
  MonriRefundResult,
  MonriRefundAssociation,
  MonriRefundEvidence,
  ReviewMonriRefundParams,
  ProviderNotificationOwner,
  ProviderNotificationReviewReason,
  ProviderNotificationState,
  MonriRefundReviewEvidence,
  MonriRefundReviewEvidencePage,
  FindMonriRefundReviewEvidenceParams,
  RefundAllocation,
  CustomerMoneyEvidence,
  RefundFinancialEffect,
  RefundAllocationBalance,
  RefundMoneySummary,
  RecordedRefundMoney,
  LocalRefundMovement,
  RecordRefundMoneyParams,
  CancelLocalRefundParams,
  RefundStatus,
  RefundReason,
  RefundRequestReason,
  OrderDigitalItem,
  OrderDigitalSnapshot,
  DigitalProductQuoteLine,
  SubscriptionOrderQuoteLine,
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
  DisputeFinancialEffect,
  PaymentDisputeStatus,
  PaymentDisputeResponse,
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
  StoreSubscriptionOperation,
  StoreSubscriptionOperationType,
  StoreSubscriptionOperationStatus,
  ProviderOperationClaim,
  ProviderEffectError,
  StorePlan,
  StorePlanFeature,
  StorePlanFeatureType,
  StorefrontPrice,
  AppliedPriceSnapshot,
  AppliedPriceSource,
  DisplayTextSnapshot,
  OrderSubscriptionPlanItem,
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
  Event,
  EventAction,
  ShippingRateLine,
  FulfillmentHold,
  FulfillmentHoldReason,
  RentalIssueReplacement,
  FulfillmentUnitSpan,
  FulfillmentJobItem,
  FulfillmentRecipient,
  FulfillmentCompanyRecipient,
  FulfillmentWindow,
  FulfillmentExecution,
  SelectedUnit,
  Tracking,
  GeoLocationBlock,
  BookingService,
  BookingResource,
  BookingOffering,
  BookingCapacityClaim,
  BookingResourceCapacityDay,
  BookingWindow,
  ServiceDuration,
  Weekday,
  WorkingWindow,
  WeeklyAvailability,
  DateOverride,
  TimeRange,
  Order,
  OrderSource,
  OrderSourceFilter,
  OrderRentalUseItem,
  OrderFinancialSummary,
  OrderFinancialConcern,
  GetOrderFinancialSummaryParams,
  PurchaseOriginSnapshot,
  MarketSnapshot,
  SellerSnapshot,
  CollectionPolicySnapshot,
  ReconciliationState,
  CheckoutPaymentAuthorization,
  PaymentTermsSnapshot,
  PaymentTermsType,
  PromotionRedemption,
  OrderLineItem,
  OrderCompanyContext,
  OrderProductItem,
  OrderBookingItem,
  OrderProductSnapshot,
  OrderBookingStatus,
  BookingReminderScheduleItem,
  OrderBookingSnapshot,
  DiscountAllocation,
  TaxLine,
  LineMoneySnapshot,
  OrderItemStatus,
  ProductQuoteLine,
  BookingQuoteLine,
  BookingQuoteLineAvailability,
  OrderStatus,
  PaymentStatus,
  OrderCancellationReason,
  Product,
  ProductEditableStatus,
  ProductVariant,
  ProductVariantStatus,
  ProductVariantEditableStatus,
  ProductFulfillment,
  InventoryRequirement,
  BackorderPolicy,
  GalleryItem,
  EmailTemplate,
  EmailTemplateContent,
  EmailTemplateData,
  EmailTemplateDataType,
  EmailSender,
  EmailAttachmentReference,
  Form,
  FormStage,
  FormSubmission,
  FormSubmissionSource,
  FormSubmissionStage,
  FormSubmissionStageChange,
  FormSubmissionSelectFilter,
  AdminFormSubmission,
  FormSchema,
  FormSchemaType,
  FormField,
  FormFieldType,
  FormValue,
  FormValues,
  FormEntry,
  Category,
  CategoryEntry,
  CategoryQuery,
  CategorySchema,
  CategorySchemaType,
  CategoryField,
  CategoryFieldQuery,
  CategoryCoordinates,
  CategoryGeoLocation,
  CategoryNumberOperation,
  Customer,
  CustomerListItem,
  CustomerIdentity,
  CustomerEmailClaim,
  StorefrontCustomerIdentity,
  CustomerEmailVerification,
  CustomerSessionRecord,
  StorefrontCustomerSessionRecord,
  CustomerSessionIssued,
  CustomerSessionStatus,
  CustomerAction,
  CustomerActionType,
  CustomerActionOrigin,
  CustomerActionProviderObservation,
  Mailbox,
  MailboxIncomingSource,
  MailboxSyncIssue,
  MailboxSyncIssueReason,
  MailboxConnectionSecurity,
  MailboxPreset,
  MailboxSyncStatus,
  MailboxSyncFailure,
  MailboxSyncFailureKind,
  MailboxSyncRecoveryWarning,
  GoogleMailboxProvider,
  SmtpImapMailboxProviderInput,
  SmtpImapMailboxProvider,
  CampaignStep,
  Campaign,
  CampaignEnrollment,
  CampaignEnrollmentSource,
  CampaignGroupRecipient,
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
  AccountSessionScope,
  AccountSessionStatus,
  StoreMembership,
  StoreMembershipStatus,
  StoreMembershipWithStoreName,
  StoreAccess,
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
  CampaignOutgoingStatus,
  CampaignMessageType,
  CampaignEmailContent,
  CollectionStatus,
  EntryStatus,
  EmailTemplateStatus,
  EmailTemplateVariable,
  EmailTemplateVariableSource,
  FormStatus,
  FormPresentation,
  FormPresentedSchema,
  FormSubmissionSnapshot,
  FormQuestionSnapshot,
  CategoryStatus,
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
  FindCustomerIdentitiesParams,
  CustomerIdentityCommandParams,
  ResolveOrReserveCustomerEmailParams,
  ResolveOrReserveCustomerEmailResult,
  FindCustomerSessionsParams,
  RevokeAllCustomerSessionsParams,
  RevokeCustomerSessionParams,
  GetAvailabilityParams,
  AvailabilitySlot,
  DaySlots,
  BookingResourceAvailability,
  AvailabilityResponse,
  BookingItemLifecycleParams,
  CancelBookingItemParams,
  CreateBookingServiceParams,
  UpdateBookingServiceParams,
  DeleteBookingServiceParams,
  GetBookingServiceParams,
  GetBookingServiceByKeyParams,
  FindBookingServicesParams,
  FindStorefrontBookingServicesParams,
  CreateBookingResourceParams,
  UpdateBookingResourceParams,
  DeleteBookingResourceParams,
  GetBookingResourceParams,
  GetBookingResourceByKeyParams,
  FindBookingResourcesParams,
  CreateBookingOfferingParams,
  UpdateBookingOfferingParams,
  DeleteBookingOfferingParams,
  GetBookingOfferingParams,
  FindBookingOfferingsParams,
  LookupBookingOfferingParams,
  CreateProductParams,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  GetProductByKeyParams,
  GetProductsParams,
  CatalogPriceFilter,
  ProductQuoteInput,
  BookingQuoteInput,
  GetQuoteParams,
  GetOrderParams,
  GetOrdersParams,
  UpdateOrderParams,
  CartProductInput,
  CartBookingInput,
  CartDigitalItemInput,
  CartSubscriptionPlanInput,
  DigitalProductQuoteInput,
  CartLineItemInput,
  TrustedCartProductInput,
  TrustedCartBookingInput,
  TrustedCartDigitalItemInput,
  CreateRefundParams,
  CancelOrderProductItemParams,
  CreateRefundResponse,
  FindRefundsParams,
  GetRefundParams,
  GetPaymentParams,
  FindPaymentsParams,
  FindOrderPaymentsParams,
  GetOrderPaymentParams,
  GetCurrentCartParams,
  GetCartParams,
  FindCartsParams,
  CreateCartParams,
  UpdateCartParams,
  AddCartProductParams,
  AddCartBookingParams,
  AddCartDigitalProductParams,
  AddCartSubscriptionPlanParams,
  CreateDigitalProductParams,
  UpdateDigitalProductParams,
  GetDigitalProductParams,
  GetDigitalProductByKeyParams,
  GetDigitalAssetParams,
  FindDigitalProductsParams,
  UploadDigitalAssetParams,
  FindDigitalAssetsParams,
  ArchiveDigitalAssetParams,
  DownloadDigitalAssetParams,
  FindStorefrontDigitalProductsParams,
  FindDigitalLibraryParams,
  GetStorefrontDigitalProductParams,
  GetDigitalLibraryProductParams,
  RemoveCartItemParams,
  ClearCartParams,
  QuoteCartParams,
  CheckoutCartParams,
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
  GetCategoriesParams,
  CreateCategoryParams,
  UpdateCategoryParams,
  GetCategoryParams,
  GetStorefrontCategoryParams,
  DeleteCategoryParams,
  GetCategoryChildrenParams,
  GetEntriesParams,
  CreateEntryParams,
  UpdateEntryParams,
  GetEntryParams,
  DeleteEntryParams,
  FindPaymentDisputesParams,
  GetPaymentDisputeParams,
  SelectStoreSubscriptionParams,
  CancelStoreSubscriptionParams,
  ReactivateStoreSubscriptionParams,
  TestWebhookParams,
  TestWebhookResponse,
  WebhookDeliveryStatus,
  CreateMailboxParams,
  UpdateMailboxParams,
  FindMailboxesParams,
  FindMailboxSyncIssuesParams,
  GetMailboxParams,
  DisconnectMailboxParams,
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
  GetLeadResearchMessageParams,
  SendLeadResearchMessageParams,
  FindLeadResearchMessagesParams,
  RetryLeadResearchMessageParams,
  CancelLeadResearchMessageParams,
  CancelSocialPostParams,
  ConnectSocialConnectionParams,
  CreateSocialMessageParams,
  CreateSocialPostParams,
  DisconnectSocialConnectionParams,
  FindSocialConnectionsParams,
  GetSocialConnectionParams,
  FindSocialMessagesParams,
  FindSocialPostsParams,
  GetSocialPostParams,
  StripeConfigurationInput,
  ConfigureStripePaymentOptionParams,
  CancelStripeConfigurationParams,
  GetStripeConfigurationChangeParams,
  CreateLocalPaymentOptionParams,
  CreateMonriPaymentOptionParams,
  UpdatePaymentOptionParams,
  ListPaymentOptionsParams,
  ConfigurationPageParams,
  GetStoreConfigurationByKeyParams,
  GetStoreConfigurationParams,
  GetPaymentOptionParams,
  FindMarketsParams,
  FindStoreLocationsParams,
  FindStorefrontMarketsParams,
  FindStorefrontLocationsParams,
  RefreshStripePaymentOptionParams,
  SyncSocialMessagesParams,
  AuthToken,
  PendingAccountSession,
  RefreshAccountSessionParams,
  RequestPendingAccountSessionParams,
  VerifyPendingAccountSessionParams,
  PlatformRole,
  UpdatePlatformRoleParams,
  AddMemberParams,
  TransferStoreOwnershipParams,
  FindOwnStoreMembershipsParams,
  GetStoresParams,
  SearchAccountsParams,
  GetOwnStoreMembershipParams,
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
  DeleteMarketParams,
  CreateStoreParams,
  UpdateStoreParams,
  CustomerGroupMemberType,
  CreateProductVariantParams,
  UpdateProductVariantParams,
  GetProductVariantParams,
  FindProductVariantsParams,
  DeleteProductVariantParams,
} from "./types/api";

export type {
} from "./types/api";

export type { TrackCustomerActionParams, CommonCustomerActionKey, ExperimentUseResponse, StorefrontCustomer, StorefrontBookingOffering, StorefrontBookingResource, StorefrontBookingService, StorefrontCheckoutQuote, StorefrontLocation, StorefrontMarket, StorefrontPaymentOption, StorefrontSetup, StorefrontVisitorSessionRecord, UseExperimentParams } from "./api/storefront";
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
  type CartControllerAddSubscriptionPlanParams,
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
  SupportAiResponseStatus,
  SupportConversationStatus,
  SupportMessage,
  SupportConversationResponse,
  SupportConversationStartResponse,
  StorefrontSupportConversation,
  StorefrontSupportMessage,
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

export function storeDefaultSalesChannel(
  store: Pick<Store, "commerce">,
): string | null {
  return store.commerce.type === "ready" ? store.commerce.default_sales_channel_id : null;
}

export const SDK_VERSION = "0.26.81";
export const SUPPORTED_FRAMEWORKS = [
  "astro",
  "react",
  "vue",
  "svelte",
  "vanilla",
] as const;


export interface AdminSession {
  id: string;
  scope: import('./types').AccountSessionScope;
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
import type { Store } from "./types";
import type { UpdateCustomerMeParams } from "./types/api";
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
import { createContentApi } from "./api/content";
import { createEshopApi } from "./api/eshop";
import { createCatalogApi } from "./api/catalog";
import { createCatalogItemApi } from "./api/catalogItem";
import { createCatalogAccessApi } from "./api/catalogAccess";
import { createPriceApi } from "./api/price";
import { createProductVariantApi } from "./api/productVariant";
import { createInventoryItemApi } from "./api/inventoryItem";
import { createInventoryLevelApi } from "./api/inventoryLevel";
import { createInventoryUnitApi } from "./api/inventoryUnit";
import { createReturnApi } from "./api/return";
import { createInventoryMovementApi } from "./api/inventoryMovement";
import { createShippingProfileApi } from "./api/shippingProfile";
import { createZoneApi } from "./api/zone";
import { createMarketZoneApi } from "./api/marketZone";
import { createTaxCategoryApi } from "./api/taxCategory";
import { createPaymentTermsApi } from "./api/paymentTerms";
import { createOrderCreditApi } from "./api/orderCredit";
import { createFulfillmentApi } from "./api/fulfillment";
import { createFulfillmentJobApi } from "./api/fulfillmentJob";
import { createFulfillmentRoutingApi } from "./api/fulfillmentRouting";
import { createOrderNoteApi, createCustomerNoteApi, createCompanyNoteApi } from "./api/note";
import { createRentalApi } from "./api/rental";
import { createPaymentMethodApi } from "./api/paymentMethod";
import { createCustomerGroupEmailConsentApi } from "./api/customerGroupEmailConsent";
import { createCheckoutApi } from "./api/checkout";
import { createMarketPaymentOptionApi } from "./api/marketPaymentOption";
import { createStorefrontClientApi } from "./api/storefrontClient";
import { createTaxRuleApi } from "./api/taxRule";
import { createShippingMethodApi } from "./api/shippingMethod";
import { createShippingRateApi } from "./api/shippingRate";
import { createPromotionApi } from "./api/promotion";
import { createPromotionCodeApi } from "./api/promotionCode";
import { createCompanyApi } from "./api/company";
import { createCompanyMembershipApi } from "./api/companyMembership";
import { createCompanyRoleApi } from "./api/companyRole";
import { createCompanyLocationApi } from "./api/companyLocation";
import { createMessageDeliveryApi } from "./api/messageDelivery";
import { createAutomationApi } from "./api/automation";
import { createStoreRoleApi } from "./api/storeRole";
import { createCustomerGroupApi } from "./api/customerGroup";
import { createCustomerGroupMemberApi } from "./api/customerGroupMember";
import { createSubscriptionApi } from "./api/subscription";
import { createSubscriptionPlanApi } from "./api/subscriptionPlan";
import { createSubscriptionOfferingApi } from "./api/subscriptionOffering";
import { createSubscriptionPlanEntitlementApi } from "./api/subscriptionPlanEntitlement";
import { createSalesChannelApi } from "./api/salesChannel";
import { createDigitalApi } from "./api/digital";
import { createLocationApi } from "./api/location";
import { createMarketApi } from "./api/market";
import { createCustomersApi } from "./api/customers";
import { createEmailSuppressionApi } from "./api/emailSuppression";
import { createActionsApi } from "./api/actions";
import { createMailboxApi } from "./api/mailbox";
import { createCampaignApi } from "./api/campaign";
import {
  createAdminSupportApi,
  createStorefrontSupportApi,
} from "./api/support";
import { createLeadResearchApi } from "./api/leadResearch";
import { createSocialApi } from "./api/social";
import { createPlatformApi } from "./api/platform";
import { createPaymentOptionApi } from "./api/paymentOption";
import { createPaymentApi } from "./api/payment";
import { createRefundApi } from "./api/refund";
import { createPaymentDisputeApi } from "./api/paymentDispute";
import { createEmailTemplateApi } from "./api/emailTemplate";
import { createFormsApi } from "./api/forms";
import { createCategoryApi } from "./api/category";
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
  selectLocalizedText,
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
    selectLocalizedText,

    formatPrice,
    getPriceAmount,
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

  };
}

export type CreateAdminConfig = Omit<
  HttpClientConfig,
  "authStorage" | "refreshCredentials"
> & {
  market?: string;
  locale?: string;
  apiToken?: string;
};

export function createAdmin(config: CreateAdminConfig) {
  const sessionState = createAdminSessionState(config.baseUrl, config.refreshPath);
  const readAdminSession = sessionState.read;
  const writeAdminSession = sessionState.write;
  let unsubscribeStorage: (() => void) | null = null;
  const locale = config.locale || "en";
  const listeners = new Set<AuthStateListener<AdminSession>>();

  function toPublic(s: AdminSessionInternal | null): AdminSession | null {
    return s ? { id: s.id, email: s.email, scope: s.scope } : null;
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
            id: s.id,
            access_token: s.access_token,
            refresh_token: s.refresh_token,
            access_expires_at: s.access_expires_at,
          };
        },
        onTokensRefreshed() {},
        onForcedLogout() {},
      };

  const httpClient = createHttpClient({
    baseUrl: config.baseUrl,
    refreshPath: config.refreshPath,
    refreshCredentials: config.apiToken ? undefined : sessionState.refresh,
    onUnauthorized: config.apiToken ? () => false : undefined,
    navigate: config.navigate,
    loginFallbackPath: config.loginFallbackPath,
    authStorage,
  });

  const apiConfig: ApiConfig = {
    httpClient,
    baseUrl: config.baseUrl,
    market: config.market,
    locale,
    authStorage,
  };

  const accountApi = createAccountApi(apiConfig);
  const authHttpClient = createHttpClient({
    baseUrl: config.baseUrl,
    authStorage: { getTokens: () => null, onTokensRefreshed() {}, onForcedLogout() {} },
    onUnauthorized: () => false,
  });
  const authApi = createAuthApi({ ...apiConfig, httpClient: authHttpClient }, updateSession, sessionState.refreshExplicit);
  const storeApi = createStoreApi(apiConfig, updateSession);
  const platformApi = createPlatformApi(apiConfig);

  const contentApi = createContentApi(apiConfig);
  const eshopApi = createEshopApi(apiConfig);
  const digitalApi = createDigitalApi(apiConfig);
  const customersApi = createCustomersApi(apiConfig);
  const emailSuppressionApi = createEmailSuppressionApi(apiConfig);
  const actionsApi = createActionsApi(apiConfig);
  const mailboxApi = createMailboxApi(apiConfig);
  const campaignApi = createCampaignApi(apiConfig);
  const supportApi = createAdminSupportApi(apiConfig);
  const leadResearchApi = createLeadResearchApi(apiConfig);
  const socialApi = createSocialApi(apiConfig);
  const paymentOptionApi = createPaymentOptionApi(apiConfig);
  const paymentApi = createPaymentApi(apiConfig);
  const refundApi = createRefundApi(apiConfig);
  const paymentDisputeApi = createPaymentDisputeApi(apiConfig);
  const locationApi = createLocationApi(apiConfig);
  const marketApi = createMarketApi(apiConfig);
  const storePaymentOptionApi = {
    monri: { create: paymentOptionApi.createMonri },
    list: paymentOptionApi.list,
    get: paymentOptionApi.get,
    getByKey: paymentOptionApi.getByKey,
    create: paymentOptionApi.create,
    update: paymentOptionApi.update,
    stripe: {
      setup: paymentOptionApi.stripeSetup,
      configure: paymentOptionApi.configureStripe,
      cancelConfiguration: paymentOptionApi.cancelStripeConfiguration,
      getConfigurationChange: paymentOptionApi.getStripeConfigurationChange,
      refresh: paymentOptionApi.refreshStripe,
    },
  };
  const formsApi = createFormsApi(apiConfig);
  const categoryApi = createCategoryApi(apiConfig);
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
      zone: createZoneApi(apiConfig),
      marketZone: createMarketZoneApi(apiConfig),
      taxCategory: createTaxCategoryApi(apiConfig),
      taxRule: createTaxRuleApi(apiConfig),
      shippingMethod: createShippingMethodApi(apiConfig),
      shippingRate: createShippingRateApi(apiConfig),
      shippingProfile: createShippingProfileApi(apiConfig),
      paymentTerms: createPaymentTermsApi(apiConfig),
      marketPaymentOption: createMarketPaymentOptionApi(apiConfig),
      storefrontClient: createStorefrontClientApi(apiConfig),
      create: storeApi.createStore,
      update: storeApi.updateStore,
      get: storeApi.getStore,
      customerWorkspace: {
        get: storeApi.getCustomerWorkspace,
        update: storeApi.updateCustomerWorkspace,
      },
      find: storeApi.getStores,
      requestDeletion: storeApi.requestDeletion,
      commerce: {
        initialize: storeApi.initializeCommerce,
        getInitialization: storeApi.getCommerceInitialization,
        abortInitialization: storeApi.abortCommerceInitialization,
        inspectSetup: storeApi.inspectCommerceSetup,
        submitSetup: storeApi.submitCommerceSetup,
        abortSetup: storeApi.abortCommerceSetup,
      },
      subscription: {
        get: storeApi.getSubscription,
        getPlans: storeApi.getStorePlans,
        select: storeApi.selectSubscription,
        retainSelection: storeApi.retainSubscriptionSelection,
        pendingSelection: storeApi.pendingSubscriptionSelection,
        recoverSelection: storeApi.recoverSubscriptionSelection,
        cancel: storeApi.cancelSubscription,
        reactivate: storeApi.reactivateSubscription,
        createPortalSession: storeApi.createPortalSession,
      },
      member: {
        add: storeApi.addMember,
        invite: storeApi.inviteUser,
        find: storeApi.findMembers,
        findOwn: storeApi.findOwnMemberships,
        getOwn: storeApi.getOwnMembership,
        remove: storeApi.removeMember,
        updateRoles: storeApi.updateMemberRoles,
        changeStatus: storeApi.changeMemberStatus,
        transferOwnership: storeApi.transferOwnership,
      },
      role: createStoreRoleApi(apiConfig),
      webhook: {
        test: storeApi.testWebhook,
        list: storeApi.listWebhooks,
        create: storeApi.createWebhook,
        update: storeApi.updateWebhook,
        delete: storeApi.deleteWebhook,
      },
      location: locationApi,
      market: marketApi,
      salesChannel: createSalesChannelApi(apiConfig),
      paymentOption: storePaymentOptionApi,
    },
    media: createMediaApi(apiConfig),
    companies: {
      ...createCompanyApi(apiConfig),
      membership: createCompanyMembershipApi(apiConfig),
      role: createCompanyRoleApi(apiConfig),
      location: createCompanyLocationApi(apiConfig),
      notes: createCompanyNoteApi(apiConfig),
    },
    notification: {
      template: {
        create: emailTemplateApi.createEmailTemplate,
        update: emailTemplateApi.updateEmailTemplate,
        delete: emailTemplateApi.deleteEmailTemplate,
        get: emailTemplateApi.getEmailTemplate,
        find: emailTemplateApi.getEmailTemplates,
        preview: emailTemplateApi.previewEmailTemplate,
        test: emailTemplateApi.sendEmailTemplateTest,
      },
      delivery: createMessageDeliveryApi(apiConfig),
      mailbox: mailboxApi,
    },
    automation: createAutomationApi(apiConfig),
    platform: platformApi,
    social: socialApi,
    category: {
      create: categoryApi.createCategory,
      update: categoryApi.updateCategory,
      delete: categoryApi.deleteCategory,
      get: categoryApi.getCategory,
      find: categoryApi.getCategories,
      getChildren: categoryApi.getCategoryChildren,
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
      findByIds: formsApi.getFormsByIds,
      getSubmissions: formsApi.getSubmissions,
      getSubmission: formsApi.getSubmission,
      deleteSubmission: formsApi.deleteSubmission,
      getPresentation: formsApi.getPresentation,
      createSubmission: formsApi.createSubmission,
      changeSubmissionStage: formsApi.changeSubmissionStage,
      assignSubmission: formsApi.assignSubmission,
      setSubmissionCompany: formsApi.setSubmissionCompany,
      createSubmissionNote: formsApi.createSubmissionNote,
      findSubmissionNotes: formsApi.findSubmissionNotes,
      updateSubmissionNote: formsApi.updateSubmissionNote,
      deleteSubmissionNote: formsApi.deleteSubmissionNote,
    },
    eshop: {
      payment: paymentApi,
      price: createPriceApi(apiConfig),
      customerGroup: createCustomerGroupApi(apiConfig),
      subscriptionOffering: createSubscriptionOfferingApi(apiConfig),
      subscriptionPlan: createSubscriptionPlanApi(apiConfig),
      subscriptionPlanEntitlement: createSubscriptionPlanEntitlementApi(apiConfig),
      customerGroupMember: createCustomerGroupMemberApi(apiConfig),
      subscription: createSubscriptionApi(apiConfig),
      paymentMethod: createPaymentMethodApi(apiConfig),
      customerGroupEmailConsent: createCustomerGroupEmailConsentApi(apiConfig),
      catalog: createCatalogApi(apiConfig),
      catalogItem: createCatalogItemApi(apiConfig),
      catalogAccess: createCatalogAccessApi(apiConfig),
      promotion: createPromotionApi(apiConfig),
      promotionCode: createPromotionCodeApi(apiConfig),
      refund: refundApi,
      dispute: paymentDisputeApi,
      digital: {
        product: {
          create: digitalApi.createProduct,
          update: digitalApi.updateProduct,
          delete: digitalApi.deleteProduct,
          get: digitalApi.getProduct,
          getByKey: digitalApi.getProductByKey,
          find: digitalApi.findProducts,
        },
        asset: {
          upload: digitalApi.uploadAsset,
          get: digitalApi.getAsset,
          find: digitalApi.findAssets,
          archive: digitalApi.archiveAsset,
        },
      },
      product: {
        create: eshopApi.createProduct,
        update: eshopApi.updateProduct,
        delete: eshopApi.deleteProduct,
        get: eshopApi.getProduct,
        getByKey: eshopApi.getProductByKey,
        find: eshopApi.getProducts,
      },
      productVariant: createProductVariantApi(apiConfig),
      inventoryItem: createInventoryItemApi(apiConfig),
      inventoryLevel: createInventoryLevelApi(apiConfig),
      inventoryUnit: createInventoryUnitApi(apiConfig),
      return: createReturnApi(apiConfig),
      inventoryMovement: createInventoryMovementApi(apiConfig),
      orderCredit: createOrderCreditApi(apiConfig),
      fulfillment: createFulfillmentApi(apiConfig),
      fulfillmentJob: createFulfillmentJobApi(apiConfig),
      fulfillmentRouting: createFulfillmentRoutingApi(apiConfig),
      rental: createRentalApi(apiConfig),
      checkout: createCheckoutApi(apiConfig),
      order: {
        update: eshopApi.updateOrder,
        revokeAccess: eshopApi.revokeOrderAccess,
        getFinancialSummary: eshopApi.getOrderFinancialSummary,
        cancelProductItem: eshopApi.cancelOrderProductItem,
        cancelPending: eshopApi.cancelPendingOrder,
        getBookingAppointment: eshopApi.getBookingAppointment,
        cancelBookingItem: eshopApi.cancelBookingItem,
        completeBookingItem: eshopApi.completeBookingItem,
        markBookingItemNoShow: eshopApi.markBookingItemNoShow,
        get: eshopApi.getOrder,
        getPayment: eshopApi.getOrderPayment,
        findPayments: eshopApi.findOrderPayments,
        find: eshopApi.getOrders,
        getQuote: eshopApi.getQuote,
        notes: createOrderNoteApi(apiConfig),
      },
      cart: {
        create: eshopApi.createCart,
        update: eshopApi.updateCart,
        get: eshopApi.getCart,
        find: eshopApi.getCarts,
        addProduct: eshopApi.addCartProduct,
        addBooking: eshopApi.addCartBooking,
        addDigital: eshopApi.addCartDigitalProduct,
        addSubscriptionPlan: eshopApi.addCartSubscriptionPlan,
        removeItem: eshopApi.removeCartItem,
        clear: eshopApi.clearCart,
        quote: eshopApi.quoteCart,
        previewAccessProduct: eshopApi.previewCartAccessProduct,
        quoteFutureDeliveries: eshopApi.quoteCartFutureDeliveries,
        acceptFutureDeliveries: eshopApi.acceptCartFutureDeliveries,
        reviewFirstOrderTerms: eshopApi.reviewFirstOrderTerms,
        sealFirstOrderTerms: eshopApi.sealFirstOrderTerms,
        withdrawFirstOrderTerms: eshopApi.withdrawFirstOrderTerms,
        checkout: eshopApi.checkoutCart,
        retainCheckout: eshopApi.retainCartCheckout,
        pendingCheckout: eshopApi.pendingCartCheckout,
        recoverCheckout: eshopApi.recoverCartCheckout,
        checkoutOnAccount: eshopApi.checkoutCartOnAccount,
        retainOnAccountCheckout: eshopApi.retainCartOnAccountCheckout,
        pendingOnAccountCheckout: eshopApi.pendingCartOnAccountCheckout,
        recoverOnAccountCheckout: eshopApi.recoverCartOnAccountCheckout,
      },
      bookingService: {
        create: eshopApi.createBookingService,
        update: eshopApi.updateBookingService,
        delete: eshopApi.deleteBookingService,
        get: eshopApi.getBookingService,
        getByKey: eshopApi.getBookingServiceByKey,
        find: eshopApi.findBookingServices,
        getAvailability: eshopApi.getBookingServiceAvailability,
      },
      bookingResource: {
        create: eshopApi.createBookingResource,
        update: eshopApi.updateBookingResource,
        delete: eshopApi.deleteBookingResource,
        get: eshopApi.getBookingResource,
        getByKey: eshopApi.getBookingResourceByKey,
        find: eshopApi.findBookingResources,
      },
      bookingOffering: {
        get: eshopApi.getBookingOffering,
        lookup: eshopApi.lookupBookingOffering,
        create: eshopApi.createBookingOffering,
        update: eshopApi.updateBookingOffering,
        delete: eshopApi.deleteBookingOffering,
        find: eshopApi.findBookingOfferings,
      },
    },
    customers: {
      emailSuppression: emailSuppressionApi,
      notes: createCustomerNoteApi(apiConfig),
      create: customersApi.create,
      resolveOrReserveEmail: customersApi.resolveOrReserveEmail,
      get: customersApi.get,
      find: customersApi.find,
      identities: customersApi.identities,
      getIdentity: customersApi.getIdentity,
      revokeIdentity: customersApi.revokeIdentity,
      update: customersApi.update,
      archive: customersApi.archive,
      import: customersApi.import,
      previewImport: customersApi.previewImport,
      findSessions: customersApi.findSessions,
      revokeSession: customersApi.revokeSession,
      revokeAllSessions: customersApi.revokeAllSessions,
    },
    actions: actionsApi,
    campaign: campaignApi.campaign,
    campaignEnrollment: campaignApi.campaignEnrollment,
    campaignMessage: campaignApi.campaignMessage,
    leadResearch: leadResearchApi,
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
      if (!unsubscribeStorage) unsubscribeStorage = sessionState.subscribe(emit);
      const current = toPublic(readAdminSession());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(() => {});
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribeStorage?.();
          unsubscribeStorage = null;
        }
      };
    },

    async logout(): Promise<import('./services/adminSession').AdminLogoutResult> {
      if (config.apiToken) return { type: 'api_token' };
      const result = await sessionState.logout();
      emit();
      return result;
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
  return `arky_customer_session:v2:${encodeURIComponent(apiUrl.toLowerCase())}:${publishableKeyFingerprint(publishableKey)}`;
}

interface StoredCustomerSessionV2 {
  version: 2;
  customer: import("./api/storefront").StorefrontCustomer;
  session: import("./types").CustomerSessionIssued;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEpochMilliseconds(
  value: unknown,
): value is import("./types/time").EpochMilliseconds {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isIssuedCustomerSession(
  value: unknown,
): value is import("./types").CustomerSessionIssued {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.customer_id !== "string" ||
    !isRecord(value.status) ||
    value.status.type !== "active" ||
    Object.keys(value.status).length !== 1
  ) {
    return false;
  }
  if (value.type === "visitor") {
    return (
      typeof value.token === "string" &&
      value.token.startsWith("customer_visitor_") &&
      isEpochMilliseconds(value.expires_at)
    );
  }
  return (
    value.type === "email_authenticated" &&
    typeof value.identity_id === "string" &&
    typeof value.access_token === "string" &&
    value.access_token.startsWith("customer_access_") &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.startsWith("customer_refresh_") &&
    isEpochMilliseconds(value.access_expires_at) &&
    isEpochMilliseconds(value.refresh_expires_at) &&
    isEpochMilliseconds(value.authenticated_at)
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
      parsed.version !== 2 ||
      !isRecord(parsed.customer) ||
      !isEpochMilliseconds(parsed.customer.created_at) ||
      !isEpochMilliseconds(parsed.customer.updated_at) ||
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
  let market = options.market ?? "";
  if (market && !isValidKey(market)) throw new Error("Market must be a valid exact key");
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
    if (!session || session.session.status.type !== "active") return null;
    return session.session.type === "visitor"
      ? session.session.token
      : session.session.access_token;
  }

  function writeCustomerSession(session: CustomerSessionInternal | null): void {
    if (
      session &&
      (!isIssuedCustomerSession(session.session) ||
        !isEpochMilliseconds(session.customer.created_at) ||
        !isEpochMilliseconds(session.customer.updated_at))
    ) {
      throw new RangeError(
        "Customer session must have an active tagged status and signed safe-integer epoch-millisecond timestamps",
      );
    }
    memorySession = session;
    if (!sessionStorage) return;
    try {
      if (session) {
        const stored: StoredCustomerSessionV2 = {
          version: 2,
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
      if (!memorySession || memorySession.session.status.type !== "active")
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
  }, {
    namespace: storageKey,
    storage: sessionStorage,
    customerId: () => memorySession?.customer.id ?? null,
    market: () => market,
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

  async function me(
    options?: import("./types/api").RequestOptions,
  ): Promise<import("./api/storefront").CustomerMeResponse> {
    await ensureVisitorSession();
    const result = await customerApi.getMe(options);
    updateSession((previous) =>
      previous ? { ...previous, customer: result.customer } : previous,
    );
    return result;
  }

  async function updateMe(
    params: UpdateCustomerMeParams,
    options?: import("./types/api").RequestOptions,
  ): Promise<import("./api/storefront").CustomerMeResponse> {
    await ensureVisitorSession();
    const result = await customerApi.updateMe(params, options);
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
    if (value && !isValidKey(value)) throw new Error("Market must be a valid exact key");
    market = value;
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
        memorySession?.session.status.type === "active" &&
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
    category: storefrontApi.category,
    media: storefrontApi.media,
    content: storefrontApi.content,
    forms: storefrontApi.forms,
    eshop: storefrontApi.eshop,
    companies: storefrontApi.companies,
    customer: {
      identify,
      captureEmail: customerApi.captureEmail,
      requestCode,
      verify,
      refresh,
      logout,
      getMe: me,
      updateMe,
    },
    customer_groups: storefrontApi.customer_groups,
    customer_group_members: storefrontApi.customer_group_members,
    customer_group_email_consents: storefrontApi.customer_group_email_consents,
    subscription_offerings: storefrontApi.subscription_offerings,
    subscription_plans: storefrontApi.subscription_plans,
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
  ArkyCartCheckoutInput,
  ArkyStore,
  ArkyStoreConfig,
  ArkyStoreContext,
} from "./storefrontStore";
export type { PriceEditableStatus, PriceStatus, ManualPriceInput, ManualPrice, CreatePriceParams, UpdatePriceParams, GetPriceParams, DeletePriceParams, FindPricesParams, PriceBatchOperation, BatchPricesParams } from "./types/price";
export type { GetZoneByKeyParams } from "./types/zone";
export type { GetTaxCategoryByKeyParams } from "./types/tax";
export type { GetSalesChannelByKeyParams } from "./types/salesChannel";
export type { LookupMarketZoneParams } from "./types/zone";
export type { MarketPaymentOption, MarketPaymentOptionStatus, CreateMarketPaymentOptionParams, GetMarketPaymentOptionParams, LookupMarketPaymentOptionParams, FindMarketPaymentOptionsParams, RemoveMarketPaymentOptionParams } from "./types/marketPaymentOption";
export type { GetShippingMethodByKeyParams } from "./types/shipping";
export type { SubscriptionSelf, SubscriptionSelfStatus } from "./types/subscription";
export type { JoinStorefrontCustomerGroupParams, GetStorefrontCustomerGroupMemberParams } from "./types/customerGroupMember";
export type { SubscribeStorefrontCustomerGroupEmailsParams, GetStorefrontCustomerGroupEmailConsentParams, ResendStorefrontCustomerGroupConfirmationParams } from "./types/customerGroupEmailConsent";

export type * from "./types/fulfillment";

export type { FindCustomerSubscriptionsParams } from "./types/subscription";
export type { CompanyCustomerAccess } from "./types/company";

export type { AnalyticsStatus, AnalyticsStatusEntity, AnalyticsStatusCount, AnalyticsStatusBreakdownData, AnalyticsDimensionCount, AnalyticsDimensionBreakdownData, AnalyticsCustomValue, AnalyticsFeedFactData } from "./api/analytics";
