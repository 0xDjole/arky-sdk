import type { EpochMilliseconds } from "./time";

export type FiscalDeviceStatus = "active" | "held_after_restore" | "archived";

export type OfsEnvironment = "sandbox" | "production";

export interface CroatiaCisDevice {
  provider_id: string;
  premises_mark: string;
  device_mark: string;
}

export interface ArkyCroatiaCisDevice {
  provider_id: string;
  premises_mark: string;
  device_mark: string;
}

export interface OfsCloudDevice {
  provider_id: string;
  serial_number: string;
  uid: string;
}

export interface ArkyOfsCloudDevice {
  provider_id: string;
  serial_number: string;
  uid: string;
}

export interface OfsBoxDevice {
  uid: string;
  environment: OfsEnvironment;
}

export interface ArkyOfsBoxDevice {
  uid: string;
}

export interface FbihTringPrinterDevice {
  ibfm: string;
}

export interface ArkyFbihTringPrinterDevice {
  ibfm: string;
}

export type FiscalDeviceType =
  | ({ type: "croatia_cis" } & CroatiaCisDevice)
  | ({ type: "arky_croatia_cis" } & ArkyCroatiaCisDevice)
  | ({ type: "ofs_cloud" } & OfsCloudDevice)
  | ({ type: "arky_ofs_cloud" } & ArkyOfsCloudDevice)
  | ({ type: "ofs_box" } & OfsBoxDevice)
  | ({ type: "arky_ofs_box" } & ArkyOfsBoxDevice)
  | ({ type: "fbih_tring_printer" } & FbihTringPrinterDevice)
  | ({ type: "arky_fbih_tring_printer" } & ArkyFbihTringPrinterDevice)
  | { type: "manual" };

export type FiscalDeviceTypeName = FiscalDeviceType["type"];

export type FiscalDeviceNotReadyReason =
  | "archived"
  | "held_after_restore"
  | "not_online_capable"
  | "provider_missing"
  | "provider_disabled"
  | "certificate_expired"
  | "certificate_unreadable"
  | "counter_held"
  | "no_ready_desk_agent";

export type FiscalDeviceReadiness =
  | { type: "ready" }
  | { type: "not_ready"; reason: FiscalDeviceNotReadyReason };

export interface FiscalDevice {
  id: string;
  store_id: string;
  store_location_id: string;
  key: string;
  type: FiscalDeviceType;
  status: FiscalDeviceStatus;
  ready: boolean;
  readiness: FiscalDeviceReadiness;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CreateFiscalDeviceType =
  | { type: "croatia_cis"; provider_id: string; premises_mark: string; device_mark: string }
  | { type: "arky_croatia_cis"; provider_id: string; premises_mark: string; device_mark: string }
  | { type: "ofs_cloud"; provider_id: string; serial_number: string }
  | { type: "arky_ofs_cloud"; provider_id: string; serial_number: string }
  | { type: "ofs_box"; uid: string; environment: OfsEnvironment }
  | { type: "arky_ofs_box"; uid: string }
  | { type: "fbih_tring_printer"; ibfm: string }
  | { type: "arky_fbih_tring_printer"; ibfm: string }
  | { type: "manual" };

export interface FindFiscalDevicesParams {
  store_id: string;
  store_location_id?: string;
  type?: FiscalDeviceTypeName;
  status?: FiscalDeviceStatus;
  limit?: number;
  cursor?: string | null;
}

export interface GetFiscalDeviceParams {
  store_id: string;
  id: string;
}

export interface CreateFiscalDeviceParams {
  store_id: string;
  id: string;
  store_location_id: string;
  key: string;
  type: CreateFiscalDeviceType;
}

export interface RenameFiscalDeviceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
}

export interface ArchiveFiscalDeviceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ReleaseFiscalDeviceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type FiscalDeviceTokenReadiness = { type: "ready" } | { type: "not_ready" };

export interface FiscalDeviceToken {
  id: string;
  fiscal_device_id: string;
  name: string;
  token_hint: string;
  readiness: FiscalDeviceTokenReadiness;
  last_seen_at: EpochMilliseconds;
  active: boolean;
  created_at: EpochMilliseconds;
}

export type FiscalDeviceTokenSecret = { type: "created"; value: string } | { type: "existing" };

export interface IssuedFiscalDeviceToken {
  token: FiscalDeviceToken;
  secret: FiscalDeviceTokenSecret;
}

export interface CreateFiscalDeviceTokenParams {
  store_id: string;
  fiscal_device_id: string;
  id: string;
  name: string;
}

export interface FindFiscalDeviceTokensParams {
  store_id: string;
  fiscal_device_id: string;
}

export interface RevokeFiscalDeviceTokenParams {
  store_id: string;
  fiscal_device_id: string;
  id: string;
}

export type FiscalDeviceHeartbeatReadiness = "ready" | "not_ready";

export interface FiscalDeviceHeartbeatParams {
  readiness: FiscalDeviceHeartbeatReadiness;
}

export interface FiscalDeviceAgentDevice {
  device: FiscalDevice;
  seller_tax_id: string;
}

export interface FiscalDeviceDueReceipt {
  id: string;
  created_at: EpochMilliseconds;
}

export interface FiscalDeviceHeartbeat {
  ready: boolean;
  readiness: FiscalDeviceReadiness;
  due: FiscalDeviceDueReceipt[];
}
