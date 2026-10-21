import type { createStorefront, initialize } from "arky-sdk/storefront";
import { ArkyApiError, CartPresentationChangedError, CheckoutFlowError, CustomerGroupJoinError } from "arky-sdk/storefront";
import { ArkyApiError as AdminApiError } from "arky-sdk/admin";
import type {
  ArkyCartStore,
  ArkyCheckoutErrorCode,
  ArkyCheckoutState,
  ArkyCheckoutStep,
  Collection,
  ContentBlocks,
  EmailContact,
  Entry,
  JoinFreeCustomerGroupResult,
  LoadedContent,
  Media,
  OrderFromLink,
  PaymentOutcome,
  RequestOptions,
  RequestNewsletterCodeResult,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type OptionalField<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Storefront = ReturnType<typeof createStorefront>;
type Store = ReturnType<typeof initialize>;
type Answer<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>;

const apiError = new ArkyApiError({ message: "Refused", code: "GENERAL.CONFLICT", statusCode: 409 });
const sameClass: AdminApiError = apiError;
const flowError = new CheckoutFlowError("refused", "Refused", apiError);
const joinError = new CustomerGroupJoinError("not_free", "Not free");

export type StorefrontFlowContracts = [
  Assert<Equal<typeof sameClass.code, string>>,
  Assert<Equal<typeof apiError.statusCode, number>>,
  Assert<Equal<typeof apiError.requestId, string | undefined>>,
  Assert<Equal<CartPresentationChangedError extends ArkyApiError ? true : false, true>>,
  Assert<Equal<typeof flowError.code, ArkyCheckoutErrorCode>>,
  Assert<Equal<NonNullable<ArkyCheckoutState["error"]>["code"], ArkyCheckoutErrorCode>>,
  Assert<Equal<typeof joinError.code, "sign_in_required" | "email_mismatch" | "not_free" | "sign_up_used" | "sign_up_expired">>,
  Assert<OptionalField<RequestOptions, "locale">>,
  Assert<OptionalField<RequestOptions, "market">>,
  Assert<OptionalField<Parameters<Storefront["forms"]["submit"]>[0], "id">>,
  Assert<OptionalField<Parameters<Storefront["customer"]["requestCode"]>[0], "id">>,
  Assert<RequiredField<Parameters<Storefront["customer"]["requestCode"]>[0], "contact">>,
  Assert<Equal<ArkyCheckoutState["contact_email"], EmailContact | null>>,
  Assert<RequiredField<Parameters<Storefront["newsletter"]["requestCode"]>[0], "contact">>,
  Assert<OptionalField<Parameters<Storefront["support"]["conversation"]["start"]>[0], "id">>,
  Assert<OptionalField<Parameters<Storefront["support"]["conversation"]["sendMessage"]>[0], "id">>,
  Assert<Missing<Store["forms"], "submitByKey">>,
  Assert<Equal<Answer<Storefront["eshop"]["order"]["fromLink"]>, OrderFromLink>>,
  Assert<Equal<ReturnType<Storefront["eshop"]["order"]["retainedToken"]>, string | null>>,
  Assert<Equal<Answer<Storefront["eshop"]["customerGroup"]["joinFree"]>, JoinFreeCustomerGroupResult>>,
  Assert<Equal<Answer<Storefront["newsletter"]["requestCode"]>, RequestNewsletterCodeResult>>,
  Assert<Missing<Storefront["newsletter"], "sendCode">>,
  Assert<Equal<Answer<Storefront["newsletter"]["join"]>, JoinFreeCustomerGroupResult>>,
  Assert<Equal<Store["newsletter"], Storefront["newsletter"]>>,
  Assert<Equal<Answer<Store["content"]["load"]>, LoadedContent<Collection> | LoadedContent<Entry>>>,
  Assert<Equal<ReturnType<LoadedContent<Entry>["media"]>, Media | null>>,
  Assert<Equal<ReturnType<ContentBlocks["object"]>, ContentBlocks | null>>,
  Assert<Equal<ReturnType<Store["eshop"]["cart"]>, ArkyCartStore>>,
  Assert<Missing<Store["eshop"], "carts">>,
  Assert<Equal<ArkyCheckoutState["step"], ArkyCheckoutStep>>,
  Assert<Equal<ArkyCheckoutStep, "cart" | "details" | "shipping" | "payment" | "paying" | "placed">>,
  Assert<Equal<ArkyCheckoutState["outcome"], PaymentOutcome | null>>,
  Assert<Equal<PaymentOutcome, "paid" | "pay_later" | "awaiting" | "unconfirmed" | "failed">>,
  Assert<Missing<Storefront, "withContext">>,
  Assert<Missing<Store, "withContext">>,
];
