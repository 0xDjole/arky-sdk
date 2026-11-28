import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { TenantResendIncomingWebhook } from "../types/payment";
import type {
  CreateEmailAddressParams,
  CreateEmailLayoutParams,
  CreateNotificationParams,
  CreateTemplateParams,
  DeleteEmailAddressParams,
  DeleteEmailLayoutParams,
  DeleteNotificationParams,
  DeleteTemplateParams,
  EmailAddress,
  EmailAddressReadiness,
  EmailLayout,
  EmailLayoutSummary,
  FindEmailAddressesParams,
  FindEmailLayoutsParams,
  FindNotificationsParams,
  FindOutgoingMessagesParams,
  FindOutgoingWebhooksParams,
  FindTenantResendEventsParams,
  FindTemplateDefaultsParams,
  FindTemplatesParams,
  GetEmailAddressNetworkDomainParams,
  GetEmailAddressParams,
  GetEmailAddressReadinessParams,
  GetEmailLayoutParams,
  GetNotificationParams,
  GetOutgoingMessageParams,
  GetOutgoingWebhookParams,
  GetTemplateParams,
  NetworkTenantAddresses,
  Notification,
  OutgoingMessage,
  OutgoingMessageSummary,
  OutgoingWebhook,
  PreviewTemplateParams,
  ReminderResult,
  ResolveTenantResendEventParams,
  SendBookingReminderParams,
  SendEmailTemplateTestParams,
  Template,
  TemplateDefault,
  TemplatePreview,
  TemplateSummary,
  UpdateEmailLayoutParams,
  UpdateNotificationParams,
  UpdateTemplateParams,
} from "../types/notification";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createOutgoingMessageApi = (apiConfig: ApiConfig) => ({
  find(params: FindOutgoingMessagesParams, options?: RequestOptions): Promise<PaginatedResponse<OutgoingMessageSummary>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<OutgoingMessageSummary>>(tenantPath(tenant_id, "outgoing-messages"), { ...options, params: query });
  },
  get(params: GetOutgoingMessageParams, options?: RequestOptions): Promise<OutgoingMessage> {
    return apiConfig.httpClient.get<OutgoingMessage>(tenantRecordPath(params.tenant_id, "outgoing-messages", params.id), options);
  },
});

export const createOutgoingWebhookApi = (apiConfig: ApiConfig) => ({
  find(params: FindOutgoingWebhooksParams, options?: RequestOptions): Promise<PaginatedResponse<OutgoingWebhook>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<OutgoingWebhook>>(tenantPath(tenant_id, "outgoing-webhooks"), { ...options, params: query });
  },
  get(params: GetOutgoingWebhookParams, options?: RequestOptions): Promise<OutgoingWebhook> {
    return apiConfig.httpClient.get<OutgoingWebhook>(tenantRecordPath(params.tenant_id, "outgoing-webhooks", params.id), options);
  },
});

export const createTemplateApi = (apiConfig: ApiConfig) => ({
  find(params: FindTemplatesParams, options?: RequestOptions): Promise<PaginatedResponse<TemplateSummary>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<TemplateSummary>>(tenantPath(tenant_id, "email-templates"), {
      ...options,
      params: query,
    });
  },

  get(params: GetTemplateParams, options?: RequestOptions): Promise<Template> {
    return apiConfig.httpClient.get<Template>(tenantRecordPath(params.tenant_id, "email-templates", params.id), options);
  },

  findDefaults(params: FindTemplateDefaultsParams, options?: RequestOptions): Promise<TemplateDefault[]> {
    return apiConfig.httpClient.get<TemplateDefault[]>(tenantPath(params.tenant_id, "email-templates/defaults"), options);
  },

  create(params: CreateTemplateParams, options?: RequestOptions): Promise<Template> {
    requireId(params.id, "template");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Template>(tenantPath(tenant_id, "email-templates"), body, options);
  },

  update(params: UpdateTemplateParams, options?: RequestOptions): Promise<Template> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Template>(tenantRecordPath(tenant_id, "email-templates", id), body, options);
  },

  delete(params: DeleteTemplateParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(tenantRecordPath(params.tenant_id, "email-templates", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  preview(params: PreviewTemplateParams, options?: RequestOptions): Promise<TemplatePreview> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<TemplatePreview>(
      `${tenantRecordPath(tenant_id, "email-templates", id)}/preview`,
      body,
      options,
    );
  },

  test(params: SendEmailTemplateTestParams, options?: RequestOptions): Promise<OutgoingMessage> {
    requireId(params.outgoing_message_id, "test email");
    return apiConfig.httpClient.post<OutgoingMessage>(
      `${tenantRecordPath(params.tenant_id, "email-templates", params.id)}/test`,
      {
        id: params.outgoing_message_id,
        language: params.language,
        email_address_id: params.email_address_id,
        from_name: params.from_name,
        reply_to_address_id: params.reply_to_address_id,
      },
      options,
    );
  },
});

export const createNotificationApi = (apiConfig: ApiConfig) => ({
  find(params: FindNotificationsParams, options?: RequestOptions): Promise<PaginatedResponse<Notification>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Notification>>(tenantPath(tenant_id, "notifications"), {
      ...options,
      params: query,
    });
  },

  get(params: GetNotificationParams, options?: RequestOptions): Promise<Notification> {
    return apiConfig.httpClient.get<Notification>(tenantRecordPath(params.tenant_id, "notifications", params.id), options);
  },

  create(params: CreateNotificationParams, options?: RequestOptions): Promise<Notification> {
    requireId(params.id, "notification");
    return apiConfig.httpClient.post<Notification>(
      tenantPath(params.tenant_id, "notifications"),
      { id: params.id, type: params.type, status: params.status },
      options,
    );
  },

  update(params: UpdateNotificationParams, options?: RequestOptions): Promise<Notification> {
    return apiConfig.httpClient.put<Notification>(
      tenantRecordPath(params.tenant_id, "notifications", params.id),
      { expected_updated_at: params.expected_updated_at, type: params.type, status: params.status },
      options,
    );
  },

  delete(params: DeleteNotificationParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(tenantRecordPath(params.tenant_id, "notifications", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  sendBookingReminder(params: SendBookingReminderParams, options?: RequestOptions): Promise<ReminderResult> {
    return apiConfig.httpClient.post<ReminderResult>(
      tenantPath(
        params.tenant_id,
        `orders/${segment(params.order_id)}/booking-items/${segment(params.order_booking_item_id)}/reminder`,
      ),
      { notification_id: params.notification_id },
      options,
    );
  },
});

export const createEmailLayoutApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailLayoutsParams, options?: RequestOptions): Promise<PaginatedResponse<EmailLayoutSummary>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailLayoutSummary>>(tenantPath(tenant_id, "email-layouts"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailLayoutParams, options?: RequestOptions): Promise<EmailLayout> {
    return apiConfig.httpClient.get<EmailLayout>(tenantRecordPath(params.tenant_id, "email-layouts", params.id), options);
  },

  create(params: CreateEmailLayoutParams, options?: RequestOptions): Promise<EmailLayout> {
    requireId(params.id, "email layout");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<EmailLayout>(tenantPath(tenant_id, "email-layouts"), body, options);
  },

  update(params: UpdateEmailLayoutParams, options?: RequestOptions): Promise<EmailLayout> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<EmailLayout>(tenantRecordPath(tenant_id, "email-layouts", id), body, options);
  },

  delete(params: DeleteEmailLayoutParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(tenantRecordPath(params.tenant_id, "email-layouts", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createEmailAddressApi = (apiConfig: ApiConfig) => ({
  find(params: FindEmailAddressesParams, options?: RequestOptions): Promise<PaginatedResponse<EmailAddress>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<EmailAddress>>(tenantPath(tenant_id, "email-addresses"), {
      ...options,
      params: query,
    });
  },

  get(params: GetEmailAddressParams, options?: RequestOptions): Promise<EmailAddress> {
    return apiConfig.httpClient.get<EmailAddress>(tenantRecordPath(params.tenant_id, "email-addresses", params.id), options);
  },

  create(params: CreateEmailAddressParams, options?: RequestOptions): Promise<EmailAddress> {
    requireId(params.id, "email address");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<EmailAddress>(tenantPath(tenant_id, "email-addresses"), body, options);
  },

  delete(params: DeleteEmailAddressParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(tenantRecordPath(params.tenant_id, "email-addresses", params.id), options);
  },

  getReadiness(params: GetEmailAddressReadinessParams, options?: RequestOptions): Promise<EmailAddressReadiness> {
    return apiConfig.httpClient.get<EmailAddressReadiness>(
      `${tenantRecordPath(params.tenant_id, "email-addresses", params.id)}/readiness`,
      options,
    );
  },

  getNetworkDomain(params: GetEmailAddressNetworkDomainParams, options?: RequestOptions): Promise<NetworkTenantAddresses> {
    return apiConfig.httpClient.get<NetworkTenantAddresses>(tenantPath(params.tenant_id, "email-addresses/network-domain"), options);
  },
});

export const createTenantResendEventApi = (apiConfig: ApiConfig) => ({
  find(params: FindTenantResendEventsParams, options?: RequestOptions): Promise<PaginatedResponse<TenantResendIncomingWebhook>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<TenantResendIncomingWebhook>>(tenantPath(tenant_id, "incoming-webhooks/resend"), {
      ...options,
      params: query,
    });
  },

  resolve(params: ResolveTenantResendEventParams, options?: RequestOptions): Promise<TenantResendIncomingWebhook> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<TenantResendIncomingWebhook>(
      `${tenantRecordPath(tenant_id, "incoming-webhooks/resend", id)}/resolve`,
      body,
      options,
    );
  },
});
