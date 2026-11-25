import type { OrderContactName } from "../types/order";
import type { EpochMilliseconds } from "../types/time";
import type { StorefrontOptions } from "../index";
import type { ArkyErrorInfo } from "../types/apiError";
import type {
  StorefrontCart,
  CartBookingLineAddOnInput,
  CartBookingLineItemInput,
  CartBuyer,
  CartPlaceOfSale,
  CartDeliveryDestination,
  CartDeliveryGroup,
  CartPackageDeliveries,
  CartPackageLineItemInput,
  CartProductLineItemInput,
  StorefrontCartQuote,
  CheckoutPaymentChoice,
  PackageDeliveryChoices,
  StorefrontCheckoutCartInput,
  StorefrontCurrentCartParams,
} from "../types/cart";
import type { PackagePriceRef, StorefrontPackageItemPrice, StorefrontPrice } from "../types/package";
import type { BookingLineSession } from "../types/order";
import type { EmailContact, PostalAddress } from "../types/common";
import type { CheckoutPaymentAction, StorefrontPayment, StorefrontPaymentMethodSetupStart } from "../types/payment";
import type { PaymentOutcome } from "../utils/paymentOutcome";
import type { AvailabilityResponse, StorefrontBookingService } from "../types/product";
import type { Block } from "../types/block";

export type ArkyStoreConfig = StorefrontOptions;

export type ArkyCartScope = StorefrontCurrentCartParams;

export interface ArkyCartStatus {
  loading: boolean;
  syncing: boolean;
  fetching_quote: boolean;
  processing_checkout: boolean;
  error: ArkyErrorInfo | null;
  quote_error: ArkyErrorInfo | null;
}

export interface ArkyCartCreateParams {
  id?: string;
  place_of_sale?: CartPlaceOfSale;
}

export type ArkyAddProductParams = Omit<CartProductLineItemInput, "id"> & { id?: string };

export type ArkyAddBookingParams = Omit<CartBookingLineItemInput, "id"> & { id?: string };

export type ArkyAddPackageParams = Omit<CartPackageLineItemInput, "id"> & { id?: string };

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

export interface ArkySetPlaceOfSaleParams {
  place_of_sale: CartPlaceOfSale;
}

export interface ArkySetPromotionCodesParams {
  promotion_codes: string[];
}

export interface ArkySelectShippingMethodParams {
  shipping_method_id: string;
}

export interface ArkySetFutureDeliveriesParams {
  packages: CartPackageDeliveries[];
}

export interface ArkyQuoteFutureDeliveriesParams {
  packages: PackageDeliveryChoices[];
}

export interface ArkyCartQuoteParams {
  contact_email?: string;
}

export interface ArkyCartCheckoutParams {
  order_token?: string;
  order_id?: string;
  contact_email: EmailContact | null;
  contact_name?: OrderContactName | null;
  payment: CheckoutPaymentChoice;
  clear_after_checkout?: boolean;
}

export type ArkyCheckoutStep = "cart" | "details" | "shipping" | "payment" | "paying" | "placed";

export interface ArkyPlacedCheckout {
  order_id: string;
  number: string | null;
  payment_id: string | null;
  payment_action: CheckoutPaymentAction;
  payment_method_id: string | null;
  payment_method_setup: StorefrontPaymentMethodSetupStart | null;
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
  cart: StorefrontCart | null;
  quote: StorefrontCartQuote | null;
  contact_email: EmailContact | null;
  contact_name: OrderContactName | null;
  destination: CartDeliveryDestination | null;
  billing_address: PostalAddress | null;
  payment_option_id: string | null;
  pending: StorefrontCheckoutCartInput | null;
  placed: ArkyPlacedCheckout | null;
  payment: StorefrontPayment | null;
  outcome: PaymentOutcome | null;
  error: { code: ArkyCheckoutErrorCode; message: string } | null;
}

export interface ArkySetContactParams {
  contact_email: EmailContact;
  contact_name?: OrderContactName | null;
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
  payment_method_terms?: string;
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
  store_location_id: string;
  booking_resource_id: string;
  booking_offering_id: string;
  price_ref: PackagePriceRef;
  price: StorefrontPrice | null;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  timezone: string;
  time_text: string;
  date_text: string;
  is_multi_day: boolean;
}

export interface ArkyBookingCalendarResource {
  id: string;
  key: string;
  blocks: Block[];
  timezone: string;
}

export interface ArkyBookingCalendarState {
  booking_service: StorefrontBookingService | null;
  store_location_id: string | null;
  booking_choices: StorefrontPackageItemPrice[];
  booking_choices_cursor: string | null;
  booking_resources: ArkyBookingCalendarResource[];
  selected_booking_resource_id: string | null;
  availability: AvailabilityResponse | null;
  month: Date;
  days: ArkyCalendarDay[];
  selected_date: string | null;
  slots: ArkyBookingSlot[];
  selected_slot: ArkyBookingSlot | null;
  timezone: string | null;
  loading: boolean;
  loading_choices: boolean;
}

export interface ArkySelectBookingServiceParams {
  booking_service_id: string;
  store_location_id: string;
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
  timezone: string | null;
}

export interface ArkyAddSlotToCartParams {
  slot: ArkyBookingSlot;
  id?: string;
  capacity_units?: number;
  form_submission_id?: string | null;
  session?: BookingLineSession | null;
  add_ons?: CartBookingLineAddOnInput[];
}
