import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin, WEBHOOK_UNIT_EVENT_TYPES } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const tenantId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const webhookId = "8a2c4e6b-0d1f-4a3c-9e5b-7d9f1b3d5f7a";

test("tenant webhooks subscribe to package item price events by their Server names", async (context) => {
  for (const event of ["package_item_price.created", "package_item_price.updated", "package_item_price.deleted"]) {
    assert.ok(WEBHOOK_UNIT_EVENT_TYPES.includes(event), event);
  }
  for (const retired of ["price.created", "price.updated", "price.deleted"]) assert.equal(WEBHOOK_UNIT_EVENT_TYPES.includes(retired), false, retired);
  const calls = recordFetch(context, () => ({ id: webhookId }));
  const events = [{ type: "package_item_price.created" }, { type: "package_item_price.deleted" }];
  await createAdmin({ apiUrl: "https://webhooks.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).tenant.webhook.create({
    tenant_id: tenantId,
    id: webhookId,
    url: "https://hooks.example.test/arky",
    events,
    headers: {},
    secret: "whsec_contract",
    status: { type: "active" },
  });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/tenants/${tenantId}/webhooks`, { id: webhookId, url: "https://hooks.example.test/arky", events, headers: {}, secret: "whsec_contract", status: { type: "active" } }],
  ]);
});

test("tenant webhooks subscribe to fiscal receipt, invoice and credit note events by their Server names", async (context) => {
  const events = [
    { type: "fiscal_receipt.done" },
    { type: "fiscal_receipt.refused" },
    { type: "fiscal_receipt.unknown" },
    { type: "invoice.issued" },
    { type: "invoice.outside_number_removed" },
    { type: "invoice.discarded" },
    { type: "invoice.reversed" },
    { type: "credit_note.issued" },
  ];
  for (const { type } of events) assert.ok(WEBHOOK_UNIT_EVENT_TYPES.includes(type), type);
  const calls = recordFetch(context, () => ({ id: webhookId }));
  await createAdmin({ apiUrl: "https://webhooks.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).tenant.webhook.create({
    tenant_id: tenantId,
    id: webhookId,
    url: "https://hooks.example.test/accounting",
    events,
    headers: {},
    secret: "whsec_contract",
    status: { type: "active" },
  });
  assert.deepEqual(calls[0].body.events, events);
});
