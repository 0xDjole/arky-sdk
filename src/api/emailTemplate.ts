import type { ApiConfig } from "../index";
import type {
  CreateEmailTemplateParams,
  UpdateEmailTemplateParams,
  DeleteEmailTemplateParams,
  GetEmailTemplateParams,
  GetEmailTemplatesParams,
  RequestOptions,
} from "../types/api";

export const createEmailTemplateApi = (apiConfig: ApiConfig) => {
  return {
    async createEmailTemplate(params: CreateEmailTemplateParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${targetBusinessId}/email-templates`,
        payload,
        options
      );
    },

    async updateEmailTemplate(params: UpdateEmailTemplateParams, options?: RequestOptions) {
      const { businessId, ...payload } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${targetBusinessId}/email-templates/${params.id}`,
        payload,
        options
      );
    },

    async deleteEmailTemplate(params: DeleteEmailTemplateParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${targetBusinessId}/email-templates/${params.id}`,
        options
      );
    },

    async getEmailTemplate(params: GetEmailTemplateParams, options?: RequestOptions) {
      const targetBusinessId = params.businessId || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${targetBusinessId}:${params.key}`;
      } else {
        throw new Error("GetEmailTemplateParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/email-templates/${identifier}`,
        options
      );
    },

    async getEmailTemplates(params: GetEmailTemplatesParams, options?: RequestOptions) {
      const { businessId, ...queryParams } = params;
      const targetBusinessId = businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${targetBusinessId}/email-templates`,
        {
          ...options,
          params: queryParams,
        }
      );
    },
  };
};
