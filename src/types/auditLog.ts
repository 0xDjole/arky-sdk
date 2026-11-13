import type { EpochMilliseconds } from "./time";
import type { Actor } from "./common";

export type AuditSubjectType =
  | "store"
  | "promotion_code"
  | "promotion"
  | "inventory_item"
  | "product"
  | "product_variant"
  | "inventory_level"
  | "inventory_unit"
  | "inventory_movement"
  | "booking_offering"
  | "package"
  | "package_item"
  | "package_access"
  | "company_location"
  | "company_membership"
  | "package_offering"
  | "package_member"
  | "company"
  | "package_item_price"
  | "store_membership"
  | "store_role"
  | "conversation"
  | "conversation_message"
  | "collection"
  | "entry"
  | "media"
  | "form_submission"
  | "category"
  | "customer_action"
  | "customer"
  | "digital_asset"
  | "cart"
  | "order"
  | "order_product_line_item"
  | "order_booking_line_item"
  | "payment"
  | "fulfillment"
  | "return"
  | "rental"
  | "fulfillment_job"
  | "booking_resource"
  | "booking_service"
  | "broadcast"
  | "payment_option"
  | "store_location"
  | "market"
  | "webhook"
  | "store_provider"
  | "template"
  | "notification"
  | "suppression"
  | "phone_number"
  | "email_address"
  | "email_layout"
  | "support_flow"
  | "form"
  | "sales_channel"
  | "zone"
  | "tax_category"
  | "shipping_profile"
  | "shipping_method"
  | "fulfillment_routing"
  | "company_role"
  | "order_credit"
  | "invoice"
  | "payment_method"
  | "experiment"
  | "experiment_assignment"
  | "customer_session"
  | "customer_login"
  | "incoming_webhook"
  | "store_subscription"
  | "account"
  | "account_session"
  | "support_access";

export type AuditEntryOwner =
  | { type: "store" }
  | { type: "company"; company_id: string }
  | { type: "customer"; customer_id: string };

export type AuditAction =
  | { action: "promotion_code_created"; promotion_code_id: string }
  | { action: "promotion_code_updated"; promotion_code_id: string }
  | { action: "promotion_code_deleted"; promotion_code_id: string }
  | { action: "promotion_created"; promotion_id: string }
  | { action: "promotion_updated"; promotion_id: string }
  | { action: "promotion_deleted"; promotion_id: string }
  | { action: "inventory_item_created"; inventory_item_id: string }
  | { action: "inventory_item_updated"; inventory_item_id: string }
  | { action: "inventory_item_deleted"; inventory_item_id: string }
  | { action: "product_variant_created"; product_id: string; product_variant_id: string }
  | { action: "product_variant_updated"; product_id: string; product_variant_id: string }
  | { action: "product_variant_deleted"; product_id: string; product_variant_id: string }
  | { action: "inventory_level_created"; inventory_level_id: string }
  | { action: "inventory_level_updated"; inventory_level_id: string }
  | { action: "inventory_level_deleted"; inventory_level_id: string }
  | { action: "inventory_unit_created"; inventory_unit_id: string }
  | { action: "inventory_unit_updated"; inventory_unit_id: string }
  | { action: "inventory_movement_created"; inventory_movement_id: string }
  | { action: "booking_offering_created"; booking_offering_id: string }
  | { action: "booking_offering_updated"; booking_offering_id: string }
  | { action: "booking_offering_deleted"; booking_offering_id: string }
  | { action: "package_created"; package_id: string }
  | { action: "package_updated"; package_id: string }
  | { action: "package_deleted"; package_id: string }
  | { action: "package_item_created"; package_item_id: string }
  | { action: "package_item_updated"; package_item_id: string }
  | { action: "package_item_deleted"; package_item_id: string }
  | { action: "package_access_created"; package_access_id: string }
  | { action: "package_access_deleted"; package_access_id: string }
  | { action: "company_location_created"; company_location_id: string }
  | { action: "company_location_updated"; company_location_id: string }
  | { action: "company_location_deleted"; company_location_id: string }
  | { action: "company_membership_created"; company_membership_id: string }
  | { action: "company_membership_updated"; company_membership_id: string }
  | { action: "company_membership_deleted"; company_membership_id: string }
  | { action: "package_offering_created"; package_offering_id: string }
  | { action: "package_offering_updated"; package_offering_id: string }
  | { action: "package_offering_deleted"; package_offering_id: string }
  | { action: "package_member_activated"; package_member_id: string }
  | { action: "package_member_updated"; package_member_id: string }
  | { action: "package_member_paused"; package_member_id: string }
  | { action: "package_member_resumed"; package_member_id: string }
  | { action: "package_member_cancelled"; package_member_id: string }
  | { action: "package_member_cancellation_accepted"; package_member_id: string }
  | { action: "package_member_switched"; package_member_id: string }
  | { action: "package_member_renewal_skipped"; package_member_id: string }
  | { action: "package_member_payment_method_changed"; package_member_id: string }
  | { action: "company_created"; company_id: string }
  | { action: "company_updated"; company_id: string }
  | { action: "company_deleted"; company_id: string }
  | { action: "package_item_price_created"; package_item_id: string; price_id: string }
  | { action: "package_item_price_updated"; package_item_id: string; price_id: string }
  | { action: "package_item_price_deleted"; package_item_id: string; price_id: string }
  | { action: "store_membership_created"; store_membership_id: string }
  | { action: "store_membership_updated"; store_membership_id: string }
  | { action: "store_membership_deleted"; store_membership_id: string }
  | { action: "store_role_created"; store_role_id: string }
  | { action: "store_role_updated"; store_role_id: string }
  | { action: "store_role_deleted"; store_role_id: string }
  | { action: "conversation_created"; conversation_id: string; customer_id: string }
  | { action: "conversation_updated"; conversation_id: string; customer_id: string }
  | { action: "conversation_message_created"; conversation_id: string; conversation_message_id: string; customer_id: string }
  | { action: "conversation_message_updated"; conversation_id: string; conversation_message_id: string; customer_id: string }
  | { action: "conversation_message_list_read"; conversation_id: string; customer_id: string }
  | { action: "conversation_message_file_read"; conversation_id: string; conversation_message_id: string; customer_id: string; sha256: string }
  | { action: "call_read"; conversation_id: string; conversation_message_id: string; customer_id: string }
  | { action: "call_recording_read"; conversation_id: string; conversation_message_id: string; customer_id: string }
  | { action: "collection_created"; collection_id: string }
  | { action: "collection_updated"; collection_id: string }
  | { action: "collection_deleted"; collection_id: string }
  | { action: "entry_read"; collection_id: string; entry_id: string; owner: AuditEntryOwner }
  | { action: "entry_file_read"; collection_id: string; entry_id: string; media_id: string; owner: AuditEntryOwner }
  | { action: "entry_list_read"; collection_id: string }
  | { action: "entry_created"; collection_id: string; entry_id: string; owner: AuditEntryOwner }
  | { action: "entry_updated"; collection_id: string; entry_id: string; owner: AuditEntryOwner }
  | { action: "entry_deleted"; collection_id: string; entry_id: string; owner: AuditEntryOwner }
  | { action: "entry_printed"; collection_id: string; entry_id: string; owner: AuditEntryOwner }
  | { action: "form_submission_created"; form_submission_id: string; customer_id: string }
  | { action: "form_submission_stage_changed"; form_submission_id: string; customer_id: string }
  | { action: "form_submission_deleted"; form_submission_id: string; customer_id: string }
  | { action: "form_submission_read"; form_id: string; form_submission_id: string; customer_id: string }
  | { action: "form_submission_file_read"; form_submission_id: string; customer_id: string; sha256: string }
  | { action: "form_submission_list_read" }
  | { action: "category_created"; category_id: string }
  | { action: "category_updated"; category_id: string }
  | { action: "category_deleted"; category_id: string }
  | { action: "customer_action_created"; customer_action_id: string }
  | { action: "customer_created"; customer_id: string }
  | { action: "customer_read"; customer_id: string }
  | { action: "customer_list_read" }
  | { action: "customer_updated"; customer_id: string }
  | { action: "customer_deleted"; customer_id: string }
  | { action: "customer_merged"; customer_id: string; target_customer_id: string }
  | { action: "customer_exported"; customer_id: string }
  | { action: "digital_asset_created"; digital_asset_id: string }
  | { action: "digital_asset_updated"; digital_asset_id: string }
  | { action: "cart_created"; cart_id: string }
  | { action: "cart_updated"; cart_id: string }
  | { action: "cart_converted"; cart_id: string }
  | { action: "cart_offer_sent"; cart_id: string }
  | { action: "order_created"; order_id: string }
  | { action: "order_updated"; order_id: string }
  | { action: "order_confirmed"; order_id: string }
  | { action: "order_payment_received"; order_id: string }
  | { action: "order_refunded"; order_id: string }
  | { action: "order_cancelled"; order_id: string }
  | { action: "order_product_line_item_created"; order_id: string; order_product_line_item_id: string }
  | { action: "order_product_line_item_updated"; order_id: string; order_product_line_item_id: string }
  | { action: "order_product_line_item_confirmed"; order_id: string; order_product_line_item_id: string }
  | { action: "order_product_line_item_cancelled"; order_id: string; order_product_line_item_id: string }
  | { action: "order_booking_line_item_created"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_updated"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_confirmed"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_upcoming"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_attended"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_waiting"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_in_progress"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_no_show"; order_id: string; order_booking_line_item_id: string }
  | { action: "order_booking_line_item_cancelled"; order_id: string; order_booking_line_item_id: string }
  | { action: "payment_created"; payment_id: string }
  | { action: "payment_updated"; payment_id: string }
  | { action: "payment_paid"; payment_id: string }
  | { action: "payment_failed"; payment_id: string }
  | { action: "payment_hold_resolved"; payment_id: string }
  | { action: "fulfillment_created"; fulfillment_id: string }
  | { action: "fulfillment_ready"; fulfillment_id: string }
  | { action: "fulfillment_dispatched"; fulfillment_id: string }
  | { action: "fulfillment_collected"; fulfillment_id: string }
  | { action: "fulfillment_delivered"; fulfillment_id: string }
  | { action: "fulfillment_tracking_updated"; fulfillment_id: string }
  | { action: "fulfillment_cancelled"; fulfillment_id: string }
  | { action: "return_requested"; return_id: string }
  | { action: "return_opened"; return_id: string }
  | { action: "return_approved"; return_id: string }
  | { action: "return_destination_decided"; return_id: string }
  | { action: "return_declined"; return_id: string }
  | { action: "return_cancelled"; return_id: string }
  | { action: "return_received"; return_id: string }
  | { action: "return_disposed"; return_id: string }
  | { action: "return_missing"; return_id: string }
  | { action: "return_tracking_updated"; return_id: string }
  | { action: "return_closed"; return_id: string }
  | { action: "rental_created"; rental_id: string }
  | { action: "rental_updated"; rental_id: string }
  | { action: "fulfillment_job_created"; fulfillment_job_id: string }
  | { action: "fulfillment_job_opened"; fulfillment_job_id: string }
  | { action: "fulfillment_job_held"; fulfillment_job_id: string }
  | { action: "fulfillment_job_released"; fulfillment_job_id: string }
  | { action: "fulfillment_job_assigned"; fulfillment_job_id: string }
  | { action: "fulfillment_job_moved"; fulfillment_job_id: string }
  | { action: "fulfillment_job_completed"; fulfillment_job_id: string }
  | { action: "fulfillment_job_cancelled"; fulfillment_job_id: string }
  | { action: "product_created"; product_id: string }
  | { action: "product_updated"; product_id: string }
  | { action: "product_deleted"; product_id: string }
  | { action: "booking_resource_created"; booking_resource_id: string }
  | { action: "booking_resource_updated"; booking_resource_id: string }
  | { action: "booking_resource_deleted"; booking_resource_id: string }
  | { action: "booking_service_created"; booking_service_id: string }
  | { action: "booking_service_updated"; booking_service_id: string }
  | { action: "booking_service_deleted"; booking_service_id: string }
  | { action: "media_created"; media_id: string }
  | { action: "media_updated"; media_id: string }
  | { action: "media_deleted"; media_id: string }
  | { action: "broadcast_created"; broadcast_id: string }
  | { action: "broadcast_updated"; broadcast_id: string }
  | { action: "broadcast_deleted"; broadcast_id: string }
  | { action: "payment_option_created"; payment_option_id: string }
  | { action: "payment_option_updated"; payment_option_id: string }
  | { action: "store_created" }
  | { action: "store_updated" }
  | { action: "store_deleted" }
  | { action: "store_location_created"; store_location_id: string }
  | { action: "store_location_updated"; store_location_id: string }
  | { action: "store_location_deleted"; store_location_id: string }
  | { action: "market_created"; market_id: string }
  | { action: "market_updated"; market_id: string }
  | { action: "market_deleted"; market_id: string }
  | { action: "webhook_created"; webhook_id: string }
  | { action: "webhook_updated"; webhook_id: string }
  | { action: "webhook_deleted"; webhook_id: string }
  | { action: "store_provider_created"; store_provider_id: string }
  | { action: "store_provider_updated"; store_provider_id: string }
  | { action: "store_provider_deleted"; store_provider_id: string }
  | { action: "template_created"; template_id: string }
  | { action: "template_updated"; template_id: string }
  | { action: "template_deleted"; template_id: string }
  | { action: "notification_created"; notification_id: string }
  | { action: "notification_updated"; notification_id: string }
  | { action: "notification_deleted"; notification_id: string }
  | { action: "suppression_created"; suppression_id: string }
  | { action: "suppression_released"; suppression_id: string }
  | { action: "phone_number_created"; phone_number_id: string }
  | { action: "phone_number_updated"; phone_number_id: string }
  | { action: "phone_number_deleted"; phone_number_id: string }
  | { action: "email_address_created"; email_address_id: string }
  | { action: "email_address_deleted"; email_address_id: string }
  | { action: "email_layout_created"; email_layout_id: string }
  | { action: "email_layout_updated"; email_layout_id: string }
  | { action: "email_layout_deleted"; email_layout_id: string }
  | { action: "support_flow_created"; support_flow_id: string }
  | { action: "support_flow_updated"; support_flow_id: string }
  | { action: "support_flow_deleted"; support_flow_id: string }
  | { action: "form_created"; form_id: string }
  | { action: "form_updated"; form_id: string }
  | { action: "form_deleted"; form_id: string }
  | { action: "sales_channel_created"; sales_channel_id: string }
  | { action: "sales_channel_updated"; sales_channel_id: string }
  | { action: "sales_channel_deleted"; sales_channel_id: string }
  | { action: "zone_created"; zone_id: string }
  | { action: "zone_updated"; zone_id: string }
  | { action: "zone_deleted"; zone_id: string }
  | { action: "tax_category_created"; tax_category_id: string }
  | { action: "tax_category_updated"; tax_category_id: string }
  | { action: "tax_category_deleted"; tax_category_id: string }
  | { action: "shipping_profile_created"; shipping_profile_id: string }
  | { action: "shipping_profile_updated"; shipping_profile_id: string }
  | { action: "shipping_profile_deleted"; shipping_profile_id: string }
  | { action: "shipping_method_created"; shipping_method_id: string }
  | { action: "shipping_method_updated"; shipping_method_id: string }
  | { action: "shipping_method_deleted"; shipping_method_id: string }
  | { action: "fulfillment_routing_updated"; fulfillment_routing_id: string }
  | { action: "company_role_created"; company_role_id: string }
  | { action: "company_role_updated"; company_role_id: string }
  | { action: "company_role_deleted"; company_role_id: string }
  | { action: "order_credit_created"; order_id: string; order_credit_id: string }
  | { action: "order_credit_voided"; order_id: string; order_credit_id: string }
  | { action: "invoice_created"; order_id: string; invoice_id: string }
  | { action: "invoice_deleted"; order_id: string; invoice_id: string }
  | { action: "payment_method_created"; payment_method_id: string }
  | { action: "payment_method_updated"; payment_method_id: string }
  | { action: "payment_method_revoked"; payment_method_id: string }
  | { action: "experiment_created"; experiment_id: string }
  | { action: "experiment_updated"; experiment_id: string }
  | { action: "experiment_deleted"; experiment_id: string }
  | { action: "experiment_assignment_created"; experiment_id: string; experiment_assignment_id: string }
  | { action: "customer_login_created"; customer_id: string; customer_login_id: string }
  | { action: "customer_login_updated"; customer_id: string; customer_login_id: string }
  | { action: "customer_login_verified"; customer_id: string; customer_login_id: string }
  | { action: "customer_login_deleted"; customer_id: string; customer_login_id: string }
  | { action: "customer_session_created"; customer_id: string; customer_session_id: string }
  | { action: "customer_session_updated"; customer_id: string; customer_session_id: string }
  | { action: "incoming_webhook_retried"; incoming_webhook_id: string }
  | { action: "incoming_webhook_ignored"; incoming_webhook_id: string }
  | { action: "store_subscription_created"; store_subscription_id: string }
  | { action: "store_subscription_updated"; store_subscription_id: string }
  | { action: "account_session_revoked"; account_id: string; account_session_id: string }
  | { action: "support_access_created"; support_access_id: string }
  | { action: "support_access_ended"; support_access_id: string };

export type AuditResult = "allowed" | "refused";

export interface AuditLog {
  id: string;
  store_id: string;
  actor: Actor;
  action: AuditAction;
  result: AuditResult;
  ip: string | null;
  at: EpochMilliseconds;
}

interface FindAuditLogsPage {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export type FindAuditLogsParams =
  | (FindAuditLogsPage & { account_id?: never; subject_type?: never; subject_id?: never })
  | (FindAuditLogsPage & { account_id: string; subject_type?: never; subject_id?: never })
  | (FindAuditLogsPage & { subject_type: AuditSubjectType; subject_id: string; account_id?: never });
