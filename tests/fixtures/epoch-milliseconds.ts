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
