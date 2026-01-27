
/**
 * Currency information returned from the config endpoint
 */
export interface CurrencyInfo {
    code: string;      // "usd"
    symbol: string;    // "$"
    name: string;      // "US Dollar"
}

/**
 * Cached currencies fetched from config endpoint
 */
let cachedCurrencies: CurrencyInfo[] | null = null;

/**
 * Set the cached currencies (called by SDK when config is fetched)
 */
export function setCurrenciesCache(currencies: CurrencyInfo[]): void {
    cachedCurrencies = currencies;
}

/**
 * Get the cached currencies
 */
export function getCurrenciesCache(): CurrencyInfo[] | null {
    return cachedCurrencies;
}

/**
 * Get the symbol for a currency code using browser Intl API.
 * Works without any server fetch.
 */
export function getCurrencySymbol(currencyCode: string): string {
    if (!currencyCode) return '';
    try {
        const parts = new Intl.NumberFormat('en', {
            style: 'currency',
            currency: currencyCode.toUpperCase(),
            currencyDisplay: 'narrowSymbol'
        }).formatToParts(0);
        const symbolPart = parts.find(p => p.type === 'currency');
        return symbolPart?.value || currencyCode.toUpperCase();
    } catch {
        return currencyCode.toUpperCase();
    }
}

/**
 * Get the name for a currency code using browser Intl API.
 */
export function getCurrencyName(currencyCode: string): string {
    if (!currencyCode) return '';
    try {
        const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
        return displayNames.of(currencyCode.toUpperCase()) || currencyCode.toUpperCase();
    } catch {
        return currencyCode.toUpperCase();
    }
}

export const SYMBOL_AFTER_CURRENCIES = ['sek', 'nok', 'dkk', 'pln', 'czk', 'huf', 'ron', 'bgn', 'hrk'];

export function isSymbolAfterCurrency(currency: string): boolean {
    return SYMBOL_AFTER_CURRENCIES.includes(currency.toLowerCase());
}
