export type SellableRef =
  | { type: "product_variant"; product_id: string; variant_id: string }
  | { type: "digital_product"; digital_product_id: string }
  | { type: "booking_offering"; booking_offering_id: string }
  | { type: "customer_group_plan"; customer_group_plan_id: string };
