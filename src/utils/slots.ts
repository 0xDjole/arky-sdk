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
  durations: ServiceDuration[];
  timezone: string;
  slotInterval?: number;
}

// ============ Formatting ============

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

// ============ Helpers ============

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
  const before = timeline.filter((p) => p.timestamp <= from).sort((a, b) => b.timestamp - a.timestamp);
  if (before.length > 0 && before[0].concurrent >= limit) return true;

  for (const p of timeline) {
    if (p.timestamp >= from && p.timestamp < to && p.concurrent >= limit) return true;
  }
  return false;
}

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

  const specific = wt.specificDates?.find((s) => s.date === ts);
  if (specific) return specific.workingHours || [];

  const outcast = wt.outcastDates?.find((o) => o.month === m && o.day === d);
  if (outcast) return outcast.workingHours || [];

  return wt.workingDays?.find((w) => w.day === dayName)?.workingHours || [];
}

export function isTimeBlocked(from: number, to: number, timeline: TimelinePoint[], limit: number): boolean {
  return isBlocked(from, to, timeline, limit);
}

// ============ Core ============

export function computeSlotsForDate(opts: ComputeSlotsOptions): AvailableSlot[] {
  const { providers, date, durations, timezone, slotInterval } = opts;
  const total = getTotalDuration(durations);
  const interval = slotInterval || total;
  const slots: AvailableSlot[] = [];
  const nowTs = Math.floor(Date.now() / 1000);

  // Skip past dates entirely
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return [];

  const [year, month, day] = date.toLocaleDateString("en-CA", { timeZone: timezone }).split("-").map(Number);

  for (const p of providers) {
    for (const wh of getWorkingHoursForDate(p.workingTime, date, timezone)) {
      for (let m = wh.from; m + total <= wh.to; m += interval) {
        const from = toUtcTimestamp(year, month, day, m, timezone);
        const to = from + total * 60;
        // Skip slots in the past
        if (from < nowTs) continue;
        if (!isBlocked(from, to, p.timeline, p.concurrentLimit)) {
          slots.push({ from, to, providerId: p.id });
        }
      }
    }
  }

  return slots.sort((a, b) => a.from - b.from);
}

export function hasAvailableSlots(opts: ComputeSlotsOptions): boolean {
  return computeSlotsForDate(opts).length > 0;
}
