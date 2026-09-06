import {
  epochMilliseconds,
  epochMillisecondsFromDate,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "arky-sdk";
import type { EpochMilliseconds } from "arky-sdk";
import type { EpochMilliseconds as PublicEpochMilliseconds } from "arky-sdk/types";
import {
  epochMilliseconds as utilityEpochMilliseconds,
  epochMillisecondsToDate as utilityEpochMillisecondsToDate,
} from "arky-sdk/utils";
import type { EpochMilliseconds as UtilityEpochMilliseconds } from "arky-sdk/utils";
import type {
  Account,
  AnalyticsTimeRange,
  BookingCapacityClaim,
  BookingReminderScheduleItem,
  Cart,
  Customer,
  DateBlock,
  DateOverride,
  ExperimentResults,
  FormField,
  GetAvailabilityParams,
  GetOrdersParams,
  Money,
  NodeResult,
  Order,
  OrderShipment,
  Price,
  StoreSubscriptionCheckout,
  TimeRange,
} from "arky-sdk";
import type { StorefrontDto } from "arky-sdk/storefront";

const instant: EpochMilliseconds = epochMilliseconds(1_704_164_645_678);
const publicInstant: PublicEpochMilliseconds = instant;
const utilityInstant: UtilityEpochMilliseconds = publicInstant;
const rootInstant: EpochMilliseconds = utilityEpochMilliseconds(0);
const fromDate: EpochMilliseconds = epochMillisecondsFromDate(new Date(0));
const now: EpochMilliseconds = epochMillisecondsNow();
const date: Date = epochMillisecondsToDate(utilityInstant);
const utilityDate: Date = utilityEpochMillisecondsToDate(rootInstant);
const wireNumber: number = instant;
const durationMs: number = now - fromDate;

// @ts-expect-error A plain number is not a checked instant.
const uncheckedInstant: EpochMilliseconds = 1_704_164_645_678;
// @ts-expect-error A duration is not an absolute instant.
const durationAsInstant: EpochMilliseconds = durationMs;
// @ts-expect-error Arithmetic must pass an explicit checked instant constructor.
const uncheckedArithmetic: EpochMilliseconds = instant + 1_000;
// @ts-expect-error Date conversion requires an explicit checked instant.
epochMillisecondsToDate(1_704_164_645_678);
// @ts-expect-error Calendar-date strings are not numeric instants.
epochMilliseconds("2024-01-02");
// @ts-expect-error Date objects use the explicit Date adapter.
epochMilliseconds(new Date(0));
// @ts-expect-error The Date adapter does not accept ambiguous numeric input.
epochMillisecondsFromDate(1_704_164_645_678);

void [date, utilityDate, wireNumber, uncheckedInstant, durationAsInstant, uncheckedArithmetic];

type Assert<T extends true> = T;
type Checked<T> = NonNullable<T> extends EpochMilliseconds ? true : false;
type Unchecked<T> = number extends T ? true : false;
type ContractChecks = [
  Assert<Checked<Account["created_at"]>>,
  Assert<Checked<Customer["updated_at"]>>,
  Assert<Checked<Cart["last_action_at"]>>,
  Assert<Checked<Order["created_at"]>>,
  Assert<Checked<Order["booking_items"][number]["created_at"]>>,
  Assert<Checked<OrderShipment["tracking_status_at"]>>,
  Assert<Checked<TimeRange["from"]>>,
  Assert<Checked<TimeRange["to"]>>,
  Assert<Checked<BookingCapacityClaim["from"]>>,
  Assert<Checked<BookingReminderScheduleItem["due_at"]>>,
  Assert<Checked<GetAvailabilityParams["from"]>>,
  Assert<Checked<GetOrdersParams["created_at_from"]>>,
  Assert<Checked<AnalyticsTimeRange["to"]>>,
  Assert<Checked<ExperimentResults["freshness_at"]>>,
  Assert<Checked<StoreSubscriptionCheckout["trial_end"]>>,
  Assert<Checked<DateBlock["value"]>>,
  Assert<Checked<Extract<FormField, { type: "date" }>["value"]>>,
  Assert<Checked<NodeResult["started_at"]>>,
  Assert<Checked<StorefrontDto<Order>["created_at"]>>,
  Assert<Checked<StorefrontDto<Order>["booking_items"][number]["interval"]["from"]>>,
  Assert<Unchecked<Price["compare_at"]>>,
  Assert<Unchecked<Money["amount"]>>,
  Assert<Unchecked<NodeResult["duration_ms"]>>,
  Assert<Unchecked<BookingReminderScheduleItem["offset_minutes"]>>,
  Assert<DateOverride["local_date"] extends string ? true : false>,
  Assert<number extends Order["created_at"] ? false : true>,
  Assert<number extends GetAvailabilityParams["from"] ? false : true>,
];

const checkedRange: TimeRange = { from: instant, to: epochMilliseconds(instant + 1) };
const checkedDateBlock: DateBlock = { id: "date", key: "date", type: "date", value: instant };
void [checkedRange, checkedDateBlock];
