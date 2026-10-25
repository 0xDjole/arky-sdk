import type { EpochMilliseconds } from "./time";
import type { CollectionFilter } from "./block";
import type { SortDirection } from "./common";
import type { Order } from "./order";

export type KeyFilter = { type: "all" } | { type: "only"; keys: string[] };

export interface FormFilter {
  form_ids: string[];
}

export const WEBHOOK_UNIT_EVENT_TYPES = [
  "conversation.created",
  "conversation.updated",
  "conversation_message.created",
  "order.created",
  "order.updated",
  "order.confirmed",
  "order.payment_received",
  "order.payment_failed",
  "refund.created",
  "refund.succeeded",
  "refund.failed",
  "order.cancelled",
  "order_product_item.created",
  "order_product_item.updated",
  "order_product_item.confirmed",
  "order_product_item.cancelled",
  "order_booking_item.created",
  "order_booking_item.updated",
  "order_booking_item.confirmed",
  "order_booking_item.attended",
  "order_booking_item.no_show",
  "order_booking_item.cancelled",
  "order_booking_item.reminder",
  "fulfillment.created",
  "fulfillment.ready",
  "fulfillment.dispatched",
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
  "product_variant.created",
  "product_variant.updated",
  "product_variant.deleted",
  "catalog.created",
  "catalog.updated",
  "catalog.deleted",
  "catalog_item.created",
  "catalog_item.updated",
  "catalog_item.deleted",
  "catalog_access.created",
  "catalog_access.deleted",
  "catalog_item_price.created",
  "catalog_item_price.updated",
  "catalog_item_price.deleted",
  "inventory_level.updated",
  "promotion.created",
  "promotion.updated",
  "promotion.deleted",
  "promotion_code.created",
  "promotion_code.deleted",
  "booking_resource.created",
  "booking_resource.updated",
  "booking_resource.deleted",
  "booking_service.created",
  "booking_service.updated",
  "booking_service.deleted",
  "booking_offering.created",
  "booking_offering.updated",
  "booking_offering.deleted",
  "media.created",
  "media.updated",
  "media.deleted",
  "category.created",
  "category.updated",
  "category.deleted",
  "store.updated",
  "customer_group.created",
  "customer_group.updated",
  "customer_group.deleted",
  "customer_group_offering.created",
  "customer_group_offering.updated",
  "customer_group_offering.deleted",
  "customer.verified",
  "customer.updated",
  "customer.merged",
  "customer.erased",
  "customer_group_member.activated",
  "customer_group_member.paused",
  "customer_group_member.blocked",
  "customer_group_member.resumed",
  "customer_group_member.cancelled",
  "customer_group_member.renewed",
  "customer_group_member.payment_failed",
  "customer_group_member.switched",
  "customer_group_member.renewal_skipped",
  "customer_group_member.payment_method_changed",
  "company.created",
  "company.updated",
  "company.deleted",
  "company_location.created",
  "company_location.updated",
  "company_location.deleted",
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

export interface OrderRefundCreated {
  order: Omit<Order, "status" | "totals">;
  payment_id: string;
  refund_id: string;
}

export interface OrderRefundFailed {
  order: Omit<Order, "status" | "totals">;
  payment_id: string;
  refund_id: string;
}

export interface OrderRefundSucceeded {
  order: Omit<Order, "status" | "totals">;
  payment_id: string;
  refund_id: string;
  notify_customer: boolean;
}

export type WebhookEvent =
  | { type: "collection.created"; collections: KeyFilter }
  | { type: "collection.updated"; collections: KeyFilter }
  | { type: "collection.deleted"; collections: KeyFilter }
  | { type: "entry.created"; collections: CollectionFilter; entries: KeyFilter }
  | { type: "entry.updated"; collections: CollectionFilter; entries: KeyFilter }
  | { type: "entry.deleted"; collections: CollectionFilter; entries: KeyFilter }
  | { type: "form_submission.created"; forms: FormFilter }
  | { type: "form_submission.stage_changed"; forms: FormFilter }
  | { type: "form_submission.deleted"; forms: FormFilter }
  | { type: WebhookUnitEventType };

export type WebhookEventName = WebhookEvent["type"];

export type WebhookStatus = { type: "active" } | { type: "disabled" };

export interface Webhook {
  id: string;
  store_id: string;
  url: string;
  events: WebhookEvent[];
  headers: Record<string, string>;
  secret: string;
  status: WebhookStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface WebhookEventScopeField {
  field: string;
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
  events: WebhookEvent[];
  headers: Record<string, string>;
  secret: string;
  status: WebhookStatus;
}

export interface UpdateWebhookParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  url?: string;
  events?: WebhookEvent[];
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
