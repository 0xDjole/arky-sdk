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
const groupId = "7e3a9c51-2b84-4d6f-a0c7-5e1d3b9f2a68";
const version = 1_700_000_000_000;
const choices = [
  {
    entitlement_id: "dc78a8a7-27c3-47c2-8063-2f62c7f7a661",
    variant_id: ids.variant,
  },
];
const term = {
  type: "recurring",
  cadence: { interval: "month", interval_count: 1 },
  commitment: null,
  on_exhaustion: { type: "pause" },
  unpaid_order: { type: "retain_debt" },
  retry_offsets_seconds: [86_400],
  recovery_window_seconds: 604_800,
  renewal_reminder_days: 3,
};

test("staff own-terms review and acceptance retain quantity, choices, delivery and accepted group price", async (context) => {
  const result = {
    customer_group_member: { id: memberId },
    created: null,
    withdrawn: null,
  };
  const calls = recordFetch(context, () => result);
  const api = createAdmin({ baseUrl: apiUrl, secretKey: "contract" }).eshop
    .customerGroupMember;
  const terms = {
    group: {
      customer_group_id: groupId,
      term,
      purchase_requirement: null,
      unit_price: 1200,
      price: { type: "offer" },
      entitlements: [],
    },
    quantity: 3,
    choices,
    deliveries: [],
    billing_address: null,
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
      `/v1/stores/${ids.store}/customer-group-members/${memberId}/${route}`,
    );
    assert.deepEqual(calls.at(-1).body, {
      expected_updated_at: version,
      terms,
      reason: input.reason,
    });
    assert.equal(calls.at(-1).method, "POST");
  }
  assert.deepEqual(input, before);
  assert.equal(calls.length, 2);
});

test("buyer own-terms sends only editable accepted fields and preserves the exact choices", async (context) => {
  const result = {
    customer_group_member: { id: memberId },
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
  }).eshop.customerGroupMember;
  const input = {
    id: memberId,
    expected_updated_at: version,
    quantity: 3,
    choices,
    deliveries: [],
    billing_address: null,
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
      `/v1/storefront/customer-group-members/${memberId}/${route}`,
    );
    assert.deepEqual(calls.at(-1).body, body);
    assert.equal(
      calls.at(-1).headers.get("authorization"),
      `Bearer ${visitorToken}`,
    );
    assert.equal("group" in calls.at(-1).body, false);
    assert.equal("terms" in calls.at(-1).body, false);
    assert.equal("store_id" in calls.at(-1).body, false);
  }
  assert.deepEqual(input, before);
  assert.equal(calls.length, 2);
});

test("buyer current terms reads the canonical member response with authentication and no catalog fallback", async (context) => {
  const result = {
    customer_group_member: { id: memberId },
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
  }).eshop.customerGroupMember;
  assert.deepEqual(await api.current({ id: memberId }), result);
  assert.equal(
    calls[0].path,
    `/v1/storefront/customer-group-members/${memberId}/current`,
  );
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[0].url.search, "");
});

test("sale and accepted Product choices keep exact catalog, language and current member revision fences", async (context) => {
  const entitlement = choices[0].entitlement_id;
  const revision = "c5de228a-691f-45b1-aaeb-8e30bf0249a0";
  const result = {
    entitlement_id: entitlement,
    language: "sr-Latn-BA",
    alternatives: [
      {
        variant_id: ids.variant,
        product_name: "Klasik",
        variant_name: null,
        sku: "SKU-1",
        options: [{ label: "Ukus", value: "Blagi" }],
        available: true,
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
    identifier: groupId,
    entitlement_id: entitlement,
    catalog_id: ids.catalog,
    quantity: 3,
    language: result.language,
  };
  const member = {
    id: memberId,
    entitlement_id: entitlement,
    expected_updated_at: version,
    revision_id: revision,
    language: result.language,
  };
  const before = structuredClone({ sale, member });
  assert.deepEqual(await api.eshop.customerGroup.productChoices(sale), result);
  assert.equal(
    calls[0].path,
    `/v1/storefront/customer-groups/${groupId}/product-choices/${entitlement}`,
  );
  assert.deepEqual(calls[0].query, {
    catalog_id: ids.catalog,
    quantity: "3",
    language: result.language,
  });
  assert.deepEqual(
    await api.eshop.customerGroupMember.productChoices(member),
    result,
  );
  assert.equal(
    calls[1].path,
    `/v1/storefront/customer-group-members/${memberId}/product-choices/${entitlement}`,
  );
  assert.deepEqual(calls[1].query, {
    expected_updated_at: String(version),
    revision_id: revision,
    language: result.language,
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
    entitlement_ids: [choices[0].entitlement_id],
    destination: { type: "delivery", address },
    shipping_method_id: "c1b3d251-9243-47e5-9445-8489a7f21653",
    shipping_profile_id: "fb14f4a3-a278-43f5-8497-f0d9a8ee2548",
    base_fee: 100,
  };
  const result = {
    customer_group_member: { id: memberId, updated_at: version },
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
  }).eshop.customerGroupMember;
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
  };
  const before = structuredClone(input);
  assert.deepEqual(await api.deliveryOptions(input), result);
  const { id: _id, delivery_id: _delivery, ...body } = input;
  assert.equal(
    calls[0].path,
    `/v1/storefront/customer-group-members/${memberId}/delivery-options/${delivery_id}`,
  );
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.deepEqual(calls[0].body, body);
  assert.equal("store_id" in calls[0].body, false);
  assert.equal("catalog_id" in calls[0].body, false);
  assert.equal("group" in calls[0].body, false);
  assert.equal("reason" in calls[0].body, false);
  assert.deepEqual(input, before);
});
