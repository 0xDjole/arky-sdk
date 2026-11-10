import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Network, NetworkPlan, FindNetworksParams, GetNetworkParams, CreateNetworkParams,
  UpdateNetworkParams, DeleteNetworkParams, SetNetworkStripeParams, ReplaceNetworkResendKeyParams,
  FindNetworkPlansParams, CreateNetworkPlanParams, UpdateNetworkPlanParams, DeleteNetworkPlanParams,
} from "../types/network";
import { requireId } from "../utils/ids";
import { segment } from "./paths";

function networkPath(id: string): string { return `/v1/networks/${segment(requireId(id, "network"))}`; }

export const createNetworkApi = (apiConfig: ApiConfig) => ({
  find(params: FindNetworksParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Network>> {
    return apiConfig.httpClient.get<PaginatedResponse<Network>>("/v1/networks", { ...options, params });
  },
  get(params: GetNetworkParams, options?: RequestOptions): Promise<Network> {
    return apiConfig.httpClient.get<Network>(networkPath(params.id), options);
  },
  create(params: CreateNetworkParams, options?: RequestOptions): Promise<Network> {
    requireId(params.id, "network");
    return apiConfig.httpClient.post<Network>("/v1/networks", params, options);
  },
  update(params: UpdateNetworkParams, options?: RequestOptions): Promise<Network> {
    const { id, ...body } = params;
    return apiConfig.httpClient.patch<Network>(networkPath(id), body, options);
  },
  delete(params: DeleteNetworkParams, options?: RequestOptions): Promise<Network> {
    return apiConfig.httpClient.delete<Network>(networkPath(params.id), {
      ...options, params: { expected_updated_at: params.expected_updated_at },
    });
  },
  stripe: {
    set(params: SetNetworkStripeParams, options?: RequestOptions): Promise<Network> {
      const { id, ...body } = params;
      return apiConfig.httpClient.put<Network>(`${networkPath(id)}/stripe`, body, options);
    },
    remove(params: DeleteNetworkParams, options?: RequestOptions): Promise<Network> {
      return apiConfig.httpClient.delete<Network>(`${networkPath(params.id)}/stripe`, {
        ...options, params: { expected_updated_at: params.expected_updated_at },
      });
    },
  },
  email: {
    replaceResendKey(params: ReplaceNetworkResendKeyParams, options?: RequestOptions): Promise<Network> {
      const { id, ...body } = params;
      return apiConfig.httpClient.put<Network>(`${networkPath(id)}/email/resend`, body, options);
    },
  },
  plan: {
    find(params: FindNetworkPlansParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkPlan>> {
      const { network_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<NetworkPlan>>(`${networkPath(network_id)}/plans`, { ...options, params: query });
    },
    create(params: CreateNetworkPlanParams, options?: RequestOptions): Promise<NetworkPlan> {
      const { network_id, ...body } = params;
      requireId(params.id, "network plan");
      return apiConfig.httpClient.post<NetworkPlan>(`${networkPath(network_id)}/plans`, body, options);
    },
    update(params: UpdateNetworkPlanParams, options?: RequestOptions): Promise<NetworkPlan> {
      const { network_id, id, ...body } = params;
      return apiConfig.httpClient.patch<NetworkPlan>(`${networkPath(network_id)}/plans/${segment(requireId(id, "network plan"))}`, body, options);
    },
    delete(params: DeleteNetworkPlanParams, options?: RequestOptions): Promise<NetworkPlan> {
      return apiConfig.httpClient.delete<NetworkPlan>(`${networkPath(params.network_id)}/plans/${segment(requireId(params.id, "network plan"))}`, {
        ...options, params: { expected_updated_at: params.expected_updated_at },
      });
    },
  },
});
