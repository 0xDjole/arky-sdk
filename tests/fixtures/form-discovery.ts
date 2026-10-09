import { createAdmin, epochMilliseconds, initialize } from "arky-sdk";
import type {
  ArkySubmitFormByKeyParams,
  AssignFormSubmissionParams,
  ChangeFormSubmissionStageParams,
  CreateFormParams,
  CreateFormSubmissionParams,
  DeletedResponse,
  DeleteFormSubmissionParams,
  FindFormSubmissionsParams,
  FindFormsParams,
  Form,
  FormAnswer,
  FormAnswerInput,
  FormQuestion,
  FormStage,
  FormStatus,
  FormSubmission,
  FormSubmissionSource,
  GetFormParams,
  GetStorefrontFormParams,
  Note,
  NoteTarget,
  PaginatedResponse,
  SetFormSubmissionCompanyParams,
  StorefrontFormSubmission,
  SubmitFormParams,
  UpdateFormParams,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type FormsApi = ReturnType<typeof createAdmin>["forms"];
type StoreForms = ReturnType<typeof initialize>["forms"];

const store_id = "a8c41e2f-6d95-4b07-83f1-0e5d7a9c2b36";
const form_id = "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60";
const id = "4b9e2d71-8a36-4c05-9f1e-6d3a7b0c5e92";
const api = createAdmin({ baseUrl: "https://forms.test", apiToken: "arky_api_forms" }).forms;

const stages: FormStage[] = [{ id: "new", key: "new" }, { id: "won", key: "won" }];
const questions: FormQuestion[] = [
  { id: "q-answer", key: "answer", type: "text", required: true, label: { type: "shown", text: { en: "Answer" } }, min_length: null, max_length: 200, pattern: null },
  { id: "q-files", key: "files", type: "file", required: false, label: { type: "hidden" }, max_files: 3 },
  { id: "q-topic", key: "topic", type: "select_many", required: false, label: { type: "hidden" }, options: [{ key: "sales", label: { en: "Sales" } }] },
];
const filter: FindFormsParams = { store_id, status: "draft", sort_field: "key", sort_direction: "asc", cursor: null };
const byKey: GetFormParams = { store_id, key: "intake" };
const create: CreateFormParams = { store_id, id: form_id, key: "intake", questions, stages };
const edit: UpdateFormParams = { store_id, id: form_id, expected_updated_at: epochMilliseconds(1), status: { type: "closed" } };
const submissionFilter: FindFormSubmissionsParams = {
  store_id,
  form_id,
  customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
  stage_id: "new",
  assignee_account_id: "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f",
  company_id: "f581728f-8a86-4598-b27b-ef5ea7636277",
  select: [{ question_id: "q-topic", option_keys: ["sales"] }],
  sort_field: "created_at",
  cursor: null,
};
declare const brief: File;
const staffEntry: CreateFormSubmissionParams = {
  store_id,
  form_id,
  id,
  customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
  language: "en",
  answers: [
    { type: "text", question_id: "q-answer", key: "answer", value: "Called" },
    { type: "file", question_id: "q-files", key: "files", files: [brief] },
  ],
};
const stageChange: ChangeFormSubmissionStageParams = {
  store_id,
  form_id,
  id,
  expected_stage_id: "new",
  expected_changed_at: epochMilliseconds(1),
  to_stage_id: "won",
  note: { id: "9d1f3b5c-7e8a-4c2e-b4d6-8f0a2c4e6b7d", body: "Out of the delivery area" },
};
const unassign: AssignFormSubmissionParams = { store_id, form_id, id, assignee_account_id: null };
const unlink: SetFormSubmissionCompanyParams = { store_id, form_id, id, company_id: null };
const remove: DeleteFormSubmissionParams = { store_id, form_id, id, expected_updated_at: epochMilliseconds(3) };

const page: Promise<PaginatedResponse<Form>> = api.find(filter);
const read: Promise<Form> = api.get(byKey);
const created: Promise<Form> = api.create(create);
const edited: Promise<Form> = api.update(edit);
const submissions: Promise<PaginatedResponse<FormSubmission>> = api.findSubmissions(submissionFilter);
const staffCreated: Promise<FormSubmission> = api.createSubmission(staffEntry);
const staged: Promise<FormSubmission> = api.changeSubmissionStage(stageChange);
const assigned: Promise<FormSubmission> = api.assignSubmission(unassign);
const unlinked: Promise<FormSubmission> = api.setSubmissionCompany(unlink);
const deleted: Promise<DeletedResponse> = api.deleteSubmission(remove);
const noted: Promise<Note> = api.notes.create({ store_id, form_id, form_submission_id: id, id: "2c7e9a41-5b3d-4f86-a1e0-7d4c2b9f6e38", body: "Called back" });
const notes: Promise<PaginatedResponse<Note>> = api.notes.find({ store_id, form_id, form_submission_id: id, limit: 20 });
const noteEdit: Promise<Note> = api.notes.update({ store_id, form_id, form_submission_id: id, id: "2c7e9a41-5b3d-4f86-a1e0-7d4c2b9f6e38", expected_updated_at: epochMilliseconds(2), body: "Called back twice" });

declare const shown: Form;
const storefront = initialize(`arky_pk_${"f".repeat(42)}A`);
const byKeySubmission: ArkySubmitFormByKeyParams = { id, key: "intake", form: shown, language: "en", values: { answer: "Kept", topic: [], files: [brief] } };
const answered: Promise<StorefrontFormSubmission> = storefront.forms.submitByKey(byKeySubmission);
const raw: SubmitFormParams = { form_id, id, language: "en", answers: [{ type: "select_many", question_id: "q-topic", key: "topic", option_keys: ["sales"] }] };
const rawAnswered: Promise<StorefrontFormSubmission> = storefront.forms.submit(raw);
const loaded: Promise<Form> = storefront.forms.get({ key: "intake" });

declare const submission: FormSubmission;
declare const savedNote: Note;
const source: FormSubmissionSource = submission.source;
const sessionId: string | null = submission.source.type === "storefront" ? submission.source.customer_session_id : null;
const stageId: string = submission.stage.stage_id;
const changeNote: string | null = submission.stage_history[0].note_id;
const formKey: string = submission.snapshot.form_key;
const noteTarget: NoteTarget = savedNote.target;
const submissionNoteTarget: NoteTarget = { type: "form_submission", form_submission_id: id };

export type FormContracts = [
  Assert<Missing<FormsApi, "findByIds" | "getSubmissions" | "getPresentation" | "permanentlyDelete" | "updateSubmission" | "processSubmission">>,
  Assert<Missing<FormsApi, "createSubmissionNote" | "findSubmissionNotes" | "updateSubmissionNote" | "deleteSubmissionNote">>,
  Assert<Equal<Parameters<FormsApi["find"]>[0], FindFormsParams>>,
  Assert<Equal<Awaited<ReturnType<FormsApi["find"]>>, PaginatedResponse<Form>>>,
  Assert<Equal<Awaited<ReturnType<FormsApi["findSubmissions"]>>, PaginatedResponse<FormSubmission>>>,
  Assert<Equal<Awaited<ReturnType<FormsApi["deleteSubmission"]>>, DeletedResponse>>,
  Assert<Equal<Awaited<ReturnType<FormsApi["notes"]["create"]>>, Note>>,
  Assert<Equal<Parameters<StoreForms["submitByKey"]>[0], ArkySubmitFormByKeyParams>>,
  Assert<Equal<Awaited<ReturnType<StoreForms["submitByKey"]>>, StorefrontFormSubmission>>,
  Assert<Equal<Parameters<StoreForms["get"]>[0], GetStorefrontFormParams>>,
  Assert<Equal<GetStorefrontFormParams, { id: string } | { key: string }>>,
  Assert<RequiredField<ArkySubmitFormByKeyParams, "id">>,
  Assert<RequiredField<ArkySubmitFormByKeyParams, "form">>,
  Assert<RequiredField<ArkySubmitFormByKeyParams, "language">>,
  Assert<RequiredField<SubmitFormParams, "id">>,
  Assert<RequiredField<SubmitFormParams, "language">>,
  Assert<Missing<SubmitFormParams, "store_id" | "locale" | "presentation_digest" | "fields">>,
  Assert<Missing<ArkySubmitFormByKeyParams, "presentation">>,
  Assert<RequiredField<CreateFormParams, "id">>,
  Assert<RequiredField<CreateFormParams, "stages">>,
  Assert<Missing<CreateFormParams, "schema">>,
  Assert<RequiredField<CreateFormSubmissionParams, "customer_id">>,
  Assert<RequiredField<CreateFormSubmissionParams, "language">>,
  Assert<RequiredField<UpdateFormParams, "expected_updated_at">>,
  Assert<RequiredField<DeleteFormSubmissionParams, "expected_updated_at">>,
  Assert<RequiredField<ChangeFormSubmissionStageParams, "expected_stage_id">>,
  Assert<RequiredField<ChangeFormSubmissionStageParams, "expected_changed_at">>,
  Assert<RequiredField<ChangeFormSubmissionStageParams, "note">>,
  Assert<Equal<FormStatus["type"], "active" | "draft" | "closed">>,
  Assert<Equal<NonNullable<FindFormsParams["status"]>, FormStatus["type"]>>,
  Assert<Equal<NonNullable<UpdateFormParams["status"]>, FormStatus>>,
  Assert<Equal<NonNullable<FindFormSubmissionsParams["sort_field"]>, "created_at">>,
  Assert<Equal<NonNullable<FindFormSubmissionsParams["select"]>[number], { question_id: string; option_keys: string[] }>>,
  Assert<Equal<Extract<FormAnswerInput, { type: "file" }>["files"], File[]>>,
  Assert<Equal<keyof Extract<FormAnswer, { type: "file" }>["files"][number], "file_name" | "format" | "size_bytes" | "sha256">>,
  Assert<Equal<Extract<FormQuestion, { type: "file" }>["max_files"], number>>,
  Assert<Missing<Form, "schema" | "locale" | "presentation_digest">>,
  Assert<Equal<keyof StorefrontFormSubmission, "id" | "form_id" | "language" | "answers" | "stage_id" | "created_at" | "updated_at">>,
  Assert<Missing<FormSubmission, "customer_session_id" | "accepted_request" | "fields">>,
  Assert<Equal<FormSubmissionSource["type"], "storefront" | "account">>,
  Assert<Equal<Extract<NoteTarget, { type: "form_submission" }>, { type: "form_submission"; form_submission_id: string }>>,
];

void [page, read, created, edited, submissions, staffCreated, staged, assigned, unlinked, deleted, noted, notes, noteEdit,
  answered, rawAnswered, loaded, source, sessionId, stageId, changeNote, formKey, noteTarget, submissionNoteTarget];
