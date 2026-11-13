import type {
  AuditAction,
  BookingOffering,
  CartBookingLineItem,
  CartBookingLineItemInput,
  CartBookingLineType,
  CreateBookingOfferingParams,
  OrderBookingAttendance,
  OrderBookingLineItem,
  OrderBookingLineType,
  OrderBookingStatusFilter,
  QuoteBookingAvailability,
  QuoteBookingLine,
  ResizeOrderBookingItemParams,
  StorefrontBookingAttendance,
  StorefrontOrderBookingLineItem,
  UpdateBookingOfferingParams,
  VisitMark,
  VisitStep,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type OrderApi = ReturnType<typeof createAdmin>["eshop"]["order"];

export type CalendarContracts = [
  Assert<Equal<OrderBookingLineType, { type: "main" } | { type: "extra"; main_line_id: string }>>,
  Assert<Equal<CartBookingLineType, { type: "main" } | { type: "extra"; main_line_id: string }>>,
  Assert<Equal<OrderBookingLineItem["booking_type"], OrderBookingLineType>>,
  Assert<Equal<StorefrontOrderBookingLineItem["booking_type"], OrderBookingLineType>>,
  Assert<Equal<CartBookingLineItem["booking_type"], CartBookingLineType>>,
  Assert<Equal<QuoteBookingLine["booking_type"], CartBookingLineType>>,
  Assert<Equal<{} extends Pick<CartBookingLineItemInput, "booking_type"> ? true : false, true>>,
  Assert<Equal<VisitMark, { by: VisitMark["by"]; at: VisitMark["at"] }>>,
  Assert<Equal<OrderBookingAttendance["type"], "upcoming" | "waiting" | "in_progress" | "attended" | "no_show">>,
  Assert<Equal<Extract<OrderBookingAttendance, { type: "waiting" }>, { type: "waiting"; arrived: VisitMark }>>,
  Assert<Equal<Extract<OrderBookingAttendance, { type: "in_progress" }>, { type: "in_progress"; arrived: VisitMark; started: VisitMark }>>,
  Assert<
    Equal<
      Extract<OrderBookingAttendance, { type: "attended" }>,
      { type: "attended"; arrived: VisitMark | null; started: VisitMark | null; finished: VisitMark }
    >
  >,
  Assert<Equal<Extract<OrderBookingAttendance, { type: "no_show" }>, { type: "no_show"; marked: VisitMark }>>,
  Assert<Equal<StorefrontBookingAttendance["type"], "upcoming" | "waiting" | "in_progress" | "attended" | "no_show">>,
  Assert<Equal<VisitStep, "upcoming" | "waiting" | "in_progress" | "attended" | "no_show">>,
  Assert<Equal<Extract<OrderBookingStatusFilter, "waiting" | "in_progress">, "waiting" | "in_progress">>,
  Assert<Equal<Extract<QuoteBookingAvailability, { type: "history" }>, { type: "history" }>>,
  Assert<RequiredField<ResizeOrderBookingItemParams, "ends_at">>,
  Assert<Equal<BookingOffering["max_per_day"], number | null>>,
  Assert<Equal<{} extends Pick<CreateBookingOfferingParams, "max_per_day"> ? true : false, true>>,
  Assert<Equal<{} extends Pick<UpdateBookingOfferingParams, "max_per_day"> ? true : false, true>>,
  Assert<
    Equal<
      Extract<AuditAction, { action: "order_booking_line_item_waiting" | "order_booking_line_item_in_progress" }>["action"],
      "order_booking_line_item_waiting" | "order_booking_line_item_in_progress"
    >
  >,
  Assert<
    Equal<
      Extract<AuditAction, { action: "order_booking_line_item_upcoming" }>,
      { action: "order_booking_line_item_upcoming"; order_id: string; order_booking_line_item_id: string }
    >
  >,
  Assert<Equal<Parameters<OrderApi["stepBookingItem"]>[0]["step"], VisitStep>>,
  Assert<Equal<keyof Pick<OrderApi, "resizeBookingItem" | "cancelBookingSeries" | "rescheduleBookingSeries" | "markBookingItemWaiting" | "startBookingItem">, "resizeBookingItem" | "cancelBookingSeries" | "rescheduleBookingSeries" | "markBookingItemWaiting" | "startBookingItem">>,
];
