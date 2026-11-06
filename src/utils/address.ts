import type { PostalAddress } from "../types/common";

export const COUNTRIES_WITHOUT_POSTAL_CODES: readonly string[] = Object.freeze([
  "AE", "AG", "AO", "AQ", "AW", "BF", "BI", "BJ", "BO", "BQ", "BS", "BV", "BW", "BZ", "CD", "CF",
  "CG", "CI", "CK", "CM", "CW", "DJ", "DM", "ER", "FJ", "GA", "GD", "GH", "GM", "GQ", "GY", "HK",
  "JM", "KI", "KM", "KN", "LC", "LY", "ML", "MO", "MR", "MS", "MW", "NR", "NU", "PA", "PS", "QA",
  "RW", "SB", "SC", "SL", "SR", "SS", "ST", "SX", "SY", "TD", "TF", "TG", "TK", "TL", "TO", "TV",
  "UG", "VU", "WS", "YE", "ZW",
]);

export const COUNTRIES_WITH_SHIPPING_STATES: readonly string[] = Object.freeze(["US", "CA", "AU"]);

export type ShippingAddressField = "name" | "street1" | "city" | "country" | "postal_code" | "state";

function missing(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === "";
}

export function missingShippingFields(address: PostalAddress): ShippingAddressField[] {
  const country = address.country.trim().replace(/[a-z]/g, (letter) => letter.toUpperCase());
  const fields: ShippingAddressField[] = [];
  if (missing(address.name)) fields.push("name");
  if (missing(address.street1)) fields.push("street1");
  if (missing(address.city)) fields.push("city");
  if (!/^[A-Z]{2}$/.test(country)) fields.push("country");
  if (!COUNTRIES_WITHOUT_POSTAL_CODES.includes(country) && missing(address.postal_code)) fields.push("postal_code");
  if (COUNTRIES_WITH_SHIPPING_STATES.includes(country) && missing(address.state)) fields.push("state");
  return fields;
}
