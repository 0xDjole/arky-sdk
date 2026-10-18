import { ArkyError } from "./apiError";
import type { RequestOptions } from "./httpClient";
import type {
  Cart,
  CreatedCart,
  ReorderedCart,
  StorefrontCreateCartParams,
  StorefrontGetCartParams,
  StorefrontReorderParams,
} from "./cart";

export interface CartSelectionContext {
  namespace: string;
  storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  } | null;
  customerId(): string | null;
  market(): string | null;
}

export interface SelectedCart {
  version: 3;
  id: string;
}

export interface CartSelectionTransport {
  get(params: StorefrontGetCartParams, options?: RequestOptions): Promise<Cart>;
  create(params: StorefrontCreateCartParams, options?: RequestOptions): Promise<CreatedCart>;
  reorder(params: StorefrontReorderParams, options?: RequestOptions): Promise<ReorderedCart>;
}

export type CartErrorCode =
  | "context_changed"
  | "other_cart"
  | "no_cart"
  | "not_ready"
  | "answer_mismatch"
  | "busy"
  | "storage"
  | "no_session";

const cartErrorBrand = Symbol.for("arky.commerce.CartError");

export class CartError extends ArkyError {
  readonly name: string = "CartError";
  readonly [cartErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && cartErrorBrand in value;
  }

  constructor(
    readonly code: CartErrorCode,
    message: string,
  ) {
    super(code, message);
  }
}
