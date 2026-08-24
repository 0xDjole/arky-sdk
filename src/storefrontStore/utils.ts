import type {
  Address,
  Block,
  EshopCartItem,
  Form,
  FormEntry,
  FormField,
  FormSchema,
  FormValue,
  FormValues,
  GeoLocation,
  Price,
  Product,
  ProductInventory,
  ProductVariant,
  BookingResource,
  BookingService,
  ZoneLocation,
} from "../types";
import type {
  AvailabilityResponse,
  CartProductInput,
  CartBookingInput,
} from "../types/api";
import type {
  StorefrontProduct,
  StorefrontBookingResource,
  StorefrontBookingService,
} from "../types/storefront";
import { getBlockTextValue } from "../utils/blocks";
import type {
  ArkyBookingCartItem,
  ArkyBookingServiceState,
  ArkyStoreClient,
  FormInputBlock,
} from "./types";

export function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

export function createId(prefix: string): string {
  const cryptoValue = globalThis.crypto;
  if (cryptoValue && "randomUUID" in cryptoValue)
    return cryptoValue.randomUUID();
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

export function findBlock(
  blocks: Block[] | undefined,
  keys: string[],
): Block | null {
  return (blocks || []).find((block) => keys.includes(block.key)) || null;
}

export function blockText(
  blocks: Block[] | undefined,
  keys: string[],
  locale: string,
): string {
  const block = findBlock(blocks, keys);
  if (!block) return "";
  return getBlockTextValue(block, locale);
}

export function productName(
  product: StorefrontProduct,
  locale: string,
): string {
  return (
    blockText(product.blocks, ["name", "title"], locale) ||
    product.key ||
    product.id
  );
}

export function bookingServiceName(
  service: StorefrontBookingService,
  locale: string,
): string {
  return (
    blockText(service.blocks, ["name", "title"], locale) ||
    service.key ||
    service.id
  );
}

export function bookingResourceName(
  provider: StorefrontBookingResource,
  locale: string,
): string {
  return (
    blockText(provider.blocks, ["name", "title"], locale) ||
    provider.key ||
    provider.id
  );
}

export function productSlug(
  product: Pick<StorefrontProduct, "id" | "slugs">,
  locale: string,
): string {
  return (
    product.slugs[locale] ||
    product.slugs.en ||
    Object.values(product.slugs)[0] ||
    product.id
  );
}

export function priceForMarket(
  prices: Price[],
  market: string,
  marketCurrency: string | null | undefined,
): Price {
  const marketKey = market.trim();
  if (!marketKey)
    throw new Error("A market is required to select a product price");
  const currency = marketCurrency?.trim().toUpperCase();
  if (!currency)
    throw new Error(
      `Market ${marketKey} does not have an authoritative currency`,
    );

  const marketPrices = prices.filter(
    (candidate) => candidate.market === marketKey,
  );
  if (marketPrices.length === 0) {
    throw new Error(`Product is not priced for market ${marketKey}`);
  }
  if (
    marketPrices.some(
      (candidate) =>
        !Number.isSafeInteger(candidate.amount) ||
        candidate.amount < 0 ||
        candidate.currency.trim().toUpperCase() !== currency,
    )
  ) {
    throw new Error(`Product has an invalid price for market ${marketKey}`);
  }

  const authorizedPrices = marketPrices.filter(
    (candidate) => candidate.audience_id,
  );
  if (authorizedPrices.length > 0) {
    return authorizedPrices.reduce((lowest, candidate) =>
      candidate.amount < lowest.amount ? candidate : lowest,
    );
  }

  const basePrices = marketPrices.filter((candidate) => !candidate.audience_id);
  if (basePrices.length !== 1) {
    throw new Error(
      `Product does not have one base price for market ${marketKey}`,
    );
  }
  const price = basePrices[0];
  return price;
}

export function freeToSellStock(
  client: ArkyStoreClient,
  inventory: Array<Omit<ProductInventory, "store_id">>,
  variantId: string,
): number | undefined {
  const levels = inventory.filter((level) => level.variant_id === variantId);
  const stock = client.utils.getFreeToSellStock({ inventory: levels });
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

export function createFormEntry(
  formId: string,
  fields: FormField[],
): FormEntry {
  if (!formId.trim()) throw new Error("formId is required");
  return { form_id: formId, fields };
}

export function toCartProducts(items: EshopCartItem[]): CartProductInput[] {
  return items.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    ...(item.form_submission_id
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}

export function toCartBookings(
  items: ArkyBookingCartItem[],
): CartBookingInput[] {
  return items.map((item) => ({
    id: item.id,
    booking_offering_id: item.booking_offering_id,
    requested_interval: item.requested_interval,
    ...(item.form_submission_id
      ? { form_submission_id: item.form_submission_id }
      : {}),
  }));
}

function formValueError(field: FormSchema, message: string): Error {
  return new Error(`Invalid value for form field '${field.key}': ${message}`);
}

function isValidGeoLocation(value: unknown): value is GeoLocation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const location = value as GeoLocation;
  if (
    location.label !== undefined &&
    location.label !== null &&
    typeof location.label !== "string"
  ) {
    return false;
  }
  const coordinates = location.coordinates;
  if (!coordinates || typeof coordinates !== "object") return false;
  return (
    Number.isFinite(coordinates.lat) &&
    Number.isFinite(coordinates.lon) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lon >= -180 &&
    coordinates.lon <= 180
  );
}

function buildFormField(field: FormSchema, value: FormValue): FormField {
  const common = { id: field.id, key: field.key };
  switch (field.type) {
    case "text":
      if (typeof value !== "string")
        throw formValueError(field, "expected text");
      if (field.required && value.trim().length === 0)
        throw formValueError(field, "required text is blank");
      return { ...common, type: "text", value };
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw formValueError(field, "expected a finite number");
      }
      if (field.min !== null && field.min !== undefined && value < field.min) {
        throw formValueError(field, `must be at least ${field.min}`);
      }
      if (field.max !== null && field.max !== undefined && value > field.max) {
        throw formValueError(field, `must be at most ${field.max}`);
      }
      return { ...common, type: "number", value };
    case "boolean":
      if (typeof value !== "boolean")
        throw formValueError(field, "expected a boolean");
      return { ...common, type: "boolean", value };
    case "date":
      if (typeof value !== "number" || !Number.isSafeInteger(value)) {
        throw formValueError(field, "expected an integer timestamp");
      }
      return { ...common, type: "date", value };
    case "geo_location":
      if (!isValidGeoLocation(value))
        throw formValueError(field, "expected valid coordinates");
      return { ...common, type: "geo_location", value };
    case "select": {
      if (
        !Array.isArray(value) ||
        value.some((item) => typeof item !== "string")
      ) {
        throw formValueError(field, "expected a list of options");
      }
      const selected = value as string[];
      if (field.required && selected.length === 0)
        throw formValueError(field, "at least one option is required");
      if (
        new Set(selected).size !== selected.length ||
        selected.some((item) => !field.options.includes(item))
      ) {
        throw formValueError(field, "contains an unknown or duplicate option");
      }
      return { ...common, type: "select", value: selected };
    }
  }
}

function isEmptyOptionalValue(field: FormSchema, value: FormValue): boolean {
  if (field.required) return false;
  if (field.type === "text") return value === "";
  if (field.type === "select")
    return Array.isArray(value) && value.length === 0;
  if (field.type === "geo_location") {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0,
    );
  }
  return false;
}

export function buildFormFields(
  schema: FormSchema[],
  values: FormValues,
): FormField[] {
  const knownKeys = new Set(schema.map((field) => field.key));
  const unknownKey = Object.keys(values).find((key) => !knownKeys.has(key));
  if (unknownKey)
    throw new Error(
      `Form field '${unknownKey}' is not defined by the form schema`,
    );

  const fields: FormField[] = [];
  for (const field of schema) {
    const value = values[field.key];
    if (value === undefined) {
      if (field.required)
        throw formValueError(field, "required value is missing");
      continue;
    }
    if (isEmptyOptionalValue(field, value)) continue;
    fields.push(buildFormField(field, value));
  }
  return fields;
}

export function createFormEntryFromValues(
  form: Pick<Form, "id" | "schema">,
  values: FormValues,
): FormEntry {
  return createFormEntry(form.id, buildFormFields(form.schema, values));
}

export function getFormBlockType(field: FormSchema): string {
  if (field.key === "email") return "email";
  if (field.key === "phone") return "phone";
  if (field.type === "geo_location") return "address";
  return field.type;
}

export function getFormBlockValue(field: FormSchema): FormValue | undefined {
  if (field.type === "boolean") return false;
  if (field.type === "select") return [];
  if (field.type === "geo_location") return {};
  if (field.type === "number" || field.type === "date") return undefined;
  return "";
}

export function formSchemaToBlock(field: FormSchema): FormInputBlock {
  const min = field.type === "number" ? field.min : undefined;
  const max = field.type === "number" ? field.max : undefined;
  const options = field.type === "select" ? field.options : undefined;
  return {
    id: field.id,
    key: field.key,
    type: getFormBlockType(field),
    properties: {
      isRequired: field.required,
      minValues: field.required ? 1 : 0,
      min,
      max,
      options,
      pattern:
        field.key === "email"
          ? "^.+@.+\\..+$"
          : field.key === "phone"
            ? "^.{6,20}$"
            : undefined,
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

export function formatServiceSlotTime(
  from: number,
  to: number,
  tz: string,
): string {
  return `${formatServiceTime(from, tz)} - ${formatServiceTime(to, tz)}`;
}

export function getSlotsForDate(
  availability: AvailabilityResponse | null,
  dateStr: string,
  bookingResourceId?: string | null,
): { from: number; to: number; bookingResourceId: string }[] {
  if (!availability) return [];
  const slots: { from: number; to: number; bookingResourceId: string }[] = [];
  for (const resource of availability.booking_resources) {
    if (
      bookingResourceId &&
      resource.booking_resource_id !== bookingResourceId
    ) {
      continue;
    }
    const day = resource.days.find((candidate) => candidate.date === dateStr);
    if (!day) continue;
    for (const slot of day.slots) {
      if (slot.spots > 0)
        slots.push({
          from: slot.from,
          to: slot.to,
          bookingResourceId: resource.booking_resource_id,
        });
    }
  }
  return slots.sort((a, b) => a.from - b.from);
}

export function hasAvailableSlotsForDate(
  availability: AvailabilityResponse | null,
  dateStr: string,
  bookingResourceId?: string | null,
): boolean {
  if (!availability) return false;
  return availability.booking_resources.some((resource) => {
    if (
      bookingResourceId &&
      resource.booking_resource_id !== bookingResourceId
    ) {
      return false;
    }
    const day = resource.days.find((candidate) => candidate.date === dateStr);
    return !!day?.slots.some((slot) => slot.spots > 0);
  });
}

export const SERVICE_WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export function createBookingServiceInitialState(): ArkyBookingServiceState {
  return {
    bookingService: null,
    availability: null,
    bookingResources: [],
    bookingOfferings: [],
    selectedBookingResourceId: null,
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    calendar: [],
    selectedDate: null,
    slots: [],
    selectedSlot: null,
    timezone:
      typeof window !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC",
    tzGroups: {},
    loading: false,
    weekdays: SERVICE_WEEKDAYS,
    quote: null,
    fetchingQuote: false,
    quoteError: null,
    currency: null,
    dateTimeConfirmed: false,
    availablePaymentProviderIds: [],
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
