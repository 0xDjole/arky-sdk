import { atom, computed, map, type ReadableAtom } from "nanostores";
import type { RequestOptions } from "../types/api";
import type {
  Cart,
  CartBuyer,
  CartDeliveryDestination,
  CartDeliveryGroup,
  CartCustomerGroupDeliveries,
  CartLineItem,
  CartProductLineItem,
  CartQuote,
  CheckoutAcceptance,
  CustomerGroupDeliveryChoices,
  CustomerGroupDeliveryOffers,
  QuoteLine,
  StorefrontCartLineItemInput,
  StorefrontCheckoutCartInput,
  StorefrontCurrentCartParams,
} from "../types/cart";
import { cartBookingItems, cartCustomerGroupItems, cartProductItems } from "../types/cart";
import { CartSelectionError } from "../types/cartSelection";
import { ArkyApiError } from "../types/apiError";
import type { CompanyPartyQuery, PostalAddress } from "../types/common";
import type { StorefrontCheckoutCartRequest, StorefrontClient } from "../index";
import { cartBuyerKey } from "../services/cartSelection";
import { isDefiniteRefusal } from "../utils/durableRequest";
import { fingerprint } from "../utils/fingerprint";
import { epochMillisecondsNow } from "../utils/time";
import type {
  ArkyCartBookingInput,
  ArkyCartCheckoutInput,
  ArkyCartCreateParams,
  ArkyCartCustomerGroupInput,
  ArkyCartProductInput,
  ArkyCartScope,
  ArkyCartStatus,
  ArkyLastOrder,
} from "./types";
import { readErrorMessage } from "./utils";

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

function storeContextOnly(options?: RequestOptions): RequestOptions | undefined {
  if (options?.locale !== undefined || options?.market !== undefined) {
    throw new TypeError("A store cart quotes in the store's locale and market; change them with setContext");
  }
  return options;
}

function cartLineInput(line: CartLineItem): StorefrontCartLineItemInput {
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
      };
  }
}

export function sameCartScope(left: StorefrontCurrentCartParams, right: StorefrontCurrentCartParams): boolean {
  return cartBuyerKey(left.buyer) === cartBuyerKey(right.buyer) && left.catalog_id === right.catalog_id;
}

export function cartScopeKey(scope: StorefrontCurrentCartParams): string {
  return `${cartBuyerKey(scope.buyer)}|${scope.catalog_id}`;
}

function cartMayHaveChanged(error: unknown): boolean {
  if (error instanceof ArkyApiError) return error.statusCode === 409 || !isDefiniteRefusal(error);
  if (!(error instanceof Error)) return false;
  if (error.name === "NetworkError" || error.name === "AbortError") return true;
  return error.name === "ParseError" && !isDefiniteRefusal(error);
}

function buyerParty(buyer: CartBuyer): CompanyPartyQuery {
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
    throw new CartSelectionError("A delivery mixes product lines with group deliveries; set it with setDeliveryGroups");
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

export function createCartStore(context: CartStoreContext, fixedScope: ArkyCartScope | null) {
  const { client } = context;
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
  const customer_group_items = computed(cart, (value) => cartCustomerGroupItems(value));
  const product_item_count = computed(product_items, (items) => items.reduce((total, item) => total + item.quantity, 0));
  const item_count = computed(
    [product_item_count, booking_items, customer_group_items],
    (products, bookings, groups) => products + bookings.length + groups.length,
  );
  const promotion_codes = computed(quote, (value) =>
    (value?.promotions ?? []).flatMap((promotion) => (promotion.code ? [promotion.code.code] : [])),
  );

  let selectedScope: ArkyCartScope | null = fixedScope;
  let cartRevision = 0;
  let pendingCartId: string | null = null;

  function scopeFor(params?: StorefrontCurrentCartParams | ArkyCartCreateParams): ArkyCartScope {
    const asked = params?.catalog_id !== undefined ? { buyer: params.buyer, catalog_id: params.catalog_id } : null;
    if (fixedScope) {
      if (asked && !sameCartScope(asked, fixedScope)) {
        throw new CartSelectionError("This cart belongs to another buyer or catalog; use eshop.carts.for for that one");
      }
      return fixedScope;
    }
    const scope = asked ?? selectedScope;
    if (!scope) throw new CartSelectionError("Choose the cart's catalog before loading it");
    if (selectedScope && !sameCartScope(scope, selectedScope)) {
      pendingCartId = null;
      clearLocal();
    }
    selectedScope = scope;
    return scope;
  }

  function clearLocal(): void {
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

  function invalidate(): void {
    pendingCartId = null;
    clearLocal();
    last_order.set(null);
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

  async function runCartWrite(label: string, operation: (current: Cart) => Promise<Cart>): Promise<Cart> {
    const scope = await context.beginCartOperation();
    const revision = ++cartRevision;
    cart_status.setKey("syncing", true);
    cart_status.setKey("error", null);
    try {
      const value = await operation(requireCart());
      return applyCart(scope, value, revision);
    } catch (error) {
      if (scope.isCurrent()) {
        cart_status.setKey("error", readErrorMessage(error, label));
        if (revision === cartRevision && cartMayHaveChanged(error)) {
          cart.set(null);
          quote.set(null);
        }
      }
      throw error;
    } finally {
      if (scope.isCurrent()) cart_status.setKey("syncing", false);
    }
  }

  async function load(params?: StorefrontCurrentCartParams): Promise<Cart | null> {
    const selected = scopeFor(params);
    const scope = await context.beginCartOperation();
    const revision = ++cartRevision;
    cart_status.setKey("loading", true);
    cart_status.setKey("error", null);
    try {
      const value = await client.eshop.cart.current(selected);
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

  async function create(params: ArkyCartCreateParams = {}): Promise<Cart> {
    const selected = scopeFor(params);
    const scope = await context.beginCartOperation();
    const id = params.id ?? (pendingCartId ??= context.newId("cart"));
    const revision = ++cartRevision;
    try {
      const created = await client.eshop.cart.create({ id, buyer: selected.buyer ?? { type: "customer" }, catalog_id: selected.catalog_id });
      if (pendingCartId === id) pendingCartId = null;
      return applyCart(scope, created.cart, revision);
    } catch (error) {
      if (pendingCartId === id && isDefiniteRefusal(error)) pendingCartId = null;
      throw error;
    }
  }

  async function ensure(params?: StorefrontCurrentCartParams): Promise<Cart> {
    const selected = scopeFor(params);
    const current = cart.get();
    if (current && current.catalog_id === selected.catalog_id) return current;
    const loaded = await load(selected);
    return loaded ?? create(selected);
  }

  function updateBody(current: Cart) {
    return { id: current.id, expected_updated_at: current.updated_at };
  }

  function addProduct(product: ArkyCartProductInput): Promise<Cart> {
    return runCartWrite("The product couldn't be added to the cart", (current) =>
      client.eshop.cart.addProduct({ ...updateBody(current), product: { ...product, id: product.id ?? context.newId("cart line") } }),
    );
  }

  function addBooking(booking: ArkyCartBookingInput): Promise<Cart> {
    return runCartWrite("The booking couldn't be added to the cart", (current) =>
      client.eshop.cart.addBooking({ ...updateBody(current), booking: { ...booking, id: booking.id ?? context.newId("cart line") } }),
    );
  }

  function addCustomerGroup(customerGroup: ArkyCartCustomerGroupInput): Promise<Cart> {
    return runCartWrite("The group couldn't be added to the cart", (current) =>
      client.eshop.cart.addCustomerGroup({
        ...updateBody(current),
        customer_group: { ...customerGroup, id: customerGroup.id ?? context.newId("cart line") },
      }),
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
          throw new CartSelectionError("A shipped variant no longer ships; reload the cart");
        }
        profileByVariant.set(variant.id, variant.fulfillment.shipping_profile_id);
      }
    }
    const profileByLine = new Map<string, string>();
    for (const line of physical) {
      const profile = profileByVariant.get(line.variant_id);
      if (!profile) throw new CartSelectionError("A shipped variant couldn't be read; reload the cart");
      profileByLine.set(line.line_item_id, profile);
    }
    return profileByLine;
  }

  async function shipTo(destination: CartDeliveryDestination, options?: RequestOptions): Promise<Cart> {
    const scope = await context.beginCartOperation();
    const current = requireCart();
    context.requireLocale();
    const quoted = await client.eshop.cart.quote({ id: current.id }, storeContextOnly(options));
    scope.assertCurrent();
    if (quoted.cart_id !== current.id) throw new CartSelectionError("The quote answered another cart");
    const profileByLine = await shippingProfiles(current, quoted.lines);
    scope.assertCurrent();
    const groups = deliveryGroupsFor(current, profileByLine, destination, () => context.newId("delivery group"));
    return runCartWrite("The deliveries couldn't be saved", (latest) => {
      if (latest.id !== current.id || latest.updated_at !== current.updated_at) {
        throw new CartSelectionError("The cart changed while its deliveries were prepared; ship it again");
      }
      return client.eshop.cart.update({ ...updateBody(latest), delivery_groups: groups });
    });
  }

  function setBillingAddress(address: PostalAddress | null): Promise<Cart> {
    return runCartWrite("The billing address couldn't be saved", (current) =>
      client.eshop.cart.update({ ...updateBody(current), billing_address: address }),
    );
  }

  function setBuyer(buyer: CartBuyer): Promise<Cart> {
    return runCartWrite("The buyer couldn't be changed", (current) => client.eshop.cart.update({ ...updateBody(current), buyer }));
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

  function setFutureDeliveries(customerGroups: CartCustomerGroupDeliveries[]): Promise<Cart> {
    return runCartWrite("The group deliveries couldn't be saved", (current) =>
      client.eshop.cart.setFutureDeliveries({ ...updateBody(current), customer_groups: customerGroups }),
    );
  }

  async function quoteFutureDeliveries(
    customerGroups: CustomerGroupDeliveryChoices[],
    options?: RequestOptions,
  ): Promise<CustomerGroupDeliveryOffers[]> {
    const scope = await context.beginCartOperation();
    const current = requireCart();
    context.requireLocale();
    const result = await client.eshop.cart.quoteFutureDeliveries({ id: current.id, customer_groups: customerGroups }, storeContextOnly(options));
    scope.assertCurrent();
    return result;
  }

  function clearCart(): Promise<Cart> {
    return runCartWrite("The cart couldn't be cleared", (current) => client.eshop.cart.clear(updateBody(current)));
  }

  async function fetchQuote(options?: RequestOptions): Promise<CartQuote> {
    const scope = await context.beginCartOperation();
    const current = requireCart();
    const language = context.requireLocale();
    const revision = cartRevision;
    cart_status.setKey("fetching_quote", true);
    cart_status.setKey("quote_error", null);
    try {
      const value = await client.eshop.cart.quote({ id: current.id }, storeContextOnly(options));
      scope.assertCurrent();
      if (revision !== cartRevision || value.cart_id !== current.id || language !== context.locale.get()) {
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

  function checkoutRequest(input: ArkyCartCheckoutInput): StorefrontCheckoutCartRequest {
    const current = requireCart();
    const reviewed = quote.get();
    if (!reviewed || reviewed.cart_id !== current.id) throw new CartSelectionError("Quote the cart before checkout");
    if (!reviewed.ready) throw new CartSelectionError("The quote isn't ready: pick shipping and check bookings first");
    if ((input.order_id === undefined) !== (input.order_token === undefined)) {
      throw new TypeError("A checkout names both its order_id and order_token, or neither so the app's factories pick them");
    }
    return {
      ...(input.order_id !== undefined ? { order_id: input.order_id, order_token: input.order_token } : {}),
      cart_id: current.id,
      expected_updated_at: current.updated_at,
      presentation_digest: reviewed.presentation_digest,
      contact_email: input.contact_email,
      payment: input.payment,
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
      if (selectedScope) client.eshop.cart.forget(selectedScope);
      clearLocal();
    }
    return result;
  }

  async function runCheckout<T>(operation: (scope: CartScope) => Promise<T>): Promise<T> {
    const scope = await context.beginCartOperation();
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
      return finishCheckout(request.cart_id, result, input.clear_after_checkout !== false);
    });
  }

  function retainCheckout(input: ArkyCartCheckoutInput): Promise<StorefrontCheckoutCartInput> {
    return runCheckout(() => {
      const request = checkoutRequest(input);
      return client.eshop.cart.retainCheckout({
        ...request,
        order_id: request.order_id ?? context.newId("order"),
        order_token: request.order_token ?? context.newOrderToken(),
      });
    });
  }

  function recoverCheckout(): Promise<CheckoutAcceptance | null> {
    return runCheckout(async () => {
      const pending = await client.eshop.cart.pendingCheckout();
      if (!pending) return null;
      const result = await client.eshop.cart.recoverCheckout();
      return result ? finishCheckout(pending.cart_id, result, true) : null;
    });
  }

  const store = {
    get scope(): ArkyCartScope | null {
      return selectedScope;
    },
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
    addProduct,
    setProductQuantity,
    addBooking,
    addCustomerGroup,
    removeItem,
    setDeliveryGroups,
    shipTo,
    setBillingAddress,
    setBuyer,
    setPromotionCodes,
    selectShippingMethod,
    setFutureDeliveries,
    quoteFutureDeliveries,
    clear: clearCart,
    clearLocal,
    quote: fetchQuote,
    checkout,
    retainCheckout,
    pendingCheckout: () => client.eshop.cart.pendingCheckout(),
    recoverCheckout,
    paymentAction: (orderId: string) => client.eshop.order.paymentAction({ order_id: orderId }),
  };
  return { store, invalidate };
}

export type CartStore = ReturnType<typeof createCartStore>["store"];
