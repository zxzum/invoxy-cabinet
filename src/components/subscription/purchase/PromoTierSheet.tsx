import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { promoApi, type LoyaltyTierInfo } from '@/api/promo';
import { StarIcon } from '@/components/icons';
import { ResponsiveSheet } from '@/components/ui/ResponsiveSheet';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { uiLocale } from '@/utils/uiLocale';

interface PromoTierSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupName?: string | null;
}

function formatRubles(amount: number): string {
  return new Intl.NumberFormat(uiLocale(), {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function hasDiscounts(tier: LoyaltyTierInfo): boolean {
  return (
    tier.server_discount_percent > 0 ||
    tier.traffic_discount_percent > 0 ||
    tier.device_discount_percent > 0 ||
    Object.values(tier.period_discounts).some((percent) => percent > 0)
  );
}

export function PromoTierSheet({ isOpen, onClose, currentGroupName }: PromoTierSheetProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: promoApi.getLoyaltyTiers,
    enabled: isOpen,
    staleTime: 60_000,
  });

  const title = t('subscription.promoGroup.tiersTitle');
  const basicTier: LoyaltyTierInfo = {
    id: 0,
    name: t('subscription.promoGroup.basicName'),
    threshold_rubles: 0,
    server_discount_percent: 0,
    traffic_discount_percent: 0,
    device_discount_percent: 0,
    period_discounts: {},
    is_current: !data?.current_tier_name,
    is_achieved: true,
  };
  const tiers = data ? [basicTier, ...data.tiers] : [];
  const currentGroup = currentGroupName || data?.current_tier_name || basicTier.name;

  const statusLabel = (tier: LoyaltyTierInfo) => {
    if (tier.is_current) return t('subscription.promoGroup.statusCurrent');
    if (tier.is_achieved) return t('subscription.promoGroup.statusAchieved');
    return t('subscription.promoGroup.statusLocked');
  };

  const discountChips = (tier: LoyaltyTierInfo) => {
    const chips: Array<{ label: string; percent: number }> = [];
    if (tier.server_discount_percent > 0) {
      chips.push({
        label: t('subscription.promoGroup.serverDiscount'),
        percent: tier.server_discount_percent,
      });
    }
    if (tier.traffic_discount_percent > 0) {
      chips.push({
        label: t('subscription.promoGroup.trafficDiscount'),
        percent: tier.traffic_discount_percent,
      });
    }
    if (tier.device_discount_percent > 0) {
      chips.push({
        label: t('subscription.promoGroup.deviceDiscount'),
        percent: tier.device_discount_percent,
      });
    }
    return [
      ...chips,
      ...Object.entries(tier.period_discounts)
        .filter(([, percent]) => percent > 0)
        .map(([days, percent]) => ({
          label: t('subscription.promoGroup.periodDiscount', { days }),
          percent,
        })),
    ];
  };

  return (
    <ResponsiveSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      className="rounded-t-2xl rounded-b-none sm:rounded-2xl"
    >
      <div className="space-y-5 p-4 sm:p-6">
        {isLoading ? (
          <SkeletonGroup className="space-y-3">
            <Skeleton variant="card" className="h-28" />
            <Skeleton variant="card" count={3} className="h-32" />
          </SkeletonGroup>
        ) : isError ? (
          <div role="alert" className="alert-error p-4 text-sm">
            {t('subscription.promoGroup.error')}
          </div>
        ) : data ? (
          <>
            <section
              className="bento-card rounded-2xl p-4 sm:p-5"
              aria-labelledby="promo-progress-title"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 id="promo-progress-title" className="text-lg font-semibold text-dark-50">
                    {t('subscription.promoGroup.yourProgress')}
                  </h3>
                  <p className="mt-1 text-sm text-dark-400">
                    {t('subscription.promoGroup.currentGroup')}: {currentGroup}
                  </p>
                </div>
                <StarIcon className="shrink-0 text-accent-400" filled />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="card-inset rounded-xl min-w-0 p-3">
                  <div className="mb-1 text-xs text-dark-400">
                    {t('subscription.promoGroup.totalSpent')}
                  </div>
                  <div className="truncate text-base font-bold text-dark-50 sm:text-lg">
                    {formatRubles(data.current_spent_rubles)}
                  </div>
                </div>
                <div className="card-inset rounded-xl min-w-0 p-3">
                  <div className="mb-1 text-xs text-dark-400">
                    {t('subscription.promoGroup.currentStatus')}
                  </div>
                  <div className="truncate text-base font-bold text-accent-400 sm:text-lg">
                    {data.current_tier_name || basicTier.name}
                  </div>
                </div>
              </div>

              {data.next_tier_name && data.next_tier_threshold_rubles != null ? (
                <div className="mt-4">
                  <div className="mb-2 flex flex-col gap-1 text-xs text-dark-400 sm:flex-row sm:justify-between">
                    <span>
                      {t('subscription.promoGroup.nextStatus')}: {data.next_tier_name}
                    </span>
                    <span>
                      {t('subscription.promoGroup.toNextStatus')}:{' '}
                      {formatRubles(
                        Math.max(0, data.next_tier_threshold_rubles - data.current_spent_rubles),
                      )}
                    </span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-dark-700"
                    role="progressbar"
                    aria-label={t('subscription.promoGroup.yourProgress')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(100, Math.max(0, data.progress_percent))}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, data.progress_percent))}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-dark-400">
                    {data.progress_percent.toFixed(1)}%
                  </div>
                </div>
              ) : data.tiers.length > 0 ? (
                <div className="mt-4 text-center font-medium text-success-400">
                  {t('subscription.promoGroup.allStatusesAchieved')}
                </div>
              ) : null}
            </section>

            {data.tiers.length === 0 && (
              <p className="rounded-xl border border-dark-700/60 px-4 py-6 text-center text-sm text-dark-400">
                {t('subscription.promoGroup.empty')}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2" role="list">
              {tiers.map((tier) => {
                const chips = discountChips(tier);
                return (
                  <article
                    key={tier.id}
                    role="listitem"
                    className={`bento-card rounded-2xl p-4 ${
                      tier.is_current
                        ? 'bg-accent-500/5 ring-2 ring-accent-500/50'
                        : tier.is_achieved
                          ? 'bg-success-500/5'
                          : 'opacity-70'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            tier.is_current
                              ? 'bg-accent-500/20 text-accent-400'
                              : tier.is_achieved
                                ? 'bg-success-500/20 text-success-400'
                                : 'bg-dark-700 text-dark-400'
                          }`}
                        >
                          <StarIcon filled={tier.is_current} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate font-semibold text-dark-50">{tier.name}</h4>
                          <p className="text-xs text-dark-400">
                            {t('subscription.promoGroup.threshold')}:{' '}
                            {formatRubles(tier.threshold_rubles)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-dark-700 px-2 py-1 text-xs font-medium text-dark-300">
                        {statusLabel(tier)}
                      </span>
                    </div>

                    {hasDiscounts(tier) ? (
                      <div className="card-inset rounded-xl p-3">
                        <div className="mb-2 text-xs text-dark-400">
                          {t('subscription.promoGroup.discounts')}:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {chips.map((chip) => (
                            <span
                              key={`${tier.id}-${chip.label}`}
                              className="rounded-lg bg-dark-700 px-2 py-1 text-xs text-dark-200"
                            >
                              {chip.label}: -{chip.percent}%
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs italic text-dark-500">
                        {t('subscription.promoGroup.noDiscounts')}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </ResponsiveSheet>
  );
}
