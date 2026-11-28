import type {
  AuditAction,
  AuditSubjectType,
  BookingOffering,
  BookingResource,
  CartBookingLineAddOn,
  CartBookingLineAddOnInput,
  CartBookingLineItem,
  CartBookingLineItemInput,
  CartBookingLineResource,
  CreateBookingOfferingParams,
  OrderBookingAttendance,
  OrderBookingChange,
  OrderBookingChangeType,
  OrderBookingItemUpdate,
  OrderBookingLineAddOn,
  OrderBookingLineAddOnPrice,
  OrderBookingLineAddOnStatus,
  OrderBookingLineItem,
  OrderBookingStatusFilter,
  QuoteBookingAvailability,
  QuoteBookingLine,
  QuoteBookingPlan,
  ResizeOrderBookingItemParams,
  StorefrontBookingAttendance,
  StorefrontOrderBookingLineItem,
  TakeOffOrderBookingAddOnParams,
  TimeRange,
  UpdateBookingOfferingParams,
  UpdateOrderBookingItemParams,
  VisitMark,
  VisitStep,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = Extract<K, keyof T> extends never ? true : false;
type OrderApi = ReturnType<typeof createAdmin>["eshop"]["order"];

export type CalendarContracts = [
  Assert<Missing<OrderBookingLineItem, "booking_type" | "reschedules">>,
  Assert<Missing<StorefrontOrderBookingLineItem, "booking_type" | "reschedules">>,
  Assert<Missing<CartBookingLineItem, "booking_type">>,
  Assert<Missing<CartBookingLineItemInput, "booking_type">>,
  Assert<Missing<QuoteBookingLine, "booking_type">>,
  Assert<Equal<OrderBookingLineItem["tenant_location_id"], string>>,
  Assert<Equal<OrderBookingLineItem["total_interval"], TimeRange>>,
  Assert<Equal<OrderBookingLineItem["add_ons"], OrderBookingLineAddOn[]>>,
  Assert<Equal<OrderBookingLineItem["changes"], OrderBookingChange[]>>,
  Assert<Equal<OrderBookingLineAddOnPrice["type"], "free" | "listed">>,
  Assert<Equal<OrderBookingLineAddOnStatus["type"], "held" | "taken_off">>,
  Assert<Equal<OrderBookingChange["type"], OrderBookingChangeType>>,
  Assert<Equal<OrderBookingChangeType["type"], "line" | "add_on" | "add_on_added" | "offering_changed">>,
  Assert<RequiredField<CartBookingLineItemInput, "tenant_location_id">>,
  Assert<RequiredField<CartBookingLineItemInput, "resource">>,
  Assert<RequiredField<CartBookingLineItemInput, "add_ons">>,
  Assert<Equal<CartBookingLineItemInput["resource"], CartBookingLineResource>>,
  Assert<Equal<CartBookingLineResource, { type: "any" } | { type: "resource"; booking_resource_id: string }>>,
  Assert<Equal<CartBookingLineItemInput["add_ons"], CartBookingLineAddOnInput[]>>,
  Assert<Equal<CartBookingLineItem["add_ons"], CartBookingLineAddOn[]>>,
  Assert<Missing<CartBookingLineAddOnInput, "booking_offering_id">>,
  Assert<Equal<CartBookingLineAddOn["booking_offering_id"], string>>,
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
  Assert<Equal<Extract<QuoteBookingAvailability, { type: "history" }>, { type: "history"; plan: QuoteBookingPlan }>>,
  Assert<RequiredField<ResizeOrderBookingItemParams, "ends_at">>,
  Assert<Missing<BookingOffering, "max_per_day">>,
  Assert<Missing<CreateBookingOfferingParams, "max_per_day">>,
  Assert<Missing<UpdateBookingOfferingParams, "max_per_day">>,
  Assert<RequiredField<BookingResource, "daily_limits">>,
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
  Assert<Equal<Parameters<OrderApi["updateBookingItem"]>[0], UpdateOrderBookingItemParams>>,
  Assert<Equal<UpdateOrderBookingItemParams["update"], OrderBookingItemUpdate>>,
  Assert<Equal<OrderBookingItemUpdate["type"], "start" | "length" | "branch" | "offering" | "resource" | "add_on" | "add_add_on">>,
  Assert<RequiredField<UpdateOrderBookingItemParams, "notify_user">>,
  Assert<Equal<Parameters<OrderApi["takeOffBookingAddOn"]>[0], TakeOffOrderBookingAddOnParams>>,
  Assert<RequiredField<TakeOffOrderBookingAddOnParams, "credit_id">>,
  Assert<Equal<keyof Pick<OrderApi, "resizeBookingItem" | "cancelBookingSeries" | "rescheduleBookingSeries" | "stepBookingItem">, "resizeBookingItem" | "cancelBookingSeries" | "rescheduleBookingSeries" | "stepBookingItem">>,
  Assert<Missing<OrderApi, "markBookingItemWaiting" | "startBookingItem" | "attendBookingItem" | "markBookingItemNoShow">>,
  Assert<
    Equal<
      Extract<AuditAction, { action: "order_booking_line_item_reminder_requested" }>,
      { action: "order_booking_line_item_reminder_requested"; order_id: string; order_booking_line_item_id: string; notification_id: string }
    >
  >,
  Assert<Equal<Extract<AuditAction, { action: "tenant_plan_charge_settled" }>, { action: "tenant_plan_charge_settled"; tenant_plan_charge_id: string }>>,
  Assert<Equal<Extract<AuditAction, { action: "fiscal_receipt_delivery_requested" }>, { action: "fiscal_receipt_delivery_requested"; fiscal_receipt_id: string }>>,
  Assert<Equal<Extract<AuditAction, { action: "order_receipt_resend_requested" }>, { action: "order_receipt_resend_requested"; order_id: string }>>,
  Assert<
    Equal<
      Extract<AuditAction, { action: "invoice_reissued" }>,
      { action: "invoice_reissued"; order_id: string; invoice_id: string; reversal_id: string; new_invoice_id: string }
    >
  >,
  Assert<Equal<Extract<AuditSubjectType, "tenant_plan_charge">, "tenant_plan_charge">>,
];
