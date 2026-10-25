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
  "CustomerGroupEmailConsent",
  "CustomerGroupConsentEvent",
  "createCustomerGroupEmailConsentApi",
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
  "SubscriptionPlanEntitlementStatus",
  "createSubscriptionPlanEntitlementApi",
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
  "SkipNextCustomerGroupMemberPurchaseParams",
  "StorefrontSkipNextCustomerGroupMemberPurchaseParams",
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
  "CustomerGroupProductOptionLabel",
  "OrderVariantOption",
  "FindStorefrontProductsParams",
  "FindStorefrontProductVariantsParams",
  "FindStorefrontBookingServicesParams",
  "FindStorefrontBookingOfferingsParams",
  "FindStorefrontBookingResourcesParams",
  "FindStorefrontCustomerGroupsParams",
  "StorefrontCartProductLineItemInput",
  "StorefrontCartBookingLineItemInput",
  "StorefrontCartCustomerGroupLineItemInput",
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
requirePattern("api/customerGroup.ts", /\/purchase-access`/, "staff read a customer group member's purchase access");
requirePattern("api/order.ts", /line_item_id, "attend"\)/, "staff mark a booking attended through its attend route");
requirePattern("api/fulfillment.ts", /\/cash-collections`/, "a pickup clerk records collected cash on the fulfillment job");
requirePattern("api/storefront.ts", /\/customer\/me\/unsubscribe`/, "a signed-in customer unsubscribes on the storefront");
requirePattern("api/storefront.ts", /\/promotions\/\$\{segment\(params\.id\)\}`/, "a storefront reads a promotion's key and blocks by id");
requirePattern("api/notification.ts", /replaceKey\(/, "a store replaces its Resend key on the same provider");
requirePattern("api/support.ts", /\/chat-visibility`/, "staff show or hide a received email in the chat");
requirePattern("utils/cartInputs.ts", /case "assigned_purchase_access":/, "an assigned member buys through its group's purchase access");
requirePattern("api/return.ts", /\/execute`/, "return actions post to the return's execute route");
requirePattern("api/fulfillment.ts", /\$\{jobPath\(params\.store_id, params\.fulfillment_job_id\)\}\/execute`/, "fulfillment job commands post to the job's execute route");
requirePattern("api/fulfillment.ts", /\$\{fulfillmentPath\(params\.store_id, params\.fulfillment_id\)\}\/execute`/, "fulfillment commands post to the fulfillment's execute route");
requirePattern("api/rental.ts", /"rentals", params\.id\)\}\/execute`/, "rental commands post to the rental's execute route");
requirePattern("api/paymentOption.ts", /stripeAction\(params\.store_id, params\.id, "webhook-secret"/, "a Stripe option saves the webhook signing secret the merchant pasted");
requirePattern("api/paymentOption.ts", /stripePath\(params\.store_id, params\.id, "setup"\)/, "staff check a Stripe option's webhook setup");
requirePattern("api/paymentOption.ts", /\/monri\/\$\{segment\(params\.id\)\}\/replace-merchant-key`/, "a Monri option takes a new merchant key");
requirePattern("api/notification.ts", /"email-providers", params\.id\)\}\/setup`/, "staff check a Resend connection's webhook setup");
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
requirePattern("types/customerGroup.ts", /export interface StorefrontCustomerGroup \{[^}]*\bentitlements: StorefrontCustomerGroupEntitlement\[\];/, "the storefront group card lists the card copy of its entitlements");
forbidPattern("types/customerGroup.ts", /export interface StorefrontCustomerGroupEntitlement \{[^}]*\ballocation_weight\b/, "the storefront group card hides allocation_weight");
requirePattern("types/customerGroup.ts", /export interface SwitchCustomerGroupMemberParams extends CustomerGroupMemberActionParams \{[^}]*\bcatalog_id: string;[^}]*\bcatalog_item_price_id: string;/, "a group switch names the catalog and the catalog item price it is priced from");
forbidPattern("types/customerGroup.ts", /export interface SwitchCustomerGroupMemberParams extends CustomerGroupMemberActionParams \{[^}]*\brentals\b/, "rentals move by one rule when the new terms start; a switch names none");

for (const route of ["categories", "products", "booking-services"]) {
  requirePattern("api/storefront.ts", new RegExp(`\\$\\{base\\}/${route}/by-key/`), `storefront ${route} are read by key through their by-key route`);
}
forbidPattern("api/storefront.ts", /"key" in params \? params\.key : params\.slug/, "the plain storefront category read takes an id or a slug, never a key");

if (failures > 0) {
  console.error(`Found ${failures} public SDK surface issue(s).`);
  process.exit(1);
}
