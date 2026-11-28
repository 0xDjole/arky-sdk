import type { Duration, EpochMilliseconds } from "./time";

export type ExperimentStatus =
  | { type: "draft" }
  | { type: "running"; started_at: EpochMilliseconds }
  | { type: "paused"; started_at: EpochMilliseconds; paused_at: EpochMilliseconds }
  | { type: "completed"; started_at: EpochMilliseconds; completed_at: EpochMilliseconds };

export interface Experiment {
  id: string;
  tenant_id: string;
  key: string;
  status: ExperimentStatus;
  goal_action_key: string;
  attribution_window: Duration;
  variants: Record<string, number>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ExperimentVariantResult {
  variant_key: string;
  allocation_bps: number;
  eligible_assignments: number;
  converted_assignments: number;
  observed_conversion_rate: number | null;
  excluded_conflicting_users: number;
  open_windows: number;
  highest_observed: boolean;
}

export interface ExperimentResults {
  experiment: Experiment;
  variants: ExperimentVariantResult[];
  freshness_at: EpochMilliseconds;
}

export type ExperimentUseResponse =
  | { type: "assigned"; experiment_id: string; experiment_key: string; variant_key: string }
  | { type: "inactive" };

export interface CreateExperimentParams {
  tenant_id: string;
  id: string;
  key: string;
  goal_action_key: string;
  attribution_window: Duration;
  variants: Record<string, number>;
}

export interface UpdateExperimentParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  goal_action_key: string;
  attribution_window: Duration;
  variants: Record<string, number>;
}

export interface ExperimentActionParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface DeleteExperimentParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetExperimentParams {
  tenant_id: string;
  id: string;
}

export interface FindExperimentsParams {
  tenant_id: string;
  status?: ExperimentStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface UseExperimentParams {
  key: string;
}
