import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl as storefrontApiUrl, factoryOrderToken, fixedIdFactories, recordFetch, storefrontIdentity, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const tenantId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const orderId = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const invoiceId = "5d1c7e93-2a46-4b08-9f3e-6c0a8d2b4e71";
const reversalId = "3a8f6c21-9d47-4b05-8e13-7c2b5d9f0a64";
const newInvoiceId = "6e1b9d37-4a52-4c08-b7f6-2d9a3c5e8f10";
const creditNoteId = "8b2e4f60-1c37-4d95-a6e8-3f7b0c9d1a52";
const creditId = "1f7c3a95-6b28-4e40-9d13-5a2e8c0b7d46";
const counterId = "9d4b2e71-3c56-4a08-8f1e-6b7a0c3d5e29";
const sellerId = "2c6e8a14-7b39-4d05-a1f2-9e3c5b7d0a68";
const lineItemId = "19f4bc18-4259-46b8-b5ef-3579d1dac971";
const receiptId = "3c8e1a64-7b29-4d05-9f3e-2a6c8b0d4e17";
const otherReceiptId = "7d2f9b14-6c38-4a05-9e21-8b4c0f6a3d57";
const cursor = "opaque:page/+=binding";

const address = {
  name: "Ana Buyer",
  company: "Klinika d.o.o.",
  street1: "Titova 1",
  street2: null,
  city: "Sarajevo",
  state: null,
  postal_code: "71000",
  country: "BA",
  phone: "+38761222333",
  email: "billing@klinika.example.test",
};

const sellerAddress = {
  name: null,
  company: "Klinika d.o.o.",
  street1: "Titova 1",
  street2: null,
  city: "Sarajevo",
  state: null,
  postal_code: "71000",
  country: "BA",
  phone: null,
  email: null,
};

const companyTax = { type: "standard", registrations: [{ country: "BA", region: null, identifier: "4200000000001" }] };
const rate = { numerator: 17, denominator: 100 };

function admin() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function unissued(id = invoiceId) {
  return { id, tenant_id: tenantId, order_id: orderId, type: { type: "unissued_invoice", reason: "blocked" }, fiscal_receipts: [], created_at: 1, updated_at: 2 };
}

function invoiceDocument(sequence, text) {
  return {
    number: { sequence, text },
    issued_at: 1_788_870_000_000,
    issued_on: "2026-09-08",
    order_number: "1042",
    language: "bs-BA",
    seller: {
      name: "Klinika d.o.o.",
      address: sellerAddress,
      tax: { type: "vat_registered", tax_id: "4200000000000", vat_id: "200000000000" },
      footer: { type: "text", text: "Hvala na povjerenju" },
    },
    buyer: { type: "company", name: "Firma d.o.o.", address, tax: companyTax, purchase_order: { type: "number", number: "PO-7" } },
    place: { type: "tenant_location", address: sellerAddress },
    supplied: { type: "on", date: "2026-09-08" },
    currency: "bam",
    pricing: "tax_included",
    lines: [
      {
        target: { type: "booking", line_item_id: lineItemId },
        item: { type: "coded", code: "86900000", name: "Pregled", unit: "kom" },
        quantity: 1,
        unit_price: 11700,
        discount: 0,
        tax: { type: "rates", lines: [{ title: "PDV", code: "E", calculation: { type: "percentage", rate, base: 10000 }, amount: 1700 }] },
      },
    ],
    totals: { net: 10000, groups: [{ type: "percentage", title: "PDV", code: "E", rate, base: 10000, amount: 1700 }], gross: 11700 },
  };
}

function issued() {
  return {
    id: invoiceId,
    tenant_id: tenantId,
    order_id: orderId,
    type: {
      type: "invoice",
      document: invoiceDocument(17, "2026-000017"),
      payment_details: { type: "paid" },
      fiscal_receipt_ids: [receiptId, otherReceiptId],
      memo: { type: "none" },
    },
    fiscal_receipts: [
      { fiscal_receipt_id: receiptId, number: { type: "issued", number: "AB12CD34-AB12CD34-17" } },
      { fiscal_receipt_id: otherReceiptId, number: { type: "pending" } },
    ],
    created_at: 1,
    updated_at: 2,
  };
}

test("invoices are listed for an order or the whole tenant and read with their frozen document and receipt numbers", async (context) => {
  const calls = recordFetch(context, (call) => (call.path.endsWith("/invoices") ? { items: [issued(), unissued(newInvoiceId)], cursor: null } : issued()));
  const api = admin().eshop.order.invoice;
  assert.deepEqual(await api.find({ tenant_id: tenantId, order_id: orderId }), { items: [issued(), unissued(newInvoiceId)], cursor: null });
  await api.find({ tenant_id: tenantId, limit: 50, cursor });
  const read = await api.get({ tenant_id: tenantId, invoice_id: invoiceId });
  assert.deepEqual(read, issued());
  assert.equal(read.type.document.totals.gross, 11700);
  assert.deepEqual(read.fiscal_receipts.map((receipt) => receipt.number.type), ["issued", "pending"]);
  const base = `/v1/tenants/${tenantId}/invoices`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { order_id: orderId }, null],
    ["GET", base, { limit: "50", cursor }, null],
    ["GET", `${base}/${invoiceId}`, {}, null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA");
});

test("an Order is issued to the order's buyer or a buyer staff name, with a memo or none", async (context) => {
  const calls = recordFetch(context, () => issued());
  const api = admin().eshop.order.invoice;
  const buyers = [
    { type: "order" },
    { type: "person", name: "Ana Buyer", address: { country: "BA", street1: "Titova 1", city: "Sarajevo" } },
    { type: "company", name: "Firma d.o.o.", address, tax: { type: "reverse_charge", registration: { country: "HR", region: null, identifier: "HR12345678901" } }, purchase_order: { type: "none" } },
    {
      type: "company_location",
      company_name: "Firma d.o.o.",
      location_name: "Poslovnica Mostar",
      address,
      tax: { type: "exempt", reason: "Diplomatic mission", registrations: [] },
      purchase_order: { type: "number", number: "PO-7" },
    },
  ];
  const memo = { type: "text", text: "Plaćanje u roku 14 dana" };
  for (const [index, buyer] of buyers.entries()) {
    assert.deepEqual(await api.issue({ tenant_id: tenantId, order_id: orderId, buyer, memo: index === 0 ? memo : { type: "none" } }), issued());
  }
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), buyers.map((buyer, index) => [
    "POST",
    `/v1/tenants/${tenantId}/invoices`,
    {},
    { order_id: orderId, buyer, memo: index === 0 ? memo : { type: "none" } },
  ]));
});

test("a reissue reverses the invoice and issues a new one under two app-picked ids, voids the credits it names and answers three full documents", async (context) => {
  const corrects = { invoice_id: invoiceId, number: "2026-000017", issued_on: "2026-09-08" };
  const answer = {
    reversed: { ...issued(), type: { ...issued().type, type: "reversed_invoice" } },
    reversal: { ...unissued(reversalId), type: { type: "reversal", document: invoiceDocument(18, "2026-000018"), corrects, reason: "Wrong buyer" } },
    invoice: {
      ...unissued(newInvoiceId),
      type: {
        type: "invoice",
        document: invoiceDocument(19, "2026-000019"),
        payment_details: {
          type: "due_by_bank_transfer",
          amount: 11700,
          due_on: "2026-09-22",
          bank: "Raiffeisen Bank",
          account: "1610000000000000",
          reference: { type: "model97", reference: "592026000019" },
        },
        fiscal_receipt_ids: [],
        memo: { type: "text", text: "Zamjena za 2026-000017" },
      },
    },
  };
  const calls = recordFetch(context, () => answer);
  const api = admin().eshop.order.invoice;
  const request = {
    tenant_id: tenantId,
    invoice_id: invoiceId,
    expected_updated_at: 5,
    reversal_id: reversalId,
    new_invoice_id: newInvoiceId,
    reason: "Wrong buyer",
    buyer: { type: "person", name: "Ana Buyer", address },
    memo: { type: "text", text: "Zamjena za 2026-000017" },
    void_credit_ids: [creditId],
  };
  assert.deepEqual(await api.reissue(request), answer);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/tenants/${tenantId}/invoices/${invoiceId}/reissue`, {
      expected_updated_at: 5,
      reversal_id: reversalId,
      new_invoice_id: newInvoiceId,
      reason: "Wrong buyer",
      buyer: { type: "person", name: "Ana Buyer", address },
      memo: { type: "text", text: "Zamjena za 2026-000017" },
      void_credit_ids: [creditId],
    }],
  ]);
  await assert.rejects(async () => api.reissue({ ...request, reversal_id: "reversal-1" }), {
    name: "TypeError",
    message: "The reversal id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => api.reissue({ ...request, new_invoice_id: "invoice-2" }), {
    name: "TypeError",
    message: "The invoice id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 1);
});

test("a credit note's answer carries its own frozen document, the invoice it corrects, its credit and the credit's source", async (context) => {
  const creditNote = {
    ...unissued(creditNoteId),
    type: {
      type: "credit_note",
      document: invoiceDocument(20, "2026-000020"),
      corrects: { invoice_id: invoiceId, number: "2026-000017", issued_on: "2026-09-08" },
      order_credit_id: creditId,
      source: "cancellation",
    },
  };
  const calls = recordFetch(context, () => creditNote);
  assert.deepEqual(await admin().eshop.order.invoice.get({ tenant_id: tenantId, invoice_id: creditNoteId }), creditNote);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["GET", `/v1/tenants/${tenantId}/invoices/${creditNoteId}`]]);
});

test("an outside invoice number is attached with a link or as paper and detached by version, and an outside credit note is added under the app's id and removed by version", async (context) => {
  const calls = recordFetch(context, (call) => (call.method === "DELETE" ? { deleted: true } : unissued()));
  const api = admin().eshop.order.invoice;
  const link = { type: "link", url: "https://accounting.example.test/r-2026-17" };
  await api.attachOutside({ tenant_id: tenantId, order_id: orderId, number: "R-2026-17", document: link });
  await api.attachOutside({ tenant_id: tenantId, order_id: orderId, number: "R-2026-18", document: { type: "paper" } });
  await api.detachOutside({ tenant_id: tenantId, invoice_id: invoiceId, expected_updated_at: 8 });
  await api.createOutsideCreditNote({ tenant_id: tenantId, invoice_id: invoiceId, id: creditNoteId, order_credit_id: creditId, number: "CN-2026-3", document: { type: "link", url: "https://accounting.example.test/cn-2026-3" } });
  await api.createOutsideCreditNote({ tenant_id: tenantId, invoice_id: invoiceId, id: creditNoteId, order_credit_id: creditId, number: "CN-2026-4", document: { type: "paper" } });
  assert.deepEqual(await api.deleteOutsideCreditNote({ tenant_id: tenantId, invoice_id: creditNoteId, expected_updated_at: 9 }), { deleted: true });
  const base = `/v1/tenants/${tenantId}/invoices`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `${base}/outside`, {}, { order_id: orderId, number: "R-2026-17", document: link }],
    ["POST", `${base}/outside`, {}, { order_id: orderId, number: "R-2026-18", document: { type: "paper" } }],
    ["POST", `${base}/${invoiceId}/detach`, {}, { expected_updated_at: 8 }],
    ["POST", `${base}/${invoiceId}/credit-notes`, {}, { id: creditNoteId, order_credit_id: creditId, number: "CN-2026-3", document: { type: "link", url: "https://accounting.example.test/cn-2026-3" } }],
    ["POST", `${base}/${invoiceId}/credit-notes`, {}, { id: creditNoteId, order_credit_id: creditId, number: "CN-2026-4", document: { type: "paper" } }],
    ["DELETE", `${base}/${creditNoteId}`, { expected_updated_at: "9" }, null],
  ]);
  for (const call of calls) assert.equal("url" in (call.body ?? {}), false, "an outside document's link travels inside its document");
  await assert.rejects(
    async () => api.createOutsideCreditNote({ tenant_id: tenantId, invoice_id: invoiceId, id: "cn-1", order_credit_id: creditId, number: "CN-1", document: { type: "paper" } }),
    { name: "TypeError", message: "The credit note id must be a canonical UUID v4 picked by the app" },
  );
  assert.equal(calls.length, 6);
});

test("invoices are their own records with their lines inside, so there is no separate lines read and the order calls no longer attach or remove them", () => {
  const order = admin().eshop.order;
  for (const removed of ["addInvoice", "deleteInvoice"]) assert.equal(removed in order, false, removed);
  assert.deepEqual(Object.keys(order.invoice).sort(), [
    "attachOutside",
    "createOutsideCreditNote",
    "deleteOutsideCreditNote",
    "detachOutside",
    "find",
    "findUnissued",
    "get",
    "issue",
    "reissue",
  ]);
  for (const removed of ["create", "delete", "getLines"]) assert.equal(removed in order.invoice, false, removed);
  assert.equal("invoice" in admin().eshop, false);
});

test("the seller record with its payment reference format and invoice footer is read, created under the app's id, changed and deleted by version", async (context) => {
  const tax = { type: "vat_registered", tax_id: "4200000000000", vat_id: "200000000000" };
  const bank_account = { type: "account", bank: "Raiffeisen Bank", account: "1610000000000000", reference: { type: "model97" } };
  const invoice_footer = { type: "text", text: "Hvala na povjerenju" };
  const seller = { id: sellerId, tenant_id: tenantId, name: "Klinika d.o.o.", address: sellerAddress, tax, bank_account, invoice_footer, created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, (call) => (call.method === "DELETE" ? { deleted: true } : seller));
  const api = admin().tenant.seller;
  const typedAddress = { country: "BA", street1: "Titova 1", city: "Sarajevo", phone: "+38761222333" };
  assert.deepEqual(await api.get({ tenant_id: tenantId }), seller);
  await api.create({ tenant_id: tenantId, id: sellerId, name: "Klinika d.o.o.", address: typedAddress, tax, bank_account, invoice_footer });
  await api.update({ tenant_id: tenantId, expected_updated_at: 1, name: "Klinika d.o.o.", address: sellerAddress, tax: { type: "not_vat_registered", tax_id: "4200000000000" }, bank_account: { type: "account", bank: "UniCredit", account: "3380000000000000", reference: { type: "creditor" } }, invoice_footer: { type: "none" } });
  await api.update({ tenant_id: tenantId, expected_updated_at: 2, name: "Klinika d.o.o.", address: sellerAddress, tax, bank_account: { type: "account", bank: "UniCredit", account: "3380000000000000", reference: { type: "plain" } }, invoice_footer });
  await api.update({ tenant_id: tenantId, expected_updated_at: 3, name: "Klinika d.o.o.", address: sellerAddress, tax, bank_account: { type: "none" }, invoice_footer });
  assert.deepEqual(await api.delete({ tenant_id: tenantId, expected_updated_at: 4 }), { deleted: true });
  const path = `/v1/tenants/${tenantId}/seller`;
  assert.deepEqual(calls.map(({ method, path: called, query, body }) => [method, called, query, body]), [
    ["GET", path, {}, null],
    ["POST", path, {}, { id: sellerId, name: "Klinika d.o.o.", address: typedAddress, tax, bank_account, invoice_footer }],
    ["PUT", path, {}, { expected_updated_at: 1, name: "Klinika d.o.o.", address: sellerAddress, tax: { type: "not_vat_registered", tax_id: "4200000000000" }, bank_account: { type: "account", bank: "UniCredit", account: "3380000000000000", reference: { type: "creditor" } }, invoice_footer: { type: "none" } }],
    ["PUT", path, {}, { expected_updated_at: 2, name: "Klinika d.o.o.", address: sellerAddress, tax, bank_account: { type: "account", bank: "UniCredit", account: "3380000000000000", reference: { type: "plain" } }, invoice_footer }],
    ["PUT", path, {}, { expected_updated_at: 3, name: "Klinika d.o.o.", address: sellerAddress, tax, bank_account: { type: "none" }, invoice_footer }],
    ["DELETE", path, { expected_updated_at: "4" }, null],
  ]);
  await assert.rejects(async () => api.create({ tenant_id: tenantId, id: "seller", name: "Klinika", address: sellerAddress, tax, bank_account, invoice_footer }), {
    name: "TypeError",
    message: "The seller id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => api.get({ tenant_id: "tenant" }), TypeError);
  assert.equal(calls.length, 6);
});

test("a tenant's invoicing is set with the version it read and answers the tenant", async (context) => {
  const invoicing = { type: "arky" };
  const tenant = { id: tenantId, name: "Klinika", invoicing, updated_at: 3 };
  const calls = recordFetch(context, () => tenant);
  const api = admin().tenant.invoicing;
  assert.deepEqual(await api.set({ tenant_id: tenantId, expected_updated_at: 2, invoicing }), tenant);
  await api.set({ tenant_id: tenantId, expected_updated_at: 3, invoicing: { type: "outside" } });
  await api.set({ tenant_id: tenantId, expected_updated_at: 4, invoicing: { type: "none" } });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/tenants/${tenantId}/invoicing`, { expected_updated_at: 2, invoicing }],
    ["PUT", `/v1/tenants/${tenantId}/invoicing`, { expected_updated_at: 3, invoicing: { type: "outside" } }],
    ["PUT", `/v1/tenants/${tenantId}/invoicing`, { expected_updated_at: 4, invoicing: { type: "none" } }],
  ]);
});

test("invoice counters are listed and a counter held after a restore is confirmed with the next number", async (context) => {
  const counter = {
    id: counterId,
    tenant_id: tenantId,
    series: { type: "tenant" },
    year: 2026,
    last_number: 41,
    status: "held_after_restore",
    created_at: 1,
    updated_at: 2,
  };
  const calls = recordFetch(context, (call) => (call.method === "GET" ? { items: [counter], cursor: "counters" } : { ...counter, status: "open", updated_at: 3 }));
  const api = admin().tenant.invoiceCounter;
  assert.deepEqual(await api.find({ tenant_id: tenantId, limit: 20 }), { items: [counter], cursor: "counters" });
  await api.find({ tenant_id: tenantId, cursor: "counters" });
  assert.equal((await api.confirm({ tenant_id: tenantId, invoice_counter_id: counterId, expected_updated_at: 2, next_number: 42 })).status, "open");
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/tenants/${tenantId}/invoice-counters`, { limit: "20" }, null],
    ["GET", `/v1/tenants/${tenantId}/invoice-counters`, { cursor: "counters" }, null],
    ["POST", `/v1/tenants/${tenantId}/invoice-counters/${counterId}/confirm`, {}, { expected_updated_at: 2, next_number: 42 }],
  ]);
});

test("a buyer reads one invoice of their order as the full document, on the visitor session and the order's token", async (context) => {
  const calls = recordFetch(context, () => issued());
  const storefront = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl: storefrontApiUrl, sessionStorage: visitorStorage() });
  const read = await storefront.eshop.order.getInvoice({ order_id: orderId, invoice_id: invoiceId }, { order_token: factoryOrderToken });
  assert.deepEqual(read, issued());
  assert.equal("lines" in read, false);
  assert.equal(read.type.document.lines.length, 1);
  await storefront.eshop.order.getInvoice({ order_id: "order/a", invoice_id: "invoice/b" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/storefront/orders/${orderId}/invoices/${invoiceId}`, null],
    ["GET", "/v1/storefront/orders/order%2Fa/invoices/invoice%2Fb", null],
  ]);
  assert.equal(calls[0].headers.get("x-arky-order-token"), factoryOrderToken);
  assert.equal(calls[1].headers.has("x-arky-order-token"), false);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-tenant-id"), storefrontIdentity.tenantId);
  }
});

test("unissued invoices page by their required reason and expose the current explanation", async (context) => {
  const item = { ...unissued(), explanation: { type: "blocked", code: "INVOICE.BUYER_INCOMPLETE", message: "Add a buyer name and address" } };
  const calls = recordFetch(context, () => ({ items: [item], cursor }));
  const api = admin().eshop.order.invoice;
  assert.deepEqual(await api.findUnissued({ tenant_id: tenantId, reason: "blocked", limit: 25, cursor }), { items: [item], cursor });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [["GET", `/v1/tenants/${tenantId}/invoices/unissued`, { reason: "blocked", limit: "25", cursor }, null]]);
});

test("detaching an outside number can remove its row when no outside obligation remains", async (context) => {
  recordFetch(context, () => null);
  assert.equal(await admin().eshop.order.invoice.detachOutside({ tenant_id: tenantId, invoice_id: invoiceId, expected_updated_at: 8 }), null);
});
