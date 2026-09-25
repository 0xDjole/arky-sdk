import type { AppliedPriceSnapshot, DisplayTextSnapshot } from "./commerce";
import type { BackorderPolicy, Block } from "./index";
import type {
  InventoryCustoms,
  InventoryPhysical,
  InventoryTracking,
} from "./inventoryItem";

export type OrderLinePrice =
  | { type: "direct"; price: AppliedPriceSnapshot }
  | { type: "subscription_allocation" };

export interface OrderInventoryRequirementSnapshot {
  inventory_item_id: string | null;
  inventory_item_key: string;
  quantity: number;
  physical: InventoryPhysical;
  customs: InventoryCustoms;
  source_inventory_item_id: string;
  tracking: InventoryTracking;
  sku: string | null;
  barcode: string | null;
}

export type OrderProductFulfillmentSnapshot =
  | { type: "none" }
  | {
      type: "physical";
      shipping_profile_id: string | null;
      shipping_profile_key: string;
      source_shipping_profile_id: string;
      inventory_requirements: OrderInventoryRequirementSnapshot[];
      backorder: BackorderPolicy;
    };

export interface OrderProductSnapshot {
  product_key: string;
  variant_sku: string | null;
  variant_attributes: Block[];
  price: OrderLinePrice;
  fulfillment: OrderProductFulfillmentSnapshot;
  source_product_id: string;
  source_variant_id: string;
}

export interface OrderBookingSnapshot {
  service_key: string;
  resource_key: string;
  timezone: string;
  price: AppliedPriceSnapshot;
  source_offering_id: string;
  source_service_id: string;
  source_resource_id: string;
}

export interface AcceptedAsset {
  source_asset_id: string;
  object_key: string;
  version_id: string;
  content_digest: string;
  file_name: string;
  mime_type: string;
}

export type OrderDigitalContent =
  | { type: "accepted_assets"; assets: AcceptedAsset[] }
  | { type: "current_bundle" };

export interface OrderDigitalSnapshot {
  product_key: string;
  price: OrderLinePrice;
  source_digital_product_id: string;
  content: OrderDigitalContent;
}
