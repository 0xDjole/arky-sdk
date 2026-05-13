import type {
  Address,
  Block,
  EshopCartItem,
  FormEntry,
  FormField,
  FormSchema,
  Price,
  Product,
  ProductVariant,
  Provider,
  Service,
  ZoneLocation,
} from "../types";
import type {
  AvailabilityResponse,
  ProductCheckoutItemInput,
  ServiceCheckoutItemInput,
  SlotRange,
} from "../types/api";
import type { ArkyServiceCartItem, ArkyServiceState, ArkyStoreClient } from "./types";

export function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

export function createId(prefix: string): string {
  const cryptoValue = globalThis.crypto;
  if (cryptoValue && "randomUUID" in cryptoValue) return cryptoValue.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function firstLocalized(value: unknown, locale: string): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const localeValue = record[locale];
  if (typeof localeValue === "string") return localeValue;
  const englishValue = record.en;
  if (typeof englishValue === "string") return englishValue;
  for (const entry of Object.values(record)) {
    if (typeof entry === "string") return entry;
  }
  return "";
}

export function findBlock(blocks: Block[] | undefined, keys: string[]): Block | null {
  return (blocks || []).find((block) => keys.includes(block.key)) || null;
}

export function blockText(blocks: Block[] | undefined, keys: string[], locale: string): string {
  const block = findBlock(blocks, keys);
  if (!block) return "";
  return firstLocalized(block.value, locale);
}

export function productName(product: Product, locale: string): string {
  return blockText(product.blocks, ["name", "title"], locale) || product.key || product.id;
}

export function serviceName(service: Service, locale: string): string {
  return blockText(service.blocks, ["name", "title"], locale) || service.key || service.id;
}

export function providerName(provider: Provider, locale: string): string {
  return blockText(provider.blocks, ["name", "title"], locale) || provider.key || provider.id;
}

export function entitySlug(entity: { id: string; slug?: Record<string, string> }, locale: string): string {
  return entity.slug?.[locale] || entity.slug?.en || Object.values(entity.slug || {})[0] || entity.id;
}

export function priceForMarket(prices: Price[], market: string, fallbackCurrency?: string | null): Price {
  const price = prices.find((candidate) => candidate.market === market) || prices[0];
  return {
    amount: price?.amount || 0,
    market: price?.market || market,
    currency: price?.currency || fallbackCurrency || "",
    compare_at: price?.compare_at,
    audience_id: price?.audience_id,
  };
}

export function availableStock(client: ArkyStoreClient, variant: ProductVariant): number | undefined {
  const fromUtility = client.utils.getAvailableStock(variant);
  if (Number.isFinite(fromUtility)) return fromUtility;
  const stock = (variant.inventory || []).reduce((total, row) => total + (row.available || 0), 0);
  return stock > 0 ? stock : undefined;
}

export function locationToAddress(location: ZoneLocation): Address {
  return {
    country: location.country || "",
    state: location.state || "",
    city: location.city || "",
    postal_code: location.postal_code || "",
    name: "",
    street1: "",
    street2: null,
  };
}

export function normalizeForms(forms: FormEntry[] | Block[] | undefined): FormEntry[] | undefined {
  return forms as FormEntry[] | undefined;
}

export function toProductCheckoutItems(items: EshopCartItem[]): ProductCheckoutItemInput[] {
  return items.map((item) => ({
    type: "product",
    id: item.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
  }));
}

export function toServiceCheckoutItems(items: ArkyServiceCartItem[]): ServiceCheckoutItemInput[] {
  const groups = new Map<string, ServiceCheckoutItemInput>();
  for (const item of items) {
    const key = `${item.service_id}:${item.provider_id}`;
    const slot: SlotRange = { from: item.from, to: item.to };
    const existing = groups.get(key);
    if (existing) {
      existing.slots.push(slot);
      continue;
    }
    groups.set(key, {
      type: "service",
      id: item.id,
      service_id: item.service_id,
      provider_id: item.provider_id,
      slots: [slot],
      forms: item.forms || [],
      price: item.price,
    });
  }
  return [...groups.values()].map((item) => ({
    ...item,
    slots: [...item.slots].sort((a, b) => a.from - b.from),
  }));
}

export function formFieldsFromBlocks(blocks: Block[]): FormField[] {
  return blocks.map((block) => ({
    id: block.id,
    key: block.key,
    type: block.type as FormField["type"],
    value: block.value,
  }));
}

export function getFormBlockType(field: FormSchema): string {
  if (field.key === "email") return "email";
  if (field.key === "phone") return "phone";
  if (field.type === "geo_location") return "address";
  return field.type;
}

export function getFormBlockValue(field: FormSchema): unknown {
  if (field.type === "boolean") return false;
  if (field.type === "number") return field.min ?? 0;
  if (field.type === "geo_location") return {};
  return "";
}

export function formSchemaToBlock(field: FormSchema): Block {
  return {
    id: field.id,
    key: field.key,
    type: getFormBlockType(field),
    properties: {
      isRequired: field.required,
      minValues: field.required ? 1 : 0,
      min: field.min,
      max: field.max,
      options: field.options,
      pattern: field.key === "email" ? "^.+@.+\\..+$" : field.key === "phone" ? "^.{6,20}$" : undefined,
    },
    value: getFormBlockValue(field),
  };
}

export function formatServiceTime(ts: number, tz: string): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

export function formatServiceSlotTime(from: number, to: number, tz: string): string {
  return `${formatServiceTime(from, tz)} - ${formatServiceTime(to, tz)}`;
}

export function getSlotsForDate(
  availability: AvailabilityResponse | null,
  dateStr: string,
  providerId?: string | null,
): { from: number; to: number; providerId: string }[] {
  if (!availability) return [];
  const slots: { from: number; to: number; providerId: string }[] = [];
  for (const provider of availability.providers) {
    if (providerId && provider.provider_id !== providerId) continue;
    const day = provider.days.find((candidate) => candidate.date === dateStr);
    if (!day) continue;
    for (const slot of day.slots) {
      if (slot.spots > 0) slots.push({ from: slot.from, to: slot.to, providerId: provider.provider_id });
    }
  }
  return slots.sort((a, b) => a.from - b.from);
}

export function hasAvailableSlotsForDate(
  availability: AvailabilityResponse | null,
  dateStr: string,
  providerId?: string | null,
): boolean {
  if (!availability) return false;
  return availability.providers.some((provider) => {
    if (providerId && provider.provider_id !== providerId) return false;
    const day = provider.days.find((candidate) => candidate.date === dateStr);
    return !!day?.slots.some((slot) => slot.spots > 0);
  });
}

export const SERVICE_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function createServiceInitialState(): ArkyServiceState {
  return {
    service: null,
    availability: null,
    providers: [],
    selectedProviderId: null,
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    calendar: [],
    selectedDate: null,
    startDate: null,
    endDate: null,
    slots: [],
    selectedSlot: null,
    cart: [],
    timezone: typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
    tzGroups: {},
    loading: false,
    weekdays: SERVICE_WEEKDAYS,
    quote: null,
    fetchingQuote: false,
    quoteError: null,
    currency: null,
    dateTimeConfirmed: false,
    isMultiDay: false,
    availablePaymentMethods: [],
    cartId: null,
    promoCode: null,
  };
}

export function normalizeTimezoneGroups(
  groups: { label: string; zones: { label: string; value: string }[] }[],
): Record<string, { zone: string; name: string }[]> {
  const normalized: Record<string, { zone: string; name: string }[]> = {};
  for (const group of groups) {
    normalized[group.label] = group.zones.map((zone) => ({
      zone: zone.value,
      name: zone.label,
    }));
  }
  return normalized;
}
