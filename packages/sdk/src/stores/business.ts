// Unified Business Store - Single Source of Truth
import { computed, deepMap } from "nanostores";
import { BUSINESS_ID } from "../config";
import * as authService from "../services/auth";
import type { Business, Market, Zone, ShippingMethod, BusinessPaymentMethod, PaymentProviderConfig } from "../types";
import { PaymentMethod } from "../types";
import { getCurrencySymbol } from "../utils/currency";

// Core business state
export const businessStore = deepMap({
    data: null as Business | null,
    loading: false,
    error: null as string | null,
    initialized: false,
});

// Computed values derived from business data
export const selectedMarket = computed(businessStore, (state) => {
    if (!state.data?.configs?.markets) return null;

    const markets = state.data.configs.markets;
    // For arky website, always use 'us' market (hardcoded for headless)
    return markets.find(m => m.id === 'us') ||
           markets[0] ||
           null;
});

export const currency = computed(selectedMarket, (market) => {
    return market?.currency || 'USD';
});

export const currencySymbol = computed(selectedMarket, (market) => {
    return getCurrencySymbol(market?.currency || 'USD');
});

export const markets = computed(businessStore, (state) => {
    if (!state.data?.configs?.markets) return [];
    return state.data.configs.markets;
});

export const zones = computed(businessStore, (state) => {
    if (!state.data?.configs?.zones) return [];
    return state.data.configs.zones;
});

// Get zone by country code
export const getZoneByCountry = (countryCode: string): Zone | null => {
    const allZones = zones.get();
    return allZones.find(zone =>
        zone.countries.length === 0 || // Empty = all countries
        zone.countries.includes(countryCode.toUpperCase())
    ) || null;
};

// Get shipping methods for a specific country
export const getShippingMethodsForCountry = (countryCode: string): ShippingMethod[] => {
    const zone = getZoneByCountry(countryCode);
    return zone?.shippingMethods || [];
};

export const paymentMethods = computed(selectedMarket, (market) => {
    if (!market) return ['CASH'];
    const methods = market.paymentMethods || [];
    return methods.map((pm: any) => pm.method || pm);
});

export const paymentConfig = computed(businessStore, (state) => {
    if (!state.data?.configs) return { provider: null, enabled: false };

    const provider = state.data.configs.paymentProvider || null;
    const hasCreditCard = paymentMethods.get().includes('CREDIT_CARD');

    return {
        provider,
        enabled: hasCreditCard && !!provider
    };
});

export const orderBlocks = computed(businessStore, (state) => {
    return state.data?.configs?.orderBlocks || [];
});

export const reservationBlocks = computed(businessStore, (state) => {
    return state.data?.configs?.reservationBlocks || [];
});

// Actions
export const businessActions = {
    // Initialize business data - SINGLE API CALL for entire app
    async init(): Promise<void> {
        const state = businessStore.get();
        if (state.initialized && state.data) {
            // Already loaded, skip
            return;
        }

        try {
            businessStore.setKey('loading', true);
            businessStore.setKey('error', null);

            const result = await authService.getBusinessConfig(BUSINESS_ID);

            if (result.success) {
                businessStore.setKey('data', result.data);
                businessStore.setKey('initialized', true);
            } else {
                throw new Error(result.error || 'Failed to load business configuration');
            }
        } catch (error: any) {
            businessStore.setKey('error', error.message);
            console.error('Business store initialization failed:', error);
        } finally {
            businessStore.setKey('loading', false);
        }
    },

    // Reset store (useful for testing)
    reset(): void {
        businessStore.setKey('data', null);
        businessStore.setKey('loading', false);
        businessStore.setKey('error', null);
        businessStore.setKey('initialized', false);
    },

    // Get business data (with auto-init)
    async getBusiness(): Promise<Business | null> {
        const state = businessStore.get();
        if (!state.initialized || !state.data) {
            await this.init();
        }
        return businessStore.get().data;
    }
};

// Export everything for easy access
export {
    businessStore as store,
    businessActions as actions
};

// Auto-initialize on first import ONLY if config is already set
if (typeof window !== 'undefined' && BUSINESS_ID) {
    businessActions.init().catch(console.error);
}