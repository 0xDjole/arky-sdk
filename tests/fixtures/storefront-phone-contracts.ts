import { toE164 } from "arky-sdk/storefront";
import { toE164 as utilsToE164 } from "arky-sdk/utils";
import type { E164Conversion, E164Refusal } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const conversion: E164Conversion = toE164("BA", "061 123 456");

export type StorefrontPhoneContracts = [
  Assert<Equal<typeof toE164, typeof utilsToE164>>,
  Assert<Equal<ReturnType<typeof toE164>, E164Conversion>>,
  Assert<Equal<E164Refusal, Exclude<E164Conversion, { type: "number" }>>>,
];
