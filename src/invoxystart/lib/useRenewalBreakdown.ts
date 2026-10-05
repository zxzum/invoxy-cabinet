import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../api/subscription';
import { extractRenewalBreakdown, type RenewalBreakdown } from './renewalBreakdown';

export const PURCHASE_OPTIONS_QUERY_KEY = ['invoxy-purchase-options'] as const;

/** Разбивка цены продления текущего тарифа подписки (тариф + доп. устройства). */
export function useRenewalBreakdown(
  tariffId: number | null | undefined,
  subscriptionId?: number | null,
): RenewalBreakdown | null {
  const { data } = useQuery({
    queryKey: [...PURCHASE_OPTIONS_QUERY_KEY, subscriptionId ?? null],
    queryFn: () => subscriptionApi.getPurchaseOptions(subscriptionId ?? undefined),
    enabled: tariffId != null,
    staleTime: 60_000,
  });
  return extractRenewalBreakdown(data as { tariffs?: unknown } | undefined, tariffId);
}

/** Текст ошибки API для тоста: detail строкой или detail.message. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && 'message' in detail) {
    return String((detail as { message: unknown }).message);
  }
  return fallback;
}
