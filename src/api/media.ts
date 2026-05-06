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
            const target_business_id = params.business_id || apiConfig.businessId;
            return apiConfig.httpClient.get(
                `/v1/businesses/${target_business_id}/media/${params.media_id}`,
                options
            );
        },

        async uploadBusinessMedia(params: UploadBusinessMediaParams, options?: RequestOptions) {
            const _options = options;
            const { business_id, files = [], urls = [] } = params;
            const target_business_id = business_id || apiConfig.businessId;
            const url = `${apiConfig.baseUrl}/v1/businesses/${target_business_id}/media`;

            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            urls.forEach((url) => formData.append('urls', url));

            const tokens = await apiConfig.getToken();
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Upload failed, server said no');
            }

            return await response.json();
        },

        async deleteBusinessMedia(params: DeleteBusinessMediaParams, options?: RequestOptions) {
            const { id, media_id } = params;

            return apiConfig.httpClient.delete(
                `/v1/businesses/${id}/media/${media_id}`,
                options
            );
        },

        async getBusinessMedia(params: GetBusinessMediaParams, options?: RequestOptions) {
            const { business_id, cursor, limit, ids, query, mime_type, sort_field, sort_direction } = params;
            const target_business_id = business_id || apiConfig.businessId;
            const url = `${apiConfig.baseUrl}/v1/businesses/${target_business_id}/media`;

            const queryParams: Record<string, string> = { limit: String(limit) };
            if (cursor) queryParams.cursor = cursor;
            if (ids && ids.length > 0) queryParams.ids = ids.join(',');
            if (query) queryParams.query = query;
            if (mime_type) queryParams.mime_type = mime_type;
            if (sort_field) queryParams.sort_field = sort_field;
            if (sort_direction) queryParams.sort_direction = sort_direction;

            const queryString = new URLSearchParams(queryParams).toString();

            const tokens = await apiConfig.getToken();
            const response = await fetch(`${url}?${queryString}`, {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to fetch media');
            }

            return await response.json();
        },

        async updateMedia(params: UpdateMediaParams, options?: RequestOptions) {
            const { media_id, business_id, ...payload } = params;
            const target_business_id = business_id || apiConfig.businessId;

            return apiConfig.httpClient.put(
                `/v1/businesses/${target_business_id}/media/${media_id}`,
                payload,
                options
            );
        }
    };
};
