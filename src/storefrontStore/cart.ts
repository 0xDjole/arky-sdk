import { atom, computed, map, type ReadableAtom } from "nanostores";
import type { RequestOptions } from "../types/api";
import type {
  Cart,
  CartBuyer,
  CartDeliveryDestination,
  CartDeliveryGroup,
  CartLineItem,
  CartLineItemInput,
  CartProductLineItem,
  CartQuote,
  CheckoutAcceptance,
  CustomerGroupDeliveryOffers,
  QuoteLine,
  StorefrontCheckoutCartInput,
  StorefrontCurrentCartParams,
} from "../types/cart";
import { cartBookingItems, cartCustomerGroupItems, cartProductItems } from "../types/cart";
import { CartError } from "../types/cartSelection";
import { ArkyApiError, ArkyNetworkError, errorInfo } from "../types/apiError";
import type { CompanyPartyQuery } from "../types/common";
import type { StorefrontCheckoutCartRequest, StorefrontClient } from "../index";
import { cartBuyerKey } from "../services/cartSelection";
import { isDefiniteRefusal } from "../utils/durableRequest";
import { fingerprint } from "../utils/fingerprint";
import { epochMillisecondsNow } from "../utils/time";
import type {
  ArkyAddBookingParams,
  ArkyAddCustomerGroupParams,
  ArkyAddProductParams,
  ArkyCartCheckoutParams,
  ArkyCartCreateParams,
  ArkyCartQuoteParams,
  ArkyCartScope,
  ArkyCartStatus,
  ArkyLastOrder,
  ArkyQuoteFutureDeliveriesParams,
  ArkyRemoveItemParams,
  ArkySelectShippingMethodParams,
  ArkySetBillingAddressParams,
  ArkySetBuyerParams,
  ArkySetDeliveryGroupsParams,
  ArkySetFutureDeliveriesParams,
  ArkySetProductQuantityParams,
  ArkySetPromotionCodesParams,
  ArkyShipToParams,
} from "./types";

export interface CartScope {
  customerId: string;
  isCurrent(): boolean;
  assertCurrent(): void;
}

export interface CartStoreContext {
  client: StorefrontClient;
  locale: ReadableAtom<string>;
  requireLocale(): string;
  beginCartOperation(): Promise<CartScope>;
  newId(label: string): string;
  newOrderToken(): string;
}

const variantReadsAtOnce = 10;

const idleStatus: ArkyCartStatus = {
  loading: false,
  syncing: false,
  fetching_quote: false,
  processing_checkout: false,
  error: null,
  quote_error: null,
};

function storeContextOnly(options?: RequestOptions): RequestOptions | undefined {
  if (options?.locale !== undefined || options?.market !== undefined) {
    throw new TypeError("A store cart quotes in the store's locale and market; change them with setContext");
  }
  return options;
}

function quoteBody(id: string, params: ArkyCartQuoteParams): { id: string; contact_email?: string } {
  if (Object.keys(params).some((key) => key !== "contact_email")) {
    throw new TypeError("A store cart quote takes { contact_email }; request options come second");
  }
  return params.contact_email !== undefined ? { id, contact_email: params.contact_email } : { id };
}

function cartLineInput(line: CartLineItem): CartLineItemInput {
  switch (line.type) {
    case "product":
      return {
        type: "product",
        id: line.id,
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
        catalog_item_price_id: line.catalog_item_price_id,
      };
    case "customer_group":
      return {
        type: "customer_group",
        id: line.id,
        customer_group_id: line.customer_group_id,
        quantity: line.quantity,
        choices: line.choices.map(({ entitlement_id, variant_id }) => ({ entitlement_id, variant_id })),
        start: line.start,
        deliveries: line.deliveries,
        catalog_item_price_id: line.catalog_item_price_id,
      };
  }
}

export function sameCartScope(left: StorefrontCurrentCartParams, right: StorefrontCurrentCartParams): boolean {
  return cartBuyerKey(left.buyer) === cartBuyerKey(right.buyer) && left.catalog_id === right.catalog_id;
}

function cartMayHaveChanged(error: unknown): boolean {
  if (error instanceof ArkyApiError) return error.statusCode === 409 || !isDefiniteRefusal(error);
  if (error instanceof ArkyNetworkError) return error.code !== "unreadable_answer" || !isDefiniteRefusal(error);
  return false;
}

export function buyerParty(buyer: CartBuyer | undefined): CompanyPartyQuery {
  if (!buyer) return {};
  switch (buyer.type) {
    case "customer":
      return {};
    case "company":
    case "company_location_selection":
      return { company_id: buyer.company_id };
    case "company_location":
      return { company_location_id: buyer.company_location_id };
  }
}

export function deliveryGroupsFor(
  cart: Cart,
  profileByLine: ReadonlyMap<string, string>,
  destination: CartDeliveryDestination,
  newId: () => string,
): CartDeliveryGroup[] {
  const holdsProducts = (group: CartDeliveryGroup) => group.items.some((item) => item.line_item.type === "product");
  if (cart.delivery_groups.some((group) => holdsProducts(group) && group.items.some((item) => item.line_item.type !== "product"))) {
    throw new CartError("not_ready", "A delivery mixes product lines with group deliveries; set it with setDeliveryGroups");
  }
  const lines = new Map<string, CartProductLineItem[]>();
  for (const line of cart.line_items) {
    if (line.type !== "product") continue;
    const profile = profileByLine.get(line.id);
    if (!profile) continue;
    lines.set(profile, [...(lines.get(profile) ?? []), line]);
  }
  const used = new Set<string>();
  const groups: CartDeliveryGroup[] = [];
  for (const profileLines of lines.values()) {
    const ids = new Set(profileLines.map((line) => line.id));
    const previous = cart.delivery_groups.find(
      (group) =>
        !used.has(group.id) &&
        group.items.some((item) => item.line_item.type === "product" && ids.has(item.line_item.line_item_id)),
    );
    if (previous) used.add(previous.id);
    const sameDestination = previous !== undefined && fingerprint(previous.destination) === fingerprint(destination);
    groups.push({
      id: previous?.id ?? newId(),
      items: profileLines.map((line) => ({ line_item: { type: "product", line_item_id: line.id }, quantity: line.quantity })),
      destination,
      shipping: sameDestination ? previous.shipping : null,
      timing: previous?.timing ?? { type: "asap" },
    });
  }
  return [...groups, ...cart.delivery_groups.filter((group) => !holdsProducts(group))];
}

export function createCartStore(context: CartStoreContext, scope: ArkyCartScope) {
  const { client } = context;
  const cart = atom<Cart | null>(null);
  const quote = atom<CartQuote | null>(null);
  const last_order = atom<ArkyLastOrder | null>(null);
  const cart_status = map<ArkyCartStatus>({ ...idleStatus });
  const product_items = computed(cart, (value) => cartProductItems(value));
  const booking_items = computed(cart, (value) => cartBookingItems(value));
  const customer_group_items = computed(cart, (value) => cartCustomerGroupItems(value));
  const product_item_count = computed(product_items, (items) => items.reduce((total, item) => total + item.quantity, 0));
  const item_count = computed(
    [product_item_count, booking_items, customer_group_items],
    (products, bookings, groups) => products + bookings.length + groups.length,
  );
  const promotion_codes = computed(quote, (value) =>
    (value?.promotions ?? []).flatMap((promotion) => (promotion.code ? [promotion.code.code] : [])),
  );

  let cartRevision = 0;
  let pendingCartId: string | null = null;

  function reset(): void {
    cartRevision += 1;
    cart.set(null);
    quote.set(null);
    cart_status.set({ ...idleStatus });
  }

  function invalidate(): void {
    pendingCartId = null;
    reset();
    last_order.set(null);
  }

  function applyCart(operation: CartScope, value: Cart, revision: number): Cart {
    operation.assertCurrent();
    if (value.customer_id !== operation.customerId) throw new CartError("other_cart", "The cart belongs to another customer");
    if (revision === cartRevision) {
      cart.set(value);
      quote.set(null);
    }
    return value;
  }

  function requireCart(): Cart {
    const value = cart.get();
    if (!value) throw new CartError("no_cart", "Load or create the cart first");
    return value;
  }

  async function runCartWrite(operation: (current: Cart) => Promise<Cart>): Promise<Cart> {
    const started = await context.beginCartOperation();
    const revision = ++cartRevision;
    cart_status.setKey("syncing", true);
    cart_status.setKey("error", null);
    try {
      const value = await operation(requireCart());
      return applyCart(started, value, revision);
    } catch (error) {
      if (started.isCurrent()) {
        cart_status.setKey("error", errorInfo(error));
        if (revision === cartRevision && cartMayHaveChanged(error)) {
          cart.set(null);
          quote.set(null);
        }
      }
      throw error;
    } finally {
      if (started.isCurrent()) cart_status.setKey("syncing", false);
    }
  }

  async function load(): Promise<Cart | null> {
    const started = await context.beginCartOperation();
    const revision = ++cartRevision;
    cart_status.setKey("loading", true);
    cart_status.setKey("error", null);
    try {
      const value = await client.eshop.cart.getCurrent(scope);
      started.assertCurrent();
      if (revision !== cartRevision) return cart.get();
      if (!value) {
        cart.set(null);
        quote.set(null);
        return null;
      }
      return applyCart(started, value, revision);
    } catch (error) {
      if (started.isCurrent()) cart_status.setKey("error", errorInfo(error));
      throw error;
    } finally {
      if (started.isCurrent()) cart_status.setKey("loading", false);
    }
  }

  async function create(params: ArkyCartCreateParams = {}): Promise<Cart> {
    const started = await context.beginCartOperation();
    const id = params.id ?? (pendingCartId ??= context.newId("cart"));
    const revision = ++cartRevision;
    try {
      const created = await client.eshop.cart.create({ id, buyer: scope.buyer ?? { type: "customer" }, catalog_id: scope.catalog_id });
      if (pendingCartId === id) pendingCartId = null;
      return applyCart(started, created.cart, revision);
    } catch (error) {
      if (pendingCartId === id && isDefiniteRefusal(error)) pendingCartId = null;
      throw error;
    }
  }

  async function ensure(): Promise<Cart> {
    const current = cart.get();
    if (current) return current;
    const loaded = await load();
    return loaded ?? create();
  }

  function version(current: Cart) {
    return { id: current.id, expected_updated_at: current.updated_at };
  }

  function addProduct(params: ArkyAddProductParams): Promise<Cart> {
    return runCartWrite((current) =>
      client.eshop.cart.addProduct({ ...version(current), product: { ...params, id: params.id ?? context.newId("cart line") } }),
    );
  }

  function addBooking(params: ArkyAddBookingParams): Promise<Cart> {
    return runCartWrite((current) =>
      client.eshop.cart.addBooking({ ...version(current), booking: { ...params, id: params.id ?? context.newId("cart line") } }),
    );
  }

  function addCustomerGroup(params: ArkyAddCustomerGroupParams): Promise<Cart> {
    return runCartWrite((current) =>
      client.eshop.cart.addCustomerGroup({
        ...version(current),
        customer_group: { ...params, id: params.id ?? context.newId("cart line") },
      }),
    );
  }

  function removeItem(params: ArkyRemoveItemParams): Promise<Cart> {
    return runCartWrite((current) => client.eshop.cart.removeItem({ ...version(current), line_item_id: params.line_item_id }));
  }

  function setProductQuantity(params: ArkySetProductQuantityParams): Promise<Cart> {
    const { line_item_id: lineItemId, quantity } = params;
    return runCartWrite((current) => {
      if (!Number.isInteger(quantity) || quantity < 1) throw new TypeError("A cart quantity is a whole number of at least 1");
      if (!current.line_items.some((line) => line.type === "product" && line.id === lineItemId)) {
        throw new CartError("not_ready", "The cart has no such product line");
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
        ...version(current),
        line_items: lineItems,
        ...(deliveryGroups ? { delivery_groups: deliveryGroups } : {}),
      });
    });
  }

  function setDeliveryGroups(params: ArkySetDeliveryGroupsParams): Promise<Cart> {
    return runCartWrite((current) => client.eshop.cart.update({ ...version(current), delivery_groups: params.delivery_groups }));
  }

  async function shippingProfiles(current: Cart, lines: QuoteLine[]): Promise<Map<string, string>> {
    const physical = lines.filter(
      (line): line is Extract<QuoteLine, { type: "product" }> => line.type === "product" && line.snapshot.fulfillment.type === "physical",
    );
    const variants = [...new Map(physical.map((line) => [line.variant_id, line.product_id])).entries()];
    const profileByVariant = new Map<string, string>();
    for (let start = 0; start < variants.length; start += variantReadsAtOnce) {
      const read = await Promise.all(
        variants
          .slice(start, start + variantReadsAtOnce)
          .map(([variantId, productId]) =>
            client.eshop.productVariant.get({ ...buyerParty(current.buyer), product_id: productId, id: variantId, catalog_id: current.catalog_id }),
          ),
      );
      for (const variant of read) {
        if (variant.fulfillment.type !== "physical") {
          throw new CartError("not_ready", "A shipped variant no longer ships; reload the cart");
        }
        profileByVariant.set(variant.id, variant.fulfillment.shipping_profile_id);
      }
    }
    const profileByLine = new Map<string, string>();
    for (const line of physical) {
      const profile = profileByVariant.get(line.variant_id);
      if (!profile) throw new CartError("not_ready", "A shipped variant couldn't be read; reload the cart");
      profileByLine.set(line.line_item_id, profile);
    }
    return profileByLine;
  }

  async function shipTo(params: ArkyShipToParams, options?: RequestOptions): Promise<Cart> {
    const { destination, ...quoteParams } = params;
    const started = await context.beginCartOperation();
    const current = requireCart();
    context.requireLocale();
    const quoted = await client.eshop.cart.quote(quoteBody(current.id, quoteParams), storeContextOnly(options));
    started.assertCurrent();
    if (quoted.cart_id !== current.id) throw new CartError("answer_mismatch", "The quote answered another cart");
    const profileByLine = await shippingProfiles(current, quoted.lines);
    started.assertCurrent();
    const groups = deliveryGroupsFor(current, profileByLine, destination, () => context.newId("delivery group"));
    return runCartWrite((latest) => {
      if (latest.id !== current.id || latest.updated_at !== current.updated_at) {
        throw new CartError("context_changed", "The cart changed while its deliveries were prepared; ship it again");
      }
      return client.eshop.cart.update({ ...version(latest), delivery_groups: groups });
    });
  }

  function setBillingAddress(params: ArkySetBillingAddressParams): Promise<Cart> {
    return runCartWrite((current) => client.eshop.cart.update({ ...version(current), billing_address: params.billing_address }));
  }

  function setBuyer(params: ArkySetBuyerParams): Promise<Cart> {
    return runCartWrite((current) => client.eshop.cart.update({ ...version(current), buyer: params.buyer }));
  }

  function setPromotionCodes(params: ArkySetPromotionCodesParams): Promise<Cart> {
    return runCartWrite((current) => client.eshop.cart.update({ ...version(current), promotion_codes: params.promotion_codes }));
  }

  function selectShippingMethod(params: ArkySelectShippingMethodParams): Promise<Cart> {
    return runCartWrite((current) =>
      client.eshop.cart.selectShippingMethod({ ...version(current), shipping_method_id: params.shipping_method_id }),
    );
  }

  function setFutureDeliveries(params: ArkySetFutureDeliveriesParams): Promise<Cart> {
    return runCartWrite((current) =>
      client.eshop.cart.setFutureDeliveries({ ...version(current), customer_groups: params.customer_groups }),
    );
  }

  async function quoteFutureDeliveries(
    params: ArkyQuoteFutureDeliveriesParams,
    options?: RequestOptions,
  ): Promise<CustomerGroupDeliveryOffers[]> {
    const started = await context.beginCartOperation();
    const current = requireCart();
    context.requireLocale();
    const result = await client.eshop.cart.quoteFutureDeliveries(
      { id: current.id, customer_groups: params.customer_groups },
      storeContextOnly(options),
    );
    started.assertCurrent();
    return result;
  }

  function clear(): Promise<Cart> {
    return runCartWrite((current) => client.eshop.cart.clear(version(current)));
  }

  async function fetchQuote(params: ArkyCartQuoteParams = {}, options?: RequestOptions): Promise<CartQuote> {
    const started = await context.beginCartOperation();
    const current = requireCart();
    const language = context.requireLocale();
    const revision = cartRevision;
    cart_status.setKey("fetching_quote", true);
    cart_status.setKey("quote_error", null);
    try {
      const value = await client.eshop.cart.quote(quoteBody(current.id, params), storeContextOnly(options));
      started.assertCurrent();
      if (revision !== cartRevision || value.cart_id !== current.id || language !== context.locale.get()) {
        throw new CartError("context_changed", "The cart or the language changed while quoting; quote the current cart");
      }
      quote.set(value);
      return value;
    } catch (error) {
      if (started.isCurrent()) {
        quote.set(null);
        cart_status.setKey("quote_error", errorInfo(error));
      }
      throw error;
    } finally {
      if (started.isCurrent()) cart_status.setKey("fetching_quote", false);
    }
  }

  function checkoutRequest(params: ArkyCartCheckoutParams): StorefrontCheckoutCartRequest {
    const current = requireCart();
    const reviewed = quote.get();
    if (!reviewed || reviewed.cart_id !== current.id) throw new CartError("not_ready", "Quote the cart before checkout");
    if (!reviewed.ready) throw new CartError("not_ready", "The quote isn't ready: pick shipping and check bookings first");
    if ((params.order_id === undefined) !== (params.order_token === undefined)) {
      throw new TypeError("A checkout names both its order_id and order_token, or neither so the app's factories pick them");
    }
    return {
      ...(params.order_id !== undefined ? { order_id: params.order_id, order_token: params.order_token } : {}),
      cart_id: current.id,
      expected_updated_at: current.updated_at,
      presentation_digest: reviewed.presentation_digest,
      contact_email: params.contact_email,
      payment: params.payment,
      scope,
    };
  }

  function finishCheckout(cartId: string, result: CheckoutAcceptance, clearAfter: boolean): CheckoutAcceptance {
    const reviewed = quote.get();
    if (result.type === "placed") {
      last_order.set({
        order_id: result.order_id,
        number: result.number,
        cart_id: cartId,
        payment_id: result.payment_id,
        payment_action: result.payment_action,
        total: reviewed && reviewed.cart_id === cartId ? reviewed.totals.total : null,
        currency: reviewed && reviewed.cart_id === cartId ? reviewed.currency : null,
        created_at: epochMillisecondsNow(),
      });
    } else {
      last_order.set(null);
    }
    if (clearAfter && cart.get()?.id === cartId) {
      client.eshop.cart.forget(scope);
      reset();
    }
    return result;
  }

  async function runCheckout<T>(operation: () => Promise<T>): Promise<T> {
    const started = await context.beginCartOperation();
    if (cart_status.get().processing_checkout) throw new CartError("busy", "A checkout is already running");
    cart_status.setKey("processing_checkout", true);
    cart_status.setKey("error", null);
    try {
      const value = await operation();
      started.assertCurrent();
      return value;
    } catch (error) {
      if (started.isCurrent()) cart_status.setKey("error", errorInfo(error));
      throw error;
    } finally {
      if (started.isCurrent()) cart_status.setKey("processing_checkout", false);
    }
  }

  function checkout(params: ArkyCartCheckoutParams): Promise<CheckoutAcceptance> {
    return runCheckout(async () => {
      const request = checkoutRequest(params);
      const result = await client.eshop.cart.checkout(request);
      return finishCheckout(request.cart_id, result, params.clear_after_checkout !== false);
    });
  }

  function retainCheckout(params: ArkyCartCheckoutParams): Promise<StorefrontCheckoutCartInput> {
    return runCheckout(() => {
      const request = checkoutRequest(params);
      return client.eshop.cart.retainCheckout({
        ...request,
        order_id: request.order_id ?? context.newId("order"),
        order_token: request.order_token ?? context.newOrderToken(),
      });
    });
  }

  function pendingCheckout(): Promise<StorefrontCheckoutCartInput | null> {
    return client.eshop.cart.pendingCheckout({ scope });
  }

  function recoverCheckout(): Promise<CheckoutAcceptance | null> {
    return runCheckout(async () => {
      const pending = await client.eshop.cart.pendingCheckout({ scope });
      if (!pending) return null;
      const result = await client.eshop.cart.recoverCheckout({ scope });
      return result ? finishCheckout(pending.cart_id, result, true) : null;
    });
  }

  const store = {
    scope,
    cart,
    product_items,
    booking_items,
    customer_group_items,
    quote_result: quote,
    promotion_codes,
    last_order,
    status: cart_status,
    product_item_count,
    item_count,
    load,
    create,
    ensure,
    reset,
    addProduct,
    addBooking,
    addCustomerGroup,
    removeItem,
    setProductQuantity,
    setDeliveryGroups,
    shipTo,
    setBillingAddress,
    setBuyer,
    setPromotionCodes,
    selectShippingMethod,
    setFutureDeliveries,
    quoteFutureDeliveries,
    clear,
    quote: fetchQuote,
    checkout,
    retainCheckout,
    pendingCheckout,
    recoverCheckout,
  };
  return { store, invalidate };
}

export type CartStore = ReturnType<typeof createCartStore>["store"];
