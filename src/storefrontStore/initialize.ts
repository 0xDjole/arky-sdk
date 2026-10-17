import { atom, computed, map } from "nanostores";
import type { EpochMilliseconds } from "../types/time";
import type { RequestOptions } from "../types/api";
import type { Cart, CartQuote, CheckoutAcceptance } from "../types/cart";
import { CartSelectionError } from "../types/cartSelection";
import type { CatalogReadOptions } from "../types/catalog";
import type { Collection, Entry } from "../types/content";
import type { LoadContentEntriesParams, LoadContentParams, LoadedContent, LoadedContentFor } from "../types/contentView";
import type { TrackCustomerActionParams } from "../types/customerAction";
import type { ExperimentUseResponse, UseExperimentParams } from "../types/experiment";
import type { Form, GetStorefrontFormParams, StorefrontFormSubmission } from "../types/forms";
import type {
  FindStorefrontBookingResourcesParams,
  FindStorefrontBookingServicesParams,
  FindStorefrontProductsParams,
  GetStorefrontAvailabilityParams,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontProduct,
} from "../types/product";
import type { PaginatedResponse } from "../types/common";
import type { StorefrontMarket, StorefrontSetup } from "../types/storefront";
import { isOrderToken } from "../utils/orderToken";
import { requireId } from "../utils/ids";
import { epochMilliseconds, epochMillisecondsToDate } from "../utils/time";
import {
  createStorefront,
  type StorefrontClient,
  type StorefrontCustomerSession,
  type SubmitFormInput,
} from "../index";
import { cartScopeKey, createCartStore, type CartScope, type CartStore, type CartStoreContext } from "./cart";
import { createCheckoutFlow, type CheckoutFlow } from "./checkoutFlow";
import type {
  ArkyBookingCartItem,
  ArkyBookingServiceState,
  ArkyBookingSlot,
  ArkyCalendarDay,
  ArkyCartCheckoutInput,
  ArkyCartScope,
  ArkyContentEntryParams,
  ArkyContentState,
  ArkyEshopState,
  ArkyFormsState,
  ArkyStoreConfig,
  ArkyStoreContext,
  ArkySubmitFormByKeyParams,
} from "./types";
import {
  bookingServiceName,
  buildFormAnswers,
  calendarDateIn,
  createBookingServiceInitialState,
  formatServiceSlotRange,
  formatServiceSlotTime,
  getSlotsForDate,
  hasAvailableSlotsForDate,
  normalizeTimezoneGroups,
  readErrorMessage,
  slotSpansDays,
} from "./utils";

function initializeStoreCore(publishableKey: string, config: ArkyStoreConfig) {
  const client = createStorefront(publishableKey, config);
  const session = atom<StorefrontCustomerSession | null>(client.session);
  const setup = atom<StorefrontSetup | null>(null);
  const locale = atom(client.getLocale());
  const market_key = atom(client.getMarket());
  const resolvedMarket = atom<StorefrontMarket | null>(null);
  const market = computed([market_key, resolvedMarket], (key, value) => (key && value?.key === key ? value : null));
  const currency = computed(market, (value) => value?.currency ?? null);
  const allowed_payment_option_ids = computed(market, (value) => value?.payment_option_ids ?? []);

  let contextRevision = 0;
  let sessionRequest: Promise<StorefrontCustomerSession | null> | null = null;

  const content_state = map<ArkyContentState>({ entries: {}, loading: false, error: null });
  const forms_state = map<ArkyFormsState>({ forms: {}, loading: false, error: null });
  const eshop_state = map<ArkyEshopState>({
    products: [],
    bookingServices: [],
    bookingResources: [],
    product_cursor: null,
    booking_service_cursor: null,
    booking_resource_cursor: null,
    availability: null,
    loading_products: false,
    loading_booking_services: false,
    loading_booking_resources: false,
    loading_availability: false,
    error: null,
  });
  const booking_service_state = map<ArkyBookingServiceState>(createBookingServiceInitialState());

  const cartStores = new Set<CartStore>();
  const cartInvalidators = new Set<() => void>();
  const scopedCarts = new Map<string, CartStore>();
  const checkoutFlows = new Map<string, CheckoutFlow>();

  function invalidateContext(): void {
    contextRevision += 1;
    for (const invalidate of cartInvalidators) invalidate();
  }

  function synchronizeSession(): void {
    const current = client.session;
    const previous = session.get();
    if (current?.customer.id !== previous?.customer.id || current?.id !== previous?.id) invalidateContext();
    session.set(current);
  }

  client.onAuthStateChanged(synchronizeSession);
  currency.subscribe((value) => booking_service_state.setKey("currency", value));
  allowed_payment_option_ids.subscribe((ids) => booking_service_state.setKey("availablePaymentOptionIds", [...ids]));

  function requireLocale(): string {
    const value = locale.get();
    if (!value) throw new Error("Set the storefront language with setContext({ locale }) first");
    return value;
  }

  function newId(label: string): string {
    return requireId(config.createId(), label);
  }

  function newOrderToken(): string {
    const token = config.createOrderToken();
    if (!isOrderToken(token)) {
      throw new TypeError("createOrderToken must answer an order token: 32 random bytes in canonical base64url after arky_ot_");
    }
    return token;
  }

  async function loadSetup(): Promise<StorefrontSetup> {
    const key = market_key.get();
    const revision = contextRevision;
    const result = setup.get() ?? (await client.getSetup());
    const value = key ? await client.store.market.getByKey(key) : null;
    if (revision !== contextRevision || key !== market_key.get()) {
      throw new CartSelectionError("The market changed while the store setup was loading");
    }
    if (value && value.key !== key) throw new CartSelectionError("The market read didn't confirm the selected key");
    setup.set(result);
    resolvedMarket.set(value);
    return result;
  }

  async function ensureSession(): Promise<StorefrontCustomerSession | null> {
    synchronizeSession();
    if (client.hasSession) return client.session;
    if (!sessionRequest) {
      sessionRequest = client.customer
        .identify()
        .then(() => client.session)
        .finally(() => {
          sessionRequest = null;
        });
    }
    const result = await sessionRequest;
    synchronizeSession();
    return result;
  }

  function setMarket(key: string): void {
    if (key !== market_key.get() && [...cartStores].some((store) => store.item_count.get() > 0)) {
      throw Object.assign(new Error("The market can't change while the cart has items"), { code: "CART_MARKET_LOCKED" });
    }
    client.setMarket(key);
    if (key !== market_key.get()) {
      market_key.set(key);
      invalidateContext();
    }
  }

  function setLocale(value: string): void {
    if (value !== locale.get()) {
      for (const store of cartStores) store.quote_result.set(null);
    }
    client.setLocale(value);
    locale.set(client.getLocale());
  }

  function setContext(context: ArkyStoreContext): void {
    if (context.market !== undefined) setMarket(context.market);
    if (context.locale !== undefined) setLocale(context.locale);
  }

  async function beginCartOperation(): Promise<CartScope> {
    synchronizeSession();
    const requestedSession = client.session;
    const requestedRevision = contextRevision;
    await ensureSession();
    const current = client.session;
    const revision = contextRevision;
    if (!current || (requestedSession && requestedRevision !== revision)) {
      throw new CartSelectionError("The buyer or the store context changed; reload the cart");
    }
    const isCurrent = () =>
      revision === contextRevision && client.session?.id === current.id && client.session?.customer.id === current.customer.id;
    return {
      customerId: current.customer.id,
      isCurrent,
      assertCurrent() {
        if (!isCurrent()) throw new CartSelectionError("The buyer or the store context changed during the cart operation");
      },
    };
  }

  const cartContext: CartStoreContext = { client, locale, requireLocale, beginCartOperation, newId, newOrderToken };

  function registerCart(fixedScope: ArkyCartScope | null): CartStore {
    const { store, invalidate } = createCartStore(cartContext, fixedScope);
    cartStores.add(store);
    cartInvalidators.add(invalidate);
    return store;
  }

  const defaultCart = registerCart(null);

  function scopedCart(scope: ArkyCartScope): CartStore {
    requireId(scope.catalog_id, "catalog");
    const key = cartScopeKey(scope);
    const existing = scopedCarts.get(key);
    if (existing) return existing;
    const store = registerCart({ buyer: scope.buyer, catalog_id: scope.catalog_id });
    scopedCarts.set(key, store);
    return store;
  }

  function checkoutFlow(scope: ArkyCartScope): CheckoutFlow {
    const key = cartScopeKey(scope);
    const existing = checkoutFlows.get(key);
    if (existing) return existing;
    const flow = createCheckoutFlow({ client, loadSetup, newId, newOrderToken }, scopedCart(scope));
    checkoutFlows.set(key, flow);
    return flow;
  }

  const cart = defaultCart.cart;
  const booking_items = defaultCart.booking_items;

  function bookingServiceCalendar(): ArkyCalendarDay[] {
    const { currentMonth, selectedDate, availability, selectedBookingResourceId, selectedSlot, timezone } = booking_service_state.get();
    const range = selectedSlot?.isMultiDay
      ? { from: calendarDateIn(selectedSlot.from, timezone), to: calendarDateIn(epochMilliseconds(selectedSlot.to - 1), timezone) }
      : null;
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const blank: ArkyCalendarDay = {
      date: new Date(0),
      iso: "",
      available: false,
      isSelected: false,
      isInRange: false,
      isToday: false,
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
        available: hasAvailableSlotsForDate(availability, iso, selectedBookingResourceId),
        isSelected: iso === selectedDate,
        isInRange: range !== null && iso >= range.from && iso <= range.to,
        isToday: date.getTime() === today.getTime(),
        blank: false,
      });
    }
    const suffix = (7 - (cells.length % 7)) % 7;
    for (let index = 0; index < suffix; index++) cells.push({ ...blank });
    return cells;
  }

  function computeBookingServiceSlots(dateStr: string): ArkyBookingSlot[] {
    const { availability, selectedBookingResourceId, timezone, bookingService, bookingOfferings } =
      booking_service_state.get();
    const language = locale.get();
    return getSlotsForDate(availability, dateStr, selectedBookingResourceId).flatMap((slot, index) => {
      const offering = bookingOfferings.find(
        (candidate) =>
          candidate.booking_service_id === bookingService?.id && candidate.booking_resource_id === slot.bookingResourceId,
      );
      if (!offering || !bookingService) return [];
      const multiDay = slotSpansDays(slot.from, slot.to, timezone);
      return [
        {
          id: `${offering.id}-${slot.from}-${index}`,
          bookingServiceId: bookingService.id,
          bookingResourceId: slot.bookingResourceId,
          bookingOfferingId: offering.id,
          from: slot.from,
          to: slot.to,
          isMultiDay: multiDay,
          timeText: multiDay
            ? formatServiceSlotRange(slot.from, slot.to, timezone, language)
            : formatServiceSlotTime(slot.from, slot.to, timezone, language),
          dateText: epochMillisecondsToDate(slot.from).toLocaleDateString(language, {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: timezone,
          }),
        },
      ];
    });
  }

  function resolveBookingOffering(
    state: ArkyBookingServiceState,
    bookingResourceId?: string | null,
  ): StorefrontBookingOffering | null {
    const serviceId = state.bookingService?.id;
    if (!serviceId) return null;
    const offerings = state.bookingOfferings.filter((offering) => offering.booking_service_id === serviceId);
    const resourceId = bookingResourceId ?? state.selectedSlot?.bookingResourceId ?? state.selectedBookingResourceId;
    if (resourceId) return offerings.find((offering) => offering.booking_resource_id === resourceId) || null;
    return offerings.length === 1 ? offerings[0] : null;
  }

  function bookingStepName(): string {
    const state = booking_service_state.get();
    if (!state.bookingService) return "";
    if (!state.selectedSlot || !state.dateTimeConfirmed) return "datetime";
    return "review";
  }

  const booking_service_current_step_name = computed(booking_service_state, bookingStepName);
  const booking_service_can_proceed = computed(booking_service_state, (state) => {
    const step = bookingStepName();
    if (step === "datetime") return !!(state.selectedDate && state.selectedSlot);
    return step === "review";
  });
  const booking_service_month_year = computed([booking_service_state, locale], (state, language) =>
    state.currentMonth.toLocaleString(language || undefined, { month: "long", year: "numeric" }),
  );
  const booking_chain_start = computed(booking_items, (items) =>
    items.length ? epochMilliseconds(Math.max(...items.map((item) => item.requested_interval.to))) : null,
  );
  const booking_service_total_steps = computed(booking_service_state, (state) => (state.bookingService ? 2 : 0));
  const booking_service_steps = computed(booking_service_state, () => ({ 1: { name: "datetime" }, 2: { name: "review" } }));
  const booking_service_current_step = computed(
    [booking_service_current_step_name, booking_service_steps],
    (name, steps) => {
      for (const [index, step] of Object.entries(steps)) if (step.name === name) return Number(index);
      return 1;
    },
  );

  let bookingSelectionRevision = 0;
  let bookingAvailabilityRevision = 0;
  let bookingAvailabilityReadRevision = 0;
  let bookingCatalogOptions: CatalogReadOptions | null = null;

  async function loadBookingAvailability(params: GetStorefrontAvailabilityParams, options?: RequestOptions) {
    const revision = ++bookingAvailabilityReadRevision;
    eshop_state.setKey("loading_availability", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.bookingService.getAvailability(params, options);
      if (response.from !== params.from || response.to !== params.to) throw new Error("Availability came back for another time range");
      if (params.cursor && response.cursor === params.cursor) throw new Error("Availability paging didn't advance");
      if (revision === bookingAvailabilityReadRevision) eshop_state.setKey("availability", response);
      return response;
    } catch (error) {
      if (revision === bookingAvailabilityReadRevision) {
        eshop_state.setKey("error", readErrorMessage(error, "Availability couldn't be loaded"));
      }
      throw error;
    } finally {
      if (revision === bookingAvailabilityReadRevision) eshop_state.setKey("loading_availability", false);
    }
  }

  const booking_service_controller = {
    initialize(): void {
      booking_service_state.setKey("tzGroups", normalizeTimezoneGroups(client.utils.tzGroups));
    },

    setTimezone(timezone: string): void {
      booking_service_state.setKey("timezone", timezone);
      booking_service_state.setKey("calendar", bookingServiceCalendar());
      const state = booking_service_state.get();
      if (state.selectedDate) {
        booking_service_state.setKey("slots", computeBookingServiceSlots(state.selectedDate));
        booking_service_state.setKey("selectedSlot", null);
        booking_service_state.setKey("quote", null);
        booking_service_state.setKey("quoteError", null);
      }
    },

    async select(bookingService: StorefrontBookingService, catalogOptions: CatalogReadOptions): Promise<void> {
      const selectionRevision = ++bookingSelectionRevision;
      bookingAvailabilityRevision += 1;
      bookingAvailabilityReadRevision += 1;
      eshop_state.setKey("loading_availability", false);
      eshop_state.setKey("availability", null);
      const selectedCatalog = { ...catalogOptions, include_price: true };
      bookingCatalogOptions = selectedCatalog;
      booking_service_state.set({
        ...booking_service_state.get(),
        bookingService: null,
        bookingOfferings: [],
        bookingOfferingsCursor: null,
        loadingOfferings: false,
        bookingResources: [],
        selectedBookingResourceId: null,
        availability: null,
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
        loading: true,
      });
      try {
        const [fullService, offeringPage] = await Promise.all([
          client.eshop.bookingService.get({ ...selectedCatalog, id: bookingService.id }),
          client.eshop.bookingOffering.find({ ...selectedCatalog, booking_service_id: bookingService.id, limit: 200 }),
        ]);
        const ids = [...new Set(offeringPage.items.map((offering) => offering.booking_resource_id))];
        const resources = ids.length
          ? await client.eshop.bookingResource.find({ ids, limit: 200 })
          : { items: [], cursor: null };
        if (selectionRevision !== bookingSelectionRevision) return;
        booking_service_state.set({
          ...booking_service_state.get(),
          bookingService: fullService,
          bookingOfferings: offeringPage.items,
          bookingOfferingsCursor: offeringPage.cursor,
          bookingResources: resources.items,
          currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          loading: false,
        });
        await booking_service_controller.loadMonth();
      } catch (error) {
        if (selectionRevision === bookingSelectionRevision) booking_service_state.setKey("loading", false);
        throw error;
      }
    },

    async loadMoreOfferings(): Promise<void> {
      const state = booking_service_state.get();
      if (!state.bookingService || !state.bookingOfferingsCursor || state.loadingOfferings) return;
      const catalog = bookingCatalogOptions;
      if (!catalog) throw new Error("Choose a catalog before reading booking offerings");
      const serviceId = state.bookingService.id;
      const cursor = state.bookingOfferingsCursor;
      const selectionRevision = bookingSelectionRevision;
      booking_service_state.setKey("loadingOfferings", true);
      try {
        const page = await client.eshop.bookingOffering.find({
          ...catalog,
          booking_service_id: serviceId,
          cursor,
          limit: 200,
        });
        if (page.cursor === cursor) throw new Error("Offering paging didn't advance");
        const ids = [...new Set(page.items.map((offering) => offering.booking_resource_id))];
        const resources = ids.length ? await client.eshop.bookingResource.find({ ids, limit: 200 }) : { items: [], cursor: null };
        const current = booking_service_state.get();
        if (selectionRevision !== bookingSelectionRevision || current.bookingService?.id !== serviceId) return;
        booking_service_state.set({
          ...current,
          bookingOfferings: [...new Map([...current.bookingOfferings, ...page.items].map((offering) => [offering.id, offering])).values()],
          bookingResources: [
            ...new Map([...current.bookingResources, ...resources.items].map((resource) => [resource.id, resource])).values(),
          ],
          bookingOfferingsCursor: page.cursor,
        });
        booking_service_state.setKey("calendar", bookingServiceCalendar());
        if (current.selectedDate) booking_service_state.setKey("slots", computeBookingServiceSlots(current.selectedDate));
      } finally {
        if (selectionRevision === bookingSelectionRevision) booking_service_state.setKey("loadingOfferings", false);
      }
    },

    async loadMoreAvailability(): Promise<void> {
      const state = booking_service_state.get();
      if (state.loading || !state.availability?.cursor) return;
      await booking_service_controller.loadMonth(state.availability.cursor);
    },

    async loadMonth(cursor?: string): Promise<void> {
      const state = booking_service_state.get();
      if (!state.bookingService) return;
      const selectedCatalog = bookingCatalogOptions;
      if (!selectedCatalog) throw new Error("Choose a catalog before reading booking availability");
      const requestRevision = ++bookingAvailabilityRevision;
      const selectionRevision = bookingSelectionRevision;
      booking_service_state.setKey("loading", true);
      if (!cursor) booking_service_state.setKey("availability", null);
      try {
        const chainedStart = booking_chain_start.get();
        let from: EpochMilliseconds;
        let to: EpochMilliseconds;
        if (cursor && state.availability) {
          from = state.availability.from;
          to = state.availability.to;
        } else if (chainedStart !== null) {
          from = chainedStart;
          to = epochMilliseconds(chainedStart + 31 * 24 * 60 * 60 * 1_000);
        } else {
          const month = state.currentMonth;
          from = epochMilliseconds(Date.UTC(month.getFullYear(), month.getMonth(), 1));
          to = epochMilliseconds(Date.UTC(month.getFullYear(), month.getMonth() + 1, 1));
        }
        const { include_price: _includePrice, ...catalog } = selectedCatalog;
        const availability = await loadBookingAvailability({
          ...catalog,
          booking_service_id: state.bookingService.id,
          from,
          to,
          limit: 20,
          ...(cursor ? { cursor } : {}),
          ...(state.selectedBookingResourceId ? { booking_resource_id: state.selectedBookingResourceId } : {}),
        });
        if (selectionRevision !== bookingSelectionRevision || requestRevision !== bookingAvailabilityRevision) return;
        booking_service_state.setKey(
          "availability",
          cursor && state.availability
            ? {
                ...availability,
                booking_resources: [
                  ...new Map(
                    [...state.availability.booking_resources, ...availability.booking_resources].map((resource) => [
                      resource.booking_resource_id,
                      resource,
                    ]),
                  ).values(),
                ],
              }
            : availability,
        );
        booking_service_state.setKey("calendar", bookingServiceCalendar());
        const selectedDate = booking_service_state.get().selectedDate;
        if (selectedDate) booking_service_state.setKey("slots", computeBookingServiceSlots(selectedDate));
      } finally {
        if (selectionRevision === bookingSelectionRevision && requestRevision === bookingAvailabilityRevision) {
          booking_service_state.setKey("loading", false);
        }
      }
    },

    prevMonth(): void {
      const { currentMonth } = booking_service_state.get();
      booking_service_state.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      void booking_service_controller.loadMonth();
    },

    nextMonth(): void {
      const { currentMonth } = booking_service_state.get();
      booking_service_state.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      void booking_service_controller.loadMonth();
    },

    selectBookingResource(bookingResourceId: string | null): void {
      const state = booking_service_state.get();
      if (bookingResourceId && !resolveBookingOffering(state, bookingResourceId)) {
        throw new Error(`Booking resource ${bookingResourceId} has no offering for the selected booking service`);
      }
      booking_service_state.set({
        ...state,
        selectedBookingResourceId: bookingResourceId,
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      void booking_service_controller.loadMonth();
    },

    selectDate(cell: ArkyCalendarDay): void {
      if (cell.blank || !cell.available) return;
      booking_service_state.set({
        ...booking_service_state.get(),
        selectedDate: cell.iso,
        slots: computeBookingServiceSlots(cell.iso),
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      booking_service_state.setKey("calendar", bookingServiceCalendar());
    },

    selectTimeSlot(slot: ArkyBookingSlot | null): void {
      const state = booking_service_state.get();
      if (slot) {
        if (!state.bookingService || slot.bookingServiceId !== state.bookingService.id) {
          throw new Error("The slot doesn't belong to the selected booking service");
        }
        if (state.selectedBookingResourceId && slot.bookingResourceId !== state.selectedBookingResourceId) {
          throw new Error("The slot doesn't belong to the selected booking resource");
        }
        const offering = resolveBookingOffering(state, slot.bookingResourceId);
        if (!offering || offering.id !== slot.bookingOfferingId) {
          throw new Error(`Booking resource ${slot.bookingResourceId} has no matching offering`);
        }
      }
      booking_service_state.set({ ...state, selectedSlot: slot, dateTimeConfirmed: false, quote: null, quoteError: null });
      booking_service_state.setKey("calendar", bookingServiceCalendar());
    },

    resetDateSelection(): void {
      booking_service_state.set({
        ...booking_service_state.get(),
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
    },

    updateCalendar(): void {
      booking_service_state.setKey("calendar", bookingServiceCalendar());
    },

    findFirstAvailable(): void {
      for (const day of booking_service_state.get().calendar) {
        if (!day.blank && day.available) {
          booking_service_controller.selectDate(day);
          return;
        }
      }
    },

    async addToCart(items: ArkyBookingCartItem[]): Promise<Cart | null> {
      const state = booking_service_state.get();
      if (!items.length) return cart.get();
      if (!state.bookingService || items.some((item) => item.slot.bookingServiceId !== state.bookingService?.id)) {
        throw new Error("The slots don't belong to the selected booking service");
      }
      for (const item of items) {
        const offering = resolveBookingOffering(state, item.slot.bookingResourceId);
        if (!offering || offering.id !== item.slot.bookingOfferingId) {
          throw new Error(`Booking resource ${item.slot.bookingResourceId} has no matching offering`);
        }
      }
      const catalog = bookingCatalogOptions;
      if (!catalog) throw new Error("Choose a booking service and its catalog first");
      const scope = defaultCart.scope;
      if (scope && scope.catalog_id !== catalog.catalog_id) {
        throw new CartSelectionError("The cart sells from another catalog than the booking service");
      }
      if (!scope && (catalog.company_id !== undefined || catalog.company_location_id !== undefined)) {
        throw new CartSelectionError("Load the company's cart with cart.load before booking for the company");
      }
      let result: Cart = await defaultCart.ensure(scope ?? { buyer: { type: "customer" }, catalog_id: catalog.catalog_id });
      for (const item of items) {
        result = await defaultCart.addBooking({
          id: item.id,
          booking_offering_id: item.slot.bookingOfferingId,
          requested_interval: { from: item.slot.from, to: item.slot.to },
          capacity_units: item.capacity_units ?? 1,
          form_submission_id: item.form_submission_id ?? null,
        });
      }
      booking_service_state.set({
        ...booking_service_state.get(),
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
        cartId: result.id,
      });
      booking_service_state.setKey("calendar", bookingServiceCalendar());
      return result;
    },

    removeFromCart(lineItemId: string): Promise<Cart> {
      return defaultCart.removeItem(lineItemId);
    },

    async fetchQuote(): Promise<CartQuote | null> {
      if (!cart.get() || booking_items.get().length === 0) return null;
      booking_service_state.setKey("fetchingQuote", true);
      booking_service_state.setKey("quoteError", null);
      try {
        const value = await defaultCart.quote();
        booking_service_state.setKey("cartId", value.cart_id);
        booking_service_state.setKey("quote", value);
        booking_service_state.setKey("availablePaymentOptionIds", value.payment_option_ids);
        return value;
      } catch (error) {
        booking_service_state.setKey("quoteError", readErrorMessage(error, "The quote couldn't be loaded"));
        return null;
      } finally {
        booking_service_state.setKey("fetchingQuote", false);
      }
    },

    async checkout(input: ArkyCartCheckoutInput): Promise<CheckoutAcceptance> {
      if (!booking_items.get().length) throw new Error("The cart has no bookings");
      booking_service_state.setKey("loading", true);
      try {
        return await defaultCart.checkout(input);
      } finally {
        booking_service_state.setKey("loading", false);
      }
    },

    getBookingResourcesList(): StorefrontBookingResource[] {
      return booking_service_state.get().bookingResources;
    },

    prevStep(): void {
      const current = bookingStepName();
      if (current === "review") {
        booking_service_state.setKey("dateTimeConfirmed", false);
        return;
      }
      if (current === "datetime") {
        booking_service_state.setKey("selectedSlot", null);
        booking_service_state.setKey("dateTimeConfirmed", false);
        booking_service_state.setKey("quote", null);
        booking_service_state.setKey("quoteError", null);
      }
    },

    nextStep(): void {
      if (bookingStepName() === "datetime" && booking_service_can_proceed.get()) {
        booking_service_state.setKey("dateTimeConfirmed", true);
      }
    },

    getBookingServicePrice(): string {
      const offering = resolveBookingOffering(booking_service_state.get());
      const language = locale.get();
      if (!offering || !language) return "";
      return client.utils.formatPrice(offering.price, language);
    },

    formatDateDisplay(value: string | null): string {
      if (!value) return "";
      return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale.get() || undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    },

    bookingServiceName(service: StorefrontBookingService): string {
      return bookingServiceName(service, requireLocale());
    },
  };

  async function loadEntry(params: ArkyContentEntryParams, options?: RequestOptions): Promise<Entry> {
    content_state.setKey("loading", true);
    content_state.setKey("error", null);
    try {
      let entry: Entry;
      let cacheKey: string;
      if ("id" in params) {
        entry = await client.content.entry.get({ id: params.id }, options);
        cacheKey = params.id;
      } else if ("slug" in params) {
        const language = options?.locale?.trim() || requireLocale();
        const found = await client.content.entry.findBySlug({ collection_id: params.collection_id, slug: params.slug }, options);
        if (!found) throw new Error("The entry wasn't found");
        entry = found;
        cacheKey = `${params.collection_id}:${language}:${params.slug}`;
      } else {
        const page = await client.content.entry.find({ collection_id: params.collection_id, key: params.key, limit: 1 }, options);
        const found = page.items[0];
        if (!found) throw new Error("The entry wasn't found");
        entry = found;
        cacheKey = `${params.collection_id}:${params.key}`;
      }
      content_state.setKey("entries", { ...content_state.get().entries, [cacheKey]: entry });
      return entry;
    } catch (error) {
      content_state.setKey("error", readErrorMessage(error, "The entry couldn't be loaded"));
      throw error;
    } finally {
      content_state.setKey("loading", false);
    }
  }

  async function loadForm(params: GetStorefrontFormParams, options?: RequestOptions): Promise<Form> {
    forms_state.setKey("loading", true);
    forms_state.setKey("error", null);
    try {
      const form = await client.forms.get(params, options);
      forms_state.setKey("forms", { ...forms_state.get().forms, [`id:${form.id}`]: form, [`key:${form.key}`]: form });
      return form;
    } catch (error) {
      forms_state.setKey("error", readErrorMessage(error, "The form couldn't be loaded"));
      throw error;
    } finally {
      forms_state.setKey("loading", false);
    }
  }

  function submitForm(params: SubmitFormInput, options?: RequestOptions): Promise<StorefrontFormSubmission> {
    return client.forms.submit(params, options);
  }

  function submitFormByKey(params: ArkySubmitFormByKeyParams, options?: RequestOptions): Promise<StorefrontFormSubmission> {
    if (params.form.key !== params.key) throw new Error("The form shown isn't the form named by the key");
    return submitForm(
      {
        form_id: params.form.id,
        questions_updated_at: params.form.questions_updated_at,
        ...(params.id !== undefined ? { id: params.id } : {}),
        language: params.language,
        answers: buildFormAnswers(params.form, params.values),
      },
      options,
    );
  }

  async function loadProducts(
    params: FindStorefrontProductsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<StorefrontProduct>> {
    eshop_state.setKey("loading_products", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.product.find(params, options);
      eshop_state.setKey("products", response.items);
      eshop_state.setKey("product_cursor", response.cursor);
      return response;
    } catch (error) {
      eshop_state.setKey("error", readErrorMessage(error, "Products couldn't be loaded"));
      throw error;
    } finally {
      eshop_state.setKey("loading_products", false);
    }
  }

  async function loadBookingServices(
    params: FindStorefrontBookingServicesParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<StorefrontBookingService>> {
    eshop_state.setKey("loading_booking_services", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.bookingService.find(params, options);
      eshop_state.setKey("bookingServices", response.items);
      eshop_state.setKey("booking_service_cursor", response.cursor);
      return response;
    } catch (error) {
      eshop_state.setKey("error", readErrorMessage(error, "Booking services couldn't be loaded"));
      throw error;
    } finally {
      eshop_state.setKey("loading_booking_services", false);
    }
  }

  async function loadBookingResources(
    params: FindStorefrontBookingResourcesParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<StorefrontBookingResource>> {
    eshop_state.setKey("loading_booking_resources", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.bookingResource.find(params, options);
      eshop_state.setKey("bookingResources", response.items);
      eshop_state.setKey("booking_resource_cursor", response.cursor);
      return response;
    } catch (error) {
      eshop_state.setKey("error", readErrorMessage(error, "Booking resources couldn't be loaded"));
      throw error;
    } finally {
      eshop_state.setKey("loading_booking_resources", false);
    }
  }

  async function useExperiment(params: string | UseExperimentParams): Promise<ExperimentUseResponse> {
    await ensureSession();
    return client.experiments.use(typeof params === "string" ? { key: params } : params);
  }

  async function trackCustomerAction(params: TrackCustomerActionParams): Promise<void> {
    await ensureSession();
    return client.actions.track(params);
  }

  function loadContent<P extends LoadContentParams>(params: P, options?: RequestOptions): Promise<LoadedContentFor<P>> {
    return client.content.load(params, options);
  }

  function loadContentEntries(params: LoadContentEntriesParams, options?: RequestOptions): Promise<LoadedContent<Entry>[]> {
    return client.content.loadEntries(params, options);
  }

  const booking_service_store = {
    get: client.eshop.bookingService.get,
    getByKey: client.eshop.bookingService.getByKey,
    list: loadBookingServices,
    listOfferings: client.eshop.bookingOffering.find,
    getAvailability: loadBookingAvailability,
    state: booking_service_state,
    current_step_name: booking_service_current_step_name,
    can_proceed: booking_service_can_proceed,
    month_year: booking_service_month_year,
    chain_start: booking_chain_start,
    total_steps: booking_service_total_steps,
    steps: booking_service_steps,
    current_step: booking_service_current_step,
    ...booking_service_controller,
  };

  return {
    client,
    session,
    setup,
    market,
    market_key,
    locale,
    currency,
    allowed_payment_option_ids,
    customer: {
      identify: client.customer.identify,
      requestCode: client.customer.requestCode,
      verify: client.customer.verify,
      changeEmail: client.customer.changeEmail,
      refresh: client.customer.refresh,
      logout: client.customer.logout,
      getMe: client.customer.getMe,
      updateMe: client.customer.updateMe,
      resubscribe: client.customer.resubscribe,
      unsubscribe: client.customer.unsubscribe,
    },
    newsletter: client.newsletter,
    onAuthStateChanged: client.onAuthStateChanged,
    get hasSession() {
      return client.hasSession;
    },
    get isAuthenticated() {
      return client.isAuthenticated;
    },
    ensureSession,
    setMarket,
    setLocale,
    setContext,
    getMarket: () => market_key.get(),
    getLocale: () => locale.get(),
    media: client.media,
    content: {
      state: content_state,
      collection: client.content.collection,
      entry: {
        get: loadEntry,
        find: client.content.entry.find,
        findByIds: client.content.entry.findByIds,
        findBySlug: client.content.entry.findBySlug,
      },
      load: loadContent,
      loadEntries: loadContentEntries,
    },
    forms: {
      state: forms_state,
      get: loadForm,
      submit: submitForm,
      submitByKey: submitFormByKey,
    },
    category: client.category,
    eshop: {
      state: eshop_state,
      catalog: client.eshop.catalog,
      product: {
        get: client.eshop.product.get,
        getByKey: client.eshop.product.getByKey,
        list: loadProducts,
      },
      productVariant: client.eshop.productVariant,
      bookingService: booking_service_store,
      bookingResource: {
        get: client.eshop.bookingResource.get,
        list: loadBookingResources,
      },
      bookingOffering: client.eshop.bookingOffering,
      promotion: client.eshop.promotion,
      order: client.eshop.order,
      library: client.eshop.library,
      return: client.eshop.return,
      rental: client.eshop.rental,
      paymentMethod: client.eshop.paymentMethod,
      customerGroup: client.eshop.customerGroup,
      customerGroupOffering: client.eshop.customerGroupOffering,
      customerGroupMember: client.eshop.customerGroupMember,
      minimumProgress: client.eshop.minimumProgress,
      cart: defaultCart,
      carts: {
        for: scopedCart,
      },
      checkoutFlow,
    },
    companies: client.companies,
    actions: {
      track: trackCustomerAction,
    },
    pageViews: client.pageViews,
    experiments: {
      use: useExperiment,
    },
    support: client.support,
    store: {
      ...client.store,
      setup,
      load: loadSetup,
    },
    utils: client.utils,
  };
}

export type InitializedStore = ReturnType<typeof initializeStoreCore>;

export function initialize(publishableKey: string, options: ArkyStoreConfig): InitializedStore {
  return initializeStoreCore(publishableKey, options);
}

export type ArkyStore = InitializedStore;
export type ArkyCartStore = ArkyStore["eshop"]["cart"];
export type ArkyBookingServiceStore = ArkyStore["eshop"]["bookingService"];
export type ArkyCheckoutFlow = CheckoutFlow;
