import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AvailabilityResponse,
  BookingOffering,
  BookingResource,
  BookingService,
  CreateBookingOfferingParams,
  CreateBookingResourceParams,
  CreateBookingServiceParams,
  DeleteBookingOfferingParams,
  DeleteBookingResourceParams,
  DeleteBookingServiceParams,
  FindBookingOfferingsParams,
  FindBookingResourcesParams,
  FindBookingServicesParams,
  GetAvailabilityParams,
  GetBookingOfferingParams,
  GetBookingResourceByKeyParams,
  GetBookingResourceParams,
  GetBookingServiceByKeyParams,
  GetBookingServiceParams,
  LookupBookingOfferingParams,
  UpdateBookingOfferingParams,
  UpdateBookingResourceParams,
  UpdateBookingServiceParams,
} from "../types/product";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createBookingServiceApi = (apiConfig: ApiConfig) => ({
  find(params: FindBookingServicesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingService>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<BookingService>>(storePath(store_id, "booking-services"), {
      ...options,
      params: query,
    });
  },

  get(params: GetBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    return apiConfig.httpClient.get<BookingService>(
      storeRecordPath(params.store_id, "booking-services", params.id),
      options,
    );
  },

  getByKey(params: GetBookingServiceByKeyParams, options?: RequestOptions): Promise<BookingService> {
    return apiConfig.httpClient.get<BookingService>(
      storePath(params.store_id, `booking-services/by-key/${segment(params.key)}`),
      options,
    );
  },

  getAvailability(params: GetAvailabilityParams, options?: RequestOptions): Promise<AvailabilityResponse> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<AvailabilityResponse>(storePath(store_id, "booking-services/availability"), {
      ...options,
      params: query,
    });
  },

  create(params: CreateBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    requireId(params.id, "booking service");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<BookingService>(storePath(store_id, "booking-services"), body, options);
  },

  update(params: UpdateBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<BookingService>(storeRecordPath(store_id, "booking-services", id), body, options);
  },

  delete(params: DeleteBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    return apiConfig.httpClient.delete<BookingService>(
      storeRecordPath(params.store_id, "booking-services", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createBookingResourceApi = (apiConfig: ApiConfig) => ({
  find(params: FindBookingResourcesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingResource>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<BookingResource>>(storePath(store_id, "booking-resources"), {
      ...options,
      params: query,
    });
  },

  get(params: GetBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    return apiConfig.httpClient.get<BookingResource>(
      storeRecordPath(params.store_id, "booking-resources", params.id),
      options,
    );
  },

  getByKey(params: GetBookingResourceByKeyParams, options?: RequestOptions): Promise<BookingResource> {
    return apiConfig.httpClient.get<BookingResource>(
      storePath(params.store_id, `booking-resources/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    requireId(params.id, "booking resource");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<BookingResource>(storePath(store_id, "booking-resources"), body, options);
  },

  update(params: UpdateBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<BookingResource>(storeRecordPath(store_id, "booking-resources", id), body, options);
  },

  delete(params: DeleteBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    return apiConfig.httpClient.delete<BookingResource>(
      storeRecordPath(params.store_id, "booking-resources", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createBookingOfferingApi = (apiConfig: ApiConfig) => ({
  find(params: FindBookingOfferingsParams, options?: RequestOptions): Promise<PaginatedResponse<BookingOffering>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<BookingOffering>>(storePath(store_id, "booking-offerings"), {
      ...options,
      params: query,
    });
  },

  get(params: GetBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    return apiConfig.httpClient.get<BookingOffering>(
      storeRecordPath(params.store_id, "booking-offerings", params.id),
      options,
    );
  },

  lookup(params: LookupBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<BookingOffering>(storePath(store_id, "booking-offerings/lookup"), {
      ...options,
      params: query,
    });
  },

  create(params: CreateBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    requireId(params.id, "booking offering");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<BookingOffering>(storePath(store_id, "booking-offerings"), body, options);
  },

  update(params: UpdateBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<BookingOffering>(storeRecordPath(store_id, "booking-offerings", id), body, options);
  },

  delete(params: DeleteBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    return apiConfig.httpClient.delete<BookingOffering>(
      storeRecordPath(params.store_id, "booking-offerings", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
