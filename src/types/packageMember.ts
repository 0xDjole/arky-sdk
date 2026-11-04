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
  store_id: string;
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
  | { type: "no_tax_rule"; tax_category_id: string };

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

export interface PackageMember {
  id: string;
  store_id: string;
  package_id: string;
  subject: CommerceParty;
  renewal: PackageMemberRenewal;
  status: PackageMemberStatus;
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
  store_id: string;
  package_id: string;
  subject: CommerceParty;
  renewal: PackageMemberSelfRenewal;
  status: PackageMemberSelfStatus;
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

export interface PackageMemberAcceptedTerms {
  package: PackageSnapshot;
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

export type PackageMemberRevisionChange =
  | { type: "own_terms" }
  | { type: "package_change" }
  | { type: "upgrade" }
  | { type: "amend" }
  | { type: "minimum" };

export type PackageMemberRevisionOrigin =
  | { type: "initial" }
  | {
      type: "change";
      previous_revision_id: string;
      change: PackageMemberRevisionChange;
      reason: string;
    };

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
  store_id: string;
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

export interface PackageSelfSnapshot {
  package_id: string;
  renewal: PackageAcceptedRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  unit_price: number;
  price: PackageSelfPrice;
  items: PackageSnapshotItem[];
}

export interface PackageMemberSelfAcceptedTerms {
  package: PackageSelfSnapshot;
  quantity: number;
  deliveries: PackageDeliveryTerms[];
  billing_address: PostalAddress | null;
  purchase_order_number: string | null;
}

export interface PackageMemberCurrentSelf {
  package_member: PackageMemberSelf;
  revision: PackageMemberRevisionSelf | null;
  terms: PackageMemberSelfAcceptedTerms | null;
  head_revision_id: string | null;
}

export type PackageMemberSelfRevisionChange =
  | { type: "own_terms" }
  | { type: "package_change" }
  | { type: "upgrade" }
  | { type: "amend" }
  | { type: "minimum" };

export type PackageMemberSelfRevisionOrigin =
  | { type: "initial" }
  | {
      type: "change";
      previous_revision_id: string;
      change: PackageMemberSelfRevisionChange;
    };

export type PackageMemberSelfRevisionStatus =
  { type: "accepted" } | { type: "withdrawn"; withdrawn_at: EpochMilliseconds };

export interface PackageMemberRevisionSelf {
  id: string;
  store_id: string;
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
  terms: PackageMemberSelfAcceptedTerms;
  package: PackageMemberPackageSelf;
}

export interface PackageMemberChange {
  package_member: PackageMember;
  created: PackageMemberRevision | null;
  withdrawn: PackageMemberRevision | null;
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
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  package_ids: string[];
}

export interface UpdatePackageOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  package_ids: string[];
}

export interface DeletePackageOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetPackageOfferingParams {
  store_id: string;
  id: string;
}

export interface GetPackageOfferingByKeyParams {
  store_id: string;
  key: string;
}

export interface FindPackageOfferingsParams {
  store_id: string;
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export type FindPackageMembersParams = CommercePartyQuery & {
  store_id: string;
  package_id?: string;
  package_offering_id?: string;
  status?: PackageMemberStatusName;
  limit?: number;
  cursor?: string | null;
};

export interface GetPackageMemberParams {
  store_id: string;
  id: string;
}

export interface AssignPackageMemberParams {
  store_id: string;
  id: string;
  package_id: string;
  subject: CommerceParty;
  access_end: When;
}

export interface FindPackageMemberPageParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetPackageMemberRevisionParams {
  store_id: string;
  package_member_id: string;
  revision_id: string;
}

export interface GetPackageMemberMinimumParams {
  store_id: string;
  id: string;
  at?: EpochMilliseconds;
}

export interface PackageMemberActionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CancelPackageMemberParams extends PackageMemberActionParams {
  notify_customer: boolean;
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
  store_id: string;
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
  "store_id"
>;

export type StorefrontPausePackageMemberParams = Omit<
  PausePackageMemberParams,
  "store_id"
>;

export type StorefrontSkipNextPackageMemberRenewalParams = Omit<
  SkipNextPackageMemberRenewalParams,
  "store_id"
>;

export type StorefrontSelectPackageMemberPaymentMethodParams = Omit<
  SelectPackageMemberPaymentMethodParams,
  "store_id"
>;

export type StorefrontSwitchPackageMemberParams = Omit<
  SwitchPackageMemberParams,
  "store_id"
>;

export type StorefrontWithdrawPackageMemberRevisionParams = Omit<
  WithdrawPackageMemberRevisionParams,
  "store_id"
>;
