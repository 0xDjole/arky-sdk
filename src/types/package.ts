import type { EpochMilliseconds } from "./time";
import type { Block, BlockQuery } from "./block";
import type { CompanyPartyQuery, Currency, Money, Schedule, SortDirection, TaxMode } from "./common";
import type { CategoryEntry, CategoryQuery } from "./content";
import type { ProductReference } from "./product";

export type BillingInterval = "day" | "week" | "month" | "year";

export interface RecurringCadence {
  interval: BillingInterval;
  interval_count: number;
}

export type RenewalExhaustionAction = { type: "pause" } | { type: "cancel" };

export type UnpaidRenewalDisposition =
  { type: "retain_debt" } | { type: "cancel_unfulfilled" };

export interface PackageRenewalTerms {
  cadence: RecurringCadence;
  on_exhaustion: RenewalExhaustionAction;
  unpaid_order: UnpaidRenewalDisposition;
}

export type PackageRenewalReminder =
  { type: "none" } | { type: "days_before"; days: number };

export interface PackageRenewalTiming {
  retry_offsets_seconds: number[];
  recovery_window_seconds: number;
  reminder: PackageRenewalReminder;
}

export type PackageRenewal =
  | { type: "never" }
  | { type: "every"; agreed: PackageRenewalTerms; timing: PackageRenewalTiming };

export type PackageStayEnd =
  | { type: "renew" }
  | { type: "renew_once" }
  | { type: "continue_without_stay" }
  | { type: "stop" };

export type PackageStay =
  | { type: "any_time" }
  | { type: "at_least"; length: RecurringCadence; then: PackageStayEnd };

export type PackageMinimumCounts =
  | { type: "category"; category_id: string }
  | { type: "variants"; variant_ids: string[] };

export type PackageMinimumScope =
  { type: "per_location" } | { type: "company_wide" };

export type PackageMinimum =
  | { type: "none" }
  | {
      type: "per_month";
      quantity: number;
      counts: PackageMinimumCounts;
      scope: PackageMinimumScope;
    };

export type PackageScheduleInput =
  | { type: "always" }
  | { type: "scheduled"; starts_at: EpochMilliseconds | null; ends_at: EpochMilliseconds | null };

export type PackageStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" }
  | { type: "deleting" };

export type PackageEditableStatus = Exclude<PackageStatus, { type: "deleting" }>;

export interface Package {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  renewal: PackageRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  schedule: Schedule;
  status: PackageStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PackageDetail extends Package {
  items: PackageItem[];
}

export interface PackageSummary extends Package {
  package_offering_id: string | null;
  automatic_item_count: number;
  market_ids: string[];
}

export type SellableRef =
  | { type: "product_variant"; variant_id: string }
  | { type: "booking_offering"; booking_offering_id: string }
  | { type: "package"; package_id: string };

export type PriceStatus = { type: "active" } | { type: "archived" };

export type PackagePriceComparison =
  { type: "none" } | { type: "amount"; amount: number };

export interface PackageItemPriceChange {
  starts_at: EpochMilliseconds;
  amount: number;
  compare_at: PackagePriceComparison;
}

export interface PackageItemPriceEntry {
  id: string;
  amount: number;
  compare_at: PackagePriceComparison;
  changes: PackageItemPriceChange[];
  schedule: Schedule;
  status: PriceStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PackageProductPrice {
  variant_id: string;
  price: PackageItemPriceEntry;
}

export interface PackageBookingPrice {
  booking_offering_id: string;
  price: PackageItemPriceEntry;
}

export interface PackageItemPrice extends PackageItemPriceEntry {
  store_id: string;
  package_id: string;
  package_item_id: string;
  package_item_updated_at: EpochMilliseconds;
  sellable: SellableRef;
}

export interface PackageItemPricePage {
  items: PackageItemPrice[];
  cursor: string | null;
}

export interface PackagePriceRef {
  package_id: string;
  package_item_id: string;
  price_id: string;
}

export type PackageDeliveryCount =
  { type: "per_period" } | { type: "per_delivery" };

export type PackageDelivery =
  | { type: "none" }
  | { type: "once_per_period"; offset_days: number; window_days: number }
  | {
      type: "repeating_in_period";
      cadence: RecurringCadence;
      count: PackageDeliveryCount;
      offset_days: number;
      window_days: number;
    };

export type PackagePricedItemType =
  | { type: "product"; market_id: string; product_id: string; prices: PackageProductPrice[] }
  | { type: "booking_service"; market_id: string; booking_service_id: string; prices: PackageBookingPrice[] }
  | { type: "package"; market_id: string; package_id: string; price: PackageItemPriceEntry };

export type PackageAutomaticItemType =
  | {
      type: "get_product";
      variant_ids: string[];
      quantity: number;
      delivery: PackageDelivery;
      allocation_weight: number;
    }
  | {
      type: "rent_product";
      variant_id: string;
      quantity: number;
      tax_category_id: string;
      allocation_weight: number;
    };

export type PackageItemType = PackagePricedItemType | PackageAutomaticItemType;

export interface PackageItem {
  id: string;
  store_id: string;
  package_id: string;
  type: PackageItemType;
  position: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PackageItemRef =
  | { type: "product"; product_id: string }
  | { type: "booking_service"; booking_service_id: string }
  | { type: "package"; package_id: string };

export type PackageAudience =
  | { type: "everyone" }
  | { type: "package"; package_id: string }
  | { type: "package_offering"; package_offering_id: string }
  | { type: "customer"; customer_id: string }
  | { type: "all_companies" }
  | { type: "company"; company_id: string }
  | { type: "company_location"; company_location_id: string };

export type PackageChannels =
  | { type: "all" }
  | { type: "only"; sales_channel_ids: string[] };

export type PackageAccessLevel =
  | { type: "browse" }
  | { type: "see_prices" }
  | { type: "buy" };

export interface PackageAccess {
  id: string;
  store_id: string;
  package_id: string;
  audience: PackageAudience;
  channels: PackageChannels;
  level: PackageAccessLevel;
  created_at: EpochMilliseconds;
}

export interface StorefrontPackageChoice {
  id: string;
  key: string;
  blocks: Block[];
  level: PackageAccessLevel;
}

export type StorefrontPackageItemTermsType =
  | {
      type: "get_product";
      variant_ids: string[];
      quantity: number;
      delivery: PackageDelivery;
    }
  | {
      type: "rent_product";
      variant_id: string;
      quantity: number;
      tax_category_id: string;
    };

export interface StorefrontPackageItemTerms {
  id: string;
  type: StorefrontPackageItemTermsType;
}

export interface StorefrontPackageRentalProduct {
  package_item_id: string;
  product: ProductReference | null;
}

export interface StorefrontPackage {
  id: string;
  key: string;
  blocks: Block[];
  renewal: PackageRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  items: StorefrontPackageItemTerms[];
  rental_products: StorefrontPackageRentalProduct[];
  package_item_id: string;
  package_offering_id: string | null;
}

export interface PackageProductAlternative {
  variant_id: string;
  sku: string | null;
  product_blocks: Block[];
  variant_blocks: Block[];
  available: boolean;
}

export interface PackageProductChoices {
  package_id: string;
  package_updated_at: EpochMilliseconds;
  package_item_id: string;
  alternatives: PackageProductAlternative[];
}

export interface PackageCopyResult {
  items_created: number;
  items_kept: number;
  items_skipped: number;
  prices_created: number;
  prices_kept: number;
  prices_skipped: number;
  cursor: string | null;
}

export type PackageContext = CompanyPartyQuery & {
  package_id: string;
};

export type PackageReadOptions = PackageContext & {
  include_price?: boolean;
};

export interface StorefrontPrice {
  package_id: string;
  package_item_id: string;
  price_id: string;
  tax_mode: TaxMode;
  unit_price: Money;
  compare_at: number | null;
  priced_at: EpochMilliseconds;
}

export type PackageItemRecordType = "product" | "booking_service" | "package";

export type PackageItemSort = "package_order" | "relevance" | "starting_price";

export type PackageItemPriceBasis =
  | { type: "product_unit" }
  | { type: "booking_option" }
  | { type: "package_never" }
  | { type: "package_every"; cadence: RecurringCadence };

export type PackageItemPriceFilter =
  | { min_amount: number; max_amount?: number | null }
  | { min_amount?: number | null; max_amount: number };

export interface PackageItemSelection {
  types?: PackageItemRecordType[];
  text?: string;
  categories?: CategoryQuery[];
  blocks?: BlockQuery[];
  price?: PackageItemPriceFilter;
  price_basis?: PackageItemPriceBasis;
  sort?: PackageItemSort;
  direction?: SortDirection;
}

export interface PackageParentDefinition {
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
}

export interface PackageChoiceDefinition {
  sku: string | null;
  blocks: Block[];
  basis: PackageItemPriceBasis;
}

export interface PackageItemPriceSummary {
  basis: PackageItemPriceBasis;
  min_amount: number;
  max_amount: number;
  price_count: number;
}

export interface StorefrontPackageItem {
  package_item_id: string;
  package_id: string;
  market_id: string;
  item: PackageItemRef;
  position: number;
  content: PackageParentDefinition;
  access: PackageAccessLevel;
  currency: Currency | null;
  price_summary: PackageItemPriceSummary | null;
  price_id: string | null;
}

export interface StorefrontPackageItemDetails {
  package_item_id: string;
  package_id: string;
  market_id: string;
  item: PackageItemRef;
  position: number;
  content: PackageParentDefinition;
  access: PackageAccessLevel;
}

export interface StorefrontPackageItemPrice {
  price_id: string;
  sellable: SellableRef;
  content: PackageChoiceDefinition;
  price: StorefrontPrice | null;
}

export type FindStorefrontPackageItemsParams = PackageReadOptions & {
  selection?: PackageItemSelection;
  limit?: number;
  cursor?: string | null;
};

export type GetStorefrontPackageItemByParentParams = PackageContext & {
  item: PackageItemRef;
};

export type FindStorefrontPackageItemPricesParams = PackageReadOptions & {
  package_item_id: string;
  limit?: number;
  cursor?: string | null;
};

export type FindStorefrontPackagesParams = CompanyPartyQuery;

export type GetStorefrontPackageParams = PackageContext & {
  id: string;
};

export type GetStorefrontPackageByKeyParams = PackageContext & {
  key: string;
};

export type GetStorefrontPackageProductChoicesParams = PackageContext &
  ({ id: string } | { key: string }) & {
    package_item_id: string;
    quantity: number;
  };

interface PackageItemPriceListFilters {
  store_id: string;
  status?: PriceStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export type FindPackageItemPricesParams = PackageItemPriceListFilters &
  ({ package_item_id: string; sellable?: SellableRef } | { package_item_id?: string; sellable: SellableRef });

export interface GetPackageItemPriceParams {
  store_id: string;
  id: string;
}

export interface GetPackageItemPriceByChoiceParams {
  store_id: string;
  package_item_id: string;
  sellable: SellableRef;
}

export interface CreatePackageItemPriceParams {
  store_id: string;
  id: string;
  package_item_id: string;
  sellable: SellableRef;
  amount: number;
  compare_at: PackagePriceComparison;
  changes: PackageItemPriceChange[];
  schedule: PackageScheduleInput;
  status: PriceStatus;
}

export interface UpdatePackageItemPriceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  amount: number;
  compare_at: PackagePriceComparison;
  changes: PackageItemPriceChange[];
  schedule: PackageScheduleInput;
  status: PriceStatus;
}

export interface DeletePackageItemPriceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type PackageItemPriceBatchOperation =
  | ({ type: "create" } & Omit<CreatePackageItemPriceParams, "store_id" | "schedule"> & { schedule: Schedule })
  | ({ type: "update" } & Omit<UpdatePackageItemPriceParams, "store_id" | "schedule"> & { schedule: Schedule })
  | { type: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface BatchPackageItemPricesParams {
  store_id: string;
  operations: PackageItemPriceBatchOperation[];
}

export type PackageAutomaticItemOperation =
  | { action: "create"; id: string; type: PackageAutomaticItemType }
  | { action: "update"; id: string; expected_updated_at: EpochMilliseconds; type: PackageAutomaticItemType }
  | { action: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface FindPackagesParams {
  store_id: string;
  query?: string;
  key?: string;
  status?: PackageStatus;
  package_offering_id?: string;
  market_id?: string;
  sort_field?: "key" | "created_at" | "status";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetPackageParams {
  store_id: string;
  id: string;
}

export interface GetPackageByKeyParams {
  store_id: string;
  key: string;
}

export interface CreatePackageParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  renewal: PackageRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  schedule: PackageScheduleInput;
  status: PackageEditableStatus;
  items: PackageAutomaticItemOperation[];
}

export interface UpdatePackageParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  renewal: PackageRenewal;
  stay: PackageStay;
  minimum: PackageMinimum;
  schedule: PackageScheduleInput;
  status: PackageEditableStatus;
  items: PackageAutomaticItemOperation[];
}

export interface DeletePackageParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CopyPackageParams {
  store_id: string;
  id: string;
  source_package_id: string;
  source_market_id: string;
  target_market_id: string;
  cursor?: string | null;
}

export type FindPurchasablePackagesParams = CompanyPartyQuery & {
  store_id: string;
  market_id: string;
  sales_channel_id: string;
  customer_id: string;
};

export type FindPackageItemsParams = {
  store_id: string;
  package_id: string;
  limit?: number;
} & (
  | { market_id?: string; item?: undefined; cursor?: string | null }
  | { market_id: string; item: PackageItemRef; cursor?: undefined }
);

export interface GetPackageItemParams {
  store_id: string;
  id: string;
}

export interface PackageItemPriceInput {
  id: string;
  amount: number;
  compare_at: PackagePriceComparison;
  changes: PackageItemPriceChange[];
  schedule: Schedule;
  status: PriceStatus;
}

export type PackagePricedItemInput =
  | { type: "product"; product_id: string }
  | { type: "booking_service"; booking_service_id: string }
  | { type: "package"; package_id: string; price: PackageItemPriceInput };

export interface CreatePackageItemParams {
  store_id: string;
  id: string;
  package_id: string;
  market_id: string;
  item: PackagePricedItemInput;
}

export interface UpdatePackageItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  position: number;
}

export interface DeletePackageItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface SetPackageItemPricesParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: PriceStatus;
  schedule: PackageScheduleInput;
}

export type PackageItemBatchOperation =
  | ({ type: "create" } & Omit<CreatePackageItemParams, "store_id">)
  | ({ type: "update" } & Omit<UpdatePackageItemParams, "store_id">)
  | { type: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface BatchPackageItemsParams {
  store_id: string;
  operations: PackageItemBatchOperation[];
}

export interface FindPackageAccessesParams {
  store_id: string;
  package_id: string;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetPackageAccessParams {
  store_id: string;
  id: string;
}

export interface CreatePackageAccessParams {
  store_id: string;
  id: string;
  package_id: string;
  audience: PackageAudience;
  channels: PackageChannels;
  level: PackageAccessLevel;
}

export interface DeletePackageAccessParams {
  store_id: string;
  id: string;
}
