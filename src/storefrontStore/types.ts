import type { createStorefront, StorefrontOptions } from "../index";
import type {
  StorefrontCart,
  StorefrontCollectionEntry,
  StorefrontForm,
  StorefrontOrderCheckoutResult,
  StorefrontOrderQuote,
  StorefrontProduct,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontBookingOffering,
} from "../types/storefront";
import type {
  Address,
  Block,
  Cart,
  CartDigitalItem,
  EshopCartItem,
  CollectionEntry,
  Currency,
  Form,
  FormValue,
  FormValues,
  OrderCheckoutResult,
  OrderQuote,
  Price,
  Product,
  BookingResource,
  BookingService,
  BookingOffering,
  TimeRange,
} from "../types";
import type { AvailabilityResponse } from "../types/api";

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
  key: string;
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
  shipping_address?: Address | null;
  billing_address?: Address | null;
  total?: number;
  currency?: string | null;
  payment_provider_id?: string | null;
  created_at: number;
}

export interface ArkyCartInput {
  product_items?: EshopCartItem[];
  booking_items?: ArkyBookingCartItem[];
  digital_items?: CartDigitalItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  promo_code?: string | null;
  payment_provider_id?: string | null;
  shipping_method_id?: string | null;
  return_url?: string;
  clear_after_checkout?: boolean;
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
  from: number;
  to: number;
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
  quote: StorefrontOrderQuote | null;
  fetchingQuote: boolean;
  quoteError: string | null;
  currency: Currency | null;
  dateTimeConfirmed: boolean;
  availablePaymentProviderIds: string[];
  cartId: string | null;
  promoCode: string | null;
}
