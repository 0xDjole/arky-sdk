import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { Currency, PostalAddress, Store } from "../types";
import type { SellerProfile, SellerTaxRegistration } from "../types/orderContract";
import type { TaxRegistration, TaxRegistrationStatus } from "../types/companyLocation";
import type { EpochMilliseconds } from "../types/time";
import type {
  AbortStoreCommerceInitializationParams,
  CommerceInitializationRequest,
  CommerceInitializationStatus,
  GetStoreCommerceInitializationParams,
  InitializeStoreCommerceParams,
  InspectStoreCommerceSetupParams,
  StoreCommerceInitialization,
  StoreCommerceSetupInspection,
  SubmitStoreCommerceSetupParams,
} from "../types/storeCommerce";
import {
  clearDurableRequest,
  durableRequestPayload,
  DurableRequestStorageError,
  getOrCreateDurableRequest,
  readDurableRequest,
  withDurableRequestLock,
} from "../utils/durableRequest";
import { getCurrencyMinorUnits } from "../utils/price";
import { requireStoreId } from "../utils/storeTarget";

const label = "commerce setup";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const addressFields = [
  "name", "company", "street1", "street2", "city", "state",
  "postal_code", "country", "phone", "email",
];

function invalid(message: string): DurableRequestStorageError {
  return new DurableRequestStorageError(message);
}

function storageKey(storeId: string): string {
  return `arky:commerce-initialization:v1:${storeId}`;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).sort().join(",") === [...keys].sort().join(",");
}

function nullableText(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function clock(value: unknown): value is EpochMilliseconds {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function currency(value: unknown): value is Currency {
  if (typeof value !== "string" || value !== value.trim() || value !== value.toLowerCase()) return false;
  try {
    getCurrencyMinorUnits(value);
    return true;
  } catch {
    return false;
  }
}

function address(value: unknown): value is PostalAddress {
  return record(value)
    && Object.keys(value).every((key) => addressFields.includes(key))
    && Object.values(value).every((entry) => entry === undefined || nullableText(entry));
}

function registrationStatus(value: unknown): value is TaxRegistrationStatus {
  if (!record(value)) return false;
  if (value.type === "unverified") return exactKeys(value, ["type"]);
  if (value.type === "verified") {
    return exactKeys(value, ["type", "verified_at"]) && clock(value.verified_at);
  }
  return value.type === "rejected"
    && exactKeys(value, ["type", "rejected_at", "reason"])
    && clock(value.rejected_at)
    && nullableText(value.reason);
}

function registration(value: unknown): value is TaxRegistration {
  return record(value)
    && exactKeys(value, ["country", "region", "identifier", "status"])
    && typeof value.country === "string"
    && nullableText(value.region)
    && typeof value.identifier === "string"
    && registrationStatus(value.status);
}

function sellerRegistration(value: unknown): value is SellerTaxRegistration {
  return record(value)
    && exactKeys(value, ["registration", "starts_at", "ends_at"])
    && registration(value.registration)
    && clock(value.starts_at)
    && (value.ends_at === null || clock(value.ends_at));
}

function seller(value: unknown): value is SellerProfile {
  return record(value)
    && exactKeys(value, ["legal_name", "address", "registration_number", "tax_registrations"])
    && typeof value.legal_name === "string"
    && address(value.address)
    && nullableText(value.registration_number)
    && Array.isArray(value.tax_registrations)
    && value.tax_registrations.every(sellerRegistration);
}

function initializationRequest(value: unknown): value is CommerceInitializationRequest {
  if (!record(value) || !exactKeys(value, ["market", "sales_channel", "seller", "tax"])) return false;
  const { market, sales_channel: channel, tax } = value;
  return record(market)
    && exactKeys(market, ["key", "currency", "tax_mode"])
    && typeof market.key === "string"
    && currency(market.currency)
    && (market.tax_mode === "inclusive" || market.tax_mode === "exclusive")
    && record(channel)
    && exactKeys(channel, ["key", "name"])
    && typeof channel.key === "string"
    && typeof channel.name === "string"
    && seller(value.seller)
    && record(tax)
    && exactKeys(tax, ["version", "noncommercial_subscription_grants"])
    && typeof tax.version === "string"
    && typeof tax.noncommercial_subscription_grants === "boolean";
}

function canonicalRequest(request: CommerceInitializationRequest): CommerceInitializationRequest {
  const value = request.seller.address;
  return {
    ...request,
    seller: {
      ...request.seller,
      address: {
        name: value.name ?? null,
        company: value.company ?? null,
        street1: value.street1 ?? null,
        street2: value.street2 ?? null,
        city: value.city ?? null,
        state: value.state ?? null,
        postal_code: value.postal_code ?? null,
        country: value.country ?? null,
        phone: value.phone ?? null,
        email: value.email ?? null,
      },
    },
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (record(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function operationStatus(value: unknown): value is CommerceInitializationStatus {
  if (!record(value)) return false;
  if (value.type === "pending") {
    return exactKeys(value, ["type", "last_error"])
      && (value.last_error === null || value.last_error === "configuration_conflict" || value.last_error === "storage_unavailable");
  }
  if (value.type === "completed") {
    return exactKeys(value, ["type", "completed_at"]) && clock(value.completed_at);
  }
  return value.type === "aborted"
    && exactKeys(value, ["type", "aborted_at", "account_id"])
    && clock(value.aborted_at)
    && typeof value.account_id === "string"
    && uuid.test(value.account_id);
}

function validateOperation(operation: StoreCommerceInitialization, request: InitializeStoreCommerceParams): void {
  if (!record(operation)
    || operation.id !== request.operation_id
    || operation.store_id !== request.store_id
    || !initializationRequest(operation.request)
    || stableJson(canonicalRequest(operation.request)) !== stableJson(canonicalRequest(request.request))
    || !operationStatus(operation.status)) {
    throw invalid("The commerce setup receipt does not match the exact saved request.");
  }
}

function retainedRequest(value: unknown, storeId: string): value is InitializeStoreCommerceParams {
  return record(value)
    && exactKeys(value, ["store_id", "operation_id", "request"])
    && value.store_id === storeId
    && typeof value.operation_id === "string"
    && uuid.test(value.operation_id)
    && initializationRequest(value.request);
}

function savedRequest(storeId: string) {
  const durable = readDurableRequest(storageKey(storeId), label);
  if (!durable) return null;
  const request = durableRequestPayload(durable);
  if (!retainedRequest(request, storeId)) {
    throw invalid("The saved commerce request is invalid. It was retained; no new setup was sent.");
  }
  return { durable, request };
}

export function createStoreCommerceApi(apiConfig: ApiConfig) {
  async function initializeCommerce(params: InitializeStoreCommerceParams, options?: RequestOptions): Promise<StoreCommerceInitialization> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.post<StoreCommerceInitialization>(
      `/v1/stores/${storeId}/commerce/initializations`,
      { operation_id: params.operation_id, request: params.request },
      options,
    );
  }

  async function getCommerceInitialization(params: GetStoreCommerceInitializationParams, options?: RequestOptions): Promise<StoreCommerceInitialization> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.get<StoreCommerceInitialization>(
      `/v1/stores/${storeId}/commerce/initializations/${encodeURIComponent(params.operation_id)}`,
      options,
    );
  }

  async function abortCommerceInitialization(params: AbortStoreCommerceInitializationParams, options?: RequestOptions): Promise<StoreCommerceInitialization> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.post<StoreCommerceInitialization>(
      `/v1/stores/${storeId}/commerce/initializations/${encodeURIComponent(params.operation_id)}/abort`,
      undefined,
      options,
    );
  }

  async function getStore(storeId: string, options?: RequestOptions): Promise<Store> {
    const store = await apiConfig.httpClient.get<Store>(`/v1/stores/${storeId}`, options);
    if (!record(store) || store.id !== storeId || !record(store.commerce)
      || !["uninitialized", "initializing", "ready"].includes(store.commerce.type)) {
      throw invalid("Store setup returned a different or invalid Store.");
    }
    if (store.commerce.type === "initializing" && !uuid.test(store.commerce.operation_id)) {
      throw invalid("Store setup returned an invalid operation identity.");
    }
    return store;
  }

  async function inspect(storeId: string, options?: RequestOptions): Promise<StoreCommerceSetupInspection> {
    const saved = savedRequest(storeId);
    const request = saved?.request ?? null;
    const store = await getStore(storeId, options);
    if (store.commerce.type === "initializing" && request && store.commerce.operation_id !== request.operation_id) {
      throw invalid("Another initialization owns this Store. The saved request was retained for review.");
    }
    const operationId = request?.operation_id ?? (store.commerce.type === "initializing" ? store.commerce.operation_id : null);
    if (!operationId) return { store, request: null, operation: null };
    let operation: StoreCommerceInitialization;
    try {
      operation = await getCommerceInitialization({ store_id: storeId, operation_id: operationId }, options);
    } catch (error) {
      if (store.commerce.type === "uninitialized" && record(error) && error.statusCode === 404) {
        return { store, request, operation: null };
      }
      throw error;
    }
    const exactRequest = request ?? { store_id: storeId, operation_id: operationId, request: operation.request };
    validateOperation(operation, exactRequest);
    if (operation.status.type === "completed" || operation.status.type === "aborted") {
      if (saved) clearDurableRequest(saved.durable, label);
      return { store: await getStore(storeId, options), request: null, operation };
    }
    return { store, request: exactRequest, operation };
  }

  return {
    initializeCommerce,
    getCommerceInitialization,
    abortCommerceInitialization,

    inspectCommerceSetup(params: InspectStoreCommerceSetupParams, options?: RequestOptions): Promise<StoreCommerceSetupInspection> {
      const storeId = requireStoreId(params.store_id);
      return withDurableRequestLock(storageKey(storeId), label, () => inspect(storeId, options));
    },

    submitCommerceSetup(params: SubmitStoreCommerceSetupParams, options?: RequestOptions): Promise<StoreCommerceSetupInspection> {
      const storeId = requireStoreId(params.store_id);
      return withDurableRequestLock(storageKey(storeId), label, async () => {
        const current = await inspect(storeId, options);
        if (current.store.commerce.type === "ready") return current;
        if (params.request && current.request) {
          throw invalid("An existing setup must be resolved before submitting a different request.");
        }
        if (params.request && !initializationRequest(params.request)) {
          throw invalid("The commerce setup request is invalid. No setup was sent.");
        }
        const request = current.request ?? (params.request ? {
          store_id: storeId,
          operation_id: globalThis.crypto.randomUUID(),
          request: canonicalRequest(params.request),
        } : null);
        if (!request) throw invalid("No pending commerce setup is available to retry.");
        getOrCreateDurableRequest(storageKey(storeId), request, label);
        const operation = await initializeCommerce(request, options);
        validateOperation(operation, request);
        return inspect(storeId, options);
      });
    },

    abortCommerceSetup(params: AbortStoreCommerceInitializationParams, options?: RequestOptions): Promise<StoreCommerceSetupInspection> {
      const storeId = requireStoreId(params.store_id);
      return withDurableRequestLock(storageKey(storeId), label, async () => {
        const current = await inspect(storeId, options);
        if (current.operation?.status.type !== "pending" || current.operation.id !== params.operation_id || !current.request) {
          throw invalid("Setup is no longer pending. Refresh its current state.");
        }
        getOrCreateDurableRequest(storageKey(storeId), current.request, label);
        const result = await abortCommerceInitialization(params, options);
        validateOperation(result, current.request);
        if (result.status.type !== "aborted") throw invalid("The Server did not confirm that setup was aborted.");
        return inspect(storeId, options);
      });
    },
  };
}
