import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  CardDetails,
  FindPaymentMethodsParams,
  MonriCardStatus,
  Payer,
  PaymentMethod,
  PaymentMethodConsent,
  PaymentMethodSetupStart,
  PaymentMethodType,
  RequestPaymentMethodSetupParams,
  RevokePaymentMethodParams,
  StorefrontRequestPaymentMethodSetupParams,
  StripeCardStatus,
} from "arky-sdk";
import type { PaymentMethod as PublicMethod, Payer as PublicPayer } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"]["paymentMethod"];
type Front = ReturnType<typeof createStorefront>["eshop"]["paymentMethod"];
type CompanyPayer = Extract<Payer, { type: "company" }>;

export type PaymentMethodContracts = [
  Assert<Equal<PaymentMethod, PublicMethod>>,
  Assert<Equal<Payer, PublicPayer>>,
  Assert<Equal<PaymentMethod["owner"], Payer>>,
  Assert<Equal<Payer["type"], "customer" | "company">>,
  Assert<Equal<keyof CompanyPayer, "type" | "company_id" | "branches">>,
  Assert<Equal<CompanyPayer["branches"], { type: "all" } | { type: "only"; company_location_id: string }>>,
  Assert<Equal<PaymentMethod["consent"], PaymentMethodConsent>>,
  Assert<Equal<PaymentMethodType["type"], "stripe" | "monri">>,
  Assert<Equal<Extract<StripeCardStatus, { type: "ready" }>["details"], CardDetails>>,
  Assert<Equal<Extract<MonriCardStatus, { type: "ready" }>["details"], CardDetails>>,
  Assert<Missing<PaymentMethod, "details" | "provider" | "state">>,
  Assert<Equal<RequestPaymentMethodSetupParams["accept_storage_and_off_session_use"], true>>,
  Assert<RequiredField<RequestPaymentMethodSetupParams, "accept_storage_and_off_session_use">>,
  Assert<RequiredField<RequestPaymentMethodSetupParams, "id">>,
  Assert<RequiredField<RequestPaymentMethodSetupParams, "terms_version">>,
  Assert<Missing<StorefrontRequestPaymentMethodSetupParams, "store_id">>,
  Assert<Equal<NonNullable<FindPaymentMethodsParams["company_location_id"]>, string>>,
  Assert<Equal<NonNullable<Parameters<Front["find"]>[0]>["company_location_id"], string | undefined>>,
  Assert<Equal<Parameters<Admin["requestSetup"]>[0], RequestPaymentMethodSetupParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["requestSetup"]>>, PaymentMethod>>,
  Assert<Equal<Awaited<ReturnType<Admin["startSetup"]>>, PaymentMethodSetupStart>>,
  Assert<Equal<Awaited<ReturnType<Front["requestSetup"]>>, PaymentMethod>>,
  Assert<Equal<Awaited<ReturnType<Front["startSetup"]>>, PaymentMethodSetupStart>>,
  Assert<Equal<Awaited<ReturnType<Front["completeSetup"]>>, PaymentMethod>>,
  Assert<Equal<Parameters<Admin["revoke"]>[0], RevokePaymentMethodParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["revoke"]>>, PaymentMethod>>,
  Assert<Equal<Awaited<ReturnType<Front["revoke"]>>, PaymentMethod>>,
  Assert<Missing<Parameters<Front["revoke"]>[0], "store_id">>,
  Assert<Equal<keyof PaymentMethodSetupStart, "method" | "client_secret" | "publishable_key">>,
];
