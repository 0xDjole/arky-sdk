import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  EndSupportAccessParams,
  FindOwnSupportAccessesParams,
  FindSupportAccessesParams,
  GetSupportAccessParams,
  OpenSupportAccessParams,
  SupportAccess,
} from "../types/supportAccess";
import { requireId } from "../utils/ids";
import { segment, storePath } from "./paths";

export const createSupportAccessApi = (apiConfig: ApiConfig) => ({
  open(params: OpenSupportAccessParams, options?: RequestOptions): Promise<SupportAccess> {
    return apiConfig.httpClient.post<SupportAccess>(
      storePath(params.store_id, "support-accesses"),
      { id: requireId(params.id, "support access"), reason: params.reason, expires_at: params.expires_at },
      options,
    );
  },

  find(params: FindSupportAccessesParams, options?: RequestOptions): Promise<PaginatedResponse<SupportAccess>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<SupportAccess>>(storePath(store_id, "support-accesses"), {
      ...options,
      params: query,
    });
  },

  findOwn(
    params: FindOwnSupportAccessesParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<SupportAccess>> {
    return apiConfig.httpClient.get<PaginatedResponse<SupportAccess>>("/v1/accounts/me/support-accesses", {
      ...options,
      params,
    });
  },

  get(params: GetSupportAccessParams, options?: RequestOptions): Promise<SupportAccess> {
    return apiConfig.httpClient.get<SupportAccess>(
      storePath(params.store_id, `support-accesses/${segment(requireId(params.id, "support access"))}`),
      options,
    );
  },

  end(params: EndSupportAccessParams, options?: RequestOptions): Promise<SupportAccess> {
    return apiConfig.httpClient.post<SupportAccess>(
      storePath(params.store_id, `support-accesses/${segment(requireId(params.id, "support access"))}/end`),
      undefined,
      options,
    );
  },
});
