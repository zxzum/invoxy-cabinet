import { request as apiRequest } from '@/invoxystart/api/client';

type ContentRequestInit = Omit<RequestInit, 'body'> & { body?: unknown };

function apiPath(input: RequestInfo | URL): string {
  const url =
    typeof input === 'string'
      ? new URL(input, window.location.origin)
      : input instanceof URL
        ? input
        : new URL(input.url, window.location.origin);
  return `${url.pathname}${url.search}`;
}

export function requestJson<T>(input: RequestInfo | URL, init?: ContentRequestInit): Promise<T> {
  const { body, ...options } = init ?? {};
  return apiRequest<T>(apiPath(input), { ...options, body });
}

export function postJson<T>(input: RequestInfo | URL, body: unknown): Promise<T> {
  return requestJson<T>(input, { method: 'POST', body });
}

export function stripMarkup(value: string): string {
  return value
    .replace(/<br\s*\/?>(\s*)/gi, '\n$1')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU');
}
