import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '@/invoxystart/api';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { apiErrorMessage } from '@/invoxystart/lib/useRenewalBreakdown';

const formatRubles = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

type ReductionInfo = Awaited<ReturnType<typeof subscriptionApi.getDeviceReductionInfo>>;

/** Explains the billing change and the device removals before calling /devices/reduce. */
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
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<ReductionInfo | null>(null);
  const [infoError, setInfoError] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [busy, setBusy] = useState(false);

  if (extraCount <= 0) return null;

  const canReduce = Boolean(
    !infoError &&
      info?.available &&
      info.current_device_limit > baseLimit &&
      baseLimit >= info.min_device_limit,
  );

  async function review() {
    setOpen(true);
    setLoadingInfo(true);
    setInfoError(false);
    setInfo(null);
    try {
      setInfo(await subscriptionApi.getDeviceReductionInfo(subscriptionId ?? undefined));
    } catch {
      setInfoError(true);
    } finally {
      setLoadingInfo(false);
    }
  }

  async function reduce() {
    if (!canReduce || busy) return;
    setBusy(true);
    try {
      await subscriptionApi.reduceDevices(baseLimit, subscriptionId ?? undefined);
      showToast(t('invoxy.renewal.limitRestored', { count: baseLimit }), 'success');
      setOpen(false);
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
    }
  }

  const disconnectedCount = Math.max(0, (info?.connected_devices_count ?? 0) - baseLimit);

  return (
    <>
      <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[.07] p-3.5 text-sm text-amber-100">
        <p className="leading-relaxed">
          {t('invoxy.renewal.extraWarning', {
            count: extraCount,
            cost: formatRubles(monthlyCost),
          })}
        </p>
        <button
          type="button"
          onClick={() => void review()}
          disabled={loadingInfo || busy}
          className="mt-2 flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('invoxy.renewal.limitReview')}
        </button>
      </div>
      <AdaptiveDialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        titleId="device-limit-title"
      >
        <div className="space-y-4">
          <h2 id="device-limit-title" className="text-xl font-bold text-ink">
            {t('invoxy.renewal.limitDialogTitle', { count: baseLimit })}
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            {t('invoxy.renewal.limitDialogCost', { cost: formatRubles(monthlyCost) })}
          </p>
          {loadingInfo ? (
            <p className="text-sm text-muted">{t('invoxy.renewal.limitChecking')}</p>
          ) : !canReduce ? (
            <p role="alert" className="text-sm text-amber-200">
              {t('invoxy.renewal.limitUnavailable')}
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-ink">
                {disconnectedCount > 0
                  ? t('invoxy.renewal.limitDisconnect', { count: disconnectedCount })
                  : t('invoxy.renewal.limitKeepDevices')}
              </p>
              <p className="text-sm text-muted">{t('invoxy.renewal.limitNoRefund')}</p>
            </>
          )}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            {canReduce && (
              <button
                type="button"
                onClick={() => void reduce()}
                disabled={busy}
                className="min-h-12 rounded-2xl bg-amber-200 px-5 text-sm font-bold text-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('invoxy.renewal.limitConfirmAction', { count: baseLimit })}
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="min-h-12 rounded-2xl border border-white/15 px-5 text-sm font-semibold text-ink"
            >
              {t('invoxy.renewal.limitCancel')}
            </button>
          </div>
        </div>
      </AdaptiveDialog>
    </>
  );
}
