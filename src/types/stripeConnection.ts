import type { ProviderEffectError, ProviderOperationClaim } from "./index";
import type { CommerceProviderObservation } from "./payment";
import type { EpochMilliseconds } from "./time";

export type StripeConnectionEffectStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; claim: ProviderOperationClaim }
  | {
      type: "succeeded";
      connected_account_id: string;
      observation: CommerceProviderObservation;
      completed_at: EpochMilliseconds;
    }
  | { type: "rejected" | "failed"; error: ProviderEffectError; completed_at: EpochMilliseconds }
  | { type: "unknown"; claim: ProviderOperationClaim | null; error: ProviderEffectError; retry_at: EpochMilliseconds };

export interface StripeConnectionOperation {
  id: string;
  store_id: string;
  payment_provider_id: string;
  requested_connected_account_id: string | null;
  email: string | null;
  country: string | null;
  account_creation_status: StripeConnectionEffectStatus;
  metadata_binding_status: StripeConnectionEffectStatus | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}
