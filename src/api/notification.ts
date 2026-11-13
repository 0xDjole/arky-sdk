import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { IncomingWebhook } from "../types/payment";
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
  FindEmailAddressesParams,
  FindEmailLayoutsParams,
  FindNotificationsParams,
  FindOutgoingMessagesParams,
  FindOutgoingWebhooksParams,
  FindStoreResendEventsParams,
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
  NetworkStoreAddresses,
  Notification,
  OutgoingMessage,
  OutgoingMessageSummary,
  OutgoingWebhook,
  PreviewTemplateParams,
  ReminderResult,
  ResolveStoreResendEventParams,
  SendBookingReminderParams,
  SendEmailTemplateTestParams,
  Template,
  TemplateDefault,
  TemplatePreview,
  UpdateEmailLayoutParams,
  UpdateNotificationParams,
  UpdateTemplateParams,
} from "../types/notification";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createOutgoingMessageApi = (apiConfig: ApiConfig) => ({
  find(params: FindOutgoingMessagesParams, options?: RequestOptions): Promise<PaginatedResponse<OutgoingMessageSummary>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<OutgoingMessageSummary>>(storePath(store_id, "outgoing-messages"), { ...options, params: query });
  },
  get(params: GetOutgoingMessageParams, options?: RequestOptions): Promise<OutgoingMessage> {
    return apiConfig.httpClient.get<OutgoingMessage>(storeRecordPath(params.store_id, "outgoing-messages", params.id), options);
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

export const createTemplateApi = (apiConfig: ApiConfig) => ({
  find(params: FindTemplatesParams, options?: RequestOptions): Promise<PaginatedResponse<Template>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Template>>(storePath(store_id, "email-templates"), {
      ...options,
      params: query,
    });
  },

  get(params: GetTemplateParams, options?: RequestOptions): Promise<Template> {
    return apiConfig.httpClient.get<Template>(storeRecordPath(params.store_id, "email-templates", params.id), options);
  },

  async findDefaults(params: FindTemplateDefaultsParams, options?: RequestOptions): Promise<PaginatedResponse<TemplateDefault>> {
    const items = await apiConfig.httpClient.get<TemplateDefault[]>(storePath(params.store_id, "email-templates/defaults"), options);
    return { items, cursor: null };
  },

  create(params: CreateTemplateParams, options?: RequestOptions): Promise<Template> {
    requireId(params.id, "template");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Template>(storePath(store_id, "email-templates"), body, options);
  },

  update(params: UpdateTemplateParams, options?: RequestOptions): Promise<Template> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Template>(storeRecordPath(store_id, "email-templates", id), body, options);
  },

  delete(params: DeleteTemplateParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "email-templates", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  preview(params: PreviewTemplateParams, options?: RequestOptions): Promise<TemplatePreview> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<TemplatePreview>(
      `${storeRecordPath(store_id, "email-templates", id)}/preview`,
      body,
      options,
    );
  },

  test(params: SendEmailTemplateTestParams, options?: RequestOptions): Promise<OutgoingMessage> {
    requireId(params.outgoing_message_id, "test email");
    return apiConfig.httpClient.post<OutgoingMessage>(
      `${storeRecordPath(params.store_id, "email-templates", params.id)}/test`,
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
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Notification>>(storePath(store_id, "notifications"), {
      ...options,
      params: query,
    });
  },

  get(params: GetNotificationParams, options?: RequestOptions): Promise<Notification> {
    return apiConfig.httpClient.get<Notification>(storeRecordPath(params.store_id, "notifications", params.id), options);
  },

  create(params: CreateNotificationParams, options?: RequestOptions): Promise<Notification> {
    requireId(params.id, "notification");
    return apiConfig.httpClient.post<Notification>(
      storePath(params.store_id, "notifications"),
      { id: params.id, type: params.type, status: params.status },
      options,
    );
  },

  update(params: UpdateNotificationParams, options?: RequestOptions): Promise<Notification> {
    return apiConfig.httpClient.put<Notification>(
      storeRecordPath(params.store_id, "notifications", params.id),
      { expected_updated_at: params.expected_updated_at, type: params.type, status: params.status },
      options,
    );
  },

  delete(params: DeleteNotificationParams, options?: RequestOptions): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(storeRecordPath(params.store_id, "notifications", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  sendBookingReminder(params: SendBookingReminderParams, options?: RequestOptions): Promise<ReminderResult> {
    return apiConfig.httpClient.post<ReminderResult>(
      storePath(
        params.store_id,
        `orders/${segment(params.order_id)}/booking-items/${segment(params.order_booking_item_id)}/reminder`,
      ),
      { notification_id: params.notification_id },
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

  getNetworkDomain(params: GetEmailAddressNetworkDomainParams, options?: RequestOptions): Promise<NetworkStoreAddresses> {
    return apiConfig.httpClient.get<NetworkStoreAddresses>(storePath(params.store_id, "email-addresses/network-domain"), options);
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
