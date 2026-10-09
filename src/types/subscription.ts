import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { AccountActor, Actor, PostalAddress, SortDirection } from "./common";
import type { OrderDeliveryDestination } from "./order";
import type { CatalogPriceFilter, StorefrontPrice } from "./product";
import type { CatalogReadOptions } from "./catalog";

export type SubscriptionOfferingStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };

export interface SubscriptionPlanTransition {
  from_subscription_plan_id: string;
  to_subscription_plan_id: string;
}

export interface SubscriptionOffering {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  transitions: SubscriptionPlanTransition[];
  status: SubscriptionOfferingStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type BillingInterval = "day" | "week" | "month" | "year";

export interface RecurringCadence {
  interval: BillingInterval;
  interval_count: number;
}

export type RenewalExhaustionAction = { type: "pause" } | { type: "cancel" };

export type UnpaidRenewalDisposition = { type: "retain_debt" } | { type: "cancel_unfulfilled" };

export interface RenewalRecoveryPolicy {
  retry_offsets_seconds: number[];
  recovery_window_seconds: number;
  on_exhaustion: RenewalExhaustionAction;
  unpaid_order: UnpaidRenewalDisposition;
}

export type SubscriptionCommitmentEndAction =
  | { type: "renew" }
  | { type: "renew_once" }
  | { type: "continue_without_term" }
  | { type: "stop" };

export interface SubscriptionCommitment {
  occurrences: number;
  end_action: SubscriptionCommitmentEndAction;
}

export type SubscriptionPlanTerm =
  | { type: "permanent" }
  | {
      type: "recurring";
      cadence: RecurringCadence;
      recovery_policy: RenewalRecoveryPolicy;
      commitment: SubscriptionCommitment | null;
    };

export type SubscriptionProductQuantity =
  | { type: "per_period"; quantity: number }
  | { type: "per_delivery"; quantity: number };

export type SubscriptionDeliverySchedule =
  | { type: "none" }
  | { type: "once"; offset_days: number; window_days: number }
  | { type: "repeating"; cadence: RecurringCadence; offset_days: number; window_days: number };

export type SubscriptionDigitalContent = { type: "accepted_assets" } | { type: "current_bundle" };

export type SubscriptionPurchaseLimitPeriodPolicy =
  | { type: "subscription_period" }
  | { type: "calendar_month"; timezone: string };

export type PurchaseLimitRestoration =
  | { type: "cancellation_only" }
  | { type: "cancellation_and_accepted_return" };

export interface PurchaseLimitDefinition {
  id: string;
  variant_ids: string[];
  period: SubscriptionPurchaseLimitPeriodPolicy;
  max_quantity: number;
  restoration: PurchaseLimitRestoration;
}

export type SubscriptionPlanEntitlementType =
  | {
      type: "product";
      variant_id: string;
      quantity: SubscriptionProductQuantity;
      delivery: SubscriptionDeliverySchedule;
    }
  | { type: "digital"; variant_id: string; content: SubscriptionDigitalContent }
  | { type: "rental"; variant_id: string; quantity: number; tax_category_id: string }
  | {
      type: "purchase_access";
      variant_ids: string[];
      catalog_ids: string[];
      limits: PurchaseLimitDefinition[];
      tax_category_id: string;
    };

export interface SubscriptionPlanEntitlement {
  id: string;
  type: SubscriptionPlanEntitlementType;
  allocation_weight: number;
}

export type PurchaseRequirementUnit = { type: "count" } | { type: "millilitres" };

export type PurchaseRequirementPeriod = { type: "calendar_month"; timezone: string };

export interface PurchaseRequirementVariant {
  variant_id: string;
  contribution_per_unit: number;
}

export interface PurchaseRequirement {
  unit: PurchaseRequirementUnit;
  minimum_quantity: number;
  period: PurchaseRequirementPeriod;
  qualifying_variants: PurchaseRequirementVariant[];
}

export type SubscriptionTaxGroupQuantity =
  | { type: "package" }
  | { type: "entitlement"; entitlement_id: string };

export interface SubscriptionTaxGroup {
  id: string;
  entitlement_ids: string[];
  tax_category_id: string;
  context_entitlement_id: string;
  quantity: SubscriptionTaxGroupQuantity;
}

export type SubscriptionPlanTaxPolicyType =
  | { type: "per_entitlement" }
  | { type: "grouped"; groups: SubscriptionTaxGroup[] };

export interface SubscriptionPlanTaxPolicy {
  id: string;
  zone_id: string;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  type: SubscriptionPlanTaxPolicyType;
}

export type SubscriptionPlanStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };

export interface SubscriptionPlan {
  id: string;
  store_id: string;
  subscription_offering_id: string;
  key: string;
  blocks: Block[];
  term: SubscriptionPlanTerm;
  entitlements: SubscriptionPlanEntitlement[];
  purchase_requirement: PurchaseRequirement | null;
  tax_policies: SubscriptionPlanTaxPolicy[];
  status: SubscriptionPlanStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SubscriptionPlanPrice =
  | { type: "catalog"; price_id: string; catalog_id: string }
  | { type: "manual"; catalog_id: string; actor: AccountActor; reason: string }
  | { type: "offer" };

export interface SubscriptionPlanSnapshot {
  subscription_plan_id: string;
  term: SubscriptionPlanTerm;
  purchase_requirement: PurchaseRequirement | null;
  unit_price: number;
  price: SubscriptionPlanPrice;
  entitlements: SubscriptionPlanEntitlement[];
}

export interface SubscriptionDeliveryTerms {
  id: string;
  entitlement_ids: string[];
  destination: OrderDeliveryDestination;
  shipping_method_id: string;
  shipping_profile_id: string;
  base_fee: number;
}

export interface SubscriptionAcceptedTerms {
  plan: SubscriptionPlanSnapshot;
  deliveries: SubscriptionDeliveryTerms[];
  billing_address: PostalAddress | null;
}

export interface BillingPeriod {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export type SubscriptionPurchaseOccurrence =
  | { type: "permanent"; starts_at: EpochMilliseconds }
  | { type: "period"; occurrence_index: number; period: BillingPeriod };

export type SubscriptionSubject =
  | { type: "personal" }
  | { type: "company"; company_id: string };

export type SubscriptionPurchaseState =
  | { type: "one_time" }
  | { type: "recurring"; next_occurrence_index: number };

export type SubscriptionBlockCause =
  | { type: "period_missed" }
  | { type: "order_unpaid"; order_id: string }
  | { type: "payment_method_not_ready" }
  | { type: "customer_not_active" }
  | { type: "company_not_active" }
  | { type: "purchase_order_number_required" }
  | { type: "entitlement_unavailable"; entitlement_id: string };

export type SubscriptionPauseCause =
  | { type: "requested"; by: Actor; reason: string }
  | { type: "renewal_unpaid"; order_id: string };

export type SubscriptionStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked"; cause: SubscriptionBlockCause; blocked_at: EpochMilliseconds }
  | { type: "paused"; cause: SubscriptionPauseCause; paused_at: EpochMilliseconds }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export interface Subscription {
  id: string;
  store_id: string;
  order_id: string;
  order_subscription_line_item_id: string;
  customer_id: string;
  subject: SubscriptionSubject;
  purchases: SubscriptionPurchaseState;
  status: SubscriptionStatus;
  purchase_end_at: EpochMilliseconds | null;
  access_end_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type SubscriptionSelfStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked"; cause: SubscriptionBlockCause; blocked_at: EpochMilliseconds }
  | { type: "paused"; paused_at: EpochMilliseconds }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export interface SubscriptionSelf extends Omit<Subscription, "status"> {
  status: SubscriptionSelfStatus;
}

export type SubscriptionRevisionChange =
  | { type: "amend_terms" }
  | { type: "change_payment_method" }
  | { type: "resume" }
  | { type: "skip_next" }
  | { type: "purchase_requirement" }
  | { type: "correct_tax_classification"; actor: AccountActor; reason: string };

export type SubscriptionRevisionOrigin =
  | { type: "initial" }
  | { type: "change"; previous_revision_id: string; change: SubscriptionRevisionChange };

export type SubscriptionTermsSource =
  | { type: "revision"; source_revision_id: string }
  | { type: "snapshot"; terms: SubscriptionAcceptedTerms };

export type SubscriptionSchedule =
  | { type: "one_time"; timezone: string }
  | { type: "recurring"; timezone: string; anchor: EpochMilliseconds; first_period_offset: number };

export type SubscriptionCollection =
  | { type: "free" }
  | { type: "payment_method"; payment_method_id: string };

export interface SubscriptionCollectionAuthorization {
  by: Actor;
  accepted_at: EpochMilliseconds;
}

export type SubscriptionRevisionStatus =
  | { type: "accepted" }
  | { type: "withdrawn"; by: Actor; reason: string; withdrawn_at: EpochMilliseconds };

export interface SubscriptionRevision {
  id: string;
  store_id: string;
  subscription_id: string;
  origin: SubscriptionRevisionOrigin;
  effective_from_occurrence: number;
  terms: SubscriptionTermsSource;
  schedule: SubscriptionSchedule;
  collection: SubscriptionCollection;
  authorization: SubscriptionCollectionAuthorization;
  status: SubscriptionRevisionStatus;
  created_at: EpochMilliseconds;
}

export interface SubscriptionCurrent {
  subscription: SubscriptionSelf;
  revision: SubscriptionRevision;
  terms: SubscriptionAcceptedTerms;
  head_revision_id: string;
}

export interface SubscriptionPurchaseLimitPeriod {
  id: string;
  store_id: string;
  subscription_id: string;
  entitlement_id: string;
  limit_id: string;
  period: BillingPeriod;
  counted_quantity: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PurchaseAccessLimitAvailability {
  rule: PurchaseLimitDefinition;
  period: BillingPeriod;
  subscription_purchase_limit_period_id: string | null;
  counted_quantity: number;
  remaining_quantity: number;
}

export interface SubscriptionPurchaseAccessGrant {
  order_id: string;
  order_purchase_access_line_item_id: string;
  entitlement_id: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  variant_ids: string[];
  catalog_id: string;
  limits: PurchaseAccessLimitAvailability[];
}

export interface SubscriptionPurchaseAccessPage {
  subscription_id: string;
  catalog_id: string;
  sales_channel_id: string;
  as_of: EpochMilliseconds;
  grants: SubscriptionPurchaseAccessGrant[];
  cursor: string | null;
}

export interface SubscriptionPurchaseRequirement {
  subscription: Subscription;
  company_id: string;
  company_location_id: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  evaluated_at: EpochMilliseconds;
  initial: PurchaseRequirement | null;
  current: PurchaseRequirement | null;
}

export type SubscriptionControlType =
  | { type: "pause"; reason: string }
  | { type: "cancel"; reason: string };

export type SubscriptionChangeEnd =
  | { type: "from_here_onward" }
  | { type: "before"; occurrence_index: number };

export interface SubscriptionChangeVersion {
  subscription_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface SubscriptionFundingChange extends SubscriptionChangeVersion {
  first_occurrence: number;
  end: SubscriptionChangeEnd;
  payment_method_id: string;
  reason: string;
}

export type SubscriptionCalendarChangeType = "resume" | "skip_next";

export interface SubscriptionCalendarBoundary {
  effective_from_occurrence: number;
  schedule: SubscriptionSchedule;
}

export interface SubscriptionCalendarChange extends SubscriptionChangeVersion {
  first_occurrence: number;
  end: SubscriptionChangeEnd;
  type: SubscriptionCalendarChangeType;
  calendars: SubscriptionCalendarBoundary[];
  reason: string;
}

export type SubscriptionRentalChange =
  | { type: "continue"; rental_id: string; to_entitlement_id: string }
  | { type: "return"; rental_id: string };

export interface SubscriptionPlanChange extends SubscriptionChangeVersion {
  to_subscription_plan_id: string;
  catalog_id?: string;
  rentals: SubscriptionRentalChange[];
  reason: string;
}

export interface SubscriptionTaxClassificationChange {
  entitlement_id: string;
  tax_category_id: string;
}

export interface SubscriptionTaxCorrection extends SubscriptionChangeVersion {
  changes: SubscriptionTaxClassificationChange[];
  reason: string;
}

export interface SubscriptionPurchaseRequirementChange extends SubscriptionChangeVersion {
  requirement: PurchaseRequirement | null;
  reason: string;
}

export interface SubscriptionRevisionBoundary {
  effective_from_occurrence: number;
  terms: SubscriptionAcceptedTerms;
  schedule: SubscriptionSchedule;
  collection: SubscriptionCollection;
}

export interface SubscriptionChangeResult {
  subscription: Subscription;
  created: SubscriptionRevision[];
  withdrawn: SubscriptionRevision[];
  timeline: SubscriptionRevisionBoundary[];
}

export interface SubscriptionCalendarOptions {
  subscription: Subscription;
  next_occurrence_index: number;
  timeline: SubscriptionRevisionBoundary[];
  skip_next_schedule: SubscriptionSchedule | null;
}

export interface StorefrontSubscriptionOffering {
  id: string;
  key: string;
  blocks: Block[];
  transitions: SubscriptionPlanTransition[];
}

export interface StorefrontSubscriptionPlanEntitlement {
  id: string;
  type: SubscriptionPlanEntitlementType;
}

export interface StorefrontSubscriptionPlan {
  id: string;
  subscription_offering_id: string;
  key: string;
  blocks: Block[];
  term: SubscriptionPlanTerm;
  entitlements: StorefrontSubscriptionPlanEntitlement[];
  purchase_requirement: PurchaseRequirement | null;
  price: StorefrontPrice | null;
}

export interface CreateSubscriptionOfferingParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  status: SubscriptionOfferingStatus;
}

export interface UpdateSubscriptionOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  transitions: SubscriptionPlanTransition[];
  status: SubscriptionOfferingStatus;
}

export interface DeleteSubscriptionOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetSubscriptionOfferingParams {
  store_id: string;
  id: string;
}

export interface GetSubscriptionOfferingByKeyParams {
  store_id: string;
  key: string;
}

export interface FindSubscriptionOfferingsParams {
  store_id: string;
  key?: string;
  status?: SubscriptionOfferingStatus["type"];
  query?: string;
  sort_field?: "key" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateSubscriptionPlanParams {
  store_id: string;
  id: string;
  subscription_offering_id: string;
  key: string;
  blocks: Block[];
  term: SubscriptionPlanTerm;
  entitlements: SubscriptionPlanEntitlement[];
  purchase_requirement: PurchaseRequirement | null;
  tax_policies: SubscriptionPlanTaxPolicy[];
  status: SubscriptionPlanStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface UpdateSubscriptionPlanParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  term: SubscriptionPlanTerm;
  entitlements: SubscriptionPlanEntitlement[];
  purchase_requirement: PurchaseRequirement | null;
  tax_policies: SubscriptionPlanTaxPolicy[];
  status: SubscriptionPlanStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeleteSubscriptionPlanParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetSubscriptionPlanParams {
  store_id: string;
  id: string;
}

export interface FindSubscriptionPlansParams {
  store_id: string;
  subscription_offering_id?: string;
  key?: string;
  status?: SubscriptionPlanStatus["type"];
  query?: string;
  sort_field?: "key" | "created_at" | "status";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetSubscriptionParams {
  store_id: string;
  id: string;
}

export interface FindSubscriptionsParams {
  store_id: string;
  customer_id?: string;
  company_id?: string;
  order_id?: string;
  status?: SubscriptionStatus["type"];
  subscription_plan_id?: string;
  subscription_offering_id?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface FindSubscriptionRevisionsParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface SubscriptionRevisionDetail {
  revision: SubscriptionRevision;
  terms: SubscriptionAcceptedTerms;
}

export type SubscriptionSelfRevisionChange =
  | { type: "amend_terms" }
  | { type: "change_payment_method" }
  | { type: "resume" }
  | { type: "skip_next" }
  | { type: "purchase_requirement" }
  | { type: "correct_tax_classification" };

export type SubscriptionSelfRevisionOrigin =
  | { type: "initial" }
  | { type: "change"; previous_revision_id: string; change: SubscriptionSelfRevisionChange };

export type SubscriptionSelfPlanPrice =
  | { type: "catalog"; price_id: string; catalog_id: string }
  | { type: "manual"; catalog_id: string }
  | { type: "offer" };

export interface SubscriptionSelfPlanSnapshot {
  subscription_plan_id: string;
  term: SubscriptionPlanTerm;
  purchase_requirement: PurchaseRequirement | null;
  unit_price: number;
  price: SubscriptionSelfPlanPrice;
  entitlements: SubscriptionPlanEntitlement[];
}

export interface SubscriptionSelfAcceptedTerms {
  plan: SubscriptionSelfPlanSnapshot;
  deliveries: SubscriptionDeliveryTerms[];
  billing_address: PostalAddress | null;
}

export type SubscriptionSelfTermsSource =
  | { type: "revision"; source_revision_id: string }
  | { type: "snapshot"; terms: SubscriptionSelfAcceptedTerms };

export interface SubscriptionSelfCollectionAuthorization {
  accepted_at: EpochMilliseconds;
}

export type SubscriptionSelfRevisionStatus =
  | { type: "accepted" }
  | { type: "withdrawn"; withdrawn_at: EpochMilliseconds };

export interface SubscriptionRevisionSelf {
  id: string;
  store_id: string;
  subscription_id: string;
  origin: SubscriptionSelfRevisionOrigin;
  effective_from_occurrence: number;
  terms: SubscriptionSelfTermsSource;
  schedule: SubscriptionSchedule;
  collection: SubscriptionCollection;
  authorization: SubscriptionSelfCollectionAuthorization;
  status: SubscriptionSelfRevisionStatus;
  created_at: EpochMilliseconds;
}

export interface SubscriptionRevisionDetailSelf {
  revision: SubscriptionRevisionSelf;
  terms: SubscriptionSelfAcceptedTerms;
}

export interface SubscriptionSelfRevisionBoundary {
  effective_from_occurrence: number;
  terms: SubscriptionSelfAcceptedTerms;
  schedule: SubscriptionSchedule;
  collection: SubscriptionCollection;
}

export interface SubscriptionChangeResultSelf {
  subscription: SubscriptionSelf;
  created: SubscriptionRevisionSelf[];
  withdrawn: SubscriptionRevisionSelf[];
  timeline: SubscriptionSelfRevisionBoundary[];
}

export interface SubscriptionCalendarOptionsSelf {
  subscription: SubscriptionSelf;
  next_occurrence_index: number;
  timeline: SubscriptionSelfRevisionBoundary[];
  skip_next_schedule: SubscriptionSchedule;
}

export interface GetSubscriptionRevisionParams {
  store_id: string;
  subscription_id: string;
  revision_id: string;
}

export interface StorefrontGetSubscriptionRevisionParams {
  subscription_id: string;
  revision_id: string;
}

export interface FindSubscriptionOrdersParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetSubscriptionPurchaseRequirementParams {
  store_id: string;
  id: string;
  at?: EpochMilliseconds;
}

export interface FindSubscriptionPurchaseLimitsParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindSubscriptionPurchaseAccessParams {
  store_id: string;
  id: string;
  catalog_id: string;
  sales_channel_id: string;
  company_id?: string;
  company_location_id?: string;
  variant_ids?: string[];
  limit?: number;
  cursor?: string | null;
}

export interface ControlSubscriptionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: SubscriptionControlType;
}

export interface GetSubscriptionCalendarOptionsParams {
  store_id: string;
  id: string;
}

export type ChangeSubscriptionPaymentMethodParams = SubscriptionFundingChange & { store_id: string };

export type ChangeSubscriptionCalendarParams = SubscriptionCalendarChange & { store_id: string };

export type ChangeSubscriptionPlanParams = SubscriptionPlanChange & { store_id: string };

export type CorrectSubscriptionTaxClassificationParams = SubscriptionTaxCorrection & { store_id: string };

export type ChangeSubscriptionPurchaseRequirementParams = SubscriptionPurchaseRequirementChange & { store_id: string };

export interface TransferSubscriptionPurchaseRequirementParams {
  store_id: string;
  from: SubscriptionChangeVersion;
  to: SubscriptionChangeVersion;
  requirement: PurchaseRequirement;
  reason: string;
}

export interface SubscriptionPurchaseRequirementTransfer {
  from: SubscriptionChangeResult;
  to: SubscriptionChangeResult;
}

export interface StorefrontFindSubscriptionsParams {
  company_id?: string;
  company_location_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontGetSubscriptionParams {
  id: string;
}

export interface StorefrontFindSubscriptionOrdersParams {
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontFindSubscriptionPurchaseAccessParams {
  id: string;
  catalog_id: string;
  company_id?: string;
  company_location_id?: string;
  variant_ids?: string[];
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontControlSubscriptionParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: SubscriptionControlType;
}

export interface StorefrontGetSubscriptionCalendarOptionsParams {
  id: string;
}

export type StorefrontChangeSubscriptionPaymentMethodParams = SubscriptionFundingChange;

export type StorefrontChangeSubscriptionCalendarParams = SubscriptionCalendarChange;

export type StorefrontChangeSubscriptionPlanParams = SubscriptionPlanChange;

export interface GetStorefrontSubscriptionOfferingParams {
  identifier: string;
}

export interface FindStorefrontSubscriptionPlansParams extends CatalogReadOptions {
  subscription_offering_id?: string;
  query?: string;
  price_filter?: CatalogPriceFilter;
  sort_field?: "key" | "created_at" | "price" | "catalog_order";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetStorefrontSubscriptionPlanParams extends CatalogReadOptions {
  identifier: string;
  subscription_offering_id?: string;
}
