import { ArkyApiError, ArkyError } from "./types/apiError";
import type { RequestOptions } from "./types/api";
import type { LoginCodeSent } from "./types/account";
import type { PaginatedResponse } from "./types/common";
import type { AuthStorage, TokenSet } from "./types/httpClient";
import type {
  AcceptNetworkUserInviteParams,
  FindLinkedTenantsParams,
  LinkedTenant,
  NetworkUserAccountDeleted,
  NetworkUserAuthToken,
  NetworkUserConfig,
  NetworkUserLinkRemoved,
  NetworkUserLogoutResult,
  NetworkUserMe,
  NetworkUserSignedIn,
  NetworkUserStorage,
  NetworkUserTenantKey,
  NetworkSignInReach,
  OpenNetworkUserTenantKeyParams,
  PendingNetworkUserSignIn,
  RemoveNetworkUserLoginParams,
  RemoveNetworkUserTenantLinkParams,
  RequestNetworkUserCodeParams,
  RequestNetworkUserLoginCodeParams,
  VerifyNetworkUserCodeParams,
  VerifyNetworkUserLoginParams,
} from "./types/networkUser";
import { createHttpClient, refusedByArky } from "./services/createHttpClient";
import { exclusive } from "./services/sessionLock";
import { isCanonicalId, requireId } from "./utils/ids";
import { isRecord } from "./utils/record";
import { isEpochMilliseconds } from "./utils/time";
import { segment } from "./api/paths";

type NetworkUserListener = (session: NetworkUserSignedIn | null) => void;

type ChosenStorage =
  | { type: "none" }
  | { type: "refused" }
  | { type: "available"; storage: NetworkUserStorage };

const accessTokenPrefix = "network_user_access_";
const refreshTokenPrefix = "network_user_refresh_";

function reportListenerFailure(error: unknown): void {
  console.error("An Arky auth state listener failed", error);
}

function isReach(value: unknown): value is NetworkSignInReach {
  if (!isRecord(value)) return false;
  if (value.type === "network") return Object.keys(value).length === 1;
  return value.type === "tenant" && isCanonicalId(value.tenant_id) && Object.keys(value).length === 2;
}

function isAuthToken(value: unknown): value is NetworkUserAuthToken {
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

function parseStored(raw: string | null): NetworkUserAuthToken | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) && parsed.version === 1 && isAuthToken(parsed.token) ? parsed.token : null;
  } catch {
    return null;
  }
}

function sameToken(left: NetworkUserAuthToken | null, right: NetworkUserAuthToken): boolean {
  return (
    left?.id === right.id &&
    left.access_token === right.access_token &&
    left.refresh_token === right.refresh_token
  );
}

function sessionChanged(): ArkyError {
  return Object.assign(
    new ArkyError("session_changed", "The network user sign-in changed while this request was pending"),
    { statusCode: 401 },
  );
}

function normalizedApiUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError("A network user client needs its apiUrl");
  const input = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new TypeError("A network user client's apiUrl must be a valid HTTP(S) URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError("A network user client's apiUrl must use HTTP or HTTPS");
  }
  return input.replace(/\/+$/, "");
}

function chooseStorage(explicit: NetworkUserStorage | undefined): ChosenStorage {
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
  if (reach?.type === "tenant") return { type: "tenant", tenant_id: requireId(reach.tenant_id, "tenant") };
  throw new TypeError("A network user sign-in reaches the network or one tenant");
}

export function createNetworkUser(config: NetworkUserConfig) {
  const networkId = requireId(config?.networkId, "network");
  const apiUrl = normalizedApiUrl(config.apiUrl);
  const base = `/v1/networks/${segment(networkId)}/user`;
  const storageKey = `arky_network_user_session:v1:${encodeURIComponent(apiUrl)}:${networkId}`;
  const lockKey = `${storageKey}:refresh`;
  const chosen = chooseStorage(config.sessionStorage);
  const storage = chosen.type === "available" ? chosen.storage : null;
  const sharedWithOtherTabs = !config.sessionStorage && chosen.type === "available";
  let storageUnavailable = chosen.type === "refused";
  let memory: NetworkUserAuthToken | null = null;
  const listeners = new Set<NetworkUserListener>();
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

  function read(): NetworkUserAuthToken | null {
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

  function toPublic(token: NetworkUserAuthToken | null): NetworkUserSignedIn | null {
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

  function write(token: NetworkUserAuthToken | null): void {
    if (token !== null && !isAuthToken(token)) {
      throw new ArkyError("answer_mismatch", "The network user sign-in answer is invalid");
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

  async function rotate(expected: NetworkUserAuthToken): Promise<NetworkUserAuthToken> {
    let answer: NetworkUserAuthToken;
    try {
      answer = await publicHttpClient.post<NetworkUserAuthToken>(`${base}/refresh`, {
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
      throw new ArkyError("answer_mismatch", "The network user refresh returned invalid credentials");
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

  function tenantPath(tenantId: string, path: string): string {
    return `${base}/tenants/${segment(requireId(tenantId, "tenant"))}/${path}`;
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
    get session(): NetworkUserSignedIn | null {
      return toPublic(read());
    },

    get isAuthenticated(): boolean {
      return read() !== null;
    },

    get sessionStorageUnavailable(): boolean {
      return storageUnavailable;
    },

    onAuthStateChanged(listener: NetworkUserListener): () => void {
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

    requestCode(params: RequestNetworkUserCodeParams, options?: RequestOptions): Promise<PendingNetworkUserSignIn> {
      return publicHttpClient.post<PendingNetworkUserSignIn>(
        `${base}/code`,
        {
          session_id: requireId(params.session_id, "network user sign-in"),
          reach: requireReach(params.reach),
          contact: params.contact,
        },
        options,
      );
    },

    async verify(params: VerifyNetworkUserCodeParams, options?: RequestOptions): Promise<NetworkUserAuthToken> {
      const answer = await publicHttpClient.post<NetworkUserAuthToken>(
        `${base}/verify`,
        { session_id: requireId(params.session_id, "network user sign-in"), code: params.code },
        options,
      );
      write(answer);
      return answer;
    },

    async refresh(): Promise<NetworkUserAuthToken> {
      const requested = read();
      if (!requested) throw new ArkyError("no_session", "Refreshing needs the network user sign-in");
      return exclusive(lockKey, async () => {
        if (!sameToken(read(), requested)) throw sessionChanged();
        const next = await rotate(requested);
        if (!sameToken(read(), requested)) throw sessionChanged();
        write(next);
        return next;
      });
    },

    async logout(): Promise<NetworkUserLogoutResult> {
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

    async getMe(options?: RequestOptions): Promise<NetworkUserMe | null> {
      if (!read()) return null;
      return httpClient.get<NetworkUserMe>(`${base}/me`, options);
    },

    async deleteAccount(options?: RequestOptions): Promise<NetworkUserAccountDeleted> {
      const requested = read();
      if (!requested) throw new ArkyError("no_session", "Deleting the account needs the network user sign-in");
      const answer = await httpClient.delete<NetworkUserAccountDeleted>(`${base}/me`, options);
      if (read()?.id === requested.id) write(null);
      return answer;
    },

    login: {
      requestCode(params: RequestNetworkUserLoginCodeParams, options?: RequestOptions): Promise<LoginCodeSent> {
        return httpClient.post<LoginCodeSent>(`${base}/logins/code`, { contact: params.contact }, options);
      },

      verify(params: VerifyNetworkUserLoginParams, options?: RequestOptions): Promise<NetworkUserMe> {
        return httpClient.post<NetworkUserMe>(
          `${base}/logins/verify`,
          { address: params.address, code: params.code, confirm_join: params.confirm_join },
          options,
        );
      },

      remove(params: RemoveNetworkUserLoginParams, options?: RequestOptions): Promise<NetworkUserMe> {
        return httpClient.post<NetworkUserMe>(`${base}/logins/remove`, { address: params.address }, options);
      },
    },

    tenant: {
      find(params: FindLinkedTenantsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<LinkedTenant>> {
        return httpClient.get<PaginatedResponse<LinkedTenant>>(`${base}/tenants`, {
          ...options,
          params: { limit: params.limit, cursor: params.cursor },
        });
      },

      openKey(params: OpenNetworkUserTenantKeyParams, options?: RequestOptions): Promise<NetworkUserTenantKey> {
        return httpClient.post<NetworkUserTenantKey>(
          tenantPath(params.tenant_id, "keys"),
          { id: requireId(params.id, "tenant key"), visitor_token: params.visitor_token },
          options,
        );
      },

      acceptInvite(params: AcceptNetworkUserInviteParams, options?: RequestOptions): Promise<NetworkUserTenantKey> {
        return httpClient.post<NetworkUserTenantKey>(
          tenantPath(params.tenant_id, "invites/accept"),
          { id: requireId(params.id, "tenant key"), code: params.code, sent_to: params.sent_to },
          options,
        );
      },

      removeLink(params: RemoveNetworkUserTenantLinkParams, options?: RequestOptions): Promise<NetworkUserLinkRemoved> {
        return httpClient.delete<NetworkUserLinkRemoved>(tenantPath(params.tenant_id, "link"), options);
      },
    },
  };
}

export type NetworkUserClient = ReturnType<typeof createNetworkUser>;
