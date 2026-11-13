import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const orderId = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const invoiceId = "5d1c7e93-2a46-4b08-9f3e-6c0a8d2b4e71";
const creditNoteId = "8b2e4f60-1c37-4d95-a6e8-3f7b0c9d1a52";
const cursor = "opaque:page/+=binding";

function admin() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function recordCalls(context, answer) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    return new Response(JSON.stringify(answer(call)), { status: 200, headers: { "content-type": "application/json" } });
  });
  return calls;
}

test("invoices are attached under the app's id, listed for an order or the whole store, and removed by version", async (context) => {
  const calls = recordCalls(context, (call) => {
    if (call.method === "GET") return { items: [], cursor: null };
    if (call.method === "DELETE") return { deleted: true };
    return { id: call.body.id };
  });
  const api = admin().eshop.order.invoice;
  const invoice = { id: invoiceId, type: { type: "invoice" }, number: "INV-2026-0001", url: "https://accounting.example.test/invoices/1" };
  const creditNote = { id: creditNoteId, type: { type: "credit_note", invoice_id: invoiceId }, number: "CN-2026-0001", url: "https://accounting.example.test/credit-notes/1" };
  await api.create({ store_id: storeId, order_id: orderId, ...invoice });
  await api.create({ store_id: storeId, order_id: orderId, ...creditNote });
  assert.deepEqual(await api.find({ store_id: storeId, order_id: orderId }), { items: [], cursor: null });
  await api.find({ store_id: storeId, limit: 50, cursor });
  assert.deepEqual(await api.delete({ store_id: storeId, order_id: orderId, invoice_id: creditNoteId, expected_updated_at: 7 }), { deleted: true });
  const orderInvoices = `/v1/stores/${storeId}/orders/${orderId}/invoices`;
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, Object.fromEntries(url.searchParams), body]), [
    ["POST", orderInvoices, {}, invoice],
    ["POST", orderInvoices, {}, creditNote],
    ["GET", `/v1/stores/${storeId}/invoices`, { order_id: orderId }, null],
    ["GET", `/v1/stores/${storeId}/invoices`, { limit: "50", cursor }, null],
    ["DELETE", `${orderInvoices}/${creditNoteId}`, { expected_updated_at: "7" }, null],
  ]);
});

test("an invoice id is picked by the app, so a made-up one is refused before any request", async (context) => {
  const calls = recordCalls(context, () => ({}));
  await assert.rejects(
    async () => admin().eshop.order.invoice.create({
      store_id: storeId,
      order_id: orderId,
      id: "invoice-1",
      type: { type: "invoice" },
      number: "INV-1",
      url: "https://accounting.example.test/1",
    }),
    { name: "TypeError", message: "The invoice id must be a canonical UUID v4 picked by the app" },
  );
  assert.equal(calls.length, 0);
});

test("invoices are their own records, so the order calls no longer attach or remove them", () => {
  const order = admin().eshop.order;
  for (const removed of ["addInvoice", "deleteInvoice"]) assert.equal(removed in order, false, removed);
  assert.deepEqual(Object.keys(order.invoice).sort(), ["create", "delete", "find"]);
  assert.equal("invoice" in admin().eshop, false);
});
