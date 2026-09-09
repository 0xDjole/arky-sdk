import test from "node:test";
import assert from "node:assert/strict";
import { isValidKey, validateKey, toKey } from "../dist/index.js";

test("business keys accept exactly bounded lowercase ASCII identifiers", () => {
  for (const key of ["a", "0", "-", "_", "wholesale_ba-2026", "a".repeat(255)]) {
    assert.equal(isValidKey(key), true, key);
    assert.deepEqual(validateKey(key), { valid: true }, key);
  }
});

test("business key validation rejects case, Unicode, whitespace and overlong values", () => {
  for (const key of [
    "", "A", "Wholesale", "wholesale.BA", "wholesale.ba", "é", "商品",
    "wholesale\n", "wholesale\r\n", "wholesale\t", "wholesale ", " wholesale",
    "whole sale", "whole\u0000sale", "wholesale\u2028", "a".repeat(256),
  ]) {
    assert.equal(isValidKey(key), false, JSON.stringify(key));
    const result = validateKey(key);
    assert.equal(result.valid, false, JSON.stringify(key));
    assert.equal(typeof result.error, "string");
    assert.ok(result.error.length > 0);
  }
});

test("key generation is explicit and is not a validation fallback", () => {
  const authored = " Wholesale BA ";
  assert.equal(isValidKey(authored), false);
  assert.equal(validateKey(authored).valid, false);
  assert.equal(toKey(authored), "wholesale_ba");
  assert.equal(authored, " Wholesale BA ");
});
