import { CalendarIcon, ChevronRightIcon, SubscriptionIcon } from '@/components/icons';
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
}: LunaSubscriptionHeroProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;
  if (!subscription) return <LunaEmptyState message={emptyMessage} />;

  return (
    <section className="glass-surface-accent relative overflow-hidden rounded-[30px] p-5 sm:p-7">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-300">
            <SubscriptionIcon className="h-4 w-4" />
            <span>{subscription.is_trial ? 'Trial subscription' : 'Your subscription'}</span>
          </div>
          <h2 className="mt-3 truncate text-2xl font-semibold tracking-tight text-dark-50 sm:text-3xl">
            {subscription.tariff_name || `Subscription #${subscription.id}`}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-dark-300">
            <span className="rounded-full bg-accent-400/15 px-2.5 py-1 font-semibold text-accent-300">
              {subscription.status}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              {untilLabel}: {formatDate(subscription.end_date)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onManageSubscription}
          disabled={!onManageSubscription}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-accent-400/25 bg-accent-400/10 px-3 text-xs font-semibold text-accent-300 transition-colors hover:border-accent-400/45 hover:bg-accent-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {manageLabel}
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mt-7 flex items-end gap-3">
        <span className="font-display text-6xl font-extrabold leading-none tracking-tight text-dark-50">
          {subscription.days_left}
        </span>
        <span className="pb-1 text-sm text-dark-300">{daysLabel}</span>
      </div>
    </section>
  );
}
