import type { createStorefront, CreateStorefrontConfig } from "../index";
import type {
  Address,
  Block,
  Cart,
  EshopCartItem,
  CollectionEntry,
  Currency,
  Form,
  FormEntry,
  FormValues,
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
import type { AvailabilityResponse, SlotRange } from "../types/api";
import type {
  StripeConfirmationTokenController,
  StripeConfirmationTokenControllerConfig,
} from "../payments/stripe";

export type ArkyStoreClient = ReturnType<typeof createStorefront>;
export type ArkyPaymentController = StripeConfirmationTokenController;
export type ArkyStripePaymentMountOptions = Partial<StripeConfirmationTokenControllerConfig>;

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

export interface ArkySubmitFormByKeyParams {
  key: string;
  store_id?: string;
  values: FormValues;
}

export interface ArkyServiceCartItem {
  id: string;
  service_id: string;
  provider_id: string;
  slots: SlotRange[];
  forms: FormEntry[];
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
  payment_action: OrderCheckoutResult["payment_action"];
  payment: OrderCheckoutResult["payment"];
  product_items?: EshopCartItem[];
  service_items?: ArkyServiceCartItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  total?: number;
  currency?: string | null;
  payment_method_key?: string | null;
  created_at: number;
}

export interface ArkyCartInput {
  product_items?: EshopCartItem[];
  service_items?: ArkyServiceCartItem[];
  shipping_address?: Address | null;
  billing_address?: Address | null;
  forms?: FormEntry[];
  promo_code?: string | null;
  payment_method_key?: string | null;
  shipping_method_id?: string | null;
  payment?: ArkyPaymentController | null;
  return_url?: string;
  billing_details?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
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

export interface ArkyServiceFormGroup {
  form: Form;
  blocks: Block[];
}

export interface ArkyServiceFormState {
  provider_id: string | null;
  groups: ArkyServiceFormGroup[];
  loading: boolean;
  error: string | null;
}

export interface ArkyServiceState {
  service: Service | null;
  availability: AvailabilityResponse | null;
  providers: Provider[];
  serviceProviders: import("../types").ServiceProvider[];
  selectedProviderId: string | null;
  currentMonth: Date;
  calendar: ArkyCalendarDay[];
  selectedDate: string | null;
  slots: ArkyServiceSlot[];
  selectedSlot: ArkyServiceSlot | null;
  timezone: string;
  tzGroups: Record<string, { zone: string; name: string }[]>;
  loading: boolean;
  weekdays: string[];
  quote: OrderQuote | null;
  fetchingQuote: boolean;
  quoteError: string | null;
  currency: Currency | null;
  dateTimeConfirmed: boolean;
  availablePaymentMethods: PaymentMethod[];
  cartId: string | null;
  promoCode: string | null;
}
