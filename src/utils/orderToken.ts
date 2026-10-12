import type { RequestOptions } from '../types/httpClient';

export function isOrderToken(value: unknown): value is string {
  return typeof value === 'string' && /^arky_ot_[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(value);
}

export function createOrderToken(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return `arky_ot_${btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function orderTokenOptions(options?: RequestOptions): RequestOptions | undefined {
  if (options?.order_token === undefined) return options;
  if (!isOrderToken(options.order_token)) throw new TypeError('The order token must contain 32 random bytes in canonical base64url');
  const { order_token, ...transport } = options;
  const headers = Object.fromEntries(Object.entries(transport.headers ?? {}).filter(([name]) => name.toLowerCase() !== 'x-arky-order-token'));
  return { ...transport, headers: { ...headers, 'X-Arky-Order-Token': order_token } };
}

function tokenKey(scope: string, orderId: string): string {
  if (!scope || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(orderId)) throw new TypeError('An order token needs its exact scope and canonical Order ID');
  return `arky:order-token:v1:${encodeURIComponent(scope)}:${orderId}`;
}

export function retainOrderToken(scope: string, orderId: string, token: string): void {
  if (!isOrderToken(token)) throw new TypeError('Invalid order token');
  const key = tokenKey(scope, orderId);
  const previous = globalThis.localStorage.getItem(key);
  if (previous !== null && previous !== token) throw new Error('This Order already has a different retained token');
  globalThis.localStorage.setItem(key, token);
  if (globalThis.localStorage.getItem(key) !== token) throw new Error('The Order token could not be retained');
}

export function readOrderToken(scope: string, orderId: string): string | null {
  const token = globalThis.localStorage.getItem(tokenKey(scope, orderId));
  if (token !== null && !isOrderToken(token)) throw new Error('The retained Order token is invalid');
  return token;
}
