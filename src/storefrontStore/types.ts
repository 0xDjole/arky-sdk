import type { EpochMilliseconds } from "../types/time";
import type { StorefrontOptions } from "../index";
import type { ArkyErrorInfo } from "../types/apiError";
import type {
  Cart,
  CartBuyer,
  CartCustomerGroupDeliveries,
  CartDeliveryDestination,
  CartDeliveryGroup,
  CartQuote,
  CheckoutPaymentChoice,
  CustomerGroupDeliveryChoices,
  StorefrontCartBookingLineItemInput,
  StorefrontCartCustomerGroupLineItemInput,
  StorefrontCartProductLineItemInput,
  StorefrontCheckoutCartInput,
  StorefrontCurrentCartParams,
} from "../types/cart";
import type { Currency, PostalAddress } from "../types/common";
import type { CheckoutPaymentAction, Payment } from "../types/payment";
import type { PaymentOutcome } from "../utils/paymentOutcome";
import type {
  AvailabilityResponse,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
} from "../types/product";

export type ArkyStoreConfig = StorefrontOptions;

export interface ArkyStoreContext {
  locale?: string;
  market?: string;
}

export type ArkyCartScope = StorefrontCurrentCartParams;

export interface ArkyCartStatus {
  loading: boolean;
  syncing: boolean;
  fetching_quote: boolean;
  processing_checkout: boolean;
  error: ArkyErrorInfo | null;
  quote_error: ArkyErrorInfo | null;
}

export interface ArkyLastOrder {
  order_id: string;
  number: string;
  cart_id: string;
  payment_id: string | null;
  payment_action: CheckoutPaymentAction;
  total: number | null;
  currency: Currency | null;
  created_at: EpochMilliseconds;
}

export interface ArkyCartCreateParams {
  id?: string;
}

export type ArkyAddProductParams = Omit<StorefrontCartProductLineItemInput, "id"> & { id?: string };

export type ArkyAddBookingParams = Omit<StorefrontCartBookingLineItemInput, "id"> & { id?: string };

export type ArkyAddCustomerGroupParams = Omit<StorefrontCartCustomerGroupLineItemInput, "id"> & { id?: string };

export interface ArkyRemoveItemParams {
  line_item_id: string;
}

export interface ArkySetProductQuantityParams {
  line_item_id: string;
  quantity: number;
}

export interface ArkySetDeliveryGroupsParams {
  delivery_groups: CartDeliveryGroup[];
}

export interface ArkyShipToParams {
  destination: CartDeliveryDestination;
  contact_email?: string;
}

export interface ArkySetBillingAddressParams {
  billing_address: PostalAddress | null;
}

export interface ArkySetBuyerParams {
  buyer: CartBuyer;
}

export interface ArkySetPromotionCodesParams {
  promotion_codes: string[];
}

export interface ArkySelectShippingMethodParams {
  shipping_method_id: string;
}

export interface ArkySetFutureDeliveriesParams {
  customer_groups: CartCustomerGroupDeliveries[];
}

export interface ArkyQuoteFutureDeliveriesParams {
  customer_groups: CustomerGroupDeliveryChoices[];
}

export interface ArkyCartQuoteParams {
  contact_email?: string;
}

export interface ArkyCartCheckoutParams {
  order_token?: string;
  order_id?: string;
  contact_email: string | null;
  payment: CheckoutPaymentChoice;
  clear_after_checkout?: boolean;
}

export type ArkyCheckoutStep = "cart" | "details" | "shipping" | "payment" | "paying" | "placed";

export interface ArkyPlacedCheckout {
  order_id: string;
  number: string | null;
  payment_id: string | null;
  payment_action: CheckoutPaymentAction;
}

export type ArkyCheckoutErrorCode =
  | "busy"
  | "not_ready"
  | "pending"
  | "presentation_changed"
  | "refused"
  | "interrupted"
  | "unavailable"
  | "failed";

export interface ArkyCheckoutState {
  step: ArkyCheckoutStep;
  busy: boolean;
  cart: Cart | null;
  quote: CartQuote | null;
  contact_email: string | null;
  destination: CartDeliveryDestination | null;
  billing_address: PostalAddress | null;
  payment_option_id: string | null;
  pending: StorefrontCheckoutCartInput | null;
  placed: ArkyPlacedCheckout | null;
  payment: Payment | null;
  outcome: PaymentOutcome | null;
  error: { code: ArkyCheckoutErrorCode; message: string } | null;
}

export interface ArkySetContactParams {
  contact_email: string;
}

export interface ArkyCheckoutShipToParams {
  destination: CartDeliveryDestination;
}

export interface ArkySelectShippingParams {
  delivery_group_id: string;
  shipping_method_id: string;
  rate_id: string;
}

export interface ArkySelectPaymentOptionParams {
  payment_option_id: string;
}

export interface ArkyCheckoutPlaceParams {
  return_url?: string | ((order_id: string) => string);
  save_payment_method?: boolean;
  payment_method_terms?: string | null;
}

export interface ArkyOpenOrderParams {
  order_id: string;
  url: string;
}

export interface ArkyCalendarDay {
  date: Date;
  iso: string;
  available: boolean;
  is_selected: boolean;
  is_in_range: boolean;
  is_today: boolean;
  blank: boolean;
}

export interface ArkyBookingSlot {
  id: string;
  booking_service_id: string;
  booking_resource_id: string;
  booking_offering_id: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  time_text: string;
  date_text: string;
  is_multi_day: boolean;
}

export interface ArkyBookingCalendarState {
  booking_service: StorefrontBookingService | null;
  booking_offerings: StorefrontBookingOffering[];
  booking_offerings_cursor: string | null;
  booking_resources: StorefrontBookingResource[];
  selected_booking_resource_id: string | null;
  availability: AvailabilityResponse | null;
  month: Date;
  days: ArkyCalendarDay[];
  selected_date: string | null;
  slots: ArkyBookingSlot[];
  selected_slot: ArkyBookingSlot | null;
  timezone: string;
  loading: boolean;
  loading_offerings: boolean;
}

export interface ArkySelectBookingServiceParams {
  booking_service_id: string;
}

export interface ArkySelectBookingResourceParams {
  booking_resource_id: string | null;
}

export interface ArkySelectDateParams {
  date: string;
}

export interface ArkySelectSlotParams {
  slot: ArkyBookingSlot | null;
}

export interface ArkySetTimezoneParams {
  timezone: string;
}

export interface ArkyAddSlotToCartParams {
  slot: ArkyBookingSlot;
  id?: string;
  capacity_units?: number;
  form_submission_id?: string | null;
}
