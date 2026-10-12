import { epochMilliseconds } from "../../dist/index.js";

const placedAt = epochMilliseconds(1788870000000);
const bookingFrom = epochMilliseconds(1788900000000);
const bookingTo = epochMilliseconds(1788903600000);

const billingAddress = {
  name: "Ana Buyer",
  company: null,
  street1: "1 Main Street",
  street2: null,
  city: "Boston",
  state: "MA",
  postal_code: "02108",
  country: "US",
  phone: null,
  email: "ana@example.test",
};

const productMoney = {
  unit_price: 1000,
  discounts: [{ promotion_id: "promotion", effect_id: "effect", amount: 100 }],
  tax: { type: "own", tax_category_id: "standard", rule_id: "rule", treatment: { type: "zero_rated", reason: "synthetic fixture" } },
};

const bookingMoney = {
  unit_price: 2000,
  discounts: [],
  tax: { type: "own", tax_category_id: "services", rule_id: "rule", treatment: { type: "not_taxable", reason: "synthetic fixture" } },
};

export const retainedOrder = {
  id: "4a2c7c0d-4389-4aae-b3d7-02ff834a024d",
  number: "1001",
  store_id: "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18",
  source: {
    type: "cart",
    cart_id: "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41",
    placed_by: { type: "customer", customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", customer_session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" },
  },
  customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
  contact: { email: "ana@example.test", first_name: "Ana", last_name: "Buyer", phone: null },
  buyer: { type: "customer" },
  market_id: "9c1d5e83-4a27-4f60-b8e2-6d3a0f7c1b94",
  sales_channel_id: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28",
  tax_mode: "exclusive",
  collection: { type: "payment_option", payment_option_id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31" },
  line_items: [
    {
      type: "product",
      id: "3e956b8d-efc3-42e6-a5c1-9fb38ea840fa",
      origin: { type: "direct" },
      product_id: "0b3e9c17-5a2d-4f86-9e01-7c4b6d2a8f35",
      variant_id: "7a1e5c39-4b82-4d60-9f17-3c8e2a6d0b54",
      quantity: 1,
      cancelled_units: [],
      form_submission_id: null,
      snapshot: {
        product_key: "consultation-credit",
        variant_sku: "CC-1",
        options: [{ key: "size", value: "one" }],
        price: { type: "catalog", price_id: "price", catalog_id: "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18" },
        fulfillment: { type: "digital", content: { type: "accepted_assets", asset_ids: ["asset"] }, revocation: null },
      },
      status: { type: "confirmed" },
      money_runs: [{ span: { first_unit: 0, quantity: 1 }, taxed_at: { type: "billing" }, money: productMoney }],
      created_at: placedAt,
      updated_at: placedAt,
    },
    {
      type: "booking",
      id: "19f4bc18-4259-46b8-b5ef-3579d1dac971",
      booking_offering_id: "offering",
      booking_service_id: "service",
      booking_resource_id: "resource",
      interval: { from: bookingFrom, to: bookingTo },
      capacity_intervals: [{ from: bookingFrom, to: bookingTo }],
      capacity_units: 1,
      form_submission_id: null,
      snapshot: {
        service_key: "consultation",
        resource_key: "room-1",
        timezone: "America/New_York",
        price: { type: "catalog", price_id: "booking-price", catalog_id: "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18" },
      },
      status: { type: "confirmed" },
      attendance: "upcoming",
      money: bookingMoney,
      created_at: placedAt,
      updated_at: placedAt,
    },
    {
      type: "customer_group",
      id: "6ef796c1-e503-4679-b0d7-79966c193ca2",
      customer_group_member_id: "d397ff50-690b-4da7-9fb9-17740e535d69",
      revision_id: "revision",
      occurrence: { type: "permanent", starts_at: placedAt },
      revocation: null,
      status: { type: "confirmed" },
      tax_groups: [],
      created_at: placedAt,
      updated_at: placedAt,
    },
    {
      type: "purchase_access",
      id: "2b815d21-78be-431a-b49c-0d5d62c87823",
      order_customer_group_line_item_id: "6ef796c1-e503-4679-b0d7-79966c193ca2",
      entitlement_id: "entitlement",
      revocation: null,
      status: { type: "confirmed" },
      money: { ...productMoney, unit_price: 0, discounts: [] },
      created_at: placedAt,
      updated_at: placedAt,
    },
  ],
  delivery_groups: [],
  currency: "usd",
  promotions: [{ promotion_id: "promotion", promotion_key: "spring", code: { promotion_code_id: "code", code: "SPRING" } }],
  billing_address: billingAddress,
  language: "en",
  created_at: placedAt,
  updated_at: placedAt,
  status: "confirmed",
  totals: {
    subtotal: 3000,
    delivery: 0,
    discount: 100,
    tax: 0,
    total: 2900,
    line_items: [
      { line_item_id: "3e956b8d-efc3-42e6-a5c1-9fb38ea840fa", subtotal: 1000, discount: 100, tax: 0, total: 900 },
      { line_item_id: "19f4bc18-4259-46b8-b5ef-3579d1dac971", subtotal: 2000, discount: 0, tax: 0, total: 2000 },
    ],
    delivery_groups: [],
  },
};

export const companyLocationOrder = {
  ...retainedOrder,
  id: "c7d4b584-c4c3-4bfd-9c16-9d2c359e10d9",
  number: "1002",
  source: {
    type: "cart",
    cart_id: "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41",
    placed_by: { type: "account", account_id: "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f", snapshot: { email: "staff@example.test", credential_type: "session" } },
  },
  buyer: {
    type: "company_location",
    company_location_id: "8c68fc2e-57b6-44fc-8f9c-6cbd1c76dbcf",
    purchase_order_number: "PO-2026-7",
    tax_registrations: [{ country: "BA", region: null, identifier: "4200000000000" }],
  },
  collection: {
    type: "on_account",
    payment_option_id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
    terms: { type: "net_days", days: 30 },
    due_at: epochMilliseconds(1791462000000),
    approval: { type: "account", reason: "One-time Net30 for the location" },
  },
};
