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
  RequestOptions,
} from "../types/api";
import type { Form, FormSubmission } from "../types";

export const createFormsApi = (apiConfig: ApiConfig) => {
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

    async deleteForm(params: DeleteFormParams, options?: RequestOptions): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/forms/${params.id}`,
        options
      );
    },

    async permanentlyDeleteForm(
      params: PermanentlyDeleteFormParams,
      options?: RequestOptions
    ): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/forms/${params.id}/permanent`,
        options
      );
    },

    async getForm(params: GetFormParams, options?: RequestOptions): Promise<Form> {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = encodeURIComponent(params.id);
      } else if (params.key) {
        identifier = `by-key/${encodeURIComponent(params.key)}`;
      } else {
        throw new Error("GetFormParams requires id or key");
      }

      return apiConfig.httpClient.get<Form>(
        `/v1/stores/${target_store_id}/forms/${identifier}`,
        options
      );
    },

    async getForms(params: GetFormsParams = {}, options?: RequestOptions): Promise<{ items: Form[]; cursor: string | null }> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<{ items: Form[]; cursor: string | null }>(
        `/v1/stores/${target_store_id}/forms`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getFormsByIds(params: GetFormsByIdsParams, options?: RequestOptions): Promise<{ items: Form[]; cursor: null }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<{ items: Form[]; cursor: null }>(
        `/v1/stores/${target_store_id}/forms`,
        { ...options, params: { ids: params.ids } }
      );
    },

    async getSubmissions(params: GetFormSubmissionsParams = {}, options?: RequestOptions): Promise<{ items: FormSubmission[]; cursor: string | null }> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<{ items: FormSubmission[]; cursor: string | null }>(
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

    async deleteSubmission(
      params: DeleteFormSubmissionParams,
      options?: RequestOptions
    ): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/forms/${params.form_id}/submissions/${params.id}`,
        options
      );
    },
  };
};
