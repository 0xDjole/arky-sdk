import type {
  Cart,
  CollectionEntry,
  Customer,
  FormPresentation,
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
  CartSubscriptionPlanInput,
  CartDigitalInput,
  CartProductInput,
  GetCurrentCartParams,
  UpdateCartParams,
} from "./api";

export type StorefrontParams<T> = T extends unknown
  ? Omit<T, "store_id" | "market" | "customer_id" | "customer_session_id">
  : never;

export type StorefrontCart = Cart;
export type StorefrontCurrentCartParams = Pick<GetCurrentCartParams, "company">;
export type CartPublicLineItemInput =
  | ({ type: "product" } & CartProductInput)
  | ({ type: "booking" } & CartBookingInput)
  | ({ type: "digital_product" } & CartDigitalInput)
  | ({ type: "subscription_plan" } & Omit<CartSubscriptionPlanInput, "price_override">);
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
export type StorefrontCollectionEntry = CollectionEntry;
export interface StorefrontCustomer {
  id: string;
  status: Customer["status"];
  primary_email_identity_id: string | null;
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  categories: Customer["categories"];
  created_at: Customer["created_at"];
  updated_at: Customer["updated_at"];
}
export type StorefrontForm = FormPresentation;
export type StorefrontFormSubmission = FormSubmission;
export interface StorefrontLocation {
  id: string;
  key: string;
  address: StoreLocation["address"];
  is_pickup_location: boolean;
}
export type StorefrontOrderCheckoutResult = OrderCheckoutResult;
export type StorefrontOrderQuote = OrderQuote;
export type StorefrontCheckoutQuote = CheckoutQuote;
export type StorefrontProduct = Pick<Product,
  "id" | "key" | "slugs" | "blocks" | "categories"
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
export interface StorefrontProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  attributes: ProductVariant["attributes"];
  reference_labels: ProductVariant["reference_labels"];
  fulfillment: ProductVariant["fulfillment"];
  tax_category_id: string | null;
  status: ProductVariant["status"];
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
}
export type StorefrontBookingResource = BookingResource;
export type StorefrontBookingService = BookingService & {
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
};
export type StorefrontBookingOffering = BookingOffering & {
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
};
export type StorefrontPage<T> = PaginatedResponse<T>;
export interface StorefrontMarket {
  id: string;
  key: string;
  currency: Market["currency"];
  tax_mode: Market["tax_mode"];
  payment_option_ids: string[];
}
