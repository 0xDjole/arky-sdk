import type {
  CreateNewsletterParams,
  CreateNewsletterPostParams,
  DeleteNewsletterParams,
  DeleteNewsletterPostParams,
  GetNewsletterParams,
  GetNewsletterPostParams,
  GetNewsletterPostsParams,
  GetNewslettersParams,
  GetSubscribersParams,
  Newsletter,
  NewsletterPost,
  Paginated,
  RequestOptions,
  ScheduleSendParams,
  CancelSendParams,
  SubscriberInfo,
  UpdateNewsletterParams,
  UpdateNewsletterPostParams,
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

export const createNewsletterApi = (apiConfig: ApiConfig) => {
  return {
    // ===== NEWSLETTER CRUD =====

    /**
     * Create a new newsletter
     */
    async createNewsletter(
      params: CreateNewsletterParams,
      options?: RequestOptions<Newsletter>
    ): Promise<Newsletter> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/newsletters`,
        params,
        options
      );
    },

    /**
     * Get a newsletter by ID
     */
    async getNewsletter(
      params: GetNewsletterParams,
      options?: RequestOptions<Newsletter>
    ): Promise<Newsletter> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${params.id}`,
        options
      );
    },

    /**
     * List all newsletters for the business
     */
    async getNewsletters(
      params?: GetNewslettersParams,
      options?: RequestOptions<Paginated<Newsletter>>
    ): Promise<Paginated<Newsletter>> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/newsletters`,
        {
          ...options,
          params,
        }
      );
    },

    /**
     * Update a newsletter
     */
    async updateNewsletter(
      params: UpdateNewsletterParams,
      options?: RequestOptions<Newsletter>
    ): Promise<Newsletter> {
      const { id, ...body } = params;
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${id}`,
        body,
        options
      );
    },

    /**
     * Delete a newsletter
     */
    async deleteNewsletter(
      params: DeleteNewsletterParams,
      options?: RequestOptions<boolean>
    ): Promise<boolean> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${params.id}`,
        options
      );
    },

    /**
     * Get subscribers for a newsletter
     */
    async getSubscribers(
      params: GetSubscribersParams,
      options?: RequestOptions<SubscriberInfo[]>
    ): Promise<SubscriberInfo[]> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${params.id}/subscribers`,
        options
      );
    },

    // ===== POST CRUD =====

    /**
     * Create a new post for a newsletter
     */
    async createPost(
      params: CreateNewsletterPostParams,
      options?: RequestOptions<NewsletterPost>
    ): Promise<NewsletterPost> {
      const { newsletterId, ...body } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${newsletterId}/posts`,
        body,
        options
      );
    },

    /**
     * Get a post by ID
     */
    async getPost(
      params: GetNewsletterPostParams,
      options?: RequestOptions<NewsletterPost>
    ): Promise<NewsletterPost> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${params.newsletterId}/posts/${params.postId}`,
        options
      );
    },

    /**
     * List all posts for a newsletter
     */
    async getPosts(
      params: GetNewsletterPostsParams,
      options?: RequestOptions<Paginated<NewsletterPost>>
    ): Promise<Paginated<NewsletterPost>> {
      const { newsletterId, ...queryParams } = params;
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${newsletterId}/posts`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    /**
     * Update a post
     */
    async updatePost(
      params: UpdateNewsletterPostParams,
      options?: RequestOptions<NewsletterPost>
    ): Promise<NewsletterPost> {
      const { newsletterId, postId, ...body } = params;
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${newsletterId}/posts/${postId}`,
        body,
        options
      );
    },

    /**
     * Delete a post
     */
    async deletePost(
      params: DeleteNewsletterPostParams,
      options?: RequestOptions<boolean>
    ): Promise<boolean> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${params.newsletterId}/posts/${params.postId}`,
        options
      );
    },

    // ===== SEND OPERATIONS =====

    /**
     * Schedule a send for a post
     */
    async scheduleSend(
      params: ScheduleSendParams,
      options?: RequestOptions<NewsletterPost>
    ): Promise<NewsletterPost> {
      const { newsletterId, postId, ...body } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${newsletterId}/posts/${postId}/send`,
        body,
        options
      );
    },

    /**
     * Cancel a scheduled send
     */
    async cancelSend(
      params: CancelSendParams,
      options?: RequestOptions<NewsletterPost>
    ): Promise<NewsletterPost> {
      const { newsletterId, postId, sendId } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/newsletters/${newsletterId}/posts/${postId}/send/${sendId}/cancel`,
        {},
        options
      );
    },

    // ===== CONVENIENCE METHODS =====

    /**
     * Publish a post (set status to PUBLISHED)
     */
    async publishPost(
      newsletterId: string,
      postId: string
    ): Promise<NewsletterPost> {
      return this.updatePost({
        newsletterId,
        postId,
        status: "PUBLISHED",
      });
    },

    /**
     * Archive a post (set status to ARCHIVED)
     */
    async archivePost(
      newsletterId: string,
      postId: string
    ): Promise<NewsletterPost> {
      return this.updatePost({
        newsletterId,
        postId,
        status: "ARCHIVED",
      });
    },

    /**
     * Send a post immediately
     */
    async sendNow(
      newsletterId: string,
      postId: string
    ): Promise<NewsletterPost> {
      return this.scheduleSend({
        newsletterId,
        postId,
      });
    },
  };
};
