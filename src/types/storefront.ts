import type {
  Cart,
  CollectionEntry,
  Customer,
  Form,
  FormSubmission,
  StoreLocation,
  Market,
  OrderCheckoutResult,
  OrderQuote,
  CheckoutQuote,
  PaginatedResponse,
  Product,
  ProductVariant,
  EntryBlockQuery,
  BookingResource,
  BookingService,
  BookingOffering,
} from "./index";
import type { StorefrontPrice } from "./commerce";
import type { CatalogReadOptions } from "./catalog";
import type {
  AddCartBookingParams,
  AddCartDigitalProductParams,
  AddCartProductParams,
  CartBookingInput,
  CartCustomerGroupPlanInput,
  CartDigitalInput,
  CartProductInput,
  GetCurrentCartParams,
  UpdateCartParams,
} from "./api";

export type StorefrontParams<T> = T extends unknown
  ? Omit<T, "store_id" | "market" | "customer_id" | "customer_session_id">
  : never;

type StorefrontOpaqueKey =
  | "attributes"
  | "blocks"
  | "context"
  | "data"
  | "fields"
  | "metadata"
  | "payload"
  | "properties"
  | "schema"
  | "value";

/** Storefront wire shape after routing ownership fields are removed. */
export type StorefrontDto<T> = T extends number
  ? T
  : T extends readonly (infer Item)[]
    ? StorefrontDto<Item>[]
    : T extends object
      ? {
          [
            Key in keyof T as Key extends "store_id" ? never : Key
          ]: Key extends StorefrontOpaqueKey ? T[Key] : StorefrontDto<T[Key]>;
        }
      : T;

export type StorefrontCart = StorefrontDto<Cart>;
export type StorefrontCurrentCartParams = Pick<GetCurrentCartParams, "company">;
export type CartPublicLineItemInput =
  | ({ type: "product" } & CartProductInput)
  | ({ type: "booking" } & CartBookingInput)
  | ({ type: "digital_product" } & CartDigitalInput)
  | ({ type: "customer_group_plan" } & Omit<CartCustomerGroupPlanInput, "price_override">);
export type StorefrontUpdateCartParams = Omit<StorefrontParams<UpdateCartParams>, "line_items"> & {
  line_items?: CartPublicLineItemInput[];
};
export type StorefrontAddCartProductParams = Omit<StorefrontParams<AddCartProductParams>, "product"> & {
  product: CartProductInput;
};
export type StorefrontAddCartBookingParams = Omit<StorefrontParams<AddCartBookingParams>, "booking"> & {
  booking: CartBookingInput;
};
export type StorefrontAddCartDigitalParams = Omit<StorefrontParams<AddCartDigitalProductParams>, "digital"> & {
  digital: CartDigitalInput;
};
export type StorefrontCollectionEntry = StorefrontDto<CollectionEntry>;
export type StorefrontCustomer = StorefrontDto<Customer>;
export type StorefrontForm = StorefrontDto<Form>;
export type StorefrontFormSubmission = StorefrontDto<FormSubmission>;
export type StorefrontLocation = Omit<
  StorefrontDto<StoreLocation>,
  "created_at" | "updated_at"
>;
export type StorefrontOrderCheckoutResult = StorefrontDto<OrderCheckoutResult>;
export type StorefrontOrderQuote = StorefrontDto<OrderQuote>;
export type StorefrontCheckoutQuote = StorefrontDto<CheckoutQuote>;
export type StorefrontProduct = Pick<Product,
  "id" | "key" | "name_block_id" | "slugs" | "blocks" | "classifications"
> & { price: StorefrontPrice | null; purchase_allowed: boolean };
export interface GetStorefrontProductVariantParams extends CatalogReadOptions {
  product_id: string;
  id: string;
}
export interface FindStorefrontProductVariantsParams extends CatalogReadOptions {
  product_id: string;
  filters?: EntryBlockQuery[];
  limit?: number;
  cursor?: string;
}
export type StorefrontProductVariant = Omit<
  ProductVariant,
  "store_id" | "created_at" | "updated_at"
> & {
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
};
export type StorefrontBookingResource = StorefrontDto<BookingResource>;
export type StorefrontBookingService = StorefrontDto<BookingService> & {
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
};
export type StorefrontBookingOffering = StorefrontDto<BookingOffering> & {
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
};
export type StorefrontPage<T> = StorefrontDto<PaginatedResponse<T>>;
export type StorefrontMarket = Omit<
  Market,
  "store_id" | "status" | "created_at" | "updated_at"
>;
