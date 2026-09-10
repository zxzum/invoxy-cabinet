import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../../../api/subscription';
import { getErrorMessage } from '../../../utils/subscriptionHelpers';
import InsufficientBalancePrompt from '../../InsufficientBalancePrompt';
import { ChevronRightIcon } from '../../icons';
import type { PurchaseOptions, Subscription } from '../../../types';
import { useSuccessNotification } from '../../../store/successNotification';

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
  selectedTrafficPackage,
  onSelectedTrafficPackageChange,
  purchaseOptions,
  isDark,
}: TrafficTopupSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showSuccess = useSuccessNotification((state) => state.show);
  const [scope, setScope] = useState<'regular' | 'whitelist'>('regular');
  const primaryTrafficLabel = t('subscription.primaryTraffic', 'Основной трафик');
  const primaryTrafficDescription = t(
    'subscription.primaryTrafficDescription',
    'общий интернет через VPN',
  );
  const whiteInternetLabel = t('subscription.whiteInternet');
  const whiteInternetBarLabel = t('subscription.whiteInternetServers', 'LTE сервера');
  const whiteInternetDescription = t(
    'subscription.whiteInternetDescription',
    'отдельная квота LTE',
  );

  useEffect(() => {
    if ((subscription.whitelist_traffic_limit_gb ?? 0) <= 0) setScope('regular');
  }, [subscription.id, subscription.whitelist_traffic_limit_gb]);

  const formatPrice = (kopeks: number) => {
    const rubles = kopeks / 100;
    return rubles % 1 === 0 ? `${rubles} ₽` : `${rubles.toFixed(2)} ₽`;
  };

  const { data: trafficPackages } = useQuery({
    queryKey: ['traffic-packages', subscriptionId, scope],
    queryFn: () => subscriptionApi.getTrafficPackages(subscriptionId, scope),
    enabled: open && !!subscription,
  });

  const purchaseMutation = useMutation({
    mutationFn: (gb: number) => subscriptionApi.purchaseTraffic(gb, subscriptionId, scope),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['traffic-packages', subscriptionId, scope] });
      showSuccess({
        type: 'traffic_purchased',
        amountKopeks: data.amount_paid_kopeks,
        trafficGbAdded: data.gb_added,
        message: `${scope === 'whitelist' ? whiteInternetLabel : primaryTrafficLabel}: +${data.gb_added} ${t('common.units.gb')}`,
      });
      onClose();
      onSelectedTrafficPackageChange(null);
    },
  });

  if (!open) {
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
            {(subscription.whitelist_traffic_limit_gb ?? 0) > 0 && (
              <div className="mt-1 text-xs text-accent-400">
                {`${whiteInternetBarLabel}: ${subscription.whitelist_traffic_used_gb?.toFixed(1) ?? '0.0'} / ${subscription.whitelist_traffic_limit_gb} ${t('common.units.gb')} — ${whiteInternetDescription}`}
              </div>
            )}
          </div>
          <ChevronRightIcon className="text-dark-400" />
        </div>
      </button>
    );
  }

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
        <div className="text-sm font-medium text-dark-100">
          {scope === 'regular' ? primaryTrafficLabel : whiteInternetLabel}
        </div>
        <div className="mt-1 text-xs text-dark-400">
          {scope === 'regular'
            ? `${subscription.traffic_used_gb.toFixed(1)} / ${subscription.traffic_limit_gb} ${t('common.units.gb')} — ${primaryTrafficDescription}`
            : `${whiteInternetBarLabel}: ${subscription.whitelist_traffic_used_gb?.toFixed(1) ?? '0.0'} / ${subscription.whitelist_traffic_limit_gb ?? 0} ${t('common.units.gb')} — ${whiteInternetDescription}`}
        </div>
      </div>

      {(subscription.whitelist_traffic_limit_gb ?? 0) > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-dark-950/40 p-1">
          {(['regular', 'whitelist'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setScope(value);
                onSelectedTrafficPackageChange(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                scope === value
                  ? 'bg-accent-500 text-on-accent'
                  : 'text-dark-400 hover:text-dark-100'
              }`}
            >
              {value === 'regular' ? t('subscription.vpnTraffic') : t('subscription.whiteInternet')}
            </button>
          ))}
        </div>
      )}

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
                    ? '♾️ ' + t('subscription.additionalOptions.unlimited')
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
                          date: new Date(pkg.next_available_at).toLocaleDateString(),
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
                          scope,
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
                    ) : scope === 'whitelist' ? (
                      t('subscription.additionalOptions.buyWhitelistTrafficGb', {
                        gb: selectedTrafficPackage,
                      })
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
