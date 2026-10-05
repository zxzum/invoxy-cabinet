import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoyaltyTiersResponse } from '@/invoxystart/api';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { ChevronRight, Sparkles } from '@/invoxystart/components/ui/RuneIcon';

type Tier = LoyaltyTiersResponse['tiers'][number];
type Status = 'loading' | 'ready' | 'error';

const formatRubles = (amount: number) => `${amount.toLocaleString('ru-RU')} ₽`;

export function LoyaltyCard({
  loyalty,
  status,
  onRetry,
}: {
  loyalty: LoyaltyTiersResponse | null;
  status: Status;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const baseTier: Tier = {
    id: 0,
    name: 'Invoxy Base',
    threshold_rubles: 0,
    server_discount_percent: 0,
    traffic_discount_percent: 0,
    device_discount_percent: 0,
    period_discounts: {},
    is_current: !loyalty?.current_tier_name,
    is_achieved: true,
  };
  const tiers = loyalty ? [baseTier, ...loyalty.tiers] : [baseTier];
  const current = tiers.find((tier) => tier.is_current) ?? baseTier;
  const discount = current.period_discounts['30'] ?? 0;
  const remaining =
    loyalty?.next_tier_threshold_rubles == null
      ? null
      : Math.max(0, loyalty.next_tier_threshold_rubles - loyalty.current_spent_rubles);
  const progress = Math.min(100, Math.max(0, loyalty?.progress_percent ?? 0));

  function discountsFor(tier: Tier) {
    return [
      ...Object.entries(tier.period_discounts)
        .filter(([, percent]) => percent > 0)
        .sort(([daysA], [daysB]) => Number(daysA) - Number(daysB))
        .map(([days, percent]) => ({
          label: t('subscription.promoGroup.periodDiscount', { days }),
          percent,
        })),
      ...(
        [
          ['server_discount_percent', 'serverDiscount'],
          ['traffic_discount_percent', 'trafficDiscount'],
          ['device_discount_percent', 'deviceDiscount'],
        ] as const
      )
        .filter(([key]) => tier[key] > 0)
        .map(([key, label]) => ({
          label: t(`subscription.promoGroup.${label}`),
          percent: tier[key],
        })),
    ];
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="glass-panel motion-card group flex w-full flex-col gap-3 rounded-[26px] border-mint/20 bg-[radial-gradient(circle_at_90%_10%,rgba(165,232,196,.12),transparent_48%)] p-5 text-left transition-colors hover:border-mint/40"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-mint">
          <Sparkles size={16} /> {t('invoxy.profile.loyaltyProgram')}
        </span>
        <span className="flex items-end justify-between gap-3">
          <strong className="min-w-0 text-xl font-bold tracking-tight text-ink">
            {status === 'ready' ? current.name : t('invoxy.profile.loyaltyFallback')}
          </strong>
          {status === 'ready' && discount > 0 && (
            <strong className="shrink-0 text-3xl font-semibold leading-none tracking-tight text-mint">
              {discount}%
            </strong>
          )}
        </span>
        {status === 'ready' && loyalty ? (
          <>
            <span className="text-sm leading-relaxed text-muted">
              {t('invoxy.profile.loyaltySpent', {
                amount: formatRubles(loyalty.current_spent_rubles),
              })}
            </span>
            {loyalty.tiers.length === 0 ? (
              <span className="text-sm text-muted">{t('subscription.promoGroup.empty')}</span>
            ) : remaining !== null && loyalty.next_tier_name ? (
              <>
                <span className="text-sm leading-relaxed text-ink">
                  {t('invoxy.profile.loyaltyNext', {
                    name: loyalty.next_tier_name,
                    amount: formatRubles(remaining),
                  })}
                </span>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-mint"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </>
            ) : (
              <span className="text-sm text-mint">{t('invoxy.tariffs.loyaltyMax')}</span>
            )}
          </>
        ) : (
          <span className="text-sm leading-relaxed text-muted">
            {t(
              status === 'error'
                ? 'subscription.promoGroup.error'
                : 'invoxy.profile.loyaltyLoading',
            )}
          </span>
        )}
        <span className="flex min-h-11 items-center gap-1 text-sm font-semibold text-mint">
          {t('invoxy.profile.loyaltyDetails')}
          <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
        </span>
      </button>

      <AdaptiveDialog
        open={open}
        onClose={() => setOpen(false)}
        titleId="loyalty-details-title"
        maxWidth="max-w-3xl"
      >
        <div className="pr-12">
          <h2 id="loyalty-details-title" className="text-2xl font-semibold text-ink">
            {t('subscription.promoGroup.tiersTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('invoxy.profile.loyaltyRule')}
          </p>
        </div>

        {status === 'loading' && (
          <p className="mt-6 text-sm text-muted">{t('invoxy.profile.loyaltyLoading')}</p>
        )}
        {status === 'error' && (
          <div className="mt-6 rounded-2xl border border-white/10 p-4" role="alert">
            <p className="text-sm text-muted">{t('subscription.promoGroup.error')}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 min-h-11 text-sm font-semibold text-mint"
            >
              {t('invoxy.profile.loyaltyRetry')}
            </button>
          </div>
        )}
        {status === 'ready' && loyalty && (
          <>
            <div className="mt-6 rounded-2xl border border-mint/20 bg-mint/[.06] p-4">
              <div className="flex flex-wrap justify-between gap-3 text-sm">
                <span className="text-muted">{t('invoxy.profile.loyaltySpentLabel')}</span>
                <strong className="text-ink">{formatRubles(loyalty.current_spent_rubles)}</strong>
              </div>
              <p className="mt-3 text-sm text-ink">
                {remaining !== null && loyalty.next_tier_name
                  ? t('invoxy.profile.loyaltyNext', {
                      name: loyalty.next_tier_name,
                      amount: formatRubles(remaining),
                    })
                  : t('invoxy.tariffs.loyaltyMax')}
              </p>
              {remaining !== null && (
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-label={t('subscription.promoGroup.yourProgress')}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div className="h-full rounded-full bg-mint" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>

            {loyalty.tiers.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tiers.map((tier) => {
                  const discounts = discountsFor(tier);
                  return (
                    <article
                      key={tier.id}
                      className={`rounded-2xl border p-4 ${tier.is_current ? 'border-mint/50 bg-mint/[.08]' : 'border-white/10 bg-white/[.03]'}`}
                    >
                      <span className="text-xs font-semibold text-mint">
                        {t(
                          tier.is_current
                            ? 'subscription.promoGroup.statusCurrent'
                            : tier.is_achieved
                              ? 'subscription.promoGroup.statusAchieved'
                              : 'subscription.promoGroup.statusLocked',
                        )}
                      </span>
                      <h3 className="mt-2 text-base font-semibold text-ink">{tier.name}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {t('subscription.promoGroup.threshold')}:{' '}
                        {formatRubles(tier.threshold_rubles)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {discounts.length ? (
                          discounts.map(({ label, percent }) => (
                            <span
                              key={`${tier.id}-${label}`}
                              className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-ink"
                            >
                              {label}: −{percent}%
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted">
                            {t('subscription.promoGroup.noDiscounts')}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">{t('subscription.promoGroup.empty')}</p>
            )}
          </>
        )}
      </AdaptiveDialog>
    </>
  );
}
