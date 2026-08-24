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
  "OrderPaymentType",
  "ProviderOrderPayment",
  "OrderRefundType",
  "OrderRefundAllocation",
  "ProviderOrderDispute",
  "OrderDispute",
  "FindOrderDisputesParams",
  "GetOrderDisputeParams",
  "Discount",
  "Condition",
  "ShippoLabelStatus",
  "ShippoLabel",
  "ShippoLabelRefundStatus",
  "ShippoLabelRefund",
  "ProviderOrderShipmentCharge",
  "OrderShipmentCharge",
  "OrderShipmentChargeDirection",
  "OrderShipmentChargeStatus",
  "OrderShipmentChargeType",
  "RetryOrderShipmentParams",
  "RequestShippoLabelRefundParams",
  "RetryShippoLabelRefundParams",
  "FindOrderShipmentChargesParams",
  "GetOrderShipmentChargeParams",
  "RetryOrderShipmentChargeParams",
  "Action",
  "ActionData",
  "ActionContext",
  "ActionLocation",
  "ActionDevice",
  "ActionSession",
  "SocialActionAuthor",
  "FindActionsParams",
  "TimelineParams",
  "StorefrontAction",
  "TrackActionParams",
  "CommonActionKey",
  "AnalyticsActionReportKey",
  "ActionFeedCategory",
  "ActionFeedItem",
  "ActionFeedSummary",
  "ActionFeedCursor",
  "ActionFeedData",
  "createActionAdminApi",
  "createActionApi",
  "COMMON_ACTION_KEYS",
  "UpdateFormSubmissionParams",
  "updateSubmission",
  "CartProduct",
  "CartBooking",
  "CartDigitalProduct",
  "CartDigitalProductInput",
  "TrustedCartDigitalProductInput",
  "OrderProduct",
  "OrderDigitalProduct",
  "OrderDigitalProductSnapshot",
  "OrderProductStatus",
  "OrderProductFulfillmentStatus",
  "OrderFulfillmentStatus",
  "OrderFulfillmentSummary",
  "ShippingLine",
  "OrderTaxSnapshot",
  "OrderTaxLine",
  "OrderTaxScope",
  "CancelOrderProductParams",
  "AudiencePromotionUsageStatus",
  "TextBlockProperties",
  "MarkdownBlockProperties",
  "NumberBlockProperties",
  "ContainerBlockProperties",
  "MediaBlockProperties",
  "EntryBlockProperties",
  "ResourceBlockProperties",
  "GeoLocationBlockProperties",
  "getOrderProducts",
  "getOrderDigitalProducts",
  "cancelOrderProduct",
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
const removedOrderPaymentContractPatterns = [
  /export interface OrderPayment\s*\{[^}]*\b(?:version|type|amount|currency|paid_amount|refund_pending_amount|refunded_amount|marked_paid_by_account_id|checkout_expires_at|processing_started_at|processing_claim_id|processing_deadline_at)\??:/g,
  /export interface OrderCheckoutResult\s*\{[^}]*\bpayment:\s*OrderPayment\s*;/g,
  /export interface Order\s*\{[^}]*\bpayment_id:\s*string\s*;/g,
];
const removedOrderRefundContractPatterns = [
  /export interface OrderRefund\s*\{[^}]*\b(?:version|type|amount|currency)\??:/g,
  /export type RefundAllocation\s*=[^;]*\b(?:order_product_id|order_booking_id|order_digital_product_id|shipping_line_id)\b/g,
  /export interface CreateOrderRefundResponse\s*\{[^}]*\bamount\??:/g,
];
const removedPaymentDisputeContractPatterns = [
  /export interface PaymentDispute\s*\{[^}]*\b(?:version|amount|currency)\??:/g,
  /export interface PaymentDispute\s*\{[^}]*\bstatus\?:/g,
  /export type PaymentDisputeProvider\s*=[^;]*\btransaction_id\b/g,
];
const removedBookingVocabularyPattern =
  /\b(?:working_days|specific_dates|min_advance|max_advance|slot_interval|provider_key|booking_provider_id)\b|service-providers|order_booking\./g;
const removedPromotionVocabularyPattern =
  /\b(?:items_percentage|items_fixed|digital_product_ids|min_order_amount|date_range|max_uses|max_uses_per_user|discount_application_id|starts_at_from|starts_at_to|expires_at_from|expires_at_to)\b|type:\s*["']services["']|\bbps\b/g;
const removedBookingQuotaFeaturePattern =
  /export type SubscriptionPlanFeatureType\s*=[^;]*\|\s*["'](?:services|providers)["'][^;]*;/g;
const removedShippingProviderVocabularyPattern =
  /\b(?:Shippo[A-Za-z0-9_]*|managed_account_id|shippo_account_id|shippo_token)\b/g;
const removedShippingContractPatterns = [
  /export interface FulfillmentOrderLine\s*\{[^}]*\b(?:order_product_id|remaining_quantity)\??:/g,
  /export interface FulfillmentOrder\s*\{[^}]*\b(?:version|location_id)\??:/g,
  /export interface ShippingRateLine\s*\{[^}]*\border_product_id\??:/g,
  /export interface OrderShipmentLine\s*\{[^}]*\border_product_id\??:/g,
  /export interface OrderShipment\s*\{[^}]*\b(?:version|location_id|shippo_label|attempt_count|provider)\??:/g,
  /export interface ShippingLabel(?:Refund|Charge|ChargeRefund)?\s*\{[^}]*\b(?:version|rate_id|transaction_id|refund_id|postage_amount|fee_amount|currency|attempt_count|provider)\??:/g,
  /export interface ShippingRate\s*\{[^}]*\b(?:amount|currency)\??:/g,
  /\/shippo-label\b|\/shipments\/[^\s`"']+\/retry\b|\/charges(?:\/|`|"|')/g,
];
const removedCrmActionVocabularyPattern =
  /\b(?:has_action|goal_action_key|action_id|opportunity_action_id|action_by_country|top_action_pages|recent_action)\b|\/actions\b|["']actions["']|\b(?:crmApi|storefrontApi|client)\.action\b/g;
const removedActivityMutationPattern =
  /export interface Activity\s*\{[^}]*\bupdated_at\??:/g;
const removedCartOrderContractPatterns = [
  /export interface Cart\s*\{[^}]*\bforms\??:/g,
  /export interface Order\s*\{[^}]*\b(?:version|verified|forms|fulfillment_status|fulfillment_summary)\??:/g,
  /export interface AudiencePromotionSnapshot\s*\{[^}]*\busage_status\??:/g,
  /export type CheckoutPaymentAction\s*=[\s\S]*?\bstripe_account_id\??:[\s\S]*?(?=\nexport\s)/g,
  /["']order_product\./g,
  /["']order_digital_product\./g,
  /\/orders\/\$\{params\.order_id\}\/products(?:\/|`)/g,
  /\/orders\/\$\{params\.order_id\}\/digital-products(?:\/|`)/g,
];
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

  for (const pattern of removedOrderPaymentContractPatterns) {
    for (const match of source.matchAll(pattern)) {
      report(file, source, match.index, "removed Order Payment contract field");
      failures++;
    }
  }

  for (const pattern of removedOrderRefundContractPatterns) {
    for (const match of source.matchAll(pattern)) {
      report(file, source, match.index, "removed Order Refund contract field");
      failures++;
    }
  }

  for (const pattern of removedPaymentDisputeContractPatterns) {
    for (const match of source.matchAll(pattern)) {
      report(file, source, match.index, "removed Payment Dispute contract field");
      failures++;
    }
  }

  for (const match of source.matchAll(removedBookingVocabularyPattern)) {
    report(file, source, match.index, `removed booking vocabulary ${match[0]}`);
    failures++;
  }

  for (const match of source.matchAll(removedPromotionVocabularyPattern)) {
    report(file, source, match.index, `removed Promotion vocabulary ${match[0]}`);
    failures++;
  }

  for (const match of source.matchAll(removedBookingQuotaFeaturePattern)) {
    report(file, source, match.index, "removed Booking quota feature key");
    failures++;
  }

  for (const match of source.matchAll(removedShippingProviderVocabularyPattern)) {
    report(file, source, match.index, `provider-specific Shipping vocabulary ${match[0]}`);
    failures++;
  }

  for (const pattern of removedShippingContractPatterns) {
    for (const match of source.matchAll(pattern)) {
      report(file, source, match.index, "removed Shipping contract");
      failures++;
    }
  }

  for (const match of source.matchAll(removedCrmActionVocabularyPattern)) {
    report(file, source, match.index, `removed CRM Action vocabulary ${match[0]}`);
    failures++;
  }

  for (const match of source.matchAll(removedActivityMutationPattern)) {
    report(file, source, match.index, "immutable Activity exposes updated_at");
    failures++;
  }

  for (const pattern of removedCartOrderContractPatterns) {
    for (const match of source.matchAll(pattern)) {
      report(file, source, match.index, "removed Cart/Order checkout contract");
      failures++;
    }
  }

  for (const match of source.matchAll(exportedDeclarationPattern)) {
    const name = match[1];
    if (!/\d$/.test(name)) continue;
    report(file, source, match.index, `numbered public declaration ${name}`);
    failures++;
  }
}

const activityTypesFile = resolve(sourceDir, "types/index.ts");
const activityTypesSource = readFileSync(activityTypesFile, "utf8");

const propertylessBlockNames = [
  "TextBlock",
  "MarkdownBlock",
  "NumberBlock",
  "BooleanBlock",
  "DateBlock",
  "GeoLocationBlock",
  "MediaBlock",
  "EntryBlock",
  "FormBlock",
  "ProductBlock",
  "DigitalProductBlock",
  "ArrayBlock",
  "ObjectBlock",
];
for (const name of propertylessBlockNames) {
  const contract = activityTypesSource.match(
    new RegExp(`export interface ${name}\\s+extends BlockBase\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  if (!contract || /\n\s*properties\??:/.test(contract[1])) {
    report(
      activityTypesFile,
      activityTypesSource,
      contract?.index ?? 0,
      `${name} must exist without value-side properties`,
    );
    failures++;
  }
}

const markdownBlockContract = activityTypesSource.match(
  /export interface MarkdownBlock\s+extends BlockBase\s*\{([\s\S]*?)\n\}/,
);
if (
  !markdownBlockContract ||
  !/\n\s*value:\s*string\s*\|\s*null;/.test(markdownBlockContract[1])
) {
  report(
    activityTypesFile,
    activityTypesSource,
    markdownBlockContract?.index ?? 0,
    "MarkdownBlock must expose one nullable scalar string",
  );
  failures++;
}

for (const typeName of ["BlockType", "BlockSchemaType"]) {
  const contract = activityTypesSource.match(
    new RegExp(`export type ${typeName}\\s*=([\\s\\S]*?);`),
  );
  if (!contract || !/\|\s*["']form["']/.test(contract[1])) {
    report(
      activityTypesFile,
      activityTypesSource,
      contract?.index ?? 0,
      `${typeName} must include form`,
    );
    failures++;
  }
}

const activityContract = activityTypesSource.match(
  /export interface Activity\s*\{([\s\S]*?)\n\}/,
);
if (
  !activityContract ||
  !/\n\s*canonical_contact_id:\s*string;/.test(activityContract[1])
) {
  report(
    activityTypesFile,
    activityTypesSource,
    activityContract?.index ?? 0,
    "Activity must expose required canonical_contact_id",
  );
  failures++;
}

const checkoutPaymentActionContract = activityTypesSource.match(
  /export type CheckoutPaymentAction\s*=([\s\S]*?)(?=\nexport\s)/,
);
if (
  !checkoutPaymentActionContract ||
  !/\n\s*connected_account_id:\s*string;/.test(
    checkoutPaymentActionContract[1],
  )
) {
  report(
    activityTypesFile,
    activityTypesSource,
    checkoutPaymentActionContract?.index ?? 0,
    "Stripe CheckoutPaymentAction must require connected_account_id",
  );
  failures++;
}

const storeSubscriptionCheckoutActionContract = activityTypesSource.match(
  /export type StoreSubscriptionCheckoutAction\s*=([\s\S]*?)(?=\nexport\s)/,
);
if (
  !storeSubscriptionCheckoutActionContract ||
  !/\n\s*stripe_account_id:\s*string\s*\|\s*null;/.test(
    storeSubscriptionCheckoutActionContract[1],
  )
) {
  report(
    activityTypesFile,
    activityTypesSource,
    storeSubscriptionCheckoutActionContract?.index ?? 0,
    "Store subscription Checkout action must retain nullable stripe_account_id",
  );
  failures++;
}

const storeSubscriptionContract = activityTypesSource.match(
  /export interface StoreSubscription\s*\{([\s\S]*?)\n\}/,
);
if (
  !storeSubscriptionContract ||
  !/\n\s*payment_action:\s*StoreSubscriptionCheckoutAction;/.test(
    storeSubscriptionContract[1],
  )
) {
  report(
    activityTypesFile,
    activityTypesSource,
    storeSubscriptionContract?.index ?? 0,
    "StoreSubscription must use its distinct Checkout action",
  );
  failures++;
}

if (failures > 0) {
  console.error(`Found ${failures} public SDK surface issue(s).`);
  process.exit(1);
}
