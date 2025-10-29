import type { ApiConfig } from '../index';
import type {
    UploadBusinessMediaParams,
    DeleteBusinessMediaParams,
    GetBusinessMediaParams,
    RequestOptions
} from '../types/api';

export const createMediaApi = (apiConfig: ApiConfig) => {
    return {
        async uploadBusinessMedia(params: UploadBusinessMediaParams) {
            const { files = [], urls = [] } = params;
            const url = `${apiConfig.baseUrl}/v1/businesses/${apiConfig.businessId}/upload`;

            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            urls.forEach((url) => formData.append('files', url));

            const tokens = await apiConfig.getTokens();
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Upload failed, server said no');
            }

            return await response.json();
        },

        async deleteBusinessMedia(params: DeleteBusinessMediaParams, options?: RequestOptions) {
            const { id, mediaId } = params;

            return apiConfig.httpClient.delete(
                `/v1/businesses/${id}/upload`,
                {
                    ...options,
                    params: { mediaId }
                }
            );
        },

        async getBusinessMedia(params: GetBusinessMediaParams) {
            const { cursor = null, limit = 20 } = params;
            const url = `${apiConfig.baseUrl}/v1/businesses/${apiConfig.businessId}/media`;

            const queryParams: any = { limit };
            if (cursor) queryParams.cursor = cursor;

            const queryString = new URLSearchParams(queryParams).toString();
            const response = await fetch(`${url}?${queryString}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to fetch media');
            }

            return await response.json();
        }
    };
};
