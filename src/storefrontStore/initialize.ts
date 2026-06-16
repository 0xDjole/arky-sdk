import { atom, computed, map } from "nanostores";
import { createStorefront, type ProfileSession } from "../index";
import type {
  Address,
  Block,
  Cart,
  EshopCartItem,
  CollectionEntry,
  Form,
  FormEntry,
  FormField,
  FormSchema,
  FormSubmission,
  Market,
  OrderCheckoutResult,
  OrderQuote,
  PaginatedResponse,
  PaymentMethod,
  Price,
  Product,
  ProductVariant,
  Provider,
  Service,
  ServiceProvider,
  Store,
  ZoneLocation,
} from "../types";
import type {
  AvailabilityResponse,
  CheckoutItemInput,
  FindServiceProvidersParams,
  GetAvailabilityParams,
  GetCollectionParams,
  GetEntriesParams,
  GetEntryParams,
  GetProductParams,
  GetProductsParams,
  GetProviderParams,
  GetProvidersParams,
  GetServiceParams,
  GetServicesParams,
  ProductCheckoutItemInput,
  RequestOptions,
  ServiceCheckoutItemInput,
  SlotRange,
  SubmitFormParams,
} from "../types/api";
import type { Activity, ExperimentUseResponse, TrackParams, UseExperimentParams } from "../api/storefront";
import type {
  ArkyCalendarDay,
  ArkyCmsEntryParams,
  ArkyCartInput,
  ArkyCartStatus,
  ArkyCmsState,
  ArkyEshopState,
  ArkyLastOrder,
  ArkyServiceCartItem,
  ArkyServiceSlot,
  ArkyServiceState,
  ArkyStoreContext,
  ArkyStoreConfig,
} from "./types";
import {
  availableStock,
  createId,
  createServiceInitialState,
  entitySlug,
  formFieldsFromBlocks,
  formSchemaToBlock,
  formatServiceSlotTime,
  getSlotsForDate,
  hasAvailableSlotsForDate,
  locationToAddress,
  normalizeForms,
  normalizeTimezoneGroups,
  priceForMarket,
  productName,
  providerName,
  readErrorMessage,
  serviceName,
  toProductCheckoutItems,
  toServiceCheckoutItems,
} from "./utils";

export function initialize(config: ArkyStoreConfig) {
  const client = createStorefront(config);
  const session = atom<ProfileSession | null>(client.session);
  const locale = atom(config.locale || client.getLocale());
  const market_key = atom(config.market || client.getMarket());
  const market = computed(session, (value) => value?.market || null);
  const currency = computed(market, (value) => value?.currency || null);
  const allowed_payment_methods = computed(market, (value) => value?.payment_methods || []);
  const payment_config = computed(session, (value) => {
    const store = value?.store as Store & { payment?: unknown };
    const methods = value?.market?.payment_methods || [];
    const hasCreditCard = methods.some((method: PaymentMethod) => method.id === "credit_card");
    return { provider: store?.payment || null, enabled: hasCreditCard && !!store?.payment };
  });

  const cart = atom<Cart | null>(null);
  const product_items = atom<EshopCartItem[]>([]);
  const service_items = atom<ArkyServiceCartItem[]>([]);
  const quote = atom<OrderQuote | null>(null);
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

  function rawProductItemCount(value: Cart | null): number {
    return (value?.items || []).reduce((total, item) => {
      if (item.type !== "product") return total;
      return total + (item.quantity || 0);
    }, 0);
  }

  function rawServiceItemCount(value: Cart | null): number {
    return (value?.items || []).reduce((total, item) => {
      if (item.type !== "service") return total;
      return total + Math.max(1, item.slots?.length || 0);
    }, 0);
  }

  const product_item_count = computed([cart, product_items], (cartValue, items) =>
    Math.max(
      rawProductItemCount(cartValue),
      items.reduce((total, item) => total + (item.quantity || 0), 0),
    ),
  );
  const service_item_count = computed([cart, service_items], (cartValue, items) =>
    Math.max(rawServiceItemCount(cartValue), items.length),
  );
  const item_count = computed(
    [cart, product_item_count, service_item_count],
    (cartValue, products, services) => Math.max(cartValue?.item_count || 0, products + services),
  );
  const snapshot = computed([cart, product_items, service_items, item_count], (cartValue, products, services, count) => ({
    cart: cartValue,
    product_items: products,
    service_items: services,
    item_count: count,
  }));
  let cartWriteRevision = 0;
  let sessionRequest: Promise<ProfileSession | null> | null = null;
  let cartRequest: Promise<Cart> | null = null;

  function nextCartWriteRevision(): number {
    cartWriteRevision += 1;
    return cartWriteRevision;
  }

  const cms_state = map<ArkyCmsState>({
    entries: {},
    forms: {},
    loading: false,
    error: null,
  });
  const eshop_state = map<ArkyEshopState>({
    products: [],
    services: [],
    providers: [],
    product_cursor: null,
    service_cursor: null,
    provider_cursor: null,
    availability: null,
    loading_products: false,
    loading_services: false,
    loading_providers: false,
    loading_availability: false,
    error: null,
  });
  const service_state = map<ArkyServiceState>(createServiceInitialState());
  const service_form_node = atom<{ blocks: Block[] } | null>(null);
  const service_form_blocks = computed(service_form_node, (node) => node?.blocks || []);

  client.onAuthStateChanged((value) => session.set(value));
  currency.subscribe((value) => service_state.setKey("currency", value));
  session.subscribe((value) => {
    const methods = value?.market?.payment_methods || [];
    if (methods.length && service_state.get().availablePaymentMethods.length === 0) {
      service_state.setKey("availablePaymentMethods", methods);
    }
  });

  function currentMarketKey(): string {
    return market_key.get() || client.getMarket() || market.get()?.key || "";
  }

  function currentLocale(): string {
    return locale.get() || client.getLocale() || "en";
  }

  function currentCurrency(): string | null {
    return currency.get() || market.get()?.currency || null;
  }

  function marketForLocale(value: string): string | null {
    return config.marketForLocale?.(value) || null;
  }

  async function ensureSession(): Promise<ProfileSession | null> {
    const current = session.get();
    const marketKey = currentMarketKey();
    if (current && (!marketKey || current.market?.key === marketKey)) return current;
    if (!sessionRequest) {
      sessionRequest = identify({ market: marketKey }).finally(() => {
        sessionRequest = null;
      });
    }
    return sessionRequest;
  }

  async function identify(params: { email?: string; verify?: boolean; market?: string } = {}) {
    if (params.market) setMarket(params.market);
    const result = await client.identify({ ...params, market: params.market || currentMarketKey() });
    session.set(result);
    return result;
  }

  function setMarket(key: string): void {
    market_key.set(key);
    client.setMarket(key);
  }

  function setLocale(value: string, options: { market?: string } = {}): void {
    locale.set(value);
    client.setLocale(value);
    const nextMarket = options.market || marketForLocale(value);
    if (nextMarket) setMarket(nextMarket);
  }

  function setContext(context: ArkyStoreContext): void {
    if (context.locale) {
      setLocale(context.locale, { market: context.market });
      return;
    }
    if (context.market) setMarket(context.market);
  }

  async function ensureCart(): Promise<Cart> {
    if (cartRequest) return cartRequest;

    cart_status.setKey("loading", true);
    cart_status.setKey("error", null);
    const refreshRevision = cartWriteRevision;
    cartRequest = (async () => {
      await ensureSession();
      const response = await client.cart.refresh({ market: currentMarketKey() });
      await hydrateCart(response, { ifRevision: refreshRevision });
      return response;
    })();

    try {
      return await cartRequest;
    } catch (error) {
      cart_status.setKey("error", readErrorMessage(error, "Failed to load cart."));
      throw error;
    } finally {
      cartRequest = null;
      cart_status.setKey("loading", false);
    }
  }

  async function hydrateProductItem(item: ProductCheckoutItemInput, source: Cart): Promise<EshopCartItem | null> {
    try {
      const product = await client.eshop.product.get({ id: item.product_id });
      const variant = product.variants.find((candidate) => candidate.id === item.variant_id);
      if (!variant) return null;
      return {
        id: item.id || createId("product"),
        product_id: product.id,
        variant_id: variant.id,
        product_name: productName(product, currentLocale()),
        product_slug: entitySlug(product, currentLocale()),
        variant_attributes: variant.attributes as EshopCartItem["variant_attributes"],
        requires_shipping: variant.requires_shipping !== false,
        price: priceForMarket(variant.prices, currentMarketKey(), currentCurrency()),
        quantity: item.quantity,
        added_at: source.created_at ? source.created_at * 1000 : Date.now(),
        max_stock: availableStock(client, variant),
      };
    } catch {
      return null;
    }
  }

  async function hydrateServiceItems(items: ServiceCheckoutItemInput[]): Promise<ArkyServiceCartItem[]> {
    const rows: ArkyServiceCartItem[] = [];
    for (const item of items) {
      let service: Service | null = null;
      let provider: Provider | null = null;
      try {
        service = await client.eshop.service.get({ id: item.service_id });
      } catch {}
      try {
        provider = await client.eshop.provider.get({ id: item.provider_id });
      } catch {}
      for (const [index, slot] of item.slots.entries()) {
        rows.push({
          id: item.id || createId(`service_${index}`),
          service_id: item.service_id,
          provider_id: item.provider_id,
          from: slot.from,
          to: slot.to,
          forms: item.forms || [],
          service_name: service ? serviceName(service, currentLocale()) : item.service_id,
          provider_name: provider ? providerName(provider, currentLocale()) : item.provider_id,
        });
      }
    }
    return rows;
  }

  async function hydrateCart(response: Cart, options: { ifRevision?: number } = {}): Promise<Cart> {
    if (options.ifRevision !== undefined && options.ifRevision !== cartWriteRevision) {
      return cart.get() || response;
    }
    cart.set(response);
    cart_status.setKey("user_token", response.token || null);
    cart_status.setKey("selected_shipping_method_id", response.shipping_method_id || null);
    promo_code.set(response.promo_code || null);
    quote.set(response.quote_snapshot || null);

    const items = response.items || [];
    const products = await Promise.all(
      items
        .filter((item): item is ProductCheckoutItemInput => item.type === "product")
        .map((item) => hydrateProductItem(item, response)),
    );
    const services = await hydrateServiceItems(
      items.filter((item): item is ServiceCheckoutItemInput => item.type === "service"),
    );
    product_items.set(products.filter((item): item is EshopCartItem => item !== null));
    service_items.set(services);
    return response;
  }

  function checkoutItems(input: ArkyCartInput = {}): CheckoutItemInput[] {
    return [
      ...toProductCheckoutItems(input.product_items || product_items.get()),
      ...toServiceCheckoutItems(input.service_items || service_items.get()),
    ];
  }

  async function syncCart(input: ArkyCartInput = {}, writeRevision = nextCartWriteRevision()): Promise<Cart> {
    cart_status.setKey("syncing", true);
    cart_status.setKey("error", null);
    try {
      const current = cart.get() || await ensureCart();
      const response = await client.cart.update({
        id: current.id,
        market: currentMarketKey(),
        items: checkoutItems(input),
        shipping_address: input.shipping_address || undefined,
        billing_address: input.billing_address || undefined,
        forms: normalizeForms(input.forms),
        promo_code: input.promo_code === undefined ? promo_code.get() || undefined : input.promo_code || undefined,
        payment_method_id: input.payment_method_id || undefined,
        shipping_method_id:
          input.shipping_method_id ||
          cart_status.get().selected_shipping_method_id ||
          undefined,
      });
      if (input.promo_code !== undefined) promo_code.set(input.promo_code);
      if (input.shipping_method_id !== undefined) {
        cart_status.setKey("selected_shipping_method_id", input.shipping_method_id);
      }
      await hydrateCart(response, { ifRevision: writeRevision });
      return response;
    } catch (error) {
      cart_status.setKey("error", readErrorMessage(error, "Failed to sync cart."));
      throw error;
    } finally {
      cart_status.setKey("syncing", false);
    }
  }

  async function addProduct(product: Product, variant: ProductVariant, quantity = 1): Promise<Cart> {
    cart_status.setKey("error", null);
    const writeRevision = nextCartWriteRevision();
    try {
      const current = cart.get() || await ensureCart();
      const response = await client.cart.addItem({
        id: current.id,
        item: {
          type: "product",
          product_id: product.id,
          variant_id: variant.id,
          quantity,
        },
      });
      await hydrateCart(response, { ifRevision: writeRevision });
      await client.activity.track({ key: "cart_added", payload: { product_id: product.id, variant_id: variant.id, quantity } });
      return response;
    } catch (error) {
      cart_status.setKey("error", readErrorMessage(error, "Failed to add product to cart."));
      throw error;
    }
  }

  async function setProductQuantity(itemId: string, quantity: number): Promise<Cart> {
    const writeRevision = nextCartWriteRevision();
    const next = product_items.get().map((item) => {
      if (item.id !== itemId) return item;
      const bounded = item.max_stock ? Math.min(Math.max(1, quantity), item.max_stock) : Math.max(1, quantity);
      return { ...item, quantity: bounded };
    });
    product_items.set(next);
    return syncCart({ product_items: next }, writeRevision);
  }

  async function removeProduct(itemId: string): Promise<Cart | null> {
    const writeRevision = nextCartWriteRevision();
    const item = product_items.get().find((candidate) => candidate.id === itemId);
    product_items.set(product_items.get().filter((candidate) => candidate.id !== itemId));
    const current = cart.get();
    if (!current || !item) return null;
    const response = await client.cart.removeItem({
      id: current.id,
      item_id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
    });
    await hydrateCart(response, { ifRevision: writeRevision });
    await client.activity.track({ key: "cart_removed", payload: { product_id: item.product_id, variant_id: item.variant_id } });
    return response;
  }

  async function addServiceItem(item: ArkyServiceCartItem): Promise<Cart> {
    const writeRevision = nextCartWriteRevision();
    const next = [...service_items.get(), item];
    service_items.set(next);
    return syncCart({ service_items: next }, writeRevision);
  }

  async function removeServiceItem(itemId: string): Promise<Cart> {
    const writeRevision = nextCartWriteRevision();
    const next = service_items.get().filter((item) => item.id !== itemId);
    service_items.set(next);
    return syncCart({ service_items: next }, writeRevision);
  }

  async function clearCart(): Promise<Cart | null> {
    const writeRevision = nextCartWriteRevision();
    const current = cart.get();
    clearLocalCart();
    if (!current) return null;
    const response = await client.cart.clear({ id: current.id });
    await hydrateCart(response, { ifRevision: writeRevision });
    return response;
  }

  function clearLocalCart(): void {
    product_items.set([]);
    service_items.set([]);
    cart.set(null);
    quote.set(null);
    promo_code.set(null);
    cart_status.setKey("selected_shipping_method_id", null);
  }

  async function fetchQuote(input: ArkyCartInput = {}): Promise<OrderQuote | null> {
    if (checkoutItems(input).length === 0) {
      quote.set(null);
      return null;
    }
    cart_status.setKey("fetching_quote", true);
    cart_status.setKey("quote_error", null);
    try {
      const current = await syncCart(input);
      const response = await client.cart.quote({ id: current.id });
      quote.set(response);
      return response;
    } catch (error) {
      quote.set(null);
      cart_status.setKey("quote_error", readErrorMessage(error, "Failed to fetch quote."));
      throw error;
    } finally {
      cart_status.setKey("fetching_quote", false);
    }
  }

  async function checkout(input: ArkyCartInput = {}): Promise<OrderCheckoutResult> {
    if (checkoutItems(input).length === 0) throw new Error("Cart is empty");
    cart_status.setKey("processing_checkout", true);
    cart_status.setKey("error", null);
    try {
      const current = await syncCart(input);
      await client.activity.track({ key: "checkout_started", payload: { cart_id: current.id } });
      const response = await client.cart.checkout({
        id: current.id,
        payment_method_id: input.payment_method_id || undefined,
      });
      const quoteValue = quote.get();
      const stored: ArkyLastOrder = {
        order_id: response.order_id,
        number: response.number,
        client_secret: response.client_secret,
        payment: response.payment,
        product_items: input.product_items || product_items.get(),
        service_items: input.service_items || service_items.get(),
        shipping_address: input.shipping_address || null,
        billing_address: input.billing_address || null,
        total: quoteValue?.payment?.total || quoteValue?.total || response.payment?.total,
        currency: quoteValue?.payment?.currency || currentCurrency(),
        payment_method_id: input.payment_method_id || null,
        created_at: Date.now(),
      };
      last_order.set(stored);
      if (input.clear_after_checkout !== false) {
        clearLocalCart();
      }
      await client.activity.track({ key: "purchase", payload: { order_id: response.order_id, number: response.number } });
      return response;
    } catch (error) {
      cart_status.setKey("error", readErrorMessage(error, "Checkout failed."));
      throw error;
    } finally {
      cart_status.setKey("processing_checkout", false);
    }
  }

  function serviceCalendar(): ArkyCalendarDay[] {
    const state = service_state.get();
    const { currentMonth, selectedDate, startDate, endDate, availability, selectedProviderId } = state;
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
      const isSelected = iso === selectedDate || iso === startDate || iso === endDate;
      let isInRange = false;
      if (startDate && endDate) {
        const time = date.getTime();
        isInRange = time > new Date(startDate).getTime() && time < new Date(endDate).getTime();
      }

      cells.push({
        date,
        iso,
        available: hasAvailableSlotsForDate(availability, iso, selectedProviderId),
        isSelected,
        isInRange,
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

  function computeServiceSlots(dateStr: string): ArkyServiceSlot[] {
    const state = service_state.get();
    const { availability, selectedProviderId, timezone, service } = state;
    return getSlotsForDate(availability, dateStr, selectedProviderId).map((slot, index) => ({
      id: `${service?.id || "service"}-${slot.from}-${index}`,
      serviceId: service?.id || "",
      providerId: slot.providerId,
      from: slot.from,
      to: slot.to,
      timeText: formatServiceSlotTime(slot.from, slot.to, timezone),
      dateText: new Date(slot.from * 1000).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      }),
    }));
  }

  function toServiceCartItem(slot: ArkyServiceSlot): ArkyServiceCartItem {
    return {
      id: slot.id,
      service_id: slot.serviceId,
      provider_id: slot.providerId,
      from: slot.from,
      to: slot.to,
      forms: [],
      service_name: slot.serviceName,
      date_text: slot.dateText,
      time_text: slot.timeText,
      is_multi_day: slot.isMultiDay,
    };
  }

  function fromServiceCartItem(item: ArkyServiceCartItem): ArkyServiceSlot {
    return {
      id: item.id,
      serviceId: item.service_id,
      providerId: item.provider_id,
      from: item.from,
      to: item.to,
      serviceName: item.service_name || "",
      date: item.date_text || "",
      dateText: item.date_text || "",
      timeText: item.time_text || formatServiceSlotTime(item.from, item.to, service_state.get().timezone),
      isMultiDay: item.is_multi_day,
    };
  }

  function setServiceCartFromServiceItems(items: readonly ArkyServiceCartItem[]): void {
    const next = items.map(fromServiceCartItem);
    const current = service_state.get().cart;
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      service_state.setKey("cart", next);
    }
  }

  async function syncServiceCart(slots: ArkyServiceSlot[]): Promise<Cart> {
    try {
      return await syncCart({
        product_items: product_items.get(),
        service_items: slots.map(toServiceCartItem),
      });
    } catch (error) {
      service_state.setKey("quoteError", readErrorMessage(error, "Failed to sync service cart."));
      throw error;
    }
  }

  function serviceCurrentStepName(): string {
    const state = service_state.get();
    if (!state.service) return "";
    if (!state.selectedSlot || !state.dateTimeConfirmed) return "datetime";
    return "review";
  }

  const service_current_step_name = computed(service_state, serviceCurrentStepName);
  const service_can_proceed = computed(service_state, (state) => {
    const step = serviceCurrentStepName();
    if (step === "datetime") {
      return state.isMultiDay
        ? !!(state.startDate && state.endDate && state.selectedSlot)
        : !!(state.selectedDate && state.selectedSlot);
    }
    if (step === "review") return true;
    return false;
  });
  const service_month_year = computed(service_state, (state) =>
    state.currentMonth.toLocaleString(undefined, { month: "long", year: "numeric" }),
  );
  const service_chain_start = computed(service_state, (state) => {
    if (!state.cart.length) return null;
    return Math.max(...state.cart.map((slot) => slot.to));
  });
  const service_total_steps = computed(service_state, (state) => state.service ? 2 : 0);
  const service_steps = computed(service_state, () => ({
    1: { name: "datetime" },
    2: { name: "review" },
  }));
  const service_current_step = computed([service_current_step_name, service_steps], (name, steps) => {
    for (const [idx, step] of Object.entries(steps)) {
      if (step.name === name) return Number(idx);
    }
    return 1;
  });

  function formatServiceDateDisplay(value: string | null): string {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function serviceProviderId(provider: Provider | ServiceProvider): string {
    return "provider_id" in provider ? provider.provider_id : provider.id;
  }

  function getFirstServiceProviderEntry(state: ArkyServiceState): ServiceProvider | null {
    const serviceWithProviders = state.service as (Service & { providers?: ServiceProvider[] }) | null;
    const providers = serviceWithProviders?.providers;
    if (!providers?.length) return null;
    if (state.selectedProviderId) {
      const match = providers.find((provider) => provider.provider_id === state.selectedProviderId);
      if (match) return match;
    }
    return providers[0];
  }

  async function loadServiceForm(): Promise<Block[]> {
    try {
      const form = await loadForm({ key: "order-form" });
      const blocks = (form.schema || []).map(formSchemaToBlock);
      service_form_node.set({ blocks });
      return blocks;
    } catch {
      service_form_node.set({ blocks: [] });
      return [];
    }
  }

  const service_controller = {
    async initialize(): Promise<void> {
      service_state.setKey("tzGroups", normalizeTimezoneGroups(client.utils.tzGroups));
      await ensureCart();
      setServiceCartFromServiceItems(service_items.get());
      const methods = session.get()?.market?.payment_methods || [];
      if (methods.length) service_state.setKey("availablePaymentMethods", methods);
      await loadServiceForm();
    },

    setTimezone(tz: string): void {
      service_state.setKey("timezone", tz);
      service_state.setKey("calendar", serviceCalendar());
      const state = service_state.get();
      if (state.selectedDate) {
        service_state.setKey("slots", computeServiceSlots(state.selectedDate));
        service_state.setKey("selectedSlot", null);
      }
    },

    async select(service: Service): Promise<void> {
      service_state.setKey("loading", true);
      try {
        const isMultiDayBlock = service.blocks?.find((block) => block.key === "isMultiDay");
        const blockValue = isMultiDayBlock?.value;
        const isMultiDay = Array.isArray(blockValue) ? blockValue[0] === true : blockValue === true;
        const [fullService, serviceProviders] = await Promise.all([
          client.eshop.service.get({ id: service.id }),
          client.eshop.service.findProviders({ service_id: service.id }) as Promise<Array<Provider | ServiceProvider>>,
        ]);
        const providerIds = [...new Set(serviceProviders.map(serviceProviderId))];
        const providerResults = await Promise.all(
          providerIds.map((id) => client.eshop.provider.get({ id }).catch(() => null)),
        );

        service_state.set({
          ...service_state.get(),
          service: fullService,
          providers: providerResults.filter((provider): provider is Provider => provider !== null),
          selectedProviderId: null,
          availability: null,
          selectedDate: null,
          startDate: null,
          endDate: null,
          slots: [],
          selectedSlot: null,
          currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          loading: false,
          isMultiDay,
        });

        await service_controller.loadMonth();
      } catch (error) {
        service_state.setKey("loading", false);
        throw error;
      }
    },

    async loadMonth(): Promise<void> {
      const state = service_state.get();
      if (!state.service) return;
      service_state.setKey("loading", true);
      try {
        const chainedStart = service_chain_start.get();
        let from: number;
        let to: number;
        if (chainedStart) {
          from = chainedStart;
          to = chainedStart;
        } else {
          const month = state.currentMonth;
          from = Math.floor(Date.UTC(month.getFullYear(), month.getMonth(), 1) / 1000);
          to = Math.floor(Date.UTC(month.getFullYear(), month.getMonth() + 1, 1) / 1000);
        }
        const availability = await loadAvailability({
          service_id: state.service.id,
          from,
          to,
        });
        service_state.setKey("availability", availability);
        service_state.setKey("calendar", serviceCalendar());
      } finally {
        service_state.setKey("loading", false);
      }
    },

    prevMonth(): void {
      const { currentMonth } = service_state.get();
      service_state.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      void service_controller.loadMonth();
    },

    nextMonth(): void {
      const { currentMonth } = service_state.get();
      service_state.setKey("currentMonth", new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      void service_controller.loadMonth();
    },

    selectProvider(providerId: string | null): void {
      service_state.set({
        ...service_state.get(),
        selectedProviderId: providerId,
        selectedDate: null,
        startDate: null,
        endDate: null,
        slots: [],
        selectedSlot: null,
      });
      void service_controller.loadMonth();
    },

    selectDate(cell: ArkyCalendarDay): void {
      if (cell.blank || !cell.available) return;
      service_state.setKey("dateTimeConfirmed", false);
      const state = service_state.get();
      if (state.isMultiDay) {
        if (!state.startDate) {
          service_state.setKey("startDate", cell.iso);
          service_state.setKey("selectedDate", cell.iso);
          service_state.setKey("endDate", null);
          service_state.setKey("selectedSlot", null);
        } else if (!state.endDate) {
          if (cell.date.getTime() < new Date(state.startDate).getTime()) {
            service_state.setKey("startDate", cell.iso);
            service_state.setKey("endDate", state.startDate);
          } else {
            service_state.setKey("endDate", cell.iso);
          }
          service_controller.createMultiDaySlots();
        } else {
          service_state.setKey("startDate", cell.iso);
          service_state.setKey("selectedDate", cell.iso);
          service_state.setKey("endDate", null);
          service_state.setKey("selectedSlot", null);
        }
        service_controller.updateCalendar();
      } else {
        service_state.set({
          ...state,
          selectedDate: cell.iso,
          slots: computeServiceSlots(cell.iso),
          selectedSlot: null,
        });
        service_state.setKey("calendar", serviceCalendar());
      }
    },

    createMultiDaySlots(): void {
      const state = service_state.get();
      if (!state.startDate || !state.endDate || !state.availability) return;
      const slots: ArkyServiceSlot[] = [];
      for (let day = new Date(state.startDate); day <= new Date(state.endDate); day.setDate(day.getDate() + 1)) {
        const iso = day.toISOString().slice(0, 10);
        for (const slot of getSlotsForDate(state.availability, iso, state.selectedProviderId)) {
          slots.push({
            id: `${state.service?.id || "service"}-${slot.from}-${slots.length}`,
            serviceId: state.service?.id || "",
            providerId: slot.providerId,
            from: slot.from,
            to: slot.to,
            timeText: formatServiceSlotTime(slot.from, slot.to, state.timezone),
            dateText: new Date(slot.from * 1000).toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: state.timezone,
            }),
            isMultiDay: true,
          });
        }
      }
      service_state.setKey("slots", slots);
      service_state.setKey("selectedSlot", slots.length === 1 ? slots[0] : null);
    },

    selectTimeSlot(slot: ArkyServiceSlot | null): void {
      service_state.setKey("dateTimeConfirmed", false);
      service_state.setKey("selectedSlot", slot);
    },

    resetDateSelection(): void {
      service_state.setKey("selectedDate", null);
      service_state.setKey("startDate", null);
      service_state.setKey("endDate", null);
      service_state.setKey("slots", []);
      service_state.setKey("selectedSlot", null);
      service_state.setKey("dateTimeConfirmed", false);
    },

    updateCalendar(): void {
      service_state.setKey("calendar", serviceCalendar());
    },

    findFirstAvailable(): void {
      for (const day of service_state.get().calendar) {
        if (!day.blank && day.available) {
          service_controller.selectDate(day);
          return;
        }
      }
    },

    async addToCart(): Promise<void> {
      const state = service_state.get();
      const serviceBlocks = ((state.service as (Service & { forms?: Block[] }) | null)?.forms || []);
      const enrich = (slot: ArkyServiceSlot): ArkyServiceSlot => ({
        ...slot,
        serviceName: state.service ? serviceName(state.service, currentLocale()) : "",
        date: slot.dateText,
        serviceBlocks,
      });
      const selected = state.isMultiDay && state.slots.length > 0
        ? state.slots.map(enrich)
        : state.selectedSlot
          ? [enrich(state.selectedSlot)]
          : [];
      if (!selected.length) return;
      const nextCart = [...state.cart, ...selected];
      service_state.set({
        ...state,
        cart: nextCart,
        selectedDate: null,
        startDate: null,
        endDate: null,
        slots: [],
        selectedSlot: null,
      });
      await syncServiceCart(nextCart);
      service_state.setKey("calendar", serviceCalendar());
    },

    async removeFromCart(slotId: string): Promise<void> {
      const nextCart = service_state.get().cart.filter((slot) => slot.id !== slotId);
      service_state.setKey("cart", nextCart);
      await syncServiceCart(nextCart);
    },

    async clearCart(): Promise<void> {
      service_state.setKey("cart", []);
      await syncServiceCart([]);
    },

    async checkout(paymentMethodId?: string, forms: Block[] = []): Promise<{ success: true; data: OrderCheckoutResult } | { success: false; error: string }> {
      const state = service_state.get();
      if (!state.cart.length) return { success: false, error: "Cart is empty" };
      service_state.setKey("loading", true);
      try {
        const result = await checkout({
          service_items: state.cart.map((slot) => ({
            ...toServiceCartItem(slot),
            forms: [],
          })),
          payment_method_id: paymentMethodId,
          promo_code: state.promoCode || undefined,
          forms,
        });
        service_state.setKey("cartId", cart.get()?.id || null);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: readErrorMessage(error, "Checkout failed.") };
      } finally {
        service_state.setKey("loading", false);
      }
    },

    async fetchQuote(paymentMethodId?: string, promoCode?: string | null): Promise<OrderQuote | null> {
      const state = service_state.get();
      if (!state.cart.length) return null;
      service_state.setKey("fetchingQuote", true);
      service_state.setKey("quoteError", null);
      try {
        service_state.setKey("promoCode", promoCode || null);
        const response = await fetchQuote({
          service_items: state.cart.map(toServiceCartItem),
          payment_method_id: paymentMethodId,
          promo_code: promoCode || undefined,
        });
        service_state.setKey("cartId", cart.get()?.id || null);
        service_state.setKey("quote", response);
        const methods = response?.payment_methods || session.get()?.market?.payment_methods || [];
        if (methods.length) service_state.setKey("availablePaymentMethods", methods);
        return response;
      } catch (error) {
        service_state.setKey("quoteError", readErrorMessage(error, "Failed to fetch quote."));
        return null;
      } finally {
        service_state.setKey("fetchingQuote", false);
      }
    },

    getProvidersList(): Provider[] {
      return service_state.get().providers;
    },

    prevStep(): void {
      const current = serviceCurrentStepName();
      if (current === "review") {
        service_state.setKey("dateTimeConfirmed", false);
        return;
      }
      if (current === "datetime") {
        service_state.setKey("selectedSlot", null);
        service_state.setKey("dateTimeConfirmed", false);
      }
    },

    nextStep(): void {
      if (serviceCurrentStepName() === "datetime" && service_can_proceed.get()) {
        service_state.setKey("dateTimeConfirmed", true);
      }
    },

    getServicePrice(): string {
      const state = service_state.get();
      if (state.quote?.total !== undefined) return String(state.quote.total);
      const provider = getFirstServiceProviderEntry(state);
      if (!provider?.prices) return "";
      return client.utils.formatPrice(provider.prices) || "0";
    },

    formatDateDisplay: formatServiceDateDisplay,
    serviceItemsFromSlots(slots: ArkyServiceSlot[]): ArkyServiceCartItem[] {
      return slots.map(toServiceCartItem);
    },
  };

  service_items.subscribe((items) => setServiceCartFromServiceItems(items));

  async function loadEntry(params: ArkyCmsEntryParams, options?: RequestOptions): Promise<CollectionEntry> {
    cms_state.setKey("loading", true);
    cms_state.setKey("error", null);
    try {
      const { locale: nextLocale, market: nextMarket, ...entryParams } = params;
      setContext({ locale: nextLocale, market: nextMarket });

      if (entryParams.id) {
        const entry = await client.cms.entry.get(entryParams as GetEntryParams, options);
        const cacheKey = entryParams.key || entryParams.id || entry.id;
        cms_state.setKey("entries", { ...cms_state.get().entries, [cacheKey]: entry });
        return entry;
      }

      if (!entryParams.collection_id || !entryParams.key) {
        throw new Error("ArkyCmsEntryParams requires id, or collection_id and key");
      }

      const result = await client.cms.entry.find(
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
        throw new Error("CMS entry not found");
      }
      cms_state.setKey("entries", { ...cms_state.get().entries, [entryParams.key]: entry });
      return entry;
    } catch (error) {
      cms_state.setKey("error", readErrorMessage(error, "Failed to load CMS entry."));
      throw error;
    } finally {
      cms_state.setKey("loading", false);
    }
  }

  async function loadForm(params: { id?: string; key?: string }, options?: RequestOptions): Promise<Form> {
    cms_state.setKey("loading", true);
    cms_state.setKey("error", null);
    try {
      const form = await client.cms.form.get(params, options);
      const key = params.key || params.id || form.key || form.id;
      cms_state.setKey("forms", { ...cms_state.get().forms, [key]: form });
      return form;
    } catch (error) {
      cms_state.setKey("error", readErrorMessage(error, "Failed to load CMS form."));
      throw error;
    } finally {
      cms_state.setKey("loading", false);
    }
  }

  async function submitFormByKey(
    key: string,
    fieldsOrBlocks: FormField[] | Block[],
    options?: RequestOptions,
  ): Promise<FormSubmission> {
    const forms = cms_state.get().forms;
    const form = forms[key] || await loadForm({ key });
    const fields = fieldsOrBlocks.length > 0 && "properties" in fieldsOrBlocks[0]
      ? formFieldsFromBlocks(fieldsOrBlocks as Block[])
      : fieldsOrBlocks as FormField[];
    const payload: SubmitFormParams = { form_id: form.id, fields };
    return client.cms.form.submit(payload, options);
  }

  async function loadProducts(params: GetProductsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Product>> {
    eshop_state.setKey("loading_products", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.product.find(params, options);
      eshop_state.setKey("products", response.items || []);
      eshop_state.setKey("product_cursor", response.cursor || null);
      return response;
    } catch (error) {
      eshop_state.setKey("error", readErrorMessage(error, "Failed to load products."));
      throw error;
    } finally {
      eshop_state.setKey("loading_products", false);
    }
  }

  async function loadServices(params: GetServicesParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Service>> {
    eshop_state.setKey("loading_services", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.service.find(params, options);
      eshop_state.setKey("services", response.items || []);
      eshop_state.setKey("service_cursor", response.cursor || null);
      return response;
    } catch (error) {
      eshop_state.setKey("error", readErrorMessage(error, "Failed to load services."));
      throw error;
    } finally {
      eshop_state.setKey("loading_services", false);
    }
  }

  async function loadProviders(params: GetProvidersParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Provider>> {
    eshop_state.setKey("loading_providers", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.provider.find(params, options);
      eshop_state.setKey("providers", response.items || []);
      eshop_state.setKey("provider_cursor", response.cursor || null);
      return response;
    } catch (error) {
      eshop_state.setKey("error", readErrorMessage(error, "Failed to load providers."));
      throw error;
    } finally {
      eshop_state.setKey("loading_providers", false);
    }
  }

  async function loadAvailability(params: GetAvailabilityParams, options?: RequestOptions) {
    eshop_state.setKey("loading_availability", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.service.getAvailability(params, options);
      eshop_state.setKey("availability", response);
      return response;
    } catch (error) {
      eshop_state.setKey("error", readErrorMessage(error, "Failed to load availability."));
      throw error;
    } finally {
      eshop_state.setKey("loading_availability", false);
    }
  }

  async function useExperiment(params: string | UseExperimentParams): Promise<ExperimentUseResponse> {
    await ensureSession();
    const input = typeof params === "string" ? { key: params } : params;
    return client.experiments.use(input);
  }

  async function trackActivity(params: TrackParams): Promise<void> {
    await ensureSession();
    return client.activity.track(params);
  }

  const cart_store = {
    cart,
    product_items,
    service_items,
    quote_result: quote,
    promo_code,
    last_order,
    status: cart_status,
    product_item_count,
    service_item_count,
    item_count,
    snapshot,
    ensure: ensureCart,
    hydrate: hydrateCart,
    sync: syncCart,
    addProduct,
    setProductQuantity,
    removeProduct,
    addServiceItem,
    removeServiceItem,
    clear: clearCart,
    clearLocal: clearLocalCart,
    quote: fetchQuote,
    checkout,
    applyPromoCode(code: string, input: Omit<ArkyCartInput, "promo_code"> = {}) {
      promo_code.set(code);
      return fetchQuote({ ...input, promo_code: code });
    },
    removePromoCode(input: Omit<ArkyCartInput, "promo_code"> = {}) {
      promo_code.set(null);
      return fetchQuote({ ...input, promo_code: null });
    },
    selectShippingMethod(id: string | null) {
      cart_status.setKey("selected_shipping_method_id", id);
    },
    locationToAddress,
    buildItems: checkoutItems,
    buildProductItems: toProductCheckoutItems,
    buildServiceItems: toServiceCheckoutItems,
  };

  const product_store = {
    get: (params: GetProductParams, options?: RequestOptions) => client.eshop.product.get(params, options),
    find: loadProducts,
    list: loadProducts,
    loadListing: loadProducts,
    loadDetail: (params: GetProductParams, options?: RequestOptions) => client.eshop.product.get(params, options),
  };

  const service_store = {
    get: (params: GetServiceParams, options?: RequestOptions) => client.eshop.service.get(params, options),
    find: loadServices,
    list: loadServices,
    loadListing: loadServices,
    loadDetail: (params: GetServiceParams, options?: RequestOptions) => client.eshop.service.get(params, options),
    listProviders: (params: FindServiceProvidersParams, options?: RequestOptions) => client.eshop.service.findProviders(params, options),
    findProviders: (params: FindServiceProvidersParams, options?: RequestOptions) => client.eshop.service.findProviders(params, options),
    getAvailability: loadAvailability,
    state: service_state,
    form_blocks: service_form_blocks,
    current_step_name: service_current_step_name,
    can_proceed: service_can_proceed,
    month_year: service_month_year,
    chain_start: service_chain_start,
    total_steps: service_total_steps,
    steps: service_steps,
    current_step: service_current_step,
    initialize: service_controller.initialize,
    select: service_controller.select,
    setTimezone: service_controller.setTimezone,
    loadMonth: service_controller.loadMonth,
    prevMonth: service_controller.prevMonth,
    nextMonth: service_controller.nextMonth,
    selectProvider: service_controller.selectProvider,
    selectDate: service_controller.selectDate,
    createMultiDaySlots: service_controller.createMultiDaySlots,
    selectTimeSlot: service_controller.selectTimeSlot,
    resetDateSelection: service_controller.resetDateSelection,
    updateCalendar: service_controller.updateCalendar,
    findFirstAvailable: service_controller.findFirstAvailable,
    addToCart: service_controller.addToCart,
    removeFromCart: service_controller.removeFromCart,
    clearCart: service_controller.clearCart,
    getProvidersList: service_controller.getProvidersList,
    prevStep: service_controller.prevStep,
    nextStep: service_controller.nextStep,
    getServicePrice: service_controller.getServicePrice,
    formatDateDisplay: service_controller.formatDateDisplay,
    serviceItemsFromSlots: service_controller.serviceItemsFromSlots,
  };

  return {
    client,
    session,
    market,
    market_key,
    locale,
    currency,
    allowed_payment_methods,
    payment_config,
    hydrateCart: ensureCart,
    identify,
    verify: client.verify,
    me: client.me,
    logout: client.logout,
    onAuthStateChanged: client.onAuthStateChanged,
    get currentSession() {
      return session.get();
    },
    get isAuthenticated() {
      return client.isAuthenticated;
    },
    setMarket,
    setLocale,
    setContext,
    getStoreId: client.getStoreId,
    getMarket: currentMarketKey,
    getLocale: currentLocale,
    cms: {
      state: cms_state,
      collection: {
        get: (params: GetCollectionParams, options?: RequestOptions) => client.cms.collection.get(params, options),
      },
      entry: {
        get: loadEntry,
        find: (params: GetEntriesParams, options?: RequestOptions) => client.cms.entry.find(params, options),
      },
      form: {
        get: loadForm,
        submit: (params: SubmitFormParams, options?: RequestOptions) => client.cms.form.submit(params, options),
        submitByKey: submitFormByKey,
      },
      taxonomy: client.cms.taxonomy,
    },
    eshop: {
      state: eshop_state,
      product: product_store,
      service: service_store,
      provider: {
        get: (params: GetProviderParams, options?: RequestOptions) => client.eshop.provider.get(params, options),
        find: loadProviders,
      },
      order: client.eshop.order,
      cart: cart_store,
    },
    crm: client.crm,
    activity: {
      track(params: TrackParams) {
        return trackActivity(params);
      },
      pageView(payload: Record<string, unknown> = {}) {
        return trackActivity({ key: "page_view", payload });
      },
      state: atom<Activity | null>(null),
    },
    experiments: {
      use: useExperiment,
    },
    support: client.support,
    store: client.store,
    utils: client.utils,
  };
}

export type ArkyStore = ReturnType<typeof initialize>;
export type ArkyCartStore = ArkyStore["eshop"]["cart"];
export type ArkyServiceStore = ArkyStore["eshop"]["service"];
