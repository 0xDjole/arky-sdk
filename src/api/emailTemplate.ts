import { requireStoreId } from "../utils/storeTarget";
import { requireRequestId } from "../utils/requestId";
import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateEmailTemplateParams,
  UpdateEmailTemplateParams,
  DeleteEmailTemplateParams,
  GetEmailTemplateParams,
  GetEmailTemplatesParams,
  PreviewEmailTemplateParams,
  PreviewEmailTemplateResponse,
  SendEmailTemplateTestParams,
  RequestOptions,
} from "../types/api";
import type { EmailTemplate } from "../types";
import type { MessageDelivery } from "../types/messageDelivery";

export const createEmailTemplateApi = (apiConfig: ApiConfig) => {
  return {
    async createEmailTemplate(params: CreateEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<EmailTemplate>(
        `/v1/stores/${requireStoreId(target_store_id)}/email-templates`,
        payload,
        options
      );
    },

    async updateEmailTemplate(params: UpdateEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<EmailTemplate>(
        `/v1/stores/${requireStoreId(target_store_id)}/email-templates/${encodeURIComponent(id)}`,
        payload,
        options
      );
    },

    async deleteEmailTemplate(params: DeleteEmailTemplateParams, options?: RequestOptions): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/email-templates/${params.id}`,
        options
      );
    },

    async getEmailTemplate(params: GetEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
      const target_store_id = requireStoreId(params.store_id);
      if (params.id) {
        return apiConfig.httpClient.get<EmailTemplate>(
          `/v1/stores/${target_store_id}/email-templates/${encodeURIComponent(params.id)}`,
          options
        );
      }
      if (!params.key) throw new Error("GetEmailTemplateParams requires id or key");
      const page = await apiConfig.httpClient.get<{ items: EmailTemplate[]; cursor: string | null }>(
        `/v1/stores/${target_store_id}/email-templates`,
        { ...options, params: { key: params.key, limit: 1 } }
      );
      const template = page.items.find((item) => item.key === params.key);
      if (!template) throw new Error(`Email template '${params.key}' was not found`);
      return template;
    },

    async getEmailTemplates(params: GetEmailTemplatesParams, options?: RequestOptions): Promise<{ items: EmailTemplate[]; cursor: string | null }> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<{ items: EmailTemplate[]; cursor: string | null }>(
        `/v1/stores/${requireStoreId(target_store_id)}/email-templates`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async previewEmailTemplate(params: PreviewEmailTemplateParams, options?: RequestOptions): Promise<PreviewEmailTemplateResponse> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<PreviewEmailTemplateResponse>(
        `/v1/stores/${requireStoreId(target_store_id)}/email-templates/${id}/preview`,
        payload,
        options
      );
    },

    async sendEmailTemplateTest(params: SendEmailTemplateTestParams, options?: RequestOptions): Promise<MessageDelivery> {
      const { store_id, id, request_id, language, sender } = params;
      const target_store_id = requireStoreId(store_id);
      requireRequestId(request_id);
      return apiConfig.httpClient.post<MessageDelivery>(
        `/v1/stores/${target_store_id}/email-templates/${encodeURIComponent(id)}/test`,
        { request_id, language: language ?? null, sender },
        options
      );
    },
  };
};
