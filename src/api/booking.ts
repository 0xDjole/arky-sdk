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
  FindAllBookingOfferingsParams,
  FindAllBookingResourcesParams,
  FindAllBookingServicesParams,
  FindBlockTargetBookingServicesParams,
  FindBookingOfferingsParams,
  FindBookingResourcesParams,
  FindBookingServicesParams,
  FindCategoryBookingResourcesParams,
  FindResourceBookingOfferingsParams,
  FindServiceBookingOfferingsParams,
  GetAvailabilityParams,
  GetBookingOfferingParams,
  GetBookingResourceByKeyParams,
  GetBookingResourceParams,
  GetBookingServiceByKeyParams,
  GetBookingServiceParams,
  UpdateBookingOfferingParams,
  UpdateBookingResourceParams,
  UpdateBookingServiceParams,
} from "../types/product";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createBookingServiceApi = (apiConfig: ApiConfig) => ({
  find(params: FindBookingServicesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingService>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<BookingService>>(tenantPath(tenant_id, "booking-services"), {
      ...options,
      params: query,
    });
  },

  findAll(params: FindAllBookingServicesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingService>> {
    return apiConfig.httpClient.get<PaginatedResponse<BookingService>>(tenantPath(params.tenant_id, "booking-services/all"), {
      ...options,
      params: { limit: params.limit, cursor: params.cursor },
    });
  },

  findByBlockTarget(params: FindBlockTargetBookingServicesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingService>> {
    return apiConfig.httpClient.get<PaginatedResponse<BookingService>>(
      tenantPath(params.tenant_id, `booking-services/by-block-target/${segment(requireId(params.block_target_id, "block target"))}`),
      { ...options, params: { limit: params.limit, cursor: params.cursor } },
    );
  },

  get(params: GetBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    return apiConfig.httpClient.get<BookingService>(
      tenantRecordPath(params.tenant_id, "booking-services", params.id),
      options,
    );
  },

  getByKey(params: GetBookingServiceByKeyParams, options?: RequestOptions): Promise<BookingService> {
    return apiConfig.httpClient.get<BookingService>(
      tenantPath(params.tenant_id, `booking-services/by-key/${segment(params.key)}`),
      options,
    );
  },

  getAvailability(params: GetAvailabilityParams, options?: RequestOptions): Promise<AvailabilityResponse> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<AvailabilityResponse>(tenantPath(tenant_id, "booking-services/availability"), {
      ...options,
      params: query,
    });
  },

  create(params: CreateBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    requireId(params.id, "booking service");
    const { tenant_id } = params;
    const body = { id: params.id, key: params.key, slugs: params.slugs, blocks: params.blocks, categories: params.categories, status: params.status, length: params.length, slot_interval: params.slot_interval, booking_window: params.booking_window, user_changes: params.user_changes, tax_category_id: params.tax_category_id, document_item: params.document_item };
    return apiConfig.httpClient.post<BookingService>(tenantPath(tenant_id, "booking-services"), body, options);
  },

  update(params: UpdateBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    const { tenant_id, id } = params;
    const body = { key: params.key, slugs: params.slugs, blocks: params.blocks, categories: params.categories, status: params.status, length: params.length, slot_interval: params.slot_interval, booking_window: params.booking_window, user_changes: params.user_changes, tax_category_id: params.tax_category_id, document_item: params.document_item, expected_updated_at: params.expected_updated_at };
    return apiConfig.httpClient.put<BookingService>(tenantRecordPath(tenant_id, "booking-services", id), body, options);
  },

  delete(params: DeleteBookingServiceParams, options?: RequestOptions): Promise<BookingService> {
    return apiConfig.httpClient.delete<BookingService>(
      tenantRecordPath(params.tenant_id, "booking-services", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createBookingResourceApi = (apiConfig: ApiConfig) => ({
  find(params: FindBookingResourcesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingResource>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<BookingResource>>(tenantPath(tenant_id, "booking-resources"), {
      ...options,
      params: query,
    });
  },

  findAll(params: FindAllBookingResourcesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingResource>> {
    return apiConfig.httpClient.get<PaginatedResponse<BookingResource>>(tenantPath(params.tenant_id, "booking-resources/all"), {
      ...options,
      params: { limit: params.limit, cursor: params.cursor },
    });
  },

  findByCategory(params: FindCategoryBookingResourcesParams, options?: RequestOptions): Promise<PaginatedResponse<BookingResource>> {
    return apiConfig.httpClient.get<PaginatedResponse<BookingResource>>(
      tenantPath(params.tenant_id, `booking-resources/by-category/${segment(requireId(params.category_id, "category"))}`),
      { ...options, params: { limit: params.limit, cursor: params.cursor } },
    );
  },

  get(params: GetBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    return apiConfig.httpClient.get<BookingResource>(
      tenantRecordPath(params.tenant_id, "booking-resources", params.id),
      options,
    );
  },

  getByKey(params: GetBookingResourceByKeyParams, options?: RequestOptions): Promise<BookingResource> {
    return apiConfig.httpClient.get<BookingResource>(
      tenantPath(params.tenant_id, `booking-resources/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    requireId(params.id, "booking resource");
    const { tenant_id } = params;
    const body = { id: params.id, key: params.key, slugs: params.slugs, status: params.status, blocks: params.blocks, categories: params.categories, timezone: params.timezone, capacity: params.capacity, hours: params.hours, daily_limits: params.daily_limits };
    return apiConfig.httpClient.post<BookingResource>(tenantPath(tenant_id, "booking-resources"), body, options);
  },

  update(params: UpdateBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    const { tenant_id, id } = params;
    const body = { key: params.key, slugs: params.slugs, status: params.status, blocks: params.blocks, categories: params.categories, timezone: params.timezone, capacity: params.capacity, hours: params.hours, daily_limits: params.daily_limits, expected_updated_at: params.expected_updated_at };
    return apiConfig.httpClient.put<BookingResource>(tenantRecordPath(tenant_id, "booking-resources", id), body, options);
  },

  delete(params: DeleteBookingResourceParams, options?: RequestOptions): Promise<BookingResource> {
    return apiConfig.httpClient.delete<BookingResource>(
      tenantRecordPath(params.tenant_id, "booking-resources", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createBookingOfferingApi = (apiConfig: ApiConfig) => ({
  find(params: FindBookingOfferingsParams, options?: RequestOptions): Promise<PaginatedResponse<BookingOffering>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<BookingOffering>>(tenantPath(tenant_id, "booking-offerings"), {
      ...options,
      params: query,
    });
  },

  findAll(params: FindAllBookingOfferingsParams, options?: RequestOptions): Promise<PaginatedResponse<BookingOffering>> {
    return apiConfig.httpClient.get<PaginatedResponse<BookingOffering>>(tenantPath(params.tenant_id, "booking-offerings/all"), {
      ...options,
      params: { limit: params.limit, cursor: params.cursor },
    });
  },

  findByService(params: FindServiceBookingOfferingsParams, options?: RequestOptions): Promise<PaginatedResponse<BookingOffering>> {
    return apiConfig.httpClient.get<PaginatedResponse<BookingOffering>>(
      tenantPath(params.tenant_id, `booking-offerings/by-service/${segment(requireId(params.booking_service_id, "booking service"))}`),
      { ...options, params: { limit: params.limit, cursor: params.cursor } },
    );
  },

  findByResource(params: FindResourceBookingOfferingsParams, options?: RequestOptions): Promise<PaginatedResponse<BookingOffering>> {
    return apiConfig.httpClient.get<PaginatedResponse<BookingOffering>>(
      tenantPath(params.tenant_id, `booking-offerings/by-resource/${segment(requireId(params.booking_resource_id, "booking resource"))}`),
      { ...options, params: { limit: params.limit, cursor: params.cursor } },
    );
  },

  get(params: GetBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    return apiConfig.httpClient.get<BookingOffering>(
      tenantRecordPath(params.tenant_id, "booking-offerings", params.id),
      options,
    );
  },

  create(params: CreateBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    requireId(params.id, "booking offering");
    const { tenant_id } = params;
    const body = {
      id: params.id,
      booking_service_id: params.booking_service_id,
      resources: params.resources,
      times: params.times,
      locations: params.locations,
      hours: params.hours,
      add_ons: params.add_ons ?? [],
      status: params.status,
    };
    return apiConfig.httpClient.post<BookingOffering>(tenantPath(tenant_id, "booking-offerings"), body, options);
  },

  update(params: UpdateBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    const { tenant_id, id } = params;
    const body = {
      resources: params.resources,
      times: params.times,
      locations: params.locations,
      hours: params.hours,
      add_ons: params.add_ons,
      status: params.status,
      expected_updated_at: params.expected_updated_at,
    };
    return apiConfig.httpClient.put<BookingOffering>(tenantRecordPath(tenant_id, "booking-offerings", id), body, options);
  },

  delete(params: DeleteBookingOfferingParams, options?: RequestOptions): Promise<BookingOffering> {
    return apiConfig.httpClient.delete<BookingOffering>(
      tenantRecordPath(params.tenant_id, "booking-offerings", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
