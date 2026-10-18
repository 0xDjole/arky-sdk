import { createAdmin } from '../../dist/index.js';
import type { FindWebhooksParams, Webhook, WebhookEvent } from '../../dist/index.js';

type True<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

declare const admin: ReturnType<typeof createAdmin>;
const webhooks: Promise<{ items: Webhook[]; cursor: string | null }> = admin.store.webhook.find({ store_id: 'store', query: 'entry.updated', status: 'disabled' });
const scoped: WebhookEvent = { type: 'entry.updated', collections: { type: 'all' }, entries: { type: 'only', keys: ['guide'] } };
const forms: WebhookEvent = { type: 'form_submission.created', forms: { form_ids: ['form'] } };
const member: WebhookEvent = { type: 'customer_group_member.payment_method_changed' };
void [webhooks, scoped, forms, member];

export type HookDiscoveryContracts = [
  True<'buildHook' extends keyof typeof admin.store ? false : true>,
  True<Missing<FindWebhooksParams, 'url'>>,
  True<Equal<FindWebhooksParams['status'], 'active' | 'disabled' | undefined>>,
  True<Equal<keyof typeof admin.store.webhook, 'find' | 'create' | 'update' | 'delete' | 'test'>>,
  True<'event' extends keyof WebhookEvent ? false : true>,
  True<Equal<Extract<WebhookEvent, { type: 'form_submission.created' }>['forms'], { form_ids: string[] }>>,
  True<Equal<Extract<WebhookEvent['type'], `customer_group_member.${string}`>,
    | 'customer_group_member.activated' | 'customer_group_member.paused' | 'customer_group_member.resumed'
    | 'customer_group_member.blocked' | 'customer_group_member.cancelled' | 'customer_group_member.renewed' | 'customer_group_member.payment_failed'
    | 'customer_group_member.switched' | 'customer_group_member.renewal_skipped'
    | 'customer_group_member.payment_method_changed'>>,
  True<Equal<Extract<WebhookEvent['type'], `subscription.${string}` | 'customer_group.member_added' | 'customer_group.member_removed'>, never>>,
];
