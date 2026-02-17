import type { ApiConfig } from '../index';
import type {
    UploadBusinessMediaParams,
    DeleteBusinessMediaParams,
    GetBusinessMediaParams,
    GetMediaParams,
    UpdateMediaParams,
    RequestOptions
} from '../types/api';

export const createMediaApi = (apiConfig: ApiConfig) => {
    return {
        async getMedia(params: GetMediaParams, options?: RequestOptions) {
            const targetBusinessId = params.businessId || apiConfig.businessId;
            return apiConfig.httpClient.get(
                `/v1/businesses/${targetBusinessId}/media/${params.mediaId}`,
                options
            );
        },

        async uploadBusinessMedia(params: UploadBusinessMediaParams, options?: RequestOptions) {
            const _options = options;
            const { businessId, files = [], urls = [] } = params;
            const targetBusinessId = businessId || apiConfig.businessId;
            const url = `${apiConfig.baseUrl}/v1/businesses/${targetBusinessId}/media`;

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
            const { businessId, cursor, limit, ids, query, mimeType, sortField, sortDirection } = params;
            const targetBusinessId = businessId || apiConfig.businessId;
            const url = `${apiConfig.baseUrl}/v1/businesses/${targetBusinessId}/media`;

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
            const { mediaId, businessId, ...payload } = params;
            const targetBusinessId = businessId || apiConfig.businessId;

            return apiConfig.httpClient.put(
                `/v1/businesses/${targetBusinessId}/media/${mediaId}`,
                payload,
                options
            );
        }
    };
};
