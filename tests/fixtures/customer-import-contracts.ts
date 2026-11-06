import type { createAdmin } from "arky-sdk/admin";
import type {
  ApiErrorResponse,
  ImportCustomerPreviewOutcome,
  ImportCustomerPreviewRow,
  ImportCustomerRowOutcome,
  ImportCustomerRowResult,
  ImportCustomersPreviewResult,
  ImportCustomersResult,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Customers = ReturnType<typeof createAdmin>["customers"];

export type CustomerImportContracts = [
  Assert<Equal<ImportCustomerPreviewOutcome, { type: "create" } | { type: "existing" } | { type: "failed"; error: ApiErrorResponse }>>,
  Assert<Equal<ImportCustomerRowOutcome, { type: "created" } | { type: "existing" } | { type: "failed"; error: ApiErrorResponse }>>,
  Assert<Equal<keyof ImportCustomersPreviewResult, "rows_total" | "rows_to_create" | "rows_existing" | "rows_failed" | "rows">>,
  Assert<Equal<ImportCustomersPreviewResult["rows"], ImportCustomerPreviewRow[]>>,
  Assert<Equal<keyof ImportCustomersResult, "rows_total" | "customers_created" | "rows_existing" | "rows_failed" | "rows">>,
  Assert<Equal<ImportCustomersResult["rows"], ImportCustomerRowResult[]>>,
  Assert<Equal<keyof ImportCustomerPreviewRow, "row" | "customer_id" | "outcome">>,
  Assert<Equal<keyof ImportCustomerRowResult, "row" | "customer_id" | "outcome">>,
  Assert<Equal<keyof ApiErrorResponse, "message" | "error" | "status_code" | "validation_errors">>,
  Assert<Equal<Awaited<ReturnType<Customers["previewImport"]>>, ImportCustomersPreviewResult>>,
  Assert<Equal<Awaited<ReturnType<Customers["import"]>>, ImportCustomersResult>>,
];
