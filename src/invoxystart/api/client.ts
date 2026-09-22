import { resolveApiBaseUrl } from '../../config/apiUrl';

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL).replace(/\/$/, '');
const UNAUTH_PATHS = [
  '/cabinet/auth/telegram',
  '/cabinet/auth/email/login',
  '/cabinet/auth/email/register',
  '/cabinet/auth/email/verify',
  '/cabinet/auth/refresh',
  '/cabinet/auth/password/',
  '/cabinet/auth/oauth/',
  '/cabinet/auth/deeplink/',
  '/cabinet/auth/login/auto',
  '/cabinet/auth/app-link/exchange',
  '/cabinet/landing/',
];

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean | null | undefined | Array<string | number>>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, data: unknown, message = `API request failed (${status})`) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function reportBlocking(status: number, data: unknown) {
  if (typeof window === 'undefined') return;
  const detail =
    data && typeof data === 'object' && 'detail' in data
      ? (data as { detail?: unknown }).detail
      : data;
  if (!detail || typeof detail !== 'object') return;
  const code = (detail as { code?: string }).code;
  const type = code === 'channel_subscription_required' ? 'channel_subscription' : code;
  if (
    status === 503 ||
    ['maintenance', 'channel_subscription', 'blacklisted', 'account_deleted'].includes(type || '')
  ) {
    window.dispatchEvent(
      new CustomEvent('invoxy:block', {
        detail: { type: status === 503 && !type ? 'maintenance' : type, info: detail },
      }),
    );
  }
}

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
const GET_CACHE_TTL_MS = 30_000;
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();

function clearResponseCache() {
  responseCache.clear();
}

/** Drop the short-lived GET cache before a lifecycle revalidation. */
export { clearResponseCache };

function storage(name: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window[name];
  } catch {
    return null;
  }
}

export const tokenStorage = {
  getAccessToken: () => {
    try {
      return storage('sessionStorage')?.getItem('access_token') ?? memoryAccessToken;
    } catch {
      return memoryAccessToken;
    }
  },
  getRefreshToken: () => {
    try {
      return (
        storage('localStorage')?.getItem('refresh_token') ??
        storage('sessionStorage')?.getItem('refresh_token') ??
        memoryRefreshToken
      );
    } catch {
      return memoryRefreshToken;
    }
  },
  setTokens(accessToken: string, refreshToken: string) {
    if (!accessToken || !refreshToken) throw new Error('Cannot store empty credentials');
    clearResponseCache();
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    try {
      storage('sessionStorage')?.setItem('access_token', accessToken);
      storage('localStorage')?.setItem('refresh_token', refreshToken);
      storage('sessionStorage')?.removeItem('refresh_token');
    } catch {
      // A private WebView can deny storage; the request still succeeds for this tab.
    }
  },
  setAccessToken(accessToken: string) {
    memoryAccessToken = accessToken;
    try {
      storage('sessionStorage')?.setItem('access_token', accessToken);
    } catch {}
  },
  clearTokens() {
    clearResponseCache();
    memoryAccessToken = null;
    memoryRefreshToken = null;
    try {
      storage('sessionStorage')?.removeItem('access_token');
      storage('sessionStorage')?.removeItem('refresh_token');
      storage('localStorage')?.removeItem('access_token');
      storage('localStorage')?.removeItem('refresh_token');
    } catch {}
  },
  getTelegramInitData: () => storage('sessionStorage')?.getItem('telegram_init_data') ?? null,
  setTelegramInitData(data: string) {
    try {
      storage('sessionStorage')?.setItem('telegram_init_data', data);
    } catch {}
  },
};

type TelegramWindow = Window & {
  Telegram?: { WebApp?: { initData?: string } };
};

/** Read the current Telegram Mini App payload without adding an SDK dependency. */
export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return tokenStorage.getTelegramInitData();
  const bridgeData = (window as TelegramWindow).Telegram?.WebApp?.initData?.trim();
  if (bridgeData) {
    tokenStorage.setTelegramInitData(bridgeData);
    return bridgeData;
  }

  const sources = [
    window.location.hash.replace(/^#/, ''),
    window.location.search.replace(/^\?/, ''),
  ];
  for (const source of sources) {
    if (!source) continue;
    const value = new URLSearchParams(source).get('tgWebAppData')?.trim();
    if (value) {
      tokenStorage.setTelegramInitData(value);
      return value;
    }
  }
  return tokenStorage.getTelegramInitData();
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return match?.[1] ?? null;
}

function ensureCsrfToken(): string {
  const current = getCsrfToken();
  if (current) return current;
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  if (typeof document !== 'undefined') {
    document.cookie = `csrf_token=${token}; path=/; SameSite=Strict`;
  }
  return token;
}

function isAuthPath(path: string): boolean {
  return UNAUTH_PATHS.some((unauth) => path.startsWith(unauth));
}

function makeUrl(path: string, params?: RequestOptions['params']): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return url;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
    else query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;
}

async function readResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  return text || undefined;
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const response = await fetch(makeUrl('/cabinet/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': ensureCsrfToken() },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return null;
      const data = (await readResponse(response)) as { access_token?: string };
      if (!data?.access_token) return null;
      tokenStorage.setAccessToken(data.access_token);
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const token = tokenStorage.getAccessToken();
  const shouldCache =
    method === 'GET' && options.cache !== 'no-store' && !path.includes('/payment-methods');
  const cacheKey = shouldCache
    ? `${options.skipAuth ? 'public' : 'private'}:${token || 'anonymous'}:${makeUrl(path, options.params)}`
    : null;
  if (cacheKey) {
    const cached = responseCache.get(cacheKey);
    if (cached) {
      if (cached.expiresAt > Date.now()) return cached.value as T;
      responseCache.delete(cacheKey);
    }
  }
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !options.skipAuth && !isAuthPath(path))
    headers.set('Authorization', `Bearer ${token}`);
  const telegramInitData = getTelegramInitData();
  if (
    telegramInitData &&
    (path.startsWith('/cabinet/auth/telegram') ||
      path.startsWith('/cabinet/auth/account/link/telegram'))
  ) {
    headers.set('X-Telegram-Init-Data', telegramInitData);
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
    headers.set('X-CSRF-Token', ensureCsrfToken());

  let response: Response;
  try {
    response = await fetch(makeUrl(path, options.params), {
      ...options,
      method,
      headers,
      body:
        options.body === undefined || isFormData
          ? (options.body as BodyInit | null | undefined)
          : JSON.stringify(options.body),
    });
  } catch (error) {
    if (typeof window !== 'undefined')
      window.dispatchEvent(
        new CustomEvent('invoxy:block', { detail: { type: 'backend_unavailable' } }),
      );
    throw error;
  }
  const data = await readResponse(response);

  if (response.status === 401 && !retried && !isAuthPath(path)) {
    const nextToken = await refreshAccessToken();
    if (nextToken) return request<T>(path, options, true);
  }

  if (!response.ok) {
    reportBlocking(response.status, data);
    const message =
      typeof data === 'object' && data && 'detail' in data
        ? String((data as { detail?: unknown }).detail)
        : undefined;
    throw new ApiError(response.status, data, message);
  }
  if (cacheKey) {
    responseCache.set(cacheKey, { value: data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
  } else if (method !== 'GET') {
    clearResponseCache();
  }
  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T = void>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export default apiClient;
