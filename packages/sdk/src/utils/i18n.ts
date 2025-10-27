// Simple i18n utilities for SDK
// Can be enhanced or replaced by user's i18n library

let defaultLocale = 'en';

export function setDefaultLocale(locale: string): void {
    defaultLocale = locale;
}

export function getLocale(): string {
    // Try to get from browser if available
    if (typeof window !== 'undefined' && window.navigator) {
        return window.navigator.language.split('-')[0] || defaultLocale;
    }
    return defaultLocale;
}

export function getLocaleFromUrl(url: URL): string {
    // Simple implementation - can be enhanced
    const pathParts = url.pathname.split('/').filter(Boolean);
    const potentialLocale = pathParts[0];

    // Common locale codes
    const validLocales = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ru'];

    if (potentialLocale && validLocales.includes(potentialLocale)) {
        return potentialLocale;
    }

    return getLocale();
}

export function getLocalizedString(value: any, locale?: string): string {
    if (!value) return '';

    // If it's already a string, return it
    if (typeof value === 'string') return value;

    // If it's an object with locale keys
    if (typeof value === 'object') {
        const targetLocale = locale || getLocale();
        return value[targetLocale] || value['en'] || value[Object.keys(value)[0]] || '';
    }

    return String(value);
}
