import type { AdminSessionInternal } from './clientTypes';
import type { AuthToken } from '../types/api';
import type { TokenSet } from '../types/httpClient';
import { epochMillisecondsNow } from '../utils/time';
import type { EpochMilliseconds } from '../types/time';

export type AdminLogoutResult =
  | { type: 'revoked'; session_id: string }
  | { type: 'unconfirmed'; session_id: string }
  | { type: 'local_only' }
  | { type: 'api_token' };

const queues = new Map<string, Promise<unknown>>();
const changedEvent = 'arky-admin-session-changed';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function isEpochMilliseconds(value: unknown): value is EpochMilliseconds {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validSession(value: unknown): value is AdminSessionInternal {
  return record(value) && typeof value.id === 'string' && uuid.test(value.id)
    && typeof value.access_token === 'string' && value.access_token.length > 0
    && typeof value.refresh_token === 'string' && value.refresh_token.length > 0
    && isEpochMilliseconds(value.access_expires_at)
    && (value.email === undefined || typeof value.email === 'string');
}

function sameCredentials(left: AdminSessionInternal | null, right: AdminSessionInternal): boolean {
  return left?.id === right.id && left.access_token === right.access_token
    && left.refresh_token === right.refresh_token;
}

function changedLogin(): Error {
  return Object.assign(new Error('The Account session changed while this request was pending'), {
    name: 'SessionChangedError', statusCode: 401,
  });
}

export function createAdminSessionState(baseUrl: string, refreshPath?: string | (() => string)) {
  const apiUrl = baseUrl.replace(/\/$/, '');
  const storageKey = `arky_admin_session:${apiUrl}`;
  const lockKey = `${storageKey}:credentials`;
  let memory: AdminSessionInternal | null = null;
  let storageUnavailable = false;

  function read(): AdminSessionInternal | null {
    if (typeof window === 'undefined' || storageUnavailable) return memory;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const value: unknown = raw === null ? null : JSON.parse(raw);
      memory = validSession(value) ? value : null;
    } catch {
      storageUnavailable = true;
    }
    return memory;
  }

  function write(value: AdminSessionInternal | null): void {
    if (value !== null && !validSession(value)) throw new TypeError('Invalid Account session');
    memory = value;
    if (typeof window === 'undefined') return;
    try {
      if (value) window.localStorage.setItem(storageKey, JSON.stringify(value));
      else window.localStorage.removeItem(storageKey);
    } catch {
      storageUnavailable = true;
    }
    window.dispatchEvent(new CustomEvent(changedEvent, { detail: storageKey }));
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

  async function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35_000);
      try {
        return await navigator.locks.request(lockKey, { signal: controller.signal }, operation);
      } finally {
        clearTimeout(timer);
      }
    }
    const previous = queues.get(lockKey) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    queues.set(lockKey, current);
    try {
      return await current;
    } finally {
      if (queues.get(lockKey) === current) queues.delete(lockKey);
    }
  }

  async function send(path: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: unknown }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${apiUrl}${path}`, { ...init, signal: controller.signal });
      const body = await response.text();
      if (body.length > 16_384) throw new TypeError('Account session response exceeds its bound');
      return { ok: response.ok, status: response.status, data: response.ok ? JSON.parse(body) : null };
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
      if (response.status === 401 && sameCredentials(read(), expected)) write(null);
      throw Object.assign(new Error('Account session refresh failed'), { statusCode: response.status });
    }
    const result = response.data;
    if (!validSession(result) || result.id !== expected.id
      || !record(result) || !isEpochMilliseconds(result.refresh_expires_at)
      || !isEpochMilliseconds(result.authenticated_at) || !isEpochMilliseconds(result.created_at)
      || !isEpochMilliseconds(result.updated_at)) {
      throw new TypeError('Account session refresh returned invalid credentials');
    }
    return result as unknown as AuthToken;
  }

  async function refresh(expected: TokenSet | null): Promise<void> {
    await exclusive(async () => {
      const current = read();
      if (!expected || !current || current.id !== expected.id) throw changedLogin();
      if (current.access_token !== expected.access_token) return;
      const result = await rotate(current);
      if (!sameCredentials(read(), current)) throw changedLogin();
      write({ ...current, ...result });
    });
  }

  async function refreshExplicit(refreshToken: string): Promise<AuthToken> {
    const requested = read();
    if (!requested || requested.refresh_token !== refreshToken) throw changedLogin();
    return exclusive(async () => {
      if (!sameCredentials(read(), requested)) throw changedLogin();
      const result = await rotate(requested);
      if (!sameCredentials(read(), requested)) throw changedLogin();
      write({ ...requested, ...result });
      return result;
    });
  }

  async function logout(): Promise<AdminLogoutResult> {
    const requested = read();
    if (!requested) return { type: 'local_only' };
    try {
      return await exclusive(async () => {
        const current = read();
        let credential = current?.id === requested.id ? current : requested;
        if (epochMillisecondsNow() >= credential.access_expires_at) {
          credential = { ...credential, ...await rotate(credential) };
        }
        if (read()?.id === requested.id) write(null);
        const response = await send(`/v1/accounts/me/sessions/${requested.id}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json', Authorization: `Bearer ${credential.access_token}` },
        });
        if (!response.ok || response.data !== true) return { type: 'unconfirmed', session_id: requested.id };
        return { type: 'revoked', session_id: requested.id };
      });
    } catch {
      return { type: 'unconfirmed', session_id: requested.id };
    } finally {
      if (read()?.id === requested.id) write(null);
    }
  }

  return { read, write, subscribe, refresh, refreshExplicit, logout };
}
