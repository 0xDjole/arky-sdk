import type { RequestOptions } from "./api";
import type { CreatedCart } from "./cart";
import type { StorefrontCart, StorefrontCurrentCartParams, StorefrontDto } from "./storefront";

export interface CartSelectionContext {
  namespace: string;
  storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  } | null;
  customerId(): string | null;
  market(): string;
}

export interface SelectedCart {
  version: 1;
  id: string;
  market_id: string;
}

export interface CartSelectionScope {
  key: string;
  assertContext(): void;
  assertCart(cart: StorefrontCart, selected?: SelectedCart): void;
}

export interface CartSelectionTransport {
  get(id: string, options?: RequestOptions): Promise<StorefrontCart>;
  create(params: StorefrontCurrentCartParams, options?: RequestOptions): Promise<StorefrontDto<CreatedCart>>;
}

export class CartSelectionError extends Error {
  readonly name = "CartSelectionError";
}
