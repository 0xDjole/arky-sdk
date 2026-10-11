import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  AssignFormSubmissionParams,
  ChangeFormSubmissionStageParams,
  CreateFormParams,
  CreateFormSubmissionParams,
  DeleteFormParams,
  DeleteFormSubmissionParams,
  FindFormsParams,
  FindFormSubmissionsParams,
  Form,
  FormAnswerInput,
  FormSubmission,
  FormSubmissionFileLink,
  GetFormParams,
  GetFormSubmissionFileParams,
  GetFormSubmissionParams,
  GetStorefrontFormParams,
  SetFormSubmissionCompanyParams,
  StorefrontFormSubmission,
  SubmitFormParams,
  UpdateFormParams,
} from "../types/forms";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const MAX_FORM_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FORM_SUBMISSION_FILES = 20;
const MAX_FORM_SUBMISSION_FILE_BYTES = 50 * 1024 * 1024;

function isGiven(answer: FormAnswerInput): boolean {
  if (answer.type === "text") return answer.value.trim() !== "";
  if (answer.type === "select_many") return answer.option_keys.length > 0;
  if (answer.type === "file") return answer.files.length > 0;
  return true;
}

function requireFormFiles(files: File[]): void {
  if (files.length > MAX_FORM_SUBMISSION_FILES) {
    throw new Error(`A form submission carries at most ${MAX_FORM_SUBMISSION_FILES} files`);
  }
  let total = 0;
  for (const file of files) {
    if (file.size < 1 || file.size > MAX_FORM_FILE_BYTES) {
      throw new Error(`The file '${file.name}' must be between 1 byte and 10 MiB`);
    }
    if (!file.name) throw new Error("Every form file needs a file name");
    total += file.size;
  }
  if (total > MAX_FORM_SUBMISSION_FILE_BYTES) throw new Error("A form submission's files are at most 50 MiB together");
}

export function formSubmissionBody(submission: Record<string, unknown>, answers: FormAnswerInput[]): FormData {
  const formData = new FormData();
  const files: Array<{ name: string; file: File }> = [];
  const wireAnswers = answers.filter(isGiven).map((answer) => {
    if (answer.type !== "file") return answer;
    const parts = answer.files.map((file) => {
      const name = `file-${files.length}`;
      files.push({ name, file });
      return name;
    });
    return { type: "file", question_id: answer.question_id, key: answer.key, parts };
  });
  requireFormFiles(files.map((part) => part.file));
  formData.append("submission", JSON.stringify({ ...submission, answers: wireAnswers }));
  for (const part of files) formData.append(part.name, part.file, part.file.name);
  return formData;
}

export const createFormsApi = (apiConfig: ApiConfig) => {
  const submissionPath = (storeId: string, formId: string, id: string) =>
    `${storeRecordPath(storeId, "forms", formId)}/submissions/${segment(id)}`;

  return {
    find(params: FindFormsParams, options?: RequestOptions): Promise<PaginatedResponse<Form>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Form>>(storePath(store_id, "forms"), { ...options, params: query });
    },

    get(params: GetFormParams, options?: RequestOptions): Promise<Form> {
      const path =
        "id" in params
          ? storeRecordPath(params.store_id, "forms", params.id)
          : storePath(params.store_id, `forms/by-key/${segment(params.key)}`);
      return apiConfig.httpClient.get<Form>(path, options);
    },

    create(params: CreateFormParams, options?: RequestOptions): Promise<Form> {
      requireId(params.id, "form");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Form>(storePath(store_id, "forms"), body, options);
    },

    update(params: UpdateFormParams, options?: RequestOptions): Promise<Form> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<Form>(storeRecordPath(store_id, "forms", id), body, options);
    },

    delete(params: DeleteFormParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, "forms", params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },

    findSubmissions(params: FindFormSubmissionsParams, options?: RequestOptions): Promise<PaginatedResponse<FormSubmission>> {
      const { store_id, form_id, ...query } = params;
      const path = form_id === undefined
        ? storePath(store_id, "forms/submissions")
        : `${storeRecordPath(store_id, "forms", form_id)}/submissions`;
      return apiConfig.httpClient.get<PaginatedResponse<FormSubmission>>(path, { ...options, params: query });
    },

    getSubmission(params: GetFormSubmissionParams, options?: RequestOptions): Promise<FormSubmission> {
      return apiConfig.httpClient.get<FormSubmission>(submissionPath(params.store_id, params.form_id, params.id), options);
    },

    createSubmission(params: CreateFormSubmissionParams, options?: RequestOptions): Promise<FormSubmission> {
      requireId(params.id, "form submission");
      const body = formSubmissionBody(
        { id: params.id, customer_id: params.customer_id, language: params.language },
        params.answers,
      );
      return apiConfig.httpClient.post<FormSubmission>(
        `${storeRecordPath(params.store_id, "forms", params.form_id)}/submissions`,
        body,
        options,
      );
    },

    changeSubmissionStage(params: ChangeFormSubmissionStageParams, options?: RequestOptions): Promise<FormSubmission> {
      if (params.note) requireId(params.note.id, "note");
      const { store_id, form_id, id, ...body } = params;
      return apiConfig.httpClient.post<FormSubmission>(`${submissionPath(store_id, form_id, id)}/stage`, body, options);
    },

    assignSubmission(params: AssignFormSubmissionParams, options?: RequestOptions): Promise<FormSubmission> {
      return apiConfig.httpClient.put<FormSubmission>(
        `${submissionPath(params.store_id, params.form_id, params.id)}/assignee`,
        { assignee_account_id: params.assignee_account_id },
        options,
      );
    },

    setSubmissionCompany(params: SetFormSubmissionCompanyParams, options?: RequestOptions): Promise<FormSubmission> {
      return apiConfig.httpClient.put<FormSubmission>(
        `${submissionPath(params.store_id, params.form_id, params.id)}/company`,
        { company_id: params.company_id },
        options,
      );
    },

    getSubmissionFile(params: GetFormSubmissionFileParams, options?: RequestOptions): Promise<FormSubmissionFileLink> {
      return apiConfig.httpClient.get<FormSubmissionFileLink>(
        `${submissionPath(params.store_id, params.form_id, params.id)}/files/${segment(params.sha256)}`,
        options,
      );
    },

    deleteSubmission(params: DeleteFormSubmissionParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(submissionPath(params.store_id, params.form_id, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};

export const createStorefrontFormsApi = (httpClient: HttpClient) => ({
  get(params: GetStorefrontFormParams, options?: RequestOptions): Promise<Form> {
    const identifier = "id" in params ? params.id : params.key;
    return httpClient.get<Form>(`/v1/storefront/forms/${segment(identifier)}`, options);
  },

  submit(params: SubmitFormParams, options?: RequestOptions): Promise<StorefrontFormSubmission> {
    requireId(params.id, "form submission");
    const body = formSubmissionBody(
      { id: params.id, form_updated_at: params.form_updated_at, language: params.language },
      params.answers,
    );
    return httpClient.post<StorefrontFormSubmission>(`/v1/storefront/forms/${segment(params.form_id)}/submissions`, body, options);
  },
});
