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
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${target_store_id}/email-templates`,
        payload,
        options
      );
    },

    async updateEmailTemplate(params: UpdateEmailTemplateParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/email-templates/${params.id}`,
        payload,
        options
      );
    },

    async deleteEmailTemplate(params: DeleteEmailTemplateParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete(
        `/v1/stores/${target_store_id}/email-templates/${params.id}`,
        options
      );
    },

    async getEmailTemplate(params: GetEmailTemplateParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetEmailTemplateParams requires id or key");
      }

      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/email-templates/${identifier}`,
        options
      );
    },

    async getEmailTemplates(params: GetEmailTemplatesParams, options?: RequestOptions) {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/email-templates`,
        {
          ...options,
          params: queryParams,
        }
      );
    },
  };
};
