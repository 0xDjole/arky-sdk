import type {
  MarketSnapshot,
  CompanyLocationSnapshot,
  OrderDeliveryDestinationSnapshot,
} from "./orderContract";
import type {
  CustomerGroupPlanTerm,
  CustomerGroupProductQuantity,
  CustomerGroupDeliverySchedule,
} from "./customerGroupPlan";
import type {
  OrderProductSnapshot,
  OrderDigitalSnapshot,
} from "./orderSnapshot";
import type { AccountActor } from "./accountActor";
import type {
  Address,
  LineMoneySnapshot,
  Money,
  OrderItemStatus,
  TaxMode,
} from "./index";
import type { EpochMilliseconds } from "./time";

export interface DisplayTextSnapshot {
  text: string;
  locale: string | null;
}

export type AppliedPriceSource =
  | { type: "base"; price_id: string }
  | { type: "price_list"; price_id: string; price_list_id: string }
  | { type: "manual"; actor: AccountActor; reason: string };

export interface StorefrontPrice {
  tax_mode: TaxMode;
  unit_price: Money;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  priced_at: EpochMilliseconds;
}

export interface AppliedPriceSnapshot {
  unit_price: Money;
  compare_at: number | null;
  tax_mode: TaxMode;
  min_quantity: number;
  max_quantity: number | null;
  source: AppliedPriceSource;
  priced_at: EpochMilliseconds;
}

export interface OrderAccessRevocation {
  command_id: string;
  actor: AccountActor;
  effective_at: EpochMilliseconds;
  reason: string;
}

/** Frozen terms for this accepted plan purchase, not live catalog definitions. */
export interface CustomerGroupAcceptedTerms {
  plan: CustomerGroupPlanSnapshot;
  deliveries: CustomerGroupDeliveryTerms[];
  billing_address: Address | null;
}

export interface CustomerGroupPlanSnapshot {
  source_customer_group_id: string;
  source_customer_group_plan_id: string;
  group_key: string;
  group_name: DisplayTextSnapshot;
  plan_key: string;
  plan_name: DisplayTextSnapshot;
  term: CustomerGroupPlanTerm;
  price: AppliedPriceSnapshot;
  membership_allocation_weight: number;
  membership_tax_category_id: string | null;
  benefits: CustomerGroupBenefitSnapshot[];
}

export interface CustomerGroupProductSnapshot extends Omit<
  OrderProductSnapshot,
  "price"
> {
  tax_category_id: string | null;
}

export interface CustomerGroupDigitalSnapshot extends Omit<
  OrderDigitalSnapshot,
  "price"
> {
  tax_category_id: string | null;
}

export type CustomerGroupBenefitSnapshotType =
  | {
      type: "product";
      snapshot: CustomerGroupProductSnapshot;
      quantity: CustomerGroupProductQuantity;
      delivery: CustomerGroupDeliverySchedule;
    }
  | { type: "digital_product"; snapshot: CustomerGroupDigitalSnapshot }
  | {
      type: "rental";
      snapshot: CustomerGroupProductSnapshot;
      quantity: number;
      inventory_item_id: string;
    };

export interface CustomerGroupBenefitSnapshot {
  id: string;
  type: CustomerGroupBenefitSnapshotType;
  allocation_weight: number;
}

export interface CustomerGroupDeliveryTerms {
  id: string;
  benefit_ids: string[];
  destination: OrderDeliveryDestinationSnapshot;
  source_shipping_method_id: string;
  source_shipping_profile_id: string;
  base_fee: Money;
  tax_mode: TaxMode;
  acceptance_digest: string;
}

export type OrderCustomerGroupTerms =
  | { type: "initial"; terms: CustomerGroupAcceptedTerms }
  | { type: "accepted_revision" };

export type CustomerGroupPurchaseOccurrence =
  | { type: "permanent"; starts_at: EpochMilliseconds }
  | { type: "period"; occurrence_index: number; period: BillingPeriod };

export interface BillingPeriod {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export interface OrderCustomerGroupPlanItem {
  id: string;
  customer_group_subscription_id: string;
  revision_id: string;
  terms: OrderCustomerGroupTerms;
  occurrence: CustomerGroupPurchaseOccurrence;
  revocation: OrderAccessRevocation | null;
  status: OrderItemStatus;
  money: LineMoneySnapshot;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PurchaseOrigin =
  | { type: "storefront"; customer_id: string; customer_session_id: string }
  | { type: "admin"; actor: AccountActor };

export interface PurchaseCustomerSnapshot {
  email: string | null;
  authentication:
    | { type: "visitor" }
    | { type: "email_authenticated"; authenticated_at: EpochMilliseconds }
    | null;
  source_customer_id: string | null;
  source_email_identity_id: string | null;
}

export interface CompanySnapshot {
  name: string;
  legal_name: string | null;
  registration_number: string | null;
  contact_email: string | null;
  source_company_id: string;
}

export interface SalesChannelSnapshot {
  key: string;
  name: string;
  source_sales_channel_id: string;
}

export interface PurchaseQuoteContext {
  market_id: string;
  market_snapshot: MarketSnapshot;
  sales_channel_id: string;
  sales_channel_snapshot: SalesChannelSnapshot;
  customer_id: string | null;
  customer_snapshot: PurchaseCustomerSnapshot | null;
  company_id: string | null;
  company_location_id: string | null;
  company_snapshot: CompanySnapshot | null;
  company_location_snapshot: CompanyLocationSnapshot | null;
  origin: PurchaseOrigin;
}
