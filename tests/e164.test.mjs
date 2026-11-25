import assert from "node:assert/strict";
import test from "node:test";
import { toE164 } from "../dist/utils.js";
import { toE164 as storefrontToE164 } from "../dist/storefront.js";

const number = (value) => ({ type: "number", number: value });

test("toE164 comes from arky-sdk/storefront, where storefront helpers are imported, as well as from arky-sdk/utils", () => {
  assert.equal(typeof storefrontToE164, "function");
  assert.deepEqual(storefrontToE164("BA", "061 123 456"), number("+38761123456"));
  assert.deepEqual(storefrontToE164("BA", "61 123 456"), toE164("BA", "61 123 456"));
});

test("a national number in a trunk-prefix country drops its trunk prefix and gains the country code", () => {
  assert.deepEqual(toE164("BA", "061 123 456"), number("+38761123456"));
  assert.deepEqual(toE164("HR", "091/234-5678"), number("+385912345678"));
  assert.deepEqual(toE164("DE", "030 1234567"), number("+49301234567"));
  assert.deepEqual(toE164("HU", "06 30 123 4567"), number("+36301234567"));
  assert.deepEqual(toE164(" ba ", "(061) 123.456"), number("+38761123456"));
});

test("a national number without its trunk prefix is refused with the prefix, so nothing is guessed", () => {
  assert.deepEqual(toE164("BA", "61 123 456"), { type: "national_prefix_missing", prefix: "0" });
  assert.deepEqual(toE164("HU", "30 123 4567"), { type: "national_prefix_missing", prefix: "06" });
  assert.deepEqual(toE164("HU", "06 01 234 567"), { type: "invalid_number" });
});

test("a country that keeps its leading digits uses the number as typed", () => {
  assert.deepEqual(toE164("IT", "06 1234 5678"), number("+390612345678"));
  assert.deepEqual(toE164("ES", "612 345 678"), number("+34612345678"));
});

test("North American numbers take ten digits, optionally after a leading 1, with valid area and exchange codes", () => {
  assert.deepEqual(toE164("US", "(415) 555-2671"), number("+14155552671"));
  assert.deepEqual(toE164("CA", "1 415 555 2671"), number("+14155552671"));
  assert.deepEqual(toE164("US", "(015) 555-2671"), { type: "invalid_number" });
  assert.deepEqual(toE164("US", "415 155 2671"), { type: "invalid_number" });
  assert.deepEqual(toE164("US", "555 2671"), { type: "invalid_number" });
});

test("an international number is read by its + or the country's international prefix, whatever country is named", () => {
  assert.deepEqual(toE164("BA", "+387 61 123 456"), number("+38761123456"));
  assert.deepEqual(toE164("ZZ", "+387 61 123 456"), number("+38761123456"));
  assert.deepEqual(toE164("BA", "00387 61 123 456"), number("+38761123456"));
  assert.deepEqual(toE164("US", "011 387 61 123 456"), number("+38761123456"));
  assert.deepEqual(toE164("AU", "0011 61 2 1234 5678"), number("+61212345678"));
});

test("a national number in a country the table doesn't hold is refused, so the person writes +", () => {
  assert.deepEqual(toE164("ZZ", "061 123 456"), { type: "unknown_country", country: "ZZ" });
  assert.deepEqual(toE164("LT", "8 612 34567"), { type: "unknown_country", country: "LT" });
});

test("the answer meets the Server's E.164 rule: +, 7 to 15 digits, the first not 0", () => {
  assert.deepEqual(toE164("BA", "+0123456789"), { type: "invalid_number" });
  assert.deepEqual(toE164("BA", "+123456"), { type: "invalid_number" });
  assert.deepEqual(toE164("BA", "+1234567"), number("+1234567"));
  assert.deepEqual(toE164("BA", "+123456789012345"), number("+123456789012345"));
  assert.deepEqual(toE164("BA", "+1234567890123456"), { type: "invalid_number" });
  assert.deepEqual(toE164("BA", "000 123"), { type: "invalid_number" });
});

test("empty input and input with other characters are refused before any country rule", () => {
  for (const input of ["", "   ", "(-)", "./"]) assert.deepEqual(toE164("BA", input), { type: "empty" }, JSON.stringify(input));
  for (const input of ["061 12a 456", "+387 61 123 456 ext 7", "387+61123456", "++38761123456"]) {
    assert.deepEqual(toE164("BA", input), { type: "invalid_characters" }, input);
  }
});
