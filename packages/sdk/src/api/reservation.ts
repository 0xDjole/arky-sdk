import { getGlobalConfig } from '../config';
import type { ApiResponse, Payment, Quote } from '../types';
import httpClient from '../services/http';

export const reservationApi = {
    // Get quote for reservation parts
    async getQuote({
        token,
        businessId,
        market,
        currency,
        userId,
        parts,
        paymentMethod = 'CASH',
        promoCode,
    }: {
        token: string;
        businessId: string;
        market: string;
        currency: string;
        userId: string;
        parts: any[];
        paymentMethod?: string;
        promoCode?: string;
    }): Promise<ApiResponse<Quote>> {
        try {
            const config = getGlobalConfig();
            const lines = parts.map(part => ({
                type: 'SERVICE',
                serviceId: part.serviceId,
                quantity: 1,
            }));

            const payload = {
                businessId,
                market,
                currency,
                userId,
                paymentMethod,
                lines,
                promoCode: promoCode || undefined,
                shippingMethodId: null,
            };

            const res = await fetch(`${config.apiUrl}/v1/payments/quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const text = await res.text();
            if (!res.ok) {
                try {
                    const json = JSON.parse(text);
                    return { success: false, error: json.message || json.error || 'Failed to fetch quote' };
                } catch {
                    return { success: false, error: text || 'Failed to fetch quote' };
                }
            }

            const quote = text ? JSON.parse(text) : null;
            return { success: true, data: quote };
        } catch (e: any) {
            return {
                success: false,
                error: e.message || 'Failed to fetch quote',
            };
        }
    },

    // Get available slots for a service
    async getAvailableSlots({
        businessId,
        serviceId,
        from,
        to,
        limit = 1000,
        providerId = null,
    }: {
        businessId: string;
        serviceId: string;
        from: number;
        to: number;
        limit?: number;
        providerId?: string | null;
    }) {
        const config = getGlobalConfig();
        const url = `${config.apiUrl}/v1/businesses/${businessId}/services/${serviceId}/available-slots`;

        const response = await httpClient.get(url, {
            params: {
                from,
                to,
                limit,
                providerId
            }
        });

        if (response.success) {
            const json = response.value;
            return {
                success: true,
                data: json.data?.items || json.items || [],
            };
        } else {
            console.error("Error fetching available slots:", response.error);
            return {
                success: false,
                error: response.error,
                data: [],
            };
        }
    },

    // Get all providers for a service
    async getProviders({ businessId, serviceId, limit = 50 }: { businessId: string; serviceId: string; limit?: number }) {
        const config = getGlobalConfig();
        const url = `${config.apiUrl}/v1/businesses/${businessId}/providers`;

        const response = await httpClient.get(url, {
            params: {
                serviceId,
                limit
            }
        });

        if (response.success) {
            const json = response.value;
            return {
                success: true,
                data: json.items || [],
            };
        } else {
            console.error("Error loading providers:", response.error);
            return {
                success: false,
                error: response.error,
                data: [],
            };
        }
    },

    // Get guest token or create a new one
    async getGuestToken(): Promise<ApiResponse<{ token: string }>> {
        try {
            const config = getGlobalConfig();
            const res = await fetch(`${config.apiUrl}/v1/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: "GUEST" }),
            });

            if (!res.ok) throw new Error("Guest login failed");

            const json = await res.json();

            return {
                success: true,
                data: { token: json.accessToken },
            };
        } catch (e: any) {
            return {
                success: false,
                error: e.message,
            };
        }
    },

    // Update user's phone number
    async updateProfilePhone({ token, phoneNumber }: { token: string; phoneNumber: string }) {
        try {
            const config = getGlobalConfig();
            const res = await fetch(`${config.apiUrl}/v1/users/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    phoneNumber,
                    phoneNumbers: [],
                    addresses: [],
                }),
            });

            if (!res.ok) {
                const error = (await res.text()) || res.statusText;
                return {
                    success: false,
                    error,
                };
            }

            return {
                success: true,
            };
        } catch (e: any) {
            return {
                success: false,
                error: e.message,
            };
        }
    },

    // Verify phone number with code
    async verifyPhoneCode({ token, phoneNumber, code }: { token: string; phoneNumber: string; code: string }) {
        try {
            const config = getGlobalConfig();
            const res = await fetch(`${config.apiUrl}/v1/users/confirm/phone-number`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    phoneNumber,
                    code,
                }),
            });

            if (!res.ok) {
                const error = (await res.text()) || res.statusText;
                return {
                    success: false,
                    error,
                };
            }

            return {
                success: true,
            };
        } catch (e: any) {
            return {
                success: false,
                error: e.message,
            };
        }
    },

    // Complete reservation checkout - Backend calculates currency from market
    async checkout({
        token,
        businessId,
        parts,
        paymentMethod = "CASH",
        blocks = [],
        market = "US",
        promoCode
    }: {
        token: string;
        businessId: string;
        parts: any[];
        paymentMethod?: string;
        blocks?: any[];
        market?: string;
        promoCode?: string;
    }) {
        try {
            const config = getGlobalConfig();
            const payload: any = {
                businessId,
                blocks: blocks,
                market,
                parts: parts.map((p) => ({
                    serviceId: p.serviceId,
                    from: p.from,
                    to: p.to,
                    blocks: p.blocks,
                    reservationMethod: p.reservationMethod,
                    providerId: p.providerId,
                })),
            };

            // Only add payment method if it's defined (not for inquiry-only reservations)
            if (paymentMethod !== undefined) {
                payload.paymentMethod = paymentMethod;
            }

            // Add promo code if provided
            if (promoCode) {
                payload.promoCode = promoCode;
            }

            const res = await fetch(`${config.apiUrl}/v1/reservations/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = (await res.text()) || res.statusText;
                throw new Error(error);
            }

            const json = await res.json();
            return {
                success: true,
                data: json, // Should include reservationId and clientSecret for payments
            };
        } catch (e: any) {
            return {
                success: false,
                error: e.message,
            };
        }
    },
};
