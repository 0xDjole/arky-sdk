import { createAdmin, initialize, type Form, type FormStatus, type FormSubmission,
  type GetFormsParams, type GetFormSubmissionsParams, type UpdateFormParams, type SubmitFormParams,
  type FormPresentation, type FormSchema } from "../../dist/index.js";
const store_id = "a8c41e2f-6d95-4b07-83f1-0e5d7a9c2b36";
const api = createAdmin({ baseUrl: "https://forms.test", market: "market-contract" }).forms;
const filter: GetFormsParams = { store_id, status: "draft", sort_field: "key", sort_direction: "asc", cursor: null };
const page: Promise<{ items: Form[]; cursor: string | null }> = api.find(filter);
const exact: Promise<{ items: Form[]; cursor: null }> = api.findByIds({ store_id, ids: ["form"] });
const submissions: Promise<{ items: FormSubmission[]; cursor: string | null }> = api.getSubmissions({
  store_id, form_id: "form", customer_id: "customer", sort_field: "created_at", cursor: null });
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
const session: string = submission.customer_session_id;
// @ts-expect-error Private accepted-request identity is not public submission data.
submission.accepted_request;
void [page, exact, submissions, edit, request, schema, presentation, plain, tagged, ids, order, missing, session, initialize];
