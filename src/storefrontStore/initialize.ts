import { atom, computed, map } from "nanostores";
import {
  createStorefront,
  type StorefrontCustomerSession,
  type StorefrontIdentifyResult,
} from "../index";
import type { StorefrontMarket, StorefrontSetup } from "../api/storefront";
import type {
  StorefrontCart,
  StorefrontCollectionEntry,
  StorefrontForm,
  StorefrontFormSubmission,
  StorefrontOrderCheckoutResult,
  StorefrontOrderQuote,
  StorefrontPage,
  StorefrontParams,
  StorefrontProduct,
  StorefrontProductVariant,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontBookingOffering,
} from "../types/storefront";
import type {
  Address,
  Block,
  Cart,
  CartDigitalItem,
  EshopCartItem,
  CollectionEntry,
  Form,
  FormSubmission,
  OrderCheckoutResult,
  OrderQuote,
  PaginatedResponse,
  Price,
  Product,
  ProductVariant,
  BookingResource,
  BookingService,
  BookingOffering,
  ZoneLocation,
} from "../types";
import type {
  AvailabilityResponse,
  CheckoutCartParams,
  FindBookingOfferingsParams,
  GetAvailabilityParams,
  GetCollectionParams,
  GetEntriesByIdsParams,
  GetEntriesParams,
  GetEntryParams,
  GetFormParams,
  GetProductParams,
  GetProductsParams,
  GetBookingResourceParams,
  FindBookingResourcesParams,
  GetBookingServiceParams,
  FindBookingServicesParams,
  CartProductInput,
  CartDigitalItemInput,
  RequestOptions,
  CartBookingInput,
  SubmitFormParams,
} from "../types/api";
import type {
  ExperimentUseResponse,
  StorefrontActivity,
  TrackActivityParams,
  UseExperimentParams,
} from "../api/storefront";
import type {
  ArkyCalendarDay,
  ArkyContentEntryParams,
  ArkyCartInput,
  ArkyCartStatus,
  ArkyContentState,
  ArkyFormsState,
  ArkyEshopState,
  ArkyLastOrder,
  ArkyBookingCartItem,
  ArkyBookingSlot,
  ArkyBookingServiceState,
  ArkyStoreContext,
  ArkyStoreConfig,
  ArkySubmitFormByKeyParams,
} from "./types";
import {
  freeToSellStock,
  createFormEntryFromValues,
  createFormEntry,
  createId,
  createBookingServiceInitialState,
  productSlug,
  formSchemaToBlock,
  formatServiceSlotTime,
  getSlotsForDate,
  hasAvailableSlotsForDate,
  locationToAddress,
  normalizeTimezoneGroups,
  priceForMarket,
  productName,
  bookingResourceName,
  readErrorMessage,
  bookingServiceName,
  toCartProducts,
  toCartBookings,
} from "./utils";

type StorefrontCheckoutRequest = StorefrontParams<CheckoutCartParams>;

interface CheckoutContext {
  request: StorefrontCheckoutRequest;
  product_items: EshopCartItem[];
  booking_items: ArkyBookingCartItem[];
  digital_items: CartDigitalItem[];
  shipping_address: Address | null;
  billing_address: Address | null;
  payment_provider_id: string | null;
  clear_after_checkout: boolean;
  created_at: number;
}

function initializeStoreCore(
  publishableKey: string,
  config: ArkyStoreConfig,
  scopedClient?: ReturnType<typeof createStorefront>,
) {
  const client = scopedClient || createStorefront(publishableKey, config);
  const session = atom<StorefrontCustomerSession | null>(client.session);
  const setup = atom<StorefrontSetup | null>(null);
  const locale = atom(config.locale || client.getLocale());
  const market_key = atom(config.market || client.getMarket());
  const market = computed([setup, market_key], (setupValue, marketKey) => {
    const resolvedKey = marketKey || setupValue?.markets.default;
    return (
      setupValue?.markets.available.find(
        (candidate) => candidate.key === resolvedKey,
      ) || null
    );
  });
  const currency = computed(market, (value) => value?.currency || null);
  const allowed_payment_provider_ids = computed(
    market,
    (value) => value?.payment_provider_ids || [],
  );
  const cart = atom<StorefrontCart | null>(null);
  const product_items = atom<EshopCartItem[]>([]);
  const booking_items = atom<ArkyBookingCartItem[]>([]);
  const digital_items = atom<CartDigitalItem[]>([]);
  const quote = atom<StorefrontOrderQuote | null>(null);
  const promo_code = atom<string | null>(null);
  const last_order = atom<ArkyLastOrder | null>(null);
  const cart_status = map<ArkyCartStatus>({
    loading: false,
    syncing: false,
    fetching_quote: false,
    processing_checkout: false,
    error: null,
    quote_error: null,
    selected_shipping_method_id: null,
    user_token: null,
  });

  function rawProductItemCount(value: StorefrontCart | null): number {
    return (value?.product_items || []).reduce(
      (total, item) => total + (item.quantity || 0),
      0,
    );
  }

  function rawBookingItemCount(value: StorefrontCart | null): number {
    return (value?.booking_items || []).length;
  }

  function rawDigitalItemCount(value: StorefrontCart | null): number {
    return (value?.digital_items || []).length;
  }

  const product_item_count = computed(
    [cart, product_items],
    (cartValue, items) =>
      Math.max(
        rawProductItemCount(cartValue),
        items.reduce((total, item) => total + (item.quantity || 0), 0),
      ),
  );
  const booking_item_count = computed(
    [cart, booking_items],
    (cartValue, items) =>
      Math.max(rawBookingItemCount(cartValue), items.length),
  );
  const digital_item_count = computed(
    [cart, digital_items],
    (cartValue, items) =>
      Math.max(rawDigitalItemCount(cartValue), items.length),
  );
  const item_count = computed(
    [cart, product_item_count, booking_item_count, digital_item_count],
    (cartValue, products, services, digitalProducts) =>
      Math.max(
        cartValue?.item_count || 0,
        products + services + digitalProducts,
      ),
  );
  const snapshot = computed(
    [cart, product_items, booking_items, digital_items, item_count],
    (cartValue, products, services, digitalProducts, count) => ({
      cart: cartValue,
      product_items: products,
      booking_items: services,
      digital_items: digitalProducts,
      item_count: count,
    }),
  );
  let cartWriteRevision = 0;
  let sessionRequest: Promise<StorefrontCustomerSession | null> | null = null;
  let cartRequest: Promise<StorefrontCart> | null = null;

  function nextCartWriteRevision(): number {
    cartWriteRevision += 1;
    return cartWriteRevision;
  }

  const content_state = map<ArkyContentState>({
    entries: {},
    loading: false,
    error: null,
  });
  const forms_state = map<ArkyFormsState>({
    forms: {},
    loading: false,
    error: null,
  });
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
  const booking_service_state = map<ArkyBookingServiceState>(
    createBookingServiceInitialState(),
  );

  client.onAuthStateChanged((value) => session.set(value));
  currency.subscribe((value) => booking_service_state.setKey("currency", value));
  market.subscribe((value) => {
    const providerIds = value?.payment_provider_ids || [];
    if (
      providerIds.length &&
      booking_service_state.get().availablePaymentProviderIds.length === 0
    ) {
      booking_service_state.setKey("availablePaymentProviderIds", providerIds);
    }
  });

  function currentMarketKey(): string {
    return (
      market_key.get() ||
      client.getMarket() ||
      setup.get()?.markets.default ||
      ""
    );
  }

  function currentLocale(): string {
    return (
      locale.get() ||
      client.getLocale() ||
      setup.get()?.languages.default ||
      "en"
    );
  }

  async function loadSetup(): Promise<StorefrontSetup> {
    const current = setup.get();
    if (current) return current;
    const result = await client.getSetup();
    setup.set(result);
    if (!market_key.get() && result.markets.default) {
      market_key.set(result.markets.default);
    }
    if (!locale.get() && result.languages.default) {
      locale.set(result.languages.default);
    }
    return result;
  }

  async function ensureSession(): Promise<StorefrontCustomerSession | null> {
    const current = session.get();
    if (client.hasSession) return current;
    if (!sessionRequest) {
      sessionRequest = identify()
        .then(() => client.session)
        .finally(() => {
          sessionRequest = null;
        });
    }
    return sessionRequest;
  }

  async function identify(
    params: { email?: string; market?: string } = {},
  ): Promise<StorefrontIdentifyResult> {
    if (params.market) setMarket(params.market);
    const result = await client.customer.identify({
      ...params,
      market: params.market || currentMarketKey(),
    });
    return result;
  }

  function setMarket(key: string): void {
    const next = key.trim();
    const current = currentMarketKey();
    if (
      next &&
      current &&
      next !== current &&
      (cart.get()?.item_count || item_count.get()) > 0
    ) {
      throw Object.assign(
        new Error("Market cannot change while the cart contains items"),
        { code: "CART_MARKET_LOCKED" },
      );
    }
    market_key.set(next);
    client.setMarket(next);
  }

  function setLocale(value: string): void {
    locale.set(value);
    client.setLocale(value);
  }

  function setContext(context: ArkyStoreContext): void {
    if (context.market !== undefined) setMarket(context.market);
    if (context.locale !== undefined) setLocale(context.locale);
  }

  async function ensureCart(): Promise<StorefrontCart> {
    if (cartRequest) return cartRequest;

    cart_status.setKey("loading", true);
    cart_status.setKey("error", null);
    const refreshRevision = cartWriteRevision;
    cartRequest = (async () => {
      await ensureSession();
      const response = await client.eshop.cart.current();
      await applyCartResponse(response, { ifRevision: refreshRevision });
      return response;
    })();

    try {
      return await cartRequest;
    } catch (error) {
      cart_status.setKey(
        "error",
        readErrorMessage(error, "Failed to load cart."),
      );
      throw error;
    } finally {
      cartRequest = null;
      cart_status.setKey("loading", false);
    }
  }

  async function buildProductCartItem(
    item: CartProductInput,
    source: StorefrontCart,
    productHint?: StorefrontProduct,
  ): Promise<EshopCartItem | null> {
    try {
      const [product, inventory] = await Promise.all([
        productHint?.id === item.product_id
          ? Promise.resolve(productHint)
          : client.eshop.product.get({ id: item.product_id }),
        client.eshop.product.getInventory({ id: item.product_id }),
      ]);
      const variant = product.variants.find(
        (candidate) => candidate.id === item.variant_id,
      );
      if (!variant) {
        cart_status.setKey(
          "error",
          `Cart product ${item.product_id} references unavailable variant ${item.variant_id}.`,
        );
        return null;
      }
      return {
        id: item.id || createId("product"),
        product_id: product.id,
        variant_id: variant.id,
        product_name: productName(product, currentLocale()),
        product_slug: productSlug(product, currentLocale()),
        variant_attributes:
          variant.attributes as EshopCartItem["variant_attributes"],
        requires_shipping: variant.requires_shipping !== false,
        price: priceForMarket(
          variant.prices,
          currentMarketKey(),
          market.get()?.currency,
        ),
        quantity: item.quantity,
        form_submission_id: item.form_submission_id ?? null,
        added_at: source.created_at ? source.created_at * 1000 : Date.now(),
        max_stock: freeToSellStock(client, inventory, variant.id),
      };
    } catch (error) {
      cart_status.setKey(
        "error",
        readErrorMessage(
          error,
          `Failed to load cart product ${item.product_id}.`,
        ),
      );
      return null;
    }
  }

  async function buildBookingCartItems(
    items: CartBookingInput[],
  ): Promise<ArkyBookingCartItem[]> {
    return items.map((item) => ({
      id: item.id || createId("booking"),
      booking_offering_id: item.booking_offering_id,
      requested_interval: item.requested_interval,
      form_submission_id: item.form_submission_id ?? null,
    }));
  }

  async function applyCartResponse(
    response: StorefrontCart,
    options: { ifRevision?: number; productHint?: StorefrontProduct } = {},
  ): Promise<StorefrontCart> {
    if (
      options.ifRevision !== undefined &&
      options.ifRevision !== cartWriteRevision
    ) {
      return cart.get() || response;
    }
    cart.set(response);
    cart_status.setKey("user_token", response.token || null);
    cart_status.setKey(
      "selected_shipping_method_id",
      response.shipping_method_id || null,
    );
    promo_code.set(response.promo_code || null);
    quote.set(null);

    const cartProducts = response.product_items || [];
    const cartBookings = response.booking_items || [];
    const cartDigitalProducts = response.digital_items || [];
    if (cartProducts.length > 0 || cartBookings.length > 0) await loadSetup();
    const products = await Promise.all(
      cartProducts.map((item) =>
        buildProductCartItem(item, response, options.productHint),
      ),
    );
    const services = await buildBookingCartItems(cartBookings);
    product_items.set(
      products.filter((item): item is EshopCartItem => item !== null),
    );
    booking_items.set(services);
    digital_items.set(cartDigitalProducts);
    return response;
  }

  function checkoutProducts(input: ArkyCartInput = {}): CartProductInput[] {
    return toCartProducts(input.product_items || product_items.get());
  }

  function checkoutBookings(input: ArkyCartInput = {}): CartBookingInput[] {
    return toCartBookings(input.booking_items || booking_items.get());
  }

  function checkoutDigitalProducts(
    input: ArkyCartInput = {},
  ): CartDigitalItemInput[] {
    return (input.digital_items || digital_items.get()).map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      digital_product_id: item.digital_product_id,
      ...(item.form_submission_id
        ? { form_submission_id: item.form_submission_id }
        : {}),
    }));
  }

  async function syncCart(
    input: ArkyCartInput = {},
    writeRevision = nextCartWriteRevision(),
  ): Promise<StorefrontCart> {
    cart_status.setKey("syncing", true);
    cart_status.setKey("error", null);
    try {
      const current = cart.get() || (await ensureCart());
      const response = await client.eshop.cart.update({
        id: current.id,
        product_items: checkoutProducts(input),
        booking_items: checkoutBookings(input),
        digital_items: checkoutDigitalProducts(input),
        shipping_address: input.shipping_address,
        billing_address: input.billing_address,
        promo_code:
          input.promo_code === null
            ? ""
            : input.promo_code === undefined
              ? promo_code.get() || undefined
              : input.promo_code,
        payment_provider_id:
          input.payment_provider_id === null ? "" : input.payment_provider_id,
        shipping_method_id:
          input.shipping_method_id === null
            ? ""
            : input.shipping_method_id === undefined
              ? cart_status.get().selected_shipping_method_id || undefined
              : input.shipping_method_id,
      });
      await applyCartResponse(response, { ifRevision: writeRevision });
      return response;
    } catch (error) {
      cart_status.setKey(
        "error",
        readErrorMessage(error, "Failed to sync cart."),
      );
      throw error;
    } finally {
      cart_status.setKey("syncing", false);
    }
  }

  async function addProduct(
    product: StorefrontProduct,
    variant: StorefrontProductVariant,
    quantity = 1,
  ): Promise<StorefrontCart> {
    cart_status.setKey("error", null);
    const writeRevision = nextCartWriteRevision();
    try {
      const current = cart.get() || (await ensureCart());
      const response = await client.eshop.cart.addProduct({
        id: current.id,
        product: {
          product_id: product.id,
          variant_id: variant.id,
          quantity,
        },
      });
      await applyCartResponse(response, {
        ifRevision: writeRevision,
        productHint: product,
      });
      return response;
    } catch (error) {
      cart_status.setKey(
        "error",
        readErrorMessage(error, "Failed to add product to cart."),
      );
      throw error;
    }
  }

  async function setProductQuantity(
    itemId: string,
    quantity: number,
  ): Promise<StorefrontCart> {
    const writeRevision = nextCartWriteRevision();
    const next = product_items.get().map((item) => {
      if (item.id !== itemId) return item;
      const bounded = item.max_stock
        ? Math.min(Math.max(1, quantity), item.max_stock)
        : Math.max(1, quantity);
      return { ...item, quantity: bounded };
    });
    product_items.set(next);
    return syncCart({ product_items: next }, writeRevision);
  }

  async function removeProduct(itemId: string): Promise<StorefrontCart | null> {
    const writeRevision = nextCartWriteRevision();
    const item = product_items
      .get()
      .find((candidate) => candidate.id === itemId);
    product_items.set(
      product_items.get().filter((candidate) => candidate.id !== itemId),
    );
    const current = cart.get();
    if (!current || !item) return null;
    const response = await client.eshop.cart.removeItem({
      id: current.id,
      item_id: item.id,
    });
    await applyCartResponse(response, { ifRevision: writeRevision });
    return response;
  }

  async function addBooking(
    item: ArkyBookingCartItem,
  ): Promise<StorefrontCart> {
    const writeRevision = nextCartWriteRevision();
    const next = [...booking_items.get(), item];
    booking_items.set(next);
    return syncCart({ booking_items: next }, writeRevision);
  }

  async function addDigitalProduct(
    digitalProductId: string,
  ): Promise<StorefrontCart> {
    const writeRevision = nextCartWriteRevision();
    const current = cart.get() || (await ensureCart());
    const response = await client.eshop.cart.addDigital({
      id: current.id,
      digital: { digital_product_id: digitalProductId },
    });
    await applyCartResponse(response, { ifRevision: writeRevision });
    return response;
  }

  async function removeDigitalProduct(
    itemId: string,
  ): Promise<StorefrontCart | null> {
    const writeRevision = nextCartWriteRevision();
    const current = cart.get();
    if (!current) return null;
    const response = await client.eshop.cart.removeItem({
      id: current.id,
      item_id: itemId,
    });
    await applyCartResponse(response, { ifRevision: writeRevision });
    return response;
  }

  async function removeBooking(itemId: string): Promise<StorefrontCart> {
    const writeRevision = nextCartWriteRevision();
    const next = booking_items.get().filter((item) => item.id !== itemId);
    booking_items.set(next);
    return syncCart({ booking_items: next }, writeRevision);
  }

  async function clearCart(): Promise<StorefrontCart | null> {
    const writeRevision = nextCartWriteRevision();
    const current = cart.get();
    clearLocalCart();
    if (!current) return null;
    const response = await client.eshop.cart.clear({ id: current.id });
    await applyCartResponse(response, { ifRevision: writeRevision });
    return response;
  }

  function clearLocalCart(): void {
    product_items.set([]);
    booking_items.set([]);
    digital_items.set([]);
    cart.set(null);
    quote.set(null);
    promo_code.set(null);
    cart_status.setKey("selected_shipping_method_id", null);
  }

  async function fetchQuote(
    input: ArkyCartInput = {},
  ): Promise<StorefrontOrderQuote | null> {
    if (
      checkoutProducts(input).length === 0 &&
      checkoutBookings(input).length === 0 &&
      checkoutDigitalProducts(input).length === 0
    ) {
      quote.set(null);
      return null;
    }
    cart_status.setKey("fetching_quote", true);
    cart_status.setKey("quote_error", null);
    try {
      const current = await syncCart(input);
      const response = await client.eshop.cart.quote({ id: current.id });
      quote.set(response);
      return response;
    } catch (error) {
      quote.set(null);
      cart_status.setKey(
        "quote_error",
        readErrorMessage(error, "Failed to fetch quote."),
      );
      throw error;
    } finally {
      cart_status.setKey("fetching_quote", false);
    }
  }

  function finalizeCheckout(
    context: CheckoutContext,
    response: StorefrontOrderCheckoutResult,
  ): StorefrontOrderCheckoutResult {
    last_order.set({
      order_id: response.order_id,
      number: response.number,
      payment_action: response.payment_action,
      payment: response.payment,
      product_items: context.product_items,
      booking_items: context.booking_items,
      digital_items: context.digital_items,
      shipping_address: context.shipping_address,
      billing_address: context.billing_address,
      total: response.payment?.amounts.total ?? 0,
      currency: response.payment?.amounts.currency ?? null,
      payment_provider_id: context.payment_provider_id,
      created_at: context.created_at,
    });

    if (response.payment_action.type !== "none") return response;

    if (response.payment === null) {
      if (context.clear_after_checkout) clearLocalCart();
      return response;
    }

    if (
      context.clear_after_checkout &&
      !["pending", "processing", "requires_action", "unknown"].includes(
        response.payment.status,
      )
    ) {
      clearLocalCart();
    }
    return response;
  }

  async function runCheckout<T>(operation: () => Promise<T>): Promise<T> {
    cart_status.setKey("processing_checkout", true);
    cart_status.setKey("error", null);
    try {
      return await operation();
    } catch (error) {
      cart_status.setKey("error", readErrorMessage(error, "Checkout failed."));
      throw error;
    } finally {
      cart_status.setKey("processing_checkout", false);
    }
  }

  async function checkout(
    input: ArkyCartInput = {},
  ): Promise<StorefrontOrderCheckoutResult> {
    if (
      checkoutProducts(input).length === 0 &&
      checkoutBookings(input).length === 0 &&
      checkoutDigitalProducts(input).length === 0
    ) {
      throw new Error("Cart is empty");
    }
    return runCheckout(async () => {
      const current = await syncCart(input);
      const quoteValue = quote.get();
      const paymentProviderId =
        input.payment_provider_id ||
        current.payment_provider_id ||
        quoteValue?.payment_provider_id ||
        undefined;
      const returnUrl =
        input.return_url ||
        (typeof window !== "undefined" ? window.location.href : undefined);

      const context: CheckoutContext = {
        request: {
          id: current.id,
          payment_provider_id: paymentProviderId,
          return_url: returnUrl,
        },
        product_items: input.product_items || product_items.get(),
        booking_items: input.booking_items || booking_items.get(),
        digital_items: input.digital_items || digital_items.get(),
        shipping_address: input.shipping_address || null,
        billing_address: input.billing_address || null,
        payment_provider_id: paymentProviderId || null,
        clear_after_checkout: input.clear_after_checkout !== false,
        created_at: Date.now(),
      };
      const response = await client.eshop.cart.checkout(context.request);
      return finalizeCheckout(context, response);
    });
  }

  function bookingServiceCalendar(): ArkyCalendarDay[] {
    const state = booking_service_state.get();
    const { currentMonth, selectedDate, availability, selectedBookingResourceId } =
      state;
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: ArkyCalendarDay[] = [];
    const pad = (first.getDay() + 6) % 7;
    for (let i = 0; i < pad; i++) {
      cells.push({
        date: new Date(0),
        iso: "",
        available: false,
        isSelected: false,
        isInRange: false,
        isToday: false,
        blank: true,
      });
    }

    for (let day = 1; day <= last.getDate(); day++) {
      const date = new Date(year, monthIndex, day);
      const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        date,
        iso,
        available: hasAvailableSlotsForDate(
          availability,
          iso,
          selectedBookingResourceId,
        ),
        isSelected: iso === selectedDate,
        isInRange: false,
        isToday: date.getTime() === today.getTime(),
        blank: false,
      });
    }

    const suffix = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < suffix; i++) {
      cells.push({
        date: new Date(0),
        iso: "",
        available: false,
        isSelected: false,
        isInRange: false,
        isToday: false,
        blank: true,
      });
    }

    return cells;
  }

  function computeBookingServiceSlots(dateStr: string): ArkyBookingSlot[] {
    const state = booking_service_state.get();
    const {
      availability,
      selectedBookingResourceId,
      timezone,
      bookingService,
      bookingOfferings,
    } = state;
    return getSlotsForDate(
      availability,
      dateStr,
      selectedBookingResourceId,
    ).flatMap((slot, index) => {
      const offering = bookingOfferings.find(
        (candidate) =>
          candidate.booking_service_id === bookingService?.id &&
          candidate.booking_resource_id === slot.bookingResourceId,
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
          timeText: formatServiceSlotTime(slot.from, slot.to, timezone),
          dateText: new Date(slot.from * 1000).toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: timezone,
          }),
        },
      ];
    });
  }

  function toBookingCartItem(
    slot: ArkyBookingSlot,
    formSubmissionId?: string | null,
  ): ArkyBookingCartItem {
    if (
      !slot.bookingOfferingId ||
      !Number.isSafeInteger(slot.from) ||
      !Number.isSafeInteger(slot.to) ||
      slot.from >= slot.to
    ) {
      throw new Error("A booking contains an invalid appointment interval");
    }
    return {
      id: createId("booking"),
      booking_offering_id: slot.bookingOfferingId,
      requested_interval: { from: slot.from, to: slot.to },
      ...(formSubmissionId
        ? { form_submission_id: formSubmissionId }
        : {}),
      booking_service_id: slot.bookingServiceId,
      booking_resource_id: slot.bookingResourceId,
      booking_service_name: slot.bookingServiceName,
      date_text: slot.dateText,
      time_text: slot.timeText,
    };
  }

  async function syncBookingCart(
    items: ArkyBookingCartItem[],
  ): Promise<StorefrontCart> {
    try {
      return await syncCart({
        product_items: product_items.get(),
        booking_items: items,
      });
    } catch (error) {
      booking_service_state.setKey(
        "quoteError",
        readErrorMessage(error, "Failed to sync booking cart."),
      );
      throw error;
    }
  }

  function bookingServiceCurrentStepName(): string {
    const state = booking_service_state.get();
    if (!state.bookingService) return "";
    if (!state.selectedSlot || !state.dateTimeConfirmed) return "datetime";
    return "review";
  }

  const booking_service_current_step_name = computed(
    booking_service_state,
    bookingServiceCurrentStepName,
  );
  const booking_service_can_proceed = computed(booking_service_state, (state) => {
    const step = bookingServiceCurrentStepName();
    if (step === "datetime") {
      return !!(state.selectedDate && state.selectedSlot);
    }
    if (step === "review") return true;
    return false;
  });
  const booking_service_month_year = computed(booking_service_state, (state) =>
    state.currentMonth.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    }),
  );
  const booking_chain_start = computed(booking_items, (items) => {
    if (!items.length) return null;
    return Math.max(...items.map((item) => item.requested_interval.to));
  });
  const booking_service_total_steps = computed(booking_service_state, (state) =>
    state.bookingService ? 2 : 0,
  );
  const booking_service_steps = computed(booking_service_state, () => ({
    1: { name: "datetime" },
    2: { name: "review" },
  }));
  const booking_service_current_step = computed(
    [booking_service_current_step_name, booking_service_steps],
    (name, steps) => {
      for (const [idx, step] of Object.entries(steps)) {
        if (step.name === name) return Number(idx);
      }
      return 1;
    },
  );

  function formatBookingDateDisplay(value: string | null): string {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function resolveBookingOffering(
    state: ArkyBookingServiceState,
    bookingResourceId?: string | null,
  ): StorefrontBookingOffering | null {
    const bookingServiceId = state.bookingService?.id;
    if (!bookingServiceId) return null;
    const relationships = state.bookingOfferings.filter(
      (relationship) => relationship.booking_service_id === bookingServiceId,
    );
    const targetBookingResourceId =
      bookingResourceId ??
      state.selectedSlot?.bookingResourceId ??
      state.selectedBookingResourceId;
    if (targetBookingResourceId) {
      return (
        relationships.find(
          (relationship) =>
            relationship.booking_resource_id === targetBookingResourceId,
        ) || null
      );
    }
    return relationships.length === 1 ? relationships[0] : null;
  }

  const booking_service_controller = {
    async initialize(): Promise<void> {
      booking_service_state.setKey(
        "tzGroups",
        normalizeTimezoneGroups(client.utils.tzGroups),
      );
      await ensureCart();
      const providerIds = market.get()?.payment_provider_ids || [];
      if (providerIds.length)
        booking_service_state.setKey("availablePaymentProviderIds", providerIds);
    },

    setTimezone(tz: string): void {
      booking_service_state.setKey("timezone", tz);
      booking_service_state.setKey("calendar", bookingServiceCalendar());
      const state = booking_service_state.get();
      if (state.selectedDate) {
        booking_service_state.setKey(
          "slots",
          computeBookingServiceSlots(state.selectedDate),
        );
        booking_service_state.setKey("selectedSlot", null);
        booking_service_state.setKey("quote", null);
        booking_service_state.setKey("quoteError", null);
      }
    },

    async select(bookingService: StorefrontBookingService): Promise<void> {
      booking_service_state.set({
        ...booking_service_state.get(),
        bookingService: null,
        bookingOfferings: [],
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
        const [fullBookingService, bookingOfferings, bookingResourcePage] =
          await Promise.all([
            client.eshop.bookingService.get({ id: bookingService.id }),
            client.eshop.bookingOffering.find({
              booking_service_id: bookingService.id,
            }),
            client.eshop.bookingResource.find({
              booking_service_id: bookingService.id,
              limit: 200,
            }),
          ]);

        booking_service_state.set({
          ...booking_service_state.get(),
          bookingService: fullBookingService,
          bookingOfferings,
          bookingResources: bookingResourcePage.items,
          selectedBookingResourceId: null,
          availability: null,
          selectedDate: null,
          slots: [],
          selectedSlot: null,
          currentMonth: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1,
          ),
          loading: false,
          dateTimeConfirmed: false,
          quote: null,
          quoteError: null,
        });
        await booking_service_controller.loadMonth();
      } catch (error) {
        booking_service_state.setKey("loading", false);
        throw error;
      }
    },

    async loadMonth(): Promise<void> {
      const state = booking_service_state.get();
      if (!state.bookingService) return;
      booking_service_state.setKey("loading", true);
      try {
        const chainedStart = booking_chain_start.get();
        let from: number;
        let to: number;
        if (chainedStart) {
          from = chainedStart;
          to = chainedStart + 31 * 24 * 60 * 60;
        } else {
          const month = state.currentMonth;
          from = Math.floor(
            Date.UTC(month.getFullYear(), month.getMonth(), 1) / 1000,
          );
          to = Math.floor(
            Date.UTC(month.getFullYear(), month.getMonth() + 1, 1) / 1000,
          );
        }
        const availability = await loadBookingAvailability({
          booking_service_id: state.bookingService.id,
          from,
          to,
          ...(state.selectedBookingResourceId
            ? { booking_resource_id: state.selectedBookingResourceId }
            : {}),
        });
        booking_service_state.setKey("availability", availability);
        booking_service_state.setKey("calendar", bookingServiceCalendar());
      } finally {
        booking_service_state.setKey("loading", false);
      }
    },

    prevMonth(): void {
      const { currentMonth } = booking_service_state.get();
      booking_service_state.setKey(
        "currentMonth",
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
      );
      void booking_service_controller.loadMonth();
    },

    nextMonth(): void {
      const { currentMonth } = booking_service_state.get();
      booking_service_state.setKey(
        "currentMonth",
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
      );
      void booking_service_controller.loadMonth();
    },

    selectBookingResource(bookingResourceId: string | null): void {
      const state = booking_service_state.get();
      if (
        bookingResourceId &&
        !resolveBookingOffering(state, bookingResourceId)
      ) {
        throw new Error(
          `Booking resource ${bookingResourceId} has no active offering for the selected booking service`,
        );
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
      const state = booking_service_state.get();
      booking_service_state.set({
        ...state,
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
          throw new Error(
            "The selected slot does not belong to the selected booking service",
          );
        }
        if (
          state.selectedBookingResourceId &&
          slot.bookingResourceId !== state.selectedBookingResourceId
        ) {
          throw new Error(
            "The selected slot does not belong to the selected booking resource",
          );
        }
        const offering = resolveBookingOffering(
          state,
          slot.bookingResourceId,
        );
        if (!offering || offering.id !== slot.bookingOfferingId) {
          throw new Error(
            `Booking resource ${slot.bookingResourceId} has no matching active offering`,
          );
        }
      }
      booking_service_state.set({
        ...state,
        selectedSlot: slot,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
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

    async addToCart(
      explicitSlots?: ArkyBookingSlot[],
      formSubmissionId?: string | null,
    ): Promise<void> {
      const state = booking_service_state.get();
      const slots =
        explicitSlots || (state.selectedSlot ? [state.selectedSlot] : []);
      if (slots.length === 0) return;
      if (
        !state.bookingService ||
        slots.some(
          (slot) => slot.bookingServiceId !== state.bookingService?.id,
        )
      ) {
        throw new Error(
          "The booking slots do not belong to the selected booking service",
        );
      }
      const displayName = bookingServiceName(state.bookingService, currentLocale());
      const nextBookingItems = slots.map((slot) => {
        const offering = resolveBookingOffering(
          state,
          slot.bookingResourceId,
        );
        if (!offering || offering.id !== slot.bookingOfferingId) {
          throw new Error(
            `Booking resource ${slot.bookingResourceId} has no matching active offering`,
          );
        }
        return toBookingCartItem(
          {
            ...slot,
            bookingServiceName: displayName,
            date: slot.dateText,
          },
          formSubmissionId,
        );
      });
      const nextItems = [
        ...booking_items.get(),
        ...nextBookingItems,
      ];
      await syncBookingCart(nextItems);
      booking_service_state.set({
        ...booking_service_state.get(),
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      booking_service_state.setKey("calendar", bookingServiceCalendar());
    },

    async removeFromCart(bookingId: string): Promise<void> {
      await syncBookingCart(
        booking_items.get().filter((item) => item.id !== bookingId),
      );
    },

    async clearCart(): Promise<void> {
      await syncBookingCart([]);
    },

    async checkout(
      paymentProviderId?: string,
    ): Promise<StorefrontOrderCheckoutResult> {
      const state = booking_service_state.get();
      const items = booking_items.get();
      if (!items.length) throw new Error("Cart is empty");
      booking_service_state.setKey("loading", true);
      try {
        const result = await checkout({
          booking_items: items,
          payment_provider_id: paymentProviderId,
          promo_code: state.promoCode || undefined,
        });
        booking_service_state.setKey("cartId", cart.get()?.id || null);
        return result;
      } finally {
        booking_service_state.setKey("loading", false);
      }
    },

    async fetchQuote(
      paymentProviderId?: string,
      promoCode?: string | null,
    ): Promise<StorefrontOrderQuote | null> {
      const state = booking_service_state.get();
      const items = booking_items.get();
      if (!items.length) return null;
      booking_service_state.setKey("fetchingQuote", true);
      booking_service_state.setKey("quoteError", null);
      try {
        booking_service_state.setKey("promoCode", promoCode || null);
        const response = await fetchQuote({
          booking_items: items,
          payment_provider_id: paymentProviderId,
          promo_code: promoCode || undefined,
        });
        booking_service_state.setKey("cartId", cart.get()?.id || null);
        booking_service_state.setKey("quote", response);
        const providerIds =
          response?.payment_provider_ids ||
          market.get()?.payment_provider_ids ||
          [];
        if (providerIds.length)
          booking_service_state.setKey("availablePaymentProviderIds", providerIds);
        return response;
      } catch (error) {
        booking_service_state.setKey(
          "quoteError",
          readErrorMessage(error, "Failed to fetch quote."),
        );
        return null;
      } finally {
        booking_service_state.setKey("fetchingQuote", false);
      }
    },

    getBookingResourcesList(): StorefrontBookingResource[] {
      return booking_service_state.get().bookingResources;
    },

    prevStep(): void {
      const current = bookingServiceCurrentStepName();
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
      if (
        bookingServiceCurrentStepName() === "datetime" &&
        booking_service_can_proceed.get()
      ) {
        booking_service_state.setKey("dateTimeConfirmed", true);
      }
    },

    getBookingServicePrice(): string {
      const state = booking_service_state.get();
      const offering = resolveBookingOffering(state);
      if (!offering) return "";
      try {
        const price = priceForMarket(
          offering.prices,
          currentMarketKey(),
          market.get()?.currency,
        );
        return client.utils.formatPrice([price]);
      } catch {
        return "";
      }
    },

    formatDateDisplay: formatBookingDateDisplay,
    bookingItemsFromSlots(
      slots: ArkyBookingSlot[],
      formSubmissionId?: string | null,
    ): ArkyBookingCartItem[] {
      return slots.map((slot) =>
        toBookingCartItem(slot, formSubmissionId),
      );
    },
  };

  async function loadEntry(
    params: ArkyContentEntryParams,
    options?: RequestOptions,
  ): Promise<StorefrontCollectionEntry> {
    content_state.setKey("loading", true);
    content_state.setKey("error", null);
    try {
      const { locale: nextLocale, market: nextMarket, ...entryParams } = params;
      setContext({ locale: nextLocale, market: nextMarket });

      if (entryParams.id) {
        const entry = await client.content.entry.get(
          entryParams as GetEntryParams,
          options,
        );
        const cacheKey = entryParams.key || entryParams.id || entry.id;
        content_state.setKey("entries", {
          ...content_state.get().entries,
          [cacheKey]: entry,
        });
        return entry;
      }

      if (!entryParams.collection_id || !entryParams.key) {
        throw new Error(
          "ArkyContentEntryParams requires id, or collection_id and key",
        );
      }

      const result = await client.content.entry.find(
        {
          ...entryParams,
          collection_id: entryParams.collection_id,
          key: entryParams.key,
          limit: 1,
        } as GetEntriesParams,
        options,
      );
      const entry = result.items?.[0];
      if (!entry) {
        throw new Error("Content entry not found");
      }
      content_state.setKey("entries", {
        ...content_state.get().entries,
        [entryParams.key]: entry,
      });
      return entry;
    } catch (error) {
      content_state.setKey(
        "error",
        readErrorMessage(error, "Failed to load Content entry."),
      );
      throw error;
    } finally {
      content_state.setKey("loading", false);
    }
  }

  function formCacheKey(params: StorefrontParams<GetFormParams>): string {
    const identifier = params.id
      ? `id:${params.id}`
      : params.key
        ? `key:${params.key}`
        : "missing";
    return identifier;
  }

  async function loadForm(
    params: StorefrontParams<GetFormParams>,
    options?: RequestOptions,
  ): Promise<StorefrontForm> {
    forms_state.setKey("loading", true);
    forms_state.setKey("error", null);
    try {
      const form = await client.forms.get(params, options);
      const forms = { ...forms_state.get().forms };
      forms[formCacheKey({ id: form.id })] = form;
      forms[formCacheKey({ key: form.key })] = form;
      forms_state.setKey("forms", forms);
      return form;
    } catch (error) {
      forms_state.setKey(
        "error",
        readErrorMessage(error, "Failed to load Form."),
      );
      throw error;
    } finally {
      forms_state.setKey("loading", false);
    }
  }

  async function submitForm(
    params: StorefrontParams<SubmitFormParams>,
    options?: RequestOptions,
  ): Promise<StorefrontFormSubmission> {
    await ensureSession();
    return client.forms.submit(params, options);
  }

  async function submitFormByKey(
    params: ArkySubmitFormByKeyParams,
    options?: RequestOptions,
  ): Promise<StorefrontFormSubmission> {
    const form = await loadForm({ key: params.key }, options);
    const entry = createFormEntryFromValues(form, params.values);
    return submitForm({ form_id: form.id, fields: entry.fields }, options);
  }

  async function loadProducts(
    params: StorefrontParams<GetProductsParams> = {},
    options?: RequestOptions,
  ): Promise<StorefrontPage<Product>> {
    eshop_state.setKey("loading_products", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.product.find(params, options);
      eshop_state.setKey("products", response.items || []);
      eshop_state.setKey("product_cursor", response.cursor || null);
      return response;
    } catch (error) {
      eshop_state.setKey(
        "error",
        readErrorMessage(error, "Failed to load products."),
      );
      throw error;
    } finally {
      eshop_state.setKey("loading_products", false);
    }
  }

  async function loadBookingServices(
    params: StorefrontParams<FindBookingServicesParams> = {},
    options?: RequestOptions,
  ): Promise<StorefrontPage<BookingService>> {
    eshop_state.setKey("loading_booking_services", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.bookingService.find(params, options);
      eshop_state.setKey("bookingServices", response.items || []);
      eshop_state.setKey("booking_service_cursor", response.cursor || null);
      return response;
    } catch (error) {
      eshop_state.setKey(
        "error",
        readErrorMessage(error, "Failed to load booking services."),
      );
      throw error;
    } finally {
      eshop_state.setKey("loading_booking_services", false);
    }
  }

  async function loadBookingResources(
    params: StorefrontParams<FindBookingResourcesParams> = {},
    options?: RequestOptions,
  ): Promise<StorefrontPage<BookingResource>> {
    eshop_state.setKey("loading_booking_resources", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.bookingResource.find(params, options);
      eshop_state.setKey("bookingResources", response.items || []);
      eshop_state.setKey("booking_resource_cursor", response.cursor || null);
      return response;
    } catch (error) {
      eshop_state.setKey(
        "error",
        readErrorMessage(error, "Failed to load booking resources."),
      );
      throw error;
    } finally {
      eshop_state.setKey("loading_booking_resources", false);
    }
  }

  async function loadBookingAvailability(
    params: StorefrontParams<GetAvailabilityParams>,
    options?: RequestOptions,
  ) {
    eshop_state.setKey("loading_availability", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.bookingService.getAvailability(
        params,
        options,
      );
      eshop_state.setKey("availability", response);
      return response;
    } catch (error) {
      eshop_state.setKey(
        "error",
        readErrorMessage(error, "Failed to load availability."),
      );
      throw error;
    } finally {
      eshop_state.setKey("loading_availability", false);
    }
  }

  async function useExperiment(
    params: string | UseExperimentParams,
  ): Promise<ExperimentUseResponse> {
    await ensureSession();
    const input = typeof params === "string" ? { key: params } : params;
    return client.experiments.use(input);
  }

  async function trackActivity(params: TrackActivityParams): Promise<void> {
    await ensureSession();
    return client.actions.track(params);
  }

  const cart_store = {
    cart,
    product_items,
    booking_items,
    digital_items,
    quote_result: quote,
    promo_code,
    last_order,
    status: cart_status,
    product_item_count,
    booking_item_count,
    digital_item_count,
    item_count,
    snapshot,
    load: ensureCart,
    refresh: syncCart,
    addProduct,
    setProductQuantity,
    removeProduct,
    addBooking,
    removeBooking,
    addDigital: addDigitalProduct,
    removeDigital: removeDigitalProduct,
    clear: clearCart,
    clearLocal: clearLocalCart,
    quote: fetchQuote,
    checkout,
    applyPromoCode(
      code: string,
      input: Omit<ArkyCartInput, "promo_code"> = {},
    ) {
      return fetchQuote({ ...input, promo_code: code });
    },
    removePromoCode(input: Omit<ArkyCartInput, "promo_code"> = {}) {
      return fetchQuote({ ...input, promo_code: null });
    },
    selectShippingMethod(id: string | null) {
      cart_status.setKey("selected_shipping_method_id", id);
    },
    locationToAddress,
    createFormEntry,
    buildItems(input: ArkyCartInput = {}) {
      return {
        product_items: checkoutProducts(input),
        booking_items: checkoutBookings(input),
        digital_items: checkoutDigitalProducts(input),
      };
    },
    buildProductItems: toCartProducts,
    buildBookingItems: toCartBookings,
  };

  const product_store = {
    get: (
      params: StorefrontParams<GetProductParams>,
      options?: RequestOptions,
    ) => client.eshop.product.get(params, options),
    getInventory: (
      params: StorefrontParams<GetProductParams>,
      options?: RequestOptions,
    ) => client.eshop.product.getInventory(params, options),
    list: loadProducts,
  };

  const booking_service_store = {
    get: (
      params: StorefrontParams<GetBookingServiceParams>,
      options?: RequestOptions,
    ) => client.eshop.bookingService.get(params, options),
    list: loadBookingServices,
    listOfferings: (
      params: StorefrontParams<FindBookingOfferingsParams>,
      options?: RequestOptions,
    ) => client.eshop.bookingOffering.find(params, options),
    getAvailability: loadBookingAvailability,
    state: booking_service_state,
    current_step_name: booking_service_current_step_name,
    can_proceed: booking_service_can_proceed,
    month_year: booking_service_month_year,
    chain_start: booking_chain_start,
    total_steps: booking_service_total_steps,
    steps: booking_service_steps,
    current_step: booking_service_current_step,
    initialize: booking_service_controller.initialize,
    select: booking_service_controller.select,
    setTimezone: booking_service_controller.setTimezone,
    loadMonth: booking_service_controller.loadMonth,
    prevMonth: booking_service_controller.prevMonth,
    nextMonth: booking_service_controller.nextMonth,
    selectBookingResource:
      booking_service_controller.selectBookingResource,
    selectDate: booking_service_controller.selectDate,
    selectTimeSlot: booking_service_controller.selectTimeSlot,
    resetDateSelection: booking_service_controller.resetDateSelection,
    updateCalendar: booking_service_controller.updateCalendar,
    findFirstAvailable: booking_service_controller.findFirstAvailable,
    addToCart: booking_service_controller.addToCart,
    removeFromCart: booking_service_controller.removeFromCart,
    clearCart: booking_service_controller.clearCart,
    getBookingResourcesList:
      booking_service_controller.getBookingResourcesList,
    prevStep: booking_service_controller.prevStep,
    nextStep: booking_service_controller.nextStep,
    getBookingServicePrice:
      booking_service_controller.getBookingServicePrice,
    formatDateDisplay: booking_service_controller.formatDateDisplay,
    bookingItemsFromSlots:
      booking_service_controller.bookingItemsFromSlots,
  };

  return {
    client,
    session,
    setup,
    market,
    market_key,
    locale,
    currency,
    allowed_payment_provider_ids,
    customer: {
      identify,
      requestCode: client.customer.requestCode,
      verify: client.customer.verify,
      refresh: client.customer.refresh,
      logout: client.customer.logout,
      getMe: client.customer.getMe,
    },
    onAuthStateChanged: client.onAuthStateChanged,
    get hasSession() {
      return client.hasSession;
    },
    get isAuthenticated() {
      return client.isAuthenticated;
    },
    setMarket,
    setLocale,
    setContext,
    getMarket: currentMarketKey,
    getLocale: currentLocale,
    media: client.media,
    content: {
      state: content_state,
      collection: {
        get: (
          params: StorefrontParams<GetCollectionParams>,
          options?: RequestOptions,
        ) => client.content.collection.get(params, options),
      },
      entry: {
        get: loadEntry,
        find: (
          params: StorefrontParams<GetEntriesParams>,
          options?: RequestOptions,
        ) => client.content.entry.find(params, options),
        findByIds: (
          params: StorefrontParams<GetEntriesByIdsParams>,
          options?: RequestOptions,
        ) => client.content.entry.findByIds(params, options),
      },
    },
    forms: {
      state: forms_state,
      get: loadForm,
      submit: submitForm,
      submitByKey: submitFormByKey,
    },
    classification: client.classification,
    eshop: {
      state: eshop_state,
      digital: client.eshop.digital,
      product: product_store,
      bookingService: booking_service_store,
      bookingResource: {
        get: (
          params: StorefrontParams<GetBookingResourceParams>,
          options?: RequestOptions,
        ) => client.eshop.bookingResource.get(params, options),
        list: loadBookingResources,
      },
      bookingOffering: client.eshop.bookingOffering,
      order: client.eshop.order,
      cart: cart_store,
    },
    audiences: client.audiences,
    actions: {
      track(params: TrackActivityParams) {
        return trackActivity(params);
      },
      pageView(payload: Record<string, unknown> = {}) {
        return trackActivity({ key: "page.view", payload });
      },
      state: atom<StorefrontActivity | null>(null),
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

function initializeStore(
  publishableKey: string,
  config: ArkyStoreConfig,
  scopedClient?: ReturnType<typeof createStorefront>,
): InitializedStore {
  const store = initializeStoreCore(publishableKey, config, scopedClient);
  return Object.assign(store, {
    withContext(context: ArkyStoreContext): InitializedStore {
      return initializeStore(
        publishableKey,
        {
          ...config,
          locale: context.locale ?? store.getLocale(),
          market: context.market ?? store.getMarket(),
        },
        store.client.withContext(context),
      );
    },
  });
}

export function initialize(
  publishableKey: string,
  options: ArkyStoreConfig = {},
): InitializedStore {
  return initializeStore(publishableKey, options);
}

export type ArkyStore = InitializedStore;
export type ArkyCartStore = ArkyStore["eshop"]["cart"];
export type ArkyBookingServiceStore = ArkyStore["eshop"]["bookingService"];
