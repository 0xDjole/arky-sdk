import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface AnalyticsSummary {
  currency: string;
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  bookings: number;
  bookingsChange: number;
  newCustomers: number;
  newCustomersChange: number;
  formSubmissions: number;
  formSubmissionsChange: number;
  reactions: number;
  reactionsChange: number;
  activeProducts: number;
  activeServices: number;
  activeProviders: number;
  activeNodes: number;
  activeForms: number;
  activeTaxonomies: number;
  activeEmailTemplates: number;
  totalCustomers: number;
  totalMedia: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TimeSeriesResponse {
  period: { start: string; end: string };
  interval: string;
  series: Record<string, TimeSeriesPoint[]>;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export const createAnalyticsApi = (apiConfig: ApiConfig) => {
  return {
    async getSummary(params?: { market?: string; period?: string }, options?: RequestOptions): Promise<AnalyticsSummary> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/analytics/summary`,
        {
          ...options,
          params: params || {},
        },
      );
    },

    async getSeries(
      params: { metrics: string[]; market?: string; period?: string; interval?: string },
      options?: RequestOptions,
    ): Promise<TimeSeriesResponse> {
      const { metrics, ...rest } = params;
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/analytics/series`,
        {
          ...options,
          params: { ...rest, metrics: metrics.join(",") },
        },
      );
    },

    async getStatusBreakdown(
      params: { entity: string; market?: string; period?: string },
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
