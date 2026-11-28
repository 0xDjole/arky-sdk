import assert from "node:assert/strict";
import test from "node:test";
import { ArkyApiError, ArkyNetworkError, createAdmin, createFiscalDeviceAgent } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl as storefrontApiUrl, errorResponse, factoryOrderToken, fixedIdFactories, ids, recordFetch, storefrontIdentity, visitorStorage } from "./helpers/arky-fixtures.mjs";

const tenantId = "4f2a9c61-7e3b-4d85-a0c9-1b6e8d3f5a27";
const locationId = "9b3e1d57-2c84-4a06-8f1e-6d2a7c0b3e95";
const deviceId = "2d7f9b14-6c38-4a05-9e21-8b4c0f6a3d57";
const tokenId = "6a1c3e85-7b29-4d04-9f6e-2c8a0d4b6e13";
const providerId = "7b3e9d15-4c28-4a60-b8f1-3e6d0a9c5b72";
const receiptId = "3c8e1a64-7b29-4d05-9f3e-2a6c8b0d4e17";
const copyId = "1f7c3a95-6b28-4e40-9d13-5a2e8c0b7d46";
const correctionId = "5e2b8d14-9a37-4c06-b1f8-3d6e0a7c2b59";
const deviceToken = `arky_fd_${"d".repeat(43)}`;
const apiUrl = "https://api.example.test";

function admin() {
  return createAdmin({ apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function device(type = { type: "ofs_box", uid: "AB12CD34", environment: "production" }) {
  return {
    id: deviceId,
    tenant_id: tenantId,
    tenant_location_id: locationId,
    key: "reception",
    type,
    status: "active",
    ready: false,
    readiness: { type: "not_ready", reason: "no_ready_desk_agent" },
    created_at: 1,
    updated_at: 2,
  };
}

function receipt(state = { type: "requested" }) {
  return {
    id: receiptId,
    tenant_id: tenantId,
    order_id: ids.order,
    fiscal_device_id: deviceId,
    type: { type: "sale", targets: [{ type: "booking", line_item_id: ids.line }], payments: [{ payment_id: ids.payment, amount: 5000 }] },
    document: {
      type: "tax_core_items",
      lines: [
        {
          target: { type: "booking", line_item_id: ids.line },
          name: "Pregled",
          unit: "kom",
          code: "86900000",
          label: "Ђ",
          rate: { numerator: 17, denominator: 100 },
          quantity: 1,
          unit_price: 5000,
        },
      ],
      cashier: "Ana Kovač",
      buyer: { type: "anonymous" },
      state,
    },
    print: "at_desk",
    created_at: 3,
    updated_at: 3,
  };
}

test("fiscal devices are listed by place, type and status, read, made under the app's id, renamed and archived by version", async (context) => {
  const calls = recordFetch(context, (call) => (call.method === "GET" && call.path.endsWith("/fiscal-devices") ? { items: [device()], cursor: "devices" } : device()));
  const api = admin().tenant.fiscalDevice;
  assert.deepEqual(await api.find({ tenant_id: tenantId, tenant_location_id: locationId, type: "ofs_box", status: "active", limit: 20 }), { items: [device()], cursor: "devices" });
  await api.find({ tenant_id: tenantId, cursor: "devices" });
  assert.deepEqual(await api.get({ tenant_id: tenantId, id: deviceId }), device());
  const types = [
    { type: "ofs_box", uid: "AB12CD34", environment: "production" },
    { type: "croatia_cis", provider_id: providerId, premises_mark: "POSL1", device_mark: "1" },
    { type: "ofs_cloud", provider_id: providerId, serial_number: "SN-1" },
    { type: "fbih_tring_printer", ibfm: "AB123456" },
    { type: "manual" },
  ];
  for (const type of types) await api.create({ tenant_id: tenantId, id: deviceId, tenant_location_id: locationId, key: "reception", type });
  await api.rename({ tenant_id: tenantId, id: deviceId, expected_updated_at: 2, key: "front-desk" });
  await api.archive({ tenant_id: tenantId, id: deviceId, expected_updated_at: 3 });
  const base = `/v1/tenants/${tenantId}/fiscal-devices`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { tenant_location_id: locationId, type: "ofs_box", status: "active", limit: "20" }, null],
    ["GET", base, { cursor: "devices" }, null],
    ["GET", `${base}/${deviceId}`, {}, null],
    ...types.map((type) => ["POST", base, {}, { id: deviceId, tenant_location_id: locationId, key: "reception", type }]),
    ["PUT", `${base}/${deviceId}`, {}, { expected_updated_at: 2, key: "front-desk" }],
    ["POST", `${base}/${deviceId}/archive`, {}, { expected_updated_at: 3 }],
  ]);
  await assert.rejects(async () => api.create({ tenant_id: tenantId, id: "reception", tenant_location_id: locationId, key: "reception", type: { type: "manual" } }), {
    name: "TypeError",
    message: "The fiscal device id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => api.find({ tenant_id: "tenant" }), TypeError);
  assert.equal(calls.length, 10);
});

test("a device's desk keys are listed as the plain array Arky answers, made under the app's id with the secret shown once, and revoked with no body", async (context) => {
  const token = { id: tokenId, fiscal_device_id: deviceId, name: "Reception PC", token_hint: "arky_fd_dddd", readiness: { type: "ready" }, last_seen_at: 4, active: true, created_at: 1 };
  const answers = [[token], { token, secret: { type: "created", value: deviceToken } }, { token, secret: { type: "existing" } }, { ...token, active: false }];
  const calls = recordFetch(context, () => answers.shift());
  const api = admin().tenant.fiscalDevice.token;
  assert.deepEqual(await api.find({ tenant_id: tenantId, fiscal_device_id: deviceId }), [token]);
  assert.deepEqual(await api.create({ tenant_id: tenantId, fiscal_device_id: deviceId, id: tokenId, name: "Reception PC" }), { token, secret: { type: "created", value: deviceToken } });
  assert.deepEqual(await api.create({ tenant_id: tenantId, fiscal_device_id: deviceId, id: tokenId, name: "Reception PC" }), { token, secret: { type: "existing" } });
  assert.equal((await api.revoke({ tenant_id: tenantId, fiscal_device_id: deviceId, id: tokenId })).active, false);
  const base = `/v1/tenants/${tenantId}/fiscal-devices/${deviceId}/tokens`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", base, null],
    ["POST", base, { id: tokenId, name: "Reception PC" }],
    ["POST", base, { id: tokenId, name: "Reception PC" }],
    ["POST", `${base}/${tokenId}/revoke`, null],
  ]);
  await assert.rejects(async () => api.create({ tenant_id: tenantId, fiscal_device_id: deviceId, id: "token", name: "Reception PC" }), {
    name: "TypeError",
    message: "The fiscal device token id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 4);
});

test("fiscal receipts are listed for several Orders or the open ones, read, copied and corrected under app-picked ids, and settled by hand", async (context) => {
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET" && call.path.endsWith("/fiscal-receipts")) return { items: [receipt()], cursor: null };
    if (call.path.endsWith("/correction")) return [receipt(), receipt()];
    return receipt();
  });
  const api = admin().eshop.order.fiscalReceipt;
  assert.deepEqual(await api.find({ tenant_id: tenantId, order_ids: [ids.order, ids.otherOrder] }), { items: [receipt()], cursor: null });
  await api.find({ tenant_id: tenantId, open: true, limit: 50, cursor: "next" });
  assert.deepEqual(await api.get({ tenant_id: tenantId, fiscal_receipt_id: receiptId }), receipt());
  await api.copy({ tenant_id: tenantId, fiscal_receipt_id: receiptId, id: copyId });
  assert.equal((await api.correct({ tenant_id: tenantId, fiscal_receipt_id: receiptId, id: correctionId, reason: "Wrong buyer", then: { type: "receipt_again" } })).length, 2);
  await api.correct({ tenant_id: tenantId, fiscal_receipt_id: receiptId, id: correctionId, reason: "Money not taken", then: { type: "wait_for_money" } });
  await api.settle({ tenant_id: tenantId, fiscal_receipt_id: receiptId, outcome: { type: "issued_on_other_device", number: "BLOCK-17", issued_at: 5 } });
  await api.settle({ tenant_id: tenantId, fiscal_receipt_id: receiptId, outcome: { type: "written_by_hand", hand_number: "17", written_at: 6 } });
  await api.settle({ tenant_id: tenantId, fiscal_receipt_id: receiptId, outcome: { type: "not_issued" } });
  const base = `/v1/tenants/${tenantId}/fiscal-receipts`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", base, { order_ids: JSON.stringify([ids.order, ids.otherOrder]) }, null],
    ["GET", base, { open: "true", limit: "50", cursor: "next" }, null],
    ["GET", `${base}/${receiptId}`, {}, null],
    ["POST", `${base}/${receiptId}/copy`, {}, { id: copyId }],
    ["POST", `${base}/${receiptId}/correction`, {}, { id: correctionId, reason: "Wrong buyer", then: { type: "receipt_again" } }],
    ["POST", `${base}/${receiptId}/correction`, {}, { id: correctionId, reason: "Money not taken", then: { type: "wait_for_money" } }],
    ["POST", `${base}/${receiptId}/settle`, {}, { outcome: { type: "issued_on_other_device", number: "BLOCK-17", issued_at: 5 } }],
    ["POST", `${base}/${receiptId}/settle`, {}, { outcome: { type: "written_by_hand", hand_number: "17", written_at: 6 } }],
    ["POST", `${base}/${receiptId}/settle`, {}, { outcome: { type: "not_issued" } }],
  ]);
  for (const call of calls) assert.equal("cashier" in (call.body ?? {}), false, "the Server takes the cashier from the caller's account");
  await assert.rejects(async () => api.copy({ tenant_id: tenantId, fiscal_receipt_id: receiptId, id: "copy" }), {
    name: "TypeError",
    message: "The fiscal receipt id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => api.correct({ tenant_id: tenantId, fiscal_receipt_id: receiptId, id: "fix", reason: "x", then: { type: "receipt_again" } }), TypeError);
  assert.equal(calls.length, 9);
});

test("the receipts an order owes now are issued on the order's issue route, naming only the desk device", async (context) => {
  const calls = recordFetch(context, () => [receipt()]);
  const api = admin().eshop.order.fiscalReceipt;
  assert.deepEqual(await api.issue({ tenant_id: tenantId, order_id: ids.order, fiscal_device_id: deviceId }), [receipt()]);
  await api.issue({ tenant_id: tenantId, order_id: "order/a", fiscal_device_id: deviceId });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/tenants/${tenantId}/orders/${ids.order}/fiscal-receipts/issue`, {}, { fiscal_device_id: deviceId }],
    ["POST", `/v1/tenants/${tenantId}/orders/order%2Fa/fiscal-receipts/issue`, {}, { fiscal_device_id: deviceId }],
  ]);
  assert.equal("makeDue" in api, false);
  await assert.rejects(async () => api.issue({ tenant_id: "tenant", order_id: ids.order, fiscal_device_id: deviceId }), TypeError);
  assert.equal(calls.length, 2);
});

test("a tenant location's fiscal setting is set with its version, naming the jurisdiction and the online device", async (context) => {
  const calls = recordFetch(context, (call) => ({ id: locationId, fiscal: call.body.fiscal }));
  const api = admin().tenant.location;
  const fiscal = { type: "republika_srpska", online_fiscal_device: { type: "device", fiscal_device_id: deviceId } };
  assert.deepEqual(await api.setFiscal({ tenant_id: tenantId, id: locationId, expected_updated_at: 4, fiscal }), { id: locationId, fiscal });
  await api.setFiscal({ tenant_id: tenantId, id: locationId, expected_updated_at: 5, fiscal: { type: "fbih2009" } });
  await api.setFiscal({ tenant_id: tenantId, id: locationId, expected_updated_at: 6, fiscal: { type: "not_fiscal" } });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/tenants/${tenantId}/locations/${locationId}/fiscal`, { expected_updated_at: 4, fiscal }],
    ["PUT", `/v1/tenants/${tenantId}/locations/${locationId}/fiscal`, { expected_updated_at: 5, fiscal: { type: "fbih2009" } }],
    ["PUT", `/v1/tenants/${tenantId}/locations/${locationId}/fiscal`, { expected_updated_at: 6, fiscal: { type: "not_fiscal" } }],
  ]);
});

test("Croatian CIS and OFS cloud logins connect under the app's id, a CIS certificate is replaced by version, and the twins connect keyless", async (context) => {
  const calls = recordFetch(context, () => ({ id: providerId }));
  const api = admin().tenant.provider;
  await api.connectCroatiaCis({ tenant_id: tenantId, id: providerId, certificate_p12: "MIIK...base64", password: "certificate-password" });
  await api.replaceCroatiaCisCertificate({ tenant_id: tenantId, id: providerId, expected_updated_at: 2, certificate_p12: "MIIL...base64", password: "next-password" });
  await api.connectArkyCroatiaCis({ tenant_id: tenantId, id: providerId });
  await api.connectOfsCloud({ tenant_id: tenantId, id: providerId, api_key: "ofs-api-key" });
  await api.connectArkyOfsCloud({ tenant_id: tenantId, id: providerId });
  const base = `/v1/tenants/${tenantId}/tenant-providers`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/croatia-cis`, { id: providerId, certificate_p12: "MIIK...base64", password: "certificate-password" }],
    ["POST", `${base}/croatia-cis/${providerId}/replace-certificate`, { expected_updated_at: 2, certificate_p12: "MIIL...base64", password: "next-password" }],
    ["POST", `${base}/arky-croatia-cis`, { id: providerId }],
    ["POST", `${base}/ofs-cloud`, { id: providerId, api_key: "ofs-api-key" }],
    ["POST", `${base}/arky-ofs-cloud`, { id: providerId }],
  ]);
  for (const connect of ["connectCroatiaCis", "connectArkyCroatiaCis", "connectOfsCloud", "connectArkyOfsCloud"]) {
    await assert.rejects(async () => api[connect]({ tenant_id: tenantId, id: "cis", certificate_p12: "x", password: "x", api_key: "x" }), TypeError, connect);
  }
  assert.equal(calls.length, 5);
});

test("the desk agent reads its paired device, beats with its readiness, claims a due receipt and reports what the box answered, all on its own device key", async (context) => {
  const paired = { device: device(), seller_tax_id: "4400000000000" };
  const beat = { ready: true, readiness: { type: "ready" }, due: [{ id: receiptId, created_at: 3 }] };
  const claim = { receipt: receipt(), claim: { claim_id: "claim-1", fence: 7 }, request_id: "request-1", buyer_present: true, request: { type: "tax_core", body: { invoiceRequest: { invoiceType: "Normal", transactionType: "Sale", payment: [{ paymentType: "Cash", amount: 50 }], items: [], cashier: "Ana Kovač" } } } };
  const outcome = { type: "tax_core_issued", answer: { invoice_number: "AB12CD34-AB12CD34-17", verification_url: "https://tap.suf.purs.gov.rs/v/?vl=1", sdc_date_time: "2027-01-15T09:00:00.000+01:00", signed_by: "AB12CD34", tin: "4400000000000", total_amount: 50 } };
  const done = receipt({ type: "done", invoice_number: "AB12CD34-AB12CD34-17", verification_url: "https://tap.suf.purs.gov.rs/v/?vl=1", signed_at: 1_800_000_000_000, sdc_date_time: "2027-01-15T09:00:00.000+01:00" });
  const answers = [paired, beat, claim, done];
  const calls = recordFetch(context, () => answers.shift());
  const agent = createFiscalDeviceAgent({ apiUrl: `${apiUrl}/`, tenantId, token: deviceToken });
  assert.deepEqual(await agent.getDevice(), paired);
  assert.deepEqual(await agent.heartbeat({ readiness: "ready" }), beat);
  assert.deepEqual(await agent.claim({ fiscal_receipt_id: receiptId }), claim);
  const reported = await agent.report({ fiscal_receipt_id: receiptId, outcome });
  assert.deepEqual(reported, done);
  assert.equal(reported.document.state.sdc_date_time, outcome.answer.sdc_date_time);
  const base = `/v1/tenants/${tenantId}/fiscal-device`;
  assert.deepEqual(calls.map(({ method, href, body }) => [method, href, body]), [
    ["GET", `${apiUrl}${base}`, null],
    ["POST", `${apiUrl}${base}/heartbeat`, { readiness: "ready" }],
    ["POST", `${apiUrl}${base}/receipts/${receiptId}/claim`, {}],
    ["POST", `${apiUrl}${base}/receipts/${receiptId}/outcome`, outcome],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${deviceToken}`);
});

test("the desk agent never refreshes its key: a refused key ends the call once with Arky's 401", async (context) => {
  const calls = recordFetch(context, () => errorResponse(401, "GENERAL.UNAUTHENTICATED", "The device key is revoked"));
  const agent = createFiscalDeviceAgent({ apiUrl, tenantId, token: deviceToken });
  await assert.rejects(agent.heartbeat({ readiness: "not_ready" }), (error) => error instanceof ArkyApiError && error.statusCode === 401 && error.code === "GENERAL.UNAUTHENTICATED");
  assert.equal(calls.length, 1);
});

test("the desk agent takes only a device key and an exact tenant", () => {
  for (const token of ["", "arky_at_ttttttttttttttttttttttttttttttttttttttttttA", ` ${deviceToken}`, `${deviceToken}\n`, undefined]) {
    assert.throws(() => createFiscalDeviceAgent({ apiUrl, tenantId, token }), {
      name: "TypeError",
      message: "A fiscal device agent needs the device token the owner created for this PC",
    });
  }
  assert.throws(() => createFiscalDeviceAgent({ apiUrl, tenantId: "tenant", token: deviceToken }), TypeError);
});

test("a Croatian CIS device whose receipt numbers are held after a restore reads not ready with counter_held", async (context) => {
  const held = { ...device({ type: "croatia_cis", provider_id: providerId, premises_mark: "POSL1", device_mark: "1" }), readiness: { type: "not_ready", reason: "counter_held" } };
  const calls = recordFetch(context, (call) => (call.path.endsWith("/fiscal-devices") ? { items: [held], cursor: null } : held));
  const api = admin().tenant.fiscalDevice;
  assert.deepEqual(await api.get({ tenant_id: tenantId, id: deviceId }), held);
  assert.deepEqual((await api.find({ tenant_id: tenantId, type: "croatia_cis" })).items.map((item) => item.readiness), [{ type: "not_ready", reason: "counter_held" }]);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/tenants/${tenantId}/fiscal-devices/${deviceId}`, {}],
    ["GET", `/v1/tenants/${tenantId}/fiscal-devices`, { type: "croatia_cis" }],
  ]);
});

test("a Croatian receipt is read with what it froze when it was made: the seller with its OIB, the cashier, the payment method and the buyer", async (context) => {
  const seller = {
    name: "Ordinacija Kovač d.o.o.",
    address: { name: null, company: null, street1: "Ilica 1", street2: null, city: "Zagreb", state: null, postal_code: "10000", country: "HR", phone: null, email: null },
    oib: "12345678903",
  };
  const croatian = (id, buyer, cashier, payment_method) => ({
    ...receipt(),
    id,
    type: { type: "sale", targets: [{ type: "booking", line_item_id: ids.line }], payments: [{ payment_id: ids.payment, amount: 5000 }] },
    document: {
      type: "croatia_items",
      number: "17/POSL1/1",
      zki: "e4d909c290d0fb1ca068ffaddf22cbd0",
      seller,
      cashier,
      payment_method,
      lines: [{ target: { type: "booking", line_item_id: ids.line }, name: "Pregled", unit: "kom", quantity: 1, unit_price: 5000, discount: 0, tax: { type: "vat", rate: { numerator: 25, denominator: 100 }, amount: 1000 } }],
      buyer,
      state: { type: "done", jir: "8f2e1c5a-3b7d-4e9f-a1c6-5d0b2e8f4a73" },
    },
  });
  const business = croatian(receiptId, { type: "business", oib: "98765432106" }, "Ana Kovač", "card");
  const consumer = croatian(copyId, { type: "consumer" }, "Online", "other");
  const calls = recordFetch(context, (call) => (call.method === "GET" && call.path.endsWith("/fiscal-receipts") ? { items: [consumer, business], cursor: null } : business));
  const api = admin().eshop.order.fiscalReceipt;
  const read = await api.get({ tenant_id: tenantId, fiscal_receipt_id: receiptId });
  assert.deepEqual(read, business);
  assert.deepEqual([read.document.seller, read.document.cashier, read.document.payment_method, read.document.buyer], [seller, "Ana Kovač", "card", { type: "business", oib: "98765432106" }]);
  assert.deepEqual((await api.find({ tenant_id: tenantId, order_ids: [ids.order] })).items.map((item) => [item.document.buyer, item.document.cashier, item.document.payment_method, item.document.seller.oib]), [
    [{ type: "consumer" }, "Online", "other", "12345678903"],
    [{ type: "business", oib: "98765432106" }, "Ana Kovač", "card", "12345678903"],
  ]);
  assert.equal(calls.length, 2);
});

test("a buyer's order carries its fiscal receipts as light copies, oldest first, naming the fiscal system and the state the buyer may see", async (context) => {
  const receipts = [
    { id: receiptId, type: "advance", document: { type: "tax_core", state: { type: "done", invoice_number: "AB12CD34-AB12CD34-17", verification_url: "https://tap.suf.purs.gov.rs/v/?vl=1" } }, created_at: 3 },
    { id: copyId, type: "advance_settle", document: { type: "tax_core", state: { type: "done_on_other_device", invoice_number: "BLOCK-17" } }, created_at: 4 },
    { id: correctionId, type: "final", document: { type: "tax_core", state: { type: "requested" } }, created_at: 5 },
  ];
  const order = { id: ids.order, number: "1001", tenant_id: ids.tenant, invoices: [], receipts, credits: [], created_at: 1, updated_at: 5 };
  const calls = recordFetch(context, (call) => (call.path === "/v1/storefront/orders" ? { items: [order], cursor: null } : order));
  const storefront = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl: storefrontApiUrl, sessionStorage: visitorStorage() });
  const read = await storefront.eshop.order.get({ id: ids.order }, { order_token: factoryOrderToken });
  assert.deepEqual(read, order);
  assert.deepEqual(read.receipts.map((copy) => [copy.type, copy.document.type, copy.document.state.type]), [
    ["advance", "tax_core", "done"],
    ["advance_settle", "tax_core", "done_on_other_device"],
    ["final", "tax_core", "requested"],
  ]);
  assert.deepEqual((await storefront.eshop.order.find()).items[0].receipts, receipts);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", `/v1/storefront/orders/${ids.order}`],
    ["GET", "/v1/storefront/orders"],
  ]);
  assert.equal(calls[0].headers.get("x-arky-order-token"), factoryOrderToken);
  for (const call of calls) assert.equal(call.headers.get("x-arky-tenant-id"), storefrontIdentity.tenantId);
});

test("a restore holds a device until the owner releases it: the held device reads held_after_restore, is listed by that status and is released by version", async (context) => {
  const held = { ...device(), status: "held_after_restore", readiness: { type: "not_ready", reason: "held_after_restore" }, updated_at: 4 };
  const released = { ...device(), status: "active", updated_at: 5 };
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET" && call.path.endsWith("/fiscal-devices")) return { items: [held], cursor: null };
    if (call.path.endsWith("/release")) return released;
    return held;
  });
  const api = admin().tenant.fiscalDevice;
  assert.deepEqual(await api.get({ tenant_id: tenantId, id: deviceId }), held);
  assert.deepEqual((await api.find({ tenant_id: tenantId, status: "held_after_restore" })).items.map((item) => [item.status, item.readiness]), [["held_after_restore", { type: "not_ready", reason: "held_after_restore" }]]);
  assert.deepEqual(await api.release({ tenant_id: tenantId, id: deviceId, expected_updated_at: 4 }), released);
  await api.release({ tenant_id: tenantId, id: "device/a", expected_updated_at: 5 });
  const base = `/v1/tenants/${tenantId}/fiscal-devices`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${base}/${deviceId}`, {}, null],
    ["GET", base, { status: "held_after_restore" }, null],
    ["POST", `${base}/${deviceId}/release`, {}, { expected_updated_at: 4 }],
    ["POST", `${base}/device%2Fa/release`, {}, { expected_updated_at: 5 }],
  ]);
  await assert.rejects(async () => api.release({ tenant_id: "tenant", id: deviceId, expected_updated_at: 4 }), TypeError);
  assert.equal(calls.length, 4);
});

test("a release Arky refuses ends with Arky's own code: an archived device, a stale version or a caller who isn't the owner", async (context) => {
  const refusals = [
    errorResponse(409, "FISCAL_DEVICE.ARCHIVED", "This fiscal device is archived and takes no new receipts"),
    errorResponse(409, "GENERAL.CONFLICT", "The fiscal device changed; reload it"),
    errorResponse(403, "GENERAL.UNAUTHORIZED", "Only the tenant owner releases a fiscal device"),
  ];
  const calls = recordFetch(context, () => refusals.shift());
  const api = admin().tenant.fiscalDevice;
  for (const [statusCode, code] of [[409, "FISCAL_DEVICE.ARCHIVED"], [409, "GENERAL.CONFLICT"], [403, "GENERAL.UNAUTHORIZED"]]) {
    await assert.rejects(api.release({ tenant_id: tenantId, id: deviceId, expected_updated_at: 4 }), (error) => error instanceof ArkyApiError && error.statusCode === statusCode && error.code === code);
  }
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), Array.from({ length: 3 }, () => ["POST", `/v1/tenants/${tenantId}/fiscal-devices/${deviceId}/release`]));
});

test("an advance receipt is read with the chain its first advance recorded: the goods, or one target", async (context) => {
  const advance = (id, chain) => ({
    ...receipt(),
    id,
    type: { type: "advance", chain, payments: [{ payment_id: ids.payment, amount: 5000 }] },
    document: {
      type: "tax_core_advances",
      lines: [{ label: "Ђ", rate: { numerator: 17, denominator: 100 }, amount: 5000 }],
      cashier: "Ana Kovač",
      buyer: { type: "anonymous" },
      state: { type: "requested" },
    },
    print: "not_printed",
  });
  const visit = advance(receiptId, { type: "target", target: { type: "booking", line_item_id: ids.line } });
  const goods = advance(copyId, { type: "goods" });
  const calls = recordFetch(context, (call) => (call.method === "GET" && call.path.endsWith("/fiscal-receipts") ? { items: [visit, goods], cursor: null } : visit));
  const api = admin().eshop.order.fiscalReceipt;
  assert.deepEqual((await api.get({ tenant_id: tenantId, fiscal_receipt_id: receiptId })).type.chain, { type: "target", target: { type: "booking", line_item_id: ids.line } });
  const page = await api.find({ tenant_id: tenantId, order_ids: [ids.order] });
  assert.deepEqual(page.items.map((item) => [item.type.type, item.type.chain, item.print]), [
    ["advance", { type: "target", target: { type: "booking", line_item_id: ids.line } }, "not_printed"],
    ["advance", { type: "goods" }, "not_printed"],
  ]);
  assert.equal(calls.length, 2);
});

test("hand-path receipts read in the states Arky answers: TaxCore done on another device, and a printer's hand receipt from written to printed", async (context) => {
  const by = { account_id: ids.user, snapshot: { email: "ana@example.test", credential_type: { type: "session" } } };
  const printer = (state) => ({
    ...receipt(),
    document: { type: "fbih_printer_items", lines: [{ target: { type: "booking", line_item_id: ids.line }, name: "Pregled", unit: "kom", label: "E", quantity: 1, unit_price: 5000 }], state },
  });
  const claim = { id: "claim-2", started_at: 6, deadline_at: 7, fence: 3 };
  const states = [
    { type: "written_by_hand", hand_number: "17", written_at: 5, by },
    { type: "printing_after_hand", hand_number: "17", written_at: 5, by, claim },
    { type: "done_after_hand", hand_number: "17", written_at: 5, by, receipt_number: 204, printed_at: 8 },
    { type: "print_failed_after_hand", hand_number: "17", written_at: 5, by, error: { type: "provider_rejected", message: "Paper out", provider_code: null, provider_http_status: null, at: 7 } },
    { type: "done_on_other_device", receipt_number: "BLOCK-17", issued_at: 5, by },
  ];
  const taxcore = receipt({ type: "done_on_other_device", invoice_number: "AB12CD34-AB12CD34-17", issued_at: 5, by });
  const answers = [taxcore, ...states.map(printer)];
  const calls = recordFetch(context, () => answers.shift());
  const api = admin().eshop.order.fiscalReceipt;
  assert.deepEqual((await api.get({ tenant_id: tenantId, fiscal_receipt_id: receiptId })).document.state, { type: "done_on_other_device", invoice_number: "AB12CD34-AB12CD34-17", issued_at: 5, by });
  const read = [];
  for (let index = 0; index < states.length; index++) read.push((await api.get({ tenant_id: tenantId, fiscal_receipt_id: receiptId })).document.state);
  assert.deepEqual(read, states);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), Array.from({ length: 6 }, () => ["GET", `/v1/tenants/${tenantId}/fiscal-receipts/${receiptId}`]));
});

test("a settle on the other hand path ends with HAND_PATH_MISMATCH, and a held device's claim with DEVICE_HELD", async (context) => {
  const answers = [
    errorResponse(409, "FISCAL_RECEIPT.HAND_PATH_MISMATCH", "This device takes another hand path"),
    errorResponse(409, "FISCAL_RECEIPT.DEVICE_HELD", "The fiscal device is held after a restore until the owner releases it"),
  ];
  const calls = recordFetch(context, () => answers.shift());
  await assert.rejects(admin().eshop.order.fiscalReceipt.settle({ tenant_id: tenantId, fiscal_receipt_id: receiptId, outcome: { type: "issued_on_other_device", number: "BLOCK-17", issued_at: 5 } }), (error) => error instanceof ArkyApiError && error.statusCode === 409 && error.code === "FISCAL_RECEIPT.HAND_PATH_MISMATCH");
  const agent = createFiscalDeviceAgent({ apiUrl, tenantId, token: deviceToken });
  await assert.rejects(agent.claim({ fiscal_receipt_id: receiptId }), (error) => error instanceof ArkyApiError && error.statusCode === 409 && error.code === "FISCAL_RECEIPT.DEVICE_HELD");
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["POST", `/v1/tenants/${tenantId}/fiscal-receipts/${receiptId}/settle`],
    ["POST", `/v1/tenants/${tenantId}/fiscal-device/receipts/${receiptId}/claim`],
  ]);
});

test("the desk agent's TaxCore claims carry the box body: invoiceRequest with its reference, the advance fields beside it, and the frozen print decision as buyer_present", async (context) => {
  const advanceFields = ["advanceFinal", "advancePaid", "advanceTax", "advanceLastInvoiceNumber", "advanceLastInvoiceDateTime"];
  const claimOf = (receiptType, print, body) => ({
    receipt: { ...receipt(), type: receiptType, print },
    claim: { id: "claim-1", started_at: 8, deadline_at: 9, fence: 7 },
    request_id: "request-1",
    buyer_present: print === "at_desk",
    request: { type: "tax_core", body },
  });
  const advanceLine = (amount) => ({ name: "Аванс (Ђ)", gtin: "00000000", labels: ["Ђ"], unitPrice: amount, quantity: 1, totalAmount: amount });
  const advance = claimOf({ type: "advance", chain: { type: "goods" }, payments: [{ payment_id: ids.payment, amount: 5000 }] }, "at_desk", {
    invoiceRequest: { invoiceType: "Advance", transactionType: "Sale", payment: [{ paymentType: "WireTransfer", amount: 50 }], items: [advanceLine(50)], cashier: "Ana Kovač", dateAndTimeOfIssue: "2027-01-15T01:00:00.000+01:00" },
  });
  const settle = claimOf({ type: "advance_settle", advance_receipt_id: copyId }, "not_printed", {
    invoiceRequest: { invoiceType: "Advance", transactionType: "Refund", payment: [{ paymentType: "Other", amount: 80 }], items: [advanceLine(80)], cashier: "Ana Kovač", referentDocumentNumber: "AB12CD34-AB12CD34-2", referentDocumentDT: "2027-01-15T09:01:00.000+01:00" },
    advanceFinal: true,
  });
  const final = claimOf({ type: "final", targets: [{ type: "booking", line_item_id: ids.line }], settle_receipt_id: correctionId, payments: [{ payment_id: ids.payment, amount: 2000 }] }, "at_desk", {
    invoiceRequest: {
      invoiceType: "Normal",
      transactionType: "Sale",
      payment: [{ paymentType: "Other", amount: 20 }],
      items: [{ name: "Pregled /kom", gtin: "10000001", labels: ["Ђ"], unitPrice: 100, quantity: 1, totalAmount: 100 }],
      cashier: "Ana Kovač",
      referentDocumentNumber: "AB12CD34-AB12CD34-3",
      referentDocumentDT: "2027-01-15T09:02:00.000+01:00",
    },
    advanceFinal: true,
    advancePaid: 80,
    advanceTax: 13.33,
    advanceLastInvoiceNumber: "AB12CD34-AB12CD34-2",
    advanceLastInvoiceDateTime: "2027-01-15T09:01:00.000+01:00",
  });
  const printer = {
    ...claimOf({ type: "refund", original_receipt_id: copyId, payment_id: ids.payment, refund_id: correctionId }, "at_desk", null),
    request: {
      type: "fbih_printer",
      printer_request: {
        transaction: "complaint",
        lines: [{ name: "Pregled", unit: "kom", label: "E", quantity: 1, unit_price: 5000 }],
        payments: [{ method: "cash", amount: 5000 }],
        reference: { type: "other_device", number: "BLOCK-17" },
      },
    },
  };
  const answers = [advance, settle, final, printer];
  const calls = recordFetch(context, () => answers.shift());
  const agent = createFiscalDeviceAgent({ apiUrl, tenantId, token: deviceToken });
  const advanceClaim = await agent.claim({ fiscal_receipt_id: receiptId });
  assert.deepEqual(advanceClaim, advance);
  assert.equal(advanceClaim.request.body.invoiceRequest.dateAndTimeOfIssue, "2027-01-15T01:00:00.000+01:00");
  assert.deepEqual(Object.keys(advanceClaim.request.body), ["invoiceRequest"]);
  const settleClaim = await agent.claim({ fiscal_receipt_id: receiptId });
  assert.deepEqual(settleClaim, settle);
  assert.deepEqual(Object.keys(settleClaim.request.body), ["invoiceRequest", "advanceFinal"]);
  assert.equal(settleClaim.request.body.advanceFinal, true);
  assert.deepEqual([settleClaim.request.body.invoiceRequest.referentDocumentNumber, settleClaim.request.body.invoiceRequest.referentDocumentDT], ["AB12CD34-AB12CD34-2", "2027-01-15T09:01:00.000+01:00"]);
  const finalClaim = await agent.claim({ fiscal_receipt_id: receiptId });
  assert.deepEqual(finalClaim, final);
  assert.deepEqual(advanceFields.map((field) => finalClaim.request.body[field]), [true, 80, 13.33, "AB12CD34-AB12CD34-2", "2027-01-15T09:01:00.000+01:00"]);
  assert.deepEqual(advanceFields.filter((field) => field in finalClaim.request.body.invoiceRequest), []);
  for (const claim of [advanceClaim, settleClaim, finalClaim]) {
    assert.equal("invoice_request" in claim.request, false);
    assert.equal(claim.buyer_present, claim.receipt.print === "at_desk");
  }
  const printerClaim = await agent.claim({ fiscal_receipt_id: receiptId });
  assert.deepEqual(printerClaim, printer);
  assert.deepEqual(printerClaim.request.printer_request.reference, { type: "other_device", number: "BLOCK-17" });
  assert.equal(printerClaim.buyer_present, printerClaim.receipt.print === "at_desk");
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), Array.from({ length: 4 }, () => ["POST", `/v1/tenants/${tenantId}/fiscal-device/receipts/${receiptId}/claim`, {}]));
});

test("a buyer's order carries the hand-path receipt copies a printer and TaxCore answer, without the staff facts", async (context) => {
  const receipts = [
    { id: receiptId, type: "sale", document: { type: "fbih_printer", state: { type: "written_by_hand", hand_number: "17" } }, created_at: 3 },
    { id: copyId, type: "sale", document: { type: "fbih_printer", state: { type: "done_after_hand", hand_number: "18", receipt_number: 204 } }, created_at: 4 },
    { id: correctionId, type: "sale", document: { type: "fbih_printer", state: { type: "done_on_other_device", receipt_number: "BLOCK-17" } }, created_at: 5 },
    { id: tokenId, type: "sale", document: { type: "tax_core", state: { type: "done_on_other_device", invoice_number: "AB12CD34-AB12CD34-17" } }, created_at: 6 },
  ];
  const order = { id: ids.order, number: "1001", tenant_id: ids.tenant, invoices: [], receipts, credits: [], created_at: 1, updated_at: 6 };
  recordFetch(context, () => order);
  const storefront = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl: storefrontApiUrl, sessionStorage: visitorStorage() });
  const read = await storefront.eshop.order.get({ id: ids.order }, { order_token: factoryOrderToken });
  assert.deepEqual(read.receipts, receipts);
  assert.deepEqual(read.receipts.map((copy) => copy.document.state.type), ["written_by_hand", "done_after_hand", "done_on_other_device", "done_on_other_device"]);
});


test("a Croatian receipt past its clearance deadline is delivered once more by hand with an empty body", async (context) => {
  const receiptId = "3e5a7c9b-1d2f-4b6a-8c0e-2f4a6c8e0b1d";
  const receipt = { id: receiptId, status: { type: "done" } };
  const calls = recordFetch(context, () => receipt);
  assert.deepEqual(await admin().eshop.order.fiscalReceipt.deliver({ tenant_id: tenantId, fiscal_receipt_id: receiptId }), receipt);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/tenants/${tenantId}/fiscal-receipts/${receiptId}/deliver`, {}],
  ]);
});

test("the tenant's receipts are listed within a creation-time range, never by the old order_id, and every staff answer says whether deliver takes the receipt now", async (context) => {
  const triesEnded = { ...receipt(), deliverable: true };
  const done = { ...receipt({ type: "done", invoice_number: "AB12CD34-AB12CD34-17", verification_url: "https://tap.suf.purs.gov.rs/v/?vl=1", signed_at: 4, sdc_date_time: "2027-01-15T09:00:00.000+01:00" }), deliverable: false };
  const calls = recordFetch(context, (call) => {
    if (call.method === "GET" && call.path.endsWith("/fiscal-receipts")) return { items: [triesEnded, done], cursor: "receipts" };
    if (call.path.endsWith("/issue")) return [done];
    return triesEnded;
  });
  const api = admin().eshop.order.fiscalReceipt;
  const page = await api.find({ tenant_id: tenantId, created_at_from: 1, created_at_to: 5, limit: 2 });
  assert.deepEqual(page.items.map((item) => item.deliverable), [true, false]);
  await api.find({ tenant_id: tenantId, open: true, created_at_from: 1 });
  assert.equal((await api.get({ tenant_id: tenantId, fiscal_receipt_id: receiptId })).deliverable, true);
  assert.equal((await api.deliver({ tenant_id: tenantId, fiscal_receipt_id: receiptId })).deliverable, true);
  assert.deepEqual((await api.issue({ tenant_id: tenantId, order_id: ids.order, fiscal_device_id: deviceId })).map((item) => item.deliverable), [false]);
  const base = `/v1/tenants/${tenantId}/fiscal-receipts`;
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", base, { created_at_from: "1", created_at_to: "5", limit: "2" }],
    ["GET", base, { open: "true", created_at_from: "1" }],
    ["GET", `${base}/${receiptId}`, {}],
    ["POST", `${base}/${receiptId}/deliver`, {}],
    ["POST", `/v1/tenants/${tenantId}/orders/${ids.order}/fiscal-receipts/issue`, {}],
  ]);
  for (const call of calls) assert.equal("order_id" in call.query, false, "the Server refuses the old order_id");
});

test("the desk agent passes its redirect choice to every request, a refused redirect ends as a network error, and with no choice the clients follow redirects as before", async (context) => {
  const seen = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    seen.push([new URL(String(input)).pathname, init.redirect]);
    if (seen.length === 3) throw new TypeError("fetch failed: redirect mode is set to error");
    return new Response(JSON.stringify(device()), { status: 200, headers: { "content-type": "application/json" } });
  });
  const refusing = createFiscalDeviceAgent({ apiUrl, tenantId, token: deviceToken, redirect: "error" });
  await refusing.getDevice();
  await refusing.heartbeat({ readiness: "ready" });
  await assert.rejects(refusing.getDevice(), (error) => error instanceof ArkyNetworkError && error.code === "network" && !(error instanceof ArkyApiError));
  await createFiscalDeviceAgent({ apiUrl, tenantId, token: deviceToken }).getDevice();
  await admin().tenant.fiscalDevice.get({ tenant_id: tenantId, id: deviceId });
  assert.deepEqual(seen, [
    [`/v1/tenants/${tenantId}/fiscal-device`, "error"],
    [`/v1/tenants/${tenantId}/fiscal-device/heartbeat`, "error"],
    [`/v1/tenants/${tenantId}/fiscal-device`, "error"],
    [`/v1/tenants/${tenantId}/fiscal-device`, "follow"],
    [`/v1/tenants/${tenantId}/fiscal-devices/${deviceId}`, "follow"],
  ]);
});
