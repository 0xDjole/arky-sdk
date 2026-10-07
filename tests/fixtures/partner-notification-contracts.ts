import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  AdminFormSubmission, FormSubmission, ChangeFormSubmissionStageParams,
  ResolveOrReserveCustomerEmailResult, CustomerIdentity, CustomerEmailClaim,
  StorefrontCustomerIdentity, MessageDelivery, MessageDeliverySource, PreviewEmailTemplateResponse,
  PurchaseRequirement, PurchaseRequirementInput, CreateSubscriptionPlanParams,
  PurchaseRequirementChange, BranchMinimumProgress, CustomerRental,
  AutomationRunStepOutcome,
  Cart, RepeatedCart, RepeatLeftOutLine, OrderSource, FirstOrderTerms, FirstOrderLineTerms, ReviewFirstOrderTermsParams,
  WithdrawFirstOrderTermsParams, RepeatBranchCartParams, RepeatOrderSource,
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
  True<Same<Awaited<ReturnType<Admin["forms"]["changeSubmissionStage"]>>, AdminFormSubmission>>,
  True<"processing" extends keyof FormSubmission ? false : true>,
  True<"processSubmission" extends keyof Admin["forms"] ? false : true>,
  True<{} extends Pick<ChangeFormSubmissionStageParams, "expected_changed_at"> ? false : true>,
  True<"save" extends keyof Admin["notification"] ? false : true>,
  True<Same<Awaited<ReturnType<Admin["notification"]["template"]["preview"]>>, PreviewEmailTemplateResponse>>,
  True<Same<Awaited<ReturnType<Admin["notification"]["delivery"]["get"]>>, MessageDelivery>>,
  True<Same<Awaited<ReturnType<Admin["notification"]["delivery"]["stop"]>>, MessageDelivery>>,
  True<"request" extends keyof MessageDelivery ? false : true>,
  True<"encrypted_request" extends keyof MessageDelivery ? false : true>,
  True<"receipt_resend" extends MessageDeliverySource["type"] ? true : false>,
  True<{} extends Pick<CreateSubscriptionPlanParams, "purchase_requirement"> ? false : true>,
  True<Same<Awaited<ReturnType<Admin["eshop"]["subscription"]["changePurchaseRequirements"]>>, PurchaseRequirementChange[]>>,
  True<"recipe_digest" extends keyof PurchaseRequirement["qualifying_variants"][number] ? true : false>,
  True<"recipe_digest" extends keyof PurchaseRequirementInput["qualifying_variants"][number] ? false : true>,
  True<Same<Awaited<ReturnType<Admin["companies"]["location"]["minimumProgress"]>>, BranchMinimumProgress>>,
  True<Same<Awaited<ReturnType<Shop["companies"]["minimumProgress"]>>, BranchMinimumProgress>>,
  True<"units" extends keyof CustomerRental ? true : false>,
  True<"email_requested" extends AutomationRunStepOutcome["type"] ? true : false>,
  True<Same<Cart["first_order_terms"], FirstOrderTerms | null>>,
  True<Same<Cart["repeat_order_source"], RepeatOrderSource | null>>,
  True<Same<Extract<OrderSource, { type: "cart_acceptance" }>["first_order_terms"], FirstOrderTerms | null>>,
  True<Same<Awaited<ReturnType<Admin["eshop"]["cart"]["reviewFirstOrderTerms"]>>, Cart>>,
  True<Same<Awaited<ReturnType<Admin["eshop"]["cart"]["sealFirstOrderTerms"]>>, Cart>>,
  True<Same<Parameters<Admin["eshop"]["cart"]["withdrawFirstOrderTerms"]>[0], WithdrawFirstOrderTermsParams>>,
  True<Same<Awaited<ReturnType<Admin["eshop"]["cart"]["withdrawFirstOrderTerms"]>>, Cart>>,
  True<Same<keyof WithdrawFirstOrderTermsParams, "store_id" | "id" | "version_id" | "expected_updated_at">>,
  True<Same<FirstOrderLineTerms["rebate_per_unit"], number>>,
  True<{} extends Pick<ReviewFirstOrderTermsParams, "locale" | "supersedes"> ? false : true>,
  True<Same<Awaited<ReturnType<Shop["eshop"]["cart"]["repeat"]>>, RepeatedCart>>,
  True<Same<RepeatedCart["left_out"], RepeatLeftOutLine[]>>,
  True<Same<keyof RepeatLeftOutLine, "order_line_item_id" | "product_id" | "variant_id" | "quantity">>,
  True<"market_id" extends keyof RepeatBranchCartParams ? false : true>,
  True<{} extends Pick<RepeatBranchCartParams, "request_id" | "recovery_token"> ? false : true>,
  True<Same<keyof RepeatBranchCartParams, "request_id" | "recovery_token" | "company_id" | "company_location_id" | "source_order_id">>,
  True<{} extends Pick<RepeatBranchCartParams, "source_order_id"> ? true : false>,
  True<Same<RepeatBranchCartParams["source_order_id"], string | undefined>>,
];
