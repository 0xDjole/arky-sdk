import { createAdmin, initialize, type Form, type FormStatus, type FormSubmission,
  type GetFormsParams, type GetFormSubmissionsParams, type UpdateFormParams, type SubmitFormParams,
  type FormPresentation, type FormSchema } from "../../dist/index.js";
const api = createAdmin({ baseUrl: "https://forms.test", storeId: "store", market: "market-contract" }).forms;
const filter: GetFormsParams = { status: "draft", sort_field: "key", sort_direction: "asc", cursor: null };
const page: Promise<{ items: Form[]; cursor: string | null }> = api.find(filter);
const exact: Promise<{ items: Form[]; cursor: null }> = api.findByIds({ ids: ["form"] });
const submissions: Promise<{ items: FormSubmission[]; cursor: string | null }> = api.getSubmissions({
  form_id: "form", customer_id: "customer", sort_field: "created_at", cursor: null });
const status: FormStatus = { type: "archived" };
const edit: UpdateFormParams = { id: "form", status };
const request: SubmitFormParams = { id: "submission", form_id: "form", locale: "en", presentation_digest: "digest", fields: [] };
// @ts-expect-error
api.submit(request);
const schema: FormSchema = { type: "text", id: "field", key: "answer", required: true, question: { en: "Answer?" } };
const presentation: FormPresentation = { id: "form", store_id: "store", key: "intake", locale: "en",
  presentation_digest: "digest", schema: [{ ...schema, question: { text: "Answer?", locale: "en" } }] };
// @ts-expect-error Form mutations use tagged statuses.
const plain: UpdateFormParams = { id: "form", status: "archived" };
// @ts-expect-error Form searches use plain status filters.
const tagged: GetFormsParams = { status };
// @ts-expect-error Exact batches cannot be mixed into discovery.
const ids: GetFormsParams = { ids: ["form"], query: "intake" };
// @ts-expect-error Only timestamp ordering is supported for submissions.
const order: GetFormSubmissionsParams = { sort_field: "snapshot.form_key" };
// @ts-expect-error Submissions require retained acceptance identity.
const missing: SubmitFormParams = { form_id: "form", fields: [] };
declare const submission: FormSubmission;
const session: string = submission.customer_session_id;
// @ts-expect-error Private accepted-request identity is not public submission data.
submission.accepted_request;
void [page, exact, submissions, edit, request, schema, presentation, plain, tagged, ids, order, missing, session, initialize];
