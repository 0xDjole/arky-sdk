import type { EpochMilliseconds } from "./time";
import type {
  AccountActor,
  Actor,
  CompanyPartyQuery,
  Currency,
  EmailContact,
  PostalAddress,
  SortDirection,
  TaxMode,
  TaxRate,
  TimeRange,
  UnitSpan,
} from "./common";
import type { PaymentTerms } from "./company";
import type { InventoryTracking } from "./inventory";
import type { BackorderPolicy } from "./product";
import type { OrderDeliveryEstimate } from "./shipping";
import type { PackagePriceRef } from "./package";
import type { PackageOccurrence } from "./packageMember";
import type { DocumentItem, OutsideCreditNoteDocument, OutsideInvoiceDocument } from "./invoice";
import type { OrderMoneyLeft, StorefrontOrderCredit } from "./orderCredit";
import type { ProductVariantMeasure } from "./product";
import type { Block } from "./block";

export type RenewalRecoveryStatus = "recovering" | "exhausted" | "resolved";

export interface RenewalRecovery {
  first_failure_at: EpochMilliseconds;
  retries_started: number;
  status: RenewalRecoveryStatus;
}

export type OrderSource =
  | { type: "cart"; cart_id: string; placed_by: Actor }
  | { type: "renewal"; recovery: RenewalRecovery | null };

export interface OrderContact {
  email: EmailContact | null;
  name: OrderContactName | null;
  phone: string | null;
}

export interface OrderContactName {
  first_name: string;
  last_name: string;
}

export interface OrderTaxRegistration {
  country: string;
  region: string | null;
  identifier: string;
}

export type OrderBuyerTax =
  | { type: "standard"; registrations: OrderTaxRegistration[] }
  | { type: "reverse_charge"; registration: OrderTaxRegistration }
  | { type: "exempt"; reason: string; registrations: OrderTaxRegistration[] };

export type OrderBuyer =
  | { type: "customer" }
  | {
      type: "company";
      company_id: string;
      purchase_order_number: string | null;
      tax: OrderBuyerTax;
    }
  | {
      type: "company_location";
      company_location_id: string;
      purchase_order_number: string | null;
      tax: OrderBuyerTax;
    };

export type OnAccountApproval = { type: "buyer_terms" } | { type: "account"; reason: string };

export type OrderCollection =
  | { type: "free" }
  | { type: "payment_option"; payment_option_id: string }
  | { type: "package_member" }
  | {
      type: "on_account";
      payment_option_id: string;
      terms: PaymentTerms;
      due_at: EpochMilliseconds;
      approval: OnAccountApproval;
    };

export type OrderCancellationReason =
  | "store_cancelled"
  | "customer_cancelled"
  | "payment_failed"
  | "expired";

export type OrderPaymentWait =
  | { type: "checkout"; expires_at: EpochMilliseconds }
  | { type: "renewal" }
  | { type: "manual" };

export type OrderLineItemStatus =
  | { type: "pending"; wait: OrderPaymentWait }
  | { type: "confirmed" }
  | { type: "cancelled"; reason: OrderCancellationReason };

export type OrderLineItemOrigin =
  | { type: "direct" }
  | { type: "package"; order_package_line_item_id: string; package_item_id: string };

export interface OrderAccessRevocation {
  actor: AccountActor;
  effective_at: EpochMilliseconds;
  reason: string;
}

export interface OrderInventoryRequirementSnapshot {
  inventory_item_id: string;
  inventory_item_key: string;
  quantity: number;
  weight_grams: number | null;
  tracking: InventoryTracking;
  sku: string | null;
}

export type OrderDigitalContent =
  | { type: "accepted_assets"; asset_ids: string[] }
  | { type: "current_bundle" };

export type OrderProductFulfillmentSnapshot =
  | { type: "none" }
  | {
      type: "physical";
      inventory_requirements: OrderInventoryRequirementSnapshot[];
      backorder: BackorderPolicy;
    }
  | {
      type: "digital";
      content: OrderDigitalContent;
      revocation: OrderAccessRevocation | null;
    };

export type OrderLinePrice =
  | ({ type: "listed" } & PackagePriceRef)
  | ({ type: "offer" } & PackagePriceRef)
  | { type: "package_allocation" };

export interface OrderProductSnapshot {
  product_key: string;
  variant_sku: string | null;
  variant_blocks: Block[];
  price: OrderLinePrice;
  fulfillment: OrderProductFulfillmentSnapshot;
  category_ids: string[];
  measure: ProductVariantMeasure;
}

export interface LineDiscount {
  promotion_id: string;
  effect_id: string;
  amount: number;
}

export type TaxLineCalculation =
  | { type: "percentage"; rate: TaxRate }
  | { type: "compound_percentage"; rate: TaxRate }
  | { type: "fixed_per_unit"; unit_amount: number };

export interface TaxLine {
  component_id: string;
  code: string | null;
  title: string;
  calculation: TaxLineCalculation;
  amount: number;
}

export type LineTaxTreatment =
  | { type: "rates"; lines: TaxLine[] }
  | { type: "not_collecting"; reason: string }
  | { type: "not_taxable"; reason: string }
  | { type: "zero_rated"; reason: string }
  | { type: "exempt"; reason: string };

export type DeliveryTaxSource =
  | { type: "own"; tax_category_id: string; rule_id: string; treatment: LineTaxTreatment }
  | { type: "reverse_charge"; tax_category_id: string }
  | { type: "buyer_exempt"; tax_category_id: string };

export interface DeliveryTaxPart {
  line_item_id: string;
  span: UnitSpan;
  discounted_base_amount: number;
  tax: DeliveryTaxSource;
}

export type LineTax =
  | { type: "own"; tax_category_id: string; rule_id: string; treatment: LineTaxTreatment }
  | { type: "reverse_charge"; tax_category_id: string }
  | { type: "buyer_exempt"; tax_category_id: string }
  | { type: "follow_goods"; parts: DeliveryTaxPart[] };

export interface LineMoney {
  unit_price: number;
  discounts: LineDiscount[];
  tax: LineTax;
}

export type TaxPlace =
  | { type: "delivery"; delivery_group_id: string }
  | { type: "billing" };

export interface ProductMoneyRun {
  span: UnitSpan;
  taxed_at: TaxPlace;
  money: LineMoney;
}

export interface OrderProductLineItem {
  id: string;
  origin: OrderLineItemOrigin;
  variant_id: string;
  quantity: number;
  cancelled_units: UnitSpan[];
  form_submission_id: string | null;
  snapshot: OrderProductSnapshot;
  document_item: DocumentItem;
  status: OrderLineItemStatus;
  money_runs: ProductMoneyRun[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type OrderBookingLinePrice = ({ type: "listed" } & PackagePriceRef) | ({ type: "offer" } & PackagePriceRef);

export interface OrderBookingSnapshot {
  service_key: string;
  resource_key: string;
  timezone: string;
  price: OrderBookingLinePrice;
  document_item: DocumentItem;
}

export type OrderBookingLineAddOnPrice = { type: "free" } | { type: "listed"; price: PackagePriceRef; amount: number };

export type OrderBookingLineAddOnStatus =
  | { type: "held" }
  | { type: "taken_off"; by: AccountActor; at: EpochMilliseconds };

export interface OrderBookingLineAddOn {
  booked_add_on_id: string;
  add_on_id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  service_key: string;
  resource_key: string;
  interval: TimeRange;
  capacity_intervals: TimeRange[];
  price: OrderBookingLineAddOnPrice;
  form_submission_id: string | null;
  add_ons: OrderBookingLineAddOn[];
  status: OrderBookingLineAddOnStatus;
}

export type OrderBookingChangeType =
  | {
      type: "line";
      previous_interval: TimeRange;
      previous_booking_resource_id: string;
      previous_store_location_id: string;
    }
  | { type: "add_on"; booked_add_on_id: string; previous_interval: TimeRange; previous_booking_resource_id: string }
  | { type: "add_on_added"; booked_add_on_id: string }
  | { type: "offering_changed"; previous_booking_offering_id: string };

export interface OrderBookingChange {
  type: OrderBookingChangeType;
  by: Actor;
  at: EpochMilliseconds;
}

export type BookingResponder =
  | { type: "link" }
  | { type: "customer"; customer_session_id: string }
  | { type: "account"; actor: AccountActor }
  | { type: "assistant"; conversation_message_id: string };

export type BookingResponse =
  | { type: "unanswered" }
  | { type: "coming"; by: BookingResponder; at: EpochMilliseconds }
  | { type: "change_requested"; by: BookingResponder; at: EpochMilliseconds };

export type BookingAnswer = "coming" | "change_requested";

export interface VisitMark {
  by: AccountActor;
  at: EpochMilliseconds;
}

export type OrderBookingAttendance =
  | { type: "upcoming"; response: BookingResponse }
  | { type: "waiting"; arrived: VisitMark }
  | { type: "in_progress"; arrived: VisitMark; started: VisitMark }
  | { type: "attended"; arrived: VisitMark | null; started: VisitMark | null; finished: VisitMark }
  | { type: "no_show"; marked: VisitMark };

export type VisitStep = "upcoming" | "waiting" | "in_progress" | "attended" | "no_show";

export type OrderBookingLineStatus =
  | { type: "pending"; wait: OrderPaymentWait }
  | { type: "confirmed"; attendance: OrderBookingAttendance }
  | { type: "cancelled"; reason: OrderCancellationReason };

export interface OrderBookingLineItem {
  id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  store_location_id: string;
  customer_id: string;
  interval: TimeRange;
  total_interval: TimeRange;
  capacity_intervals: TimeRange[];
  add_ons: OrderBookingLineAddOn[];
  capacity_units: number;
  form_submission_id: string | null;
  snapshot: OrderBookingSnapshot;
  status: OrderBookingLineStatus;
  changes: OrderBookingChange[];
  money: LineMoney;
  session: BookingLineSession | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface BookingLineSession {
  package_member_id: string;
  package_item_id: string;
}

export interface OrderPackageLineItem {
  id: string;
  package_member_id: string;
  package_member_revision_id: string;
  occurrence: PackageOccurrence;
  revocation: OrderAccessRevocation | null;
  status: OrderLineItemStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderRentalUseLineItem {
  id: string;
  rental_id: string;
  origin: OrderLineItemOrigin;
  snapshot: OrderProductSnapshot;
  quantity: number;
  status: OrderLineItemStatus;
  money: LineMoney;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type OrderLineItem =
  | ({ type: "product" } & OrderProductLineItem)
  | ({ type: "booking" } & OrderBookingLineItem)
  | ({ type: "package" } & OrderPackageLineItem)
  | ({ type: "rental_use" } & OrderRentalUseLineItem);

export type OrderLineItemType = OrderLineItem["type"];

export type OrderDeliveryDestination =
  | { type: "delivery"; address: PostalAddress }
  | { type: "pickup"; store_location_id: string; address: PostalAddress };

export type DeliveryPricing =
  | { type: "rate"; rate_id: string }
  | { type: "package_delivery_terms"; delivery_terms_id: string };

export type OrderDeliveryTiming =
  | { type: "asap" }
  | { type: "window"; from: EpochMilliseconds; to: EpochMilliseconds };

export interface OrderDeliveryRental {
  rental_id: string;
  newly_shipped_quantity: number;
}

export interface OrderDeliveryGroup {
  id: string;
  destination: OrderDeliveryDestination;
  shipping_method_id: string;
  shipping_profile_id: string;
  pricing: DeliveryPricing;
  timing: OrderDeliveryTiming;
  delivery_estimate: OrderDeliveryEstimate | null;
  rentals: OrderDeliveryRental[];
  money: LineMoney;
  document_item: DocumentItem;
}

export type OrderPromotionActivation =
  | { type: "code"; promotion_code_id: string; code: string }
  | { type: "automatic" };

export interface OrderPromotion {
  promotion_id: string;
  promotion_key: string;
  activation: OrderPromotionActivation;
}

export type OrderStatus = "pending" | "confirmed" | "partially_cancelled" | "cancelled";

export type OrderPlaceOfSale =
  | { type: "none" }
  | { type: "store_location"; store_location_id: string };

export interface MoneyTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface OrderLineTotals extends MoneyTotals {
  line_item_id: string;
}

export interface OrderDeliveryTotals extends MoneyTotals {
  delivery_group_id: string;
}

export interface OrderTotals {
  subtotal: number;
  delivery: number;
  discount: number;
  tax: number;
  total: number;
  line_items: OrderLineTotals[];
  delivery_groups: OrderDeliveryTotals[];
}

export interface Order {
  id: string;
  blocks: Block[];
  number: string;
  store_id: string;
  source: OrderSource;
  customer_id: string;
  contact: OrderContact;
  buyer: OrderBuyer;
  market_id: string;
  sales_channel_id: string;
  place_of_sale: OrderPlaceOfSale;
  tax_mode: TaxMode;
  collection: OrderCollection;
  line_items: OrderLineItem[];
  delivery_groups: OrderDeliveryGroup[];
  currency: Currency;
  promotions: OrderPromotion[];
  billing_address: PostalAddress | null;
  language: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  status: OrderStatus;
  totals: OrderTotals;
}

export interface OrderDetail extends Order {
  money_left: OrderMoneyLeft;
}

export type StorefrontOrderSource =
  | { type: "cart"; cart_id: string; placed_by: StorefrontOrderPlacer }
  | { type: "renewal"; recovery: RenewalRecovery | null };

export type StorefrontOrderPlacer = { type: "customer"; customer_id: string } | { type: "account" };

export type StorefrontOnAccountApproval = { type: "buyer_terms" } | { type: "account" };

export type StorefrontOrderCollection =
  | { type: "free" }
  | { type: "payment_option"; payment_option_id: string }
  | { type: "package_member" }
  | {
      type: "on_account";
      payment_option_id: string;
      terms: PaymentTerms;
      due_at: EpochMilliseconds;
      approval: StorefrontOnAccountApproval;
    };

export interface StorefrontAccessRevocation {
  effective_at: EpochMilliseconds;
}

export type StorefrontOrderProductFulfillmentSnapshot =
  | { type: "none" }
  | {
      type: "physical";
      inventory_requirements: OrderInventoryRequirementSnapshot[];
      backorder: BackorderPolicy;
    }
  | {
      type: "digital";
      content: OrderDigitalContent;
      revocation: StorefrontAccessRevocation | null;
    };

export interface StorefrontOrderProductSnapshot {
  product_key: string;
  variant_sku: string | null;
  variant_blocks: Block[];
  price: OrderLinePrice;
  fulfillment: StorefrontOrderProductFulfillmentSnapshot;
  category_ids: string[];
  measure: ProductVariantMeasure;
}

export interface StorefrontOrderProductLineItem {
  id: string;
  origin: OrderLineItemOrigin;
  variant_id: string;
  quantity: number;
  cancelled_units: UnitSpan[];
  form_submission_id: string | null;
  snapshot: StorefrontOrderProductSnapshot;
  document_item: DocumentItem;
  status: OrderLineItemStatus;
  money_runs: ProductMoneyRun[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontBookingResponse =
  | { type: "unanswered" }
  | { type: "coming"; at: EpochMilliseconds }
  | { type: "change_requested"; at: EpochMilliseconds };

export interface StorefrontVisitMark {
  at: EpochMilliseconds;
}

export type StorefrontBookingAttendance =
  | { type: "upcoming"; response: StorefrontBookingResponse }
  | { type: "waiting"; arrived: StorefrontVisitMark }
  | { type: "in_progress"; arrived: StorefrontVisitMark; started: StorefrontVisitMark }
  | {
      type: "attended";
      arrived: StorefrontVisitMark | null;
      started: StorefrontVisitMark | null;
      finished: StorefrontVisitMark;
    }
  | { type: "no_show"; marked: StorefrontVisitMark };

export interface BookingAnswerResult {
  order_id: string;
  order_booking_item_id: string;
  starts_at: EpochMilliseconds;
  response: StorefrontBookingResponse;
}

export type StorefrontOrderBookingLineStatus =
  | { type: "pending"; wait: OrderPaymentWait }
  | { type: "confirmed"; attendance: StorefrontBookingAttendance }
  | { type: "cancelled"; reason: OrderCancellationReason };

export type StorefrontBookingAddOnStatus = { type: "held" } | { type: "taken_off"; at: EpochMilliseconds };

export interface StorefrontOrderBookingLineAddOn {
  booked_add_on_id: string;
  add_on_id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  service_key: string;
  resource_key: string;
  interval: TimeRange;
  price: OrderBookingLineAddOnPrice;
  form_submission_id: string | null;
  add_ons: StorefrontOrderBookingLineAddOn[];
  status: StorefrontBookingAddOnStatus;
}

export interface StorefrontBookingChange {
  type: OrderBookingChangeType;
  at: EpochMilliseconds;
}

export interface StorefrontOrderBookingLineItem {
  id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  store_location_id: string;
  interval: TimeRange;
  total_interval: TimeRange;
  capacity_intervals: TimeRange[];
  add_ons: StorefrontOrderBookingLineAddOn[];
  capacity_units: number;
  form_submission_id: string | null;
  snapshot: OrderBookingSnapshot;
  status: StorefrontOrderBookingLineStatus;
  changes: StorefrontBookingChange[];
  money: LineMoney;
  session: BookingLineSession | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontOrderPackageLineItem {
  id: string;
  package_member_id: string;
  package_member_revision_id: string;
  occurrence: PackageOccurrence;
  revocation: StorefrontAccessRevocation | null;
  status: OrderLineItemStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontOrderRentalUseLineItem {
  id: string;
  rental_id: string;
  origin: OrderLineItemOrigin;
  snapshot: StorefrontOrderProductSnapshot;
  quantity: number;
  status: OrderLineItemStatus;
  money: LineMoney;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontOrderLineItem =
  | ({ type: "product" } & StorefrontOrderProductLineItem)
  | ({ type: "booking" } & StorefrontOrderBookingLineItem)
  | ({ type: "package" } & StorefrontOrderPackageLineItem)
  | ({ type: "rental_use" } & StorefrontOrderRentalUseLineItem);

export type StorefrontOrderInvoiceType =
  | { type: "unissued_invoice"; reason: import("./invoice").UnissuedInvoiceReason }
  | { type: "invoice"; number: string; issued_at: EpochMilliseconds }
  | { type: "reversed_invoice"; number: string; issued_at: EpochMilliseconds }
  | { type: "credit_note"; invoice_id: string; number: string; issued_at: EpochMilliseconds }
  | { type: "reversal"; invoice_id: string; number: string; issued_at: EpochMilliseconds }
  | { type: "outside_invoice"; number: string; document: OutsideInvoiceDocument }
  | { type: "outside_credit_note"; invoice_id: string; number: string; document: OutsideCreditNoteDocument };

export interface StorefrontOrderInvoice {
  id: string;
  type: StorefrontOrderInvoiceType;
  created_at: EpochMilliseconds;
}

export type StorefrontOrderReceiptType =
  | "sale"
  | "advance"
  | "next_advance"
  | "advance_settle"
  | "advance_return"
  | "advance_correction"
  | "final"
  | "refund"
  | "correction"
  | "copy";

export type StorefrontTaxCoreReceiptState =
  | { type: "requested" }
  | { type: "sending" }
  | { type: "done"; invoice_number: string; verification_url: string }
  | { type: "done_on_other_device"; invoice_number: string }
  | { type: "refused" }
  | { type: "unknown" }
  | { type: "confirmed_not_issued" };

export type StorefrontFbihPrinterReceiptState =
  | { type: "requested" }
  | { type: "sending" }
  | { type: "done"; receipt_number: number }
  | { type: "written_by_hand"; hand_number: string }
  | { type: "printing_after_hand"; hand_number: string }
  | { type: "done_after_hand"; hand_number: string; receipt_number: number }
  | { type: "print_failed_after_hand"; hand_number: string }
  | { type: "done_on_other_device"; receipt_number: string }
  | { type: "refused" }
  | { type: "unknown" }
  | { type: "confirmed_not_issued" };

export type StorefrontCroatiaReceiptState =
  | { type: "requested" }
  | { type: "sending" }
  | { type: "done"; jir: string }
  | { type: "issued_offline" }
  | { type: "delivering" }
  | { type: "refused" };

export type StorefrontOrderReceiptDocument =
  | { type: "tax_core"; state: StorefrontTaxCoreReceiptState }
  | { type: "fbih_printer"; state: StorefrontFbihPrinterReceiptState }
  | { type: "croatia_cis"; number: string; state: StorefrontCroatiaReceiptState };

export interface StorefrontOrderReceipt {
  id: string;
  type: StorefrontOrderReceiptType;
  document: StorefrontOrderReceiptDocument;
  created_at: EpochMilliseconds;
}

export interface StorefrontOrder {
  id: string;
  blocks: Block[];
  number: string;
  invoices: StorefrontOrderInvoice[];
  receipts: StorefrontOrderReceipt[];
  credits: StorefrontOrderCredit[];
  store_id: string;
  source: StorefrontOrderSource;
  customer_id: string;
  contact: OrderContact;
  buyer: OrderBuyer;
  market_id: string;
  sales_channel_id: string;
  place_of_sale: OrderPlaceOfSale;
  tax_mode: TaxMode;
  collection: StorefrontOrderCollection;
  line_items: StorefrontOrderLineItem[];
  delivery_groups: OrderDeliveryGroup[];
  currency: Currency;
  promotions: OrderPromotion[];
  billing_address: PostalAddress | null;
  language: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  status: OrderStatus;
  totals: OrderTotals;
}

export interface OrderBookingItem {
  store_id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  contact: OrderContact;
  line: OrderBookingLineItem;
}

export type OrderSourceFilter = "cart" | "renewal";

export type OrderItemStatusFilter = "pending" | "confirmed" | "cancelled";

export type OrderBookingStatusFilter =
  | "pending"
  | "confirmed"
  | "waiting"
  | "in_progress"
  | "attended"
  | "no_show"
  | "cancelled";

export interface FindOrdersParams {
  store_id: string;
  customer_id?: string;
  company_id?: string;
  company_location_id?: string;
  statuses?: OrderStatus[];
  sources?: OrderSourceFilter[];
  product_statuses?: OrderItemStatusFilter[];
  booking_statuses?: OrderBookingStatusFilter[];
  product_ids?: string[];
  booking_service_ids?: string[];
  booking_resource_ids?: string[];
  from?: EpochMilliseconds;
  to?: EpochMilliseconds;
  query?: string;
  sort_field?: "number" | "created_at" | "updated_at" | "status" | "price";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  updated_at_from?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetOrderParams {
  store_id: string;
  id: string;
}

export interface UpdateOrderParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  contact?: OrderContact;
  blocks?: Block[];
}

export interface CorrectOrderDeliveryAddressParams {
  store_id: string;
  order_id: string;
  delivery_group_id: string;
  expected_updated_at: EpochMilliseconds;
  address: PostalAddress;
}

export interface FindOrderBookingItemsParams {
  store_id: string;
  customer_id?: string;
  booking_service_ids?: string[];
  booking_resource_ids?: string[];
  statuses?: OrderBookingStatusFilter[];
  from?: EpochMilliseconds;
  to?: EpochMilliseconds;
  query?: string;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface RevokeOrderAccessParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  line_item_id: string;
  effective_at: EpochMilliseconds;
  reason: string;
}

export interface CancelOrderBookingItemParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
  notify_customer: boolean;
}

export interface RescheduleOrderBookingItemParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  expected_updated_at: EpochMilliseconds;
  starts_at: EpochMilliseconds;
  notify_customer: boolean;
}

export interface ResizeOrderBookingItemParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  expected_updated_at: EpochMilliseconds;
  ends_at: EpochMilliseconds;
}

export type OrderBookingAddOnOffering = { type: "any" } | { type: "offering"; booking_offering_id: string };

export type OrderBookingResourcePick = { type: "any" } | { type: "resource"; booking_resource_id: string };

export type OrderBookingItemUpdate =
  | { type: "start"; starts_at: EpochMilliseconds }
  | { type: "length"; ends_at: EpochMilliseconds }
  | { type: "branch"; store_location_id: string }
  | { type: "offering"; booking_offering_id: string }
  | { type: "resource"; booking_resource_id: string }
  | { type: "add_on"; booked_add_on_id: string; starts_at: EpochMilliseconds; booking_resource_id: string }
  | { type: "add_add_on"; add_on_id: string; offering: OrderBookingAddOnOffering; resource: OrderBookingResourcePick };

export interface UpdateOrderBookingItemParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  expected_updated_at: EpochMilliseconds;
  update: OrderBookingItemUpdate;
  notify_customer: boolean;
}

export interface TakeOffOrderBookingAddOnParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  booked_add_on_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CancelOrderProductItemParams {
  store_id: string;
  order_id: string;
  line_item_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
  notify_customer: boolean;
  units: UnitSpan[];
}

export interface CancelOrderParams {
  store_id: string;
  order_id: string;
  expected_updated_at: EpochMilliseconds;
  notify_customer: boolean;
}

export interface MarkOrderBookingItemParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface SupplyOrderBookingItemParams extends MarkOrderBookingItemParams {
  fiscal_device_id: string | null;
}

export type StepOrderBookingItemParams =
  | (MarkOrderBookingItemParams & { step: "upcoming" | "waiting" | "in_progress" })
  | (SupplyOrderBookingItemParams & { step: "attended" | "no_show" });

export interface AnswerOrderBookingItemParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  expected_updated_at: EpochMilliseconds;
  answer: BookingAnswer;
}

export interface ResendOrderReceiptParams {
  store_id: string;
  order_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetOrderFinancialSummaryParams {
  store_id: string;
  id: string;
}

export type OrderFinancialConcern =
  | { type: "payment_hold"; payment_id: string }
  | { type: "payment_unknown"; payment_id: string }
  | { type: "refund_unknown"; payment_id: string; refund_id: string }
  | { type: "open_dispute"; payment_id: string; dispute_id: string }
  | { type: "excess_collection" };

export interface OrderFinancialSummary {
  currency: Currency;
  total: number;
  active_credit: number;
  due: number;
  paid: number;
  refunded: number;
  refund_pending: number;
  disputed: number;
  net_paid: number;
  outstanding: number;
  excess: number;
  concerns: OrderFinancialConcern[];
}

export interface FindOrderFinancialSummariesParams {
  store_id: string;
  order_ids: string[];
}

export interface OrderFinancialSummaryOfOrder {
  order_id: string;
  summary: OrderFinancialSummary;
}

export interface GetOrderPaymentParams {
  store_id: string;
  order_id: string;
  payment_id: string;
}

export interface FindOrderPaymentsParams {
  store_id: string;
  order_id: string;
}

export interface ResumeOrderPaymentParams {
  store_id: string;
  order_id: string;
}

export type StorefrontFindOrdersParams = CompanyPartyQuery &
  Omit<FindOrdersParams, "store_id" | "customer_id" | "company_id" | "company_location_id">;

export interface StorefrontGetOrderParams {
  id: string;
}

export interface StorefrontCancelOrderBookingItemParams {
  order_id: string;
  order_booking_item_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
}

export type StorefrontRescheduleOrderBookingItemParams = Omit<
  RescheduleOrderBookingItemParams,
  "store_id" | "notify_customer"
>;

export interface StorefrontAnswerOrderBookingItemParams {
  order_id: string;
  order_booking_item_id: string;
  starts_at: EpochMilliseconds;
  answer: BookingAnswer;
}

export interface AnswerBookingByLinkParams {
  token: string;
  answer: BookingAnswer;
}

export interface StorefrontOrderPaymentParams {
  order_id: string;
  payment_id: string;
}

export interface StorefrontOrderInvoiceParams {
  order_id: string;
  invoice_id: string;
}

export interface StorefrontFindOrderPaymentsParams {
  order_id: string;
}

export interface StorefrontResumeOrderPaymentParams {
  order_id: string;
}

export interface StorefrontRetainedOrderTokenParams {
  order_id: string;
}

export interface StorefrontDownloadOrderAssetParams {
  order_id: string;
  line_item_id: string;
  asset_id: string;
}

export function orderLineItemsOfType<
  L extends OrderLineItem | StorefrontOrderLineItem,
  T extends OrderLineItemType,
>(order: { line_items: readonly L[] } | null, type: T): Extract<L, { type: T }>[] {
  return (order?.line_items ?? []).filter(
    (item): item is Extract<L, { type: T }> => item.type === type,
  );
}

export function orderProductItems<L extends OrderLineItem | StorefrontOrderLineItem>(
  order: { line_items: readonly L[] } | null,
) {
  return orderLineItemsOfType(order, "product");
}

export function orderBookingItems<L extends OrderLineItem | StorefrontOrderLineItem>(
  order: { line_items: readonly L[] } | null,
) {
  return orderLineItemsOfType(order, "booking");
}

export function orderPackageItems<L extends OrderLineItem | StorefrontOrderLineItem>(
  order: { line_items: readonly L[] } | null,
) {
  return orderLineItemsOfType(order, "package");
}

export function orderRentalUseItems<L extends OrderLineItem | StorefrontOrderLineItem>(
  order: { line_items: readonly L[] } | null,
) {
  return orderLineItemsOfType(order, "rental_use");
}
