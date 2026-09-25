import type { EpochMilliseconds } from "../types/time";
import type { WritableAtom } from "nanostores";
import type { createStorefront, StorefrontOptions } from "../index";

export interface ArkyCartQuoteStore extends WritableAtom<StorefrontCheckoutQuote | null> {}
import type {
  StorefrontCart,
  StorefrontCollectionEntry,
  StorefrontForm,
  StorefrontOrderCheckoutResult,
  StorefrontCheckoutQuote,
  StorefrontProduct,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontBookingOffering,
} from "../types/storefront";
import type {
  Address,
  Block,
  Cart,
  CartCompanyContext,
  CartDigitalItem,
  CartSubscriptionPlanItem,
  EshopCartItem,
  CollectionEntry,
  Currency,
  Form,
  FormValue,
  FormValues,
  OrderCheckoutResult,
  Product,
  BookingResource,
  BookingService,
  BookingOffering,
  TimeRange,
} from "../types";
import type { AvailabilityResponse } from "../types/api";
import type { CartSubscriptionPlanInput, CartDeliveryGroup, CheckoutCartParams } from "../types/api";
import type { StorefrontParams } from "../types/storefront";

export type ArkyStoreClient = ReturnType<typeof createStorefront>;
export type ArkyStoreConfig = StorefrontOptions;

export interface ArkyStoreContext {
  locale?: string;
  market?: string;
}

export type ArkyContentEntryParams = ArkyStoreContext & {
  id?: string;
  collection_id?: string;
  key?: string;
};

export interface ArkySubmitFormByKeyParams {
  id: string;
  key: string;
  presentation: StorefrontForm;
  values: FormValues;
}

export interface ArkyBookingCartItem {
  id: string;
  booking_offering_id: string;
  requested_interval: TimeRange;
  form_submission_id?: string | null;
  booking_service_id?: string;
  booking_resource_id?: string;
  booking_service_name?: string;
  booking_resource_name?: string;
  date_text?: string;
  time_text?: string;
}

export interface ArkyCartSnapshot {
  cart: StorefrontCart | null;
  product_items: EshopCartItem[];
  booking_items: ArkyBookingCartItem[];
  digital_items: CartDigitalItem[];
  subscription_plan_items: CartSubscriptionPlanItem[];
  item_count: number;
}

export interface ArkyCartStatus {
  loading: boolean;
  syncing: boolean;
  fetching_quote: boolean;
  processing_checkout: boolean;
  error: string | null;
  quote_error: string | null;
  selected_shipping_method_id: string | null;
  user_token: string | null;
}

export interface ArkyLastOrder {
  order_id: string;
  number: string;
  payment_action: StorefrontOrderCheckoutResult["payment_action"];
  payment: StorefrontOrderCheckoutResult["payment"];
  product_items?: EshopCartItem[];
  booking_items?: ArkyBookingCartItem[];
  digital_items?: CartDigitalItem[];
  subscription_plan_items?: CartSubscriptionPlanItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  total?: number;
  currency?: string | null;
  payment_provider_id?: string | null;
  created_at: EpochMilliseconds;
}

export interface ArkyCartInput {
  product_items?: EshopCartItem[];
  booking_items?: ArkyBookingCartItem[];
  digital_items?: CartDigitalItem[];
  subscription_plan_items?: CartSubscriptionPlanInput[];
  company?: CartCompanyContext | null;
  market_id?: string;
  sales_channel_id?: string;
  delivery_groups?: CartDeliveryGroup[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  promotion_codes?: string[] | null;
}

export interface ArkyCartCheckoutInput {
  payment_provider_id?: string;
  return_url?: string;
  clear_after_checkout?: boolean;
  save_payment_method?: boolean;
  payment_method_terms_version?: string;
}

export interface CheckoutContext {
  request: StorefrontParams<CheckoutCartParams>;
  product_items: EshopCartItem[];
  booking_items: ArkyBookingCartItem[];
  digital_items: CartDigitalItem[];
  subscription_plan_items: CartSubscriptionPlanItem[];
  shipping_address: Address | null;
  billing_address: Address | null;
  payment_provider_id: string | null;
  clear_after_checkout: boolean;
  created_at: EpochMilliseconds;
}

export interface ArkyContentState {
  entries: Record<string, StorefrontCollectionEntry>;
  loading: boolean;
  error: string | null;
}

export interface ArkyFormsState {
  forms: Record<string, StorefrontForm>;
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
  availability: unknown | null;
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

export interface FormInputBlock {
  id: string;
  key: string;
  type: string;
  properties: Record<string, unknown>;
  value: FormValue | undefined;
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
  quote: StorefrontCheckoutQuote | null;
  fetchingQuote: boolean;
  quoteError: string | null;
  currency: Currency | null;
  dateTimeConfirmed: boolean;
  availablePaymentProviderIds: string[];
  cartId: string | null;
  promotionCodes: string[];
}
