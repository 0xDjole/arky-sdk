// Stores entry point (@arky/sdk/stores)
import { setGlobalConfig, type ArkyConfig } from '../config';

// Re-export specific named exports (avoid conflicts)
export { businessStore, businessActions, selectedMarket, currency, currencySymbol, markets, zones, getZoneByCountry, getShippingMethodsForCountry, paymentMethods, paymentConfig, orderBlocks, reservationBlocks } from './business';
export { cartItems, cartTotal, cartItemCount, promoCodeAtom, quoteAtom, store as eshopStore, actions as eshopActions, initEshopStore, allowedPaymentMethods } from './eshop';
export { cartParts, store as reservationStore, actions as reservationActions, initReservationStore, canProceed, currentStepName } from './reservation';

// Cart store (if it exists as separate file)
export * from './cart';

// Initialize stores with config
export function initArky(config: ArkyConfig): ArkyConfig {
    if (!config.apiUrl) {
        throw new Error('apiUrl is required');
    }
    if (!config.businessId) {
        throw new Error('businessId is required');
    }

    setGlobalConfig(config);
    return config;
}
