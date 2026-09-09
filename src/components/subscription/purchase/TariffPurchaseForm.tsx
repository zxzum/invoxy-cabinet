import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { subscriptionApi } from '../../../api/subscription';
import { getErrorMessage, getInsufficientBalanceError } from '../../../utils/subscriptionHelpers';
import { useCurrency } from '../../../hooks/useCurrency';
import { usePromoDiscount, type PromoDiscountResult } from '../../../hooks/usePromoDiscount';
import { useSuccessNotification } from '../../../store/successNotification';
import { dailyPriceQuote } from './dailyPrice';
import { usePlatform } from '../../../platform';
import { openPaymentUrl } from '../../../utils/openPaymentUrl';
import { getMonthlyPriceKopeks } from '../../../utils/pricing';
import InsufficientBalancePrompt from '../../InsufficientBalancePrompt';
import { TariffPaymentSheet } from '../../payment/TariffPaymentSheet';
import type { Tariff, TariffPeriod } from '../../../types';
import { getTariffCustomerFacingName, getTariffMarketingDescription } from './tariffPresentation';
import { BestValueBadge } from '../BestValueBadge';

// ──────────────────────────────────────────────────────────────────
// TariffPurchaseForm
//
// The full per-tariff purchase form: period picker (or daily-tariff
// activate), custom-days toggle + slider, custom-traffic toggle +
// slider, summary, and the confirm CTA. Self-owns:
//   - the purchaseTariff mutation
//   - the auto-scroll-into-view ref + effect on mount
//   - selectedTariffPeriod / customDays / customTrafficGb /
//     useCustomDays / useCustomTraffic (form-internal state, reset
//     by re-mount when the parent passes a new `tariff` via key=)
//
// The parent (SubscriptionPurchase) supplies the chosen tariff,
// the current balance (for inline insufficient-balance prompts),
// the subscription id (for the renew-this-subscription flow), and
// onBack to clear its own selection state.
// ──────────────────────────────────────────────────────────────────

export interface TariffPurchaseFormProps {
  tariff: Tariff;
  subscriptionId: number | undefined;
  balanceKopeks: number | undefined;
  /** СБП-оформление (Platega recurrent) доступно — показать вторую CTA. */
  sbpPurchaseEnabled?: boolean;
  /** Оформление привязкой Lava доступно — показать вторую CTA. */
  lavaPurchaseEnabled?: boolean;
  /** Render the form body inside a parent sheet without a second header. */
  showHeader?: boolean;
  onBack: () => void;
}

interface PaymentSelection {
  periodDays: number;
  trafficGb?: number;
  priceKopeks: number;
}

export function TariffPurchaseForm({
  tariff,
  subscriptionId,
  balanceKopeks,
  sbpPurchaseEnabled = false,
  lavaPurchaseEnabled = false,
  showHeader = true,
  onBack,
}: TariffPurchaseFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatAmount, currencySymbol } = useCurrency();
  const { applyPromoDiscount } = usePromoDiscount();
  const showSuccess = useSuccessNotification((state) => state.show);
  // Та же котировка, что на карточке тарифа: серверная цена + промокод один раз.
  const dailyQuote = dailyPriceQuote(tariff, applyPromoDiscount);
  const { openLink, platform } = usePlatform();
  const ref = useRef<HTMLDivElement>(null);
  const isEmbedded = !showHeader;
  const whiteInternetLabel = t('subscription.whiteInternet');
  const primaryTrafficLabel = t('subscription.primaryTraffic', 'Основной трафик');
  const primaryTrafficDescription = t(
    'subscription.primaryTrafficDescription',
    'общий интернет через VPN',
  );
  const whiteInternetDescription = t(
    'subscription.whiteInternetDescription',
    'отдельная квота для Белого интернета',
  );
  const additionalDeviceLabel = t('subscription.additionalDevice', 'Доп. устройство');
  const customerFacingName = getTariffCustomerFacingName(tariff.name, whiteInternetLabel);
  const marketingDescription = getTariffMarketingDescription(
    tariff.description,
    whiteInternetLabel,
  );

  const formatPrice = (kopeks: number) =>
    kopeks === 0
      ? t('subscription.free', 'Бесплатно')
      : `${formatAmount(kopeks / 100)} ${currencySymbol}`;

  // Скидка за длинный период зашита в цену (3/6/12 мес дешевле помесячной
  // базы), но original_price_kopeks бэк шлёт только при скидке промо-группы.
  // Исходную цену считаем от помесячной базы самого короткого периода —
  // бейдж -X% и зачёркнутая цена появляются на всех периодах с реальной
  // скидкой, а не только на тех, где сработала промо-группа.
  const shortestPeriod = tariff.periods.reduce<TariffPeriod | undefined>(
    (min, period) => (min === undefined || period.days < min.days ? period : min),
    undefined,
  );
  const basePerMonthKopeks = shortestPeriod
    ? (shortestPeriod.original_price_kopeks ?? shortestPeriod.price_kopeks) /
      Math.max(1, shortestPeriod.months)
    : 0;

  const periodQuote = (period: TariffPeriod): PromoDiscountResult => {
    const serverOriginal =
      period.original_price_kopeks && period.original_price_kopeks > period.price_kopeks
        ? period.original_price_kopeks
        : 0;
    const baseTotal = Math.round(basePerMonthKopeks * Math.max(1, period.months));
    const volumeOriginal = baseTotal > period.price_kopeks ? baseTotal : 0;
    return applyPromoDiscount(
      period.price_kopeks,
      Math.max(serverOriginal, volumeOriginal) || undefined,
    );
  };
  const deviceUnit =
    tariff.device_limit > 0
      ? t('subscription.devices', { count: tariff.device_limit })
          .replace(String(tariff.device_limit), '')
          .trim()
      : '';
  const maxDeviceLimit = tariff.max_device_limit ?? tariff.device_limit;
  const deviceAddonLabel =
    tariff.device_price_kopeks != null && tariff.device_price_kopeks > 0
      ? `${additionalDeviceLabel} ${t('subscription.from', 'от')} ${formatPrice(tariff.device_price_kopeks)}${t('subscription.perMonth', '/мес')}${maxDeviceLimit > 0 ? `, ${t('subscription.additionalOptions.maxDevices', { count: maxDeviceLimit })} ${deviceUnit}` : ''}`
      : null;

  const openBalanceTopUp = (missingKopeks: number) => {
    const params = new URLSearchParams({
      amount: String(Math.ceil(missingKopeks / 100)),
      returnTo: '/subscription/purchase',
    });
    navigate(`/balance/top-up?${params.toString()}`);
  };

  // Form-internal state — seeded from the tariff prop. Resets via
  // `key={tariff.id}` on the parent's render.
  const [selectedTariffPeriod, setSelectedTariffPeriod] = useState<TariffPeriod | null>(
    tariff.periods[0] || null,
  );
  const [customDays, setCustomDays] = useState<number>(30);
  const [customTrafficGb, setCustomTrafficGb] = useState<number>(50);
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [useCustomTraffic, setUseCustomTraffic] = useState(false);
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection | null>(null);

  const purchaseMutation = useMutation({
    mutationFn: () => {
      const isDailyTariff =
        tariff.is_daily || (tariff.daily_price_kopeks && tariff.daily_price_kopeks > 0);
      const days = isDailyTariff
        ? 1
        : useCustomDays
          ? customDays
          : selectedTariffPeriod?.days || 30;
      const trafficGb =
        useCustomTraffic && tariff.custom_traffic_enabled ? customTrafficGb : undefined;
      // Forward the subscription_id when the user landed here via the
      // "Renew this subscription" flow (?subscriptionId=N). The backend
      // uses it to resolve the exact target row by ID, avoiding the
      // race with concurrent panel webhooks that would otherwise hit
      // the partial UNIQUE on uq_subscriptions_user_tariff_active.
      return subscriptionApi.purchaseTariff(
        tariff.id,
        days,
        trafficGb,
        subscriptionId ?? undefined,
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      showSuccess({
        type: subscriptionId ? 'subscription_renewed' : 'subscription_purchased',
        tariffName: data.tariff_name,
        expiresAt: data.subscription.end_date,
      });
      navigate('/subscriptions', { replace: true });
    },
  });

  // СБП-оформление: первое списание = подтверждение привязки в банке; период
  // на форме не участвует — списания идут по каденс-правилу тарифа.
  const sbpPurchaseMutation = useMutation({
    mutationFn: () => subscriptionApi.purchaseWithSbpRecurring(tariff.id),
    onSuccess: (data) => {
      if (data.redirect_url) {
        openPaymentUrl(data.redirect_url, platform, openLink);
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['sbp-recurring', data.subscription_id] });
      navigate('/subscriptions', { replace: true });
    },
  });

  const sbpPurchaseButton = sbpPurchaseEnabled && (
    <>
      <button
        onClick={() => sbpPurchaseMutation.mutate()}
        disabled={sbpPurchaseMutation.isPending || purchaseMutation.isPending}
        className="mt-2 w-full rounded-xl border border-accent-500/40 bg-accent-500/10 py-3 text-sm font-medium text-accent-400 transition-colors hover:bg-accent-500/20 disabled:opacity-50"
      >
        {sbpPurchaseMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('common.loading')}
          </span>
        ) : (
          t('subscription.sbpRecurring.purchaseButton')
        )}
      </button>
      <div className="mt-1.5 text-center text-[11px] text-dark-500">
        {t('subscription.sbpRecurring.purchaseHint')}
      </div>
      {sbpPurchaseMutation.isError && (
        <div className="mt-2 text-center text-sm text-error-400">
          {getErrorMessage(sbpPurchaseMutation.error)}
        </div>
      )}
    </>
  );

  const lavaPurchaseMutation = useMutation({
    mutationFn: () => subscriptionApi.purchaseWithLavaRecurring(tariff.id),
    onSuccess: (data) => {
      if (data.redirect_url) {
        openPaymentUrl(data.redirect_url, platform, openLink);
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['lava-recurring', data.subscription_id] });
      navigate('/subscriptions', { replace: true });
    },
  });

  const lavaPurchaseButton = lavaPurchaseEnabled && (
    <>
      <button
        onClick={() => lavaPurchaseMutation.mutate()}
        disabled={lavaPurchaseMutation.isPending || purchaseMutation.isPending}
        className="mt-2 w-full rounded-xl border border-accent-500/40 bg-accent-500/10 py-3 text-sm font-medium text-accent-400 transition-colors hover:bg-accent-500/20 disabled:opacity-50"
      >
        {lavaPurchaseMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('common.loading')}
          </span>
        ) : (
          t('subscription.lavaRecurring.purchaseButton')
        )}
      </button>
      <div className="mt-1.5 text-center text-[11px] text-dark-500">
        {t('subscription.lavaRecurring.purchaseHint')}
      </div>
      {lavaPurchaseMutation.isError && (
        <div className="mt-2 text-center text-sm text-error-400">
          {getErrorMessage(lavaPurchaseMutation.error)}
        </div>
      )}
    </>
  );

  // Smooth scroll the form into view when first mounted.
  useEffect(() => {
    if (!isEmbedded && ref.current) {
      const timer = setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEmbedded]);

  useEffect(() => {
    if (paymentSelection && !isEmbedded) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isEmbedded, paymentSelection]);

  if (paymentSelection) {
    return (
      <motion.div
        key="payment"
        ref={ref}
        initial={isEmbedded ? false : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: isEmbedded ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <TariffPaymentSheet
          open
          embedded
          onOpenChange={(open) => !open && setPaymentSelection(null)}
          tariffId={tariff.id}
          tariffName={customerFacingName}
          periodDays={paymentSelection.periodDays}
          trafficGb={paymentSelection.trafficGb}
          subscriptionId={subscriptionId}
          priceKopeks={paymentSelection.priceKopeks}
          balanceKopeks={balanceKopeks ?? 0}
          onPaid={() => {
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
            navigate('/subscriptions', { replace: true });
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="details"
      ref={ref}
      className="space-y-4"
      initial={isEmbedded ? false : { opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: isEmbedded ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {showHeader && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-lg font-medium text-dark-100">
            {customerFacingName}
          </h3>
          <button onClick={onBack} className="shrink-0 text-dark-400 hover:text-dark-200">
            ← {t('common.back')}
          </button>
        </div>
      )}

      {!isEmbedded && marketingDescription && (
        <p className="whitespace-pre-line text-sm leading-5 text-dark-400">
          {marketingDescription}
        </p>
      )}

      {/* Tariff Info */}
      {isEmbedded ? (
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-dark-200">
            <span>{`${primaryTrafficLabel}: ${tariff.traffic_limit_label}`}</span>
            <span>{`${t('subscription.devices')}: ${tariff.device_limit === 0 ? '∞' : tariff.device_limit}`}</span>
            {(tariff.whitelist_traffic_limit_gb ?? 0) > 0 && (
              <span>
                {`${whiteInternetLabel}: ${tariff.whitelist_traffic_limit_gb} ${t('common.units.gb')}`}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-dark-800/50 p-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="text-dark-200">
              {`${primaryTrafficLabel} ${tariff.traffic_limit_label} — ${primaryTrafficDescription}`}
            </div>
            <div className="text-dark-200">
              {`${t('subscription.devices')}: ${tariff.device_limit === 0 ? '∞' : tariff.device_limit}`}
              {tariff.extra_devices_count > 0 && (
                <span className="ml-1 text-xs text-accent-400">
                  (+{tariff.extra_devices_count})
                </span>
              )}
            </div>
            {deviceAddonLabel && <div className="text-dark-200">{deviceAddonLabel}</div>}
            {(tariff.whitelist_traffic_limit_gb ?? 0) > 0 && (
              <div className="text-dark-200">
                {`${whiteInternetLabel} ${tariff.whitelist_traffic_limit_gb} ${t('common.units.gb')} — ${whiteInternetDescription}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Tariff Purchase */}
      {tariff.is_daily || (tariff.daily_price_kopeks && tariff.daily_price_kopeks > 0) ? (
        <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-5">
          <div className="mb-4 text-center">
            <div className="mb-2 text-sm text-dark-400">
              {t('subscription.dailyPurchase.costPerDay')}
            </div>
            <div className="text-3xl font-bold text-accent-400">
              {formatPrice(dailyQuote?.price ?? 0)}
            </div>
            {dailyQuote?.original && dailyQuote.original > dailyQuote.price && (
              <div className="mt-1 flex items-center justify-center gap-2 text-sm">
                <span className="text-dark-500 line-through">
                  {formatPrice(dailyQuote.original)}
                </span>
                {dailyQuote.percent && dailyQuote.percent > 0 && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      dailyQuote.isPromoGroup
                        ? 'bg-success-500/20 text-success-400'
                        : 'bg-warning-500/20 text-warning-400'
                    }`}
                  >
                    -{dailyQuote.percent}%
                  </span>
                )}
              </div>
            )}
          </div>
          {!isEmbedded && (
            <div className="space-y-2 text-sm text-dark-400">
              <div className="flex items-start gap-2">
                <span className="text-accent-400">•</span>
                <span>{t('subscription.dailyPurchase.chargedDaily')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-400">•</span>
                <span>{t('subscription.dailyPurchase.canPause')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-400">•</span>
                <span>{t('subscription.dailyPurchase.pausedOnLowBalance')}</span>
              </div>
            </div>
          )}

          {(() => {
            const dailyPrice = dailyQuote?.price ?? 0;
            const hasEnoughBalance = balanceKopeks !== undefined && dailyPrice <= balanceKopeks;

            return (
              <div className="mt-6">
                {balanceKopeks !== undefined && !hasEnoughBalance && (
                  <InsufficientBalancePrompt
                    missingAmountKopeks={dailyPrice - balanceKopeks}
                    totalPriceKopeks={dailyPrice}
                    compact
                    className="mb-4"
                    hideActions
                  />
                )}

                {hasEnoughBalance ? (
                  <button
                    onClick={() => purchaseMutation.mutate()}
                    disabled={purchaseMutation.isPending}
                    className="btn-primary w-full py-3"
                  >
                    {purchaseMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {t('common.loading')}
                      </span>
                    ) : (
                      t('subscription.dailyPurchase.activate', {
                        price: formatPrice(dailyPrice),
                      })
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openBalanceTopUp(dailyPrice - (balanceKopeks ?? 0))}
                      className="btn-secondary min-h-12 px-3 text-sm"
                    >
                      {t('balance.topUpFirst')}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentSelection({ periodDays: 1, priceKopeks: dailyPrice })
                      }
                      className="btn-primary min-h-12 px-3 text-sm"
                    >
                      {t('balance.payDirect')}
                    </button>
                  </div>
                )}

                {sbpPurchaseButton}
                {lavaPurchaseButton}

                {purchaseMutation.isError &&
                  !getInsufficientBalanceError(purchaseMutation.error) && (
                    <div className="mt-3 text-center text-sm text-error-400">
                      {getErrorMessage(purchaseMutation.error)}
                    </div>
                  )}
                {purchaseMutation.isError &&
                  getInsufficientBalanceError(purchaseMutation.error) && (
                    <div className="mt-3">
                      <InsufficientBalancePrompt
                        missingAmountKopeks={
                          getInsufficientBalanceError(purchaseMutation.error)?.missingAmount ||
                          dailyPrice - (balanceKopeks || 0)
                        }
                        compact
                        hideActions
                      />
                    </div>
                  )}
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          {/* Period Selection for non-daily tariffs */}
          <div>
            <div className="mb-3 text-sm text-dark-400">{t('subscription.selectPeriod')}</div>

            {tariff.periods.length > 0 && !useCustomDays && (
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tariff.periods.map((period) => {
                  const promoPeriod = periodQuote(period);
                  const displayDiscount = promoPeriod.percent;
                  const displayOriginal = promoPeriod.original;
                  const displayPrice = promoPeriod.price;
                  const displayPerMonth = getMonthlyPriceKopeks(displayPrice, period.days);

                  return (
                    <button
                      key={period.days}
                      onClick={() => {
                        setSelectedTariffPeriod(period);
                        setUseCustomDays(false);
                      }}
                      className={`relative min-h-[76px] rounded-xl border px-3 py-2.5 text-left transition-all ${
                        selectedTariffPeriod?.days === period.days && !useCustomDays
                          ? 'border border-accent-500 bg-accent-500/10'
                          : period.is_highlighted
                            ? 'border-2 border-urgent-400 bg-dark-800/50'
                            : 'border border-dark-700/50 bg-dark-800/50 hover:border-dark-600'
                      }`}
                    >
                      {displayDiscount && displayDiscount > 0 && (
                        <div
                          className={`absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                            promoPeriod.isPromoGroup ? 'bg-success-500' : 'bg-warning-500'
                          }`}
                        >
                          -{displayDiscount}%
                        </div>
                      )}
                      <div className="text-sm font-semibold text-dark-100">{period.label}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-sm font-medium text-accent-400">
                          {formatPrice(displayPrice)}
                        </span>
                        {displayOriginal && displayOriginal > displayPrice && (
                          <span className="text-sm text-dark-500 line-through">
                            {formatPrice(displayOriginal)}
                          </span>
                        )}
                      </div>
                      {displayPerMonth !== null && (
                        <div className="mt-0.5 text-[11px] text-dark-500">
                          {formatPrice(displayPerMonth)}/{t('subscription.month')}
                        </div>
                      )}
                      {/* Под ценой, а не в углу: правый верхний угол занят скидкой. */}
                      {period.is_highlighted && <BestValueBadge className="mt-2" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* No periods available fallback */}
            {tariff.periods.length === 0 &&
              !useCustomDays &&
              !(tariff.custom_days_enabled && (tariff.price_per_day_kopeks ?? 0) > 0) && (
                <div className="rounded-xl border border-warning-500/30 bg-warning-500/10 p-4 text-center">
                  <div className="mb-2 text-sm font-medium text-warning-400">
                    {t('subscription.noPeriodsAvailable')}
                  </div>
                  <div className="text-xs text-dark-400">
                    {t('subscription.noPeriodsAvailableHint')}
                  </div>
                  <button onClick={onBack} className="btn-secondary mt-3 px-4 py-2 text-sm">
                    {t('subscription.chooseDifferentTariff')}
                  </button>
                </div>
              )}

            {/* Custom days option */}
            {tariff.custom_days_enabled && (tariff.price_per_day_kopeks ?? 0) > 0 && (
              <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-dark-200">
                    {t('subscription.customDays.title')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseCustomDays(!useCustomDays)}
                    role="switch"
                    aria-checked={useCustomDays}
                    aria-label={t('subscription.customDays.title')}
                    className={`relative h-6 w-10 rounded-full transition-colors ${
                      useCustomDays ? 'bg-accent-500' : 'bg-dark-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        useCustomDays ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                {useCustomDays && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={tariff.min_days ?? 1}
                        max={tariff.max_days ?? 365}
                        value={customDays}
                        onChange={(e) => setCustomDays(parseInt(e.target.value))}
                        className="flex-1 accent-accent-500"
                      />
                      <input
                        type="number"
                        value={customDays}
                        min={tariff.min_days ?? 1}
                        max={tariff.max_days ?? 365}
                        onChange={(e) =>
                          setCustomDays(
                            Math.max(
                              tariff.min_days ?? 1,
                              Math.min(
                                tariff.max_days ?? 365,
                                parseInt(e.target.value) || (tariff.min_days ?? 1),
                              ),
                            ),
                          )
                        }
                        className="w-20 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-center text-dark-100"
                      />
                    </div>
                    {(() => {
                      const basePrice = customDays * (tariff.price_per_day_kopeks ?? 0);
                      const existingOriginal =
                        tariff.original_price_per_day_kopeks &&
                        tariff.original_price_per_day_kopeks > (tariff.price_per_day_kopeks ?? 0)
                          ? customDays * tariff.original_price_per_day_kopeks
                          : undefined;
                      const promoCustom = applyPromoDiscount(basePrice, existingOriginal);
                      return (
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-400">
                            {t('subscription.days', { count: customDays })} ×{' '}
                            {formatPrice(tariff.price_per_day_kopeks ?? 0)}/
                            {t('subscription.customDays.perDay')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-accent-400">
                              {formatPrice(promoCustom.price)}
                            </span>
                            {promoCustom.original && promoCustom.original > promoCustom.price && (
                              <>
                                <span className="text-xs text-dark-500 line-through">
                                  {formatPrice(promoCustom.original)}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-xs ${
                                    promoCustom.isPromoGroup
                                      ? 'bg-success-500/20 text-success-400'
                                      : 'bg-warning-500/20 text-warning-400'
                                  }`}
                                >
                                  -{promoCustom.percent}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom traffic option */}
          {tariff.custom_traffic_enabled && (tariff.traffic_price_per_gb_kopeks ?? 0) > 0 && (
            <div>
              <div className="mb-3 text-sm text-dark-400">
                {t('subscription.customTraffic.label')}
              </div>
              <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-dark-200">
                    {t('subscription.customTraffic.selectVolume')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseCustomTraffic(!useCustomTraffic)}
                    role="switch"
                    aria-checked={useCustomTraffic}
                    aria-label={t('subscription.customTraffic.selectVolume')}
                    className={`relative h-6 w-10 rounded-full transition-colors ${
                      useCustomTraffic ? 'bg-accent-500' : 'bg-dark-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        useCustomTraffic ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                {!useCustomTraffic && (
                  <div className="text-sm text-dark-400">
                    {t('subscription.customTraffic.default', {
                      label: tariff.traffic_limit_label,
                    })}
                  </div>
                )}
                {useCustomTraffic && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={tariff.min_traffic_gb ?? 1}
                        max={tariff.max_traffic_gb ?? 1000}
                        value={customTrafficGb}
                        onChange={(e) => setCustomTrafficGb(parseInt(e.target.value))}
                        className="flex-1 accent-accent-500"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={customTrafficGb}
                          min={tariff.min_traffic_gb ?? 1}
                          max={tariff.max_traffic_gb ?? 1000}
                          onChange={(e) =>
                            setCustomTrafficGb(
                              Math.max(
                                tariff.min_traffic_gb ?? 1,
                                Math.min(
                                  tariff.max_traffic_gb ?? 1000,
                                  parseInt(e.target.value) || (tariff.min_traffic_gb ?? 1),
                                ),
                              ),
                            )
                          }
                          className="w-20 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-center text-dark-100"
                        />
                        <span className="text-dark-400">{t('common.units.gb')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">
                        {customTrafficGb} {t('common.units.gb')} ×{' '}
                        {formatPrice(tariff.traffic_price_per_gb_kopeks ?? 0)}/
                        {t('common.units.gb')}
                      </span>
                      <span className="font-medium text-accent-400">
                        +{formatPrice(customTrafficGb * (tariff.traffic_price_per_gb_kopeks ?? 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary & Purchase */}
          {(selectedTariffPeriod || useCustomDays) && (
            <div className="rounded-xl bg-dark-800/50 p-5">
              {(() => {
                const basePeriodPrice = useCustomDays
                  ? customDays * (tariff.price_per_day_kopeks ?? 0)
                  : selectedTariffPeriod?.price_kopeks || 0;
                const existingPeriodOriginal =
                  tariff.original_price_per_day_kopeks &&
                  tariff.original_price_per_day_kopeks > (tariff.price_per_day_kopeks ?? 0)
                    ? customDays * tariff.original_price_per_day_kopeks
                    : undefined;
                const promoPeriod =
                  useCustomDays || !selectedTariffPeriod
                    ? applyPromoDiscount(basePeriodPrice, existingPeriodOriginal)
                    : periodQuote(selectedTariffPeriod);

                const trafficPrice =
                  useCustomTraffic && tariff.custom_traffic_enabled
                    ? customTrafficGb * (tariff.traffic_price_per_gb_kopeks ?? 0)
                    : 0;

                const totalPrice = promoPeriod.price + trafficPrice;
                const originalTotal = promoPeriod.original
                  ? promoPeriod.original + trafficPrice
                  : null;

                return (
                  <>
                    <div className="mb-4 space-y-2">
                      {useCustomDays ? (
                        <div className="flex justify-between text-sm text-dark-300">
                          <span>
                            {t('subscription.stepPeriod')}:{' '}
                            {t('subscription.days', { count: customDays })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{formatPrice(promoPeriod.price)}</span>
                            {promoPeriod.original && promoPeriod.original > promoPeriod.price && (
                              <span className="text-xs text-dark-500 line-through">
                                {formatPrice(promoPeriod.original)}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        selectedTariffPeriod && (
                          <>
                            {(selectedTariffPeriod.extra_devices_count ?? 0) > 0 &&
                            selectedTariffPeriod.base_tariff_price_kopeks ? (
                              <>
                                <div className="flex justify-between text-sm text-dark-300">
                                  <span>
                                    {t('subscription.baseTariff')}: {selectedTariffPeriod.label}
                                  </span>
                                  <span>
                                    {formatPrice(selectedTariffPeriod.base_tariff_price_kopeks)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm text-dark-300">
                                  <span>
                                    {t('subscription.extraDevices')} (
                                    {selectedTariffPeriod.extra_devices_count})
                                  </span>
                                  <span>
                                    +
                                    {formatPrice(
                                      selectedTariffPeriod.extra_devices_cost_kopeks ?? 0,
                                    )}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between text-sm text-dark-300">
                                <span>
                                  {t('subscription.summary.period', {
                                    label: selectedTariffPeriod.label,
                                  })}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>{formatPrice(promoPeriod.price)}</span>
                                  {promoPeriod.original &&
                                    promoPeriod.original > promoPeriod.price && (
                                      <span className="text-xs text-dark-500 line-through">
                                        {formatPrice(promoPeriod.original)}
                                      </span>
                                    )}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      )}
                      {useCustomTraffic && tariff.custom_traffic_enabled && (
                        <div className="flex justify-between text-sm text-dark-300">
                          <span>{t('subscription.summary.traffic', { gb: customTrafficGb })}</span>
                          <span>+{formatPrice(trafficPrice)}</span>
                        </div>
                      )}
                    </div>

                    {promoPeriod.percent && (
                      <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-warning-500/30 bg-warning-500/10 p-2">
                        <span className="text-sm font-medium text-warning-400">
                          {t('promo.discountApplied')} -{promoPeriod.percent}%
                        </span>
                      </div>
                    )}

                    <div className="mb-4 flex items-center justify-between border-t border-dark-700/50 pt-2">
                      <span className="font-medium text-dark-100">{t('subscription.total')}</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-accent-400">
                          {formatPrice(totalPrice)}
                        </span>
                        {originalTotal && (
                          <div className="text-sm text-dark-500 line-through">
                            {formatPrice(originalTotal)}
                          </div>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const hasEnoughBalance =
                        balanceKopeks !== undefined && totalPrice <= balanceKopeks;
                      const missingKopeks = hasEnoughBalance
                        ? 0
                        : totalPrice - (balanceKopeks ?? 0);
                      const effectivePeriodDays = useCustomDays
                        ? customDays
                        : selectedTariffPeriod?.days || 30;
                      const effectiveTrafficGb =
                        useCustomTraffic && tariff.custom_traffic_enabled
                          ? customTrafficGb
                          : undefined;
                      return (
                        <>
                          {!hasEnoughBalance && balanceKopeks !== undefined && (
                            <InsufficientBalancePrompt
                              missingAmountKopeks={missingKopeks}
                              totalPriceKopeks={totalPrice}
                              compact
                              className="mb-4"
                              hideActions
                            />
                          )}
                          {hasEnoughBalance ? (
                            <button
                              onClick={() => purchaseMutation.mutate()}
                              disabled={purchaseMutation.isPending}
                              className="btn-primary w-full py-3"
                            >
                              {purchaseMutation.isPending ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  {t('common.loading')}
                                </span>
                              ) : (
                                t('subscription.purchase')
                              )}
                            </button>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => openBalanceTopUp(missingKopeks)}
                                className="btn-secondary min-h-12 px-3 text-sm"
                              >
                                {t('balance.topUpFirst')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPaymentSelection({
                                    periodDays: effectivePeriodDays,
                                    trafficGb: effectiveTrafficGb,
                                    priceKopeks: totalPrice,
                                  })
                                }
                                className="btn-primary min-h-12 px-3 text-sm"
                              >
                                {t('balance.payDirect')}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {sbpPurchaseButton}
                    {lavaPurchaseButton}
                  </>
                );
              })()}

              {purchaseMutation.isError && !getInsufficientBalanceError(purchaseMutation.error) && (
                <div className="mt-3 text-center text-sm text-error-400">
                  {getErrorMessage(purchaseMutation.error)}
                </div>
              )}
              {purchaseMutation.isError && getInsufficientBalanceError(purchaseMutation.error) && (
                <div className="mt-3">
                  <InsufficientBalancePrompt
                    missingAmountKopeks={
                      getInsufficientBalanceError(purchaseMutation.error)?.missingAmount || 0
                    }
                    totalPriceKopeks={
                      getInsufficientBalanceError(purchaseMutation.error)?.missingAmount || 0
                    }
                    compact
                    hideActions
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
