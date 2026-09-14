import type { ReactNode } from 'react';
import TrafficProgressBar from '@/components/dashboard/TrafficProgressBar';
import { GlobeIcon, TrafficIcon } from '@/components/icons';
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
}

function TrafficCard({
  icon,
  label,
  traffic,
  formatUsage,
  emptyMessage,
}: {
  icon: ReactNode;
  label: string;
  traffic: LunaTrafficSnapshot | null;
  formatUsage: (traffic: LunaTrafficSnapshot) => string;
  emptyMessage: string;
}) {
  return (
    <article className="glass-surface motion-card min-w-0 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-dark-200">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
          {icon}
        </span>
        <h3>{label}</h3>
      </div>
      {traffic ? (
        <>
          <p className="mt-5 text-base font-bold text-dark-50">{formatUsage(traffic)}</p>
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
  lteLabel = 'LTE traffic',
  loadingMessage = 'Loading traffic',
  regularEmptyMessage = 'Main traffic unavailable',
  lteEmptyMessage = 'LTE traffic unavailable',
}: LunaTrafficCardsProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;

  const usage =
    formatUsage ??
    ((traffic: LunaTrafficSnapshot) =>
      `${String(traffic.usedGb)} / ${String(traffic.limitGb)} ${trafficUnitLabel}`);

  return (
    <section aria-label="Traffic" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TrafficCard
        icon={<TrafficIcon className="h-4 w-4" />}
        label={regularLabel}
        traffic={regularTraffic}
        formatUsage={usage}
        emptyMessage={regularEmptyMessage}
      />
      <TrafficCard
        icon={<GlobeIcon className="h-4 w-4" />}
        label={lteLabel}
        traffic={lteTraffic}
        formatUsage={usage}
        emptyMessage={lteEmptyMessage}
      />
    </section>
  );
}
