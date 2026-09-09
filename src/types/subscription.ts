import type { Currency, PostalAddress } from "./index";
import type { AppliedPriceSnapshot, PurchaseQuoteContext, SubscriptionAudienceSnapshot } from "./commerce";
import type { EpochMilliseconds } from "./time";

export interface SubscriptionPurchaseSelection {
  audience_id: string;
  membership_id: string;
  company_id?: string | null;
  company_location_id?: string | null;
  market_id?: string | null;
  sales_channel_id?: string | null;
  payment_provider_id?: string | null;
  currency: Currency;
  billing: { type: "recurring"; interval: "month" | "year"; interval_count: 1 };
}

export interface SubscriptionCheckoutSelection extends SubscriptionPurchaseSelection {
  market_id: string;
  sales_channel_id: string;
  payment_provider_id: string;
}

export interface QuoteSubscriptionParams {
  store_id?: string;
  selection: SubscriptionPurchaseSelection;
}

export interface CheckoutSubscriptionParams {
  store_id?: string;
  request_id: string;
  selection: SubscriptionCheckoutSelection;
  presentation_digest: string;
  return_url: string;
}

export type SubscriptionCheckoutPayload = Omit<CheckoutSubscriptionParams, "store_id">;

export interface SubscriptionQuote {
  presentation_digest: string;
  context: PurchaseQuoteContext;
  audience_id: string;
  membership_id: string;
  audience_snapshot: SubscriptionAudienceSnapshot;
  price: AppliedPriceSnapshot;
  billing_address: PostalAddress | null;
  payment_provider_id: string;
}

export interface SubscriptionCheckoutResult {
  request_id: string;
  subscription_id: string;
  checkout_id: string;
  connected_account_id: string;
  publishable_key: string;
  client_secret: string;
  expires_at: EpochMilliseconds;
}
