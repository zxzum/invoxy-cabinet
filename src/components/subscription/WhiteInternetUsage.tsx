import { useTranslation } from 'react-i18next';

export function WhiteInternetUsage({
  subscription,
}: {
  subscription: { whitelist_traffic_limit_gb?: number; whitelist_traffic_used_gb?: number };
}) {
  const { t } = useTranslation();
  const limit = subscription.whitelist_traffic_limit_gb ?? 0;
  if (limit <= 0) return null;
  const used = Math.max(0, subscription.whitelist_traffic_used_gb ?? 0);
  const percent = Math.min(100, (used / limit) * 100);
  const label = t('subscription.whiteInternet', 'Белый интернет');
  return (
    <div className="my-3 rounded-xl border border-accent-400/40 bg-accent-400/10 p-3">
      <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm font-semibold text-accent-400">
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
        className="h-2 overflow-hidden rounded-full bg-accent-400/20"
      >
        <div className="h-full rounded-full bg-accent-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
