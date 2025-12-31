import type {
  EmailTemplate,
  GetEmailTemplatesParams,
  GetEmailTemplateParams,
  GetEmailTemplateByKeyParams,
  CreateEmailTemplateParams,
  UpdateEmailTemplateParams,
  DeleteEmailTemplateParams,
  RequestOptions,
  PaginatedResponse,
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

export const createEmailTemplateApi = (apiConfig: ApiConfig) => {
  return {
    /**
     * List all email templates for the business
     * Returns paginated list of email templates
     */
    async getTemplates(
      params?: GetEmailTemplatesParams,
      options?: RequestOptions<PaginatedResponse<EmailTemplate>>
    ): Promise<PaginatedResponse<EmailTemplate>> {
      const businessId = params?.businessId || apiConfig.businessId;
      const queryParams: Record<string, any> = {};

      if (params?.key) queryParams.key = params.key;
      if (params?.keys) queryParams.keys = params.keys;
      if (params?.query) queryParams.query = params.query;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;

      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/email-templates`,
        { ...options, params: queryParams }
      );
    },

    /**
     * Get a specific email template by ID
     */
    async getTemplate(
      params: GetEmailTemplateParams,
      options?: RequestOptions<EmailTemplate>
    ): Promise<EmailTemplate> {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/email-templates/${params.id}`,
        options
      );
    },

    /**
     * Get a specific email template by key
     */
    async getTemplateByKey(
      params: GetEmailTemplateByKeyParams,
      options?: RequestOptions<EmailTemplate>
    ): Promise<EmailTemplate> {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/email-templates/by-key/${params.key}`,
        options
      );
    },

    /**
     * Create a new email template
     */
    async createTemplate(
      params: CreateEmailTemplateParams,
      options?: RequestOptions<EmailTemplate>
    ): Promise<EmailTemplate> {
      const { businessId: paramBusinessId, ...body } = params;
      const businessId = paramBusinessId || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${businessId}/email-templates`,
        body,
        options
      );
    },

    /**
     * Update an existing email template
     */
    async updateTemplate(
      params: UpdateEmailTemplateParams,
      options?: RequestOptions<EmailTemplate>
    ): Promise<EmailTemplate> {
      const { id, businessId: paramBusinessId, ...body } = params;
      const businessId = paramBusinessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${businessId}/email-templates/${id}`,
        body,
        options
      );
    },

    /**
     * Delete an email template
     */
    async deleteTemplate(
      params: DeleteEmailTemplateParams,
      options?: RequestOptions<{ deleted: boolean }>
    ): Promise<{ deleted: boolean }> {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${businessId}/email-templates/${params.id}`,
        options
      );
    },
  };
};
