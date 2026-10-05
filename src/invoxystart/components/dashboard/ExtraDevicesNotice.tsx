import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/invoxystart/api';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { apiErrorMessage } from '@/invoxystart/lib/useRenewalBreakdown';

const formatRubles = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

/**
 * Предупреждение о доплате за устройства сверх лимита тарифа. Правило доплаты
 * живёт на бэкенде и не меняется; здесь только объяснение и способ вернуться
 * к лимиту тарифа (POST /devices/reduce).
 */
export function ExtraDevicesNotice({
  extraCount,
  monthlyCost,
  baseLimit,
  subscriptionId,
}: {
  extraCount: number;
  monthlyCost: number;
  baseLimit: number;
  subscriptionId?: number | null;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (extraCount <= 0) return null;

  async function reduce() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    try {
      await subscriptionApi.reduceDevices(baseLimit, subscriptionId ?? undefined);
      showToast(t('invoxy.renewal.limitRestored', { count: baseLimit }), 'success');
      await Promise.all(
        [
          ['invoxy-subscriptions'],
          ['invoxy-subscription-details'],
          ['invoxy-purchase-options'],
          ['invoxy-tariffs-page-data'],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    } catch (error) {
      showToast(apiErrorMessage(error, t('invoxy.renewal.limitRestoreFailed')), 'error');
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[.07] p-3.5 text-xs text-amber-100">
      <p className="leading-relaxed">
        {t('invoxy.renewal.extraWarning', {
          count: extraCount,
          cost: formatRubles(monthlyCost),
        })}
      </p>
      <button
        type="button"
        onClick={() => void reduce()}
        disabled={busy}
        className="mt-2.5 flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-amber-200/30 px-3 text-xs font-bold text-amber-50 transition-colors hover:bg-amber-200/10 disabled:opacity-60"
      >
        {confirming
          ? t('invoxy.renewal.restoreLimitConfirm', { count: baseLimit })
          : t('invoxy.renewal.restoreLimit', { count: baseLimit })}
      </button>
    </div>
  );
}
