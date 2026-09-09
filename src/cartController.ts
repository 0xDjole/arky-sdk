import type { GetCartParams } from "./types/api";
import type { Cart } from "./types/cart";
import type { CartApi, CartController, CartControllerInitParams, CartControllerListener, CartControllerState } from "./types/cartController";
export type * from "./types/cartController";

function hasCartId(params: CartControllerInitParams): params is GetCartParams {
  return (
    "id" in params && typeof params.id === "string" && params.id.length > 0
  );
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

  function currentCartId(id?: string): string {
    const cartId = id || state.cart?.id;
    if (!cartId) {
      throw new Error(
        "Cart has not been initialized and no cart id was provided",
      );
    }
    return cartId;
  }

  async function runCartMutation(
    operation: () => Promise<Cart>,
  ): Promise<Cart> {
    setState({ loading: true, error: null });
    try {
      const cart = await operation();
      setState({
        cart,
        quote: null,
        checkoutResult: null,
        loading: false,
        initialized: true,
        error: null,
      });
      return cart;
    } catch (error) {
      setState({ loading: false, error });
      throw error;
    }
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

    init(params = {}, options) {
      if (state.initialized && state.cart) {
        return Promise.resolve(state.cart);
      }
      return this.refresh(params, options);
    },

    refresh(params = {}, options) {
      return runCartMutation(() =>
        hasCartId(params)
          ? cartApi.get(params, options)
          : cartApi.current(params, options),
      );
    },

    addProduct(params, options) {
      return runCartMutation(() =>
        cartApi.addProduct(
          { ...params, id: currentCartId(params.id) },
          options,
        ),
      );
    },

    addBooking(params, options) {
      return runCartMutation(() =>
        cartApi.addBooking(
          { ...params, id: currentCartId(params.id) },
          options,
        ),
      );
    },

    addDigital(params, options) {
      return runCartMutation(() =>
        cartApi.addDigital(
          { ...params, id: currentCartId(params.id) },
          options,
        ),
      );
    },

    addAudience(params, options) {
      return runCartMutation(() =>
        cartApi.addAudience({ ...params, id: currentCartId(params.id) }, options),
      );
    },

    update(params, options) {
      return runCartMutation(() =>
        cartApi.update({ ...params, id: currentCartId(params.id) }, options),
      );
    },

    removeItem(params, options) {
      return runCartMutation(() =>
        cartApi.removeItem(
          { ...params, id: currentCartId(params.id) },
          options,
        ),
      );
    },

    clear(params = {}, options) {
      return runCartMutation(() =>
        cartApi.clear({ ...params, id: currentCartId(params.id) }, options),
      );
    },

    async quote(params = {}, options) {
      setState({ loading: true, error: null });
      try {
        const quote = await cartApi.quote(
          { ...params, id: currentCartId(params.id) },
          options,
        );
        setState({ quote, loading: false, error: null });
        return quote;
      } catch (error) {
        setState({ loading: false, error });
        throw error;
      }
    },

    async checkout(params, options) {
      setState({ loading: true, error: null });
      try {
        const checkoutResult = await cartApi.checkout(
          { ...params, id: currentCartId(params.id) },
          options,
        );
        setState({ checkoutResult, loading: false, error: null });
        return checkoutResult;
      } catch (error) {
        setState({ loading: false, error });
        throw error;
      }
    },
  };
}
