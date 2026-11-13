import type { createAdmin } from "arky-sdk/admin";
import type {
  CreateInvoiceParams,
  DeleteInvoiceParams,
  EpochMilliseconds,
  FindInvoicesParams,
  Invoice,
  InvoiceType,
  Order,
  StorefrontOrder,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type OrderApi = ReturnType<typeof createAdmin>["eshop"]["order"];

export type InvoiceContract = [
  Assert<Missing<Order, "invoices">>,
  Assert<Equal<StorefrontOrder["invoices"], Invoice[]>>,
  Assert<Equal<InvoiceType, { type: "invoice" } | { type: "credit_note"; invoice_id: string }>>,
  Assert<Equal<keyof Invoice, "id" | "store_id" | "order_id" | "type" | "number" | "url" | "created_at" | "updated_at">>,
  Assert<Equal<Invoice["updated_at"], EpochMilliseconds>>,
  Assert<Equal<keyof CreateInvoiceParams, "store_id" | "order_id" | "id" | "type" | "number" | "url">>,
  Assert<Equal<keyof DeleteInvoiceParams, "store_id" | "order_id" | "invoice_id" | "expected_updated_at">>,
  Assert<Equal<keyof FindInvoicesParams, "store_id" | "order_id" | "limit" | "cursor">>,
  Assert<Equal<keyof OrderApi["invoice"], "find" | "create" | "delete">>,
  Assert<Missing<OrderApi, "addInvoice" | "deleteInvoice">>,
];
