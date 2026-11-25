import type { AdminSessionInternal } from './clientTypes';
import type { AuthToken } from '../types/api';
import type { TokenSet } from '../types/httpClient';
import { isCanonicalId } from '../utils/ids';
import { isRecord } from '../utils/record';
import { isEpochMilliseconds } from '../utils/time';
import { ArkyError, ArkyNetworkError } from '../types/apiError';
import { refusedByArky } from './createHttpClient';
import { exclusive } from './sessionLock';

export type AdminLogoutResult =
  | { type: 'revoked'; session_id: string }
  | { type: 'unconfirmed'; session_id: string }
  | { type: 'local_only' }
  | { type: 'account_token' };

const changedEvent = 'arky-admin-session-changed';

const sessionFields = new Set(['id', 'access_token', 'refresh_token', 'email']);

function validSession(value: unknown): value is AdminSessionInternal {
  return isRecord(value) && Object.keys(value).every((key) => sessionFields.has(key))
    && isCanonicalId(value.id)
    && typeof value.access_token === 'string' && value.access_token.length > 0
    && typeof value.refresh_token === 'string' && value.refresh_token.length > 0
    && (value.email === undefined || typeof value.email === 'string');
}

function validRefreshAnswer(value: unknown, sessionId: string): value is AuthToken {
  return isRecord(value) && value.id === sessionId
    && typeof value.access_token === 'string' && value.access_token.length > 0
    && typeof value.refresh_token === 'string' && value.refresh_token.length > 0
    && isEpochMilliseconds(value.access_expires_at)
    && isEpochMilliseconds(value.refresh_expires_at)
    && isEpochMilliseconds(value.authenticated_at)
    && isEpochMilliseconds(value.created_at)
    && isEpochMilliseconds(value.updated_at);
}

function parsedSession(raw: string | null): AdminSessionInternal | null {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  return validSession(value) ? value : null;
}

function parsedBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function sameCredentials(left: AdminSessionInternal | null, right: AdminSessionInternal): boolean {
  return left?.id === right.id && left.access_token === right.access_token
    && left.refresh_token === right.refresh_token;
}

function changedLogin(): ArkyError {
  return Object.assign(new ArkyError('session_changed', 'The Account session changed while this request was pending'), {
    statusCode: 401,
  });
}

export function createAdminSessionState(baseUrl: string, refreshPath?: string | (() => string)) {
  const apiUrl = baseUrl.replace(/\/$/, '');
  const storageKey = `arky_admin_session:${apiUrl}`;
  const lockKey = `${storageKey}:credentials`;
  let memory: AdminSessionInternal | null = null;
  let storageUnavailable = false;

  function storageRefused(): void {
    storageUnavailable = true;
    window.dispatchEvent(new CustomEvent(changedEvent, { detail: storageKey }));
  }

  function read(): AdminSessionInternal | null {
    if (typeof window === 'undefined' || storageUnavailable) return memory;
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch {
      storageRefused();
      return memory;
    }
    memory = parsedSession(raw);
    return memory;
  }

  function write(value: AdminSessionInternal | null): void {
    if (value !== null && !validSession(value)) throw new ArkyError('answer_mismatch', 'The Account session answer is invalid');
    memory = value;
    if (typeof window === 'undefined') return;
    if (!storageUnavailable) {
      try {
        if (value) window.localStorage.setItem(storageKey, JSON.stringify(value));
        else window.localStorage.removeItem(storageKey);
      } catch {
        storageRefused();
        return;
      }
    }
    window.dispatchEvent(new CustomEvent(changedEvent, { detail: storageKey }));
  }

  function isStorageUnavailable(): boolean {
    return storageUnavailable;
  }

  function subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && (event.key === storageKey || event.key === null)) listener();
    };
    const onChanged = (event: Event) => {
      if ((event as CustomEvent<string>).detail === storageKey) listener();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(changedEvent, onChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(changedEvent, onChanged);
    };
  }

  async function send(path: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: unknown }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${apiUrl}${path}`, { ...init, signal: controller.signal });
      const body = await response.text();
      if (body.length > 16_384) throw new ArkyNetworkError('unreadable_answer', 'Account session response exceeds its bound', { url: `${apiUrl}${path}`, statusCode: response.status });
      if (!response.ok) return { ok: false, status: response.status, data: parsedBody(body) };
      const data = parsedBody(body);
      if (data === null) {
        throw new ArkyNetworkError('unreadable_answer', 'Arky answered the Account session call without a readable JSON body', { url: `${apiUrl}${path}`, statusCode: response.status });
      }
      return { ok: true, status: response.status, data };
    } finally {
      clearTimeout(timer);
    }
  }

  async function rotate(expected: AdminSessionInternal): Promise<AuthToken> {
    const path = typeof refreshPath === 'function' ? refreshPath() : refreshPath || '/v1/auth/refresh';
    const response = await send(path, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: expected.refresh_token }),
    });
    if (!response.ok) {
      if (refusedByArky(response) && sameCredentials(read(), expected)) write(null);
      throw Object.assign(new ArkyError('refresh_failed', 'Account session refresh failed'), { statusCode: response.status });
    }
    const result = response.data;
    if (!validRefreshAnswer(result, expected.id)) {
      throw new ArkyError('answer_mismatch', 'Account session refresh returned invalid credentials');
    }
    return result;
  }

  function rotated(current: AdminSessionInternal, result: AuthToken): AdminSessionInternal {
    return { ...current, access_token: result.access_token, refresh_token: result.refresh_token };
  }

  async function refresh(expected: TokenSet | null): Promise<void> {
    await exclusive(lockKey, async () => {
      const current = read();
      if (!expected || !current || current.id !== expected.id) throw changedLogin();
      if (current.access_token !== expected.access_token) return;
      const result = await rotate(current);
      if (!sameCredentials(read(), current)) throw changedLogin();
      write(rotated(current, result));
    });
  }

  async function refreshExplicit(refreshToken: string): Promise<AuthToken> {
    const requested = read();
    if (!requested || requested.refresh_token !== refreshToken) throw changedLogin();
    return exclusive(lockKey, async () => {
      if (!sameCredentials(read(), requested)) throw changedLogin();
      const result = await rotate(requested);
      if (!sameCredentials(read(), requested)) throw changedLogin();
      write(rotated(requested, result));
      return result;
    });
  }

  async function revoke(sessionId: string, accessToken: string) {
    return send(`/v1/accounts/me/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    });
  }

  async function logout(): Promise<AdminLogoutResult> {
    const requested = read();
    if (!requested) return { type: 'local_only' };
    try {
      return await exclusive(lockKey, async () => {
        const current = read();
        const credential = current?.id === requested.id ? current : requested;
        if (read()?.id === requested.id) write(null);
        let response = await revoke(requested.id, credential.access_token);
        if (!response.ok && refusedByArky(response)) {
          const renewed = rotated(credential, await rotate(credential));
          response = await revoke(requested.id, renewed.access_token);
        }
        if (!response.ok || response.data !== true) return { type: 'unconfirmed', session_id: requested.id };
        return { type: 'revoked', session_id: requested.id };
      });
    } catch {
      return { type: 'unconfirmed', session_id: requested.id };
    } finally {
      if (read()?.id === requested.id) write(null);
    }
  }

  return { read, write, subscribe, refresh, refreshExplicit, logout, isStorageUnavailable };
}
