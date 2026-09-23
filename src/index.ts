export { ScheduledResultTimeoutError } from "./utils/scheduledResult";
export { isValidKey, validateKey, toKey, nameToKey } from "./utils/keyValidation";
export { CartPresentationChangedError } from "./types/cartCheckout";
export type { ShippingLabelRequestResolution } from "./types/shippingLabel";
export { CartSelectionError } from "./types/cartSelection";
export {
  cartProductItems,
  cartBookingItems,
  cartDigitalItems,
  cartCustomerGroupPlanItems,
} from "./types/cart";
export {
  orderProductItems,
  orderBookingItems,
  orderDigitalItems,
  orderCustomerGroupPlanItems,
} from "./types/order";
export type { CartCheckoutRequest, RecoverCartCheckoutParams } from "./types/cartCheckout";
export type { InitialMarketInput } from "./types/api";
export type { GetEmailTemplatesParams, GetEmailTemplateParams, CreateEmailTemplateParams, UpdateEmailTemplateParams, DeleteEmailTemplateParams, PreviewEmailTemplateParams, PreviewEmailTemplateResponse } from "./types/api";
export type { GetFormsParams, GetFormsByIdsParams, GetFormParams, CreateFormParams, UpdateFormParams, DeleteFormParams, PermanentlyDeleteFormParams, SubmitFormParams, GetFormSubmissionsParams, GetFormSubmissionParams, DeleteFormSubmissionParams } from "./types/api";
export type { MarketStatus, MarketUsage } from "./types";
export type { CompanyAddress, CompanyProfile, CompanyEditableStatus, CompanyStatus, Company, CompanyUsage, CreateCompanyParams, GetCompanyParams, UpdateCompanyParams, DeleteCompanyParams, FindCompaniesParams } from "./types/company";
export type { CompanyMembershipEditableStatus, CompanyMembershipStatus, CompanyMembershipScope, CompanyMembership, CreateCompanyMembershipParams, GetCompanyMembershipParams, UpdateCompanyMembershipParams, DeleteCompanyMembershipParams, FindCompanyMembershipsParams } from "./types/companyMembership";
export type { CompanyPermission, CompanyRoleStatus, CompanyRole, CompanyRoleUsage, CreateCompanyRoleParams, GetCompanyRoleParams, UpdateCompanyRoleParams, DeleteCompanyRoleParams, FindCompanyRolesParams } from "./types/companyRole";
export type { CompanyLocationEditableStatus, CompanyLocationStatus, CompanyLocation, CreateCompanyLocationParams, GetCompanyLocationParams, UpdateCompanyLocationParams, DeleteCompanyLocationParams, FindCompanyLocationsParams } from "./types/companyLocation";
export type { CompanyLocationTaxSettings, CompanyLocationCommercePolicy, TaxRegistration, TaxRegistrationStatus, TaxExemption } from "./types/companyLocation";
export type { InventoryItem, InventoryItemStatus, InventoryItemEditableStatus, InventoryTracking, InventoryPhysical, InventoryCustoms, InventoryDimensions, CreateInventoryItemParams, UpdateInventoryItemParams, GetInventoryItemParams, GetInventoryItemByKeyParams, FindInventoryItemsParams, DeleteInventoryItemParams } from "./types/inventoryItem";
export type { InventoryLevel, CreateInventoryLevelParams, GetInventoryLevelParams, RemoveInventoryLevelParams, FindInventoryLevelsParams, InventoryMovement, InventoryMovementReason, ManualInventoryMovementReason, RecordInventoryMovementParams, GetInventoryMovementParams, FindInventoryMovementsParams, InventoryReservation, InventoryReservationSource, InventoryReservationStatus, ReservationUnitProgress, CreateManualInventoryReservationParams, ReleaseManualInventoryReservationParams, GetInventoryReservationParams, FindInventoryReservationsParams, UnitSpan } from "./types/inventory";
export type * from "./types/inventoryUnit";
export type * from "./types/return";
export type * from "./types/fulfillmentUnitSelection";
export type { Promotion, PromotionStatus, PromotionEditableStatus, PromotionActivation, PromotionStacking, PromotionEligibility, PromotionTarget, PromotionEffect, PromotionBuyRequirement, PromotionGetDiscount, PromotionProductVariantRef, CreatePromotionParams, UpdatePromotionParams, GetPromotionParams, GetPromotionByKeyParams, FindPromotionsParams, DeletePromotionParams, PromotionCode, PromotionCodeStatus, PromotionCodeEditableStatus, CreatePromotionCodeParams, UpdatePromotionCodeParams, GetPromotionCodeParams, GetPromotionCodeByCodeParams, FindPromotionCodesParams, DeletePromotionCodeParams } from "./types/promotion";
export type { TaxCategory, TaxCategoryStatus, TaxCategoryEditableStatus, CreateTaxCategoryParams, UpdateTaxCategoryParams, GetTaxCategoryParams, FindTaxCategoriesParams, DeleteTaxCategoryParams, TaxRate, TaxCalculation, TaxComponent, TaxTreatment, TaxRule, TaxRuleStatus, TaxRuleEditableStatus, CreateTaxRuleParams, UpdateTaxRuleParams, GetTaxRuleParams, FindTaxRulesParams, DeleteTaxRuleParams } from "./types/tax";
export type { PaymentTerms, PaymentTermsStatus, PaymentTermsEditableStatus, CreatePaymentTermsParams, UpdatePaymentTermsParams, GetPaymentTermsParams, FindPaymentTermsParams, DeletePaymentTermsParams } from "./types/paymentTerms";
export type { OrderCredit, OrderCreditAllocation, OrderCreditSource, OrderCreditStatus, CreditTarget, CreditMoney, DiscountReversal, TaxComponentReversal, DutyComponentReversal, CreateOrderCreditParams, GetOrderCreditParams, FindOrderCreditsParams } from "./types/orderCredit";
export type { CustomerPaymentMethod, CustomerPaymentMethodState, CustomerPaymentMethodCommand, CustomerPaymentMethodCommandType, CustomerPaymentMethodRevocation, CustomerPaymentMethodRevocationRecord, CustomerPaymentMethodRevocationRequest, NativeSetupOutcome, GetCustomerPaymentMethodParams, FindCustomerPaymentMethodsParams, FindCustomerPaymentMethodCommandsParams, RevokeCustomerPaymentMethodParams } from "./types/customerPaymentMethod";
export type { CustomerGroupEmailConsent, CustomerGroupEmailConsentStatus, CustomerGroupEmailConfirmation, CustomerGroupConfirmationEmailStatus, CustomerGroupConfirmationHistoryEntry, CustomerGroupConsentEvent, CustomerGroupConsentEventType, CustomerGroupConsentSource, CustomerGroupUnsubscribeReason, RecordCustomerGroupEmailDecision, SubscribeCustomerGroupEmailsParams, RecordCustomerGroupEmailConsentParams, ImportCustomerGroupEmailConsentEntry, ImportCustomerGroupEmailConsentsParams, ImportCustomerGroupEmailConsentsResult, ConfirmCustomerGroupEmailsParams, UnsubscribeCustomerGroupEmailsParams, ResendCustomerGroupConfirmationParams, GetCustomerGroupEmailConsentParams, FindCustomerGroupEmailConsentsParams, FindCustomerGroupEmailConsentHistoryParams } from "./types/customerGroupEmailConsent";
export type { Checkout, CheckoutState, CheckoutResult, CheckoutCartVersion, CheckoutLineBinding, CartLineItemRef, OrderLineItemRef, GetCheckoutParams, CheckoutQuote, CheckoutQuoteSources, CheckoutQuoteDeliveryBinding } from "./types/checkout";
export type { FulfillmentRoutingPolicy, FulfillmentRoutingStrategy, FulfillmentRoutingLocation, FulfillmentRoutingPolicyStatus, FulfillmentRoutingPolicyEditableStatus, CreateFulfillmentRoutingPolicyParams, UpdateFulfillmentRoutingPolicyParams, GetFulfillmentRoutingPolicyParams, GetFulfillmentRoutingPolicyByKeyParams, FindFulfillmentRoutingPoliciesParams, DeleteFulfillmentRoutingPolicyParams } from "./types/fulfillmentRouting";
export type { MarketSalesChannel, MarketSalesChannelStatus, CreateMarketSalesChannelParams, GetMarketSalesChannelParams, FindMarketSalesChannelsParams, RemoveMarketSalesChannelParams } from "./types/marketSalesChannel";
export type { StorefrontClientRegistration, StorefrontClientStatus, CreateStorefrontClientParams, UpdateStorefrontClientParams, RevokeStorefrontClientParams, GetStorefrontClientParams, FindStorefrontClientsParams } from "./types/storefrontClient";
export type { ShippingLabel, ShippingLabelStatus, ShippingLabelOwner, ShippingLabelQuoteOwner, ShippingLabelRequest, ShippingLabelPurchase, ShippingLabelQuoteRate, MerchantBalanceEffect, MerchantBalanceDirection, MerchantDebit, MerchantDebitStatus, StripePlatformDebitAuthorization, ShippingLabelRefund, ShippingLabelRefundStatus, ShippingLabelRefundStatusName, CarrierRefundEffect, MerchantDebitReversal, MerchantDebitReversalStatus, MerchantDebitReversalReason, QuoteShippingLabelParams, RequestShippingLabelParams, GetShippingLabelParams, FindShippingLabelsParams, RequestShippingLabelRefundParams, GetShippingLabelRefundParams, FindShippingLabelRefundsParams, RequestMerchantDebitReversalParams, GetMerchantDebitReversalParams, FindMerchantDebitReversalsParams } from "./types/shippingLabel";
export type { ShippingMethod, ShippingMethodType, ShippingMethodStatus, ShippingMethodEditableStatus, CreateShippingMethodParams, UpdateShippingMethodParams, GetShippingMethodParams, FindShippingMethodsParams, DeleteShippingMethodParams, ShippingRateCondition, ShippingRateWeightTier, ShippingRateAdjustment, ShippingRatePricing, ShippingRate, ShippingRateStatus, ShippingRateEditableStatus, CreateShippingRateParams, UpdateShippingRateParams, GetShippingRateParams, FindShippingRatesParams, DeleteShippingRateParams } from "./types/shipping";
export type { Zone, ZoneMatch, ZoneStatus, ZoneEditableStatus, CreateZoneParams, UpdateZoneParams, GetZoneParams, FindZonesParams, DeleteZoneParams, MarketZone, MarketZoneStatus, MarketZoneEditableStatus, CreateMarketZoneParams, UpdateMarketZoneParams, GetMarketZoneParams, FindMarketZonesParams, DeleteMarketZoneParams } from "./types/zone";
export type { ShippingProfile, ShippingProfileStatus, ShippingProfileEditableStatus, CreateShippingProfileParams, UpdateShippingProfileParams, GetShippingProfileParams, GetShippingProfileByKeyParams, FindShippingProfilesParams, DeleteShippingProfileParams } from "./types/shippingProfile";
export type { CustomerGroupEditableStatus, CustomerGroupStatus, CustomerGroupJoinPolicy, CustomerGroupConsentPolicy, CustomerGroupCommunication, CustomerGroup, CustomerGroupUsage, CreateCustomerGroupParams, GetCustomerGroupParams, GetCustomerGroupByKeyParams, UpdateCustomerGroupParams, DeleteCustomerGroupParams, FindCustomerGroupsParams, StorefrontCustomerGroup, GetStorefrontCustomerGroupParams } from "./types/customerGroup";
export type { CustomerGroupPlan, CustomerGroupPlanTerm, CustomerGroupPlanStatus, CustomerGroupPlanBenefit, CustomerGroupPlanBenefitType, CustomerGroupProductQuantity, CustomerGroupDeliverySchedule, CustomerGroupDigitalContent, RecurringCadence, RenewalRecoveryPolicy, BillingInterval, CreateCustomerGroupPlanParams, UpdateCustomerGroupPlanParams, GetCustomerGroupPlanParams, FindCustomerGroupPlansParams, StorefrontCustomerGroupPlan, StorefrontCustomerGroupPlanBenefit, FindStorefrontCustomerGroupPlansParams, GetStorefrontCustomerGroupPlanParams } from "./types/customerGroupPlan";
export type { CustomerGroupSubscription, CustomerGroupSubscriptionStatus, CustomerGroupPurchaseState, CustomerGroupCollectionBlock, GetCustomerGroupSubscriptionParams, FindCustomerGroupSubscriptionsParams, FindCustomerGroupSubscriptionOrdersParams, FindCustomerGroupSubscriptionCommandsParams, GetCurrentCustomerGroupSubscriptionParams } from "./types/customerGroupSubscription";
export type { CustomerGroupAdmission, CustomerGroupAdmissionSource, CustomerGroupAdministrativeAccess, CustomerGroupMember, CustomerGroupMemberSelf, CustomerGroupSelfAdmission, CustomerGroupJoinResult, CustomerGroupMemberCommandResponse, CustomerGroupMemberCommandReceipt, CustomerGroupMemberCommandResultType, GetCustomerGroupMemberByBindingParams, CustomerGroupJoinScope, CustomerGroupJoinRequest, JoinCustomerGroupParams, GetCustomerGroupMemberParams, FindCustomerGroupMembersParams, GetCurrentCustomerGroupMemberParams, FindCustomerGroupMemberCommandsParams, CustomerGroupMemberCommand, ExecuteCustomerGroupMemberCommandParams } from "./types/customerGroupMember";
export type { SalesChannelEditableStatus, SalesChannelStatus, SalesChannel, SalesChannelUsage, CreateSalesChannelParams, GetSalesChannelParams, UpdateSalesChannelParams, DeleteSalesChannelParams, FindSalesChannelsParams } from "./types/salesChannel";
export type { SellableRef } from "./types/sellable";
export type { OrderBooking, GetOrderBookingParams } from "./types/orderBooking";
export type { CancelPendingOrderParams, OrderCancellationReceipt } from "./types/orderCancellation";
export type * from "./types/storeCommerce";
export type { SellerProfile, SellerTaxRegistration } from "./types/orderContract";

export type {
  Assortment,
  AssortmentEditableStatus,
  AssortmentStatus,
  AssortmentUsage,
  CreateAssortmentParams,
  UpdateAssortmentParams,
  DeleteAssortmentParams,
  GetAssortmentParams,
  GetAssortmentByKeyParams,
  FindAssortmentsParams,
} from "./types/assortment";
export type {
  AssortmentItem,
  CreateAssortmentItemParams,
  UpdateAssortmentItemParams,
  DeleteAssortmentItemParams,
  GetAssortmentItemParams,
  FindAssortmentItemsParams,
} from "./types/assortmentItem";
export type {
  Catalog,
  CatalogEditableStatus,
  CatalogStatus,
  CatalogUsage,
  CreateCatalogParams,
  UpdateCatalogParams,
  DeleteCatalogParams,
  GetCatalogParams,
  GetCatalogByKeyParams,
  FindCatalogsParams,
} from "./types/catalog";
export type {
  CatalogEntitlement,
  CatalogEntitlementEditableStatus,
  CatalogEntitlementStatus,
  CreateCatalogEntitlementParams,
  UpdateCatalogEntitlementParams,
  DeleteCatalogEntitlementParams,
  GetCatalogEntitlementParams,
  FindCatalogEntitlementsParams,
} from "./types/catalogEntitlement";
export type { CatalogAccess, CatalogCondition } from "./types/catalogEntitlement";
export type { CatalogReadOptions } from "./types/catalog";
export type { PriceListUsage } from "./types/priceList";
export type { StorefrontProduct, StorefrontProductVariant, GetStorefrontProductVariantParams, FindStorefrontProductVariantsParams } from "./types/storefront";
export type { StorefrontCurrentCartParams, StorefrontUpdateCartParams, StorefrontAddCartProductParams, StorefrontAddCartBookingParams, StorefrontAddCartDigitalParams } from "./types/storefront";
export {
  epochMilliseconds,
  epochMillisecondsFromDate,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "./utils/time";
export type { EpochMilliseconds } from "./types/time";
export type { CompanySnapshot, PurchaseCustomerSnapshot, PurchaseOrigin, PurchaseQuoteContext, SalesChannelSnapshot } from "./types/commerce";
export type { CustomerGroupAcceptedTerms, CustomerGroupPlanSnapshot, CustomerGroupBenefitSnapshot, CustomerGroupBenefitSnapshotType, CustomerGroupProductSnapshot, CustomerGroupDigitalSnapshot, CustomerGroupDeliveryTerms, CustomerGroupPurchaseOccurrence, OrderCustomerGroupTerms, OrderAccessRevocation } from "./types/commerce";
export type * from "./types/orderMoney";
export type * from "./types/orderLineItem";
export type { OrderLinePrice, OrderInventoryRequirementSnapshot, OrderProductFulfillmentSnapshot, AcceptedAsset, OrderDigitalContent } from "./types/orderSnapshot";
export type { CheckoutProductSnapshot, CheckoutBookingSnapshot, CheckoutDigitalSnapshot, QuotedProductMoneyRun, CustomerGroupBenefitOrderQuoteLine, QuotedDeliveryGroup, QuotedShippingOffer, QuotedDeliveryPricing, ShippingDeliveryEstimate } from "./types/quote";
export type { OrderDeliveryGroup, OrderDeliveryGroupItem, OrderDeliveryDestinationSnapshot, AcceptedDeliveryPricing, AcceptedDeliveryCalculation, AcceptedCarrierQuoteLeg } from "./types/orderContract";
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
export { createStripeEmbeddedCheckout, mountCheckoutAction } from "./checkout";
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
  CartProductItem,
  CartBookingItem,
  CartDigitalItem,
  CartCustomerGroupPlanItem,
  Cart,
  CartStatus,
  EshopStoreState,
  Store,
  StoreBranding,
  StoreBrandingPresentation,
  UpdateStoreBrandingParams,
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
  StripeInvoicePaymentObject,
  PaymentProviderBinding,
  PaymentCheckoutExpiration,
  BillingPeriod,
  PaymentAmounts,
  PaymentCaptureEvidence,
  CaptureFinancialEffect,
  PaymentCaptureStatus,
  OrderPaymentCapture,
  RecordedCollection,
  RecordCashOnDeliveryCollectionParams,
  RecordManualCollectionParams,
  CreateManualPaymentParams,
  OrderMoney,
  OrderPromotionSnapshot,
  PaymentProvider,
  PaymentProviderConfiguration,
  MonriEnvironment,
  PaymentProviderConfigurationType,
  PaymentProviderConnectResponse,
  StripeConnectionOperation,
  StripeConnectionEffectStatus,
  StripePlatformDebitConsent,
  StripeProviderConnection,
  PaymentProviderStatus,
  TaxMode,
  AccountActor,
  AccountActorSnapshot,
  AccountCredentialType,
  RefundApplication,
  RefundRequester,
  SystemRefundReason,
  Refund,
  RefundProvider,
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
  CustomerGroupOrderQuoteLine,
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
  SubscriptionPlan,
  SubscriptionPlanFeature,
  SubscriptionPlanFeatureType,
  SubscriptionPrice,
  StorefrontPrice,
  AppliedPriceSnapshot,
  AppliedPriceSource,
  DisplayTextSnapshot,
  OrderCustomerGroupPlanItem,
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
  FulfillmentOrderStatus,
  FulfillmentOrderLine,
  FulfillmentOrderLineSource,
  FulfillmentUnitSpan,
  FulfillmentOrder,
  FulfillmentRecipient,
  FulfillmentCompanyRecipient,
  FulfillmentWindow,
  Parcel,
  FulfillmentExecution,
  OrderShipmentLine,
  ShipmentUnitBinding,
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
  ServiceDuration,
  Weekday,
  WorkingWindow,
  WeeklyAvailability,
  DateOverride,
  TimeRange,
  Order,
  OrderType,
  OrderPurchaseSource,
  OrderFinancialSummary,
  OrderFinancialConcern,
  GetOrderFinancialSummaryParams,
  PurchaseOriginSnapshot,
  MarketSnapshot,
  SellerSnapshot,
  OrderInvoicePolicy,
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
  Customer,
  CustomerListItem,
  CustomerIdentity,
  CustomerEmailVerification,
  CustomerSessionRecord,
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
  WorkflowStatus,
  MutableWorkflowStatus,
  WorkflowSendEmailNode,
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
  FindCustomerIdentitiesParams,
  CustomerIdentityCommandParams,
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
  FindBookingOfferingsParams,
  GetBookingOfferingByBindingParams,
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
  CartCustomerGroupPlanInput,
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
  AddCartCustomerGroupPlanParams,
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
  FindOrderShipmentsParams,
  FindFulfillmentOrdersParams,
  GetFulfillmentOrderParams,
  GetOrderShipmentParams,
  CreateOrderShipmentParams,
  DispatchOrderShipmentParams,
  CancelOrderShipmentParams,
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
  GetWorkflowsParams,
  GetWorkflowExecutionsParams,
  GetWorkflowExecutionParams,
  GetWorkflowConnectionParams,
  GetWorkflowConnectionsParams,
  GetWorkflowParams,
  CreateWorkflowParams,
  UpdateWorkflowParams,
  DeleteWorkflowParams,
  SendLeadResearchMessageParams,
  FindLeadResearchMessagesParams,
  RetryLeadResearchMessageParams,
  CancelLeadResearchMessageParams,
  CancelSocialPostParams,
  ConnectStripePaymentProviderParams,
  GetStripeConnectionOperationParams,
  ConnectSocialConnectionParams,
  CreateSocialMessageParams,
  CreateSocialPostParams,
  DisconnectSocialConnectionParams,
  FindSocialConnectionsParams,
  GetSocialConnectionParams,
  FindSocialMessagesParams,
  FindSocialPostsParams,
  OpenStripeDashboardParams,
  GetSocialPostParams,
  CreateLocalPaymentProviderParams,
  CreateMonriPaymentProviderParams,
  ListPaymentProvidersParams,
  ConfigurationPageParams,
  GetStoreConfigurationByKeyParams,
  GetStoreConfigurationParams,
  GetPaymentProviderParams,
  GetPaymentProviderByConfigurationParams,
  FindMarketsParams,
  FindStoreLocationsParams,
  FindStorefrontMarketsParams,
  FindStorefrontLocationsParams,
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
  StorefrontCheckoutQuote,
  StorefrontLocation,
  StorefrontMarket,
  StorefrontPaymentProvider,
  StorefrontSetup,
  StorefrontVisitorSessionRecord,
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
  type CartControllerAddCustomerGroupPlanParams,
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

export function storeCommerceDefaults(
  store: Pick<Store, "commerce">,
): { default_market_id: string; default_sales_channel_id: string } | null {
  return store.commerce.type === "ready"
    ? {
        default_market_id: store.commerce.default_market_id,
        default_sales_channel_id: store.commerce.default_sales_channel_id,
      }
    : null;
}

export const SDK_VERSION = "0.26.36";
export const SUPPORTED_FRAMEWORKS = [
  "astro",
  "react",
  "vue",
  "svelte",
  "vanilla",
] as const;


export interface AdminSession {
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
import { createAssortmentApi } from "./api/assortment";
import { createAssortmentItemApi } from "./api/assortmentItem";
import { createCatalogApi } from "./api/catalog";
import { createCatalogEntitlementApi } from "./api/catalogEntitlement";
import { createPriceApi } from "./api/price";
import { createProductVariantApi } from "./api/productVariant";
import { createInventoryItemApi } from "./api/inventoryItem";
import { createInventoryLevelApi } from "./api/inventoryLevel";
import { createInventoryUnitApi } from "./api/inventoryUnit";
import { createReturnApi } from "./api/return";
import { createInventoryMovementApi } from "./api/inventoryMovement";
import { createInventoryReservationApi } from "./api/inventoryReservation";
import { createShippingProfileApi } from "./api/shippingProfile";
import { createZoneApi } from "./api/zone";
import { createMarketZoneApi } from "./api/marketZone";
import { createTaxCategoryApi } from "./api/taxCategory";
import { createPaymentTermsApi } from "./api/paymentTerms";
import { createOrderCreditApi } from "./api/orderCredit";
import { createOrderInvoiceApi } from "./api/orderInvoice";
import { createOrderPickupApi } from "./api/orderPickup";
import { createCustomerPaymentMethodApi } from "./api/customerPaymentMethod";
import { createCustomerGroupEmailConsentApi } from "./api/customerGroupEmailConsent";
import { createCheckoutApi } from "./api/checkoutRecord";
import { createFulfillmentRoutingPolicyApi } from "./api/fulfillmentRoutingPolicy";
import { createMarketSalesChannelApi } from "./api/marketSalesChannel";
import { createStorefrontClientApi } from "./api/storefrontClient";
import { createStoreAdminDomainApi } from "./api/storeAdminDomain";
export type * from "./types/storeAdminDomain";
import {
  createShippingLabelApi,
  createShippingLabelRefundApi,
  createMerchantDebitReversalApi,
} from "./api/shippingLabel";
import { createTaxRuleApi } from "./api/taxRule";
import { createShippingMethodApi } from "./api/shippingMethod";
import { createShippingRateApi } from "./api/shippingRate";
import { createPromotionApi } from "./api/promotion";
import { createPromotionCodeApi } from "./api/promotionCode";
import { createPriceListApi } from "./api/priceList";
import { createCompanyApi } from "./api/company";
import { createCompanyMembershipApi } from "./api/companyMembership";
import { createCompanyRoleApi } from "./api/companyRole";
import { createCompanyLocationApi } from "./api/companyLocation";
import { createCustomerGroupApi } from "./api/customerGroup";
import { createCustomerGroupMemberApi } from "./api/customerGroupMember";
import { createCustomerGroupSubscriptionApi } from "./api/customerGroupSubscription";
import { createCustomerGroupPlanApi } from "./api/customerGroupPlan";
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
import { createWorkflowApi } from "./api/workflow";
import { createPlatformApi } from "./api/platform";
import { createShippingApi } from "./api/shipping";
import { createPaymentProviderApi } from "./api/paymentProvider";
import { createPaymentApi } from "./api/payment";
import { createRefundApi } from "./api/refund";
import { createPaymentDisputeApi } from "./api/paymentDispute";
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

    getFreeToSellStock,
    getReservedStock,
    hasStock,
    getInventoryAt,
    getFirstAvailableStoreLocationId,
  };
}

const ADMIN_STORAGE_KEY = "arky_admin_session:v2";

function readAdminSession(): AdminSessionInternal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored) || stored.version !== 2 || !isRecord(stored.session)) {
      return null;
    }
    const session = stored.session;
    if (
      typeof session.access_token !== "string" ||
      typeof session.refresh_token !== "string" ||
      !isRecord(session.scope) ||
      !(session.scope.type === 'account' || (session.scope.type === 'store' && typeof session.scope.store_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(session.scope.store_id))) ||
      (session.access_expires_at !== undefined &&
        !isEpochMilliseconds(session.access_expires_at)) ||
      (session.email !== undefined && typeof session.email !== "string")
    ) {
      return null;
    }
    return session as unknown as AdminSessionInternal;
  } catch {
    return null;
  }
}

function writeAdminSession(s: AdminSessionInternal | null): void {
  if (typeof window === "undefined") return;
  if (s) {
    if (
      s.access_expires_at !== undefined &&
      !isEpochMilliseconds(s.access_expires_at)
    ) {
      throw new RangeError(
        "Account access expiry must be signed safe-integer epoch milliseconds",
      );
    }
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({ version: 2, session: s }),
    );
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
    return s ? { email: s.email, scope: s.scope } : null;
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
  const customersApi = createCustomersApi(apiConfig);
  const emailSuppressionApi = createEmailSuppressionApi(apiConfig);
  const actionsApi = createActionsApi(apiConfig);
  const mailboxApi = createMailboxApi(apiConfig);
  const campaignApi = createCampaignApi(apiConfig);
  const supportApi = createAdminSupportApi(apiConfig);
  const leadResearchApi = createLeadResearchApi(apiConfig);
  const socialApi = createSocialApi(apiConfig);
  const paymentProviderApi = createPaymentProviderApi(apiConfig);
  const paymentApi = createPaymentApi(apiConfig);
  const refundApi = createRefundApi(apiConfig);
  const paymentDisputeApi = createPaymentDisputeApi(apiConfig);
  const shippingApi = createShippingApi(apiConfig);
  const locationApi = createLocationApi(apiConfig);
  const marketApi = createMarketApi(apiConfig);
  const workflowApi = createWorkflowApi(apiConfig);
  const storePaymentProviderApi = {
    monri: { create: paymentProviderApi.createMonri },
    list: paymentProviderApi.list,
    get: paymentProviderApi.get,
    getByKey: paymentProviderApi.getByKey,
    getByConfiguration: paymentProviderApi.getByConfiguration,
    create: paymentProviderApi.create,
    stripe: {
      connect: paymentProviderApi.connectStripe,
      getConnection: paymentProviderApi.getStripeConnection,
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
    getConnection: workflowApi.getWorkflowConnection,
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
      zone: createZoneApi(apiConfig),
      marketZone: createMarketZoneApi(apiConfig),
      taxCategory: createTaxCategoryApi(apiConfig),
      taxRule: createTaxRuleApi(apiConfig),
      shippingMethod: createShippingMethodApi(apiConfig),
      shippingRate: createShippingRateApi(apiConfig),
      shippingProfile: createShippingProfileApi(apiConfig),
      paymentTerms: createPaymentTermsApi(apiConfig),
      marketSalesChannel: createMarketSalesChannelApi(apiConfig),
      storefrontClient: createStorefrontClientApi(apiConfig),
      adminDomain: createStoreAdminDomainApi(apiConfig),
      create: storeApi.createStore,
      update: storeApi.updateStore,
      get: storeApi.getStore,
      branding: {
        get: storeApi.getBranding,
        update: storeApi.updateBranding,
      },
      find: storeApi.getStores,
      requestDeletion: storeApi.requestDeletion,
      commerce: {
        initialize: storeApi.initializeCommerce,
        getInitialization: storeApi.getCommerceInitialization,
        abortInitialization: storeApi.abortCommerceInitialization,
      },
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
        getOwn: storeApi.getOwnMembership,
        remove: storeApi.removeMember,
        transferOwnership: storeApi.transferOwnership,
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
      salesChannel: createSalesChannelApi(apiConfig),
      paymentProvider: storePaymentProviderApi,
    },
    media: createMediaApi(apiConfig),
    companies: {
      ...createCompanyApi(apiConfig),
      membership: createCompanyMembershipApi(apiConfig),
      role: createCompanyRoleApi(apiConfig),
      location: createCompanyLocationApi(apiConfig),
    },
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
      findByIds: formsApi.getFormsByIds,
      getSubmissions: formsApi.getSubmissions,
      getSubmission: formsApi.getSubmission,
      deleteSubmission: formsApi.deleteSubmission,
    },
    eshop: {
      payment: paymentApi,
      price: createPriceApi(apiConfig),
      priceList: createPriceListApi(apiConfig),
      customerGroup: createCustomerGroupApi(apiConfig),
      customerGroupPlan: createCustomerGroupPlanApi(apiConfig),
      customerGroupMember: createCustomerGroupMemberApi(apiConfig),
      customerGroupSubscription: createCustomerGroupSubscriptionApi(apiConfig),
      customerPaymentMethod: createCustomerPaymentMethodApi(apiConfig),
      customerGroupEmailConsent: createCustomerGroupEmailConsentApi(apiConfig),
      assortment: createAssortmentApi(apiConfig),
      assortmentItem: createAssortmentItemApi(apiConfig),
      catalog: createCatalogApi(apiConfig),
      catalogEntitlement: createCatalogEntitlementApi(apiConfig),
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
      inventoryReservation: createInventoryReservationApi(apiConfig),
      orderCredit: createOrderCreditApi(apiConfig),
      invoice: createOrderInvoiceApi(apiConfig),
      pickup: createOrderPickupApi(apiConfig),
      checkout: createCheckoutApi(apiConfig),
      fulfillmentRoutingPolicy: createFulfillmentRoutingPolicyApi(apiConfig),
      order: {
        update: eshopApi.updateOrder,
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
      },
      shipment: {
        create: shippingApi.createOrderShipment,
        get: shippingApi.getOrderShipment,
        find: shippingApi.findOrderShipments,
        dispatch: shippingApi.dispatchOrderShipment,
        cancel: shippingApi.cancelOrderShipment,
        fulfillment: {
          find: shippingApi.findFulfillmentOrders,
          get: shippingApi.getFulfillmentOrder,
          resolveUnitSlots: shippingApi.resolveFulfillmentUnitSlots,
        },
      },
      shippingLabel: createShippingLabelApi(apiConfig),
      shippingLabelRefund: createShippingLabelRefundApi(apiConfig),
      merchantDebitReversal: createMerchantDebitReversalApi(apiConfig),
      cart: {
        create: eshopApi.createCart,
        update: eshopApi.updateCart,
        get: eshopApi.getCart,
        find: eshopApi.getCarts,
        addProduct: eshopApi.addCartProduct,
        addBooking: eshopApi.addCartBooking,
        addDigital: eshopApi.addCartDigitalProduct,
        addCustomerGroupPlan: eshopApi.addCartCustomerGroupPlan,
        removeItem: eshopApi.removeCartItem,
        clear: eshopApi.clearCart,
        quote: eshopApi.quoteCart,
        checkout: eshopApi.checkoutCart,
        pendingCheckout: eshopApi.pendingCartCheckout,
        recoverCheckout: eshopApi.recoverCartCheckout,
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
        getByBinding: eshopApi.getBookingOfferingByBinding,
        create: eshopApi.createBookingOffering,
        update: eshopApi.updateBookingOffering,
        delete: eshopApi.deleteBookingOffering,
        find: eshopApi.findBookingOfferings,
      },
    },
    customers: {
      emailSuppression: emailSuppressionApi,
      create: customersApi.create,
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
    customer_groups: storefrontApi.customer_groups,
    customer_group_plans: storefrontApi.customer_group_plans,
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
export type { PriceEditableStatus, PriceStatus, ManualPriceInput, ManualPrice, CreatePriceParams, UpdatePriceParams, GetPriceParams, DeletePriceParams, FindPricesParams } from "./types/price";
export type { PriceList, PriceListEditableStatus, PriceListStatus, CreatePriceListParams, UpdatePriceListParams, GetPriceListParams, DeletePriceListParams, FindPriceListsParams } from "./types/priceList";
export type { GetPriceListByKeyParams } from "./types/priceList";
export type { GetZoneByKeyParams } from "./types/zone";
export type { GetTaxCategoryByKeyParams } from "./types/tax";
export type { GetSalesChannelByKeyParams } from "./types/salesChannel";
export type { GetMarketZoneByBindingParams } from "./types/zone";
export type { GetMarketSalesChannelByBindingParams } from "./types/marketSalesChannel";
export type { GetShippingMethodByKeyParams } from "./types/shipping";
export type { CustomerGroupSubscriptionSelf, CustomerGroupSubscriptionSelfStatus } from "./types/customerGroupSubscription";
export type { OrderPickup, OrderPickupLine, OrderPickupStatus, FindOrderPickupsParams, GetOrderPickupParams } from "./types/orderPickup";
export type { OrderInvoice, OrderInvoiceState, OrderInvoiceProvider, OrderInvoiceReconciliation, FiscalDocument, DocumentArtifact, FindOrderInvoicesParams, GetOrderInvoiceParams } from "./types/orderInvoice";
