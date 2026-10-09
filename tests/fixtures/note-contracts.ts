import type { createAdmin } from "arky-sdk/admin";
import type {
  AccountActor,
  CompanyNoteTarget,
  CustomerNoteTarget,
  FormSubmissionNoteTarget,
  Note,
  NoteCreateParams,
  NoteDeleteParams,
  NotePageParams,
  NoteTarget,
  NoteTargetType,
  NoteUpdateParams,
  OrderNoteTarget,
  PaginatedResponse,
  SupportConversationNoteTarget,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type OrderNotes = Admin["eshop"]["order"]["notes"];
type CustomerNotes = Admin["customers"]["notes"];
type CompanyNotes = Admin["companies"]["notes"];
type SubmissionNotes = Admin["forms"]["notes"];
type ConversationNotes = Admin["support"]["conversation"]["notes"];

export type NoteContracts = [
  Assert<Equal<keyof Note, "id" | "store_id" | "target" | "body" | "actor" | "created_at" | "updated_at">>,
  Assert<Equal<Note["actor"], AccountActor>>,
  Assert<Equal<NoteTargetType, "form_submission" | "customer" | "company" | "order" | "support_conversation">>,
  Assert<Equal<Extract<NoteTarget, { type: "order" }>, { type: "order"; order_id: string }>>,
  Assert<Equal<keyof OrderNotes, "find" | "create" | "update" | "delete">>,
  Assert<Equal<Parameters<OrderNotes["find"]>[0], OrderNoteTarget & NotePageParams>>,
  Assert<Equal<Parameters<OrderNotes["create"]>[0], OrderNoteTarget & NoteCreateParams>>,
  Assert<Equal<Parameters<OrderNotes["update"]>[0], OrderNoteTarget & NoteUpdateParams>>,
  Assert<Equal<Parameters<OrderNotes["delete"]>[0], OrderNoteTarget & NoteDeleteParams>>,
  Assert<Equal<Parameters<CustomerNotes["create"]>[0], CustomerNoteTarget & NoteCreateParams>>,
  Assert<Equal<Parameters<CompanyNotes["create"]>[0], CompanyNoteTarget & NoteCreateParams>>,
  Assert<Equal<Parameters<SubmissionNotes["create"]>[0], FormSubmissionNoteTarget & NoteCreateParams>>,
  Assert<Equal<Parameters<ConversationNotes["create"]>[0], SupportConversationNoteTarget & NoteCreateParams>>,
  Assert<Equal<Awaited<ReturnType<OrderNotes["find"]>>, PaginatedResponse<Note>>>,
  Assert<Equal<Awaited<ReturnType<CompanyNotes["delete"]>>, Note>>,
  Assert<Equal<Awaited<ReturnType<SubmissionNotes["create"]>>, Note>>,
  Assert<Equal<keyof NoteCreateParams, "id" | "body">>,
  Assert<Equal<keyof NoteUpdateParams, "id" | "expected_updated_at" | "body">>,
  Assert<Missing<Admin["forms"], "createSubmissionNote" | "findSubmissionNotes" | "updateSubmissionNote" | "deleteSubmissionNote">>,
  Assert<Equal<Awaited<ReturnType<Admin["forms"]["setSubmissionCompany"]>>["company_id"], string | null>>,
];
