import { createAdmin } from '../../dist/index.js';
import type { FindWebhooksParams, Webhook, WebhookEvent } from '../../dist/index.js';

type True<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

declare const admin: ReturnType<typeof createAdmin>;
const webhooks: Promise<{ items: Webhook[]; cursor: string | null }> = admin.store.webhook.find({ store_id: 'store', query: 'entry.updated', status: 'disabled' });
const scoped: WebhookEvent = { type: 'entry.updated', collections: { type: 'all' }, entries: { type: 'only', keys: ['guide'] } };
const forms: WebhookEvent = { type: 'form_submission.created', forms: { form_ids: ['form'] } };
const staged: WebhookEvent = { type: 'form_submission.stage_changed', forms: { form_ids: ['form'] } };
const removed: WebhookEvent = { type: 'form_submission.deleted', forms: { form_ids: [] } };
const member: WebhookEvent = { type: 'package_member.payment_method_changed' };
const conversation: WebhookEvent = { type: 'conversation_message.created' };
const packageItem: WebhookEvent = { type: 'package_item.updated' };
void [webhooks, scoped, forms, staged, removed, member, conversation, packageItem];

export type HookDiscoveryContracts = [
  True<'buildHook' extends keyof typeof admin.store ? false : true>,
  True<Missing<FindWebhooksParams, 'url'>>,
  True<Equal<FindWebhooksParams['status'], 'active' | 'disabled' | undefined>>,
  True<Equal<keyof typeof admin.store.webhook, 'find' | 'create' | 'update' | 'delete' | 'test'>>,
  True<'event' extends keyof WebhookEvent ? false : true>,
  True<Equal<Extract<WebhookEvent, { type: 'form_submission.created' }>['forms'], { form_ids: string[] }>>,
  True<Equal<Extract<WebhookEvent, { type: 'form_submission.stage_changed' }>['forms'], { form_ids: string[] }>>,
  True<Equal<Extract<WebhookEvent, { type: 'form_submission.deleted' }>['forms'], { form_ids: string[] }>>,
  True<Equal<Extract<WebhookEvent['type'], `form_submission.${string}`>, 'form_submission.created' | 'form_submission.stage_changed' | 'form_submission.deleted'>>,
  True<Equal<Extract<WebhookEvent['type'], `conversation${string}`>, 'conversation.created' | 'conversation.updated' | 'conversation_message.created'>>,
  True<Equal<Extract<WebhookEvent['type'], `package.${string}` | `package_item${string}` | `package_access.${string}`>, 'package.created' | 'package.updated' | 'package.deleted' | 'package_item.created' | 'package_item.updated' | 'package_item.deleted' | 'package_access.created' | 'package_access.deleted' | 'package_item_price.created' | 'package_item_price.updated' | 'package_item_price.deleted'>>,
  True<Equal<Extract<WebhookEvent['type'], `booking_offering.${string}` | `package_offering.${string}`>, 'booking_offering.created' | 'booking_offering.updated' | 'booking_offering.deleted' | 'package_offering.created' | 'package_offering.updated' | 'package_offering.deleted'>>,
  True<Equal<Extract<WebhookEvent['type'], `package_member.${string}`>,
    | 'package_member.activated' | 'package_member.paused' | 'package_member.resumed'
    | 'package_member.blocked' | 'package_member.cancelled' | 'package_member.renewed' | 'package_member.payment_failed'
    | 'package_member.switched' | 'package_member.renewal_skipped'
    | 'package_member.payment_method_changed'>>,
  True<Equal<Extract<WebhookEvent['type'], `subscription.${string}` | 'package.member_added' | 'package.member_removed'>, never>>,
];
