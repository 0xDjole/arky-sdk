import { getGlobalConfig } from "../config";
import type { ApiResponse, Payment, Quote } from "../types";
import { reservationApi } from "./reservation";
import httpClient from "../services/http";

export const eshopApi = {
  // Get products
  async getProducts({
    businessId,
    categoryIds = null,
    status = "ACTIVE",
    limit = 20,
    cursor = null,
  }: {
    businessId: string;
    categoryIds?: string[] | null;
    status?: string;
    limit?: number;
    cursor?: string | null;
  }) {
    const config = getGlobalConfig();
    const url = `${config.apiUrl}/v1/businesses/${encodeURIComponent(
      businessId
    )}/products`;

    const response = await httpClient.get(url, {
      params: {
        categoryIds:
          categoryIds && categoryIds.length > 0 ? categoryIds : undefined,
        status,
        limit,
        cursor,
      },
    });

    if (response.success) {
      const json = response.value;
      return {
        success: true,
        data: json.items || [],
        cursor: json.cursor,
        total: json.total || 0,
      };
    } else {
      console.error("Error fetching products:", response.error);
      return {
        success: false,
        error: response.error,
        data: [],
      };
    }
  },

  // Get product by slug
  async getProductBySlug({
    businessId,
    slug,
  }: {
    businessId: string;
    slug: string;
  }) {
    try {
      const config = getGlobalConfig();
      const url = `${config.apiUrl}/v1/businesses/${encodeURIComponent(
        businessId
      )}/products/slug/${encodeURIComponent(businessId)}/${encodeURIComponent(
        slug
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Product not found");
      const json = await res.json();
      return {
        success: true,
        data: json,
      };
    } catch (e: any) {
      console.error("Error fetching product:", e);
      return {
        success: false,
        error: e.message,
        data: null,
      };
    }
  },

  // Get quote for cart (pricing with promo codes, shipping, taxes)
  async getQuote({
    token,
    businessId,
    items,
    market,
    currency,
    userId,
    paymentMethod,
    shippingMethodId,
    promoCode,
  }: {
    token: string;
    businessId: string;
    items: { productId: string; variantId: string; quantity: number }[];
    market: string;
    currency: string;
    userId: string;
    paymentMethod: string;
    shippingMethodId?: string;
    // location is provided via order blocks, not as a top-level param
    promoCode?: string;
  }): Promise<ApiResponse<Quote>> {
    try {
      const config = getGlobalConfig();
      const lines = items.map((item) => ({
        type: "PRODUCT_VARIANT",
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const payload: any = {
        businessId,
        market,
        currency,
        userId,
        paymentMethod,
        lines,
        ...(shippingMethodId && { shippingMethodId }),
        ...(promoCode && { promoCode }),
      };

      const res = await fetch(`${config.apiUrl}/v1/payments/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        try {
          const json = JSON.parse(text);
          return {
            success: false,
            error: json.message || json.error || res.statusText,
          };
        } catch {
          return { success: false, error: text || res.statusText };
        }
      }

      const quote = text ? JSON.parse(text) : null;
      return { success: true, data: quote };
    } catch (e: any) {
      console.error("Quote fetch failed:", e);
      return {
        success: false,
        error: e.message,
      };
    }
  },

  // Checkout - Backend calculates currency from market
  async checkout({
    token,
    businessId,
    items,
    paymentMethod,
    blocks,
    market = "US",
    shippingMethodId,
    promoCode,
    paymentIntentId = null,
  }: {
    token: string;
    businessId: string;
    items: any[];
    paymentMethod: string;
    blocks: any[];
    market?: string;
    shippingMethodId?: string;
    promoCode?: string;
    paymentIntentId?: string | null;
  }) {
    try {
      const config = getGlobalConfig();
      const payload: any = {
        businessId,
        items,
        paymentMethod,
        blocks,
        market,
        ...(shippingMethodId && { shippingMethodId }),
        ...(promoCode && { promoCode }),
        ...(paymentIntentId && { paymentIntentId }),
      };

      const res = await fetch(
        `${config.apiUrl}/v1/businesses/${encodeURIComponent(
          businessId
        )}/orders/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await res.text();
      if (!res.ok) {
        try {
          const json = JSON.parse(text);
          return {
            success: false,
            error: json.message || json.error || res.statusText,
          };
        } catch {
          return { success: false, error: text || res.statusText };
        }
      }

      const json = text ? JSON.parse(text) : null;
      return { success: true, data: json };
    } catch (e: any) {
      return {
        success: false,
        error: e.message,
      };
    }
  },

  // Create payment intent for Stripe
  async createPaymentIntent({
    amount,
    currency,
    businessId,
  }: {
    amount: number;
    currency: string;
    businessId: string;
  }) {
    try {
      const config = getGlobalConfig();
      const tokenResponse = await reservationApi.getGuestToken();
      if (!tokenResponse.success || !tokenResponse.data) {
        throw new Error("Failed to get guest token");
      }
      const token = tokenResponse.data.token;

      const res = await fetch(
        `${config.apiUrl}/v1/businesses/${encodeURIComponent(
          businessId
        )}/payment/create-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            currency,
            businessId,
          }),
        }
      );

      if (!res.ok) {
        const error = (await res.text()) || res.statusText;
        throw new Error(error);
      }

      const json = await res.json();
      return {
        success: true,
        data: json,
      };
    } catch (e: any) {
      console.error("Payment intent creation failed:", e);
      return {
        success: false,
        error: e.message,
      };
    }
  },
};
