import type { EpochMilliseconds } from "./time";
import type { AccountActor, SortDirection, UnitSpan } from "./common";
import type { Tracking } from "./fulfillment";

export type ReturnReason =
  | "customer_request"
  | "wrong_item"
  | "damaged"
  | "defective"
  | "not_as_described"
  | "other";

export type ReturnDisposition =
  | { type: "restocked" }
  | { type: "not_restocked"; reason: string };

export interface ReturnItemDecision {
  quantity: number;
  disposition: ReturnDisposition;
  actor: AccountActor;
  decided_at: EpochMilliseconds;
}

export interface ReturnItem {
  inventory_item_id: string;
  quantity: number;
  received: number;
  missing: number;
  decisions: ReturnItemDecision[];
}

export interface OrderReturnLine {
  id: string;
  order_product_line_item_id: string;
  unit_spans: UnitSpan[];
  reason: ReturnReason;
  items: ReturnItem[];
}

export interface RentalReturnLine {
  id: string;
  inventory_unit_id: string;
  reason: ReturnReason;
  items: ReturnItem[];
}

export type ReturnType =
  | { type: "order"; order_id: string; lines: OrderReturnLine[] }
  | { type: "rental"; rental_id: string; lines: RentalReturnLine[] };

export type ReturnRequester =
  | { type: "system" }
  | { type: "customer"; customer_id: string }
  | { type: "account"; actor: AccountActor };

export type ReturnDestination =
  | { type: "undecided" }
  | { type: "decided"; store_location_id: string };

export type ReturnStatus =
  | { type: "requested"; requested_at: EpochMilliseconds; destination: ReturnDestination }
  | { type: "declined"; declined_at: EpochMilliseconds; reason: string }
  | { type: "open"; store_location_id: string }
  | { type: "closed"; closed_at: EpochMilliseconds; store_location_id: string }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface Return {
  id: string;
  store_id: string;
  type: ReturnType;
  requested_by: ReturnRequester;
  tracking: Tracking | null;
  status: ReturnStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ReturnItemRequest {
  inventory_item_id: string;
  quantity: number;
}

export interface OrderReturnLineRequest {
  id: string;
  order_product_line_item_id: string;
  unit_spans: UnitSpan[];
  reason: ReturnReason;
  items: ReturnItemRequest[];
}

export interface RentalReturnLineRequest {
  id: string;
  inventory_unit_id: string;
  reason: ReturnReason;
  items: ReturnItemRequest[];
}

export type ReturnTypeRequest =
  | { type: "order"; order_id: string; lines: OrderReturnLineRequest[] }
  | { type: "rental"; rental_id: string; lines: RentalReturnLineRequest[] };

export interface OrderReturnItemOption extends ReturnItemRequest {
  inventory_item_key: string;
  sku: string | null;
}

export interface OrderReturnLineOption {
  order_product_line_item_id: string;
  unit_spans: UnitSpan[];
  items: OrderReturnItemOption[];
}

export interface OrderReturnOptions {
  order_id: string;
  lines: OrderReturnLineOption[];
}

export interface RentalReturnUnitOption {
  inventory_unit_id: string;
  inventory_item_id: string;
  asset_tag: string;
}

export interface ReturnDestinationOptions {
  return_id: string;
  suggested_store_location_id: string | null;
  store_location_ids: string[];
}

export interface ReturnInspectionUnit {
  store_id: string;
  return_id: string;
  line_id: string;
  inventory_item_id: string;
  inventory_unit_id: string;
}

export interface MissingReturnItem {
  line_id: string;
  inventory_item_id: string;
  quantity: number;
}

export interface ReceiveReturnItem extends MissingReturnItem {
  inventory_unit_ids: string[];
}

export interface DisposeReturnItem extends ReceiveReturnItem {
  disposition: ReturnDisposition;
}

export type ReturnAction =
  | { type: "approve"; destination_store_location_id: string | null }
  | { type: "decide"; store_location_id: string }
  | { type: "decline"; reason: string }
  | { type: "cancel" }
  | { type: "receive"; items: ReceiveReturnItem[] }
  | { type: "dispose"; items: DisposeReturnItem[] }
  | { type: "missing"; items: MissingReturnItem[] }
  | { type: "tracking"; tracking: Tracking };

export interface GetReturnParams {
  store_id: string;
  return_id: string;
}

export interface GetReturnInspectionUnitParams extends GetReturnParams {
  inventory_unit_id: string;
}

export interface CreateReturnParams {
  store_id: string;
  id: string;
  type: ReturnTypeRequest;
  destination_store_location_id: string | null;
}

export interface ActOnReturnParams extends GetReturnParams {
  expected_updated_at: EpochMilliseconds;
  command: ReturnAction;
}

export interface CreditReturnParams extends GetReturnParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindReturnsParams {
  store_id: string;
  order_id?: string;
  rental_id?: string;
  destination_store_location_id?: string;
  status?: ReturnStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetOrderReturnOptionsParams {
  store_id: string;
  order_id: string;
}

export interface FindRentalReturnOptionsParams {
  rental_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontCreateReturnParams {
  id: string;
  type: ReturnTypeRequest;
  destination_store_location_id: string | null;
}

export interface StorefrontGetReturnParams {
  return_id: string;
}

export interface StorefrontFindReturnsParams {
  order_id?: string;
  rental_id?: string;
  limit?: number;
  cursor?: string | null;
}
