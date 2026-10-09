import type { EpochMilliseconds } from "../types/time";

export function epochMilliseconds(value: number): EpochMilliseconds {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Epoch milliseconds must be a signed safe integer");
  }
  return value as EpochMilliseconds;
}

export function epochMillisecondsFromDate(value: Date): EpochMilliseconds {
  return epochMilliseconds(value.getTime());
}

export function epochMillisecondsNow(): EpochMilliseconds {
  return epochMilliseconds(Date.now());
}

export function epochMillisecondsToDate(value: EpochMilliseconds): Date {
  const date = new Date(epochMilliseconds(value));
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError("Epoch milliseconds are outside the JavaScript Date range");
  }
  return date;
}
