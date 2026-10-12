import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  Cart,
  CartOffer,
  CartOfferStatus,
  CreateCartOfferParams,
  Customer,
  OutgoingEmailStatus,
  OutgoingEmailType,
  EmailTemplatePreview,
  FindOutgoingEmailsParams,
  FormSubmission,
  GetMinimumProgressParams,
  MinimumProgress,
  MinimumProgressUnavailableReason,
  OutgoingEmail,
  OutgoingWebhook,
  StorefrontGetMinimumProgressParams,
  CommerceParty,
  OutgoingWebhookStatus,
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
  Assert<Equal<Awaited<ReturnType<Admin["forms"]["changeSubmissionStage"]>>, FormSubmission>>,
  Assert<Missing<Admin["forms"], "processSubmission">>,
  Assert<Missing<Admin["notification"], "save" | "delivery" | "preview">>,
  Assert<Equal<Awaited<ReturnType<Admin["notification"]["template"]["preview"]>>, EmailTemplatePreview>>,
  Assert<Equal<Awaited<ReturnType<Admin["notification"]["outgoingEmail"]["get"]>>, OutgoingEmail>>,
  Assert<Equal<Awaited<ReturnType<Admin["notification"]["outgoingWebhook"]["get"]>>, OutgoingWebhook>>,
  Assert<Missing<Admin["notification"], "find" | "get" | "stop" | "cancel">>,
  Assert<Equal<keyof OutgoingEmail, "id" | "type" | "to" | "send_before" | "status" | "created_at" | "updated_at">>,
  Assert<Equal<OutgoingEmailType["type"], "arky_sign_in" | "team_invite" | "customer_sign_in" | "event_email" | "receipt_resend" | "template_test" | "broadcast_email" | "support_reply">>,
  Assert<Equal<Extract<OutgoingEmailType, { type: "support_reply" }>["sending_address_id"], string>>,
  Assert<Missing<Extract<OutgoingEmailType, { type: "receipt_resend" }>, "sender_id">>,
  Assert<Equal<NonNullable<FindOutgoingEmailsParams["type"]>, OutgoingEmailType["type"]>>,
  Assert<Equal<OutgoingEmailStatus["type"], "waiting" | "sending" | "retrying" | "sent" | "not_sent" | "maybe_sent">>,
  Assert<Equal<OutgoingWebhookStatus["type"], "waiting" | "sending" | "retrying" | "acknowledged" | "unacknowledged">>,
  Assert<Equal<Parameters<Admin["eshop"]["minimumProgress"]["get"]>[0], GetMinimumProgressParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["minimumProgress"]["get"]>>, MinimumProgress>>,
  Assert<Equal<Parameters<Shop["eshop"]["minimumProgress"]["get"]>[0], StorefrontGetMinimumProgressParams>>,
  Assert<Equal<Awaited<ReturnType<Shop["eshop"]["minimumProgress"]["get"]>>, MinimumProgress>>,
  Assert<Equal<StorefrontGetMinimumProgressParams, { customer_id: string; company_id?: never; company_location_id?: never } | { customer_id?: never; company_id: string; company_location_id?: never } | { customer_id?: never; company_id?: never; company_location_id: string }>>,
  Assert<Equal<MinimumProgress["party"], CommerceParty>>,
  Assert<Equal<"per_location" extends MinimumProgressUnavailableReason ? true : false, true>>,
  Assert<Missing<Admin["companies"], "minimumProgress">>,
  Assert<Missing<Shop["companies"], "minimumProgress">>,
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
