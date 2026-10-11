import { createAdmin } from '../../dist/index.js';
import type {
  AlertRecipient,
  ChangeEmailAddressStatusParams,
  CreateEmailAddressParams,
  CreateEmailTemplateParams,
  EmailAddress,
  EmailAddressReceiving,
  EmailAddressReceivingInput,
  EmailAddressSending,
  EmailAddressStatus,
  EmailContent,
  EmailTemplate,
  EmailTemplatePreview,
  EmailTemplateType,
  EmailTemplateTypeName,
  EmailType,
  EmailTypeName,
  FindEmailTemplatesParams,
  Notification,
  PreviewEmailTemplateParams,
  SendEmailTemplateTestParams,
  UpdateEmailAddressParams,
  UpdateEmailTemplateParams,
} from '../../dist/index.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Notifications = ReturnType<typeof createAdmin>['notification'];

const store_id = '5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06';
const content: Record<string, EmailContent> = { en: { subject: 'Welcome', preheader: null, body: '<p>Welcome</p>' } };
const create: CreateEmailTemplateParams = {
  store_id,
  id: '3a5c7e9b-1d2f-4a6c-8e0b-2d4f6a8c0e1f',
  type: { type: 'transactional', sending_address_id: 'address', email_type: { type: 'form_received', forms: { form_ids: ['form'] } } },
  content,
};
const reply: CreateEmailTemplateParams = { store_id, id: '9b1d3f5a-7c8e-4a2b-9d4f-6e8a0c2e4b6d', type: { type: 'support_reply' }, content };
const api = createAdmin({ baseUrl: 'https://templates.test' }).notification.template;
const page: Promise<{ items: EmailTemplate[]; cursor: string | null }> = api.find({ store_id, type: 'transactional', email_type: 'form_received', limit: 1, cursor: null });
const previewed: Promise<EmailTemplatePreview> = api.preview({ store_id, id: 'template', language: 'bs', content: content.en });
const tested: Promise<Notification> = api.test({ store_id, id: 'template', notification_id: '0f6a2c41-8d35-4b97-a1e2-5c7d9b3f6e08', language: 'bs', sending_address_id: 'address' });
const alert: EmailType = { type: 'new_order_alert', to: [{ type: 'email', email: 'owner@example.test', language: 'bs' }] };
const address: CreateEmailAddressParams = {
  store_id,
  id: '4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a',
  email: 'help@mail.example.test',
  sending: { email_domain_id: 'domain', from_name: 'Shop', reply_to: 'help@mail.example.test' },
  receiving: { initial_sending_address_id: null, initial_flow_id: null },
};
void [create, reply, page, previewed, tested, alert, address];

export type EmailTemplateContracts = [
  Assert<Equal<keyof EmailTemplate, 'id' | 'store_id' | 'type' | 'content' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailTemplate['type'], EmailTemplateType>>,
  Assert<Equal<EmailTemplateType, { type: 'transactional'; sending_address_id: string; email_type: EmailType } | { type: 'support_reply' }>>,
  Assert<Equal<EmailTemplateTypeName, 'transactional' | 'support_reply'>>,
  Assert<Equal<EmailTemplate['content'], Record<string, EmailContent>>>,
  Assert<Equal<keyof EmailContent, 'subject' | 'preheader' | 'body'>>,
  Assert<Equal<keyof FindEmailTemplatesParams, 'store_id' | 'type' | 'email_type' | 'limit' | 'cursor'>>,
  Assert<Equal<FindEmailTemplatesParams['type'], EmailTemplateTypeName | undefined>>,
  Assert<Equal<FindEmailTemplatesParams['email_type'], EmailTypeName | undefined>>,
  Assert<RequiredField<CreateEmailTemplateParams, 'id'>>,
  Assert<RequiredField<CreateEmailTemplateParams, 'type'>>,
  Assert<Missing<CreateEmailTemplateParams, 'sender_id'>>,
  Assert<Missing<UpdateEmailTemplateParams, 'sender_id'>>,
  Assert<RequiredField<UpdateEmailTemplateParams, 'expected_updated_at'>>,
  Assert<RequiredField<PreviewEmailTemplateParams, 'language'>>,
  Assert<Equal<keyof SendEmailTemplateTestParams, 'store_id' | 'id' | 'notification_id' | 'language' | 'sending_address_id'>>,
  Assert<Equal<SendEmailTemplateTestParams['sending_address_id'], string | undefined>>,
  Assert<Missing<EmailTemplate, 'status'>>,
  Assert<Missing<EmailTemplate, 'key'>>,
  Assert<Missing<EmailTemplate, 'sender_id'>>,
  Assert<Missing<SendEmailTemplateTestParams, 'sender'>>,
  Assert<Equal<AlertRecipient['type'], 'store_role' | 'email'>>,
  Assert<Equal<Extract<EmailType, { type: 'cart_reminder' }>['after_days'], number>>,
  Assert<Equal<Extract<EmailType, { type: 'form_received' }>['forms'], { form_ids: string[] }>>,
  Assert<Equal<Extract<EmailTypeName, 'subscription_payment_failed' | 'renewal_payment_failed' | 'email_changed'>, 'renewal_payment_failed' | 'email_changed'>>,
  Assert<Equal<keyof EmailAddress, 'id' | 'store_id' | 'email' | 'sending' | 'receiving' | 'status' | 'created_at' | 'updated_at'>>,
  Assert<Equal<EmailAddress['sending'], EmailAddressSending | null>>,
  Assert<Equal<EmailAddress['receiving'], EmailAddressReceiving | null>>,
  Assert<Equal<EmailAddressStatus, 'active' | 'archived'>>,
  Assert<Equal<keyof EmailAddressSending, 'email_domain_id' | 'from_name' | 'reply_to'>>,
  Assert<Equal<keyof EmailAddressReceiving, 'forwarding_email' | 'initial_sending_address_id' | 'initial_flow_id'>>,
  Assert<Equal<keyof EmailAddressReceivingInput, 'initial_sending_address_id' | 'initial_flow_id'>>,
  Assert<Equal<keyof CreateEmailAddressParams, 'store_id' | 'id' | 'email' | 'sending' | 'receiving'>>,
  Assert<Equal<CreateEmailAddressParams['receiving'], EmailAddressReceivingInput | undefined>>,
  Assert<RequiredField<UpdateEmailAddressParams, 'expected_updated_at'>>,
  Assert<Missing<UpdateEmailAddressParams, 'email'>>,
  Assert<Equal<keyof ChangeEmailAddressStatusParams, 'store_id' | 'id' | 'expected_updated_at'>>,
  Assert<Equal<keyof Notifications['emailAddress'], 'find' | 'get' | 'create' | 'update' | 'archive' | 'activate' | 'delete'>>,
  Assert<Equal<Awaited<ReturnType<Notifications['emailAddress']['create']>>, EmailAddress>>,
  Assert<Missing<Notifications, 'emailSender'>>,
  Assert<Missing<Notifications, 'stop'>>,
];
