import type { Address, TimeRange } from "./index";
import type { PurchaseOrigin } from "./commerce";
import type { ManualPrice } from "./price";
import type {
  CartDeliveryGroup,
  CartCustomerGroupDelivery,
  CustomerGroupMemberType,
  CustomerGroupPlanStart,
} from "./api";
import type { EpochMilliseconds } from "./time";

export type CartStatus =
  | { type: "active" }
  | { type: "abandoned" }
  | { type: "checking_out"; checkout_id: string }
  | { type: "converted"; checkout_id: string }
  | { type: "merged"; target_cart_id: string; command_id: string }
  | { type: "expired" };

export interface CartCompanyContext {
  company_id: string;
  company_location_id: string | null;
}

export type CartLineItem =
  | { type: "product"; } & CartProductItem
  | { type: "booking"; } & CartBookingItem
  | { type: "digital_product"; } & CartDigitalItem
  | { type: "customer_group_plan"; } & CartCustomerGroupPlanItem;

export interface Cart {
  id: string;
  store_id: string;
  customer_id: string;
  company: CartCompanyContext | null;
  sales_channel_id: string;
  status: CartStatus;
  origin: PurchaseOrigin;
  market_id: string;
  line_items: CartLineItem[];
  delivery_groups: CartDeliveryGroup[];
  billing_address: Address | null;
  promotion_code_ids: string[];
  purchase_order_number: string | null;
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
  capacity_units: number;
  form_submission_id: string | null;
  price_override: ManualPrice | null;
}

export interface CartDigitalItem {
  id: string;
  digital_product_id: string;
  beneficiary_customer_id: string;
  form_submission_id: string | null;
  price_override: ManualPrice | null;
}

export interface CartCustomerGroupPlanItem {
  id: string;
  customer_group_plan_id: string;
  member: CustomerGroupMemberType;
  start: CustomerGroupPlanStart;
  deliveries: CartCustomerGroupDelivery[];
  price_override: ManualPrice | null;
}

export function cartProductItems(cart: Pick<Cart, "line_items"> | null): CartProductItem[] {
  return (cart?.line_items ?? [])
    .filter((item): item is CartLineItem & { type: "product" } => item.type === "product")
    .map(({ type: _type, ...item }) => item);
}

export function cartBookingItems(cart: Pick<Cart, "line_items"> | null): CartBookingItem[] {
  return (cart?.line_items ?? [])
    .filter((item): item is CartLineItem & { type: "booking" } => item.type === "booking")
    .map(({ type: _type, ...item }) => item);
}

export function cartDigitalItems(cart: Pick<Cart, "line_items"> | null): CartDigitalItem[] {
  return (cart?.line_items ?? [])
    .filter(
      (item): item is CartLineItem & { type: "digital_product" } =>
        item.type === "digital_product",
    )
    .map(({ type: _type, ...item }) => item);
}

export function cartCustomerGroupPlanItems(
  cart: Pick<Cart, "line_items"> | null,
): CartCustomerGroupPlanItem[] {
  return (cart?.line_items ?? [])
    .filter(
      (item): item is CartLineItem & { type: "customer_group_plan" } =>
        item.type === "customer_group_plan",
    )
    .map(({ type: _type, ...item }) => item);
}
