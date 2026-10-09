import type { CalendarDate, EpochMilliseconds } from "./time";

export interface PaginatedResponse<T> {
  items: T[];
  cursor: string | null;
}

export interface DeletedResponse {
  deleted: boolean;
}

export type SortDirection = "asc" | "desc";

export type LocalizedText = Record<string, string>;

export type LocalizedMarkdown = Record<string, string>;

export interface SelectOption {
  key: string;
  label: LocalizedText;
}

export interface PostalAddress {
  name: string | null;
  company: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
}

export type PostalAddressInput = Partial<PostalAddress>;

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface TimeRange {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export interface CalendarDateRange {
  from: CalendarDate;
  to: CalendarDate;
}

export interface UnitSpan {
  first_unit: number;
  quantity: number;
}

export interface TaxRate {
  numerator: number;
  denominator: number;
}

export type TaxMode = "exclusive" | "inclusive";

export const CURRENCY_MINOR_UNITS = {
  usd: 2, aed: 2, afn: 2, all: 2, amd: 2, ang: 2,
  aoa: 2, ars: 2, aud: 2, awg: 2, azn: 2, bam: 2,
  bbd: 2, bdt: 2, bhd: 3, bif: 0, bmd: 2, bnd: 2,
  bob: 2, brl: 2, bsd: 2, bwp: 2, byn: 2, bzd: 2,
  cad: 2, cdf: 2, chf: 2, clp: 0, cny: 2, cop: 2,
  crc: 2, cve: 2, czk: 2, djf: 0, dkk: 2, dop: 2,
  dzd: 2, egp: 2, etb: 2, eur: 2, fjd: 2, fkp: 2,
  gbp: 2, gel: 2, gip: 2, gmd: 2, gnf: 0, gtq: 2,
  gyd: 2, hkd: 2, hnl: 2, htg: 2, huf: 2, idr: 2,
  ils: 2, inr: 2, isk: 0, jmd: 2, jod: 3, jpy: 0,
  kes: 2, kgs: 2, khr: 2, kmf: 0, krw: 0, kwd: 3,
  kyd: 2, kzt: 2, lak: 2, lbp: 2, lkr: 2, lrd: 2,
  lsl: 2, mad: 2, mdl: 2, mga: 0, mkd: 2, mmk: 2,
  mnt: 2, mop: 2, mur: 2, mvr: 2, mwk: 2, mxn: 2,
  myr: 2, mzn: 2, nad: 2, ngn: 2, nio: 2, nok: 2,
  npr: 2, nzd: 2, omr: 3, pab: 2, pen: 2, pgk: 2,
  php: 2, pkr: 2, pln: 2, pyg: 0, qar: 2, ron: 2,
  rsd: 2, rub: 2, rwf: 0, sar: 2, sbd: 2, scr: 2,
  sek: 2, sgd: 2, shp: 2, sle: 2, sos: 2, srd: 2,
  std: 2, szl: 2, thb: 2, tjs: 2, tnd: 3, top: 2,
  try: 2, ttd: 2, twd: 2, tzs: 2, uah: 2, ugx: 0,
  uyu: 2, uzs: 2, vnd: 0, vuv: 0, wst: 2, xaf: 0,
  xcd: 2, xcg: 2, xof: 0, xpf: 0, yer: 2, zar: 2,
  zmw: 2,
} as const;

export type Currency = keyof typeof CURRENCY_MINOR_UNITS;

export interface Money {
  amount: number;
  currency: Currency;
}

export type AccountCredentialType = "session" | "api_token";

export interface AccountActorSnapshot {
  email: string;
  credential_type: AccountCredentialType;
}

export interface AccountActor {
  account_id: string | null;
  snapshot: AccountActorSnapshot;
}

export type Actor =
  | { type: "storefront"; customer_session_id: string }
  | { type: "account"; actor: AccountActor };

export type CustomerAuthenticationSnapshot =
  | { type: "visitor" }
  | { type: "email_authenticated"; authenticated_at: EpochMilliseconds };

export interface ProviderOperationClaim {
  id: string;
  started_at: EpochMilliseconds;
  deadline_at: EpochMilliseconds;
  fence: number;
}

export type ProviderEffectError =
  | {
      type: "provider_rejected";
      message: string;
      provider_code: string | null;
      provider_http_status: number | null;
      at: EpochMilliseconds;
    }
  | { type: "provider_call_not_started"; message: string; at: EpochMilliseconds }
  | {
      type: "unknown_outcome";
      message: string;
      provider_code: string | null;
      provider_http_status: number | null;
      at: EpochMilliseconds;
    };
