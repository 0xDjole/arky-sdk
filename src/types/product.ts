import type { CalendarDate, EpochMilliseconds } from "./time";
import type { Block, BlockQuery } from "./block";
import type { Money, PaginatedResponse, SortDirection, TaxMode } from "./common";
import type { CategoryEntry, CategoryQuery } from "./content";
import type { CatalogReadOptions } from "./catalog";

export type ProductStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" }
  | { type: "deleting" };

export type ProductEditableStatus = Exclude<ProductStatus, { type: "deleting" }>;

export interface Product {
  id: string;
  store_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
  status: ProductStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface InventoryRequirement {
  inventory_item_id: string;
  quantity: number;
}

export type BackorderPolicy = { type: "disallow" } | { type: "allow" };

export type ProductFulfillment =
  | { type: "none" }
  | {
      type: "physical";
      shipping_profile_id: string;
      inventory_requirements: InventoryRequirement[];
      backorder: BackorderPolicy;
    }
  | { type: "digital"; asset_ids: string[] };

export type ProductVariantStatus =
  | { type: "active" }
  | { type: "draft" }
  | { type: "archived" }
  | { type: "deleting" };

export type ProductVariantEditableStatus = Exclude<ProductVariantStatus, { type: "deleting" }>;

export interface ProductVariant {
  id: string;
  store_id: string;
  product_id: string;
  sku: string | null;
  attributes: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
  status: ProductVariantStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type BookingServiceStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type BookingServiceEditableStatus = Exclude<BookingServiceStatus, { type: "deleting" }>;

export interface BookingService {
  id: string;
  store_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
  status: BookingServiceStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WorkingWindow {
  from_minute: number;
  to_minute: number;
}

export type ServiceSegment =
  | { type: "service"; minutes: number }
  | { type: "pause"; minutes: number };

export type BookingVenue =
  | { type: "not_fixed" }
  | { type: "store_location"; store_location_id: string };

export interface BookingWindow {
  opens_before_start_minutes: number | null;
  closes_before_start_minutes: number;
}

export type BookingOfferingStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type BookingOfferingEditableStatus = Exclude<BookingOfferingStatus, { type: "deleting" }>;

export interface BookingOffering {
  id: string;
  store_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  weekly_availability: Partial<Record<Weekday, WorkingWindow[]>>;
  date_overrides: Record<CalendarDate, WorkingWindow[]>;
  segments: ServiceSegment[];
  slot_interval_minutes: number;
  booking_window: BookingWindow;
  reminder_offsets_minutes: number[];
  venue: BookingVenue;
  tax_category_id: string;
  status: BookingOfferingStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type BookingResourceStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type BookingResourceEditableStatus = Exclude<BookingResourceStatus, { type: "deleting" }>;

export interface BookingResource {
  id: string;
  store_id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
  timezone: string;
  capacity: number;
  status: BookingResourceStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface BookingCapacityClaim {
  order_id: string;
  order_booking_line_item_id: string;
  units: number;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export interface BookingResourceCapacityDay {
  id: string;
  store_id: string;
  booking_resource_id: string;
  local_date: CalendarDate;
  timezone: string;
  claims: BookingCapacityClaim[];
}

export type DigitalAssetStatus = { type: "active" } | { type: "archived" };

export interface DigitalAsset {
  id: string;
  store_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  status: DigitalAssetStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontPrice {
  tax_mode: TaxMode;
  unit_price: Money;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  priced_at: EpochMilliseconds;
}

export interface StorefrontProduct {
  id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
  price: StorefrontPrice | null;
}

export interface StorefrontProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  attributes: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
  status: ProductVariantStatus;
  price: StorefrontPrice | null;
}

export type StorefrontBookingService = BookingService & { price: StorefrontPrice | null };

export type StorefrontBookingOffering = BookingOffering & { price: StorefrontPrice | null };

export type StorefrontBookingResource = BookingResource;

export interface AvailabilitySlot {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  spots: number;
}

export interface DaySlots {
  date: CalendarDate;
  slots: AvailabilitySlot[];
}

export interface BookingResourceAvailability {
  booking_offering_id: string;
  booking_resource_id: string;
  resource_key: string;
  timezone: string;
  days: DaySlots[];
}

export interface AvailabilityResponse {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  booking_resources: BookingResourceAvailability[];
  cursor: string | null;
}

export interface LibraryItem {
  product_id: string;
  product_key: string;
}

export interface LibraryAsset {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  download_reference: string;
}

export interface LibraryProduct {
  product_id: string;
  presentation: LibraryItem | null;
  assets: PaginatedResponse<LibraryAsset>;
}

export interface DigitalDownload {
  url: string;
  expires_at: EpochMilliseconds;
  file_name: string;
  mime_type: string;
}

export interface CatalogPriceFilter {
  min_amount?: number | null;
  max_amount?: number | null;
  quantity?: number;
}

export interface FindProductsParams {
  store_id: string;
  ids?: string[];
  query?: string;
  category_query?: CategoryQuery[];
  filters?: BlockQuery[];
  variant_filters?: BlockQuery[];
  status?: ProductStatus["type"];
  price_filter?: CatalogPriceFilter;
  sort_field?: string;
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetProductParams {
  store_id: string;
  id: string;
}

export interface GetProductByKeyParams {
  store_id: string;
  key: string;
}

export interface CreateProductParams {
  store_id: string;
  id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
}

export interface UpdateProductParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  categories?: CategoryEntry[];
  status?: ProductEditableStatus;
}

export interface DeleteProductParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreateProductVariantParams {
  store_id: string;
  id: string;
  product_id: string;
  sku: string | null;
  attributes: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
}

export interface UpdateProductVariantParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sku: string | null;
  attributes: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
  status: ProductVariantEditableStatus;
}

export interface GetProductVariantParams {
  store_id: string;
  id: string;
}

export interface FindProductVariantsParams {
  store_id: string;
  product_id?: string;
  sku?: string;
  status?: ProductVariantStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface DeleteProductVariantParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindBookingServicesParams {
  store_id: string;
  ids?: string[];
  booking_resource_id?: string;
  query?: string;
  status?: BookingServiceStatus["type"];
  category_query?: CategoryQuery[];
  match_all?: boolean;
  from?: EpochMilliseconds;
  to?: EpochMilliseconds;
  sort_field?: string;
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetBookingServiceParams {
  store_id: string;
  id: string;
}

export interface GetBookingServiceByKeyParams {
  store_id: string;
  key: string;
}

export interface CreateBookingServiceParams {
  store_id: string;
  id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
  status?: BookingServiceEditableStatus;
}

export interface UpdateBookingServiceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  categories?: CategoryEntry[];
  status?: BookingServiceEditableStatus;
}

export interface DeleteBookingServiceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindBookingResourcesParams {
  store_id: string;
  ids?: string[];
  booking_service_id?: string;
  query?: string;
  status?: BookingResourceStatus["type"];
  category_query?: CategoryQuery[];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetBookingResourceParams {
  store_id: string;
  id: string;
}

export interface GetBookingResourceByKeyParams {
  store_id: string;
  key: string;
}

export interface CreateBookingResourceParams {
  store_id: string;
  id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
  timezone: string;
  capacity: number;
  status?: BookingResourceEditableStatus;
}

export interface UpdateBookingResourceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  slugs?: Record<string, string>;
  blocks?: Block[];
  categories?: CategoryEntry[];
  timezone?: string;
  capacity?: number;
  status?: BookingResourceEditableStatus;
}

export interface DeleteBookingResourceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreateBookingOfferingParams {
  store_id: string;
  id: string;
  booking_service_id: string;
  booking_resource_id: string;
  weekly_availability: Partial<Record<Weekday, WorkingWindow[]>>;
  date_overrides: Record<CalendarDate, WorkingWindow[]>;
  segments: ServiceSegment[];
  slot_interval_minutes: number;
  booking_window: BookingWindow;
  reminder_offsets_minutes: number[];
  venue: BookingVenue;
  tax_category_id: string;
  status?: BookingOfferingEditableStatus;
}

export interface UpdateBookingOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  weekly_availability?: Partial<Record<Weekday, WorkingWindow[]>>;
  date_overrides?: Record<CalendarDate, WorkingWindow[]>;
  segments?: ServiceSegment[];
  slot_interval_minutes?: number;
  booking_window?: BookingWindow;
  reminder_offsets_minutes?: number[];
  venue?: BookingVenue;
  tax_category_id?: string;
  status?: BookingOfferingEditableStatus;
}

export interface GetBookingOfferingParams {
  store_id: string;
  id: string;
}

export interface LookupBookingOfferingParams {
  store_id: string;
  booking_service_id: string;
  booking_resource_id: string;
}

export interface DeleteBookingOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindBookingOfferingsParams {
  store_id: string;
  booking_service_id?: string;
  booking_resource_id?: string;
  status?: BookingOfferingStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetAvailabilityParams {
  store_id: string;
  booking_service_id: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  booking_resource_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface UploadDigitalAssetParams {
  store_id: string;
  id: string;
  file: File;
}

export interface GetDigitalAssetParams {
  store_id: string;
  id: string;
}

export interface FindDigitalAssetsParams {
  store_id: string;
  status?: DigitalAssetStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface ArchiveDigitalAssetParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetStorefrontProductParams extends CatalogReadOptions {
  id?: string;
  slug?: string;
}

export interface GetStorefrontProductByKeyParams extends CatalogReadOptions {
  key: string;
}

export interface FindStorefrontProductsParams extends CatalogReadOptions {
  ids?: string[];
  query?: string;
  category_query?: CategoryQuery[];
  filters?: BlockQuery[];
  variant_filters?: BlockQuery[];
  price_filter?: CatalogPriceFilter;
  sort_field?: string;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetStorefrontProductVariantParams extends CatalogReadOptions {
  product_id: string;
  id: string;
}

export interface FindStorefrontProductVariantsParams extends CatalogReadOptions {
  product_id: string;
  filters?: BlockQuery[];
  limit?: number;
  cursor?: string | null;
}

export interface GetStorefrontBookingServiceParams extends CatalogReadOptions {
  id?: string;
  slug?: string;
}

export interface GetStorefrontBookingServiceByKeyParams extends CatalogReadOptions {
  key: string;
}

export interface FindStorefrontBookingServicesParams extends CatalogReadOptions {
  ids?: string[];
  booking_resource_id?: string;
  query?: string;
  category_query?: CategoryQuery[];
  price_filter?: CatalogPriceFilter;
  sort_field?: "key" | "created_at" | "price" | "catalog_order";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface FindStorefrontBookingOfferingsParams extends CatalogReadOptions {
  booking_service_id?: string;
  booking_resource_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetStorefrontAvailabilityParams {
  booking_service_id: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  booking_resource_id?: string;
  catalog_id?: string;
  company_id?: string;
  company_location_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindStorefrontBookingResourcesParams {
  ids?: string[];
  booking_service_id?: string;
  query?: string;
  category_query?: CategoryQuery[];
  limit?: number;
  cursor?: string | null;
}

export interface FindLibraryParams {
  company_id?: string;
  company_location_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetLibraryProductParams {
  product_id: string;
  company_id?: string;
  company_location_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindLibraryAssetsParams {
  product_id: string;
  company_id?: string;
  company_location_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface DownloadLibraryAssetParams {
  product_id: string;
  asset_id: string;
  reference: string;
  company_id?: string;
  company_location_id?: string;
}
