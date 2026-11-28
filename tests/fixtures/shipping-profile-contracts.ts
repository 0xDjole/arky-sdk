import type { CreateShippingProfileParams, FindShippingProfilesParams, ShippingMethod, ShippingProfile, ShippingRate, TenantRecordByKeyParams, UpdateShippingMethodParams } from "arky-sdk";
import type { TenantRecordByKeyParams as PublicKey } from "arky-sdk/types";
import type { createAdmin } from "arky-sdk/admin";

type True<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Tenant = ReturnType<typeof createAdmin>["tenant"];

export type ShippingProfileContracts = [
  True<Equal<PublicKey, TenantRecordByKeyParams>>,
  True<Equal<Parameters<Tenant["shippingProfile"]["getByKey"]>[0], TenantRecordByKeyParams>>,
  True<Equal<Awaited<ReturnType<Tenant["shippingProfile"]["getByKey"]>>, ShippingProfile>>,
  True<Equal<keyof ShippingProfile, "id" | "tenant_id" | "key" | "created_at" | "updated_at">>,
  True<Equal<NonNullable<FindShippingProfilesParams["sort_field"]>, "created_at" | "updated_at">>,
  True<Equal<NonNullable<FindShippingProfilesParams["sort_direction"]>, "asc" | "desc">>,
  True<RequiredField<TenantRecordByKeyParams, "key">>,
  True<RequiredField<CreateShippingProfileParams, "id">>,
  True<Equal<ShippingMethod["rates"], ShippingRate[]>>,
  True<Equal<UpdateShippingMethodParams["rates"], ShippingRate[] | undefined>>,
  True<"shippingRate" extends keyof Tenant ? false : true>,
  True<"taxRule" extends keyof Tenant ? false : true>,
];
