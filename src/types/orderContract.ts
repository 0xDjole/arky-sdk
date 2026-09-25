import type { Address, Block, Currency, Money, Parcel, TimeRange } from "./index";
import type { CompanySnapshot } from "./commerce";
import type { CompanyLocationCommercePolicy, CompanyLocationTaxSettings, TaxRegistration } from "./companyLocation";
import type { LineMoneySnapshot } from "./orderMoney";
import type { ShippingRateAdjustment } from "./shipping";
import type { ShippingDeliveryEstimate } from "./quote";
import type { AccountActor } from "./accountActor";
import type { EpochMilliseconds } from "./time";

export interface MarketSnapshot {
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
  source_market_id: string;
}

export type TaxMode = "inclusive" | "exclusive";

export type CustomerAuthenticationSnapshot =
  | { type: "visitor" }
  | { type: "email_authenticated"; authenticated_at: EpochMilliseconds };

export type PurchaseOriginSnapshot =
  | {
      type: "storefront";
      customer_id: string;
      customer_session_id: string;
      authentication: CustomerAuthenticationSnapshot;
    }
  | { type: "admin"; actor: AccountActor }
  | { type: "subscription"; authorization_digest: string };

export interface CompanyLocationSnapshot {
  name: string;
  shipping_address: Address | null;
  billing_address: Address | null;
  tax: CompanyLocationTaxSettings;
  commerce: CompanyLocationCommercePolicy;
  source_company_location_id: string;
}

export interface SellerProfile {
  legal_name: string;
  address: Address;
  registration_number: string | null;
  tax_registrations: SellerTaxRegistration[];
}

export interface SellerTaxRegistration {
  registration: TaxRegistration;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
}

export interface SellerSnapshot {
  profile: SellerProfile;
  configuration_digest: string;
}

export type InvoiceIssueTrigger = { type: "acceptance" } | { type: "confirmation" };

export type OrderInvoicePolicy =
  | { type: "not_required"; reason: string }
  | { type: "native"; series_key: string; issue_trigger: InvoiceIssueTrigger }
  | { type: "external" };

export type RenewalRecoveryStatus =
  | { type: "recovering" }
  | { type: "exhausted"; exhausted_at: EpochMilliseconds; command_id: string }
  | { type: "resolved"; resolved_at: EpochMilliseconds };

export interface RenewalRecovery {
  first_failure_at: EpochMilliseconds;
  retries_started: number;
  status: RenewalRecoveryStatus;
}

export type ReconciliationState =
  | { type: "clear" }
  | { type: "hold"; reason: string; opened_at: EpochMilliseconds };

export type CollectionPolicySnapshot =
  | { type: "prepaid"; due_at: EpochMilliseconds }
  | { type: "cash_on_delivery" }
  | { type: "on_account"; authorized_by: AccountActor; reason: string };

export interface PromotionRedemption {
  id: string;
  order_id: string;
  promotion_id: string;
  promotion_code_id: string | null;
  customer_id: string;
  accepted_at: EpochMilliseconds;
}

export interface CheckoutPaymentAuthorization {
  allowed_provider_ids: string[];
  actor: PurchaseOriginSnapshot;
  accepted_at: EpochMilliseconds;
}

export type PaymentTermsType =
  | { type: "due_on_receipt" }
  | { type: "net_days"; days: number };

export interface PaymentTermsSnapshot {
  key: string;
  type: PaymentTermsType;
  due_at: EpochMilliseconds;
}

export type OrderDeliveryDestinationSnapshot =
  | { type: "delivery"; address: Address }
  | {
      type: "pickup";
      store_location_id: string | null;
      store_location_key: string;
      source_store_location_id: string;
      address: Address;
    };

export interface OrderDeliveryGroupItem {
  order_product_item_id: string;
  quantity: number;
  unit_spans: UnitSpan[];
}

export interface OrderDeliveryGroupRentalItem {
  rental_id: string;
  quantity: number;
}

export interface UnitSpan {
  first_unit: number;
  quantity: number;
}

export interface AcceptedDeliveryPricing {
  source_shipping_method_id: string;
  source_shipping_profile_id: string;
  selected_market_zone_id: string;
  source: AcceptedDeliveryPricingSource;
  policy_digest: string;
  customer_subtotal: Money;
  accepted_at: EpochMilliseconds;
  rounding_version: string;
}

export type AcceptedDeliveryPricingSource =
  | {
      type: "shipping_rate";
      source_shipping_rate_id: string;
      merchandise_basis: Money;
      weight_grams: number | null;
      calculation: AcceptedDeliveryCalculation;
      free_above_subtotal: number | null;
    }
  | {
      type: "subscription_terms";
      order_subscription_line_item_id: string;
      delivery_terms_id: string;
    };

export type AcceptedDeliveryCalculation =
  | { type: "flat"; amount: Money }
  | { type: "weight_tiered"; tier_index: number; upper_bound_grams: number | null; amount: Money }
  | { type: "arky_calculated"; legs: AcceptedCarrierQuoteLeg[]; adjustment: ShippingRateAdjustment };

export interface AcceptedCarrierQuoteLeg {
  id: string;
  provider_scope: string;
  provider_quote_id: string;
  source_origin_location_id: string;
  origin: Address;
  destination: Address;
  parcel: Parcel;
  items: OrderDeliveryGroupItem[];
  carrier: string;
  service: string;
  amount: Money;
  quoted_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
  response_digest: string;
}

export interface OrderDeliveryGroup {
  id: string;
  items: OrderDeliveryGroupItem[];
  rental_items: OrderDeliveryGroupRentalItem[];
  destination: OrderDeliveryDestinationSnapshot;
  shipping_method_id: string | null;
  shipping_rate_id: string | null;
  shipping_method_key: string;
  shipping_profile_key: string;
  content: Block[];
  delivery_estimate: ShippingDeliveryEstimate | null;
  money: LineMoneySnapshot;
  accepted_pricing: AcceptedDeliveryPricing;
  scheduled_window: TimeRange | null;
}
