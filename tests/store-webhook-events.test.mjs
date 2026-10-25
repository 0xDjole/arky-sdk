import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin, WEBHOOK_UNIT_EVENT_TYPES } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const webhookId = "8a2c4e6b-0d1f-4a3c-9e5b-7d9f1b3d5f7a";

test("store webhooks subscribe to catalog item price events by their Server names", async (context) => {
  for (const event of ["catalog_item_price.created", "catalog_item_price.updated", "catalog_item_price.deleted"]) {
    assert.ok(WEBHOOK_UNIT_EVENT_TYPES.includes(event), event);
  }
  for (const retired of ["price.created", "price.updated", "price.deleted"]) assert.equal(WEBHOOK_UNIT_EVENT_TYPES.includes(retired), false, retired);
  const calls = recordFetch(context, () => ({ id: webhookId }));
  const events = [{ type: "catalog_item_price.created" }, { type: "catalog_item_price.deleted" }];
  await createAdmin({ apiUrl: "https://webhooks.test", secretKey: "arky_api_webhooks" }).store.webhook.create({
    store_id: storeId,
    id: webhookId,
    url: "https://hooks.example.test/arky",
    events,
    headers: {},
    secret: "whsec_contract",
    status: { type: "active" },
  });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/webhooks`, { id: webhookId, url: "https://hooks.example.test/arky", events, headers: {}, secret: "whsec_contract", status: { type: "active" } }],
  ]);
});
