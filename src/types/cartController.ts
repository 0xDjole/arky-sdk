import type {
  AddCartBookingParams,
  AddCartAudienceParams,
  AddCartDigitalProductParams,
  AddCartProductParams,
  CheckoutCartParams,
  ClearCartParams,
  GetCartParams,
  GetCurrentCartParams,
  QuoteCartParams,
  RemoveCartItemParams,
  RequestOptions,
  UpdateCartParams,
} from "./api";
import type { OrderCheckoutResult } from "./index";
import type { Cart } from "./cart";
import type { OrderQuote } from "./quote";

export interface CartApi {
  current(
    params?: GetCurrentCartParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  get(params: GetCartParams, options?: RequestOptions): Promise<Cart>;
  update(params: UpdateCartParams, options?: RequestOptions): Promise<Cart>;
  addProduct(
    params: AddCartProductParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  addBooking(
    params: AddCartBookingParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  addDigital(
    params: AddCartDigitalProductParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  addAudience(params: AddCartAudienceParams, options?: RequestOptions): Promise<Cart>;
  removeItem(
    params: RemoveCartItemParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  clear(params: ClearCartParams, options?: RequestOptions): Promise<Cart>;
  quote(params: QuoteCartParams, options?: RequestOptions): Promise<OrderQuote>;
  checkout(
    params: CheckoutCartParams,
    options?: RequestOptions,
  ): Promise<OrderCheckoutResult>;
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
export type CartControllerUpdateParams = Omit<UpdateCartParams, "id"> & {
  id?: string;
};
export type CartControllerAddProductParams = Omit<
  AddCartProductParams,
  "id"
> & {
  id?: string;
};
export type CartControllerAddBookingParams = Omit<
  AddCartBookingParams,
  "id"
> & {
  id?: string;
};
export type CartControllerAddDigitalParams = Omit<
  AddCartDigitalProductParams,
  "id"
> & {
  id?: string;
};
export type CartControllerAddAudienceParams = Omit<AddCartAudienceParams, "id"> & { id?: string };
export type CartControllerRemoveItemParams =
  RemoveCartItemParams extends infer Params
    ? Params extends { id: string }
      ? Omit<Params, "id"> & { id?: string }
      : never
    : never;
export type CartControllerClearParams = Omit<ClearCartParams, "id"> & {
  id?: string;
};
export type CartControllerQuoteParams = Omit<QuoteCartParams, "id"> & {
  id?: string;
};
export type CartControllerCheckoutParams = Omit<CheckoutCartParams, "id"> & {
  id?: string;
};

export interface CartController {
  subscribe(listener: CartControllerListener): () => void;
  getState(): CartControllerState;
  init(
    params?: CartControllerInitParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  refresh(
    params?: CartControllerRefreshParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  addProduct(
    params: CartControllerAddProductParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  addBooking(
    params: CartControllerAddBookingParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  addDigital(
    params: CartControllerAddDigitalParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  update(
    params: CartControllerUpdateParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  addAudience(params: CartControllerAddAudienceParams, options?: RequestOptions): Promise<Cart>;
  removeItem(
    params: CartControllerRemoveItemParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  clear(
    params?: CartControllerClearParams,
    options?: RequestOptions,
  ): Promise<Cart>;
  quote(
    params?: CartControllerQuoteParams,
    options?: RequestOptions,
  ): Promise<OrderQuote>;
  checkout(
    params: CartControllerCheckoutParams,
    options?: RequestOptions,
  ): Promise<OrderCheckoutResult>;
}
