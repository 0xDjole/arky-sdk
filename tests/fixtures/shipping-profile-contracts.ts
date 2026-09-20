import type { FindShippingProfilesParams, GetShippingProfileByKeyParams, ShippingProfile } from "arky-sdk";
import type { GetShippingProfileByKeyParams as PublicKey } from "arky-sdk/types";
import type { createAdmin } from "arky-sdk/admin";
type True<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Api = ReturnType<typeof createAdmin>["store"]["shippingProfile"];
export type ShippingProfileContracts = [
  True<Equal<PublicKey, GetShippingProfileByKeyParams>>,
  True<Equal<Awaited<ReturnType<Api["getByKey"]>>, ShippingProfile>>,
  True<Equal<NonNullable<FindShippingProfilesParams["status"]>, "active" | "archived" | "deleting">>,
  True<Equal<NonNullable<FindShippingProfilesParams["sort_field"]>, "created_at" | "updated_at">>,
  True<Equal<NonNullable<FindShippingProfilesParams["sort_direction"]>, "asc" | "desc">>,
  True<{} extends Pick<GetShippingProfileByKeyParams, "key"> ? false : true>,
];
