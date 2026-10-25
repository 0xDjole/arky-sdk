import type {
  BookingService,
  BookingResource,
  BookingOffering,
  BookingHours,
  BookingOfferingHours,
  BookingCustomerChanges,
  BookingOfferingEditableStatus,
  BookingVenue,
  CreateBookingServiceParams,
  CreateBookingResourceParams,
  CreateBookingOfferingParams,
  UpdateBookingOfferingParams,
  GetStorefrontAvailabilityParams,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Required<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = Extract<K, keyof T> extends never ? true : false;

export type BookingDefinitionContracts = [
  Assert<Required<CreateBookingServiceParams, "segments">>,
  Assert<Required<CreateBookingServiceParams, "buffer_before_minutes">>,
  Assert<Required<CreateBookingServiceParams, "buffer_after_minutes">>,
  Assert<Required<CreateBookingServiceParams, "tax_category_id">>,
  Assert<Equal<BookingService["customer_changes"], BookingCustomerChanges>>,
  Assert<Required<CreateBookingResourceParams, "hours">>,
  Assert<Equal<BookingResource["hours"], BookingHours>>,
  Assert<Required<CreateBookingOfferingParams, "hours">>,
  Assert<Required<CreateBookingOfferingParams, "status">>,
  Assert<Equal<CreateBookingOfferingParams["status"], BookingOfferingEditableStatus>>,
  Assert<Equal<BookingOffering["hours"], BookingOfferingHours>>,
  Assert<Equal<BookingOfferingHours, { type: "resource" } | { type: "within"; hours: BookingHours }>>,
  Assert<Missing<BookingOffering, "segments" | "tax_category_id" | "weekly_availability" | "reminder_offsets_minutes">>,
  Assert<Missing<CreateBookingOfferingParams, "segments" | "tax_category_id" | "date_overrides">>,
  Assert<Missing<UpdateBookingOfferingParams, "booking_service_id" | "booking_resource_id">>,
  Assert<Equal<Extract<BookingVenue, { type: "not_fixed" }>, { type: "not_fixed"; store_location_id: string }>>,
  Assert<Required<GetStorefrontAvailabilityParams, "catalog_id">>,
];
