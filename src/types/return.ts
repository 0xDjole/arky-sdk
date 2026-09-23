import type { AccountActor } from "./accountActor";
import type { UnitSpan } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export type ReturnSource = { type: "order"; order_id: string };

export type ReturnLineSource = {
  type: "order_product";
  order_product_line_item_id: string;
  unit_spans: UnitSpan[];
};

export type ReturnReason = "customer_request" | "wrong_item" | "damaged" | "defective" | "not_as_described" | "other";

export type ReturnRequester =
  | { type: "customer"; customer_id: string }
  | { type: "account"; actor: AccountActor };

export type ReturnStatus =
  | { type: "requested" }
  | { type: "authorized" }
  | { type: "in_transit" }
  | { type: "partially_received" }
  | { type: "received" }
  | { type: "closed" }
  | { type: "cancelled" };

export interface ReturnComponentRequest {
  id: string;
  unit_index: number;
  source_inventory_item_id: string;
  authorized_quantity: number;
}

export interface ReturnComponentReceipt extends ReturnComponentRequest {
  received_quantity: number;
  closed_unreceived_quantity: number;
  restocked_quantity: number;
  written_off_quantity: number;
  discarded_quantity: number;
}

export interface ReturnLineRequest {
  id: string;
  source: ReturnLineSource;
  reason: ReturnReason;
  components: ReturnComponentRequest[];
}

export interface ReturnLine extends ReturnLineRequest {
  components: ReturnComponentReceipt[];
}

export interface Return {
  id: string;
  store_id: string;
  source: ReturnSource;
  destination_store_location_id: string;
  requested_by: ReturnRequester;
  lines: ReturnLine[];
  selected_label_id: string | null;
  status: ReturnStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  command_id: string;
}

export interface ReceiveReturnComponent {
  component_id: string;
  quantity: number;
  inventory_unit_ids: string[];
}

export type ReturnDisposition =
  | { type: "restock" }
  | { type: "write_off"; reason: string }
  | { type: "discard"; reason: string };

export interface DisposeReturnComponent extends ReceiveReturnComponent {
  disposition: ReturnDisposition;
}

export type ReturnCommand =
  | { type: "authorize" }
  | { type: "cancel" }
  | { type: "receive"; components: ReceiveReturnComponent[] }
  | { type: "dispose"; components: DisposeReturnComponent[] }
  | { type: "close" };

export interface GetReturnParams {
  store_id?: string;
  return_id: string;
}

export interface CreateReturnParams extends GetReturnParams {
  source: ReturnSource;
  destination_store_location_id: string;
  command_id: string;
  lines: ReturnLineRequest[];
}

export interface ExecuteReturnParams extends GetReturnParams {
  source: ReturnSource;
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  command: ReturnCommand;
}

export interface FindReturnsParams {
  store_id?: string;
  order_id?: string;
  destination_store_location_id?: string;
  status?: ReturnStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}
