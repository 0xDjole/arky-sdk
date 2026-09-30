import { createAdmin, epochMilliseconds } from '../../dist/index.js';
import type { EmailTemplate, EmailTemplateStatus, GetEmailTemplatesParams, UpdateEmailTemplateParams } from '../../dist/index.js';

const store_id = '5f0e7d93-2b46-4c18-9a7d-e1c3b5f82a06';
const filters: GetEmailTemplatesParams = {
  store_id, key: 'welcome', query: 'welcome', status: 'draft', limit: 1, cursor: null,
  sort_field: 'key', sort_direction: 'asc', created_at_from: epochMilliseconds(0),
};
const status: EmailTemplateStatus = { type: 'archived' };
const update: UpdateEmailTemplateParams = { store_id, id: 'template', status, preheader: null };
const api = createAdmin({ baseUrl: 'https://templates.test', market: 'market-contract' }).notification.template;
const page: Promise<{ items: EmailTemplate[]; cursor: string | null }> = api.find(filters);
const deleted: Promise<boolean> = api.delete({ store_id, id: update.id });
// @ts-expect-error Search filters use plain status, not the mutation object.
const invalidFilter: GetEmailTemplatesParams = { store_id, status };
// @ts-expect-error Mutation status is tagged.
const invalidUpdate: UpdateEmailTemplateParams = { store_id, id: 'template', status: 'archived' };
// @ts-expect-error Body ordering is not supported.
const invalidSort: GetEmailTemplatesParams = { store_id, sort_field: 'body' };
// @ts-expect-error Search text is not numeric.
const invalidText: GetEmailTemplatesParams = { store_id, query: 7 };
void [page, deleted, invalidFilter, invalidUpdate, invalidSort, invalidText];
