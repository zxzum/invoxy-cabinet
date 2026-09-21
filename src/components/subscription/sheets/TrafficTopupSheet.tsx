import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../../../api/subscription';
import { getErrorMessage } from '../../../utils/subscriptionHelpers';
import InsufficientBalancePrompt from '../../InsufficientBalancePrompt';
import { ChevronRightIcon } from '../../icons';
import type { PurchaseOptions, Subscription } from '../../../types';
import { useSuccessNotification } from '../../../store/successNotification';
import { formatPrice } from '../../../utils/format';
import {
  formatCalendarBoundaryDate,
  formatCalendarBoundaryMonth,
} from '../../../utils/calendarBoundary';

// ──────────────────────────────────────────────────────────────────
// Buy-traffic sheet. Self-owns the packages query + purchase mutation;
// parent passes the selectedTrafficPackage state (the parent already
// resets it on global "close all modals", which is why it stays up
// top), shared purchaseOptions, and ids/flags.
//
// Extracted from Subscription.tsx — ~170 lines off the god page.
// ──────────────────────────────────────────────────────────────────

export interface TrafficTopupSheetProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  subscription: Subscription;
  subscriptionId: number | undefined;
  initialScope?: 'regular' | 'whitelist';
  onScopeChange?: (scope: 'regular' | 'whitelist') => void;
  selectedTrafficPackage: number | null;
  onSelectedTrafficPackageChange: (gb: number | null) => void;
  purchaseOptions: PurchaseOptions | undefined;
  isDark: boolean;
}

export function TrafficTopupSheet({
  open,
  onOpen,
  onClose,
  subscription,
  subscriptionId,
  initialScope,
  selectedTrafficPackage,
  onSelectedTrafficPackageChange,
  purchaseOptions,
  isDark,
}: TrafficTopupSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showSuccess = useSuccessNotification((state) => state.show);
  const [hasConfirmedWarning, setHasConfirmedWarning] = useState(false);

  const primaryTrafficLabel = t('subscription.primaryTraffic', 'Основной трафик');
  const primaryTrafficDescription = t(
    'subscription.primaryTrafficDescription',
    'общий интернет через VPN',
  );
  const whiteInternetBarLabel = t('subscription.whiteInternetServers', 'LTE сервера');

  // Fetch LTE traffic reset status
  const { data: trafficReset } = useQuery({
    queryKey: ['traffic-reset', subscriptionId],
    queryFn: () => subscriptionApi.getTrafficReset(subscriptionId),
    enabled: !!subscription && !subscription.is_trial,
    initialData:
      purchaseOptions && 'traffic_reset' in purchaseOptions
        ? (purchaseOptions.traffic_reset ?? undefined)
        : undefined,
  });

  const isLteReset =
    initialScope === 'regular'
      ? false
      : initialScope === 'whitelist'
        ? true
        : (trafficReset?.enabled ?? (subscription.whitelist_traffic_limit_gb ?? 0) > 0);

  // Regular traffic packages query (only when not an LTE reset tariff and not trial)
  const { data: trafficPackages } = useQuery({
    queryKey: ['traffic-packages', subscriptionId, 'regular'],
    queryFn: () => subscriptionApi.getTrafficPackages(subscriptionId, 'regular'),
    enabled: open && !!subscription && !isLteReset && !subscription.is_trial,
  });

  // Regular topup mutation
  const purchaseMutation = useMutation({
    mutationFn: (gb: number) => subscriptionApi.purchaseTraffic(gb, subscriptionId, 'regular'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['traffic-packages', subscriptionId, 'regular'] });
      showSuccess({
        type: 'traffic_purchased',
        amountKopeks: data.amount_paid_kopeks,
        trafficGbAdded: data.gb_added,
        message: `${primaryTrafficLabel}: +${data.gb_added} ${t('common.units.gb')}`,
      });
      onClose();
      onSelectedTrafficPackageChange(null);
    },
  });

  // LTE reset mutation
  const resetMutation = useMutation({
    mutationFn: () => subscriptionApi.resetTraffic(subscriptionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['traffic-reset', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      showSuccess({
        type: 'traffic_purchased',
        amountKopeks: data.price_kopeks,
        trafficGbAdded: data.cleared_gb,
        message: t('subscription.trafficReset.successToast', {
          cleared: data.cleared_gb.toFixed(1),
          defaultValue: `Списано ${data.cleared_gb.toFixed(1)} ГБ расхода LTE`,
        }),
      });
      onClose();
      setHasConfirmedWarning(false);
    },
  });

  // Trial subscriptions have neither top-up nor reset
  if (subscription.is_trial) {
    return null;
  }

  // Check if regular top-up is allowed if not LTE reset
  const currentTariff =
    purchaseOptions && 'tariffs' in purchaseOptions
      ? purchaseOptions.tariffs.find((t) => t.id === subscription.tariff_id || t.is_current)
      : undefined;
  const canTopupRegular = currentTariff
    ? currentTariff.traffic_topup_enabled !== false &&
      (currentTariff.traffic_topup_max_per_month ?? 1) > 0
    : subscription.traffic_limit_gb > 0;

  if (!isLteReset && !canTopupRegular) {
    return null;
  }

  // ── Closed state (Trigger button) ──────────────────────────────────
  if (!open) {
    if (isLteReset && trafficReset) {
      const used = trafficReset.used_gb;
      const limit = trafficReset.limit_gb;
      let statusSubtitle = '';
      if (trafficReset.unavailable_reason === 'below_min_used') {
        statusSubtitle = t('subscription.trafficReset.belowMinUsed', {
          min: trafficReset.min_used_gb,
          defaultValue: `Сброс доступен после ${trafficReset.min_used_gb} ГБ расхода`,
        });
      } else if (trafficReset.unavailable_reason === 'monthly_limit') {
        const monthName = formatCalendarBoundaryMonth(trafficReset.next_available_at);
        statusSubtitle = t('subscription.trafficReset.monthlyLimitReached', {
          month: monthName,
          defaultValue: `Лимит сбросов на этот месяц исчерпан. Следующий сброс с 1 ${monthName}`,
        });
      }

      return (
        <button onClick={onOpen} className="card-interactive w-full p-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-dark-100">
                {t('subscription.trafficReset.title', 'Сброс LTE')}
              </div>
              <div className="mt-1 text-sm text-accent-400">
                {`${whiteInternetBarLabel}: ${used.toFixed(1)} / ${limit} ${t('common.units.gb')}`}
              </div>
              {statusSubtitle && <div className="mt-1 text-xs text-dark-400">{statusSubtitle}</div>}
            </div>
            <ChevronRightIcon className="text-dark-400" />
          </div>
        </button>
      );
    }

    return (
      <button onClick={onOpen} className="card-interactive w-full p-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-dark-100">
              {t('subscription.additionalOptions.buyTraffic')}
            </div>
            <div className="mt-1 text-sm text-dark-400">
              {`${primaryTrafficLabel}: ${subscription.traffic_used_gb.toFixed(1)} / ${subscription.traffic_limit_gb} ${t('common.units.gb')} — ${primaryTrafficDescription}`}
            </div>
          </div>
          <ChevronRightIcon className="text-dark-400" />
        </div>
      </button>
    );
  }

  // ── Open state: LTE Traffic Reset ──────────────────────────────────
  if (isLteReset && trafficReset) {
    const hasEnoughBalance =
      !purchaseOptions || trafficReset.price_kopeks <= purchaseOptions.balance_kopeks;
    const missingAmount = purchaseOptions
      ? trafficReset.price_kopeks - purchaseOptions.balance_kopeks
      : 0;

    return (
      <div className="card-inset p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium text-dark-100">
            {t('subscription.trafficReset.sheetTitle', 'Сброс расхода LTE')}
          </h3>
          <button
            onClick={() => {
              onClose();
              setHasConfirmedWarning(false);
            }}
            className="text-sm text-dark-400 hover:text-dark-200"
            aria-label={t('common.close', 'Close')}
          >
            ✕
          </button>
        </div>

        {/* LTE progress */}
        <div className="alert-info mb-4">
          <div className="flex items-center justify-between text-sm font-medium text-dark-100">
            <span>{`${whiteInternetBarLabel}: ${trafficReset.used_gb.toFixed(1)} / ${trafficReset.limit_gb} ${t('common.units.gb')}`}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-dark-800">
            <div
              className="h-full rounded-full bg-accent-400"
              style={{
                width: `${Math.min(100, (trafficReset.used_gb / (trafficReset.limit_gb || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Warning block (Mandatory copy from TZ §2.2) */}
        <div
          className={`mb-4 rounded-xl p-4 text-xs leading-relaxed ${
            isDark
              ? 'border border-dark-700/40 bg-dark-800/60 text-dark-300'
              : 'border border-champagne-400/40 bg-champagne-300/30 text-champagne-900'
          }`}
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-dark-100">
            <span>ℹ️</span>{' '}
            {t('subscription.trafficReset.howItWorksTitle', 'Как работает сброс LTE')}
          </div>
          <p>
            {t(
              'subscription.trafficReset.howItWorksText',
              'Лимит тарифа не увеличивается. Вы обнуляете уже потраченные гигабайты Белого интернета — максимум 50 ГБ за одну оплату (150 ₽). Неизрасходованные гигабайты в этой порции не возвращаются и не копятся: если сейчас потрачено 12 ГБ, сброс обнулит 12 ГБ, не «добавят 50 сверху». Когда квота снова кончится, squad Белого интернета отключится, как сейчас. На Стандарте LTE сброс можно купить один раз в календарный месяц, на Премиуме — два.',
            )}
          </p>
          {trafficReset.exhausted && (
            <p className="mt-2 font-medium text-accent-400">
              {t(
                'subscription.trafficReset.reconnectNote',
                '💡 После оплаты Белый интернет включится снова.',
              )}
            </p>
          )}
        </div>

        {/* Transparent calculation before payment */}
        <div className="card mb-4 rounded-xl border border-dark-700/30 bg-dark-950/40 p-3.5 text-sm">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-dark-300">
            {t('subscription.trafficReset.calculationTitle', 'Честный расчёт перед оплатой:')}
          </div>
          <div className="space-y-1.5 text-xs text-dark-300">
            <div className="flex justify-between">
              <span>
                {t('subscription.trafficReset.spentNow', {
                  used: trafficReset.used_gb.toFixed(1),
                  limit: trafficReset.limit_gb,
                  defaultValue: `Потрачено сейчас: ${trafficReset.used_gb.toFixed(1)} ГБ из ${trafficReset.limit_gb} ГБ`,
                })}
              </span>
            </div>
            <div className="flex justify-between font-medium text-accent-400">
              <span>
                {t('subscription.trafficReset.willClear', {
                  cleared: trafficReset.will_clear_gb.toFixed(1),
                  defaultValue: `Будет списано расхода: ${trafficReset.will_clear_gb.toFixed(1)} ГБ`,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                {t('subscription.trafficReset.afterReset', {
                  after: trafficReset.used_after_gb.toFixed(1),
                  limit: trafficReset.limit_gb,
                  defaultValue: `После сброса: ${trafficReset.used_after_gb.toFixed(1)} / ${trafficReset.limit_gb} ГБ`,
                })}
              </span>
            </div>
            <div className="border-t border-dark-700/30 pt-1.5 text-dark-400">
              {t('subscription.trafficReset.resetsLeft', {
                left: trafficReset.remaining_this_month,
                max: trafficReset.max_per_month,
                defaultValue: `Осталось сбросов в этом месяце: ${trafficReset.remaining_this_month} из ${trafficReset.max_per_month}`,
              })}
            </div>
          </div>
        </div>

        {/* Reason banners if unavailable */}
        {trafficReset.unavailable_reason === 'below_min_used' && (
          <div className="alert-warning mb-4 text-xs">
            ⚠️{' '}
            {t('subscription.trafficReset.belowMinUsed', {
              min: trafficReset.min_used_gb,
              defaultValue: `Сброс доступен после ${trafficReset.min_used_gb} ГБ расхода на LTE`,
            })}
          </div>
        )}

        {trafficReset.unavailable_reason === 'monthly_limit' && (
          <div className="alert-warning mb-4 text-xs">
            ⚠️{' '}
            {t('subscription.trafficReset.monthlyLimitReached', {
              month: formatCalendarBoundaryMonth(trafficReset.next_available_at),
              defaultValue: 'Лимит сбросов на этот месяц исчерпан',
            })}
          </div>
        )}

        {/* Action section when available */}
        {trafficReset.unavailable_reason == null && (
          <>
            <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-xs text-dark-300">
              <input
                type="checkbox"
                checked={hasConfirmedWarning}
                onChange={(e) => setHasConfirmedWarning(e.target.checked)}
                className="mt-0.5 rounded border-dark-700 bg-dark-900 text-accent-500 focus:ring-accent-500"
              />
              <span>
                {t(
                  'subscription.trafficReset.confirmCheckbox',
                  'Я понимаю, что сброс списывает расход (до 50 ГБ), а не увеличивает лимит тарифа',
                )}
              </span>
            </label>

            {!hasEnoughBalance && missingAmount > 0 && (
              <InsufficientBalancePrompt
                missingAmountKopeks={missingAmount}
                compact
                className="mb-3"
                onBeforeTopUp={async () => {
                  await subscriptionApi.saveTrafficResetCart(subscriptionId);
                }}
              />
            )}

            <button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending || !hasEnoughBalance || !hasConfirmedWarning}
              className="btn-primary w-full py-3"
            >
              {resetMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </span>
              ) : (
                t('subscription.trafficReset.confirmButton', {
                  price: trafficReset.price_rubles,
                  defaultValue: `Понятно, сбросить за ${trafficReset.price_rubles} ₽`,
                })
              )}
            </button>
          </>
        )}

        {resetMutation.isError && (
          <div className="mt-3 text-center text-sm text-error-400">
            {getErrorMessage(resetMutation.error)}
          </div>
        )}
      </div>
    );
  }

  // ── Open state: Regular Traffic Top-up ──────────────────────────────
  return (
    <div className="card-inset p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-dark-100">
          {t('subscription.additionalOptions.buyTrafficTitle')}
        </h3>
        <button
          onClick={() => {
            onClose();
            onSelectedTrafficPackageChange(null);
          }}
          className="text-sm text-dark-400 hover:text-dark-200"
          aria-label={t('common.close', 'Close')}
        >
          ✕
        </button>
      </div>

      <div
        className={`mb-4 rounded-lg p-2 text-xs ${isDark ? 'bg-dark-700/30 text-dark-500' : 'bg-champagne-300/40 text-champagne-600'}`}
      >
        ⚠️ {t('subscription.additionalOptions.trafficWarning')}
      </div>

      <div className="alert-info mb-4">
        <div className="text-sm font-medium text-dark-100">{primaryTrafficLabel}</div>
        <div className="mt-1 text-xs text-dark-400">
          {`${subscription.traffic_used_gb.toFixed(1)} / ${subscription.traffic_limit_gb} ${t('common.units.gb')} — ${primaryTrafficDescription}`}
        </div>
      </div>

      {!trafficPackages || trafficPackages.length === 0 ? (
        <div className="py-4 text-center text-sm text-dark-400">
          {t('subscription.additionalOptions.trafficUnavailable')}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {trafficPackages.map((pkg) => (
              <button
                key={pkg.gb}
                onClick={() => pkg.is_available !== false && onSelectedTrafficPackageChange(pkg.gb)}
                disabled={pkg.is_available === false}
                className={`card-interactive p-4 text-center ${
                  pkg.is_available === false
                    ? 'cursor-not-allowed border-dark-700/30 bg-dark-950/25 opacity-55'
                    : selectedTrafficPackage === pkg.gb
                      ? 'card-selected'
                      : ''
                }`}
              >
                <div className="text-lg font-semibold text-dark-100">
                  {pkg.is_unlimited
                    ? `♾️ ${t('subscription.additionalOptions.unlimited')}`
                    : `${pkg.gb} ${t('common.units.gb')}`}
                </div>
                {pkg.discount_percent != null && pkg.discount_percent > 0 && (
                  <div className="mb-1">
                    <span className="inline-block rounded-full bg-success-500/20 px-2 py-0.5 text-xs font-medium text-success-400">
                      -{pkg.discount_percent}%
                    </span>
                  </div>
                )}
                <div className="font-medium text-accent-400">
                  {pkg.discount_percent && pkg.discount_percent > 0 && pkg.base_price_kopeks ? (
                    <>
                      <span className="mr-1 text-sm text-dark-500 line-through">
                        {formatPrice(pkg.base_price_kopeks)}
                      </span>
                      {formatPrice(pkg.price_kopeks)}
                    </>
                  ) : (
                    formatPrice(pkg.price_kopeks)
                  )}
                </div>
                {pkg.is_available === false && (
                  <div className="mt-2 text-xs leading-snug text-dark-400">
                    {pkg.next_available_at
                      ? t('subscription.additionalOptions.availableAgain', {
                          date: formatCalendarBoundaryDate(pkg.next_available_at),
                        })
                      : pkg.unavailable_reason}
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedTrafficPackage !== null &&
            (() => {
              const selectedPkg = trafficPackages.find((p) => p.gb === selectedTrafficPackage);
              const hasEnoughBalance =
                !selectedPkg ||
                !purchaseOptions ||
                selectedPkg.price_kopeks <= purchaseOptions.balance_kopeks;
              const missingAmount =
                selectedPkg && purchaseOptions
                  ? selectedPkg.price_kopeks - purchaseOptions.balance_kopeks
                  : 0;

              return (
                <>
                  {!hasEnoughBalance && missingAmount > 0 && (
                    <InsufficientBalancePrompt
                      missingAmountKopeks={missingAmount}
                      compact
                      className="mb-3"
                      onBeforeTopUp={async () => {
                        await subscriptionApi.saveTrafficCart(
                          selectedTrafficPackage,
                          subscriptionId,
                          'regular',
                        );
                      }}
                    />
                  )}
                  <button
                    onClick={() => purchaseMutation.mutate(selectedTrafficPackage)}
                    disabled={purchaseMutation.isPending || !hasEnoughBalance}
                    className="btn-primary w-full py-3"
                  >
                    {purchaseMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      </span>
                    ) : selectedPkg?.is_unlimited ? (
                      t('subscription.additionalOptions.buyUnlimited')
                    ) : (
                      t('subscription.additionalOptions.buyTrafficGb', {
                        gb: selectedTrafficPackage,
                      })
                    )}
                  </button>
                </>
              );
            })()}

          {purchaseMutation.isError && (
            <div className="text-center text-sm text-error-400">
              {getErrorMessage(purchaseMutation.error)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
