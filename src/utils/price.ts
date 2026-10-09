import type { Currency, Money } from "../types/common";
import { CURRENCY_MINOR_UNITS } from "../types/common";
import type { StorefrontPrice } from "../types/product";

export const SUPPORTED_STORE_CURRENCIES = Object.freeze(Object.keys(CURRENCY_MINOR_UNITS) as Currency[]);

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CURRENCY_MINOR_UNITS, value);
}

export function getCurrencyMinorUnits(currency: string): number {
  const normalized = currency.trim().toLowerCase();
  if (!isCurrency(normalized)) throw new RangeError(`Unsupported currency '${currency}'`);
  return CURRENCY_MINOR_UNITS[normalized];
}

export function convertToMajor(minorAmount: number, currency: string): number {
  return minorAmount / Math.pow(10, getCurrencyMinorUnits(currency));
}

export function convertToMinor(majorAmount: number, currency: string): number {
  return Math.round(majorAmount * Math.pow(10, getCurrencyMinorUnits(currency)));
}

export function getCurrencySymbol(currency: string, locale: string): string {
  try {
    return (
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency.toUpperCase(),
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value || currency.toUpperCase()
    );
  } catch {
    return currency.toUpperCase();
  }
}

export function getCurrencyName(currency: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(currency.toUpperCase()) || currency.toUpperCase();
  } catch {
    return currency.toUpperCase();
  }
}

export function formatMinor(amountMinor: number, currency: string, locale: string): string {
  if (!Number.isSafeInteger(amountMinor)) throw new RangeError("Minor-unit amount must be a safe integer");
  const minorUnits = getCurrencyMinorUnits(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: minorUnits,
    maximumFractionDigits: minorUnits,
  }).format(amountMinor / Math.pow(10, minorUnits));
}

export function formatMoney(money: Money, locale: string): string {
  return formatMinor(money.amount, money.currency, locale);
}

export function getPriceAmount(price: StorefrontPrice | null | undefined): number | null {
  if (!price || !Number.isSafeInteger(price.unit_price.amount) || price.unit_price.amount < 0) return null;
  return price.unit_price.amount;
}

export function formatPrice(price: StorefrontPrice | null | undefined, locale: string): string {
  const amount = getPriceAmount(price);
  if (amount === null || !price) return "";
  return formatMinor(amount, price.unit_price.currency, locale);
}
