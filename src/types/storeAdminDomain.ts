import type { EpochMilliseconds } from './time';

export interface AdminDomainDnsChallenge {
  token: string;
  requested_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}
export interface AdminDomainOwnershipProof {
  challenge: AdminDomainDnsChallenge;
  verified_at: EpochMilliseconds;
}
export type AdminDomainVerification =
  | { type: 'pending'; challenge: AdminDomainDnsChallenge }
  | { type: 'verified'; proof: AdminDomainOwnershipProof };
export type StoreAdminDomainStatus =
  | { type: 'waiting_for_dns'; challenge: AdminDomainDnsChallenge }
  | { type: 'ownership_verified'; proof: AdminDomainOwnershipProof }
  | { type: 'disabled'; verification: AdminDomainVerification };
export interface StoreAdminDomain {
  id: string;
  store_id: string;
  hostname: string;
  status: StoreAdminDomainStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}
export interface AdminDomainOperation {
  id: string;
  type: 'register' | 'remove';
  status: { type: 'requested' | 'processing' | 'succeeded' | 'failed' | 'unknown' };
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}
export type AdminDomainReadiness =
  | { type: 'not_requested' | 'pending' | 'unavailable' | 'unknown' | 'disabled' }
  | { type: 'connected'; observed_at: EpochMilliseconds }
  | {
      type: 'provisioning';
      status: 'initializing' | 'pending' | 'active' | 'deactivated' | 'blocked' | 'error';
      certificate_validation_status: 'initializing' | 'pending' | 'active' | 'deactivated' | 'error';
      hostname_verification_status: 'pending' | 'active' | 'deactivated' | 'blocked' | 'error';
      observed_at: EpochMilliseconds;
    };
export interface StoreAdminDomainConnection {
  domain: StoreAdminDomain;
  dns_target: string | null;
  registration: AdminDomainOperation | null;
  removal: AdminDomainOperation | null;
  readiness: AdminDomainReadiness;
}
export interface GetStoreAdminDomainParams { store_id?: string; id: string }
export interface FindStoreAdminDomainsParams { store_id?: string; limit?: number; cursor?: string }
export interface CreateStoreAdminDomainParams extends GetStoreAdminDomainParams { hostname: string }
export interface ChangeStoreAdminDomainParams extends GetStoreAdminDomainParams { expected_updated_at: EpochMilliseconds }
export interface RequestAdminDomainHostingParams extends GetStoreAdminDomainParams { operation_id: string }
export interface RetryAdminDomainHostingParams extends RequestAdminDomainHostingParams { failed_operation_id: string }
