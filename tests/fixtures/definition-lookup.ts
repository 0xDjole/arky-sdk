import type { createAdmin } from 'arky-sdk/admin';
import type { Catalog, GetCatalogByKeyParams } from 'arky-sdk';
import type { GetCatalogByKeyParams as PublicCatalogKey } from 'arky-sdk/types';
import type { Product, BookingService, BookingResource, BookingOffering, GetProductByKeyParams, GetBookingServiceByKeyParams, GetBookingResourceByKeyParams, LookupBookingOfferingParams, GetBookingOfferingParams } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type ExactDefinitions = [
  True<Same<PublicCatalogKey, GetCatalogByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['catalog']['getByKey']>[0], GetCatalogByKeyParams>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['catalog']['getByKey']>>, Catalog>>,
  True<'fulfillmentRoutingPolicy' extends keyof Admin['eshop'] ? false : true>,
  True<Same<Parameters<Admin['eshop']['product']['getByKey']>[0], GetProductByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['bookingService']['getByKey']>[0], GetBookingServiceByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['bookingResource']['getByKey']>[0], GetBookingResourceByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['bookingOffering']['lookup']>[0], LookupBookingOfferingParams>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['product']['getByKey']>>, Product>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['bookingService']['getByKey']>>, BookingService>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['bookingResource']['getByKey']>>, BookingResource>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['bookingOffering']['lookup']>>, BookingOffering>>,
  True<Same<Parameters<Admin['eshop']['bookingOffering']['get']>[0], GetBookingOfferingParams>>,
  True<Same<keyof GetBookingOfferingParams, 'store_id' | 'id'>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['bookingOffering']['get']>>, BookingOffering>>
];
// @ts-expect-error An exact key read does not accept a discovery cursor.
export const paginatedKey: Parameters<Admin['eshop']['product']['getByKey']>[0] = { store_id: '0f6c2a94-7e13-4b58-9d21-6a8e3c5f0b47', key: 'demo', cursor: 'wrong' };
// @ts-expect-error An exact Offering binding requires both owners.
export const incompleteBinding: Parameters<Admin['eshop']['bookingOffering']['lookup']>[0] = { store_id: '0f6c2a94-7e13-4b58-9d21-6a8e3c5f0b47', booking_service_id: 'service' };
