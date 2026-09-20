import type { AccountActor } from "./accountActor";
import type { TaxExemption, TaxRegistration } from "./companyLocation";
import type { PostalAddress, TaxMode } from "./index";
import type { UnitSpan } from "./orderContract";
import type { TaxCalculation } from "./tax";
import type { EpochMilliseconds } from "./time";

export type DiscountAllocationSource =
  | {
      type: "promotion";
      promotion_id: string;
      effect_id: string;
      promotion_code_id: string | null;
    }
  | { type: "manual"; actor: AccountActor; reason: string };

export interface DiscountAllocation {
  id: string;
  source: DiscountAllocationSource;
  amount: number;
}

export type TaxLineSource = { type: "arky_component"; component_id: string };

export interface TaxLine {
  id: string;
  title: string;
  calculation: TaxCalculation;
  amount: number;
  taxable_base: number;
  included_in_price: boolean;
  jurisdiction_country: string | null;
  jurisdiction_region: string | null;
  jurisdiction_postal_code: string | null;
  source: TaxLineSource;
  component_index: number;
}

export interface DutyLine {
  id: string;
  title: string;
  code: string | null;
  amount: number;
  jurisdiction_country: string | null;
}

export type TaxNotRequiredReason = {
  type: "noncommercial_customer_group_grant";
};

export type TaxAssessmentSnapshot =
  | {
      type: "not_required";
      reason: TaxNotRequiredReason;
      policy_version: string;
      decided_at: EpochMilliseconds;
    }
  | { type: "assessed"; assessment: AssessedTaxSnapshot };

export type AcceptedTaxTreatment =
  | { type: "rates" }
  | {
      type:
        | "not_collecting"
        | "not_taxable"
        | "zero_rated"
        | "exempt"
        | "reverse_charge";
      reason_code: string;
    };

export type TaxAddressBasis = {
  type:
    "delivery" | "pickup" | "billing" | "service_location" | "seller_origin";
};

export type TaxAssessmentSource = {
  type: "arky_rule";
  market_zone_id: string;
  tax_rule_id: string;
  tax_category_id: string | null;
  tax_category_key: string | null;
};

export type TaxLocationEvidenceType = {
  type:
    | "billing_address"
    | "delivery_address"
    | "payment_method_country"
    | "ip_country"
    | "service_location";
};

export interface TaxLocationEvidence {
  type: TaxLocationEvidenceType;
  country: string;
  evidence_digest: string;
  observed_at: EpochMilliseconds;
}

export interface BuyerTaxEvidence {
  source_company_location_id: string;
  registration: TaxRegistration | null;
  exemption: TaxExemption | null;
  treatment_policy_id: string;
  verified_by: AccountActor;
  verified_at: EpochMilliseconds;
}

export interface AssessedTaxSnapshot {
  tax_mode: TaxMode;
  treatment: AcceptedTaxTreatment;
  address_basis: TaxAddressBasis;
  address: PostalAddress;
  location_evidence: TaxLocationEvidence[];
  source: TaxAssessmentSource;
  policy_version: string;
  rounding_version: string;
  assessed_at: EpochMilliseconds;
  tax_date: EpochMilliseconds;
  buyer_evidence: BuyerTaxEvidence | null;
}

export interface LineMoneySnapshot {
  unit_price: number;
  subtotal: number;
  discount_allocations: DiscountAllocation[];
  discount_total: number;
  tax_lines: TaxLine[];
  tax_total: number;
  duty_lines: DutyLine[];
  duty_total: number;
  total: number;
  tax_assessment: TaxAssessmentSnapshot;
}

export interface ProductMoneyTotals {
  subtotal: number;
  discount_total: number;
  tax_total: number;
  duty_total: number;
  total: number;
}

export interface AcceptedProductMoneyRun {
  id: string;
  span: UnitSpan;
  delivery_group_id: string | null;
  per_unit: LineMoneySnapshot;
}
