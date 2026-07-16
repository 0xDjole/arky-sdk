import { atom, computed, map } from "nanostores";
import { createStorefront, type ContactSession, type StorefrontIdentifyResult } from "../index";
import type {
  Address,
  Block,
  Cart,
  EshopCartItem,
  CollectionEntry,
  Form,
  FormEntry,
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
  ZoneLocation,
} from "../types";
import type {
  AvailabilityResponse,
  OrderCheckoutItemInput,
  FindServiceProvidersParams,
  GetAvailabilityParams,
  GetCollectionParams,
  GetEntriesParams,
  GetEntryParams,
  GetFormParams,
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
import type { ExperimentUseResponse, StorefrontAction, TrackActionParams, UseExperimentParams } from "../api/storefront";
import type {
  ArkyCalendarDay,
  ArkyCmsEntryParams,
  ArkyCartInput,
  ArkyCartStatus,
  ArkyCmsState,
  ArkyEshopState,
  ArkyLastOrder,
  ArkyServiceCartItem,
  ArkyServiceFormGroup,
  ArkyServiceFormState,
  ArkyServiceSlot,
  ArkyServiceState,
  ArkyStoreContext,
  ArkyStoreConfig,
  ArkyStripePaymentMountOptions,
  ArkySubmitFormByKeyParams,
} from "./types";
import { createStripeConfirmationTokenController, type StripeConfirmationTokenController } from "../payments/stripe";
import {
  availableStock,
  createFormEntryFromValues,
  createFormEntry,
  createId,
  createServiceInitialState,
  entitySlug,
  formSchemaToBlock,
  formatServiceSlotTime,
  getSlotsForDate,
  hasAvailableSlotsForDate,
  locationToAddress,
  normalizeTimezoneGroups,
  priceForMarket,
  productName,
  providerName,
  readErrorMessage,
  serviceName,
  toProductCheckoutItems,
  toServiceCheckoutItems,
} from "./utils";

function firstFiniteNumber(...values: Array<number | null | undefined>): number | undefined {
  return values.find((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function initializeStore(config: ArkyStoreConfig) {
  const client = createStorefront(config);
  const formClients = new Map<string, typeof client>([[client.getStoreId(), client]]);
  const session = atom<ContactSession | null>(client.session);
  const locale = atom(config.locale || client.getLocale());
  const market_key = atom(config.market || client.getMarket());
  const market = computed(session, (value) => value?.market || null);
  const currency = computed(market, (value) => value?.currency || null);
  const allowed_payment_methods = computed(market, (value) => value?.payment_methods || []);
  const payment_config = computed(session, (value) => {
    const store = value?.store;
    const methods = value?.market?.payment_methods || [];
    const hasCreditCard = methods.some((method: PaymentMethod) => method.type === "credit_card");
    return {
      provider: store?.payment || null,
      enabled: hasCreditCard && !!store?.payment,
    };
  });

  const cart = atom<Cart | null>(null);
  const product_items = atom<EshopCartItem[]>([]);
  const service_items = atom<ArkyServiceCartItem[]>([]);
  const quote = atom<OrderQuote | null>(null);
  const promo_code = atom<string | null>(null);
  const last_order = atom<ArkyLastOrder | null>(null);
  const payment_controller = atom<StripeConfirmationTokenController | null>(null);
  const payment_ready = computed(payment_controller, (value) => value !== null);
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
    Math.max(
      rawServiceItemCount(cartValue),
      items.reduce((total, item) => total + Math.max(1, item.slots.length), 0),
    ),
  );
  const item_count = computed([cart, product_item_count, service_item_count], (cartValue, products, services) =>
    Math.max(cartValue?.item_count || 0, products + services),
  );
  const snapshot = computed([cart, product_items, service_items, item_count], (cartValue, products, services, count) => ({
    cart: cartValue,
    product_items: products,
    service_items: services,
    item_count: count,
  }));
  let cartWriteRevision = 0;
  let sessionRequest: Promise<ContactSession | null> | null = null;
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
  const service_form_definitions = new Map<string, Form>();
  const service_form_state = map<ArkyServiceFormState>({
    provider_id: null,
    groups: [],
    loading: false,
    error: null,
  });
  const service_form_groups = computed(service_form_state, (state) => state.groups);
  const service_form_blocks = computed(service_form_groups, (groups) => groups.flatMap((group) => group.blocks));

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

  function clientForStore(storeId: string): typeof client {
    const existing = formClients.get(storeId);
    if (existing) return existing;
    const scoped = client.forStore(storeId);
    formClients.set(storeId, scoped);
    return scoped;
  }

  function currentStripePublishableKey(): string | null {
    const provider = payment_config.get()?.provider;
    return provider?.publishable_key || null;
  }

  function currentStripeConnectedAccountId(): string | null {
    const provider = payment_config.get()?.provider;
    return provider?.connected_account_id || null;
  }

  function currentPaymentAmount(): number {
    return Math.max(
      0,
      firstFiniteNumber(quote.get()?.charge_amount, cart.get()?.quote_snapshot?.charge_amount, cart.get()?.quote_snapshot?.total) ?? 0,
    );
  }

  function currentPaymentCurrency(): string | null {
    return quote.get()?.money?.currency?.trim() || cart.get()?.quote_snapshot?.money?.currency?.trim() || null;
  }

  function setPaymentController(controller: StripeConfirmationTokenController | null): StripeConfirmationTokenController | null {
    const current = payment_controller.get();
    if (current && current !== controller) {
      current.destroy();
    }
    payment_controller.set(controller);
    return controller;
  }

  function destroyPaymentController(): void {
    setPaymentController(null);
  }

  async function mountStripePayment(
    target: string | HTMLElement,
    options: ArkyStripePaymentMountOptions = {},
  ): Promise<StripeConfirmationTokenController> {
    const publishableKey = options.publishableKey || currentStripePublishableKey();
    if (!publishableKey) {
      throw new Error("Stripe publishable key is required to mount card payment");
    }
    const hasExplicitAmount = options.amount !== undefined;
    const hasExplicitCurrency = Boolean(options.currency?.trim());
    if (hasExplicitAmount !== hasExplicitCurrency) {
      throw new Error("Stripe amount and currency must be supplied together");
    }
    const amount = hasExplicitAmount ? options.amount! : currentPaymentAmount();
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("A positive minor-unit payment amount is required to mount card payment");
    }
    const paymentCurrency = hasExplicitCurrency ? options.currency!.trim() : currentPaymentCurrency();
    if (!paymentCurrency || !/^[a-z]{3}$/i.test(paymentCurrency)) {
      throw new Error("An explicit three-letter payment currency is required to mount card payment");
    }
    const controller = await createStripeConfirmationTokenController({
      publishableKey,
      connectedAccountId: options.connectedAccountId || currentStripeConnectedAccountId() || undefined,
      amount,
      currency: paymentCurrency,
      ...(options.appearance ? { appearance: options.appearance } : {}),
    });
    controller.mount(target);
    setPaymentController(controller);
    return controller;
  }

  function updatePaymentController(input: { amount?: number; currency?: string }): void {
    payment_controller.get()?.update(input);
  }

  function marketForLocale(value: string): string | null {
    return config.marketForLocale?.(value) || null;
  }

  async function ensureSession(): Promise<ContactSession | null> {
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

  async function identify(params: { email?: string; verify?: boolean; market?: string } = {}): Promise<StorefrontIdentifyResult> {
    if (params.market) setMarket(params.market);
    const result = await client.identify({
      ...params,
      market: params.market || currentMarketKey(),
    });
    session.set({
      contact: result.contact,
      store: result.store,
      market: result.market,
    });
    return result;
  }

  async function identifyContactEmailIfMissing(email: string): Promise<ContactSession> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Contact email is required");

    const current = session.get();
    if (current?.contact.email === normalizedEmail) return current;
    return identify({ email: normalizedEmail });
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
      const response = await client.eshop.cart.current({
        market: currentMarketKey(),
      });
      await applyCartResponse(response, { ifRevision: refreshRevision });
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

  async function buildProductCartItem(
    item: ProductCheckoutItemInput,
    source: Cart,
    productHint?: Product,
  ): Promise<EshopCartItem | null> {
    try {
      const product =
        productHint?.id === item.product_id
          ? productHint
          : await client.eshop.product.get({ id: item.product_id });
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
        price: priceForMarket(variant.prices, currentMarketKey(), market.get()?.currency),
        quantity: item.quantity,
        added_at: source.created_at ? source.created_at * 1000 : Date.now(),
        max_stock: availableStock(client, variant),
      };
    } catch {
      return null;
    }
  }

  async function buildServiceCartItems(items: ServiceCheckoutItemInput[]): Promise<ArkyServiceCartItem[]> {
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
      rows.push({
        id: item.id || createId("service"),
        service_id: item.service_id,
        provider_id: item.provider_id,
        slots: item.slots,
        forms: item.forms || [],
        service_name: service ? serviceName(service, currentLocale()) : item.service_id,
        provider_name: provider ? providerName(provider, currentLocale()) : item.provider_id,
      });
    }
    return rows;
  }

  async function applyCartResponse(
    response: Cart,
    options: { ifRevision?: number; productHint?: Product } = {},
  ): Promise<Cart> {
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
        .map((item) => buildProductCartItem(item, response, options.productHint)),
    );
    const services = await buildServiceCartItems(items.filter((item): item is ServiceCheckoutItemInput => item.type === "service"));
    product_items.set(products.filter((item): item is EshopCartItem => item !== null));
    service_items.set(services);
    return response;
  }

  function checkoutItems(input: ArkyCartInput = {}): OrderCheckoutItemInput[] {
    return [
      ...toProductCheckoutItems(input.product_items || product_items.get()),
      ...toServiceCheckoutItems(input.service_items || service_items.get()),
    ];
  }

  async function syncCart(input: ArkyCartInput = {}, writeRevision = nextCartWriteRevision()): Promise<Cart> {
    cart_status.setKey("syncing", true);
    cart_status.setKey("error", null);
    try {
      const current = cart.get() || (await ensureCart());
      const response = await client.eshop.cart.update({
        id: current.id,
        market: currentMarketKey(),
        items: checkoutItems(input),
        shipping_address: input.shipping_address,
        billing_address: input.billing_address,
        forms: input.forms,
        promo_code:
          input.promo_code === null
            ? ""
            : input.promo_code === undefined
              ? promo_code.get() || undefined
              : input.promo_code,
        payment_method_key: input.payment_method_key === null ? "" : input.payment_method_key,
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
      const current = cart.get() || (await ensureCart());
      const response = await client.eshop.cart.addItem({
        id: current.id,
        item: {
          type: "product",
          product_id: product.id,
          variant_id: variant.id,
          quantity,
        },
      });
      await applyCartResponse(response, { ifRevision: writeRevision, productHint: product });
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
    const response = await client.eshop.cart.removeItem({
      id: current.id,
      item_id: item.id,
    });
    await applyCartResponse(response, { ifRevision: writeRevision });
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
    const response = await client.eshop.cart.clear({ id: current.id });
    await applyCartResponse(response, { ifRevision: writeRevision });
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
      const response = await client.eshop.cart.quote({ id: current.id });
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
      const quoteValue = quote.get();
      const paymentMethodKey = input.payment_method_key || current.payment_method_key || quoteValue?.money?.payment_method_key || undefined;
      let chargeAmount = firstFiniteNumber(quoteValue?.charge_amount, current.quote_snapshot?.charge_amount);
      if (paymentMethodKey === "credit_card" && chargeAmount === undefined) {
        const latestQuote = await client.eshop.cart.quote({ id: current.id });
        quote.set(latestQuote);
        chargeAmount = firstFiniteNumber(latestQuote.charge_amount, latestQuote.total);
      }
      if (
        paymentMethodKey === "credit_card" &&
        (typeof chargeAmount !== "number" || !Number.isSafeInteger(chargeAmount) || chargeAmount < 0)
      ) {
        throw new Error("Card checkout requires a non-negative integer charge amount in minor units");
      }
      const needsConfirmationToken = paymentMethodKey === "credit_card" && typeof chargeAmount === "number" && chargeAmount > 0;
      let confirmationTokenId: string | undefined;
      let returnUrl = input.return_url;
      const paymentController = input.payment ?? payment_controller.get();

      if (needsConfirmationToken) {
        if (!paymentController) throw new Error("Payment controller is required for card checkout");
        returnUrl = returnUrl || (typeof window !== "undefined" ? window.location.href : undefined);
        const token = await paymentController.createConfirmationToken({
          return_url: returnUrl,
          billing_details: input.billing_details,
        });
        confirmationTokenId = token.confirmation_token_id;
        returnUrl = token.return_url || returnUrl;
      }

      const response = await client.eshop.cart.checkout({
        id: current.id,
        payment_method_key: paymentMethodKey,
        confirmation_token_id: confirmationTokenId,
        return_url: returnUrl,
      });

      if (response.payment_action.type === "handle_next_action") {
        if (!paymentController) throw new Error("Payment controller is required for card authentication");
        await paymentController.handleNextAction(response.payment_action.client_secret);
      }

      const stored: ArkyLastOrder = {
        order_id: response.order_id,
        number: response.number,
        payment_action: response.payment_action,
        payment: response.payment,
        product_items: input.product_items || product_items.get(),
        service_items: input.service_items || service_items.get(),
        shipping_address: input.shipping_address || null,
        billing_address: input.billing_address || null,
        total: response.payment.amount,
        currency: response.payment.currency,
        payment_method_key: paymentMethodKey || null,
        created_at: Date.now(),
      };
      last_order.set(stored);
      if (input.clear_after_checkout !== false) {
        clearLocalCart();
      }
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
    const { currentMonth, selectedDate, availability, selectedProviderId } = state;
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
        available: hasAvailableSlotsForDate(availability, iso, selectedProviderId),
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

  function toServiceCartItem(slots: ArkyServiceSlot[], forms: FormEntry[] = []): ArkyServiceCartItem {
    const orderedSlots = [...slots].sort((left, right) => left.from - right.from || left.to - right.to);
    const [first] = orderedSlots;
    if (!first) throw new Error("At least one service slot is required");
    if (orderedSlots.some((slot) => slot.serviceId !== first.serviceId || slot.providerId !== first.providerId)) {
      throw new Error("A booking can only contain slots for one service and provider");
    }
    if (orderedSlots.some((slot) => !Number.isSafeInteger(slot.from) || !Number.isSafeInteger(slot.to) || slot.from >= slot.to)) {
      throw new Error("A booking contains an invalid service slot");
    }
    for (let index = 1; index < orderedSlots.length; index += 1) {
      if (orderedSlots[index - 1].to !== orderedSlots[index].from) {
        throw new Error("A multi-slot booking must contain adjacent slots");
      }
    }
    return {
      id: createId("booking"),
      service_id: first.serviceId,
      provider_id: first.providerId,
      slots: orderedSlots.map(({ from, to }) => ({ from, to })),
      forms,
      service_name: first.serviceName,
      date_text: first.dateText,
      time_text: first.timeText,
      is_multi_day: orderedSlots.length > 1,
    };
  }

  async function syncServiceCart(items: ArkyServiceCartItem[]): Promise<Cart> {
    try {
      return await syncCart({
        product_items: product_items.get(),
        service_items: items,
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
      return !!(state.selectedDate && state.selectedSlot);
    }
    if (step === "review") return true;
    return false;
  });
  const service_month_year = computed(service_state, (state) =>
    state.currentMonth.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    }),
  );
  const service_chain_start = computed(service_items, (items) => {
    const slots = items.flatMap((item) => item.slots);
    if (!slots.length) return null;
    return Math.max(...slots.map((slot) => slot.to));
  });
  const service_total_steps = computed(service_state, (state) => (state.service ? 2 : 0));
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
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  function configuredServiceFormIds(relationship: ServiceProvider): string[] {
    const formIds = relationship.forms.map((entry) => entry.form_id.trim());
    if (formIds.some((formId) => !formId) || new Set(formIds).size !== formIds.length) {
      throw new Error(`Service provider ${relationship.provider_id} has blank or duplicate configured form IDs`);
    }
    return formIds;
  }

  function resolveServiceProvider(
    state: ArkyServiceState,
    providerId?: string | null,
  ): ServiceProvider | null {
    const serviceId = state.service?.id;
    if (!serviceId) return null;
    const relationships = state.serviceProviders.filter((relationship) => relationship.service_id === serviceId);
    const targetProviderId = providerId ?? state.selectedSlot?.providerId ?? state.selectedProviderId;
    if (targetProviderId) {
      return relationships.find((relationship) => relationship.provider_id === targetProviderId) || null;
    }
    return relationships.length === 1 ? relationships[0] : null;
  }

  function clearServiceFormState(error: string | null = null, loading = false): void {
    service_form_state.set({
      provider_id: null,
      groups: [],
      loading,
      error,
    });
  }

  function activateServiceProviderForms(
    providerId?: string | null,
    reset = false,
  ): ServiceProvider | null {
    const relationship = resolveServiceProvider(service_state.get(), providerId);
    if (!relationship) {
      clearServiceFormState();
      return null;
    }

    const formIds = configuredServiceFormIds(relationship);
    const current = service_form_state.get();
    const currentFormIds = current.groups.map((group) => group.form.id);
    if (
      !reset &&
      current.provider_id === relationship.provider_id &&
      currentFormIds.length === formIds.length &&
      currentFormIds.every((formId, index) => formId === formIds[index])
    ) {
      if (current.error) service_form_state.setKey("error", null);
      return relationship;
    }

    const groups: ArkyServiceFormGroup[] = formIds.map((formId) => {
      const form = service_form_definitions.get(formId);
      if (!form) throw new Error(`Configured booking form '${formId}' was not loaded`);
      return {
        form,
        blocks: form.schema.map(formSchemaToBlock),
      };
    });
    service_form_state.set({
      provider_id: relationship.provider_id,
      groups,
      loading: false,
      error: null,
    });
    return relationship;
  }

  async function loadServiceFormDefinitions(relationships: ServiceProvider[]): Promise<void> {
    const formIds = [
      ...new Set(relationships.flatMap((relationship) => configuredServiceFormIds(relationship))),
    ];
    if (formIds.length === 0) return;

    const forms = await Promise.all(formIds.map((formId) => loadForm({ id: formId })));
    for (let index = 0; index < forms.length; index += 1) {
      const form = forms[index];
      const formId = formIds[index];
      if (form.id !== formId) {
        throw new Error(`Configured booking form '${formId}' resolved to '${form.id}'`);
      }
    }
    for (const form of forms) service_form_definitions.set(form.id, form);
  }

  function configuredServiceFormEntries(relationship: ServiceProvider): FormEntry[] {
    const formIds = configuredServiceFormIds(relationship);
    if (formIds.length === 0) return [];
    activateServiceProviderForms(relationship.provider_id);
    const state = service_form_state.get();
    if (
      state.provider_id !== relationship.provider_id ||
      state.groups.length !== formIds.length ||
      state.groups.some((group, index) => group.form.id !== formIds[index])
    ) {
      throw new Error(`Booking forms are not ready for provider ${relationship.provider_id}`);
    }
    return state.groups.map((group) =>
      createFormEntryFromValues(
        group.form,
        Object.fromEntries(group.blocks.map((block) => [block.key, block.value])),
      ),
    );
  }

  const service_controller = {
    async initialize(): Promise<void> {
      service_state.setKey("tzGroups", normalizeTimezoneGroups(client.utils.tzGroups));
      await ensureCart();
      const methods = session.get()?.market?.payment_methods || [];
      if (methods.length) service_state.setKey("availablePaymentMethods", methods);
    },

    setTimezone(tz: string): void {
      service_state.setKey("timezone", tz);
      service_state.setKey("calendar", serviceCalendar());
      const state = service_state.get();
      if (state.selectedDate) {
        service_state.setKey("slots", computeServiceSlots(state.selectedDate));
        service_state.setKey("selectedSlot", null);
        service_state.setKey("quote", null);
        service_state.setKey("quoteError", null);
        activateServiceProviderForms();
      }
    },

    async select(service: Service): Promise<void> {
      service_form_definitions.clear();
      clearServiceFormState(null, true);
      service_state.set({
        ...service_state.get(),
        service: null,
        serviceProviders: [],
        providers: [],
        selectedProviderId: null,
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
        const [fullService, serviceProviders] = await Promise.all([
          client.eshop.service.get({ id: service.id }),
          client.eshop.service.findProviders({
            service_id: service.id,
          }),
        ]);
        const providerIds = [...new Set(serviceProviders.map((relationship) => relationship.provider_id))];
        const [providerResults] = await Promise.all([
          Promise.all(providerIds.map((id) => client.eshop.provider.get({ id }).catch(() => null))),
          loadServiceFormDefinitions(serviceProviders),
        ]);

        service_state.set({
          ...service_state.get(),
          service: fullService,
          serviceProviders,
          providers: providerResults.filter((provider): provider is Provider => provider !== null),
          selectedProviderId: null,
          availability: null,
          selectedDate: null,
          slots: [],
          selectedSlot: null,
          currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          loading: false,
          dateTimeConfirmed: false,
          quote: null,
          quoteError: null,
        });
        activateServiceProviderForms();
        await service_controller.loadMonth();
      } catch (error) {
        service_form_definitions.clear();
        clearServiceFormState(readErrorMessage(error, "Failed to load booking forms."));
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
      const state = service_state.get();
      if (providerId && !resolveServiceProvider(state, providerId)) {
        throw new Error(`Provider ${providerId} is not configured for the selected service`);
      }
      service_state.set({
        ...state,
        selectedProviderId: providerId,
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      activateServiceProviderForms(providerId);
      void service_controller.loadMonth();
    },

    selectDate(cell: ArkyCalendarDay): void {
      if (cell.blank || !cell.available) return;
      const state = service_state.get();
      service_state.set({
        ...state,
        selectedDate: cell.iso,
        slots: computeServiceSlots(cell.iso),
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      activateServiceProviderForms();
      service_state.setKey("calendar", serviceCalendar());
    },

    selectTimeSlot(slot: ArkyServiceSlot | null): void {
      const state = service_state.get();
      if (slot) {
        if (!state.service || slot.serviceId !== state.service.id) {
          throw new Error("The selected slot does not belong to the selected service");
        }
        if (state.selectedProviderId && slot.providerId !== state.selectedProviderId) {
          throw new Error("The selected slot does not belong to the selected provider");
        }
        if (!resolveServiceProvider(state, slot.providerId)) {
          throw new Error(`Provider ${slot.providerId} is not configured for the selected service`);
        }
      }
      service_state.set({
        ...state,
        selectedSlot: slot,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      activateServiceProviderForms(slot?.providerId);
    },

    resetDateSelection(): void {
      service_state.set({
        ...service_state.get(),
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      activateServiceProviderForms();
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

    async addToCart(explicitSlots?: ArkyServiceSlot[]): Promise<void> {
      const state = service_state.get();
      const slots = explicitSlots || (state.selectedSlot ? [state.selectedSlot] : []);
      if (slots.length === 0) return;
      const first = slots[0];
      if (!state.service || first.serviceId !== state.service.id) {
        throw new Error("The booking slots do not belong to the selected service");
      }
      const relationship = resolveServiceProvider(state, first.providerId);
      if (!relationship) {
        throw new Error(`Provider ${first.providerId} is not configured for the selected service`);
      }
      let forms: FormEntry[];
      try {
        forms = configuredServiceFormEntries(relationship);
      } catch (error) {
        service_form_state.setKey("error", readErrorMessage(error, "Booking forms are invalid."));
        throw error;
      }
      const displayName = serviceName(state.service, currentLocale());
      const enriched = slots.map((slot) => ({
        ...slot,
        serviceName: displayName,
        date: slot.dateText,
      }));
      const nextItems = [...service_items.get(), toServiceCartItem(enriched, forms)];
      await syncServiceCart(nextItems);
      service_state.set({
        ...service_state.get(),
        selectedDate: null,
        slots: [],
        selectedSlot: null,
        dateTimeConfirmed: false,
        quote: null,
        quoteError: null,
      });
      activateServiceProviderForms(service_state.get().selectedProviderId, true);
      service_state.setKey("calendar", serviceCalendar());
    },

    async removeFromCart(bookingId: string): Promise<void> {
      await syncServiceCart(service_items.get().filter((item) => item.id !== bookingId));
    },

    async clearCart(): Promise<void> {
      await syncServiceCart([]);
    },

    async checkout(paymentMethodId?: string, forms: FormEntry[] = []): Promise<OrderCheckoutResult> {
      const state = service_state.get();
      const items = service_items.get();
      if (!items.length) throw new Error("Cart is empty");
      service_state.setKey("loading", true);
      try {
        const result = await checkout({
          service_items: items,
          payment_method_key: paymentMethodId,
          promo_code: state.promoCode || undefined,
          forms,
        });
        service_state.setKey("cartId", cart.get()?.id || null);
        return result;
      } finally {
        service_state.setKey("loading", false);
      }
    },

    async fetchQuote(paymentMethodId?: string, promoCode?: string | null): Promise<OrderQuote | null> {
      const state = service_state.get();
      const items = service_items.get();
      if (!items.length) return null;
      service_state.setKey("fetchingQuote", true);
      service_state.setKey("quoteError", null);
      try {
        service_state.setKey("promoCode", promoCode || null);
        const response = await fetchQuote({
          service_items: items,
          payment_method_key: paymentMethodId,
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
        service_state.setKey("quote", null);
        service_state.setKey("quoteError", null);
        activateServiceProviderForms();
      }
    },

    nextStep(): void {
      if (serviceCurrentStepName() === "datetime" && service_can_proceed.get()) {
        service_state.setKey("dateTimeConfirmed", true);
      }
    },

    getServicePrice(): string {
      const state = service_state.get();
      const relationship = resolveServiceProvider(state);
      if (!relationship) return "";
      try {
        const price = priceForMarket(relationship.prices, currentMarketKey(), market.get()?.currency);
        return client.utils.formatPrice([price]);
      } catch {
        return "";
      }
    },

    formatDateDisplay: formatServiceDateDisplay,
    serviceItemsFromSlots(slots: ArkyServiceSlot[], forms: FormEntry[] = []): ArkyServiceCartItem[] {
      return slots.length ? [toServiceCartItem(slots, forms)] : [];
    },
  };

  async function loadEntry(params: ArkyCmsEntryParams, options?: RequestOptions): Promise<CollectionEntry> {
    cms_state.setKey("loading", true);
    cms_state.setKey("error", null);
    try {
      const { locale: nextLocale, market: nextMarket, ...entryParams } = params;
      setContext({ locale: nextLocale, market: nextMarket });

      if (entryParams.id) {
        const entry = await client.cms.entry.get(entryParams as GetEntryParams, options);
        const cacheKey = entryParams.key || entryParams.id || entry.id;
        cms_state.setKey("entries", {
          ...cms_state.get().entries,
          [cacheKey]: entry,
        });
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
      cms_state.setKey("entries", {
        ...cms_state.get().entries,
        [entryParams.key]: entry,
      });
      return entry;
    } catch (error) {
      cms_state.setKey("error", readErrorMessage(error, "Failed to load CMS entry."));
      throw error;
    } finally {
      cms_state.setKey("loading", false);
    }
  }

  function formCacheKey(params: GetFormParams): string {
    const storeId = params.store_id || client.getStoreId();
    const identifier = params.id ? `id:${params.id}` : params.key ? `key:${params.key}` : "missing";
    return `${storeId}:${identifier}`;
  }

  async function loadForm(params: GetFormParams, options?: RequestOptions): Promise<Form> {
    cms_state.setKey("loading", true);
    cms_state.setKey("error", null);
    try {
      const storeId = params.store_id || client.getStoreId();
      const formClient = clientForStore(storeId);
      const form = await formClient.cms.form.get({ ...params, store_id: storeId }, options);
      const forms = { ...cms_state.get().forms };
      forms[formCacheKey({ id: form.id, store_id: storeId })] = form;
      forms[formCacheKey({ key: form.key, store_id: storeId })] = form;
      cms_state.setKey("forms", forms);
      return form;
    } catch (error) {
      cms_state.setKey("error", readErrorMessage(error, "Failed to load CMS form."));
      throw error;
    } finally {
      cms_state.setKey("loading", false);
    }
  }

  async function ensureFormClient(storeId: string) {
    const formClient = clientForStore(storeId);
    const marketKey = currentMarketKey();
    if (formClient === client) {
      await ensureSession();
    } else if (!formClient.session || (marketKey && formClient.session.market?.key !== marketKey)) {
      await formClient.identify({ market: marketKey });
    }
    return formClient;
  }

  async function submitForm(params: SubmitFormParams, options?: RequestOptions): Promise<FormSubmission> {
    const storeId = params.store_id || client.getStoreId();
    const formClient = await ensureFormClient(storeId);
    return formClient.cms.form.submit({ ...params, store_id: storeId }, options);
  }

  async function submitFormByKey(
    params: ArkySubmitFormByKeyParams,
    options?: RequestOptions,
  ): Promise<FormSubmission> {
    const storeId = params.store_id || client.getStoreId();
    const form = await loadForm({ key: params.key, store_id: storeId }, options);
    const entry = createFormEntryFromValues(form, params.values);
    return submitForm({ store_id: storeId, form_id: form.id, fields: entry.fields }, options);
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

  async function trackAction(params: TrackActionParams): Promise<void> {
    await ensureSession();
    return client.action.track(params);
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
    load: ensureCart,
    refresh: syncCart,
    addProduct,
    setProductQuantity,
    removeProduct,
    addServiceItem,
    removeServiceItem,
    clear: clearCart,
    clearLocal: clearLocalCart,
    quote: fetchQuote,
    checkout,
    payment: {
      controller: payment_controller,
      ready: payment_ready,
      setController: setPaymentController,
      getController: () => payment_controller.get(),
      mountStripe: mountStripePayment,
      update: updatePaymentController,
      destroy: destroyPaymentController,
    },
    applyPromoCode(code: string, input: Omit<ArkyCartInput, "promo_code"> = {}) {
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
    buildItems: checkoutItems,
    buildProductItems: toProductCheckoutItems,
    buildServiceItems: toServiceCheckoutItems,
  };

  const product_store = {
    get: (params: GetProductParams, options?: RequestOptions) => client.eshop.product.get(params, options),
    list: loadProducts,
  };

  const service_store = {
    get: (params: GetServiceParams, options?: RequestOptions) => client.eshop.service.get(params, options),
    list: loadServices,
    listProviders: (params: FindServiceProvidersParams, options?: RequestOptions) => client.eshop.service.findProviders(params, options),
    getAvailability: loadAvailability,
    state: service_state,
    form_state: service_form_state,
    form_groups: service_form_groups,
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
    identify,
    identifyContactEmailIfMissing,
    verify: client.verify,
    me: client.me,
    logout: client.logout,
    onAuthStateChanged: client.onAuthStateChanged,
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
        submit: submitForm,
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
        list: loadProviders,
      },
      order: client.eshop.order,
      cart: cart_store,
    },
    crm: client.crm,
    action: {
      track(params: TrackActionParams) {
        return trackAction(params);
      },
      pageView(payload: Record<string, unknown> = {}) {
        return trackAction({ key: "page.view", payload });
      },
      state: atom<StorefrontAction | null>(null),
    },
    experiments: {
      use: useExperiment,
    },
    support: client.support,
    store: client.store,
    utils: client.utils,
  };
}

type InitializedStoreBase = ReturnType<typeof initializeStore>;

export type InitializedStore = InitializedStoreBase & {
  forStore(storeId: string): InitializedStore;
};

export function initialize(config: ArkyStoreConfig): InitializedStore {
  const stores = new Map<string, InitializedStore>();

  const createScope = (scopeConfig: ArkyStoreConfig): InitializedStore => {
    const existing = stores.get(scopeConfig.storeId);
    if (existing) return existing;

    const store = initializeStore(scopeConfig) as InitializedStore;
    stores.set(scopeConfig.storeId, store);
    Object.defineProperty(store, "forStore", {
      enumerable: true,
      configurable: false,
      writable: false,
      value: (storeId: string) =>
        createScope({
          ...config,
          storeId,
          market: store.getMarket(),
          locale: store.getLocale(),
        }),
    });
    return store;
  };

  return createScope(config);
}

export type ArkyStore = ReturnType<typeof initialize>;
export type ArkyCartStore = ArkyStore["eshop"]["cart"];
export type ArkyServiceStore = ArkyStore["eshop"]["service"];
