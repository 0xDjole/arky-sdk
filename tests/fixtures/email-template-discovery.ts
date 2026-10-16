import { createAdmin } from '../../dist/index.js';
import type { EmailTemplate, EmailTemplateType, EmailTemplateTypeName, EmailTemplateDefault, EmailContent, EmailAddressSending, CreateEmailTemplateParams, UpdateEmailTemplateParams, FindEmailTemplatesParams, SendEmailTemplateTestParams, OutgoingEmail, StoreEmailSettings, AlertEmail, EmailProvider, EmailProviderDomain, EmailProviderDomainStatus, ReplaceEmailProviderKeyParams, EpochMilliseconds } from '../../dist/index.js';
type Assert<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
const store_id = '5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06';
const content = { en: { subject: 'Welcome', preheader: null, body: '<p>Welcome</p>' } };
const create: CreateEmailTemplateParams = { store_id, id: '3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f', key: 'sign-in', type: { type: 'sign_in_code' }, content };
const client = createAdmin({ baseUrl: 'https://templates.test' });
const tested: Promise<OutgoingEmail> = client.notification.template.test({ store_id, id: create.id, outgoing_email_id: create.id, language: 'en', sending_address_id: 'sender' });
const alert: AlertEmail = { email_template_id: create.id, to: [{ type: 'email', email: 'owner@example.test', language: 'en' }] };
void [create, tested, alert];
export type EmailTemplateContracts = [
  Assert<Equal<keyof EmailTemplate, 'id' | 'store_id' | 'key' | 'type' | 'content' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailTemplate['type'], EmailTemplateType>>,
  Assert<Equal<EmailTemplateTypeName, 'sign_in_code' | 'email_change' | 'fulfillment' | 'order' | 'booking' | 'offer' | 'form' | 'company_invite' | 'return' | 'renewal' | 'membership_cancellation' | 'support_reply'>>,
  Assert<Equal<EmailTemplate['content'], Record<string, EmailContent>>>,
  Assert<Equal<keyof EmailTemplateDefault, 'key' | 'type' | 'content'>>,
  Assert<Missing<UpdateEmailTemplateParams, 'type'>>,
  Assert<Missing<FindEmailTemplatesParams, 'email_type'>>,
  Assert<Missing<SendEmailTemplateTestParams, 'notification_id'>>,
  Assert<Equal<keyof EmailAddressSending, 'from_name' | 'reply_to'>>,
  Assert<Equal<StoreEmailSettings['sign_in_code'], { email_template_id: string } | null>>,
  Assert<Equal<EmailProviderDomainStatus, 'not_started' | 'pending' | 'verified' | 'partially_verified' | 'partially_failed' | 'failed' | 'temporary_failure'>>,
  Assert<Equal<EmailProviderDomain['status'], EmailProviderDomainStatus>>,
  Assert<Equal<ReplaceEmailProviderKeyParams, { store_id: string; expected_updated_at: EpochMilliseconds; api_key: string }>>,
  Assert<Equal<Parameters<typeof client.notification.emailProvider.replaceKey>[0], ReplaceEmailProviderKeyParams>>,
  Assert<Equal<Awaited<ReturnType<typeof client.notification.emailProvider.replaceKey>>, EmailProvider>>
];
