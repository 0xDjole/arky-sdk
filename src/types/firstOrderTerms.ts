import type { AccountActor } from "./accountActor";
import type { AppliedPriceSnapshot, SubscriptionPlanSnapshot } from "./commerce";
import type { Money } from "./index";
import type { DutyLine, TaxAssessmentSnapshot, TaxLine } from "./orderMoney";
import type { SellableRef } from "./sellable";
import type { EpochMilliseconds } from "./time";

export interface FirstOrderVersionRef {
  cart_id: string;
  version_id: string;
  terms_digest: string;
}

export interface FirstOrderSeal {
  request_id: string;
  actor: AccountActor;
  at: EpochMilliseconds;
}

export interface FirstOrderSupersession {
  replacement: FirstOrderVersionRef;
  seal: FirstOrderSeal;
}

export interface FirstOrderTaxBasis {
  assessment: TaxAssessmentSnapshot;
  tax_lines: TaxLine[];
  duty_lines: DutyLine[];
}

export interface FirstOrderLineTerms {
  line_item_id: string;
  sellable: SellableRef;
  base_price: AppliedPriceSnapshot;
  reviewed_quantity: number;
  source_price_updated_at: EpochMilliseconds | null;
  source_price_digest: string | null;
  rebate_per_unit: number;
  net_unit_price: Money;
  plan: SubscriptionPlanSnapshot | null;
  tax_basis: FirstOrderTaxBasis[];
  source_digest: string;
}

export interface FirstOrderTerms {
  cart_id: string;
  version_id: string;
  review_request_id: string;
  store_id: string;
  customer_id: string;
  company_id: string;
  company_location_id: string;
  market_id: string;
  sales_channel_id: string;
  reviewed_by: AccountActor;
  reviewed_at: EpochMilliseconds;
  reviewed_quote_digest: string;
  selection_digest: string;
  lines: FirstOrderLineTerms[];
  supersedes: FirstOrderVersionRef | null;
  seal: FirstOrderSeal | null;
  superseded_by: FirstOrderSupersession | null;
  terms_digest: string;
}

export interface ReviewFirstOrderTermsParams {
  store_id: string;
  id: string;
  request_id: string;
  version_id: string;
  expected_updated_at: EpochMilliseconds;
  presentation_digest: string;
  locale: string | null;
  supersedes: FirstOrderVersionRef | null;
}

export interface SealFirstOrderTermsParams {
  store_id: string;
  id: string;
  request_id: string;
  version_id: string;
  terms_digest: string;
  expected_updated_at: EpochMilliseconds;
}

export interface WithdrawFirstOrderTermsParams {
  store_id: string;
  id: string;
  version_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface RepeatBranchCartParams {
  request_id: string;
  recovery_token: string;
  company_id: string;
  company_location_id: string;
}

export interface RepeatOrderSource {
  request_id: string;
  source_order_id: string;
  source_order_digest: string;
  request_digest: string;
}
