import { atom, computed, map } from "nanostores";
import type { EpochMilliseconds } from "../types/time";
import type { RequestOptions } from "../types/api";
import type {
  Cart,
  CartBuyer,
  CartDeliveryGroup,
  CartLineItem,
  CartPlanDeliveries,
  CartQuote,
  CheckoutAcceptance,
  PlanDeliveryChoices,
  PlanDeliveryOffers,
  StorefrontCartBookingLineItemInput,
  StorefrontCartLineItemInput,
  StorefrontCartProductLineItemInput,
  StorefrontCartSubscriptionLineItemInput,
  StorefrontCheckoutCartInput,
  StorefrontCreateCartParams,
  StorefrontCurrentCartParams,
} from "../types/cart";
import { cartBookingItems, cartProductItems, cartSubscriptionPlanItems } from "../types/cart";
import { CartSelectionError } from "../types/cartSelection";
import type { CatalogReadOptions } from "../types/catalog";
import type { PostalAddress } from "../types/common";
import type { Entry } from "../types/content";
import type { TrackCustomerActionParams } from "../types/customerAction";
import type { ExperimentUseResponse, UseExperimentParams } from "../types/experiment";
import type { Form, GetStorefrontFormParams, StorefrontFormSubmission, SubmitFormParams } from "../types/forms";
import type {
  AvailabilityResponse,
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
import { epochMilliseconds, epochMillisecondsNow, epochMillisecondsToDate } from "../utils/time";
import { createStorefront, type StorefrontClient, type StorefrontCustomerSession } from "../index";
import type {
  ArkyBookingCartItem,
  ArkyBookingServiceState,
  ArkyBookingSlot,
  ArkyCalendarDay,
  ArkyCartCheckoutInput,
  ArkyCartStatus,
  ArkyContentEntryParams,
  ArkyContentState,
  ArkyEshopState,
  ArkyFormsState,
  ArkyLastOrder,
  ArkyStoreConfig,
  ArkyStoreContext,
  ArkySubmitFormByKeyParams,
} from "./types";
import {
  bookingServiceName,
  buildFormAnswers,
  createBookingServiceInitialState,
  formatServiceSlotTime,
  getSlotsForDate,
  hasAvailableSlotsForDate,
  normalizeTimezoneGroups,
  readErrorMessage,
} from "./utils";

interface CartScope {
  customerId: string;
  isCurrent(): boolean;
  assertCurrent(): void;
}

function cartLineInput(line: CartLineItem): StorefrontCartLineItemInput {
  switch (line.type) {
    case "product":
      return {
        type: "product",
        id: line.id,
        product_id: line.product_id,
        variant_id: line.variant_id,
        quantity: line.quantity,
        form_submission_id: line.form_submission_id,
        purchase: line.purchase,
      };
    case "booking":
      return {
        type: "booking",
        id: line.id,
        booking_offering_id: line.booking_offering_id,
        requested_interval: { from: line.requested_interval.from, to: line.requested_interval.to },
        capacity_units: line.capacity_units,
        form_submission_id: line.form_submission_id,
      };
    case "subscription_plan":
      return {
        type: "subscription_plan",
        id: line.id,
        subscription_plan_id: line.subscription_plan_id,
        start: line.start,
        deliveries: line.deliveries,
      };
  }
}

function initializeStoreCore(publishableKey: string, config: ArkyStoreConfig, scopedClient?: StorefrontClient) {
  const client = scopedClient || createStorefront(publishableKey, config);
  const session = atom<StorefrontCustomerSession | null>(client.session);
  const setup = atom<StorefrontSetup | null>(null);
  const locale = atom(client.getLocale());
  const market_key = atom(client.getMarket());
  const sales_channel_key = atom(client.getSalesChannel());
  const resolvedMarket = atom<StorefrontMarket | null>(null);
  const market = computed([market_key, resolvedMarket], (key, value) => (key && value?.key === key ? value : null));
  const currency = computed(market, (value) => value?.currency ?? null);
  const allowed_payment_option_ids = computed(market, (value) => value?.payment_option_ids ?? []);

  const cart = atom<Cart | null>(null);
  const quote = atom<CartQuote | null>(null);
  const last_order = atom<ArkyLastOrder | null>(null);
  const cart_status = map<ArkyCartStatus>({
    loading: false,
    syncing: false,
    fetching_quote: false,
    processing_checkout: false,
    error: null,
    quote_error: null,
  });
  const product_items = computed(cart, (value) => cartProductItems(value));
  const booking_items = computed(cart, (value) => cartBookingItems(value));
  const subscription_plan_items = computed(cart, (value) => cartSubscriptionPlanItems(value));
  const product_item_count = computed(product_items, (items) => items.reduce((total, item) => total + item.quantity, 0));
  const item_count = computed(
    [product_item_count, booking_items, subscription_plan_items],
    (products, bookings, plans) => products + bookings.length + plans.length,
  );
  const promotion_codes = computed(quote, (value) =>
    (value?.promotions ?? []).flatMap((promotion) => (promotion.code ? [promotion.code.code] : [])),
  );

  let cartParams: StorefrontCurrentCartParams = {};
  let contextRevision = 0;
  let cartRevision = 0;
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

  function clearLocalCart(): void {
    cartRevision += 1;
    cart.set(null);
    quote.set(null);
    cart_status.set({
      loading: false,
      syncing: false,
      fetching_quote: false,
      processing_checkout: false,
      error: null,
      quote_error: null,
    });
  }

  function invalidateContext(): void {
    contextRevision += 1;
    clearLocalCart();
    last_order.set(null);
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
    if (key !== market_key.get() && item_count.get() > 0) {
      throw Object.assign(new Error("The market can't change while the cart has items"), { code: "CART_MARKET_LOCKED" });
    }
    client.setMarket(key);
    if (key !== market_key.get()) {
      market_key.set(key);
      invalidateContext();
    }
  }

  function setSalesChannel(key: string): void {
    if (key !== sales_channel_key.get() && item_count.get() > 0) {
      throw Object.assign(new Error("The sales channel can't change while the cart has items"), {
        code: "CART_SALES_CHANNEL_LOCKED",
      });
    }
    client.setSalesChannel(key);
    if (key !== sales_channel_key.get()) {
      sales_channel_key.set(key);
      invalidateContext();
    }
  }

  function setLocale(value: string): void {
    if (value !== locale.get()) quote.set(null);
    client.setLocale(value);
    locale.set(client.getLocale());
  }

  function setContext(context: ArkyStoreContext): void {
    if (context.market !== undefined) setMarket(context.market);
    if (context.salesChannel !== undefined) setSalesChannel(context.salesChannel);
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

  function applyCart(scope: CartScope, value: Cart, revision: number): Cart {
    scope.assertCurrent();
    if (value.customer_id !== scope.customerId) throw new CartSelectionError("The cart belongs to another customer");
    if (revision === cartRevision) {
      cart.set(value);
      quote.set(null);
    }
    return value;
  }

  function requireCart(): Cart {
    const value = cart.get();
    if (!value) throw new CartSelectionError("Load or create the cart first");
    return value;
  }

  async function runCartWrite(
    label: string,
    operation: (current: Cart) => Promise<Cart>,
  ): Promise<Cart> {
    const scope = await beginCartOperation();
    const revision = ++cartRevision;
    cart_status.setKey("syncing", true);
    cart_status.setKey("error", null);
    try {
      const value = await operation(requireCart());
      return applyCart(scope, value, revision);
    } catch (error) {
      if (scope.isCurrent()) cart_status.setKey("error", readErrorMessage(error, label));
      throw error;
    } finally {
      if (scope.isCurrent()) cart_status.setKey("syncing", false);
    }
  }

  async function loadCart(params: StorefrontCurrentCartParams = cartParams): Promise<Cart | null> {
    cartParams = params;
    const scope = await beginCartOperation();
    const revision = ++cartRevision;
    cart_status.setKey("loading", true);
    cart_status.setKey("error", null);
    try {
      const value = await client.eshop.cart.current(params);
      scope.assertCurrent();
      if (revision !== cartRevision) return cart.get();
      if (!value) {
        cart.set(null);
        quote.set(null);
        return null;
      }
      return applyCart(scope, value, revision);
    } catch (error) {
      if (scope.isCurrent()) cart_status.setKey("error", readErrorMessage(error, "The cart couldn't be loaded"));
      throw error;
    } finally {
      if (scope.isCurrent()) cart_status.setKey("loading", false);
    }
  }

  async function createCart(params: StorefrontCreateCartParams): Promise<Cart> {
    cartParams = { buyer: params.buyer, catalog_id: params.catalog_id };
    const scope = await beginCartOperation();
    const revision = ++cartRevision;
    const created = await client.eshop.cart.create(params);
    return applyCart(scope, created.cart, revision);
  }

  function updateBody(current: Cart) {
    return { id: current.id, expected_updated_at: current.updated_at };
  }

  function addProduct(product: StorefrontCartProductLineItemInput): Promise<Cart> {
    return runCartWrite("The product couldn't be added to the cart", (current) =>
      client.eshop.cart.addProduct({ ...updateBody(current), product }),
    );
  }

  function addBooking(booking: StorefrontCartBookingLineItemInput): Promise<Cart> {
    return runCartWrite("The booking couldn't be added to the cart", (current) =>
      client.eshop.cart.addBooking({ ...updateBody(current), booking }),
    );
  }

  function addSubscriptionPlan(subscriptionPlan: StorefrontCartSubscriptionLineItemInput): Promise<Cart> {
    return runCartWrite("The plan couldn't be added to the cart", (current) =>
      client.eshop.cart.addSubscriptionPlan({ ...updateBody(current), subscription_plan: subscriptionPlan }),
    );
  }

  function removeItem(lineItemId: string): Promise<Cart> {
    return runCartWrite("The item couldn't be removed from the cart", (current) =>
      client.eshop.cart.removeItem({ ...updateBody(current), line_item_id: lineItemId }),
    );
  }

  function setProductQuantity(lineItemId: string, quantity: number): Promise<Cart> {
    return runCartWrite("The quantity couldn't be changed", (current) => {
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error("A cart quantity is a whole number of at least 1");
      if (!current.line_items.some((line) => line.type === "product" && line.id === lineItemId)) {
        throw new CartSelectionError("The cart has no such product line");
      }
      const lineItems = current.line_items.map((line) => {
        const input = cartLineInput(line);
        return input.type === "product" && input.id === lineItemId ? { ...input, quantity } : input;
      });
      const holders = current.delivery_groups.flatMap((group) =>
        group.items.filter((item) => item.line_item.type === "product" && item.line_item.line_item_id === lineItemId),
      );
      const deliveryGroups =
        holders.length === 1
          ? current.delivery_groups.map((group) => ({
              ...group,
              items: group.items.map((item) =>
                item.line_item.type === "product" && item.line_item.line_item_id === lineItemId ? { ...item, quantity } : item,
              ),
            }))
          : undefined;
      return client.eshop.cart.update({
        ...updateBody(current),
        line_items: lineItems,
        ...(deliveryGroups ? { delivery_groups: deliveryGroups } : {}),
      });
    });
  }

  function setDeliveryGroups(deliveryGroups: CartDeliveryGroup[]): Promise<Cart> {
    return runCartWrite("The deliveries couldn't be saved", (current) =>
      client.eshop.cart.update({ ...updateBody(current), delivery_groups: deliveryGroups }),
    );
  }

  function setBillingAddress(address: PostalAddress | null): Promise<Cart> {
    return runCartWrite("The billing address couldn't be saved", (current) =>
      client.eshop.cart.update({ ...updateBody(current), billing_address: address }),
    );
  }

  function setBuyer(buyer: CartBuyer): Promise<Cart> {
    return runCartWrite("The buyer couldn't be changed", (current) =>
      client.eshop.cart.update({ ...updateBody(current), buyer }),
    );
  }

  function setPromotionCodes(codes: string[]): Promise<Cart> {
    return runCartWrite("The promotion codes couldn't be saved", (current) =>
      client.eshop.cart.update({ ...updateBody(current), promotion_codes: codes }),
    );
  }

  function selectShippingMethod(shippingMethodId: string): Promise<Cart> {
    return runCartWrite("The shipping method couldn't be selected", (current) =>
      client.eshop.cart.selectShippingMethod({ ...updateBody(current), shipping_method_id: shippingMethodId }),
    );
  }

  function setFutureDeliveries(plans: CartPlanDeliveries[]): Promise<Cart> {
    return runCartWrite("The plan deliveries couldn't be saved", (current) =>
      client.eshop.cart.setFutureDeliveries({ ...updateBody(current), plans }),
    );
  }

  async function quoteFutureDeliveries(plans: PlanDeliveryChoices[], options?: RequestOptions): Promise<PlanDeliveryOffers[]> {
    const scope = await beginCartOperation();
    const current = requireCart();
    requireLocale();
    const result = await client.eshop.cart.quoteFutureDeliveries({ id: current.id, plans }, options);
    scope.assertCurrent();
    return result;
  }

  function clearCart(): Promise<Cart> {
    return runCartWrite("The cart couldn't be cleared", (current) =>
      client.eshop.cart.clear(updateBody(current)),
    );
  }

  async function fetchQuote(options?: RequestOptions): Promise<CartQuote> {
    const scope = await beginCartOperation();
    const current = requireCart();
    const language = requireLocale();
    const revision = cartRevision;
    cart_status.setKey("fetching_quote", true);
    cart_status.setKey("quote_error", null);
    try {
      const value = await client.eshop.cart.quote({ id: current.id }, options);
      scope.assertCurrent();
      if (revision !== cartRevision || value.cart_id !== current.id || language !== locale.get()) {
        throw new CartSelectionError("The cart or the language changed while quoting; quote the current cart");
      }
      quote.set(value);
      return value;
    } catch (error) {
      if (scope.isCurrent()) {
        quote.set(null);
        cart_status.setKey("quote_error", readErrorMessage(error, "The quote couldn't be loaded"));
      }
      throw error;
    } finally {
      if (scope.isCurrent()) cart_status.setKey("fetching_quote", false);
    }
  }

  function checkoutRequest(input: ArkyCartCheckoutInput): StorefrontCheckoutCartInput {
    const current = requireCart();
    const reviewed = quote.get();
    if (!reviewed || reviewed.cart_id !== current.id) throw new CartSelectionError("Quote the cart before checkout");
    if (!reviewed.ready) throw new CartSelectionError("The quote isn't ready: pick shipping and check bookings first");
    return {
      order_id: input.order_id,
      cart_id: current.id,
      expected_updated_at: current.updated_at,
      presentation_digest: reviewed.presentation_digest,
      contact_email: input.contact_email,
      payment: input.payment,
    };
  }

  function finishCheckout(
    request: StorefrontCheckoutCartInput,
    result: CheckoutAcceptance,
    clearAfter: boolean,
  ): CheckoutAcceptance {
    if (result.type === "placed") {
      const reviewed = quote.get();
      last_order.set({
        order_id: result.order_id,
        number: result.number,
        cart_id: request.cart_id,
        payment_id: result.payment_id,
        payment_action: result.payment_action,
        total: reviewed && reviewed.cart_id === request.cart_id ? reviewed.totals.total : null,
        currency: reviewed && reviewed.cart_id === request.cart_id ? reviewed.currency : null,
        created_at: epochMillisecondsNow(),
      });
    } else {
      last_order.set(null);
    }
    if (clearAfter) {
      client.eshop.cart.forget(cartParams);
      clearLocalCart();
    }
    return result;
  }

  async function runCheckout<T>(operation: (scope: CartScope) => Promise<T>): Promise<T> {
    const scope = await beginCartOperation();
    if (cart_status.get().processing_checkout) throw new CartSelectionError("A checkout is already running");
    cart_status.setKey("processing_checkout", true);
    cart_status.setKey("error", null);
    try {
      const value = await operation(scope);
      scope.assertCurrent();
      return value;
    } catch (error) {
      if (scope.isCurrent()) cart_status.setKey("error", readErrorMessage(error, "Checkout failed"));
      throw error;
    } finally {
      if (scope.isCurrent()) cart_status.setKey("processing_checkout", false);
    }
  }

  function checkout(input: ArkyCartCheckoutInput): Promise<CheckoutAcceptance> {
    return runCheckout(async () => {
      const request = checkoutRequest(input);
      const result = await client.eshop.cart.checkout(request);
      return finishCheckout(request, result, input.clear_after_checkout !== false);
    });
  }

  function retainCheckout(input: ArkyCartCheckoutInput): Promise<StorefrontCheckoutCartInput> {
    return runCheckout(() => client.eshop.cart.retainCheckout(checkoutRequest(input)));
  }

  function recoverCheckout(): Promise<CheckoutAcceptance | null> {
    return runCheckout(async () => {
      const pending = await client.eshop.cart.pendingCheckout();
      if (!pending) return null;
      const result = await client.eshop.cart.recoverCheckout();
      return result ? finishCheckout(pending, result, true) : null;
    });
  }

  function bookingServiceCalendar(): ArkyCalendarDay[] {
    const { currentMonth, selectedDate, availability, selectedBookingResourceId } = booking_service_state.get();
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
        isInRange: false,
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
      return [
        {
          id: `${offering.id}-${slot.from}-${index}`,
          bookingServiceId: bookingService.id,
          bookingResourceId: slot.bookingResourceId,
          bookingOfferingId: offering.id,
          from: slot.from,
          to: slot.to,
          timeText: formatServiceSlotTime(slot.from, slot.to, timezone, language),
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
  let bookingCatalogOptions: CatalogReadOptions = {};

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

    async select(bookingService: StorefrontBookingService, catalogOptions: CatalogReadOptions = {}): Promise<void> {
      const selectionRevision = ++bookingSelectionRevision;
      bookingAvailabilityRevision += 1;
      bookingAvailabilityReadRevision += 1;
      eshop_state.setKey("loading_availability", false);
      eshop_state.setKey("availability", null);
      bookingCatalogOptions = {
        catalog_id: catalogOptions.catalog_id,
        company_id: catalogOptions.company_id,
        company_location_id: catalogOptions.company_location_id,
        include_price: true,
      };
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
          client.eshop.bookingService.get({ id: bookingService.id, ...bookingCatalogOptions }),
          client.eshop.bookingOffering.find({ ...bookingCatalogOptions, booking_service_id: bookingService.id, limit: 200 }),
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
      const serviceId = state.bookingService.id;
      const cursor = state.bookingOfferingsCursor;
      const selectionRevision = bookingSelectionRevision;
      booking_service_state.setKey("loadingOfferings", true);
      try {
        const page = await client.eshop.bookingOffering.find({
          ...bookingCatalogOptions,
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
        const availability = await loadBookingAvailability({
          catalog_id: bookingCatalogOptions.catalog_id,
          company_id: bookingCatalogOptions.company_id,
          company_location_id: bookingCatalogOptions.company_location_id,
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
      let result: Cart | null = cart.get();
      for (const item of items) {
        const offering = resolveBookingOffering(state, item.slot.bookingResourceId);
        if (!offering || offering.id !== item.slot.bookingOfferingId) {
          throw new Error(`Booking resource ${item.slot.bookingResourceId} has no matching offering`);
        }
        result = await addBooking({
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
        cartId: result?.id ?? null,
      });
      booking_service_state.setKey("calendar", bookingServiceCalendar());
      return result;
    },

    removeFromCart(lineItemId: string): Promise<Cart> {
      return removeItem(lineItemId);
    },

    async fetchQuote(): Promise<CartQuote | null> {
      if (!cart.get() || booking_items.get().length === 0) return null;
      booking_service_state.setKey("fetchingQuote", true);
      booking_service_state.setKey("quoteError", null);
      try {
        const value = await fetchQuote();
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
        return await checkout(input);
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
      try {
        return client.utils.formatPrice(offering.price, language);
      } catch {
        return "";
      }
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
        const language = requireLocale();
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

  function submitForm(params: SubmitFormParams, options?: RequestOptions): Promise<StorefrontFormSubmission> {
    return client.forms.submit(params, options);
  }

  function submitFormByKey(params: ArkySubmitFormByKeyParams, options?: RequestOptions): Promise<StorefrontFormSubmission> {
    if (params.form.key !== params.key) throw new Error("The form shown isn't the form named by the key");
    return submitForm(
      { form_id: params.form.id, id: params.id, language: params.language, answers: buildFormAnswers(params.form, params.values) },
      options,
    );
  }

  async function loadProducts(
    params: FindStorefrontProductsParams = {},
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
    params: FindStorefrontBookingServicesParams = {},
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

  const cart_store = {
    cart,
    product_items,
    booking_items,
    subscription_plan_items,
    quote_result: quote,
    promotion_codes,
    last_order,
    status: cart_status,
    product_item_count,
    item_count,
    load: loadCart,
    create: createCart,
    addProduct,
    setProductQuantity,
    addBooking,
    addSubscriptionPlan,
    removeItem,
    setDeliveryGroups,
    setBillingAddress,
    setBuyer,
    setPromotionCodes,
    selectShippingMethod,
    setFutureDeliveries,
    quoteFutureDeliveries,
    clear: clearCart,
    clearLocal: clearLocalCart,
    quote: fetchQuote,
    checkout,
    retainCheckout,
    pendingCheckout: () => client.eshop.cart.pendingCheckout(),
    recoverCheckout,
    paymentAction: (orderId: string) => client.eshop.order.paymentAction({ order_id: orderId }),
  };

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
    sales_channel_key,
    locale,
    currency,
    allowed_payment_option_ids,
    customer: {
      identify: client.customer.identify,
      requestCode: client.customer.requestCode,
      verify: client.customer.verify,
      refresh: client.customer.refresh,
      logout: client.customer.logout,
      getMe: client.customer.getMe,
      updateMe: client.customer.updateMe,
      resubscribe: client.customer.resubscribe,
    },
    onAuthStateChanged: client.onAuthStateChanged,
    get hasSession() {
      return client.hasSession;
    },
    get isAuthenticated() {
      return client.isAuthenticated;
    },
    ensureSession,
    setMarket,
    setSalesChannel,
    setLocale,
    setContext,
    getMarket: () => market_key.get(),
    getSalesChannel: () => sales_channel_key.get(),
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
      order: client.eshop.order,
      library: client.eshop.library,
      return: client.eshop.return,
      rental: client.eshop.rental,
      paymentMethod: client.eshop.paymentMethod,
      subscription: client.eshop.subscription,
      cart: cart_store,
    },
    companies: client.companies,
    subscription_offerings: client.subscription_offerings,
    subscription_plans: client.subscription_plans,
    actions: {
      track: trackCustomerAction,
      pageView(data: Record<string, unknown> = {}) {
        return trackCustomerAction({ key: "page.view", data });
      },
    },
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

type InitializedStoreCore = ReturnType<typeof initializeStoreCore>;

export type InitializedStore = InitializedStoreCore & {
  withContext(context: ArkyStoreContext): InitializedStore;
};

function initializeStore(publishableKey: string, config: ArkyStoreConfig, scopedClient?: StorefrontClient): InitializedStore {
  const store = initializeStoreCore(publishableKey, config, scopedClient);
  return Object.assign(store, {
    withContext(context: ArkyStoreContext): InitializedStore {
      return initializeStore(
        publishableKey,
        {
          ...config,
          locale: context.locale ?? store.getLocale(),
          market: context.market ?? store.getMarket(),
          salesChannel: context.salesChannel ?? store.getSalesChannel(),
        },
        store.client.withContext(context),
      );
    },
  });
}

export function initialize(publishableKey: string, options: ArkyStoreConfig = {}): InitializedStore {
  return initializeStore(publishableKey, options);
}

export type ArkyStore = InitializedStore;
export type ArkyCartStore = ArkyStore["eshop"]["cart"];
export type ArkyBookingServiceStore = ArkyStore["eshop"]["bookingService"];
