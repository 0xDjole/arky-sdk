import type { ApiConfig } from "../index";
import type { RequestOptions } from "../types/api";

export interface ScanDataParams {
  key: string;
  limit?: number;
}

export interface PutDataParams {
  key: string;
  value: any;
  oldKey?: string;
}

export interface DeleteDataParams {
  key: string;
}

export interface RunScriptParams {
  name: string;
  value?: string;
  username?: string;
  password?: string;
}

export interface RunScriptResponse {
  success: boolean;
  message: string;
}

export const createDatabaseApi = (apiConfig: ApiConfig) => {
  return {
    async scanData(
      params: ScanDataParams,
      options?: RequestOptions
    ): Promise<any[]> {
      const response = await apiConfig.httpClient.get(
        `/v1/operations/data`,
        {
          ...options,
          params: {
            key: params.key,
            limit: params.limit || 200,
          },
        }
      );
      return response.value || [];
    },

    async putData(
      params: PutDataParams,
      options?: RequestOptions
    ): Promise<void> {
      return apiConfig.httpClient.post(
        `/v1/operations/data`,
        params,
        options
      );
    },

    async deleteData(
      params: DeleteDataParams,
      options?: RequestOptions
    ): Promise<void> {
      return apiConfig.httpClient.delete(
        `/v1/operations/data`,
        {
          ...options,
          params: {
            key: params.key,
          },
        }
      );
    },

    async runScript(
      params: RunScriptParams,
      options?: RequestOptions
    ): Promise<RunScriptResponse> {
      return apiConfig.httpClient.post(`/v1/operations/scripts`, params, options);
    },
  };
};
