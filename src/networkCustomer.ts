import { ArkyApiError, ArkyError } from "./types/apiError";
import type { RequestOptions } from "./types/api";
import type { LoginCodeSent } from "./types/account";
import type { PaginatedResponse } from "./types/common";
import type { AuthStorage, TokenSet } from "./types/httpClient";
import type {
  AcceptNetworkCustomerInviteParams,
  FindLinkedStoresParams,
  LinkedStore,
  NetworkCustomerAccountDeleted,
  NetworkCustomerAuthToken,
  NetworkCustomerConfig,
  NetworkCustomerLinkRemoved,
  NetworkCustomerLogoutResult,
  NetworkCustomerMe,
  NetworkCustomerSignedIn,
  NetworkCustomerStorage,
  NetworkCustomerStoreKey,
  NetworkSignInReach,
  OpenNetworkCustomerStoreKeyParams,
  PendingNetworkCustomerSignIn,
  RemoveNetworkCustomerLoginParams,
  RemoveNetworkCustomerStoreLinkParams,
  RequestNetworkCustomerCodeParams,
  RequestNetworkCustomerLoginCodeParams,
  VerifyNetworkCustomerCodeParams,
  VerifyNetworkCustomerLoginParams,
} from "./types/networkCustomer";
import { createHttpClient, refusedByArky } from "./services/createHttpClient";
import { exclusive } from "./services/sessionLock";
import { isCanonicalId, requireId } from "./utils/ids";
import { isRecord } from "./utils/record";
import { isEpochMilliseconds } from "./utils/time";
import { segment } from "./api/paths";

type NetworkCustomerListener = (session: NetworkCustomerSignedIn | null) => void;

type ChosenStorage =
  | { type: "none" }
  | { type: "refused" }
  | { type: "available"; storage: NetworkCustomerStorage };

const accessTokenPrefix = "network_customer_access_";
const refreshTokenPrefix = "network_customer_refresh_";

function reportListenerFailure(error: unknown): void {
  console.error("An Arky auth state listener failed", error);
}

function isReach(value: unknown): value is NetworkSignInReach {
  if (!isRecord(value)) return false;
  if (value.type === "network") return Object.keys(value).length === 1;
  return value.type === "store" && isCanonicalId(value.store_id) && Object.keys(value).length === 2;
}

function isAuthToken(value: unknown): value is NetworkCustomerAuthToken {
  return (
    isRecord(value) &&
    isCanonicalId(value.id) &&
    typeof value.access_token === "string" &&
    value.access_token.startsWith(accessTokenPrefix) &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.startsWith(refreshTokenPrefix) &&
    isEpochMilliseconds(value.access_expires_at) &&
    isEpochMilliseconds(value.refresh_expires_at) &&
    isEpochMilliseconds(value.authenticated_at) &&
    isReach(value.reach)
  );
}

function parseStored(raw: string | null): NetworkCustomerAuthToken | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) && parsed.version === 1 && isAuthToken(parsed.token) ? parsed.token : null;
  } catch {
    return null;
  }
}

function sameToken(left: NetworkCustomerAuthToken | null, right: NetworkCustomerAuthToken): boolean {
  return (
    left?.id === right.id &&
    left.access_token === right.access_token &&
    left.refresh_token === right.refresh_token
  );
}

function sessionChanged(): ArkyError {
  return Object.assign(
    new ArkyError("session_changed", "The network customer sign-in changed while this request was pending"),
    { statusCode: 401 },
  );
}

function normalizedApiUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError("A network customer client needs its apiUrl");
  const input = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new TypeError("A network customer client's apiUrl must be a valid HTTP(S) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError("A network customer client's apiUrl must use HTTP or HTTPS");
  }
  return input.replace(/\/+$/, "");
}

function chooseStorage(explicit: NetworkCustomerStorage | undefined): ChosenStorage {
  if (explicit) return { type: "available", storage: explicit };
  if (typeof window === "undefined") return { type: "none" };
  try {
    return { type: "available", storage: window.localStorage };
  } catch {
    return { type: "refused" };
  }
}

function requireReach(reach: NetworkSignInReach): NetworkSignInReach {
  if (reach?.type === "network") return { type: "network" };
  if (reach?.type === "store") return { type: "store", store_id: requireId(reach.store_id, "store") };
  throw new TypeError("A network customer sign-in reaches the network or one store");
}

export function createNetworkCustomer(config: NetworkCustomerConfig) {
  const networkId = requireId(config?.networkId, "network");
  const apiUrl = normalizedApiUrl(config.apiUrl);
  const base = `/v1/networks/${segment(networkId)}/customer`;
  const storageKey = `arky_network_customer_session:v1:${encodeURIComponent(apiUrl)}:${networkId}`;
  const lockKey = `${storageKey}:refresh`;
  const chosen = chooseStorage(config.sessionStorage);
  const storage = chosen.type === "available" ? chosen.storage : null;
  const sharedWithOtherTabs = !config.sessionStorage && chosen.type === "available";
  let storageUnavailable = chosen.type === "refused";
  let memory: NetworkCustomerAuthToken | null = null;
  const listeners = new Set<NetworkCustomerListener>();
  let unsubscribeStorage: (() => void) | null = null;

  function readRaw(): { type: "read"; value: string | null } | { type: "refused" } {
    if (!storage || storageUnavailable) return { type: "refused" };
    try {
      return { type: "read", value: storage.getItem(storageKey) };
    } catch {
      storageUnavailable = true;
      return { type: "refused" };
    }
  }

  function read(): NetworkCustomerAuthToken | null {
    const raw = readRaw();
    if (raw.type === "refused") return memory;
    memory = parseStored(raw.value);
    return memory;
  }

  const startup = readRaw();
  if (startup.type === "read") {
    memory = parseStored(startup.value);
    if (startup.value && !memory && storage) {
      try {
        storage.removeItem(storageKey);
      } catch {
        storageUnavailable = true;
      }
    }
  }

  function toPublic(token: NetworkCustomerAuthToken | null): NetworkCustomerSignedIn | null {
    return token ? { id: token.id, reach: token.reach } : null;
  }

  function emit(): void {
    const current = toPublic(read());
    for (const listener of listeners) {
      Promise.resolve()
        .then(() => listener(current))
        .catch(reportListenerFailure);
    }
  }

  function write(token: NetworkCustomerAuthToken | null): void {
    if (token !== null && !isAuthToken(token)) {
      throw new ArkyError("answer_mismatch", "The network customer sign-in answer is invalid");
    }
    memory = token;
    if (storage && !storageUnavailable) {
      try {
        if (token) storage.setItem(storageKey, JSON.stringify({ version: 1, token }));
        else storage.removeItem(storageKey);
      } catch {
        storageUnavailable = true;
      }
    }
    emit();
  }

  const publicHttpClient = createHttpClient({
    baseUrl: apiUrl,
    authStorage: { getTokens: () => null },
    onUnauthorized: () => false,
  });

  async function rotate(expected: NetworkCustomerAuthToken): Promise<NetworkCustomerAuthToken> {
    let answer: NetworkCustomerAuthToken;
    try {
      answer = await publicHttpClient.post<NetworkCustomerAuthToken>(`${base}/refresh`, {
        refresh_token: expected.refresh_token,
      });
    } catch (error) {
      if (
        error instanceof ArkyApiError &&
        refusedByArky({ status: error.statusCode, data: error.response }) &&
        sameToken(read(), expected)
      ) {
        write(null);
      }
      throw error;
    }
    if (!isAuthToken(answer) || answer.id !== expected.id) {
      throw new ArkyError("answer_mismatch", "The network customer refresh returned invalid credentials");
    }
    return answer;
  }

  async function refreshCredentials(expected: TokenSet | null): Promise<void> {
    await exclusive(lockKey, async () => {
      const current = read();
      if (!expected || !current || current.id !== expected.id) throw sessionChanged();
      if (current.access_token !== expected.access_token) return;
      const next = await rotate(current);
      if (!sameToken(read(), current)) throw sessionChanged();
      write(next);
    });
  }

  const authStorage: AuthStorage = {
    getTokens() {
      const current = read();
      return current ? { id: current.id, access_token: current.access_token, refresh_token: current.refresh_token } : null;
    },
  };

  const httpClient = createHttpClient({ baseUrl: apiUrl, authStorage, refreshCredentials });

  function storePath(storeId: string, path: string): string {
    return `${base}/stores/${segment(requireId(storeId, "store"))}/${path}`;
  }

  function watchOtherTabs(): void {
    if (unsubscribeStorage || !sharedWithOtherTabs || typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) emit();
    };
    window.addEventListener("storage", onStorage);
    unsubscribeStorage = () => window.removeEventListener("storage", onStorage);
  }

  return {
    get session(): NetworkCustomerSignedIn | null {
      return toPublic(read());
    },

    get isAuthenticated(): boolean {
      return read() !== null;
    },

    get sessionStorageUnavailable(): boolean {
      return storageUnavailable;
    },

    onAuthStateChanged(listener: NetworkCustomerListener): () => void {
      listeners.add(listener);
      watchOtherTabs();
      const current = toPublic(read());
      if (current) {
        Promise.resolve()
          .then(() => listener(current))
          .catch(reportListenerFailure);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribeStorage?.();
          unsubscribeStorage = null;
        }
      };
    },

    requestCode(params: RequestNetworkCustomerCodeParams, options?: RequestOptions): Promise<PendingNetworkCustomerSignIn> {
      return publicHttpClient.post<PendingNetworkCustomerSignIn>(
        `${base}/code`,
        {
          session_id: requireId(params.session_id, "network customer sign-in"),
          reach: requireReach(params.reach),
          contact: params.contact,
        },
        options,
      );
    },

    async verify(params: VerifyNetworkCustomerCodeParams, options?: RequestOptions): Promise<NetworkCustomerAuthToken> {
      const answer = await publicHttpClient.post<NetworkCustomerAuthToken>(
        `${base}/verify`,
        { session_id: requireId(params.session_id, "network customer sign-in"), code: params.code },
        options,
      );
      write(answer);
      return answer;
    },

    async refresh(): Promise<NetworkCustomerAuthToken> {
      const requested = read();
      if (!requested) throw new ArkyError("no_session", "Refreshing needs the network customer sign-in");
      return exclusive(lockKey, async () => {
        if (!sameToken(read(), requested)) throw sessionChanged();
        const next = await rotate(requested);
        if (!sameToken(read(), requested)) throw sessionChanged();
        write(next);
        return next;
      });
    },

    async logout(): Promise<NetworkCustomerLogoutResult> {
      const requested = read();
      if (!requested) return { type: "local_only" };
      try {
        const answer = await httpClient.post<{ ended: boolean }>(`${base}/logout`, undefined);
        return answer?.ended === true
          ? { type: "ended", session_id: requested.id }
          : { type: "unconfirmed", session_id: requested.id };
      } catch {
        return { type: "unconfirmed", session_id: requested.id };
      } finally {
        if (read()?.id === requested.id) write(null);
      }
    },

    async getMe(options?: RequestOptions): Promise<NetworkCustomerMe | null> {
      if (!read()) return null;
      return httpClient.get<NetworkCustomerMe>(`${base}/me`, options);
    },

    async deleteAccount(options?: RequestOptions): Promise<NetworkCustomerAccountDeleted> {
      const requested = read();
      if (!requested) throw new ArkyError("no_session", "Deleting the account needs the network customer sign-in");
      const answer = await httpClient.delete<NetworkCustomerAccountDeleted>(`${base}/me`, options);
      if (read()?.id === requested.id) write(null);
      return answer;
    },

    login: {
      requestCode(params: RequestNetworkCustomerLoginCodeParams, options?: RequestOptions): Promise<LoginCodeSent> {
        return httpClient.post<LoginCodeSent>(`${base}/logins/code`, { contact: params.contact }, options);
      },

      verify(params: VerifyNetworkCustomerLoginParams, options?: RequestOptions): Promise<NetworkCustomerMe> {
        return httpClient.post<NetworkCustomerMe>(
          `${base}/logins/verify`,
          { address: params.address, code: params.code, confirm_join: params.confirm_join },
          options,
        );
      },

      remove(params: RemoveNetworkCustomerLoginParams, options?: RequestOptions): Promise<NetworkCustomerMe> {
        return httpClient.post<NetworkCustomerMe>(`${base}/logins/remove`, { address: params.address }, options);
      },
    },

    store: {
      find(params: FindLinkedStoresParams = {}, options?: RequestOptions): Promise<PaginatedResponse<LinkedStore>> {
        return httpClient.get<PaginatedResponse<LinkedStore>>(`${base}/stores`, {
          ...options,
          params: { limit: params.limit, cursor: params.cursor },
        });
      },

      openKey(params: OpenNetworkCustomerStoreKeyParams, options?: RequestOptions): Promise<NetworkCustomerStoreKey> {
        return httpClient.post<NetworkCustomerStoreKey>(
          storePath(params.store_id, "keys"),
          { id: requireId(params.id, "store key"), visitor_token: params.visitor_token },
          options,
        );
      },

      acceptInvite(params: AcceptNetworkCustomerInviteParams, options?: RequestOptions): Promise<NetworkCustomerStoreKey> {
        return httpClient.post<NetworkCustomerStoreKey>(
          storePath(params.store_id, "invites/accept"),
          { id: requireId(params.id, "store key"), code: params.code, sent_to: params.sent_to },
          options,
        );
      },

      removeLink(params: RemoveNetworkCustomerStoreLinkParams, options?: RequestOptions): Promise<NetworkCustomerLinkRemoved> {
        return httpClient.delete<NetworkCustomerLinkRemoved>(storePath(params.store_id, "link"), options);
      },
    },
  };
}

export type NetworkCustomerClient = ReturnType<typeof createNetworkCustomer>;
