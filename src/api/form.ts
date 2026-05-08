import type { ApiConfig } from "../index";
import type {
  CreateFormParams,
  UpdateFormParams,
  DeleteFormParams,
  GetFormParams,
  GetFormsParams,
  SubmitFormParams,
  GetFormSubmissionsParams,
  GetFormSubmissionParams,
  UpdateFormSubmissionParams,
  RequestOptions,
} from "../types/api";
import type { Form, FormSubmission, PaginatedResponse } from "../types";

export const createFormApi = (apiConfig: ApiConfig) => {
  return {
    async createForm(params: CreateFormParams, options?: RequestOptions): Promise<Form> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Form>(
        `/v1/stores/${target_store_id}/forms`,
        payload,
        options
      );
    },

    async updateForm(params: UpdateFormParams, options?: RequestOptions): Promise<Form> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Form>(
        `/v1/stores/${target_store_id}/forms/${params.id}`,
        payload,
        options
      );
    },

    async deleteForm(params: DeleteFormParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${target_store_id}/forms/${params.id}`,
        options
      );
    },

    async getForm(params: GetFormParams, options?: RequestOptions): Promise<Form> {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetFormParams requires id or key");
      }

      return apiConfig.httpClient.get<Form>(
        `/v1/stores/${target_store_id}/forms/${identifier}`,
        options
      );
    },

    async getForms(params: GetFormsParams, options?: RequestOptions): Promise<PaginatedResponse<Form>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Form>>(
        `/v1/stores/${target_store_id}/forms`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async submit(params: SubmitFormParams, options?: RequestOptions): Promise<FormSubmission> {
      const { store_id, form_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<FormSubmission>(
        `/v1/stores/${target_store_id}/forms/${form_id}/submissions`,
        { ...payload, form_id, store_id: target_store_id },
        options
      );
    },

    async getSubmissions(params: GetFormSubmissionsParams, options?: RequestOptions): Promise<PaginatedResponse<FormSubmission>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<FormSubmission>>(
        `/v1/stores/${target_store_id}/forms/submissions`,
        { ...options, params: queryParams }
      );
    },

    async getSubmission(params: GetFormSubmissionParams, options?: RequestOptions): Promise<FormSubmission> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<FormSubmission>(
        `/v1/stores/${target_store_id}/forms/${params.form_id}/submissions/${params.id}`,
        options
      );
    },

    async updateSubmission(params: UpdateFormSubmissionParams, options?: RequestOptions): Promise<FormSubmission> {
      const { store_id, form_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<FormSubmission>(
        `/v1/stores/${target_store_id}/forms/${form_id}/submissions/${id}`,
        { ...payload, form_id, store_id: target_store_id, id },
        options
      );
    },
  };
};
