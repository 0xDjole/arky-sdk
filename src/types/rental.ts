import type { EpochMilliseconds } from "./time";
import type { AccountActor, PostalAddress, SortDirection } from "./common";
import type { RentalIssueReplacement } from "./fulfillment";
import type { ReturnStatus } from "./return";

export type RentalActor =
  | { type: "account"; actor: AccountActor }
  | { type: "system" };

export type RentalStatus =
  | { type: "active" }
  | {
      type: "ending";
      requested_at: EpochMilliseconds;
      actor: RentalActor;
      reason: string;
      return_due_at: EpochMilliseconds | null;
    }
  | { type: "closed"; closed_at: EpochMilliseconds };

export interface Rental {
  id: string;
  store_id: string;
  subscription_id: string;
  revision_id: string;
  entitlement_id: string;
  status: RentalStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface RentalTerms {
  product_id: string;
  variant_id: string;
  quantity: number;
  inventory_item_id: string;
  product_key: string;
  variant_sku: string | null;
}

export interface RentalDetail {
  rental: Rental;
  terms: RentalTerms;
}

export type RentalReplacementMethod =
  | { type: "delivery"; destination: PostalAddress }
  | { type: "pickup" };

export type RentalAction =
  | {
      type: "request_replacement";
      fulfillment_job_id: string;
      fulfillment_job_line_id: string;
      replacement: RentalIssueReplacement;
      store_location_id: string;
      method: RentalReplacementMethod;
    }
  | { type: "end"; reason: string; return_due_at: EpochMilliseconds | null }
  | { type: "close" }
  | { type: "cancel_issue"; fulfillment_job_id: string; fulfillment_job_line_id: string };

export interface GetRentalParams {
  store_id: string;
  id: string;
}

export interface FindRentalsParams {
  store_id: string;
  subscription_id?: string;
  status?: RentalStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface ActOnRentalParams extends GetRentalParams {
  expected_updated_at: EpochMilliseconds;
  action: RentalAction;
}

export type CustomerRentalStatus =
  | { type: "active" }
  | { type: "ending"; requested_at: EpochMilliseconds; return_due_at: EpochMilliseconds | null }
  | { type: "closed"; closed_at: EpochMilliseconds };

export type CustomerRentalUnitDelivery =
  | {
      type: "allocated";
      fulfillment_job_id: string;
      fulfillment_job_line_id: string;
      fulfillment_unit_index: number;
    }
  | {
      type: "sent";
      fulfillment_job_id: string;
      fulfillment_job_line_id: string;
      fulfillment_unit_index: number;
      fulfillment_id: string;
      sent_at: EpochMilliseconds;
    }
  | {
      type: "delivered";
      fulfillment_job_id: string;
      fulfillment_job_line_id: string;
      fulfillment_unit_index: number;
      fulfillment_id: string;
      sent_at: EpochMilliseconds;
      delivered_at: EpochMilliseconds;
    };

export type RentalReturnDisposition = "restocked" | "written_off";

export type RentalReturnState =
  | { type: "awaiting_receipt" }
  | { type: "awaiting_inspection"; received_at: EpochMilliseconds }
  | { type: "inspected"; inspected_at: EpochMilliseconds; disposition: RentalReturnDisposition }
  | { type: "missing"; recorded_at: EpochMilliseconds }
  | { type: "cancelled" }
  | { type: "declined" };

export interface CustomerRentalUnitReturn {
  return_id: string;
  status: ReturnStatus;
  state: RentalReturnState;
}

export interface CustomerRentalUnit {
  inventory_unit_id: string;
  asset_tag: string;
  manufacturer_serial: string | null;
  deliveries: CustomerRentalUnitDelivery[];
  returns: CustomerRentalUnitReturn[];
}

export interface CustomerRental {
  id: string;
  subscription_id: string;
  product_key: string;
  variant_sku: string | null;
  quantity: number;
  status: CustomerRentalStatus;
  units: CustomerRentalUnit[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindCustomerRentalsParams {
  subscription_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetCustomerRentalParams {
  rental_id: string;
}
