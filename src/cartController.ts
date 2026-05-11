import type {
  AddCartItemParams,
  CheckoutCartParams,
  ClearCartParams,
  GetCartParams,
  GetCurrentCartParams,
  QuoteCartParams,
  RemoveCartItemParams,
  RequestOptions,
  UpdateCartParams,
} from "./types/api";
import type { Cart, OrderCheckoutResult, OrderQuote } from "./types";

export interface CartApi {
  current(params?: GetCurrentCartParams, options?: RequestOptions): Promise<Cart>;
  get(params: GetCartParams, options?: RequestOptions): Promise<Cart>;
  update(params: UpdateCartParams, options?: RequestOptions): Promise<Cart>;
  addItem(params: AddCartItemParams, options?: RequestOptions): Promise<Cart>;
  removeItem(params: RemoveCartItemParams, options?: RequestOptions): Promise<Cart>;
  clear(params: ClearCartParams, options?: RequestOptions): Promise<Cart>;
  quote(params: QuoteCartParams, options?: RequestOptions): Promise<OrderQuote>;
  checkout(params: CheckoutCartParams, options?: RequestOptions): Promise<OrderCheckoutResult>;
}

export interface CartControllerState {
  cart: Cart | null;
  quote: OrderQuote | null;
  checkoutResult: OrderCheckoutResult | null;
  loading: boolean;
  initialized: boolean;
  error: unknown;
}

export type CartControllerListener = (state: CartControllerState) => void;

export type CartControllerInitParams = GetCurrentCartParams | GetCartParams;
export type CartControllerRefreshParams = GetCurrentCartParams | GetCartParams;
export type CartControllerUpdateParams = Omit<UpdateCartParams, "id"> & { id?: string };
export type CartControllerAddItemParams = Omit<AddCartItemParams, "id"> & { id?: string };
export type CartControllerRemoveItemParams = Omit<RemoveCartItemParams, "id"> & { id?: string };
export type CartControllerClearParams = Omit<ClearCartParams, "id"> & { id?: string };
export type CartControllerQuoteParams = Omit<QuoteCartParams, "id"> & { id?: string };
export type CartControllerCheckoutParams = Omit<CheckoutCartParams, "id"> & { id?: string };

export interface CartController {
  subscribe(listener: CartControllerListener): () => void;
  getState(): CartControllerState;
  init(params?: CartControllerInitParams, options?: RequestOptions): Promise<Cart>;
  refresh(params?: CartControllerRefreshParams, options?: RequestOptions): Promise<Cart>;
  addItem(params: CartControllerAddItemParams, options?: RequestOptions): Promise<Cart>;
  update(params: CartControllerUpdateParams, options?: RequestOptions): Promise<Cart>;
  removeItem(params: CartControllerRemoveItemParams, options?: RequestOptions): Promise<Cart>;
  clear(params?: CartControllerClearParams, options?: RequestOptions): Promise<Cart>;
  quote(params?: CartControllerQuoteParams, options?: RequestOptions): Promise<OrderQuote>;
  checkout(params?: CartControllerCheckoutParams, options?: RequestOptions): Promise<OrderCheckoutResult>;
}

function hasCartId(params: CartControllerInitParams): params is GetCartParams {
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

  function currentCartId(id?: string): string {
    const cartId = id || state.cart?.id;
    if (!cartId) {
      throw new Error("Cart has not been initialized and no cart id was provided");
    }
    return cartId;
  }

  async function runCartMutation(operation: () => Promise<Cart>): Promise<Cart> {
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

    addItem(params, options) {
      return runCartMutation(() =>
        cartApi.addItem({ ...params, id: currentCartId(params.id) }, options),
      );
    },

    update(params, options) {
      return runCartMutation(() =>
        cartApi.update({ ...params, id: currentCartId(params.id) }, options),
      );
    },

    removeItem(params, options) {
      return runCartMutation(() =>
        cartApi.removeItem({ ...params, id: currentCartId(params.id) }, options),
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

    async checkout(params = {}, options) {
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
