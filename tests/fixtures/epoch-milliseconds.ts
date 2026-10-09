import {
  epochMilliseconds,
  epochMillisecondsFromDate,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "arky-sdk";
import type { EpochMilliseconds } from "arky-sdk";
import type { EpochMilliseconds as PublicEpochMilliseconds, CalendarDate } from "arky-sdk/types";
import {
  epochMilliseconds as utilityEpochMilliseconds,
  epochMillisecondsToDate as utilityEpochMillisecondsToDate,
} from "arky-sdk/utils";
import type { EpochMilliseconds as UtilityEpochMilliseconds } from "arky-sdk/utils";
import type {
  Account,
  AnalyticsTimeRange,
  BookingCapacityClaim,
  BookingOffering,
  Cart,
  Customer,
  DateBlock,
  DateTimeBlock,
  DaySlots,
  ExperimentResults,
  FindOrdersParams,
  FormAnswer,
  GetAvailabilityParams,
  Money,
  Order,
  Fulfillment,
  Price,
  StoreSubscriptionPaymentAction,
  TimeRange,
} from "arky-sdk";

const instant: EpochMilliseconds = epochMilliseconds(1_704_164_645_678);
const publicInstant: PublicEpochMilliseconds = instant;
const utilityInstant: UtilityEpochMilliseconds = publicInstant;
const rootInstant: EpochMilliseconds = utilityEpochMilliseconds(0);
const fromDate: EpochMilliseconds = epochMillisecondsFromDate(new Date(0));
const now: EpochMilliseconds = epochMillisecondsNow();
const date: Date = epochMillisecondsToDate(utilityInstant);
const utilityDate: Date = utilityEpochMillisecondsToDate(rootInstant);
const wireNumber: number = instant;
const durationMs = now - fromDate;
const shiftedInstant = instant + 1_000;

void [date, utilityDate, wireNumber];

type Assert<T extends true> = T;
type Checked<T> = NonNullable<T> extends EpochMilliseconds ? true : false;
type Unchecked<T> = number extends T ? true : false;
type DeliveredStatus = Extract<Extract<Fulfillment["type"], { type: "delivery" }>["status"], { type: "delivered" }>;

export type ContractChecks = [
  Assert<number extends EpochMilliseconds ? false : true>,
  Assert<typeof durationMs extends EpochMilliseconds ? false : true>,
  Assert<typeof shiftedInstant extends EpochMilliseconds ? false : true>,
  Assert<number extends Parameters<typeof epochMillisecondsToDate>[0] ? false : true>,
  Assert<string extends Parameters<typeof epochMilliseconds>[0] ? false : true>,
  Assert<Date extends Parameters<typeof epochMilliseconds>[0] ? false : true>,
  Assert<number extends Parameters<typeof epochMillisecondsFromDate>[0] ? false : true>,
  Assert<Checked<Account["created_at"]>>,
  Assert<Checked<Customer["updated_at"]>>,
  Assert<Checked<Cart["updated_at"]>>,
  Assert<Checked<Order["created_at"]>>,
  Assert<Checked<Order["line_items"][number]["created_at"]>>,
  Assert<Checked<DeliveredStatus["delivered_at"]>>,
  Assert<Checked<TimeRange["from"]>>,
  Assert<Checked<TimeRange["to"]>>,
  Assert<Checked<BookingCapacityClaim["from"]>>,
  Assert<Checked<GetAvailabilityParams["from"]>>,
  Assert<Checked<FindOrdersParams["created_at_from"]>>,
  Assert<Checked<AnalyticsTimeRange["to"]>>,
  Assert<Checked<ExperimentResults["freshness_at"]>>,
  Assert<Checked<Extract<StoreSubscriptionPaymentAction, { type: "stripe_embedded_checkout" }>["expires_at"]>>,
  Assert<Checked<DateTimeBlock["value"]>>,
  Assert<Checked<Extract<FormAnswer, { type: "date_time" }>["value"]>>,
  Assert<Checked<Extract<Order["line_items"][number], { type: "booking" }>["interval"]["from"]>>,
  Assert<Unchecked<Price["compare_at"]>>,
  Assert<Unchecked<Money["amount"]>>,
  Assert<Unchecked<BookingOffering["reminder_offsets_minutes"][number]>>,
  Assert<NonNullable<DateBlock["value"]> extends CalendarDate ? true : false>,
  Assert<NonNullable<DateBlock["value"]> extends EpochMilliseconds ? false : true>,
  Assert<Extract<FormAnswer, { type: "date" }>["value"] extends CalendarDate ? true : false>,
  Assert<DaySlots["date"] extends CalendarDate ? true : false>,
  Assert<keyof BookingOffering["date_overrides"] extends string ? true : false>,
  Assert<number extends Order["created_at"] ? false : true>,
  Assert<number extends GetAvailabilityParams["from"] ? false : true>,
];

const checkedRange: TimeRange = { from: instant, to: epochMilliseconds(instant + 1) };
const checkedDateBlock: DateBlock = { id: "date", key: "date", type: "date", value: "2024-01-02" };
const checkedMomentBlock: DateTimeBlock = { id: "moment", key: "moment", type: "date_time", value: instant };
void [checkedRange, checkedDateBlock, checkedMomentBlock];
