#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sourceDir = resolve(root, "src");

const removedIdentifiers = [
  "AccountApiToken",
  "StorefrontKey",
  "CustomerEmail",
  "CustomerStatus",
  "EmailDomain",
  "NotificationType",
  "createNotificationApi",
  "createStorefrontKeyApi",
  "MessageDelivery",
  "createMessageDeliveryApi",
  "Campaign",
  "CampaignStatus",
  "CampaignEnrollment",
  "CampaignMessage",
  "createCampaignApi",
  "Mailbox",
  "MailboxProvider",
  "createMailboxApi",
  "Automation",
  "AutomationRun",
  "createAutomationApi",
  "LeadResearch",
  "createLeadResearchApi",
  "SocialConnection",
  "SocialPost",
  "SocialMessage",
  "createSocialApi",
  "MarketZone",
  "createMarketZoneApi",
  "MarketPaymentOption",
  "createMarketPaymentOptionApi",
  "TaxRuleStatus",
  "createTaxRuleApi",
  "ShippingRateStatus",
  "createShippingRateApi",
  "createPaymentTermsApi",
  "CustomerIdentity",
  "StorefrontCustomerIdentity",
  "OrderBooking",
  "OrderCancellationDecision",
  "PaymentCapture",
  "PaymentDispute",
  "PaymentRefund",
  "createRefundApi",
  "createPaymentDisputeApi",
  "ProviderNotification",
  "SupportAgent",
  "SupportAgentDefinition",
  "SubscriptionChange",
  "DigitalProduct",
  "StorefrontDigitalProduct",
  "createDigitalApi",
  "StoreCommerce",
  "StoreCustomerWorkspace",
  "FirstOrderTerms",
  "ReferenceIndexEntry",
  "OrderCheckoutResult",
  "CheckoutQuote",
  "captureEmail",
  "requireRequestId",
  "createSubscriptionApi",
  "createSubscriptionPlanApi",
  "createSubscriptionOfferingApi",
  "SubscriptionPlan",
  "SubscriptionOffering",
  "SubscriptionRevision",
  "addSubscriptionPlan",
  "EmailSender",
  "createEmailSenderApi",
  "StopNotificationParams",
  "SupportChannel",
  "SupportAutoReply",
  "StorefrontClientRegistration",
  "createStorefrontClientApi",
  "Payer",
  "PayerBranches",
  "CompanyLocationReach",
  "AllowedPaymentOptions",
  "FulfillmentTiming",
  "InventoryItemEditableStatus",
  "FulfillmentRecipient",
  "RevenueByCurrencyData",
  "completeBookingItem",
  "createPriceApi",
  "FindPricesParams",
  "GetPriceParams",
  "CreatePriceParams",
  "UpdatePriceParams",
  "DeletePriceParams",
  "PriceBatchOperation",
  "BatchPricesParams",
  "ManualPrice",
  "ManualPriceInput",
  "ProductOption",
  "ProductVariantOption",
  "OrderVariantOption",
  "FindStorefrontProductsParams",
  "FindStorefrontProductVariantsParams",
  "FindStorefrontBookingServicesParams",
  "FindStorefrontBookingOfferingsParams",
  "FindStorefrontBookingResourcesParams",
  "StorefrontCartProductLineItemInput",
  "StorefrontCartBookingLineItemInput",
  "StorefrontCartLineItemInput",
  "price_override",
  "options_valid",
  "loadMoreOfferings",
  "TimedEmail",
  "AlertEmail",
  "EmailAddressSending",
  "EmailAddressReceiving",
  "EmailAddressReceivingInput",
  "EmailAddressStatus",
  "EmailAddressType",
  "EmailAddressInputType",
  "UpdateEmailAddressParams",
  "ChangeEmailAddressStatusParams",
  "BROADCAST_FIELDS",
  "BroadcastField",
  "BROADCAST_BLOCK_FIELD_PREFIXES",
  "BroadcastBlockField",
  "ConversationStatus",
  "ConversationStatusName",
  "SelectConversationSendingAddressParams",
  "AssignFormSubmissionParams",
  "SetFormSubmissionCompanyParams",
  "assignSubmission",
  "setSubmissionCompany",
  "selectSendingAddress",
  "CreateStripeWebhookParams",
  "RotateStripeWebhookSecretParams",
  "createWebhook",
  "rotateWebhookSecret",
  "not_created",
  "endpoint_url",
  "webhook_api_version",
  "StorefrontCancelOrderProductItemParams",
  "FulfillmentOrder",
  "FulfillmentAction",
  "FulfillmentJobAction",
  "RentalAction",
  "ReturnAction",
  "OrderPromotionCode",
  "combinable",
  "expected_level_updated_at",
  "files_too_large",
  "sameCartScope",
  "appendQueryString",
  "simulator_url",
  "_secret_emulator",
  "PackageChoiceFilter",
  "PackageMatchingPrice",
  "matching_price",
  "repairing",
  "sole_price_id",
  "choice_count",
  "PackageTerm",
  "PackageCard",
  "PackageItemCard",
  "packageCard",
  "package_card",
  "CartAccessProductPreview",
  "PreviewCartAccessProductParams",
  "StorefrontPreviewCartAccessProductParams",
  "previewAccessProduct",
  "purchase_limit_exceeded",
  "getMemberPrices",
  "findLimits",
  "previewMemberPrice",
  "PackageMemberLimitUsage",
  "PackageMemberMemberPricesPage",
  "PackageMemberMemberPricesGrant",
  "PackageMemberMemberPricesSource",
  "GetPackageMemberMemberPricesParams",
  "StorefrontGetPackageMemberMemberPricesParams",
  "MemberPriceLimitAvailability",
  "QuoteMemberPrices",
  "QuoteMemberPriceLimit",
  "CartMemberPricePreview",
  "PreviewCartMemberPriceParams",
  "StorefrontPreviewCartMemberPriceParams",
  "MemberPriceGrantRef",
  "OrderMemberPricesLineItem",
  "orderMemberPricesItems",
  "CartProductPurchase",
  "copyCartProductPurchase",
  "PackageLimit",
  "PackageLimitPeriod",
  "PackageLimitRestoration",
  "get_member_prices",
  "member_prices",
  "member_price",
  "existing_member_price",
  "same_cart_member_price",
  "assigned_member_price",
  "limit_exceeded",
  "PackageTaxPolicy",
  "PackageTaxPolicyInput",
  "PackageTaxPolicyType",
  "PackageTaxGroup",
  "PackageTaxGroupQuantity",
  "OrderTaxGroup",
  "OrderTaxGroupSource",
  "tax_policies",
  "tax_groups",
  "group_share",
  "tax_policy_mismatch",
  "continue_without_term",
  "counts_as",
  "PackageMinimumVariant",
  "PackageOfferingStatus",
  "different_bases",
  "PackageMemberTermsSource",
  "PackageMemberSelfTermsSource",
  "source_revision_id",
  "amend_terms",
  "ExperimentEligibility",
  "ExperimentAssignment",
  "StoreUsage",
  "BookingCapacityClaim",
  "BookingResourceCapacityDay",
  "CheckoutPayment",
  "CalendarDateRange",
  "CartLineItemType",
  "TypedCustomerActionKey",
  "FindOrderNotesParams",
  "CreateOrderNoteParams",
  "UpdateOrderNoteParams",
  "DeleteOrderNoteParams",
  "FindCustomerNotesParams",
  "CreateCustomerNoteParams",
  "UpdateCustomerNoteParams",
  "DeleteCustomerNoteParams",
  "FindCompanyNotesParams",
  "CreateCompanyNoteParams",
  "UpdateCompanyNoteParams",
  "DeleteCompanyNoteParams",
  "FindFormSubmissionNotesParams",
  "CreateFormSubmissionNoteParams",
  "UpdateFormSubmissionNoteParams",
  "DeleteFormSubmissionNoteParams",
  "FindConversationNotesParams",
  "CreateConversationNoteParams",
  "UpdateConversationNoteParams",
  "DeleteConversationNoteParams",
  "StorefrontCountryState",
  "StorefrontCountry",
  "StorefrontGetCountryParams",
  "CustomerSessionInternal",
  "ArkyStoreContext",
  "ImportCustomerFieldError",
  "rows_valid",
  "rows_invalid",
  "customers_updated",
  "ApiKeyType",
  "secretKey",
];

const removedIdentifierPattern = new RegExp(`\\b(?:${removedIdentifiers.join("|")})\\b`, "g");
const inventedIdPattern = /\b(?:randomUUID|uuidv4|nanoid)\s*\(/g;

function listTypeScriptFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...listTypeScriptFiles(path));
    else if (entry.endsWith(".ts")) files.push(path);
  }
  return files;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " ")).replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function lineNumberAt(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

let failures = 0;

function report(file, source, offset, message) {
  console.error(`${relative(root, file)}:${lineNumberAt(source, offset)}: ${message}`);
  failures++;
}

for (const file of listTypeScriptFiles(sourceDir)) {
  const source = stripComments(readFileSync(file, "utf8"));
  for (const match of source.matchAll(removedIdentifierPattern)) {
    report(file, source, match.index ?? 0, `${match[0]} belongs to a record or call the plan deleted`);
  }
  for (const match of source.matchAll(inventedIdPattern)) {
    report(file, source, match.index ?? 0, "the SDK never invents ids; the app picks them");
  }
}

function read(path) {
  const file = resolve(sourceDir, path);
  return { file, source: readFileSync(file, "utf8") };
}

function requirePattern(path, pattern, message) {
  const { file, source } = read(path);
  if (!pattern.test(source)) report(file, source, 0, message);
}

function forbidPattern(path, pattern, message) {
  const { file, source } = read(path);
  const match = source.match(pattern);
  if (match) report(file, source, match.index ?? 0, message);
}

requirePattern("api/notification.ts", /export const createOutgoingEmailApi\b/, "outgoing email history has its own surface");
requirePattern("api/notification.ts", /export const createOutgoingWebhookApi\b/, "outgoing webhook history has its own surface");
requirePattern("api/notification.ts", /export const createEmailProviderApi\b/, "email provider exposes live domain discovery");
requirePattern("api/notification.ts", /export const createEmailAddressApi\b/, "email addresses replace email senders and support channels");
requirePattern("api/broadcast.ts", /export const createBroadcastApi\b/, "broadcasts replace campaigns");
requirePattern("api/support.ts", /support-flows/, "support flows replace support agents");
requirePattern("api/payment.ts", /incoming-webhooks/, "incoming webhooks have a dedicated history");
requirePattern("api/platform.ts", /\/v1\/platform\/administrators\/me/, "platform administrators read their own record");
forbidPattern("index.ts", /X-Arky-Sales-Channel/i, "a storefront request sells through its key's channel and names none");
requirePattern("index.ts", /"X-Arky-Locale"/, "storefront requests name their language");
requirePattern("api/storefront.ts", /export interface RequestCustomerCodeRequest\s*\{\s*id:\s*string;\s*contact:\s*EmailContact;\s*bot_check_token\?:\s*string;\s*\}/,
  "a sign-in code request requires id and the email contact with optional bot-check proof");
requirePattern("api/storefront.ts", /\/customer\/request-code`,\s*\{\s*id:\s*params\.id,\s*contact:\s*\{\s*email:\s*params\.contact\.email,\s*language:\s*params\.contact\.language\s*\},\s*bot_check_token:\s*params\.bot_check_token\s*,?\s*\}/,
  "a sign-in code request posts the caller's id, the email contact with its explicit language and optional bot-check proof");
forbidPattern("types/market.ts", /export interface CreateStorefrontKeyParams\s*\{[^}]*publishable_key/,
  "Arky generates the publishable key; the create carries none");
requirePattern("api/order.ts", /resend-receipt`,\s*\{\s*id:\s*params\.id,\s*expected_updated_at:\s*params\.expected_updated_at\s*\}/, "a receipt resend posts the app's id and exact retained Order version");
forbidPattern("types/storeRole.ts", /"contact"/, "store permissions use \"email\"");
requirePattern("api/store.ts", /storePath\(params\.store_id, "usage"\)/, "the owner's billing screen reads the store's usage");
requirePattern("api/store.ts", /"subscription\/end-grant"/, "platform administrators end a granted plan");
requirePattern("api/order.ts", /line_item_id, "attend"\)/, "staff mark a booking attended through its attend route");
requirePattern("api/fulfillment.ts", /\/cash-collections`/, "a pickup clerk records collected cash on the fulfillment job");
requirePattern("api/storefront.ts", /\/customer\/me\/unsubscribe`/, "a signed-in customer unsubscribes on the storefront");
requirePattern("api/storefront.ts", /\/promotions\/\$\{segment\(params\.id\)\}`/, "a storefront reads a promotion's key and blocks by id");
requirePattern("api/notification.ts", /replaceKey\(/, "a store replaces its Resend key on the same provider");
requirePattern("api/support.ts", /\/chat-visibility`/, "staff show or hide a received email in the chat");
requirePattern("api/return.ts", /\/execute`/, "return actions post to the return's execute route");
requirePattern("api/fulfillment.ts", /\$\{jobPath\(params\.store_id, params\.fulfillment_job_id\)\}\/execute`/, "fulfillment job commands post to the job's execute route");
requirePattern("api/fulfillment.ts", /\$\{fulfillmentPath\(params\.store_id, params\.fulfillment_id\)\}\/execute`/, "fulfillment commands post to the fulfillment's execute route");
requirePattern("api/rental.ts", /"rentals", params\.id\)\}\/execute`/, "rental commands post to the rental's execute route");
requirePattern("api/paymentOption.ts", /stripeAction\(params\.store_id, params\.id, "webhook-secret"/, "a Stripe option saves the webhook signing secret the merchant pasted");
requirePattern("api/paymentOption.ts", /stripePath\(params\.store_id, params\.id, "setup"\)/, "staff check a Stripe option's webhook setup");
requirePattern("api/paymentOption.ts", /\/monri\/\$\{segment\(params\.id\)\}\/replace-merchant-key`/, "a Monri option takes a new merchant key");
requirePattern("api/notification.ts", /"email-providers", params\.id\)\}\/setup`/, "staff check a Resend connection's webhook setup");
requirePattern("api/paymentOption.ts", /\/arky-stripe`/, "a test store connects ArkyStripe with a keyless call");
requirePattern("api/paymentOption.ts", /\/arky-monri`/, "a test store connects ArkyMonri with a keyless call");
requirePattern("api/notification.ts", /"email-providers\/arky-resend"/, "a test store connects ArkyResend with a keyless call");
requirePattern("paymentSimulator.ts", /\$\{runsOn\.api_url\}\/v1\/simulator\/payments/, "simulatePayment posts to the address the payment's own answer names");
forbidPattern("paymentSimulator.ts", /127\.0\.0\.1|localhost/, "simulatePayment works against any Arky, never only a local one");
requirePattern("api/payment.ts", /\/refunds\/made`/, "staff record a refund already made in Monri's back office");
requirePattern("api/cart.ts", /"offer\/quote"/, "staff read an offer's quote before making it");
requirePattern("api/content.ts", /"collections", params\.id\)\}\/cleanup`/, "staff follow a deleting collection's cleanup");
requirePattern("api/broadcast.ts", /"\/v1\/broadcasts\/unsubscribe"/, "a store's own unsubscribe page posts the token through the SDK");
requirePattern("index.ts", /broadcast: createStorefrontBroadcastApi\(publishableKeyHttpClient\)/, "the storefront client unsubscribes with the publishable key alone");
requirePattern("api/company.ts", /export function createStorefrontCompanyApi\b/, "company members manage their company from the storefront");
requirePattern("api/storefront.ts", /companies: createStorefrontCompanyApi\(/, "storefront company calls answer the member copies without blocks");
forbidPattern("api/storefront.ts", /orders\/\$\{segment\(params\.order_id\)\}\/product-items/, "customers cancel booking items only; staff cancel product items");
requirePattern("api/return.ts", /\/credit`/, "a received return is credited through its own route");
requirePattern("api/payment.ts", /\/resolve-charge`/, "a team member settles an unknown Monri card charge");
requirePattern("api/media.ts", /isDefiniteRefusal\(error\)/, "a refused upload releases the saved media create");
requirePattern("services/createHttpClient.ts", /payload\.validation_errors/, "the Server sends validation_errors in snake_case");
forbidPattern("types/forms.ts", /export interface StorefrontFormSubmission \{[^}]*\bstage:/, "the storefront submission copy carries stage_id");
forbidPattern("api/storefront.ts", /\/quote`,\s*\{\s*language/, "storefront quotes take their language from X-Arky-Locale");
requirePattern("services/cartSelection.ts", /target_cart_id/, "a signed-in customer's cart selection follows the merged guest cart");
requirePattern("api/storefront.ts", /cartSelection\.signedIn\(/, "verify records the sign-in so the cart selection can follow the merged guest cart");
requirePattern("api/storefront.ts", /cartSelection\.reorder\(/, "a reordered cart becomes the cart selection, as a created one does");
requirePattern("types/package.ts", /export interface StorefrontPackage \{[^}]*\bitems: StorefrontPackageItemTerms\[\];/, "a storefront package read lists its automatic items");
forbidPattern("types/package.ts", /export type StorefrontPackageItemTermsType =(?:(?!\n\nexport )[\s\S])*\ballocation_weight\b/, "a storefront package read hides allocation_weight");
requirePattern("types/packageMember.ts", /export interface SwitchPackageMemberParams extends PackageMemberActionParams \{[^}]*\bprice: PackagePriceRef;/, "a package switch names the exact price reference it is priced from");
forbidPattern("types/packageMember.ts", /export interface SwitchPackageMemberParams extends PackageMemberActionParams \{[^}]*\brentals\b/, "rentals move by one rule when the new terms start; a switch names none");
requirePattern("types/package.ts", /export interface StorefrontPrice \{\s*package_id: string;\s*package_item_id: string;\s*price_id: string;/, "a storefront price carries the full reference a cart line names");
requirePattern("types/cart.ts", /export interface CartProductLineItem \{[^}]*\bprice: PackagePriceRef;/, "a product cart line names its exact price, as booking and package lines do");
requirePattern("types/cart.ts", /export interface CartProductLineItemInput \{[^}]*\bprice: PackagePriceRef;/, "a new product cart line names its exact price");
requirePattern("services/cartSelection.ts", /export function cartScopeKey\(scope: StorefrontCurrentCartParams, market: string \| null\)/, "a cart scope is one buyer, package and market");
requirePattern("services/freeJoin.ts", /joined\.items\.length/, "a free sign-up is a never-renewing package with no automatic items");
requirePattern("api/package.ts", /\/prices\/all`/, "one command archives or schedules all of an item's prices");
forbidPattern("api/cart.ts", /(?:member-price|access-product)-preview/, "member prices are ordinary items and promotions; no cart previews them");
forbidPattern("api/storefront.ts", /(?:member-price|access-product)-preview/, "member prices are ordinary items and promotions; no cart previews them");
forbidPattern("api/packageMember.ts", /\/(?:member-prices|limits)`/, "a package member has no member prices or limits to read");
forbidPattern("types/package.ts", /export interface PackageItemPriceEntry \{[^}]*\bsellable\b/, "a stored price names its choice through its wrapper, never a sellable of its own");
requirePattern("types/package.ts", /export interface PackageItemPrice extends PackageItemPriceEntry \{[^}]*\bsellable: SellableRef;/, "a price answer names its choice as the sellable the Server derives from its wrapper");
requirePattern("types/package.ts", /export interface PackageProductPrice \{\s*variant_id: string;\s*price: PackageItemPriceEntry;\s*\}/, "a product item's price names its variant");
requirePattern("types/package.ts", /export interface PackageBookingPrice \{\s*booking_offering_id: string;\s*price: PackageItemPriceEntry;\s*\}/, "a booking service item's price names its offering");
requirePattern("types/package.ts", /\{ type: "package"; market_id: string; package_id: string; price: PackageItemPriceEntry \}/, "a Package item holds exactly one price");
requirePattern("types/package.ts", /\{ type: "package"; package_id: string; price: PackageItemPriceInput \}/, "a plan is listed together with its one price");
for (const priced of ["PackagePricedItemType", "PackageItemRef", "PackageItemRecordType"]) {
  forbidPattern("types/package.ts", new RegExp(`export type ${priced} =(?:(?!\\n\\nexport )[\\s\\S])*package_offering`), "an offering is a family of plans, never a priced item");
}
forbidPattern("types/package.ts", /export interface PackageAccess \{[^}]*\bupdated_at\b/, "an access row is only created or deleted, so it has no version");
forbidPattern("types/package.ts", /export interface DeletePackageAccessParams \{[^}]*\bexpected_updated_at\b/, "an access row's delete names only its id");
forbidPattern("types/package.ts", /export interface FindPackageAccessesParams \{[^}]*\bsort_field\b/, "access rows list by created_at only");
forbidPattern("types/package.ts", /type: "(?:once|repeating)"/, "deliveries are once_per_period or repeating_in_period");
requirePattern("types/package.ts", /type: "once_per_period"; offset_days: number; window_days: number/, "a delivery once per period opens one window");
requirePattern("types/package.ts", /type: "repeating_in_period";/, "a delivery repeating in a period opens a window per step");
requirePattern("types/package.ts", /\{ type: "variants"; variant_ids: string\[\] \}/, "a Variants minimum lists variants that count by their measure");
requirePattern("types/package.ts", /export interface PackageItemPriceSummary \{\s*basis: PackageItemPriceBasis;\s*min_amount: number;\s*max_amount: number;\s*price_count: number;\s*\}/, "an item's prices share one basis, so its price summary has one shape");
requirePattern("types/package.ts", /export interface StorefrontPackage \{[^}]*\bpackage_offering_id: string \| null;/, "a storefront package names the offering it belongs to");
forbidPattern("types/packageMember.ts", /export interface StorefrontPackageOffering \{[^}]*\bpackage_item_id\b/, "an offering detail lists the plans the shop sells, not an item");
forbidPattern("types/packageMember.ts", /export interface PackageOffering \{[^}]*\bstatus\b/, "an offering has no status; each plan sells under its own");
forbidPattern("types/packageMember.ts", /export interface PackageMember(?:Self)?AcceptedTerms \{[^}]*\bchoices\b/, "accepted terms keep only the variant each frozen get_product gives");
requirePattern("types/packageMember.ts", /type: "get_product";\s*package_item_id: string;\s*variant_id: string;/, "a frozen get_product holds the one variant the member gets");
forbidPattern("types/order.ts", /export type LineTaxTreatment =(?:(?!\n\nexport )[\s\S])*\b(?:reverse_charge|buyer_exempt)\b/, "a buyer's treatment is a LineTax of its own, never inside an own tax");
requirePattern("types/packageMember.ts", /export interface SwitchPackageMemberParams extends PackageMemberActionParams \{[^}]*\bdeliveries: PackageDeliveryTerms\[\];/, "a renewing move names a delivery for each shipping profile the member's terms don't deliver");
for (const terms of ["PackageMemberAcceptedTerms", "PackageMemberSelfAcceptedTerms", "StorefrontChangePackageMemberTermsParams"]) {
  requirePattern("types/packageMember.ts", new RegExp(`export interface ${terms}(?: extends [A-Za-z]+)? \\{[^}]*\\bpurchase_order_number: string \\| null;`), "a member's terms carry the purchase order number its renewals use");
}
requirePattern("types/packageMember.ts", /export interface PackageMemberRevision \{[^}]*\bterms: PackageMemberAcceptedTerms;/, "a revision holds its accepted terms in full");
requirePattern("types/packageMember.ts", /export interface PackageMemberRevisionSelf \{[^}]*\bterms: PackageMemberSelfAcceptedTerms;/, "a buyer's revision holds its accepted terms in full");
for (const change of ["PackageMemberRevisionChange", "PackageMemberSelfRevisionChange"]) {
  requirePattern("types/packageMember.ts", new RegExp(`export type ${change} =\\s*\\| \\{ type: "own_terms" \\}\\s*\\| \\{ type: "package_change" \\}\\s*\\| \\{ type: "upgrade" \\}\\s*\\| \\{ type: "amend" \\}\\s*\\| \\{ type: "minimum" \\};`), "a revision's change kind says what happened");
}
requirePattern("api/packageMember.ts", /\/switch-delivery-options\/\$\{segment\(delivery_id\)\}`/, "a storefront lists the rates a switch's new delivery can take");
requirePattern("types/cart.ts", /\{ type: "package_change_refused"; line_item_id: string; code: string \}/, "a Switch or Amend line's quote names the change's own refusal");
requirePattern("types/cart.ts", /\{ type: "payment_unavailable"; code: string \}/, "a quote names why no payment option can pay its cart");
for (const blocker of ["package_change_refused", "payment_unavailable"]) {
  requirePattern("storefrontStore/checkoutFlow.ts", new RegExp(`const lineBlockers: QuoteBlocker\\["type"\\]\\[\\] = \\[[^\\]]*"${blocker}"`), `${blocker} shows the cart step, where the buyer changes the cart`);
}
requirePattern("types/order.ts", /export type OrderBuyerTax =(?:(?!\n\nexport )[\s\S])*\{ type: "exempt"; reason: string; registrations: OrderTaxRegistration\[\] \}/,"an exempt buyer's Order keeps its Verified registrations, as a standard buyer's does");
forbidPattern("types/forms.ts", /export interface FormSubmissionStageChange \{[^}]*\bnote_id\b/, "a stage change names no note; its reason is a note that names the change");
requirePattern("types/note.ts", /type: "form_submission_stage_change";\s*form_submission_id: string;\s*changed_at: EpochMilliseconds;/, "a stage change's reason note names the change it explains");
forbidPattern("types/payment.ts", /export interface ResendEvent \{[^}]*\bstore_id\b/, "a store's Resend post keeps its store once, on the post");

for (const route of ["categories", "products", "booking-services"]) {
  requirePattern("api/storefront.ts", new RegExp(`\\$\\{storefrontBase\\}/${route}/by-key/`), `storefront ${route} are read by key through their by-key route`);
}
forbidPattern("api/storefront.ts", /"key" in params \? params\.key : params\.slug/, "the plain storefront category read takes an id or a slug, never a key");

if (failures > 0) {
  console.error(`Found ${failures} public SDK surface issue(s).`);
  process.exit(1);
}
