import type { EpochMilliseconds } from "./time";
import type { AccountActor, PostalAddress, ProviderEffectError, ProviderOperationClaim, TaxRate, UnitSpan } from "./common";

export type FiscalTarget =
  | { type: "product"; line_item_id: string; span: UnitSpan }
  | { type: "booking"; line_item_id: string }
  | { type: "delivery"; delivery_group_id: string };

export type FiscalAdvanceChain = { type: "goods" } | { type: "target"; target: FiscalTarget };

export interface FiscalPaymentPart {
  payment_id: string;
  amount: number;
}

export type FiscalReceiptType =
  | { type: "sale"; targets: FiscalTarget[]; payments: FiscalPaymentPart[] }
  | { type: "advance"; chain: FiscalAdvanceChain; payments: FiscalPaymentPart[] }
  | { type: "next_advance"; previous_advance_receipt_id: string; payments: FiscalPaymentPart[] }
  | { type: "advance_settle"; advance_receipt_id: string }
  | { type: "advance_return"; advance_receipt_id: string; payment_id: string; refund_id: string }
  | { type: "advance_correction"; advance_receipt_id: string; by: AccountActor; reason: string }
  | { type: "final"; targets: FiscalTarget[]; settle_receipt_id: string; payments: FiscalPaymentPart[] }
  | { type: "refund"; original_receipt_id: string; payment_id: string; refund_id: string }
  | { type: "correction"; original_receipt_id: string; by: AccountActor; reason: string }
  | { type: "copy"; original_receipt_id: string };

export interface TaxCoreLine {
  target: FiscalTarget;
  name: string;
  unit: string;
  code: string;
  label: string;
  rate: TaxRate;
  quantity: number;
  unit_price: number;
}

export interface TaxCoreAdvanceLine {
  label: string;
  rate: TaxRate;
  amount: number;
}

export type TaxCoreBuyer =
  | { type: "anonymous" }
  | { type: "company"; tax_id: string }
  | { type: "identity_document"; number: string };

export type TaxCoreReceiptState =
  | { type: "requested" }
  | { type: "sending"; claim: ProviderOperationClaim }
  | { type: "done"; invoice_number: string; verification_url: string; signed_at: EpochMilliseconds; sdc_date_time: string }
  | { type: "done_on_other_device"; invoice_number: string; issued_at: EpochMilliseconds; by: AccountActor }
  | { type: "refused"; error: ProviderEffectError }
  | { type: "unknown"; error: ProviderEffectError }
  | { type: "confirmed_not_issued"; by: AccountActor };

export interface TaxCoreItemsDocument {
  lines: TaxCoreLine[];
  cashier: string;
  buyer: TaxCoreBuyer;
  state: TaxCoreReceiptState;
}

export interface TaxCoreAdvancesDocument {
  lines: TaxCoreAdvanceLine[];
  cashier: string;
  buyer: TaxCoreBuyer;
  state: TaxCoreReceiptState;
}

export type FbihPrinterLabel = "A" | "E" | "K";

export interface FbihPrinterLine {
  target: FiscalTarget;
  name: string;
  unit: string;
  label: FbihPrinterLabel;
  quantity: number;
  unit_price: number;
}

export type FbihPrinterReceiptState =
  | { type: "requested" }
  | { type: "sending"; claim: ProviderOperationClaim }
  | { type: "done"; receipt_number: number; printed_at: EpochMilliseconds }
  | { type: "written_by_hand"; hand_number: string; written_at: EpochMilliseconds; by: AccountActor }
  | {
      type: "printing_after_hand";
      hand_number: string;
      written_at: EpochMilliseconds;
      by: AccountActor;
      claim: ProviderOperationClaim;
    }
  | {
      type: "done_after_hand";
      hand_number: string;
      written_at: EpochMilliseconds;
      by: AccountActor;
      receipt_number: number;
      printed_at: EpochMilliseconds;
    }
  | {
      type: "print_failed_after_hand";
      hand_number: string;
      written_at: EpochMilliseconds;
      by: AccountActor;
      error: ProviderEffectError;
    }
  | { type: "done_on_other_device"; receipt_number: string; issued_at: EpochMilliseconds; by: AccountActor }
  | { type: "refused"; error: ProviderEffectError }
  | { type: "unknown"; error: ProviderEffectError }
  | { type: "confirmed_not_issued"; by: AccountActor };

export interface FbihPrinterItemsDocument {
  lines: FbihPrinterLine[];
  state: FbihPrinterReceiptState;
}

export type CroatiaLineTax =
  | { type: "vat"; rate: TaxRate; amount: number }
  | { type: "exempt" }
  | { type: "not_taxable" }
  | { type: "not_in_vat_system" };

export interface CroatiaLine {
  target: FiscalTarget;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: CroatiaLineTax;
}

export type CroatiaReceiptState =
  | { type: "requested" }
  | { type: "sending"; claim: ProviderOperationClaim }
  | { type: "done"; jir: string }
  | { type: "issued_offline"; clearance_due_at: EpochMilliseconds }
  | { type: "delivering"; claim: ProviderOperationClaim; clearance_due_at: EpochMilliseconds }
  | { type: "refused"; error: ProviderEffectError };

export type CroatiaBuyer = { type: "consumer" } | { type: "business"; oib: string };

export interface CroatiaSeller {
  name: string;
  address: PostalAddress;
  oib: string;
}

export type CroatiaPaymentMethod = "cash" | "card" | "transaction_account" | "other";

export interface CroatiaItemsDocument {
  number: string;
  zki: string;
  seller: CroatiaSeller;
  cashier: string;
  payment_method: CroatiaPaymentMethod;
  lines: CroatiaLine[];
  buyer: CroatiaBuyer;
  state: CroatiaReceiptState;
}

export type FiscalDocument =
  | ({ type: "tax_core_items" } & TaxCoreItemsDocument)
  | ({ type: "tax_core_advances" } & TaxCoreAdvancesDocument)
  | ({ type: "fbih_printer_items" } & FbihPrinterItemsDocument)
  | ({ type: "croatia_items" } & CroatiaItemsDocument);

export type FiscalReceiptPrint = "at_desk" | "not_printed";

export interface FiscalReceipt {
  id: string;
  store_id: string;
  order_id: string;
  fiscal_device_id: string;
  type: FiscalReceiptType;
  document: FiscalDocument;
  print: FiscalReceiptPrint;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FiscalReceiptDetail extends FiscalReceipt {
  deliverable: boolean;
}

export interface FindStoreFiscalReceiptsParams {
  store_id: string;
  order_ids?: never;
  open?: boolean;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface FindFiscalReceiptsByOrdersParams {
  store_id: string;
  order_ids: string[];
  open?: never;
  created_at_from?: never;
  created_at_to?: never;
  limit?: number;
  cursor?: string | null;
}

export type FindFiscalReceiptsParams = FindStoreFiscalReceiptsParams | FindFiscalReceiptsByOrdersParams;

export interface GetFiscalReceiptParams {
  store_id: string;
  fiscal_receipt_id: string;
}

export interface CopyFiscalReceiptParams {
  store_id: string;
  fiscal_receipt_id: string;
  id: string;
}

export type FiscalCorrectionFollowUp = { type: "receipt_again" } | { type: "wait_for_money" };

export interface CorrectFiscalReceiptParams {
  store_id: string;
  fiscal_receipt_id: string;
  id: string;
  reason: string;
  then: FiscalCorrectionFollowUp;
}

export type FiscalReceiptSettlement =
  | { type: "issued_on_other_device"; number: string; issued_at: EpochMilliseconds }
  | { type: "written_by_hand"; hand_number: string; written_at: EpochMilliseconds }
  | { type: "not_issued" };

export interface SettleFiscalReceiptParams {
  store_id: string;
  fiscal_receipt_id: string;
  outcome: FiscalReceiptSettlement;
}

export interface DeliverFiscalReceiptParams {
  store_id: string;
  fiscal_receipt_id: string;
}

export interface IssueFiscalReceiptsParams {
  store_id: string;
  order_id: string;
  fiscal_device_id: string;
}

export type TaxCoreInvoiceType = "Normal" | "Advance" | "Copy";

export type TaxCoreTransactionType = "Sale" | "Refund";

export type TaxCorePaymentType = "Cash" | "Card" | "WireTransfer" | "Other";

export interface TaxCorePayment {
  paymentType: TaxCorePaymentType;
  amount: number;
}

export interface TaxCoreItem {
  name: string;
  gtin: string;
  labels: string[];
  unitPrice: number;
  quantity: number;
  totalAmount: number;
}

export type TaxCoreReferent =
  | { referentDocumentNumber?: never; referentDocumentDT?: never }
  | { referentDocumentNumber: string; referentDocumentDT: string };

export type TaxCoreInvoiceRequest = {
  invoiceType: TaxCoreInvoiceType;
  transactionType: TaxCoreTransactionType;
  payment: TaxCorePayment[];
  items: TaxCoreItem[];
  cashier: string;
  buyerId?: string;
  dateAndTimeOfIssue?: string;
} & TaxCoreReferent;

export type TaxCoreAdvanceFields =
  | {
      advanceFinal?: never;
      advancePaid?: never;
      advanceTax?: never;
      advanceLastInvoiceNumber?: never;
      advanceLastInvoiceDateTime?: never;
    }
  | {
      advanceFinal: true;
      advancePaid?: never;
      advanceTax?: never;
      advanceLastInvoiceNumber?: never;
      advanceLastInvoiceDateTime?: never;
    }
  | {
      advanceFinal: true;
      advancePaid: number;
      advanceTax: number;
      advanceLastInvoiceNumber: string;
      advanceLastInvoiceDateTime: string;
    };

export type TaxCoreInvoiceBody = { invoiceRequest: TaxCoreInvoiceRequest } & TaxCoreAdvanceFields;

export type FbihPrinterTransaction = "sale" | "complaint";

export type FbihPrinterPaymentMethod = "cash" | "card" | "transfer" | "other";

export interface FbihPrinterRequestLine {
  name: string;
  unit: string;
  label: FbihPrinterLabel;
  quantity: number;
  unit_price: number;
}

export interface FbihPrinterRequestPayment {
  method: FbihPrinterPaymentMethod;
  amount: number;
}

export type FbihPrinterReference =
  | { type: "none" }
  | { type: "printed"; receipt_number: number }
  | { type: "other_device"; number: string };

export interface FbihPrinterRequest {
  transaction: FbihPrinterTransaction;
  lines: FbihPrinterRequestLine[];
  payments: FbihPrinterRequestPayment[];
  reference: FbihPrinterReference;
}

export type FiscalAgentRequest =
  | { type: "tax_core"; body: TaxCoreInvoiceBody }
  | { type: "fbih_printer"; printer_request: FbihPrinterRequest };

export interface FiscalAgentClaim {
  receipt: FiscalReceipt;
  claim: ProviderOperationClaim;
  request_id: string;
  buyer_present: boolean;
  request: FiscalAgentRequest;
}

export interface TaxCoreAnswer {
  invoice_number: string;
  verification_url: string;
  sdc_date_time: string;
  signed_by: string;
  tin: string;
  total_amount: number;
}

export interface FbihPrinterAnswer {
  receipt_number: number;
  printed_at: EpochMilliseconds;
  ibfm: string;
  total_amount: number;
}

export type FiscalAgentOutcome =
  | { type: "tax_core_issued"; answer: TaxCoreAnswer }
  | { type: "printer_issued"; answer: FbihPrinterAnswer }
  | { type: "not_sent"; claim_id: string; fence: number }
  | { type: "refused"; claim_id: string; fence: number; error: ProviderEffectError }
  | { type: "unknown"; claim_id: string; fence: number; error: ProviderEffectError };

export interface ClaimFiscalReceiptParams {
  fiscal_receipt_id: string;
}

export interface ReportFiscalReceiptParams {
  fiscal_receipt_id: string;
  outcome: FiscalAgentOutcome;
}
