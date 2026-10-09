import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateEmailDomainParams,
  CreateEmailSenderParams,
  CreateEmailTemplateParams,
  DeleteEmailDomainParams,
  DeleteEmailSenderParams,
  DeleteEmailTemplateParams,
  EmailDomain,
  EmailSender,
  EmailTemplate,
  EmailTemplateDefault,
  EmailTemplatePreview,
  FindEmailDomainsParams,
  FindEmailSendersParams,
  FindEmailTemplateDefaultsParams,
  FindEmailTemplatesParams,
  FindNotificationsParams,
  GetEmailDomainParams,
  GetEmailSenderParams,
  GetEmailTemplateParams,
  GetNotificationParams,
  Notification,
  PreviewEmailTemplateParams,
  SendEmailTemplateTestParams,
  StopNotificationParams,
  UpdateEmailSenderParams,
  UpdateEmailTemplateParams,
  VerifyEmailDomainParams,
} from "../types/notification";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createNotificationApi = (apiConfig: ApiConfig) => ({
  find(params: FindNotificationsParams, options?: RequestOptions): Promise<PaginatedResponse<Notification>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Notification>>(storePath(store_id, "notifications"), {
      ...options,
      params: query,
    });
  },

  get(params: GetNotificationParams, options?: RequestOptions): Promise<Notification> {
    return apiConfig.httpClient.get<Notification>(storeRecordPath(params.store_id, "notifications", params.id), options);
  },

  stop(params: StopNotificationParams, options?: RequestOptions): Promise<Notification> {
    return apiConfig.httpClient.post<Notification>(
      `${storeRecordPath(params.store_id, "notifications", params.id)}/stop`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },
});

export const createEmailTemplateApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailTemplatesParams, options?: RequestOptions): Promise<PaginatedResponse<EmailTemplate>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailTemplate>>(storePath(store_id, "email-templates"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
    return apiConfig.httpClient.get<EmailTemplate>(storeRecordPath(params.store_id, "email-templates", params.id), options);
  },

  defaults(params: FindEmailTemplateDefaultsParams, options?: RequestOptions): Promise<EmailTemplateDefault[]> {
    return apiConfig.httpClient.get<EmailTemplateDefault[]>(storePath(params.store_id, "email-templates/defaults"), options);
  },

  create(params: CreateEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
    requireId(params.id, "email template");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailTemplate>(storePath(store_id, "email-templates"), body, options);
  },

  update(params: UpdateEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplate> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<EmailTemplate>(storeRecordPath(store_id, "email-templates", id), body, options);
  },

  delete(params: DeleteEmailTemplateParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "email-templates", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  preview(params: PreviewEmailTemplateParams, options?: RequestOptions): Promise<EmailTemplatePreview> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<EmailTemplatePreview>(
      `${storeRecordPath(store_id, "email-templates", id)}/preview`,
      body,
      options,
    );
  },

  test(params: SendEmailTemplateTestParams, options?: RequestOptions): Promise<Notification> {
    requireId(params.notification_id, "test email");
    return apiConfig.httpClient.post<Notification>(
      `${storeRecordPath(params.store_id, "email-templates", params.id)}/test`,
      { id: params.notification_id, language: params.language },
      options,
    );
  },
});

export const createEmailDomainApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailDomainsParams, options?: RequestOptions): Promise<PaginatedResponse<EmailDomain>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailDomain>>(storePath(store_id, "email-domains"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailDomainParams, options?: RequestOptions): Promise<EmailDomain> {
    return apiConfig.httpClient.get<EmailDomain>(storeRecordPath(params.store_id, "email-domains", params.id), options);
  },

  create(params: CreateEmailDomainParams, options?: RequestOptions): Promise<EmailDomain> {
    requireId(params.id, "email domain");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailDomain>(storePath(store_id, "email-domains"), body, options);
  },

  verify(params: VerifyEmailDomainParams, options?: RequestOptions): Promise<EmailDomain> {
    return apiConfig.httpClient.post<EmailDomain>(
      `${storeRecordPath(params.store_id, "email-domains", params.id)}/verify`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  delete(params: DeleteEmailDomainParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "email-domains", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createEmailSenderApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailSendersParams, options?: RequestOptions): Promise<PaginatedResponse<EmailSender>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailSender>>(storePath(store_id, "email-senders"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailSenderParams, options?: RequestOptions): Promise<EmailSender> {
    return apiConfig.httpClient.get<EmailSender>(storeRecordPath(params.store_id, "email-senders", params.id), options);
  },

  create(params: CreateEmailSenderParams, options?: RequestOptions): Promise<EmailSender> {
    requireId(params.id, "email sender");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailSender>(storePath(store_id, "email-senders"), body, options);
  },

  update(params: UpdateEmailSenderParams, options?: RequestOptions): Promise<EmailSender> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<EmailSender>(storeRecordPath(store_id, "email-senders", id), body, options);
  },

  delete(params: DeleteEmailSenderParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "email-senders", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
