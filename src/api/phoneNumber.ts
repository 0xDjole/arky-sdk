import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreatePhoneNumberParams,
  DeletePhoneNumberParams,
  FindPhoneNumbersParams,
  GetPhoneNumberParams,
  PhoneNumber,
  SetUpPhoneNumberParams,
} from "../types/phoneNumber";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

const collection = "phone-numbers";

export const createPhoneNumberApi = (apiConfig: ApiConfig) => ({
  find(params: FindPhoneNumbersParams, options?: RequestOptions): Promise<PaginatedResponse<PhoneNumber>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PhoneNumber>>(tenantPath(tenant_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: GetPhoneNumberParams, options?: RequestOptions): Promise<PhoneNumber> {
    return apiConfig.httpClient.get<PhoneNumber>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  create(params: CreatePhoneNumberParams, options?: RequestOptions): Promise<PhoneNumber> {
    requireId(params.id, "phone line");
    return apiConfig.httpClient.post<PhoneNumber>(
      tenantPath(params.tenant_id, collection),
      { id: params.id, login: params.login, number: params.number },
      options,
    );
  },

  setUpAgain(params: SetUpPhoneNumberParams, options?: RequestOptions): Promise<PhoneNumber> {
    return apiConfig.httpClient.post<PhoneNumber>(
      `${tenantRecordPath(params.tenant_id, collection, params.id)}/setup`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  delete(params: DeletePhoneNumberParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
