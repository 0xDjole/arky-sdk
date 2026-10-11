import type { EpochMilliseconds } from "./time";
import type { CollectionFilter } from "./block";
import type { SortDirection } from "./common";

export type KeyFilter = { type: "all" } | { type: "only"; keys: string[] };

export interface FormFilter {
  form_ids: string[];
}

export const WEBHOOK_UNIT_EVENT_TYPES = [
  "order.created",
  "order.updated",
  "order.confirmed",
  "order.payment_received",
  "order.payment_failed",
  "order.refunded",
  "refund.succeeded",
  "order.cancelled",
  "order_product_item.created",
  "order_product_item.updated",
  "order_product_item.confirmed",
  "order_product_item.cancelled",
  "order_booking_item.created",
  "order_booking_item.updated",
  "order_booking_item.confirmed",
  "order_booking_item.completed",
  "order_booking_item.no_show",
  "order_booking_item.cancelled",
  "order_booking_item.reminder",
  "fulfillment.created",
  "fulfillment.ready",
  "fulfillment.sent",
  "fulfillment.delivered",
  "fulfillment.collected",
  "fulfillment.tracking_updated",
  "fulfillment.cancelled",
  "fulfillment_job.created",
  "fulfillment_job.opened",
  "fulfillment_job.held",
  "fulfillment_job.released",
  "fulfillment_job.assigned",
  "fulfillment_job.moved",
  "fulfillment_job.completed",
  "fulfillment_job.cancelled",
  "cart.created",
  "cart.updated",
  "cart.abandoned",
  "cart.converted",
  "product.created",
  "product.updated",
  "product.deleted",
  "booking_resource.created",
  "booking_resource.updated",
  "booking_resource.deleted",
  "booking_service.created",
  "booking_service.updated",
  "booking_service.deleted",
  "media.created",
  "media.updated",
  "media.deleted",
  "store.created",
  "store.updated",
  "customer_group.created",
  "customer_group.updated",
  "customer.created",
  "customer.updated",
  "customer.archived",
  "account.updated",
  "customer_group_member.activated",
  "customer_group_member.paused",
  "customer_group_member.resumed",
  "customer_group_member.cancelled",
  "customer_group_member.renewed",
  "customer_group_member.payment_failed",
  "customer_group_member.switched",
  "customer_group_member.next_purchase_skipped",
  "customer_group_member.payment_method_changed",
  "customer_group_member.tax_classification_corrected",
  "company.created",
  "company.updated",
  "company.deleted",
  "company_membership.created",
  "company_membership.updated",
  "company_membership.deleted",
  "return.requested",
  "return.opened",
  "return.approved",
  "return.destination_decided",
  "return.declined",
  "return.cancelled",
  "return.received",
  "return.disposed",
  "return.missing",
  "return.tracking_updated",
  "return.closed",
  "rental.created",
  "rental.updated",
] as const;

export type WebhookUnitEventType = (typeof WEBHOOK_UNIT_EVENT_TYPES)[number];

export type WebhookType =
  | { type: "collection.created"; collections: KeyFilter }
  | { type: "collection.updated"; collections: KeyFilter }
  | { type: "collection.deleted"; collections: KeyFilter }
  | { type: "entry.created"; collections: CollectionFilter; entries: KeyFilter }
  | { type: "entry.updated"; collections: CollectionFilter; entries: KeyFilter }
  | { type: "entry.deleted"; collections: CollectionFilter; entries: KeyFilter }
  | { type: "form_submission.created"; forms: FormFilter }
  | { type: WebhookUnitEventType };

export type WebhookEventName = WebhookType["type"];

export type WebhookStatus = { type: "active" } | { type: "disabled" };

export interface Webhook {
  id: string;
  store_id: string;
  url: string;
  events: WebhookType[];
  headers: Record<string, string>;
  secret: string;
  status: WebhookStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface WebhookEventScopeField {
  field: string;
  label: string;
  placeholder: string;
}

export interface WebhookEventMetadata {
  event: WebhookEventName;
  scopes: WebhookEventScopeField[];
}

export interface FindWebhooksParams {
  store_id: string;
  query?: string;
  status?: WebhookStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateWebhookParams {
  store_id: string;
  id: string;
  url: string;
  events: WebhookType[];
  headers: Record<string, string>;
  secret: string;
  status: WebhookStatus;
}

export interface UpdateWebhookParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  url?: string;
  events?: WebhookType[];
  headers?: Record<string, string>;
  secret?: string;
  status?: WebhookStatus;
}

export interface DeleteWebhookParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface TestWebhookParams {
  store_id: string;
  id: string;
  webhook_id: string;
}
