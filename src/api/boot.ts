import type { ApiConfig } from '../index';
import type { RequestOptions } from '../types/api';

export const createBootApi = (apiConfig: ApiConfig) => {
    return {
        async boot(options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/boot`, options);
        }
    };
};
