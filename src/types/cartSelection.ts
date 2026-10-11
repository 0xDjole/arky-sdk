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

export class CartSelectionError extends Error {
  readonly name = "CartSelectionError";
}
