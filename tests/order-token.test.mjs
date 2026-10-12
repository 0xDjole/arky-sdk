import assert from "node:assert/strict";
import test from "node:test";
import { createOrderToken, isOrderToken, readOrderToken, retainOrderToken } from "../dist/index.js";
import { ids } from "./helpers/arky-fixtures.mjs";

test("Order tokens contain 256 random bits with canonical encoding", () => {
  const tokens = Array.from({ length: 32 }, () => createOrderToken());
  assert.equal(new Set(tokens).size, tokens.length);
  for (const token of tokens) {
    assert.equal(isOrderToken(token), true);
    assert.equal(Buffer.from(token.slice(8), "base64url").length, 32);
    assert.equal(Buffer.from(token.slice(8), "base64url").toString("base64url") === token.slice(8), true);
  }
  assert.equal(isOrderToken("arky_ot_" + "B".repeat(43)), false);
});

test("Retained Order capability is bound to exact API, Store, and Order", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const storage = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
  try {
    const token = createOrderToken();
    retainOrderToken("https://api.test|store-a", ids.order, token);
    assert.equal(readOrderToken("https://api.test|store-a", ids.order) === token, true);
    assert.equal(readOrderToken("https://api.test|store-a", ids.otherOrder), null);
    assert.equal(readOrderToken("https://api.test|store-b", ids.order), null);
    assert.equal(readOrderToken("https://other.test|store-a", ids.order), null);
    assert.throws(() => retainOrderToken("https://api.test|store-a", ids.order, createOrderToken()), /different retained token/);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});
