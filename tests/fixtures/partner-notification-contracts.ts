import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  AdminFormSubmission, FormSubmission, ProcessFormSubmissionParams,
  ResolveOrReserveCustomerEmailResult, CustomerIdentity, CustomerEmailClaim,
  StorefrontCustomerIdentity, Notification, NotificationDelivery, NotificationPreview,
  PurchaseRequirement, PurchaseRequirementInput, CreateSubscriptionPlanParams,
  PurchaseRequirementChange, BranchMinimumProgress, CustomerRental,
  WorkflowExternalOperationType, WorkflowExternalOperationResult,
  Cart, CreatedCart, OrderSource, FirstOrderTerms, ReviewFirstOrderTermsParams,
  RepeatBranchCartParams, RepeatOrderSource,
} from "arky-sdk";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Admin = ReturnType<typeof createAdmin>;
type Shop = ReturnType<typeof createStorefront>;

export type PartnerNotificationContracts = [
  True<Same<Awaited<ReturnType<Admin["customers"]["resolveOrReserveEmail"]>>, ResolveOrReserveCustomerEmailResult>>,
  True<Same<CustomerIdentity["email_claim"], CustomerEmailClaim>>,
  True<"verified_at" extends keyof CustomerIdentity ? false : true>,
  True<"email_claim" extends keyof StorefrontCustomerIdentity ? false : true>,
  True<Same<Awaited<ReturnType<Admin["forms"]["processSubmission"]>>, AdminFormSubmission>>,
  True<"processing" extends keyof FormSubmission ? false : true>,
  True<{} extends Pick<ProcessFormSubmissionParams, "expected_processed_at"> ? false : true>,
  True<Same<Awaited<ReturnType<Admin["notification"]["save"]>>, Notification>>,
  True<Same<Awaited<ReturnType<Admin["notification"]["preview"]>>, NotificationPreview>>,
  True<Same<Awaited<ReturnType<Admin["notification"]["delivery"]["get"]>>, NotificationDelivery>>,
  True<Same<Awaited<ReturnType<Admin["notification"]["delivery"]["stop"]>>, NotificationDelivery>>,
  True<"request" extends keyof NotificationDelivery ? false : true>,
  True<"encrypted_request" extends keyof NotificationDelivery ? false : true>,
  True<{} extends Pick<CreateSubscriptionPlanParams, "purchase_requirement"> ? false : true>,
  True<Same<Awaited<ReturnType<Admin["eshop"]["subscription"]["changePurchaseRequirements"]>>, PurchaseRequirementChange[]>>,
  True<"recipe_digest" extends keyof PurchaseRequirement["qualifying_variants"][number] ? true : false>,
  True<"recipe_digest" extends keyof PurchaseRequirementInput["qualifying_variants"][number] ? false : true>,
  True<Same<Awaited<ReturnType<Admin["companies"]["location"]["minimumProgress"]>>, BranchMinimumProgress>>,
  True<Same<Awaited<ReturnType<Shop["companies"]["minimumProgress"]>>, BranchMinimumProgress>>,
  True<"units" extends keyof CustomerRental ? true : false>,
  True<"send_email" extends WorkflowExternalOperationType ? false : true>,
  True<"send_email" extends WorkflowExternalOperationResult["type"] ? false : true>,
  True<Same<Cart["first_order_terms"], FirstOrderTerms | null>>,
  True<Same<Cart["repeat_order_source"], RepeatOrderSource | null>>,
  True<Same<Extract<OrderSource, { type: "cart_acceptance" }>["first_order_terms"], FirstOrderTerms | null>>,
  True<Same<Awaited<ReturnType<Admin["eshop"]["cart"]["reviewFirstOrderTerms"]>>, Cart>>,
  True<Same<Awaited<ReturnType<Admin["eshop"]["cart"]["sealFirstOrderTerms"]>>, Cart>>,
  True<{} extends Pick<ReviewFirstOrderTermsParams, "locale" | "supersedes"> ? false : true>,
  True<Same<Awaited<ReturnType<Shop["eshop"]["cart"]["repeat"]>>, CreatedCart>>,
  True<"market_id" extends keyof RepeatBranchCartParams ? false : true>,
  True<{} extends Pick<RepeatBranchCartParams, "request_id" | "recovery_token"> ? false : true>,
];
