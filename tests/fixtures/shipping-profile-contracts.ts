import type { CreateShippingProfileParams, FindShippingProfilesParams, ShippingMethod, ShippingProfile, ShippingRate, StoreRecordByKeyParams, UpdateShippingMethodParams } from "arky-sdk";
import type { StoreRecordByKeyParams as PublicKey } from "arky-sdk/types";
import type { createAdmin } from "arky-sdk/admin";

type True<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Store = ReturnType<typeof createAdmin>["store"];

export type ShippingProfileContracts = [
  True<Equal<PublicKey, StoreRecordByKeyParams>>,
  True<Equal<Parameters<Store["shippingProfile"]["getByKey"]>[0], StoreRecordByKeyParams>>,
  True<Equal<Awaited<ReturnType<Store["shippingProfile"]["getByKey"]>>, ShippingProfile>>,
  True<Equal<keyof ShippingProfile, "id" | "store_id" | "key" | "created_at" | "updated_at">>,
  True<Equal<NonNullable<FindShippingProfilesParams["sort_field"]>, "created_at" | "updated_at">>,
  True<Equal<NonNullable<FindShippingProfilesParams["sort_direction"]>, "asc" | "desc">>,
  True<RequiredField<StoreRecordByKeyParams, "key">>,
  True<RequiredField<CreateShippingProfileParams, "id">>,
  True<Equal<ShippingMethod["rates"], ShippingRate[]>>,
  True<Equal<UpdateShippingMethodParams["rates"], ShippingRate[] | undefined>>,
  True<"shippingRate" extends keyof Store ? false : true>,
  True<"taxRule" extends keyof Store ? false : true>,
];
