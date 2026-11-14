import { createAdmin } from '../../dist/index.js';
import type { AlertRecipient, CheckResendSetupParams, ConnectResendStoreProviderParams, CreateEmailAddressParams, CreateEmailLayoutParams, CreateTemplateParams, Email, EmailAddress, EmailAddressReadiness, EmailCapabilityReadiness, EmailReadinessReason, EmailContent, EmailLayout, EmailLayoutContent, EmailPreview, EmailPreviewSummary, EmailTemplateTypeName, EpochMilliseconds, FindOutgoingMessagesParams, FindTemplatesParams, IncomingWebhook, Notification, NotificationType, OutgoingMessage, OutgoingMessageSummary, PaginatedResponse, ProviderLogin, ProviderLoginInput, ReplaceResendKeyParams, ResendDnsRecord, ResendDomain, ResendDomainStatus, ResendSetup, ResendSetupProblem, SendEmailTemplateTestParams, SmsTemplateTypeName, StoreProvider, Template, TemplateDefault, TemplateType, UpdateEmailLayoutParams, UpdateTemplateParams } from '../../dist/index.js';
type Assert<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type OptionalField<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type EmailTemplateType = Extract<TemplateType, { type: 'email' }>;
type SmsTemplateType = Extract<TemplateType, { type: 'sms' }>;
const store_id = '5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06';
const layout_id = '7c9e1b3d-5f2a-4c8e-a0b2-4d6f8a0c2e4b';
const address_id = '4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a';
const content = { en: { subject: 'Welcome', preheader: null, html: '<p>Welcome {{code}}</p>', text: 'Welcome {{code}}' } };
const create: CreateTemplateParams = { store_id, id: '3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f', key: 'sign-in', name: 'Sign-in code', type: { type: 'email', purpose: { type: 'customer_sign_in' }, default_language: 'en', content, layout_id } };
const sms: CreateTemplateParams = { store_id, id: '9b1d3f5a-7c2e-4a8b-b0d2-6f8a0c2e4b6d', key: 'reminder-sms', name: 'Reminder', type: { type: 'sms', purpose: { type: 'booking_reminder' }, content: { en: 'See you at {{time}}' } } };
const client = createAdmin({ apiUrl: 'https://templates.test' });
const tested: Promise<OutgoingMessage> = client.notification.template.test({ store_id, id: create.id, outgoing_message_id: create.id, language: 'en', email_address_id: address_id, from_name: 'Shop', reply_to_address_id: address_id });
const selection: Email = { email_template_id: create.id, email_address_id: address_id, from_name: 'Shop', reply_to_address_id: address_id };
const recipients: AlertRecipient[] = [{ type: 'email', email: 'owner@example.test', language: 'en' }, { type: 'store_role', store_role_id: '5b7e2c94-1d38-4f60-a9e5-3c8d0f2b6a17', language: 'bs' }];
const alert: NotificationType = { type: 'order_alert', email: selection, recipients };
const layout: CreateEmailLayoutParams = { store_id, id: layout_id, key: 'plain', name: 'Plain', content: { en: { html: '{{{body}}}', text: '{{body}}' } } };
const connection: ConnectResendStoreProviderParams = { store_id, id: '6d8f0a2c-4e5b-4d9f-b1e3-5a7c9e1b3d4f', api_key: 're_key', webhook_secret: 'whsec_secret' };
const setup: Promise<ResendSetup> = client.store.provider.checkResendSetup({ store_id, id: connection.id });
const receiptResends: Promise<PaginatedResponse<OutgoingMessageSummary>> = client.notification.outgoingMessage.find({ store_id, type: 'receipt_resend_email', order_id: '4a2c7c0d-4389-4aae-b3d7-02ff834a024d' });
const address: CreateEmailAddressParams = { store_id, id: address_id, email: 'orders@example.test', login: { type: 'store', store_provider_id: connection.id } };
const networkAddress: CreateEmailAddressParams = { store_id, id: '1c3e5a7b-9d2f-4b6c-8e0a-2c4e6a8b0d1f', email: 'orders@shops.example.test', login: { type: 'network' } };
const sent: Promise<PaginatedResponse<OutgoingMessageSummary>> = client.notification.outgoingMessage.find({ store_id, type: 'store_admin_sign_in_email' });
const ready: Promise<EmailAddressReadiness> = client.notification.emailAddress.getReadiness({ store_id, id: address.id });
const inbox: Promise<PaginatedResponse<IncomingWebhook>> = client.notification.resendEvent.find({ store_id, store_provider_id: connection.id, status: 'review' });
const layouts: Promise<PaginatedResponse<EmailLayout>> = client.notification.layout.find({ store_id, limit: 20 });
const notifications: Promise<PaginatedResponse<Notification>> = client.notification.notification.find({ store_id, type: 'order_alert' });
void [create, sms, tested, selection, recipients, alert, layout, connection, setup, receiptResends, address, networkAddress, sent, ready, inbox, layouts, notifications];
export type EmailTemplateContracts = [
  Assert<Equal<keyof Template, 'id' | 'store_id' | 'key' | 'name' | 'type' | 'created_at' | 'updated_at'>>,
  Assert<Equal<Template['type'], TemplateType>>,
  Assert<Equal<TemplateType['type'], 'email' | 'sms'>>,
  Assert<Equal<keyof EmailTemplateType, 'type' | 'purpose' | 'default_language' | 'content' | 'layout_id'>>,
  Assert<Equal<EmailTemplateType['purpose']['type'], EmailTemplateTypeName>>,
  Assert<Equal<SmsTemplateType['purpose']['type'], SmsTemplateTypeName>>,
  Assert<Equal<SmsTemplateType['content'], Record<string, string>>>,
  Assert<Equal<EmailTemplateTypeName,
    | 'customer_sign_in' | 'customer_invite' | 'store_admin_sign_in' | 'customer_email_verification' | 'email_changed' | 'order_received' | 'first_order_placed'
    | 'order_dispatched' | 'order_delivered' | 'order_ready_for_pickup' | 'order_cancelled' | 'order_refunded' | 'booking_confirmed'
    | 'booking_reminder' | 'booking_cancelled' | 'booking_recall' | 'offer_sent' | 'offer_revised' | 'offer_reminder' | 'company_invite' | 'company_access_notice'
    | 'store_admin_invite' | 'return_requested' | 'return_approved' | 'return_declined' | 'renewal_upcoming' | 'renewal_payment_failed'
    | 'membership_cancelled' | 'form_received' | 'form_stage_changed' | 'form_submission_alert' | 'order_alert' | 'return_alert'
    | 'conversation_message_alert' | 'conversation_message_notice' | 'support_message' | 'broadcast'
    | 'after_visit' | 'result_shared' | 'booking_cancelled_alert' | 'booking_moved_alert' | 'entry_added_alert' | 'daily_overview_alert'>>,
  Assert<Equal<SmsTemplateTypeName, 'customer_sign_in' | 'customer_invite' | 'booking_confirmed' | 'booking_reminder' | 'booking_cancelled' | 'booking_recall' | 'conversation_message_notice' | 'broadcast' | 'after_visit' | 'result_shared'>>,
  Assert<Equal<EmailTemplateType['content'], Record<string, EmailContent>>>,
  Assert<Equal<keyof EmailContent, 'subject' | 'preheader' | 'html' | 'text'>>,
  Assert<Equal<keyof TemplateDefault, 'key' | 'name' | 'type' | 'allowed_fields' | 'list_fields'>>,
  Assert<Equal<TemplateDefault['allowed_fields'], string[]>>,
  Assert<Equal<TemplateDefault['list_fields'], string[]>>,
  Assert<Missing<UpdateTemplateParams, 'type'>>,
  Assert<OptionalField<UpdateTemplateParams, 'content'>>,
  Assert<Missing<FindTemplatesParams, 'email_type' | 'type'>>,
  Assert<{ store_id: string; kind: 'sms'; purpose: 'booking_reminder' } extends FindTemplatesParams ? true : false>,
  Assert<{ store_id: string; kind: 'sms'; purpose: 'order_alert' } extends FindTemplatesParams ? false : true>,
  Assert<{ store_id: string; purpose: 'order_alert' } extends FindTemplatesParams ? false : true>,
  Assert<RequiredField<SendEmailTemplateTestParams, 'email_address_id'>>,
  Assert<RequiredField<SendEmailTemplateTestParams, 'from_name'>>,
  Assert<Equal<SendEmailTemplateTestParams['reply_to_address_id'], string>>,
  Assert<Equal<keyof Email, 'email_template_id' | 'email_address_id' | 'from_name' | 'reply_to_address_id'>>,
  Assert<Equal<AlertRecipient, { type: 'store_role'; store_role_id: string; language: string } | { type: 'email'; email: string; language: string }>>,
  Assert<Equal<Extract<NotificationType, { type: 'order_alert' }>, { type: 'order_alert'; email: Email; recipients: AlertRecipient[] }>>,
  Assert<Equal<Extract<NotificationType, { type: 'customer_sign_in' }>, { type: 'customer_sign_in'; email: Email }>>,
  Assert<Equal<Extract<NotificationType, { type: 'customer_sign_in_sms' }>, { type: 'customer_sign_in_sms'; sms_template_id: string }>>,
  Assert<Equal<Extract<NotificationType, { type: 'customer_invite_email' }>, { type: 'customer_invite_email'; email: Email }>>,
  Assert<Equal<Extract<NotificationType, { type: 'customer_invite_sms' }>, { type: 'customer_invite_sms'; sms_template_id: string }>>,
  Assert<Equal<Extract<NotificationType, { type: 'conversation_message_alert' }>['recipients'], AlertRecipient[]>>,
  Assert<Equal<Extract<NotificationType, { type: 'booking_confirmed_sms' }>, { type: 'booking_confirmed_sms'; sms_template_id: string }>>,
  Assert<Missing<Notification, 'creation_templates' | 'staff_new_order' | 'sign_in_code' | 'sending_address_id'>>,
  Assert<Equal<keyof EmailLayout, 'id' | 'store_id' | 'key' | 'name' | 'logo_media_id' | 'content' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailLayout['content'], Record<string, EmailLayoutContent>>>,
  Assert<OptionalField<CreateEmailLayoutParams, 'logo_media_id'>>,
  Assert<RequiredField<UpdateEmailLayoutParams, 'logo_media_id'>>,
  Assert<Equal<keyof StoreProvider, 'id' | 'store_id' | 'type' | 'status' | 'created_at' | 'updated_at'>>,
  Assert<Equal<ResendDomainStatus, 'not_started' | 'pending' | 'verified' | 'partially_verified' | 'partially_failed' | 'failed' | 'temporary_failure' | 'unknown'>>,
  Assert<Equal<ResendDomain['status'], ResendDomainStatus>>,
  Assert<Equal<ResendDomain['records'], ResendDnsRecord[]>>,
  Assert<Equal<keyof ResendDnsRecord, 'record' | 'status' | 'type' | 'name' | 'value' | 'priority'>>,
  Assert<Equal<ReplaceResendKeyParams, { store_id: string; id: string; expected_updated_at: EpochMilliseconds; api_key: string; webhook_secret: string }>>,
  Assert<Equal<ConnectResendStoreProviderParams, { store_id: string; id: string; api_key: string; webhook_secret: string }>>,
  Assert<Equal<Parameters<typeof client.store.provider.checkResendSetup>[0], CheckResendSetupParams>>,
  Assert<Equal<CheckResendSetupParams, { store_id: string; id: string }>>,
  Assert<Equal<Awaited<ReturnType<typeof client.store.provider.checkResendSetup>>, ResendSetup>>,
  Assert<Equal<ResendSetup, { webhook_address: string; events: string[]; webhook_id: string | null; problems: ResendSetupProblem[] }>>,
  Assert<Equal<ResendSetupProblem['type'], 'webhook_missing' | 'webhook_duplicated' | 'webhook_secret_mismatch' | 'webhook_disabled' | 'webhook_events_missing'>>,
  Assert<Equal<Extract<ResendSetupProblem, { type: 'webhook_duplicated' }>, { type: 'webhook_duplicated'; webhook_ids: string[] }>>,
  Assert<Equal<Extract<ResendSetupProblem, { type: 'webhook_events_missing' }>, { type: 'webhook_events_missing'; events: string[] }>>,
  Assert<Equal<Extract<FindOutgoingMessagesParams, { order_id: string }>['type'], 'receipt_resend_email'>>,
  Assert<{ store_id: string; order_id: string } extends FindOutgoingMessagesParams ? false : true>,
  Assert<{ store_id: string; type: 'event_email'; order_id: string } extends FindOutgoingMessagesParams ? false : true>,
  Assert<{ store_id: string; type: 'receipt_resend_email'; order_id: string } extends FindOutgoingMessagesParams ? true : false>,
  Assert<{ store_id: string; type: 'event_email' } extends FindOutgoingMessagesParams ? true : false>,
  Assert<Equal<Parameters<typeof client.store.provider.replaceResendKey>[0], ReplaceResendKeyParams>>,
  Assert<Equal<Awaited<ReturnType<typeof client.store.provider.replaceResendKey>>, StoreProvider>>,
  Assert<Equal<Awaited<ReturnType<typeof client.store.provider.find>>, PaginatedResponse<StoreProvider>>>,
  Assert<Missing<typeof client.notification, 'emailProvider' | 'outgoingEmail'>>,
  Assert<Equal<keyof EmailAddress, 'id' | 'store_id' | 'login' | 'email'>>,
  Assert<Equal<EmailAddress['login'], ProviderLogin>>,
  Assert<Equal<CreateEmailAddressParams['login'], ProviderLoginInput>>,
  Assert<Equal<ProviderLoginInput, { type: 'store'; store_provider_id: string } | { type: 'network' }>>,
  Assert<Equal<EmailCapabilityReadiness, { type: 'ready' } | { type: 'unavailable'; reason: EmailReadinessReason } | { type: 'check_failed'; reason: EmailReadinessReason }>>,
  Assert<Equal<EmailReadinessReason, 'domain_absent' | 'sending_disabled' | 'sending_unverified' | 'receiving_disabled' | 'receiving_unverified' | 'webhook_missing' | 'webhook_duplicated' | 'webhook_disabled' | 'webhook_events_missing' | 'webhook_secret_mismatch' | 'webhook_changed' | 'provider_refused' | 'daily_quota_used_up' | 'monthly_quota_used_up' | 'rate_limited' | 'no_answer' | 'request_not_built'>>,
  Assert<Equal<Awaited<ReturnType<typeof client.notification.outgoingMessage.get>>, OutgoingMessage>>,
  Assert<Equal<OutgoingMessage['preview'], EmailPreview | null>>,
  Assert<Equal<OutgoingMessageSummary['preview'], EmailPreviewSummary | null>>,
  Assert<Missing<EmailPreviewSummary, 'html' | 'text'>>,
  Assert<Equal<OutgoingMessage['to'], string | null>>,
];
