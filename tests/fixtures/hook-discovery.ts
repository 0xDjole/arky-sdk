import { createAdmin } from '../../dist/index.js';
import type { BuildHook, Webhook, WebhookEventSubscription } from '../../dist/index.js';

declare const admin: ReturnType<typeof createAdmin>;
const build: Promise<{ items: BuildHook[]; cursor: string | null }> = admin.store.buildHook.list({ store_id: 'store', query: 'id', status: 'active', sort_field: 'updated_at', sort_direction: 'asc', cursor: null, limit: 1 });
const webhooks: Promise<{ items: Webhook[]; cursor: string | null }> = admin.store.webhook.list({ store_id: 'store', query: 'entry.updated', status: 'disabled' });
const scoped: WebhookEventSubscription = { type: 'entry.updated', collection_id: null, key: null };
// @ts-expect-error Webhook subscriptions use the Server type discriminator.
const retired: WebhookEventSubscription = { event: 'entry.updated' };
// @ts-expect-error Mutation statuses are tagged objects, not query filters.
void admin.store.buildHook.update({ store_id: 'store', id: 'id', status: 'active' });
// @ts-expect-error Private destinations cannot be search predicates.
void admin.store.webhook.list({ store_id: 'store', url: 'https://private.test' });
// @ts-expect-error List filters are flat strings, not domain status objects.
void admin.store.webhook.list({ store_id: 'store', status: { type: 'active' } });
void [build, webhooks, scoped, retired];
