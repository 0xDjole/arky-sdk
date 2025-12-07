import type { ProviderWithTimeline, TimelinePoint } from "../types/api";

// ============ Types ============

export interface ServiceDuration {
  duration: number;
  isPause?: boolean;
}

export interface AvailableSlot {
  from: number;
  to: number;
  providerId: string;
}

export interface FormattedSlot extends AvailableSlot {
  id: string;
  timeText: string;
  dateText: string;
}

export interface ComputeSlotsOptions {
  providers: ProviderWithTimeline[];
  date: Date;
  durations: ServiceDuration[]; // e.g. [{duration:30}, {duration:10, isPause:true}, {duration:30}] = 70 min
  timezone: string;
  slotInterval?: number;
}

export interface ComputeMonthAvailabilityOptions {
  providers: ProviderWithTimeline[];
  year: number;
  month: number;
  durations: ServiceDuration[];
  timezone: string;
}

// ============ Formatting (display UTC timestamps in any timezone) ============

export function formatTime(ts: number, tz: string): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

export function formatSlotTime(from: number, to: number, tz: string): string {
  return `${formatTime(from, tz)} – ${formatTime(to, tz)}`;
}

export function formatSlots(slots: AvailableSlot[], tz: string): FormattedSlot[] {
  return slots.map((s, i) => ({
    ...s,
    id: `slot-${s.from}-${i}`,
    timeText: formatSlotTime(s.from, s.to, tz),
    dateText: new Date(s.from * 1000).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: tz,
    }),
  }));
}

// ============ Internal helpers ============

function getTzOffset(date: Date, tz: string): number {
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(date.toLocaleString("en-US", { timeZone: tz }));
  return (utc.getTime() - local.getTime()) / 60000;
}

function toUtcTimestamp(year: number, month: number, day: number, mins: number, tz: string): number {
  const midnight = new Date(Date.UTC(year, month - 1, day));
  const offset = getTzOffset(midnight, tz);
  return Math.floor(midnight.getTime() / 1000) + (mins + offset) * 60;
}

function isBlocked(from: number, to: number, timeline: TimelinePoint[], limit: number): boolean {
  // Check concurrent count at slot start
  const before = timeline.filter((p) => p.timestamp <= from).sort((a, b) => b.timestamp - a.timestamp);
  if (before.length > 0 && before[0].concurrent >= limit) return true;

  // Check if any point during slot exceeds limit
  for (const p of timeline) {
    if (p.timestamp >= from && p.timestamp < to && p.concurrent >= limit) return true;
  }
  return false;
}

// ============ Public API ============

export function getTotalDuration(durations: ServiceDuration[]): number {
  return durations.reduce((sum, d) => sum + d.duration, 0);
}

export function getWorkingHoursForDate(
  wt: ProviderWithTimeline["workingTime"],
  date: Date,
  tz: string
): { from: number; to: number }[] {
  if (!wt) return [];

  const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: tz }).toLowerCase();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const ts = Math.floor(date.getTime() / 1000);

  // Priority: specificDates > outcastDates > workingDays
  const specific = wt.specificDates?.find((s) => s.date === ts);
  if (specific) return specific.workingHours || [];

  const outcast = wt.outcastDates?.find((o) => o.month === m && o.day === d);
  if (outcast) return outcast.workingHours || [];

  return wt.workingDays?.find((w) => w.day === dayName)?.workingHours || [];
}

export function isTimeBlocked(from: number, to: number, timeline: TimelinePoint[], limit: number): boolean {
  return isBlocked(from, to, timeline, limit);
}

export function computeSlotsForDate(opts: ComputeSlotsOptions): AvailableSlot[] {
  const { providers, date, durations, timezone, slotInterval } = opts;
  const total = getTotalDuration(durations);
  const interval = slotInterval || total;
  const slots: AvailableSlot[] = [];

  const [year, month, day] = date.toLocaleDateString("en-CA", { timeZone: timezone }).split("-").map(Number);

  for (const p of providers) {
    for (const wh of getWorkingHoursForDate(p.workingTime, date, timezone)) {
      for (let m = wh.from; m + total <= wh.to; m += interval) {
        const from = toUtcTimestamp(year, month, day, m, timezone);
        const to = from + total * 60;
        if (!isBlocked(from, to, p.timeline, p.concurrentLimit)) {
          slots.push({ from, to, providerId: p.id });
        }
      }
    }
  }

  return slots.sort((a, b) => a.from - b.from);
}

export function getAvailableDatesForMonth(opts: ComputeMonthAvailabilityOptions): Set<string> {
  const { providers, year, month, durations, timezone } = opts;
  const result = new Set<string>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    if (date < today) continue;

    if (computeSlotsForDate({ providers, date, durations, timezone }).length > 0) {
      result.add(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }
  return result;
}

export function findFirstAvailableSlot(
  providers: ProviderWithTimeline[],
  durations: ServiceDuration[],
  timezone: string,
  fromDate = new Date(),
  maxDays = 90
): AvailableSlot | null {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < maxDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const slots = computeSlotsForDate({ providers, date, durations, timezone });
    if (slots.length > 0) return slots[0];
  }
  return null;
}

// ============ High-level API for frontends ============

export interface MonthAvailability {
  availableDates: string[];
  getSlots: (date: string | Date) => FormattedSlot[];
  firstAvailable: FormattedSlot | null;
}

export interface CreateAvailabilityOptions {
  providers: ProviderWithTimeline[];
  durations: ServiceDuration[];
  timezone: string;
  providerId?: string;
}

/**
 * Create availability helper for a month.
 * Returns available dates and a function to get formatted slots for any date.
 *
 * Usage:
 *   const avail = createMonthAvailability(providers, durations, tz, 2024, 11);
 *   calendar.forEach(day => day.available = avail.availableDates.includes(day.iso));
 *   const slots = avail.getSlots("2024-12-07"); // FormattedSlot[]
 */
export function createMonthAvailability(
  opts: CreateAvailabilityOptions,
  year: number,
  month: number
): MonthAvailability {
  const { providers, durations, timezone, providerId } = opts;
  const filtered = providerId ? providers.filter((p) => p.id === providerId) : providers;

  const dates = getAvailableDatesForMonth({ providers: filtered, year, month, durations, timezone });

  const getSlots = (date: string | Date): FormattedSlot[] => {
    const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
    return formatSlots(computeSlotsForDate({ providers: filtered, date: d, durations, timezone }), timezone);
  };

  const first = findFirstAvailableSlot(filtered, durations, timezone);

  return {
    availableDates: Array.from(dates),
    getSlots,
    firstAvailable: first ? formatSlots([first], timezone)[0] : null,
  };
}
