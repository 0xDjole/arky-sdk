#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sourceDir = resolve(root, "src");

const removedIdentifiers = [
  "QuoteItemInput",
  "CheckoutItemInput",
  "InviteUserParams",
  "OrderUpdateItem",
  "GetStoreMediaParams2",
  "GeoLocationValue",
  "MailboxProvider",
  "CampaignEnrollmentStepExecutionOutcome",
  "CampaignEnrollmentDraft",
  "ShippingAddress",
  "BuildHookType",
  "Location",
  "CreateLocationParams",
  "UpdateLocationParams",
  "DeleteLocationParams",
  "StoreEmails",
  "StoreLifecycle",
  "StoreUsagePeriod",
  "oldKey",
  "mountStripe",
  "AccountLifecycle",
  "AccountUpdateResponse",
  "AuthCodeVerifyParams",
  "GoogleAuthCompleteParams",
  "GoogleAuthStartResponse",
  "LoginAccountParams",
  "UpdateAccountContactParams",
  "googleComplete",
  "googleStart",
  "updateAccount",
  "PaymentMethod",
  "PaymentMethodType",
  "PaymentProviderType",
  "StoreSubscriptionCheckout",
  "StoreSubscriptionCheckoutStatus",
  "StoreSubscriptionPayment",
  "StoreSubscriptionBillingStatus",
  "GetStoreSubscriptionCheckoutParams",
  "getSubscriptionCheckout",
  "InventoryLevel",
  "getAvailableStock",
  "getFirstAvailableFCId",
  "BookingProvider",
  "ProviderSchedule",
  "ServiceProvider",
  "ServiceStatus",
  "ProviderStatus",
  "WorkingHour",
  "WorkingDay",
  "SpecificDate",
  "OrderBooking",
  "SlotRange",
  "ProviderAvailability",
  "CreateServiceParams",
  "UpdateServiceParams",
  "DeleteServiceParams",
  "GetServiceParams",
  "GetServicesParams",
  "CreateProviderParams",
  "UpdateProviderParams",
  "DeleteProviderParams",
  "GetProviderParams",
  "GetProvidersParams",
  "CreateServiceProviderParams",
  "UpdateServiceProviderParams",
  "DeleteServiceProviderParams",
  "FindServiceProvidersParams",
  "getOrderBookings",
  "findProviders",
  "selectProvider",
  "ArkyServiceStore",
  "ArkyServiceState",
  "ArkyServiceSlot",
  "DigitalCatalogStatus",
  "DigitalPrice",
];

const removedIdentifierPattern = new RegExp(
  `\\b(?:${removedIdentifiers.join("|")})\\b`,
  "g",
);
const forbiddenProviderOperationPattern = /provider(?:_|-)?operations?/gi;
const removedClassificationVocabularyPattern =
  /Taxonom|taxonom|LocalizedText|localized_text/g;
const removedCommercePaymentVocabularyPattern = new RegExp(
  "\\b(?:payment_method_key|payment_methods|setup_status|platform_debits_authorized)\\b",
  "g",
);
const removedProductContractPatterns = [
  /export interface ProductInventory\s*\{[^}]*\b(?:location_id|available)\??:/g,
  /export interface ProductVariant\s*\{[^}]*\bweight\??:/g,
  /export interface Product\s*\{[^}]*\bslug\??:/g,
  /export type ProductInventoryInput\s*=\s*Pick<[^;]*"(?:location_id|available)"/g,
  /export interface (?:Create|Update)ProductVariantInput\s*\{[^}]*\bweight\??:/g,
  /export interface (?:Create|Update)ProductParams\s*\{[^}]*\bslug\??:/g,
];
const removedDigitalContractPatterns = [
  /export interface (?:DigitalProduct|StorefrontDigitalProduct|DigitalLibraryItem|DigitalLibraryProduct)\s*\{[^}]*\bslug\??:/g,
  /export interface (?:Create|Update)DigitalProductParams\s*\{[^}]*\bslug\??:/g,
  /\/digital-products\/assets\b/g,
];
const removedBookingVocabularyPattern =
  /\b(?:working_days|specific_dates|min_advance|max_advance|slot_interval|provider_key|booking_provider_id)\b|service-providers|order_booking\./g;
const exportedDeclarationPattern =
  /\bexport\s+(?:declare\s+)?(?:type|interface|class|enum|function|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\b/g;

function listTypeScriptFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const metadata = statSync(path);
    if (metadata.isDirectory()) {
      files.push(...listTypeScriptFiles(path));
    } else if (entry.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

function lineNumberAt(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function report(file, source, offset, message) {
  console.error(
    `${relative(root, file)}:${lineNumberAt(source, offset)}: ${message}`,
  );
}

let failures = 0;

for (const file of listTypeScriptFiles(sourceDir)) {
  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(removedIdentifierPattern)) {
    report(file, source, match.index, `removed public name ${match[0]}`);
    failures++;
  }

  for (const match of source.matchAll(forbiddenProviderOperationPattern)) {
    report(
      file,
      source,
      match.index,
      `removed provider-operation name ${match[0]}`,
    );
    failures++;
  }

  for (const match of source.matchAll(removedClassificationVocabularyPattern)) {
    report(
      file,
      source,
      match.index,
      `removed Classification/Block vocabulary ${match[0]}`,
    );
    failures++;
  }

  for (const match of source.matchAll(removedCommercePaymentVocabularyPattern)) {
    report(file, source, match.index, `removed Commerce payment field ${match[0]}`);
    failures++;
  }

  for (const pattern of removedProductContractPatterns) {
    for (const match of source.matchAll(pattern)) {
      report(file, source, match.index, "removed Product/Inventory contract field");
      failures++;
    }
  }

  for (const pattern of removedDigitalContractPatterns) {
    for (const match of source.matchAll(pattern)) {
      report(file, source, match.index, "removed Digital Product/Asset contract");
      failures++;
    }
  }

  for (const match of source.matchAll(removedBookingVocabularyPattern)) {
    report(file, source, match.index, `removed booking vocabulary ${match[0]}`);
    failures++;
  }

  for (const match of source.matchAll(exportedDeclarationPattern)) {
    const name = match[1];
    if (!/\d$/.test(name)) continue;
    report(file, source, match.index, `numbered public declaration ${name}`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`Found ${failures} public SDK surface issue(s).`);
  process.exit(1);
}
