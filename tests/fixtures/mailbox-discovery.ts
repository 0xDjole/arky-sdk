import { createAdmin } from '../../dist/index.js';
import type { FindMailboxesParams, Mailbox, MailboxStatus, UpdateMailboxParams } from '../../dist/index.js';

const store_id = '6a1d9f3c-0e72-4b58-bd49-2c8e5f1a7d03';
const filters: FindMailboxesParams = { store_id, query: 'sender@example.com', status: 'draft', provider_type: 'smtp_imap',
  limit: 1, cursor: null, sort_field: 'email', sort_direction: 'asc' };
const status: MailboxStatus = { type: 'archived' };
const update: UpdateMailboxParams = { store_id, id: 'mailbox', status };
const api = createAdmin({ baseUrl: 'https://mailboxes.test', market: 'market' }).notification.mailbox;
const page: Promise<{ items: Mailbox[]; cursor: string | null }> = api.find(filters);
const saved: Promise<Mailbox> = api.update(update);
// @ts-expect-error Search filters use plain status, not the mutation object.
const invalidFilter: FindMailboxesParams = { store_id, status };
// @ts-expect-error Mutation status is tagged.
const invalidUpdate: UpdateMailboxParams = { store_id, id: 'mailbox', status: 'archived' };
// @ts-expect-error Provider sorting is unsupported.
const invalidSort: FindMailboxesParams = { store_id, sort_field: 'provider' };
// @ts-expect-error Search text is not numeric.
const invalidText: FindMailboxesParams = { store_id, query: 7 };
void [page, saved, invalidFilter, invalidUpdate, invalidSort, invalidText];
