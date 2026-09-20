import type { createAdmin } from 'arky-sdk/admin';
import type { FulfillmentRoutingPolicy, GetFulfillmentRoutingPolicyByKeyParams } from 'arky-sdk';
import type { GetFulfillmentRoutingPolicyByKeyParams as PublicRoutingKey } from 'arky-sdk/types';
import type { Product, BookingService, BookingResource, BookingOffering, GetProductByKeyParams, GetBookingServiceByKeyParams, GetBookingResourceByKeyParams, GetBookingOfferingByBindingParams } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type ExactDefinitions = [
  True<Same<PublicRoutingKey, GetFulfillmentRoutingPolicyByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['fulfillmentRoutingPolicy']['getByKey']>[0], GetFulfillmentRoutingPolicyByKeyParams>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['fulfillmentRoutingPolicy']['getByKey']>>, FulfillmentRoutingPolicy>>,
  True<Same<Parameters<Admin['eshop']['product']['getByKey']>[0], GetProductByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['bookingService']['getByKey']>[0], GetBookingServiceByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['bookingResource']['getByKey']>[0], GetBookingResourceByKeyParams>>,
  True<Same<Parameters<Admin['eshop']['bookingOffering']['getByBinding']>[0], GetBookingOfferingByBindingParams>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['product']['getByKey']>>, Product>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['bookingService']['getByKey']>>, BookingService>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['bookingResource']['getByKey']>>, BookingResource>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['bookingOffering']['getByBinding']>>, BookingOffering>>
];
// @ts-expect-error An exact key read does not accept a discovery cursor.
export const paginatedKey: Parameters<Admin['eshop']['product']['getByKey']>[0] = { key: 'demo', cursor: 'wrong' };
// @ts-expect-error An exact Offering binding requires both owners.
export const incompleteBinding: Parameters<Admin['eshop']['bookingOffering']['getByBinding']>[0] = { booking_service_id: 'service' };
