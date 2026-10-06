import { createAdmin, epochMilliseconds, initialize, type Form, type FormStatus, type FormSubmission, type AdminFormSubmission,
  type GetFormsParams, type GetFormSubmissionsParams, type UpdateFormParams, type CreateFormParams, type SubmitFormParams,
  type FormPresentation, type FormSchema, type FormField, type FormStage, type FormSubmissionSource,
  type Note, type NoteTarget, type CreateStaffFormSubmissionParams, type ChangeFormSubmissionStageParams,
  type AssignFormSubmissionParams, type CreateFormSubmissionNoteParams, type UpdateFormSubmissionNoteParams,
  type DeleteFormSubmissionNoteParams, type SetFormSubmissionCompanyParams, type PaginatedResponse } from "../../dist/index.js";
const store_id = "a8c41e2f-6d95-4b07-83f1-0e5d7a9c2b36";
const api = createAdmin({ baseUrl: "https://forms.test", market: "market-contract" }).forms;
const filter: GetFormsParams = { store_id, status: "draft", sort_field: "key", sort_direction: "asc", cursor: null };
const page: Promise<{ items: Form[]; cursor: string | null }> = api.find(filter);
const exact: Promise<{ items: Form[]; cursor: null }> = api.findByIds({ store_id, ids: ["form"] });
const submissions: Promise<{ items: AdminFormSubmission[]; cursor: string | null }> = api.getSubmissions({
  store_id, form_id: "form", customer_id: "customer", stage_id: "new", assignee_account_id: "account", company_id: "company",
  select: [{ field_id: "field", options: ["yes"] }], sort_field: "created_at", cursor: null });
const stages: FormStage[] = [{ id: "new", key: "new" }, { id: "won", key: "won" }];
const createForm: CreateFormParams = { store_id, key: "intake", schema: [], stages };
const stagelessForm: CreateFormParams = { store_id, key: "intake", schema: [] };
const staffEntry: CreateStaffFormSubmissionParams = { store_id, form_id: "form", id: "submission", customer_id: "customer",
  locale: "en", presentation_digest: "digest", fields: [{ type: "file", id: "files", key: "files", media_ids: ["media"] }] };
const stageChange: ChangeFormSubmissionStageParams = { store_id, form_id: "form", id: "submission", to_stage_id: "won",
  expected_stage_id: "new", expected_changed_at: epochMilliseconds(1), note: { id: "reason", body: "Out of the delivery area" } };
const linkCompany: SetFormSubmissionCompanyParams = { store_id, form_id: "form", id: "submission", company_id: "company" };
const unlinkCompany: SetFormSubmissionCompanyParams = { store_id, form_id: "form", id: "submission", company_id: null };
const editNote: UpdateFormSubmissionNoteParams = { store_id, form_id: "form", form_submission_id: "submission", id: "note",
  expected_updated_at: epochMilliseconds(2), body: "Called back twice" };
const removeNote: DeleteFormSubmissionNoteParams = { store_id, form_id: "form", form_submission_id: "submission", id: "note",
  expected_updated_at: epochMilliseconds(3) };
const unassign: AssignFormSubmissionParams = { store_id, form_id: "form", id: "submission", assignee_account_id: null };
const note: CreateFormSubmissionNoteParams = { store_id, form_id: "form", form_submission_id: "submission", id: "note", body: "Called back" };
const staffCreated: Promise<AdminFormSubmission> = api.createSubmission(staffEntry);
const staged: Promise<AdminFormSubmission> = api.changeSubmissionStage(stageChange);
const assigned: Promise<AdminFormSubmission> = api.assignSubmission(unassign);
const noted: Promise<Note> = api.createSubmissionNote(note);
const notes: Promise<PaginatedResponse<Note>> = api.findSubmissionNotes({ store_id, form_id: "form", form_submission_id: "submission", limit: 20 });
const edited: Promise<Note> = api.updateSubmissionNote(editNote);
const removed: Promise<Note> = api.deleteSubmissionNote(removeNote);
const linked: Promise<AdminFormSubmission> = api.setSubmissionCompany(linkCompany);
const unlinked: Promise<AdminFormSubmission> = api.setSubmissionCompany(unlinkCompany);
declare const savedNote: Note;
const noteTarget: NoteTarget = savedNote.target;
const submissionNoteTarget: NoteTarget = { type: "form_submission", form_submission_id: "submission" };
const adminPresentation: Promise<FormPresentation> = api.getPresentation({ store_id, id: "form", locale: "en" });
const fileSchema: FormSchema = { type: "file", id: "files", key: "files", required: false, question: null, max_files: 3 };
const fileField: FormField = { type: "file", id: "files", key: "files", media_ids: ["media"] };
// @ts-expect-error File answers carry media_ids, never value.
const fileValueField: FormField = { type: "file", id: "files", key: "files", value: ["media"] };
// @ts-expect-error Stage changes carry the expected current stage.
const blindStageChange: ChangeFormSubmissionStageParams = { store_id, form_id: "form", id: "submission", to_stage_id: "won" };
const status: FormStatus = { type: "archived" };
const edit: UpdateFormParams = { store_id, id: "form", status };
const request: SubmitFormParams = { store_id, id: "submission", form_id: "form", locale: "en", presentation_digest: "digest", fields: [] };
// @ts-expect-error
api.submit(request);
const schema: FormSchema = { type: "text", id: "field", key: "answer", required: true, question: { en: "Answer?" } };
const presentation: FormPresentation = { id: "form", store_id, key: "intake", locale: "en",
  presentation_digest: "digest", schema: [{ ...schema, question: { text: "Answer?", locale: "en" } }] };
const storefront = initialize("arky_pk_" + "f".repeat(42) + "A");
storefront.forms.submitByKey({ id: "submission", key: "intake", presentation, values: { answer: "Kept" } });
// @ts-expect-error Submission must use the exact presentation displayed by the caller, not the cache.
storefront.forms.submitByKey({ id: "submission", key: "intake", values: { answer: "Kept" } });
// @ts-expect-error Submission requires a caller-owned identity even when the presentation is supplied.
storefront.forms.submitByKey({ key: "intake", presentation, values: { answer: "Kept" } });
// @ts-expect-error Form mutations use tagged statuses.
const plain: UpdateFormParams = { store_id, id: "form", status: "archived" };
// @ts-expect-error Form searches use plain status filters.
const tagged: GetFormsParams = { store_id, status };
// @ts-expect-error Exact batches cannot be mixed into discovery.
const ids: GetFormsParams = { store_id, ids: ["form"], query: "intake" };
// @ts-expect-error Only timestamp ordering is supported for submissions.
const order: GetFormSubmissionsParams = { store_id, sort_field: "snapshot.form_key" };
// @ts-expect-error Submissions require retained acceptance identity.
const missing: SubmitFormParams = { store_id, form_id: "form", fields: [] };
declare const submission: FormSubmission;
declare const adminSubmission: AdminFormSubmission;
const source: FormSubmissionSource = submission.source;
const sessionId: string | null = submission.source.type === "customer" ? submission.source.customer_session_id : null;
const stageId: string = adminSubmission.stage.stage_id;
const assignee: string | null = adminSubmission.assignee_account_id;
const linkedCompany: string | null = adminSubmission.company_id;
const changeNote: string | null = adminSubmission.stage_history[0].note_id;
const digest: string = submission.snapshot.presentation_digest;
// @ts-expect-error The session is part of the customer source, not a top-level field.
submission.customer_session_id;
// @ts-expect-error Customer-facing submissions do not show staff stages.
submission.stage;
// @ts-expect-error Private accepted-request identity is not public submission data.
submission.accepted_request;
void [page, exact, submissions, edit, request, schema, presentation, plain, tagged, ids, order, missing, source, sessionId, stageId, assignee, digest, initialize,
  createForm, stagelessForm, staffCreated, staged, assigned, noted, notes, adminPresentation, fileSchema, fileField, fileValueField, blindStageChange,
  edited, removed, linked, unlinked, noteTarget, submissionNoteTarget, linkedCompany, changeNote];
