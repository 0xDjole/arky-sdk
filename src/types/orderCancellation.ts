import type { AccountActor } from "./index";
import type { EpochMilliseconds } from "./time";

export interface CancelPendingOrderParams {
  store_id?: string;
  order_id: string;
  command_id: string;
}

export interface OrderCancellationReceipt {
  id: string;
  store_id: string;
  accepted_at: EpochMilliseconds;
  command: {
    type: "order_cancellation_requested";
    order_id: string;
    source:
      | { type: "admin"; actor: AccountActor }
      | { type: "expiration"; expires_at: EpochMilliseconds };
  };
}
