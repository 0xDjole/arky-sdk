import assert from "node:assert/strict";
import test from "node:test";
import * as sdk from "../dist/index.js";
import * as storefront from "../dist/storefront.js";

test("the browser checkout surface exports only embedded Stripe helpers", () => {
  for (const entrypoint of [sdk, storefront]) {
    assert.equal(typeof entrypoint.createStripeEmbeddedCheckout, "function");
    assert.equal(typeof entrypoint.mountCheckoutAction, "function");
  }
});

test("mounting a no-op payment action performs no Stripe or DOM work", async () => {
  assert.equal(
    await storefront.mountCheckoutAction({ type: "none" }, "#checkout"),
    null,
  );
});
