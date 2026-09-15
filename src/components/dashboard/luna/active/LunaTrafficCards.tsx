import TrafficProgressBar from '@/components/dashboard/TrafficProgressBar';
import { LunaEmptyState, LunaLoadingState } from './LunaSurfaceState';
import type { LunaTrafficSnapshot } from './types';

export interface LunaTrafficCardsProps {
  regularTraffic: LunaTrafficSnapshot | null;
  lteTraffic: LunaTrafficSnapshot | null;
  isLoading?: boolean;
  formatUsage?: (traffic: LunaTrafficSnapshot) => string;
  trafficUnitLabel?: string;
  regularLabel?: string;
  lteLabel?: string;
  loadingMessage?: string;
  regularEmptyMessage?: string;
  lteEmptyMessage?: string;
  onRefreshTraffic?: () => void;
  isRefreshing?: boolean;
  trafficRefreshCooldown?: number;
  refreshLabel?: string;
  refreshingLabel?: string;
}

function TrafficCard({
  label,
  traffic,
  formatUsage,
  emptyMessage,
}: {
  label: string;
  traffic: LunaTrafficSnapshot | null;
  formatUsage: (traffic: LunaTrafficSnapshot) => string;
  emptyMessage: string;
}) {
  return (
    <article className="glass-surface motion-card min-w-0 rounded-2xl p-4 lg:h-[clamp(128px,8.5vw,166px)] lg:rounded-[clamp(20px,1vw,24px)] lg:p-[clamp(20px,1.4vw,28px)]">
      <h3 className="truncate text-[14px] leading-5 text-dark-400 lg:text-[clamp(14px,0.9vw,18px)]">
        {label}
      </h3>
      {traffic ? (
        <>
          <div className="mt-3 flex w-full items-center justify-between lg:mt-[clamp(16px,1.1vw,22px)]">
            <p className="whitespace-nowrap text-[16px] font-bold leading-6 text-dark-50 lg:text-[clamp(17px,1.1vw,22px)]">
              {formatUsage(traffic)}
            </p>
            <span className="text-[15px] font-bold leading-6 text-accent-300 lg:text-[clamp(16px,1vw,20px)]">
              {traffic.isUnlimited ? '∞' : `${Math.round(traffic.percent)}%`}
            </span>
          </div>
          <div className="mt-3">
            <TrafficProgressBar
              usedGb={traffic.usedGb}
              limitGb={traffic.limitGb}
              percent={traffic.percent}
              isUnlimited={traffic.isUnlimited}
              compact
            />
          </div>
        </>
      ) : (
        <LunaEmptyState message={emptyMessage} className="mt-4 p-4" />
      )}
    </article>
  );
}

export default function LunaTrafficCards({
  regularTraffic,
  lteTraffic,
  isLoading = false,
  formatUsage,
  trafficUnitLabel = 'GB',
  regularLabel = 'Main traffic',
  lteLabel = 'LTE-сервера',
  loadingMessage = 'Loading traffic',
  regularEmptyMessage = 'Main traffic unavailable',
  lteEmptyMessage = 'LTE traffic unavailable',
  onRefreshTraffic,
  isRefreshing = false,
  trafficRefreshCooldown = 0,
  refreshLabel = 'Refresh traffic',
  refreshingLabel = 'Refreshing traffic',
}: LunaTrafficCardsProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;

  const usage =
    formatUsage ??
    ((traffic: LunaTrafficSnapshot) =>
      `${String(traffic.usedGb)} / ${String(traffic.limitGb)} ${trafficUnitLabel}`);

  const refreshDisabled = !onRefreshTraffic || isRefreshing || trafficRefreshCooldown > 0;
  const refreshButtonLabel = isRefreshing
    ? refreshingLabel
    : trafficRefreshCooldown > 0
      ? `${refreshLabel} (${trafficRefreshCooldown}s)`
      : refreshLabel;

  return (
    <section aria-label="Traffic">
      {onRefreshTraffic && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onRefreshTraffic}
            disabled={refreshDisabled}
            aria-label={refreshButtonLabel}
            className="min-h-9 rounded-full border border-dark-700/70 bg-dark-800/50 px-3 text-xs font-semibold text-dark-300 transition-colors hover:border-accent-400/30 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshButtonLabel}
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5 lg:gap-[clamp(18px,1.4vw,28px)]">
        <TrafficCard
          label={regularLabel}
          traffic={regularTraffic}
          formatUsage={usage}
          emptyMessage={regularEmptyMessage}
        />
        <TrafficCard
          label={lteLabel}
          traffic={lteTraffic}
          formatUsage={usage}
          emptyMessage={lteEmptyMessage}
        />
      </div>
    </section>
  );
}
