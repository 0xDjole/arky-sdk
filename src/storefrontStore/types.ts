import type { EpochMilliseconds } from "../types/time";
import type { StorefrontOptions } from "../index";
import type {
  Cart,
  CartBuyer,
  CartDeliveryDestination,
  CartQuote,
  CheckoutPaymentChoice,
  StorefrontCartBookingLineItemInput,
  StorefrontCartCustomerGroupLineItemInput,
  StorefrontCartProductLineItemInput,
  StorefrontCheckoutCartInput,
  StorefrontCurrentCartParams,
} from "../types/cart";
import type { Currency, PostalAddress } from "../types/common";
import type { Entry } from "../types/content";
import type { Form, FormValues } from "../types/forms";
import type { CheckoutPaymentAction, Payment } from "../types/payment";
import type { PaymentOutcome } from "../utils/paymentOutcome";
import type {
  AvailabilityResponse,
  StorefrontBookingOffering,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontProduct,
} from "../types/product";
import type { Block } from "../types/block";

export type ArkyStoreConfig = StorefrontOptions;

export interface ArkyStoreContext {
  locale?: string;
  market?: string;
}

export type ArkyContentEntryParams =
  | { id: string }
  | { collection_id: string; key: string }
  | { collection_id: string; slug: string };

export interface ArkySubmitFormByKeyParams {
  id?: string;
  key: string;
  form: Form;
  values: FormValues;
  language: string;
}

export interface ArkyCartStatus {
  loading: boolean;
  syncing: boolean;
  fetching_quote: boolean;
  processing_checkout: boolean;
  error: string | null;
  quote_error: string | null;
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

export interface ArkyCartCheckoutInput {
  order_token?: string;
  order_id?: string;
  contact_email: string | null;
  payment: CheckoutPaymentChoice;
  clear_after_checkout?: boolean;
}

export type ArkyCartScope = StorefrontCurrentCartParams;

export interface ArkyCartCreateParams {
  id?: string;
  buyer?: CartBuyer;
  catalog_id?: string;
}

export type ArkyCartProductInput = Omit<StorefrontCartProductLineItemInput, "id"> & { id?: string };

export type ArkyCartBookingInput = Omit<StorefrontCartBookingLineItemInput, "id"> & { id?: string };

export type ArkyCartCustomerGroupInput = Omit<StorefrontCartCustomerGroupLineItemInput, "id"> & { id?: string };

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

export interface ArkyCheckoutPlaceParams {
  return_url?: string | ((order_id: string) => string);
  save_payment_method?: boolean;
  payment_method_terms?: string | null;
}

export interface ArkyCheckoutResumeParams {
  order_id: string;
  url: string;
}

export interface ArkyContentState {
  entries: Record<string, Entry>;
  loading: boolean;
  error: string | null;
}

export interface ArkyFormsState {
  forms: Record<string, Form>;
  loading: boolean;
  error: string | null;
}

export interface ArkyEshopState {
  products: StorefrontProduct[];
  bookingServices: StorefrontBookingService[];
  bookingResources: StorefrontBookingResource[];
  product_cursor: string | null;
  booking_service_cursor: string | null;
  booking_resource_cursor: string | null;
  availability: AvailabilityResponse | null;
  loading_products: boolean;
  loading_booking_services: boolean;
  loading_booking_resources: boolean;
  loading_availability: boolean;
  error: string | null;
}

export interface ArkyCalendarDay {
  date: Date;
  iso: string;
  available: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isToday: boolean;
  blank: boolean;
}

export interface ArkyBookingSlot {
  id: string;
  bookingServiceId: string;
  bookingResourceId: string;
  bookingOfferingId: string;
  from: EpochMilliseconds;
  to: EpochMilliseconds;
  timeText: string;
  dateText: string;
  isMultiDay?: boolean;
  bookingServiceName?: string;
  date?: string;
  bookingServiceBlocks?: Block[];
}

export interface ArkyBookingCartItem {
  id?: string;
  slot: ArkyBookingSlot;
  capacity_units?: number;
  form_submission_id?: string | null;
}

export interface ArkyBookingServiceState {
  bookingService: StorefrontBookingService | null;
  availability: AvailabilityResponse | null;
  bookingResources: StorefrontBookingResource[];
  bookingOfferings: StorefrontBookingOffering[];
  bookingOfferingsCursor: string | null;
  loadingOfferings: boolean;
  selectedBookingResourceId: string | null;
  currentMonth: Date;
  calendar: ArkyCalendarDay[];
  selectedDate: string | null;
  slots: ArkyBookingSlot[];
  selectedSlot: ArkyBookingSlot | null;
  timezone: string;
  tzGroups: Record<string, { zone: string; name: string }[]>;
  loading: boolean;
  weekdays: string[];
  quote: CartQuote | null;
  fetchingQuote: boolean;
  quoteError: string | null;
  currency: Currency | null;
  dateTimeConfirmed: boolean;
  availablePaymentOptionIds: string[];
  cartId: string | null;
}
