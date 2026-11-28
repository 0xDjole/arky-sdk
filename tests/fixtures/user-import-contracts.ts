import type { createAdmin } from "arky-sdk/admin";
import type {
  ApiErrorResponse,
  ImportUserPreviewOutcome,
  ImportUserPreviewRow,
  ImportUserRowOutcome,
  ImportUserRowResult,
  ImportUsersPreviewResult,
  ImportUsersResult,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Users = ReturnType<typeof createAdmin>["users"];

export type UserImportContracts = [
  Assert<Equal<ImportUserPreviewOutcome, { type: "create" } | { type: "existing" } | { type: "failed"; error: ApiErrorResponse }>>,
  Assert<Equal<ImportUserRowOutcome, { type: "created" } | { type: "existing" } | { type: "failed"; error: ApiErrorResponse }>>,
  Assert<Equal<keyof ImportUsersPreviewResult, "rows_total" | "rows_to_create" | "rows_existing" | "rows_failed" | "rows">>,
  Assert<Equal<ImportUsersPreviewResult["rows"], ImportUserPreviewRow[]>>,
  Assert<Equal<keyof ImportUsersResult, "rows_total" | "users_created" | "rows_existing" | "rows_failed" | "rows">>,
  Assert<Equal<ImportUsersResult["rows"], ImportUserRowResult[]>>,
  Assert<Equal<keyof ImportUserPreviewRow, "row" | "user_id" | "outcome">>,
  Assert<Equal<keyof ImportUserRowResult, "row" | "user_id" | "outcome">>,
  Assert<Equal<keyof ApiErrorResponse, "message" | "error" | "status_code" | "validation_errors">>,
  Assert<Equal<Awaited<ReturnType<Users["previewImport"]>>, ImportUsersPreviewResult>>,
  Assert<Equal<Awaited<ReturnType<Users["import"]>>, ImportUsersResult>>,
];
