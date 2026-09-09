import type {
  LineMoneySnapshot,
  OrderBookingSnapshot,
  OrderDigitalSnapshot,
  OrderMoney,
  OrderProductSnapshot,
  OrderShippingLine,
  ShippingMethod,
  TimeRange,
} from "./index";
import type { OrderAudienceItem, PurchaseQuoteContext } from "./commerce";

export type BookingQuoteLineAvailability =
  | { type: "available"; spots: number }
  | { type: "unavailable"; reason: string };

export interface ProductQuoteLine {
  product_id: string;
  variant_id: string;
  quantity: number;
  money: LineMoneySnapshot;
  snapshot: OrderProductSnapshot;
}

export interface BookingQuoteLine {
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  interval: TimeRange;
  money: LineMoneySnapshot;
  snapshot: OrderBookingSnapshot;
  availability: BookingQuoteLineAvailability;
}

export interface DigitalProductQuoteLine {
  digital_product_id: string;
  money: LineMoneySnapshot;
  snapshot: OrderDigitalSnapshot;
}

export interface AudienceQuoteLine {
  audience_id: string;
  membership_id: string;
  money: LineMoneySnapshot;
  snapshot: OrderAudienceItem["snapshot"];
}

export interface OrderQuote {
  context: PurchaseQuoteContext;
  locale: string;
  presentation_digest: string;
  product_lines: ProductQuoteLine[];
  booking_lines: BookingQuoteLine[];
  digital_lines: DigitalProductQuoteLine[];
  audience_lines: AudienceQuoteLine[];
  shipping_lines: OrderShippingLine[];
  shipping_methods: ShippingMethod[];
  payment_provider_id: string | null;
  payment_provider_ids: string[];
  money: OrderMoney;
}
