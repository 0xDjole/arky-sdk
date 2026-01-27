export interface CurrencyInfo {
    code: string;
    symbol: string;
    name: string;
}

let cachedCurrencies: CurrencyInfo[] | null = null;

export function setCurrenciesCache(currencies: CurrencyInfo[]): void {
    cachedCurrencies = currencies;
}

export function getCurrenciesCache(): CurrencyInfo[] | null {
    return cachedCurrencies;
}

export function formatCurrency(amount: number, currencyCode: string, locale: string = 'en'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
    }).format(amount);
}

export function getCurrencySymbol(currencyCode: string): string {
    const cached = cachedCurrencies?.find(c => c.code === currencyCode.toLowerCase());
    if (cached) return cached.symbol;

    const parts = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        currencyDisplay: 'narrowSymbol'
    }).formatToParts(0);
    return parts.find(p => p.type === 'currency')?.value || '';
}

export function getCurrencyName(currencyCode: string): string {
    const cached = cachedCurrencies?.find(c => c.code === currencyCode.toLowerCase());
    if (cached) return cached.name;

    const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
    return displayNames.of(currencyCode.toUpperCase()) || '';
}
