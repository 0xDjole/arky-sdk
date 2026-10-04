import type { EpochMilliseconds } from "./time";
import type { PurchaseRequirementUnit } from "./purchaseRequirement";

export type MinimumProgressUnavailableReason =
  | "no_requirement"
  | "incomplete_source_evidence"
  | "conversion_mismatch"
  | "incomplete_return_evidence"
  | "mixed_timezone_period"
  | "mixed_measurement_unit"
  | "mixed_agreements"
  | "arithmetic_overflow"
  | "history_limit";

export type MinimumProgressMonthState =
  | {
      type: "available";
      unit: PurchaseRequirementUnit;
      delivered_quantity: number;
      returned_quantity: number;
      current_quantity: number;
      minimum_quantity: number;
      remaining_quantity: number;
      attention: boolean;
      grace: boolean;
      paused: boolean;
      inactive: boolean;
    }
  | { type: "unavailable"; reason: MinimumProgressUnavailableReason };

export interface MinimumProgressMonth {
  year: number;
  month: number;
  timezone: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds;
  subscription_id: string | null;
  progress: MinimumProgressMonthState;
}

export interface BranchMinimumProgress {
  company_id: string;
  company_location_id: string;
  state:
    | { type: "available"; current: MinimumProgressMonth; history: MinimumProgressMonth[] }
    | { type: "unavailable"; reason: MinimumProgressUnavailableReason };
}

export interface GetBranchMinimumProgressParams {
  store_id: string;
  company_id: string;
  company_location_id: string;
}

export type GetStorefrontBranchMinimumProgressParams = Omit<GetBranchMinimumProgressParams, "store_id">;
