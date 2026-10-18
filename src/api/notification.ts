import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  GetEmailProviderParams,
  ConnectEmailProviderParams,
  ReplaceEmailProviderKeyParams,
  FindEmailProviderDomainsParams,
  EmailProvider,
  EmailProviderDomain,
  ChangeEmailAddressStatusParams,
  CreateEmailAddressParams,
  CreateEmailTemplateParams,
  DeleteEmailAddressParams,
  DeleteEmailTemplateParams,
  EmailAddress,
  EmailTemplate,
  EmailTemplateDefault,
  EmailTemplatePreview,
  FindEmailAddressesParams,
  FindEmailTemplateDefaultsParams,
  FindEmailTemplatesParams,
  FindOutgoingEmailsParams,
  FindOutgoingWebhooksParams,
  GetEmailAddressParams,
  GetEmailTemplateParams,
  GetOutgoingEmailParams,
  GetOutgoingWebhookParams,
  OutgoingEmail,
  OutgoingWebhook,
  PreviewEmailTemplateParams,
  SendEmailTemplateTestParams,
  UpdateEmailAddressParams,
  UpdateEmailTemplateParams,
} from "../types/notification";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createOutgoingEmailApi = (apiConfig: ApiConfig) => ({
  find(params: FindOutgoingEmailsParams, options?: RequestOptions): Promise<PaginatedResponse<OutgoingEmail>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<OutgoingEmail>>(storePath(store_id, "outgoing-emails"), { ...options, params: query });
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
        ...(params.sending_address_id !== undefined ? { sending_address_id: params.sending_address_id } : {}),
      },
      options,
    );
  },
});

export const createEmailProviderApi = (apiConfig: ApiConfig) => ({
  connect(params: ConnectEmailProviderParams, options?: RequestOptions): Promise<EmailProvider> {
    requireId(params.id, "email provider");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailProvider>(storePath(store_id, "email-provider"), body, options);
  },
  replaceKey(params: ReplaceEmailProviderKeyParams, options?: RequestOptions): Promise<EmailProvider> {
    return apiConfig.httpClient.put<EmailProvider>(
      storePath(params.store_id, "email-provider"),
      { expected_updated_at: params.expected_updated_at, api_key: params.api_key },
      options,
    );
  },
  get(params: GetEmailProviderParams, options?: RequestOptions): Promise<EmailProvider | null> {
    return apiConfig.httpClient.get<EmailProvider | null>(storePath(params.store_id, "email-provider"), options);
  },
  async findDomains(params: FindEmailProviderDomainsParams, options?: RequestOptions): Promise<PaginatedResponse<EmailProviderDomain>> {
    const items = await apiConfig.httpClient.get<EmailProviderDomain[]>(storePath(params.store_id, "email-provider/domains"), options);
    return { items, cursor: null };
  },
});

export const createEmailAddressApi = (apiConfig: ApiConfig) => {
  const addressPath = (storeId: string, id: string) => storeRecordPath(storeId, "email-addresses", id);
  return {
    find(params: FindEmailAddressesParams, options?: RequestOptions): Promise<PaginatedResponse<EmailAddress>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<EmailAddress>>(storePath(store_id, "email-addresses"), {
        ...options,
        params: query,
      });
    },

    get(params: GetEmailAddressParams, options?: RequestOptions): Promise<EmailAddress> {
      return apiConfig.httpClient.get<EmailAddress>(addressPath(params.store_id, params.id), options);
    },

    create(params: CreateEmailAddressParams, options?: RequestOptions): Promise<EmailAddress> {
      requireId(params.id, "email address");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<EmailAddress>(storePath(store_id, "email-addresses"), body, options);
    },

    update(params: UpdateEmailAddressParams, options?: RequestOptions): Promise<EmailAddress> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<EmailAddress>(addressPath(store_id, id), body, options);
    },

    archive(params: ChangeEmailAddressStatusParams, options?: RequestOptions): Promise<EmailAddress> {
      return apiConfig.httpClient.post<EmailAddress>(
        `${addressPath(params.store_id, params.id)}/archive`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    activate(params: ChangeEmailAddressStatusParams, options?: RequestOptions): Promise<EmailAddress> {
      return apiConfig.httpClient.post<EmailAddress>(
        `${addressPath(params.store_id, params.id)}/activate`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    delete(params: DeleteEmailAddressParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(addressPath(params.store_id, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};

export const createStoreEmailsApi = (apiConfig: ApiConfig) => ({
  get(params: import("../types/notification").GetStoreEmailsParams, options?: RequestOptions): Promise<import("../types/notification").StoreEmails> {
    return apiConfig.httpClient.get<import("../types/notification").StoreEmails>(storePath(params.store_id, "emails"), options);
  },
  update(params: import("../types/notification").UpdateStoreEmailsParams, options?: RequestOptions): Promise<import("../types/notification").StoreEmails> {
    const { store_id, ...body } = params;
    return apiConfig.httpClient.put<import("../types/notification").StoreEmails>(storePath(store_id, "emails"), body, options);
  },
});
