export type AccountCredentialType = "session" | "api_token";

export interface AccountActorSnapshot {
  email: string;
  credential_type: AccountCredentialType;
}

export interface AccountActor {
  account_id: string | null;
  snapshot: AccountActorSnapshot;
}
