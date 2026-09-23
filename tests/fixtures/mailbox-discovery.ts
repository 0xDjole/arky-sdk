import { createAdmin } from '../../dist/index.js';
import type { FindMailboxesParams, Mailbox, MailboxStatus, UpdateMailboxParams } from '../../dist/index.js';

const filters: FindMailboxesParams = { query: 'sender@example.com', status: 'draft', provider_type: 'smtp_imap',
  limit: 1, cursor: null, sort_field: 'email', sort_direction: 'asc' };
const status: MailboxStatus = { type: 'archived' };
const update: UpdateMailboxParams = { id: 'mailbox', status };
const api = createAdmin({ baseUrl: 'https://mailboxes.test', storeId: 'store', market: 'market' }).notification.mailbox;
const page: Promise<{ items: Mailbox[]; cursor: string | null }> = api.find(filters);
const saved: Promise<Mailbox> = api.update(update);
// @ts-expect-error Search filters use plain status, not the mutation object.
const invalidFilter: FindMailboxesParams = { status };
// @ts-expect-error Mutation status is tagged.
const invalidUpdate: UpdateMailboxParams = { id: 'mailbox', status: 'archived' };
// @ts-expect-error Provider sorting is unsupported.
const invalidSort: FindMailboxesParams = { sort_field: 'provider' };
// @ts-expect-error Search text is not numeric.
const invalidText: FindMailboxesParams = { query: 7 };
void [page, saved, invalidFilter, invalidUpdate, invalidSort, invalidText];
