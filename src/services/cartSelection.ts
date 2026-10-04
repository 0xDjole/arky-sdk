import type { RequestOptions } from "../types/api";
import type { CartSelectionContext, CartSelectionScope, CartSelectionTransport, SelectedCart } from "../types/cartSelection";
import { CartSelectionError } from "../types/cartSelection";
import type { StorefrontCart, StorefrontCurrentCartParams } from "../types/storefront";
import { pendingCartCheckout, withCartMutation } from "./cartCheckout";

function selectedCart(value: string | null): SelectedCart | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) &&
      "version" in parsed && parsed.version === 1 &&
      "id" in parsed && typeof parsed.id === "string" && parsed.id.length > 0 &&
      "market_id" in parsed && typeof parsed.market_id === "string" && parsed.market_id.length > 0 &&
      Object.keys(parsed).length === 3) return parsed as SelectedCart;
  } catch {}
  throw new CartSelectionError("The selected Cart reference is invalid; it has not been replaced");
}

function assertCompany(cart: StorefrontCart, params: StorefrontCurrentCartParams): void {
  if ((params.company?.company_id ?? null) !== (cart.company?.company_id ?? null) ||
    (params.company?.company_location_id ?? null) !== (cart.company?.company_location_id ?? null)) {
    throw new CartSelectionError("The selected Cart has a different Company context; update that Cart explicitly");
  }
}

async function selectionScope(context: CartSelectionContext, params: StorefrontCurrentCartParams, transport: CartSelectionTransport, options?: RequestOptions): Promise<CartSelectionScope> {
  const customerId = context.customerId();
  const market = context.market();
  if (!market) throw new CartSelectionError("Select a Market before selecting or creating a Cart");
  if (!customerId || !context.storage) {
    throw new CartSelectionError("Selecting a Cart requires a Customer session and working session storage");
  }
  const assertContext = () => {
    if (context.customerId() !== customerId || context.market() !== market) {
      throw new CartSelectionError("The Customer or Market changed while loading the Cart; reload the current context");
    }
  };
  const selectedMarket = await transport.market(market, options);
  assertContext();
  if (!selectedMarket.id || selectedMarket.key !== market)
    throw new CartSelectionError("The Market read did not confirm the selected key");
  return {
    key: `arky:selected-cart:v1:${context.namespace}:${encodeURIComponent(customerId)}:${encodeURIComponent(market)}:${encodeURIComponent(params.company?.company_id ?? "")}:${encodeURIComponent(params.company?.company_location_id ?? "")}`,
    assertContext,
    assertCart(cart, selected) {
      assertContext();
      if (!cart || typeof cart.id !== "string" || !cart.id.length ||
        cart.customer_id !== customerId || cart.market_id !== selectedMarket.id ||
        !cart.status || !["active", "abandoned", "converted", "merged", "superseded", "expired"].includes(cart.status.type) ||
        (selected && (cart.id !== selected.id || cart.market_id !== selected.market_id))) {
        throw new CartSelectionError("The response does not match the selected Cart and Customer context");
      }
      assertCompany(cart, params);
    },
  };
}

export function createCartSelection(
  context: CartSelectionContext,
  checkoutScope: string,
  transport: CartSelectionTransport,
) {
  const loading = new Map<string, Promise<StorefrontCart>>();
  const unpersisted = new Map<string, SelectedCart>();

  function persist(key: string, selection: SelectedCart): void {
    unpersisted.set(key, selection);
    try {
      context.storage!.setItem(key, JSON.stringify(selection));
      if (context.storage!.getItem(key) !== JSON.stringify(selection)) throw new Error();
    } catch {
      throw new CartSelectionError("The Cart was created but its selection could not be saved; retry on this page without creating another Cart");
    }
    unpersisted.delete(key);
  }

  async function createSelected(scope: CartSelectionScope, params: StorefrontCurrentCartParams, options?: RequestOptions) {
    scope.assertContext();
    const created = await transport.create(params, options);
    scope.assertCart(created?.cart);
    if (created.cart.status.type !== "active" || typeof created.recovery_token !== "string" || !created.recovery_token.length) {
      throw new CartSelectionError("Cart creation did not return a valid creation receipt");
    }
    assertCompany(created.cart, params);
    persist(scope.key, { version: 1, id: created.cart.id, market_id: created.cart.market_id });
    return created;
  }

  function track(key: string, pending: Promise<StorefrontCart>): void {
    loading.set(key, pending);
    void pending.finally(() => {
      if (loading.get(key) === pending) loading.delete(key);
    }).catch(() => {});
  }

  async function current(
    params: StorefrontCurrentCartParams = {},
    options?: RequestOptions,
  ): Promise<StorefrontCart> {
    params = { ...params, ...(params.company ? { company: { ...params.company } } : {}) };
    const scope = await selectionScope(context, params, transport, options);
    const { key, assertContext, assertCart } = scope;
    let pending = loading.get(key);
    if (!pending) {
      pending = (async () => {
        const checkout = await pendingCartCheckout(checkoutScope);
        assertContext();
        if (checkout) {
          const cart = await transport.get(checkout.id, options);
          assertCart(cart);
          if (cart.id !== checkout.id) throw new CartSelectionError("The pending Checkout returned a different Cart");
          return cart;
        }
        return withCartMutation(checkoutScope, async () => {
          assertContext();
          const retained = unpersisted.get(key);
          if (retained) persist(key, retained);
          let selection: SelectedCart | null;
          try {
            selection = selectedCart(context.storage!.getItem(key));
          } catch (error) {
            if (error instanceof CartSelectionError) throw error;
            throw new CartSelectionError("The selected Cart could not be read; no replacement was created");
          }
          if (selection) {
            const cart = await transport.get(selection.id, options);
            assertCart(cart, selection);
            if (!["converted", "merged", "superseded", "expired"].includes(cart.status.type)) return cart;
          }
          return (await createSelected(scope, params, options)).cart;
        });
      })();
      track(key, pending);
    }
    const cart = await pending;
    assertCart(cart);
    assertCompany(cart, params);
    return cart;
  }

  async function create(params: StorefrontCurrentCartParams = {}, options?: RequestOptions) {
    params = { ...params, ...(params.company ? { company: { ...params.company } } : {}) };
    const scope = await selectionScope(context, params, transport, options);
    if (loading.has(scope.key) || unpersisted.has(scope.key)) {
      throw new CartSelectionError("Finish loading or saving the selected Cart before explicitly creating another");
    }
    const pending = withCartMutation(checkoutScope, () => createSelected(scope, params, options));
    track(scope.key, pending.then((created) => created.cart));
    return pending;
  }

  return { current, create };
}
