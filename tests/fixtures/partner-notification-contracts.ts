import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  BranchMinimumProgress,
  Cart,
  CartOffer,
  CartOfferStatus,
  CreateCartOfferParams,
  Customer,
  EmailTemplatePreview,
  FindNotificationsParams,
  FormSubmission,
  Notification,
  NotificationKind,
  NotificationStatus,
  ResolveOrReserveCustomerEmailParams,
  SendCartOfferParams,
  StorefrontReorderParams,
  WithdrawCartOfferParams,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type Shop = ReturnType<typeof createStorefront>;

export type PartnerNotificationContracts = [
  Assert<Equal<Awaited<ReturnType<Admin["customers"]["resolveOrReserveEmail"]>>, Customer>>,
  Assert<RequiredField<ResolveOrReserveCustomerEmailParams, "customer_id">>,
  Assert<Equal<Awaited<ReturnType<Admin["forms"]["changeSubmissionStage"]>>, FormSubmission>>,
  Assert<Missing<Admin["forms"], "processSubmission">>,
  Assert<Missing<Admin["notification"], "save" | "delivery" | "preview">>,
  Assert<Equal<Awaited<ReturnType<Admin["notification"]["template"]["preview"]>>, EmailTemplatePreview>>,
  Assert<Equal<Awaited<ReturnType<Admin["notification"]["get"]>>, Notification>>,
  Assert<Equal<Awaited<ReturnType<Admin["notification"]["stop"]>>, Notification>>,
  Assert<Equal<NonNullable<FindNotificationsParams["type"]>, NotificationKind>>,
  Assert<Equal<"receipt_resend" extends NotificationKind ? true : false, true>>,
  Assert<Equal<NotificationStatus["type"], "waiting" | "sending" | "retrying" | "sent" | "not_sent" | "maybe_sent">>,
  Assert<Equal<Awaited<ReturnType<Admin["companies"]["minimumProgress"]>>, BranchMinimumProgress>>,
  Assert<Equal<Awaited<ReturnType<Shop["companies"]["minimumProgress"]>>, BranchMinimumProgress>>,
  Assert<Equal<Cart["offer"], CartOffer | null>>,
  Assert<Equal<CartOfferStatus["type"], "reviewed" | "sent">>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["cart"]["offer"]["create"]>>, Cart>>,
  Assert<Equal<Parameters<Admin["eshop"]["cart"]["offer"]["create"]>[0], CreateCartOfferParams>>,
  Assert<Equal<Parameters<Admin["eshop"]["cart"]["offer"]["send"]>[0], SendCartOfferParams>>,
  Assert<Equal<Parameters<Admin["eshop"]["cart"]["offer"]["withdraw"]>[0], WithdrawCartOfferParams>>,
  Assert<RequiredField<CreateCartOfferParams, "presentation_digest">>,
  Assert<RequiredField<CreateCartOfferParams, "language">>,
  Assert<Equal<CreateCartOfferParams["supersedes_cart_id"], string | null>>,
  Assert<Missing<Admin["eshop"]["cart"], "reviewFirstOrderTerms" | "sealFirstOrderTerms" | "withdrawFirstOrderTerms">>,
  Assert<Missing<Cart, "first_order_terms" | "repeat_order_source">>,
  Assert<Missing<Shop["eshop"]["cart"], "repeat">>,
  Assert<Equal<keyof StorefrontReorderParams, "id" | "order_id" | "buyer">>,
];
