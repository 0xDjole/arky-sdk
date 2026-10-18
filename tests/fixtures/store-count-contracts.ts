import type { createAdmin } from "arky-sdk/admin";
import type {
  GetStoreCountReportParams,
  GetStoreStatusCountsParams,
  StoreCountDayType,
  StoreCountReportType,
  StoreCountSeriesRead,
  StoreCountTotal,
  StoreCountTotalRead,
  StoreStatusCount,
  StoreStatusCountSegments,
  StoreStatusCountType,
} from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Accepts<T, V> = V extends T ? true : false;
type Segment<Type extends StoreStatusCountType> = Extract<StoreStatusCount, { type: Type }>["segments"][number]["segment"];

export type StoreCountContracts = [
  Assert<Equal<StoreStatusCountSegments["open_recurring_members_by_status"], "awaiting_activation" | "active" | "blocked" | "paused">>,
  Assert<Equal<StoreStatusCountSegments["open_rentals_by_status"], "active" | "ending">>,
  Assert<
    Equal<
      StoreStatusCountSegments["open_payments_by_type"],
      "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "cash_on_delivery" | "manual"
    >
  >,
  Assert<Equal<StoreStatusCountSegments["open_shipments_by_type"], "fulfillment_job" | "fulfillment">>,
  Assert<Equal<Segment<"open_recurring_members_by_status">, StoreStatusCountSegments["open_recurring_members_by_status"]>>,
  Assert<Equal<Segment<"open_rentals_by_status">, StoreStatusCountSegments["open_rentals_by_status"]>>,
  Assert<Equal<Segment<"open_payments_by_type">, StoreStatusCountSegments["open_payments_by_type"]>>,
  Assert<Equal<Segment<"open_shipments_by_type">, StoreStatusCountSegments["open_shipments_by_type"]>>,
  Assert<Accepts<StoreCountDayType, "booked_slots_day">>,
  Assert<Equal<Extract<StoreCountReportType, `booked_slots_${string}`>, "booked_slots_day">>,
  Assert<Accepts<StoreCountTotalRead, { type: "booked_slots_day" }>>,
  Assert<Equal<Accepts<StoreCountTotalRead, { type: "booked_slots_day"; segment: string }>, false>>,
  Assert<Accepts<StoreCountSeriesRead, { type: "booked_slots_day" }>>,
  Assert<Accepts<StoreCountTotal["type"], "booked_slots_day">>,
  Assert<Equal<Accepts<StoreStatusCountType, "booked_slots_day">, false>>,
  Assert<Equal<Accepts<StoreCountReportType, "open_payments_by_type">, false>>,
  Assert<Equal<Parameters<Admin["counts"]["getStatuses"]>[0], GetStoreStatusCountsParams>>,
  Assert<Equal<Parameters<Admin["counts"]["getReport"]>[0], GetStoreCountReportParams>>,
];

export const openWork: GetStoreStatusCountsParams = {
  store_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
  types: [
    "open_recurring_members_by_status",
    "open_rentals_by_status",
    "open_payments_by_type",
    "open_shipments_by_type",
  ],
};

export const upcomingBookings: GetStoreCountReportParams = {
  store_id: "6d2b8f41-3a75-4c09-9e1d-7b5c2a8f0e36",
  from: "2026-10-17",
  to: "2027-10-16",
  totals: [{ type: "booked_slots_day" }],
};
