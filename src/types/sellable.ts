export type SellableRef =
  | { type: "product_variant"; product_id: string; variant_id: string }
  | { type: "digital_product"; digital_product_id: string }
  | { type: "booking_offering"; booking_offering_id: string }
  | { type: "audience_access"; audience_id: string };
