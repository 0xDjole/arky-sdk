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
import { storePath, storeRecordPath } from "./paths";

const collection = "phone-numbers";

export const createPhoneNumberApi = (apiConfig: ApiConfig) => ({
  find(params: FindPhoneNumbersParams, options?: RequestOptions): Promise<PaginatedResponse<PhoneNumber>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PhoneNumber>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: GetPhoneNumberParams, options?: RequestOptions): Promise<PhoneNumber> {
    return apiConfig.httpClient.get<PhoneNumber>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  create(params: CreatePhoneNumberParams, options?: RequestOptions): Promise<PhoneNumber> {
    requireId(params.id, "phone line");
    return apiConfig.httpClient.post<PhoneNumber>(
      storePath(params.store_id, collection),
      { id: params.id, login: params.login, number: params.number },
      options,
    );
  },

  setUpAgain(params: SetUpPhoneNumberParams, options?: RequestOptions): Promise<PhoneNumber> {
    return apiConfig.httpClient.post<PhoneNumber>(
      `${storeRecordPath(params.store_id, collection, params.id)}/setup`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  delete(params: DeletePhoneNumberParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
