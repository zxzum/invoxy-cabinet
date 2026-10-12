import axios from 'axios';
import { ApiError } from '@/invoxystart/api/client';

function errorDetail(err: unknown): unknown {
  const data =
    err instanceof ApiError ? err.data : axios.isAxiosError(err) ? err.response?.data : null;
  return data && typeof data === 'object' && 'detail' in data ? data.detail : undefined;
}

export function shouldUseTariffPurchaseFlow(err: unknown): boolean {
  const detail = errorDetail(err);
  if (!detail || typeof detail !== 'object') return false;
  const values = detail as { code?: string; error_code?: string; use_purchase_flow?: boolean };
  return (
    values.use_purchase_flow === true &&
    ['subscription_expired', 'trial_cannot_switch', 'free_tariff_cannot_switch'].includes(
      values.code ?? values.error_code ?? '',
    )
  );
}

/**
 * True when the backend answered 404 on the route itself — for cabinet
 * endpoints that means the bot build is too old to have them (e.g. the
 * deep-link auth routes exist only since bot v3.33.0), as opposed to a
 * missing entity inside a handler.
 */
export function isEndpointMissingError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

/**
 * True when the backend answered 429 — the caller hit a rate limit and should
 * say «слишком часто, попробуйте позже» rather than «не удалось отправить».
 */
export function isRateLimitedError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 429;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError || axios.isAxiosError(err)) {
    const detail = errorDetail(err);
    if (typeof detail === 'string') return detail;
    // Pydantic V2 validation errors: [{type, loc, msg, input, ctx}]
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((e: { loc?: (string | number)[]; msg?: string }) => {
          const field = e.loc?.filter((s) => s !== 'body').join('.') ?? '';
          return field ? `${field}: ${e.msg}` : (e.msg ?? '');
        })
        .join('; ');
    }
    // Структурные ошибки бэка ({code, message, ...}: 428 «нужно согласие», 403
    // maintenance и т.п.) — берём message. Объект в тексте ошибки роняет React (#31).
    if (detail && typeof detail === 'object') {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return fallback;
  }
  return fallback;
}
