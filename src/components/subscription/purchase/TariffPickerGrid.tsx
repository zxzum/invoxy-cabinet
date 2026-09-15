import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BestValueBadge } from '../BestValueBadge';
import { useNavigate } from 'react-router';
import { staggerEntrance } from '@/components/motion';
import { useTheme } from '../../../hooks/useTheme';
import { useCurrency } from '../../../hooks/useCurrency';
import { usePromoDiscount } from '../../../hooks/usePromoDiscount';
import { dailyPriceQuote } from './dailyPrice';
import { getGlassColors } from '../../../utils/glassTheme';
import { ArrowDownIcon, DevicesIcon, InfoIcon, RestartIcon } from '@/components/icons';
import { FeatureBadge } from '@/components/ui/FeatureBadge';
import type { LoyaltyTierInfo, LoyaltyTiersResponse } from '../../../api/promo';
import type { Tariff, Subscription, PurchaseOptions } from '../../../types';
import { getTariffCustomerFacingName, getTariffMarketingDescription } from './tariffPresentation';
import { PromoTierSheet } from './PromoTierSheet';

// ──────────────────────────────────────────────────────────────────
// TariffPickerGrid
//
// The tariff selection surface inside SubscriptionPurchase. Renders:
//   - an optional promo-group banner when any tariff carries a
//     promo_group_name
//   - the "all tariffs purchased" empty state (multi-tariff mode)
//   - the grid itself (1 col mobile, 2 cols sm, 3 cols xl) with promo prices,
//     per-tariff CTAs differentiated by user state (extend / switch /
//     purchase / legacy renewal)
//
// Owns nothing — pure presentation that calls back into the parent
// for selection (`onSelectTariff`) and switch (`onSwitchTariff`).
// ──────────────────────────────────────────────────────────────────

export interface TariffPickerGridProps {
  tariffs: Tariff[];
  subscription: Subscription | null;
  purchaseOptions: PurchaseOptions | undefined;
  isTariffsMode: boolean;
  isMultiTariff: boolean;
  loyaltyTiers?: LoyaltyTiersResponse | null;
  onSelectTariff: (tariff: Tariff) => void;
  onSwitchTariff: (tariffId: number) => void;
}

export function TariffPickerGrid({
  tariffs,
  subscription,
  purchaseOptions,
  isTariffsMode,
  isMultiTariff,
  loyaltyTiers,
  onSelectTariff,
  onSwitchTariff,
}: TariffPickerGridProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);
  const { formatAmount, currencySymbol } = useCurrency();
  const { applyPromoDiscount } = usePromoDiscount();
  const [isPromoTierSheetOpen, setIsPromoTierSheetOpen] = useState(false);
  const usableTariffs = tariffs.filter((tariff) => {
    const dailyPrice = tariff.daily_price_kopeks ?? tariff.price_per_day_kopeks;
    return (
      tariff.periods.some(
        (period) =>
          typeof period.price_kopeks === 'number' &&
          Number.isInteger(period.days) &&
          period.days > 0 &&
          Number.isInteger(period.price_kopeks) &&
          Number.isFinite(period.price_kopeks) &&
          period.price_kopeks > 0,
      ) ||
      (typeof dailyPrice === 'number' &&
        Number.isInteger(dailyPrice) &&
        Number.isFinite(dailyPrice) &&
        dailyPrice > 0)
    );
  });
  if (isTariffsMode && usableTariffs.length === 0) {
    return (
      <div className="glass-surface p-6 text-center">
        <p className="text-dark-300">
          {t('subscription.noOptionsAvailable', 'Нет доступных вариантов подписки')}
        </p>
      </div>
    );
  }

  const visibleTariffs = isTariffsMode ? usableTariffs : tariffs;
  const currentPromoGroupName = visibleTariffs.find(
    (tariff) => tariff.promo_group_name,
  )?.promo_group_name;
  const basicTier: LoyaltyTierInfo = {
    id: 0,
    name: t('subscription.promoGroup.basicName'),
    threshold_rubles: 0,
    server_discount_percent: 0,
    traffic_discount_percent: 0,
    device_discount_percent: 0,
    period_discounts: {},
    is_current: !loyaltyTiers?.current_tier_name,
    is_achieved: true,
  };
  const loyaltyTierBoxes = loyaltyTiers ? [basicTier, ...(loyaltyTiers.tiers ?? [])] : [];
  const hasLoyaltyProgress = Boolean(
    loyaltyTiers &&
      (loyaltyTierBoxes.length > 1 ||
        loyaltyTiers.current_tier_name ||
        loyaltyTiers.next_tier_name),
  );
  const promoGroupName = loyaltyTiers?.current_tier_name ?? currentPromoGroupName ?? basicTier.name;
  const progressPercent = loyaltyTiers
    ? Math.min(100, Math.max(0, Number(loyaltyTiers.progress_percent) || 0))
    : 0;
  const remainingToNextTier =
    loyaltyTiers?.next_tier_threshold_rubles == null
      ? null
      : Math.max(0, loyaltyTiers.next_tier_threshold_rubles - loyaltyTiers.current_spent_rubles);
  const whiteInternetLabel = t('subscription.whiteInternet');

  const formatPrice = (kopeks: number) =>
    kopeks === 0
      ? t('subscription.free', 'Бесплатно')
      : `${formatAmount(kopeks / 100)} ${currencySymbol}`;

  const formatRubles = (rubles: number) => `${formatAmount(rubles, 0)} ${currencySymbol}`;

  const tierMaxDiscount = (tier: LoyaltyTierInfo) => {
    const discounts = [
      tier.server_discount_percent,
      tier.traffic_discount_percent,
      tier.device_discount_percent,
      ...Object.values(tier.period_discounts ?? {}),
    ].filter((percent): percent is number => Number.isFinite(percent) && percent > 0);
    return discounts.length > 0
      ? `-${Math.max(...discounts)}%`
      : t('subscription.promoGroup.noDiscounts');
  };

  const tierStatusLabel = (tier: LoyaltyTierInfo) => {
    if (tier.is_current) return t('subscription.promoGroup.statusCurrent');
    if (tier.is_achieved) return t('subscription.promoGroup.statusAchieved');
    return t('subscription.promoGroup.statusLocked');
  };
  const currentTier = loyaltyTierBoxes.find((tier) => tier.is_current);
  const currentTierDiscount = currentTier ? tierMaxDiscount(currentTier) : null;
  const noDiscountsLabel = t('subscription.promoGroup.noDiscounts');
  const currentDiscountText = currentTierDiscount?.replace(/^-/, '');

  return (
    <>
      {/* Promo group progress. The compact banner remains the loading/fallback state. */}
      {hasLoyaltyProgress ? (
        <section
          className="ix-promo-group glass-panel motion-card relative mb-5 overflow-hidden rounded-[30px] p-4 sm:p-6 lg:p-8"
          aria-labelledby="promo-progress-title"
        >
          <img
            src="/images/promo-group-bg.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950/90 via-dark-950/75 to-dark-950/45" />
          <button
            type="button"
            aria-expanded={isPromoTierSheetOpen}
            aria-label={t('subscription.promoGroup.aboutGroups', 'Что это за группа?')}
            onClick={() => setIsPromoTierSheetOpen(true)}
            className="absolute right-3 top-3 z-20 rounded-lg p-2 text-success-400 transition-colors hover:bg-success-500/20 sm:right-5 sm:top-5"
          >
            <InfoIcon className="h-5 w-5" />
          </button>
          <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,.85fr)_minmax(360px,1.15fr)] lg:items-center lg:gap-10">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.16em] text-success-400">
                {t('subscription.promoGroup.title', 'ПРОМО-ГРУППА')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 pr-8">
                <h2
                  id="promo-progress-title"
                  className="truncate text-2xl font-medium text-dark-50"
                >
                  {promoGroupName}
                  {currentDiscountText && currentTierDiscount !== noDiscountsLabel
                    ? ` · скидка ${currentDiscountText}`
                    : ''}
                </h2>
                <span className="rounded-full bg-success-400 px-3 py-1 text-[10px] font-bold text-dark-950">
                  {t('subscription.promoGroup.statusCurrent')}
                </span>
              </div>
              <p className="mt-2 text-sm text-dark-300">
                {t('subscription.promoGroup.totalSpent')}:{' '}
                {formatRubles(loyaltyTiers?.current_spent_rubles ?? 0)}
                {' · '}
                {remainingToNextTier != null && loyaltyTiers?.next_tier_name
                  ? `${t('subscription.promoGroup.toNextStatus')}: ${formatRubles(remainingToNextTier)}`
                  : t('subscription.promoGroup.allStatusesAchieved')}
              </p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 text-xs text-dark-300">
                <span className="truncate">
                  {loyaltyTiers?.next_tier_name
                    ? `${t('subscription.promoGroup.progressTo', 'Прогресс до')} ${loyaltyTiers.next_tier_name}`
                    : t('subscription.promoGroup.allStatusesAchieved')}
                </span>
                <strong className="shrink-0 text-success-400">{progressPercent.toFixed(0)}%</strong>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label={t('subscription.promoGroup.yourProgress')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercent}
              >
                <div
                  className="h-full rounded-full bg-success-400 transition-[width] duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 sm:gap-2" role="list">
                {loyaltyTierBoxes.map((tier) => (
                  <div
                    key={tier.id}
                    role="listitem"
                    className={`min-w-0 rounded-xl border p-2 sm:rounded-2xl sm:p-3 ${
                      tier.is_current
                        ? 'border-success-400/40 bg-success-400/10'
                        : tier.is_achieved
                          ? 'border-success-400/20 bg-success-400/5'
                          : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <p
                      className={`truncate text-[10px] font-bold sm:text-xs ${
                        tier.is_current || tier.is_achieved ? 'text-success-400' : 'text-dark-400'
                      }`}
                      title={tier.name}
                    >
                      {tier.name} · {tierMaxDiscount(tier)}
                    </p>
                    <p className="mt-1 truncate text-[9px] text-dark-400 sm:text-[10px]">
                      {t('subscription.promoGroup.threshold')}:{' '}
                      {formatRubles(tier.threshold_rubles)}
                    </p>
                    <p className="mt-1 truncate text-[9px] text-dark-500 sm:text-[10px]">
                      {tierStatusLabel(tier)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        visibleTariffs.some((tariff) => tariff.promo_group_name) && (
          <div className="ix-promo-group glass-surface relative mb-5 overflow-hidden rounded-[30px] p-5 sm:p-7">
            <button
              type="button"
              aria-expanded={isPromoTierSheetOpen}
              onClick={() => setIsPromoTierSheetOpen(true)}
              className="flex w-full cursor-pointer items-center gap-3 pr-10 text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-500/20 text-success-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1 truncate text-sm font-medium text-success-400">
                {t('subscription.promoGroup.yourGroup', {
                  name: visibleTariffs.find((tariff) => tariff.promo_group_name)?.promo_group_name,
                })}
                <span className="font-normal text-dark-400">
                  {' · '}
                  {t('subscription.promoGroup.personalDiscountsApplied')}
                </span>
              </div>
            </button>
            <button
              type="button"
              aria-expanded={isPromoTierSheetOpen}
              aria-label={t('subscription.promoGroup.aboutGroups', 'Что это за группа?')}
              onClick={() => setIsPromoTierSheetOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-success-400 transition-colors hover:bg-success-500/20"
            >
              <InfoIcon className="h-5 w-5" />
            </button>
          </div>
        )
      )}

      {(currentPromoGroupName || hasLoyaltyProgress) && (
        <PromoTierSheet
          isOpen={isPromoTierSheetOpen}
          onClose={() => setIsPromoTierSheetOpen(false)}
          currentGroupName={currentPromoGroupName ?? loyaltyTiers?.current_tier_name}
        />
      )}

      {/* Tariff Grid */}
      {isMultiTariff &&
        purchaseOptions &&
        'all_tariffs_purchased' in purchaseOptions &&
        purchaseOptions.all_tariffs_purchased && (
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ background: g.cardBg, borderColor: g.cardBorder }}
          >
            <div className="mb-2 text-3xl">✅</div>
            <h3 className="mb-1 text-lg font-semibold" style={{ color: g.text }}>
              {t('subscription.allTariffsPurchased', 'Все тарифы подключены')}
            </h3>
            <p className="mb-4 text-sm" style={{ color: g.textSecondary }}>
              {t(
                'subscription.allTariffsPurchasedDesc',
                'Вы уже приобрели все доступные тарифы. Продлить подписку можно на странице тарифа.',
              )}
            </p>
            <button
              onClick={() => navigate('/subscriptions')}
              className="rounded-xl bg-accent-500 px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-600"
            >
              {t('subscription.backToList', 'Мои подписки')}
            </button>
          </div>
        )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[...visibleTariffs]
          .filter((tariff) => {
            // In multi-tariff mode: hide already purchased tariffs
            if (isMultiTariff && tariff.is_purchased) return false;
            if (subscription?.is_trial && tariff.name.toLowerCase().includes('trial')) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            const aIsCurrent = a.is_current || a.id === subscription?.tariff_id;
            const bIsCurrent = b.is_current || b.id === subscription?.tariff_id;
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            if (a.is_highlighted && !b.is_highlighted) return -1;
            if (!a.is_highlighted && b.is_highlighted) return 1;
            return 0;
          })
          .map((tariff, index) => {
            const isCurrentTariff = tariff.is_current || tariff.id === subscription?.tariff_id;
            const isSubscriptionExpired =
              isTariffsMode &&
              purchaseOptions &&
              'subscription_is_expired' in purchaseOptions &&
              purchaseOptions.subscription_is_expired === true;
            // Free (0₽) source tariff: the backend blocks the prorated switch
            // (free_tariff_cannot_switch) — offer the purchase flow instead.
            const isOnFreeTariff =
              isTariffsMode &&
              purchaseOptions &&
              'subscription_on_free_tariff' in purchaseOptions &&
              purchaseOptions.subscription_on_free_tariff === true;
            const canSwitch =
              !isMultiTariff &&
              subscription &&
              subscription.tariff_id &&
              !isCurrentTariff &&
              !subscription.is_trial &&
              !isSubscriptionExpired &&
              !isOnFreeTariff &&
              (subscription.is_active || subscription.is_limited);
            const isLegacySubscription =
              subscription && !subscription.is_trial && !subscription.tariff_id;
            const canOpenTariff = !(isCurrentTariff && subscription?.is_daily);
            const customerFacingName = getTariffCustomerFacingName(
              tariff.name,
              t('subscription.whiteInternet'),
            );
            const marketingDescription = getTariffMarketingDescription(
              tariff.description,
              t('subscription.whiteInternet'),
            );

            const openTariffAction = () => {
              if (!canOpenTariff) return;
              if (canSwitch) {
                onSwitchTariff(tariff.id);
              } else {
                onSelectTariff(tariff);
              }
            };

            return (
              // Stagger-вход карточек. CSS-вход bentoFadeIn на bento-card гасим
              // (animate-none), иначе двойная анимация (прецедент: Dashboard
              // wheel-banner). whileTap на обёртку не вешаем: у карточки уже
              // есть свой press через .bento-card-hover:active — было бы двойное
              // вжатие.
              <motion.div key={tariff.id} className="h-full" {...staggerEntrance(index, 0.1, 0.06)}>
                <div
                  data-tariff-card
                  role={canOpenTariff ? 'button' : undefined}
                  tabIndex={canOpenTariff ? 0 : undefined}
                  aria-label={canOpenTariff ? customerFacingName : undefined}
                  onClick={canOpenTariff ? openTariffAction : undefined}
                  onKeyDown={
                    canOpenTariff
                      ? (event) => {
                          if (
                            (event.key === 'Enter' || event.key === ' ') &&
                            event.target === event.currentTarget
                          ) {
                            event.preventDefault();
                            openTariffAction();
                          }
                        }
                      : undefined
                  }
                  className={`tariff-card animate-none h-full rounded-[30px] p-5 text-left transition-all ${
                    isCurrentTariff || tariff.is_highlighted
                      ? 'glass-surface-accent'
                      : 'glass-surface'
                  } bento-card-hover ${isCurrentTariff ? 'bento-card-glow' : ''} ${
                    isCurrentTariff ? 'border-accent-500' : ''
                  } ${
                    tariff.is_highlighted
                      ? 'border-2 border-violet-400/70 ring-2 ring-violet-400/25 shadow-[0_22px_50px_-24px_rgba(124,58,237,0.9)]'
                      : ''
                  }`}
                >
                  <div data-tariff-summary>
                    <div className="mb-2 h-6">
                      {tariff.is_highlighted && (
                        <BestValueBadge
                          variant="tariff"
                          label={t('subscription.recommendedTariff', 'Рекомендуемый тариф')}
                        />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-semibold text-dark-100">
                            {customerFacingName}
                          </span>
                          {(tariff.whitelist_traffic_limit_gb ?? 0) > 0 ? (
                            <span className="badge-success text-xs">{whiteInternetLabel}</span>
                          ) : (
                            <span className="badge-neutral text-xs">
                              {t('subscription.noLte', 'Без LTE')}
                            </span>
                          )}
                        </div>
                        {marketingDescription && (
                          <div className="tariff-description mt-1 max-w-prose whitespace-pre-line text-sm leading-5 text-dark-400">
                            {marketingDescription}
                          </div>
                        )}
                      </div>
                      {isCurrentTariff && (
                        <span className="badge-success shrink-0 text-xs">
                          {t('subscription.currentTariff')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    data-tariff-features
                    className="flex flex-wrap items-start content-start gap-2"
                  >
                    {(tariff.whitelist_traffic_limit_gb ?? 0) > 0 && (
                      <FeatureBadge icon={ArrowDownIcon} tone="warning">
                        {`${whiteInternetLabel} ${tariff.whitelist_traffic_limit_gb} ${t('common.units.gb')}`}
                      </FeatureBadge>
                    )}
                    <FeatureBadge icon={ArrowDownIcon} tone="info">
                      {tariff.traffic_limit_label}
                    </FeatureBadge>
                    <FeatureBadge icon={DevicesIcon} tone="success">
                      {tariff.device_limit === 0
                        ? '∞'
                        : t('subscription.devices', { count: tariff.device_limit })}
                    </FeatureBadge>
                    {tariff.traffic_reset_mode && tariff.traffic_reset_mode !== 'NO_RESET' && (
                      <FeatureBadge icon={RestartIcon} tone="warning">
                        {t(`subscription.trafficReset.${tariff.traffic_reset_mode}`)}
                      </FeatureBadge>
                    )}
                  </div>
                  {/* Price info */}
                  <div
                    data-tariff-price
                    className="border-t border-dark-700/50 pt-3 text-sm text-dark-400"
                  >
                    {(() => {
                      const dailyPrice = tariff.daily_price_kopeks ?? tariff.price_per_day_kopeks;
                      const promoDaily =
                        typeof dailyPrice === 'number' &&
                        Number.isInteger(dailyPrice) &&
                        Number.isFinite(dailyPrice) &&
                        dailyPrice > 0
                          ? dailyPriceQuote(tariff, applyPromoDiscount)
                          : null;
                      if (promoDaily) {
                        return (
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-accent-400">
                              {formatPrice(promoDaily.price)}
                            </span>
                            {promoDaily.original && promoDaily.original > promoDaily.price && (
                              <span className="text-xs text-dark-500 line-through">
                                {formatPrice(promoDaily.original)}
                              </span>
                            )}
                            <span>{t('subscription.tariff.perDay')}</span>
                            {promoDaily.percent && promoDaily.percent > 0 && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs ${
                                  promoDaily.isPromoGroup
                                    ? 'bg-success-500/20 text-success-400'
                                    : 'bg-warning-500/20 text-warning-400'
                                }`}
                              >
                                -{promoDaily.percent}%
                              </span>
                            )}
                          </span>
                        );
                      }
                      const firstPeriod = tariff.periods.find(
                        (period) =>
                          typeof period.price_kopeks === 'number' &&
                          Number.isInteger(period.days) &&
                          period.days > 0 &&
                          Number.isInteger(period.price_kopeks) &&
                          Number.isFinite(period.price_kopeks) &&
                          period.price_kopeks > 0,
                      );
                      if (firstPeriod) {
                        const promoPeriod = applyPromoDiscount(
                          firstPeriod.price_kopeks,
                          firstPeriod.original_price_kopeks,
                        );
                        return (
                          <span className="flex flex-wrap items-center gap-2">
                            <span>{t('subscription.from')}</span>
                            <span className="font-medium text-accent-400">
                              {formatPrice(promoPeriod.price)}
                            </span>
                            {promoPeriod.original && promoPeriod.original > promoPeriod.price && (
                              <span className="text-xs text-dark-500 line-through">
                                {formatPrice(promoPeriod.original)}
                              </span>
                            )}
                            {promoPeriod.percent && promoPeriod.percent > 0 && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs ${
                                  promoPeriod.isPromoGroup
                                    ? 'bg-success-500/20 text-success-400'
                                    : 'bg-warning-500/20 text-warning-400'
                                }`}
                              >
                                -{promoPeriod.percent}%
                              </span>
                            )}
                          </span>
                        );
                      }
                      return (
                        <span className="font-medium text-accent-400">
                          {t('subscription.tariff.flexiblePayment')}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div data-tariff-action className="flex gap-2">
                    {isCurrentTariff ? (
                      subscription?.is_daily ? (
                        <div className="flex-1 py-2 text-center text-sm text-dark-500">
                          {t('subscription.currentTariff')}
                        </div>
                      ) : (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectTariff(tariff);
                          }}
                          className="btn-primary flex-1 py-2 text-sm"
                        >
                          {t('subscription.extend')}
                        </button>
                      )
                    ) : isLegacySubscription ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectTariff(tariff);
                        }}
                        className="btn-primary flex-1 py-2 text-sm"
                      >
                        {t('subscription.tariff.selectForRenewal')}
                      </button>
                    ) : canSwitch ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSwitchTariff(tariff.id);
                        }}
                        className="btn-secondary flex-1 py-2 text-sm"
                      >
                        {t('subscription.switchTariff.switch')}
                      </button>
                    ) : (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectTariff(tariff);
                        }}
                        className="btn-primary flex-1 py-2 text-sm"
                      >
                        {t('subscription.purchase')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>
    </>
  );
}
