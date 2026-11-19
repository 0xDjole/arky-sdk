import type { createAdmin } from "arky-sdk/admin";
import type {
  AccountActor,
  CroatiaBuyer,
  CroatiaItemsDocument,
  CroatiaPaymentMethod,
  CroatiaSeller,
  EpochMilliseconds,
  FbihPrinterItemsDocument,
  FbihPrinterReceiptState,
  FbihPrinterReference,
  FiscalAdvanceChain,
  FiscalAgentClaim,
  FiscalDevice,
  FiscalDeviceHeartbeat,
  FiscalDeviceNotReadyReason,
  FiscalDeviceReadiness,
  FiscalDeviceStatus,
  FiscalDocument,
  FiscalPaymentPart,
  FiscalReceipt,
  FiscalReceiptPrint,
  FiscalReceiptSettlement,
  FiscalReceiptType,
  FiscalTarget,
  FindFiscalDevicesParams,
  FiscalAgentOutcome,
  PostalAddress,
  ProviderEffectError,
  ProviderOperationClaim,
  ReleaseFiscalDeviceParams,
  SettleFiscalReceiptParams,
  TaxCoreAdvanceFields,
  TaxCoreAnswer,
  TaxCoreInvoiceBody,
  TaxCoreInvoiceRequest,
  TaxCoreReceiptState,
  TaxCoreReferent,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type OptionalField<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type Accepts<T, V> = V extends T ? true : false;
type Admin = ReturnType<typeof createAdmin>;
type RequestFields = { invoiceType: "Normal"; transactionType: "Sale"; payment: []; items: []; cashier: string };

const heldDevice: FiscalDeviceReadiness = { type: "not_ready", reason: "counter_held" };
const heldAfterRestore: FiscalDeviceReadiness = { type: "not_ready", reason: "held_after_restore" };
const businessBuyer: CroatiaBuyer = { type: "business", oib: "12345678903" };
const goodsChain: FiscalAdvanceChain = { type: "goods" };
const visitChain: FiscalAdvanceChain = { type: "target", target: { type: "booking", line_item_id: "7c2e9a41-5b38-4d06-8f1a-3e6b0d9c2a57" } };
const writtenByHand: FiscalReceiptSettlement = { type: "written_by_hand", hand_number: "17", written_at: 5 as EpochMilliseconds };
const plainSale: TaxCoreInvoiceRequest = { invoiceType: "Normal", transactionType: "Sale", payment: [], items: [], cashier: "Ana Kovač" };
const refund: TaxCoreInvoiceRequest = {
  invoiceType: "Normal",
  transactionType: "Refund",
  payment: [{ paymentType: "Cash", amount: 50 }],
  items: [],
  cashier: "Ana Kovač",
  referentDocumentNumber: "AB12CD34-AB12CD34-17",
  referentDocumentDT: "2027-01-15T09:00:00.000+01:00",
};
const saleBody: TaxCoreInvoiceBody = { invoiceRequest: plainSale };
const settleBody: TaxCoreInvoiceBody = { invoiceRequest: refund, advanceFinal: true };
const finalBody: TaxCoreInvoiceBody = {
  invoiceRequest: refund,
  advanceFinal: true,
  advancePaid: 80,
  advanceTax: 13.33,
  advanceLastInvoiceNumber: "AB12CD34-AB12CD34-16",
  advanceLastInvoiceDateTime: "2027-01-15T09:01:00.000+01:00",
};
const seller: CroatiaSeller = {
  name: "Ordinacija Kovač d.o.o.",
  address: { name: null, company: null, street1: "Ilica 1", street2: null, city: "Zagreb", state: null, postal_code: "10000", country: "HR", phone: null, email: null },
  oib: "12345678903",
};
const answered: FiscalAgentOutcome = {
  type: "tax_core_issued",
  answer: { invoice_number: "AB12CD34-AB12CD34-17", verification_url: "https://suf.purs.gov.rs/v/?vl=1", sdc_date_time: "2027-01-15T09:00:00.000+01:00", signed_by: "AB12CD34", tin: "4400000000000", total_amount: 50 },
};
void [heldDevice, heldAfterRestore, businessBuyer, goodsChain, visitChain, writtenByHand, plainSale, refund, saleBody, settleBody, finalBody, seller, answered];

export type FiscalContracts = [
  Assert<Equal<FiscalDeviceNotReadyReason, "archived" | "held_after_restore" | "not_online_capable" | "provider_missing" | "provider_disabled" | "certificate_expired" | "certificate_unreadable" | "counter_held" | "no_ready_desk_agent">>,
  Assert<Equal<Extract<FiscalDeviceReadiness, { type: "not_ready" }>, { type: "not_ready"; reason: FiscalDeviceNotReadyReason }>>,
  Assert<Equal<FiscalDeviceHeartbeat["readiness"], FiscalDeviceReadiness>>,
  Assert<Equal<keyof CroatiaItemsDocument, "number" | "zki" | "seller" | "cashier" | "payment_method" | "lines" | "buyer" | "state">>,
  Assert<Equal<CroatiaItemsDocument["seller"], CroatiaSeller>>,
  Assert<Equal<CroatiaSeller, { name: string; address: PostalAddress; oib: string }>>,
  Assert<Equal<CroatiaItemsDocument["cashier"], string>>,
  Assert<Equal<CroatiaItemsDocument["payment_method"], CroatiaPaymentMethod>>,
  Assert<Equal<CroatiaPaymentMethod, "cash" | "card" | "transaction_account" | "other">>,
  Assert<Equal<Extract<FiscalReceipt["document"], { type: "croatia_items" }>["seller"], CroatiaSeller>>,
  Assert<Equal<Extract<FiscalReceipt["document"], { type: "croatia_items" }>["payment_method"], CroatiaPaymentMethod>>,
  Assert<Equal<CroatiaItemsDocument["buyer"], CroatiaBuyer>>,
  Assert<Equal<CroatiaBuyer, { type: "consumer" } | { type: "business"; oib: string }>>,
  Assert<Equal<Extract<FiscalDocument, { type: "croatia_items" }>["buyer"], CroatiaBuyer>>,
  Assert<Equal<Extract<FiscalReceipt["document"], { type: "croatia_items" }>["buyer"], CroatiaBuyer>>,
];

export type FiscalReceiptWireContracts = [
  Assert<Equal<keyof FiscalReceipt, "id" | "store_id" | "order_id" | "fiscal_device_id" | "type" | "document" | "print" | "created_at" | "updated_at">>,
  Assert<Equal<FiscalReceipt["print"], FiscalReceiptPrint>>,
  Assert<Equal<FiscalReceiptPrint, "at_desk" | "not_printed">>,
  Assert<Equal<FiscalAdvanceChain, { type: "goods" } | { type: "target"; target: FiscalTarget }>>,
  Assert<Equal<Extract<FiscalReceiptType, { type: "advance" }>, { type: "advance"; chain: FiscalAdvanceChain; payments: FiscalPaymentPart[] }>>,
  Assert<Equal<Extract<FiscalReceiptType, { type: "next_advance" }>, { type: "next_advance"; previous_advance_receipt_id: string; payments: FiscalPaymentPart[] }>>,
  Assert<Equal<FiscalDocument["type"], "tax_core_items" | "tax_core_advances" | "fbih_printer_items" | "croatia_items">>,
  Assert<Equal<keyof FbihPrinterItemsDocument, "lines" | "state">>,
  Assert<Equal<FbihPrinterItemsDocument["state"], FbihPrinterReceiptState>>,
  Assert<Equal<Extract<FiscalDocument, { type: "fbih_printer_items" }>["state"], FbihPrinterReceiptState>>,
  Assert<Equal<Extract<FiscalDocument, { type: "fbih_printer_items" }>["lines"], FbihPrinterItemsDocument["lines"]>>,
  Assert<Equal<Extract<FiscalDocument, { type: "croatia_items" }>["state"], CroatiaItemsDocument["state"]>>,
  Assert<Equal<TaxCoreReceiptState["type"], "requested" | "sending" | "done" | "done_on_other_device" | "refused" | "unknown" | "confirmed_not_issued">>,
  Assert<Equal<Extract<TaxCoreReceiptState, { type: "done" }>, { type: "done"; invoice_number: string; verification_url: string; signed_at: EpochMilliseconds; sdc_date_time: string }>>,
  Assert<Equal<keyof TaxCoreAnswer, "invoice_number" | "verification_url" | "sdc_date_time" | "signed_by" | "tin" | "total_amount">>,
  Assert<Equal<TaxCoreAnswer["sdc_date_time"], string>>,
  Assert<Equal<Extract<FiscalAgentOutcome, { type: "tax_core_issued" }>["answer"], TaxCoreAnswer>>,
  Assert<Equal<Extract<TaxCoreReceiptState, { type: "done_on_other_device" }>, { type: "done_on_other_device"; invoice_number: string; issued_at: EpochMilliseconds; by: AccountActor }>>,
  Assert<Equal<FbihPrinterReceiptState["type"], "requested" | "sending" | "done" | "written_by_hand" | "printing_after_hand" | "done_after_hand" | "print_failed_after_hand" | "done_on_other_device" | "refused" | "unknown" | "confirmed_not_issued">>,
  Assert<Equal<Extract<FbihPrinterReceiptState, { type: "written_by_hand" }>, { type: "written_by_hand"; hand_number: string; written_at: EpochMilliseconds; by: AccountActor }>>,
  Assert<Equal<Extract<FbihPrinterReceiptState, { type: "printing_after_hand" }>, { type: "printing_after_hand"; hand_number: string; written_at: EpochMilliseconds; by: AccountActor; claim: ProviderOperationClaim }>>,
  Assert<Equal<Extract<FbihPrinterReceiptState, { type: "done_after_hand" }>, { type: "done_after_hand"; hand_number: string; written_at: EpochMilliseconds; by: AccountActor; receipt_number: number; printed_at: EpochMilliseconds }>>,
  Assert<Equal<Extract<FbihPrinterReceiptState, { type: "print_failed_after_hand" }>, { type: "print_failed_after_hand"; hand_number: string; written_at: EpochMilliseconds; by: AccountActor; error: ProviderEffectError }>>,
  Assert<Equal<Extract<FbihPrinterReceiptState, { type: "done_on_other_device" }>, { type: "done_on_other_device"; receipt_number: string; issued_at: EpochMilliseconds; by: AccountActor }>>,
  Assert<Equal<FiscalReceiptSettlement, { type: "issued_on_other_device"; number: string; issued_at: EpochMilliseconds } | { type: "written_by_hand"; hand_number: string; written_at: EpochMilliseconds } | { type: "not_issued" }>>,
  Assert<Equal<SettleFiscalReceiptParams["outcome"], FiscalReceiptSettlement>>,
  Assert<Equal<FbihPrinterReference, { type: "none" } | { type: "printed"; receipt_number: number } | { type: "other_device"; number: string }>>,
  Assert<Equal<keyof TaxCoreInvoiceRequest, "invoiceType" | "transactionType" | "payment" | "items" | "cashier" | "buyerId" | "dateAndTimeOfIssue" | "referentDocumentNumber" | "referentDocumentDT">>,
  Assert<OptionalField<TaxCoreInvoiceRequest, "dateAndTimeOfIssue">>,
  Assert<Equal<TaxCoreInvoiceRequest["dateAndTimeOfIssue"], string | undefined>>,
  Assert<Equal<TaxCoreInvoiceRequest["referentDocumentNumber"], string | undefined>>,
  Assert<Equal<TaxCoreInvoiceRequest["referentDocumentDT"], string | undefined>>,
  Assert<Equal<Extract<TaxCoreReferent, { referentDocumentNumber: string }>, { referentDocumentNumber: string; referentDocumentDT: string }>>,
  Assert<Accepts<TaxCoreInvoiceRequest, RequestFields>>,
  Assert<Accepts<TaxCoreInvoiceRequest, RequestFields & { referentDocumentNumber: string; referentDocumentDT: string }>>,
  Assert<Accepts<TaxCoreInvoiceRequest, RequestFields & { referentDocumentNumber: string }> extends false ? true : false>,
  Assert<Accepts<TaxCoreInvoiceRequest, RequestFields & { referentDocumentDT: string }> extends false ? true : false>,
  Assert<Equal<keyof TaxCoreInvoiceBody, "invoiceRequest" | "advanceFinal" | "advancePaid" | "advanceTax" | "advanceLastInvoiceNumber" | "advanceLastInvoiceDateTime">>,
  Assert<Equal<TaxCoreInvoiceBody["invoiceRequest"], TaxCoreInvoiceRequest>>,
  Assert<Equal<TaxCoreInvoiceBody["advanceFinal"], true | undefined>>,
  Assert<Equal<Extract<TaxCoreAdvanceFields, { advancePaid: number }>, { advanceFinal: true; advancePaid: number; advanceTax: number; advanceLastInvoiceNumber: string; advanceLastInvoiceDateTime: string }>>,
  Assert<Accepts<TaxCoreInvoiceBody, { invoiceRequest: TaxCoreInvoiceRequest; advanceFinal: false }> extends false ? true : false>,
  Assert<Accepts<TaxCoreInvoiceBody, { invoiceRequest: TaxCoreInvoiceRequest; advancePaid: number }> extends false ? true : false>,
  Assert<Accepts<TaxCoreInvoiceBody, { invoiceRequest: TaxCoreInvoiceRequest; advanceFinal: true; advancePaid: number; advanceTax: number }> extends false ? true : false>,
  Assert<Equal<Extract<FiscalAgentClaim["request"], { type: "tax_core" }>, { type: "tax_core"; body: TaxCoreInvoiceBody }>>,
  Assert<Equal<Extract<FiscalAgentClaim["request"], { type: "fbih_printer" }>["printer_request"]["reference"], FbihPrinterReference>>,
  Assert<Equal<FiscalAgentClaim["buyer_present"], boolean>>,
];

export type FiscalDeviceHoldContracts = [
  Assert<Equal<FiscalDeviceStatus, "active" | "held_after_restore" | "archived">>,
  Assert<Equal<FiscalDevice["status"], FiscalDeviceStatus>>,
  Assert<Equal<FindFiscalDevicesParams["status"], FiscalDeviceStatus | undefined>>,
  Assert<Equal<keyof Admin["store"]["fiscalDevice"], "find" | "get" | "create" | "rename" | "archive" | "release" | "token">>,
  Assert<Equal<Parameters<Admin["store"]["fiscalDevice"]["release"]>[0], ReleaseFiscalDeviceParams>>,
  Assert<Equal<keyof ReleaseFiscalDeviceParams, "store_id" | "id" | "expected_updated_at">>,
  Assert<Equal<ReleaseFiscalDeviceParams["expected_updated_at"], EpochMilliseconds>>,
  Assert<Equal<Awaited<ReturnType<Admin["store"]["fiscalDevice"]["release"]>>, FiscalDevice>>,
];
