import type { EpochMilliseconds } from "./types/time";
import type { Cart, StorefrontGetCartParams } from "./types/cart";
import type {
  CartApi,
  CartController,
  CartControllerInitParams,
  CartControllerListener,
  CartControllerState,
} from "./types/cartController";

function hasCartId(params: CartControllerInitParams): params is StorefrontGetCartParams {
  return "id" in params && typeof params.id === "string" && params.id.length > 0;
}

export function createCartController(cartApi: CartApi): CartController {
  const listeners = new Set<CartControllerListener>();
  let state: CartControllerState = {
    cart: null,
    quote: null,
    checkoutResult: null,
    loading: false,
    initialized: false,
    error: null,
  };

  function emit(): void {
    for (const listener of listeners) {
      Promise.resolve()
        .then(() => listener(state))
        .catch(() => {});
    }
  }

  function setState(patch: Partial<CartControllerState>): CartControllerState {
    state = { ...state, ...patch };
    emit();
    return state;
  }

  function cartId(id: string | undefined): string {
    const value = id || state.cart?.id;
    if (!value) throw new Error("Cart has not been initialized and no cart id was provided");
    return value;
  }

  function version(id: string, expected: EpochMilliseconds | undefined): EpochMilliseconds {
    const value = expected ?? (state.cart && state.cart.id === id ? state.cart.updated_at : undefined);
    if (value === undefined) {
      throw new Error("Cart changes need the updated_at of the cart they were made on");
    }
    return value;
  }

  function target(params: { id?: string; expected_updated_at?: EpochMilliseconds }): {
    id: string;
    expected_updated_at: EpochMilliseconds;
  } {
    const id = cartId(params.id);
    return { id, expected_updated_at: version(id, params.expected_updated_at) };
  }

  async function run<T>(operation: () => Promise<T>, apply: (value: T) => Partial<CartControllerState>): Promise<T> {
    setState({ loading: true, error: null });
    try {
      const value = await operation();
      setState({ ...apply(value), loading: false, error: null });
      return value;
    } catch (error) {
      setState({ loading: false, error });
      throw error;
    }
  }

  function mutate(operation: () => Promise<Cart>): Promise<Cart> {
    return run(operation, (cart) => ({ cart, quote: null, checkoutResult: null, initialized: true }));
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      Promise.resolve()
        .then(() => listener(state))
        .catch(() => {});
      return () => {
        listeners.delete(listener);
      };
    },

    getState() {
      return state;
    },

    init(params, options) {
      if (state.initialized) return Promise.resolve(state.cart);
      return this.refresh(params, options);
    },

    refresh(params, options) {
      return run<Cart | null>(
        () => (hasCartId(params) ? cartApi.get(params, options) : cartApi.current(params, options)),
        (cart) => ({ cart, quote: null, checkoutResult: null, initialized: true }),
      );
    },

    update(params, options) {
      return mutate(() => cartApi.update({ ...params, ...target(params) }, options));
    },

    addProduct(params, options) {
      return mutate(() => cartApi.addProduct({ ...params, ...target(params) }, options));
    },

    addBooking(params, options) {
      return mutate(() => cartApi.addBooking({ ...params, ...target(params) }, options));
    },

    addSubscriptionPlan(params, options) {
      return mutate(() => cartApi.addSubscriptionPlan({ ...params, ...target(params) }, options));
    },

    removeItem(params, options) {
      return mutate(() => cartApi.removeItem({ ...params, ...target(params) }, options));
    },

    clear(params, options) {
      return mutate(() => cartApi.clear({ ...params, ...target(params) }, options));
    },

    selectShippingMethod(params, options) {
      return mutate(() => cartApi.selectShippingMethod({ ...params, ...target(params) }, options));
    },

    quote(params, options) {
      return run(
        () => cartApi.quote({ ...params, id: cartId(params.id) }, options),
        (quote) => ({ quote }),
      );
    },

    checkout(params, options) {
      return run(
        () => {
          const id = cartId(params.cart_id);
          return cartApi.checkout(
            { ...params, cart_id: id, expected_updated_at: version(id, params.expected_updated_at) },
            options,
          );
        },
        (checkoutResult) => ({ checkoutResult }),
      );
    },
  };
}
