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
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/forms`,
        payload,
        options
      );
    },

    async updateForm(params: UpdateFormParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/forms/${params.id}`,
        payload,
        options
      );
    },

    async deleteForm(params: DeleteFormParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${target_business_id}/forms/${params.id}`,
        options
      );
    },

    async getForm(params: GetFormParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_business_id}:${params.key}`;
      } else {
        throw new Error("GetFormParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/forms/${identifier}`,
        options
      );
    },

    async getForms(params: GetFormsParams, options?: RequestOptions) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/forms`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async submit(params: SubmitFormParams, options?: RequestOptions) {
      const { business_id, form_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/forms/${form_id}/submissions`,
        { ...payload, form_id, business_id: target_business_id },
        options
      );
    },

    async getSubmissions(params: GetFormSubmissionsParams, options?: RequestOptions) {
      const { business_id, form_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/forms/${form_id}/submissions`,
        {
          ...options,
          params: { ...queryParams, form_id, business_id: target_business_id },
        }
      );
    },

    async getSubmission(params: GetFormSubmissionParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/forms/${params.form_id}/submissions/${params.id}`,
        options
      );
    },

    async updateSubmission(params: UpdateFormSubmissionParams, options?: RequestOptions) {
      const { business_id, form_id, id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/forms/${form_id}/submissions/${id}`,
        { ...payload, form_id, business_id: target_business_id, id },
        options
      );
    },
  };
};
