import type { EpochMilliseconds } from "./time";
import type { AccountActor, PostalAddress, SortDirection } from "./common";
import type { RentalIssueReplacement } from "./fulfillment";
import type { ProductReference } from "./product";
import type { ReturnStatus } from "./return";

export type RentalEndCause =
  | { type: "package_changed" }
  | { type: "purchase_cancelled" }
  | { type: "member_ended" };

export type RentalStatus =
  | { type: "waiting" }
  | { type: "active" }
  | {
      type: "ending_by_account";
      requested_at: EpochMilliseconds;
      actor: AccountActor;
      reason: string;
      return_due_at: EpochMilliseconds | null;
    }
  | { type: "ending_by_system"; requested_at: EpochMilliseconds; cause: RentalEndCause }
  | {
      type: "closed_after_account_ending";
      requested_at: EpochMilliseconds;
      actor: AccountActor;
      reason: string;
      return_due_at: EpochMilliseconds | null;
      closed_at: EpochMilliseconds;
    }
  | { type: "closed_after_system_ending"; requested_at: EpochMilliseconds; cause: RentalEndCause; closed_at: EpochMilliseconds }
  | { type: "withdrawn"; withdrawn_at: EpochMilliseconds };

export interface Rental {
  id: string;
  tenant_id: string;
  package_member_id: string;
  package_member_revision_id: string;
  package_item_id: string;
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
  product: ProductReference | null;
  units: UserRentalUnit[];
}

export type RentalListItem = Rental & { product: ProductReference | null; variant_sku: string | null; quantity: number; units: UserRentalUnit[] };

export type RentalReplacementMethod =
  | { type: "delivery"; destination: PostalAddress }
  | { type: "pickup" };

export type RentalCommand =
  | {
      type: "request_replacement";
      fulfillment_job_id: string;
      fulfillment_job_line_id: string;
      replacement: RentalIssueReplacement;
      tenant_location_id: string;
      method: RentalReplacementMethod;
    }
  | { type: "end"; reason: string; return_due_at: EpochMilliseconds | null }
  | { type: "close" }
  | { type: "resume" }
  | { type: "cancel_issue"; fulfillment_job_id: string; fulfillment_job_line_id: string };

export interface GetRentalParams {
  tenant_id: string;
  id: string;
}

export interface FindRentalsBySearchParams {
  tenant_id: string;
  ids?: never;
  package_member_ids?: string[];
  company_id?: string;
  company_location_id?: string;
  status?: "waiting" | "active" | "ending" | "closed" | "withdrawn";
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface FindRentalsByIdsParams {
  tenant_id: string;
  ids: string[];
  package_member_ids?: never;
  company_id?: never;
  company_location_id?: never;
  status?: never;
  sort_field?: never;
  sort_direction?: never;
  limit?: never;
  cursor?: never;
}

export type FindRentalsParams = FindRentalsBySearchParams | FindRentalsByIdsParams;

export interface ActOnRentalParams extends GetRentalParams {
  expected_updated_at: EpochMilliseconds;
  command: RentalCommand;
}

export type UserRentalStatus =
  | { type: "waiting" }
  | { type: "active" }
  | { type: "ending"; requested_at: EpochMilliseconds; return_due_at: EpochMilliseconds | null }
  | { type: "closed"; closed_at: EpochMilliseconds }
  | { type: "withdrawn"; withdrawn_at: EpochMilliseconds };

export type UserRentalUnitDelivery =
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
  | { type: "missing" }
  | { type: "cancelled" }
  | { type: "declined" };

export interface UserRentalUnitReturn {
  return_id: string;
  status: ReturnStatus;
  state: RentalReturnState;
}

export interface UserRentalUnit {
  inventory_unit_id: string;
  asset_tag: string;
  manufacturer_serial: string | null;
  deliveries: UserRentalUnitDelivery[];
  returns: UserRentalUnitReturn[];
}

export interface UserRental {
  id: string;
  package_member_id: string;
  product_key: string;
  product: ProductReference | null;
  variant_sku: string | null;
  quantity: number;
  status: UserRentalStatus;
  units: UserRentalUnit[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

interface FindUserRentalsPage {
  limit?: number;
  cursor?: string | null;
}

export type FindUserRentalsParams = FindUserRentalsPage &
  (
    | { package_member_ids: string[]; company_id?: string; company_location_id?: string }
    | { package_member_ids?: string[]; company_id: string; company_location_id?: string }
    | { package_member_ids?: string[]; company_id?: string; company_location_id: string }
  );

export interface GetUserRentalParams {
  id: string;
}
