
let defaultLocale = 'en';

export function setDefaultLocale(locale: string): void {
    defaultLocale = locale;
}

export function getLocale(): string {
    
    if (typeof window !== 'undefined' && window.navigator) {
        return window.navigator.language.split('-')[0] || defaultLocale;
    }
    return defaultLocale;
}

export function getLocaleFromUrl(url: URL): string {
    
    const pathParts = url.pathname.split('/').filter(Boolean);
    const potentialLocale = pathParts[0];

    const validLocales = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ru'];

    if (potentialLocale && validLocales.includes(potentialLocale)) {
        return potentialLocale;
    }

    return getLocale();
}

export function getLocalizedString(value: any, locale?: string): string {
    if (!value) return '';

    if (typeof value === 'string') return value;

    if (typeof value === 'object') {
        const targetLocale = locale || getLocale();
        return value[targetLocale] || value['en'] || value[Object.keys(value)[0]] || '';
    }

    return String(value);
}
