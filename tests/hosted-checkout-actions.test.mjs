import assert from "node:assert/strict";
import test from "node:test";
import * as sdk from "../dist/index.js";
import * as storefront from "../dist/storefront.js";

test("the browser checkout surface exposes one mount helper and typed Monri errors", () => {
  for (const entrypoint of [sdk, storefront]) {
    assert.equal(typeof entrypoint.createStripeEmbeddedCheckout, "function");
    assert.equal(typeof entrypoint.mountCheckoutAction, "function");
    assert.equal(typeof entrypoint.MonriCheckoutError, "function");
  }
});

test("mounting a no-op payment action performs no provider or DOM work", async () => {
  assert.equal(
    await storefront.mountCheckoutAction({ type: "none" }, "#checkout"),
    null,
  );
});
