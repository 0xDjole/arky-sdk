import type { Payment, Price } from '../types';

function formatCurrency(amount: number, currencyCode: string, locale: string = 'en'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
    }).format(amount);
}

function getMinorUnits(currency: string): number {
    try {
        const formatter = new Intl.NumberFormat('en', {
            style: 'currency',
            currency: currency.toUpperCase(),
        });
        const parts = formatter.formatToParts(1.11);
        const fractionPart = parts.find(p => p.type === 'fraction');
        return fractionPart?.value.length ?? 2;
    } catch {
        return 2; // Default fallback
    }
}

export function convertToMajor(minorAmount: number, currency: string): number {
    const units = getMinorUnits(currency);
    return minorAmount / Math.pow(10, units);
}

export function convertToMinor(majorAmount: number, currency: string): number {
    const units = getMinorUnits(currency);
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
    return formatCurrency(convertToMajor(amountMinor, currency), currency);
}

export function formatPayment(payment: Payment): string {
    return formatMinor(payment.total, payment.currency);
}

export function formatPrice(prices: Price[], marketId?: string): string {
    if (!prices || prices.length === 0) return '';

    const price = marketId
        ? prices.find(p => p.market === marketId) || prices[0]
        : prices[0];

    if (!price) return '';

    return formatMinor(price.amount, price.currency);
}

export function getPriceAmount(prices: Price[], marketId: string): number {
    if (!prices || prices.length === 0) return 0;
    const price = prices.find(p => p.market === marketId) || prices[0];
    return price?.amount || 0;
}
