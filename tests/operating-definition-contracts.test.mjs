import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const selectedTenantId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const id = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const marketId = "c383595f-8bcc-4dcd-9f0a-aaf0e31d7557";
const cursor = "opaque:page/+=binding";

for (const definition of [
  { path: ["tenant", "salesChannel"], route: "sales-channels", filters: { key: "web" } },
  { path: ["tenant", "zone"], route: "zones", filters: { market_id: marketId } },
  { path: ["tenant", "taxCategory"], route: "tax-categories", filters: { key: "reduced" } },
  { path: ["eshop", "package"], route: "packages", filters: { market_id: marketId } },
]) {
  test(`${definition.route} keep the empty-page continuation and the exact tenant and filters`, async (context) => {
    const calls = recordFetch(context, (_call, count) => count === 1 ? { items: [], cursor } : { items: [{ id, tenant_id: selectedTenantId }], cursor: null });
    const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
    const api = definition.path.reduce((owner, key) => owner[key], admin);
    const query = { tenant_id: selectedTenantId, ...definition.filters, limit: 20 };
    const first = await api.find(query);
    assert.deepEqual(first, { items: [], cursor });
    assert.equal(calls.length, 1);
    const second = await api.find({ ...query, cursor: first.cursor });
    assert.deepEqual(second, { items: [{ id, tenant_id: selectedTenantId }], cursor: null });
    assert.equal(calls.length, 2);
    for (const [index, call] of calls.entries()) {
      assert.equal(call.method, "GET");
      assert.equal(call.path, `/v1/tenants/${selectedTenantId}/${definition.route}`);
      assert.deepEqual(call.query, { ...definition.filters, limit: "20", ...(index === 0 ? {} : { cursor }) });
    }
    assert.deepEqual(query, { tenant_id: selectedTenantId, ...definition.filters, limit: 20 });
    await assert.rejects(async () => api.find({ ...definition.filters }), TypeError);
    assert.equal(calls.length, 2);
  });
}



test("the Admin client has no remembered tenant and no payment-terms definitions", () => {
  const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.equal("setTenantId" in admin, false);
  assert.equal("tenantId" in admin, false);
  assert.equal("paymentTerms" in admin.tenant, false);
  assert.equal("storefrontClient" in admin.tenant, false);
});
