import { createAdmin } from '../../dist/index.js';
import type { AlertRecipient, ConnectEmailProviderParams, CreateEmailAddressParams, CreateEmailLayoutParams, CreateEmailTemplateParams, Email, EmailAddress, EmailAddressReadiness, EmailCapabilityReadiness, EmailContent, EmailCreationTemplates, EmailLayout, EmailLayoutContent, EmailPreview, EmailPreviewSummary, EmailProvider, EmailProviderDnsRecord, EmailProviderDomain, EmailProviderDomainStatus, EmailReplyTo, EmailTemplate, EmailTemplateDefault, EmailTemplateType, EmailTemplateTypeName, EpochMilliseconds, FindEmailTemplatesParams, IncomingWebhook, OutgoingEmail, OutgoingEmailSummary, PaginatedResponse, ReplaceEmailProviderKeyParams, SendEmailTemplateTestParams, StoreEmailSettings, UpdateEmailLayoutParams, UpdateEmailTemplateParams } from '../../dist/index.js';
type Assert<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type OptionalField<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
const store_id = '5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06';
const layout_id = '7c9e1b3d-5f2a-4c8e-a0b2-4d6f8a0c2e4b';
const content = { en: { subject: 'Welcome', preheader: null, html: '<p>Welcome {{code}}</p>', text: 'Welcome {{code}}' } };
const create: CreateEmailTemplateParams = { store_id, id: '3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f', key: 'sign-in', name: 'Sign-in code', default_language: 'en', layout_id, type: { type: 'customer_sign_in' }, content };
const reply_to: EmailReplyTo = { type: 'address', email_address_id: '8e0a2c4e-6b7d-4f9a-b1c3-5d7f9b1d3f5a' };
const client = createAdmin({ apiUrl: 'https://templates.test' });
const tested: Promise<OutgoingEmail> = client.notification.template.test({ store_id, id: create.id, outgoing_email_id: create.id, language: 'en', sending_address_id: '4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a', from_name: 'Shop', reply_to });
const selection: Email = { email_template_id: create.id, sending_address_id: '4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a', from_name: 'Shop', reply_to: { type: 'external', email: 'help@example.test' } };
const recipients: AlertRecipient[] = [{ type: 'email', email: 'owner@example.test', language: 'en' }, { type: 'store_role', store_role_id: '5b7e2c94-1d38-4f60-a9e5-3c8d0f2b6a17', language: 'bs' }];
const layout: CreateEmailLayoutParams = { store_id, id: layout_id, key: 'plain', name: 'Plain', content: { en: { html: '{{{body}}}', text: '{{body}}' } } };
const connection: ConnectEmailProviderParams = { store_id, id: '6d8f0a2c-4e5b-4d9f-b1e3-5a7c9e1b3d4f', name: 'Main Resend', api_key: 're_key' };
const address: CreateEmailAddressParams = { store_id, id: '4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a', email: 'orders@example.test', email_provider_id: connection.id };
const sent: Promise<PaginatedResponse<OutgoingEmailSummary>> = client.notification.outgoingEmail.find({ store_id, type: 'store_admin_sign_in' });
const ready: Promise<EmailAddressReadiness> = client.notification.emailAddress.getReadiness({ store_id, id: address.id });
const inbox: Promise<PaginatedResponse<IncomingWebhook>> = client.notification.resendEvent.find({ store_id, email_provider_id: connection.id, status: 'review' });
const layouts: Promise<PaginatedResponse<EmailLayout>> = client.notification.layout.find({ store_id, limit: 20 });
void [create, tested, selection, recipients, layout, connection, address, sent, ready, inbox, layouts];
export type EmailTemplateContracts = [
  Assert<Equal<keyof EmailTemplate, 'id' | 'store_id' | 'key' | 'name' | 'default_language' | 'layout_id' | 'type' | 'content' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailTemplate['type'], EmailTemplateType>>,
  Assert<Equal<EmailTemplateTypeName,
    | 'customer_sign_in' | 'store_admin_sign_in' | 'customer_email_verification' | 'email_changed' | 'order_received' | 'first_order_placed'
    | 'order_dispatched' | 'order_delivered' | 'order_ready_for_pickup' | 'order_cancelled' | 'order_refunded' | 'booking_confirmed'
    | 'booking_reminder' | 'booking_cancelled' | 'offer_sent' | 'offer_revised' | 'offer_reminder' | 'company_invite' | 'company_access_notice'
    | 'store_admin_invite' | 'return_requested' | 'return_approved' | 'return_declined' | 'renewal_upcoming' | 'renewal_payment_failed'
    | 'membership_cancelled' | 'form_received' | 'form_stage_changed' | 'new_form_submission_alert' | 'new_order_alert' | 'new_return_alert'
    | 'support_message' | 'broadcast'>>,
  Assert<Equal<EmailTemplate['content'], Record<string, EmailContent>>>,
  Assert<Equal<keyof EmailContent, 'subject' | 'preheader' | 'html' | 'text'>>,
  Assert<Equal<keyof EmailTemplateDefault, 'key' | 'name' | 'type' | 'content' | 'allowed_fields'>>,
  Assert<Equal<EmailTemplateDefault['allowed_fields'], string[]>>,
  Assert<Missing<UpdateEmailTemplateParams, 'type'>>,
  Assert<OptionalField<UpdateEmailTemplateParams, 'layout_id'>>,
  Assert<Missing<FindEmailTemplatesParams, 'email_type'>>,
  Assert<Equal<NonNullable<FindEmailTemplatesParams['type']>, EmailTemplateTypeName>>,
  Assert<RequiredField<SendEmailTemplateTestParams, 'sending_address_id'>>,
  Assert<RequiredField<SendEmailTemplateTestParams, 'from_name'>>,
  Assert<Equal<SendEmailTemplateTestParams['reply_to'], EmailReplyTo>>,
  Assert<Equal<keyof Email, 'email_template_id' | 'sending_address_id' | 'from_name' | 'reply_to'>>,
  Assert<Equal<EmailReplyTo, { type: 'address'; email_address_id: string } | { type: 'external'; email: string }>>,
  Assert<Equal<AlertRecipient, { type: 'store_role'; store_role_id: string; language: string } | { type: 'email'; email: string; language: string }>>,
  Assert<Equal<StoreEmailSettings['customer_sign_in'], Email | null>>,
  Assert<Equal<StoreEmailSettings['new_order_alert'], Email | null>>,
  Assert<Equal<StoreEmailSettings['new_order_alert_recipients'], AlertRecipient[]>>,
  Assert<Equal<StoreEmailSettings['creation_templates'], EmailCreationTemplates>>,
  Assert<Equal<keyof EmailCreationTemplates, 'form_received' | 'form_stage_changed' | 'new_form_submission_alert' | 'support_message' | 'broadcast'>>,
  Assert<Missing<StoreEmailSettings, 'staff_new_order' | 'staff_new_return' | 'sign_in_code' | 'sending_address_id'>>,
  Assert<Equal<keyof EmailLayout, 'id' | 'store_id' | 'key' | 'name' | 'logo_media_id' | 'content' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailLayout['content'], Record<string, EmailLayoutContent>>>,
  Assert<OptionalField<CreateEmailLayoutParams, 'logo_media_id'>>,
  Assert<RequiredField<UpdateEmailLayoutParams, 'logo_media_id'>>,
  Assert<Equal<keyof EmailProvider, 'id' | 'store_id' | 'name' | 'type' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailProviderDomainStatus, 'not_started' | 'pending' | 'verified' | 'partially_verified' | 'partially_failed' | 'failed' | 'temporary_failure'>>,
  Assert<Equal<EmailProviderDomain['status'], EmailProviderDomainStatus>>,
  Assert<Equal<EmailProviderDomain['records'], EmailProviderDnsRecord[]>>,
  Assert<Equal<keyof EmailProviderDnsRecord, 'record' | 'status' | 'type' | 'name' | 'value' | 'priority'>>,
  Assert<Equal<ReplaceEmailProviderKeyParams, { store_id: string; id: string; expected_updated_at: EpochMilliseconds; api_key: string }>>,
  Assert<Equal<Parameters<typeof client.notification.emailProvider.replaceKey>[0], ReplaceEmailProviderKeyParams>>,
  Assert<Equal<Awaited<ReturnType<typeof client.notification.emailProvider.replaceKey>>, EmailProvider>>,
  Assert<Equal<Awaited<ReturnType<typeof client.notification.emailProvider.find>>, PaginatedResponse<EmailProvider>>>,
  Assert<Equal<keyof EmailAddress, 'id' | 'store_id' | 'email_provider_id' | 'email'>>,
  Assert<Equal<EmailCapabilityReadiness, { type: 'ready' } | { type: 'unavailable'; reason: string } | { type: 'check_failed'; reason: string }>>,
  Assert<Equal<Awaited<ReturnType<typeof client.notification.outgoingEmail.get>>, OutgoingEmail>>,
  Assert<Equal<OutgoingEmail['preview'], EmailPreview | null>>,
  Assert<Equal<OutgoingEmailSummary['preview'], EmailPreviewSummary | null>>,
  Assert<Missing<EmailPreviewSummary, 'html' | 'text'>>,
  Assert<Equal<OutgoingEmail['to'], string | null>>,
];
