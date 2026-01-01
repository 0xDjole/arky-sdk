import type { ApiConfig } from '../index';
import type {
    UploadBusinessMediaParams,
    DeleteBusinessMediaParams,
    GetBusinessMediaParams,
    UpdateMediaParams,
    RequestOptions
} from '../types/api';

export const createMediaApi = (apiConfig: ApiConfig) => {
    return {
        async uploadBusinessMedia(params: UploadBusinessMediaParams, options?: RequestOptions) {
            const _options = options;
            const { files = [], urls = [] } = params;
            const url = `${apiConfig.baseUrl}/v1/businesses/${apiConfig.businessId}/media`;

            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            urls.forEach((url) => formData.append('urls', url));

            const tokens = await apiConfig.getToken();
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
                `/v1/businesses/${id}/media/${mediaId}`,
                options
            );
        },

        async getBusinessMedia(params: GetBusinessMediaParams, options?: RequestOptions) {
            const { cursor, limit, ids, query, mimeType, sortField, sortDirection } = params;
            const url = `${apiConfig.baseUrl}/v1/businesses/${apiConfig.businessId}/media`;

            const queryParams: Record<string, string> = { limit: String(limit) };
            if (cursor) queryParams.cursor = cursor;
            if (ids && ids.length > 0) queryParams.ids = ids.join(',');
            if (query) queryParams.query = query;
            if (mimeType) queryParams.mimeType = mimeType;
            if (sortField) queryParams.sortField = sortField;
            if (sortDirection) queryParams.sortDirection = sortDirection;

            const queryString = new URLSearchParams(queryParams).toString();

            const tokens = await apiConfig.getToken();
            const response = await fetch(`${url}?${queryString}`, {
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to fetch media');
            }

            return await response.json();
        },

        async updateMedia(params: UpdateMediaParams, options?: RequestOptions) {
            const { mediaId, ...updateData } = params;
            
            return apiConfig.httpClient.put(
                `/v1/businesses/${apiConfig.businessId}/media/${mediaId}`,
                updateData,
                options
            );
        }
    };
};
