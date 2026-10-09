#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sourceDir = resolve(root, "src");

const removedIdentifiers = [
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

requirePattern("api/notification.ts", /export const createNotificationApi\b/, "notifications replace message deliveries");
requirePattern("api/notification.ts", /export const createEmailDomainApi\b/, "email domains need their calls");
requirePattern("api/notification.ts", /export const createEmailSenderApi\b/, "email senders need their calls");
requirePattern("api/broadcast.ts", /export const createBroadcastApi\b/, "broadcasts replace campaigns");
requirePattern("api/support.ts", /support-flows/, "support flows replace support agents");
requirePattern("api/payment.ts", /provider-events/, "provider events replace provider notifications");
requirePattern("api/platform.ts", /\/v1\/platform\/administrators\/me/, "platform administrators read their own record");
requirePattern("index.ts", /"X-Arky-Sales-Channel"/, "storefront requests name their sales channel");
requirePattern("index.ts", /"X-Arky-Locale"/, "storefront requests name their language");
requirePattern("api/storefront.ts", /request-code`,\s*\{\s*id:\s*params\.id,\s*email:\s*params\.email,\s*language:\s*params\.language\s*\}/,
  "a sign-in code request names the email id and the language");
forbidPattern("types/market.ts", /export interface CreateStorefrontClientParams\s*\{[^}]*publishable_key/,
  "Arky generates the publishable key; the create carries none");
requirePattern("api/order.ts", /resend-receipt`,\s*\{\s*id:\s*params\.id\s*\}/, "a receipt resend posts only the app's id");
forbidPattern("types/storeRole.ts", /"contact"/, "store permissions use \"email\"");
requirePattern("api/store.ts", /storePath\(params\.store_id, "usage"\)/, "the owner's billing screen reads the store's usage");
requirePattern("api/store.ts", /"subscription\/end-grant"/, "platform administrators end a granted plan");
requirePattern("api/subscription.ts", /\/purchase-access`/, "staff read a subscription's purchase access");
requirePattern("api/return.ts", /\/execute`/, "return actions post to the return's execute route");
requirePattern("api/return.ts", /\/credit`/, "a received return is credited through its own route");
requirePattern("api/payment.ts", /\/resolve-charge`/, "a team member settles an unknown Monri card charge");
requirePattern("api/media.ts", /isDefiniteRefusal\(error\)/, "a refused upload releases the saved media create");
requirePattern("services/createHttpClient.ts", /payload\.validation_errors/, "the Server sends validation_errors in snake_case");
forbidPattern("types/forms.ts", /export interface StorefrontFormSubmission \{[^}]*\bstage:/, "the storefront submission copy carries stage_id");
forbidPattern("api/storefront.ts", /\/quote`,\s*\{\s*language/, "storefront quotes take their language from X-Arky-Locale");
requirePattern("services/cartSelection.ts", /target_cart_id/, "a signed-in customer's cart selection follows the merged guest cart");
requirePattern("api/storefront.ts", /cartSelection\.signedIn\(/, "verify records the sign-in so the cart selection can follow the merged guest cart");
requirePattern("api/storefront.ts", /cartSelection\.reorder\(/, "a reordered cart becomes the cart selection, as a created one does");
requirePattern("types/subscription.ts", /export interface StorefrontSubscriptionPlan \{[^}]*\bentitlements: StorefrontSubscriptionPlanEntitlement\[\];/, "the storefront plan card lists the card copy of its entitlements");
forbidPattern("types/subscription.ts", /export interface StorefrontSubscriptionPlanEntitlement \{[^}]*\ballocation_weight\b/, "the storefront plan card hides allocation_weight");
requirePattern("types/subscription.ts", /export interface SubscriptionPlanChange extends SubscriptionChangeVersion \{[^}]*\bcatalog_id\?: string;/, "a plan switch may name the catalog it is priced from");

for (const route of ["categories", "products", "booking-services"]) {
  requirePattern("api/storefront.ts", new RegExp(`\\$\\{base\\}/${route}/by-key/`), `storefront ${route} are read by key through their by-key route`);
}
forbidPattern("api/storefront.ts", /"key" in params \? params\.key : params\.slug/, "the plain storefront category read takes an id or a slug, never a key");

if (failures > 0) {
  console.error(`Found ${failures} public SDK surface issue(s).`);
  process.exit(1);
}
