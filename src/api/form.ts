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

export const createFormApi = (apiConfig: ApiConfig) => {
  return {
    async createForm(params: CreateFormParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${target_store_id}/forms`,
        payload,
        options
      );
    },

    async updateForm(params: UpdateFormParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/forms/${params.id}`,
        payload,
        options
      );
    },

    async deleteForm(params: DeleteFormParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete(
        `/v1/stores/${target_store_id}/forms/${params.id}`,
        options
      );
    },

    async getForm(params: GetFormParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetFormParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/forms/${identifier}`,
        options
      );
    },

    async getForms(params: GetFormsParams, options?: RequestOptions) {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/forms`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async submit(params: SubmitFormParams, options?: RequestOptions) {
      const { store_id, form_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${target_store_id}/forms/${form_id}/submissions`,
        { ...payload, form_id, store_id: target_store_id },
        options
      );
    },

    async getSubmissions(params: GetFormSubmissionsParams, options?: RequestOptions) {
      const { store_id, form_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/forms/${form_id}/submissions`,
        {
          ...options,
          params: { ...queryParams, form_id, store_id: target_store_id },
        }
      );
    },

    async getSubmission(params: GetFormSubmissionParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/forms/${params.form_id}/submissions/${params.id}`,
        options
      );
    },

    async updateSubmission(params: UpdateFormSubmissionParams, options?: RequestOptions) {
      const { store_id, form_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/forms/${form_id}/submissions/${id}`,
        { ...payload, form_id, store_id: target_store_id, id },
        options
      );
    },
  };
};
