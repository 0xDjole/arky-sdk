import type { CalendarDate, Duration, EpochMilliseconds } from "./time";
import type { Block, BlockQuery } from "./block";
import type { CompanyPartyQuery, PaginatedResponse, SortDirection } from "./common";
import type { CategoryEntry, CategoryQuery } from "./content";
import type { PackageContext, PackageReadOptions, StorefrontPrice } from "./package";
import type { DocumentItem } from "./invoice";

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

export interface ProductReference {
  id: string;
  key: string;
  blocks: Block[];
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

export type ProductVariantMeasure =
  { type: "not_counted" } | { type: "counts"; amount: number };

export interface ProductVariant {
  id: string;
  store_id: string;
  product_id: string;
  sku: string | null;
  blocks: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
  document_item: DocumentItem;
  measure: ProductVariantMeasure;
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
  length: Duration;
  slot_interval: Duration;
  booking_window: BookingWindow;
  customer_changes: BookingCustomerChanges;
  tax_category_id: string;
  document_item: DocumentItem;
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
  from: Duration;
  to: Duration;
}

export interface BookingHours {
  weekly_availability: Partial<Record<Weekday, WorkingWindow[]>>;
  date_overrides: Record<CalendarDate, WorkingWindow[]>;
}

export interface BookingResourceWindow {
  store_location_id: string;
  from: Duration;
  to: Duration;
}

export interface BookingResourceHours {
  weekly_availability: Partial<Record<Weekday, BookingResourceWindow[]>>;
  date_overrides: Record<CalendarDate, BookingResourceWindow[]>;
}

export interface BookingResourceDailyLimit {
  booking_service_id: string;
  bookings: number;
}

export type BookingWindowOpening = { type: "any_time" } | { type: "before_start"; period: Duration };

export interface BookingWindow {
  opens: BookingWindowOpening;
  closes_before_start: Duration;
}

export type BookingCustomerChanges = { type: "not_allowed" } | { type: "until_before_start"; period: Duration };

export type BookingOfferingHours = { type: "all" } | { type: "only"; hours: BookingHours };

export type BookingOfferingResources =
  | { type: "category"; category_id: string }
  | { type: "ids"; booking_resource_ids: string[] };

export interface BookingOfferingTime {
  from: Duration;
  to: Duration;
}

export type BookingOfferingLocations =
  | { type: "all" }
  | { type: "ids"; store_location_ids: string[] }
  | { type: "elsewhere"; store_location_id: string };

export type BookingOfferingAddOnResources =
  | { type: "all" }
  | { type: "category"; category_id: string }
  | { type: "ids"; booking_resource_ids: string[] };

export interface BookingOfferingAddOn {
  id: string;
  booking_service_id: string;
  resources: BookingOfferingAddOnResources;
  from: Duration;
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
  resources: BookingOfferingResources;
  times: BookingOfferingTime[];
  locations: BookingOfferingLocations;
  hours: BookingOfferingHours;
  add_ons: BookingOfferingAddOn[];
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
  hours: BookingResourceHours;
  daily_limits: BookingResourceDailyLimit[];
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

export interface StorefrontProduct {
  id: string;
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
  package_item_id: string;
}

export interface StorefrontProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  blocks: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
  measure: ProductVariantMeasure;
  status: ProductVariantStatus;
  package_item_id: string;
  price: StorefrontPrice | null;
}

export type StorefrontBookingService = BookingService & { package_item_id: string };

export type StorefrontBookingOffering = BookingOffering & { package_item_id: string; price: StorefrontPrice | null };

export interface StorefrontBookingResource {
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
  hours: BookingResourceHours;
}

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
  store_location_id: string;
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

export interface FindProductsParams {
  store_id: string;
  ids?: string[];
  query?: string;
  category_query?: CategoryQuery[];
  filters?: BlockQuery[];
  variant_filters?: BlockQuery[];
  status?: ProductStatus["type"];
  sort_field?: "key" | "created_at" | "updated_at" | "status";
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
  blocks: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
  document_item: DocumentItem;
  measure: ProductVariantMeasure;
}

export interface UpdateProductVariantParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sku: string | null;
  blocks: Block[];
  fulfillment: ProductFulfillment;
  tax_category_id: string;
  document_item: DocumentItem;
  measure: ProductVariantMeasure;
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
  query?: string;
  status?: BookingServiceStatus["type"];
  category_query?: CategoryQuery[];
  sort_field?: "key" | "status" | "created_at" | "updated_at";
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
  length: Duration;
  slot_interval: Duration;
  booking_window: BookingWindow;
  customer_changes: BookingCustomerChanges;
  tax_category_id: string;
  document_item: DocumentItem;
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
  length?: Duration;
  slot_interval?: Duration;
  booking_window?: BookingWindow;
  customer_changes?: BookingCustomerChanges;
  tax_category_id?: string;
  document_item?: DocumentItem;
}

export interface DeleteBookingServiceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindBookingResourcesParams {
  store_id: string;
  ids?: string[];
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
  hours: BookingResourceHours;
  daily_limits?: BookingResourceDailyLimit[];
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
  hours?: BookingResourceHours;
  daily_limits?: BookingResourceDailyLimit[];
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
  resources: BookingOfferingResources;
  times: BookingOfferingTime[];
  locations: BookingOfferingLocations;
  hours: BookingOfferingHours;
  add_ons?: BookingOfferingAddOn[];
  status: BookingOfferingEditableStatus;
}

export interface UpdateBookingOfferingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resources?: BookingOfferingResources;
  times?: BookingOfferingTime[];
  locations?: BookingOfferingLocations;
  hours?: BookingOfferingHours;
  add_ons?: BookingOfferingAddOn[];
  status?: BookingOfferingEditableStatus;
}

export interface GetBookingOfferingParams {
  store_id: string;
  id: string;
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

export type GetAvailabilityParams = {
  store_id: string;
  booking_service_id: string;
  store_location_id: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  booking_resource_id?: string;
  limit?: number;
  cursor?: string | null;
} & (
  | { moving_order_id: string; moving_order_booking_line_item_id: string }
  | { moving_order_id?: never; moving_order_booking_line_item_id?: never }
);

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

export type GetStorefrontProductParams = PackageContext & ({ id: string } | { slug: string });

export type GetStorefrontProductByKeyParams = PackageContext & {
  key: string;
};

export type GetStorefrontProductVariantParams = PackageReadOptions & {
  product_id: string;
  id: string;
};

export type GetStorefrontBookingServiceParams = PackageContext & ({ id: string } | { slug: string });

export type GetStorefrontBookingServiceByKeyParams = PackageContext & {
  key: string;
};

export type GetStorefrontBookingOfferingParams = PackageReadOptions & {
  id: string;
};

export type GetStorefrontAvailabilityParams = PackageContext & {
  booking_service_id: string;
  store_location_id: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  booking_resource_id?: string;
  limit?: number;
  cursor?: string | null;
};

export type GetStorefrontBookingResourceParams = PackageContext & {
  id: string;
  offering_id: string;
};

export type FindLibraryParams = CompanyPartyQuery & {
  limit?: number;
  cursor?: string | null;
};

export type GetLibraryProductParams = CompanyPartyQuery & {
  product_id: string;
  limit?: number;
  cursor?: string | null;
};

export type FindLibraryAssetsParams = CompanyPartyQuery & {
  product_id: string;
  limit?: number;
  cursor?: string | null;
};

export type DownloadLibraryAssetParams = CompanyPartyQuery & {
  product_id: string;
  asset_id: string;
  reference: string;
};
