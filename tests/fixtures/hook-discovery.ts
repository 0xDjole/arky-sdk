import { createAdmin } from '../../dist/index.js';
import type { FindWebhooksParams, Webhook, WebhookType } from '../../dist/index.js';

type True<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

declare const admin: ReturnType<typeof createAdmin>;
const webhooks: Promise<{ items: Webhook[]; cursor: string | null }> = admin.store.webhook.list({ store_id: 'store', query: 'entry.updated', status: 'disabled' });
const scoped: WebhookType = { type: 'entry.updated', collections: { type: 'all' }, entries: { type: 'only', keys: ['guide'] } };
const forms: WebhookType = { type: 'form_submission.created', forms: { type: 'only', form_ids: ['form'] } };
void [webhooks, scoped, forms];

export type HookDiscoveryContracts = [
  True<'buildHook' extends keyof typeof admin.store ? false : true>,
  True<Missing<FindWebhooksParams, 'url'>>,
  True<Equal<FindWebhooksParams['status'], 'active' | 'disabled' | undefined>>,
  True<Equal<keyof typeof admin.store.webhook, 'list' | 'create' | 'update' | 'delete' | 'test'>>,
  True<'event' extends keyof WebhookType ? false : true>,
];
