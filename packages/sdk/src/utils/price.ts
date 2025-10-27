// Price formatting utilities - Centralized currency and price operations
import type { Payment, PaymentMethod, Price } from '../types';
import { getCurrencySymbol } from './currency';

// Market-based currency symbols mapping
const CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$'
} as const;

const MARKET_CURRENCIES = {
    'US': 'USD',
    'EU': 'EUR',
    'UK': 'GBP',
    'CA': 'CAD',
    'AU': 'AUD'
} as const;

// Convert minor units (cents) to major units (dollars)
export function convertToMajor(minorAmount: number): number {
    return (minorAmount ?? 0) / 100;
}

// Convert major units to minor units
export function convertToMinor(majorAmount: number): number {
    return Math.round((majorAmount ?? 0) * 100);
}

// Get currency symbol from currency code
export function getSymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || '$';
}

// Get currency from market ID
export function getCurrencyFromMarket(marketId: string): string {
    return MARKET_CURRENCIES[marketId as keyof typeof MARKET_CURRENCIES] || 'USD';
}

// Format currency amount with symbol
export function formatCurrencyAmount(
    amount: number,
    currency: string,
    options: {
        showSymbols?: boolean;
        decimalPlaces?: number;
        customSymbol?: string;
    } = {}
): string {
    const { showSymbols = true, decimalPlaces = 2, customSymbol } = options;
    const roundedAmount = amount.toFixed(decimalPlaces);

    if (!showSymbols) {
        return `${roundedAmount} ${currency}`;
    }

    const symbol = customSymbol || getSymbol(currency);
    return `${symbol}${roundedAmount}`;
}

// Format minor units with currency
export function formatMinor(
    amountMinor: number,
    currency: string,
    options: {
        showSymbols?: boolean;
        decimalPlaces?: number;
        customSymbol?: string;
    } = {}
): string {
    const major = convertToMajor(amountMinor);
    return formatCurrencyAmount(major, currency, options);
}

// Format Payment structure for display
export function formatPayment(
    payment: Payment,
    options: {
        showSymbols?: boolean;
        decimalPlaces?: number;
        showBreakdown?: boolean;
    } = {}
): string {
    if (!payment) return '';

    const { showSymbols = true, decimalPlaces = 2, showBreakdown = false } = options;

    if (showBreakdown) {
        const subtotal = formatMinor(payment.subtotal, payment.currency, { showSymbols, decimalPlaces });
        const discount = (payment.discount ?? 0) > 0 ? formatMinor(payment.discount, payment.currency, { showSymbols, decimalPlaces }) : null;
        const tax = (payment.tax ?? 0) > 0 ? formatMinor(payment.tax, payment.currency, { showSymbols, decimalPlaces }) : null;
        const total = formatMinor(payment.total, payment.currency, { showSymbols, decimalPlaces });

        let result = `Subtotal: ${subtotal}`;
        if (discount) result += `, Discount: -${discount}`;
        if (tax) result += `, Tax: ${tax}`;
        result += `, Total: ${total}`;
        return result;
    }

    return formatMinor(payment.total, payment.currency, { showSymbols, decimalPlaces });
}

// Format market-based prices (from product variants)
export function getMarketPrice(
    prices: Price[],
    marketId: string,
    businessMarkets?: any[],
    options: {
        showSymbols?: boolean;
        decimalPlaces?: number;
        showCompareAt?: boolean;
        fallbackMarket?: string;
    } = {}
): string {
    if (!prices || prices.length === 0) return '';

    const {
        showSymbols = true,
        decimalPlaces = 2,
        showCompareAt = true,
        fallbackMarket = 'US',
    } = options;

    // Find price for the specific market
    let price = prices.find(p => p.market === marketId);

    // Fallback to first available or fallback market
    if (!price) {
        price = prices.find(p => p.market === fallbackMarket) || prices[0];
    }

    if (!price) return '';

    let currency: string;
    let symbol: string;

    // If we have business markets, use the currency directly from market data
    if (businessMarkets) {
        const marketData = businessMarkets.find(m => m.id === price.market || m.code === price.market);
        if (marketData?.currency) {
            currency = marketData.currency;
            symbol = getCurrencySymbol(currency);
        } else {
            currency = getCurrencyFromMarket(price.market);
            symbol = getSymbol(currency);
        }
    } else {
        currency = getCurrencyFromMarket(price.market);
        symbol = getSymbol(currency);
    }

    // Format price with custom symbol
    const formattedPrice = formatMinor(price.amount ?? 0, currency, {
        showSymbols,
        decimalPlaces,
        customSymbol: symbol
    });

    // Add compare-at price if available
    if (showCompareAt && price.compareAt && price.compareAt > (price.amount ?? 0)) {
        const formattedCompareAt = formatMinor(price.compareAt, currency, {
            showSymbols,
            decimalPlaces,
            customSymbol: symbol
        });
        return `${formattedPrice} was ${formattedCompareAt}`;
    }

    return formattedPrice;
}

// Get price amount from market-based prices (for calculations)
export function getPriceAmount(prices: Price[], marketId: string, fallbackMarket: string = 'US'): number {
    if (!prices || prices.length === 0) return 0;

    const price = prices.find(p => p.market === marketId) ||
                 prices.find(p => p.market === fallbackMarket) ||
                 prices[0];

    // Amounts are stored in minor units (e.g., cents)
    return price?.amount || 0;
}

// Create Payment structure for checkout (all amounts in minor units)
export function createPaymentForCheckout(
    subtotalMinor: number,
    marketId: string,
    currency: string,
    paymentMethod: any,
    options: {
        discount?: number;
        tax?: number;
        promoCodeId?: string;
    } = {}
): Payment {
    const { discount = 0, tax = 0, promoCodeId } = options;
    const total = subtotalMinor - discount + tax;

    return {
        currency,
        market: marketId,
        subtotal: subtotalMinor,
        shipping: 0,
        discount,
        tax,
        total,
        promoCodeId,
        method: paymentMethod,
    };
}
