import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Намерение купить конкретный тариф, переданное через URL страницы тарифов:
 * /tariffs?plan=<id|recommended>&period=<days>. Так дашборд и другие экраны
 * открывают настройку нужного тарифа одним переходом.
 */
export interface PurchaseIntent {
  plan: string;
  periodDays: number | null;
}

export function tariffsUrl(plan?: string | number | null, periodDays?: number | null): string {
  const params = new URLSearchParams();
  if (plan != null && plan !== '') params.set('plan', String(plan));
  if (periodDays) params.set('period', String(periodDays));
  const query = params.toString();
  return query ? `/tariffs?${query}` : '/tariffs';
}

export function parsePurchaseIntent(params: URLSearchParams): PurchaseIntent | null {
  const plan = params.get('plan');
  if (!plan) return null;
  const period = Number(params.get('period'));
  return { plan, periodDays: Number.isFinite(period) && period > 0 ? period : null };
}

/** Текущее намерение и способ его «погасить» после открытия настройки. */
export function usePurchaseIntent(): [PurchaseIntent | null, () => void] {
  const [params, setParams] = useSearchParams();
  const clear = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('plan');
        next.delete('period');
        return next;
      },
      { replace: true },
    );
  }, [setParams]);
  return [parsePurchaseIntent(params), clear];
}
