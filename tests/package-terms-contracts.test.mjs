import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import {
  apiUrl,
  ids,
  publishableKey,
  recordFetch,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

const memberId = "0d4b8c62-3a75-4f0e-9a52-3e2bb2a3d5f1";
const memberPackageId = "7e3a9c51-2b84-4d6f-a0c7-5e1d3b9f2a68";
const version = 1_700_000_000_000;
const choices = [
  {
    package_item_id: "dc78a8a7-27c3-47c2-8063-2f62c7f7a661",
    variant_id: ids.variant,
  },
];
const agreedRenewal = {
  type: "every",
  cadence: { interval: "month", interval_count: 1 },
  on_exhaustion: { type: "pause" },
  unpaid_order: { type: "retain_debt" },
};

test("staff own-terms review and acceptance retain quantity, each frozen product's one variant, delivery and accepted package price", async (context) => {
  const result = {
    package_member: { id: memberId },
    created: null,
    withdrawn: null,
  };
  const calls = recordFetch(context, () => result);
  const api = createAdmin({ apiUrl: apiUrl, secretKey: "contract" }).eshop
    .packageMember;
  const terms = {
    package: {
      package_id: memberPackageId,
      renewal: agreedRenewal,
      stay: { type: "any_time" },
      minimum: { type: "none" },
      unit_price: 1200,
      price: { type: "offer", package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price },
      items: [
        {
          type: "get_product",
          package_item_id: choices[0].package_item_id,
          variant_id: choices[0].variant_id,
          quantity: 1,
          delivery: { type: "once_per_period", offset_days: 0, window_days: 7 },
          allocation_weight: 1,
        },
      ],
    },
    quantity: 3,
    deliveries: [],
    billing_address: null,
    purchase_order_number: "PO-77",
  };
  const input = {
    store_id: ids.store,
    id: memberId,
    expected_updated_at: version,
    terms,
    reason: "Three packages from next month",
  };
  const before = structuredClone(input);
  for (const [method, route] of [
    ["reviewTerms", "review-terms"],
    ["changeTerms", "change-terms"],
  ]) {
    assert.deepEqual(await api[method](input), result);
    assert.equal(
      calls.at(-1).path,
      `/v1/stores/${ids.store}/package-members/${memberId}/${route}`,
    );
    assert.deepEqual(calls.at(-1).body, {
      expected_updated_at: version,
      terms,
      reason: input.reason,
    });
    assert.equal(calls.at(-1).method, "POST");
    assert.deepEqual(Object.keys(calls.at(-1).body.terms).sort(), ["billing_address", "deliveries", "package", "purchase_order_number", "quantity"]);
    assert.equal(calls.at(-1).body.terms.purchase_order_number, "PO-77");
  }
  assert.deepEqual(input, before);
  assert.equal(calls.length, 2);
});

test("buyer own-terms sends only editable accepted fields and preserves the exact choices", async (context) => {
  const result = {
    package_member: { id: memberId },
    created: null,
    withdrawn: null,
  };
  const calls = recordFetch(context, () => result);
  const api = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: visitorStorage(),
    visitorIdentity: {
      customer_id: ids.customer,
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    createVisitorIdentity: () => ({
      customer_id: ids.customer,
      session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
    }),
    createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
  }).eshop.packageMember;
  const input = {
    id: memberId,
    expected_updated_at: version,
    quantity: 3,
    choices,
    deliveries: [],
    billing_address: null,
    purchase_order_number: null,
    reason: "Change the chosen product",
  };
  const before = structuredClone(input);
  const { id: _id, ...body } = input;
  for (const [method, route] of [
    ["reviewTerms", "review-terms"],
    ["changeTerms", "change-terms"],
  ]) {
    assert.deepEqual(await api[method](input), result);
    assert.equal(
      calls.at(-1).path,
      `/v1/storefront/package-members/${memberId}/${route}`,
    );
    assert.deepEqual(calls.at(-1).body, body);
    assert.equal(
      calls.at(-1).headers.get("authorization"),
      `Bearer ${visitorToken}`,
    );
    assert.equal("package" in calls.at(-1).body, false);
    assert.equal("terms" in calls.at(-1).body, false);
    assert.equal("store_id" in calls.at(-1).body, false);
    assert.equal(calls.at(-1).body.purchase_order_number, null);
  }
  assert.deepEqual(input, before);
  assert.equal(calls.length, 2);
});

test("buyer current terms reads the canonical member response with authentication and no package fallback", async (context) => {
  const result = {
    package_member: { id: memberId },
    revision: null,
    terms: null,
    head_revision_id: null,
  };
  const calls = recordFetch(context, () => result);
  const api = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: visitorStorage(),
    visitorIdentity: {
      customer_id: ids.customer,
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    createVisitorIdentity: () => ({
      customer_id: ids.customer,
      session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
    }),
    createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
  }).eshop.packageMember;
  assert.deepEqual(await api.getCurrent({ id: memberId }), result);
  assert.equal(
    calls[0].path,
    `/v1/storefront/package-members/${memberId}/current`,
  );
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[0].url.search, "");
});

test("sale and accepted Product choices keep exact package and current member revision fences and answer blocks, not names", async (context) => {
  const item = choices[0].package_item_id;
  const revision = "c5de228a-691f-45b1-aaeb-8e30bf0249a0";
  const result = {
    package_item_id: item,
    alternatives: [
      {
        variant_id: ids.variant,
        sku: "SKU-1",
        product_blocks: [{ id: ids.line, key: "name", type: "localized_text", value: { "sr-Latn-BA": "Klasik" } }],
        variant_blocks: [{ id: ids.otherLine, key: "flavor", type: "localized_text", value: { "sr-Latn-BA": "Blagi" } }],
        available: true,
      },
      {
        variant_id: "3f8c1a5e-7b29-4d64-9e03-5a2d8c6f1b47",
        sku: "SKU-2",
        product_blocks: [],
        variant_blocks: [],
        available: false,
      },
    ],
  };
  const calls = recordFetch(context, () => result);
  const api = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: visitorStorage(),
    visitorIdentity: {
      customer_id: ids.customer,
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    createVisitorIdentity: () => ({
      customer_id: ids.customer,
      session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
    }),
    createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
  });
  const sale = {
    id: memberPackageId,
    package_item_id: item,
    package_id: ids.package,
    quantity: 3,
  };
  const member = {
    id: memberId,
    package_item_id: item,
    expected_updated_at: version,
    revision_id: revision,
  };
  const before = structuredClone({ sale, member });
  assert.deepEqual(await api.eshop.package.getProductChoices(sale), result);
  assert.equal(
    calls[0].path,
    `/v1/storefront/packages/${memberPackageId}/product-choices/${item}`,
  );
  assert.deepEqual(calls[0].query, {
    package_id: ids.package,
    quantity: "3",
  });
  assert.deepEqual(
    await api.eshop.packageMember.getProductChoices(member),
    result,
  );
  assert.equal(
    calls[1].path,
    `/v1/storefront/package-members/${memberId}/product-choices/${item}`,
  );
  assert.deepEqual(calls[1].query, {
    expected_updated_at: String(version),
    revision_id: revision,
  });
  assert.equal(calls[1].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.deepEqual({ sale, member }, before);
});

test("member delivery options preserve proposed terms and exact authenticated version, revision and language", async (context) => {
  const revision_id = "c5de228a-691f-45b1-aaeb-8e30bf0249a0";
  const delivery_id = "b3b57589-1cc6-4fa9-8333-ad818d9d8eaf";
  const address = {
    name: "Customer",
    company: null,
    street1: "2 New Street",
    street2: null,
    city: "Sarajevo",
    state: null,
    postal_code: "71000",
    country: "BA",
    phone: null,
    email: null,
  };
  const delivery = {
    id: delivery_id,
    package_item_ids: [choices[0].package_item_id],
    destination: { type: "delivery", address },
    shipping_method_id: "c1b3d251-9243-47e5-9445-8489a7f21653",
    shipping_profile_id: "fb14f4a3-a278-43f5-8497-f0d9a8ee2548",
    base_fee: 100,
  };
  const result = {
    package_member: { id: memberId, updated_at: version },
    revision_id,
    delivery_id,
    language: "sr-Latn-BA",
    currency: "bam",
    destination: delivery.destination,
    offers: [],
  };
  const calls = recordFetch(context, () => result);
  const api = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: visitorStorage(),
    visitorIdentity: {
      customer_id: ids.customer,
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    createVisitorIdentity: () => ({
      customer_id: ids.customer,
      session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
    }),
    createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
  }).eshop.packageMember;
  const input = {
    id: memberId,
    expected_updated_at: version,
    revision_id,
    delivery_id,
    language: result.language,
    quantity: 3,
    choices,
    deliveries: [delivery],
    billing_address: null,
    purchase_order_number: "PO-77",
  };
  const before = structuredClone(input);
  assert.deepEqual(await api.getDeliveryOptions(input), result);
  const { id: _id, delivery_id: _delivery, ...body } = input;
  assert.equal(
    calls[0].path,
    `/v1/storefront/package-members/${memberId}/delivery-options/${delivery_id}`,
  );
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.deepEqual(calls[0].body, body);
  assert.equal("store_id" in calls[0].body, false);
  assert.equal("package_id" in calls[0].body, false);
  assert.equal("package" in calls[0].body, false);
  assert.equal("reason" in calls[0].body, false);
  assert.equal(calls[0].body.purchase_order_number, "PO-77");
  assert.deepEqual(input, before);
});

test("a switch's new delivery lists its rates through the switch delivery options with the move, the current revision and the language", async (context) => {
  const revision_id = "c5de228a-691f-45b1-aaeb-8e30bf0249a0";
  const delivery_id = "6e2b9d14-7a35-4c80-9f1e-3d5a8c2b7e41";
  const printPackageId = "9d4f2b71-3c86-4e05-a8b1-6f0e3c9d5a27";
  const address = {
    name: "Customer",
    company: null,
    street1: "2 New Street",
    street2: null,
    city: "Sarajevo",
    state: null,
    postal_code: "71000",
    country: "BA",
    phone: null,
    email: null,
  };
  const asked = {
    id: delivery_id,
    package_item_ids: [choices[0].package_item_id],
    destination: { type: "delivery", address },
    shipping_method_id: delivery_id,
    shipping_profile_id: "fb14f4a3-a278-43f5-8497-f0d9a8ee2548",
    base_fee: 0,
  };
  const result = {
    package_member: { id: memberId, updated_at: version },
    revision_id,
    delivery_id,
    language: "en",
    currency: "eur",
    destination: asked.destination,
    offers: [
      {
        shipping_method_id: "c1b3d251-9243-47e5-9445-8489a7f21653",
        shipping_method_key: "courier",
        shipping_method_blocks: [],
        rate_id: "0b7e4d29-6a15-4c83-9f20-8d3e1a5c7b96",
        base_fee: 600,
        window_amounts: [600],
      },
    ],
  };
  const calls = recordFetch(context, () => result);
  const api = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: visitorStorage(),
    visitorIdentity: {
      customer_id: ids.customer,
      session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
    },
    createVisitorIdentity: () => ({
      customer_id: ids.customer,
      session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
    }),
    createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`,
  }).eshop.packageMember;
  const input = {
    id: memberId,
    delivery_id,
    expected_updated_at: version,
    revision_id,
    language: "en",
    to_package_id: printPackageId,
    choices,
    price: { package_id: ids.package, package_item_id: ids.packageItem, price_id: ids.price },
    deliveries: [asked],
  };
  const before = structuredClone(input);
  assert.deepEqual(await api.getSwitchDeliveryOptions(input), result);
  const { id: _id, delivery_id: _delivery, ...body } = input;
  assert.equal(
    calls[0].path,
    `/v1/storefront/package-members/${memberId}/switch-delivery-options/${delivery_id}`,
  );
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.deepEqual(calls[0].body, body);
  assert.deepEqual(Object.keys(calls[0].body).sort(), ["choices", "deliveries", "expected_updated_at", "language", "price", "revision_id", "to_package_id"]);
  assert.equal(calls[0].url.search, "");
  assert.deepEqual(input, before);
  const [offer] = result.offers;
  const chosen = { ...asked, shipping_method_id: offer.shipping_method_id, base_fee: offer.base_fee };
  const { revision_id: _revision, language: _language, delivery_id: _asked, ...move } = input;
  await api.reviewSwitch({ ...move, deliveries: [chosen], reason: "Add the print edition" });
  assert.equal(calls[1].path, `/v1/storefront/package-members/${memberId}/review-switch`);
  assert.deepEqual(calls[1].body, {
    expected_updated_at: version,
    to_package_id: printPackageId,
    choices,
    price: input.price,
    deliveries: [chosen],
    reason: "Add the print edition",
  });
  assert.equal(calls.length, 2);
});
