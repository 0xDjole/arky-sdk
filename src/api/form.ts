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
  RequestOptions,
} from "../types/api";

export const createFormApi = (apiConfig: ApiConfig) => {
  return {
    async createForm(params: CreateFormParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/forms`,
        payload,
        options
      );
    },

    async updateForm(params: UpdateFormParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${targetBusinessId}/forms/${params.id}`,
        payload,
        options
      );
    },

    async deleteForm(params: DeleteFormParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${targetBusinessId}/forms/${params.id}`,
        options
      );
    },

    async getForm(params: GetFormParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${targetBusinessId}:${params.key}`;
      } else {
        throw new Error("GetFormParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/forms/${identifier}`,
        options
      );
    },

    async getForms(params: GetFormsParams, options?: RequestOptions) {
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/forms`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async submit(params: SubmitFormParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/forms/${params.formId}/submissions`,
        { formId: params.formId, businessId: targetBusinessId, blocks: params.blocks },
        options
      );
    },

    async getSubmissions(params: GetFormSubmissionsParams, options?: RequestOptions) {
      const { businessId, formId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/forms/${formId}/submissions`,
        {
          ...options,
          params: { ...queryParams, formId, businessId: targetBusinessId },
        }
      );
    },

    async getSubmission(params: GetFormSubmissionParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/forms/${params.formId}/submissions/${params.id}`,
        options
      );
    },
  };
};
