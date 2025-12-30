import type {
  EmailTemplate,
  EmailTemplateListItem,
  EmailType,
  GetEmailTemplatesParams,
  GetEmailTemplateParams,
  UpsertEmailTemplateParams,
  RequestOptions,
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
     * Returns all email types with their configuration status
     */
    async getTemplates(
      params?: GetEmailTemplatesParams,
      options?: RequestOptions<EmailTemplateListItem[]>
    ): Promise<EmailTemplateListItem[]> {
      const businessId = params?.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/email-templates`,
        options
      );
    },

    /**
     * Get a specific email template by type
     */
    async getTemplate(
      params: GetEmailTemplateParams,
      options?: RequestOptions<EmailTemplate>
    ): Promise<EmailTemplate> {
      const businessId = params.businessId || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${businessId}/email-templates/${params.emailType}`,
        options
      );
    },

    /**
     * Create or update an email template
     */
    async upsertTemplate(
      params: UpsertEmailTemplateParams,
      options?: RequestOptions<EmailTemplate>
    ): Promise<EmailTemplate> {
      const { emailType, businessId: paramBusinessId, ...body } = params;
      const businessId = paramBusinessId || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${businessId}/email-templates/${emailType}`,
        body,
        options
      );
    },

    /**
     * Reset a template to default (delete custom template)
     * After reset, the system will fall back to the default template
     */
    async resetTemplate(
      emailType: EmailType,
      businessId?: string
    ): Promise<EmailTemplate> {
      const bId = businessId || apiConfig.businessId;
      // Get the default template (empty MJML triggers fallback)
      return this.getTemplate({ emailType, businessId: bId });
    },
  };
};
