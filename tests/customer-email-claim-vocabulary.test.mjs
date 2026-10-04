import assert from "node:assert/strict";
import test from "node:test";
import { customerEmailClaimContactOffsets } from "../scripts/customer-email-claim-vocabulary.mjs";

test("the vocabulary allowance identifies only the canonical email claim contact tag", () => {
  const source = `export type CustomerEmailClaim =
  | { type: "contact" }
  | { type: "reserved"; reserved_at: number }
  | { type: "verified"; verified_at: number };
export type CustomerStatus = { type: "contact" };
const other = "contact";`;
  const contacts = [...source.matchAll(/"contact"/g)].map((match) => match.index);
  const allowed = customerEmailClaimContactOffsets(source);
  assert.deepEqual([...allowed], [contacts[0]]);
  assert.equal(allowed.has(contacts[1]), false);
  assert.equal(allowed.has(contacts[2]), false);
});

test("renamed lifecycle unions and unscoped contact tags remain forbidden", () => {
  for (const source of [
    'export type CustomerStatus = | { type: "contact" };',
    'export type OtherEmailClaim = | { type: "contact" };',
    'type CustomerEmailClaim = | { type: "contact" };',
    'const status = "contact";',
  ]) {
    assert.equal(customerEmailClaimContactOffsets(source).size, 0);
  }
});
