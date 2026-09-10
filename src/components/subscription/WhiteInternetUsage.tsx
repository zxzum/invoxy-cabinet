import { useTranslation } from 'react-i18next';
import TrafficProgressBar from '../dashboard/TrafficProgressBar';

export function WhiteInternetUsage({
  subscription,
  compact = false,
}: {
  subscription: { whitelist_traffic_limit_gb?: number; whitelist_traffic_used_gb?: number };
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const limit = subscription.whitelist_traffic_limit_gb ?? 0;
  if (limit <= 0) return null;
  const used = Math.max(0, subscription.whitelist_traffic_used_gb ?? 0);
  const percent = Math.min(100, (used / limit) * 100);
  const label = t('subscription.whiteInternetServers', 'LTE сервера');
  if (compact) {
    return (
      <div className="border-t border-accent-400/20 pt-3">
        <TrafficProgressBar
          usedGb={used}
          limitGb={limit}
          percent={percent}
          isUnlimited={false}
          compact
          label={label}
        />
      </div>
    );
  }
  return (
    <div
      className={
        compact
          ? 'border-t border-accent-400/20 pt-3'
          : 'my-3 rounded-xl border border-accent-400/40 bg-accent-400/10 p-3'
      }
    >
      <div
        className={`mb-2 flex flex-wrap justify-between gap-2 font-semibold text-accent-400 ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <span>{label}</span>
        <span>
          {used.toFixed(1)} / {limit} {t('common.units.gb', 'ГБ')}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className={`${compact ? 'h-1.5' : 'h-2'} overflow-hidden rounded-full bg-accent-400/20`}
      >
        <div className="h-full rounded-full bg-accent-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
