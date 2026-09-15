import type { Subscription } from '@/invoxystart/api';

interface TrafficItem {
  label: string;
  amount: string;
  percent: number;
}

function TrafficCard({ item }: { item: TrafficItem }) {
  return (
    <div className="glass-panel motion-card flex min-w-0 w-full flex-1 flex-col gap-3 rounded-2xl p-4 lg:h-[clamp(128px,8.5vw,166px)] lg:gap-[clamp(16px,1.1vw,22px)] lg:rounded-[clamp(20px,1vw,24px)] lg:p-[clamp(20px,1.4vw,28px)]">
      <p className="truncate text-[14px] leading-5 text-muted lg:text-[clamp(14px,0.9vw,18px)]">
        {item.label}
      </p>
      <div className="flex w-full items-center justify-between">
        <span className="whitespace-nowrap text-[16px] font-bold leading-6 text-ink lg:text-[clamp(17px,1.1vw,22px)]">
          {item.amount}
        </span>
        <span className="text-[15px] font-bold leading-6 text-mint lg:text-[clamp(16px,1vw,20px)]">
          {item.percent}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2/60 lg:h-[clamp(8px,0.5vw,10px)]">
        <div className="h-full rounded-full bg-mint" style={{ width: `${item.percent}%` }} />
      </div>
    </div>
  );
}

function formatTraffic(used: number | null | undefined, limit: number | null | undefined) {
  const usedLabel = Number.isFinite(used) ? String(used) : '0';
  if (!limit) return `${usedLabel} / ∞ ГБ`;
  return `${usedLabel} / ${limit} ГБ`;
}

export function TrafficCards({
  subscription,
}: {
  subscription?: Pick<
    Subscription,
    | 'traffic_limit_gb'
    | 'traffic_used_gb'
    | 'traffic_used_percent'
    | 'whitelist_traffic_limit_gb'
    | 'whitelist_traffic_used_gb'
    | 'whitelist_traffic_used_percent'
  > | null;
}) {
  const items: TrafficItem[] = [
    {
      label: 'Основной трафик',
      amount: formatTraffic(subscription?.traffic_used_gb, subscription?.traffic_limit_gb),
      percent: Math.min(
        100,
        Math.max(
          0,
          subscription?.traffic_used_percent ??
            (subscription?.traffic_limit_gb
              ? ((subscription.traffic_used_gb ?? 0) / subscription.traffic_limit_gb) * 100
              : 0),
        ),
      ),
    },
    {
      label: 'LTE-сервера',
      amount: subscription?.whitelist_traffic_limit_gb
        ? formatTraffic(
            subscription.whitelist_traffic_used_gb,
            subscription.whitelist_traffic_limit_gb,
          )
        : '—',
      percent: Math.min(
        100,
        Math.max(
          0,
          subscription?.whitelist_traffic_used_percent ??
            (subscription?.whitelist_traffic_limit_gb
              ? ((subscription.whitelist_traffic_used_gb ?? 0) /
                  subscription.whitelist_traffic_limit_gb) *
                100
              : 0),
        ),
      ),
    },
  ];

  return (
    <div className="grid w-full grid-cols-2 gap-2.5 lg:gap-[clamp(18px,1.4vw,28px)]">
      {items.map((item) => (
        <TrafficCard key={item.label} item={item} />
      ))}
    </div>
  );
}
