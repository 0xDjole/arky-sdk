import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateLayoutParams,
  DeleteLayoutParams,
  FindLayoutElementsParams,
  FindLayoutsParams,
  GetLayoutByKeyParams,
  GetLayoutParams,
  Layout,
  LayoutElement,
  SaveLayoutElementsParams,
  SaveLayoutElementsResponse,
  UpdateLayoutParams,
} from "../types/layout";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createLayoutApi = (apiConfig: ApiConfig) => ({
  find(params: FindLayoutsParams, options?: RequestOptions): Promise<PaginatedResponse<Layout>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Layout>>(tenantPath(tenant_id, "layouts"), {
      ...options,
      params: query,
    });
  },

  get(params: GetLayoutParams, options?: RequestOptions): Promise<Layout> {
    return apiConfig.httpClient.get<Layout>(tenantRecordPath(params.tenant_id, "layouts", params.id), options);
  },

  getByKey(params: GetLayoutByKeyParams, options?: RequestOptions): Promise<Layout> {
    return apiConfig.httpClient.get<Layout>(tenantPath(params.tenant_id, `layouts/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateLayoutParams, options?: RequestOptions): Promise<Layout> {
    requireId(params.id, "layout");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Layout>(tenantPath(tenant_id, "layouts"), body, options);
  },

  update(params: UpdateLayoutParams, options?: RequestOptions): Promise<Layout> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Layout>(tenantRecordPath(tenant_id, "layouts", id), body, options);
  },

  delete(params: DeleteLayoutParams, options?: RequestOptions): Promise<Layout> {
    return apiConfig.httpClient.delete<Layout>(tenantRecordPath(params.tenant_id, "layouts", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  element: {
    find(params: FindLayoutElementsParams, options?: RequestOptions): Promise<PaginatedResponse<LayoutElement>> {
      const { tenant_id, layout_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<LayoutElement>>(
        tenantPath(tenant_id, `layouts/${segment(layout_id)}/elements`),
        { ...options, params: query },
      );
    },

    save(params: SaveLayoutElementsParams, options?: RequestOptions): Promise<SaveLayoutElementsResponse> {
      for (const change of params.changes) {
        if (change.action === "create") requireId(change.id, "layout element");
      }
      return apiConfig.httpClient.post<SaveLayoutElementsResponse>(
        tenantPath(params.tenant_id, `layouts/${segment(params.layout_id)}/elements/save`),
        { changes: params.changes },
        options,
      );
    },
  },
});
