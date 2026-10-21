import type { EpochMilliseconds } from "../types/time";
import type { AvailabilityResponse } from "../types/product";
import { epochMilliseconds, epochMillisecondsToDate } from "../utils/time";

export function formatServiceTime(ts: EpochMilliseconds, tz: string, locale: string): string {
  return epochMillisecondsToDate(ts).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

export function formatServiceSlotTime(from: EpochMilliseconds, to: EpochMilliseconds, tz: string, locale: string): string {
  return `${formatServiceTime(from, tz, locale)} - ${formatServiceTime(to, tz, locale)}`;
}

export function calendarDateIn(ts: EpochMilliseconds, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    epochMillisecondsToDate(ts),
  );
  const part = (type: "year" | "month" | "day") => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function slotSpansDays(from: EpochMilliseconds, to: EpochMilliseconds, tz: string): boolean {
  return to - from > 0 && calendarDateIn(from, tz) !== calendarDateIn(epochMilliseconds(to - 1), tz);
}

export function formatServiceSlotRange(from: EpochMilliseconds, to: EpochMilliseconds, tz: string, locale: string): string {
  const format = (ts: EpochMilliseconds) =>
    epochMillisecondsToDate(ts).toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: tz });
  return `${format(from)} - ${format(to)}`;
}

export interface AvailableSlot {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  bookingResourceId: string;
  bookingOfferingId: string;
}

export function getSlotsForDate(
  availability: AvailabilityResponse | null,
  dateStr: string,
  bookingResourceId?: string | null,
): AvailableSlot[] {
  if (!availability) return [];
  const slots: AvailableSlot[] = [];
  for (const resource of availability.booking_resources) {
    if (bookingResourceId && resource.booking_resource_id !== bookingResourceId) continue;
    const day = resource.days.find((candidate) => candidate.date === dateStr);
    if (!day) continue;
    for (const slot of day.slots) {
      if (slot.spots > 0) {
        slots.push({
          from: slot.from,
          to: slot.to,
          bookingResourceId: resource.booking_resource_id,
          bookingOfferingId: resource.booking_offering_id,
        });
      }
    }
  }
  return slots.sort((a, b) => a.from - b.from);
}

export function hasAvailableSlotsForDate(
  availability: AvailabilityResponse | null,
  dateStr: string,
  bookingResourceId?: string | null,
): boolean {
  if (!availability) return false;
  return availability.booking_resources.some((resource) => {
    if (bookingResourceId && resource.booking_resource_id !== bookingResourceId) return false;
    const day = resource.days.find((candidate) => candidate.date === dateStr);
    return !!day?.slots.some((slot) => slot.spots > 0);
  });
}
