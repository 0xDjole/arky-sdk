import type { createStorefront, CreateStorefrontConfig } from "../index";
import type {
  Address,
  Block,
  Cart,
  EshopCartItem,
  CollectionEntry,
  Form,
  FormEntry,
  Market,
  OrderCheckoutResult,
  OrderQuote,
  PaymentMethod,
  Price,
  Product,
  ProductVariant,
  Provider,
  Service,
} from "../types";
import type { AvailabilityResponse } from "../types/api";

export type ArkyStoreClient = ReturnType<typeof createStorefront>;

export interface ArkyStoreConfig extends CreateStorefrontConfig {
  marketForLocale?: (locale: string) => string | null | undefined;
}

export interface ArkyStoreContext {
  locale?: string;
  market?: string;
}

export type ArkyCmsEntryParams = ArkyStoreContext & {
	id?: string;
	collection_id?: string;
	key?: string;
	store_id?: string;
};

export interface ArkyServiceCartItem {
  id: string;
  service_id: string;
  provider_id: string;
  from: number;
  to: number;
  forms?: FormEntry[];
  price?: Price;
  service_name?: string;
  provider_name?: string;
  date_text?: string;
  time_text?: string;
  is_multi_day?: boolean;
}

export interface ArkyCartSnapshot {
  cart: Cart | null;
  product_items: EshopCartItem[];
  service_items: ArkyServiceCartItem[];
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
  client_secret: string | null;
  payment: OrderCheckoutResult["payment"];
  product_items?: EshopCartItem[];
  service_items?: ArkyServiceCartItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  total?: number;
  currency?: string | null;
  payment_method_id?: string | null;
  created_at: number;
}

export interface ArkyCartInput {
  product_items?: EshopCartItem[];
  service_items?: ArkyServiceCartItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms?: FormEntry[] | Block[];
  promo_code?: string | null;
  payment_method_id?: string | null;
  shipping_method_id?: string | null;
  clear_after_checkout?: boolean;
}

export interface ArkyCmsState {
  entries: Record<string, CollectionEntry>;
  forms: Record<string, Form>;
  loading: boolean;
  error: string | null;
}

export interface ArkyEshopState {
  products: Product[];
  services: Service[];
  providers: Provider[];
  product_cursor: string | null;
  service_cursor: string | null;
  provider_cursor: string | null;
  availability: unknown | null;
  loading_products: boolean;
  loading_services: boolean;
  loading_providers: boolean;
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

export interface ArkyServiceSlot {
  id: string;
  serviceId: string;
  providerId: string;
  from: number;
  to: number;
  timeText: string;
  dateText: string;
  isMultiDay?: boolean;
  serviceName?: string;
  date?: string;
  serviceBlocks?: Block[];
}

export interface ArkyServiceState {
  service: Service | null;
  availability: AvailabilityResponse | null;
  providers: Provider[];
  selectedProviderId: string | null;
  currentMonth: Date;
  calendar: ArkyCalendarDay[];
  selectedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  slots: ArkyServiceSlot[];
  selectedSlot: ArkyServiceSlot | null;
  cart: ArkyServiceSlot[];
  timezone: string;
  tzGroups: Record<string, { zone: string; name: string }[]>;
  loading: boolean;
  weekdays: string[];
  quote: OrderQuote | null;
  fetchingQuote: boolean;
  quoteError: string | null;
  currency: string | null;
  dateTimeConfirmed: boolean;
  isMultiDay: boolean;
  availablePaymentMethods: PaymentMethod[];
  cartId: string | null;
  promoCode: string | null;
}
