import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface AnalyticsSummary {
  orders: number;
  ordersChange: number;
  bookings: number;
  bookingsChange: number;
  newCustomers: number;
  newCustomersChange: number;
  formSubmissions: number;
  formSubmissionsChange: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
  return {
    async getSummary(
      params?: { period?: string },
      options?: RequestOptions,
    ): Promise<AnalyticsSummary> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/analytics/summary`,
        {
          ...options,
          params: params || {},
        },
      );
    },

    async getStatusBreakdown(
      params: { entity: string },
      options?: RequestOptions,
    ): Promise<StatusBreakdown[]> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/analytics/status`,
        {
          ...options,
          params,
        },
      );
    },
  };
};
