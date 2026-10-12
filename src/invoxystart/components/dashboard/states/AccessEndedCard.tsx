import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldCheck } from '@/invoxystart/components/ui/RuneIcon';
import { Button } from '@/invoxystart/components/ui/button';
import { subscriptionApi } from '@/invoxystart/api';
import { usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import type { AccountState } from '@/invoxystart/lib/accountState';
import { adaptPlan, orderPlans } from '@/invoxystart/lib/tariffPlans';
import { extractRenewalBreakdown } from '@/invoxystart/lib/renewalBreakdown';
import { PURCHASE_OPTIONS_QUERY_KEY } from '@/invoxystart/lib/useRenewalBreakdown';
import { getApiErrorMessage } from '@/utils/api-error';

const formatPrice = (price: number) => `${price.toLocaleString('ru-RU')} ₽`;

export function AccessEndedCard({
  state,
  tariffName,
  tariffId,
  endDate,
  subscriptionId,
}: {
  state: Extract<AccountState, 'trial_expired' | 'paid_expired' | 'disabled'>;
  tariffName?: string | null;
  tariffId?: number | null;
  endDate?: string;
  subscriptionId?: number | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openPayment } = usePayment();
  const [planId, setPlanId] = useState<string | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...PURCHASE_OPTIONS_QUERY_KEY, subscriptionId ?? null],
    queryFn: () => subscriptionApi.getPurchaseOptions(subscriptionId ?? undefined),
    enabled: state !== 'disabled',
    staleTime: 60_000,
  });
  const plans = orderPlans(
    Array.isArray(data?.tariffs)
      ? data.tariffs.map(adaptPlan).filter((plan) => plan.periods.length)
      : [],
    null,
  );
  const plan = plans.find((item) => item.id === planId) ?? plans[0];
  const period =
    plan?.periods.find((item) => item.days === days) ??
    [...(plan?.periods ?? [])].sort((a, b) => a.price - b.price || a.days - b.days)[0];
  const renewing = state === 'paid_expired' && plan?.id === String(tariffId);
  const details =
    renewing && period
      ? extractRenewalBreakdown(data, tariffId)?.periods.find((item) => item.days === period.days)
      : null;
  const amount = details?.total ?? period?.price ?? 0;
  const deviceCount = plan ? plan.devices + (renewing ? plan.extraDevicesCount : 0) : 0;
  const saving = period ? Math.max(0, period.basePrice - period.price) : 0;

  function checkout() {
    if (!plan || !period) return;
    openPayment({
      amount,
      purpose: t('invoxy.tariffs.purpose', { name: plan.name, months: period.months }),
      tariffId: Number(plan.id),
      periodDays: period.days,
      subscriptionId: subscriptionId ?? undefined,
      devices: renewing ? undefined : plan.devices,
    });
  }

  return (
    <section className="glass-panel motion-card relative overflow-hidden rounded-[28px] p-5 sm:p-6 xl:p-7">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] xl:gap-7">
        <div className="relative min-w-0">
          <div className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[.08] bg-white/[.03] text-mint xl:static xl:mb-5 xl:h-14 xl:w-14">
            <ShieldCheck size={28} strokeWidth={1.5} />
          </div>
          <p className="flex items-center gap-2 pr-14 text-[11px] font-semibold text-amber-200 xl:pr-0">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200" aria-hidden="true" />
            {t(`invoxy.ended.eyebrow.${state}`)}
          </p>
          <h2 className="mt-2 max-w-[20ch] pr-12 text-2xl font-medium leading-[1.15] tracking-[-.035em] [text-wrap:balance] xl:pr-0 xl:text-[28px]">
            {t(`invoxy.ended.title.${state}`)}
          </h2>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted [text-wrap:pretty]">
            {state === 'paid_expired' && tariffName
              ? t('invoxy.ended.paidSubtitle', { name: tariffName, date: endDate ?? '—' })
              : t(`invoxy.ended.subtitle.${state}`)}
          </p>
          {state !== 'disabled' && (
            <button
              type="button"
              onClick={() => navigate('/tariffs')}
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
            >
              {t('invoxy.ended.compareTariffs')} <ArrowRight size={14} />
            </button>
          )}
        </div>

        {state === 'disabled' ? (
          <div className="flex flex-col gap-3 self-center">
            <Button onClick={() => navigate('/support')}>{t('invoxy.ended.contactSupport')}</Button>
            <Button variant="ghost" onClick={() => navigate('/tariffs')}>
              {t('invoxy.ended.chooseTariff')}
            </Button>
          </div>
        ) : isLoading ? (
          <div
            role="status"
            aria-label={t('invoxy.tariffs.loading')}
            aria-busy="true"
            className="grid gap-3"
          >
            <div className="h-20 animate-pulse rounded-2xl bg-white/[.04]" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/[.04]" />
            <div className="h-12 animate-pulse rounded-full bg-white/[.04]" />
          </div>
        ) : error && !data ? (
          <div role="alert" className="self-center py-4">
            <p className="text-sm leading-relaxed text-muted">
              {getApiErrorMessage(error, t('invoxy.ended.loadError'))}
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
              {t('invoxy.ended.retry')}
            </Button>
          </div>
        ) : plan && period ? (
          <div className="min-w-0">
            <div
              role="group"
              aria-label={t('invoxy.ended.chooseTariff')}
              className="grid grid-cols-3 gap-2"
            >
              {plans.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === plan.id}
                  onClick={() => {
                    setPlanId(item.id);
                    setDays(null);
                  }}
                  className={`min-h-[76px] min-w-0 rounded-2xl border px-2 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 ${item.id === plan.id ? 'border-mint/50 bg-mint/[.08] text-ink' : 'border-white/[.07] text-muted hover:border-mint/25'}`}
                >
                  <span className="block break-words text-xs font-medium leading-snug">
                    {item.name}
                  </span>
                  <span
                    className={`mt-2 block text-sm font-semibold tabular-nums ${item.id === plan.id ? 'text-mint' : 'text-ink'}`}
                  >
                    {formatPrice(item.price)}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {plan.mainTraffic === 0
                ? t('subscription.unlimited')
                : t('invoxy.tariffs.traffic', { count: plan.mainTraffic })}
              {plan.lteTraffic ? ` · ${t('invoxy.ended.lte', { count: plan.lteTraffic })}` : ''}
              {' · '}
              {t('invoxy.ended.devices', { count: deviceCount })}
            </p>
            <div
              role="group"
              aria-label={t('invoxy.tariffs.term')}
              className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-white/[.03] p-1.5"
            >
              {plan.periods.map((item) => (
                <button
                  type="button"
                  key={item.days}
                  aria-pressed={item.days === period.days}
                  onClick={() => setDays(item.days)}
                  className={`min-h-12 min-w-0 rounded-xl px-1 py-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 ${item.days === period.days ? 'bg-ink font-semibold text-bg' : 'text-muted hover:text-ink'}`}
                >
                  <span className="block">
                    {t('invoxy.dashboard.periodDays', { count: item.days })}
                  </span>
                  {item.discount > 0 && (
                    <span
                      className={`mt-1 block text-[9px] leading-tight ${item.days === period.days ? 'text-bg/70' : 'text-mint'}`}
                    >
                      −{item.discount}%
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-4">
              <div aria-live="polite">
                <p className="text-[11px] text-muted">{t('invoxy.ended.total')}</p>
                <p className="mt-0.5 text-[28px] font-medium leading-tight tracking-tight text-ink tabular-nums">
                  {formatPrice(amount)}
                  {saving > 0 && (
                    <s className="ml-2 text-sm font-normal tracking-normal text-muted">
                      {formatPrice(amount + saving)}
                    </s>
                  )}
                </p>
              </div>
              <Button className="min-w-[150px] flex-1 sm:flex-none" onClick={checkout}>
                {t('invoxy.ended.checkout')} <ArrowRight size={16} />
              </Button>
            </div>
            {renewing && plan.extraDevicesCount > 0 && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {t('invoxy.ended.keptDevices', { count: plan.extraDevicesCount })}
              </p>
            )}
          </div>
        ) : (
          <div className="self-center py-4">
            <p className="text-sm text-muted">{t('invoxy.ended.noPlans')}</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/support')}>
              {t('invoxy.ended.contactSupport')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
