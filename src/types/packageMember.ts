import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type {
  Actor,
  CommerceParty,
  CommercePartyQuery,
  CompanyPartyQuery,
  Currency,
  PostalAddress,
  SortDirection,
  TimeRange,
  When,
} from "./common";
import type { OrderDeliveryDestination } from "./order";
import type { PackageDeliveryRateOffer } from "./cart";
import type {
  PackageContext,
  PackageDelivery,
  PackageMinimum,
  PackagePriceRef,
  PackageProductAlternative,
  PackageRenewalTerms,
  PackageStay,
} from "./package";

export type PackageAcceptedRenewal =
  | { type: "never" }
  | ({ type: "every" } & PackageRenewalTerms);

export type PackagePrice =
  | ({ type: "listed" } & PackagePriceRef)
  | ({ type: "offer" } & PackagePriceRef);

export type PackageSnapshotItem =
  | {
      type: "get_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
      delivery: PackageDelivery;
      allocation_weight: number;
    }
  | {
      type: "rent_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
      tax_category_id: string;
      allocation_weight: number;
    }
  | {
      type: "booking_sessions";
      package_item_id: string;
      booking_service_ids: string[];
      sessions: number;
    };

export interface PackageSnapshot {
  package_id: string;
  renewal: PackageAcceptedRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  unit_price: number;
  price: PackagePrice;
  items: PackageSnapshotItem[];
}

export type PackageStart =
  | { type: "on_acceptance" }
  | { type: "scheduled"; starts_at: EpochMilliseconds }
  | { type: "switch"; package_member_id: string }
  | {
      type: "amend";
      package_member_id: string;
      expected_updated_at: EpochMilliseconds;
      reason: string;
    };

export type PackageOccurrence =
  | { type: "start"; starts_at: EpochMilliseconds }
  | { type: "period"; occurrence_index: number; period: TimeRange };

export interface PackageOffering {
  id: string;
  tenant_id: string;
  key: string;
  blocks: Block[];
  package_ids: string[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontPackageOffering {
  id: string;
  key: string;
  blocks: Block[];
  package_ids: string[];
}

export interface PackageMemberCard {
  payment_method_id: string;
  by: Actor;
  accepted_at: EpochMilliseconds;
}

export type PackageMemberPaymentMethod =
  | { type: "none" }
  | ({ type: "card" } & PackageMemberCard);

export type PackageMemberRenewal =
  | { type: "never"; access_end: When }
  | {
      type: "every";
      next_occurrence_index: number;
      payment_method: PackageMemberPaymentMethod;
      renewal_end: When;
    };

export type PackageMemberBlockCause =
  | { type: "period_missed" }
  | { type: "order_unpaid"; order_id: string }
  | { type: "payment_method_not_ready" }
  | { type: "company_not_active" }
  | { type: "company_location_not_active" }
  | { type: "purchase_order_number_required" }
  | { type: "item_unavailable"; package_item_id: string }
  | { type: "no_tax_rule"; tax_category_id: string }
  | { type: "document_item_missing"; package_item_id: string }
  | { type: "delivery_document_item_missing"; shipping_method_id: string }
  | { type: "no_fiscal_label"; tax_category_id: string }
  | { type: "place_of_sale_required" }
  | { type: "renewal_refused"; code: string };

export type PackageMemberPauseCause =
  | {
      type: "requested";
      resumes: When;
      by: Actor;
      reason: string;
    }
  | { type: "renewal_unpaid"; order_id: string };

export type PackageMemberStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | {
      type: "blocked";
      cause: PackageMemberBlockCause;
      blocked_at: EpochMilliseconds;
    }
  | {
      type: "paused";
      cause: PackageMemberPauseCause;
      paused_at: EpochMilliseconds;
    }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export type PackageMemberStatusName = PackageMemberStatus["type"];

export interface PackageMemberSessions {
  package_item_id: string;
  used: number;
}

export interface PackageMember {
  id: string;
  tenant_id: string;
  package_id: string;
  subject: CommerceParty;
  renewal: PackageMemberRenewal;
  status: PackageMemberStatus;
  sessions_used: PackageMemberSessions[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PackageMemberSelfCard {
  payment_method_id: string;
  accepted_at: EpochMilliseconds;
}

export type PackageMemberSelfPaymentMethod =
  | { type: "none" }
  | ({ type: "card" } & PackageMemberSelfCard);

export type PackageMemberSelfRenewal =
  | { type: "never"; access_end: When }
  | {
      type: "every";
      next_occurrence_index: number;
      payment_method: PackageMemberSelfPaymentMethod;
      renewal_end: When;
    };

export type PackageMemberSelfPauseCause =
  | { type: "requested"; resumes: When }
  | { type: "renewal_unpaid"; order_id: string };

export type PackageMemberSelfStatus =
  | { type: "awaiting_activation" }
  | { type: "active" }
  | {
      type: "blocked";
      cause: PackageMemberBlockCause;
      blocked_at: EpochMilliseconds;
    }
  | {
      type: "paused";
      cause: PackageMemberSelfPauseCause;
      paused_at: EpochMilliseconds;
    }
  | { type: "cancelled"; ended_at: EpochMilliseconds };

export interface PackageMemberSelf {
  id: string;
  tenant_id: string;
  package_id: string;
  subject: CommerceParty;
  renewal: PackageMemberSelfRenewal;
  status: PackageMemberSelfStatus;
  sessions_used: PackageMemberSessions[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PackageDeliveryTerms {
  id: string;
  package_item_ids: string[];
  destination: OrderDeliveryDestination;
  shipping_method_id: string;
  shipping_profile_id: string;
  base_fee: number;
}

export type PackageMemberPackageItem =
  | {
      type: "get_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
      delivery: PackageDelivery;
      allocation_weight: number;
    }
  | {
      type: "rent_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
      allocation_weight: number;
    }
  | {
      type: "booking_sessions";
      package_item_id: string;
      booking_service_ids: string[];
      sessions: number;
    };

export interface PackageMemberPackage {
  package_id: string;
  renewal: PackageAcceptedRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  unit_price: number;
  price: PackagePrice;
  items: PackageMemberPackageItem[];
}

export interface PackageMemberAcceptedTerms {
  package: PackageMemberPackage;
  quantity: number;
  deliveries: PackageDeliveryTerms[];
  billing_address: PostalAddress | null;
  purchase_order_number: string | null;
}

export interface PackageProductChoice {
  package_item_id: string;
  variant_id: string;
}

export interface PackageMemberProductChoices {
  package_member: PackageMemberSelf;
  revision_id: string;
  package_item_id: string;
  alternatives: PackageProductAlternative[];
}

export type PackageMemberRevisionOrigin =
  | { type: "initial" }
  | { type: "own_terms"; previous_revision_id: string; reason: string }
  | { type: "package_change"; previous_revision_id: string; reason: string }
  | { type: "upgrade"; previous_revision_id: string; reason: string }
  | { type: "amend"; previous_revision_id: string; reason: string }
  | { type: "minimum"; previous_revision_id: string; reason: string };

export type PackageMemberSchedule =
  | { type: "never"; effective_at: EpochMilliseconds; timezone: string }
  | {
      type: "every";
      effective_from_occurrence: number;
      timezone: string;
      anchor: EpochMilliseconds;
      anchor_occurrence_index: number;
    };

export type PackageMemberRevisionStatus =
  | { type: "accepted" }
  | {
      type: "withdrawn";
      by: Actor;
      reason: string;
      withdrawn_at: EpochMilliseconds;
    };

export interface PackageMemberRevision {
  id: string;
  tenant_id: string;
  package_member_id: string;
  origin: PackageMemberRevisionOrigin;
  terms: PackageMemberAcceptedTerms;
  schedule: PackageMemberSchedule;
  accepted_by: Actor;
  status: PackageMemberRevisionStatus;
  created_at: EpochMilliseconds;
}

export interface PackageMemberRevisionDetail {
  revision: PackageMemberRevision;
  terms: PackageMemberAcceptedTerms;
}

export interface PackageMemberCurrent {
  package_member: PackageMember;
  revision: PackageMemberRevision | null;
  terms: PackageMemberAcceptedTerms | null;
  head_revision_id: string | null;
}

export type PackageSelfPrice =
  | ({ type: "listed" } & PackagePriceRef)
  | ({ type: "offer" } & PackagePriceRef);

export type PackageSelfSnapshotItem =
  | {
      type: "get_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
      delivery: PackageDelivery;
    }
  | {
      type: "rent_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
      tax_category_id: string;
    }
  | {
      type: "booking_sessions";
      package_item_id: string;
      booking_service_ids: string[];
      sessions: number;
    };

export interface PackageSelfSnapshot {
  package_id: string;
  renewal: PackageAcceptedRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  unit_price: number;
  price: PackageSelfPrice;
  items: PackageSelfSnapshotItem[];
}

export type PackageMemberSelfPackageItem =
  | {
      type: "get_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
      delivery: PackageDelivery;
    }
  | {
      type: "rent_product";
      package_item_id: string;
      variant_id: string;
      quantity: number;
    }
  | {
      type: "booking_sessions";
      package_item_id: string;
      booking_service_ids: string[];
      sessions: number;
    };

export interface PackageMemberSelfPackage {
  package_id: string;
  renewal: PackageAcceptedRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  unit_price: number;
  price: PackageSelfPrice;
  items: PackageMemberSelfPackageItem[];
}

export interface PackageMemberSelfAcceptedTerms {
  package: PackageMemberSelfPackage;
  quantity: number;
  deliveries: PackageDeliveryTerms[];
  billing_address: PostalAddress | null;
  purchase_order_number: string | null;
}

export interface PackageMemberSelfPricedTerms extends PackageMemberSelfAcceptedTerms {
  currency: Currency;
}

export interface PackageMemberCurrentSelf {
  package_member: PackageMemberSelf;
  revision: PackageMemberRevisionSelf | null;
  terms: PackageMemberSelfPricedTerms | null;
  head_revision_id: string | null;
}

export type PackageMemberSelfRevisionOrigin =
  | { type: "initial" }
  | { type: "own_terms"; previous_revision_id: string }
  | { type: "package_change"; previous_revision_id: string }
  | { type: "upgrade"; previous_revision_id: string }
  | { type: "amend"; previous_revision_id: string }
  | { type: "minimum"; previous_revision_id: string };

export type PackageMemberSelfRevisionStatus =
  { type: "accepted" } | { type: "withdrawn"; withdrawn_at: EpochMilliseconds };

export interface PackageMemberRevisionSelf {
  id: string;
  tenant_id: string;
  package_member_id: string;
  origin: PackageMemberSelfRevisionOrigin;
  terms: PackageMemberSelfAcceptedTerms;
  schedule: PackageMemberSchedule;
  status: PackageMemberSelfRevisionStatus;
  created_at: EpochMilliseconds;
}

export interface PackageMemberPackageSelf {
  id: string;
  key: string;
  blocks: Block[];
}

export interface PackageMemberRevisionDetailSelf {
  revision: PackageMemberRevisionSelf;
  terms: PackageMemberSelfPricedTerms;
  package: PackageMemberPackageSelf;
}

export interface PackageMemberChange {
  package_member: PackageMember;
  created: PackageMemberRevision | null;
  withdrawn: PackageMemberRevision | null;
}

export type PackageMemberChangeAccess =
  | { type: "allowed" }
  | { type: "forbidden" }
  | { type: "change_scheduled" };

export interface PackageMemberChanges {
  package_member_id: string;
  change: PackageMemberChangeAccess;
  select_payment_method: PackageMemberChangeAccess;
}

export interface PackageMemberChangeSelf {
  package_member: PackageMemberSelf;
  created: PackageMemberRevisionSelf | null;
  withdrawn: PackageMemberRevisionSelf | null;
}

export interface PackageMemberMinimumTransfer {
  from: PackageMemberChange;
  to: PackageMemberChange;
}

export interface PackageMemberCalendar {
  package_member: PackageMember;
  next: PackageOccurrence | null;
  after_skip: PackageOccurrence | null;
}

export interface PackageMemberCalendarSelf {
  package_member: PackageMemberSelf;
  next: PackageOccurrence | null;
  after_skip: PackageOccurrence | null;
}

export interface PackageMemberMinimum {
  package_member: PackageMember;
  starts_at: EpochMilliseconds;
  timezone: string;
  ends_at: EpochMilliseconds | null;
  evaluated_at: EpochMilliseconds;
  initial: PackageMinimum;
  current: PackageMinimum;
}

export interface PackageMemberVersion {
  package_member_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreatePackageOfferingParams {
  tenant_id: string;
  id: string;
  key: string;
  blocks: Block[];
  package_ids: string[];
}

export interface UpdatePackageOfferingParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  package_ids: string[];
}

export interface DeletePackageOfferingParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetPackageOfferingParams {
  tenant_id: string;
  id: string;
}

export interface GetPackageOfferingByKeyParams {
  tenant_id: string;
  key: string;
}

export interface FindPackageOfferingsParams {
  tenant_id: string;
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export type PackageMemberRenewalType = "never" | "every";

export type FindPackageMembersBySearchParams = CommercePartyQuery & {
  tenant_id: string;
  ids?: never;
  package_id?: string;
  package_offering_id?: string;
  status?: PackageMemberStatusName;
  renewal_type?: PackageMemberRenewalType;
  limit?: number;
  cursor?: string | null;
};

export interface FindPackageMembersByIdsParams {
  tenant_id: string;
  ids: string[];
  user_id?: never;
  company_id?: never;
  company_location_id?: never;
  package_id?: never;
  package_offering_id?: never;
  status?: never;
  renewal_type?: never;
  limit?: never;
  cursor?: never;
}

export type FindPackageMembersParams = FindPackageMembersBySearchParams | FindPackageMembersByIdsParams;

export type PackageMemberDetail = PackageMember & { end: When };

export type PackageMemberListItem = PackageMember & { first_order_id: string | null; end: When };

export type PackageMemberDetailSelf = PackageMemberSelf & { end: When };

export type PackageMemberSelfListItem = PackageMemberSelf & { package: PackageMemberPackageSelf; end: When };

export interface FindPackageMembersCurrentParams {
  tenant_id: string;
  ids: string[];
}

export interface FindPackageMemberOrdersParams extends FindPackageMemberPageParams {
  sort_direction?: SortDirection;
}

export interface GetPackageMemberParams {
  tenant_id: string;
  id: string;
}

export interface AssignPackageMemberParams {
  tenant_id: string;
  id: string;
  package_id: string;
  subject: CommerceParty;
  access_end: When;
}

export interface FindPackageMemberPageParams {
  tenant_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetPackageMemberRevisionParams {
  tenant_id: string;
  package_member_id: string;
  revision_id: string;
}

export interface FindPackageMemberRevisionPurchaseOrdersParams extends GetPackageMemberRevisionParams {
  limit?: number;
  cursor?: string | null;
}

export interface GetPackageMemberMinimumParams {
  tenant_id: string;
  id: string;
  at?: EpochMilliseconds;
}

export interface PackageMemberActionParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CancelPackageMemberParams extends PackageMemberActionParams {
  notify_user: boolean;
}

export interface SchedulePackageMemberEndParams extends CancelPackageMemberParams {
  end_at: EpochMilliseconds;
}

export interface PausePackageMemberParams extends PackageMemberActionParams {
  reason: string;
  resumes: When;
}

export interface SkipNextPackageMemberRenewalParams extends PackageMemberActionParams {
  occurrence_index: number;
}

export interface SelectPackageMemberPaymentMethodParams extends PackageMemberActionParams {
  payment_method_id: string;
}

export interface SwitchPackageMemberParams extends PackageMemberActionParams {
  to_package_id: string;
  choices: PackageProductChoice[];
  price: PackagePriceRef;
  deliveries: PackageDeliveryTerms[];
  reason: string;
}

export interface ChangePackageMemberTermsParams extends PackageMemberActionParams {
  terms: PackageMemberAcceptedTerms;
  reason: string;
}

export interface StorefrontChangePackageMemberTermsParams extends StorefrontPackageMemberActionParams {
  quantity: number;
  choices: PackageProductChoice[];
  deliveries: PackageDeliveryTerms[];
  billing_address: PostalAddress | null;
  purchase_order_number: string | null;
  reason: string;
}

export interface StorefrontGetPackageMemberDeliveryOptionsParams extends Omit<
  StorefrontChangePackageMemberTermsParams,
  "reason"
> {
  revision_id: string;
  delivery_id: string;
  language: string;
}

export interface StorefrontGetPackageMemberSwitchDeliveryOptionsParams extends Omit<
  StorefrontSwitchPackageMemberParams,
  "reason"
> {
  revision_id: string;
  delivery_id: string;
  language: string;
}

export interface PackageMemberDeliveryOptions {
  package_member: PackageMemberSelf;
  revision_id: string;
  delivery_id: string;
  language: string;
  currency: Currency;
  destination: OrderDeliveryDestination;
  offers: PackageDeliveryRateOffer[];
}

export interface StorefrontGetPackageMemberProductChoicesParams extends StorefrontPackageMemberActionParams {
  package_item_id: string;
  revision_id: string;
}

export interface ChangePackageMemberMinimumParams extends PackageMemberActionParams {
  minimum: PackageMinimum;
  reason: string;
}

export interface WithdrawPackageMemberRevisionParams extends PackageMemberActionParams {
  revision_id: string;
  reason: string;
}

export interface RevokePackageMemberParams extends PackageMemberActionParams {
  reason: string;
}

export interface TransferPackageMemberMinimumParams {
  tenant_id: string;
  from: PackageMemberVersion;
  to: PackageMemberVersion;
  minimum: PackageMinimum;
  reason: string;
}

export type GetStorefrontPackageOfferingParams = PackageContext & {
  id: string;
};

export type GetStorefrontPackageOfferingByKeyParams = PackageContext & {
  key: string;
};

export type StorefrontFindPackageMembersParams = CompanyPartyQuery & {
  status?: PackageMemberStatusName;
  limit?: number;
  cursor?: string | null;
};

export interface StorefrontGetPackageMemberParams {
  id: string;
}

export interface StorefrontGetPackageMemberRevisionParams {
  package_member_id: string;
  revision_id: string;
}

export interface StorefrontFindPackageMemberOrdersParams {
  id: string;
  limit?: number;
  cursor?: string | null;
}

export type StorefrontPackageMemberActionParams = Omit<
  PackageMemberActionParams,
  "tenant_id"
>;

export type StorefrontPausePackageMemberParams = Omit<
  PausePackageMemberParams,
  "tenant_id"
>;

export type StorefrontSkipNextPackageMemberRenewalParams = Omit<
  SkipNextPackageMemberRenewalParams,
  "tenant_id"
>;

export type StorefrontSelectPackageMemberPaymentMethodParams = Omit<
  SelectPackageMemberPaymentMethodParams,
  "tenant_id"
>;

export type StorefrontSwitchPackageMemberParams = Omit<
  SwitchPackageMemberParams,
  "tenant_id"
>;

export type StorefrontWithdrawPackageMemberRevisionParams = Omit<
  WithdrawPackageMemberRevisionParams,
  "tenant_id"
>;
