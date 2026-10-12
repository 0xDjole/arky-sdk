import type { EpochMilliseconds } from "./time";
import type { RequestOptions } from "./httpClient";
import type {
  Cart,
  CartQuote,
  CheckoutAcceptance,
  StorefrontAddCartBookingParams,
  StorefrontAddCartProductParams,
  StorefrontAddCartCustomerGroupParams,
  StorefrontCheckoutCartParams,
  StorefrontClearCartParams,
  StorefrontCurrentCartParams,
  StorefrontGetCartParams,
  StorefrontQuoteCartParams,
  StorefrontRemoveCartItemParams,
  StorefrontSelectCartShippingMethodParams,
  StorefrontUpdateCartParams,
} from "./cart";

export interface CartApi {
  current(params?: StorefrontCurrentCartParams, options?: RequestOptions): Promise<Cart | null>;
  get(params: StorefrontGetCartParams, options?: RequestOptions): Promise<Cart>;
  update(params: StorefrontUpdateCartParams, options?: RequestOptions): Promise<Cart>;
  addProduct(params: StorefrontAddCartProductParams, options?: RequestOptions): Promise<Cart>;
  addBooking(params: StorefrontAddCartBookingParams, options?: RequestOptions): Promise<Cart>;
  addCustomerGroup(params: StorefrontAddCartCustomerGroupParams, options?: RequestOptions): Promise<Cart>;
  removeItem(params: StorefrontRemoveCartItemParams, options?: RequestOptions): Promise<Cart>;
  clear(params: StorefrontClearCartParams, options?: RequestOptions): Promise<Cart>;
  selectShippingMethod(params: StorefrontSelectCartShippingMethodParams, options?: RequestOptions): Promise<Cart>;
  quote(params: StorefrontQuoteCartParams, options?: RequestOptions): Promise<CartQuote>;
  checkout(params: StorefrontCheckoutCartParams, options?: RequestOptions): Promise<CheckoutAcceptance>;
}

export interface CartControllerState {
  cart: Cart | null;
  quote: CartQuote | null;
  checkoutResult: CheckoutAcceptance | null;
  loading: boolean;
  initialized: boolean;
  error: unknown;
}

export type CartControllerListener = (state: CartControllerState) => void;

type CartVersioned<T> = Omit<T, "id" | "expected_updated_at"> & {
  id?: string;
  expected_updated_at?: EpochMilliseconds;
};

export type CartControllerInitParams = StorefrontCurrentCartParams | StorefrontGetCartParams;
export type CartControllerRefreshParams = StorefrontCurrentCartParams | StorefrontGetCartParams;
export type CartControllerUpdateParams = CartVersioned<StorefrontUpdateCartParams>;
export type CartControllerAddProductParams = CartVersioned<StorefrontAddCartProductParams>;
export type CartControllerAddBookingParams = CartVersioned<StorefrontAddCartBookingParams>;
export type CartControllerAddCustomerGroupParams = CartVersioned<StorefrontAddCartCustomerGroupParams>;
export type CartControllerRemoveItemParams = CartVersioned<StorefrontRemoveCartItemParams>;
export type CartControllerClearParams = CartVersioned<StorefrontClearCartParams>;
export type CartControllerSelectShippingMethodParams = CartVersioned<StorefrontSelectCartShippingMethodParams>;
export type CartControllerQuoteParams = Omit<StorefrontQuoteCartParams, "id"> & { id?: string };
export type CartControllerCheckoutParams = Omit<StorefrontCheckoutCartParams, "cart_id" | "expected_updated_at"> & {
  cart_id?: string;
  expected_updated_at?: EpochMilliseconds;
};

export interface CartController {
  subscribe(listener: CartControllerListener): () => void;
  getState(): CartControllerState;
  init(params: CartControllerInitParams, options?: RequestOptions): Promise<Cart | null>;
  refresh(params: CartControllerRefreshParams, options?: RequestOptions): Promise<Cart | null>;
  update(params: CartControllerUpdateParams, options?: RequestOptions): Promise<Cart>;
  addProduct(params: CartControllerAddProductParams, options?: RequestOptions): Promise<Cart>;
  addBooking(params: CartControllerAddBookingParams, options?: RequestOptions): Promise<Cart>;
  addCustomerGroup(params: CartControllerAddCustomerGroupParams, options?: RequestOptions): Promise<Cart>;
  removeItem(params: CartControllerRemoveItemParams, options?: RequestOptions): Promise<Cart>;
  clear(params: CartControllerClearParams, options?: RequestOptions): Promise<Cart>;
  selectShippingMethod(params: CartControllerSelectShippingMethodParams, options?: RequestOptions): Promise<Cart>;
  quote(params: CartControllerQuoteParams, options?: RequestOptions): Promise<CartQuote>;
  checkout(params: CartControllerCheckoutParams, options?: RequestOptions): Promise<CheckoutAcceptance>;
}
