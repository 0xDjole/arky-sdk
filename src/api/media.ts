import type { ApiConfig } from '../index';
import type {
    UploadStoreMediaParams,
    DeleteStoreMediaParams,
    GetStoreMediaParams,
    GetMediaParams,
    UpdateMediaParams,
    RequestOptions
} from '../types/api';
import type { Media, PaginatedResponse } from '../types';

export const createMediaApi = (apiConfig: ApiConfig) => {
    return {
        async getMedia(params: GetMediaParams, options?: RequestOptions): Promise<Media> {
            const target_store_id = params.store_id || apiConfig.storeId;
            return apiConfig.httpClient.get<Media>(
                `/v1/stores/${target_store_id}/media/${params.media_id}`,
                options
            );
        },

        async uploadStoreMedia(params: UploadStoreMediaParams, _options?: RequestOptions): Promise<Media[]> {
            const { store_id, files = [], urls = [] } = params;
            const target_store_id = store_id || apiConfig.storeId;
            const url = `${apiConfig.baseUrl}/v1/stores/${target_store_id}/media`;

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

        async deleteStoreMedia(params: DeleteStoreMediaParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
            const { id, media_id } = params;

            return apiConfig.httpClient.delete<{ deleted: boolean }>(
                `/v1/stores/${id}/media/${media_id}`,
                options
            );
        },

        async getStoreMedia(params: GetStoreMediaParams, _options?: RequestOptions): Promise<PaginatedResponse<Media>> {
            const { store_id, cursor, limit, ids, query, mime_type, sort_field, sort_direction } = params;
            const target_store_id = store_id || apiConfig.storeId;
            const url = `${apiConfig.baseUrl}/v1/stores/${target_store_id}/media`;

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

        async updateMedia(params: UpdateMediaParams, options?: RequestOptions): Promise<Media> {
            const { media_id, store_id, ...payload } = params;
            const target_store_id = store_id || apiConfig.storeId;

            return apiConfig.httpClient.put<Media>(
                `/v1/stores/${target_store_id}/media/${media_id}`,
                payload,
                options
            );
        }
    };
};
