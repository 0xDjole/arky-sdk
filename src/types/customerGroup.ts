import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type {
  AccountActor,
  Actor,
  CommerceParty,
  CommercePartyQuery,
  CompanyPartyQuery,
  PostalAddress,
  SortDirection,
} from "./common";
import type { OrderDeliveryDestination } from "./order";
import type { CatalogPriceFilter, StorefrontPrice } from "./product";
import type { CatalogReadOptions } from "./catalog";

export type BillingInterval = "day" | "week" | "month" | "year";

export interface RecurringCadence {
  interval: BillingInterval;
  interval_count: number;
}

export interface BillingPeriod {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export type RenewalExhaustionAction = { type: "pause" } | { type: "cancel" };

export type UnpaidRenewalDisposition = { type: "retain_debt" } | { type: "cancel_unfulfilled" };

export interface RenewalRecoveryPolicy {
  retry_offsets_seconds: number[];
  recovery_window_seconds: number;
  on_exhaustion: RenewalExhaustionAction;
  unpaid_order: UnpaidRenewalDisposition;
}

export type CustomerGroupCommitmentEndAction =
  | { type: "renew" }
  | { type: "renew_once" }
  | { type: "continue_without_term" }
  | { type: "stop" };

export interface CustomerGroupCommitment {
  occurrences: number;
  end_action: CustomerGroupCommitmentEndAction;
}

export type CustomerGroupTerm =
  | { type: "permanent" }
  | {
      type: "recurring";
      cadence: RecurringCadence;
      recovery_policy: RenewalRecoveryPolicy;
      commitment: CustomerGroupCommitment | null;
    };

export type CustomerGroupProductQuantity =
  | { type: "per_period"; quantity: number }
  | { type: "per_delivery"; quantity: number };

export type CustomerGroupDeliverySchedule =
  | { type: "none" }
  | { type: "once"; offset_days: number; window_days: number }
  | { type: "repeating"; cadence: RecurringCadence; offset_days: number; window_days: number };

export type PurchaseLimitPeriodPolicy =
  | { type: "billing_period" }
  | { type: "calendar_month"; timezone: string };

export type PurchaseLimitRestoration =
  | { type: "cancellation_only" }
  | { type: "cancellation_and_accepted_return" };

export interface PurchaseLimitDefinition {
  id: string;
  variant_ids: string[];
  period: PurchaseLimitPeriodPolicy;
  max_quantity: number;
  restoration: PurchaseLimitRestoration;
}

export type CustomerGroupEntitlementType =
  | {
      type: "product";
      variant_id: string;
      quantity: CustomerGroupProductQuantity;
      delivery: CustomerGroupDeliverySchedule;
    }
  | { type: "rental"; variant_id: string; quantity: number; tax_category_id: string }
  | {
      type: "purchase_access";
      variant_ids: string[];
      catalog_ids: string[];
      limits: PurchaseLimitDefinition[];
      tax_category_id: string;
    };

export interface CustomerGroupEntitlement {
  id: string;
  type: CustomerGroupEntitlementType;
  allocation_weight: number;
}

export type PurchaseRequirementUnit = { type: "count" } | { type: "millilitres" };

export type PurchaseRequirementPeriod = { type: "calendar_month"; timezone: string };

export interface PurchaseRequirementVariant {
  variant_id: string;
  contribution_per_unit: number;
}

export type PurchaseRequirementScope = { type: "per_location" } | { type: "company_wide" };

export interface PurchaseRequirement {
  unit: PurchaseRequirementUnit;
  minimum_quantity: number;
  period: PurchaseRequirementPeriod;
  qualifying_variants: PurchaseRequirementVariant[];
  scope: PurchaseRequirementScope;
}

export type CustomerGroupTaxGroupQuantity =
  | { type: "package" }
  | { type: "entitlement"; entitlement_id: string };

export interface CustomerGroupTaxGroup {
  id: string;
  entitlement_ids: string[];
  tax_category_id: string;
  context_entitlement_id: string;
  quantity: CustomerGroupTaxGroupQuantity;
}

export type CustomerGroupTaxPolicyType =
  | { type: "per_entitlement" }
  | { type: "grouped"; groups: CustomerGroupTaxGroup[] };

export interface CustomerGroupTaxPolicy {
  id: string;
  zone_id: string;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  type: CustomerGroupTaxPolicyType;
}

export type CustomerGroupStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };

export interface CustomerGroup {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  term: CustomerGroupTerm;
  entitlements: CustomerGroupEntitlement[];
  purchase_requirement: PurchaseRequirement | null;
  tax_policies: CustomerGroupTaxPolicy[];
  status: CustomerGroupStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerGroupPrice =
  | { type: "catalog"; price_id: string; catalog_id: string }
  | { type: "manual"; catalog_id: string; actor: AccountActor; reason: string }
  | { type: "offer" };

export interface CustomerGroupSnapshot {
  customer_group_id: string;
  term: CustomerGroupTerm;
  purchase_requirement: PurchaseRequirement | null;
  unit_price: number;
  price: CustomerGroupPrice;
  entitlements: CustomerGroupEntitlement[];
}

export type CustomerGroupStart =
  | { type: "on_acceptance" }
  | { type: "scheduled"; starts_at: EpochMilliseconds }
  | { type: "switch"; customer_group_member_id: string };

export type CustomerGroupOccurrence =
  | { type: "permanent"; starts_at: EpochMilliseconds }
  | { type: "period"; occurrence_index: number; period: BillingPeriod };

export type CustomerGroupOfferingStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };

export interface CustomerGroupOffering {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  customer_group_ids: string[];
  status: CustomerGroupOfferingStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontCustomerGroupOffering {
  id: string;
  key: string;
  blocks: Block[];
  customer_group_ids: string[];
}

export interface StorefrontCustomerGroupEntitlement {
  id: string;
  type: CustomerGroupEntitlementType;
}

export interface StorefrontCustomerGroup {
  id: string;
  key: string;
  blocks: Block[];
  term: CustomerGroupTerm;
  purchase_requirement: PurchaseRequirement | null;
  entitlements: StorefrontCustomerGroupEntitlement[];
  price: StorefrontPrice | null;
}

export interface CustomerGroupMemberPaymentMethodAuthorization {
  by: Actor;
  accepted_at: EpochMilliseconds;
}

export interface CustomerGroupMemberPaymentMethod {
  payment_method_id: string;
  authorization: CustomerGroupMemberPaymentMethodAuthorization;
}

export type CustomerGroupMemberType =
  | { type: "permanent" }
  | {
      type: "recurring";
      next_occurrence_index: number;
      payment_method: CustomerGroupMemberPaymentMethod | null;
      purchase_end_at: EpochMilliseconds | null;
    };

export type CustomerGroupMemberBlockCause =
  | { type: "period_missed" }
  | { type: "order_unpaid"; order_id: string }
  | { type: "payment_method_not_ready" }
  | { type: "customer_not_active" }
  | { type: "company_not_active" }
  | { type: "company_location_not_active" }
  | { type: "purchase_order_number_required" }
  | { type: "entitlement_unavailable"; entitlement_id: string };

export type CustomerGroupMemberPauseCause =
  | { type: "requested"; by: Actor; reason: string }
  | { type: "renewal_unpaid"; order_id: string };

export type CustomerGroupMemberStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked"; cause: CustomerGroupMemberBlockCause; blocked_at: EpochMilliseconds }
  | { type: "paused"; cause: CustomerGroupMemberPauseCause; paused_at: EpochMilliseconds }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export type CustomerGroupMemberStatusName = CustomerGroupMemberStatus["type"];

export interface CustomerGroupMember {
  id: string;
  store_id: string;
  customer_group_id: string;
  subject: CommerceParty;
  type: CustomerGroupMemberType;
  status: CustomerGroupMemberStatus;
  access_end_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerGroupMemberSelfPaymentMethod {
  payment_method_id: string;
  accepted_at: EpochMilliseconds;
}

export type CustomerGroupMemberSelfType =
  | { type: "permanent" }
  | {
      type: "recurring";
      next_occurrence_index: number;
      payment_method: CustomerGroupMemberSelfPaymentMethod | null;
      purchase_end_at: EpochMilliseconds | null;
    };

export type CustomerGroupMemberSelfStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | { type: "blocked"; cause: CustomerGroupMemberBlockCause; blocked_at: EpochMilliseconds }
  | { type: "paused"; paused_at: EpochMilliseconds }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export interface CustomerGroupMemberSelf {
  id: string;
  store_id: string;
  customer_group_id: string;
  subject: CommerceParty;
  type: CustomerGroupMemberSelfType;
  status: CustomerGroupMemberSelfStatus;
  access_end_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerGroupDeliveryTerms {
  id: string;
  entitlement_ids: string[];
  destination: OrderDeliveryDestination;
  shipping_method_id: string;
  shipping_profile_id: string;
  base_fee: number;
}

export interface CustomerGroupMemberAcceptedTerms {
  group: CustomerGroupSnapshot;
  deliveries: CustomerGroupDeliveryTerms[];
  billing_address: PostalAddress | null;
}

export type CustomerGroupMemberRevisionChange =
  | { type: "amend_terms" }
  | { type: "purchase_requirement" }
  | { type: "correct_tax_classification"; reason: string };

export type CustomerGroupMemberRevisionOrigin =
  | { type: "initial" }
  | { type: "change"; previous_revision_id: string; change: CustomerGroupMemberRevisionChange };

export type CustomerGroupMemberTermsSource =
  | { type: "revision"; source_revision_id: string }
  | { type: "snapshot"; terms: CustomerGroupMemberAcceptedTerms };

export type CustomerGroupMemberSchedule =
  | { type: "permanent"; effective_at: EpochMilliseconds; timezone: string }
  | {
      type: "recurring";
      effective_from_occurrence: number;
      timezone: string;
      anchor: EpochMilliseconds;
      anchor_occurrence_index: number;
    };

export type CustomerGroupMemberRevisionStatus =
  | { type: "accepted" }
  | { type: "withdrawn"; by: Actor; reason: string; withdrawn_at: EpochMilliseconds };

export interface CustomerGroupMemberRevision {
  id: string;
  store_id: string;
  customer_group_member_id: string;
  origin: CustomerGroupMemberRevisionOrigin;
  terms: CustomerGroupMemberTermsSource;
  schedule: CustomerGroupMemberSchedule;
  accepted_by: Actor;
  status: CustomerGroupMemberRevisionStatus;
  created_at: EpochMilliseconds;
}

export interface CustomerGroupMemberRevisionDetail {
  revision: CustomerGroupMemberRevision;
  terms: CustomerGroupMemberAcceptedTerms;
}

export interface CustomerGroupMemberCurrent {
  customer_group_member: CustomerGroupMember;
  revision: CustomerGroupMemberRevision | null;
  terms: CustomerGroupMemberAcceptedTerms | null;
  head_revision_id: string | null;
}

export type CustomerGroupSelfPrice =
  | { type: "catalog"; price_id: string; catalog_id: string }
  | { type: "manual"; catalog_id: string }
  | { type: "offer" };

export interface CustomerGroupSelfSnapshot {
  customer_group_id: string;
  term: CustomerGroupTerm;
  purchase_requirement: PurchaseRequirement | null;
  unit_price: number;
  price: CustomerGroupSelfPrice;
  entitlements: CustomerGroupEntitlement[];
}

export interface CustomerGroupMemberSelfAcceptedTerms {
  group: CustomerGroupSelfSnapshot;
  deliveries: CustomerGroupDeliveryTerms[];
  billing_address: PostalAddress | null;
}

export type CustomerGroupMemberSelfRevisionChange =
  | { type: "amend_terms" }
  | { type: "purchase_requirement" }
  | { type: "correct_tax_classification" };

export type CustomerGroupMemberSelfRevisionOrigin =
  | { type: "initial" }
  | { type: "change"; previous_revision_id: string; change: CustomerGroupMemberSelfRevisionChange };

export type CustomerGroupMemberSelfTermsSource =
  | { type: "revision"; source_revision_id: string }
  | { type: "snapshot"; terms: CustomerGroupMemberSelfAcceptedTerms };

export type CustomerGroupMemberSelfRevisionStatus =
  | { type: "accepted" }
  | { type: "withdrawn"; withdrawn_at: EpochMilliseconds };

export interface CustomerGroupMemberRevisionSelf {
  id: string;
  store_id: string;
  customer_group_member_id: string;
  origin: CustomerGroupMemberSelfRevisionOrigin;
  terms: CustomerGroupMemberSelfTermsSource;
  schedule: CustomerGroupMemberSchedule;
  status: CustomerGroupMemberSelfRevisionStatus;
  created_at: EpochMilliseconds;
}

export interface CustomerGroupMemberRevisionDetailSelf {
  revision: CustomerGroupMemberRevisionSelf;
  terms: CustomerGroupMemberSelfAcceptedTerms;
}

export interface CustomerGroupMemberChange {
  customer_group_member: CustomerGroupMember;
  created: CustomerGroupMemberRevision | null;
  withdrawn: CustomerGroupMemberRevision | null;
}

export interface CustomerGroupMemberChangeSelf {
  customer_group_member: CustomerGroupMemberSelf;
  created: CustomerGroupMemberRevisionSelf | null;
  withdrawn: CustomerGroupMemberRevisionSelf | null;
}

export interface CustomerGroupMemberPurchaseRequirementTransfer {
  from: CustomerGroupMemberChange;
  to: CustomerGroupMemberChange;
}

export interface CustomerGroupMemberCalendar {
  customer_group_member: CustomerGroupMember;
  next: CustomerGroupOccurrence | null;
  after_skip: CustomerGroupOccurrence | null;
}

export interface CustomerGroupMemberCalendarSelf {
  customer_group_member: CustomerGroupMemberSelf;
  next: CustomerGroupOccurrence | null;
  after_skip: CustomerGroupOccurrence | null;
}

export interface CustomerGroupMemberPurchaseRequirement {
  customer_group_member: CustomerGroupMember;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  evaluated_at: EpochMilliseconds;
  initial: PurchaseRequirement | null;
  current: PurchaseRequirement | null;
}

export interface CustomerGroupMemberPurchaseLimitPeriod {
  id: string;
  store_id: string;
  customer_group_member_id: string;
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
  customer_group_member_purchase_limit_period_id: string | null;
  counted_quantity: number;
  remaining_quantity: number;
}

export interface CustomerGroupMemberPurchaseAccessGrant {
  order_id: string;
  order_purchase_access_line_item_id: string;
  entitlement_id: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  variant_ids: string[];
  catalog_id: string;
  limits: PurchaseAccessLimitAvailability[];
}

export interface CustomerGroupMemberPurchaseAccessPage {
  customer_group_member_id: string;
  catalog_id: string;
  sales_channel_id: string;
  as_of: EpochMilliseconds;
  grants: CustomerGroupMemberPurchaseAccessGrant[];
  cursor: string | null;
}

export interface CustomerGroupMemberTaxClassificationChange {
  entitlement_id: string;
  tax_category_id: string;
}

export interface CustomerGroupMemberVersion {
  customer_group_member_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreateCustomerGroupParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  term: CustomerGroupTerm;
  entitlements: CustomerGroupEntitlement[];
  purchase_requirement: PurchaseRequirement | null;
  tax_policies: CustomerGroupTaxPolicy[];
  status: CustomerGroupStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface UpdateCustomerGroupParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  term: CustomerGroupTerm;
  entitlements: CustomerGroupEntitlement[];
  purchase_requirement: PurchaseRequirement | null;
  tax_policies: CustomerGroupTaxPolicy[];
  status: CustomerGroupStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeleteCustomerGroupParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetCustomerGroupParams {
  store_id: string;
  id: string;
}

export interface GetCustomerGroupByKeyParams {
  store_id: string;
  key: string;
}

export interface FindCustomerGroupsParams {
  store_id: string;
  customer_group_offering_id?: string;
  status?: CustomerGroupStatus;
  query?: string;
  sort_field?: "key" | "created_at" | "status";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface CreateCustomerGroupOfferingParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  customer_group_ids: string[];
  status: CustomerGroupOfferingStatus;
}

export interface UpdateCustomerGroupOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  customer_group_ids: string[];
  status: CustomerGroupOfferingStatus;
}

export interface DeleteCustomerGroupOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetCustomerGroupOfferingParams {
  store_id: string;
  id: string;
}

export interface GetCustomerGroupOfferingByKeyParams {
  store_id: string;
  key: string;
}

export interface FindCustomerGroupOfferingsParams {
  store_id: string;
  key?: string;
  status?: CustomerGroupOfferingStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export type FindCustomerGroupMembersParams = CommercePartyQuery & {
  store_id: string;
  customer_group_id?: string;
  customer_group_offering_id?: string;
  status?: CustomerGroupMemberStatusName;
  limit?: number;
  cursor?: string | null;
};

export interface GetCustomerGroupMemberParams {
  store_id: string;
  id: string;
}

export interface AssignCustomerGroupMemberParams {
  store_id: string;
  id: string;
  customer_group_id: string;
  subject: CommerceParty;
  access_end_at: EpochMilliseconds | null;
}

export interface FindCustomerGroupMemberPageParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetCustomerGroupMemberRevisionParams {
  store_id: string;
  customer_group_member_id: string;
  revision_id: string;
}

export interface GetCustomerGroupMemberPurchaseRequirementParams {
  store_id: string;
  id: string;
  at?: EpochMilliseconds;
}

export interface FindCustomerGroupMemberPurchaseAccessParams {
  store_id: string;
  id: string;
  catalog_id: string;
  sales_channel_id: string;
  variant_ids?: string[];
  limit?: number;
  cursor?: string | null;
}

export interface CustomerGroupMemberActionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ScheduleCustomerGroupMemberEndParams extends CustomerGroupMemberActionParams {
  end_at: EpochMilliseconds;
}

export interface PauseCustomerGroupMemberParams extends CustomerGroupMemberActionParams {
  reason: string;
}

export interface SkipNextCustomerGroupMemberPurchaseParams extends CustomerGroupMemberActionParams {
  occurrence_index: number;
}

export interface SelectCustomerGroupMemberPaymentMethodParams extends CustomerGroupMemberActionParams {
  payment_method_id: string;
}

export interface SwitchCustomerGroupMemberParams extends CustomerGroupMemberActionParams {
  to_customer_group_id: string;
  catalog_id?: string;
  reason: string;
}

export interface ChangeCustomerGroupMemberPurchaseRequirementParams extends CustomerGroupMemberActionParams {
  requirement: PurchaseRequirement | null;
  reason: string;
}

export interface CorrectCustomerGroupMemberTaxClassificationParams extends CustomerGroupMemberActionParams {
  changes: CustomerGroupMemberTaxClassificationChange[];
  reason: string;
}

export interface WithdrawCustomerGroupMemberRevisionParams extends CustomerGroupMemberActionParams {
  revision_id: string;
  reason: string;
}

export interface RevokeCustomerGroupMemberParams extends CustomerGroupMemberActionParams {
  reason: string;
}

export interface TransferCustomerGroupMemberPurchaseRequirementParams {
  store_id: string;
  from: CustomerGroupMemberVersion;
  to: CustomerGroupMemberVersion;
  requirement: PurchaseRequirement;
  reason: string;
}

export type FindStorefrontCustomerGroupsParams = CatalogReadOptions & {
  customer_group_offering_id?: string;
  query?: string;
  price_filter?: CatalogPriceFilter;
  sort_field?: "key" | "created_at" | "price" | "catalog_order";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
};

export type GetStorefrontCustomerGroupParams = CatalogReadOptions & {
  identifier: string;
};

export interface GetStorefrontCustomerGroupOfferingParams {
  identifier: string;
}

export type StorefrontFindCustomerGroupMembersParams = CompanyPartyQuery & {
  status?: CustomerGroupMemberStatusName;
  limit?: number;
  cursor?: string | null;
};

export interface StorefrontGetCustomerGroupMemberParams {
  id: string;
}

export interface StorefrontGetCustomerGroupMemberRevisionParams {
  customer_group_member_id: string;
  revision_id: string;
}

export interface StorefrontFindCustomerGroupMemberOrdersParams {
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontFindCustomerGroupMemberPurchaseAccessParams {
  id: string;
  catalog_id: string;
  variant_ids?: string[];
  limit?: number;
  cursor?: string | null;
}

export type StorefrontCustomerGroupMemberActionParams = Omit<CustomerGroupMemberActionParams, "store_id">;

export type StorefrontPauseCustomerGroupMemberParams = Omit<PauseCustomerGroupMemberParams, "store_id">;

export type StorefrontSkipNextCustomerGroupMemberPurchaseParams = Omit<SkipNextCustomerGroupMemberPurchaseParams, "store_id">;

export type StorefrontSelectCustomerGroupMemberPaymentMethodParams = Omit<
  SelectCustomerGroupMemberPaymentMethodParams,
  "store_id"
>;

export type StorefrontSwitchCustomerGroupMemberParams = Omit<SwitchCustomerGroupMemberParams, "store_id">;

export type StorefrontWithdrawCustomerGroupMemberRevisionParams = Omit<
  WithdrawCustomerGroupMemberRevisionParams,
  "store_id"
>;
