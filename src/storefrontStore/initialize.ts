import type { EpochMilliseconds } from "../types/time";
import type { CatalogReadOptions } from "../types/catalog";
import type { CartViewScope } from "../types/cartView";
import { CartSelectionError } from "../types/cartSelection";
import { sanitizePublicCartCustomerGroupPlans, sanitizePublicCartDigitalProducts } from "../utils/cartInputs";
function newDeliveryGroupId(): string {
  const generated = globalThis.crypto?.randomUUID?.();
  if (generated) return generated;
  throw new Error("This runtime cannot generate a Cart delivery group identity");
}
import {
  epochMilliseconds,
  epochMillisecondsNow,
  epochMillisecondsToDate,
} from "../utils/time";
import { atom, computed, map } from "nanostores";
import {
  createStorefront,
  type StorefrontCustomerSession,
  type StorefrontIdentifyResult,
} from "../index";
import type { StorefrontMarket, StorefrontSetup } from "../api/storefront";
import type {
  CartPublicLineItemInput,
  StorefrontCart,
  StorefrontCollectionEntry,
  StorefrontForm,
  StorefrontFormSubmission,
  StorefrontOrderCheckoutResult,
  StorefrontCheckoutQuote,
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
  CartCustomerGroupPlanItem,
  EshopCartItem,
  CollectionEntry,
  Form,
  FormSubmission,
  OrderCheckoutResult,
  PaginatedResponse,
  Product,
  ProductVariant,
  BookingResource,
  BookingService,
  BookingOffering,
  ZoneLocation,
} from "../types";
import {
  cartProductItems,
  cartBookingItems,
  cartDigitalItems,
  cartCustomerGroupPlanItems,
} from "../types/cart";
import type {
  AvailabilityResponse,
  CartCustomerGroupPlanInput,
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
  FindStorefrontBookingServicesParams,
  CartProductInput,
  CartDigitalItemInput,
  RequestOptions,
  CartBookingInput,
  SubmitFormParams,
} from "../types/api";
import type {
  ExperimentUseResponse,
  TrackCustomerActionParams,
  UseExperimentParams,
} from "../api/storefront";
import type {
  ArkyCalendarDay,
  ArkyContentEntryParams,
  ArkyCartInput,
  ArkyCartCheckoutInput,
  CheckoutContext,
  ArkyCartStatus,
  ArkyCartQuoteStore,
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
  productName,
  bookingResourceName,
  readErrorMessage,
  bookingServiceName,
  toCartProducts,
  toCartBookings,
} from "./utils";

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
  const resolvedMarket = atom<StorefrontMarket | null>(null);
  const market = computed([setup, market_key, resolvedMarket], (setupValue, marketKey, value) => {
    const resolvedKey = marketKey || setupValue?.default_market?.key;
    return value?.key === resolvedKey ? value : null;
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
  const customer_group_plan_items = atom<CartCustomerGroupPlanItem[]>([]);
  const quote: ArkyCartQuoteStore = atom<StorefrontCheckoutQuote | null>(null);
  const promotion_codes = atom<string[]>([]);
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
    return cartProductItems(value).reduce(
      (total, item) => total + (item.quantity || 0),
      0,
    );
  }

  function rawBookingItemCount(value: StorefrontCart | null): number {
    return cartBookingItems(value).length;
  }

  function rawDigitalItemCount(value: StorefrontCart | null): number {
    return cartDigitalItems(value).length;
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
    [cart, product_item_count, booking_item_count, digital_item_count, customer_group_plan_items],
    (cartValue, products, services, digitalProducts, plans) =>
      Math.max(
        cartValue?.item_count || 0,
        products + services + digitalProducts + plans.length,
      ),
  );
  const snapshot = computed(
    [cart, product_items, booking_items, digital_items, customer_group_plan_items, item_count],
    (cartValue, products, services, digitalProducts, plans, count) => ({
      cart: cartValue,
      product_items: products,
      booking_items: services,
      digital_items: digitalProducts,
      customer_group_plan_items: plans,
      item_count: count,
    }),
  );
  let cartWriteRevision = 0;
  let cartContextRevision = 0;
  let cartContextMarket = client.getMarket();
  let cartSyncRevision = 0;
  let cartQuoteRevision = 0;
  let sessionRequest: Promise<StorefrontCustomerSession | null> | null = null;
  let cartRequest: Promise<StorefrontCart> | null = null;

  function nextCartWriteRevision(): number {
    cartWriteRevision += 1;
    quote.set(null);
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

  function synchronizeSession(): void {
    const current = client.session;
    const previous = session.get();
    const marketChanged = cartContextMarket !== client.getMarket();
    if (marketChanged) market_key.set(client.getMarket());
    if (
      marketChanged || current?.customer.id !== previous?.customer.id ||
      current?.id !== previous?.id || current?.status !== previous?.status
    ) {
      invalidateCartContext();
    }
    session.set(current);
  }

  client.onAuthStateChanged(synchronizeSession);
  currency.subscribe((value) => booking_service_state.setKey("currency", value));
  market.subscribe((value) => {
    const providerIds = value?.payment_provider_ids || [];
    booking_service_state.setKey("availablePaymentProviderIds", providerIds);
  });

  function currentMarketKey(): string {
    return (
      market_key.get() ||
      client.getMarket() ||
      setup.get()?.default_market?.key ||
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

  let setupRead: Promise<StorefrontSetup> | null = null;
  let setupReadKey = "";
  let setupReadRevision = 0;

  function loadSetup(): Promise<StorefrontSetup> {
    synchronizeSession();
    const key = client.getMarket();
    const revision = cartContextRevision;
    if (setupRead && setupReadKey === key && setupReadRevision === revision) return setupRead;
    const assertCurrent = () => {
      if (revision !== cartContextRevision || key !== client.getMarket())
        throw new CartSelectionError("Customer or Market changed while loading Store configuration");
    };
    const request = (async () => {
      const result = setup.get() ?? await client.getSetup();
      assertCurrent();
      const defaultMarket = result.default_market;
      if (result.commerce.type === "ready" && defaultMarket?.id !== result.commerce.default_market_id)
        throw new CartSelectionError("Store configuration did not confirm its default Market");
      if (result.commerce.type !== "ready" && defaultMarket !== null)
        throw new CartSelectionError("An unready Store cannot expose a default Market");
      const selectedKey = key || defaultMarket?.key || "";
      const value = !selectedKey ? null : defaultMarket?.key === selectedKey ? defaultMarket :
        await client.store.market.getByKey(selectedKey);
      assertCurrent();
      if (value && (!value.id || value.key !== selectedKey))
        throw new CartSelectionError("The Market read did not confirm the selected key");
      setup.set(result);
      resolvedMarket.set(value);
      if (!market_key.get() && defaultMarket) market_key.set(defaultMarket.key);
      if (!locale.get() && result.languages.default) locale.set(result.languages.default);
      return result;
    })();
    const pending = request.finally(() => { if (setupRead === pending) setupRead = null; });
    setupReadKey = key;
    setupReadRevision = revision;
    setupRead = pending;
    return pending;
  }

  async function ensureSession(): Promise<StorefrontCustomerSession | null> {
    synchronizeSession();
    if (client.hasSession) return client.session;
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
    synchronizeSession();
    const next = key.trim();
    const current = currentMarketKey();
    if (
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
    if (next !== current || next !== cartContextMarket) invalidateCartContext();
  }

  function setLocale(value: string): void {
    if (value !== currentLocale()) quote.set(null);
    locale.set(value);
    client.setLocale(value);
  }

  function setContext(context: ArkyStoreContext): void {
    if (context.market !== undefined) setMarket(context.market);
    if (context.locale !== undefined) setLocale(context.locale);
  }

  function invalidateCartContext(): void {
    cartContextRevision += 1;
    cartContextMarket = client.getMarket();
    clearLocalCart();
    last_order.set(null);
    cart_status.set({
      loading: false,
      syncing: false,
      fetching_quote: false,
      processing_checkout: false,
      error: null,
      quote_error: null,
      selected_shipping_method_id: null,
      user_token: null,
    });
  }

  async function beginCartOperation(): Promise<CartViewScope> {
    synchronizeSession();
    const requestedMarket = currentMarketKey();
    const requestedSession = client.session;
    const requestedRevision = cartContextRevision;
    await ensureSession();
    synchronizeSession();
    const current = client.session;
    if (
      !current || requestedMarket !== currentMarketKey() ||
      (requestedSession && requestedRevision !== cartContextRevision)
    ) {
      throw new CartSelectionError(
        "The buyer or Market changed before the Cart operation; reload the current Cart",
      );
    }
    const revision = cartContextRevision;
    const activeMarket = client.getMarket();
    const isCurrent = () => {
      const active = client.session;
      return revision === cartContextRevision && active?.id === current.id &&
        active.customer.id === current.customer.id && active.status === current.status &&
        client.getMarket() === activeMarket;
    };
    return {
      customerId: current.customer.id,
      isCurrent,
      assertCurrent() {
        if (!isCurrent()) throw new CartSelectionError(
          "The buyer or Market changed during the Cart operation; reload the current Cart",
        );
      },
    };
  }

  async function ensureCart(): Promise<StorefrontCart> {
    const scope = await beginCartOperation();
    if (cartRequest) return cartRequest;

    cart_status.setKey("loading", true);
    cart_status.setKey("error", null);
    const refreshRevision = cartWriteRevision;
    const request = (async () => {
      const response = await client.eshop.cart.current();
      await applyCartResponse(response, { ifRevision: refreshRevision, scope });
      return response;
    })();
    cartRequest = request;

    try {
      return await request;
    } catch (error) {
      if (scope.isCurrent()) cart_status.setKey(
        "error",
        readErrorMessage(error, "Failed to load cart."),
      );
      throw error;
    } finally {
      if (cartRequest === request) {
        cartRequest = null;
        if (scope.isCurrent()) cart_status.setKey("loading", false);
      }
    }
  }

  async function buildProductCartItem(
    item: CartProductInput,
    source: StorefrontCart,
    isCurrent: () => boolean,
  ): Promise<EshopCartItem | null> {
    try {
      const [product, variant] = await Promise.all([
        client.eshop.product.get({
          id: item.product_id,
          company_id: source.company?.company_id ?? undefined,
          company_location_id: source.company?.company_location_id ?? undefined,
          include_price: true,
        }),
        client.eshop.productVariant.get({
          product_id: item.product_id,
          id: item.variant_id,
          company_id: source.company?.company_id ?? undefined,
          company_location_id: source.company?.company_location_id ?? undefined,
          include_price: true,
        }),
      ]);
      if (variant.id !== item.variant_id || variant.product_id !== product.id || product.id !== item.product_id) {
        if (isCurrent()) cart_status.setKey(
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
        requires_shipping: variant.fulfillment.type === "physical",
        price: variant.price,
        quantity: item.quantity,
        form_submission_id: item.form_submission_id ?? null,
        added_at: epochMilliseconds(source.created_at),
      };
    } catch (error) {
      if (isCurrent()) cart_status.setKey(
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
    options: { ifRevision: number; scope: CartViewScope },
  ): Promise<StorefrontCart> {
    options.scope.assertCurrent();
    if (response.customer_id !== options.scope.customerId)
      throw new CartSelectionError("The Cart response belongs to a different Customer");
    const isCurrent = () => options.scope.isCurrent() && options.ifRevision === cartWriteRevision;
    if (!isCurrent()) {
      return cart.get() || response;
    }
    cart.set(response);
    product_items.set([]);
    booking_items.set([]);
    digital_items.set([]);
    customer_group_plan_items.set([]);
    cart_status.setKey(
      "selected_shipping_method_id",
      response.delivery_groups[0]?.shipping_rate_id ?? null,
    );
    promotion_codes.set(response.promotion_code_ids);
    quote.set(null);

    if (response.status.type === "converted") {
      product_items.set([]);
      booking_items.set([]);
      digital_items.set([]);
      customer_group_plan_items.set([]);
      return response;
    }

    const cartProducts = cartProductItems(response);
    const cartBookings = cartBookingItems(response);
    const cartDigitalProducts = cartDigitalItems(response);
    if (cartProducts.length > 0 || cartBookings.length > 0) await loadSetup();
    options.scope.assertCurrent();
    if (!isCurrent()) return cart.get() || response;
    const products = await Promise.all(
      cartProducts.map((item) =>
        buildProductCartItem(item, response, isCurrent),
      ),
    );
    const services = await buildBookingCartItems(cartBookings);
    options.scope.assertCurrent();
    if (!isCurrent()) return cart.get() || response;
    product_items.set(
      products.filter((item): item is EshopCartItem => item !== null),
    );
    booking_items.set(services);
    digital_items.set(cartDigitalProducts);
    customer_group_plan_items.set(cartCustomerGroupPlanItems(response));
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
    return sanitizePublicCartDigitalProducts(input.digital_items || digital_items.get());
  }

  function checkoutCustomerGroupPlans(input: ArkyCartInput = {}): CartCustomerGroupPlanInput[] {
    return sanitizePublicCartCustomerGroupPlans(input.customer_group_plan_items ?? customer_group_plan_items.get());
  }

  async function syncCart(
    input: ArkyCartInput = {},
    writeRevision?: number,
    currentScope?: CartViewScope,
  ): Promise<StorefrontCart> {
    const scope = currentScope ?? await beginCartOperation();
    scope.assertCurrent();
    const revision = writeRevision ?? nextCartWriteRevision();
    const syncRevision = ++cartSyncRevision;
    const isCurrent = () => scope.isCurrent() && revision === cartWriteRevision;
    cart_status.setKey("syncing", true);
    cart_status.setKey("error", null);
    try {
      const current = cart.get() || (await ensureCart());
      scope.assertCurrent();
      const lineItems: CartPublicLineItemInput[] = [
        ...checkoutProducts(input).map((item) => ({ type: "product" as const, ...item })),
        ...checkoutBookings(input).map((item) => ({ type: "booking" as const, ...item })),
        ...checkoutDigitalProducts(input).map((item) => ({
          type: "digital_product" as const,
          ...item,
        })),
        ...checkoutCustomerGroupPlans(input).map((item) => ({
          type: "customer_group_plan" as const,
          ...item,
        })),
      ];
      const shippingAddress =
        input.shipping_address === undefined ? undefined : input.shipping_address;
      const physical = lineItems.filter((item) => item.type === "product");
      const response = await client.eshop.cart.update({
        id: current.id,
        line_items: lineItems,
        ...(shippingAddress && physical.length
          ? {
              delivery_groups: [
                {
                  id: newDeliveryGroupId(),
                  items: physical.map((item) => ({
                    line_item: { type: "product" as const, line_item_id: item.id as string },
                    quantity: item.quantity,
                  })),
                  destination: { type: "delivery" as const, address: shippingAddress },
                  shipping_rate_id: null,
                  quote_acceptance: null,
                  scheduled_window: null,
                },
              ],
            }
          : {}),
        company: input.company,
        market_id: input.market_id,
        sales_channel_id: input.sales_channel_id,
        billing_address: input.billing_address,
        promotion_codes:
          input.promotion_codes === null
            ? []
            : (input.promotion_codes ?? promotion_codes.get()),
      });
      await applyCartResponse(response, { ifRevision: revision, scope });
      return response;
    } catch (error) {
      if (isCurrent()) cart_status.setKey(
        "error",
        readErrorMessage(error, "Failed to sync cart."),
      );
      throw error;
    } finally {
      if (scope.isCurrent() && syncRevision === cartSyncRevision) cart_status.setKey("syncing", false);
    }
  }

  async function addProduct(
    product: StorefrontProduct,
    variant: StorefrontProductVariant,
    quantity = 1,
  ): Promise<StorefrontCart> {
    const scope = await beginCartOperation();
    cart_status.setKey("error", null);
    const writeRevision = nextCartWriteRevision();
    try {
      const current = cart.get() || (await ensureCart());
      scope.assertCurrent();
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
        scope,
      });
      return response;
    } catch (error) {
      if (scope.isCurrent() && writeRevision === cartWriteRevision) cart_status.setKey(
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
    const scope = await beginCartOperation();
    const writeRevision = nextCartWriteRevision();
    const next = product_items.get().map((item) => {
      if (item.id !== itemId) return item;
      const bounded = item.max_stock
        ? Math.min(Math.max(1, quantity), item.max_stock)
        : Math.max(1, quantity);
      return { ...item, quantity: bounded };
    });
    product_items.set(next);
    return syncCart({ product_items: next }, writeRevision, scope);
  }

  async function removeProduct(itemId: string): Promise<StorefrontCart | null> {
    const scope = await beginCartOperation();
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
    await applyCartResponse(response, { ifRevision: writeRevision, scope });
    return response;
  }

  async function addBooking(
    item: ArkyBookingCartItem,
  ): Promise<StorefrontCart> {
    const scope = await beginCartOperation();
    const writeRevision = nextCartWriteRevision();
    const next = [...booking_items.get(), item];
    booking_items.set(next);
    return syncCart({ booking_items: next }, writeRevision, scope);
  }

  async function addDigitalProduct(
    item: CartDigitalItemInput,
  ): Promise<StorefrontCart> {
    const scope = await beginCartOperation();
    const writeRevision = nextCartWriteRevision();
    const current = cart.get() || (await ensureCart());
    scope.assertCurrent();
    const response = await client.eshop.cart.addDigital({
      id: current.id,
      digital: sanitizePublicCartDigitalProducts([item])[0],
    });
    await applyCartResponse(response, { ifRevision: writeRevision, scope });
    return response;
  }

  async function removeDigitalProduct(
    itemId: string,
  ): Promise<StorefrontCart | null> {
    const scope = await beginCartOperation();
    const writeRevision = nextCartWriteRevision();
    const current = cart.get();
    if (!current) return null;
    const response = await client.eshop.cart.removeItem({
      id: current.id,
      item_id: itemId,
    });
    await applyCartResponse(response, { ifRevision: writeRevision, scope });
    return response;
  }

  async function addCustomerGroupPlan(item: CartCustomerGroupPlanInput): Promise<StorefrontCart> {
    const scope = await beginCartOperation();
    const writeRevision = nextCartWriteRevision();
    const current = cart.get() || (await ensureCart());
    scope.assertCurrent();
    const response = await client.eshop.cart.addCustomerGroupPlan({
      id: current.id,
      customer_group_plan: sanitizePublicCartCustomerGroupPlans([item])[0],
    });
    await applyCartResponse(response, { ifRevision: writeRevision, scope });
    return response;
  }

  async function removeCustomerGroupPlan(itemId: string): Promise<StorefrontCart | null> {
    const scope = await beginCartOperation();
    const writeRevision = nextCartWriteRevision();
    const current = cart.get();
    if (!current) return null;
    const response = await client.eshop.cart.removeItem({ id: current.id, item_id: itemId });
    await applyCartResponse(response, { ifRevision: writeRevision, scope });
    return response;
  }

  async function removeBooking(itemId: string): Promise<StorefrontCart> {
    const scope = await beginCartOperation();
    const writeRevision = nextCartWriteRevision();
    const next = booking_items.get().filter((item) => item.id !== itemId);
    booking_items.set(next);
    return syncCart({ booking_items: next }, writeRevision, scope);
  }

  async function clearCart(): Promise<StorefrontCart | null> {
    const scope = await beginCartOperation();
    const current = cart.get();
    clearLocalCart();
    const writeRevision = cartWriteRevision;
    if (!current) return null;
    const response = await client.eshop.cart.clear({ id: current.id });
    await applyCartResponse(response, { ifRevision: writeRevision, scope });
    return response;
  }

  function clearLocalCart(): void {
    nextCartWriteRevision();
    cartRequest = null;
    cart_status.setKey("loading", false);
    product_items.set([]);
    booking_items.set([]);
    digital_items.set([]);
    customer_group_plan_items.set([]);
    cart.set(null);
    quote.set(null);
    promotion_codes.set([]);
    cart_status.setKey("selected_shipping_method_id", null);
  }

  async function fetchQuote(
    input: ArkyCartInput = {},
  ): Promise<StorefrontCheckoutQuote | null> {
    const scope = await beginCartOperation();
    const requestedLocale = currentLocale();
    const quoteRevision = ++cartQuoteRevision;
    if (
      checkoutProducts(input).length === 0 &&
      checkoutBookings(input).length === 0 &&
      checkoutDigitalProducts(input).length === 0 &&
      checkoutCustomerGroupPlans(input).length === 0
    ) {
      quote.set(null);
      cart_status.setKey("fetching_quote", false);
      return null;
    }
    cart_status.setKey("fetching_quote", true);
    cart_status.setKey("quote_error", null);
    const revision = nextCartWriteRevision();
    const isCurrent = () => scope.isCurrent() && revision === cartWriteRevision && quoteRevision === cartQuoteRevision && requestedLocale === currentLocale();
    try {
      const current = await syncCart(input, revision, scope);
      scope.assertCurrent();
      if (!isCurrent()) throw new CartSelectionError("Cart selections or language changed before quoting; review the current Cart");
      const response = await client.eshop.cart.quote({ id: current.id });
      scope.assertCurrent();
      if (!isCurrent()) throw new CartSelectionError("Cart selections or language changed while quoting; review the current Cart");
      quote.set(response);
      return response;
    } catch (error) {
      if (isCurrent()) {
        quote.set(null);
        cart_status.setKey(
          "quote_error",
          readErrorMessage(error, "Failed to fetch quote."),
        );
      }
      throw error;
    } finally {
      if (scope.isCurrent() && quoteRevision === cartQuoteRevision) cart_status.setKey("fetching_quote", false);
    }
  }

  function finalizeCheckout(
    context: CheckoutContext,
    response: StorefrontOrderCheckoutResult,
  ): StorefrontOrderCheckoutResult {
    nextCartWriteRevision();
    const current = cart.get();
    if (current?.id === context.request.id) {
      cart.set(null);
    }
    quote.set(null);
    last_order.set({
      checkout_id: response.checkout_id,
      order_id: response.order_id,
      number: response.number,
      payment_action: response.payment_action,
      payment: response.payment,
      product_items: context.product_items,
      booking_items: context.booking_items,
      digital_items: context.digital_items,
      customer_group_plan_items: context.customer_group_plan_items,
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
      ["completed", "cancelled", "expired", "failed"].includes(
        response.payment.status?.type,
      )
    ) {
      clearLocalCart();
    }
    return response;
  }

  async function runCheckout<T>(operation: (scope: CartViewScope) => Promise<T>): Promise<T> {
    const scope = await beginCartOperation();
    if (cart_status.get().processing_checkout)
      throw new CartSelectionError("A Checkout request is already in progress");
    cart_status.setKey("processing_checkout", true);
    cart_status.setKey("error", null);
    try {
      const response = await operation(scope);
      scope.assertCurrent();
      return response;
    } catch (error) {
      if (scope.isCurrent()) cart_status.setKey("error", readErrorMessage(error, "Checkout failed."));
      throw error;
    } finally {
      if (scope.isCurrent()) cart_status.setKey("processing_checkout", false);
    }
  }

  async function checkout(
    input: ArkyCartCheckoutInput = {},
  ): Promise<StorefrontOrderCheckoutResult> {
    if (Object.keys(input).some((key) => !["payment_provider_id", "return_url", "clear_after_checkout", "save_payment_method", "payment_method_terms_version"].includes(key)))
      throw new Error("Update and review Cart selections before checkout");
    return runCheckout(async (scope) => {
      const pending = await client.eshop.cart.pendingCheckout();
      scope.assertCurrent();
      if (pending) throw new Error("Recover the unresolved Cart Checkout before submitting another request");
      const quoteValue = quote.get();
      if (!quoteValue) throw new Error("Review a Cart quote before checkout");
      const current = cart.get();
      if (!current || current.status.type === "converted") throw new Error("Review an active Cart before checkout");
      if (!quoteValue.sources) throw new Error("Review a saved Cart quote with its source bindings before checkout");
      if (input.payment_provider_id !== undefined && input.payment_provider_id !== quoteValue.order.payment_provider_id)
        throw new Error("Review the selected payment provider in a new Cart quote before checkout");
      const paymentProviderId = quoteValue.order.payment_provider_id ?? undefined;
      if (!quoteValue.order.locale) throw new Error("Review a Cart quote with a presentation language before checkout");
      const returnUrl =
        input.return_url ||
        (typeof window !== "undefined" ? window.location.href : undefined);

      const context: CheckoutContext = {
        request: {
          id: current.id,
          locale: quoteValue.order.locale,
          presentation_digest: quoteValue.presentation_digest,
          sources: quoteValue.sources,
          payment_provider_id: paymentProviderId,
          return_url: returnUrl,
          save_payment_method: input.save_payment_method,
          payment_method_terms_version: input.payment_method_terms_version,
        },
        product_items: product_items.get(),
        booking_items: booking_items.get(),
        digital_items: digital_items.get(),
        customer_group_plan_items: cartCustomerGroupPlanItems(current),
        shipping_address: null,
        billing_address: current.billing_address,
        payment_provider_id: paymentProviderId || null,
        clear_after_checkout: input.clear_after_checkout !== false,
        created_at: epochMillisecondsNow(),
      };
      const response = await client.eshop.cart.checkout(context.request);
      scope.assertCurrent();
      return finalizeCheckout(context, response);
    });
  }

  async function recoverCheckout(): Promise<StorefrontOrderCheckoutResult | null> {
    return runCheckout(async (scope) => {
      const pending = await client.eshop.cart.pendingCheckout();
      scope.assertCurrent();
      if (!pending) return null;
      const response = await client.eshop.cart.recoverCheckout();
      scope.assertCurrent();
      if (!response) return null;
      return finalizeCheckout({
        request: pending,
        product_items: [], booking_items: [], digital_items: [], customer_group_plan_items: [],
        shipping_address: null, billing_address: null,
        payment_provider_id: pending.payment_provider_id ?? null,
        clear_after_checkout: false,
        created_at: epochMillisecondsNow(),
      }, response);
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
          dateText: epochMillisecondsToDate(slot.from).toLocaleDateString([], {
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
    return epochMilliseconds(
      Math.max(...items.map((item) => item.requested_interval.to)),
    );
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

  let bookingServiceSelectionRevision = 0;
  let bookingAvailabilityRevision = 0;
  let bookingAvailabilityReadRevision = 0;
  let bookingCatalogOptions: CatalogReadOptions = {};
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

    async select(bookingService: StorefrontBookingService, catalogOptions: CatalogReadOptions = {}): Promise<void> {
      const selectionRevision = ++bookingServiceSelectionRevision;
      bookingAvailabilityRevision += 1;
      bookingAvailabilityReadRevision += 1;
      eshop_state.setKey("loading_availability", false);
      eshop_state.setKey("availability", null);
      bookingCatalogOptions = { company_id: catalogOptions.company_id, company_location_id: catalogOptions.company_location_id, include_price: true };
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
        const [fullBookingService, offeringPage] =
          await Promise.all([
            client.eshop.bookingService.get({ id: bookingService.id, ...bookingCatalogOptions }),
            client.eshop.bookingOffering.find({
              ...bookingCatalogOptions,
              booking_service_id: bookingService.id,
              include_price: true,
              limit: 200,
            }),
          ]);
        const ids = [...new Set(offeringPage.items.map((offering) => offering.booking_resource_id))];
        const bookingResourcePage = ids.length ? await client.eshop.bookingResource.find({
          ids, limit: 200,
        }) : { items: [], cursor: null };
        if (bookingResourcePage.cursor) throw new Error("Resource lookup exceeded its exact ID bound");
        if (selectionRevision !== bookingServiceSelectionRevision) return;

        booking_service_state.set({
          ...booking_service_state.get(),
          bookingService: fullBookingService,
          bookingOfferings: offeringPage.items,
          bookingOfferingsCursor: offeringPage.cursor,
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
        if (selectionRevision === bookingServiceSelectionRevision) booking_service_state.setKey("loading", false);
        throw error;
      }
    },

    async loadMoreOfferings(): Promise<void> {
      const state = booking_service_state.get();
      if (!state.bookingService || !state.bookingOfferingsCursor || state.loadingOfferings) return;
      const serviceId = state.bookingService.id;
      const cursor = state.bookingOfferingsCursor;
      const selectionRevision = bookingServiceSelectionRevision;
      booking_service_state.setKey("loadingOfferings", true);
      try {
        const page = await client.eshop.bookingOffering.find({
          ...bookingCatalogOptions,
          booking_service_id: serviceId, cursor, limit: 200, include_price: true,
        });
        if (page.cursor === cursor) throw new Error("Offering pagination did not advance");
        const ids = [...new Set(page.items.map((offering) => offering.booking_resource_id))];
        const resources = ids.length ? await client.eshop.bookingResource.find({ ids, limit: 200 }) : { items: [], cursor: null };
        if (resources.cursor) throw new Error("Resource lookup exceeded its exact ID bound");
        const current = booking_service_state.get();
        if (selectionRevision !== bookingServiceSelectionRevision || current.bookingService?.id !== serviceId || current.bookingOfferingsCursor !== cursor) return;
        booking_service_state.set({ ...current,
          bookingOfferings: [...new Map([...current.bookingOfferings, ...page.items].map((offering) => [offering.id, offering])).values()],
          bookingResources: [...new Map([...current.bookingResources, ...resources.items].map((resource) => [resource.id, resource])).values()],
          bookingOfferingsCursor: page.cursor,
        });
        booking_service_state.setKey("calendar", bookingServiceCalendar());
        if (current.selectedDate) booking_service_state.setKey("slots", computeBookingServiceSlots(current.selectedDate));
      } finally {
        if (selectionRevision === bookingServiceSelectionRevision) booking_service_state.setKey("loadingOfferings", false);
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
      const selectionRevision = bookingServiceSelectionRevision;
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
          from = epochMilliseconds(
            Date.UTC(month.getFullYear(), month.getMonth(), 1),
          );
          to = epochMilliseconds(
            Date.UTC(month.getFullYear(), month.getMonth() + 1, 1),
          );
        }
        const availability = await loadBookingAvailability({
          company_id: bookingCatalogOptions.company_id,
          company_location_id: bookingCatalogOptions.company_location_id,
          booking_service_id: state.bookingService.id,
          from,
          to,
          limit: 20,
          ...(cursor ? { cursor } : {}),
          ...(state.selectedBookingResourceId
            ? { booking_resource_id: state.selectedBookingResourceId }
            : {}),
        });
        if (selectionRevision !== bookingServiceSelectionRevision || requestRevision !== bookingAvailabilityRevision) return;
        if (cursor && availability.cursor === cursor) throw new Error("Availability pagination did not advance");
        booking_service_state.setKey("availability", cursor && state.availability ? {
          ...availability,
          booking_resources: [...new Map([...state.availability.booking_resources, ...availability.booking_resources].map((resource) => [resource.booking_resource_id, resource])).values()],
        } : availability);
        booking_service_state.setKey("calendar", bookingServiceCalendar());
        const selectedDate = booking_service_state.get().selectedDate;
        if (selectedDate) booking_service_state.setKey("slots", computeBookingServiceSlots(selectedDate));
      } finally {
        if (selectionRevision === bookingServiceSelectionRevision && requestRevision === bookingAvailabilityRevision) booking_service_state.setKey("loading", false);
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
          payment_provider_id: paymentProviderId,
        });
        booking_service_state.setKey("cartId", cart.get()?.id || null);
        return result;
      } finally {
        booking_service_state.setKey("loading", false);
      }
    },

    async fetchQuote(
      paymentProviderId?: string,
      promotionCodes?: string[] | null,
    ): Promise<StorefrontCheckoutQuote | null> {
      const state = booking_service_state.get();
      const items = booking_items.get();
      if (!items.length) return null;
      booking_service_state.setKey("fetchingQuote", true);
      booking_service_state.setKey("quoteError", null);
      try {
        booking_service_state.setKey("promotionCodes", promotionCodes ?? []);
        const response = await fetchQuote({
          booking_items: items,
          payment_provider_id: paymentProviderId,
          promotion_codes: promotionCodes ?? undefined,
        });
        booking_service_state.setKey("cartId", cart.get()?.id || null);
        booking_service_state.setKey("quote", response);
        const providerIds =
          response?.order.payment_provider_ids ||
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
        return client.utils.formatPrice(offering.price);
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
    params: StorefrontParams<Omit<GetProductsParams, "status">> & CatalogReadOptions = {},
    options?: RequestOptions,
  ): Promise<StorefrontPage<StorefrontProduct>> {
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
    params: FindStorefrontBookingServicesParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<StorefrontBookingService>> {
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
    params: StorefrontParams<GetAvailabilityParams> & Pick<CatalogReadOptions, "company_id" | "company_location_id">,
    options?: RequestOptions,
  ) {
    const revision = ++bookingAvailabilityReadRevision;
    eshop_state.setKey("loading_availability", true);
    eshop_state.setKey("error", null);
    try {
      const response = await client.eshop.bookingService.getAvailability(
        params,
        options,
      );
      if (response.from !== params.from || response.to !== params.to) throw new Error("Availability returned a different time range");
      if (response.cursor !== null && (typeof response.cursor !== "string" || !response.cursor.length)) throw new Error("Availability returned an invalid continuation");
      if (params.cursor && response.cursor === params.cursor) throw new Error("Availability pagination did not advance");
      if (revision === bookingAvailabilityReadRevision) eshop_state.setKey("availability", response);
      return response;
    } catch (error) {
      if (revision === bookingAvailabilityReadRevision) eshop_state.setKey(
          "error", readErrorMessage(error, "Failed to load availability."),
        );
      throw error;
    } finally {
      if (revision === bookingAvailabilityReadRevision) eshop_state.setKey("loading_availability", false);
    }
  }

  async function useExperiment(
    params: string | UseExperimentParams,
  ): Promise<ExperimentUseResponse> {
    await ensureSession();
    const input = typeof params === "string" ? { key: params } : params;
    return client.experiments.use(input);
  }

  async function trackCustomerAction(params: TrackCustomerActionParams): Promise<void> {
    await ensureSession();
    return client.actions.track(params);
  }

  const cart_store = {
    cart,
    product_items,
    booking_items,
    digital_items,
    customer_group_plan_items,
    quote_result: quote,
    promotion_codes,
    last_order,
    status: cart_status,
    product_item_count,
    booking_item_count,
    digital_item_count,
    item_count,
    snapshot,
    load: ensureCart,
    refresh: (input: ArkyCartInput = {}) => syncCart(input),
    addProduct,
    setProductQuantity,
    removeProduct,
    addBooking,
    removeBooking,
    addDigital: addDigitalProduct,
    removeDigital: removeDigitalProduct,
    addCustomerGroupPlan,
    removeCustomerGroupPlan,
    clear: clearCart,
    clearLocal: clearLocalCart,
    quote: fetchQuote,
    checkout,
    pendingCheckout: () => client.eshop.cart.pendingCheckout(),
    recoverCheckout,
    applyPromoCode(
      code: string,
      input: Omit<ArkyCartInput, "promotion_codes"> = {},
    ): Promise<StorefrontCheckoutQuote | null> {
      return fetchQuote({ ...input, promotion_codes: [code] });
    },
    removePromoCode(input: Omit<ArkyCartInput, "promotion_codes"> = {}): Promise<StorefrontCheckoutQuote | null> {
      return fetchQuote({ ...input, promotion_codes: [] });
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
        customer_group_plan_items: checkoutCustomerGroupPlans(input),
      };
    },
    buildProductItems: toCartProducts,
    buildBookingItems: toCartBookings,
  };

  const product_store = {
    get: (
      params: StorefrontParams<GetProductParams> & CatalogReadOptions,
      options?: RequestOptions,
    ) => client.eshop.product.get(params, options),
    list: loadProducts,
  };

  const booking_service_store = {
    get: (
      params: StorefrontParams<GetBookingServiceParams> & CatalogReadOptions,
      options?: RequestOptions,
    ) => client.eshop.bookingService.get(params, options),
    list: loadBookingServices,
    listOfferings: (
      params: StorefrontParams<Omit<FindBookingOfferingsParams, "status">> & CatalogReadOptions,
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
    loadMoreOfferings: booking_service_controller.loadMoreOfferings,
    loadMoreAvailability: booking_service_controller.loadMoreAvailability,
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
      productVariant: client.eshop.productVariant,
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
      checkout: client.eshop.checkout,
      cart: cart_store,
    },
    customer_groups: client.customer_groups,
    customer_group_plans: client.customer_group_plans,
    actions: {
      track(params: TrackCustomerActionParams) {
        return trackCustomerAction(params);
      },
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
