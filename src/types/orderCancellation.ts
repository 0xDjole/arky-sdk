import type { AccountActor } from "./index";
import type { EpochMilliseconds } from "./time";

export interface CancelPendingOrderParams {
  store_id: string;
  order_id: string;
  request_id: string;
}

export interface OrderCancellationAcceptance {
  request_id: string;
  store_id: string;
  order_id: string;
  accepted_at: EpochMilliseconds;
  source:
    | { type: "admin"; actor: AccountActor }
    | { type: "expiration"; expires_at: EpochMilliseconds };
}
