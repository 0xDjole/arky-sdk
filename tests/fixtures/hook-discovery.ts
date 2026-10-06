import { createAdmin } from '../../dist/index.js';
import type { Webhook, WebhookEventSubscription } from '../../dist/index.js';

declare const admin: ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type BuildHooksRemoved = True<'buildHook' extends keyof typeof admin.store ? false : true>;
const webhooks: Promise<{ items: Webhook[]; cursor: string | null }> = admin.store.webhook.list({ store_id: 'store', query: 'entry.updated', status: 'disabled' });
const scoped: WebhookEventSubscription = { type: 'entry.updated', collection_id: null, key: null };
// @ts-expect-error Webhook subscriptions use the Server type discriminator.
const retired: WebhookEventSubscription = { event: 'entry.updated' };
// @ts-expect-error Private destinations cannot be search predicates.
void admin.store.webhook.list({ store_id: 'store', url: 'https://private.test' });
// @ts-expect-error List filters are flat strings, not domain status objects.
void admin.store.webhook.list({ store_id: 'store', status: { type: 'active' } });
const buildHooksRemoved: BuildHooksRemoved = true;
void [buildHooksRemoved, webhooks, scoped, retired];
