import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateFormParams,
  UpdateFormParams,
  DeleteFormParams,
  PermanentlyDeleteFormParams,
  GetFormParams,
  GetFormsParams,
  GetFormsByIdsParams,
  GetFormSubmissionsParams,
  GetFormSubmissionParams,
  DeleteFormSubmissionParams,
  GetFormPresentationParams,
  CreateStaffFormSubmissionParams,
  ChangeFormSubmissionStageParams,
  AssignFormSubmissionParams,
  CreateFormSubmissionNoteParams,
  FindFormSubmissionNotesParams,
  UpdateFormSubmissionNoteParams,
  DeleteFormSubmissionNoteParams,
  SetFormSubmissionCompanyParams,
  RequestOptions,
} from "../types/api";
import type {
  AdminFormSubmission,
  Form,
  FormPresentation,
  PaginatedResponse,
} from "../types";
import type { Note } from "../types/note";

export const createFormsApi = (apiConfig: ApiConfig) => {
  return {
    async createForm(params: CreateFormParams, options?: RequestOptions): Promise<Form> {
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<Form>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms`,
        payload,
        options
      );
    },

    async updateForm(params: UpdateFormParams, options?: RequestOptions): Promise<Form> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<Form>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms/${params.id}`,
        payload,
        options
      );
    },

    async deleteForm(params: DeleteFormParams, options?: RequestOptions): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms/${params.id}`,
        options
      );
    },

    async permanentlyDeleteForm(
      params: PermanentlyDeleteFormParams,
      options?: RequestOptions
    ): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms/${params.id}/permanent`,
        options
      );
    },

    async getForm(params: GetFormParams, options?: RequestOptions): Promise<Form> {
      const target_store_id = requireStoreId(params.store_id);
      let identifier: string;
      if (params.id) {
        identifier = encodeURIComponent(params.id);
      } else if (params.key) {
        identifier = `by-key/${encodeURIComponent(params.key)}`;
      } else {
        throw new Error("GetFormParams requires id or key");
      }

      return apiConfig.httpClient.get<Form>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms/${identifier}`,
        options
      );
    },

    async getForms(params: GetFormsParams, options?: RequestOptions): Promise<{ items: Form[]; cursor: string | null }> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<{ items: Form[]; cursor: string | null }>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getFormsByIds(params: GetFormsByIdsParams, options?: RequestOptions): Promise<{ items: Form[]; cursor: null }> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<{ items: Form[]; cursor: null }>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms`,
        { ...options, params: { ids: params.ids } }
      );
    },

    async getSubmissions(params: GetFormSubmissionsParams, options?: RequestOptions): Promise<{ items: AdminFormSubmission[]; cursor: string | null }> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<{ items: AdminFormSubmission[]; cursor: string | null }>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms/submissions`,
        { ...options, params: queryParams }
      );
    },

    async getSubmission(params: GetFormSubmissionParams, options?: RequestOptions): Promise<AdminFormSubmission> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<AdminFormSubmission>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms/${params.form_id}/submissions/${params.id}`,
        options
      );
    },

    async getPresentation(
      params: GetFormPresentationParams,
      options?: RequestOptions,
    ): Promise<FormPresentation> {
      return apiConfig.httpClient.get<FormPresentation>(
        `/v1/stores/${requireStoreId(params.store_id)}/forms/${encodeURIComponent(params.id)}/presentation`,
        { ...options, params: { locale: params.locale } },
      );
    },

    async createSubmission(
      params: CreateStaffFormSubmissionParams,
      options?: RequestOptions,
    ): Promise<AdminFormSubmission> {
      const { store_id, form_id, ...payload } = params;
      return apiConfig.httpClient.post<AdminFormSubmission>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions`,
        payload,
        options,
      );
    },

    async changeSubmissionStage(
      params: ChangeFormSubmissionStageParams,
      options?: RequestOptions,
    ): Promise<AdminFormSubmission> {
      const { store_id, form_id, id, ...payload } = params;
      return apiConfig.httpClient.post<AdminFormSubmission>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions/${encodeURIComponent(id)}/stage`,
        payload,
        options,
      );
    },

    async assignSubmission(
      params: AssignFormSubmissionParams,
      options?: RequestOptions,
    ): Promise<AdminFormSubmission> {
      const { store_id, form_id, id, assignee_account_id } = params;
      return apiConfig.httpClient.put<AdminFormSubmission>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions/${encodeURIComponent(id)}/assignee`,
        { assignee_account_id },
        options,
      );
    },

    async setSubmissionCompany(
      params: SetFormSubmissionCompanyParams,
      options?: RequestOptions,
    ): Promise<AdminFormSubmission> {
      const { store_id, form_id, id, company_id } = params;
      return apiConfig.httpClient.put<AdminFormSubmission>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions/${encodeURIComponent(id)}/company`,
        { company_id },
        options,
      );
    },

    async createSubmissionNote(
      params: CreateFormSubmissionNoteParams,
      options?: RequestOptions,
    ): Promise<Note> {
      const { store_id, form_id, form_submission_id, ...payload } = params;
      return apiConfig.httpClient.post<Note>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions/${encodeURIComponent(form_submission_id)}/notes`,
        payload,
        options,
      );
    },

    async findSubmissionNotes(
      params: FindFormSubmissionNotesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Note>> {
      const { store_id, form_id, form_submission_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Note>>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions/${encodeURIComponent(form_submission_id)}/notes`,
        { ...options, params: query },
      );
    },

    async updateSubmissionNote(
      params: UpdateFormSubmissionNoteParams,
      options?: RequestOptions,
    ): Promise<Note> {
      const { store_id, form_id, form_submission_id, id, expected_updated_at, body } = params;
      return apiConfig.httpClient.put<Note>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions/${encodeURIComponent(form_submission_id)}/notes/${encodeURIComponent(id)}`,
        { expected_updated_at, body },
        options,
      );
    },

    async deleteSubmissionNote(
      params: DeleteFormSubmissionNoteParams,
      options?: RequestOptions,
    ): Promise<Note> {
      const { store_id, form_id, form_submission_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<Note>(
        `/v1/stores/${requireStoreId(store_id)}/forms/${encodeURIComponent(form_id)}/submissions/${encodeURIComponent(form_submission_id)}/notes/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },

    async deleteSubmission(
      params: DeleteFormSubmissionParams,
      options?: RequestOptions
    ): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/forms/${params.form_id}/submissions/${params.id}`,
        options
      );
    },
  };
};
