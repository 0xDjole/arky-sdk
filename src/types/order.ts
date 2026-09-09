import type {
  CompanySnapshot,
  OrderAudienceItem,
  PurchaseCustomerSnapshot,
  PurchaseOrigin,
  SalesChannelSnapshot,
} from "./commerce";
import type {
  Address,
  OrderBookingItem,
  OrderDigitalItem,
  OrderMoney,
  OrderProductItem,
  OrderShippingLine,
} from "./index";
import type { EpochMilliseconds } from "./time";

export type OrderSource =
  | { type: "cart"; request_id: string; cart_id: string | null }
  | { type: "direct"; request_id: string };

export type OrderStatus = {
  type: "pending" | "confirmed" | "partially_cancelled" | "cancelled";
};

export interface Order {
  id: string;
  number: string;
  store_id: string;
  source: OrderSource;
  customer_id: string | null;
  customer_snapshot: PurchaseCustomerSnapshot | null;
  company_id: string | null;
  company_location_id: string | null;
  company_snapshot: CompanySnapshot | null;
  market_id: string | null;
  sales_channel_id: string | null;
  sales_channel_snapshot: SalesChannelSnapshot;
  origin: PurchaseOrigin;
  status: OrderStatus;
  payment_id: string | null;
  product_items: OrderProductItem[];
  booking_items: OrderBookingItem[];
  digital_items: OrderDigitalItem[];
  audience_items: OrderAudienceItem[];
  money: OrderMoney;
  shipping_lines: OrderShippingLine[];
  shipping_address: Address | null;
  billing_address: Address | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}
