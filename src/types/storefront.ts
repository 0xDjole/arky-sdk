import type {
  Cart,
  CollectionEntry,
  Contact,
  Form,
  FormSubmission,
  StoreLocation,
  Market,
  OrderCheckoutResult,
  OrderQuote,
  PaginatedResponse,
  Product,
  ProductVariant,
  Provider,
  Service,
  ServiceProvider,
  Zone,
} from "./index";

export type StorefrontParams<T> = T extends unknown
  ? Omit<T, "store_id" | "market">
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
export type StorefrontDto<T> = T extends readonly (infer Item)[]
  ? StorefrontDto<Item>[]
  : T extends object
    ? {
        [
          Key in keyof T as Key extends "store_id" ? never : Key
        ]: Key extends StorefrontOpaqueKey ? T[Key] : StorefrontDto<T[Key]>;
      }
    : T;

export type StorefrontCart = StorefrontDto<Cart>;
export type StorefrontCollectionEntry = StorefrontDto<CollectionEntry>;
export interface StorefrontContact extends StorefrontDto<Contact> {
  email?: string | null;
  verified: boolean;
}
export type StorefrontForm = StorefrontDto<Form>;
export type StorefrontFormSubmission = StorefrontDto<FormSubmission>;
export type StorefrontLocation = Omit<
  StorefrontDto<StoreLocation>,
  "created_at" | "updated_at"
>;
export type StorefrontOrderCheckoutResult = StorefrontDto<OrderCheckoutResult>;
export type StorefrontOrderQuote = StorefrontDto<OrderQuote>;
export type StorefrontProduct = StorefrontDto<Product>;
export type StorefrontProductVariant = StorefrontDto<ProductVariant>;
export type StorefrontProvider = StorefrontDto<Provider>;
export type StorefrontService = StorefrontDto<Service>;
export type StorefrontServiceProvider = StorefrontDto<ServiceProvider>;
export type StorefrontPage<T> = StorefrontDto<PaginatedResponse<T>>;
export type StorefrontZone = Zone;
export type StorefrontMarket = Omit<
  Market,
  "store_id" | "created_at" | "updated_at" | "zones"
> & {
  zones: StorefrontZone[];
};
