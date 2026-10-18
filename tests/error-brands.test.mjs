import assert from "node:assert/strict";
import test from "node:test";

import * as admin from "../dist/admin.js";
import * as root from "../dist/index.js";
import * as storefront from "../dist/storefront.js";
import * as types from "../dist/types.js";
import * as utils from "../dist/utils.js";

const families = {
  CartError: { bundles: [root, storefront, types], make: (Kind) => new Kind("context_changed", "The buyer changed") },
  MonriCheckoutError: { bundles: [root, storefront, types], make: (Kind) => new Kind("unavailable", "Monri could not load") },
  FulfillmentSelectionError: { bundles: [root, admin, utils, types], make: (Kind) => new Kind("Select a valid line") },
  ScheduledResultTimeoutError: { bundles: [root, admin, storefront, utils], make: (Kind) => new Kind({ status: "pending" }) },
  DurableRequestError: { bundles: [root, storefront, utils], make: (Kind) => new Kind("busy", "Already running") },
  FormAnswerError: { bundles: [root, storefront, admin, types], make: (Kind) => new Kind("required", "name", "An answer is required") },
  CustomerGroupJoinError: { bundles: [root, storefront, types], make: (Kind) => new Kind("not_free", "Not free") },
  CheckoutFlowError: { bundles: [root, storefront], make: (Kind) => new Kind("busy", "A step is running") },
  ArkyNetworkError: { bundles: [root, storefront, admin, types], make: (Kind) => new Kind("network", "Socket closed"), name: "NetworkError" },
  ArkyApiError: { bundles: [root, storefront, admin, types], make: (Kind) => new Kind({ message: "Refused", code: "GENERAL.CONFLICT", statusCode: 409 }), name: "ApiError" },
};

const bases = [root, storefront, admin, types];

test("every SDK error class is recognised whichever entry point made it or checks it, and is an ArkyError with a code", () => {
  for (const [kind, family] of Object.entries(families)) {
    for (const maker of family.bundles) {
      const error = family.make(maker[kind]);
      assert.equal(error.name, family.name ?? kind);
      assert.equal(typeof error.code, "string", kind);
      for (const checker of family.bundles) assert.ok(error instanceof checker[kind], `${kind} across entry points`);
      for (const base of bases) assert.ok(error instanceof base.ArkyError, `${kind} is an ArkyError`);
      assert.equal(Object.assign(new Error("lookalike"), { name: family.name ?? kind }) instanceof maker[kind], false, kind);
    }
  }
  assert.equal(new storefront.CartError("busy", "A checkout is already running").code, "busy");
  assert.equal(new storefront.FormAnswerError("required", "name", "An answer is required").questionKey, "name");
  assert.equal(new utils.FulfillmentSelectionError("Select a valid line").code, "invalid_selection");
  assert.equal(new admin.ScheduledResultTimeoutError({ status: "pending" }).code, "timeout");
  assert.deepEqual(new admin.ScheduledResultTimeoutError({ status: "pending" }).lastResult, { status: "pending" });
  assert.equal(Object.assign(new Error("lookalike"), { code: "busy" }) instanceof storefront.ArkyError, false);
});
