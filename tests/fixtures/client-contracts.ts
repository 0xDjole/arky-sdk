import { createAdmin, createStorefront, epochMilliseconds, initialize } from "arky-sdk";
import type {
  Account,
  AccountApiTokenCreated,
  ArkyCartCheckoutInput,
  StorefrontContext,
  AccountSession,
  AuthToken,
  Broadcast,
  CheckoutAcceptance,
  CreateBroadcastParams,
  CreateEmailDomainParams,
  CreateEmailSenderParams,
  CreateEmailTemplateParams,
  CreatePaymentRefundParams,
  CreateSupportFlowParams,
  Customer,
  CustomerEmail,
  CustomerSearchSnapshot,
  EmailDomain,
  EmailSender,
  EmailTemplate,
  EmailTemplatePreview,
  FormAnswerInput,
  FormValues,
  MonriConfirmation,
  Notification,
  PaginatedResponse,
  Payment,
  PaymentType,
  PlatformAdministrator,
  PreviewEmailTemplateParams,
  ProviderEvent,
  RecordRefundReceiptParams,
  RequestCustomerCodeParams,
  ResolvePaymentChargeParams,
  ResolvePaymentRefundParams,
  SendBroadcastTestParams,
  SendEmailTemplateTestParams,
  ServerError,
  StorefrontFormSubmission,
  StorefrontSetup,
  StoreUsageSummary,
  SubmitFormParams,
  SupportFlow,
} from "arky-sdk";
import type * as Public from "arky-sdk/types";
export type { BlockContracts } from "./block-contracts.js";
import type { MembershipContracts } from "./membership-contracts.js";
import type { CatalogContracts } from "./catalog-contracts.js";
import type { PriceContracts } from "./price-contracts.js";
import type { CompanyContracts } from "./company-contracts.js";
import type { OrderContracts } from "./order-contracts.js";
import type { CartContracts } from "./cart-contracts.js";
import type { InventoryContracts } from "./inventory-contracts.js";
export type { ShippingProfileContracts } from "./shipping-profile-contracts.js";
export type { MembershipContracts, CatalogContracts, PriceContracts, CompanyContracts, OrderContracts, CartContracts, InventoryContracts };

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type Storefront = ReturnType<typeof createStorefront>;
type Store = ReturnType<typeof initialize>;
type Answer<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>;

const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_contract" });
const storefront = createStorefront(`arky_pk_${"a".repeat(42)}A`, { apiUrl: "https://api.example.test", locale: "bs", market: "bih", salesChannel: "web" });
const store_id = "c3d8f1a2-6b47-4e95-8a0c-2f7d5e9b1a63";

export const notificationPage: Promise<PaginatedResponse<Notification>> = admin.notification.find({ store_id, to: "buyer@example.test", type: "event_email", limit: 20 });
export const templatePreview: Promise<EmailTemplatePreview> = admin.notification.template.preview({ store_id, id: "template", language: "bs" });
export const templateTest: Promise<Notification> = admin.notification.template.test({ store_id, id: "template", notification_id: "8a6d4f2b-9c1e-4e57-b3a8-1f6c9e2d4b70", language: "bs" });
export const broadcastTest: Promise<Notification> = admin.broadcast.test({ store_id, id: "broadcast", notification_id: "8a6d4f2b-9c1e-4e57-b3a8-1f6c9e2d4b70", language: "en" });
export const usage: Promise<StoreUsageSummary> = admin.store.usage.find({ store_id });
export const setup: Promise<StorefrontSetup> = storefront.getSetup();
export const formAnswers: FormAnswerInput[] = [{ type: "text", question_id: "q", key: "name", value: "Ana" }];
export const formValues: FormValues = { name: "Ana", phone: null, notes: undefined, colors: ["red"] };
export const createdAt = epochMilliseconds(1);

export type AdminSurfaceContracts = [
  Assert<Equal<keyof Admin, "account" | "platform" | "store" | "notification" | "broadcast" | "support" | "media" | "category" | "content" | "forms" | "companies" | "customers" | "actions" | "experiments" | "analytics" | "eshop" | "session" | "isAuthenticated" | "onAuthStateChanged" | "logout" | "utils">>,
  Assert<Missing<Admin, "automation">>,
  Assert<Missing<Admin, "campaign">>,
  Assert<Missing<Admin, "leadResearch">>,
  Assert<Missing<Admin, "social">>,
  Assert<Missing<Admin["notification"], "mailbox">>,
  Assert<Missing<Admin["notification"], "delivery">>,
  Assert<Missing<Admin["eshop"], "refund">>,
  Assert<Missing<Admin["eshop"], "dispute">>,
  Assert<Missing<Admin["eshop"], "digital">>,
  Assert<Missing<Admin["eshop"], "orderCredit">>,
  Assert<Missing<Admin["eshop"], "subscriptionPlanEntitlement">>,
  Assert<Missing<Admin["eshop"], "customerGroupEmailConsent">>,
  Assert<Missing<Admin["store"], "commerce">>,
  Assert<Equal<keyof Admin["notification"], "find" | "get" | "stop" | "template" | "emailDomain" | "emailSender">>,
  Assert<Equal<keyof Admin["notification"]["emailDomain"], "find" | "get" | "create" | "verify" | "delete">>,
  Assert<Equal<keyof Admin["notification"]["emailSender"], "find" | "get" | "create" | "update" | "delete">>,
  Assert<Equal<keyof Admin["broadcast"], "find" | "get" | "create" | "update" | "delete" | "schedule" | "unschedule" | "send" | "preview" | "test">>,
  Assert<Equal<keyof Admin["support"], "flow" | "channel" | "conversation">>,
  Assert<Equal<keyof Admin["platform"]["administrator"], "list" | "me" | "add" | "remove">>,
  Assert<Equal<keyof Admin["eshop"]["payment"], "find" | "get" | "createManual" | "recordCollection" | "createRefund" | "recordRefundReceipt" | "cancelRefund" | "resolveRefund" | "resolveCharge" | "resolveHold" | "cancel">>,
  Assert<Equal<keyof Admin["eshop"]["providerEvent"], "find" | "get" | "resolve">>,
  Assert<Equal<Answer<Admin["account"]["getMe"]>, Account>>,
  Assert<Equal<Answer<Admin["account"]["apiToken"]["create"]>, AccountApiTokenCreated>>,
  Assert<Equal<Answer<Admin["account"]["session"]["list"]>, PaginatedResponse<AccountSession>>>,
  Assert<Equal<Answer<Admin["account"]["auth"]["verify"]>, AuthToken>>,
  Assert<Missing<AuthToken, "scope">>,
  Assert<Equal<Answer<Admin["platform"]["administrator"]["add"]>, PlatformAdministrator>>,
  Assert<Equal<Answer<Admin["platform"]["stripeBillingEvent"]["resolve"]>, ProviderEvent>>,
  Assert<Equal<Answer<Admin["notification"]["template"]["create"]>, EmailTemplate>>,
  Assert<Equal<Answer<Admin["notification"]["emailDomain"]["create"]>, EmailDomain>>,
  Assert<Equal<Answer<Admin["notification"]["emailSender"]["create"]>, EmailSender>>,
  Assert<Equal<Answer<Admin["broadcast"]["create"]>, Broadcast>>,
  Assert<Equal<Answer<Admin["support"]["flow"]["create"]>, SupportFlow>>,
  Assert<Equal<Answer<Admin["customers"]["find"]>, PaginatedResponse<CustomerSearchSnapshot>>>,
  Assert<Equal<Answer<Admin["customers"]["erase"]>, Customer>>,
  Assert<Equal<Answer<Admin["eshop"]["payment"]["createRefund"]>, Payment>>,
  Assert<Equal<Answer<Admin["eshop"]["cart"]["checkout"]>, CheckoutAcceptance>>,
  Assert<RequiredField<CreateEmailTemplateParams, "id">>,
  Assert<RequiredField<CreateEmailTemplateParams, "sender_id">>,
  Assert<RequiredField<CreateEmailDomainParams, "id">>,
  Assert<RequiredField<CreateEmailSenderParams, "id">>,
  Assert<RequiredField<CreateEmailSenderParams, "email_domain_id">>,
  Assert<RequiredField<CreateBroadcastParams, "id">>,
  Assert<RequiredField<CreateSupportFlowParams, "id">>,
  Assert<RequiredField<CreatePaymentRefundParams, "id">>,
  Assert<RequiredField<RecordRefundReceiptParams, "id">>,
  Assert<RequiredField<PreviewEmailTemplateParams, "language">>,
  Assert<RequiredField<SendEmailTemplateTestParams, "language">>,
  Assert<RequiredField<SendEmailTemplateTestParams, "notification_id">>,
  Assert<RequiredField<SendBroadcastTestParams, "language">>,
  Assert<Equal<ResolvePaymentRefundParams["outcome"], MonriConfirmation>>,
  Assert<Equal<ResolvePaymentChargeParams["outcome"], MonriConfirmation>>,
  Assert<Equal<MonriConfirmation["type"], "made" | "not_made">>,
  Assert<Equal<PaymentType["type"], "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "cash_on_delivery" | "manual">>,
  Assert<Equal<CustomerEmail["type"], "no_email" | "contact" | "reserved" | "verified">>,
  Assert<Equal<keyof ServerError, "message" | "error" | "statusCode" | "validationErrors">>,
];

export type StorefrontSurfaceContracts = [
  Assert<Missing<Storefront, "customer_groups">>,
  Assert<Missing<Storefront, "customer_group_members">>,
  Assert<Missing<Storefront, "customer_group_email_consents">>,
  Assert<Missing<Storefront["customer"], "captureEmail">>,
  Assert<Missing<Storefront["eshop"], "digital">>,
  Assert<Missing<Storefront["eshop"]["order"], "resumePayment">>,
  Assert<Equal<keyof Storefront["customer"], "identify" | "requestCode" | "verify" | "refresh" | "logout" | "getMe" | "updateMe" | "resubscribe">>,
  Assert<Equal<keyof RequestCustomerCodeParams, "id" | "email" | "language">>,
  Assert<RequiredField<RequestCustomerCodeParams, "language">>,
  Assert<RequiredField<RequestCustomerCodeParams, "id">>,
  Assert<Equal<keyof SubmitFormParams, "form_id" | "id" | "language" | "answers">>,
  Assert<Equal<Answer<Storefront["forms"]["submit"]>, StorefrontFormSubmission>>,
  Assert<Equal<keyof StorefrontFormSubmission, "id" | "form_id" | "language" | "answers" | "stage_id" | "created_at" | "updated_at">>,
  Assert<Equal<keyof NonNullable<Parameters<Storefront["store"]["location"]["list"]>[0]>, "key" | "sort_field" | "sort_direction" | "limit" | "cursor">>,
  Assert<Equal<Parameters<Store["eshop"]["cart"]["checkout"]>[0], ArkyCartCheckoutInput>>,
  Assert<Equal<Answer<Store["eshop"]["cart"]["checkout"]>, CheckoutAcceptance>>,
  Assert<Equal<keyof StorefrontContext, "locale" | "market" | "salesChannel">>,
  Assert<Equal<keyof Public.StorefrontSetup, "name" | "timezone" | "languages" | "payment_options">>,
];
