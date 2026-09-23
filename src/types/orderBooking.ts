import type { BookingReminderScheduleItem, OrderBookingStatus, TimeRange } from "./index";
import type { EpochMilliseconds } from "./time";

export interface OrderBooking {
  id: string;
  store_id: string;
  order_id: string;
  order_booking_line_item_id: string;
  booking_resource_id: string | null;
  source_booking_resource_id: string;
  interval: TimeRange;
  status: OrderBookingStatus;
  reminders: BookingReminderScheduleItem[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetOrderBookingParams {
  store_id?: string;
  order_id: string;
  order_booking_item_id: string;
}
