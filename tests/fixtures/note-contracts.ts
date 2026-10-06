import type { createAdmin } from "arky-sdk/admin";
import type {
  Note, NoteTarget, NoteTargetType, PaginatedResponse, AccountActor,
  FindOrderNotesParams, CreateOrderNoteParams, UpdateOrderNoteParams, DeleteOrderNoteParams,
  FindCustomerNotesParams, CreateCustomerNoteParams, UpdateCustomerNoteParams, DeleteCustomerNoteParams,
  FindCompanyNotesParams, CreateCompanyNoteParams, UpdateCompanyNoteParams, DeleteCompanyNoteParams,
} from "arky-sdk";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Admin = ReturnType<typeof createAdmin>;
type OrderNotes = Admin["eshop"]["order"]["notes"];
type CustomerNotes = Admin["customers"]["notes"];
type CompanyNotes = Admin["companies"]["notes"];

export type NoteContracts = [
  True<Same<keyof Note, "id" | "store_id" | "target" | "body" | "actor" | "created_at" | "updated_at">>,
  True<Same<Note["actor"], AccountActor>>,
  True<Same<NoteTargetType, "form_submission" | "customer" | "company" | "order">>,
  True<Same<Extract<NoteTarget, { type: "order" }>, { type: "order"; order_id: string }>>,
  True<Same<keyof OrderNotes, "find" | "create" | "update" | "delete">>,
  True<Same<Parameters<OrderNotes["find"]>[0], FindOrderNotesParams>>,
  True<Same<Parameters<OrderNotes["create"]>[0], CreateOrderNoteParams>>,
  True<Same<Parameters<OrderNotes["update"]>[0], UpdateOrderNoteParams>>,
  True<Same<Parameters<OrderNotes["delete"]>[0], DeleteOrderNoteParams>>,
  True<Same<Parameters<CustomerNotes["find"]>[0], FindCustomerNotesParams>>,
  True<Same<Parameters<CustomerNotes["create"]>[0], CreateCustomerNoteParams>>,
  True<Same<Parameters<CustomerNotes["update"]>[0], UpdateCustomerNoteParams>>,
  True<Same<Parameters<CustomerNotes["delete"]>[0], DeleteCustomerNoteParams>>,
  True<Same<Parameters<CompanyNotes["find"]>[0], FindCompanyNotesParams>>,
  True<Same<Parameters<CompanyNotes["create"]>[0], CreateCompanyNoteParams>>,
  True<Same<Parameters<CompanyNotes["update"]>[0], UpdateCompanyNoteParams>>,
  True<Same<Parameters<CompanyNotes["delete"]>[0], DeleteCompanyNoteParams>>,
  True<Same<Awaited<ReturnType<OrderNotes["find"]>>, PaginatedResponse<Note>>>,
  True<Same<Awaited<ReturnType<CompanyNotes["delete"]>>, Note>>,
  True<Same<Awaited<ReturnType<Admin["forms"]["createSubmissionNote"]>>, Note>>,
  True<Same<Awaited<ReturnType<Admin["forms"]["setSubmissionCompany"]>>["company_id"], string | null>>,
];
