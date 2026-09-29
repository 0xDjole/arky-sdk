import type { AccountActor } from "./accountActor";
import type { Tracking } from "./index";
import type { UnitSpan } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export type ReturnSource =
  | { type: "order"; order_id: string }
  | { type: "rental"; rental_id: string };

export type ReturnLineSource =
  | { type: "order_product"; order_product_line_item_id: string; unit_spans: UnitSpan[] }
  | { type: "rental_unit"; inventory_unit_id: string };

export type ReturnReason = "customer_request" | "wrong_item" | "damaged" | "defective" | "not_as_described" | "other";

export type ReturnRequester =
  | { type: "customer"; customer_id: string }
  | { type: "account"; actor: AccountActor }
  | { type: "system" };

export type ReturnStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "declined"; declined_at: EpochMilliseconds; reason: string }
  | { type: "open" }
  | { type: "closed"; closed_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface ReturnItemRequest {
  inventory_item_id: string;
  quantity: number;
}

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

export interface GetOrderReturnOptionsParams {
  store_id: string;
  order_id: string;
}

export interface RentalReturnUnitOption {
  inventory_unit_id: string;
  inventory_item_id: string;
  asset_tag: string;
}

export interface FindRentalReturnOptionsParams {
  rental_id: string;
  limit?: number;
  cursor?: string;
}

export interface ReturnItem extends ReturnItemRequest {
  received: number;
  restocked: number;
  not_restocked: number;
  missing: number;
}

export interface ReturnLineRequest {
  id: string;
  source: ReturnLineSource;
  reason: ReturnReason;
  items: ReturnItemRequest[];
}

export interface ReturnLine extends ReturnLineRequest {
  items: ReturnItem[];
}

export interface Return {
  id: string;
  store_id: string;
  source: ReturnSource;
  destination_store_location_id: string;
  requested_by: ReturnRequester;
  lines: ReturnLine[];
  tracking: Tracking | null;
  status: ReturnStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  request_id: string;
}

export interface MissingReturnItem {
  line_id: string;
  inventory_item_id: string;
  quantity: number;
}

export interface ReceiveReturnItem extends MissingReturnItem {
  inventory_unit_ids: string[];
}

export type ReturnDisposition =
  | { type: "restock" }
  | { type: "not_restocked"; reason: string };

export interface DisposeReturnItem extends ReceiveReturnItem {
  disposition: ReturnDisposition;
  order_units: ReturnOrderUnitQuantity[];
}

export interface ReturnOrderUnitQuantity {
  span: UnitSpan;
  quantity_per_unit: number;
}

export interface ReturnInspectionUnit {
  store_id: string;
  return_id: string;
  line_id: string;
  inventory_item_id: string;
  inventory_unit_id: string;
  order_units: UnitSpan[];
}

export interface GetReturnInspectionUnitParams extends GetReturnParams {
  inventory_unit_id: string;
}

export type ReturnCommand =
  | { type: "approve"; destination_store_location_id?: string | null }
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

export interface CreateReturnParams extends GetReturnParams {
  source: ReturnSource;
  destination_store_location_id?: string | null;
  request_id: string;
  lines: ReturnLineRequest[];
}

export interface ExecuteReturnParams extends GetReturnParams {
  source: ReturnSource;
  request_id: string;
  expected_updated_at: EpochMilliseconds;
  command: ReturnCommand;
}

export type FindReturnsParams = {
  store_id: string;
  destination_store_location_id?: string;
  status?: ReturnStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
} & (
  | { order_id?: string; rental_id?: never }
  | { rental_id?: string; order_id?: never }
);
