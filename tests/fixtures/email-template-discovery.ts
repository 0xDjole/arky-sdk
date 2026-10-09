import { createAdmin } from '../../dist/index.js';
import type { CreateEmailTemplateParams, EmailContent, EmailTemplate, EmailTemplatePreview, EmailType, FindEmailTemplatesParams, Notification, PreviewEmailTemplateParams, SendEmailTemplateTestParams, UpdateEmailTemplateParams, AlertRecipient } from '../../dist/index.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

const store_id = '5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06';
const content: Record<string, EmailContent> = { en: { subject: 'Welcome', preheader: null, body: '<p>Welcome</p>' } };
const create: CreateEmailTemplateParams = { store_id, id: '3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f', type: { type: 'form_received', forms: { type: 'all' } }, sender_id: 'sender', content };
const api = createAdmin({ baseUrl: 'https://templates.test' }).notification.template;
const page: Promise<{ items: EmailTemplate[]; cursor: string | null }> = api.find({ store_id, type: 'form_received', limit: 1, cursor: null });
const previewed: Promise<EmailTemplatePreview> = api.preview({ store_id, id: 'template', language: 'bs', content: content.en });
const tested: Promise<Notification> = api.test({ store_id, id: 'template', notification_id: '0f6a2c41-8d35-4b97-a1e2-5c7d9b3f6e08', language: 'bs' });
const alert: EmailType = { type: 'new_order_alert', to: [{ type: 'email', email: 'owner@example.test', language: 'bs' }] };
void [create, page, previewed, tested, alert];

export type EmailTemplateContracts = [
  Assert<Equal<keyof EmailTemplate, 'id' | 'store_id' | 'type' | 'sender_id' | 'content' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailTemplate['content'], Record<string, EmailContent>>>,
  Assert<Equal<keyof EmailContent, 'subject' | 'preheader' | 'body'>>,
  Assert<Equal<keyof FindEmailTemplatesParams, 'store_id' | 'type' | 'limit' | 'cursor'>>,
  Assert<RequiredField<CreateEmailTemplateParams, 'id'>>,
  Assert<RequiredField<CreateEmailTemplateParams, 'sender_id'>>,
  Assert<RequiredField<UpdateEmailTemplateParams, 'expected_updated_at'>>,
  Assert<RequiredField<PreviewEmailTemplateParams, 'language'>>,
  Assert<Equal<keyof SendEmailTemplateTestParams, 'store_id' | 'id' | 'notification_id' | 'language'>>,
  Assert<Missing<EmailTemplate, 'status'>>,
  Assert<Missing<EmailTemplate, 'key'>>,
  Assert<Missing<SendEmailTemplateTestParams, 'sender'>>,
  Assert<Equal<AlertRecipient['type'], 'store_role' | 'email'>>,
  Assert<Equal<Extract<EmailType, { type: 'cart_reminder' }>['after_days'], number>>,
];
