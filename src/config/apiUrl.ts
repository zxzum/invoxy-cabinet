const DEFAULT_API_BASE_URL = '/api';
const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export interface ApiUrlOptions {
  isDev?: boolean;
}

/**
 * Resolve the API base URL without allowing an insecure production transport.
 * Local HTTP is intentionally limited to loopback hosts for development.
 */
export function resolveApiBaseUrl(value: unknown, options: ApiUrlOptions = {}): string {
  const configured =
    typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_API_BASE_URL;

  if (configured.startsWith('/') && !configured.startsWith('//')) return configured;

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('VITE_API_URL must be a relative path or an absolute HTTP(S) URL');
  }

  if (url.protocol === 'https:') return configured;

  const isDev = options.isDev ?? import.meta.env.DEV;
  if (url.protocol === 'http:' && isDev && LOCALHOST_NAMES.has(url.hostname)) {
    return configured;
  }

  throw new Error('VITE_API_URL must use HTTPS outside local development');
}
