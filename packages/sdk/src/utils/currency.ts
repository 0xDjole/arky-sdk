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
 * Formats a price with the appropriate currency symbol
 */
export function formatCurrencyAmount(amount: number, currency: string): string {
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = (amount / 100).toFixed(2);

    // For some currencies, symbol goes after the amount
    const symbolAfterCurrencies = ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK'];

    if (symbolAfterCurrencies.includes(currency.toUpperCase())) {
        return `${formattedAmount} ${symbol}`;
    }

    return `${symbol}${formattedAmount}`;
}