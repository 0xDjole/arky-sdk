import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { IncomingWebhook } from "../types/payment";
import type {
  ConnectEmailProviderParams,
  CreateEmailAddressParams,
  CreateEmailLayoutParams,
  CreateEmailTemplateParams,
  DeleteEmailAddressParams,
  DeleteEmailLayoutParams,
  DeleteEmailProviderParams,
  DeleteEmailTemplateParams,
  EmailAddress,
  EmailAddressReadiness,
  EmailLayout,
  EmailProvider,
  EmailProviderDomain,
  EmailTemplate,
  EmailTemplateDefault,
  EmailTemplatePreview,
  FindEmailAddressesParams,
  FindEmailLayoutsParams,
  FindEmailProviderDomainsParams,
  FindEmailProvidersParams,
  FindEmailTemplateDefaultsParams,
  FindEmailTemplatesParams,
  FindOutgoingEmailsParams,
  FindOutgoingWebhooksParams,
  FindStoreResendEventsParams,
  GetEmailAddressParams,
  GetEmailAddressReadinessParams,
  GetEmailLayoutParams,
  GetEmailProviderParams,
  GetEmailTemplateParams,
  GetOutgoingEmailParams,
  GetOutgoingWebhookParams,
  GetStoreEmailsParams,
  OutgoingEmail,
  OutgoingEmailSummary,
  OutgoingWebhook,
  PreviewEmailTemplateParams,
  ReplaceEmailProviderKeyParams,
  ResolveStoreResendEventParams,
  SendEmailTemplateTestParams,
  StoreEmails,
  UpdateEmailLayoutParams,
  UpdateEmailTemplateParams,
  UpdateStoreEmailsParams,
} from "../types/notification";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createOutgoingEmailApi = (apiConfig: ApiConfig) => ({
  find(params: FindOutgoingEmailsParams, options?: RequestOptions): Promise<PaginatedResponse<OutgoingEmailSummary>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<OutgoingEmailSummary>>(storePath(store_id, "outgoing-emails"), { ...options, params: query });
  },
  get(params: GetOutgoingEmailParams, options?: RequestOptions): Promise<OutgoingEmail> {
    return apiConfig.httpClient.get<OutgoingEmail>(storeRecordPath(params.store_id, "outgoing-emails", params.id), options);
  },
});

export const createOutgoingWebhookApi = (apiConfig: ApiConfig) => ({
  find(params: FindOutgoingWebhooksParams, options?: RequestOptions): Promise<PaginatedResponse<OutgoingWebhook>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<OutgoingWebhook>>(storePath(store_id, "outgoing-webhooks"), { ...options, params: query });
  },
  get(params: GetOutgoingWebhookParams, options?: RequestOptions): Promise<OutgoingWebhook> {
    return apiConfig.httpClient.get<OutgoingWebhook>(storeRecordPath(params.store_id, "outgoing-webhooks", params.id), options);
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

  async findDefaults(params: FindEmailTemplateDefaultsParams, options?: RequestOptions): Promise<PaginatedResponse<EmailTemplateDefault>> {
    const items = await apiConfig.httpClient.get<EmailTemplateDefault[]>(storePath(params.store_id, "email-templates/defaults"), options);
    return { items, cursor: null };
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

  test(params: SendEmailTemplateTestParams, options?: RequestOptions): Promise<OutgoingEmail> {
    requireId(params.outgoing_email_id, "test email");
    return apiConfig.httpClient.post<OutgoingEmail>(
      `${storeRecordPath(params.store_id, "email-templates", params.id)}/test`,
      {
        id: params.outgoing_email_id,
        language: params.language,
        sending_address_id: params.sending_address_id,
        from_name: params.from_name,
        reply_to: params.reply_to,
      },
      options,
    );
  },
});

export const createEmailLayoutApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailLayoutsParams, options?: RequestOptions): Promise<PaginatedResponse<EmailLayout>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailLayout>>(storePath(store_id, "email-layouts"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailLayoutParams, options?: RequestOptions): Promise<EmailLayout> {
    return apiConfig.httpClient.get<EmailLayout>(storeRecordPath(params.store_id, "email-layouts", params.id), options);
  },

  create(params: CreateEmailLayoutParams, options?: RequestOptions): Promise<EmailLayout> {
    requireId(params.id, "email layout");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailLayout>(storePath(store_id, "email-layouts"), body, options);
  },

  update(params: UpdateEmailLayoutParams, options?: RequestOptions): Promise<EmailLayout> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<EmailLayout>(storeRecordPath(store_id, "email-layouts", id), body, options);
  },

  delete(params: DeleteEmailLayoutParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "email-layouts", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createEmailProviderApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailProvidersParams, options?: RequestOptions): Promise<PaginatedResponse<EmailProvider>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailProvider>>(storePath(store_id, "email-providers"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailProviderParams, options?: RequestOptions): Promise<EmailProvider> {
    return apiConfig.httpClient.get<EmailProvider>(storeRecordPath(params.store_id, "email-providers", params.id), options);
  },

  connect(params: ConnectEmailProviderParams, options?: RequestOptions): Promise<EmailProvider> {
    requireId(params.id, "email provider");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailProvider>(storePath(store_id, "email-providers"), body, options);
  },

  replaceKey(params: ReplaceEmailProviderKeyParams, options?: RequestOptions): Promise<EmailProvider> {
    return apiConfig.httpClient.put<EmailProvider>(
      storeRecordPath(params.store_id, "email-providers", params.id),
      { expected_updated_at: params.expected_updated_at, api_key: params.api_key },
      options,
    );
  },

  delete(params: DeleteEmailProviderParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "email-providers", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  async findDomains(params: FindEmailProviderDomainsParams, options?: RequestOptions): Promise<PaginatedResponse<EmailProviderDomain>> {
    const items = await apiConfig.httpClient.get<EmailProviderDomain[]>(
      `${storeRecordPath(params.store_id, "email-providers", params.id)}/domains`,
      options,
    );
    return { items, cursor: null };
  },
});

export const createEmailAddressApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailAddressesParams, options?: RequestOptions): Promise<PaginatedResponse<EmailAddress>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailAddress>>(storePath(store_id, "email-addresses"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailAddressParams, options?: RequestOptions): Promise<EmailAddress> {
    return apiConfig.httpClient.get<EmailAddress>(storeRecordPath(params.store_id, "email-addresses", params.id), options);
  },

  create(params: CreateEmailAddressParams, options?: RequestOptions): Promise<EmailAddress> {
    requireId(params.id, "email address");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailAddress>(storePath(store_id, "email-addresses"), body, options);
  },

  delete(params: DeleteEmailAddressParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "email-addresses", params.id), options);
  },

  getReadiness(params: GetEmailAddressReadinessParams, options?: RequestOptions): Promise<EmailAddressReadiness> {
    return apiConfig.httpClient.get<EmailAddressReadiness>(
      `${storeRecordPath(params.store_id, "email-addresses", params.id)}/readiness`,
      options,
    );
  },
});

export const createStoreEmailsApi = (apiConfig: ApiConfig) => ({
  get(params: GetStoreEmailsParams, options?: RequestOptions): Promise<StoreEmails> {
    return apiConfig.httpClient.get<StoreEmails>(storePath(params.store_id, "emails"), options);
  },

  update(params: UpdateStoreEmailsParams, options?: RequestOptions): Promise<StoreEmails> {
    const { store_id, ...body } = params;
    return apiConfig.httpClient.put<StoreEmails>(storePath(store_id, "emails"), body, options);
  },
});

export const createStoreResendEventApi = (apiConfig: ApiConfig) => ({
  find(params: FindStoreResendEventsParams, options?: RequestOptions): Promise<PaginatedResponse<IncomingWebhook>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<IncomingWebhook>>(storePath(store_id, "incoming-webhooks/resend"), {
      ...options,
      params: query,
    });
  },

  resolve(params: ResolveStoreResendEventParams, options?: RequestOptions): Promise<IncomingWebhook> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<IncomingWebhook>(
      `${storeRecordPath(store_id, "incoming-webhooks/resend", id)}/resolve`,
      body,
      options,
    );
  },
});
