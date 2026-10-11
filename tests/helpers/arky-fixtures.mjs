export const apiUrl = "https://api.example.test";
export const publishableKey = `arky_pk_${"a".repeat(42)}A`;
export const otherPublishableKey = `arky_pk_${"b".repeat(42)}E`;
export const visitorToken = `customer_visitor_${"v".repeat(64)}`;
export const accessToken = `customer_access_${"t".repeat(64)}`;
export const refreshToken = `customer_refresh_${"r".repeat(64)}`;

export const ids = {
  store: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19",
  otherStore: "b8e1d4a7-2c95-4f36-9d08-6a3c7e1f0b52",
  customer: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
  otherCustomer: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47",
  session: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63",
  otherSession: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14",
  cart: "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41",
  otherCart: "2b815d21-78be-431a-b49c-0d5d62c87823",
  thirdCart: "6ef796c1-e503-4679-b0d7-79966c193ca2",
  order: "4a2c7c0d-4389-4aae-b3d7-02ff834a024d",
  otherOrder: "c7d4b584-c4c3-4bfd-9c16-9d2c359e10d9",
  line: "3e956b8d-efc3-42e6-a5c1-9fb38ea840fa",
  otherLine: "19f4bc18-4259-46b8-b5ef-3579d1dac971",
  product: "0b3e9c17-5a2d-4f86-9e01-7c4b6d2a8f35",
  variant: "7a1e5c39-4b82-4d60-9f17-3c8e2a6d0b54",
  catalog: "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18",
  otherCatalog: "9b2e4d71-6a35-4c08-8f1e-3d7a5c9b2e46",
  market: "9c1d5e83-4a27-4f60-b8e2-6d3a0f7c1b94",
  channel: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28",
  paymentOption: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
  otherPaymentOption: "2f0a5d3c-9a1e-4b7e-8f4c-6c2a1b3d5e70",
  payment: "f17c0b95-2e4d-4a83-9b6c-31d5e8a70f24",
  company: "f581728f-8a86-4598-b27b-ef5ea7636277",
  companyLocation: "8c68fc2e-57b6-44fc-8f9c-6cbd1c76dbcf",
  otherCompanyLocation: "ac2cc7a2-c57c-43da-999b-4b7c21bda9ee",
  customerGroupMember: "d397ff50-690b-4da7-9fb9-17740e535d69",
  credit: "bef10d85-72e3-4853-9c12-8e419dc2d8dc",
  form: "0f6a3c84-2d19-4e75-b8a1-5c9e7d3b2f60",
  submission: "4b9e2d71-8a36-4c05-9f1e-6d3a7b0c5e92",
  account: "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f",
};

export function jsonResponse(body, status = 200) {
  if (status === 204 || body === undefined) return new Response(null, { status: status === 200 ? 204 : status });
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export function errorResponse(status, error = "GENERAL.REFUSED", message = "Refused", extra = {}) {
  return jsonResponse({ message, error, status_code: status, validation_errors: [], ...extra }, status);
}

function decodeBody(body) {
  if (body === undefined || body === null) return null;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  return JSON.parse(String(body));
}

export function recordFetch(context, respond) {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    const url = new URL(String(input));
    const call = {
      url,
      href: url.href,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      method: init.method ?? "GET",
      headers: new Headers(init.headers),
      body: decodeBody(init.body),
      signal: init.signal,
    };
    calls.push(call);
    const reply = await respond(call, calls.length);
    return reply instanceof Response ? reply : jsonResponse(reply);
  });
  return calls;
}

export function customerRecord(id = ids.customer, overrides = {}) {
  return {
    id,
    store_id: ids.store,
    first_name: null,
    last_name: null,
    phone: null,
    language: null,
    email: { type: "no_email" },
    addresses: [],
    default_shipping_address_id: null,
    default_billing_address_id: null,
    status: { type: "active" },
    categories: [],
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_000,
    ...overrides,
  };
}

export function visitorSession(customerId = ids.customer, sessionId = ids.session, token = visitorToken) {
  return {
    type: "visitor",
    id: sessionId,
    customer_id: customerId,
    status: { type: "active" },
    token,
    expires_at: 1_900_000_000_000,
  };
}

export function emailSession(customerId = ids.customer, sessionId = ids.session, overrides = {}) {
  return {
    type: "email_authenticated",
    id: sessionId,
    customer_id: customerId,
    status: { type: "active" },
    access_token: accessToken,
    refresh_token: refreshToken,
    access_expires_at: 1_900_000_000_000,
    refresh_expires_at: 1_900_000_600_000,
    authenticated_at: 1_700_000_000_000,
    ...overrides,
  };
}

export function sessionResult(customerId = ids.customer, session = visitorSession(customerId)) {
  return { customer: customerRecord(customerId), session };
}

export function storedSession(customerId = ids.customer, session = visitorSession(customerId)) {
  return JSON.stringify({ version: 3, customer: customerRecord(customerId), session });
}

export class SessionStorage {
  constructor(initial = null) {
    this.values = new Map();
    this.initial = initial;
  }

  getItem(key) {
    if (this.values.has(key)) return this.values.get(key);
    return key.startsWith("arky_customer_session:") ? this.initial : null;
  }

  setItem(key, value) {
    if (key.startsWith("arky_customer_session:")) this.initial = null;
    this.values.set(key, String(value));
  }

  removeItem(key) {
    if (key.startsWith("arky_customer_session:")) this.initial = null;
    this.values.delete(key);
  }

  keys(prefix) {
    return [...this.values.keys()].filter((key) => key.startsWith(prefix));
  }
}

export function visitorStorage(customerId = ids.customer, sessionId = ids.session) {
  return new SessionStorage(storedSession(customerId, visitorSession(customerId, sessionId)));
}

export function signedInStorage(customerId = ids.customer, sessionId = ids.session) {
  return new SessionStorage(storedSession(customerId, emailSession(customerId, sessionId)));
}

export function cartRecord(overrides = {}) {
  return {
    id: ids.cart,
    store_id: ids.store,
    customer_id: ids.customer,
    buyer: { type: "customer" },
    sales_channel_id: ids.channel,
    catalog_id: ids.catalog,
    status: { type: "active" },
    origin: { type: "storefront", customer_session_id: ids.session },
    line_items: [],
    delivery_groups: [],
    billing_address: null,
    promotion_code_ids: [],
    offer: null,
    created_at: 1_700_000_000_000,
    updated_at: 1_700_000_000_001,
    ...overrides,
  };
}

export function quoteRecord(overrides = {}) {
  return {
    cart_id: ids.cart,
    store_id: ids.store,
    customer_id: ids.customer,
    buyer: { type: "customer" },
    market_id: ids.market,
    sales_channel_id: ids.channel,
    catalog_id: ids.catalog,
    currency: "eur",
    tax_mode: "inclusive",
    language: "en",
    lines: [],
    deliveries: [],
    promotions: [],
    billing_address: null,
    totals: { subtotal: 2500, delivery: 0, discount: 0, tax: 0, total: 2500 },
    payment_option_ids: [ids.paymentOption],
    suggested_payment_option_id: ids.paymentOption,
    blockers: [],
    ready: true,
    quoted_at: 1_700_000_000_500,
    presentation_digest: "d".repeat(64),
    ...overrides,
  };
}

export function placedAcceptance(overrides = {}) {
  return {
    type: "placed",
    order_id: ids.order,
    number: "1001",
    payment_id: null,
    payment_action: { type: "none" },
    ...overrides,
  };
}

export function placedOrder(overrides = {}) {
  return {
    id: ids.order,
    number: "1001",
    store_id: ids.store,
    source: { type: "cart", cart_id: ids.cart, placed_by: { type: "customer", customer_id: ids.customer, customer_session_id: ids.session } },
    customer_id: ids.customer,
    status: "confirmed",
    ...overrides,
  };
}

export function checkoutRequest(overrides = {}) {
  return {
    order_id: ids.order,
    cart_id: ids.cart,
    expected_updated_at: 1_700_000_000_001,
    presentation_digest: "d".repeat(64),
    contact_email: "buyer@example.test",
    payment: {
      type: "payment_option",
      payment_option_id: ids.paymentOption,
      return_url: "https://shop.example.test/return",
      save_payment_method: false,
      payment_method_terms_version: null,
    },
    ...overrides,
  };
}

export function installGlobal(context, name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  context.after(() => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  });
}
