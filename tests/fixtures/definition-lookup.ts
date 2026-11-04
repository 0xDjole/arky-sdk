import type { createAdmin } from "arky-sdk/admin";
import type {
  BookingOffering,
  BookingResource,
  BookingService,
  PackageDetail,
  GetBookingOfferingParams,
  GetBookingResourceByKeyParams,
  GetBookingServiceByKeyParams,
  GetPackageByKeyParams,
  GetProductByKeyParams,
  GetBookingOfferingByServiceAndResourceParams,
  Product,
} from "arky-sdk";
import type { GetPackageByKeyParams as PublicPackageKey } from "arky-sdk/types";

type Admin = ReturnType<typeof createAdmin>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type ExactDefinitions = [
  Assert<Equal<PublicPackageKey, GetPackageByKeyParams>>,
  Assert<Equal<Parameters<Admin["eshop"]["package"]["getByKey"]>[0], GetPackageByKeyParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["package"]["getByKey"]>>, PackageDetail>>,
  Assert<Missing<Admin["eshop"], "fulfillmentRoutingPolicy">>,
  Assert<Equal<Parameters<Admin["eshop"]["product"]["getByKey"]>[0], GetProductByKeyParams>>,
  Assert<Equal<keyof GetProductByKeyParams, "store_id" | "key">>,
  Assert<Equal<Parameters<Admin["eshop"]["bookingService"]["getByKey"]>[0], GetBookingServiceByKeyParams>>,
  Assert<Equal<Parameters<Admin["eshop"]["bookingResource"]["getByKey"]>[0], GetBookingResourceByKeyParams>>,
  Assert<Equal<Parameters<Admin["eshop"]["bookingOffering"]["getByServiceAndResource"]>[0], GetBookingOfferingByServiceAndResourceParams>>,
  Assert<RequiredField<GetBookingOfferingByServiceAndResourceParams, "booking_service_id">>,
  Assert<RequiredField<GetBookingOfferingByServiceAndResourceParams, "booking_resource_id">>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["product"]["getByKey"]>>, Product>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["bookingService"]["getByKey"]>>, BookingService>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["bookingResource"]["getByKey"]>>, BookingResource>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["bookingOffering"]["getByServiceAndResource"]>>, BookingOffering>>,
  Assert<Equal<Parameters<Admin["eshop"]["bookingOffering"]["get"]>[0], GetBookingOfferingParams>>,
  Assert<Equal<keyof GetBookingOfferingParams, "store_id" | "id">>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["bookingOffering"]["get"]>>, BookingOffering>>,
];
