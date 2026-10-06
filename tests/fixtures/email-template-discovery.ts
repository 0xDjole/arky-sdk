import { createAdmin, epochMilliseconds } from '../../dist/index.js';
import type { EmailTemplate, EmailTemplateStatus, EmailTemplateData, EmailTemplateContent, GetEmailTemplatesParams, CreateEmailTemplateParams, UpdateEmailTemplateParams, PreviewEmailTemplateParams, PreviewEmailTemplateResponse, SendEmailTemplateTestParams, MessageDelivery } from '../../dist/index.js';

const store_id = '5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06';
const filters: GetEmailTemplatesParams = {
  store_id, key: 'welcome', query: 'welcome', status: 'draft', data_type: 'form_submission', form_id: 'form', limit: 1, cursor: null,
  sort_field: 'key', sort_direction: 'asc', created_at_from: epochMilliseconds(0),
};
const status: EmailTemplateStatus = { type: 'archived' };
const content: Record<string, EmailTemplateContent> = { en: { subject: 'Welcome', preheader: null, body: '<p>Welcome</p>' } };
const data: EmailTemplateData = { type: 'form_submission', form_id: 'form' };
const create: CreateEmailTemplateParams = { store_id, key: 'form-received', data, content };
const update: UpdateEmailTemplateParams = { store_id, id: 'template', status, content };
const preview: PreviewEmailTemplateParams = { store_id, id: 'template', language: 'bs', content: content.en, vars: {} };
const api = createAdmin({ baseUrl: 'https://templates.test', market: 'market-contract' }).notification.template;
const page: Promise<{ items: EmailTemplate[]; cursor: string | null }> = api.find(filters);
const deleted: Promise<boolean> = api.delete({ store_id, id: update.id });
const previewed: Promise<PreviewEmailTemplateResponse> = api.preview(preview);
const byKey: Promise<EmailTemplate> = api.get({ store_id, key: 'welcome' });
declare const template: EmailTemplate;
const templateData: EmailTemplateData = template.data;
const templateSubject: string | undefined = template.content['en']?.subject;
// @ts-expect-error Search filters use plain status, not the mutation object.
const invalidFilter: GetEmailTemplatesParams = { store_id, status };
// @ts-expect-error Mutation status is tagged.
const invalidUpdate: UpdateEmailTemplateParams = { store_id, id: 'template', status: 'archived' };
const signInSender: UpdateEmailTemplateParams = { store_id, id: 'template', data: { type: 'sign_in', sender: { type: 'platform' } } };
const signInDraft: UpdateEmailTemplateParams = { store_id, id: 'template', status: { type: 'draft' } };
const anyForm: EmailTemplateData = { type: 'any_form_submission' };
const testSend: SendEmailTemplateTestParams = { store_id, id: 'template', request_id: '0f6a2c41-8d35-4b97-a1e2-5c7d9b3f6e08', language: 'bs', sender: { type: 'platform' } };
const tested: Promise<MessageDelivery> = api.test(testSend);
// @ts-expect-error Subjects live in per-language content.
const flatSubject: CreateEmailTemplateParams = { store_id, key: 'welcome', data, content, subject: { en: 'Welcome' } };
// @ts-expect-error Form submission templates name their form.
const formWithoutId: EmailTemplateData = { type: 'form_submission' };
// @ts-expect-error Body ordering is not supported.
const invalidSort: GetEmailTemplatesParams = { store_id, sort_field: 'body' };
// @ts-expect-error Search text is not numeric.
const invalidText: GetEmailTemplatesParams = { store_id, query: 7 };
void [page, deleted, previewed, byKey, create, templateData, templateSubject, invalidFilter, invalidUpdate, signInSender, signInDraft, anyForm, tested, flatSubject, formWithoutId, invalidSort, invalidText];
