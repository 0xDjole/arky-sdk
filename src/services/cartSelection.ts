import type { RequestOptions } from "../types/httpClient";
import type {
  Cart,
  CartBuyer,
  CreatedCart,
  ReorderedCart,
  StorefrontCreateCartParams,
  StorefrontCurrentCartParams,
  StorefrontReorderParams,
} from "../types/cart";
import type { CartSelectionContext, CartSelectionTransport, SelectedCart } from "../types/cartSelection";
import { CartSelectionError } from "../types/cartSelection";
import { isCanonicalId, requireId } from "../utils/ids";
import { withCartMutation } from "./cartCheckout";

type SelectionStorage = NonNullable<CartSelectionContext["storage"]>;

interface FollowedCart {
  cart: Cart | null;
  chain: string[];
}

const closedStatuses = ["converted", "merged", "superseded", "expired"];
const maxMergedHops = 4;

function buyerKey(buyer: CartBuyer | undefined): string {
  if (!buyer || buyer.type === "customer") return "customer";
  if (buyer.type === "company_location") return `company_location:${buyer.company_location_id}`;
  return `${buyer.type}:${buyer.company_id}`;
}

function sameBuyer(cart: Cart, buyer: CartBuyer | undefined): boolean {
  if (!buyer) return true;
  if (buyer.type === "company_location_selection" && cart.buyer.type === "company_location") return true;
  return buyerKey(cart.buyer) === buyerKey(buyer);
}

function readSelection(value: string | null): SelectedCart | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "version" in parsed &&
      parsed.version === 3 &&
      "id" in parsed &&
      isCanonicalId(parsed.id)
    ) {
      return { version: 3, id: parsed.id };
    }
  } catch {}
  return null;
}

function readSignIn(value: string | null): string | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "version" in parsed &&
      parsed.version === 1 &&
      "from_customer_id" in parsed &&
      isCanonicalId(parsed.from_customer_id)
    ) {
      return parsed.from_customer_id;
    }
  } catch {}
  return null;
}

function isGone(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return false;
  return error.statusCode === 403 || error.statusCode === 404;
}

export function createCartSelection(
  context: CartSelectionContext,
  checkoutScope: string,
  transport: CartSelectionTransport,
) {
  function requireStorage(): SelectionStorage {
    if (!context.storage) {
      throw new CartSelectionError("Selecting a cart requires working session storage");
    }
    return context.storage;
  }

  function requireCustomerId(): string {
    const customerId = context.customerId();
    if (!customerId) {
      throw new CartSelectionError("Selecting a cart requires a customer session");
    }
    return customerId;
  }

  function selectionKey(customerId: string, params: StorefrontCurrentCartParams): string {
    return [
      "arky:selected-cart:v3",
      context.namespace,
      encodeURIComponent(customerId),
      encodeURIComponent(context.market() ?? ""),
      encodeURIComponent(buyerKey(params.buyer)),
      encodeURIComponent(params.catalog_id ?? ""),
    ].join(":");
  }

  function signInKey(customerId: string): string {
    return ["arky:cart-sign-in:v1", context.namespace, encodeURIComponent(customerId)].join(":");
  }

  function tokenKey(cartId: string): string {
    return ["arky:cart-token:v1", context.namespace, encodeURIComponent(cartId)].join(":");
  }

  function token(cartId: string): string | null {
    if (!context.storage) return null;
    try {
      const value = context.storage.getItem(tokenKey(cartId));
      return value && value.length > 0 ? value : null;
    } catch {
      return null;
    }
  }

  function assertCart(cart: Cart, customerId: string | null, params: StorefrontCurrentCartParams): void {
    if (!cart || typeof cart.id !== "string" || cart.customer_id !== customerId || !sameBuyer(cart, params.buyer)) {
      throw new CartSelectionError("The cart does not belong to this customer and buyer");
    }
    if (params.catalog_id && cart.catalog_id !== params.catalog_id) {
      throw new CartSelectionError("The selected cart uses a different catalog");
    }
  }

  function usable(cart: Cart, customerId: string, params: StorefrontCurrentCartParams): boolean {
    return (
      cart.customer_id === customerId &&
      sameBuyer(cart, params.buyer) &&
      (!params.catalog_id || cart.catalog_id === params.catalog_id) &&
      !closedStatuses.includes(cart.status.type)
    );
  }

  function select(storage: SelectionStorage, key: string, cartId: string): boolean {
    try {
      storage.setItem(key, JSON.stringify({ version: 3, id: cartId }));
      return true;
    } catch {
      return false;
    }
  }

  function release(storage: SelectionStorage, key: string | null, cartIds: string[]): void {
    try {
      if (key !== null) storage.removeItem(key);
      for (const id of cartIds) storage.removeItem(tokenKey(id));
    } catch {}
  }

  function releaseSignIn(storage: SelectionStorage, customerId: string, params: StorefrontCurrentCartParams): void {
    try {
      const signedInFrom = readSignIn(storage.getItem(signInKey(customerId)));
      if (!signedInFrom || signedInFrom === customerId) return;
      const guestKey = selectionKey(signedInFrom, params);
      const guest = readSelection(storage.getItem(guestKey));
      release(storage, guestKey, guest ? [guest.id] : []);
    } catch {}
  }

  async function read(id: string, options?: RequestOptions): Promise<Cart | null> {
    let cart: Cart;
    try {
      cart = await transport.get({ id, token: token(id) }, options);
    } catch (error) {
      if (isGone(error)) return null;
      throw error;
    }
    if (!cart || cart.id !== id) {
      throw new CartSelectionError("The cart read returned a different cart");
    }
    return cart;
  }

  async function follow(start: Cart, options?: RequestOptions): Promise<FollowedCart> {
    const chain = [start.id];
    let cart: Cart | null = start;
    for (let hop = 0; hop < maxMergedHops && cart; hop += 1) {
      const status = cart.status;
      if (status.type !== "merged") return { cart, chain };
      if (!isCanonicalId(status.target_cart_id) || chain.includes(status.target_cart_id)) {
        return { cart: null, chain };
      }
      chain.push(status.target_cart_id);
      cart = await read(status.target_cart_id, options);
    }
    return { cart: cart && cart.status.type !== "merged" ? cart : null, chain };
  }

  async function followSignIn(
    storage: SelectionStorage,
    customerId: string,
    params: StorefrontCurrentCartParams,
    key: string,
    options?: RequestOptions,
  ): Promise<Cart | null> {
    const signedInFrom = readSignIn(storage.getItem(signInKey(customerId)));
    if (!signedInFrom || signedInFrom === customerId) return null;
    const guestKey = selectionKey(signedInFrom, params);
    const guest = readSelection(storage.getItem(guestKey));
    if (!guest) return null;
    const start = await read(guest.id, options);
    const followed: FollowedCart = start ? await follow(start, options) : { cart: null, chain: [guest.id] };
    const cart = followed.cart;
    if (cart && usable(cart, customerId, params)) {
      const cartId = cart.id;
      if (select(storage, key, cartId)) {
        release(
          storage,
          guestKey,
          followed.chain.filter((id) => id !== cartId),
        );
      }
      return cart;
    }
    release(storage, guestKey, followed.chain);
    return null;
  }

  async function current(params: StorefrontCurrentCartParams = {}, options?: RequestOptions): Promise<Cart | null> {
    const storage = requireStorage();
    const customerId = requireCustomerId();
    const key = selectionKey(customerId, params);
    const signedIn = await followSignIn(storage, customerId, params, key, options);
    if (signedIn) return signedIn;
    const selection = readSelection(storage.getItem(key));
    if (!selection) return null;
    const start = await read(selection.id, options);
    if (!start) {
      release(storage, key, [selection.id]);
      return null;
    }
    assertCart(start, customerId, params);
    const followed = await follow(start, options);
    const cart = followed.cart;
    if (cart && usable(cart, customerId, params)) {
      const cartId = cart.id;
      if (cartId !== selection.id && select(storage, key, cartId)) {
        release(
          storage,
          null,
          followed.chain.filter((id) => id !== cartId),
        );
      }
      return cart;
    }
    release(storage, key, followed.chain);
    return null;
  }

  function keep(
    storage: SelectionStorage,
    key: string,
    customerId: string,
    params: StorefrontCurrentCartParams,
    created: CreatedCart,
  ): void {
    try {
      if (created.type === "created") storage.setItem(tokenKey(created.cart.id), created.recovery_token);
      storage.setItem(key, JSON.stringify({ version: 3, id: created.cart.id }));
    } catch {
      throw new CartSelectionError(
        "The cart was created but its selection could not be saved; retry with the same cart id",
      );
    }
    releaseSignIn(storage, customerId, params);
  }

  async function create(params: StorefrontCreateCartParams, options?: RequestOptions): Promise<CreatedCart> {
    requireId(params.id, "cart");
    const storage = requireStorage();
    const customerId = requireCustomerId();
    const selected = { buyer: params.buyer, catalog_id: params.catalog_id };
    const key = selectionKey(customerId, selected);
    return withCartMutation(checkoutScope, async () => {
      const created = await transport.create(params, options);
      if (!created || !created.cart || created.cart.id !== params.id) {
        throw new CartSelectionError("Cart creation returned a different cart");
      }
      assertCart(created.cart, customerId, selected);
      keep(storage, key, customerId, selected, created);
      return created;
    });
  }

  async function reorder(params: StorefrontReorderParams, options?: RequestOptions): Promise<ReorderedCart> {
    requireId(params.id, "cart");
    const storage = requireStorage();
    const customerId = requireCustomerId();
    return withCartMutation(checkoutScope, async () => {
      const reordered = await transport.reorder(params, options);
      const created = reordered?.cart;
      if (!created || !created.cart || created.cart.id !== params.id) {
        throw new CartSelectionError("The reorder returned a different cart");
      }
      const selected = { buyer: params.buyer, catalog_id: created.cart.catalog_id };
      assertCart(created.cart, customerId, selected);
      keep(storage, selectionKey(customerId, selected), customerId, selected, created);
      return reordered;
    });
  }

  function forget(params: StorefrontCurrentCartParams = {}): void {
    const storage = context.storage;
    if (!storage) return;
    const customerId = requireCustomerId();
    const key = selectionKey(customerId, params);
    try {
      const selection = readSelection(storage.getItem(key));
      release(storage, key, selection ? [selection.id] : []);
    } catch {}
    releaseSignIn(storage, customerId, params);
  }

  function signedIn(fromCustomerId: string | null, toCustomerId: string): void {
    const storage = context.storage;
    if (
      !storage ||
      !isCanonicalId(fromCustomerId) ||
      !isCanonicalId(toCustomerId) ||
      fromCustomerId === toCustomerId
    ) {
      return;
    }
    try {
      storage.setItem(signInKey(toCustomerId), JSON.stringify({ version: 1, from_customer_id: fromCustomerId }));
    } catch {}
  }

  return { current, create, reorder, forget, token, signedIn };
}

export type CartSelection = ReturnType<typeof createCartSelection>;
