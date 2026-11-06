import assert from "node:assert/strict";
import { test } from "node:test";
import {
  COUNTRIES_WITHOUT_POSTAL_CODES,
  COUNTRIES_WITH_SHIPPING_STATES,
  missingShippingFields,
} from "arky-sdk/utils";

const serverCountriesWithoutPostalCodes = [
  "AE", "AG", "AO", "AQ", "AW", "BF", "BI", "BJ", "BO", "BQ", "BS", "BV", "BW", "BZ", "CD", "CF",
  "CG", "CI", "CK", "CM", "CW", "DJ", "DM", "ER", "FJ", "GA", "GD", "GH", "GM", "GQ", "GY", "HK",
  "JM", "KI", "KM", "KN", "LC", "LY", "ML", "MO", "MR", "MS", "MW", "NR", "NU", "PA", "PS", "QA",
  "RW", "SB", "SC", "SL", "SR", "SS", "ST", "SX", "SY", "TD", "TF", "TG", "TK", "TL", "TO", "TV",
  "UG", "VU", "WS", "YE", "ZW",
];

const address = (fields) => ({
  name: "Ana",
  company: null,
  street1: "Main 1",
  street2: null,
  city: "Sarajevo",
  state: null,
  postal_code: "71000",
  country: "BA",
  phone: null,
  email: null,
  ...fields,
});

test("a shipping address misses exactly the fields the Server's rule refuses", () => {
  assert.deepEqual(missingShippingFields(address({ country: "HK", postal_code: null })), []);
  assert.deepEqual(missingShippingFields(address({ postal_code: null })), ["postal_code"]);
  assert.deepEqual(missingShippingFields(address({ country: "US", postal_code: "10001" })), ["state"]);
  assert.deepEqual(missingShippingFields(address({ name: "  " })), ["name"]);
  assert.deepEqual(missingShippingFields(address({ country: " hk ", postal_code: "" })), []);
  assert.deepEqual(missingShippingFields(address({ country: "BIH" })), ["country"]);
});

test("the client lists hold the Server's countries", () => {
  assert.equal(COUNTRIES_WITHOUT_POSTAL_CODES.length, 69);
  assert.deepEqual([...COUNTRIES_WITHOUT_POSTAL_CODES], serverCountriesWithoutPostalCodes);
  assert.deepEqual([...COUNTRIES_WITH_SHIPPING_STATES], ["US", "CA", "AU"]);
});
