import type { createStorefront } from "arky-sdk/storefront";
import type { initialize } from "arky-sdk";
import type {
  FindStorefrontFormSubmissionsParams,
  PaginatedResponse,
  StorefrontFormSubmission,
  StorefrontFormSubmissionListItem,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = Extract<K, keyof T> extends never ? true : false;
type Assignable<A, B> = A extends B ? true : false;
type StorefrontForms = ReturnType<typeof createStorefront>["forms"];
type StoreForms = ReturnType<typeof initialize>["forms"];

export type PortalReadContracts = [
  Assert<Equal<keyof StorefrontFormSubmissionListItem, "id" | "form_id" | "form_key" | "language" | "answers" | "stage_id" | "created_at" | "updated_at">>,
  Assert<Assignable<StorefrontFormSubmissionListItem, StorefrontFormSubmission>>,
  Assert<Equal<StorefrontFormSubmissionListItem["form_key"], string>>,
  Assert<Missing<StorefrontFormSubmissionListItem, "customer_id" | "source" | "email_contact" | "stage_history" | "snapshot">>,
  Assert<Equal<keyof FindStorefrontFormSubmissionsParams, "limit" | "cursor">>,
  Assert<Equal<Awaited<ReturnType<StorefrontForms["findSubmissions"]>>, PaginatedResponse<StorefrontFormSubmissionListItem>>>,
  Assert<Equal<Awaited<ReturnType<StoreForms["findSubmissions"]>>, PaginatedResponse<StorefrontFormSubmissionListItem>>>,
  Assert<Equal<Parameters<StorefrontForms["findSubmissions"]>[0], FindStorefrontFormSubmissionsParams | undefined>>,
];
