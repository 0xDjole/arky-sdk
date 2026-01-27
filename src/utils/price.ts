import type { Payment, Price } from '../types';
import { formatCurrency } from './currency';

export function convertToMajor(minorAmount: number): number {
    return minorAmount / 100;
}

export function convertToMinor(majorAmount: number): number {
    return Math.round(majorAmount * 100);
}

export function formatMinor(amountMinor: number, currency: string): string {
    return formatCurrency(convertToMajor(amountMinor), currency);
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
