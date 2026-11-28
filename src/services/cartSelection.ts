import type { RequestOptions } from "../types/httpClient";
import type {
  StorefrontCart,
  CartBuyer,
  StorefrontCreatedCart,
  StorefrontReorderedCart,
  StorefrontCreateCartParams,
  StorefrontCurrentCartParams,
  StorefrontReorderParams,
} from "../types/cart";
import type { CartSelectionContext, CartSelectionTransport, SelectedCart } from "../types/cartSelection";
import { CartError } from "../types/cartSelection";
import { refusePerCallMarket } from "../utils/cartInputs";
import { isCanonicalId, requireId } from "../utils/ids";
import { withCartMutation } from "./cartCheckout";

type SelectionStorage = NonNullable<CartSelectionContext["storage"]>;

interface FollowedCart {
  cart: StorefrontCart | null;
  chain: string[];
}

const closedStatuses = ["converted", "merged", "superseded", "expired"];
const maxMergedHops = 4;

export function cartBuyerKey(buyer: CartBuyer | undefined): string {
  if (!buyer || buyer.type === "user") return "user";
  if (buyer.type === "company_location") return `company_location:${buyer.company_location_id}`;
  return `${buyer.type}:${buyer.company_id}`;
}

export function cartScopeKey(scope: StorefrontCurrentCartParams, market: string | null): string {
  return `${cartBuyerKey(scope.buyer)}|${scope.package_id}|${market ?? ""}`;
}

function sameBuyer(cart: StorefrontCart, buyer: CartBuyer | undefined): boolean {
  if (!buyer) return true;
  if (buyer.type === "company_location_selection" && cart.buyer.type === "company_location") return true;
  return cartBuyerKey(cart.buyer) === cartBuyerKey(buyer);
}

function parsedStoredValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readSelection(value: string | null): SelectedCart | null {
  if (value === null) return null;
  const parsed = parsedStoredValue(value);
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
  return null;
}

function readSignIn(value: string | null): string | null {
  if (value === null) return null;
  const parsed = parsedStoredValue(value);
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "version" in parsed &&
    parsed.version === 1 &&
    "from_user_id" in parsed &&
    isCanonicalId(parsed.from_user_id)
  ) {
    return parsed.from_user_id;
  }
  return null;
}

function isGone(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return false;
  return error.statusCode === 403 || error.statusCode === 404;
}

export function createCartSelection(
  context: CartSelectionContext,
  checkoutScopes: () => readonly string[],
  transport: CartSelectionTransport,
) {
  function requireStorage(): SelectionStorage {
    if (!context.storage) {
      throw new CartError("storage", "Selecting a cart requires working session storage");
    }
    return context.storage;
  }

  function requireUserId(): string {
    const userId = context.userId();
    if (!userId) {
      throw new CartError("no_session", "Selecting a cart requires a user session");
    }
    return userId;
  }

  function selectionKey(userId: string, params: StorefrontCurrentCartParams): string {
    requireId(params?.package_id, "package");
    return [
      "arky:selected-cart:v3",
      context.namespace,
      encodeURIComponent(userId),
      encodeURIComponent(context.market() ?? ""),
      encodeURIComponent(cartBuyerKey(params.buyer)),
      encodeURIComponent(params.package_id),
    ].join(":");
  }

  function signInKey(userId: string): string {
    return ["arky:cart-sign-in:v1", context.namespace, encodeURIComponent(userId)].join(":");
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
      context.storageRefused();
      return null;
    }
  }

  function otherCart(cart: StorefrontCart, userId: string | null, params: StorefrontCurrentCartParams): CartError | null {
    if (!cart || typeof cart.id !== "string" || cart.user_id !== userId || !sameBuyer(cart, params.buyer)) {
      return new CartError("other_cart", "The cart does not belong to this user and buyer");
    }
    if (cart.package_id !== params.package_id) {
      return new CartError("other_cart", "The selected cart uses a different package");
    }
    return null;
  }

  function assertCart(cart: StorefrontCart, userId: string | null, params: StorefrontCurrentCartParams): void {
    const refusal = otherCart(cart, userId, params);
    if (refusal) throw refusal;
  }

  function assertMarket(cart: StorefrontCart, marketId: string): void {
    if (cart.market_id !== marketId) {
      throw new CartError("other_cart", "The cart is in a different market");
    }
  }

  function usable(cart: StorefrontCart, userId: string, params: StorefrontCurrentCartParams, marketId: string): boolean {
    return (
      cart.user_id === userId &&
      sameBuyer(cart, params.buyer) &&
      cart.package_id === params.package_id &&
      cart.market_id === marketId &&
      !closedStatuses.includes(cart.status.type)
    );
  }

  function select(storage: SelectionStorage, key: string, cartId: string): boolean {
    try {
      storage.setItem(key, JSON.stringify({ version: 3, id: cartId }));
      return true;
    } catch {
      context.storageRefused();
      return false;
    }
  }

  function release(storage: SelectionStorage, key: string | null, cartIds: string[]): void {
    try {
      if (key !== null) storage.removeItem(key);
      for (const id of cartIds) storage.removeItem(tokenKey(id));
    } catch {
      context.storageRefused();
    }
  }

  function releaseSignIn(storage: SelectionStorage, userId: string, params: StorefrontCurrentCartParams): void {
    try {
      const signedInFrom = readSignIn(storage.getItem(signInKey(userId)));
      if (!signedInFrom || signedInFrom === userId) return;
      const guestKey = selectionKey(signedInFrom, params);
      const guest = readSelection(storage.getItem(guestKey));
      release(storage, guestKey, guest ? [guest.id] : []);
    } catch {
      context.storageRefused();
    }
  }

  function signedInFrom(userId: string): string | null {
    if (!context.storage) return null;
    let value: string | null;
    try {
      value = context.storage.getItem(signInKey(userId));
    } catch {
      context.storageRefused();
      return null;
    }
    const from = readSignIn(value);
    return from !== null && from !== userId ? from : null;
  }

  async function read(id: string, options?: RequestOptions): Promise<StorefrontCart | null> {
    let cart: StorefrontCart;
    try {
      cart = await transport.get({ id, token: token(id) }, options);
    } catch (error) {
      if (isGone(error)) return null;
      throw error;
    }
    if (!cart || cart.id !== id) {
      throw new CartError("answer_mismatch", "The cart read returned a different cart");
    }
    return cart;
  }

  async function follow(start: StorefrontCart, options?: RequestOptions): Promise<FollowedCart> {
    const chain = [start.id];
    let cart: StorefrontCart | null = start;
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
    userId: string,
    params: StorefrontCurrentCartParams,
    key: string,
    options?: RequestOptions,
  ): Promise<StorefrontCart | null> {
    const signedInFrom = readSignIn(storage.getItem(signInKey(userId)));
    if (!signedInFrom || signedInFrom === userId) return null;
    const guestKey = selectionKey(signedInFrom, params);
    const guest = readSelection(storage.getItem(guestKey));
    if (!guest) return null;
    const start = await read(guest.id, options);
    const followed: FollowedCart = start ? await follow(start, options) : { cart: null, chain: [guest.id] };
    const cart = followed.cart;
    if (cart && usable(cart, userId, params, await context.marketId())) {
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

  async function current(params: StorefrontCurrentCartParams, options?: RequestOptions): Promise<StorefrontCart | null> {
    const storage = requireStorage();
    const userId = requireUserId();
    const key = selectionKey(userId, params);
    const signedIn = await followSignIn(storage, userId, params, key, options);
    if (signedIn) return signedIn;
    const selection = readSelection(storage.getItem(key));
    if (!selection) return null;
    const start = await read(selection.id, options);
    if (!start) {
      release(storage, key, [selection.id]);
      return null;
    }
    const refusal = otherCart(start, userId, params);
    if (refusal) {
      release(storage, key, [selection.id]);
      throw refusal;
    }
    const followed = await follow(start, options);
    const cart = followed.cart;
    if (cart && usable(cart, userId, params, await context.marketId())) {
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
    userId: string,
    params: StorefrontCurrentCartParams,
    created: StorefrontCreatedCart,
  ): void {
    try {
      if (created.type === "created") storage.setItem(tokenKey(created.cart.id), created.recovery_token);
      storage.setItem(key, JSON.stringify({ version: 3, id: created.cart.id }));
    } catch {
      throw new CartError(
        "storage",
        "The cart was created but its selection could not be saved; retry with the same cart id",
      );
    }
    releaseSignIn(storage, userId, params);
  }

  async function create(params: StorefrontCreateCartParams, options?: RequestOptions): Promise<StorefrontCreatedCart> {
    requireId(params.id, "cart");
    refusePerCallMarket(options);
    const storage = requireStorage();
    const userId = requireUserId();
    const selected = { buyer: params.buyer, package_id: params.package_id };
    const key = selectionKey(userId, selected);
    return withCartMutation(checkoutScopes(), { type: "new_cart", slot: cartScopeKey(selected, context.market()) }, async () => {
      const marketId = await context.marketId();
      const created = await transport.create({ ...params, market_id: marketId }, options);
      if (!created || !created.cart || created.cart.id !== params.id) {
        throw new CartError("answer_mismatch", "Cart creation returned a different cart");
      }
      assertCart(created.cart, userId, selected);
      assertMarket(created.cart, marketId);
      keep(storage, key, userId, selected, created);
      return created;
    });
  }

  async function reorder(params: StorefrontReorderParams, options?: RequestOptions): Promise<StorefrontReorderedCart> {
    requireId(params.id, "cart");
    refusePerCallMarket(options);
    const storage = requireStorage();
    const userId = requireUserId();
    const selected = { buyer: params.buyer, package_id: params.package_id };
    const key = selectionKey(userId, selected);
    return withCartMutation(checkoutScopes(), { type: "new_cart", slot: cartScopeKey(selected, context.market()) }, async () => {
      const marketId = await context.marketId();
      const reordered = await transport.reorder({ ...params, market_id: marketId }, options);
      const created = reordered?.cart;
      if (!created || !created.cart || created.cart.id !== params.id) {
        throw new CartError("answer_mismatch", "The reorder returned a different cart");
      }
      assertCart(created.cart, userId, selected);
      assertMarket(created.cart, marketId);
      keep(storage, key, userId, selected, created);
      return reordered;
    });
  }

  function forget(params: StorefrontCurrentCartParams): void {
    const storage = context.storage;
    if (!storage) return;
    const userId = requireUserId();
    const key = selectionKey(userId, params);
    try {
      const selection = readSelection(storage.getItem(key));
      release(storage, key, selection ? [selection.id] : []);
    } catch {
      context.storageRefused();
    }
    releaseSignIn(storage, userId, params);
  }

  function signedIn(fromUserId: string | null, toUserId: string): void {
    const storage = context.storage;
    if (
      !storage ||
      !isCanonicalId(fromUserId) ||
      !isCanonicalId(toUserId) ||
      fromUserId === toUserId
    ) {
      return;
    }
    try {
      storage.setItem(signInKey(toUserId), JSON.stringify({ version: 1, from_user_id: fromUserId }));
    } catch {
      context.storageRefused();
    }
  }

  return { current, create, reorder, forget, token, signedIn, signedInFrom };
}
