import type {
  CompanySnapshot,
  OrderCustomerGroupPlanItem,
  PurchaseCustomerSnapshot,
  PurchaseOrigin,
  SalesChannelSnapshot,
} from "./commerce";
import type {
  Address,
  OrderBookingItem,
  OrderDigitalItem,
  OrderMoney,
  OrderProductItem,
  OrderShippingLine,
} from "./index";
import type { EpochMilliseconds } from "./time";
import type {
  CheckoutPaymentAuthorization,
  CollectionPolicySnapshot,
  CompanyLocationSnapshot,
  MarketSnapshot,
  OrderDeliveryGroup,
  OrderInvoicePolicy,
  PaymentTermsSnapshot,
  PromotionRedemption,
  PurchaseOriginSnapshot,
  ReconciliationState,
  RenewalRecovery,
  SellerSnapshot,
} from "./orderContract";

export type OrderPurchaseSource =
  | { type: "checkout"; checkout_id: string }
  | { type: "direct"; request_id: string }
  | { type: "exchange"; exchange_id: string };

export type OrderType =
  | { type: "purchase"; source: OrderPurchaseSource }
  | { type: "customer_group"; order_customer_group_line_item_id: string };

export interface OrderCompanyContext {
  company_id: string | null;
  company_location_id: string | null;
  company_snapshot: CompanySnapshot;
  company_location_snapshot: CompanyLocationSnapshot;
}

export type OrderLineItem =
  | { type: "product" } & OrderProductItem
  | { type: "booking" } & OrderBookingItem
  | { type: "digital_product" } & OrderDigitalItem
  | { type: "customer_group_plan" } & OrderCustomerGroupPlanItem;

export type OrderStatus = {
  type: "pending" | "confirmed" | "partially_cancelled" | "cancelled";
};

export interface Order {
  id: string;
  number: string;
  store_id: string;
  type: OrderType;
  customer_id: string;
  customer_snapshot: PurchaseCustomerSnapshot;
  company: OrderCompanyContext | null;
  payment_terms: PaymentTermsSnapshot | null;
  purchase_order_number: string | null;
  market_id: string | null;
  market_snapshot: MarketSnapshot;
  sales_channel_id: string | null;
  sales_channel_snapshot: SalesChannelSnapshot;
  origin: PurchaseOriginSnapshot;
  status: OrderStatus;
  line_items: OrderLineItem[];
  money: OrderMoney;
  delivery_groups: OrderDeliveryGroup[];
  billing_address: Address | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  accepted_at: EpochMilliseconds;
  seller: SellerSnapshot;
  invoice_policy: OrderInvoicePolicy;
  renewal_recovery: RenewalRecovery | null;
  reconciliation: ReconciliationState;
  collection_policy: CollectionPolicySnapshot;
  promotion_redemptions: PromotionRedemption[];
  payment_authorization: CheckoutPaymentAuthorization;
}

