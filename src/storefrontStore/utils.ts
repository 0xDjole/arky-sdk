import type { EpochMilliseconds } from "../types/time";
import type { Block } from "../types/block";
import type { Coordinates } from "../types/common";
import type { Form, FormAnswerInput, FormQuestion, FormValue, FormValues } from "../types/forms";
import type {
  AvailabilityResponse,
  StorefrontBookingResource,
  StorefrontBookingService,
  StorefrontProduct,
} from "../types/product";
import { getBlockTextValue } from "../utils/blocks";
import { epochMillisecondsToDate } from "../utils/time";
import type { ArkyBookingServiceState } from "./types";

export function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return fallback;
}

export function blockText(blocks: readonly Block[] | undefined, keys: readonly string[], locale: string): string {
  const block = (blocks || []).find((candidate) => keys.includes(candidate.key));
  return block ? getBlockTextValue(block, locale) : "";
}

export function productName(product: Pick<StorefrontProduct, "blocks" | "key">, locale: string): string {
  return blockText(product.blocks, ["name", "title"], locale) || product.key;
}

export function bookingServiceName(service: Pick<StorefrontBookingService, "blocks" | "key">, locale: string): string {
  return blockText(service.blocks, ["name", "title"], locale) || service.key;
}

export function bookingResourceName(resource: Pick<StorefrontBookingResource, "blocks" | "key">, locale: string): string {
  return blockText(resource.blocks, ["name", "title"], locale) || resource.key;
}

export function productSlug(product: Pick<StorefrontProduct, "slugs">, locale: string): string | null {
  return product.slugs[locale] ?? null;
}

function questionError(question: FormQuestion, message: string): Error {
  return new Error(`Invalid value for form question '${question.key}': ${message}`);
}

function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const coordinates = value as Coordinates;
  return (
    Number.isFinite(coordinates.lat) &&
    Number.isFinite(coordinates.lon) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lon >= -180 &&
    coordinates.lon <= 180
  );
}

function isEmpty(value: FormValue): boolean {
  return (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);
}

function answerFor(question: FormQuestion, value: FormValue): FormAnswerInput {
  const base = { question_id: question.id, key: question.key };
  switch (question.type) {
    case "text": {
      if (typeof value !== "string") throw questionError(question, "expected text");
      if (question.min_length !== null && value.length < question.min_length) {
        throw questionError(question, `must be at least ${question.min_length} characters`);
      }
      if (question.max_length !== null && value.length > question.max_length) {
        throw questionError(question, `must be at most ${question.max_length} characters`);
      }
      if (question.pattern !== null && !new RegExp(question.pattern).test(value)) {
        throw questionError(question, "doesn't match the expected format");
      }
      return { ...base, type: "text", value };
    }
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) throw questionError(question, "expected a finite number");
      if (question.min !== null && value < question.min) throw questionError(question, `must be at least ${question.min}`);
      if (question.max !== null && value > question.max) throw questionError(question, `must be at most ${question.max}`);
      return { ...base, type: "number", value };
    }
    case "boolean":
      if (typeof value !== "boolean") throw questionError(question, "expected yes or no");
      return { ...base, type: "boolean", value };
    case "date":
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw questionError(question, "expected a day as YYYY-MM-DD");
      }
      return { ...base, type: "date", value };
    case "date_time":
      if (typeof value !== "number" || !Number.isSafeInteger(value)) {
        throw questionError(question, "expected a moment in epoch milliseconds");
      }
      return { ...base, type: "date_time", value: value as EpochMilliseconds };
    case "geo_location":
      if (!isCoordinates(value)) throw questionError(question, "expected valid coordinates");
      return { ...base, type: "geo_location", value: { lat: value.lat, lon: value.lon } };
    case "select_one":
      if (typeof value !== "string" || !question.options.some((option) => option.key === value)) {
        throw questionError(question, "expected one of the options");
      }
      return { ...base, type: "select_one", option_key: value };
    case "select_many": {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        throw questionError(question, "expected a list of options");
      }
      const keys = value as string[];
      if (new Set(keys).size !== keys.length || keys.some((key) => !question.options.some((option) => option.key === key))) {
        throw questionError(question, "contains an unknown or repeated option");
      }
      return { ...base, type: "select_many", option_keys: keys };
    }
    case "file": {
      const FileConstructor = globalThis.File;
      if (!Array.isArray(value) || !FileConstructor || value.some((item) => !(item instanceof FileConstructor))) {
        throw questionError(question, "expected a list of files");
      }
      const files = value as File[];
      if (files.length > question.max_files) throw questionError(question, `allows at most ${question.max_files} files`);
      return { ...base, type: "file", files };
    }
  }
}

export function buildFormAnswers(form: Pick<Form, "questions">, values: FormValues): FormAnswerInput[] {
  const known = new Set(form.questions.map((question) => question.key));
  const unknown = Object.keys(values).find((key) => !known.has(key));
  if (unknown) throw new Error(`Form question '${unknown}' isn't part of the form`);
  const answers: FormAnswerInput[] = [];
  for (const question of form.questions) {
    const value = values[question.key];
    if (value === undefined || value === null || isEmpty(value)) {
      if (question.required) throw questionError(question, "an answer is required");
      continue;
    }
    answers.push(answerFor(question, value));
  }
  return answers;
}

export function formatServiceTime(ts: EpochMilliseconds, tz: string, locale: string): string {
  return epochMillisecondsToDate(ts).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

export function formatServiceSlotTime(from: EpochMilliseconds, to: EpochMilliseconds, tz: string, locale: string): string {
  return `${formatServiceTime(from, tz, locale)} - ${formatServiceTime(to, tz, locale)}`;
}

export function getSlotsForDate(
  availability: AvailabilityResponse | null,
  dateStr: string,
  bookingResourceId?: string | null,
): { from: EpochMilliseconds; to: EpochMilliseconds; bookingResourceId: string }[] {
  if (!availability) return [];
  const slots: { from: EpochMilliseconds; to: EpochMilliseconds; bookingResourceId: string }[] = [];
  for (const resource of availability.booking_resources) {
    if (bookingResourceId && resource.booking_resource_id !== bookingResourceId) continue;
    const day = resource.days.find((candidate) => candidate.date === dateStr);
    if (!day) continue;
    for (const slot of day.slots) {
      if (slot.spots > 0) slots.push({ from: slot.from, to: slot.to, bookingResourceId: resource.booking_resource_id });
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
    if (bookingResourceId && resource.booking_resource_id !== bookingResourceId) return false;
    const day = resource.days.find((candidate) => candidate.date === dateStr);
    return !!day?.slots.some((slot) => slot.spots > 0);
  });
}

export const SERVICE_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function createBookingServiceInitialState(): ArkyBookingServiceState {
  return {
    bookingService: null,
    availability: null,
    bookingResources: [],
    bookingOfferings: [],
    bookingOfferingsCursor: null,
    loadingOfferings: false,
    selectedBookingResourceId: null,
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    calendar: [],
    selectedDate: null,
    slots: [],
    selectedSlot: null,
    timezone: typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
    tzGroups: {},
    loading: false,
    weekdays: SERVICE_WEEKDAYS,
    quote: null,
    fetchingQuote: false,
    quoteError: null,
    currency: null,
    dateTimeConfirmed: false,
    availablePaymentOptionIds: [],
    cartId: null,
  };
}

export function normalizeTimezoneGroups(
  groups: { label: string; zones: { label: string; value: string }[] }[],
): Record<string, { zone: string; name: string }[]> {
  const normalized: Record<string, { zone: string; name: string }[]> = {};
  for (const group of groups) {
    normalized[group.label] = group.zones.map((zone) => ({ zone: zone.value, name: zone.label }));
  }
  return normalized;
}
