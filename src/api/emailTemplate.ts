import type { ApiConfig } from "../index";
import type {
  CreateEmailTemplateParams,
  UpdateEmailTemplateParams,
  DeleteEmailTemplateParams,
  GetEmailTemplateParams,
  GetEmailTemplatesParams,
  RequestOptions,
} from "../types/api";
import type { EmailTemplate, PaginatedResponse } from "../types";

export const createEmailTemplateApi = (apiConfig: ApiConfig) => {
  return {
    async createEmailTemplate(params: CreateEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<EmailTemplate>(
        `/v1/stores/${target_store_id}/email-templates`,
        payload,
        options
      );
    },

    async updateEmailTemplate(params: UpdateEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<EmailTemplate>(
        `/v1/stores/${target_store_id}/email-templates/${params.id}`,
        payload,
        options
      );
    },

    async deleteEmailTemplate(params: DeleteEmailTemplateParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${target_store_id}/email-templates/${params.id}`,
        options
      );
    },

    async getEmailTemplate(params: GetEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetEmailTemplateParams requires id or key");
      }

      return apiConfig.httpClient.get<EmailTemplate>(
        `/v1/stores/${target_store_id}/email-templates/${identifier}`,
        options
      );
    },

    async getEmailTemplates(params: GetEmailTemplatesParams, options?: RequestOptions): Promise<PaginatedResponse<EmailTemplate>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<EmailTemplate>>(
        `/v1/stores/${target_store_id}/email-templates`,
        {
          ...options,
          params: queryParams,
        }
      );
    },
  };
};
