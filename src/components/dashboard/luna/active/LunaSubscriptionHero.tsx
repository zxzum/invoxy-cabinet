import { ChevronRightIcon } from '@/components/icons';
import type { Subscription } from '@/types';
import { LunaEmptyState, LunaLoadingState } from './LunaSurfaceState';

export interface LunaSubscriptionHeroProps {
  subscription: Subscription | null;
  isLoading?: boolean;
  onManageSubscription?: () => void;
  formatDate?: (date: string) => string;
  loadingMessage?: string;
  emptyMessage?: string;
  manageLabel?: string;
  untilLabel?: string;
  daysLabel?: string;
  trialLabel?: string;
  paidLabel?: string;
}

export default function LunaSubscriptionHero({
  subscription,
  isLoading = false,
  onManageSubscription,
  formatDate = (date) => new Date(date).toLocaleDateString(),
  loadingMessage = 'Loading subscription',
  emptyMessage = 'Subscription unavailable',
  manageLabel = 'Manage subscription',
  untilLabel = 'Active until',
  daysLabel = 'days remaining',
  trialLabel = 'Trial subscription',
  paidLabel = 'Your subscription',
}: LunaSubscriptionHeroProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;
  if (!subscription) return <LunaEmptyState message={emptyMessage} />;

  const statusLabel = subscription.is_trial ? 'Активен' : 'Активна';
  const planLabel = subscription.tariff_name || `#${subscription.id}`;
  const hasLte = (subscription.whitelist_traffic_limit_gb ?? 0) > 0;
  const totalDays =
    (Date.parse(subscription.end_date) - Date.parse(subscription.start_date)) / 86_400_000;
  const progressPercent =
    Number.isFinite(totalDays) && totalDays > 0
      ? Math.min(
          100,
          Math.max(0, ((totalDays - Math.max(0, subscription.days_left)) / totalDays) * 100),
        )
      : 0;

  return (
    <section className="glass-surface motion-card luna-subscription-bg relative min-h-[220px] overflow-hidden rounded-[32px] p-[22px] lg:min-h-[clamp(250px,16.5vw,330px)] lg:justify-center lg:gap-[clamp(16px,1.2vw,24px)] lg:p-[clamp(24px,1.6vw,32px)]">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark-950/80 via-dark-950/20 to-transparent"
        aria-hidden="true"
      />
      <div
        className="luna-subscription-orb pointer-events-none absolute -right-4 top-20 h-40 w-40 opacity-70 lg:hidden"
        aria-hidden="true"
      />
      <h2 className="sr-only">{subscription.tariff_name || `Subscription #${subscription.id}`}</h2>
      <div className="relative flex items-start justify-between gap-4">
        <p className="min-w-0 text-xs font-normal tracking-wide text-dark-400 lg:text-[clamp(12px,0.8vw,16px)]">
          {subscription.is_trial ? trialLabel : paidLabel}
        </p>

        <button
          type="button"
          onClick={onManageSubscription}
          disabled={!onManageSubscription}
          className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-bold text-accent-300 transition-colors hover:text-accent-200 disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-0 lg:px-0 lg:text-[clamp(12px,0.8vw,16px)]"
        >
          {manageLabel}
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="relative z-10 flex gap-2 lg:hidden">
        <span className="rounded-full bg-accent-400 px-2.5 py-[7px] text-[11px] font-bold text-on-accent">
          {statusLabel}
        </span>
        <span className="glass-control rounded-full px-2.5 py-[7px] text-[11px] font-bold text-dark-400">
          {planLabel}
        </span>
        {hasLte && (
          <span className="glass-control rounded-full px-2.5 py-[7px] text-[11px] font-bold text-dark-400">
            🌐 LTE
          </span>
        )}
      </div>

      <p className="relative z-10 hidden text-[13px] font-bold text-accent-300 lg:block lg:text-[clamp(13px,0.9vw,18px)]">
        {statusLabel}
      </p>

      <div className="relative z-10 flex items-baseline gap-2">
        <span className="font-display text-[64px] font-normal leading-none tracking-[-3px] text-dark-50 lg:text-[clamp(64px,4.2vw,84px)] lg:tracking-[clamp(-2px,-0.1vw,-1.5px)]">
          {subscription.days_left}
        </span>
      </div>

      <p className="relative z-10 text-sm text-dark-400 lg:text-[clamp(14px,0.9vw,18px)]">
        {daysLabel} &nbsp;·&nbsp; {untilLabel}: {formatDate(subscription.end_date)}
      </p>

      <div className="relative z-10 hidden h-2 w-full overflow-hidden rounded-full bg-dark-800/70 lg:block lg:h-[clamp(8px,0.5vw,10px)]">
        <div
          data-testid="subscription-progress"
          className="h-full rounded-full bg-accent-400 transition-[width] duration-500"
          aria-hidden="true"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}
