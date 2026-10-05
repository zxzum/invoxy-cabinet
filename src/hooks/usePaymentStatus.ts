import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { balanceApi } from '../api/balance';
import {
  isSnapshotFailed,
  isSnapshotPaid,
  resolvePaymentView,
  schedulePaymentRefresh,
  type PaymentView,
} from '../utils/paymentResolution';

export const PAYMENT_POLL_INTERVAL_MS = 3_000;
export const PAYMENT_MAX_POLL_MS = 10 * 60 * 1000;

/**
 * Опрос статуса платежа на бэкенде до paid/failed или таймаута (10 мин).
 * С paymentId опрашивает конкретный платёж, без него — последний платёж метода.
 */
export function usePaymentStatus({
  method,
  paymentId,
  enabled = true,
  redirectStatus,
}: {
  method: string | null | undefined;
  paymentId?: number | null;
  enabled?: boolean;
  redirectStatus?: string | null;
}) {
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const active = enabled && Boolean(method);

  useEffect(() => {
    if (!active || timedOut) return;
    const timer = window.setTimeout(() => setTimedOut(true), PAYMENT_MAX_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [active, timedOut, attempt]);

  const query = useQuery({
    queryKey: ['payment-status', method, paymentId ?? 'latest'],
    queryFn: () =>
      paymentId != null
        ? balanceApi.getPendingPayment(method ?? '', paymentId)
        : balanceApi.getLatestPayment(method ?? ''),
    enabled: active && !timedOut,
    refetchInterval: (q) =>
      isSnapshotPaid(q.state.data) || isSnapshotFailed(q.state.data)
        ? false
        : PAYMENT_POLL_INTERVAL_MS,
    retry: 2,
  });

  const { refetch } = query;
  const retry = useCallback(() => {
    setTimedOut(false);
    setAttempt((value) => value + 1);
    void refetch();
  }, [refetch]);

  const payment = query.data ?? null;
  return {
    payment,
    view: resolvePaymentView({ payment, redirectStatus, timedOut }),
    timedOut,
    retry,
  };
}

/**
 * На каждой смене состояния платежа обновляет данные сразу и повторно через
 * 3 и 10 секунд: вебхук и автопокупка тарифа из корзины завершаются позже,
 * чем пользователь видит экран результата.
 */
export function useRefreshOnPaymentChange(view: PaymentView, refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const previous = useRef<PaymentView | null>(null);
  useEffect(() => {
    if (previous.current === view) return;
    const first = previous.current === null;
    previous.current = view;
    if (first && view === 'pending') return;
    return schedulePaymentRefresh(() => refreshRef.current());
  }, [view]);
}
