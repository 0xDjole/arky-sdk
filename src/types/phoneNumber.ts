import type { EpochMilliseconds } from "./time";
import type { ProviderEffectError, ProviderLogin } from "./common";

export type PhoneNumberSetup =
  | { type: "waiting" }
  | { type: "ready"; phone_number_sid: string; at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError };

export interface PhoneNumber {
  id: string;
  tenant_id: string;
  login: ProviderLogin;
  number: string;
  setup: PhoneNumberSetup;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindPhoneNumbersParams {
  tenant_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetPhoneNumberParams {
  tenant_id: string;
  id: string;
}

export interface CreatePhoneNumberParams {
  tenant_id: string;
  id: string;
  login: ProviderLogin;
  number: string;
}

export interface SetUpPhoneNumberParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface DeletePhoneNumberParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
