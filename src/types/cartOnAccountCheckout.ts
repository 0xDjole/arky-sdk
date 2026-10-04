import type { RequestOptions } from "./api";
import type { CheckoutQuoteSources } from "./checkout";
import type { OrderCheckoutResult } from "./index";
import type { Order } from "./order";

export interface CheckoutCartOnAccountParams {
  id: string;
  store_id: string;
  request_id: string;
  locale: string;
  presentation_digest: string;
  sources: CheckoutQuoteSources;
  payment_option_id?: string;
  reason: string;
}

export type CartOnAccountCheckoutRequest = Omit<CheckoutCartOnAccountParams, "store_id">;

export interface CartOnAccountCheckoutTransport {
  post(request: CartOnAccountCheckoutRequest, options?: RequestOptions): Promise<OrderCheckoutResult>;
  getOrder(id: string, options?: RequestOptions): Promise<Order>;
}
