import { computed, map, type ReadableAtom } from "nanostores";
import type { StorefrontCart } from "../types/cart";
import type { PackageContext, PackagePriceRef, StorefrontPackageItemPrice } from "../types/package";
import type {
  AvailabilityResponse,
  BookingResourceAvailability,
  GetStorefrontAvailabilityParams,
  StorefrontBookingResource,
  StorefrontBookingService,
} from "../types/product";
import { ArkyError } from "../types/apiError";
import type { StorefrontClient } from "../index";
import { epochMilliseconds, epochMillisecondsToDate } from "../utils/time";
import { buyerParty, type CartStore } from "./cart";
import type {
  ArkyAddSlotToCartParams,
  ArkyBookingCalendarState,
  ArkyBookingSlot,
  ArkyCalendarDay,
  ArkySelectBookingResourceParams,
  ArkySelectBookingServiceParams,
  ArkySelectDateParams,
  ArkySelectSlotParams,
  ArkySetTimezoneParams,
} from "./types";
import {
  calendarDateIn,
  fileSlots,
  formatServiceSlotRange,
  formatServiceSlotTime,
  slotSpansDays,
  type AvailableSlot,
} from "./utils";

export interface BookingCalendarContext {
  client: StorefrontClient;
  locale: ReadableAtom<string>;
  requireLocale(): string;
}

const choicesPerRead = 100;
const offeringsPerRead = 1;
const dayMilliseconds = 24 * 60 * 60 * 1_000;

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function emptyState(): ArkyBookingCalendarState {
  return {
    booking_service: null,
    booking_choices: [],
    booking_choices_cursor: null,
    booking_resources: [],
    selected_booking_resource_id: null,
    availability: null,
    month: firstOfMonth(new Date()),
    days: [],
    selected_date: null,
    slots: [],
    selected_slot: null,
    timezone: null,
    loading: false,
    loading_choices: false,
  };
}

function mergeResources(current: StorefrontBookingResource[], added: StorefrontBookingResource[]): StorefrontBookingResource[] {
  return [...new Map([...current, ...added].map((resource) => [resource.id, resource])).values()];
}

function mergeChoices(current: StorefrontPackageItemPrice[], added: StorefrontPackageItemPrice[]): StorefrontPackageItemPrice[] {
  return [...new Map([...current, ...added].map((choice) => [choice.price_id, choice])).values()];
}

function choiceFor(current: ArkyBookingCalendarState, bookingOfferingId: string): StorefrontPackageItemPrice | null {
  return (
    current.booking_choices.find(
      (choice) => choice.sellable.type === "booking_offering" && choice.sellable.booking_offering_id === bookingOfferingId,
    ) ?? null
  );
}

function mergeAvailability(
  current: BookingResourceAvailability[],
  added: BookingResourceAvailability[],
): BookingResourceAvailability[] {
  return [...new Map([...current, ...added].map((resource) => [resource.booking_resource_id, resource])).values()];
}

function resourceAvailability(
  current: ArkyBookingCalendarState,
  bookingResourceId: string,
): BookingResourceAvailability | null {
  return current.availability?.booking_resources.find((resource) => resource.booking_resource_id === bookingResourceId) ?? null;
}

export function createBookingCalendar(context: BookingCalendarContext, cart: CartStore) {
  const { client, locale } = context;
  const scope = cart.scope;
  const shopPackage: PackageContext = { ...buyerParty(scope.buyer), package_id: scope.package_id };
  const state = map<ArkyBookingCalendarState>(emptyState());
  const month_label = computed([state, locale], (current, language) =>
    language ? current.month.toLocaleString(language, { month: "long", year: "numeric" }) : "",
  );

  let selectionRevision = 0;
  let availabilityRevision = 0;
  let filed: {
    availability: AvailabilityResponse | null;
    booking_resource_id: string | null;
    timezone: string | null;
    slots: Map<string, AvailableSlot[]>;
  } = { availability: null, booking_resource_id: null, timezone: null, slots: new Map() };

  function patch(values: Partial<ArkyBookingCalendarState>): void {
    state.set({ ...state.get(), ...values });
  }

  function filedSlots(current: ArkyBookingCalendarState): Map<string, AvailableSlot[]> {
    if (
      filed.availability !== current.availability ||
      filed.booking_resource_id !== current.selected_booking_resource_id ||
      filed.timezone !== current.timezone
    ) {
      filed = {
        availability: current.availability,
        booking_resource_id: current.selected_booking_resource_id,
        timezone: current.timezone,
        slots: fileSlots(current.availability, current.selected_booking_resource_id, current.timezone),
      };
    }
    return filed.slots;
  }

  function openingMonth(service: StorefrontBookingService): Date {
    const ends = cart.booking_items
      .get()
      .filter((item) => item.price.package_item_id === service.package_item_id)
      .map((item) => item.requested_interval.to);
    return firstOfMonth(ends.length ? epochMillisecondsToDate(epochMilliseconds(Math.max(...ends))) : new Date());
  }

  function days(current: ArkyBookingCalendarState): ArkyCalendarDay[] {
    const slots = filedSlots(current);
    const range = current.selected_slot?.is_multi_day
      ? {
          from: calendarDateIn(current.selected_slot.from, current.selected_slot.timezone),
          to: calendarDateIn(epochMilliseconds(current.selected_slot.to - 1), current.selected_slot.timezone),
        }
      : null;
    const year = current.month.getFullYear();
    const monthIndex = current.month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const blank: ArkyCalendarDay = {
      date: new Date(0),
      iso: "",
      available: false,
      is_selected: false,
      is_in_range: false,
      is_today: false,
      blank: true,
    };
    const cells: ArkyCalendarDay[] = [];
    const pad = (first.getDay() + 6) % 7;
    for (let index = 0; index < pad; index++) cells.push({ ...blank });
    for (let day = 1; day <= last.getDate(); day++) {
      const date = new Date(year, monthIndex, day);
      const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        date,
        iso,
        available: (slots.get(iso)?.length ?? 0) > 0,
        is_selected: iso === current.selected_date,
        is_in_range: range !== null && iso >= range.from && iso <= range.to,
        is_today: date.getTime() === today.getTime(),
        blank: false,
      });
    }
    const suffix = (7 - (cells.length % 7)) % 7;
    for (let index = 0; index < suffix; index++) cells.push({ ...blank });
    return cells;
  }

  function slotsFor(current: ArkyBookingCalendarState, date: string): ArkyBookingSlot[] {
    const service = current.booking_service;
    if (!service) return [];
    const language = context.requireLocale();
    return (filedSlots(current).get(date) ?? []).flatMap((slot, index) => {
      const choice = choiceFor(current, slot.bookingOfferingId);
      if (!choice) return [];
      const multiDay = slotSpansDays(slot.from, slot.to, slot.timezone);
      const priceRef: PackagePriceRef = {
        package_id: scope.package_id,
        package_item_id: service.package_item_id,
        price_id: choice.price_id,
      };
      return [
        {
          id: `${slot.bookingOfferingId}-${slot.from}-${index}`,
          booking_service_id: service.id,
          booking_resource_id: slot.bookingResourceId,
          booking_offering_id: slot.bookingOfferingId,
          price_ref: priceRef,
          price: choice.price,
          from: slot.from,
          to: slot.to,
          timezone: slot.timezone,
          is_multi_day: multiDay,
          time_text: multiDay
            ? formatServiceSlotRange(slot.from, slot.to, slot.timezone, language)
            : formatServiceSlotTime(slot.from, slot.to, slot.timezone, language),
          date_text: epochMillisecondsToDate(slot.from).toLocaleDateString(language, {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: slot.timezone,
          }),
        },
      ];
    });
  }

  function refresh(): void {
    const current = state.get();
    const slots = current.selected_date ? slotsFor(current, current.selected_date) : [];
    const selected = current.selected_slot ? slots.find((slot) => slot.id === current.selected_slot?.id) ?? null : null;
    const next = { ...current, slots, selected_slot: selected };
    state.set({ ...next, days: days(next) });
  }

  async function readAvailability(params: GetStorefrontAvailabilityParams): Promise<AvailabilityResponse> {
    const response = await client.eshop.bookingService.getAvailability(params);
    if (response.from !== params.from || response.to !== params.to) {
      throw new ArkyError("answer_mismatch", "Availability came back for another time range");
    }
    if (params.cursor && response.cursor === params.cursor) throw new ArkyError("answer_mismatch", "Availability paging didn't advance");
    return response;
  }

  async function loadMonth(): Promise<void> {
    const current = state.get();
    const service = current.booking_service;
    if (!service) return;
    const requestRevision = ++availabilityRevision;
    const selection = selectionRevision;
    const stale = () => selection !== selectionRevision || requestRevision !== availabilityRevision;
    patch({ loading: true, availability: null });
    try {
      const from = epochMilliseconds(Date.UTC(current.month.getFullYear(), current.month.getMonth(), 1) - dayMilliseconds);
      const to = epochMilliseconds(Date.UTC(current.month.getFullYear(), current.month.getMonth() + 1, 1) + dayMilliseconds);
      let availability: AvailabilityResponse | null = null;
      let cursor: string | null = null;
      do {
        const page: AvailabilityResponse = await readAvailability({
          ...shopPackage,
          booking_service_id: service.id,
          from,
          to,
          limit: offeringsPerRead,
          ...(cursor === null ? {} : { cursor }),
          ...(current.selected_booking_resource_id ? { booking_resource_id: current.selected_booking_resource_id } : {}),
        });
        if (stale()) return;
        const resources = await readResources(page);
        if (stale()) return;
        patch({ booking_resources: mergeResources(state.get().booking_resources, resources) });
        availability =
          availability === null
            ? page
            : { ...page, booking_resources: mergeAvailability(availability.booking_resources, page.booking_resources) };
        cursor = page.cursor;
      } while (cursor !== null);
      patch({ availability });
      refresh();
    } finally {
      if (!stale()) patch({ loading: false });
    }
  }

  async function readResources(availability: AvailabilityResponse): Promise<StorefrontBookingResource[]> {
    const known = new Set(state.get().booking_resources.map((resource) => resource.id));
    const missing = new Map<string, string>();
    for (const resource of availability.booking_resources) {
      if (!known.has(resource.booking_resource_id)) missing.set(resource.booking_resource_id, resource.booking_offering_id);
    }
    const read = await Promise.all(
      [...missing].map(([id, offeringId]) => client.eshop.bookingResource.get({ ...shopPackage, id, offering_id: offeringId })),
    );
    for (const resource of read) {
      if (!missing.has(resource.id)) throw new ArkyError("answer_mismatch", "A booking resource read answered another resource");
    }
    return read;
  }

  async function readChoices(packageItemId: string, cursor: string | null) {
    const page = await client.eshop.packageItem.findPrices({
      ...shopPackage,
      package_item_id: packageItemId,
      include_price: true,
      limit: choicesPerRead,
      ...(cursor === null ? {} : { cursor }),
    });
    if (cursor !== null && page.cursor === cursor) throw new ArkyError("answer_mismatch", "Price paging didn't advance");
    return page;
  }

  function clearSelection(): Partial<ArkyBookingCalendarState> {
    return { selected_date: null, slots: [], selected_slot: null };
  }

  function assertBookable(current: ArkyBookingCalendarState, slot: ArkyBookingSlot): void {
    const resource = resourceAvailability(current, slot.booking_resource_id);
    if (!resource || resource.booking_offering_id !== slot.booking_offering_id) {
      throw new TypeError(`Booking resource ${slot.booking_resource_id} has no matching offering`);
    }
    if (choiceFor(current, slot.booking_offering_id)?.price_id !== slot.price_ref.price_id) {
      throw new TypeError(`Booking offering ${slot.booking_offering_id} has no matching price in this package`);
    }
  }

  return {
    scope,
    state,
    month_label,

    async select(params: ArkySelectBookingServiceParams): Promise<ArkyBookingCalendarState> {
      const selection = ++selectionRevision;
      availabilityRevision += 1;
      patch({
        booking_service: null,
        booking_choices: [],
        booking_choices_cursor: null,
        booking_resources: [],
        selected_booking_resource_id: null,
        availability: null,
        ...clearSelection(),
        loading: true,
        loading_choices: false,
      });
      try {
        const service = await client.eshop.bookingService.get({ ...shopPackage, id: params.booking_service_id });
        if (service.id !== params.booking_service_id) throw new ArkyError("answer_mismatch", "The booking service read answered another service");
        const page = await readChoices(service.package_item_id, null);
        if (selection !== selectionRevision) return state.get();
        patch({
          booking_service: service,
          booking_choices: page.items,
          booking_choices_cursor: page.cursor,
          month: openingMonth(service),
          loading: false,
        });
        await loadMonth();
        return state.get();
      } catch (error) {
        if (selection === selectionRevision) patch({ loading: false });
        throw error;
      }
    },

    async loadMoreChoices(): Promise<ArkyBookingCalendarState> {
      const current = state.get();
      if (!current.booking_service || !current.booking_choices_cursor || current.loading_choices) return current;
      const service = current.booking_service;
      const selection = selectionRevision;
      patch({ loading_choices: true });
      try {
        const page = await readChoices(service.package_item_id, current.booking_choices_cursor);
        const latest = state.get();
        if (selection !== selectionRevision || latest.booking_service?.id !== service.id) return latest;
        patch({
          booking_choices: mergeChoices(latest.booking_choices, page.items),
          booking_choices_cursor: page.cursor,
        });
        refresh();
      } finally {
        if (selection === selectionRevision) patch({ loading_choices: false });
      }
      return state.get();
    },

    async prevMonth(): Promise<ArkyBookingCalendarState> {
      const { month } = state.get();
      patch({ month: new Date(month.getFullYear(), month.getMonth() - 1, 1) });
      await loadMonth();
      return state.get();
    },

    async nextMonth(): Promise<ArkyBookingCalendarState> {
      const { month } = state.get();
      patch({ month: new Date(month.getFullYear(), month.getMonth() + 1, 1) });
      await loadMonth();
      return state.get();
    },

    async selectResource(params: ArkySelectBookingResourceParams): Promise<ArkyBookingCalendarState> {
      const current = state.get();
      if (params.booking_resource_id && !resourceAvailability(current, params.booking_resource_id)) {
        throw new TypeError(`Booking resource ${params.booking_resource_id} has no offering for the selected booking service`);
      }
      patch({ selected_booking_resource_id: params.booking_resource_id, ...clearSelection() });
      await loadMonth();
      return state.get();
    },

    setTimezone(params: ArkySetTimezoneParams): void {
      patch({ timezone: params.timezone, selected_slot: null });
      refresh();
    },

    selectDate(params: ArkySelectDateParams): void {
      patch({ selected_date: params.date, selected_slot: null });
      refresh();
    },

    selectFirstAvailableDate(): void {
      const first = state.get().days.find((day) => !day.blank && day.available);
      if (!first) return;
      patch({ selected_date: first.iso, selected_slot: null });
      refresh();
    },

    selectSlot(params: ArkySelectSlotParams): void {
      const current = state.get();
      const slot = params.slot;
      if (slot) {
        if (!current.booking_service || slot.booking_service_id !== current.booking_service.id) {
          throw new TypeError("The slot doesn't belong to the selected booking service");
        }
        if (current.selected_booking_resource_id && slot.booking_resource_id !== current.selected_booking_resource_id) {
          throw new TypeError("The slot doesn't belong to the selected booking resource");
        }
        assertBookable(current, slot);
      }
      const next = { ...current, selected_slot: slot };
      state.set({ ...next, days: days(next) });
    },

    async addToCart(params: ArkyAddSlotToCartParams): Promise<StorefrontCart> {
      const current = state.get();
      const { slot } = params;
      if (!current.booking_service || slot.booking_service_id !== current.booking_service.id) {
        throw new TypeError("The slot doesn't belong to the selected booking service");
      }
      assertBookable(current, slot);
      await cart.ensure();
      const result = await cart.addBooking({
        ...(params.id !== undefined ? { id: params.id } : {}),
        booking_offering_id: slot.booking_offering_id,
        requested_interval: { from: slot.from, to: slot.to },
        capacity_units: params.capacity_units ?? 1,
        form_submission_id: params.form_submission_id ?? null,
        price: slot.price_ref,
        session: params.session ?? null,
      });
      patch(clearSelection());
      refresh();
      return result;
    },
  };
}

export type BookingCalendar = ReturnType<typeof createBookingCalendar>;
