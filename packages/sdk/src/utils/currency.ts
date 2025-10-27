/**
 * Maps currency codes to their display symbols
 */
export function getCurrencySymbol(currency: string): string {
    const currencySymbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        CAD: 'C$',
        AUD: 'A$',
        JPY: '¥',
        CHF: 'CHF',
        SEK: 'kr',
        NOK: 'kr',
        DKK: 'kr',
        PLN: 'zł',
        CZK: 'Kč',
        HUF: 'Ft',
        RON: 'lei',
        BGN: 'лв',
        HRK: 'kn',
        RSD: 'дин',
        BAM: 'KM',
        MKD: 'ден',
        ALL: 'L',
        TRY: '₺',
        RUB: '₽',
        UAH: '₴',
        BYN: 'Br',
        CNY: '¥',
        INR: '₹',
        KRW: '₩',
        THB: '฿',
        VND: '₫',
        SGD: 'S$',
        MYR: 'RM',
        IDR: 'Rp',
        PHP: '₱',
        BRL: 'R$',
        ARS: '$',
        CLP: '$',
        COP: '$',
        PEN: 'S/',
        MXN: '$',
        ZAR: 'R',
        EGP: 'E£',
        NGN: '₦',
        KES: 'KSh',
        GHS: '₵',
        MAD: 'DH',
        TND: 'د.ت',
        DZD: 'د.ج',
        LYD: 'ل.د',
        AED: 'د.إ',
        SAR: 'ر.س',
        QAR: 'ر.ق',
        KWD: 'د.ك',
        BHD: 'ب.د',
        OMR: 'ر.ع',
        JOD: 'د.أ',
        LBP: 'ل.ل',
        SYP: 'ل.س',
        IQD: 'ع.د',
        IRR: '﷼',
        AFN: '؋',
        PKR: '₨',
        LKR: '₨',
        NPR: '₨',
        BDT: '৳',
        MMK: 'K',
        LAK: '₭',
        KHR: '៛',
        MNT: '₮',
        KZT: '₸',
        UZS: 'лв',
        KGS: 'лв',
        TJS: 'SM',
        TMT: 'T',
        AZN: '₼',
        GEL: '₾',
        AMD: '֏',
        BYR: 'p.',
        MDL: 'L'
    };

    return currencySymbols[currency.toUpperCase()] || currency;
}

/**
 * List of currencies where the symbol appears after the amount
 */
export const SYMBOL_AFTER_CURRENCIES = ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK'];

/**
 * Check if currency symbol should be placed after the amount
 */
export function isSymbolAfterCurrency(currency: string): boolean {
    return SYMBOL_AFTER_CURRENCIES.includes(currency.toUpperCase());
}