import { map } from "nanostores";
import type { ProviderWithTimeline, Slot, TimelinePoint } from "../types/api";

interface ServiceDuration {
  duration: number;
  isPause?: boolean;
}

interface AvailableSlot {
  from: number;
  to: number;
  providerId: string;
}

function formatTime(ts: number, tz: string): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

function formatSlotTime(from: number, to: number, tz: string): string {
  return `${formatTime(from, tz)} – ${formatTime(to, tz)}`;
}

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

function getTotalDuration(durations: ServiceDuration[]): number {
  return durations.reduce((sum, d) => sum + d.duration, 0);
}

function getWorkingHoursForDate(
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

function computeSlotsForDate(opts: {
  providers: ProviderWithTimeline[];
  date: Date;
  durations: ServiceDuration[];
  timezone: string;
  slotInterval?: number;
}): AvailableSlot[] {
  const { providers, date, durations, timezone, slotInterval } = opts;
  const total = getTotalDuration(durations);
  const interval = slotInterval || total;
  const slots: AvailableSlot[] = [];
  const nowTs = Math.floor(Date.now() / 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return [];
  const [year, month, day] = date.toLocaleDateString("en-CA", { timeZone: timezone }).split("-").map(Number);
  for (const p of providers) {
    for (const wh of getWorkingHoursForDate(p.workingTime, date, timezone)) {
      for (let m = wh.from; m + total <= wh.to; m += interval) {
        const from = toUtcTimestamp(year, month, day, m, timezone);
        const to = from + total * 60;
        if (from < nowTs) continue;
        if (!isBlocked(from, to, p.timeline, p.concurrentLimit)) {
          slots.push({ from, to, providerId: p.id });
        }
      }
    }
  }
  return slots.sort((a, b) => a.from - b.from);
}

function hasAvailableSlots(opts: {
  providers: ProviderWithTimeline[];
  date: Date;
  durations: ServiceDuration[];
  timezone: string;
}): boolean {
  return computeSlotsForDate(opts).length > 0;
}

export interface CalendarDay {
  date: Date;
  iso: string;
  available: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isToday: boolean;
  blank: boolean;
}

export interface ReservationEngineState {
  service: any | null;
  providers: ProviderWithTimeline[];
  selectedProvider: ProviderWithTimeline | null;
  selectedMethod: string | null;
  currentMonth: Date;
  calendar: CalendarDay[];
  selectedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  slots: Slot[];
  selectedSlot: Slot | null;
  cart: Slot[];
  timezone: string;
  loading: boolean;
}

export interface ReservationEngineConfig {
  timezone?: string;
}

export interface ReservationApiMethods {
  getService: (params: { id: string }) => Promise<any>;
  getServiceProviders: (params: { serviceId: string; from: number; to: number }) => Promise<ProviderWithTimeline[]>;
  getProviders: (params: { serviceId?: string; limit?: number }) => Promise<{ items: any[] }>;
  checkout: (params: any) => Promise<any>;
  getQuote: (params: any) => Promise<any>;
}

const createInitialState = (timezone: string): ReservationEngineState => ({
  service: null,
  providers: [],
  selectedProvider: null,
  selectedMethod: null,
  currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  calendar: [],
  selectedDate: null,
  startDate: null,
  endDate: null,
  slots: [],
  selectedSlot: null,
  cart: [],
  timezone,
  loading: false,
});

export const createReservationEngine = (
  api: ReservationApiMethods,
  config: ReservationEngineConfig = {}
) => {
  const timezone = config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const store = map<ReservationEngineState>(createInitialState(timezone));

  const getServiceDurations = (): ServiceDuration[] => {
    const state = store.get();
    if (!state.service?.durations?.length) return [{ duration: 60, isPause: false }];
    return state.service.durations.map((d: any) => ({
      duration: d.duration,
      isPause: d.isPause || d.is_pause || false,
    }));
  };

  const buildCalendar = (): CalendarDay[] => {
    const state = store.get();
    const { currentMonth, selectedDate, startDate, endDate, providers, selectedProvider, timezone } = state;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: CalendarDay[] = [];
    const pad = (first.getDay() + 6) % 7;

    for (let i = 0; i < pad; i++) {
      cells.push({ date: new Date(0), iso: "", available: false, isSelected: false, isInRange: false, isToday: false, blank: true });
    }

    const activeProviders = selectedProvider ? providers.filter(p => p.id === selectedProvider.id) : providers;
    const durations = getServiceDurations();

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const available = activeProviders.length > 0 && hasAvailableSlots({ providers: activeProviders, date, durations, timezone });
      const isToday = date.getTime() === today.getTime();
      const isSelected = iso === selectedDate || iso === startDate || iso === endDate;
      let isInRange = false;
      if (startDate && endDate) {
        const t = date.getTime();
        isInRange = t > new Date(startDate).getTime() && t < new Date(endDate).getTime();
      }
      cells.push({ date, iso, available, isSelected, isInRange, isToday, blank: false });
    }

    const suffix = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < suffix; i++) {
      cells.push({ date: new Date(0), iso: "", available: false, isSelected: false, isInRange: false, isToday: false, blank: true });
    }

    return cells;
  };

  const computeSlots = (dateStr: string): Slot[] => {
    const state = store.get();
    const { providers, selectedProvider, timezone, service } = state;
    const date = new Date(dateStr + "T00:00:00");
    const activeProviders = selectedProvider ? providers.filter(p => p.id === selectedProvider.id) : providers;
    const raw = computeSlotsForDate({ providers: activeProviders, date, durations: getServiceDurations(), timezone });

    return raw.map((s, i) => ({
      id: `${service?.id}-${s.from}-${i}`,
      serviceId: service?.id || "",
      providerId: s.providerId,
      from: s.from,
      to: s.to,
      timeText: formatSlotTime(s.from, s.to, timezone),
      dateText: new Date(s.from * 1000).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: timezone }),
    }));
  };

  const actions = {
    setTimezone(tz: string) {
      store.setKey("timezone", tz);
      store.setKey("calendar", buildCalendar());
      const state = store.get();
      if (state.selectedDate) {
        store.setKey("slots", computeSlots(state.selectedDate));
        store.setKey("selectedSlot", null);
      }
    },

    async setService(serviceId: string) {
      store.setKey("loading", true);
      try {
        const service = await api.getService({ id: serviceId });

        store.set({
          ...store.get(),
          service,
          selectedMethod: service.reservationMethods?.length === 1 ? service.reservationMethods[0] : null,
          selectedProvider: null,
          providers: [],
          selectedDate: null,
          startDate: null,
          endDate: null,
          slots: [],
          selectedSlot: null,
          currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          loading: false,
        });

        await actions.loadMonth();
      } catch (e) {
        store.setKey("loading", false);
        throw e;
      }
    },

    async loadMonth() {
      const state = store.get();
      if (!state.service) return;
      store.setKey("loading", true);

      try {
        const { currentMonth, service } = state;
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const from = Math.floor(new Date(year, month, 1).getTime() / 1000);
        const to = Math.floor(new Date(year, month + 1, 0, 23, 59, 59).getTime() / 1000);

        const providers = await api.getServiceProviders({ serviceId: service.id, from, to });
        store.setKey("providers", providers || []);
        store.setKey("calendar", buildCalendar());
      } finally {
        store.setKey("loading", false);
      }
    },

    prevMonth() {
      const { currentMonth } = store.get();
      store.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      actions.loadMonth();
    },

    nextMonth() {
      const { currentMonth } = store.get();
      store.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      actions.loadMonth();
    },

    selectMethod(method: string) {
      store.set({
        ...store.get(),
        selectedMethod: method,
        selectedProvider: null,
        selectedDate: null,
        startDate: null,
        endDate: null,
        slots: [],
        selectedSlot: null,
      });
      store.setKey("calendar", buildCalendar());
    },

    selectProvider(provider: ProviderWithTimeline | null) {
      store.set({
        ...store.get(),
        selectedProvider: provider,
        selectedDate: null,
        startDate: null,
        endDate: null,
        slots: [],
        selectedSlot: null,
      });
      store.setKey("calendar", buildCalendar());
    },

    selectDate(day: CalendarDay) {
      if (day.blank || !day.available) return;
      const state = store.get();
      const slots = computeSlots(day.iso);
      store.set({ ...state, selectedDate: day.iso, slots, selectedSlot: null });
      store.setKey("calendar", buildCalendar());
    },

    selectSlot(slot: Slot) {
      store.setKey("selectedSlot", slot);
    },

    findFirstAvailable() {
      const state = store.get();
      for (const day of state.calendar) {
        if (!day.blank && day.available) {
          actions.selectDate(day);
          return;
        }
      }
    },

    updateCalendar() {
      store.setKey("calendar", buildCalendar());
    },

    addToCart() {
      const state = store.get();
      if (!state.selectedSlot) return;
      store.set({
        ...state,
        cart: [...state.cart, state.selectedSlot],
        selectedDate: null,
        startDate: null,
        endDate: null,
        slots: [],
        selectedSlot: null,
      });
      store.setKey("calendar", buildCalendar());
    },

    removeFromCart(slotId: string) {
      const state = store.get();
      store.setKey("cart", state.cart.filter(s => s.id !== slotId));
    },

    clearCart() {
      store.setKey("cart", []);
    },

    async checkout(options: { paymentMethod?: string; blocks?: any[]; promoCode?: string } = {}) {
      const state = store.get();
      if (!state.cart.length) throw new Error("Cart is empty");
      store.setKey("loading", true);

      try {
        const result = await api.checkout({
          items: state.cart.map((s: any) => ({
            serviceId: s.serviceId,
            providerId: s.providerId,
            from: s.from,
            to: s.to,
            blocks: s.serviceBlocks || [],
            reservationMethod: s.reservationMethod || state.selectedMethod || "STANDARD",
          })),
          paymentMethod: options.paymentMethod,
          promoCode: options.promoCode ?? null,
          blocks: options.blocks || [],
        });
        store.setKey("cart", []);
        return result;
      } finally {
        store.setKey("loading", false);
      }
    },

    async getQuote(options: { paymentMethod?: string; promoCode?: string } = {}) {
      const state = store.get();
      if (!state.cart.length) return null;
      return api.getQuote({
        items: state.cart.map(s => ({ serviceId: s.serviceId })),
        paymentMethod: options.paymentMethod || "CASH",
        promoCode: options.promoCode,
      });
    },

    async getProvidersList() {
      const state = store.get();
      if (!state.service) return [];
      const response = await api.getProviders({ serviceId: state.service.id, limit: 100 });
      return response?.items || [];
    },
  };

  return { store, ...actions };
};

export type ReservationEngine = ReturnType<typeof createReservationEngine>;
