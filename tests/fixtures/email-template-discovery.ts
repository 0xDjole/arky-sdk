import { createAdmin, epochMilliseconds } from '../../dist/index.js';
import type { EmailTemplate, EmailTemplateStatus, GetEmailTemplatesParams, UpdateEmailTemplateParams } from '../../dist/index.js';

const filters: GetEmailTemplatesParams = {
  key: 'welcome', query: 'welcome', status: 'draft', limit: 1, cursor: null,
  sort_field: 'key', sort_direction: 'asc', created_at_from: epochMilliseconds(0),
};
const status: EmailTemplateStatus = { type: 'archived' };
const update: UpdateEmailTemplateParams = { id: 'template', status, preheader: null };
const api = createAdmin({ baseUrl: 'https://templates.test', storeId: 'store', market: 'market-contract' }).notification.template;
const page: Promise<{ items: EmailTemplate[]; cursor: string | null }> = api.find(filters);
const deleted: Promise<boolean> = api.delete({ id: update.id });
// @ts-expect-error Search filters use plain status, not the mutation object.
const invalidFilter: GetEmailTemplatesParams = { status };
// @ts-expect-error Mutation status is tagged.
const invalidUpdate: UpdateEmailTemplateParams = { id: 'template', status: 'archived' };
// @ts-expect-error Body ordering is not supported.
const invalidSort: GetEmailTemplatesParams = { sort_field: 'body' };
// @ts-expect-error Search text is not numeric.
const invalidText: GetEmailTemplatesParams = { query: 7 };
void [page, deleted, invalidFilter, invalidUpdate, invalidSort, invalidText];
