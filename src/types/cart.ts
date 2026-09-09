import type { Address, TimeRange } from "./index";
import type { PurchaseOrigin } from "./commerce";
import type { ManualPrice } from "./price";
import type { EpochMilliseconds } from "./time";

export type CartStatus =
  | { type: "active" }
  | { type: "abandoned" }
  | { type: "converted" }
  | { type: "expired" };

export interface Cart {
  id: string;
  store_id: string;
  customer_id: string | null;
  company_id: string | null;
  company_location_id: string | null;
  market_id: string;
  sales_channel_id: string;
  token: string;
  status: CartStatus;
  origin: PurchaseOrigin;
  product_items: CartProductItem[];
  booking_items: CartBookingItem[];
  digital_items: CartDigitalItem[];
  audience_items: CartAudienceItem[];
  shipping_address: Address | null;
  billing_address: Address | null;
  promo_code: string | null;
  payment_provider_id: string | null;
  shipping_method_id: string | null;
  converted_order_id: string | null;
  item_count: number;
  last_action_at: EpochMilliseconds;
  abandoned_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CartProductItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  form_submission_id: string | null;
  price_override: ManualPrice | null;
}

export interface CartBookingItem {
  id: string;
  booking_offering_id: string;
  requested_interval: TimeRange;
  form_submission_id: string | null;
  price_override: ManualPrice | null;
}

export interface CartDigitalItem {
  id: string;
  digital_product_id: string;
  name_block_id: string;
  form_submission_id: string | null;
  price_override: ManualPrice | null;
}

export interface CartAudienceItem {
  id: string;
  audience_id: string;
  membership_id: string;
}
