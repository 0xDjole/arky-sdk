import type {
  CreateFeatureFlagParams,
  DeleteFeatureFlagParams,
  FeatureFlag,
  FlagResults,
  GetFeatureFlagParams,
  GetFeatureFlagResultsParams,
  GetFeatureFlagsParams,
  GetVariantParams,
  GetVariantResponse,
  RequestOptions,
  TrackEventParams,
  TrackEventResponse,
  UpdateFeatureFlagParams,
} from "../types/api";

interface ApiConfig {
  httpClient: any;
  businessId: string;
  baseUrl: string;
  market: string;
  locale: string;
  setToken: (tokens: any) => void;
  getToken: () => Promise<any> | any;
}

export const createFeatureFlagsApi = (apiConfig: ApiConfig) => {
  return {
    /**
     * Create a new feature flag
     */
    async createFlag(
      params: CreateFeatureFlagParams,
      options?: RequestOptions<FeatureFlag>
    ): Promise<FeatureFlag> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/feature-flags`,
        params,
        options
      );
    },

    /**
     * Get a feature flag by ID
     */
    async getFlag(
      params: GetFeatureFlagParams,
      options?: RequestOptions<FeatureFlag>
    ): Promise<FeatureFlag> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/feature-flags/${params.id}`,
        options
      );
    },

    /**
     * List all feature flags for the business
     */
    async getFlags(
      params?: GetFeatureFlagsParams,
      options?: RequestOptions<FeatureFlag[]>
    ): Promise<FeatureFlag[]> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/feature-flags`,
        {
          ...options,
          params: params,
        }
      );
    },

    /**
     * Update a feature flag
     */
    async updateFlag(
      params: UpdateFeatureFlagParams,
      options?: RequestOptions<FeatureFlag>
    ): Promise<FeatureFlag> {
      const { id, ...body } = params;
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/feature-flags/${id}`,
        body,
        options
      );
    },

    /**
     * Delete a feature flag
     */
    async deleteFlag(
      params: DeleteFeatureFlagParams,
      options?: RequestOptions<{ deleted: boolean }>
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/feature-flags/${params.id}`,
        options
      );
    },

    /**
     * Get experiment results for a feature flag
     */
    async getResults(
      params: GetFeatureFlagResultsParams,
      options?: RequestOptions<FlagResults>
    ): Promise<FlagResults> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/feature-flags/${params.id}/results`,
        options
      );
    },

    /**
     * Get the variant assignment for the current user
     * This is the main method for feature flag evaluation
     */
    async getVariant(
      params: GetVariantParams,
      options?: RequestOptions<GetVariantResponse>
    ): Promise<GetVariantResponse> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/feature-flags/key/${params.flagKey}/variant`,
        options
      );
    },

    /**
     * Track a conversion event for A/B testing
     */
    async trackEvent(
      params: TrackEventParams,
      options?: RequestOptions<TrackEventResponse>
    ): Promise<TrackEventResponse> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/feature-flags/track`,
        params,
        options
      );
    },

    // ===== CONVENIENCE METHODS =====

    /**
     * Check if a feature is enabled (returns true if variant is not 'control')
     * Convenience method for simple on/off flags
     */
    async isEnabled(flagKey: string): Promise<boolean> {
      try {
        const response = await this.getVariant({ flagKey });
        return response.variantKey !== "control";
      } catch {
        return false;
      }
    },

    /**
     * Get variant with payload, returning a default if flag not found
     * Useful for getting configuration values from variants
     */
    async getVariantWithDefault<T = any>(
      flagKey: string,
      defaultValue: T
    ): Promise<{ variantKey: string; payload: T }> {
      try {
        const response = await this.getVariant({ flagKey });
        return {
          variantKey: response.variantKey,
          payload: response.payload ?? defaultValue,
        };
      } catch {
        return {
          variantKey: "control",
          payload: defaultValue,
        };
      }
    },

    /**
     * Activate a draft flag
     */
    async activateFlag(id: string): Promise<FeatureFlag> {
      return this.updateFlag({ id, status: "ACTIVE" });
    },

    /**
     * Archive an active flag
     */
    async archiveFlag(id: string): Promise<FeatureFlag> {
      return this.updateFlag({ id, status: "ARCHIVED" });
    },
  };
};
