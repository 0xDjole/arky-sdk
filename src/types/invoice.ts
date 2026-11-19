import type { CalendarDate, EpochMilliseconds } from "./time";
import type { Currency, PostalAddress, PostalAddressInput, TaxRate, UnitSpan } from "./common";

export type DocumentItem =
  | { type: "none" }
  | { type: "named"; name: string; unit: string }
  | { type: "coded"; code: string; name: string; unit: string };

export interface InvoiceNumber {
  sequence: number;
  text: string;
}

export type InvoiceSellerTax =
  | { type: "vat_registered"; tax_id: string; vat_id: string }
  | { type: "not_vat_registered"; tax_id: string };

export type InvoiceFooter =
  | { type: "none" }
  | { type: "text"; text: string };

export interface InvoiceSeller {
  name: string;
  address: PostalAddress;
  tax: InvoiceSellerTax;
  footer: InvoiceFooter;
}

export interface InvoiceTaxRegistration {
  country: string;
  region: string | null;
  identifier: string;
}

export type InvoiceBuyerTax =
  | { type: "standard"; registrations: InvoiceTaxRegistration[] }
  | { type: "reverse_charge"; registration: InvoiceTaxRegistration }
  | { type: "exempt"; reason: string; registrations: InvoiceTaxRegistration[] };

export type InvoicePurchaseOrder =
  | { type: "none" }
  | { type: "number"; number: string };

export type InvoiceBuyer =
  | { type: "person"; name: string; address: PostalAddress }
  | { type: "company"; name: string; address: PostalAddress; tax: InvoiceBuyerTax; purchase_order: InvoicePurchaseOrder }
  | {
      type: "company_location";
      company_name: string;
      location_name: string;
      address: PostalAddress;
      tax: InvoiceBuyerTax;
      purchase_order: InvoicePurchaseOrder;
    };

export type InvoicePlace =
  | { type: "office" }
  | { type: "store_location"; address: PostalAddress };

export type InvoiceSupply =
  | { type: "on"; date: CalendarDate }
  | { type: "period"; from: CalendarDate; to: CalendarDate };

export type InvoicePricing = "tax_included" | "tax_excluded";

export type InvoiceTarget =
  | { type: "product"; line_item_id: string; span: UnitSpan }
  | { type: "booking"; line_item_id: string }
  | { type: "delivery"; delivery_group_id: string };

export type InvoiceItem =
  | { type: "named"; name: string; unit: string }
  | { type: "coded"; code: string; name: string; unit: string };

export type InvoiceTaxCalculation =
  | { type: "percentage"; rate: TaxRate; base: number }
  | { type: "fixed_per_unit"; unit_amount: number; units: number };

export interface InvoiceTaxLine {
  title: string;
  code: string | null;
  calculation: InvoiceTaxCalculation;
  amount: number;
}

export type InvoiceLineTax =
  | { type: "rates"; lines: InvoiceTaxLine[] }
  | { type: "not_collecting"; reason: string }
  | { type: "not_taxable"; reason: string }
  | { type: "zero_rated"; reason: string }
  | { type: "exempt"; reason: string }
  | { type: "reverse_charge" }
  | { type: "buyer_exempt" };

export interface InvoiceLine {
  target: InvoiceTarget;
  item: InvoiceItem;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: InvoiceLineTax;
}

export type InvoiceTotalGroup =
  | { type: "percentage"; title: string; code: string | null; rate: TaxRate; base: number; amount: number }
  | { type: "fixed_per_unit"; title: string; code: string | null; unit_amount: number; units: number; amount: number }
  | { type: "not_collecting"; reason: string; base: number }
  | { type: "not_taxable"; reason: string; base: number }
  | { type: "zero_rated"; reason: string; base: number }
  | { type: "exempt"; reason: string; base: number }
  | { type: "reverse_charge"; base: number }
  | { type: "buyer_exempt"; base: number };

export interface InvoiceTotals {
  net: number;
  groups: InvoiceTotalGroup[];
  gross: number;
}

export interface InvoiceDocument {
  number: InvoiceNumber;
  issued_at: EpochMilliseconds;
  issued_on: CalendarDate;
  order_number: string;
  language: string;
  seller: InvoiceSeller;
  buyer: InvoiceBuyer;
  place: InvoicePlace;
  supplied: InvoiceSupply;
  currency: Currency;
  pricing: InvoicePricing;
  lines: InvoiceLine[];
  totals: InvoiceTotals;
}

export type InvoicePaymentReference =
  | { type: "plain"; reference: string }
  | { type: "model"; model: string; reference: string }
  | { type: "creditor"; reference: string };

export type InvoicePaymentDetails =
  | { type: "paid" }
  | { type: "due"; amount: number; due_on: CalendarDate }
  | {
      type: "due_by_bank_transfer";
      amount: number;
      due_on: CalendarDate;
      bank: string;
      account: string;
      reference: InvoicePaymentReference;
    };

export type InvoiceMemo =
  | { type: "none" }
  | { type: "text"; text: string };

export interface CorrectedInvoice {
  invoice_id: string;
  number: string;
  issued_on: CalendarDate;
}

export type CreditNoteSource = "cancellation" | "return" | "account" | "add_on_taken_off" | "system";

export type OutsideInvoiceDocument =
  | { type: "link"; url: string }
  | { type: "paper" };

export type OutsideCreditNoteDocument =
  | { type: "link"; url: string }
  | { type: "paper" };

export type UnissuedInvoiceReason = "awaiting_outside_number" | "awaiting_receipts" | "counter_held" | "blocked";

export type UnissuedInvoiceExplanation =
  | { type: "ready" }
  | { type: "paused" }
  | { type: "awaiting_outside_number" }
  | { type: "blocked"; code: string; message: string };

export interface UnissuedInvoice extends Invoice {
  type: { type: "unissued_invoice"; reason: UnissuedInvoiceReason };
  explanation: UnissuedInvoiceExplanation;
}

export type InvoiceType =
  | { type: "unissued_invoice"; reason: UnissuedInvoiceReason }
  | {
      type: "invoice";
      document: InvoiceDocument;
      payment_details: InvoicePaymentDetails;
      fiscal_receipt_ids: string[];
      memo: InvoiceMemo;
    }
  | {
      type: "reversed_invoice";
      document: InvoiceDocument;
      payment_details: InvoicePaymentDetails;
      fiscal_receipt_ids: string[];
      memo: InvoiceMemo;
    }
  | {
      type: "credit_note";
      document: InvoiceDocument;
      corrects: CorrectedInvoice;
      order_credit_id: string;
      source: CreditNoteSource;
    }
  | { type: "reversal"; document: InvoiceDocument; corrects: CorrectedInvoice; reason: string }
  | { type: "outside_invoice"; number: string; document: OutsideInvoiceDocument }
  | {
      type: "outside_credit_note";
      invoice_id: string;
      order_credit_id: string;
      number: string;
      document: OutsideCreditNoteDocument;
    };

export type InvoiceFiscalReceiptNumber =
  | { type: "pending" }
  | { type: "issued"; number: string };

export interface InvoiceFiscalReceipt {
  fiscal_receipt_id: string;
  number: InvoiceFiscalReceiptNumber;
}

export interface Invoice {
  id: string;
  store_id: string;
  order_id: string;
  type: InvoiceType;
  fiscal_receipts: InvoiceFiscalReceipt[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type InvoiceBuyerInput =
  | { type: "order" }
  | { type: "person"; name: string; address: PostalAddressInput }
  | { type: "company"; name: string; address: PostalAddressInput; tax: InvoiceBuyerTax; purchase_order: InvoicePurchaseOrder }
  | {
      type: "company_location";
      company_name: string;
      location_name: string;
      address: PostalAddressInput;
      tax: InvoiceBuyerTax;
      purchase_order: InvoicePurchaseOrder;
    };

export interface FindInvoicesParams {
  store_id: string;
  order_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetInvoiceParams {
  store_id: string;
  invoice_id: string;
}

export interface IssueInvoiceParams {
  store_id: string;
  order_id: string;
  buyer: InvoiceBuyerInput;
  memo: InvoiceMemo;
}

export interface ReissueInvoiceParams {
  store_id: string;
  invoice_id: string;
  expected_updated_at: EpochMilliseconds;
  reversal_id: string;
  new_invoice_id: string;
  reason: string;
  buyer: InvoiceBuyerInput;
  memo: InvoiceMemo;
  void_credit_ids: string[];
}

export interface ReissuedInvoice {
  reversed: Invoice;
  reversal: Invoice;
  invoice: Invoice;
}

export interface AttachOutsideInvoiceParams {
  store_id: string;
  order_id: string;
  number: string;
  document: OutsideInvoiceDocument;
}

export interface DetachOutsideInvoiceParams {
  store_id: string;
  invoice_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreateOutsideCreditNoteParams {
  store_id: string;
  invoice_id: string;
  id: string;
  order_credit_id: string;
  number: string;
  document: OutsideCreditNoteDocument;
}

export interface DeleteOutsideCreditNoteParams {
  store_id: string;
  invoice_id: string;
  expected_updated_at: EpochMilliseconds;
}

export type InvoiceCounterSeries =
  | { type: "store" }
  | { type: "croatia_device"; fiscal_device_id: string };

export type InvoiceCounterStatus = "open" | "held_after_restore";

export interface InvoiceCounter {
  id: string;
  store_id: string;
  series: InvoiceCounterSeries;
  year: number;
  last_number: number;
  status: InvoiceCounterStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindInvoiceCountersParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface ConfirmInvoiceCounterParams {
  store_id: string;
  invoice_counter_id: string;
  expected_updated_at: EpochMilliseconds;
  next_number: number;
}

export type StoreInvoicing =
  | { type: "none" }
  | { type: "outside" }
  | { type: "arky" };

export interface SetStoreInvoicingParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  invoicing: StoreInvoicing;
}

export type StoreSellerTax =
  | { type: "vat_registered"; tax_id: string; vat_id: string }
  | { type: "not_vat_registered"; tax_id: string };

export type StoreSellerPaymentReference =
  | { type: "plain" }
  | { type: "model"; model: "97" }
  | { type: "creditor" };

export type StoreSellerBankAccount =
  | { type: "none" }
  | { type: "account"; bank: string; account: string; reference: StoreSellerPaymentReference };

export type StoreSellerInvoiceFooter =
  | { type: "none" }
  | { type: "text"; text: string };

export interface StoreSeller {
  id: string;
  store_id: string;
  name: string;
  address: PostalAddress;
  tax: StoreSellerTax;
  bank_account: StoreSellerBankAccount;
  invoice_footer: StoreSellerInvoiceFooter;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetStoreSellerParams {
  store_id: string;
}

export interface CreateStoreSellerParams {
  store_id: string;
  id: string;
  name: string;
  address: PostalAddressInput;
  tax: StoreSellerTax;
  bank_account: StoreSellerBankAccount;
  invoice_footer: StoreSellerInvoiceFooter;
}

export interface UpdateStoreSellerParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  address: PostalAddressInput;
  tax: StoreSellerTax;
  bank_account: StoreSellerBankAccount;
  invoice_footer: StoreSellerInvoiceFooter;
}

export interface DeleteStoreSellerParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindUnissuedInvoicesParams {
  store_id: string;
  reason: UnissuedInvoiceReason;
  limit?: number;
  cursor?: string | null;
}
