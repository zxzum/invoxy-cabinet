import { isFailedStatus, isPaidStatus } from './paymentStatus';

/**
 * Что показать пользователю по платежу. Источник истины — статус платежа на
 * бэкенде: параметр ?status=success от провайдера приходит раньше вебхука и
 * означает лишь «провайдер принял оплату», поэтому даёт состояние verifying,
 * а не paid. Ложный успех по росту баланса не используется вовсе — баланс
 * мог вырасти от реферального начисления или промокода.
 */
export type PaymentView = 'pending' | 'verifying' | 'paid' | 'failed' | 'timeout';

export interface PaymentSnapshot {
  status?: string | null;
  is_paid?: boolean | null;
}

export function isSnapshotPaid(payment: PaymentSnapshot | null | undefined): boolean {
  return Boolean(payment && (payment.is_paid || (payment.status && isPaidStatus(payment.status))));
}

export function isSnapshotFailed(payment: PaymentSnapshot | null | undefined): boolean {
  return Boolean(
    payment && !isSnapshotPaid(payment) && payment.status && isFailedStatus(payment.status),
  );
}

export function resolvePaymentView({
  payment,
  redirectStatus,
  timedOut,
}: {
  payment: PaymentSnapshot | null | undefined;
  /** status/payment из URL возврата провайдера, если есть. */
  redirectStatus?: string | null;
  timedOut: boolean;
}): PaymentView {
  if (isSnapshotPaid(payment)) return 'paid';
  if (isSnapshotFailed(payment)) return 'failed';
  // Явный отказ провайдера при возврате показываем сразу: оплаты не было.
  if (redirectStatus && isFailedStatus(redirectStatus)) return 'failed';
  if (timedOut) return 'timeout';
  if (redirectStatus && isPaidStatus(redirectStatus)) return 'verifying';
  return 'pending';
}

/** Задержки повторной инвалидации после смены статуса: вебхук и автопокупка тарифа идут позже. */
export const PAYMENT_REFRESH_DELAYS_MS = [0, 3_000, 10_000] as const;

/** Вызывает refresh сразу и повторно через 3 и 10 секунд; возвращает отмену. */
export function schedulePaymentRefresh(refresh: () => void): () => void {
  const timers = PAYMENT_REFRESH_DELAYS_MS.map((delay) => setTimeout(refresh, delay));
  return () => {
    for (const timer of timers) clearTimeout(timer);
  };
}
