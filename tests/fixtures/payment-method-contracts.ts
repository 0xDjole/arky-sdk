import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  Payment, PaymentMethod, PaymentMethodOwner, PaymentMethodDetails, PaymentMethodState,
  PaymentMethodSetupRequest, RequestPaymentMethodSetupParams, PaymentMethodSetupStart,
  PaymentMethodRevocation, RevokePaymentMethodParams, FindPaymentMethodsParams,
  StorefrontDto, SubscriptionSelf, SubscriptionControlResult,
} from "arky-sdk";
import type { PaymentMethod as PublicMethod, PaymentMethodOwner as PublicOwner } from "arky-sdk/types";

type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Admin = ReturnType<typeof createAdmin>["eshop"]["paymentMethod"];
type Front = ReturnType<typeof createStorefront>["eshop"]["paymentMethod"];
type SubscriptionFront = ReturnType<typeof createStorefront>["eshop"]["subscription"];
type CompanyOwner = Extract<PaymentMethodOwner, { type: "company" }>;

export type PaymentMethodContracts = [
  True<Same<PaymentMethod, PublicMethod>>,
  True<Same<FindPaymentMethodsParams["company_location_id"], string | undefined>>,
  True<Same<NonNullable<Parameters<Front["find"]>[0]>["company_location_id"], string | undefined>>,
  True<Same<PaymentMethodOwner, PublicOwner>>,
  True<Same<PaymentMethod["owner"], PaymentMethodOwner>>,
  True<Same<Payment["payer"], PaymentMethodOwner>>,
  True<Same<PaymentMethodOwner["type"], "customer" | "company">>,
  True<Same<keyof CompanyOwner, "type" | "company_id" | "company_location_id">>,
  True<Same<CompanyOwner["company_location_id"], string | null>>,
  True<{} extends Pick<CompanyOwner, "company_location_id"> ? false : true>,
  True<Same<PaymentMethod["details"], PaymentMethodDetails | null>>,
  True<Same<PaymentMethod["provider"], "stripe" | "monri" | null>>,
  True<Same<PaymentMethodState["type"], "setup_requested" | "setup_processing" | "setup_unknown" | "requires_action" | "ready" | "unavailable">>,
  True<Same<PaymentMethodSetupRequest["owner"], PaymentMethodOwner>>,
  True<Same<RequestPaymentMethodSetupParams["accept_storage_and_off_session_use"], true>>,
  True<{} extends Pick<RequestPaymentMethodSetupParams, "accept_storage_and_off_session_use"> ? false : true>,
  True<Same<Parameters<Admin["requestSetup"]>[0], RequestPaymentMethodSetupParams>>,
  True<Same<Awaited<ReturnType<Admin["requestSetup"]>>, PaymentMethod>>,
  True<Same<Awaited<ReturnType<Admin["startSetup"]>>, PaymentMethodSetupStart>>,
  True<Same<Awaited<ReturnType<Front["requestSetup"]>>, StorefrontDto<PaymentMethod>>>,
  True<Same<Awaited<ReturnType<Front["startSetup"]>>, StorefrontDto<PaymentMethodSetupStart>>>,
  True<Same<Awaited<ReturnType<Front["completeSetup"]>>, StorefrontDto<PaymentMethod>>>,
  True<Same<Parameters<Admin["revoke"]>[0], RevokePaymentMethodParams>>,
  True<Same<Awaited<ReturnType<Admin["revoke"]>>, PaymentMethodRevocation>>,
  True<Same<Awaited<ReturnType<Front["revoke"]>>, StorefrontDto<PaymentMethodRevocation>>>,
  True<"store_id" extends keyof Parameters<Front["requestSetup"]>[0] ? false : true>,
  True<"store_id" extends keyof Parameters<Front["revoke"]>[0] ? false : true>,
  True<Same<Awaited<ReturnType<SubscriptionFront["current"]>>, StorefrontDto<SubscriptionSelf>>>,
  True<Same<Awaited<ReturnType<SubscriptionFront["control"]>>, StorefrontDto<SubscriptionControlResult>>>,
  True<"store_id" extends keyof Parameters<SubscriptionFront["current"]>[0] ? false : true>,
  True<"store_id" extends keyof Parameters<SubscriptionFront["control"]>[0] ? false : true>,
  True<"store_id" extends keyof Awaited<ReturnType<Front["get"]>> ? false : true>,
  True<"store_id" extends keyof Awaited<ReturnType<Front["revoke"]>>["method"] ? false : true>,
  True<"store_id" extends keyof Awaited<ReturnType<SubscriptionFront["control"]>>["subscription"] ? false : true>,
];
