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
  PaginatedResponse,
  Product,
  ProductVariant,
  BookingResource,
  BookingService,
  BookingOffering,
  Zone,
} from "./index";
import type { StorefrontPrice } from "./commerce";
import type {
  AddCartBookingParams,
  AddCartDigitalProductParams,
  AddCartProductParams,
  CartBookingInput,
  CartDigitalItemInput,
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
export type StorefrontCurrentCartParams = Pick<GetCurrentCartParams, "company_id" | "company_location_id">;
export type StorefrontUpdateCartParams = Omit<StorefrontParams<UpdateCartParams>, "product_items" | "booking_items" | "digital_items"> & {
  product_items?: CartProductInput[];
  booking_items?: CartBookingInput[];
  digital_items?: CartDigitalItemInput[];
};
export type StorefrontAddCartProductParams = Omit<StorefrontParams<AddCartProductParams>, "product"> & {
  product: CartProductInput;
};
export type StorefrontAddCartBookingParams = Omit<StorefrontParams<AddCartBookingParams>, "booking"> & {
  booking: CartBookingInput;
};
export type StorefrontAddCartDigitalParams = Omit<StorefrontParams<AddCartDigitalProductParams>, "digital"> & {
  digital: CartDigitalItemInput;
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
export type StorefrontProduct = Pick<Product,
  "id" | "key" | "slugs" | "blocks" | "classifications"
> & { variants: StorefrontProductVariant[] };
export type StorefrontProductVariant = ProductVariant & {
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
};
export type StorefrontBookingResource = StorefrontDto<BookingResource>;
export type StorefrontBookingService = StorefrontDto<BookingService>;
export type StorefrontBookingOffering = StorefrontDto<BookingOffering> & {
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
};
export type StorefrontPage<T> = StorefrontDto<PaginatedResponse<T>>;
export type StorefrontZone = Zone;
export type StorefrontMarket = Omit<
  Market,
  "store_id" | "created_at" | "updated_at" | "zones"
> & {
  zones: StorefrontZone[];
};
