import type { OrderMoney, StorefrontPrice } from '../types';

type OrderTotal = Pick<OrderMoney, 'total' | 'currency'>;

export const SUPPORTED_STORE_CURRENCIES = Object.freeze([
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'AUD', 'CAD', 'HKD', 'SGD',
    'NZD', 'KRW', 'SEK', 'NOK', 'DKK', 'INR', 'MXN', 'BRL', 'ZAR', 'RUB',
    'TRY', 'PLN', 'THB', 'IDR', 'MYR', 'PHP', 'CZK', 'ILS', 'AED', 'SAR',
    'HUF', 'RON', 'BGN', 'HRK', 'BAM', 'RSD', 'MKD', 'ALL',
] as const);

const SUPPORTED_STORE_CURRENCY_SET: ReadonlySet<string> = Object.freeze(
    new Set<string>(SUPPORTED_STORE_CURRENCIES),
);

const ZERO_MINOR_UNIT_STORE_CURRENCIES: ReadonlySet<string> = Object.freeze(
    new Set<string>(['JPY', 'KRW']),
);

function formatCurrency(amount: number, currencyCode: string, locale: string = 'en'): string {
    const normalized = currencyCode.trim().toUpperCase();
    if (!normalized) return '';
    const minorUnits = getCurrencyMinorUnits(normalized);
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: normalized,
        minimumFractionDigits: minorUnits,
        maximumFractionDigits: minorUnits,
    }).format(amount);
}

export function getCurrencyMinorUnits(currency: string): number {
    const normalized = currency.trim().toUpperCase();
    if (!SUPPORTED_STORE_CURRENCY_SET.has(normalized)) {
        throw new RangeError(`Unsupported currency '${currency}'`);
    }
    return ZERO_MINOR_UNIT_STORE_CURRENCIES.has(normalized) ? 0 : 2;
}

export function convertToMajor(minorAmount: number, currency: string): number {
    const units = getCurrencyMinorUnits(currency);
    return minorAmount / Math.pow(10, units);
}

export function convertToMinor(majorAmount: number, currency: string): number {
    const units = getCurrencyMinorUnits(currency);
    return Math.round(majorAmount * Math.pow(10, units));
}

export function getCurrencySymbol(currency: string): string {
    try {
        return new Intl.NumberFormat('en', {
            style: 'currency',
            currency: currency.toUpperCase(),
            currencyDisplay: 'narrowSymbol'
        }).formatToParts(0).find(p => p.type === 'currency')?.value || currency.toUpperCase();
    } catch {
        return currency.toUpperCase();
    }
}

export function getCurrencyName(currency: string): string {
    try {
        return new Intl.DisplayNames(['en'], { type: 'currency' }).of(currency.toUpperCase()) || currency.toUpperCase();
    } catch {
        return currency.toUpperCase();
    }
}

export function formatMinor(amountMinor: number, currency: string): string {
    if (!Number.isSafeInteger(amountMinor)) {
        throw new RangeError('Minor-unit amount must be a safe integer');
    }
    return formatCurrency(convertToMajor(amountMinor, currency), currency);
}

export function formatPayment(payment: OrderTotal): string {
    return formatMinor(payment.total, payment.currency);
}

export function formatPrice(price: StorefrontPrice | null | undefined): string {
    const amount = getPriceAmount(price);
    if (amount === null || !price) return '';
    return formatMinor(amount, price.unit_price.currency);
}

export function getPriceAmount(price: StorefrontPrice | null | undefined): number | null {
    if (!price || !Number.isSafeInteger(price.unit_price.amount) || price.unit_price.amount < 0) return null;
    return price.unit_price.amount;
}
