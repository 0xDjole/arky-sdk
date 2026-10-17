import assert from "node:assert/strict";
import test from "node:test";

import { ArkyApiError as RootApiError, createAdmin } from "../dist/index.js";
import { ArkyApiError as AdminApiError } from "../dist/admin.js";
import {
  ArkyApiError,
  CartPresentationChangedError,
  createStorefront,
  isArkyApiError,
  isDefiniteRefusal,
} from "../dist/storefront.js";
import {
  apiUrl,
  checkoutRequest,
  errorResponse,
  idFactories,
  jsonResponse,
  publishableKey,
  quoteRecord,
  recordFetch,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

function storefront() {
  return createStorefront(publishableKey, { ...idFactories, apiUrl, locale: "en", sessionStorage: visitorStorage() });
}

test("a refused request throws an ArkyApiError with the Server's code, status, message and request id", async (context) => {
  recordFetch(context, () => {
    const response = errorResponse(422, "GENERAL.VALIDATION_FAILED", "The email is invalid", {
      validation_errors: [{ field: "email", error: "GENERAL.INVALID_EMAIL" }],
    });
    response.headers.set("x-request-id", "request-7");
    return response;
  });
  const error = await storefront().customer.getMe().catch((caught) => caught);
  assert.ok(error instanceof ArkyApiError);
  assert.ok(error instanceof RootApiError);
  assert.ok(error instanceof AdminApiError);
  assert.ok(error instanceof Error);
  assert.equal(isArkyApiError(error), true);
  assert.equal(error.name, "ApiError");
  assert.equal(error.code, "GENERAL.VALIDATION_FAILED");
  assert.equal(error.statusCode, 422);
  assert.equal(error.message, "The email is invalid");
  assert.deepEqual(error.validationErrors, [{ field: "email", error: "GENERAL.INVALID_EMAIL" }]);
  assert.equal(error.requestId, "request-7");
  assert.equal(error.method, "GET");
  assert.equal(error.url, `${apiUrl}/v1/storefront/customer/me`);
  assert.equal(error.response.error, "GENERAL.VALIDATION_FAILED");
  assert.equal(isDefiniteRefusal(error), true);
});

test("network failures are not ArkyApiErrors and are not definite refusals", async (context) => {
  recordFetch(context, () => {
    throw new TypeError("socket closed");
  });
  const error = await storefront().customer.getMe().catch((caught) => caught);
  assert.equal(error.name, "NetworkError");
  assert.equal(error instanceof ArkyApiError, false);
  assert.equal(isArkyApiError(error), false);
  assert.equal(isDefiniteRefusal(error), false);
});

test("Admin refusals are the same ArkyApiError class", async (context) => {
  recordFetch(context, () => errorResponse(401, "GENERAL.UNAUTHENTICATED", "Expired"));
  const admin = createAdmin({ baseUrl: apiUrl, secretKey: "arky_sk_test" });
  const error = await admin.account.getMe().catch((caught) => caught);
  assert.ok(error instanceof ArkyApiError);
  assert.ok(error instanceof AdminApiError);
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, "GENERAL.UNAUTHENTICATED");
  assert.equal(error.message, "Expired");
});

test("a changed checkout presentation is an ArkyApiError that carries the new quote", async (context) => {
  const quote = quoteRecord({ presentation_digest: "c".repeat(64) });
  recordFetch(context, () =>
    jsonResponse({ message: "Review", error: "COMMERCE.PRESENTATION_CHANGED", status_code: 409, validation_errors: [], quote }, 409),
  );
  const error = await storefront().eshop.cart.checkout(checkoutRequest()).catch((caught) => caught);
  assert.ok(error instanceof CartPresentationChangedError);
  assert.ok(error instanceof ArkyApiError);
  assert.equal(error.name, "CartPresentationChangedError");
  assert.equal(error.code, "COMMERCE.PRESENTATION_CHANGED");
  assert.equal(error.statusCode, 409);
  assert.deepEqual(error.quote, quote);
  assert.equal(error.url, `${apiUrl}/v1/storefront/carts/accept`);
  assert.equal(isDefiniteRefusal(error), true);
  assert.equal(new ArkyApiError({ message: "x", code: "GENERAL.CONFLICT", statusCode: 409 }) instanceof CartPresentationChangedError, false);
});
