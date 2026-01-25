
import type { Payment, PaymentMethodType, Price } from '../types';
import { getCurrencySymbol, isSymbolAfterCurrency } from './currency';

const MARKET_CURRENCIES = {
    'US': 'USD',
    'EU': 'EUR',
    'UK': 'GBP',
    'CA': 'CAD',
    'AU': 'AUD'
} as const;

export function convertToMajor(minorAmount: number): number {
    return (minorAmount ?? 0) / 100;
}

export function convertToMinor(majorAmount: number): number {
    return Math.round((majorAmount ?? 0) * 100);
}

export function getCurrencyFromMarket(marketId: string): string {
    return MARKET_CURRENCIES[marketId as keyof typeof MARKET_CURRENCIES] || 'USD';
}

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

    const symbol = customSymbol || getCurrencySymbol(currency);

    if (isSymbolAfterCurrency(currency)) {
        return `${roundedAmount} ${symbol}`;
    }

    return `${symbol}${roundedAmount}`;
}

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
        const taxAmount = payment.tax?.amount ?? 0;
        const tax = taxAmount > 0 ? formatMinor(taxAmount, payment.currency, { showSymbols, decimalPlaces }) : null;
        const total = formatMinor(payment.total, payment.currency, { showSymbols, decimalPlaces });

        let result = `Subtotal: ${subtotal}`;
        if (discount) result += `, Discount: -${discount}`;
        if (tax) result += `, Tax: ${tax}`;
        result += `, Total: ${total}`;
        return result;
    }

    return formatMinor(payment.total, payment.currency, { showSymbols, decimalPlaces });
}

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
        fallbackMarket,
    } = options;

    let price = prices.find(p => p.market === marketId);

    if (!price && fallbackMarket) {
        price = prices.find(p => p.market === fallbackMarket);
    }
    if (!price) {
        price = prices[0];
    }

    if (!price) return '';

    let currency: string;
    let symbol: string;

    if (businessMarkets) {
        const marketData = businessMarkets.find(m => m.id === price.market || m.code === price.market);
        if (marketData?.currency) {
            currency = marketData.currency;
            symbol = getCurrencySymbol(currency);
        } else {
            currency = getCurrencyFromMarket(price.market);
            symbol = getCurrencySymbol(currency);
        }
    } else {
        currency = getCurrencyFromMarket(price.market);
        symbol = getCurrencySymbol(currency);
    }

    const formattedPrice = formatMinor(price.amount ?? 0, currency, {
        showSymbols,
        decimalPlaces,
        customSymbol: symbol
    });

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

export function getPriceAmount(prices: Price[], marketId: string, fallbackMarket?: string): number {
    if (!prices || prices.length === 0) return 0;

    let price = prices.find(p => p.market === marketId);
    if (!price && fallbackMarket) {
        price = prices.find(p => p.market === fallbackMarket);
    }
    if (!price) {
        price = prices[0];
    }

    return price?.amount || 0;
}

export function createPaymentForCheckout(
    subtotalMinor: number,
    marketId: string,
    currency: string,
    paymentMethod: any,
    options: {
        discount?: number;
        taxAmount?: number;
        taxRateBps?: number;
        promoCode?: {
            id: string;
            code: string;
            type: string;
            value: number;
        };
    } = {}
): Payment {
    const { discount = 0, taxAmount = 0, taxRateBps = 0, promoCode } = options;
    const total = subtotalMinor - discount + taxAmount;

    return {
        currency,
        market: marketId,
        subtotal: subtotalMinor,
        shipping: 0,
        discount,
        total,
        paid: 0,
        refunds: [],
        type: paymentMethod,
        ...(taxAmount > 0 && {
            tax: {
                amount: taxAmount,
                rateBps: taxRateBps,
                lines: [],
            },
        }),
        ...(promoCode && { promoCode }),
    };
}
