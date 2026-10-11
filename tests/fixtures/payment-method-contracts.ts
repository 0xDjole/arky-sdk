import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  Actor,
  CardDetails,
  CommerceParty,
  CustomerGroupMemberPaymentMethod,
  FindPaymentMethodsParams,
  GetPaymentMethodConsentTextParams,
  MonriCardPayment,
  MonriCardStatus,
  PaymentMethod,
  PaymentMethodConsentText,
  PaymentMethodConsent,
  PaymentMethodSetupStart,
  PaymentMethodType,
  RequestPaymentMethodSetupParams,
  RevokePaymentMethodParams,
  StorefrontCurrentPaymentMethodConsentTextParams,
  StorefrontFindPaymentMethodsParams,
  StorefrontGetPaymentMethodConsentTextParams,
  StorefrontRequestPaymentMethodSetupParams,
  StripeCardPayment,
  StripeCardStatus,
  RefundReason,
} from "arky-sdk";
import type { PaymentMethod as PublicMethod, CommerceParty as PublicParty } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"]["paymentMethod"];
type Front = ReturnType<typeof createStorefront>["eshop"]["paymentMethod"];


export type PaymentMethodContracts = [
  Assert<Equal<PaymentMethod, PublicMethod>>,
  Assert<Equal<CommerceParty, PublicParty>>,
  Assert<Equal<PaymentMethod["owner"], CommerceParty>>,
  Assert<Equal<RequestPaymentMethodSetupParams["owner"], CommerceParty>>,
  Assert<Equal<StorefrontRequestPaymentMethodSetupParams["owner"], CommerceParty>>,
  Assert<Equal<CommerceParty["type"], "customer" | "company" | "company_location">>,
  Assert<Missing<Extract<CommerceParty, { type: "company" }>, "branches">>,
  Assert<Equal<PaymentMethod["consent"], PaymentMethodConsent>>,
  Assert<Equal<PaymentMethodConsent["given_by"], Actor>>,
  Assert<Equal<keyof PaymentMethodConsentText, "terms_version" | "language" | "text">>,
  Assert<Equal<Parameters<Admin["consentText"]>[0], GetPaymentMethodConsentTextParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["consentText"]>>, PaymentMethodConsentText>>,
  Assert<Equal<Parameters<Front["consentText"]>[0], StorefrontGetPaymentMethodConsentTextParams>>,
  Assert<Equal<Parameters<Front["currentConsentText"]>[0], StorefrontCurrentPaymentMethodConsentTextParams>>,
  Assert<Equal<Awaited<ReturnType<Front["currentConsentText"]>>, PaymentMethodConsentText>>,
  Assert<Equal<keyof StorefrontCurrentPaymentMethodConsentTextParams, "language">>,
  Assert<Equal<keyof StorefrontFindPaymentMethodsParams, "customer_id" | "company_id" | "company_location_id" | "limit" | "cursor">>,
  Assert<Missing<StorefrontFindPaymentMethodsParams, "payment_option_id">>,
  Assert<Equal<StripeCardPayment["payment_method"], CustomerGroupMemberPaymentMethod>>,
  Assert<Equal<MonriCardPayment["payment_method"], CustomerGroupMemberPaymentMethod>>,
  Assert<Missing<StripeCardPayment, "payment_method_id">>,
  Assert<Equal<"recording_mistake" extends RefundReason ? true : false, true>>,
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
