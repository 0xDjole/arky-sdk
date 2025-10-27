// E-shop store with TypeScript - Simplified with Business Store
import { atom, computed, deepMap } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import { BUSINESS_ID } from "../config";
import { eshopApi } from "../api/eshop";
import { createPaymentForCheckout, getPriceAmount, formatPayment, formatMinor } from "../utils/price";
import * as authService from "../services/auth";
import {
    selectedMarket,
    currency,
    getShippingMethodsForCountry,
    paymentMethods,
    paymentConfig,
    orderBlocks,
    businessActions
} from "./business";
import type { EshopCartItem, EshopStoreState, Block, Price, Payment, Quote } from "../types";
import { PaymentMethod } from "../types";
// Toast notifications should be handled by UI layer

// Frontend cart items
export const cartItems = persistentAtom<EshopCartItem[]>("eshopCart", [], {
    encode: JSON.stringify,
    decode: JSON.parse,
});

// Promo code state (not persisted - cleared on page reload)
export const promoCodeAtom = atom<string | null>(null);

// Quote atom (fetched from backend)
export const quoteAtom = atom<Quote | null>(null);

// Simplified store for cart-specific state only
export const store = deepMap({
    businessId: BUSINESS_ID,
    selectedShippingMethodId: null, // Selected shipping method ID
    shippingLocation: null, // Deprecated; kept for backward compat
    userToken: null,
    processingCheckout: false,
    loading: false,
    error: null,
    // Phone verification
    phoneNumber: "",
    phoneError: null,
    verificationCode: "",
    verifyError: null,
    // Quote fetching
    fetchingQuote: false,
    quoteError: null,
});

// Computed values using business store
export const cartTotal = computed([cartItems, selectedMarket, currency], (items, market, curr) => {
    // Return a Payment object with amounts in minor units
    const subtotalMinor = (items || []).reduce((sum, item) => {
        let amountMinor = 0;
        if ('amount' in item.price) {
            amountMinor = item.price.amount || 0;
        }
        return sum + (amountMinor * item.quantity);
    }, 0);

    const marketId = market?.id || 'us';
    const currencyCode = curr || 'USD';

    return createPaymentForCheckout(subtotalMinor, marketId, currencyCode, PaymentMethod.Cash);
});

export const cartItemCount = computed(cartItems, (items) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
});

// Re-export business store computed values for convenience
export {
    currency,
    paymentConfig,
    orderBlocks
};

// Create alias for backward compatibility
export const allowedPaymentMethods = paymentMethods;

// Actions
export const actions = {
    // Add item to cart
    addItem(product: any, variant: any, quantity: number = 1) {
        const items = cartItems.get();
        const market = selectedMarket.get();

        // Check if item already exists in cart
        const existingItemIndex = items.findIndex(
            (item) => item.productId === product.id && item.variantId === variant.id,
        );

        if (existingItemIndex !== -1) {
            // Update existing item quantity
            const updatedItems = [...items];
            updatedItems[existingItemIndex].quantity += quantity;
            cartItems.set(updatedItems);
        } else {
            // Add new item with market-based pricing
            let cartPrice: Price;

            if (variant.prices && Array.isArray(variant.prices)) {
                // Market-based pricing from backend (amounts are minor units)
                const marketCode = market?.id || 'us';
                const marketAmount = getPriceAmount(variant.prices, marketCode);
                cartPrice = {
                    amount: marketAmount ?? 0,
                    market: marketCode
                };
            } else {
                // Fallback
                cartPrice = { amount: 0, market: market?.id || 'us' } as Price;
            }

            const newItem: EshopCartItem = {
                id: crypto.randomUUID(),
                productId: product.id,
                variantId: variant.id,
                productName: product.name,
                productSlug: product.slug,
                variantAttributes: variant.attributes || {},
                price: cartPrice,
                quantity,
                addedAt: Date.now(),
            };

            cartItems.set([...items, newItem]);
        }

        // Toast notification should be handled by UI layer
        // showToast(`${product.name} added to cart!`, "success", 3000);
    },

    // Update item quantity
    updateQuantity(itemId: string, newQuantity: number) {
        const items = cartItems.get();
        const updatedItems = items.map((item) =>
            item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item,
        );
        cartItems.set(updatedItems);
    },

    // Remove item from cart
    removeItem(itemId: string) {
        const items = cartItems.get();
        const updatedItems = items.filter((item) => item.id !== itemId);
        cartItems.set(updatedItems);
        // Toast notification should be handled by UI layer
        // showToast("Item removed from cart!", "success", 2000);
    },

    // Clear entire cart
    clearCart() {
        cartItems.set([]);
    },


    // Get guest token
    async getGuestToken(): Promise<string> {
        const state = store.get();
        const token = await authService.getGuestToken(state.userToken);
        if (token !== state.userToken) {
            store.setKey("userToken", token);
        }
        return token;
    },

    // Prepare order items for checkout API
    prepareOrderItems() {
        const items = cartItems.get();
        return items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
        }));
    },

    // Get order info blocks (they already have values from DynamicForm)
    getOrderInfoBlocks(): Block[] {
        return orderBlocks.get() || [];
    },

    // Process checkout - Updated to use Payment structure
    async checkout(paymentMethod: PaymentMethod = PaymentMethod.Cash, orderInfoBlocks?: Block[], promoCode?: string | null) {
        const items = cartItems.get();
        if (!items.length) {
            return { success: false, error: "Cart is empty" };
        }

        try {
            store.setKey("processingCheckout", true);
            store.setKey("error", null);

            const token = await this.getGuestToken();
            const orderItems = this.prepareOrderItems();
            const blocks = orderInfoBlocks || this.getOrderInfoBlocks();
            const state = store.get();

            const market = selectedMarket.get();
            if (!market) {
                throw new Error("No market selected");
            }

            // Extract country code from location block
            const locationBlock = blocks.find(b => b.key === 'location' && b.type === 'GEO_LOCATION');
            const countryCode = locationBlock?.value?.[0]?.countryCode;

            if (!countryCode) {
                throw new Error("Country is required for checkout");
            }

            // Get available shipping methods for the country
            const availableShippingMethods = getShippingMethodsForCountry(countryCode) || [];

            if (!availableShippingMethods || availableShippingMethods.length === 0) {
                throw new Error(`No shipping methods available for country: ${countryCode}`);
            }

            // Get selected shipping method or first available
            const shippingMethodId = state.selectedShippingMethodId;
            const shippingMethod = availableShippingMethods.find(sm => sm.id === shippingMethodId) ||
                                 availableShippingMethods[0];

            if (!shippingMethod) {
                throw new Error("No shipping method available");
            }

            const promo = promoCode !== undefined ? promoCode : promoCodeAtom.get();
            const response = await eshopApi.checkout({
                token,
                businessId: BUSINESS_ID,
                items: orderItems,
                paymentMethod: paymentMethod,
                blocks,
                market: market.id,
                shippingMethodId: shippingMethod.id,
                promoCode: promo || undefined,
            });

            if (response.success) {
                return {
                    success: true,
                    data: {
                        orderId: response.data.orderId,
                        orderNumber: response.data.orderNumber,
                        clientSecret: response.data.clientSecret,
                    },
                };
            } else {
                throw new Error(response.error || "Failed to place order");
            }
        } catch (err: any) {
            const errorMessage = `Checkout failed: ${err.message}`;
            store.setKey("error", errorMessage);
            console.error("Checkout error:", err);
            return { success: false, error: errorMessage };
        } finally {
            store.setKey("processingCheckout", false);
        }
    },

    // Phone verification for eshop
    async updateProfilePhone(): Promise<boolean> {
        try {
            const token = await this.getGuestToken();
            const phoneNumber = store.get().phoneNumber;

            await authService.updateProfilePhone(token, phoneNumber);
            store.setKey("phoneError", null);
            return true;
        } catch (error: any) {
            console.error("Phone update error:", error);
            store.setKey("phoneError", error.message);
            return false;
        }
    },

    async verifyPhoneCode(): Promise<boolean> {
        try {
            const token = await this.getGuestToken();
            const phoneNumber = store.get().phoneNumber;
            const verificationCode = store.get().verificationCode;

            await authService.verifyPhoneCode(token, phoneNumber, verificationCode);
            store.setKey("verifyError", null);
            return true;
        } catch (error: any) {
            console.error("Phone verification error:", error);
            store.setKey("verifyError", error.message);
            return false;
        }
    },

    formatPrice(priceOrPayment: Price | Payment): string {
        const currencyCode = currency.get();

        if ('total' in (priceOrPayment as any)) {
            return formatPayment(priceOrPayment as Payment, { showSymbols: true, decimalPlaces: 2 });
        }
        return formatMinor((priceOrPayment as Price).amount || 0, currencyCode);
    },

    getCartPayment(): Payment {
        const items = cartItems.get();
        const market = selectedMarket.get();
        const currencyCode = currency.get();

        const marketId = market?.id || 'us';

        if (!items || items.length === 0) {
            return createPaymentForCheckout(0, marketId, currencyCode, PaymentMethod.Cash);
        }

        const subtotalMinor = items.reduce((sum, item) => {
            let amountMinor = 0;
            if ('amount' in item.price) {
                amountMinor = item.price.amount || 0;
            }
            return sum + (amountMinor * item.quantity);
        }, 0);

        return createPaymentForCheckout(subtotalMinor, marketId, currencyCode, PaymentMethod.Cash);
    },

    // Get available payment methods for selected market
    getAvailablePaymentMethods(): PaymentMethod[] {
        return paymentMethods.get() || [PaymentMethod.Cash];
    },

    // Get shipping methods for a country code
    getShippingMethodsForCountry(countryCode: string) {
        return getShippingMethodsForCountry(countryCode);
    },

    // Fetch quote from backend
    async fetchQuote(promoCode?: string | null): Promise<void> {
        const items = cartItems.get();
        const market = selectedMarket.get();
        const currencyCode = currency.get();
        const state = store.get();
        const promo = promoCode !== undefined ? promoCode : promoCodeAtom.get();

        if (!items || items.length === 0) {
            quoteAtom.set(null);
            return;
        }

        if (!market) {
            console.error('No market selected for quote');
            return;
        }

        try {
            store.setKey('fetchingQuote', true);
            store.setKey('quoteError', null);

            const token = await this.getGuestToken();
            const shippingMethodId = state.selectedShippingMethodId || undefined;

            const response = await eshopApi.getQuote({
                token,
                businessId: BUSINESS_ID,
                items: items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
                market: market.id,
                currency: currencyCode,
                userId: token,
                paymentMethod: PaymentMethod.Cash,
                shippingMethodId,
                promoCode: promo || undefined,
            });

            if (response.success && response.data) {
                quoteAtom.set(response.data);
            } else {
                const friendly = mapQuoteError(response.code, response.error);
                store.setKey('quoteError', friendly);
                quoteAtom.set(null);
            }
        } catch (error: any) {
            console.error('Quote fetch error:', error);
            store.setKey('quoteError', error.message);
            quoteAtom.set(null);
        } finally {
            store.setKey('fetchingQuote', false);
        }
    },

    // Apply promo code
    async applyPromoCode(code: string): Promise<void> {
        promoCodeAtom.set(code);
        await this.fetchQuote();
    },

    // Remove promo code
    async removePromoCode(): Promise<void> {
        promoCodeAtom.set(null);
        await this.fetchQuote();
    },
};

function mapQuoteError(code?: string, fallback?: string): string {
    switch (code) {
        case 'PROMO.MIN_ORDER':
            return fallback || 'Promo requires a higher minimum order.';
        case 'PROMO.NOT_ACTIVE':
            return 'Promo code is not active.';
        case 'PROMO.NOT_YET_VALID':
            return 'Promo code is not yet valid.';
        case 'PROMO.EXPIRED':
            return 'Promo code has expired.';
        case 'PROMO.MAX_USES':
            return 'Promo code usage limit exceeded.';
        case 'PROMO.MAX_USES_PER_USER':
            return 'You have already used this promo code.';
        case 'PROMO.NOT_FOUND':
            return 'Promo code not found.';
        default:
            return fallback || 'Failed to fetch quote.';
    }
}

// Initialize the store
export function initEshopStore() {
    // Initialize business data (if not already initialized)
    businessActions.init();

    // Note: Shipping method selection now happens after user enters shipping address
    // and we determine their country → zone → available shipping methods
}

export default {
    store,
    actions,
    cartItems,
    cartTotal,
    cartItemCount,
    currency,
    allowedPaymentMethods,
    initEshopStore
};
